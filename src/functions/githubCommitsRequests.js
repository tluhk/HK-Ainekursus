/* eslint-disable max-len */

const baseUrl = 'https://api.github.com';

// Github API request endpoints
module.exports = {
  requestRepos: 'https://api.github.com/orgs/tluhk/repos',
  requestTeamCourses: (
    (teamSlug) => `${baseUrl}/orgs/tluhk/teams/${teamSlug}/repos`
  ),
  requestRepoBranches: (
    (coursePathInGithub) => `${baseUrl}/repos/${coursePathInGithub}/branches`
  ),
  // config
  requestConfig: (
    (coursePathInGithub, refBranch) => `${baseUrl}/repos/${coursePathInGithub}/contents/config.json?ref=${refBranch}`
  ),
  // docs related
  requestCommits: (
    (coursePathInGithub, refBranch) => {
      const date = new Date();
      date.setDate(date.getDate() - 14);
      const dateISO = date.toISOString();
      console.log('dateISO:', dateISO);
      return `${baseUrl}/repos/${coursePathInGithub}/commits?per_page=100&sha=${refBranch}&since=${dateISO}`;
    }
  ),
  requestCommitComments: (
    (coursePathInGithub, commitSHA) => `${baseUrl}/repos/${coursePathInGithub}/commits/${commitSHA}/comments`
  ),
};
