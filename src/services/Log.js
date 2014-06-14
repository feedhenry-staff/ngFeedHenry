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

module.exports = function ($window) {

  /**
   * Log output to the console.
   * @param {Number}  lvl
   * @param {Array}   args
   */
  function log (lvl, args) {
    args = Array.prototype.slice.call(args);

    // Add a timestamp
    args.unshift(new Date().toISOString());

    switch (lvl) {
      case LEVELS.DEBUG:
        $window.console.debug.apply(console, args);
        break;
      case LEVELS.INFO:
        $window.console.info.apply(console, args);
        break;
      case LEVELS.WARN:
        $window.console.warn.apply(console, args);
        break;
      case LEVELS.ERROR:
        $window.console.error.apply(console, args);
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
