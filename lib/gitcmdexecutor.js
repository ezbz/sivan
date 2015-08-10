var config = require('../config');
var logger = require('./logger').logger(module.filename);
var spawn = require('child_process').spawn;

gitcmdexecutor = function() {};

gitcmdexecutor.prototype = {
    execute: function(command, args, callback) {
        var args = [].concat([command]).concat(args);
        var result = "";
        var err = null;
        // exec command
        var process = spawn('git', args, {
            cwd: config.repository.path
        });


        process.stdout.on('data', function(data) {
            result += String(data);
        });

        process.stderr.on('data', function(data) {
            data = String(data);
            err = new Error(data);
        });

        process.on('error', function(error) {
            console.log(error);
            err = new Error('ERROR: git command not found');
            if (error.code === 'ENOENT' && callback) {
                callback(err, result);
            }else{
                callback(error, result);
            }
        });

        process.on('close', function(code) {
            callback(err, result);
        });
    }
};


module.exports = gitcmdexecutor;
