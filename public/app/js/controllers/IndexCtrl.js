angular.module('sivan').controller('IndexCtrl', function($scope, IndexAdminClient, EsService, EsClient, AppConfig, $http, $modal, $aside, $window, $location) {
	$scope.query = "";
	$scope.selections = {
		modules: "",
		authors: "",
		fileTypes: "",
		tags: "",
		filterAuthors: true
	};
	$scope.defaultSelections = _.clone($scope.selections);
	$scope.pagination = $scope.defaultPagination = {
		pageSize: 10,
		maxPages: 10,
		pageNumber: 1,
		totalItems: 0,
		sortBy: 'revision',
		sortDirection: 'desc'
	};
	$scope.defaultPagination = _.clone($scope.pagination);
	$scope.showFiles = {};
	$scope.showDiffs = {};
	$scope.showSources = {};
	$scope.fileSources = {};
	$scope.showFilters = false;
	$scope.loading = false;
	$scope.filteredAuthors = AppConfig.getAppConfig().elasticsearch.filteredAuthors;


	$scope.highchartsNgConfig = {
		options: {
			chart: {
				zoomType: 'x',
				marginBottom: 30
			},
			title: {
				text: null
			},
			legend: {
				layout: 'horizontal',
				floating: true,
				verticalAlign: 'top',
				itemWidth: 120
			},
		},
		xAxis: {
			type: 'datetime',
			dateTimeLabelFormats: {
				month: '%b \'%y',
			}
		},
		yAxis: [{
			title: {
				text: null
			},
			min: 0
		}, {
			title: {
				text: null
			},
			labels: {
				enabled: false
			},
			gridLineWidth: 0,
			min: 0,
			opposite: true
		}, {
			title: {
				text: null
			},
			labels: {
				enabled: false
			},
			gridLineWidth: 0,
			min: 0,
			opposite: true
		}, {
			title: {
				text: null
			},
			labels: {
				enabled: false
			},
			gridLineWidth: 0,
			min: 0,
			opposite: true
		}],
		size: {
			height: 200
		}
	};

	$scope.resetSearch = function() {
		$scope.selections = _.clone($scope.defaultSelections);
		$scope.pagination = _.clone($scope.defaultPagination);
		$scope.search();
	};


	$scope.searchByFile = function(file) {
		$scope.searchBy(file.substring(file.lastIndexOf('/') + 1, file.length));
	};

	$scope.searchBy = function(text) {
		$scope.query = text;
		$scope.resetSearch();
	};

	$scope.initSelections = function(callback, errCallback) {
		EsService.getSelections(function(selections) {
			$scope.allAuthors = selections.allAuthors;
			$scope.allModules = selections.allModules;
			$scope.allTags = selections.allTags;
			$scope.allFileTypes = selections.allFileTypes;
			if (callback) {
				callback(body);
			}
		}, function(err) {
			if (err && err.message.indexOf('IndexMissingException') !== -1) {
				$scope.indexMissing = true;
			}
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
		$scope.loading = true;
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
				$scope.fileTypes = body.aggregations.fileTypes.buckets;
				$scope.siginificantTerms = _.map(body.aggregations.significant_terms.buckets, function(bucket) {
					return {
						text: bucket.key,
						weight: Math.floor(bucket.doc_count * 100 / body.hits.total)
					}
				});
				$scope.pagination.totalItems = body.hits.total;

				var buckets = body.aggregations.timeline.buckets;
				if (buckets.length) {

					var start = moment(buckets[0].key);
					var end = moment(buckets[buckets.length - 1].key);

					var pointInterval = moment.duration(1, 'months').as('milliseconds');
					if (end.diff(start, 'months') > 12) {
						$scope.highchartsNgConfig.xAxis.dateTimeLabelFormats = {
							month: '%b \'%y'
						};
						pointInterval = moment.duration(1, 'months').as('milliseconds');
					} else if (end.diff(start, 'days') > 30) {
						$scope.highchartsNgConfig.xAxis.dateTimeLabelFormats = {
							day: '%e. %b'
						};
						pointInterval = moment.duration(1, 'days').as('milliseconds');
					} else if (end.diff(start, 'hours') > 24) {
						$scope.highchartsNgConfig.xAxis.dateTimeLabelFormats = {
							hour: '%H:%M'
						};
						pointInterval = moment.duration(1, 'hours').as('milliseconds');
					} else {
						$scope.highchartsNgConfig.xAxis.dateTimeLabelFormats = {
							minute: '%H:%M'
						};
						pointInterval = moment.duration(1, 'minutes').as('milliseconds');
					}

					var addedData = _.map(buckets, function(bucket) {
						return Math.floor(bucket.added.value);
					});
					var addedMax = _.max(addedData);
					var deletedData = _.map(buckets, function(bucket) {
						return Math.floor(bucket.deleted.value);
					});
					var deletedMax = _.max(deletedData);

					$scope.highchartsNgConfig.series = [{
						showInLegend: true,
						name: 'revisions',
						type: 'areaspline',
						color: Highcharts.getOptions().colors[0],
						pointInterval: pointInterval,
						pointStart: start.valueOf(),
						yAxis: 0,
						data: _.pluck(buckets, 'doc_count')
					}, {
						showInLegend: true,
						name: 'added lines',
						type: 'spline',
						marker: {
							enabled: false
						},
						dashStyle: 'shortdot',
						color: Highcharts.getOptions().colors[2],
						pointInterval: pointInterval,
						pointStart: start.valueOf(),
						tickInterval: addedMax / 4,
						yAxis: 1,
						data: addedData
					}, {
						showInLegend: true,
						name: 'deleted lines',
						type: 'spline',
						marker: {
							enabled: false
						},
						dashStyle: 'shortdot',
						color: Highcharts.getOptions().colors[3],
						pointInterval: pointInterval,
						pointStart: start.valueOf(),
						tickInterval: deletedMax / 4,
						yAxis: 1,
						data: deletedData
					}, {
						showInLegend: true,
						name: 'authors',
						type: 'spline',
						marker: {
							enabled: false
						},
						dashStyle: 'dot',
						color: Highcharts.getOptions().colors[5],
						pointInterval: pointInterval,
						pointStart: start.valueOf(),
						yAxis: 2,
						data: _.map(buckets, function(bucket) {
							return bucket.authors.value;
						})
					}, {
						showInLegend: true,
						name: 'modules',
						type: 'spline',
						marker: {
							enabled: false
						},
						dashStyle: 'dot',
						color: Highcharts.getOptions().colors[8],
						pointInterval: pointInterval,
						pointStart: start.valueOf(),
						yAxis: 3,
						data: _.map(buckets, function(bucket) {
							return bucket.modules.value;
						})
					}];
				}

				if (callback) {
					callback(body);
				}

				$scope.loading = false;
			},
			function(err) {
				$scope.error = err;
				$scope.loading = false;
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
	};

	$scope.showSource = function(revision, file) {
		return $scope.showSources[revision.revision] && $scope.showSources[revision.revision][file];
	};

	$scope.toggleSource = function(revision, file) {
		if (!$scope.showSources[revision.revision]) {
			$scope.showSources[revision.revision] = {};
		}
		if (!$scope.fileSources[file]) {
			$scope.loading = true;
			var url = AppConfig.getFlatUrl() + "svn/file/" + encodeURIComponent(file) + "/" + revision.revision;
			$http.get(url, {
				cache: true
			}).then(function(response) {
				$scope.fileSources[file] = response.data;
				$scope.showSources[revision.revision][file] = !$scope.showSources[revision.revision][file];
				$scope.loading = false;
			}, function(err) {
				console.error(err);
				$scope.error = err;
				$scope.loading = false;
			});
		} else {
			$scope.showSources[revision.revision][file] = !$scope.showSources[revision.revision][file];
		}
	};

	$scope.getLanguageFromFileName = function(file) {
		var parts = file.split('.');
		if (parts.length > 0) {
			return parts[parts.length - 1];
		}
	};
	$scope.showDiff = function(revision, file) {
		return $scope.showDiffs[revision.revision] && $scope.showDiffs[revision.revision][file];
	};

	$scope.toggleDiff = function(revision, file) {
		if (!$scope.showDiffs[revision.revision]) {
			$scope.showDiffs[revision.revision] = {};
		}
		$scope.showDiffs[revision.revision][file] = !$scope.showDiffs[revision.revision][file];
	};

	$scope.toggleFiles = function(revision) {
		$scope.showFiles[revision.revision] = !$scope.showFiles[revision.revision];
	};

	$scope.showFiles = function(revision) {
		return $scope.showFiles[revision.revision];
	};

	$scope.showDeepTree = function(revision, modules) {

		$scope.loading = true;
		MavenClient.dependants({
			moduleId: modules.join(',')
		}, function(dependants) {
			var all = modules.concat(dependants);
			$scope.showTree(revision, all);
			$scope.loading = false;
		}, function(err) {
			console.log(err)
			$scope.loading = false;
		});

	};

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
	};

	$scope.sort = function(sortBy) {
		if ($scope.pagination.sortBy === sortBy) {
			$scope.pagination.sortDirection = ($scope.pagination.sortDirection === "asc") ? "desc" : "asc";
		} else {
			$scope.pagination.sortBy = sortBy;
			$scope.pagination.sortDirection = "asc";
		}
		$scope.search();
	};

	$scope.applyModules = function(item, model) {
		$scope.selections.modules = item;
		$scope.search();
	};
	$scope.applyAuthors = function(item, model) {
		$scope.selections.authors = item;
		$scope.search();
	};
	$scope.applyTags = function(item, model) {
		$scope.selections.tags = item;
		$scope.search();
	};

	$scope.applyFileTypes = function(item, model) {
		$scope.selections.fileTypes = item;
		$scope.search();
	};

	$scope.bindHtml = function(html) {
		return $sce.trustAsHtml(html);
	}
	$scope.createIndex = function() {
		IndexAdminClient.create(function(response) {
			$scope.message = "Index created";
			$scope.error = false;
			$scope.indexMissing = false;
		}, function(err) {
			$scope.error = err;
		});
	};


	if ($location.search().query) {
		$scope.query = $location.search().query;
		$scope.search();
	}
});