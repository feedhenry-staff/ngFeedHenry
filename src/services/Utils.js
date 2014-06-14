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
