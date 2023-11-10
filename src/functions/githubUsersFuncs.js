import { Octokit } from 'octokit';

const octokit = new Octokit({
  auth: process.env.AUTH
});

const getUserData = async (username) => {
  return await octokit.request(`GET /users/${ username }`, {
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  }).catch((err) => {
    console.log('Unable to fetch userdata');
  });
};

export { getUserData };