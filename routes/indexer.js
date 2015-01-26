var config = require('../config');
var subversion = require('../lib/subversion');
var elasticsearch = require('../lib/elasticsearch');
var diff2html = require('../lib/diff2html');
var revisionUtils = require('../lib/revision-utils');
var indexer = require('../lib/indexer');
var maven = require('../lib/maven');
var async = require('async');
var moment = require('moment');
var _ = require('underscore');
var logger = require('../lib/logger').logger(module.filename);


var svnClient = new subversion();
var esClient = new elasticsearch();

exports.createIndex = function(req, res) {
  indexer.createIndex(function(err, results) {
    if (err) {
      logger.error("Error creating index [%s]", err);
      res.status(500);
      res.json(err);
    } else {
      logger.info("Finished creating index, results: [%s]", results);
      res.json(results);
    }
  });
};

exports.sync = function(req, res) {
  indexer.sync(function(err, results) {
    if (err && err.length > 0) {
      logger.error("Error syncing index [%s]", JSON.stringify(err));
      res.status(500);
      res.json(err);
    } else {
      logger.info("Finished syncing index, results: [%s]", results);
      res.json(results);
    }
  });
};

exports.fetchOrIndexDiff = function(req, res) {
  var revision = revisionUtils.denormalizeRevision(req.params.revision);
  indexer.fetchOrIndexDiff(revision, function(err, results) {
    if (results.docs && _.findWhere(results.docs, {
        found: false
      })) {
      indexer.indexDiff(req.params.revision, function(err, json) {
        res.json(json);
      });
    } else {
      res.json(_.pluck(results.docs, '_source'));
    }
  });
};

exports.indexDiff = function(req, res) {
  indexer.indexDiff(function(err, results) {
    res.json(results);
  });
}

exports.index = function(req, res) {
  indexer.index(req.params.revision, function(results) {
    res.json(results);
  })
};