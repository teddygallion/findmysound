var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

function filterResults(artistRecommendations){
  const results = [];
  const artistIDsAlreadySeen = [];
  for (let item of artistRecommendations){
    if (!artistIDsAlreadySeen.includes(item.id)){
      artistIDsAlreadySeen.push(item.id);
      results.push(item);
    };
  }
  return results;
}

module.exports = {
  generateRandomString: generateRandomString,
  filterResults : filterResults
};
