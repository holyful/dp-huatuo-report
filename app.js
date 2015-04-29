var express = require('express');
var app = express();
var request = require('request');
var APPKEY = "9WQx7JInsjShOvRGNLb61w==";


app.get('/app/:id', function(req, res) {
   
	request('http://huatuo.qq.com/Openapi/AppSpeedConfigList?appkey='+APPKEY+'&appId='+req.params.id,function(error,response,body){
		res.send(body)
	})

});

app.listen(2000);