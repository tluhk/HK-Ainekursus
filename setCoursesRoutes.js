/* eslint-disable max-len */

const { getConfig } = require('./getConfig');
const { setRoutes } = require('./setRoutes');

const setCoursesRoutes = async (app, allCourses) => {
  // console.log('config from setRoutes.js', config);
  // console.log('config.loengud[1].concepts from setRoutes.js', config.loengud[1].concepts);

  // *** ENDPOINTS ***

  app.get('/', (req, res) => {
    res.render('allcourses', {
      courses: allCourses,
    });
  });

  // ** ALL COURSES ENDPOINTS (allcourses.handlebars) **
  // Ainekursusest ja Hindamine endpointid
  allCourses.forEach((elem) => {
    // console.log('elem.slug:', elem.slug);

    app.get(`/${elem.slug}`, async (req, res) => {
      const courseSlug = elem.slug;
      const coursePath = elem.name;

      // console.log('courseSlug:', courseSlug);
      // console.log('coursePath:', coursePath);

      const config = await getConfig(coursePath);
      // console.log('config2:', config);
      setRoutes(app, config, courseSlug, allCourses);

      res.render('home', {
        courseSlug,
        docs: config.docs,
        concepts: config.concepts,
        loengud: config.loengud,
        courses: allCourses,
      });
    });
  });
};

module.exports = { setCoursesRoutes };
