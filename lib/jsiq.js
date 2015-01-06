var config = require('../config');
var utils = require('../lib/utils');
var _ = require('underscore');
var YAML = require('yamljs');
var logger = require('../lib/logger').logger(module.filename);

var DEFAULT_GROUP_DELIM = " ";

var Jsic = function(req, params) {
	if (req.query.group) {
		this.group = req.query.group;
	} else if (params && params.group) {
		this.group = params.group;
	}

	if (req.query.groupDelim) {
		this.groupDelim = req.query.groupDelim;
	} else if (params && params.groupDelim) {
		this.groupDelim = params.groupDelim;
	}

	if (req.query.filter) {
		this.filter = req.query.filter;
	} else if (params && params.filter) {
		this.filter = params.filter;
	}

	if (req.query.count) {
		this.count = req.query.count;
	} else if (params && params.count) {
		this.count = params.count;
	}

	if (req.query.sort) {
		this.sort = req.query.sort;
	} else if (params && params.sort) {
		this.sort = params.sort;
	}

	if (req.query.sortDir) {
		this.sortDir = req.query.sortDir;
	} else if (params && params.sortDir) {
		this.sortDir = params.sortDir;
	}

	if (req.query.select) {
		this.select = req.query.select;
	} else if (params && params.select) {
		this.select = params.select;
	}

	if (req.query.format) {
		this.format = req.query.format;
	} else if (params && params.format) {
		this.format = params.format;
	}

	if (req.query.distinct) {
		this.distinct = req.query.distinct;
	} else if (params && params.distinct) {
		this.distinct = params.distinct;
	}
}

Jsic.prototype = {
	transform: function(json) {
		var result = (this.filter) ? utils.filterLike(json, parseFilters(this.filter)) : json;

		result = (this.select) ? select(result, this.select) : result;
		var group = this.group;
		var groupDelim = (this.groupDelim) ? this.groupDelim : DEFAULT_GROUP_DELIM;
		result = (this.distinct && this.distinct == 'true') ? _.uniq(result, false, function(item) {
			return JSON.stringify(item);
		}) : result;
		result = (this.group) ? _.groupBy(result, function(item) {
			var groups = _.isArray(group) ? group : [group];
			var keys = _.map(groups, function(groupItem) {
				return item[groupItem];
			});
			return keys.join(groupDelim);
		}) : result;
		result = (this.count) ? _.countBy(result, this.count) : result;
		result = (this.sort) ? _.sortBy(result, this.sort) : result;
		result = (this.sortDir) ? ((this.sortDir.toLowerCase() == "desc") ? result.reverse() : result) : result;
		result = (this.format && this.format == 'yaml') ? YAML.stringify(result) : result;
		return result;
	}
};

function parseFilters(filters) {
	var filterObject = {};
	if (filters != undefined) {
		var filters = _.isArray(filters) ? filters : [filters];
		for (i in filters) {
			var filterParts = filters[i].split(':');
			filterObject[filterParts[0]] = filterParts[1];
		}
	}
	return filterObject;
}


function select(objectArray, selectArgs) {
	var fields = _.isArray(selectArgs) ? selectArgs : selectArgs.split(',');
	var result = [];
	for (i in objectArray) {
		var resultObj = {};
		var obj = objectArray[i];
		for (f in fields) {
			if (obj[fields[f]]) {
				resultObj[fields[f]] = obj[fields[f]];
				result.push(resultObj);
			}
		}
	}
	return result;
}

module.exports = Jsic;