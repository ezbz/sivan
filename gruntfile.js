module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: ["build", "app/dist"],
    ngAnnotate: {
      options: {
        singleQuotes: true,
      },
      build: {
        expand: true,
        cwd: 'public/app',
        src: ['js/**/*.js'],
        dest: 'build/ngAnnotate'
      }
    },
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        files: {
          'build/dist/main.js': ['build/ngAnnotate/js/**/*.js'],
        }

      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: [{
          src: 'build/dist/main.js',
          dest: 'build/dist/main.min.js'
        }]
      }
    },
    jshint: {
      files: ['gruntfile.js' /*, 'app/js/*.js' */ ],
      options: {
        globals: {
          jQuery: true,
          console: true,
          module: true
        }
      }
    },
    stylus: {
      compile: {
        files: {
          'public/app/css/app.css': ['public/app/css/app.styl']
        }
      }
    },
    cssmin: {
      add_banner: {
        options: {
          banner: '/* minified css files */'
        },
        files: {
          'build/dist/main.min.css': ['public/app/css/**/*.css']
        }
      }
    },
    watch: {
      files: ['public/app/js/**/*.js', 'public/app/css/**/*.styl', 'views/**/*.jade'],
      tasks: ['clean', 'copy:libs', 'jshint', 'ngAnnotate', 'concat', 'uglify', 'stylus', 'cssmin', 'copy:main']
    },
    bower: {
      dev: {
        dest: 'dist/',
        options: {
          basePath: 'components/'
        }
      }
    },
    copy: {
      main: {
        files: [{
          expand: true,
          flatten: true,
          src: ['build/dist/**'],
          dest: 'public/app/dist/',
          filter: 'isFile'
        }]
      },
      libs: {
        css: [{
          expand: true,
          flatten: false,
          cwd: 'bower_components',
          src: ['font-awesome/css/font-awesome.css',
            'toastr/toastr.css',
            'jquery.easy-pie-chart/jquery.easy-pie-chart.css',
            'angular/angular.js',
            'angular-resource/angular-resource.js',
            'raphael/raphael.js',
            'jquery/jquery.js',
            'jquery.ui/ui/*.js',
            'jquery.ui/themes/base/jquery.ui.all.css',
            'underscore/underscore.js',
            'select2/select2.js',
            'select2/select2.css',
            'jquery.cookie/jquery.cookie.js',
            'bootstrap-lightbox/js/bootstrap-lightbox.js',
            'moment/moment.js',
          ],
          dest: 'app/lib/'
        }]
      }
    }
  });

  // Libraries
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-stylus');
  grunt.loadNpmTasks('grunt-ng-annotate');
  grunt.loadNpmTasks('grunt-bower');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-clean');

  // Default Tasks
  grunt.registerTask('default', ['clean', 'copy:libs', 'jshint', 'ngAnnotate', 'concat', 'uglify', 'stylus', 'cssmin', 'copy:main']);

  grunt.registerTask('build', ['copy:main']);

};