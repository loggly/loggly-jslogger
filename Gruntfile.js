module.exports = function (grunt) {
  var packageJson = grunt.file.readJSON('package.json');
  grunt.initConfig({
    pkg: packageJson,
    uglify: {
      options: {
        sourceMap: true,
        sourceMapName: 'dist/loggly.tracker-' + packageJson.version + '.min.map'
      },
      main: {
        files: [{
            src: 'src/loggly.tracker.js',
            dest: 'dist/loggly.tracker-' + packageJson.version + '.min.js'
          }]
      },
    },
    copy: {
      main: {
        files: [{
          expand: true,
          cwd: 'src',
          src: 'loggly.tracker.js',
          dest: 'dist/',
        },{
          expand: true,
          src: 'src/loggly.tracker.js',
          rename: function () {
            return 'dist/loggly.tracker-latest.js';
          }
        },{
          expand: true,
          src: 'src/loggly.tracker.js',
          rename: function () {
            return 'dist/loggly.tracker-' + packageJson.version + '.js';
          }
        },{
          expand: true,
          src: 'dist/loggly.tracker-' + packageJson.version + '.min.map',
          rename: function () {
            return 'dist/loggly.tracker-latest.min.map';
          }
        },{
          expand: true,
          src: 'dist/loggly.tracker-' + packageJson.version + '.min.js',
          rename: function () {
            return 'dist/loggly.tracker-latest.min.js';
          }
        }
        ]
      }
    },
  });
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.registerTask('default', ['uglify', 'copy']);
};
