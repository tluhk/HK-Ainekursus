/* eslint-disable max-len */
const base64 = require('base-64');
const utf8 = require('utf8');
const { apiRequests } = require('../components/courses/coursesService');
const { axios, authToken } = require('../setup/setupGithub');

// Import request functions for Axios
const {
  requestConfig,
} = require('./githubReposRequests');

const getRepoResponse = async (selectedCourse, refBranch) => {
  console.log('refBranch2:', refBranch);
  let response = '';
  try {
    response = await axios.get(requestConfig(selectedCourse, refBranch), authToken);
  } catch (err) {
    // Handle Error Here
    console.error(err);
  }
  return response;
};

const getConfig = async (selectedCourse, teamSlug) => {
  console.log('selectedCourse0:', selectedCourse);
  // console.log('givenBranch0:', givenBranch);

  let refBranch;
  if (teamSlug && teamSlug !== 'master' && teamSlug !== 'teachers') { // check branch config if active
    // get all active branches in selected course Repo
    let branches;
    try {
      branches = await apiRequests.branchesService(selectedCourse);
    } catch (error) {
      console.error(error);
    }
    // console.log('branches0:', branches);
    if (branches.includes(teamSlug)) {
      refBranch = teamSlug;
    } else refBranch = 'master';
  }
  if (!teamSlug || teamSlug === 'master' || teamSlug === 'teachers') {
    refBranch = 'master';
  }

  console.log('selectedCourse1.5:', selectedCourse);
  console.log('refBranch1.5:', refBranch);

  const config = await getRepoResponse(selectedCourse, refBranch);
  // console.log('config2:', config);
  const configDecoded = base64.decode(config.data.content);
  const configDecodedUtf8 = utf8.decode(configDecoded);
  // console.log('configDecodedUtf8', configDecodedUtf8);

  const configJSON = JSON.parse(configDecodedUtf8);

  return configJSON;
};

const getConfigAndValidateActive = async (selectedCourse, teamSlug) => {
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

  let config = await getConfig(selectedCourse, teamSlug);
  // console.log('config5:', config);

  if (!config.active) {
    const branch = 'master';
    config = await getConfig(selectedCourse, branch);
  }
  // console.log('config6:', config);

  return config;
};

module.exports = { getConfigAndValidateActive, getConfig };
