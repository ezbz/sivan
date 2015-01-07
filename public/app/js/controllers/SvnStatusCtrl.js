angular.module('sivan').controller('SvnStatusCtrl', function($scope, SvnAdminClient) {
	$scope.fetchRevisions = function() {
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
	};

	$scope.update = function() {
		$scope.updating = true;
		SvnAdminClient.update(function(response) {
			$scope.fetchRevisions();
			$scope.updating = false;
		}, function(err) {
			$scope.updating = false;
			console.log(err);
		});
	}

	$scope.fetchRevisions();
});