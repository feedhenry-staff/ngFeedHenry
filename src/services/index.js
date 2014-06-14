'use strict';

module.exports = angular.module('ngFH', [])
  .service('Utils', require('./Utils.js'))
  .service('Log', require('./Log.js'))
  .service('Act', ['Utils, Log, $q, $window, $timeout', require('./Act.js')]);
