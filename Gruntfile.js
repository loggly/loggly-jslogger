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
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.registerTask('default', ['uglify']);
};
