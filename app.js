
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var routes_test = require('./routes/routes_intro');
var http = require('http');
var path = require('path');
var MongoStore = require('connect-mongo')(express);
var settings = require('./settings');
var flash = require('connect-flash'); //express从3.*开始不再支持内置flash，想要使用flash，就需要调用app.use(middleWare)

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(flash());//use flash this way

app.use(express.favicon());   //app.use(express.favicon(__dirname + '/public/images/favicon.ico'));
app.use(express.logger('dev')); //
app.use(express.bodyParser({ keepExtensions: true, uploadDir: './public/tmp' })); //add upload file function
app.use(express.methodOverride());  //

//for session integration
app.use(express.cookieParser());
app.use(express.session({
    secret : settings.cookieSecret,
    key : settings.db, //name of cookie
    cookie : {httpOnly: true, maxAge : 1000 * 60 * 60 * 24}, //One Day
    store : new MongoStore({
        db : settings.db
    })
}));

app.use(app.router);   //
app.use(express.static(path.join(__dirname, 'public')));  //



// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//route rule here
routes(app);
routes_test(app);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
