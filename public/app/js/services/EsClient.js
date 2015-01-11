angular.module('sivan').service('EsClient', function(esFactory) {
	return esFactory({
		host: 'localhost:9200',
		apiVersion: '1.2',
		log: 'warning'
	});
});