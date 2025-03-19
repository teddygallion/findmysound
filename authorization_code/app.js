import path from 'path';
import express from 'express'; // Express web server framework
import cors from 'cors';
import cookieParser from 'cookie-parser';
import router from './routers/router.mjs';  // Assuming router.js is now router.mjs
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT;

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(cookieParser());
app.use('/', router);

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});

// Handle logout (this route can be added to the router file)
app.get('/logout', (req, res) => {
  res.clearCookie('spotify_auth_state');
  res.redirect('/'); // Redirect to home page after logging out
});
