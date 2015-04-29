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

/* GET home page. */
router.get('/app/:id', function(req, res, next) {

	var apiOption = {
		uri:"/AppSpeedConfigList",
		qs: {
			appId: 20002,
			appkey: APPKEY
		}
	}

	request(_.extend(urlOptions,apiOption),function(error, response, body){
		res.setHeader("Content-Type","application/json");
		res.send(body);
	})
});

module.exports = router;
