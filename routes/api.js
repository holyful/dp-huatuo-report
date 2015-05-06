var express = require('express');
var router = express.Router();
var request = require('request');
var querystring = require('querystring');
var _ = require('underscore');
var APPKEY = "9WQx7JInsjShOvRGNLb61w=="
var MOCK_APP_PATH = "../mock/app.json";
var urlOptions = {
	useQuerystring : true,
	baseUrl: "http://huatuo.qq.com/Openapi/"
}
var Memcached = require('memcached');
var memcached = new Memcached('192.168.7.94:11211');
var Util = require('../lib/util');
var DEBUG = false;
var MOCK = false;

var appHandler = function(req, res, next){
	var DEBUG = !!(req.query.debug * 1) || false;
	var MOCK = !!(req.query.mock * 1) || false;
	var apiOption = {
		uri:"AppSpeedConfigList",
		qs: {
			appId: req.params.id,
			appkey: APPKEY
		}
	}

	var gapTimestamp = 3600000; //mil seconds
	var siteId = req.query.siteId || req.query.siteId * 1;
	var subId = req.query.subId || req.query.subId * 1;
	var pageId = req.query.pageId || req.query.pageId * 1;
	var pointId = req.query.pointId || req.query.pointId * 1;
	var siteName = req.query.siteName;
	var pageName = req.query.pageName;
	var eventName = req.query.eventName;
	var allTag = siteId || subId || pageId || pointId || siteName || pageName || eventName;
	var memcacheKey = [apiOption.uri,apiOption.qs.appId,Math.floor(Date.now()/gapTimestamp)].join('@');
	var handler = function(data){
		var result = {
			data : []
		};
		if(!data.data){
			return {
				'error' : data.msg
			};
		}


		result.data = data.data.filter(function(siteData){
			if(siteId){
				if(siteData[0].indexOf(siteId + '-') >= 0){
					return true;
				}else{
					return false;
				}
			}else{
				return true;
			}
		}).filter(function(siteData){
			if(siteId && subId){
				if(siteData[0].indexOf(siteId + '-'+ subId + '-') >= 0){
					return true;	
				}else{
					return false;
				}
			}else{
				return true;
			}

		}).filter(function(siteData){
			if(siteId && subId && pageId){
				if(siteData[0].indexOf(siteId + '-'+ subId + '-' + pageId + '-') >= 0){
					return true;
				}else{
					return false;
				}
			}else{
				return true;
			}
		}).filter(function(siteData){
			if(pointId){
				if(siteData[0].lastIndexOf( '-' + pointId) === (siteData[0].length - ('-' + pointId).length)){
					return true;
				}else{
					return false;
				}
			}else{
				return true;

			}
		}).filter(function(siteData){
			if(siteName){
				if(siteData[1].indexOf(siteName) >= 0) {
					return true;
				}else{
					return false;
				}
			}else{
				return true;
			}
		}).filter(function(siteData){
			if(pageName){
				if(siteData[2].indexOf(pageName) >= 0) {
					return true;
				}else{
					return false;
				}
			}else{
				return true;
			}
		}).filter(function(siteData){
			if(eventName){
				if(siteData[3] === eventName) {
					return true;
				}else{
					return false;
				}
			}else{
				return true;
			}
		});

		return JSON.stringify(result);

	};


	memcached.get(memcacheKey, function (err, data) {
		res.setHeader("Content-Type","application/json");
		if(!data || DEBUG){
			res.setHeader("Cache","MISS");
			if(!MOCK){
				request(_.extend(urlOptions,apiOption),function(error, response, body){
					if(!DEBUG){
						memcached.set(memcacheKey, body, gapTimestamp/1000, function(){})
					}
					res.send(handler(Util.getResult(body)));
				});
				
			}else{
				res.send(handler(require(MOCK_APP_PATH)));
			}
			return;
			
		}
		res.setHeader("Cache","HIT");
		res.send(handler(Util.getResult(data)));
	});

}

var speedDateHandler = function(req, res, next){
	var DEBUG = !!(req.query.debug * 1) || false;
	var MOCK = !!(req.query.mock * 1) || false;
	var apiOption = {
		uri:"GetSpeedData",
		qs: {
			appId: req.params.appId,
			format: 'date',
			flag1: req.params.siteId,
			flag2: req.params.subSiteId,
			flag3: req.params.pageId,
			pointId: req.params.pointId,
			appkey: APPKEY
		}
	}

	var gapTimestamp = 1000; 
	var memcacheKey = [apiOption.uri,querystring.stringify(apiOption.qs),Math.floor(Date.now()/gapTimestamp)].join('@');
	var handler = function(data){
		var result = {
			data : []
		};
		if(!data.data){
			return {
				'error' : data.msg
			};
		}

		result.data = data.data;

		return JSON.stringify(result);
	}
	memcached.get(memcacheKey, function (err, data) {
		res.setHeader("Content-Type","application/json");
		if(!data || DEBUG){
			res.setHeader("Cache","MISS");
			if(!MOCK){
				request(_.extend(urlOptions,apiOption),function(error, response, body){
					if(!DEBUG){
						memcached.set(memcacheKey, body, gapTimestamp/1000, function(){})
					}
					res.send(handler(Util.getResult(body)));
				});
				
			}else{
				res.send(handler(require(MOCK_APP_PATH)));
			}
			return;
			
		}
		res.setHeader("Cache","HIT");
		res.send(handler(Util.getResult(data)));
	});

}
//http://xili.huatuo.qq.com/Openapi/AppSpeedConfigList?appId=20001&appkey=123456789
router.get('/info/app/:id', function(req, res, next) {
	appHandler(req, res, next)
});
http://xili.huatuo.qq.com/Openapi/GetSpeedData?appkey=1234567890&format=datesection&flag1=1470&flag2=120&appId=20001&flag3=10&pointId=1&startDate=2015-04-16
router.get('/speed/date/app/:appId/site/:siteId/sub/:subSiteId/page/:pageId/point/:pointId', function(req, res, next) {
	speedDateHandler(req, res, next)
});





module.exports = router;
