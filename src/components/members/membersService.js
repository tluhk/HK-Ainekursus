/* eslint-disable max-len */

const { default: axios } = require('axios');
const { requestMembers } = require('../../functions/githubMembersRequests');
const { cache } = require('../../setup/setupCache');

const { authToken } = require('../../setup/setupGithub');

/**
 * Define all API requests that are done to GitHub API
 */
const apiRequests = {
  getMembersService: async (req, res) => {
    // const members = await axios.get(requestMembers, authToken);

    // console.log('starting to get members');
    const membersRaw = await axios.get(requestMembers, authToken).catch((error) => {
      console.log(error);
    });

    const members = membersRaw.data;
    // console.log('members1:', members);

    return members;
  },
};

module.exports = { apiRequests };
