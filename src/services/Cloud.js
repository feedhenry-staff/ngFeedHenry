'use strict';

var xtend = require('xtend')
  , fh = $fh // Once fh-js-sdk is on npm we can require it here
  , printLogs = true
  , timeout = 30 * 1000;

var DEFAULT_OPTS = {
  type: 'GET',
  path: '/cloud/',
  timeout: timeout,
  contentType: 'application/json',
  data: {}
};

/**
 * Service to represent FH.Cloud
 * @module Cloud
 */
module.exports = function (Utils, FHLog, $q, $timeout) {
  var log = FHLog.getLogger('FH.Cloud');

  /**
   * Perform the cloud request returning a promise or null.
   * @private
   * @param   {Object}    opts
   * @param   {Function}  [callback]
   * @returns {Promise|null}
   */
  function cloudRequest (opts, callback) {
    var promise = null;

    // Define all options
    opts = xtend(DEFAULT_OPTS, opts);

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

    // Defer call so we can return promise
    $timeout(function () {
      log.debug('Call with options: %j', opts);

      fh.cloud(opts, Utils.onSuccess(callback), Utils.onFail(callback));
    }, 0);

    // Retrun promise or null
    return (promise !== null) ? promise.promise : null;
  }


  /**
   * Utility fn to save code duplication
   * @private
   * @param   {String} verb
   * @returns {Function}
   */
  function _genVerbFunc (verb) {
    return function (path, data, callback) {
      return cloudRequest({
        path: path,
        data: data,
        type: verb.toUpperCase()
      }, callback);
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
  this['delete']    = _genVerbFunc('DELETE');




  /**
   * Manually provide HTTP verb and all options as per SDK docs.
   * @public
   * @param   {Object}    opts      The options to use for the request
   * @param   {Function}  callback  Callback function
   * @returns {Promise|null}
   */
  this.request = function (opts, callback) {
    return cloudRequest(opts, callback);
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
    printLogs = false;
  };


  /**
   * Enable debug logging by this service
   * @public
   */
  this.enableLogging = function() {
    printLogs = true;
  };
};
