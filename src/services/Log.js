'use strict';

/**
 * Wrapper for the console object.
 * Should behave the same as console.METHOD
 *
 * This has the added benefit of tracking logs and can upload logs to the
 * cloud instance of an application. (Not yet!)
 */

var LEVELS = {
  'INFO': 0,
  'DEBUG': 1,
  'WARN': 2,
  'ERROR': 3
};

module.exports = function () {

  function log (lvl, args) {
    args = Array.prototype.slice.call(args);

    // Add a timestamp
    args.unshift(new Date().toISOString());

    switch (lvl) {
      case LEVELS.DEBUG:
        console.debug(args);
        break;
      case LEVELS.INFO:
        console.info(args);
        break;
      case LEVELS.WARN:
        console.warn(args);
        break;
      case LEVELS.ERROR:
        console.error(args);
        break;
    }
  }

  this.debug = function () {
    log(LEVELS.DEBUG, arguments);
  };

  this.info = function () {
    log(LEVELS.INFO, arguments);
  };

  this.warn = function () {
    log(LEVELS.WARN, arguments);
  };

  this.err = function () {
    log(LEVELS.ERROR, arguments);
  };
  this.error = this.err;
};
