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


esClient.createIndex('svn-revision', function(err) {
  if (!err) {
    esClient.waitForStatus('svn-revision', 'green', function() {
      esClient.closeIndex('svn-revision', function() {
        esClient.putSettings('svn-revision', config.elasticsearch.revision.settings, function(err, settingsResponse) {
          logger.info("Response for put settings [%s]", JSON.stringify(settingsResponse));
          esClient.putMappings('svn-revision', 'revision', config.elasticsearch.revision.mappings, function(err, mappingsResponse) {
            logger.info("Response for put mappings [%s]", JSON.stringify(mappingsResponse));
            esClient.openIndex('svn-revision', function() {
              esClient.waitForStatus('svn-revision', 'green', function() {
                logger.info("Finished creating index");
              });
            });
          });
        });
      });
    });
  }
});


exports.index = function(req, res) {
  var fetchRevisionsFunction = function(callback) {
    var normalizedRevision = revisionUtils.normalizeRevision(req.params.revision);
    logger.info('Fetching revisions for [%s]', normalizedRevision);
    svnClient.log(normalizedRevision, function(err, revisions) {
      callback(err, revisions);
    });
  };

  var indexRevisionsFunction = function(revisions, callback) {
    logger.info('Indexing [%s] revisions', revisions.length);
    var enrichedRevisions = _.map(revisions, function(revision) {
      return revisionUtils.enrichRevision(revision);
    });
    esClient.bulkIndex({
      index: 'svn-revision',
      type: 'revision',
      data: revisions,
      idResolver: function(entry) {
        return entry ? entry.revision : "";
      },
    }, function(err, response) {
      callback(err, revisions);
    });
  }

  var fetchDiffsFunction = function(revisions, completionCallback) {
    logger.info('Fetching [%s] diffs', revisions.length);
    async.mapLimit(revisions, config.svn.commandParallelism,
      function(revision, aggregateCallback) {
        var revisionRange = revisionUtils.normalizeRevision(revision.revision);
        svnClient.diffText(revisionRange, function(err, text) {
          revision.diff = diff2html.getJsonFromDiff(text);
          aggregateCallback(err, revision);
        });
      },
      function(err, aggregateRevisions) {
        completionCallback(err, aggregateRevisions);
      });
  }


  var indexDiffsFunction = function(aggregateRevisions, callback) {
    logger.info('Indexing [%s] diffs', aggregateRevisions.length);
    esClient.bulkIndex({
        index: 'svn-diffs',
        type: 'diff',
        data: _.map(aggregateRevisions, function(aggregateRevision) {
          return {
            revision: aggregateRevision.revision,
            diff: aggregateRevision.diff
          };
        }),
        idResolver: function(entry) {
          return entry ? entry.revision : "";
        }
      },
      function(err, response) {
        callback(err, aggregateRevisions);
      });
  }

  async.waterfall([
    fetchRevisionsFunction,
    indexRevisionsFunction,
    fetchDiffsFunction,
    indexDiffsFunction
  ], function(err, result) {
    res.json(result);
  });
};

