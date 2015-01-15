var config = require('../config');
var subversion = require('../lib/subversion');
var diff2html = require('../lib/diff2html');
var request = require('request');
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
  var url = config.svn.httpUrl + file;
  request.get(url, function(err, response, body) {
    if (!err && response.statusCode == 200) {
      res.send(response.body);
    } else {
      res.status(response.statusCode);
      res.json({
        file: req.params.file,
        statusCode: response.statusCode,
        error: err
      });
    }
  })
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