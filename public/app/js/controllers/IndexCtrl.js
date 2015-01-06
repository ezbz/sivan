angular.module('sivan').controller('IndexCtrl', function($scope, esClient) {
	$scope.selections = {};

	$scope.initSelections = function() {
		esClient.search({
			index: 'svn-revision',
			type: 'revision',
			body: {
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
			}
		}).then(function(body) {
			$scope.allAuthors = _.sortBy(body.aggregations.authors.buckets, 'key');
			$scope.allModules = _.sortBy(body.aggregations.modules.buckets, 'key');
			$scope.allTags = _.sortBy(body.aggregations.tags.buckets, 'key');
		}, function(err) {
			console.log(err)
			$scope.error = err;
		});
	};

	$scope.search = function() {
		esClient.search({
			index: 'svn-revision',
			type: 'revision',
			body: {
				query: {
					match: {
						_all: $scope.query
					}
				},
				aggregations: {
					authors: {
						"terms": {
							"field": "author",
							"size": 10
						}
					},
					modules: {
						"terms": {
							"field": "modules",
							"size": 10
						}
					},
					tags: {
						"terms": {
							"field": "tags",
							"size": 10
						}
					}
				}
			}
		}).then(function(body) {
			$scope.result = body.hits;
			$scope.authors = body.aggregations.authors.buckets;
			$scope.modules = body.aggregations.modules.buckets;
			$scope.tags = body.aggregations.tags.buckets;
		}, function(err) {
			$scope.error = err;
		});
	};


	$scope.initSelections();

	$scope.popoverFiles = function(files){
		return _.map(files, function(file){
			return file.status +": " + file.path;
		}).join('</br>');
	};
});