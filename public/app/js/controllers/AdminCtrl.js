angular.module('sivan').controller('AdminCtrl', function($scope, SvnAdminClient, IndexAdminClient, $cookies) {
	$scope.sourceTheme = $cookies.sourceTheme ? $cookies.sourceTheme : "monokai";
	$scope.themes = ["arta",
		"ascetic",
		"atelier-dune",
		"atelier-dune",
		"atelier-forest",
		"atelier-forest",
		"atelier-heath",
		"atelier-heath",
		"atelier-lakeside",
		"atelier-lakeside",
		"atelier-seaside",
		"atelier-seaside",
		"brown_paper",
		"codepen-embed",
		"color-brewer",
		"dark",
		"default",
		"docco",
		"far",
		"foundation",
		"github",
		"googlecode",
		"hybrid",
		"idea",
		"ir_black",
		"kimbie",
		"kimbie",
		"magula",
		"mono-blue",
		"monokai",
		"monokai_sublime",
		"obsidian",
		"paraiso",
		"paraiso",
		"pojoaque",
		"railscasts",
		"rainbow",
		"school_book",
		"solarized_dark",
		"solarized_light",
		"sunburst",
		"tomorrow-night-blue",
		"tomorrow-night-bright",
		"tomorrow-night-eighties",
		"tomorrow-night",
		"tomorrow",
		"vs",
		"xcode",
		"zenburn"
	];

	$scope.updateTheme = function() {
		if ($scope.sourceTheme != $cookies.sourceTheme) {
			$cookies.sourceTheme = $scope.sourceTheme;
		}
	}

	$scope.fetchRevisions = function() {
		IndexAdminClient.maxId(function(maxIdResponse) {
			$scope.maxIndexedRevision = maxIdResponse.maxId;
			SvnAdminClient.info(function(infoResponse) {
					$scope.revision = infoResponse.revision;
					SvnAdminClient.serverInfo(function(serverResponse) {
						if (serverResponse.revision) {
							$scope.serverRevision = serverResponse.revision;
							$scope.status = 'ok';
						} else {
							$scope.status = 'error'
						}
					}, function(err) {
						$scope.status = 'error';
						$scope.error = err;
					});
				},
				function(err) {
					$scope.status = 'error';
					$scope.error = err;
				});
		});
	};

	$scope.sync = function() {
		$scope.syncing = true;
		$scope.error = null;
		IndexAdminClient.sync(function(response) {
			$scope.syncing = false;
		}, function(err) {
			$scope.syncing = false;
			$scope.error = err;
		});
	};

	$scope.fetchRevisions();
});