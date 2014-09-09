
module.exports = function(config) {
  config.set({

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai'],


    // list of files / patterns to load in the browser
    // we need angular and it's mocks for testing/loading modules
    files: [
      './bower_components/angular/angular.js',
      './bower_components/angular-mocks/angular-mocks.js',
      './node_modules/fh-mocks/dist/fh-mocks.js',
      './test/bundle.js',
      './test/**/*.js'
    ],

    reporters: ['mocha'],
    port: 9876,
    colors: true,
    logLevel: 'DEBUG',
    captureTimeout: 60000,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true
  });
};
