// Utility function to generate a random string of a given length
export const generateRandomString = (length) => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

// Function to filter out duplicate artist recommendations
export function filterResults(artistRecommendations) {
  const results = [];
  const artistIDsAlreadySeen = [];
  
  for (let item of artistRecommendations) {
    if (!artistIDsAlreadySeen.includes(item.id)) {
      artistIDsAlreadySeen.push(item.id);
      results.push(item);
    }
  }

  return results;
}
