var config = require('../config');
var git = require('./git');
var subversion = require('./subversion');

var proxyClient = (config.repository.type == 'git') ? new git() : new subversion();

module.exports.status = function(callback) {
	proxyClient.status(callback);
};
module.exports.cat = function(params, callback) {
	proxyClient.cat(params, callback);
};
module.exports.update = function(callback) {
	proxyClient.update(callback);
};
module.exports.cleanup = function(callback) {
	proxyClient.cleanup(callback);
};
module.exports.info = function(callback) {
	proxyClient.info(callback);
};
module.exports.serverInfo = function(callback) {
	proxyClient.serverInfo(callback);
};
module.exports.log = function(revision, callback) {
	proxyClient.log(revision, callback);
};
module.exports.diffText = function(revision, callback) {
	proxyClient.diffText(revision, callback);
};
module.exports.shouldIndex = function(maxIndexedId, serverId) {
	return proxyClient.shouldIndex(maxIndexedId, serverId);
};
module.exports.revisionToIndex = function(maxIndexedId, serverId) {
	return proxyClient.revisionToIndex(maxIndexedId, serverId);
};
