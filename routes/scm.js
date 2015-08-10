var config = require('../config');
var logger = require('../lib/logger').logger(module.filename);
var git = require('./git');
var subversion = require('./subversion');

var proxyClient = (config.repository.type == 'git') ? git : subversion;

exports.status = function(req, res) {
  return proxyClient.status(req, res);
};
exports.file = function(req, res) {
  return proxyClient.file(req, res);
};
exports.revisionFile = function(req, res) {
  return proxyClient.revisionFile(req, res);
};
exports.update = function(req, res) {
  return proxyClient.update(req, res);
};
exports.cleanup = function(req, res) {
  return proxyClient.cleanup(req, res);
};
exports.info = function(req, res) {
  return proxyClient.info(req, res);
};
exports.serverInfo = function(req, res) {
  return proxyClient.serverInfo(req, res);
};
exports.log = function(req, res) {
  return proxyClient.log(req, res);
};
exports.diffText = function(req, res) {
  return proxyClient.diffText(req, res);
};
exports.diffJson = function(req, res) {
  return proxyClient.diffJson(req, res);
};
exports.diffHtml = function(req, res) {
  return proxyClient.diffHtml(req, res);
};