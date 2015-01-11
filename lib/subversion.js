var logger = require('./logger').logger(module.filename);
var SVN = require('./svn');
var config = require('../config');

subversion = function() {
  this.svn = new SVN({
    cwd: config.repository.path,
    debug: false
  });
};

subversion.prototype = {
  status: function(callback) {
    this.svn.status(callback);
  },
  update: function(callback) {
    this.svn.update(callback);
  },
  cleanup: function(callback) {
    this.svn.cleanup(".", callback);
  },
  info: function(callback) {
    this.svn.info(callback);
  },
  serverInfo: function(callback) {
    this.svn.info(config.svn.url, callback);
  },
  log: function(revision, callback) {
    this.svn.log('-r ' + revision, callback);
  },
  diffText: function(revision, callback) {
    this.svn.run(['diff', '-r', revision], function(err, text) {
      callback(err, text);
    });
  }
};

module.exports = subversion;