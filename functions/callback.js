import path from 'path';
import querystring from 'querystring';
import { default as fetch } from 'node-fetch';  // Dynamic import for fetch
import { generateRandomString } from '../authorization_code/utils.js';  // Ensure the correct path with .js extension

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

export const handler = async (event, context) => {
  const { code, state } = event.queryStringParameters;

  const cookies = event.headers?.cookie
    ? Object.fromEntries(event.headers.cookie.split('; ').map(c => c.split('=')))
    : {};
  const storedState = cookies.spotify_auth_state;
  
  console.log('State from callback URL:', state);
  console.log('Stored state from cookie:', storedState);
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
