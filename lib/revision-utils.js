var _ = require('underscore');
var moment = require('moment');
var config = require('../config');
var logger = require('../lib/logger').logger(module.filename);

module.exports.normalizeRevision = function(revision) {
  if (revision.indexOf(":") == -1) {
    if (parseInt(revision) === NaN) {
      throw "Illegal revision: " + revision;
    }
    return revision - 1 + ":" + revision;
  }
  return revision;
}

module.exports.denormalizeRevision = function(revision) {
  if (revision.indexOf(":") == -1) {
    var arr = new Array();
    arr.push(revision);
    return arr;
  }
  var parts = revision.split(":");
  return _.range(parseInt(parts[0]), parseInt(parts[1]) + 1);
}

module.exports.fetchModulesFromFiles = function(files, mapper) {
  return _.chain(files).map(function(file) {
    if (mapper) {
      return mapper.map(file);
    }
    return file.path.split("/")[1];
  }).flatten().compact().uniq().value();
};

module.exports.createModuleMapperFromConfig = function(moduleMappingsConfig) {
  var keys = _.keys(moduleMappingsConfig);
  return {
    map: function(file) {
      var parts = file.path.split('/');
      var configKey = _.filter(keys, function(key) {
        return file.path.indexOf(key) != -1;
      });
      if (configKey.length) {
        switch (moduleMappingsConfig[configKey].type) {
          case "index":
            return _.first(parts, moduleMappingsConfig[configKey].segments);
          default:
            return [];
        }
      } else {
        if (parts.length > 2) {
          return [].concat(parts[1]);
        } else {
          return [];
        }
      }
    }
  }
}


module.exports.fetchTagsFromMessage = function(message, mapper) {
  return mapper.map(message);
}

module.exports.createTagMapperFromConfig = function(tagMappingConfig) {
  return {
    map: function(message) {
      var tags = [];
      if (message != "") {
        _.each(tagMappingConfig, function(config) {
          var currentTags = message.match(new RegExp(config.regex, 'g'));
          _.each(currentTags, function(tag) {
            tags.push(_.template(config.template)({
              tag: tag
            }));
          });
        });
      }
      return tags;
    }
  }
};
module.exports.fetchFileTypesFromFiles = function(files, mapper) {
  return _.chain(files).map(function(file) {
    return mapper.map(file);
  }).filter(function(file) {
    return _.contains(config.knownFileTypes, file);
  }).compact().value();
}

module.exports.createFileMapperFromConfig = function(fileMapperConfig) {
  return {
    map: function(file) {
      var parts = file.path.split("/");
      var lastParts = parts[parts.length - 1].split(".");
      return (lastParts.length > 1) ? lastParts[lastParts.length - 1] : false;
    }
  }
};

module.exports.enrichRevision = function(revision, moduleMapper, fileMapper, tagMapper) {
  revision.message = unescape(revision.message);
  var modules = module.exports.fetchModulesFromFiles(revision.files, moduleMapper);
  var fileTypes = module.exports.fetchFileTypesFromFiles(revision.files, fileMapper);
  revision.tags = module.exports.fetchTagsFromMessage(revision.message, tagMapper);
  revision.modules = _.uniq(modules).sort();
  revision.fileTypes = _.uniq(fileTypes).sort();
  var date = moment(revision.date);
  if (!date.isValid()) {
    logger.warn("Cannot parse date from revision [%s]", JSON.stringify(revision));
    var now = moment();
    revision.date = null;
    revision.timestamp = null;
  } else {
    revision.date = date.format('YYYYMMDDTHHmmss.SSSZ');
    revision.timestamp = date.valueOf();
  }
  return revision;
}