var config = require('../config');
var maven = require('../lib/maven');
var Jsiq = require('../lib/jsiq');
var logger = require('../lib/logger').logger(module.filename);

var svnClient = new subversion();

exports.generateDotFiles = function(req, res) {
	maven.generateDotFiles(function(err, json) {
		if (err) {
			res.status(500).send(err);
		} else {
			res.json(json);
		}
	});
};
exports.listDoFiles = function(req, res) {
	maven.listDoFiles(function(err, json) {
		if (err) {
			res.status(500).send(err);
		} else {
			var jsiq = new Jsiq(req);
			res.json(jsiq.transform(json));
		}
	});
};
exports.parseDotFile = function(req, res) {
	maven.parseDotFile(req.params.moduleId, function(err, json) {
		if (err) {
			res.status(500).send(err);
		} else {
			var jsiq = new Jsiq(req);
			res.json(jsiq.transform(json));
		}
	});
};

exports.tree = function(req, res) {
	maven.tree(function(err, json) {
		if (err) {
			res.status(500).send(err);
		} else {
			var jsiq = new Jsiq(req);
			res.json(jsiq.transform(json));
		}
	});
};
exports.uiTree = function(req, res) {
	maven.uiTree(function(err, json) {
		if (err) {
			res.status(500).send(err);
		} else {
			res.json(json);
		}
	});
};


function transformJson(modules) {
	return _.map(modules, function(module) {
		var value = {
			text: module.group + ":" + module.id
		}
		if (module.Dependencies) {
			value.children = transformJson(module.Dependencies);
		}
	});
}

exports.htmlTree = function(req, res) {
	maven.tree(function(err, json) {
		if (err) {
			res.status(500).send(err);
		} else {
			res.render('tree', {
				title: 'Dependencies Tree',
				modules: json
			});
		}
	});
};
exports.module = function(req, res) {
	maven.module(req.params.moduleId, function(err, json) {
		if (err) {
			res.status(500).send(err);
		} else {
			var jsiq = new Jsiq(req);
			res.json(jsiq.transform(json));
		}
	});
};
exports.dependants = function(req, res) {
	maven.dependants(req.params.moduleId, req.query.deep, function(err, json) {
		if (err) {
			res.status(500).send(err);
		} else {
			var jsiq = new Jsiq(req);
			res.json(jsiq.transform(json));
		}
	});
};