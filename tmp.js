var config = {};

config.app = {
  port: 3001
}

config.logging = {
  defaultLevel: 'info'
}

config.cache = {
  proxy: 'redis-cache',
  ttl: 9000
}

config.repository = {
  path: "/outbrain/Prod/Apps/sivan/trunk",
  autoSync: true,
  autoSyncMinutes: 5
}

config.indexer = {
  indexQueueSize: 5,
  diffQueueSize: 5,
  reindexQueueSize: 100,
  maxChunkSize: 20
}

config.svn = {
  debug: true,
  url: 'http://svn/repos/Outbrain/trunk',
  httpUrl: 'http://roapi:roapi@svn/repos/Outbrain/trunk',
  commandParallelism: 10
}

config.time = {
  defaultTimezone: 'America/New_York',
  timeZoneByDc: {
    ladc1: 'America/Los_Angeles',
    nydc1: 'America/New_York',
    chidc1: 'America/Chicago'
  }
};

config.maven = {
  rootNode: "com.outbrain:outbrain:pom:trunk",
  generateDotFilesCmd: "mvn org.apache.maven.plugins:maven-dependency-plugin:2.9:tree -DoutputFile=tree.dot -DoutputType=dot"
}


config.elasticsearch = {
  logLevel: 'info',
  host: 'localhost',
  port: 9200,
  logLevel: 'warning',
  maven: {
    files: {
      index: 'maven',
      type: 'path'
    },
    tree: {
      index: 'maven',
      type: 'tree'
    }
  },
  revision: {
    settings: {
      body: {
        "settings": {
          "analysis": {
            "analyzer": {
              "path-analyzer": {
                "type": "custom",
                "tokenizer": "path-tokenizer"
              }
            },
            "tokenizer": {
              "path-tokenizer": {
                "type": "path_hierarchy",
                "delimiter": "/"
              }
            }
          },
          "index": {
            "store": {
              "compress": {
                "stored": 1
              }
            }
          }
        }
      }
    },
    mappings: {
      body: {
        "revision": {
          "properties": {
            "revision": {
              "type": "long"
            },
            "tags": {
              "type": "string",
              "index": "not_analyzed"
            },
            "date": {
              "type": "date",
              "format": "basic_date_time"
            },
            "modules": {
              "type": "string",
              "index": "not_analyzed"
            },
            "author": {
              "type": "string",
              "index": "not_analyzed"
            }
          }
        }
      }
    }
  }
};


module.exports = config;
