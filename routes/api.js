var express = require('express');
var router = express.Router();
var request = require('request');
var querystring = require('querystring');
var _ = require('underscore');
var APPKEY = "9WQx7JInsjShOvRGNLb61w=="
var urlOptions = {
	useQuerystring : true,
	baseUrl: "http://huatuo.qq.com/Openapi/"
}
var Memcached = require('memcached');
var memcached = new Memcached('192.168.7.94:11211');

/* GET home page. */
router.get('/app/:id', function(req, res, next) {

	var apiOption = {
		uri:"AppSpeedConfigList",
		qs: {
			appId: 20002,
			appkey: APPKEY
		}
	}

	var expireTime = 3600;


	memcached.get([apiOption.uri,apiOption.qs.appId].join('@'), function (err, data) {
		res.setHeader("Content-Type","application/json");
		console.log(data)
		console.log([apiOption.uri,apiOption.qs.appId].join('@'))
		if(!data){
			
			request(_.extend(urlOptions,apiOption),function(error, response, body){
				memcached.set([apiOption.uri,apiOption.qs.appId].join('@'),body, expireTime, function(){
				})
				

				var result = {};
				try{
					result = JSON.parse(body);
				}catch(e){
					result.error = e;
				}

				result.from = "server";

				res.send(JSON.stringify(result));
			});
			return;
		}

		var result = {};

		try{
			result = JSON.parse(data);
		}catch(e){
			result.error = e;
		}

		result.from = "cache";
		
		res.send(JSON.stringify(result));

	});

	
});

module.exports = router;
