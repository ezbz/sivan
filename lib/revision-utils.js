var _ = require('underscore');
var moment = require('moment');
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
    return new Array().push(revision);
  }
  var parts = revision.split(":");
  return _.range(parseInt(parts[0]), parseInt(parts[1]) + 1);
}

module.exports.fetchModulesFromFiles = function(files, mapper) {
  return _.map(files, function(file) {
    if (mapper) {
      return mapper.map(file);
    }
    return file.path.split("/")[1];
  });
}
module.exports.fetchFileTypesFromFiles = function(files, mapper) {
  return _.chain(files).map(function(file) {
    if (mapper) {
      return mapper.map(file);
    }
    var parts = file.path.split("/");
    var lastParts = parts[parts.length-1].split(".");
    return (lastParts.length > 1) ? lastParts[lastParts.length - 1] : false;
  }).filter(function(file){
    return _.contains(knownFileTypes, file);
  }).compact().value();
}

var knownFileTypes = ['actionscript','apache','applescript','asciidoc','aspectj','autohotkey','avrasm','axapta','bash','brainfuck','capnproto','clojure','cmake','coffeescript','cpp','cs','css','d','dart','delphi','diff','django','dockerfile','dos','dust','elixir','erb','erlang','fix','fsharp','gcode','gherkin','glsl','go','gradle','groovy','haml','handlebars','haskell','haxe','http','ini','java','javascript','json','julia','lasso','less','lisp','livecodeserver','livescript','lua','makefile','markdown','mathematica','matlab','mel','mercury','mizar','monkey','nginx','nimrod','nix','nsis','objectivec','ocaml','oxygene','parser3','perl','pf','php','powershell','processing','profile','protobuf','puppet','python','q','r','rib','roboconf','rsl','ruby','ruleslanguage','rust','scala','scheme','scilab','scss','smali','smalltalk','sml','sql','stata','step21','stylus','swift','tcl','tex','thrift','twig','typescript','vala','vbnet','vbscript','verilog','vhdl','vim','x86asm','xl','xml','as','apacheconf','osascript','adoc','sh','zsh','bf','capnp','clj','cmake.in','coffee','cson','iced','c','h','c++','h++','csharp','patch','jinja','docker','bat','cmd','dst','erl','fs','nc','feature','golang','hbs','html.hbs','html.handlebars','hs','hx','jsp','js','ls','lassoscript','ls','mk','mak','md','mkdown','mkd','mma','m','moo','nginxconf','nixos','m','mm','objc','obj-c','ml','pl','pf.conf','php3','php4','php5','php6','ps','pp','py','gyp','k','kdb','graph','instances','rb','gemspec','podspec','thor','irb','rs','sci','smali','st','ml','do','ado','p21','step','stp','styl','tk','craftcms','ts','vb','vbs','v','tao','html','xhtml','rss','atom','xsl','plist']

module.exports.enrichRevision = function(revision) {
  revision.message = unescape(revision.message);
  var modules = module.exports.fetchModulesFromFiles(revision.files);
  var fileTypes = module.exports.fetchFileTypesFromFiles(revision.files);
  revision.tags = revision.message.match(/#\w+/g);
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