var appConfig = {};

appConfig.rootUrl = {
	prod: "http://shanti.outbrain.com\\:3000/",
	dev: "http://localhost\\:3000/"
};
appConfig.flatUrl = {
	prod: "http://shanti.outbrain.com:3000/",
	dev: "http://localhost:3000/"
};

// var authorsAggration = ejs.TermsAggregation('authors').field('author').size(0);
// var modulesAggration = ejs.TermsAggregation('modules').field('modules').size(0);
// var tagsAggration = ejs.TermsAggregation('modules').field('tags').size(0);

appConfig.elasticsearch = {
	host: 'shanti',
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
				}
			}
		}
	}
};
