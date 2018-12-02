/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');
var path = require('path');
var routes = require('./routes/index');
var apis = require('./routes/apis');
// create a new express server
var app = express();
// all environments
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//app.set('port', process.env.PORT || 3000);
// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));
app.use('/', routes);
app.use('/apis', apis);
// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();
// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
