angular.module('sivan').factory('AppConfig', function($log, $location) {
	var host = $location.host();
	var ENV = APP_CONFIG.app.rootUrl.prod.indexOf(host) != -1 ? "prod" : "dev";
	var BASE_URL = (ENV == "dev") ? APP_CONFIG.app.rootUrl.dev : APP_CONFIG.app.rootUrl.prod;
	var ES_URL = (ENV == "dev") ? APP_CONFIG.app.esUrl.dev : APP_CONFIG.app.esUrl.prod;
	$log.info("Application configuration initialized for environment: [" + ENV + "]");
	return {
		getAppConfig: function() {
			return _.clone(APP_CONFIG);
		},
		getBaseUrl: function() {
			return BASE_URL;
		},
		getFlatUrl: function() {
			return BASE_URL.replace('\\', '');
		},
		getEsUrl: function() {
			return ES_URL;
		},
		getEnv: function() {
			return ENV;
		}
	};
});