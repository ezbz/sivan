var _ = require('underscore');
var moment = require('moment');
var logger = require('../lib/logger').logger(module.filename);

module.exports.normalizeRevision = function(revision) {
  if (revision.indexOf(":") == -1) {
    return revision - 1 + ":" + revision;
  }
  return revision;
}

module.exports.denormalizeRevision = function(revision) {
  if (revision.indexOf(":") == -1) {
    return new Array().push(revision);
  }
  var parts = revision.split(":");
  return _.range(parseInt(parts[0]), parseInt(parts[1]) + 1);
}

module.exports.fetchModulesFromFiles = function(files) {
  return _.map(files, function(file) {
    return file.path.split("/")[1];
  });
}

module.exports.enrichRevision = function(revision) {
  revision.message = unescape(revision.message);
  var modules = module.exports.fetchModulesFromFiles(revision.files);
  revision.tags = revision.message.match(/#\w+/g);
  revision.modules = _.uniq(modules).sort();
  var date = moment(revision.date);
  if(!date.isValid()){
    logger.error("Cannot parse date from revision [%s]", revision.date);
    var now = moment();
    revision.date = null;
    revision.timestamp = null;
  }else{    
    revision.date = date.format('YYYYMMDDTHHmmss.SSSZ');
    revision.timestamp = date.valueOf();
  }
  return revision;
}