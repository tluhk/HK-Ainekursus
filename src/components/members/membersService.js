/* eslint-disable max-len */

import axios from 'axios';

import githubMembersRequests from '../../functions/githubMembersRequests';
import { authToken } from '../../setup/setupGithub';

const { requestMembers } = githubMembersRequests;

/**
 * Define all API requests that are done to GitHub API
 */
const apiRequests = {
  getMembersService: async () => {
    // const members = await axios.get(requestMembers, authToken);

    // console.log('starting to get members');
    const membersRaw = await axios.get(requestMembers, authToken).catch((error) => {
      console.error(error);
    });
    // console.log('membersRaw2:', membersRaw);

    const members = membersRaw.data;
    // console.log('members1:', members);

    return members;
  },
};

export default apiRequests;
