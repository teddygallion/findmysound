import path from 'path';
import querystring from 'querystring';
import { generateRandomString } from '../authorization_code/utils.js';  // Ensure correct path with .js extension
import dotenv from 'dotenv';  // Import dotenv
dotenv.config();  // Load environment variables

export const handler = async (event, context) => {
  const state = generateRandomString(16);
  const authorizationUrl = `https://accounts.spotify.com/authorize?${querystring.stringify({
    response_type: 'code',
    client_id: process.env.CLIENT_ID,
    scope: 'user-read-private user-read-email user-top-read',
    redirect_uri: process.env.REDIRECT_URI,
    state
  })}`;

  console.log('Authorization URL:', authorizationUrl);

  return {
    statusCode: 302,
    headers: {
      'Set-Cookie': `spotify_auth_state=${state}; HttpOnly; Path=/; SameSite=Lax`, // Set the cookie
      Location: authorizationUrl
    }
  };
};