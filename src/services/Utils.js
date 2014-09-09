'use strict';

module.exports = function ($rootScope, $window) {

  /**
   * Safely call a function that modifies variables on a scope.
   * @public
   * @param {Function} fn
   */
  var safeApply = this.safeApply = function (fn, args) {
    var phase = $rootScope.$$phase;

    if (phase === '$apply' || phase === '$digest') {
      if (args) {
        fn.apply(fn, args);
      } else {
        fn();
      }
    } else {
      if (args) {
        $rootScope.$apply(function () {
          fn.apply(fn, args);
        });
      } else {
        $rootScope.$apply(fn);
      }
    }
  };


  /**
   * Wrap a callback for safe execution.
   * If the callback does further async work then this may not work.
   * @param   {Function} callback
   * @returns {Function}
   */
  this.safeCallback = function (callback) {
    return function () {
      var args = Array.prototype.slice.call(arguments);

      safeApply(function () {
        callback.apply(callback, args);
      });
    };
  };


  /**
   * Check for an internet connection.
   * @public
   * @returns {Boolean}
   */
  this.isOnline = function () {
    return $window.navigator.onLine;
  };


  /**
   * Wrap a success callback in Node.js style.
   * @public
   * @param   {Function}
   * @returns {Boolean}
   */
  this.onSuccess = function (fn) {
    return function (res) {
      safeApply(function () {
        fn (null, res);
      });
    };
  };


  /**
   * Wrap a fail callback in Node.js style.
   * @public
   * @param   {Function}
   * @returns {Boolean}
   */
  this.onFail = function (fn) {
    return function (err) {
      safeApply(function () {
        fn (err, null);
      });
    };
  };

};
