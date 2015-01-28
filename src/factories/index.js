'use strict';

module.exports = function factories (app) {
  app
    .factory('Processors', require('./Processors.js'));
};
