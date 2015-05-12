var _ = require('underscore');
var request = require('request');
var Q = require('q'); 
var CONTENT_TYPE = "application/json";
var CACHE_CONTROL = 'no-cache';
var MOCK_URL = {
	'AppSpeedConfigList': "../mock/info.json",
	'datesection@GetSpeedData':"../mock/speedDateSection.json",
	'date@GetSpeedData':"../mock/speedDate.json",
	'distribute@GetSpeedData':"../mock/speedDataDistribute.json"
}
Util = {
	REQ_OPTIONS : {},
	REQ_GAPTIME : {},
	getResult: function(obj){
		var result = {};
		try{
			result = JSON.parse(obj);
		}catch(e){
			result.error = e;
		}
		return result;


	},
	cacheRequest: function(name, memcached, memcacheKey, options, gapTimestamp, res, req){
		var self = this;
		var deferred = Q.defer();
		var DEBUG = !!(req.query.debug * 1) || false;
		var MOCK = !!(req.query.mock * 1) || false;
		memcached.get(memcacheKey, function (err, data) {
			res.setHeader("Content-Type",CONTENT_TYPE);
			res.setHeader("Cache-Control",CACHE_CONTROL);
			res.setHeader("API-ID",name);
			if(!data || DEBUG){
				res.setHeader("Cache","MISS");
				if(!MOCK){

					request(options,function(error, response, body){
						if(!DEBUG){
							memcached.set(memcacheKey, body, self.gapTimestamp/1000, function(){})
						}
						deferred.resolve([res, Util.getResult(body)]);
					});
					
				}else{
					deferred.resolve([res, require(MOCK_URL[name])]);
				}
				return;
				
			}
			res.setHeader("Cache","HIT");

			deferred.resolve([res, Util.getResult(data)]);
		});
		return deferred.promise;
	}

}

module.exports = Util;