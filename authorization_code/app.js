var path = require('path');
var express = require('express'); // Express web server framework
var cors = require('cors');
var cookieParser = require('cookie-parser');
var router = require('./routers/router')
const PORT = process.env.PORT || 5000

var app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

app.use(express.static(__dirname + '/public'))
.use(cors())
.use(cookieParser());
app.use('/', router);
app.listen(PORT);
//res.GET(logout){back to home page}//
