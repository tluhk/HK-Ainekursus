const auth = process.env.AUTH;
const axios = require('axios').default;

// Github API token
const authToken = {
  headers: {
    Accept: 'application/vnd.github+json',
    Authorization: auth,
  },
};

module.exports = {
  axios,
  authToken,
};
