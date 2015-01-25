var config = require('../config');
var subversion = require('../lib/subversion');
var diff2html = require('../lib/diff2html');
var request = require('request');
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

exports.revision = function(req, res) {
  svnClient.log(req.params.revision, function(err, json) {
    res.json(json);
  });
};