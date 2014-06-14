'use strict';

module.exports = angular.module('ngFH', [])
  .service('Utils', ['$rootScope', require('./Utils.js')])
  .service('Log',   ['$window', require('./Log.js')])
  .service('Act',   ['Utils, Log, $q, $window, $timeout', require('./Act.js')]);
