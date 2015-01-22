'use strict';

module.exports = function factories (app) {
  app
    .factory('PreProcessors', require('./Preprocessors.js'));
};
