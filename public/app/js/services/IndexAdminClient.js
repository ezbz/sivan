angular.module('sivan').factory('IndexAdminClient', function($resource) {
	return $resource(BASE_URL + 'svn/revision/:revision/:action', {
		action: 'info',
		args: ''
	}, {
		index: {
			method: 'GET',
			isArray: true,
			params: {
				revision: '',
				action: 'index'
			}
		},
		maxId: {
			method: 'GET',
			isArray: false,
			params: {
				revision: 'max',
				action: ''
			}
		},
		sync: {
			method: 'GET',
			isArray: true,
			params: {
				revision: 'sync',
				action: ''
			}
		}
	});
});