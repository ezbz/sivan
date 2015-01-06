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
var appConfig = require('./config');
var revisions = require('./routes/revisions');
var maven = require('./routes/maven');
var index = require('./routes/index');

var app = express();

process.env.TZ = appConfig.time.defaultTimezone;

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(favicon(__dirname + '/favicon.ico'));
app.use(morgan("combined"));
app.use(compression());
// app.use(express.urlencoded())
// app.use(express.json())
app.use(methodOverride());
// app.use(app.router);
// app.use(auth.connect(basic));
app.use(stylus.middleware({
  src: path.join(__dirname, 'public'),
  compile: function(str, path) {
    return stylus(str)
      .set('filename', path)
      .use(nib())
  }
}));
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


// app.get('/', routes.index);
// jade prep stuff
// app.get('/common/:id', routes.common);
// app.get('/widget/:id', routes.widget);
// app.get('/dashboard', routes.dashboard);
// app.get('/dashboard/:name', routes.dashboardByName);
// app.get('/editor', routes.editor);
// app.get('/dashanti', routes.dashanti);

app.get('/partials/:name', function(req, res) {
  var name = req.params.name;
  res.render('partials/' + name);
});

app.get('/', index.home);
app.get('/config', function(req, res) {
  res.json(appConfig)
});
app.get('/svn/status', revisions.status);
app.get('/svn/update', revisions.update);
app.get('/svn/cleanup', revisions.cleanup);
app.get('/svn/info', revisions.info);
app.get('/svn/info/server', revisions.serverInfo);
app.get('/svn/revision/:revision', revisions.revision);
app.get('/svn/revision/:revision/modules', revisions.revisionModules);
app.get('/svn/revision/:revision/modules/dependants', revisions.revisionModulesDependants);
app.get('/svn/revision/:revision/find', revisions.find);
app.get('/svn/revision/:revision/index', revisions.index);
app.get('/svn/diff/:revision', revisions.diffJson);
app.get('/svn/diff/:revision/html', revisions.diffHtml);
app.get('/svn/diffs/:revision', revisions.diffsJson);
app.get('/svn/diffs/:revision/html', revisions.diffsHtml);
app.get('/maven/dotfiles/generate', maven.generateDotFiles);
app.get('/maven/dotfiles/list', maven.listDoFiles);
app.get('/maven/dotfiles/:moduleId', maven.parseDotFile);
app.get('/maven/module/all', maven.tree);
app.get('/maven/module/all.tree.json', maven.uiTree);
app.get('/maven/module/all/html', maven.htmlTree);
app.get('/maven/module/:moduleId', maven.module);
app.get('/maven/module/:moduleId/dependants', maven.dependants);

var server = http.createServer(app);

var iosServer = io.listen(server.listen(app.get('port'), function() {
  logger.info('Express server listening on port ' + app.get('port'));
}));

iosServer.set('log level', 1); // set level to warn 
iosServer.sockets.on('connection', function(socket) {
  socket.on('send', function(data) {
    iosServer.sockets.emit('message', data);
  });
});