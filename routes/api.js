var express = require('express');
var router = express.Router();
var Q = require('q');
var request = require('request');
var querystring = require('querystring');
var _ = require('underscore');
var moment = require('moment');
var APPKEY = "9WQx7JInsjShOvRGNLb61w=="
var CONTENT_TYPE = "application/json";
var DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
var TIME_FORMAT = 'HH:mm:ss';
var DATE_FORMAT = 'YYYY-MM-DD';
var CACHE_CONTROL = 'no-cache';
var COMPARE_SECTION_COUNT = 3;
var COMPARE_TIME_COUNT = 3;
var DIS_TIME_COUNT = 2;
var urlOptions = {
	useQuerystring : true,
	baseUrl: "http://huatuo.qq.com/Openapi/"
}
var Q = require('q'); 
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

	var pg = Util.cacheRequest(name, memcached, memcacheKey, _.extend(urlOptions,apiOption), gapTimestamp, res, req); 
	Q.when(pg).then(function(result){
		var res = result[0];
		var data = result[1];
		res.send(handler(data));
	});

}

var speedDateSectionHandler = function(req, res, next){
	var startDateArr = req.params.date.split(',');
	var dateObj = [];


	if(startDateArr.length > 2){
		startDateArr.forEach(function(sA, sI){
			dateObj.push(moment(sA, DATE_FORMAT));
		});
	}if(startDateArr.length > 1 && startDateArr.length <= 2){
		dateObj.push(moment(startDateArr[0], DATE_FORMAT));
		dateObj.push(moment(startDateArr[1], DATE_FORMAT));
		dateObj.push(moment(startDateArr[1], DATE_FORMAT).subtract(7, 'days')); //默认按周来
	}else{
		dateObj.push(moment(startDateArr[0], DATE_FORMAT));
		dateObj.push(moment(startDateArr[0], DATE_FORMAT).subtract(7, 'days')); //默认按周来
		dateObj.push(moment(startDateArr[0], DATE_FORMAT).subtract(14, 'days'));
	}
	var days = 7;
	
	var handler = function(dataArr){
		var result = {
			data : []
		};

		for(var i = 0 ; i < dataArr.length; i++){

			if(!dataArr[i].data){
				return {
					'error' : data.msg
				}
			}
		}


		for(var d = 0 ; d < 7; d++){
			var secData = {};
			for(var t = 0 ; t < dateObj.length; t++){
				
				if(dataArr[t] && dataArr[t].data && dataArr[t].data.length && dataArr[t].data[d]){
					var date = dataArr[t].data[d]['compareDate0'];
					var access = dataArr[t].data[d]['accessTimes0'];
					var delay = dataArr[t].data[d]['delays0'];
					secData.visit = secData.visit || {};
					secData.visit[date] = {'access':access,'delay':delay };
					continue;
				}else{
					if(t >= 1){
						var date = dataArr[0].data[d]['compareDate' + t];
						var access = dataArr[0].data[d]['accessTimes' + t];
						var delay = dataArr[0].data[d]['delays' + t];
						secData.visit = secData.visit || {};
						secData.visit[date] = {'access':access,'delay':delay };
					}
				}
			}

			result.data.push(secData)
		}



		





/*

		

		data.data.forEach(function(dateData, index){
			var secData = {};
			for(var i = 0; i<= dateObj.length - 1; i++){
				var date = dateData['compareDate' + i];
				var access = dateData['accessTimes' + i];
				var delay = dateData['delays' + i];
				secData.visit = secData.visit || {};
				secData.visit[date] = {'access':access,'delay':delay};

			}
			if(index+1 > days){
				return;
			}

			result.data.push(secData);

		});*/


		return JSON.stringify(result);
	}
	var pg = [];
	

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
			startDate: dateObj[0].format(DATE_FORMAT)
		}
	}
	var name = apiOption.qs.format + '@' +apiOption.uri;
	var gapTimestamp = 3600000; 
	var memcacheKey = [apiOption.uri,querystring.stringify(apiOption.qs),Math.floor(Date.now()/gapTimestamp)].join('@');

	dateObj.forEach(function(doj, ind){
		if(ind === 0){
			pg.push(Util.cacheRequest(name, memcached, memcacheKey, _.extend(urlOptions,apiOption), gapTimestamp, res, req)); 
		}else{
			if(dateObj[ind-1].diff(dateObj[ind], 'days') !== 7){ //如果请求间隔不是7天，再发一个请求
				apiOption.qs.startDate = dateObj[ind].format(DATE_FORMAT);	
				memcacheKey = [apiOption.uri,querystring.stringify(apiOption.qs),Math.floor(Date.now()/gapTimestamp)].join('@');
				pg.push(Util.cacheRequest(name, memcached, memcacheKey, _.extend(urlOptions,apiOption), gapTimestamp, res, req)); 
			}
		}
	});

	Q.allSettled(pg).then(function(results){
		var allData = [];
		//var res = {};
		results.forEach(function(result){
			var res = result.value[0];
			var data = result.value[1];
			allData.push(data);
		});

		res.send(handler(allData));
		/*var res = result[0];
		var data = result[1];
		res.send(handler(data));*/
		
	});

}

var speedDateHandler = function(req, res, next){

	var startDateArr = req.params.date.split(',');
	var dateObj = [];
	if(startDateArr.length && startDateArr.length > 1){

		dateObj.push(moment(startDateArr[0], DATE_FORMAT));
		dateObj.push(moment(startDateArr[1], DATE_FORMAT));
		dateObj.push(moment(startDateArr[2], DATE_FORMAT));
	}else{
		dateObj.push(moment(startDateArr[0], DATE_FORMAT));
		dateObj.push(moment(startDateArr[0], DATE_FORMAT).subtract(1, 'days'));
		dateObj.push(moment(startDateArr[0], DATE_FORMAT).subtract(2, 'days'));
	}

	var timeRange = (req.query.range && req.query.range.split('-')) || [];
	var fromRange = moment(dateObj[0].format(DATE_FORMAT) +' '+((timeRange && timeRange[0]) || '00:00:00') , DATETIME_FORMAT);
	var toRange = moment(dateObj[0].format(DATE_FORMAT) +' '+((timeRange && timeRange[1]) || '24:00:00' ),DATETIME_FORMAT);
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
			compDatesStart0: dateObj[0].format(DATE_FORMAT),
			compDatesStart1: dateObj[1].format(DATE_FORMAT),
			compDatesStart2: dateObj[2].format(DATE_FORMAT),
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
			var secTime = {};
			var timeObject = moment(dateData['compareDate0'], DATETIME_FORMAT);
			
			if(timeObject.valueOf() < fromRange.valueOf() || timeObject.valueOf() > toRange.valueOf()){
				return;
			}

			for(var i = 0; i<= COMPARE_TIME_COUNT-1; i++){
				var time = dateData['compareDate' + i];
				var access = dateData['accessTimes' + i];
				var delay = dateData['delays' + i];
				secTime.time = moment(time, DATETIME_FORMAT).format(TIME_FORMAT);
				secTime.visit = secTime.visit || {};
				secTime.visit[moment(time, DATETIME_FORMAT).format(DATE_FORMAT)] = {'access':access,'delay':delay}
			}

			result.data.push(secTime);
		});

		return JSON.stringify(result);
	}
	var pg = Util.cacheRequest(name, memcached, memcacheKey, _.extend(urlOptions,apiOption), gapTimestamp, res, req); 
	Q.when(pg).then(function(result){
		var res = result[0];
		var data = result[1];
		res.send(handler(data));
	});

}

var speedDistributeHandler = function(req, res, next){

	var startDateArr = req.params.date.split(',');
	var dateObj = [];
	if(startDateArr.length && startDateArr.length>1){
		dateObj.push(moment(startDateArr[0], DATE_FORMAT));
		dateObj.push(moment(startDateArr[1], DATE_FORMAT));
	}else{
		dateObj.push(moment(startDateArr[0], DATE_FORMAT));
		dateObj.push(moment(startDateArr[0], DATE_FORMAT).subtract(1, 'days'));
	}
	var min = req.query.min || req.query.min * 1;
	var max = req.query.max || req.query.max * 1;
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
			delayDateFirst: dateObj[0].format(DATE_FORMAT),
			delayDateSecond: dateObj[1].format(DATE_FORMAT)
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


		data.data.forEach(function(disData){

			var secTime = {};
			for(var i = 0; i<= DIS_TIME_COUNT -1 ; i++){
				var stall = disData['stall' + i];
				var access = disData['totalVisitTimes' + i];
				var delay = disData['visitTimes' + i];
				//secTime[dateObj[i].format(DATE_FORMAT)] = {'stall':stall,'access':access,'delay':delay}
				secTime.stall = stall;
				secTime.visit = secTime.visit || {};
				secTime.visit[dateObj[i].format(DATE_FORMAT)] = {'access':access,'delay':delay};
				//secTime.push({'date':dateObj[i].format(DATE_FORMAT),'stall':stall,'access':access,'delay':delay})
			}

			result.data.push(secTime);
		});

		return JSON.stringify(result);
	}
	var pg = Util.cacheRequest(name, memcached, memcacheKey, _.extend(urlOptions,apiOption), gapTimestamp, res, req); 
	Q.when(pg).then(function(result){
		var res = result[0];
		var data = result[1];
		res.send(handler(data));
	});

}




//http://xili.huatuo.qq.com/Openapi/AppSpeedConfigList?appId=20001&appkey=123456789
router.get('/info/app/:id', function(req, res, next) {
	appHandler(req, res, next)
});
http://xili.huatuo.qq.com/Openapi/GetSpeedData?appkey=1234567890&format=datesection&flag1=1470&flag2=120&appId=20001&flag3=10&pointId=1&startDate=2015-04-16
router.get('/speed/date/app/:appId/site/:siteId/sub/:subSiteId/page/:pageId/point/:pointId/start/:date', function(req, res, next) {
	speedDateSectionHandler(req, res, next)
});

router.get('/speed/time/app/:appId/site/:siteId/sub/:subSiteId/page/:pageId/point/:pointId/date/:date', function(req, res, next) {
	speedDateHandler(req, res, next)
});

router.get('/speed/distribute/app/:appId/site/:siteId/sub/:subSiteId/page/:pageId/point/:pointId/date/:date', function(req, res, next) {
	speedDistributeHandler(req, res, next);
});







module.exports = router;
