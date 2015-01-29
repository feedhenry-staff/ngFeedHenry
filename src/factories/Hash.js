'use strict';

module.exports = function (FHUtils, $window) {
  var ngHash = FHUtils.wrapApiFn($window.$fh.hash);

  /**
   * Generates a shorthand function to generate hashes of the given type.
   * @param  {String}   type Type of hash the created function will generate.
   * @return {Function}
   */
  function genHashFn(type) {
    return function (text) {
      // ngHash returns a promise when called
      return ngHash({
        algorithm: type,
        text: text
      });
    };
  }

  // Shortcut functions to generate
  ['MD5', 'SHA1', 'SHA256', 'SHA512']
    .forEach(function (type) {
      ngHash[type] = genHashFn(type);
    });

  return ngHash;
};
