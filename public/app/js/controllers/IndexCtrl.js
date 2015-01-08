angular.module('sivan').controller('IndexCtrl', function($scope, EsClient, MavenClient, $http, $modal, $aside, $window) {
	$scope.selections = {
		modules: "",
		authors: "",
		tags: "",
		filterCiuser: true
	};
	$scope.loadingDiff = false;
	$scope.loadingTree = false;

	$scope.initSelections = function(callback, errCallback) {
		EsClient.search({
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
			if (callback) {
				callback(body);
			}
		}, function(err) {
			console.log(err)
			$scope.error = err;
			if (errCallback) {
				errCallback(err);
			}
		});
	};


	$scope.hasModuleTree = function(modules) {
		var arr = ["production", "pom.xml", ".gitignore"];
		for (var i = 0; i < modules.length; i++) {
			if (_.indexOf(arr, modules[i]) === -1) {
				return true;
			}
		}
	}

	$scope.search = function(callback, errCallback) {
		$scope.error = null;
		var searchObj = {
			index: 'svn-revision',
			type: 'revision',
			body: {
				from: 0,
				size: 100,
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
		};

		if ($scope.query) {
			searchObj.body.query.filtered.query = {
				match: {
					_all: $scope.query
				}
			}
		};

		console.log($scope.selections);

		if (_.compact(_.values($scope.selections)).length > 0) {
			searchObj.body.query.filtered.filter = {
				and: []
			};
			if ($scope.selections.modules) {
				searchObj.body.query.filtered.filter.and.push({
					term: {
						modules: $scope.selections.modules.key
					}
				});
			}
			if ($scope.selections.authors) {
				searchObj.body.query.filtered.filter.and.push({
					term: {
						author: $scope.selections.authors.key
					}
				});
			}
			if ($scope.selections.tags) {
				searchObj.body.query.filtered.filter.and.push({
					term: {
						tags: $scope.selections.tags.key
					}
				});
			}
			if ($scope.selections.filterCiuser) {
				searchObj.body.query.filtered.filter.and.push({
					not: {
						term: {
							author: 'ciuser'
						}
					}
				});
			}
			if ($scope.selections.startRevision || $scope.selections.endRevision) {
				searchObj.body.query.filtered.filter.and.push({
					range: {
						revision: {
							gte: $scope.selections.startRevision,
							lte: $scope.selections.endRevision
						}
					}
				});
			}
			if ($scope.selections.startDate ||
				$scope.selections.startTime) {
				searchObj.body.query.filtered.filter.and.push({
					range: {
						date: {
							gte: getEsDateFormat($scope.selections.startDate, $scope.selections.startTime)
						}
					}
				});
			}
			if ($scope.selections.endDate ||
				$scope.selections.endTime) {
				searchObj.body.query.filtered.filter.and.push({
					range: {
						date: {
							lte: getTimestamp($scope.selections.endDate, $scope.selections.endTime)
						}
					}
				});
			}
		}

		console.log(searchObj);

		EsClient.search(searchObj).then(function(body) {
			$scope.result = body.hits;
			$scope.authors = body.aggregations.authors.buckets;
			$scope.modules = body.aggregations.modules.buckets;
			$scope.tags = body.aggregations.tags.buckets;
			if (callback) {
				callback(body);
			}
		}, function(err) {
			$scope.error = err;
			if (errCallback) {
				errCallback(err);
			}
		});
	};

	function getEsDateFormat(date, time) {
		if (date && time) {
			return date + "T" + time + ".000Z"
		}
		return date + "T000000.000Z"
	}

	function getTimestamp(date, time) {
		var datetime = moment(date + " " + time + "+02:00", "YYYY-MM-DD HH:mm:ssZZ")
		return datetime.valueOf();
	}


	$scope.initSelections();

	$scope.sortBy = function(entry){
		console.log(entry);
	}

	$scope.toggleStats = function() {
		if ($scope.statsPane && $scope.statsPane != null) {
			$scope.statsPane.$scope.$hide();
			$scope.statsPane = null;
			return;
		}

		$scope.statsPane = $aside({
			scope: $scope,
			animation: 'am-slide-right',
			placement: 'right',
			container: 'body',
			template: 'partials/summary.jade',
			show: false,
			backdrop: false
		});

		$scope.statsPane.$promise.then(function() {
			$scope.statsPane.show();
		})
	}

	$scope.showDiff = function(revision) {
		$scope.loadingDiff = true;
		$http.get(FLAT_URL + "svn/diff/" + revision.revision + "/html").then(function(diffHtml) {
			$modal({
				title: 'Diff for revision ' + revision.revision,
				content: diffHtml.data,
				show: true,
				container: 'body',
				html: true
			});
			$scope.loadingDiff = false;
		}, function(err) {
			$modal({
				title: 'Error getting diff for revision ' + revision,
				content: err,
				html: true,
				show: true
			});
		})
	};

	$scope.showFiles = function(revision) {
		$modal({
			title: revision.files.length + ' files in revision ' + revision.revision,
			content: _.map(revision.files, function(file) {
				return "(" + file.status + ") " + file.path;
			}).join('</br>'),
			show: true,
			animation: 'am-flip-x',
			container: 'body',
			html: true
		});
	};
	$scope.showDeepTree = function(revision, modules) {
		MavenClient.dependants({
			moduleId: modules.join(',')
		}, function(dependants) {
			var all = modules.concat(dependants);
			$scope.showTree(revision, all);
		}, function(err) {
			console.error(err)
		});

	}
	$scope.showTree = function(revision, modules) {
		var treeUrl = "maven/module/" + modules.join(',') + "/html";
		var modal = $modal({
			title: 'Affected modules and dependants for revision ' + revision,
			content: '<iframe src="' + treeUrl + '" style="height: 100%;width: 100%; border: 0px" border="0"></iframe>',
			show: true,
			container: 'body',
			html: true
		});
	};

	$scope.applyModules = function(item, model) {
		$scope.selections.modules = item;
		$scope.search();
	}
	$scope.applyAuthors = function(item, model) {
		$scope.selections.authors = item;
		$scope.search();
	}
	$scope.applyTags = function(item, model) {
		$scope.selections.tags = item;
		$scope.search();
	}
});