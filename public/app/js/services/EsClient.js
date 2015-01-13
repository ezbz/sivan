angular.module('sivan').service('EsClient', function(esFactory) {

	return esFactory({
		host: appConfig.elasticsearch.host + ':' + appConfig.elasticsearch.port,
		apiVersion: '1.2',
		log: 'warning'
	});
});