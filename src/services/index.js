'use strict';

module.exports = angular.module('ngFH')
  .service('Utils', ['$rootScope', require('./Utils.js')])
  .service('FH.Cloud', ['Utils, Log, $q, $timeout', require('./Cloud.js')])
  .service('FH.Act',   ['Utils, Log, $q, $window, $timeout', require('./Act.js')]);
