const base64 = require('base-64');
const utf8 = require('utf8');
const { axios, authToken } = require('./setupGithub');
const { getAllRepos } = require('./allRepos');
const { updateRepoJSONFile } = require('./functions/updateRepoJSONFile');

// Import request functions for Axios
const {
  requestConfig,
} = require('./functions/repoFunctions');

const getRepoResponse = (async () => {
  const repoName = await getAllRepos();
  const selectedRepo = repoName[0];

  // console.log('repoName[1]', repoName[1]);
  let response = '';
  try {
    response = axios.get(requestConfig(selectedRepo), authToken);
    updateRepoJSONFile(selectedRepo);
  } catch (err) {
    // Handle Error Here
    console.error(err);
  }
  return response;
});

const getConfig = (async () => {
  const config = await getRepoResponse();
  const configDecoded = base64.decode(config.data.content);
  const configDecodedUtf8 = utf8.decode(configDecoded);
  // console.log('configDecodedUtf8', configDecodedUtf8);

  const configJSON = JSON.parse(configDecodedUtf8);

  return configJSON;
})();

module.exports = { getConfig };
