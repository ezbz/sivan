var config = require('../config');
var subversion = require('../lib/subversion');
var elasticsearch = require('../lib/elasticsearch');
var diff2html = require('../lib/diff2html');
var maven = require('../lib/maven');
var async = require('async');
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
exports.status = function(req, res) {
  svnClient.status(function(err, json) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(json);
    }
  });
};
exports.update = function(req, res) {
  svnClient.update(function(err, json) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(json);
    }
  });
};
exports.cleanup = function(req, res) {
  svnClient.cleanup(function(err, json) {
    res.json(json);
  });
};
exports.revision = function(req, res) {
  svnClient.log(req.params.revision, function(err, json) {
    res.json(json);
  });
};
exports.info = function(req, res) {
  svnClient.info(function(err, json) {
    res.json(json);
  });
};

exports.serverInfo = function(req, res) {
  svnClient.serverInfo(function(err, json) {
    res.json(json);
  });
};

exports.find = function(req, res) {
  esClient.get({
    index: 'svn',
    type: 'revision',
    data: denormalizeRevision(req.params.revision)
  }, function(err, json) {
    res.json(json);
  });
};

exports.revisionModules = function(req, res) {
  var normalizedRevision = normalizeRevision(req.params.revision);
  fetchAffectedModules(normalizedRevision, function(err, modules) {
    res.json(modules);
  });
};

exports.revisionModulesDependants = function(req, res) {
  var normalizedRevision = normalizeRevision(req.params.revision);
  fetchAffectedModules(normalizedRevision, function(err, modules) {
    async.map(modules, function(moduleId, aggregateCallback) {
      maven.dependants(moduleId, false, function(err, dependantModules) {
        var ids = _.pluck(dependantModules,'id');
        aggregateCallback(err, modules.concat(ids));
      });
    }, function(err, results){
      res.json(_.chain(results).flatten().uniq().value().sort());
    });
  });
};

exports.index = function(req, res) {
  var fetchRevisionsFunction = function(callback) {
    var normalizedRevision = normalizeRevision(req.params.revision);
    logger.info('Fetching revisions for [%s]', normalizedRevision);
    svnClient.log(normalizedRevision, function(err, revisions) {
      callback(err, revisions);
    });
  };

  var indexRevisionsFunction = function(revisions, callback) {
    logger.info('Indexing [%s] revisions', revisions.length);
    var enrichedRevisions = _.map(revisions, function(revision) {
      return enrichRevision(revision);
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
        var revisionRange = normalizeRevision(revision.revision);
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

exports.diffJson = function(req, res) {
  svnClient.diffText(normalizeRevision(req.params.revision), function(err, text) {
    res.json(diff2html.getJsonFromDiff(text));
  });
};
exports.diffsJson = function(req, res) {
  async.mapLimit(denormalizeRevision(req.params.revision), config.svn.commandParallelism, function(revision, callback) {
    svnClient.diffText(normalizeRevision(req.params.revision), function(err, text) {
      callback(err, diff2html.getJsonFromDiff(text));
    });
  }, function(err, revisions) {
    res.json(revisions);
  });
};

exports.diffsHtml = function(req, res) {
  async.mapLimit(denormalizeRevision(req.params.revision), config.svn.commandParallelism, function(revision, callback) {
      svnClient.diffText(normalizeRevision("" + revision), function(err, text) {
        callback(err, {
          revision: revision,
          diff: diff2html.getPrettySideBySideHtmlFromDiff(text)
        });
      });
    },
    function(err, revisions) {
      res.render('diff', {
        title: 'Diff Page',
        diffs: revisions
      });
    });
};

exports.diffHtml = function(req, res) {
  svnClient.diffText(normalizeRevision(req.params.revision), function(err, text) {
    var html = diff2html.getPrettySideBySideHtmlFromDiff(text);
    res.render('diff', {
      title: 'Diff Page',
      diffs: [{
        revision: req.params.revision,
        diff: html
      }]
    })
  });
};

function fetchAffectedModules(revision, callback) {
  svnClient.log(revision, function(err, revisions) {
    var modules = _.chain(revisions).map(function(revision) {
      return fetchModulesFromFiles(revision.files);
    }).flatten().uniq().value().sort();
    callback(err, modules);
  });
}

function fetchModulesFromFiles(files) {
  return _.map(files, function(file) {
    return file.path.split("/")[1];
  });
}

function enrichRevision(revision) {
  revision.message = unescape(revision.message);
  var modules = fetchModulesFromFiles(revision.files);
  revision.tags = revision.message.match(/#\w+/g);
  revision.modules = _.uniq(modules).sort();
  return revision;
}

function normalizeRevision(revision) {
  if (revision.indexOf(":") == -1) {
    return revision - 1 + ":" + revision;
  }
  return revision;
}

function denormalizeRevision(revision) {
  if (revision.indexOf(":") == -1) {
    return new Array().push(revision);
  }
  var parts = revision.split(":");
  return _.range(parseInt(parts[0]), parseInt(parts[1]) + 1);
}