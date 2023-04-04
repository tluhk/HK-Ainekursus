/* eslint-disable max-len */

import axios from 'axios';

import cache from '../../setup/setupCache';
import githubReposRequests from '../../functions/githubReposRequests';
import { authToken } from '../../setup/setupGithub';
import getConfigFuncs from '../../functions/getConfigFuncs';
import githubCommitsRequests from '../../functions/githubCommitsRequests';

const { requestRepoBranches } = githubReposRequests;
const { getConfig } = getConfigFuncs;
const { requestCommits, requestCommitComments } = githubCommitsRequests;

/**
 * Define all API requests that are done to GitHub API
 */
const apiRequestsCommits = {
  activeBranchesService: async (coursePathInGithub) => {
    const routePath = `${coursePathInGithub}+branches`;
    /**
     * Get list of repo branches
     * Then validate branches where config has active:true
     * Pass only those branches as array
     */

    let branches;
    let activeBranches;

    if (!cache.has(routePath)) {
      console.log(`❌❌ branches IS NOT from cache: ${routePath}`);

      const branchesRaw = await axios.get(requestRepoBranches(coursePathInGithub), authToken);

      branches = branchesRaw.data.map((branch) => branch.name);
      // console.log('coursePathInGithub5:', coursePathInGithub);
      // console.log('truebranches5:', branches);

      const branchPromises = await branches.reduce((acc, branch) => {
        acc[branch] = getConfig(coursePathInGithub, branch);
        return acc;
      }, {});

      // console.log('branchPromises5:', branchPromises);

      const activeBranchesRaw = await Promise.all(Object.entries(branchPromises).map(([key, promise]) => promise.then((value) => [key, value])))
        .then((resolvedArr) => {
          const resolvedObj = Object.fromEntries(resolvedArr);
          // console.log('resolvedObj5:', resolvedObj);
          // eslint-disable-next-line no-unused-vars
          const response = Object.entries(resolvedObj).filter(([key, value]) => value.active);

          return response;
        })
        .catch((error) => {
          console.error(error); // handle error
        });

      // console.log('branchesWithConfig5:', branchesWithConfig);
      // const activeBranchesRaw = Object.entries(branchesWithConfig).filter(([key, value]) => value.active);

      activeBranches = activeBranchesRaw.map((x) => x[0]);

      // console.log('coursePathInGithub1:', coursePathInGithub);
      // console.log('activeBranchesRaw1:', activeBranchesRaw);
      // console.log('activeBranches1:', activeBranches);

      cache.set(routePath, activeBranches);
    } else {
      console.log(`✅✅ branches FROM CACHE: ${routePath}`);
      activeBranches = cache.get(routePath);
      // console.log('Cachecomponents2:', components);
    }

    return activeBranches;
  },
  commitsService: async (coursePathInGithub, refBranch) => {
    console.log('refBranch8:', refBranch);

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
