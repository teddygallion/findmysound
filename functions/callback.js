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

const querystring = require('querystring');
const { generateRandomString } = require('../utils');

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const querystring = require('querystring');

exports.handler = async (event, context) => {
  const { code, state } = event.queryStringParameters;
  const storedState = event.cookies?.spotify_auth_state;

  if (state === null || state !== storedState) {
    return {
      statusCode: 302,
      headers: {
        Location: `/#${querystring.stringify({ error: 'state_mismatch' })}`
      }
    };
  }

  try {
    const authResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: querystring.stringify({
        code,
        redirect_uri: process.env.REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    const body = await authResponse.json();

    if (!authResponse.ok) {
      return {
        statusCode: 302,
        headers: {
          Location: `/#${querystring.stringify({ error: 'invalid_token' })}`
        }
      };
    }

    return {
      statusCode: 302,
      headers: {
        'Set-Cookie': [
          `access_token=${body.access_token}; HttpOnly; Path=/`,
          `refresh_token=${body.refresh_token}; HttpOnly; Path=/`
        ],
        Location: `/recommendations?${querystring.stringify({
          access_token: body.access_token,
          refresh_token: body.refresh_token
        })}`
      }
    };
  } catch (error) {
    console.error('Error fetching token:', error);
    return {
      statusCode: 302,
      headers: {
        Location: `/#${querystring.stringify({ error: 'server_error' })}`
      }
    };
  }
};