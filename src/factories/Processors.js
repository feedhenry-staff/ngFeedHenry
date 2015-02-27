'use strict';

var routeMatcher = require('route-matcher').routeMatcher;

module.exports = function Preprocessors ($q, $timeout) {

  return {
    // Used for ordering
    count: 0,

    preprocessors: {
      before: {
        '*': {
          stack: [],
          matcher: null
        }
      },
      after: {
        '*': {
          stack: [],
          matcher: null
        }
      }
    },

    reset: function () {
      this.preprocessors = {
        before: {
          '*': {
            stack: [],
            matcher: null
          }
        },
        after: {
          '*': {
            stack: [],
            matcher: null
          }
        }
      };
    },

    before: function (route, validators, fn) {
      this.use(this.preprocessors.before, route, validators, fn);
    },

    after: function (route, validators, fn) {
      this.use(this.preprocessors.after, route, validators, fn);
    },

    use: function (processors, route, validators, fn) {
      // Use this for all routes as no route was provided
      if (typeof route === 'function') {
        return processors['*'].stack.push({
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

      var existingMatch = this.getExistingEntryForRoute(processors, route);
      if (existingMatch) {
        existingMatch.stack.push({
          fn: fn,
          idx: this.count++
        });
      } else {
        var matcher = routeMatcher.call(routeMatcher, route, validators);

        processors[route] = {
          matcher: matcher,
          stack: [{
            fn:fn,
            idx: this.count++
          }]
        };
      }
    },


    getExistingEntryForRoute: function (processors, route) {
      for (var i in processors) {
        if (processors[i].matcher && processors[i].matcher.parse(route)) {
          return processors[i];
        }
      }

      return null;
    },


    getProcessorsForRoute: function (processors, route) {
      var requiredProcessors = [];

      for (var pattern in processors) {
        var cur = processors[pattern];

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


    execBefore: function (params) {
      var processors = this.getProcessorsForRoute(
        this.preprocessors.before, params.path);

      return this.exec(processors, params);
    },

    execAfter: function (params, deferred) {
      var self = this;
      var processors = this.getProcessorsForRoute(
        this.preprocessors.after, params.path);

      return function (res) {
        return self.exec(processors, res)
          .then(deferred.resolve, deferred.reject);
      };
    },

    exec: function (processors, params) {
      var deferred = $q.defer()
        , prev = null;

      // Processors are exectued in the order they were added
      processors.sort(function (a, b) {
        return (a.idx < b.idx) ? -1 : 1;
      });

      // Need to wait a little to ensure promise is returned in the event
      // that a preprocessor is synchronous
      $timeout(function () {
        if (processors.length === 0) {
          // No processors, just return the original data
          deferred.resolve(params);
        } else if (processors.length === 1) {
          // Run the single processor
          processors[0].fn(params)
            .then(deferred.resolve, deferred.reject, deferred.notify);
        } else {
          // Run the first preprocessor
          prev = processors[0].fn(params);

          // Run all processors in series from the first
          for (var i = 1; i < processors.length; i++) {
            var fn = processors[i].fn;
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
