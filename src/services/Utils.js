'use strict';

module.exports = function ($rootScope, $timeout, $window, $q) {

  /**
   * General purpose wrapper for any API function to promise enable it.
   * @param  {Function} apiFn The function to wrap.
   * @return {Function}
   */
  this.wrapApiFn = function (apiFn) {
    return function (params) {
      var defer = $q.defer();

      $timeout(function () {
        apiFn(params, function (res) {
          defer.resolve(res);
        }, defer.reject);
      });

      return defer.promise;
    };
  };

};
