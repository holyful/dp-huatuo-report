# 华佗api

基于腾讯华佗api做二次封装，提供过滤等一系列功能。 api基本url是``http://huatuo.f2e.dp/api/v1/``

## 获取配置信息

### 请求格式

#### URL

``url

GET http://huatuo.f2e.dp/api/v1/app/{华佗分配的APPID}?{query_string}

``

#### 参数

-	参数名: siteId, 类型: int, 必须
	var subId = req.query.subId || req.query.subId * 1;
	var pageId = req.query.pageId || req.query.pageId * 1;
	var pointId = req.query.pointId || req.query.pointId * 1;
	var siteName = req.query.siteName;
	var pageName = req.query.pageName;
	var eventName = req.query.eventName;


|| *参数名* || *类型 (low)* || *必须* || *描述* ||
|| siteId || long || 否 || 系统分配的站点id ||
|| subId || long || 否 || 系统分配的子站id，点评这边目前一律填1，参数开出来是为了日后扩展 ||
|| pageId || long || 否 || 系统分配的页面id ||
|| pointId || long || 否 || 系统分配的测速点id ||
|| siteName || string || 否 || 配置时填入的站点名称，如团购 ||
|| pageName || string || 否 || 配置时填入的页面名称，如详情页 ||
|| eventName || string || 否 || 配置时填入测速点名称，如responseEnd ||

