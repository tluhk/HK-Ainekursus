import { Octokit } from 'octokit';
import membersController from '../components/members/membersController.js';

const octokit = new Octokit({
  auth: process.env.AUTH
});

const getCombinedUserData = async (userId) => {
  const apiData = await membersController.getUserData(userId);
  const githubData = await octokit.request(
    `GET /users/${ apiData.usernames.github }`, {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }).catch((err) => {
    console.log('Unable to fetch userdata');
  });
  return { user: apiData, github: githubData.data };
};

export { getCombinedUserData };