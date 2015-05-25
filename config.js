var fs = require('fs');
var yamljs = require('yamljs');
var _ = require('underscore');
var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];

var config = {};
var localYamlConfigFile = './config.yaml';
var homeYamlConfigFile = home + '/.sivan/config.yaml';
var systemConfigYamlFile = '/etc/sivan/config.yaml';

if (fs.existsSync(systemConfigYamlFile)) {
	console.log("Loading config file from: " + systemConfigYamlFile);
	config = yamljs.load(systemConfigYamlFile);
}

if (fs.existsSync(homeYamlConfigFile)) {
	console.log("Loading config file from: " + homeYamlConfigFile);
	config = _.extend(config, yamljs.load(homeYamlConfigFile));
}

if (fs.existsSync(localYamlConfigFile)) {
	console.log("Loading config file from: " + localYamlConfigFile);
	config = yamljs.load(localYamlConfigFile);
} 

if(_.isEmpty(config)){
	console.error("Config file not found!");
	process.exit()
}

module.exports = config;