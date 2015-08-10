angular.module('sivan').controller('AdminCtrl', function($scope, ScmAdminClient, IndexAdminClient, AppConfig, $cookies) {
	$scope.sourceTheme = $cookies.sourceTheme ? $cookies.sourceTheme : "monokai";
	$scope.themes = AppConfig.getAppConfig().themes;

	$scope.updateTheme = function() {
		if ($scope.sourceTheme != $cookies.sourceTheme) {
			$cookies.sourceTheme = $scope.sourceTheme;
		}
	}

	$scope.fetchRevisions = function(callback) {
		IndexAdminClient.maxId(function(maxIdResponse) {
			$scope.maxIndexedRevision = maxIdResponse.maxId;
			ScmAdminClient.info(function(infoResponse) {
					$scope.revision = infoResponse.revision;
					ScmAdminClient.serverInfo(function(serverResponse) {
						if (serverResponse.revision) {
							$scope.serverRevision = serverResponse.revision;
							$scope.status = 'ok';
						} else {
							$scope.status = 'error'
						}
						if (callback) {
							callback();
						}
					}, function(err) {
						$scope.status = 'error';
						$scope.error = err;
						if (callback) {
							callback(err);
						}
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
			$scope.fetchRevisions(function(err) {
				$scope.syncing = false;
			});
		}, function(err) {
			$scope.error = err;
			$scope.fetchRevisions(function(err) {
				$scope.syncing = false;
			});
		});
	};

	$scope.fetchRevisions();
});