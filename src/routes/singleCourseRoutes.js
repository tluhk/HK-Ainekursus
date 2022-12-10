/* eslint-disable max-len */

// Import request functions for Axios

const { singleCourseController, verifyCache, responseAction } = require('../components/singleCourse/controller');

/* const getImgPromises = async (coursePathInGithub, slug) => {
  try {
    const files = await axios.get(requestStaticURL(coursePathInGithub, slug), authToken);
    // console.log('files1.data', files.data);
    return files;
  } catch (err) {
    return console.log(err);
  }
}; */

const setSingleCourseRoutes = async (app, config, course, allCourses) => {
  const { courseName, courseSlug, coursePathInGithub } = course;

  // *** BUTTONS – FORWARD/BACK PATH SETTINGS ***

  // For Forward/Back buttons, push all possible paths in one course to an Array:
  const singleCoursePaths = [];
  // *** Comment out config.docs.map() if you don't want to show buttons on Ainekursusest pages ***
  config.docs.map((x) => singleCoursePaths.push({
    path: x.slug,
  }));
  config.lessons.map((x) => {
    // *** Comment out singleCoursePaths.push() if you don't want to show buttons on Lesson pages ***
    singleCoursePaths.push({
      path: x.slug,
    });
    // *** Shows buttons on each Components page (teemalehed ja praktikumid) ***
    x.components.map((y) => singleCoursePaths.push({
      path: `${x.slug}/${y}`,
    }));
    // *** Comment out x.additionalMaterials.map() if you don't want to show buttons on Aine Lisamaterjalid pages ***
    x.additionalMaterials.map((z) => singleCoursePaths.push({
      path: `${x.slug}/${z.slug}`,
    }));
    return true;
  });
  // *** Comment out config.additionalMaterials.map() if you don't want to show buttons on Aine Lisamaterjalid page ***
  config.additionalMaterials.map((x) => singleCoursePaths.push({
    path: x.slug,
  }));

  // *** END OF BUTTONS ***

  // *** ENDPOINTS ***
  // ** SINGLE COURSE ENDPOINTS (home.handlebars) **

  // Ainekursusest endpoint
  config.docs.forEach((elem) => {
    // console.log('elem.slug:', elem.slug);
    const breadcrumbNames = {
      courseName,
      contentName: elem.name,
    };
    const path = {
      courseSlug,
      contentSlug: elem.slug,
      fullPath: elem.slug,
      type: 'docs',
    };

    const saveParams = async (req, res, next) => {
      const params = {
        coursePathInGithub,
        config,
        breadcrumbNames,
        path,
        allCourses,
        singleCoursePaths,
      };
      // console.log('params:', params);
      res.locals.params = params;
      // console.log('res.locals.params:', res.locals.params);
      return next();
    };

    app.get(
      `/${courseSlug}/${path.contentSlug}`,
      verifyCache,
      saveParams,
      singleCourseController.requestDocsController,
      responseAction,
    );
  });

  // Aine Lisamaterjalid endpoint
  config.additionalMaterials.forEach((mat) => {
    const breadcrumbNames = {
      courseName,
      contentName: mat.name,
    };
    const path = {
      courseSlug,
      contentSlug: mat.slug,
      fullPath: mat.slug,
      type: 'docs',
    };

    const saveParams = async (req, res, next) => {
      const params = {
        coursePathInGithub,
        config,
        breadcrumbNames,
        path,
        allCourses,
        singleCoursePaths,
      };
      // console.log('params:', params);
      res.locals.params = params;
      return next();
    };

    app.get(
      `/${courseSlug}/${path.contentSlug}`,
      verifyCache,
      saveParams,
      singleCourseController.requestCourseAdditionalMaterials,
      responseAction,
    );
  });

  // Loengute endpointid
  config.lessons.forEach((lesson) => {
    // console.log('elem.slug:', elem.slug);
    const breadcrumbNames = {
      courseName,
      contentName: lesson.name,
    };
    const path = {
      courseSlug,
      contentSlug: lesson.slug,
      fullPath: lesson.slug,
    };

    const saveParams = async (req, res, next) => {
      const params = {
        coursePathInGithub,
        config,
        breadcrumbNames,
        path,
        allCourses,
        singleCoursePaths,
      };
      // console.log('params:', params);
      res.locals.params = params;
      // console.log('res.locals.params:', res.locals.params);
      return next();
    };

    app.get(
      `/${courseSlug}/${path.contentSlug}`,
      verifyCache,
      saveParams,
      singleCourseController.requestLessons,
      responseAction,
    );
  });

  // Loengu Lisamaterjalid endpoint
  config.lessons.forEach((lesson) => {
    lesson.additionalMaterials.map((mat) => {
      const breadcrumbNames = {
        courseName,
        contentName: lesson.name,
        componentName: mat.name,
      };
      const path = {
        courseSlug,
        contentSlug: lesson.slug,
        componentSlug: mat.slug,
        fullPath: `${lesson.slug}/${mat.slug}`,
        type: 'docs',
      };

      const saveParams = async (req, res, next) => {
        const params = {
          coursePathInGithub,
          config,
          breadcrumbNames,
          path,
          allCourses,
          singleCoursePaths,
        };
        // console.log('params:', params);
        res.locals.params = params;
        return next();
      };

      return app.get(
        `/${courseSlug}/${path.contentSlug}/${path.componentSlug}`,
        verifyCache,
        saveParams,
        singleCourseController.requestLessonAdditionalMaterials,
        responseAction,
      );
    });
  });

  // Loengu Teemalehtede endpointid (lesson.components)
  config.lessons.forEach((lesson) => {
    // Teemalehtede tüüpe on kaks: concept, practice.
    /* Nende erinevused:
      - concept lehel on eraldi sources osas, mida loetakse sources.json failist
      - kummalgi tüübil kuvatakse eesrakenduses erinevat ikooni. Lehetüübi määramiseks kasutatakse component.type, seda loeb handlebars fail, mis kuvab õige ikoon
    */
    lesson.components.map((comp) => {
      let component = {};
      if (config.concepts.map((x) => x.slug).includes(comp)) {
        component = config.concepts.find((x) => x.slug === comp);
        component.type = 'concept';
      }
      if (config.practices.map((x) => x.slug).includes(comp)) {
        component = config.practices.find((x) => x.slug === comp);
        component.type = 'practice';
      }
      const breadcrumbNames = {
        courseName,
        contentName: lesson.name,
        componentName: component.name,
      };
      const path = {
        courseSlug,
        contentSlug: lesson.slug,
        componentSlug: component.slug,
        fullPath: `${lesson.slug}/${component.slug}`,
        type: component.type,
      };

      const saveParams = async (req, res, next) => {
        const params = {
          coursePathInGithub,
          config,
          breadcrumbNames,
          path,
          allCourses,
          singleCoursePaths,
        };
        // console.log('params:', params);
        res.locals.params = params;
        return next();
      };

      return app.get(
        `/${courseSlug}/${path.contentSlug}/${path.componentSlug}`,
        verifyCache,
        saveParams,
        singleCourseController.requestLessonComponents,
        responseAction,
      );
    });
  });
};

module.exports = { setSingleCourseRoutes };
