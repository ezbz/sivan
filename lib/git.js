var logger = require('./logger').logger(module.filename);
var nodegit = require('nodegit');
var gitcmdexecutor = require('./gitcmdexecutor');
var config = require('../config');

var gitCmdClient = new gitcmdexecutor();

git = function() {};

git.prototype = {
  status: function(callback) {
    nodegit.Repository.open(config.repository.path).then(function(repo) {
      repo.getStatus().then(function(statuses) {
        var results = [];
        statuses.forEach(function(status) {
          results.push({
            status: statusToText(status),
            path: status.path()
          });
        });
        callback(null, results);
      });
    })
  },
  cat: function(params, callback) {
    nodegit.Repository.open(config.repository.path).then(function(repo) {
      repo.getCommit(params.revision).then(function(commit) {
        return commit.getEntry(params.path);
      }).then(function(entry) {
        return entry.getBlob();
      }).then(function(text) {
        callback(null, text.toString());
      });
    })
  },
  update: function(callback) {
    var repository;
    nodegit.Repository.open(config.repository.path).then(function(repo) {
        repository = repo;

        return repository.fetchAll({
          credentials: function(url, userName) {
            return nodegit.Cred.sshKeyFromAgent(userName);
          },
          certificateCheck: function() {
            return 1;
          }
        });
      })
      .then(function() {
        return repository.mergeBranches("master", "origin/master");
      })
      .done(function(revision) {
        callback(null, {
          revision: revision
        });
      });
  },
  cleanup: function(callback) {
    callback(null, {
      error: 'this operation is not supported by git'
    })
  },
  info: function(callback) {
    gitCmdClient.execute('rev-parse', 'origin/master', function(err, raw) {
      callback(err, {
        revision: String(raw).replace('\n', '')
      })
    });
  },
  serverInfo: function(callback) {
    gitCmdClient.execute('rev-parse', 'origin/master', function(err, raw) {
      callback(err, {
        revision: String(raw).replace('\n', '')
      })
    });
  },
  log: function(revision, callback) {
    var log = {
      files: []
    };
    nodegit.Repository.open(config.repository.path).then(function(repo) {
      return repo.getCommit(revision);
    }).then(function(commit) {
      log.revision = commit.sha();
      log.author = commit.author().name();// + " <" + commit.author().email() + ">";
      log.date = commit.date();
      log.message = commit.message();
      return commit.getDiff();
    }).done(function(diffList) {
      diffList.forEach(function(diff) {
        diff.patches().forEach(function(patch) {
          log.files.push({
              path: patch.newFile().path(),
              // oldFile: patch.oldFile().path(),
              status: statusText(patch.status())
            })
            // patch.hunks().forEach(function(hunk) {
            //   log.header = hunk.header().trim();
            //   log.lines = hunk.lines().map(function(line) {
            //     return String.fromCharCode(line.origin()) +
            //       line.content().trim();
            //   });
            // });
        });
      });

      callback(null, [].concat(log));
    });
  },
  diffText: function(revision, callback) {
    var command = revision.indexOf('..') == -1 ? 'show' : 'diff';
    gitCmdClient.execute(command, revision, callback);
  },
  shouldIndex: function(maxIndexedId, serverId) {
    return maxIndexedId == null || maxIndexedId != serverId;
  },
  revisionToIndex: function(maxIndexedId, serverId) {
    return serverId ;
  }
};

module.exports = git;

function statusText(status) {
  var Diff = nodegit.Diff;
  switch (status) {
    case Diff.DELTA.UNMODIFIED:
      return 'U';
    case Diff.DELTA.ADDED:
      return 'A';
    case Diff.DELTA.DELETED:
      return 'D';
    case Diff.DELTA.MODIFIED:
      return 'M';
    case Diff.DELTA.RENAMED:
      return 'R';
    case Diff.DELTA.COPIED:
      return 'C';
    case Diff.DELTA.IGNORED:
      return 'I';
    case Diff.DELTA.UNTRACKED:
      return 'K';
    case Diff.DELTA.TYPECHANGE:
      return 'T';
    default:
      return '-';
  }
}

function statusToText(status) {
  var words = [];
  if (status.isNew()) {
    words.push("N");
  }
  if (status.isModified()) {
    words.push("M");
  }
  if (status.isTypechange()) {
    words.push("T");
  }
  if (status.isRenamed()) {
    words.push("R");
  }
  if (status.isIgnored()) {
    words.push("I");
  }
  if (status.isDeleted()) {
    words.push("D");
  }

  return words.join(" ");
}