'use strict';

var _ = require('underscore')
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

module.exports = function (Utils, FHLog, $q, $timeout) {
  var log = FHLog.getLogger('Act');

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

    log.debug('Call with options: %j', opts);

    // Defer call so we can return promise
    $timeout(function () {
      fh.cloud(opts, Utils.onSuccess(callback), Utils.onFail(callback));
    }, 0);

    // Retrun promise or null
    return (promise !== null) ? promise.promise : null;
  }


  /**
   * @private
   * Utility fn to save code duplication
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
   * @public
   * Shorthand method for GET request.
   * @param   {String}  path
   * @param   {Mixed}   data
   * @returns {Promise|null}
   */
  this.get          = _genVerbFunc('GET');


  /**
   * @public
   * Shorthand method for PUT request.
   * @param   {String}  path
   * @param   {Mixed}   data
   * @returns {Promise|null}
   */
  this.put          = _genVerbFunc('PUT');


  /**
   * @public
   * Shorthand method for POST request.
   * @param   {String}  path
   * @param   {Mixed}   data
   * @returns {Promise|null}
   */
  this.post         = _genVerbFunc('POST');


  /**
   * @public
   * Shorthand method for HEAD request.
   * @param   {String}  path
   * @param   {Mixed}   data
   * @returns {Promise|null}
   */
  this.head         = _genVerbFunc('HEAD');


  /**
   * @public
   * Shorthand method for DELETE request.
   * @param   {String}  path
   * @param   {Mixed}   data
   * @returns {Promise|null}
   */
  this['delete']    = _genVerbFunc('DELETE');




  /**
   * @public
   * Manually provide HTTP verb and all options as per SDK docs.
   * @param   {Object}    opts      The options to use for the request
   * @param   {Function}  callback  Callback function
   * @returns {Promise|null}
   */
  this.request = function (opts, callback) {
    return cloudRequest(opts, callback);
  };


  /**
   * @public
   * Get the default timeout for Cloud calls in milliseconds
   * @returns {Number}
   */
  this.getDefaultTimeout = function () {
    return timeout;
  };


  /**
   * @public
   * Set the default timeout for Cloud calls in milliseconds
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
   * @public
   * Enable debug logging by this service
   */
  this.enableLogging = function() {
    printLogs = true;
  };
};
