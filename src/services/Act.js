'use strict';

/**
 * Angular shim for using $fh.act.
 * Works similar to $fh.act but supports promises and a Node.js
 * callback style instead
 */

var _ = require('underscore')
  , fh = $fh // Once fh-js-sdk is on npm we can require it here
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
  this.callFn = function(opts, callback) {
    var promise = null;

    // We need to use promises as user didn't provide a callback
    if (!callback) {
      promise = $q.defer();

      callback = function (err, res) {
        if (err) {
          promise.reject(err);
        } else {
          promise.resolve(res);
        }
      };
    }

    // Enforce default timeout
    opts.timeout = opts.timeout || defaultTimeout;

    Log.debug('$fh.act call with options: ', opts);

    // Defer call so we can return promise
    $timeout(function() {
      // Check are we online before trying the request
      // For unit tests simply assume we have a connection
      if ($window.navigator.onLine) {
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
  };

  /**
   * Get the default timeout for Act calls in milliseconds
   * @return {Number}
   */
  this.getDefaultTimeout = function () {
    return defaultTimeout;
  };


  /**
   * Set the default timeout for Act calls in milliseconds
   * @param {Number}
   */
  this.setDefaultTimeout = function(timeout) {
    defaultTimeout = timeout;
  };


  /**
   * Disbale debugging logging by this service
   */
  this.disableLogging = function() {
    printLogs = false;
  };

  /**
   * Enable debug logging by this service
   */
  this.enableLogging = function() {
    printLogs = true;
  };
};
