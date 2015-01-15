angular.module('sivan').controller('AdminCtrl', function($scope, SvnAdminClient, IndexAdminClient) {
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

	$scope.sync = function() {
		$scope.syncing = true;
		update(function(response) {
			$scope.fetchRevisions();
			index($scope.maxIndexedRevision, $scope.serverRevision, function(response) {
				$scope.initSelections();
				$scope.syncing = false;
			}, function(err) {
				$scope.syncing = false;
				$scope.error = err;
			});
		}, function(err) {
			$scope.syncing = false;
			$scope.error = err;
		});
	};

	function update(callback, errCallback) {
		SvnAdminClient.update(function(response) {
			callback(response);
		}, function(err) {
			console.error(err);
			errCallback(err);
		});
	};


	function index(minRevision, maxRevision, callback, errCallback) {
		IndexAdminClient.index({
			revision: minRevision + ':' + maxRevision
		}, function(response) {
			callback(response);
		}, function(err) {
			console.error(err);
			errCallback(err);
		});
	};

	$scope.fetchRevisions();
});