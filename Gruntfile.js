/*global module:false*/
module.exports = function(grunt) {

  var newname;

  newname = function(dest, src, ext) {
        return dest + src.substring(0, src.lastIndexOf('.')) + ext;
  };

  // Project configuration.
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    coffee: {
        build: {
            src: ['chrome/**/*.coffee'],
            dest: '',
            expand: true,
            rename: function (dest, src) {
                return newname(dest, src, '.js');
            }
        },
        options: {
            bare: false
        }
    },
    compress: {
        main: {
            options: {
                archive: 'GweezyShot.zip',
                mode: 'zip'
            },
            files: [
                {src: ['chrome/**']}
            ]
        }

    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-coffee');

  // Default task.
  grunt.registerTask('default', ['coffee', 'compress']);

};
