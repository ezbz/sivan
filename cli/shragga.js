#!/usr/bin/env node

var program = require('commander');

program
	.version('0.0.1')
	.command('wwyg', 'where will you go?')
	.command('update', 'like \'svn up\' but with sugar on top').alias('up')
	.command('status', 'like \'svn up\' but with sugar on top').alias('st')
	.command('diff', 'like \'svn diff\', show affected modules for current diff').alias('up')
	.option('-s, --server', 'Specify server url')
	.option('-c, --cwd', 'Root SVN directory (default is current directory)')
	.option('-f, --file', 'Use diff file')
	.parse(process.argv);

