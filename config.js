var fs = require('fs');
var yamljs = require('yamljs');
var _ = require('underscore');
var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];

var config = {};
var localYamlConfigFile = home + '/.sivan/config.yaml';
var localJsConfigFile = home + '/.sivan/config.js';

var systemConfigYamlFile = '/etc/sivan/config.yaml';
var systemConfigJsFile = '/etc/sivan/config.js';
if (fs.existsSync(systemConfigYamlFile)) {
	console.log("Loading config file from: " + systemConfigYamlFile);
	config = yamljs.load(systemConfigYamlFile);
} else if (fs.existsSync(systemConfigJsFile)) {
	console.log("Loading config file from: " + systemConfigJsFile);
	config = require(systemConfigJsFile);
}


if (fs.existsSync(localYamlConfigFile)) {
	console.log("Loading config file from: " + localYamlConfigFile);
	config = _.extend(config, yamljs.load(localYamlConfigFile));
} else if (fs.existsSync(localJsConfigFile)) {
	console.log("Loading config file from: " + localJsConfigFile);
	config = _.extend(config, require(localJsConfigFile));
}
module.exports = config;