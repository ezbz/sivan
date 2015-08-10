var logger = require('./logger').logger(module.filename);
var SVN = require('./svn');
var config = require('../config');
var revisionUtils = require('./revision-utils');

subversion = function() {
  this.svn = new SVN({
    cwd: config.repository.path,
    debug: config.svn.debug
  });
};

subversion.prototype = {
  status: function(callback) {
    this.svn.status(callback);
  },
  cat: function(params, callback) {
    this.svn.run(['cat', '-r', params.revision, params.path], function(err, text) {
      callback(err, text);
    });
  },
  update: function(callback) {
    this.svn.update(callback);
  },
  cleanup: function(callback) {
    this.svn.cleanup(config.repository.path, callback);
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
    var normalizedRevision = revisionUtils.normalizeRevision(revision);
    this.svn.run(['diff', '-r', normalizedRevision], function(err, text) {
      callback(err, text);
    });
  },
  shouldIndex: function(maxIndexedId, serverRevision) {
    return null == maxIndexedId || parseInt(maxIndexedId) < parseInt(serverRevision)
  },
  revisionToIndex: function(maxIndexedId, serverRevision) {
    maxIndexedId = (null == maxIndexedId) ? 0 : maxIndexedId;
    return maxIndexedId + ':' + serverRevision
  }
};

module.exports = subversion;