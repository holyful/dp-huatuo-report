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


var appHandler = function(req, res, next){
	var apiOption = {
		uri:"AppSpeedConfigList",
		qs: {
			appId: req.params.id,
			appkey: APPKEY
		}
	}

	var gapTimestamp = 3600000; //mil seconds
	var siteId = req.params.siteId || req.params.siteId * 1;
	var subId = req.params.subId || req.params.subId * 1;
	var pageId = req.params.pageId || req.params.pageId * 1;
	var pointId = req.params.pointId || req.params.pointId * 1;
	var memcacheKey = [apiOption.uri,apiOption.qs.appId,Math.floor(Date.now()/gapTimestamp)].join('@');
	var handler = function(data,siteId,subId,pageId,pointId){
		var result = {
			data : []
		};
		if(!data){
			return;
		}

		data.forEach(function(siteData){
			if(siteId){
				if(siteData[0].indexOf(siteId + '-') >= 0){
					if(subId){
						if(siteData[0].indexOf(siteId + '-'+ subId + '-') >= 0){
							if(pageId){
								if(siteData[0].indexOf(siteId + '-'+ subId + '-' + pageId + '-') >= 0){
									if(pointId){
										if(siteData[0] === siteId + '-'+ subId + '-' + pageId + '-' + pointId){
											result.data.push(siteData);
										}
										return;
									}
									result.data.push(siteData);
								}
								return;
							}
							result.data.push(siteData);
						}
						return;
					}
					result.data.push(siteData);
				}
				return;
			}
			result.data.push(siteData);
		})

		return JSON.stringify(result);

	};
	memcached.get(memcacheKey, function (err, data) {
		res.setHeader("Content-Type","application/json");
		if(!data){
			res.setHeader("Cache","MISS");
			request(_.extend(urlOptions,apiOption),function(error, response, body){
				memcached.set(memcacheKey, body, gapTimestamp/1000, function(){})

					res.send(handler(Util.getResult(body).data, siteId, subId, pageId, pointId));

				});
			return;
		}
		res.setHeader("Cache","HIT");
		res.send(handler(Util.getResult(data).data, siteId, subId, pageId, pointId));
	});

}

//http://xili.huatuo.qq.com/Openapi/AppSpeedConfigList?appId=20001&appkey=123456789
router.get('/app/:id', function(req, res, next) {
	appHandler(req, res, next)
});




module.exports = router;
