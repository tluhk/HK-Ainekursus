/* eslint-disable max-len */

import axios from 'axios';

import cache from '../../setup/setupCache.js';
import { authToken } from '../../setup/setupGithub.js';
import githubCommitsRequests from '../../functions/githubCommitsRequests.js';

const { requestCommits, requestCommitComments } = githubCommitsRequests;

/**
 * Define all API requests that are done to GitHub API
 */
const apiRequestsCommits = {
  /** Get commits from selected course and selected branch */
  commitsService: async (coursePathInGithub, refBranch) => {
    // console.log('refBranch8:', refBranch);

    const routePath = `${coursePathInGithub}+${refBranch}+commits`;

    let commits;

    if (!cache.has(routePath)) {
      console.log(`❌❌ commits IS NOT from cache: ${routePath}`);
      commits = await axios.get(requestCommits(coursePathInGithub, refBranch), authToken);

      cache.set(routePath, commits);
    } else {
      console.log(`✅✅ commits FROM CACHE: ${routePath}`);
      commits = cache.get(routePath);
    }

    return commits;
  },
  /** Get comments from selected course and selected commit */
  getCommitComments: async (coursePathInGithub, commitSHA) => {
    const routePath = `${coursePathInGithub}+commit+${commitSHA}+comments`;

    let comments;

    if (!cache.has(routePath)) {
      console.log(`❌❌ commit comments IS NOT from cache: ${routePath}`);
      comments = await axios.get(requestCommitComments(coursePathInGithub, commitSHA), authToken);

      cache.set(routePath, comments);
    } else {
      console.log(`✅✅ commit comments FROM CACHE: ${routePath}`);
      comments = cache.get(routePath);
    }

    return comments;
  },
};

export default apiRequestsCommits;
