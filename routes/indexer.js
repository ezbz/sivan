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
      logger.info("Finished syncing index, synced [%s] revisions", results.length);
      res.json(results);
    }
  });
};

exports.fetchOrIndexRevision = function(req, res) {
  fetchOrIndexRevision(req.params.revision, function(err, results) {
    res.json(results);
  });
};

exports.fetchOrIndexDiff = function(req, res) {
  fetchOrIndexRevision(req.params.revision, function(err, results) {
    res.json(_.map(results, function(doc) {
      return doc.diff;
    }));
  });
};

function fetchOrIndexRevision(revisionId, callback) {
  var revision = revisionUtils.denormalizeRevision(revisionId);
  indexer.fetchRevision(revision, function(err, results) {
    if (results.docs && _.findWhere(results.docs, {
        found: false
      })) {
      indexer.index(req.params.revision, function(err, json) {
        callback(err, json);
      });
    } else {
      callback(err, _.pluck(results.docs, '_source'));
    }
  });
}

exports.index = function(req, res) {
  indexer.index(req.params.revision, function(err, results) {
    if (err.length) {
      logger.error("Error indexing revision [%s], [%s]", req.params.revision, JSON.stringify(err));
      res.status(500);
      res.json(err);
    } else {
      res.json(results);
    }
  })
};

exports.missing = function(req, res) {
  indexer.missing(function(err, ids) {
    if (err) {
      logger.error("Error getting missing revisions: [%s]", JSON.stringify(err));
      res.status(500);
      res.json(err);
    } else {
      res.json(ids);
    }
  })
};
exports.indexMissing = function(req, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-control": "no-cache"
  });
  indexer.indexMissing(function(iteratorResult) {
    res.write(JSON.stringify(iteratorResult));
  }, function(err, results) {
    if (err) {
      logger.error("Error getting missing revisions: [%s]", JSON.stringify(err));
      res.status(500);
      res.json(err);
    } else {
      res.end();
    }
  })
};