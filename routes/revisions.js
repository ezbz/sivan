var config = require('../config');
var subversion = require('../lib/subversion');
var elasticsearch = require('../lib/elasticsearch');
var revisionUtils = require('../lib/revision-utils');
var maven = require('../lib/maven');
var async = require('async');
var _ = require('underscore');
var logger = require('../lib/logger').logger(module.filename);

var svnClient = new subversion();
var esClient = new elasticsearch();

exports.find = function(req, res) {
  esClient.get({
    index: 'svn-revision',
    type: 'revision',
    data: revisionUtils.denormalizeRevision(req.params.revision)
  }, function(err, json) {
    res.json(json);
  });
};

exports.maxId = function(req, res) {
  esClient.maxId({
    index: 'svn-revision',
    type: 'revision'
  }, function(err, results) {
    console.log(results);
    res.json({maxId: parseInt(results.hits.hits[0]._id)});
  })
}

exports.revisionModules = function(req, res) {
  var normalizedRevision = revisionUtils.normalizeRevision(req.params.revision);
  fetchAffectedModules(normalizedRevision, function(err, modules) {
    res.json(modules);
  });
};

exports.revisionModulesDependants = function(req, res) {
  var normalizedRevision = revisionUtils.normalizeRevision(req.params.revision);
  fetchAffectedModules(normalizedRevision, function(err, modules) {
    async.map(modules, function(moduleId, aggregateCallback) {
      maven.dependants(moduleId, false, function(err, dependantModules) {
        var ids = _.pluck(dependantModules, 'id');
        aggregateCallback(err, modules.concat(ids));
      });
    }, function(err, results) {
      res.json(_.chain(results).flatten().uniq().value().sort());
    });
  });
};

module.exports.fetchAffectedModules = function(revision, callback) {
  svnClient.log(revision, function(err, revisions) {
    var modules = _.chain(revisions).map(function(revision) {
      return revisionUtils.fetchModulesFromFiles(revision.files);
    }).flatten().uniq().value().sort();
    callback(err, modules);
  });
}