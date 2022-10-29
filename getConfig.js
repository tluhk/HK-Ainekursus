const base64 = require('base-64');
const utf8 = require('utf8');
const { axios, authToken } = require('./setupGithub');
const { getAllRepos } = require('./allRepos');

// Import request functions for Axios
const {
  requestConfig,
} = require('./functions/repoFunctions');

const getResponse = (async () => {
  const repoName = await getAllRepos();

  // console.log('repoName[1]', repoName[1]);
  let response = '';
  try {
    response = axios.get(requestConfig(repoName[1]), authToken);
  } catch (err) {
    // Handle Error Here
    console.error(err);
  }
  return response;
});

const getConfig = (async () => {
  const config = await getResponse();
  const configDecoded = base64.decode(config.data.content);
  const configDecodedUtf8 = utf8.decode(configDecoded);
  const configJSON = JSON.parse(configDecodedUtf8);

  return configJSON;
})();

module.exports = { getConfig };
