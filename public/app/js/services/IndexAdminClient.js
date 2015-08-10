angular.module('sivan').factory('IndexAdminClient', function($resource, AppConfig) {
	return $resource(AppConfig.getBaseUrl() + 'revision/:revision/:action', {
		action: 'info',
		args: ''
	}, {
		create: {
			method: 'GET',
			isArray: true,
			params: {
				revision: 'index',
				action: 'create'
			}
		},
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