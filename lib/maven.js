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
exports.listDotFiles = function(callback) {
  listDotFiles(callback);
};

exports.parseDotFile = function(moduleId, callback) {
  parseDotFile(moduleId, callback)
};

exports.uiTree = function(moduleId, callback) {
  fetchTree(moduleId, function(err, json) {
    callback(err, transformToUIJson(json));
  });
};

exports.moduleTree = function(moduleId, callback) {
  fetchTree(moduleId, function(err, tree) {
    callback(err, tree);
  });
};
exports.dependants = function(moduleId, callback) {
  var moduleIds = moduleId.split(',');
  fetchAllTree(function(err, tree) {
    var keepGoing = true;
    var results = []
    while (keepGoing) {
      var currentDeps = fetchDeepDepedencies(tree, moduleIds);
      results = _.uniq(results.concat(currentDeps));
      // console.log(currentDeps);
      moduleIds = _.difference(results, currentDeps);
      keepGoing = currentDeps.length > 0;
    }

    callback(err, results.sort());
  });
};

function fetchDeepDepedencies(tree, moduleIds) {
  var results = _.filter(tree, function(module) {
    for (var i = 0; i < moduleIds.length; i++) {
      if (hasDeepDependency(module, moduleIds[i])) {
        return true;
      }
    }
  });
  results = _.map(results, function(result) {
    return result.id;
  });
  return results;
}

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


function fetchTree(moduleId, callback) {
  fetchAllTree(function(err, tree) {
    if (moduleId && moduleId !== 'all') {
      var moduleIds = moduleId.split(',')
      var moduleTree = _.filter(tree, function(module) {
        return _.contains(moduleIds, module.id);
      });
      callback(err, moduleTree)
    } else {
      callback(err, tree);
    }
  })
}

function fetchAllTree(callback) {
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

        var response = parseMavenStructure(_.flatten(json));
        cache.put("sivan.maven.tree", response, config.cache.ttl);
        callback(err, response);
      });
    });
  });
};


function parseMavenStructure(results) {
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
      value.dependencies = parseMavenStructure(result.children)
    }
    return value;
  });
};

function buildTreeRecursive(array, parent, tree) {
  tree = tree ? tree : [];
  parent = parent ? parent : {
    id: config.maven.rootNode
  };

  var children = _.filter(array, function(child) {
    return child.parent == parent.id;
  });

  if (!_.isEmpty(children)) {
    if (parent.id == config.maven.rootNode) {
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
      text: module.group + ":" + module.id + " (" + module.version + ")"
    }
    if (module.dependencies) {
      value.children = transformToUIJson(module.dependencies);
    }
    return value;
  });
}