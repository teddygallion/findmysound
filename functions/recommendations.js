import fetch from 'node-fetch';
import querystring from 'querystring';

export const handler = async (event, context) => {
  const cookies = event.headers.cookie || ''; // Get cookies from headers
  const access_token = cookies.match(/access_token=([^;]+)/)?.[1];
  const refresh_token = cookies.match(/refresh_token=([^;]+)/)?.[1];

  console.log('Access Token:', access_token);
  console.log('Refresh Token:', refresh_token);

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
    console.log('Top Artists Data:', topArtistsData); // Log response

    if (!topArtistsResponse.ok) {
      throw new Error(`Failed to fetch top artists: ${topArtistsData.error.message}`);
    }

    let genres = topArtistsData.items?.flatMap(artist => artist.genres) || [];
    const uniqueGenres = [...new Set(genres)].slice(0, 4);

    let relatedArtists = [];

    for (const genre of uniqueGenres) {
      try {
        const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=genre:${genre}&type=artist&limit=10`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${access_token}` }
        });

        const searchData = await searchResponse.json();
        console.log(`Search Data for ${genre}:`, searchData); // Log response

        if (!searchResponse.ok || !searchData.artists) {
          throw new Error(`Failed to fetch artists for genre ${genre}`);
        }

        relatedArtists.push(
          ...searchData.artists.items.map(artist => ({
            name: artist.name,
            id: artist.id,
            image: artist.images?.[0]?.url || null,
            popularity: artist.popularity,
            genres: artist.genres
          }))
        );
      } catch (error) {
        console.error('Error fetching artists for genre:', error);
      }
    }

    relatedArtists = relatedArtists.filter(artist =>
      !topArtistsData.items.some(topArtist => topArtist.id === artist.id)
    );

    relatedArtists = relatedArtists.sort((a, b) => b.popularity - a.popularity);
    relatedArtists = relatedArtists.filter(artist => artist.genres.some(genre => uniqueGenres.includes(genre)));

    console.log('Final Recommendations:', relatedArtists); // Log final data

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
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
