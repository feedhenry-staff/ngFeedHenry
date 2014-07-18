'use strict';

var services = require('./services')
  , factories = require('./factories');

module.exports = angular.module('ngFH', [
  // Need general angular deps
  'ng',

  // Our custom components
  factories.name
  services.name,
]);
