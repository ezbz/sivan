'use strict';

var app = angular.module('sivan', [
  'ngRoute',
  'ngResource',
  'ngSanitize',
  'ngCookies',
  'ui.bootstrap',
  'ui.bootstrap.modal',
  'ui.bootstrap.progressbar',
  'ui.bootstrap.popover',
  'ui.bootstrap.tooltip',
  'ui.bootstrap.typeahead',
  'ui.bootstrap.tabs',
  'ui.select',
  'mgcrea.ngStrap',
  'mgcrea.ngStrap.tooltip',
  'mgcrea.ngStrap.popover',
  'elasticsearch',
  'smart-table'
]).
config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.when('/sivan', {
      templateUrl: 'partials/sivan',
      controller: 'IndexCtrl'
    });
    $routeProvider.otherwise({
      redirectTo: '/sivan'
    });
  }
]);

var BASE_URL = appConfig.rootUrl.prod;
app.run(['$log', '$http', '$rootScope', '$location',
  function($log, $http, $rootScope, $location) {
    var host = $location.host();
    var env = host.indexOf("shanti") != -1 ? "prod" : "dev";
    BASE_URL = (env == "dev") ? appConfig.rootUrl.dev : appConfig.rootUrl.prod;
    $log.info("Starting sivan with environment: [" + env + "]");
    $rootScope.angularConfig = {};
    $rootScope.angularConfig.environment = env;
    $rootScope.angularConfig.baseUrl = appConfig.rootUrl[env];
    $rootScope.graphiteConfig = appConfig.graphite;
  }
]);