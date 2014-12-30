// 在 Cloud code 里初始化 Express 框架
var express = require('express');
var app = express();
var avosExpressCookieSession = require('avos-express-cookie-session');

// App 全局配置
app.set('views','cloud/views');   // 设置模板目录
app.set('view engine', 'ejs');    // 设置 template 引擎
app.setMaxListeners(0);
app.use(express.bodyParser());    // 读取请求 body 的中间件
var fs = require('fs');

//var avosExpressHttpsRedirect = require('avos-express-https-redirect');
//app.use(avosExpressHttpsRedirect());

//启用cookie
app.use(express.cookieParser('Your Cookie Secure'));
//使用avos-express-cookie-session记录登录信息到cookie。
app.use(avosExpressCookieSession({ cookie: { maxAge: 3600000 },fetchUser:true}));


// 使用 Express 路由 API 服务 /hello 的 HTTP GET 请求
app.get('/hello', function(req, res) {
  res.render('hello', { message: 'Congrats, you just set up your app!' });
});

app.post('/upload', function(req, res){
	var firmware = req.files.ipc_firmware;
	if(firmware){
		fs.readFile(firmware.path, function(err, data)
		{
			if(err)
			{
				return res.send("读取文件失败");
			}
			console.log(req.body);
			var base64Data = data.toString('base64');
			var theFile = new AV.File(firmware.name, {base64: base64Data});
			theFile.metaData('version', req.body.version);
			theFile.metaData('type', req.body.ipc_type);
			theFile.metaData('size', data.length);
			theFile.save().then(function(theFile)
			{
				theFile.save();
				res.send("上传成功！");
			});
		});
	}else
	{
		res.send("请选择一个文件。");
	}
});

var File = AV.Object.extend('_File');
var Device = AV.Object.extend('Device');
app.get('/firmware_info', function(req, res){
	var data = {'sn': '0018ae154785', 'type':req.query.type};
	//get_device_about(data, res);
	get_device_firmware_info(data, res);
});

function get_device_about(data,res)
{
	var res_json={"code":0,"desc":"","data":{"software":{"version":"", "url":"", "mustUpdate":false}, "owner": ""}};
	var query = new AV.Query(File);
	query.find({
		success: function(files)
		{
			for(var i = 0; i < files.length; i++)
			{
				var metaData = files[i].get('metaData');
				if(metaData['type'] == data.type)
				{
					res_json.data.software.url = files[i].get('url');
					res_json.data.software.version = metaData['version'];
					res_json.data.software.mustUpdate = true;
					var queryDevice = new AV.Query(Device);
					queryDevice.equalTo('sn', data.device_sn);
					queryDevice.first({
						success: function(device) {
							var ownerId = (device.get("owner") != undefined) ? device.get("owner").id : "";
							if(ownerId == "")
							{
								res_json.data.owner = "";
								res.json(res_json);
							}
							else
							{
								var queryUser = new AV.Query(AV.User);
								queryUser.get(ownerId, {
									success: function(user) {
										res_json.data.owner = user.getUsername();
										res.json(res_json);
									},

									error: function(object, error) {
										res_json.code = 404;
										res.json(res_json);
									}
								});
							}
						},

						error: function(error) {
							res_json.code = 404;
							res.json(res_json);
						}
					});
					break;
				}
			}

			if(i == files.length)
			{
				res_json.code = 404;
				res.json(res_json);
			}
		},
		error: function(error)
		{
			res_json.code = 404;
			res.json(res_json);
		}
	});
}

function get_device_firmware_info(data, res)
{
	var res_json={"code":0,"desc":"","data":{"packs":[]}};
	var query = new AV.Query(File);
	query.find({
		success: function(files)
		{
			for(var i = 0; i < files.length; i++)
			{
				res_json.data.packs[i] = {};
				var metaData = files[i].get('metaData');
				res_json.data.packs[i].pack_url = files[i].get('url');
				res_json.data.packs[i].pack_version = metaData['version'];
				var size = metaData['size'];
				console.log(size);
				res_json.data.packs[i].pack_size = metaData['size'];
				res_json.data.packs[i].pack_type = metaData['type'];
			}
			res.json(res_json);
		},
		error: function(error)
		{
			res.code = 404;
			res.json(res_json);
		}
	});
}

var AndroidApk = AV.Object.extend('Android_Apk');

app.post('/action', function(req, res){
	var json=req.body;
	console.log(json);
	if(json != null && json.cmd!=null)
	{
		console.log(json.cmd);
		switch(json.cmd)
		{
			case "get_android_apk":
			{
				get_apk_info(json.data,res);
				break;
			}
			default:
			{
				res.send('{"code"  :102, "desc" : "not support"}');
				break;
			}
		}
	}
	else
	{
		console.log("Data fomat error.");
	}
});

function get_apk_info(data,res)
{
	var res_json={"code":0,"data":{"url":"", "version":""}};
	
	var query = new AV.Query(AndroidApk);
	query.equalTo("name",data.name);
	query.first({
		success: function(object)
		{	
			if(object==null)
			{
				res_json.code=404;
			}
			else
			{
				res_json.code=0;
				res_json.data.url=object.get("url");
				res_json.data.version=object.get("version");
				res_json.data.must_update = object.get("mustUpdate");
			}
			res.json(res_json);
		},
		error:function(err)
		{
			res_json.code=100;
			res_json.desc="Network error.";
			res.json(res_json);
		}	
	});
}

// 最后，必须有这行代码来使 express 响应 HTTP 请求
app.listen();
