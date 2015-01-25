var appConfig = {};

appConfig.rootUrl = {
	prod: "http://shanti.outbrain.com\\:3001/",
	dev: "http://localhost\\:3001/"
};
appConfig.flatUrl = {
	prod: "http://shanti.outbrain.com:3001/",
	dev: "http://localhost:3001/"
};
appConfig.esUrl = {
	prod: "http://shanti.outbrain.com:9200/",
	dev: "http://localhost:9200/"
};

appConfig.elasticsearch = {
	filterAuthors: "ciuser",
	aggregationsQuery: {
		aggregations: {
			authors: {
				terms: {
					field: "author",
					size: 0
				}
			},
			modules: {
				terms: {
					field: "modules",
					size: 0
				}
			},
			tags: {
				terms: {
					field: "tags",
					size: 0
				}
			},
			fileTypes: {
				terms: {
					field: "fileTypes",
					size: 0
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
					terms: {
						field: "author",
						size: 5
					}
				},
				modules: {
					terms: {
						field: "modules",
						size: 5
					}
				},
				tags: {
					terms: {
						field: "tags",
						size: 5
					}
				},
				fileTypes: {
					terms: {
						field: "fileTypes",
						size: 5
					}
				},
				significant_terms: {
					significant_terms: {
						field: "message",
						size: 20
					}
				},
				timeline: {
					date_histogram: {
						field: "date",
						interval: "month",
					}
				}
			}
		}
	}
};