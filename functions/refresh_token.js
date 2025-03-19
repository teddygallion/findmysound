import path from 'path';
import querystring from 'querystring';
import fetch from 'node-fetch';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

export const handler = async (event, context) => {
  const { refresh_token } = event.queryStringParameters;

  try {
    const refreshResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: querystring.stringify({
        grant_type: 'refresh_token',
        refresh_token
      })
    });

    const body = await refreshResponse.json();

    if (refreshResponse.ok) {
      return {
        statusCode: 200,
        body: JSON.stringify({ access_token: body.access_token })
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'failed_to_refresh_token' })
      };
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'server_error' })
    };
  }
};
