var config = {};

config.logging = {
  defaultLevel: 'trace'
}

config.cache = {
  // proxy: require('./lib/memory-cache')
  proxy: require('./lib/redis-cache'),
  ttl: 9000
}

config.repository = {
  path: "/Users/erez/dev/outbrain/trunk",
}

config.svn = {
  url: 'https://svn.il.outbrain.com:8443/repos/Outbrain/trunk',
  commandParallelism: 10,
  maxChunkSize: 200,
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
          }
        }
      }
    },
    mappings: {
      body: {
        "revision": {
          "properties": {
            // "changes": {
            //   "properties": {
            //     "fields": {
            //       "path": "string",
            //       "index_analyzer": "path-analyzer"
            //     }
            //   }
            // },
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