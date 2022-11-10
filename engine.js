/* eslint-disable max-len */
/* eslint-disable import/newline-after-import */

const { getAllCourses } = require('./src/getAllCourses');
const { getConfig } = require('./src/getConfig');
const { setSingleCourseRoutes } = require('./src/setSingleCourseRoutes');
const { setAllCoursesRoutes } = require('./src/setAllCoursesRoutes');

const engine = async (app) => {
  const allCourses = await getAllCourses();
  // console.log('allCourses', allCourses);

  // Määra Kõik Kursused routimine
  setAllCoursesRoutes(app, allCourses);

  // Määra Kursuse-sisene ruutimine
  allCourses.forEach(async (course) => {
    const config = await getConfig(course.coursePathInGithub);
    setSingleCourseRoutes(app, config, course, allCourses);
  });
};

// Get repository content: https://docs.github.com/en/rest/repos/contents#get-repository-content
// Get a latest release: https://docs.github.com/en/rest/releases/releases#get-the-latest-release

module.exports = { engine };
