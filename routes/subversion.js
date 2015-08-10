var config = require('../config');
var subversion = require('../lib/subversion');
var diff2html = require('../lib/diff2html');
var fs = require('fs');
var logger = require('../lib/logger').logger(module.filename);

var svnClient = new subversion();

exports.status = function(req, res) {
  svnClient.status(function(err, json) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(json);
    }
  });
};

exports.file = function(req, res) {
  var file = req.params.file;
  if (file[0] !== '/') {
    file = '/' + file;
  }
  var path = config.repository.path + file;
  fs.readFile(path, function(err, data) {
    if (err) {
      res.status(response.statusCode);
      res.json({
        file: req.params.file,
        error: err
      });
    } else {
      res.setHeader('content-type', 'text/plain');
      res.send(data);
    }
  })
};
exports.revisionFile = function(req, res) {
  var file = req.params.file;
  if (file[0] !== '/') {
    file = '/' + file;
  }
  var revision = req.params.revision;
  svnClient.cat({
    path: config.repository.path + file,
    revision: revision
  }, function(err, data) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.setHeader('content-type', 'text/plain');
      res.send(data);
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
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(json);
    }
  });
};

exports.info = function(req, res) {
  svnClient.info(function(err, json) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(json);
    }
  });
};

exports.serverInfo = function(req, res) {
  svnClient.serverInfo(function(err, json) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(json);
    }
  });
};

exports.log = function(req, res) {
  svnClient.log(req.params.revision, function(err, json) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(json);
    }
  });
};


exports.diffJson = function(req, res) {
  svnClient.diffText(req.params.revision, function(err, text) {
    res.json(diff2html.getJsonFromDiff(text));
  });
};

exports.diffJsonPost = function(req, res) {
  res.json(diff2html.getJsonFromDiff(req.rawData));
};

exports.diffText = function(req, res) {
  svnClient.diffText(req.params.revision, function(err, text) {
    console.log(text);
    res.send(text);
  });
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

exports.diffHtml = function(req, res) {
  svnClient.diffText(req.params.revision, function(err, text) {
    renderDiffHtml(res, req.params.revision, text);
  });
};

exports.diffHtmlPost = function(req, res) {
  var rawDiff = req.rawData;
  renderDiffHtml(res, "posted revision", rawDiff);
}


function doWithRevisionDiffs(req, textTransformer, completionCallback) {
  var denormalizedRevision = revisionUtils.denormalizeRevision(req.params.revision);
  var commandParallelism = config.svn.commandParallelism;

  async.mapLimit(denormalizedRevision, commandParallelism, function(revision, callback) {
      svnClient.diffText(req.params.revision, function(err, text) {
        callback(err, textTransformer(text));
      });
    },
    function(err, revisions) {
      completionCallback(err, revisions);
    });
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