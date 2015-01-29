'use strict';

module.exports = function factories (app) {
  app
    .factory('Processors', require('./Processors.js'))
    .factory('FHSec', require('./Sec.js'))
    .factory('FHHash', require('./Hash.js'));
};
