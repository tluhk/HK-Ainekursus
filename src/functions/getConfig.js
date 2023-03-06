const base64 = require('base-64');
const utf8 = require('utf8');
const { axios, authToken } = require('../setup/setupGithub');

// Import request functions for Axios
const {
  requestConfig,
} = require('./githubReposRequests');

const getRepoResponse = async (selectedCourse, team, refBranch) => {
  let response = '';
  try {
    response = await axios.get(requestConfig(selectedCourse, team, refBranch), authToken);
  } catch (err) {
    // Handle Error Here
    console.error(err);
  }
  return response;
};

const getConfig = async (selectedCourse, team, refBranch) => {
  console.log('team1:', team);
  console.log('refBranch1:', refBranch);
  const config = await getRepoResponse(selectedCourse, team, refBranch);
  const configDecoded = base64.decode(config.data.content);
  const configDecodedUtf8 = utf8.decode(configDecoded);
  // console.log('configDecodedUtf8', configDecodedUtf8);

  const configJSON = JSON.parse(configDecodedUtf8);

  return configJSON;
};

module.exports = { getConfig };
