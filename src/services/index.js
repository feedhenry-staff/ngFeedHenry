'use strict';

module.exports = function services (app) {
  app
    .service('FHUtils', require('./Utils.js'))
    .service('FHCloud', require('./Cloud.js'));
};
