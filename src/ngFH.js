'use strict';

// Register ngFH module
var ngModule = angular.module('ngFeedHenry', ['ng']);

// Bind our modules to ngFH
require('./factories')(ngModule);
require('./services')(ngModule);

module.exports = 'ngFeedHenry';
