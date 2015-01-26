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

exports.createIndex = function(callback) {
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
    callback(err, results);
  });
};

exports.sync = function(syncCallback) {
  async.series([
    function(callback) {
      svnClient.cleanup(callback);
    },
    function(callback) {
      svnClient.update(callback);
    },
    function(callback) {
      svnClient.serverInfo(function(serverInfoErr, info) {
        var serverRevision = info.revision;
        esClient.maxId({
          index: 'svn-revision',
          type: 'revision'
        }, function(infoErr, searchResult) {
          var maxIndexedId = searchResult.hits.hits[0]._id;
          if (parseInt(maxIndexedId) < parseInt(serverRevision)) {
            logger.info("Max indexed id [%s] is smaller than server revision [%s], syncing...", maxIndexedId, serverRevision);
            async.parallel([
              function(indexCallback) {
                index(maxIndexedId + ':' + serverRevision, function(err, response) {
                  indexCallback(err, response);
                });
              },
              function(indexDiffCallback) {
                indexDiff(maxIndexedId + ':' + serverRevision, function(err, response) {
                  indexDiffCallback(err, response);
                });
              }
            ], function(err, results) {
              callback(err, results);
            });
          } else {
            logger.info("Max indexed id is the same as server revision [%s], Nothing to do.", maxIndexedId);
          }
        })
      })
    }
  ], function(err, results) {
    syncCallback(err, results);
  });
};


exports.fetchOrIndexDiff = function(revision, callback) {
  esClient.get({
    index: 'svn-diffs',
    type: 'diff',
    data: revision
  }, function(err, results) {
    callback(err, results);
  });
};

exports.indexDiff = function(revision, callback) {
  indexDiff(revision, function(err, json) {
    callback(err, json);
  });
}

function indexDiff(revision, callback) {
  var currentDiffsFetched = 0;
  var currentDiffsIndexed = 0;
  var resultDiffs = [];

  var denormalizedRevisions = revisionUtils.denormalizeRevision(revision);
  var chunks = toChunks(denormalizedRevisions, config.svn.maxChunkSize);
  logger.trace("Divided [%s] revisions to [%s] chunks", denormalizedRevisions.length, chunks.length);

  var revisionDiffQueue = async.queue(function(revisions, queueCallback) {
    currentDiffsFetched += revisions.length;
    logger.trace('Fetched diffs for [%s/%s] revisions', currentDiffsFetched, denormalizedRevisions.length);

    async.mapLimit(revisions, config.svn.commandParallelism, function(revision, aggregateCallback) {
      var revisionRange = revisionUtils.normalizeRevision(revision + "");
      svnClient.diffText(revisionRange, function(err, text) {
        if (err) {
          logger.error(err);
          aggregateCallback(null, {
            revision: revision,
            diff: {}
          });
        } else {
          var diff = diff2html.getJsonFromDiff(text);
          aggregateCallback(null, {
            id: revision,
            diff: diff
          });
        }
      });
    }, function(err, aggregateDiffs) {
      indexDiffQueue.push({
        diffs: aggregateDiffs
      });
      resultDiffs = resultDiffs.concat(aggregateDiffs);
      queueCallback(err);
    });
  }, config.svn.commandParallelism);

  revisionDiffQueue.drain = function() {
    callback(null, resultDiffs);
  }


  var indexDiffQueue = async.queue(function(task, queueCallback) {
    currentDiffsIndexed += task.diffs.length;
    logger.trace('Indexed [%s/%s] diffs', currentDiffsIndexed, denormalizedRevisions.length);

    esClient.bulkIndex({
      index: 'svn-diffs',
      type: 'diff',
      data: task.diffs,
      idResolver: function(entry) {
        return entry ? entry.id : "";
      },
    }, function(err, response) {
      if (err) {
        logger.error(err);
      }
      queueCallback(err);
    });
  }, config.svn.commandParallelism);

  revisionDiffQueue.push(chunks);
};

exports.index = function(revision, callback) {
  index(revision, function(err, results) {
    callback(err, results);
  })
};

function index(revisionId, callback) {
  var resultRevisions = [];
  var processErrors = [];
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
        processErrors.push(err);
      }
      queueCallback(err, response);
    });
  }, config.svn.commandParallelism);


  var normalizedRevision = revisionUtils.normalizeRevision(revisionId);
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
    callback(processErrors, resultRevisions);
  }
};

function toChunks(data, n) {
  return _.chain(data).groupBy(function(element, index) {
    return Math.floor(index / n);
  }).toArray().value();
}