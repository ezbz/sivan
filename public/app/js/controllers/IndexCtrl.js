angular.module('sivan').controller('IndexCtrl', function($scope, EsService, EsClient, MavenClient, $http, $modal, $aside, $window) {
	$scope.selections = {
		modules: "",
		authors: "",
		tags: "",
		filterAuthors: true
	};
	$scope.defaultSelections = _.clone($scope.selections);
	$scope.pagination = $scope.defaultPagination = {
		pageSize: 20,
		maxPages: 10,
		pageNumber: 1,
		totalItems: 0,
		sortBy: 'revision',
		sortDirection: 'asc'
	};
	$scope.defaultPagination = _.clone($scope.pagination);
	$scope.loadingDiff = false;
	$scope.loadingTree = false;
	$scope.resetSearch = function() {
		$scope.selections = _.clone($scope.defaultSelections);
		$scope.pagination = _.clone($scope.defaultPagination);
		$scope.search();
	};
	$scope.initSelections = function(callback, errCallback) {
		EsService.getSelections(function(selections, err) {
			$scope.allAuthors = selections.allAuthors;
			$scope.allModules = selections.allModules;
			$scope.allTags = selections.allTags;
			if (callback) {
				callback(body);
			}
			if (err) {
				console.log(err)
				$scope.error = err;
				if (errCallback) {
					errCallback(err);
				}
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
		EsService.search({
				selections: $scope.selections,
				pagination: $scope.pagination,
				query: $scope.query
			},
			function(body) {
				$scope.result = body.hits;
				$scope.authors = body.aggregations.authors.buckets;
				$scope.modules = body.aggregations.modules.buckets;
				$scope.tags = body.aggregations.tags.buckets;
				$scope.pagination.totalItems = body.hits.total;
				// $scope.toggleStats();
				if (callback) {
					callback(body);
				}
			},
			function(err) {
				$scope.error = err;
				if (errCallback) {
					errCallback(err);
				}
			});
	};


	$scope.initSelections();
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

	$scope.getSortClass = function(sortBy) {
		if ($scope.pagination.sortBy === sortBy) {
			return ($scope.pagination.sortDirection === "asc") ? "fa-sort-asc" : "fa-sort-desc";
		} else {
			return "fa-sort";
		}
	}	

	$scope.sort = function(sortBy) {
		if ($scope.pagination.sortBy === sortBy) {
			$scope.pagination.sortDirection = ($scope.pagination.sortDirection === "asc") ? "desc" : "asc";
		} else {
			$scope.pagination.sortBy = sortBy;
			$scope.pagination.sortDirection = "asc";
		}
		$scope.search();
	}

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