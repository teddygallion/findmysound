const dotenv = require('dotenv').config();
const express = require('express');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const router = express.Router();
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const { generateRandomString, filterResults } = require('../utils');

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI; // Your redirect URI
const stateKey = 'spotify_auth_state';

exports.handler = async (event, context) => {
  const state = generateRandomString(16);
  return {
    statusCode: 302,
    headers: {
      'Set-Cookie': `spotify_auth_state=${state}; HttpOnly; Path=/`,
      Location: `https://accounts.spotify.com/authorize?${querystring.stringify({
        response_type: 'code',
        client_id: process.env.CLIENT_ID,
        scope: 'user-read-private user-read-email user-top-read',
        redirect_uri: process.env.REDIRECT_URI,
        state
      })}`
    }
  };
};