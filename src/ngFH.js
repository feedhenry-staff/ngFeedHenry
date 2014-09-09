'use strict';

// Register ngFH module
module.exports = angular.module('ngFH', ['ng']);

// Bind our modules to ngFH
require('./factories');
require('./services');
