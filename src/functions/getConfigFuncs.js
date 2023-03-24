/* eslint-disable max-len */
const base64 = require('base-64');
const utf8 = require('utf8');
const { axios, authToken } = require('../setup/setupGithub');

const { cache } = require('../setup/setupCache');

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

  /**
 * Check if cache already has course branch config.
 * If yes, read config from cache.
 * If not, make new github request for config and cache it.
 */
  // console.log('selectedCourse1:', selectedCourse);
  // console.log('refBranch1:', refBranch);

  const routePath = `getConfig:${selectedCourse}+${refBranch}`;
  // console.log('routePath1:', routePath);
  // console.log('cache.get(routePath)1:', cache.get(routePath));

  if (cache.has(routePath) && cache.get(routePath) !== undefined) {
    config = cache.get(routePath);
    console.log(`✅ getConfig FROM CACHE: ${selectedCourse}+${refBranch}`);
  } else {
    console.log(`❌ getConfig IS NOT from cache: ${selectedCourse}+${refBranch}`);
    try {
      config = await getRepoResponse(selectedCourse, refBranch);
    } catch (error) {
      console.error(error);
    }
    cache.set(routePath, config);
    // console.log('config from api');
  }

  if (!config.data) return null;
  // console.log('config2:', config);
  const configDecoded = base64.decode(config.data.content);
  const configDecodedUtf8 = utf8.decode(configDecoded);
  // console.log('configDecodedUtf8', configDecodedUtf8);

  const configJSON = JSON.parse(configDecodedUtf8);

  return configJSON;
};

module.exports = { getConfig };
