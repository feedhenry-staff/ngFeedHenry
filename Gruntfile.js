'use strict';

module.exports = function(grunt) {
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    shell: {
      'bower-install': {
        command: 'bower install'
      },
      'browserify-debug': {
        command: 'browserify ./src/**/*.js -e ./src/ngFH.js -o ./test/ngFH.js'
      },
      'browserify-dist': {
        command: 'browserify ./src/**/*.js -e ./src/ngFH.js -o ./dist/ngFH.js'
      }
    },

    column_lint: {
      files: {
        src: ['./src/**/*.js']
      }
    },

    jshint: {
      src: ['Gruntfile.js', './src/**/*.js'],
      options: {
        jshintrc: './jshintrc.js'
      }
    },

    lintspaces: {
      javascript: {
        src: ['./src/**/*.js'],
        options: {
          // TODO: Reference editorconfig
          indentation: 'spaces',
          spaces: 2,
          newline: true,
          trailingspaces: true,
          ignores: ['js-comments']
        }
      }
    },

    karma: {
      browsers: {
        configFile: './karma.conf.js'
      }
    },
  });


  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-lintspaces');
  grunt.loadNpmTasks('grunt-column-lint');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('test', ['build', 'karma']);
  grunt.registerTask('build', ['shell:bower-install', 'shell:browserify-debug']);
  grunt.registerTask('format', ['lintspaces', 'jshint']);
  grunt.registerTask('serve', ['browserSync', 'watch']);
};
