angular.module('sivan').factory('SvnAdminClient', function($resource, AppConfig) {
	return $resource(AppConfig.getBaseUrl() + 'svn/:action/:args', {
		action: 'info',
		args: ''
	}, {
		info: {
			method: 'GET',
			isArray: false,
			params: {
				action: 'info'
			}
		},
		serverInfo: {
			method: 'GET',
			isArray: false,
			params: {
				action: 'info',
				args: 'server'
			}
		},
		update: {
			method: 'GET',
			isArray: true,
			params: {
				action: 'update',
				args: ''
			}
		}
	});
});