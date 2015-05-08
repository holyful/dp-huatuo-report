var express = require('express');
var router = express.Router();
var request = require('request');
var querystring = require('querystring');
var _ = require('underscore');
var moment = require('moment');
var APPKEY = "9WQx7JInsjShOvRGNLb61w=="
var CONTENT_TYPE = "application/json";
var DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
var DATE_FORMAT = 'YYYY-MM-DD';
var CACHE_CONTROL = 'no-cache';
var COMPARE_SECTION_COUNT = 3;
var COMPARE_TIME_COUNT = 3;
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
		
	var apiOption = {
		uri:"AppSpeedConfigList",
		qs: {
			appId: req.params.id,
			appkey: APPKEY
		}
	}
	var name = apiOption.uri;
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

	Util.cacheRequest(name, memcached, memcacheKey, _.extend(urlOptions,apiOption), gapTimestamp, res, req, handler);
	/*memcached.get(memcacheKey, function (err, data) {
		res.setHeader("Content-Type",CONTENT_TYPE);
		res.setHeader("Cache-Control",CACHE_CONTROL);
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
				res.send(handler(require(MOCK_INFO_PATH)));
			}
			return;
			
		}
		res.setHeader("Cache","HIT");
		res.send(handler(Util.getResult(data)));
	});*/

}

var speedDateSectionHandler = function(req, res, next){
	var dateString = req.params.start;
	var days = req.query.days;
	
	var apiOption = {
		uri:"GetSpeedData",
		qs: {
			appId: req.params.appId,
			format: 'datesection',
			flag1: req.params.siteId,
			flag2: req.params.subSiteId,
			flag3: req.params.pageId,
			pointId: req.params.pointId,
			appkey: APPKEY,
			startDate: dateString
		}
	}
	var name = apiOption.qs.format + '@' +apiOption.uri;
	var gapTimestamp = 3600000; 
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

		data.data.forEach(function(dateData, index){
			var secData = [];
			for(var i = 0; i<= COMPARE_SECTION_COUNT-1; i++){
				var date = dateData['compareDate' + i];
				var access = dateData['accessTimes' + i];
				var delay = dateData['delays' + i];

				secData.push({'date':date,'access':access,'delay':delay})

			}
			if(index+1 > days){
				return;
			}

			result.data.push(secData);

		});


		return JSON.stringify(result);
	}
	Util.cacheRequest(name, memcached, memcacheKey, _.extend(urlOptions,apiOption), gapTimestamp, res, req, handler);

}

var speedDateHandler = function(req, res, next){

	var startDate0 = moment(req.params.date,DATE_FORMAT);
	var startDate1 = moment(req.params.date,DATE_FORMAT).subtract(1, 'days');
	var startDate2 = moment(req.params.date,DATE_FORMAT).subtract(2, 'days');
	var timeRange = (req.query.range && req.query.range.split('-')) || [];
	var fromRange = moment(req.params.date +' '+(timeRange && timeRange[0])|| '00:00:00' , DATETIME_FORMAT);
	var toRange = moment(req.params.date +' '+(timeRange && timeRange[1]) || '24:00:00' ,DATETIME_FORMAT);
	var apiOption = {
		uri:"GetSpeedData",
		qs: {
			appId: req.params.appId,
			format: 'date',
			flag1: req.params.siteId,
			flag2: req.params.subSiteId,
			flag3: req.params.pageId,
			pointId: req.params.pointId,
			appkey: APPKEY,
			compDatesStart0: startDate0.format(DATE_FORMAT),
			compDatesStart1: startDate1.format(DATE_FORMAT),
			compDatesStart2: startDate2.format(DATE_FORMAT),
		}
	};
	var name = apiOption.qs.format + '@' +apiOption.uri;
	var gapTimestamp = 300000; 
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

		data.data.forEach(function(dateData){
			var secTime = [];


			var timeObject = moment(dateData['compareDate0'], DATETIME_FORMAT);
			if(timeObject.valueOf() < fromRange.valueOf() || timeObject.valueOf() > toRange.valueOf()){
				return;
			}

			for(var i = 0; i<= COMPARE_TIME_COUNT-1; i++){
				var time = dateData['compareDate' + i];
				var access = dateData['accessTimes' + i];
				var delay = dateData['delays' + i];
				secTime.push({'time':time,'access':access,'delay':delay})
			}

			result.data.push(secTime);
		});

		return JSON.stringify(result);
	}
	Util.cacheRequest(name, memcached, memcacheKey, _.extend(urlOptions,apiOption), gapTimestamp, res, req, handler);

}

var speedDistributeHandler = function(req, res, next){

	var startDate = moment(req.params.date, DATE_FORMAT);
	var startDateSecond = moment(req.params.date, DATE_FORMAT).subtract(1, 'days');
	var min = req.params.min || req.params.min * 1;
	var max = req.params.max || req.params.max * 1;
	var apiOption = {
		uri:"GetSpeedData",
		qs: {
			appId: req.params.appId,
			format: 'distribute',
			flag1: req.params.siteId,
			flag2: req.params.subSiteId,
			flag3: req.params.pageId,
			pointId: req.params.pointId,
			appkey: APPKEY,
			minDelay: min,
			maxDelay: max,
			delayDateFirst: startDate.format(DATE_FORMAT),
			delayDateSecond: startDateSecond.format(DATE_FORMAT)
		}
	};

	var name = apiOption.qs.format + '@' +apiOption.uri;
	var gapTimestamp = 300000; 
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
	Util.cacheRequest(name, memcached, memcacheKey, _.extend(urlOptions,apiOption), gapTimestamp, res, req, handler);


}




//http://xili.huatuo.qq.com/Openapi/AppSpeedConfigList?appId=20001&appkey=123456789
router.get('/info/app/:id', function(req, res, next) {
	appHandler(req, res, next)
});
http://xili.huatuo.qq.com/Openapi/GetSpeedData?appkey=1234567890&format=datesection&flag1=1470&flag2=120&appId=20001&flag3=10&pointId=1&startDate=2015-04-16
router.get('/speed/date/app/:appId/site/:siteId/sub/:subSiteId/page/:pageId/point/:pointId/start/:start', function(req, res, next) {
	speedDateSectionHandler(req, res, next)
});

router.get('/speed/time/app/:appId/site/:siteId/sub/:subSiteId/page/:pageId/point/:pointId/date/:date', function(req, res, next) {
	speedDateHandler(req, res, next)
});

router.get('/speed/distribute/app/:appId/site/:siteId/sub/:subSiteId/page/:pageId/point/:pointId/date/:date/min/:min/max/:max', function(req, res, next) {
	speedDistributeHandler(req, res, next);
});





module.exports = router;
