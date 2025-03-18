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
router.use(cookieParser());

router.get('/login', (req, res) => {
    const state = generateRandomString(16);
    res.cookie(stateKey, state);

    const scope = 'user-read-private user-read-email user-top-read';
    res.redirect(`https://accounts.spotify.com/authorize?` +
        querystring.stringify({
            response_type: 'code',
            client_id,
            scope,
            redirect_uri,
            state
        }));
});

router.get('/callback', async (req, res) => {
    const code = req.query.code || null;
    const state = req.query.state || null;
    const storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        return res.redirect('/#' + querystring.stringify({ error: 'state_mismatch' }));
    }

    res.clearCookie(stateKey);

    try {
        const authResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${client_id}:${client_secret}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: querystring.stringify({
                code,
                redirect_uri,
                grant_type: 'authorization_code'
            })
        });

        const body = await authResponse.json();

        if (!authResponse.ok) {
            return res.redirect('/#' + querystring.stringify({ error: 'invalid_token' }));
        }

        res.cookie('access_token', body.access_token);
        res.cookie('refresh_token', body.refresh_token);

        return res.redirect('/recommendations?' + querystring.stringify({
            access_token: body.access_token,
            refresh_token: body.refresh_token
        }));
    } catch (error) {
        console.error('Error fetching token:', error);
        return res.redirect('/#' + querystring.stringify({ error: 'server_error' }));
    }
});

router.get('/refresh_token', async (req, res) => {
    const refresh_token = req.query.refresh_token;

    try {
        const refreshResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${client_id}:${client_secret}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: querystring.stringify({
                grant_type: 'refresh_token',
                refresh_token
            })
        });

        const body = await refreshResponse.json();

        if (refreshResponse.ok) {
            return res.json({ access_token: body.access_token });
        } else {
            return res.status(400).json({ error: 'failed_to_refresh_token' });
        }
    } catch (error) {
        console.error('Error refreshing token:', error);
        return res.status(500).json({ error: 'server_error' });
    }
});

router.get('/recommendations', async (req, res) => {
    const access_token = req.cookies.access_token;
    const refresh_token = req.cookies.refresh_token;

    if (!access_token || !refresh_token) {
        return res.redirect('/login');
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

        return res.render('pages/recommendations', { recList: relatedArtists });

    } catch (error) {
        console.error('Error fetching recommendations:', error);
        return res.redirect('/#' + querystring.stringify({ error: 'failed_to_fetch_recommendations' }));
    }
});


module.exports = router;
