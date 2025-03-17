const path = require('path');
const express = require('express'); // Express web server framework
const cors = require('cors');
const cookieParser = require('cookie-parser');
const router = require('./routers/router')
const dotenv = require("dotenv")
dotenv.config();

const PORT = process.env.PORT || 3000

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

app.use(express.static(__dirname + '/public'))
.use(cors())
.use(cookieParser());
app.use('/', router);
app.listen(PORT);
//res.GET(logout){back to home page}//
