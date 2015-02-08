angular.module('sivan').factory('AppConfig', function() {
	return {
		getAppConfig: function() {
			return _.clone(appConfig);
		}
	};
});