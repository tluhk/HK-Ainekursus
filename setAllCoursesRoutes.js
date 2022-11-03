/* eslint-disable max-len */

const { getConfig } = require('./getConfig');
const { setRoutes } = require('./setActiveCourseRoutes');

const setCoursesRoutes = async (app, allCourses) => {
  // *** ENDPOINTS ***

  // to show in page titles without underscores, we need titles
  // so lets add title and let's replace underscores with spaces
  // after that go and change {{this.slug}} to {{this.title}} in appropriate handlebars file (sidebar)
  allCourses = allCourses.map((course) => {
    course.title = course.slug.split('_').join(' ');
    // or course.title = course.slug.replaceAll('_', ' ');
    return course;
  });
  console.log(allCourses);

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
      const courseTitle = elem.title;

      // console.log('courseSlug:', courseSlug);
      // console.log('coursePath:', coursePath);

      const config = await getConfig(coursePath);
      setRoutes(app, config, courseSlug, allCourses);

      res.render('home', {
        courseSlug,
        courseTitle,
        docs: config.docs,
        concepts: config.concepts,
        loengud: config.loengud,
        courses: allCourses,
      });
    });
  });
};

module.exports = { setCoursesRoutes };
