angular.module('sivan').service('EsClient', function(esFactory, AppConfig) {
	return esFactory({
		host: ES_URL,
		apiVersion: '1.2',
		log: AppConfig.getAppConfig().elasticsearch.logLevel,
		requestTimeout: AppConfig.getAppConfig().elasticsearch.requestTimeout
	});
});