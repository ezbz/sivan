var config = require('../config');
var scmProxy = require('../lib/scmproxy');
var elasticsearch = require('../lib/elasticsearch');
var diff2html = require('../lib/diff2html');
var revisionUtils = require('../lib/revision-utils');
var async = require('async');
var moment = require('moment');
var _ = require('underscore');
var logger = require('../lib/logger').logger(module.filename);


var esClient = new elasticsearch();
var moduleMappingsConfig = revisionUtils.createModuleMapperFromConfig(config.repository.moduleMappings);
var tagMappingsConfig = revisionUtils.createTagMapperFromConfig(config.repository.tagMappings);
var fileMappingsConfig = revisionUtils.createFileMapperFromConfig(config.repository.fileMappings);

exports.createIndex = function(callback) {
  async.series([
    function(callback) {
      esClient.createIndex(config.elasticsearch.indexName, callback);
    },
    function(callback) {
      esClient.waitForStatus(config.elasticsearch.indexName, 'green', callback);
    },
    function(callback) {
      esClient.closeIndex(config.elasticsearch.indexName, callback);
    },
    function(callback) {
      esClient.putSettings(config.elasticsearch.indexName, config.elasticsearch.revision.settings, callback);
    },
    function(callback) {
      esClient.putMappings(config.elasticsearch.indexName, config.elasticsearch.indexType, config.elasticsearch.revision.mappings, callback);
    },
    function(callback) {
      esClient.openIndex(config.elasticsearch.indexName, callback);
    },
    function(callback) {
      esClient.waitForStatus(config.elasticsearch.indexName, 'green', callback);
    },

  ], function(err, results) {
    callback(err, results);
  });
};

exports.sync = function(syncCallback) {
  async.series([
    function(callback) {
      scmProxy.cleanup(callback);
    },
    function(callback) {
      scmProxy.update(callback);
    },
    function(callback) {
      scmProxy.serverInfo(function(serverInfoErr, info) {
        var serverRevision = info.revision;
        esClient.maxId({
          index: config.elasticsearch.indexName,
          type: config.elasticsearch.indexType
        }, function(infoErr, searchResult) {
          var maxIndexedId = (searchResult.hits && searchResult.hits.hits[0]) ? searchResult.hits.hits[0]._id : null;
          var hasDelta = scmProxy.shouldIndex(maxIndexedId, serverRevision);
          console.log(hasDelta)
          if (hasDelta) {
            logger.info("Max indexed id [%s] is smaller than server revision [%s], syncing...", maxIndexedId, serverRevision);
            index(scmProxy.revisionToIndex(maxIndexedId, serverRevision), function(err, response) {
              callback(err, response);
            });
          } else {
            logger.info("Max indexed id [%s] is the same as server revision [%s], Nothing to do.", maxIndexedId, serverRevision);
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
    index: config.elasticsearch.indexName,
    type: config.elasticsearch.indexType,
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
    index: config.elasticsearch.indexName,
    type: config.elasticsearch.indexType
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
      index: config.elasticsearch.indexName,
      type: config.elasticsearch.indexType,
      data: revisions,
      idResolver: function(entry) {
        return entry.revision;
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
      scmProxy.diffText(revision.revision, function(err, text) {
        if (err) {
          logger.error(err);
          aggregateCallback(null, revision);
        } else {
          revision.diff = diff2html.getJsonFromDiff(text);
          revision.revision = revision.revision;
          aggregateCallback(null, revision);
        }
      });
    }, function(err, aggregateRevisions) {
      indexRevisionsCargo.push(aggregateRevisions);
      queueCallback(err);
    });
  }, config.indexer.diffQueueSize);

  logger.trace('Fetching revisions for [%s]', revisionId);
  scmProxy.log(revisionId, function(err, revisions) {
    if (revisions && revisions.length) {
      logger.trace('Indexing [%s] revisions', revisions.length);
      var enrichedRevisions = _.map(revisions, function(revision) {
        return revisionUtils.enrichRevision(revision, moduleMappingsConfig, fileMappingsConfig, tagMappingsConfig);
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