var logger = require('../lib/logger').logger(module.filename);
var fs = require("fs");
var glob = require("glob");
var _ = require("underscore");
var dot = require('graphlib-dot');
var async = require('async');
var exec = require('child_process').exec;
var elasticsearch = require('../lib/elasticsearch');
var config = require('../config');
var cache = require('../lib/cache');

var esClient = new elasticsearch();

exports.generateDotFiles = function(callback) {
  logger.info("Executing command [%s]", config.maven.generateDotFilesCmd);
  var proc = exec(config.maven.generateDotFilesCmd, {
    cwd: config.repository.path,
    timeout: 300000,
  }, function(error, stdout, stderr) {
    logger.info('stdout: [%s]', stdout);
    if (stderr) {
      logger.error('stderr: [%s]', stderr);
      logger.error('error: [%s]', JSON.stringify(error));
    }
    callback(error, stdout);
  });

};
exports.listDoFiles = function(callback) {
  listDotFiles(callback);
};

exports.parseDotFile = function(moduleId, callback) {
  parseDotFile(moduleId, callback)
};

exports.tree = function(callback) {
  fetchTree(callback);
};
exports.uiTree = function(callback) {
  fetchTree(function(err, json) {
    callback(err, transformToUIJson(json));
  });
};

exports.module = function(moduleId, callback) {
  fetchTree(function(err, tree) {
    callback(err, _.findWhere(tree, {
      id: moduleId
    }));
  });
};
exports.dependants = function(moduleId, deep, callback) {
  fetchTree(function(err, tree) {
    var results = _.filter(tree, function(module) {
      return hasDeepDependency(module, moduleId);
    });
    if (!deep) {
      results = _.map(results, function(result) {
        return _.omit(result, "dependencies");
      })
    }


    callback(err, results);
  });
};

function listDotFiles(callback) {
  cache.get("sivan.maven.dotFiles.list", function hitCallback(err, json) {
    callback(err, json);
  }, function missCallback() {
    glob("**/*.dot", {
      cwd: config.repository.path,
      nosort: true,
      noDir: true,
      debug: false,
      cache: {}
    }, function(err, files) {
      var result = _.map(files, function(file) {
        var parts = file.split("/");
        var module = parts[parts.length - 2];
        return {
          module: module ? module : "root",
          path: file
        };
      });
      cache.put("sivan.maven.dotFiles.list", result, config.cache.ttl);
      callback(err, result);
    });
  });
};

function parseDotFile(moduleId, callback) {
  var cacheKey = "sivan.maven.dotFiles.content." + moduleId;
  cache.get(cacheKey, function hitCallback(err, json) {
    callback(err, json);
  }, function missCallback() {
    listDotFiles(function(err, files) {
      var module = _.findWhere(files, {
        module: moduleId
      });

      if (!module) {
        callback("No module named " + moduleId, {});
      }
      fs.readFile(config.repository.path + "/" + module.path, 'UTF-8', function read(err, data) {
        var digraph = dot.read(data);
        var results = _.map(digraph.edges(), function(node) {
          return {
            id: node['w'],
            parent: node['v']
          }
        });

        cache.put(cacheKey, results, config.cache.ttl);
        callback(null, results);
      });
    });
  });
};


function fetchTree(callback) {
  cache.get("sivan.maven.tree", function hitCallback(err, json) {
    callback(err, json);
  }, function missCallback() {
    listDotFiles(function(err, modules) {
      async.mapLimit(modules, 10, function(module, callback) {
        parseDotFile(module.module, function(err, deps) {
          deps.push({
            id: "com.outbrain:" + module.module + ":jar:trunk",
            parent: "com.outbrain:outbrain:pom:trunk"
          });
          callback(err, deps);
        });
      }, function(err, results) {
        var json = _.map(results, function(result) {
          return buildTreeRecursive(result);
        });

        var response = structure(_.flatten(json));
        cache.put("sivan.maven.tree", response, config.cache.ttl);
        callback(err, response);
      });
    });
  });
};

function hasDeepDependency(root, moduleId) {
  if (!root.dependencies) return false;
  for (var i = 0; i < root.dependencies.length; i++) {
    var dependency = root.dependencies[i];
    if (dependency.id == moduleId || (dependency.children && hasDeepDependency(dependency, moduleId))) {
      return true;
    }
  }
  return false;
}


function structure(results) {
  return _.map(results, function(result) {
    var parts = result.id.split(":");
    var value = {
      group: parts[0],
      id: parts[1],
      type: parts[2],
      version: parts[3],
      scope: parts[4]
    };
    if (result.children) {
      value.dependencies = structure(result.children)
    }
    return value;
  });
};

function buildTreeRecursive(array, parent, tree) {
  tree = tree ? tree : [];
  parent = parent ? parent : {
    id: "com.outbrain:outbrain:pom:trunk"
  };

  var children = _.filter(array, function(child) {
    return child.parent == parent.id;
  });

  if (!_.isEmpty(children)) {
    if (parent.id == "com.outbrain:outbrain:pom:trunk") {
      tree = children;
    } else {
      parent['children'] = children;
    }
    _.each(children, function(child) {
      buildTreeRecursive(array, child)
    });
  }

  return tree;
};


function transformToUIJson(modules) {
  return _.map(modules, function(module) {
    var value = {
      text: module.group + ":" + module.id
    }
    if (module.dependencies) {
      value.children = transformToUIJson(module.dependencies);
    }
    return value;
  });
}