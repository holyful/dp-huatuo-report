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
			data : {}
		};
		if(!data.data){
			return {
				'error' : data.msg
			};
		}

		var tempData = [];


		tempData = data.data.filter(function(siteData){
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

		tempData.forEach(function(td){
			var secData = {};
			var keyArray = td[0].split('-');

			result.data[keyArray[0]] = result.data[keyArray[0]] || {} ;
			result.data[keyArray[0]].name = td[1];
			result.data[keyArray[0]].subs = result.data[keyArray[0]].subs || {}
			result.data[keyArray[0]].subs[keyArray[1]] = result.data[keyArray[0]].subs[keyArray[1]] || {};
			result.data[keyArray[0]].subs[keyArray[1]].pages = result.data[keyArray[0]].subs[keyArray[1]].pages || {};
			result.data[keyArray[0]].subs[keyArray[1]].pages[keyArray[2]] = result.data[keyArray[0]].subs[keyArray[1]].pages[keyArray[2]] || {};

			result.data[keyArray[0]].subs[keyArray[1]].pages[keyArray[2]].name = td[2];
			result.data[keyArray[0]].subs[keyArray[1]].pages[keyArray[2]].points = result.data[keyArray[0]].subs[keyArray[1]].pages[keyArray[2]].points || {};

			result.data[keyArray[0]].subs[keyArray[1]].pages[keyArray[2]].points[keyArray[3]] = result.data[keyArray[0]].subs[keyArray[1]].pages[keyArray[2]].points[keyArray[3]] || {};
			result.data[keyArray[0]].subs[keyArray[1]].pages[keyArray[2]].points[keyArray[3]] = td[3];

			if(result.data[keyArray[0]]){

			}

		})
		


		return result;



	};


	var pg = Util.cacheRequest(name, memcached, memcacheKey, _.extend(urlOptions,apiOption), gapTimestamp, res, req); 
	Q.when(pg).then(function(result){
		var res = result[0];
		var data = result[1];
		var rt = handler(data);
		if(!rt.data){
			res.status(500);
		}
		res.send(rt);
	});

}

var speedDateSectionHandler = function(req, res, next){
	var startDateArr = req.params.date.split(',');
	var dateObj = [];


	if(startDateArr.length > 2){
		startDateArr.forEach(function(sA, sI){
			dateObj.push(moment(sA, DATE_FORMAT));
		});
	}else if(startDateArr.length > 1 && startDateArr.length <= 2){
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
					'error' : dataArr[i].msg
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

		return JSON.stringify(result);
	}
	var pg = [];
	
	var gapTimestamp = 3600000; 
	
	dateObj.forEach(function(doj, ind){
		
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
				startDate: dateObj[ind].format(DATE_FORMAT)
			}
		}
		var name = apiOption.qs.format + '@' +apiOption.uri;
		var memcacheKey = [apiOption.uri,querystring.stringify(apiOption.qs),Math.floor(Date.now()/gapTimestamp)].join('@');
		if(ind === 0){
			pg.push(Util.cacheRequest(name, memcached, memcacheKey, _.clone(_.extend(urlOptions,apiOption)), gapTimestamp, res, req)); 
		}else{
			if(dateObj[ind-1].diff(dateObj[ind], 'days') !== 7){ //如果请求间隔不是7天，再发一个请求
				pg.push(Util.cacheRequest(name, memcached, memcacheKey, _.clone(_.extend(urlOptions, apiOption)), gapTimestamp, res, req)); 
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

	if(startDateArr.length > 2){
		//超过两个日期
		startDateArr.forEach(function(sA, sI){
			dateObj.push(moment(sA, DATE_FORMAT));
		});

		if(startDateArr.length % 3 > 0){
			for(var v = 1; v <= 3 - (startDateArr.length % 3) ; v ++){
				dateObj.push(moment(startDateArr[startDateArr.length-1], DATE_FORMAT).subtract(v, 'days'));
			}
		}
	}else if(startDateArr.length > 1 && startDateArr.length <= 2){

		dateObj.push(moment(startDateArr[0], DATE_FORMAT));
		dateObj.push(moment(startDateArr[1], DATE_FORMAT));
		dateObj.push(moment(startDateArr[1], DATE_FORMAT).subtract(1, 'days'));
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
	var handler = function(dataArr){
		var result = {
			data : []
		};
		for(var i = 0 ; i < dataArr.length; i++){

			if(!dataArr[i].data){
				return {
					'error' : dataArr[i].msg
				}
			}
		}

		dataArr.forEach(function(da,ind){
			var secData = [];

			if(da && da.data && da.data.length){

				da.data.forEach(function(dd, idd){

					if(!result.data[idd]){
						result.data[idd] = {};
						if(!result.data[idd].time){
							result.data[idd].time = moment(dd['compareDate0'],DATETIME_FORMAT).format(TIME_FORMAT);
						}
					}
					for(var t = 0 ; t < 3; t++){
						var time = dd['compareDate' + t];
						var access = dd['accessTimes' + t];
						var delay = dd['delays'+ t];
						result.data[idd].visit = result.data[idd].visit || {};
						result.data[idd].visit[dateObj[3 * ind + t].format(DATE_FORMAT)] = {'access':access,'delay':delay}
					}

				});

			}	
		
			
		});
		return result;
	}

	var pg = [];

	dateObj.forEach(function(doj, ind){

		if(ind % 3 > 0){
			return;
		}

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
				compDatesStart0: dateObj[ind].format(DATE_FORMAT),
				compDatesStart1: dateObj[ind+1].format(DATE_FORMAT),
				compDatesStart2: dateObj[ind+2].format(DATE_FORMAT),
			}
		};
		var name = apiOption.qs.format + '@' +apiOption.uri;
		var memcacheKey = [apiOption.uri,querystring.stringify(apiOption.qs),Math.floor(Date.now()/gapTimestamp)].join('@');
		pg.push(Util.cacheRequest(name, memcached, memcacheKey, _.clone(_.extend(urlOptions,apiOption)), gapTimestamp, res, req)); 

	});

	Q.allSettled(pg).then(function(results){
		var allData = [];
		//var res = {};
		results.forEach(function(result){

			var res = result.value[0];
			var data = result.value[1];
			allData.push(data);
		});


		var rt = handler(allData);
		if(rt.error){
			res.status(500);
		}
		res.send(rt);
		/*var res = result[0];
		var data = result[1];
		res.send(handler(data));*/
		
	});

}

var speedDistributeHandler = function(req, res, next){

	var startDateArr = req.params.date.split(',');
	var dateObj = [];

	if(startDateArr.length > 1){
		//超过两个日期
		startDateArr.forEach(function(sA, sI){
			dateObj.push(moment(sA, DATE_FORMAT));
		});

		if(startDateArr.length % 2 > 0){

			for(var v = 1; v <= 2 - (startDateArr.length % 2) ; v ++){
				
				dateObj.push(moment(startDateArr[startDateArr.length-1], DATE_FORMAT).subtract(v, 'days'));
			}
		}
	}else{
		dateObj.push(moment(startDateArr[0], DATE_FORMAT));
		dateObj.push(moment(startDateArr[0], DATE_FORMAT).subtract(1, 'days'));
	}
	var min = req.params.min || req.params.min * 1;
	var max = req.params.max || req.params.max * 1;

	
	var handler = function(dataArr){
		var result = {
			data : []
		};

		for(var i = 0 ; i < dataArr.length; i++){

			if(!dataArr[i].data){
				return {
					'error' : dataArr[i].msg
				}
			}
		}

		dataArr.forEach(function(da,ind){
			var secData = [];
			if(da && da.data && da.data.length){

				da.data.forEach(function(dd, idd){

					if(!result.data[idd]){
						result.data[idd] = {};
						if(!result.data[idd].stall){
							result.data[idd].stall = dd['stall0'];
						}
					}
					for(var t = 0 ; t < 2; t++){
						var stall = dd['stall' + t];
						var access = dd['totalVisitTimes' + t];
						var delay = dd['visitTimes'+ t];
						result.data[idd].visit = result.data[idd].visit || {};
						result.data[idd].visit[dateObj[2 * ind + t].format(DATE_FORMAT)] = {'access':access,'delay':delay}
					}

				});
			}	
		});

		return result;
	}


	var pg = [];

	dateObj.forEach(function(doj, ind){

		if(ind % 2 > 0){
			return;
		}

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
				delayDateFirst: dateObj[ind].format(DATE_FORMAT),
				delayDateSecond: dateObj[ind+1].format(DATE_FORMAT)
			}
		};

		var name = apiOption.qs.format + '@' +apiOption.uri;
		var gapTimestamp = 300000; 
		var memcacheKey = [apiOption.uri,querystring.stringify(apiOption.qs),Math.floor(Date.now()/gapTimestamp)].join('@');
		pg.push(Util.cacheRequest(name, memcached, memcacheKey, _.clone(_.extend(urlOptions,apiOption)), gapTimestamp, res, req)); 

	});

	Q.allSettled(pg).then(function(results){
		var allData = [];
		//var res = {};
		results.forEach(function(result){
			var res = result.value[0];
			var data = result.value[1];
			allData.push(data);
		});
		//console.log(allData)

		var rt = handler(allData);
		if(rt.error){
			res.status(500);
		}
		res.send(rt);
		/*var res = result[0];
		var data = result[1];
		res.send(handler(data));*/
		
	});

	/*var pg = Util.cacheRequest(name, memcached, memcacheKey, _.extend(urlOptions,apiOption), gapTimestamp, res, req); 
	Q.when(pg).then(function(result){
		var res = result[0];
		var data = result[1];
		var rt = handler(data);
		if(!rt.data){
			res.status(500);
		}
		res.send(rt);
	});*/

}


/**
 * @apiDefine Error 
 *
 * @apiError (Error) {json} 5xx 返回后端吐出的错误信息.
 *
 * @apiErrorExample Error-Response:
 *		HTTP/1.1 500 Internal Server Error
 *		{
 *			"error": "{ERROR MESSAGE}"
 *		}
 */

/**
 * @api {get} /info/app/:id 获得华佗配置信息
 * @apiName 获得华佗配置信息
 * @apiExample {curl} Example usage:
 *     curl -i "http://huatuo.f2e.dp/api/v1/info/app/20002"
 * @apiGroup info
 * @apiVersion 0.1.0
 * @apiParam {Number} id 系统分配的appid，点评这边是20002.
 *
 * @apiSuccessExample Success-Response:
 *		HTTP/1.1 200 OK
 *		{
			"data":
 				{
 					"1479":{
 						"name":"evt",
 						"subs":{
	 						"1":{
	 							"pages":{
	 									"1":{
		 									"name":"爱车-特斯拉",
		 									"points":{
		 										"1":"unloadEventStart",
		 										"2":"unloadEventEnd",
		 										"3":"redirectStart",
		 										"4":"redirectEnd",
		 										"5":"fetchStart",
		 										"6":"domainLookupStart",
		 										"7":"domainLookupEnd",
		 										"8":"connectStart",
		 										"9":"connectEnd",
		 										"10":"requestStart",
		 										"11":"responseStart",
		 										"12":"responseEnd",
		 										"13":"domLoading",
		 										"14":"domInteractive",
		 										"15":"domContentLoadedEventStart",
		 										"16":"domContentLoadedEventEnd",
		 										"17":"domComplete",
		 										"18":"loadEventStart",
		 										"19":"loadEventEnd"
 											}
 										},
 										"3":{
 											...
 										}
 										...
									}
								}
							}
				}
			
		}
 *
 * @apiUse Error
 */
router.get('/info/app/:id', function(req, res, next) {
	appHandler(req, res, next)
});


/**
 * @api {get} /speed/date/app/:appId/site/:siteId/sub/:subSiteId/page/:pageId/point/:pointId/start/:date 获得某7天的对比数据
 * @apiName 获得某7天的对比数据
 * @apiExample {curl} Example usage:
 *     curl -i "http://huatuo.f2e.dp/api/v1/speed/date/app/20002/site/1482/sub/1/page/4/point/19/start/2015-04-30,2015-03-14"
 * @apiGroup speed data
 * @apiVersion 0.1.0
 * @apiParam {Number} appId 系统分配的appid，点评这边是20002.
 * @apiParam {Number} siteId 系统分配的站点id.
 * @apiParam {Number} subSiteId 系统分配的子站id，点评这边默认是1.
 * @apiParam {Number} pageId 系统分配的页面id.
 * @apiParam {Number} pointId 系统分配的测速点id.
 * @apiParam {String} start 需要对比的起始日期，如2015-05-01,2015-05-03
 * @apiSuccessExample Success-Response:
 *		HTTP/1.1 200 OK
 *		{
 			"data":[
 				{
 					"visit":{
 						"2015-04-29":{"access":"314792","delay":1007},
 						"2015-04-22":{"access":"593018","delay":1375},
 						"2015-04-15":{"access":"1180880","delay":1354}
 					}
 				},
 				{
 					"visit":{
 						"2015-04-30":{"access":"375434","delay":997},
 						"2015-04-23":{"access":"643504","delay":1358},
 						"2015-04-16":{"access":"475022","delay":1348}
 					}
 				},
 				{
 					"visit":{
 						"2015-05-01":{"access":"192281","delay":1001},
 						"2015-04-24":{"access":"408686","delay":1348},
 						"2015-04-17":{"access":"958577","delay":1372}
 					}
 				},
 				{
 					"visit":{
 						"2015-05-02":{"access":"206786","delay":1025},
 						"2015-04-25":{"access":"325663","delay":1249},
 						"2015-04-18":{"access":"1336362","delay":3081}
 					}
 				},
 				{
 					"visit":{
 						"2015-05-03":{"access":"165465","delay":988},
 						"2015-04-26":{"access":"322763","delay":1132},
 						"2015-04-19":{"access":"857089","delay":1364}
 					}
 				},
 				{
 					"visit":{
 						"2015-05-04":{"access":"382274","delay":1086},
 						"2015-04-27":{"access":"178144","delay":1168},
 						"2015-04-20":{"access":"1294839","delay":1373}
 					}
 				},
 				{
 					"visit":{
 						"2015-05-05":{"access":"440629","delay":1077},
 						"2015-04-28":{"access":"376700","delay":1056},
 						"2015-04-21":{"access":"835112","delay":1349}
 					}
 				}
	 		]
 		}
 *
 * @apiUse Error
 */
router.get('/speed/date/app/:appId/site/:siteId/sub/:subSiteId/page/:pageId/point/:pointId/start/:date', function(req, res, next) {
	speedDateSectionHandler(req, res, next)
});


/**
 * @api {get} /speed/time/app/:appId/site/:siteId/sub/:subSiteId/page/:pageId/point/:pointId/date/:date 获得某天的时段对比数据
 * @apiName 获得某天的时段对比数据
 * @apiExample {curl} Example usage:
 *     curl -i "http://huatuo.f2e.dp/api/v1/speed/time/app/20002/site/1482/sub/1/page/4/point/19/date/2015-05-01,2015-05-02"
 * @apiGroup speed data
 * @apiVersion 0.1.0
 * @apiParam {Number} appId 系统分配的appid，点评这边是20002.
 * @apiParam {Number} siteId 系统分配的站点id.
 * @apiParam {Number} subSiteId 系统分配的子站id，点评这边默认是1.
 * @apiParam {Number} pageId 系统分配的页面id.
 * @apiParam {Number} pointId 系统分配的测速点id.
 * @apiParam {String} date 需要对比的日期，如2015-05-01,2015-05-03
 * @apiSuccessExample Success-Response:
 *		HTTP/1.1 200 OK
 *		{
 			"data":[
 				{
 					"time":"20:00:00",
 					"visit":{
 						"2015-05-01":{"access":"-","delay":"-"},
 						"2015-05-02":{"access":"-","delay":"-"},
 						"2015-05-03":{"access":"-","delay":"-"}
 					}
 				},
 				{
 					"time":"00:05:00",
 					"visit":{
 						"2015-05-01":{"access":"-","delay":"-"},
 						"2015-05-02":{"access":"-","delay":"-"},
 						"2015-05-03":{"access":"-","delay":"-"}
 					}
 				},
 				...
 			]
 		}
 *
 * @apiUse Error
 */

router.get('/speed/time/app/:appId/site/:siteId/sub/:subSiteId/page/:pageId/point/:pointId/date/:date', function(req, res, next) {
	speedDateHandler(req, res, next);
});

/**
 * @api {get} /speed/distribute/app/:appId/site/:siteId/sub/:subSiteId/page/:pageId/point/:pointId/min/:min/max/:max/date/:date 获得某天的正态分布的对比数据
 * @apiName 获得某天的正态分布的对比数据
 * @apiExample {curl} Example usage:
 *     curl -i "http://huatuo.f2e.dp/api/v1/speed/time/app/20002/site/1482/sub/1/page/4/point/19/date/min/5/max/5/2015-05-01,2015-05-02,2015-05-05,2015-05-06"
 * @apiGroup speed data
 * @apiVersion 0.1.0
 * @apiParam {Number} appId 系统分配的appid，点评这边是20002.
 * @apiParam {Number} siteId 系统分配的站点id.
 * @apiParam {Number} subSiteId 系统分配的子站id，点评这边默认是1.
 * @apiParam {Number} pageId 系统分配的页面id.
 * @apiParam {Number} pointId 系统分配的测速点id.
 * @apiParam {Number} min 阈值的最小值
 * @apiParam {Number} max 阈值的最大值
 * @apiParam {String} date 需要对比的日期，如2015-05-01,2015-05-03
 * @apiSuccessExample Success-Response:
 *		HTTP/1.1 200 OK
 *		{
 			"data":[
 				{
 					"stall":"2100",
 					"visit":{
 						"2015-05-01":{"access":"-","delay":"-"},
 						"2015-05-02":{"access":"-","delay":"-"},
 						"2015-05-03":{"access":"-","delay":"-"}
 					}
 				},
 				{
 					"stall":"2200",
 					"visit":{
 						"2015-05-01":{"access":"-","delay":"-"},
 						"2015-05-02":{"access":"-","delay":"-"},
 						"2015-05-03":{"access":"-","delay":"-"}
 					}
 				},
 				...
 			]
 		}
 *
 * @apiUse Error
 */
router.get('/speed/distribute/app/:appId/site/:siteId/sub/:subSiteId/page/:pageId/point/:pointId/min/:min/max/:max/date/:date', function(req, res, next) {
	speedDistributeHandler(req, res, next)
});


module.exports = router;
