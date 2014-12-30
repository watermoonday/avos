require("cloud/app.js");
// Use AV.Cloud.define to define as many cloud functions as you want.
// For example:
AV.Cloud.define("hello", function(request, response) {
  response.success("Hello world!");
});

var AndroidApk = AV.Object.extend('Android_Apk');
(function () {
	console.log("update_apk");
	var version = "1.7";
	var apkName = "TvtApplication";
	var apkSize = 13000807;
	var apkUrl = "http://apkpilive.avosapps.com/Pilive_1412251741.apk";
	var mustUpdate = false;

	var apkInfo = new AndroidApk();

	var query = new AV.Query(AndroidApk);
	query.equalTo("name", apkName);
	query.first({
		success: function(info) {
			// Successfully retrieved the object.
			if(info == null)
			{
				info = apkInfo;
			}

			console.log("update_apk to version" + version);
			
			info.set('version', version);
			info.set('name', apkName);
			info.set('size', apkSize);
			info.set('url', apkUrl);
			info.set('mustUpdate', mustUpdate);
			info.save(null);
		},
		error: function(error) {
			console.log("query failed!");
			console.log(error);
		}
	});
})();
