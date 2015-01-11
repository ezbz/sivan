angular.module('sivan').factory('MavenClient', function($resource) {
	return $resource(BASE_URL + 'maven/module/:moduleId/:action', {
		action: '',
		moduleId: ''
	}, {
		dependants: {
			method: 'GET',
			isArray: true,
			params: {
				action: 'dependants',
				moduleId: ''
			}
		}
	});
});