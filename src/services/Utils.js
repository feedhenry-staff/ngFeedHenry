'use strict';

module.exports = function ($rootScope) {

  /**
   * Safely call a function that modifies variables on a scope.
   * @param {Function} fn
   */
  var safeApply = this.safeApply = function (fn) {
    var phase = $rootScope.$$phase;

    if (phase === '$apply' || phase === '$digest') {
      if (fn && typeof fn === 'function') {
        fn();
      }
    } else {
      $rootScope.$apply(fn);
    }
  };


  /**
   * Check for an internet connection
   */
  this.isOnline = function () {
    return $window.navigator.onLine;
  };


  /**
   * Wrap a success callback in Node.js style.
   * @param {Function}
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
   * @param {Function}
   */
  this.onFail = function (fn) {
    return function (err) {
      safeApply(function () {
        fn (err, null);
      });
    };
  };

};
