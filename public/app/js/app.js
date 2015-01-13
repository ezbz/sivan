'use strict';

var app = angular.module('sivan', [
  'ngRoute',
  'ngResource',
  'ngSanitize',
  'ngCookies',
  'ui.select',
  'ui.router',
  'ui.bootstrap',
  'ui.bootstrap.pagination',
  'mgcrea.ngStrap',
  'mgcrea.ngStrap.tooltip',
  'mgcrea.ngStrap.datepicker',
  'mgcrea.ngStrap.timepicker',
  'mgcrea.ngStrap.popover',
  'mgcrea.ngStrap.modal',
  'mgcrea.ngStrap.aside',
  'elasticsearch',
  'jsonFormatter',
  'highcharts-ng',
  'smart-table'
]).config(['$routeProvider',
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
var FLAT_URL = appConfig.flatUrl.prod;
var ES_URL = appConfig.esUrl.prod;
app.run(['$log', '$http', '$rootScope', '$location',
  function($log, $http, $rootScope, $location) {
    var host = $location.host();
    var env = host.indexOf("shanti") != -1 ? "prod" : "dev";
    BASE_URL = (env == "dev") ? appConfig.rootUrl.dev : appConfig.rootUrl.prod;
    FLAT_URL = (env == "dev") ? appConfig.flatUrl.dev : appConfig.flatUrl.prod;
    ES_URL = (env == "dev") ? appConfig.esUrl.dev : appConfig.esUrl.prod;
    $log.info("Starting sivan with environment: [" + env + "]");
    $rootScope.angularConfig = {};
    $rootScope.angularConfig.environment = env;
    $rootScope.angularConfig.baseUrl = appConfig.rootUrl[env];
    $rootScope.graphiteConfig = appConfig.graphite;
  }
]);