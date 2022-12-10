/* eslint-disable max-len */
/* eslint-disable no-undef */
// Enable in-memory cache
const { cache } = require('../../setup/setupCache');

// const { getConfig } = require('../../getConfig');

const verifyCache = (req, res, next) => {
  try {
    const routePath = req.url;
    if (cache.has(routePath) && cache.get(routePath) !== null) {
      console.log(`content loaded with CACHE: ${routePath}`);
      // console.log('cache.get(routePath)', cache.get(routePath));
      res.locals.cache = cache.get(routePath);
      return next();
      // return res.status(200).json(cache.get(routePath));
    }
    console.log(`content loaded with API: ${routePath}`);
    return next();
  } catch (err) {
    console.log('siin on ver-ifycache error');
    throw new Error(err);
  }
};

const allCoursesController = {
  // *** "/courseSlug" endpoints are not active at the moment.
  // Therefore getEachCourse func is also not needed and is deactivated at the moment.

  /* getEachCourse: async (req, res) => {
    const {
      coursePathInGithub,
      breadcrumbNames,
      path,
      allCourses,
    } = res.locals.params;

    const routePath = req.url;

    if (!cache.get(routePath)) {
      const config = await getConfig(coursePathInGithub);

      cache.set(routePath, config);
    }

    const config = cache.get(routePath);
    console.log('config:', config);

    // RETURN VALUE MUST BE MODIFIED
    return true;
  }, */
};

module.exports = { allCoursesController, verifyCache };
