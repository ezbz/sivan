angular.module('sivan').factory('AppConfig', function(EsClient) {

	return {
		getAppConfig: function() {
			return _.clone(appConfig);
		}
	};
});