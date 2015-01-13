angular.module('sivan').service('EsClient', function(esFactory) {
	return esFactory({
		host: ES_URL,
		apiVersion: '1.2',
		log: 'warning'
	});
});