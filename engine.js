/* eslint-disable max-len */
/* eslint-disable import/newline-after-import */

const { getAllCourses } = require('./getAllCourses');
const { setCoursesRoutes } = require('./setAllCoursesRoutes');

const engine = async (app) => {
  const allCourses = await getAllCourses();
  // console.log('allCourses', allCourses);

  setCoursesRoutes(app, allCourses);
};

// Get repository content: https://docs.github.com/en/rest/repos/contents#get-repository-content
// Get a latest release: https://docs.github.com/en/rest/releases/releases#get-the-latest-release

module.exports = { engine };
