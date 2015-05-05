var _ = require('underscore');


Util = {
	getResult: function(obj){
		var result = {};

		try{
			result = JSON.parse(obj);
		}catch(e){
			result.error = e;
		}
		return result;


	}
}

module.exports = Util;