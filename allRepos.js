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

module.exports = { getAllRepos };
