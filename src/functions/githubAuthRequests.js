/* eslint-disable max-len */

const baseUrl = 'https://api.github.com';

// Github API request endpoints
module.exports = {
  deleteAppAuthorization: (
    (clientID) => `${baseUrl}/applications/${clientID}/grant`
  ),
};
