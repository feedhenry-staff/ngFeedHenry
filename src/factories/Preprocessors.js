'use strict';

var routeMatcher = require('route-matcher').routeMatcher;

module.exports = function Preprocessors ($q, $timeout) {

  return {
    // Used for ordering
    count: 0,

    preprocessors: {
      '*': {
        stack: [],
        matcher: null
      }
    },

    reset: function () {
      this.preprocessors = {
        '*': {
          stack: [],
          matcher: null
        }
      };
    },

    use: function (route, validators, fn) {
      // Use this for all routes as no route was provided
      if (typeof route === 'function') {
        return this.preprocessors['*'].stack.push({
          fn: route,
          idx: this.count++
        });
      }

      // Check has user provided validators for route params
      // and if not reassign vars accordingly
      if (typeof fn !== 'function') {
        fn = validators;
        validators = null;
      }

      var existingMatch = this.getExistingEntryForRoute(route);
      if (existingMatch) {
        existingMatch.stack.push({
          fn: fn,
          idx: this.count++
        });
      } else {
        var matcher = routeMatcher.call(routeMatcher, route, validators);

        this.preprocessors[route] = {
          matcher: matcher,
          stack: [{
            fn:fn,
            idx: this.count++
          }]
        }
      }
    },


    getExistingEntryForRoute: function (route) {
      var processors  = this.preprocessors;

      for (var i in processors) {
        if (processors[i].matcher && processors[i].matcher.parse(route)) {
          return processors[i];
        }
      }

      return null;
    },


    getProcessorsForRoute: function (route) {
      var requiredProcessors = [];

      for (var pattern in this.preprocessors) {
        var cur = this.preprocessors[pattern];

        if (pattern === '*') {
          // Star route, these always run so just add them in
          requiredProcessors = requiredProcessors.concat(cur.stack);
        } else if (cur.matcher.parse(route)) {
          // Given route matches this middleware pattern
          requiredProcessors = requiredProcessors.concat(cur.stack);
        }
      }

      return requiredProcessors;
    },


    exec: function (params) {
      var deferred = $q.defer()
        , prev = null
        , preprocessors = this.getProcessorsForRoute(params.path);

      // Processors are exectued in the order they were added
      preprocessors.sort(function (a, b) {
        return (a < b) ? -1 : 1;
      });

      // Need to wait a little to ensure promise is returned in the event
      // that a preprocessor is synchronous
      $timeout(function () {
        if (preprocessors.length === 0) {
          // No processors, just return the original data
          deferred.resolve(params);
        } else if (preprocessors.length === 1) {
          // Run the single processor
          preprocessors[0].fn(params)
            .then(deferred.resolve, deferred.reject, deferred.notify);
        } else {
          // Run the first preprocessor
          prev = preprocessors[0].fn(params);

          // Run all preprocessors in series from the first
          for (var i = 1; i < preprocessors.length; i++) {
            var fn = preprocessors[i].fn;
            prev = prev.then(fn, deferred.reject, deferred.notify);
          }

          // Ensure the final preprocessor can end the chain
          prev.then(deferred.resolve, deferred.reject, deferred.notify);
        }
      }, 1);

      return deferred.promise;
    }
  };
};
