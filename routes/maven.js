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
exports.listDotFiles = function(req, res) {
	maven.listDotFiles(function(err, json) {
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

exports.uiTree = function(req, res) {
	maven.uiTree(req.params.moduleId, function(err, json) {
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
	var moduleId = req.params.moduleId ? req.params.moduleId : "all";
	maven.moduleTree(moduleId, function(err, json) {
		if (err) {
			res.status(500).send(err);
		} else {
			res.render('tree', {
				title: 'Dependencies Tree',
				moduleId: moduleId,
				modules: json
			});
		}
	});
};

exports.moduleTree = function(req, res) {
	maven.moduleTree(req.params.moduleId, function(err, json) {
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