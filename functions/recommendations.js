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

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { filterResults } = require('../utils');

exports.handler = async (event, context) => {
  const access_token = event.cookies?.access_token;
  const refresh_token = event.cookies?.refresh_token;

  if (!access_token || !refresh_token) {
    return {
      statusCode: 302,
      headers: {
        Location: '/login'
      }
    };
  }

  try {
    const topArtistsResponse = await fetch('https://api.spotify.com/v1/me/top/artists?limit=10', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    const topArtistsData = await topArtistsResponse.json();

    if (!topArtistsResponse.ok) {
      throw new Error(`Failed to fetch top artists: ${topArtistsData.error.message}`);
    }

    const genres = topArtistsData.items.reduce((acc, artist) => {
      return [...acc, ...artist.genres];
    }, []);

    const uniqueGenres = [...new Set(genres)].slice(0, 4);

    let relatedArtists = [];
    for (const genre of uniqueGenres) {
      try {
        const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=genre:${genre}&type=artist&limit=10`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${access_token}` }
        });

        const searchData = await searchResponse.json();

        if (!searchResponse.ok) {
          throw new Error(`Failed to fetch artists for genre ${genre}`);
        }

        relatedArtists = [
          ...relatedArtists,
          ...searchData.artists.items.map(artist => ({
            name: artist.name,
            id: artist.id,
            images: artist.images.length > 0 ? artist.images[0].url : null,
            popularity: artist.popularity,
            genres: artist.genres
          }))
        ];
      } catch (error) {
        console.error('Error fetching artists for genre:', error);
      }
    }

    relatedArtists = relatedArtists.filter(artist =>
      !topArtistsData.items.some(topArtist => topArtist.id === artist.id)
    );

    relatedArtists = relatedArtists.sort((a, b) => b.popularity - a.popularity);

    relatedArtists = relatedArtists.filter(artist =>
      artist.genres.some(genre => uniqueGenres.includes(genre))
    );

    relatedArtists = filterResults(relatedArtists);

    return {
      statusCode: 200,
      body: JSON.stringify({ recList: relatedArtists })
    };
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return {
      statusCode: 302,
      headers: {
        Location: `/#${querystring.stringify({ error: 'failed_to_fetch_recommendations' })}`
      }
    };
  }
};