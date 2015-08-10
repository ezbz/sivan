var config = require('../config');
var git = require('../lib/git');
var gitdiff2html = require('../lib/gitdiff2html');
var fs = require('fs');
var logger = require('../lib/logger').logger(module.filename);

var gitClient = new git();

exports.status = function(req, res) {
  gitClient.status(function(err, json) {
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
  gitClient.cat({
    path: req.params.file,
    revision: req.params.revision
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
  gitClient.update(function(err, json) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(json);
    }
  });
};

exports.cleanup = function(req, res) {
  gitClient.cleanup(function(err, json) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(json);
    }
  });
};
exports.info = function(req, res) {
  gitClient.info(function(err, json) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(json);
    }
  });
};
exports.serverInfo = function(req, res) {
  gitClient.serverInfo(function(err, json) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(json);
    }
  });
};
exports.log = function(req, res) {
  gitClient.log(req.params.revision, function(err, json) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(json);
    }
  });
};

exports.diffText = function(req, res) {
  gitClient.diffText(req.params.revision, function(err, text) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.send(text);
    }
  });
};

exports.diffJson = function(req, res) {
  gitClient.diffText(req.params.revision, function(err, text) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(gitdiff2html.getJsonFromDiff(text));
    }
  });
};

exports.diffHtml = function(req, res) {
  gitClient.diffText(req.params.revision, function(err, text) {
    renderDiffHtml(res, req.params.revision, text);
  });
};

function renderDiffHtml(res, revision, text) {
  var html = gitdiff2html.getPrettySideBySideHtmlFromDiff(text);
  res.render('diff', {
    title: 'Diff Page',
    diffs: [{
      revision: revision,
      diff: html
    }]
  });
}