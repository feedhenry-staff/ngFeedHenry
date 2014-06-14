'use strict';

var services = require('./services');

module.exports = angular.module('ngFH', [
  // Need general angular deps
  'ng',

  // Our custom services
  services.name
]);
