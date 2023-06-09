/* eslint-disable max-len */

const baseUrl = 'https://api.github.com';

// Github API request endpoints
const githubTeamsRequests = {
  requestTeams: 'https://api.github.com/orgs/tluhk/teams?per_page=1000',
  requestTeamMembers: (
    (teamSlug) => `${baseUrl}/orgs/tluhk/teams/${teamSlug}/members?per_page=1000`
  ),
};

export default githubTeamsRequests;
