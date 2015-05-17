var config = require('../config');
var subversion = require('../lib/subversion');
var elasticsearch = require('../lib/elasticsearch');
var revisionUtils = require('../lib/revision-utils');
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
    res.json({maxId: parseInt(results.hits.hits[0]._id)});
  })
}