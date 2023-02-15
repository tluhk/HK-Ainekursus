/* eslint-disable max-len */

// const { allCoursesController } = require("../components/allCourses/controller");

const setAllCoursesRoutes = async (app, allCourses) => {
  // *** ENDPOINTS ***

  app.get('/', (req, res) => {
    res.render('dashboard', {
      courses: allCourses,
    });
  });

  // ** ALL COURSES ENDPOINTS (allcourses.handlebars) **

  allCourses.forEach((course) => {
    // redirect each "/courseSlug" page to "/courseSlug/about" page
    app.get(
      `/${course.courseSlug}`,
      (req, res) => res.redirect(`/${course.courseSlug}/about`),
    );

    // *** "/courseSlug" endpoints are not active at the moment. See the redirect above. ***

    /* const { courseName, courseSlug, coursePathInGithub } = course;

    const breadcrumbNames = {
      courseName,
    };
    const path = {
      courseSlug,
    };

    const saveParams = async (req, res, next) => {
      const params = {
        coursePathInGithub,
        breadcrumbNames,
        path,
        allCourses,
      };
      // console.log('params:', params);
      res.locals.params = params;
      // console.log('res.locals.params:', res.locals.params);
      return next();
    };

    app.get(
      `/${course.courseSlug}`,
      saveParams,
      allCoursesController.getEachCourse,
    ); */
  });
};

module.exports = { setAllCoursesRoutes };
