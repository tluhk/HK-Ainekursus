/* eslint-disable max-len */

const { default: axios } = require('axios');

const { searchUsers } = require('../../functions/githubAuthRequests');
const { requestMembers } = require('../../functions/githubMembersRequests');
const { cache } = require('../../setup/setupCache');

const { authToken } = require('../../setup/setupGithub');

/**
 * Define all API requests that are done to GitHub API
 */
const apiRequests = {
  getUsernameLinkedToPublicEmail: async (email) => {
    const usernameRaw = await axios.get(searchUsers(email), authToken).catch((error) => {
      console.log(error);
    });
    // console.log('usernameRaw1:', usernameRaw);
    const user = usernameRaw.data;
    // console.log('user1:', user);

    return user;
  },
};

module.exports = { apiRequests };
