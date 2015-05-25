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
  'angular-jqcloud',
  'hljs'
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

app.run(['$log', '$http', '$rootScope', '$location',
  function($log, $http, $rootScope, $location) {
  }
]);