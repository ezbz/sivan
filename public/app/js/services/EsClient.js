angular.module('sivan').service('EsClient', function(esFactory, AppConfig) {
	return esFactory({
		host: AppConfig.getAppConfig().elasticsearch.host,
		apiVersion: '1.2',
		log: AppConfig.getAppConfig().elasticsearch.logLevel,
		requestTimeout: AppConfig.getAppConfig().elasticsearch.requestTimeout
	});
});