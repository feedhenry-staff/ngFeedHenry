'use strict';

var _ = require('underscore')
  , fh = $fh
  , printLogs = true
  , timeout = 30 * 1000;

var DEFAULT_OPTS = {
  type: 'GET',
  path: '/cloud/',
  timeout: timeout,
  contentType: 'application/json',
  data: {}
};

module.exports = function (Utils, Log, $q, $timeout) {

  /**
   * Perform the cloud request.
   * @param {Object}    opts
   * @param {Function}  [callback]
   */
  function cloudRequest (opts, callback) {
    var promise = null;

    // Define all options
    opts = _.extend(DEFAULT_OPTS, opts);

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

    Log.debug('$fh.cloud call with options: ', opts);

    // Defer call so we can return promise
    $timeout(function () {
      fh.cloud(opts, Utils.onSuccess(callback), Utils.onFail(callback));
    }, 0);

    // Retrun promise or null
    return (promise !== null) ? promise.promise : null;
  }


  // Utility fn to save code duplication
  function _genVerbFunc (verb) {
    return function (path, data, callback) {
      return cloudRequest({
        path: path,
        data: data,
        type: verb.toUpperCase()
      }, callback);
    };
  }


  // Shorthand function for each HTTP verb
  this.GET      = _genVerbFunc('GET');
  this.PUT      = _genVerbFunc('PUT');
  this.POST     = _genVerbFunc('POST');
  this.HEAD     = _genVerbFunc('HEAD');
  this.DELETE   = _genVerbFunc('DELETE');


  /**
   * Manually provide HTTP verb and all options as per SDK docs
   * @param {Object}    opts
   * @param {Function}  callback
   */
  this.request = function (opts, callback) {
    return cloudRequest(opts, callback);
  };


  /**
   * Get the default timeout for Cloud calls in milliseconds
   * @return {Number}
   */
  this.getDefaultTimeout = function () {
    return timeout;
  };


  /**
   * Set the default timeout for Cloud calls in milliseconds
   * @param {Number} t
   */
  this.setDefaultTimeout = function(t) {
    timeout = t;
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
