module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options : {
                sourceMap: true
            },
            main: {
                files: { 'src/loggly.tracker.min.js': ['src/loggly.tracker.js'] }
            }
        }
	});

    grunt.loadNpmTasks('grunt-contrib-uglify');
    
	grunt.registerTask('default', ['uglify'] );

};