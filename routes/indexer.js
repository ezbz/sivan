var config = require('../config');
var subversion = require('../lib/subversion');
var elasticsearch = require('../lib/elasticsearch');
var diff2html = require('../lib/diff2html');
var revisionUtils = require('../lib/revision-utils');
var maven = require('../lib/maven');
var async = require('async');
var moment = require('moment');
var _ = require('underscore');
var logger = require('../lib/logger').logger(module.filename);


var svnClient = new subversion();
var esClient = new elasticsearch();



exports.createIndex = function() {
  async.series([
    function(callback) {
      esClient.createIndex('svn-revision', callback);
    },
    function(callback) {
      esClient.waitForStatus('svn-revision', 'green', callback);
    },
    function(callback) {
      esClient.closeIndex('svn-revision', callback);
    },
    function(callback) {
      esClient.putSettings('svn-revision', config.elasticsearch.revision.settings, callback);
    },
    function(callback) {
      esClient.putMappings('svn-revision', 'revision', config.elasticsearch.revision.mappings, callback);
    },
    function(callback) {
      esClient.openIndex('svn-revision', callback);
    },
    function(callback) {
      esClient.waitForStatus('svn-revision', 'green', callback);
    },

  ], function(err, results) {
    if (err) {
      logger.error("Error creating index [%s]", err);
    }
    logger.info("Finished creating index, results: [%s]", results);
  });
};


exports.indexDiff = function(req, res) {
  var currentDiffsFetched = 0;
  var currentDiffsIndexed = 0;
  var revisionDiffQueue = async.queue(function(revisions, queueCallback) {
    currentDiffsFetched += revisions.length;
    logger.trace('Fetched diffs for [%s/%s] revisions', currentDiffsFetched, resultRevisions.length);

    async.mapLimit(revisions, config.svn.commandParallelism, function(revision, aggregateCallback) {
      var revisionRange = revisionUtils.normalizeRevision(revision.revision);
      svnClient.diffText(revisionRange, function(err, text) {
        if (err) {
          logger.error(err);
          aggregateCallback(null, {
            revision: revision.revision,
            diff: {}
          });
        } else {
          var diff = diff2html.getJsonFromDiff(text);
          aggregateCallback(null, {
            revision: revision.revision,
            diff: diff
          });
        }
      });
    }, function(err, aggregateDiffs) {
      indexDiffQueue.push({
        diffs: aggregateDiffs
      });
      queueCallback(err);
    });
  }, config.svn.commandParallelism);

  revisionDiffQueue.drain = function() {
    res.json({
      success: true
    });
  }


  var indexDiffQueue = async.queue(function(task, queueCallback) {
    currentDiffsIndexed += task.diffs.length;
    logger.trace('Indexed [%s/%s] diffs', currentDiffsIndexed, resultRevisions.length);

    esClient.bulkIndex({
      index: 'svn-diffs',
      type: 'diff',
      data: task.diffs,
      idResolver: function(entry) {
        return entry ? entry.revision : "";
      },
    }, function(err, response) {
      if (err) {
        logger.error(err);
      }
      queueCallback(err);
    });
  }, config.svn.commandParallelism);

  var denormalizedRevision = revisionUtils.denormalizeRevision(req.params.revision);
  var chunks = toChunks(enrichedRevisions, config.svn.maxChunkSize);
  logger.trace("Divided [%s] revisions to [%s] chunks", revisions.length, chunks.length);
  revisionDiffQueue.push(chunks);

};
exports.index = function(req, res) {
  var resultRevisions = [];
  var currentRevisionsIndexed = 0;

  var indexRevisionsQueue = async.queue(function(revisions, queueCallback) {
    currentRevisionsIndexed += revisions.length;
    logger.trace('Indexed [%s/%s] revisions', currentRevisionsIndexed, resultRevisions.length);
    esClient.bulkIndex({
      index: 'svn-revision',
      type: 'revision',
      data: revisions,
      idResolver: function(entry) {
        return entry ? entry.revision : "";
      },
    }, function(err, response) {
      if (err) {
        logger.error(err);
      }
      queueCallback(err);
    });
  }, config.svn.commandParallelism);


  var normalizedRevision = revisionUtils.normalizeRevision(req.params.revision);
  logger.trace('Fetching revisions for [%s]', normalizedRevision);
  svnClient.log(normalizedRevision, function(err, revisions) {

    logger.trace('Indexing [%s] revisions', revisions.length);
    var enrichedRevisions = _.map(revisions, function(revision) {
      return revisionUtils.enrichRevision(revision);
    });
    resultRevisions = enrichedRevisions;

    var chunks = toChunks(enrichedRevisions, config.svn.maxChunkSize);
    logger.trace("Divided [%s] revisions to [%s] chunks", revisions.length, chunks.length);
    indexRevisionsQueue.push(chunks);
  });

  indexRevisionsQueue.drain = function() {
    res.json(resultRevisions);
  }
};

function toChunks(data, n) {
  return _.chain(data).groupBy(function(element, index) {
    return Math.floor(index / n);
  }).toArray().value();
}