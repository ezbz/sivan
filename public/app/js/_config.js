var appConfig = {};

appConfig.rootUrl = {
	prod: "http://shanti.outbrain.com\\:3001/",
	dev: "http://localhost\\:3001/"
};
appConfig.flatUrl = {
	prod: "http://shanti.outbrain.com:3001/",
	dev: "http://localhost:3001/"
};

appConfig.elasticsearch = {
	host: 'localhost',
	port: 9200,
	filterAuthors: "ciuser",
	aggregationsQuery: {
		aggregations: {
			authors: {
				"terms": {
					"field": "author",
					"size": 0
				}
			},
			modules: {
				"terms": {
					"field": "modules",
					"size": 0
				}
			},
			tags: {
				"terms": {
					"field": "tags",
					"size": 0
				}
			}
		}
	},
	searchBaseQuery: {
		index: 'svn-revision',
		type: 'revision',
		body: {
			query: {
				filtered: {}
			},
			aggregations: {
				authors: {
					"terms": {
						"field": "author",
						"size": 5
					}
				},
				modules: {
					"terms": {
						"field": "modules",
						"size": 5
					}
				},
				tags: {
					"terms": {
						"field": "tags",
						"size": 5
					}
				},
				timeline: {
					date_histogram: {
						field: "date",
						interval: "month"
					}
				}
			}
		}
	}
};