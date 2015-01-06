var _ = require('underscore');
var logger = require('../lib/logger').logger(module.filename);


module.exports.filterLike = function(array, filters) {
  return _.filter(array, function(candidate) {
    var isPass = true;
    for (var filterKey in filters) {
      var singleFilterPass = false;
      if (candidate && candidate[filterKey]) {
        var propertyObj = candidate[filterKey];
        var propertyValues = _.isArray(propertyObj) ? propertyObj : [propertyObj];
        var filterString = filters[filterKey];
        var filterValues = filterString.split(',');
        for (f in filterValues) {
          for (p in propertyValues) {
            // logger.info("key: " + filterKey + ", val: " + propertyValues[p] + ", filter: " + filterValues[f]);
            if (propertyValues[p] && propertyValues[p].toLowerCase().indexOf(filterValues[f].toLowerCase()) != -1) {
              singleFilterPass = true;
            }
          }
        }
      }
      isPass = isPass && singleFilterPass;
    }
    return isPass;
  });
};


module.exports.flattenObjectToStrings = function(object) {
  var result = {};

  for (var key in object) {
    if (!object.hasOwnProperty(key)) continue;
    if ((typeof object[key]) == 'object') {
      result[key] = JSON.stringify(object[key]);
    } else {
      result[key] = object[key];
    }
  }
  return result;
};