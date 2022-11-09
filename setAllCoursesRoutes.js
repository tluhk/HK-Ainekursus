/* eslint-disable max-len */

const { getConfig } = require('./getConfig');

const setCoursesRoutes = async (app, allCourses) => {
  // *** ENDPOINTS ***

  app.get('/', (req, res) => {
    res.render('allcourses', {
      courses: allCourses,
    });
  });

  // ** ALL COURSES ENDPOINTS (allcourses.handlebars) **
  // Ainekursusest ja Hindamine endpointid
  allCourses.forEach((course) => {
    const { courseName, courseSlug, coursePathInGithub } = course;
    // console.log('courseSlug:', courseSlug);
    const breadcrumbNames = {
      courseName,
    };
    const path = {
      courseSlug,
    };

    app.get(`/${course.courseSlug}`, async (req, res) => {
      const config = await getConfig(coursePathInGithub);

      res.render('home', {
        courseSlug,
        docs: config.docs,
        concepts: config.concepts,
        loengud: config.loengud,
        courses: allCourses,
        breadcrumb: breadcrumbNames,
        path,
      });
    });
  });
};

module.exports = { setCoursesRoutes };
