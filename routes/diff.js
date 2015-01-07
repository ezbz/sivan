var config = require('../config');
var subversion = require('../lib/subversion');
var diff2html = require('../lib/diff2html');
var revisionUtils = require('../lib/revision-utils');
var logger = require('../lib/logger').logger(module.filename);

var svnClient = new subversion();

exports.diffJson = function(req, res) {
  var normalizedRevision = revisionUtils.normalizeRevision(req.params.revision);
  svnClient.diffText(normalizedRevision, function(err, text) {
    res.json(diff2html.getJsonFromDiff(text));
  });
};

exports.diffJsonPost = function(req, res) {
  res.json(diff2html.getJsonFromDiff(req.rawData));
};

exports.diffsJson = function(req, res) {
  doWithRevisionDiffs(req.params.revision, function(text) {
    return diff2html.getJsonFromDiff(text);
  }, function(err, revisions) {
    res.json(revisions);
  });
};

exports.diffsHtml = function(req, res) {
  doWithRevisionDiffs(req.params.revision, function(text) {
    return {
      revision: revision,
      diff: diff2html.getPrettySideBySideHtmlFromDiff(text)
    }
  }, function(err, revisions) {
    res.render('diff', {
      title: 'Diff Page',
      diffs: revisions
    });
  });
};

function doWithRevisionDiffs(revision, textTransformer, completionCallback) {
  var normalizedRevision = revisionUtils.normalizeRevision(req.params.revision);
  var denormalizedRevision = revisionUtils.denormalizeRevision(req.params.revision);
  var commandParallelism = config.svn.commandParallelism;

  async.mapLimit(denormalizedRevision, commandParallelism, function(revision, callback) {
      svnClient.diffText(normalizedRevision, function(err, text) {
        callback(err, textTransformer(text));
      });
    },
    function(err, revisions) {
      completionCallback(err, revisions);
    });
}

exports.diffHtml = function(req, res) {
  var normalizedRevision = revisionUtils.normalizeRevision(req.params.revision);
  svnClient.diffText(normalizedRevision, function(err, text) {
    renderDiffHtml(res, req.params.revision, text);
  });
};

exports.diffHtmlPost = function(req, res) {
  var rawDiff = req.rawData;
  renderDiffHtml(res, "posted revision", rawDiff);
}

function renderDiffHtml(res, revision, text) {
  var html = diff2html.getPrettySideBySideHtmlFromDiff(text);
  res.render('diff', {
    title: 'Diff Page',
    diffs: [{
      revision: revision,
      diff: html
    }]
  });
}