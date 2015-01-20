'use strict';

var fh = $fh // Once fh-js-sdk is on npm we can require it here
  , defaultTimeout = 30 * 1000;


/**
 * Service to represent FH.Act
 * @module Act
 */
module.exports = function (Utils, Log, $q, $timeout) {
  var log = Log.getLogger('FH.Act');

  // Error strings used for error type detection
  var ACT_ERRORS = {
    PARSE_ERROR: 'parseerror',
    NO_ACTNAME: 'act_no_action',
    UNKNOWN_ACT: 'no such function',
    INTERNAL_ERROR: 'internal error in',
    TIMEOUT: 'timeout'
  };


  /**
   * Exposed error types for checks by developers.
   * @public
   */
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
   * @private
   * @param   {String}      actname
   * @param   {Object}      res
   * @param   {Function}    callback
   * @returns {Object}
   */
  function parseSuccess(actname, res) {
    log.debug('Called "' + actname + '" successfully.');

    return res;
  }


  /**
   * Called when an act call has failed. Creates a meaningful error string.
   * @private
   * @param   {String}      actname
   * @param   {String}      err
   * @param   {Object}      details
   * @returns {Object}
   */
  function parseFail(actname, err, details) {
    var ERR = null;

    if (err === ACT_ERRORS.NO_ACTNAME) {
      ERR = ERRORS.NO_ACTNAME_PROVIDED;
    } else if (err !== 'error_ajaxfail') {
      ERR = ERRORS.UNKNOWN_ERROR;
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
      log.debug('"%s" encountered an error in it\'s cloud code. Error ' +
        'String: %s, Error Object: %o', actname, err, details);
      ERR = ERRORS.CLOUD_ERROR;
    }

    log.debug('"%s" failed with error %s', actname, ERR);

    return {
      type: ERR,
      err: err,
      msg: details
    };
  }


  /**
   * Call an action on the cloud.
   * @public
   * @param   {Object}      opts
   * @param   {Function}    [callback]
   * @returns {Promise|null}
   */
  this.request = function(opts) {
    var deferred = $q.defer()
      , success
      , fail;

    // Defer call so we can return promise first
    if (Utils.isOnline()) {
      log.debug('Making call with opts %j', opts);

      success = Utils.safeCallback(function (res) {
        deferred.resolve(parseSuccess(opts.act, res));
      });

      fail = Utils.safeCallback(function (err, msg) {
        deferred.reject(parseFail(opts.act, err, msg));
      });

      fh.act(opts, success, fail);
    } else {
      log.debug('Can\'t make act call, no netowrk. Opts: %j', opts);

      $timeout(function () {
        deferred.reject({
          type: ERRORS.NO_NETWORK,
          err: null,
          msg: null
        });
      });
    }

    return deferred.promise;
  };


  /**
   * Get the default timeout for Act calls in milliseconds
   * @public
   * @returns {Number}
   */
  this.getDefaultTimeout = function () {
    return defaultTimeout;
  };


  /**
   * Set the default timeout for Act calls in milliseconds
   * @public
   * @param {Number} t The timeout, in milliseconds, to use
   */
  this.setDefaultTimeout = function(t) {
    defaultTimeout = t;
  };


  /**
   * Disbale debugging logging by this service
   * @public
   */
  this.disableLogging = function() {
    log.setSilent(true);
  };

  /**
   * Enable debug logging by this service
   * @public
   */
  this.enableLogging = function() {
    log.setSilent(false);
  };
};
