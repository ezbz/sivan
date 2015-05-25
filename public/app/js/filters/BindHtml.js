angular.module('sivan').filter('html', function($sce) {
	return function(text) {
		return $sce.trustAsHtml(text);
	};
});