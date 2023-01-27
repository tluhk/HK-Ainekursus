/* eslint-disable max-len */
/* eslint-disable import/newline-after-import */

const { getAllCourses } = require('./src/routes/getAllCourses');
const { getConfig } = require('./src/getConfig');
const { setSingleCourseRoutes } = require('./src/routes/singleCourseRoutes');
const { setAllCoursesRoutes } = require('./src/routes/allCoursesRoutes');
const axios = require('axios');
const { allCoursesController } = require('./src/components/allCourses/singleController');

const engine = async (app) => {
  const allCourses = await getAllCourses();
  // console.log('allCourses', allCourses);
  const allCoursesActive = allCourses.filter((x) => x.courseIsActive);

  // ** ALL COURSES ENDPOINTS (allcourses.handlebars) **

  // redirect each "/courseSlug" page to "/courseSlug/about" page
  app.get('/courses/:courseSlug', allCoursesController);

  app.get(
    '/:courseSlug',
    (req, res) => {
      // console.log('reqCon:', req);
      res.redirect('/:courseSlug/about');
    },
  );

  // Määra Kursuse-sisene ruutimine
  allCoursesActive.forEach(async (course) => {
    const config = await getConfig(course.coursePathInGithub);
    setSingleCourseRoutes(app, config, course, allCoursesActive);
  });
};

module.exports = { engine };
