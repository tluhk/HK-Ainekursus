const { axios, authToken } = require('./setupGithub');
const {
  requestCourses,
} = require('./functions/repoFunctions');

const getAllRepos = (async () => {
  const allRepos = [];

  try {
    const resp = await axios.get(requestCourses, authToken);
    // console.log(resp.data);
    resp.data.forEach((elem) => {
      if (elem.name.startsWith('HK_')) {
        const repo = {
          slug: elem.name,
          name: elem.full_name,
        };
        allRepos.push(repo);
        // allRepos.push(repo.full_name);
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
})();
/*
const getAllRepos = async () => {
  const allReposWait = await sendReposGetRequest();

  // console.log('allRepos[1]', allReposWait[1]);

  return allReposWait;
}; */

module.exports = { getAllRepos };
