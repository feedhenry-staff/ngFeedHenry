'use strict';

// Register ngFH module
var app = module.exports = angular.module('ngFeedHenry', ['ng']);

// Bind our modules to ngFH
require('./factories')(app);
require('./services')(app);
