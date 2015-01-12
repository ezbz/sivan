angular.module('sivan').service('EsClient', function(esFactory) {

	return esFactory({
		host: 'shanti:9200',
		apiVersion: '1.2',
		log: 'warning'
	});
});