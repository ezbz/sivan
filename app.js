/**
 * Module dependencies.
 */

var logger = require('./lib/logger').logger(module.filename);
var express = require('express');
var path = require('path');
var http = require('http');
var bodyParser = require('body-parser')
var methodOverride = require('method-override')
var morgan = require('morgan');
var favicon = require('serve-favicon');
var compression = require('compression');
var errorhandler = require('errorhandler');
var everyauth = require('everyauth');
var io = require('socket.io');
var stylus = require('stylus');
var nib = require('nib');
var scheduler = require('./lib/scheduler');
var appConfig = require('./config');
var subversion = require('./routes/subversion');
var diff = require('./routes/diff');
var indexer = require('./routes/indexer');
var revisions = require('./routes/revisions');
var index = require('./routes/index');

var app = express();

process.env.TZ = appConfig.time.defaultTimezone;

app.set('port', process.env.PORT || appConfig.app.port);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(favicon(__dirname + '/favicon.ico'));
app.use(morgan("combined"));
app.use(compression());
app.use(methodOverride());
app.use(stylus.middleware({
  src: path.join(__dirname, 'public'),
  compile: function(str, path) {
    return stylus(str)
      .set('filename', path)
      .use(nib())
  }
}));
app.use(function(req, res, next) {
  req.rawData = '';
  if (req.header('content-type') == 'text/plain') {
    req.on('data', function(chunk) {
      req.rawData += chunk;
    })
    req.on('end', function() {
      next();
    })
  } else {
    next();
  }
});
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(errorhandler({
    dumpExceptions: true,
    showStack: true,
  }));
  app.locals.pretty = true;
};

// http://stackoverflow.com/questions/7067966/how-to-allow-cors-in-express-nodejs
app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", 'Content-Type, X-Requested-With');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});
// handle OPTIONS requests from the browser
app.options("*", function(req, res, next) {
  res.send(200);
});

app.get('/partials/:name', function(req, res) {
  var name = req.params.name;
  res.render('partials/' + name);
});

app.get('/', index.home);
app.get('/config', function(req, res) {
  res.json(appConfig)
});
app.get('/svn/status', subversion.status);
app.get('/svn/update', subversion.update);
app.get('/svn/cleanup', subversion.cleanup);
app.get('/svn/info', subversion.info);
app.get('/svn/file/:file', subversion.file);
app.get('/svn/file/:file/:revision', subversion.revisionFile);
app.get('/svn/info/server', subversion.serverInfo);
app.get('/svn/revision/max', revisions.maxId);
app.get('/svn/revision/index/create', indexer.createIndex);
app.get('/svn/revision/sync', indexer.sync);
app.get('/svn/revision/missing', indexer.missing);
app.get('/svn/revision/missing/index', indexer.indexMissing);
app.get('/svn/revision/:revision', indexer.fetchOrIndexRevision);
app.get('/svn/revision/:revision/find', revisions.find);
app.get('/svn/revision/:revision/index', indexer.index);
app.post('/svn/diff/', diff.diffJsonPost);
app.post('/svn/diff/html', diff.diffHtmlPost);
app.get('/svn/diff/:revision', indexer.fetchOrIndexDiff);
app.get('/svn/diff/:revision/html', diff.diffHtml);
app.get('/svn/diffs/:revision', diff.diffsJson);
app.get('/svn/diffs/:revision/html', diff.diffsHtml);

var server = http.createServer(app);

var iosServer = io.listen(server.listen(app.get('port'), function() {
  logger.info('Express server listening on port ' + app.get('port'));
}));

var schedule = new scheduler();
schedule.scheduleSync(function(err, results) {
  if (err && err.length > 0) {
    logger.error("Error scheduled sync [%s]", JSON.stringify(err));
  } else {
    logger.info("Finished scheduled sync");
  }
});

iosServer.set('log level', 1); // set level to warn 
iosServer.sockets.on('connection', function(socket) {
  socket.on('send', function(data) {
    iosServer.sockets.emit('message', data);
  });
});