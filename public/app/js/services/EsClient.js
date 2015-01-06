app.service('esClient', function(esFactory) {
	return esFactory({
		host: 'localhost:9200',
		apiVersion: '1.2',
		log: 'warning'
	});
});