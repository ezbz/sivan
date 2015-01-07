var config = require('../config');
var subversion = require('../lib/subversion');
var diff2html = require('../lib/diff2html');
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
