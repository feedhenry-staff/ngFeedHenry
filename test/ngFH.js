(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var services = require('./services');

module.exports = angular.module('ngFH', [
  // Need general angular deps
  'ng',

  // Our custom services
  services.name
]);

},{"./services":5}],2:[function(require,module,exports){
'use strict';

var fh = $fh
  , printLogs = true
  , defaultTimeout = 20 * 1000;

module.exports = function(Utils, Log, $q, $window, $timeout) {

  // Error strings used for error type detection
  var ACT_ERRORS = {
    PARSE_ERROR: 'parseerror',
    NO_ACTNAME: 'act_no_action',
    UNKNOWN_ACT: 'no such function',
    INTERNAL_ERROR: 'internal error in',
    TIMEOUT: 'timeout'
  };

  // Expose error types for checks by user
  var ERRORS = this.ERRORS = {
    NO_ACTNAME_PROVIDED: 'NO_ACTNAME_PROVIDED',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    UNKNOWN_ACT: 'UNKNOWN_ACT',
    CLOUD_ERROR: 'CLOUD_ERROR',
    TIMEOUT: 'TIMEOUT',
    PARSE_ERROR: 'PARSE_ERROR',
    NO_NETWORK: 'NO_NETWORK'
  };


  /**
   * Called on a successful act call (when main.js callback is called with a
   * null error param)
   * It is assumed if a request could not be fulfilled
   * res.errors will be defined.
   * @param {String}      actname
   * @param {Object}      res
   * @param {Function}    callback
   */
  function parseSuccess(actname, res) {
    Log.debug('Called "' + actname + '" successfully.');

    return res;
  }


  /**
   * Called when an act call has failed.
   * Tries to create a meaningful error string.
   * @param {String}      actname
   * @param {String}      err
   * @param {Object}      details
   * @param {Function}    callback
   */
  function parseFail(actname, err, details) {
    var ERR = null;

    if (err === ACT_ERRORS.NO_ACTNAME) {
      ERR = ERRORS.NO_ACTNAME_PROVIDED;
    } else if (err !== 'error_ajaxfail') {
      ERR = ERRORS.UKNOWN_ERROR;
    } else if (err === ERRORS.NO_ACTNAME_PROVIDED) {
      ERR = ERRORS.NO_ACTNAME_PROVIDED;
    } else if (
      details.error.toLowerCase().indexOf(ACT_ERRORS.UNKNOWN_ACT) >= 0) {
      ERR = ERRORS.UNKNOWN_ACT;
    } else if (
      details.message.toLowerCase().indexOf(ACT_ERRORS.TIMEOUT) >= 0) {
      ERR = ERRORS.TIMEOUT;
    } else if (details.message === ACT_ERRORS.PARSE_ERROR) {
      ERR = ERRORS.PARSE_ERROR;
    } else {
      // Cloud code sent error to it's callback
      Log.debug('"%s" encountered an error in it\'s cloud code. Error ' +
        'String: %s, Error Object: %o', actname, err, details);
      ERR = ERRORS.CLOUD_ERROR;
    }

    Log.debug('"%s" failed with error %s', actname, ERR);

    return {
      type: ERR,
      err: err,
      msg: details
    };
  }

  /**
   * Returns a successful act call.
   * @param {Mixed} res
   * @param {Promise} [promise]
   * @param {Function} [callback]
   */
  function resolve(res, promise, callback) {
    Utils.safeApply(function() {
      if (callback) {
        callback(null, res);
      } else {
        promise.resolve(res);
      }
    });
  }


  /**
   * Returns a failed act call.
   * @param {Mixed} res
   * @param {Promise} [promise]
   * @param {Function} [callback]
   */
  function reject(err, promise, callback) {
    Utils.safeApply(function() {
      if (callback) {
        callback(err, null);
      } else {
        promise.reject(err);
      }
    });
  }


  /**
   * Call an action on the cloud.
   * @param {String}      actname
   * @param {Object}      [params]
   * @param {Function}    [callback]
   * @param {Number}      [timeout]
   */
  this.callFn = function(actname, params, cb, timeout) {
    var promise = null,
      callback = null,
      args = Array.prototype.slice.call(arguments);

    // Find a callback if one exists
    for (var i in args) {
      if (typeof args[i] === 'function') {
        // User provided a callback
        callback = args[i];
      }
    }

    if (callback) {
      // Ensure we don't provde a function to req of $fh.act
      if (params === callback) {
        params = null;
      }
    } else {
      promise = $q.defer();
    }

    // $fh.act parameters object
    var opts = {
      act: actname,
      req: params,
      timeout: timeout || defaultTimeout
    };

    // Wait a bit before calling so we can return the promise
    $timeout(function() {
      // Check are we online before trying the request
      // For unit tests simply assume we have a connection
      if ($window.navigator.onLine === true || window.mochaPhantomJS) {
        Log.debug('Calling "' + actname + '" cloud side function.');

        fh.act(opts, function(res) {
          resolve(parseSuccess(actname, res), promise, callback);
        }, function(err, msg) {
          reject(parseFail(actname, err, msg), promise, callback);
        });
      } else {
        Log.debug('Could not call "' + actname + '". No network connection.');

        reject({
          type: ERRORS.NO_NETWORK,
          err: null,
          msg: null
        }, promise, callback);
      }
    }, 0);

    if (promise !== null) {
      return promise.promise;
    }
  };

  this.getDefaultTimeout = function () {
    return defaultTimeout;
  };

  this.setDefaultTimeout = function(timeout) {
    defaultTimeout = timeout;
  };

  // Disable internal logging by this service.
  this.disableLogging = function() {
    printLogs = false;
  };

  // Disable internal logging by this service.
  this.enableLogging = function() {
    printLogs = true;
  };
};

},{}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
'use strict';

module.exports = function ($rootScope) {

  /**
   * Safely call a function that modifies variables on a scope.
   * @param {Function} fn
   */
  this.safeApply = function (fn) {
    var phase = $rootScope.$$phase;

    if (phase === '$apply' || phase === '$digest') {
      if (fn && typeof fn === 'function') {
        fn();
      }
    } else {
      $rootScope.$apply(fn);
    }
  };


};

},{}],5:[function(require,module,exports){
'use strict';

module.exports = angular.module('ngFH', [])
  .service('Utils', require('./Utils.js'))
  .service('Log', require('./Log.js'))
  .service('Act', ['Utils, Log, $q, $window, $timeout', require('./Act.js')]);

},{"./Act.js":2,"./Log.js":3,"./Utils.js":4}]},{},[2,3,4,5,1])