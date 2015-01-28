'use strict';

var xtend = require('xtend')
  , fhlog = require('fhlog')
  , fh = window.$fh // Once fh-js-sdk is on npm we can require it here
  , timeout = 30 * 1000;

var DEFAULT_OPTS = {
  type: 'GET',
  path: '/',
  timeout: timeout,
  contentType: 'application/json',
  data: {}
};

/**
 * Service to represent FH.Cloud
 * @module Cloud
 */
module.exports = function (Utils, Processors, $q, $timeout) {
  var log = fhlog.getLogger('FH.Cloud');

  this.before = Processors.before.bind(Processors);
  this.after = Processors.after.bind(Processors);

  /**
   * Perform the cloud request returning a promise or null.
   * @private
   * @param   {Object}    opts
   * @returns {Promise|null}
   */
  function cloudRequest (opts) {
    var deferred = $q.defer();

    // Define all options
    opts = xtend(DEFAULT_OPTS, opts);

    function doReq (updatedOpts) {
      fh.cloud(
        updatedOpts,
        Processors.execAfter(opts, deferred),
        deferred.reject
      );
    }

    // Defer call so we can return promise
    $timeout(function () {
      log.debug('Call with path: %s', opts.path);

      Processors.execBefore(opts)
        .then(doReq, deferred.reject, deferred.notify);
    }, 0);

    // Retrun promise or null
    return deferred.promise;
  }


  /**
   * Utility fn to save code duplication
   * @private
   * @param   {String} verb
   * @returns {Function}
   */
  function _genVerbFunc (verb) {
    return function (path, data) {
      return cloudRequest({
        path: path,
        data: data,
        type: verb.toUpperCase()
      });
    };
  }


  /**
   * Shorthand method for GET request.
   * @public
   * @function
   * @param   {String}  path
   * @param   {Mixed}   data
   * @returns {Promise|null}
   */
  this.get          = _genVerbFunc('GET');


  /**
   * Shorthand method for PUT request.
   * @public
   * @function
   * @param   {String}  path
   * @param   {Mixed}   data
   * @returns {Promise|null}
   */
  this.put          = _genVerbFunc('PUT');


  /**
   * Shorthand method for POST request.
   * @public
   * @function
   * @param   {String}  path
   * @param   {Mixed}   data
   * @returns {Promise|null}
   */
  this.post         = _genVerbFunc('POST');


  /**
   * Shorthand method for HEAD request.
   * @public
   * @function
   * @param   {String}  path
   * @param   {Mixed}   data
   * @returns {Promise|null}
   */
  this.head         = _genVerbFunc('HEAD');


  /**
   * Shorthand method for DELETE request.
   * @public
   * @function
   * @param   {String}  path
   * @param   {Mixed}   data
   * @returns {Promise|null}
   */
  this.del          = _genVerbFunc('DELETE');




  /**
   * Manually provide HTTP verb and all options as per SDK docs.
   * @public
   * @param   {Object}    opts      The options to use for the request
   * @returns {Promise|null}
   */
  this.request = function (opts) {
    return cloudRequest(opts);
  };


  /**
   * Get the default timeout for Cloud calls in milliseconds
   * @public
   * @returns {Number}
   */
  this.getDefaultTimeout = function () {
    return timeout;
  };


  /**
   * Set the default timeout for Cloud calls in milliseconds
   * @public
   * @param {Number} t New timeout value in milliseconds
   */
  this.setDefaultTimeout = function(t) {
    timeout = t;
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
