var express = require('express');
var router = express.Router();
require('dotenv').config();
var client_id = process.env.CLIENT_ID;
var client_secret = process.env.CLIENT_SECRET;
var redirect_uri = 'https://findmysound.herokuapp.com/callback'; // Your redirect uri
var stateKey = 'spotify_auth_state';
var generateRandomString = require('../utils').generateRandomString;
var filterResults = require('../utils').filterResults;
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');



// define the home page route
router.use(cookieParser());
router.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-top-read';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

router.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (error || response.statusCode !== 200) {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          })
          );
      }
      res.cookie('access_token', body.access_token);
      res.cookie('refresh_token', body.refresh_token);
      // we can also pass the token to the browser to make requests from there
      res.redirect('/recommendations?' +
       querystring.stringify({ 
         access_token: `req.cookies.access_token`,
         refresh_token: `req.cookies.refresh_token`
       })
       );
    });
  }
});
router.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

router.get('/recommendations', function(req, res) {
  const access_token = req.cookies.access_token;
  const refresh_token = req.cookies.refresh_token;
  if (req.cookies.access_token == null || req.cookies.refresh_token == null) {
    res.redirect('/login');
  }
  var options = {
    url: 'https://api.spotify.com/v1/me/top/artists?limit=5',
    headers: {
      'Authorization': 'Bearer ' + access_token
    },
    json: true
  };
  request.get(options, function(error, response, body) {
    //// grab users top artists, put artist id's into an array//////
    let topArtistIDs = [];
    let items = body.items;
    for (let item of items) {
      topArtistIDs.push(item.id);
    }
    let artistSeedList = topArtistIDs.join(',');
    var options = {
      url: `https://api.spotify.com/v1/recommendations?seed_artists=${artistSeedList}`,
      headers: {
        'Authorization': 'Bearer ' + access_token
      },
      json: true
    };
    ///use artist id's for a new API request
    request.get(options, function(error, response, body) {
      ///setting value of tracks to the tracks array within body///
      let tracks = body.tracks;
      //blank array to hold artist recs///
      let artistRecommendations = [];
      ///blank array to hold artist images
      ///looping thru tracks array   
      for (let track of tracks) {
        //looping thru artist array
        let artists = track.artists;
        //grabbing image urls
        const album = track.album;
        const images = album.images;
        let firstImage = images[0].url;
        for (let artist of artists) {
          //creating object to hold artist+ matching id//
          let artistAndID = {
            name: artist.name,
            id: artist.id,
            images: firstImage
          };
          //console.log(artistAndID);
          artistRecommendations.push(artistAndID);
        }
      }
      artistRecommendations = filterResults(artistRecommendations);
      res.render('pages/recommendations', {recList: artistRecommendations});
    });
  });
});

// define the about route
/*router.get('/about', function (req, res) {
  res.send('About birds')
})
//$('#logOut').click(function() {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.redirect('/login');
  });//*/

  module.exports = router;
