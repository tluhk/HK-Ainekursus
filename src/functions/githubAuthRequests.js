/* eslint-disable max-len */

const baseUrl = 'https://api.github.com';

const githubAuthRequests = {
  searchUsers: (
    (email) => `${baseUrl}/search/users?q=${email}`
  ),
};

// Github API request endpoints
export default githubAuthRequests;
