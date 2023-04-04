/* eslint-disable max-len */

import axios from 'axios';

import githubAuthRequests from '../../functions/githubAuthRequests';
import { authToken } from '../../setup/setupGithub';

const { searchUsers } = githubAuthRequests;

/**
 * Define all API requests that are done to GitHub API
 */
const apiRequests = {
  getUsernameLinkedToPublicEmail: async (email) => {
    const usernameRaw = await axios.get(searchUsers(email), authToken).catch((error) => {
      console.error(error);
    });
    // console.log('usernameRaw1:', usernameRaw);
    const user = usernameRaw.data;
    // console.log('user1:', user);

    return user;
  },
};

export default apiRequests;
