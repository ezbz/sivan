var config = require('../config');
var subversion = require('../lib/subversion');
var elasticsearch = require('../lib/elasticsearch');
var diff2html = require('../lib/diff2html');
var revisionUtils = require('../lib/revision-utils');
var async = require('async');
var moment = require('moment');
var _ = require('underscore');
var logger = require('../lib/logger').logger(module.filename);


var svnClient = new subversion();
var esClient = new elasticsearch();
var moduleMappingsConfig = revisionUtils.createModuleMapperFromConfig(config.svn.moduleMappings)

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
            index(maxIndexedId + ':' + serverRevision, function(err, response) {
              callback(err, response);
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


exports.fetchRevision = function(revision, callback) {
  esClient.get({
    index: 'svn-revision',
    type: 'revision',
    data: revision
  }, function(err, results) {
    callback(err, results);
  });
};

exports.indexMissing = function(iteratorCallback, completionCallback) {
  logger.info("Starting sync of missing revisions from the index")
  exports.missing(function(err, ids) {
    logger.trace('Starting to index [%s] missing revisions from range [%s-%s]', ids.length, _.min(ids), _.max(ids));
    async.eachLimit(ids, config.indexer.reindexQueueSize, function(id, itemCallback) {
      index(id + "", function(err, results) {
        iteratorCallback(results);
        itemCallback();
      });
    }, function(err) {
      if (err) {
        logger.error(err);
      }
      completionCallback(ids.length);
    });
  });
};


exports.missing = function(callback) {
  esClient.allIds({
    index: 'svn-revision',
    type: 'revision'
  }, function(err, results) {
    var ids = _.map(results.hits.hits, function(hit) {
      return parseInt(hit._id);
    });
    var maxId = _.max(ids);
    var expectedIds = _.range(2000, maxId);
    var missingIds = _.difference(expectedIds, ids);
    logger.trace('Found [%s] indexed (max id is [%s]) ids and [%s] missing ids', ids.length, maxId, missingIds.length)
    callback(err, missingIds.reverse());
  });
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

  var indexRevisionsCargo = async.cargo(function(revisions, taskCallback) {
    currentRevisionsIndexed += revisions.length;
    logger.trace('Indexed [%s/%s] revisions', currentRevisionsIndexed, resultRevisions.length);
    esClient.bulkIndex({
      index: 'svn-revision',
      type: 'revision',
      data: revisions,
      idResolver: function(entry) {
        return parseInt(entry.revision);
      },
    }, function(err, response) {
      if (err) {
        logger.error(err);
        processErrors.push(err);
      }
      taskCallback(err, response);
    });
  }, config.indexer.indexQueueSize);


  indexRevisionsCargo.drain = function() {
    if (currentRevisionsIndexed === resultRevisions.length) {
      logger.trace("Finished processing cargo of [%s] revisions", resultRevisions.length);
      callback(processErrors, resultRevisions);
      resultRevisions = null;
      processErrors = null;
    }
  }

  var revisionDiffQueue = async.queue(function(revisions, queueCallback) {
    async.mapLimit(revisions, config.indexer.diffQueueSize, function(revision, aggregateCallback) {
      var normalizedRevision = revisionUtils.normalizeRevision(revision.revision);
      svnClient.diffText(normalizedRevision, function(err, text) {
        if (err) {
          logger.error(err);
          aggregateCallback(null, revision);
        } else {
          revision.diff = diff2html.getJsonFromDiff(text);
          revision.revision = parseInt(revision.revision);
          aggregateCallback(null, revision);
        }
      });
    }, function(err, aggregateRevisions) {
      indexRevisionsCargo.push(aggregateRevisions);
      queueCallback(err);
    });
  }, config.indexer.diffQueueSize);


  var normalizedRevision = revisionId;
  logger.trace('Fetching revisions for [%s]', normalizedRevision);
  svnClient.log(normalizedRevision, function(err, revisions) {
    if (revisions && revisions.length) {
      logger.trace('Indexing [%s] revisions', revisions.length);
      var enrichedRevisions = _.map(revisions, function(revision) {
        return revisionUtils.enrichRevision(revision, moduleMappingsConfig);
      });
      resultRevisions = resultRevisions.concat(enrichedRevisions);

      var chunks = toChunks(enrichedRevisions, config.indexer.maxChunkSize);
      logger.trace("Divided [%s] revisions to [%s] chunks", revisions.length, chunks.length);
      revisionDiffQueue.push(chunks);
    } else {
      logger.trace('Empty content, skipping revision [%s]', revisionId);
      callback(processErrors, resultRevisions);
    }

  });
};

function toChunks(data, n) {
  return _.chain(data).groupBy(function(element, index) {
    return Math.floor(index / n);
  }).toArray().value();
}