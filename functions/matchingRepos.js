const axios = require('axios').default;

// import and save tluhk organisation repos
function getRepos(authToken) {
  const allRepos = [];

  axios.get('https://api.github.com/orgs/tluhk/repos', authToken)
    .then((response) => {
      response.data.forEach((repo) => {
        if (repo.name.startsWith('HK_')) allRepos.push(repo.full_name);

        else console.log('ei hakka sobiva algusega:', repo.name);
      });

      console.log('sobivad repod:', allRepos);
    })
    .catch((error) => {
      // handle error
      console.log(error);
    });

  return allRepos;
}

module.exports = { getRepos };
