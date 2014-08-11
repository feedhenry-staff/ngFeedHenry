'use strict';

module.exports = angular.module('ngFH')
  .service('Utils', ['$rootScope, $window', require('./Utils.js')])
  .service('FH.Cloud', ['Utils, FH.Log, $q, $timeout', require('./Cloud.js')])
  .service('FH.Act',
    [
      'Utils, FH.Log, $q, $window, $timeout',
      require('./Act.js')
    ]);
