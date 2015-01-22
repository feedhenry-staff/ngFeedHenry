'use strict';

module.exports = function services (app) {
  app
    .service('Utils', require('./Utils.js'))
    .service('Cloud', require('./Cloud.js'))
    .service('Act', require('./Act.js'));
};
