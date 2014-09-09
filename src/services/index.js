'use strict';

module.exports = angular.module('ngFH')
  .service('Utils', require('./Utils.js'))
  .service('Cloud', require('./Cloud.js'))
  .service('Act', require('./Act.js'));
