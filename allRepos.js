const { axios, authToken } = require('./setupGithub');

const sendReposGetRequest = async () => {
  const allRepos = [];

  try {
    const resp = await axios.get('https://api.github.com/orgs/tluhk/repos', authToken);

    // console.log(resp.data);

    resp.data.forEach((repo) => {
      if (repo.name.startsWith('HK_')) {
        allRepos.push(repo.full_name);
      }
      // console.log('ei ole sobivad repod:', repo.name);
      return true;
    });
    // console.log('sobivad repod:', allRepos);
  } catch (err) {
    // Handle Error Here
    console.error(err);
  }

  return allRepos;
};

const getAllRepos = async () => {
  const allReposWait = await sendReposGetRequest();

  // console.log('allRepos[1]', allReposWait[1]);

  return allReposWait;
};

module.exports = { getAllRepos };
