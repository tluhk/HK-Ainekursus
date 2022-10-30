/* eslint-disable max-len */
/* eslint-disable import/newline-after-import */

const { getAllRepos } = require('./allRepos');
const { setCoursesRoutes } = require('./setAllCoursesRoutes');

const engine = async (app) => {
  // const config = await getConfig(selectedCourse);
  const allCourses = await getAllRepos;
  // console.log('config from engine.js:', config);
  setCoursesRoutes(app, allCourses);
};

// Get repository content: https://docs.github.com/en/rest/repos/contents#get-repository-content
// Get a latest release: https://docs.github.com/en/rest/releases/releases#get-the-latest-release

module.exports = { engine };
