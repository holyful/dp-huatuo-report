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
var Util = require('../lib/util');

//http://xili.huatuo.qq.com/Openapi/AppSpeedConfigList?appId=20001&appkey=123456789
router.get('/app/:id/site/:siteId/sub/:subSiteId/page/:pageId/point/:pointId', function(req, res, next) {

	var apiOption = {
		uri:"AppSpeedConfigList",
		qs: {
			appId: req.params.id,
			appkey: APPKEY
		}
	}

	var gapTimestamp = 1000;
	var memcacheKey = [apiOption.uri,apiOption.qs.appId,Math.floor(Date.now()/gapTimestamp)].join('@');
	var handler = function(data,siteId,subId,pageId,pointId){

	};
	memcached.get(memcacheKey, function (err, data) {
		res.setHeader("Content-Type","application/json");
		if(!data){
			res.setHeader("Cache","MISS");
			request(_.extend(urlOptions,apiOption),function(error, response, body){
				memcached.set(memcacheKey, body, gapTimestamp/1000, function(){})
					res.send(Util.getResult(body));
				});
			return;
		}
		res.setHeader("Cache","HIT");
		res.send(Util.getResult(data));
	});

});

module.exports = router;
