angular.module('sivan').controller('SvnStatusCtrl', function($scope, svnClient) {
	$scope.fetchRevisions = function() {
		svnClient.info(function(infoResponse) {
				$scope.revision = infoResponse.revision;
				svnClient.serverInfo(function(serverResponse) {
					$scope.serverRevision = serverResponse.revision;
					$scope.status = 'ok';
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
		svnClient.update(function(response) {
			$scope.fetchRevisions();
			$scope.updating = false;
		}, function(err){
			$scope.updating = false;
			console.log(err);
		});
	}

	$scope.fetchRevisions();
});