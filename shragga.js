#!/usr/bin/env node
var program = require('commander');

program
	.version('0.0.1')
	.option('-s, --server', 'Specify server url')
	.option('-c, --chroot', 'Root SVN directory')
	.option('-f, --file', 'Diff file location')
	.parse(process.argv);


console.log('Go away, I\'m busy now')