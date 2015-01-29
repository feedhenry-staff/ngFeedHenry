'use strict';

module.exports = function (FHUtils, $window) {
  var ngSec = FHUtils.wrapApiFn($window.$fh.sec);

  /**
   * Generates a shorthand function to generate hashes of the given type.
   * @param  {String}   type Type of hash the created function will generate.
   * @return {Function}
   */
  function genSecFn(type) {
    return function (params) {
      // ngSec returns a promise when called
      return ngSec({
        act: type,
        params: params
      });
    };
  }

  ['keygen', 'encrypt', 'decrypt']
    .forEach(function (type) {
      ngSec[type] = genSecFn(type);
    });

  return ngSec;
};
