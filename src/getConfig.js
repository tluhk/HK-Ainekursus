const base64 = require('base-64');
const utf8 = require('utf8');
const { axios, authToken } = require('./setup/setupGithub');
// const { updateRepoJSONFile } = require('./functions/updateRepoJSONFile');

// Import request functions for Axios
const {
  requestConfig,
} = require('./functions/repoFunctions');

const getRepoResponse = async (selectedCourse) => {
  let response = '';
  try {
    response = await axios.get(requestConfig(selectedCourse), authToken);
    // updateRepoJSONFile(selectedCourse);
  } catch (err) {
    // Handle Error Here
    console.error(err);
  }
  return response;
};

const getConfig = async (selectedCourse) => {
  const config = await getRepoResponse(selectedCourse);
  const configDecoded = base64.decode(config.data.content);
  const configDecodedUtf8 = utf8.decode(configDecoded);
  // console.log('configDecodedUtf8', configDecodedUtf8);

  const configJSON = JSON.parse(configDecodedUtf8);

  return configJSON;
};

module.exports = { getConfig };
