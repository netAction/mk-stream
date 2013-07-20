// MK-Wall 2013 by Thomas netAction Schmidt
// License: Do the fuck you want!
// Page: http://mk-stream.netaction.de/
// Sources: https://github.com/netAction/mk-stream

var express = require('express')
  , index = require('./routes')
  , image = require('./routes/image')
  , jobs = require('./routes/jobs')
  , jobData = require('./routes/jobData')
  , fetchImageMetadata = require('./routes/fetchImageMetadata')
  , http = require('http')
  , path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 8003);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon(__dirname + '/public/images/favicon.ico'));
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', index);
app.get('/image', image);
app.get('/jobs', jobs);
app.get('/fetchImageMetadata', fetchImageMetadata);
app.get('/jobData', jobData);


http.createServer(app).listen(app.get('port'), function(){
  console.log('MK-Stream server listening on port ' + app.get('port'));
});
