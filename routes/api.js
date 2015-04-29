var express = require('express');
var router = express.Router();
var request = require('request');
var querystring = require('querystring');
var _ = require('underscore');
var urlOptions = {
	useQuerystring : true,
	baseUrl: "http://huatuo.qq.com/Openapi/",
	qs: {
		appkey : "9WQx7JInsjShOvRGNLb61w=="
	}
}

/* GET home page. */
router.get('/app/:id', function(req, res, next) {

	var apiOption = {
		uri:"/AppSpeedConfigList",
		qs: _.extend(urlOptions.qs, {
			appId: 20002
		})
	}

	request(_.extend(urlOptions,apiOption),function(error, response, body){
		if(!error){
			res.send(body);
		}
		

	})
});

module.exports = router;
