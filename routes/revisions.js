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
    index: config.elasticsearch.indexName,
    type: config.elasticsearch.indexType,
    data: revisionUtils.denormalizeRevision(req.params.revision)
  }, function(err, json) {
    res.json(json);
  });
};

exports.maxId = function(req, res) {
  esClient.maxId({
    index: config.elasticsearch.indexName,
    type: config.elasticsearch.indexType
  }, function(err, results) {
    var maxId = 0;
    if (results.hits && results.hits.hits[0]) {
      maxId = parseInt(results.hits.hits[0]._id);
    }
    res.json({
      maxId: maxId
    });
  })
}