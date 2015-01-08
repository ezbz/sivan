var subversion = require('node.svn');
var _ = require('underscore');
var http = require('http');


var svn = new subversion({
	cwd: process.cwd()
});

svn.status(function(err, items) {
	_.each(items, function(item) {
		// console.log(item);
		console.log("%s\t%s", item.status, item.path);
	});

	var modules = _.chain(items).filter(function(item) {
		return item.path.indexOf('/') != -1 && item.path.indexOf('+') != 0 && item.status !== '?'
	}).map(function(item) {
		return item.path.split("/")[0];
	}).uniq().compact().value().sort();

	console.log("")
	console.log("")
	if (modules.length) {
		console.log("Modules directly affected: %s", modules.join(', '));
	} else {
		console.log("No modules affected")
	}

	var url = 'http://localhost:3000/maven/module/' + modules.join(',') + '/dependants';
	var req = http.get(url, function(response) {
		response.setEncoding('utf8');
		var data = '';
		response.on('data', function(chunk) {
			data += chunk;
		});

		response.on('end', function() {
			var dependants = JSON.parse(data);
			console.log("Modules indirectly affected: %s", dependants.join(','));
		});
		response.on('error', function(err) {
			console.error(err);
		});
	});
	req.end();
});