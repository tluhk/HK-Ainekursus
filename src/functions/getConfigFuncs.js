/* eslint-disable max-len */
const base64 = require('base-64');
const utf8 = require('utf8');
const { axios, authToken } = require('../setup/setupGithub');

// Import request functions for Axios
const {
  requestConfig,
} = require('./githubReposRequests');

const getRepoResponse = async (selectedCourse, refBranch) => {
  // console.log('refBranch2:', refBranch);
  let response = '';
  try {
    response = await axios.get(requestConfig(selectedCourse, refBranch), authToken);
  } catch (err) {
    // Handle Error Here
    console.error(err);
  }
  return response;
};

const getConfig = async (selectedCourse, refBranch) => {
  let config;
  try {
    config = await getRepoResponse(selectedCourse, refBranch);
  } catch (error) {
    console.error(error);
  }

  if (!config.data) return null;
  // console.log('config2:', config);
  const configDecoded = base64.decode(config.data.content);
  const configDecodedUtf8 = utf8.decode(configDecoded);
  // console.log('configDecodedUtf8', configDecodedUtf8);

  const configJSON = JSON.parse(configDecodedUtf8);

  return configJSON;
};

/**
   * Get config for a course.
   * 1) get config of a given teamSlug.
   * - check if given team exists in given course Repo branches
   * - If does, then continue get its config
   * - Then check if this config has active:true
   * -- If config is NOT active:true, then repeat STEP 1 (a'ka do STEP 2), but change teamSlug to 'master':
   * 2) get config of team 'master'.
   * - don't check its active:true anymore, this is done in next code parts.
   */

module.exports = { getConfig };
