/* eslint-disable max-len */
/* eslint-disable import/newline-after-import */

const { getAllCourses } = require('./src/routes/getAllCourses');
const { getConfig } = require('./src/getConfig');
const { setSingleCourseRoutes } = require('./src/routes/singleCourseRoutes');
const { setAllCoursesRoutes } = require('./src/routes/allCoursesRoutes');

const engine = async (app) => {
  const allCourses = await getAllCourses();
  // console.log('allCourses', allCourses);
  const allCoursesActive = allCourses.filter((x) => x.courseIsActive);
  // Määra Kõik Kursused routimine
  setAllCoursesRoutes(app, allCoursesActive);

  // Määra Kursuse-sisene ruutimine
  allCoursesActive.forEach(async (course) => {
    const config = await getConfig(course.coursePathInGithub);
    setSingleCourseRoutes(app, config, course, allCoursesActive);
  });
};

// Get repository content: https://docs.github.com/en/rest/repos/contents#get-repository-content
// Get a latest release: https://docs.github.com/en/rest/releases/releases#get-the-latest-release

module.exports = { engine };
