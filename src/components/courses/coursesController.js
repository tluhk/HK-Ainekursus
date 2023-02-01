/* eslint-disable max-len */
/* eslint-disable no-undef */
const { base64, utf8, MarkdownIt } = require('../../setup/setupMarkdown');

// Enable in-memory cache
const { cache } = require('../../setup/setupCache');
const { getAllCourses } = require('../../functions/getAllCourses');
const { getConfig } = require('../../functions/getConfig');
const { function1 } = require('../../functions/imgFunctions');
const { returnPreviousPage, returnNextPage, setSingleCoursePaths } = require('../../functions/navButtonFunctions');
const { verifyCache } = require('./coursesVerifyCache');
const { apiRequests } = require('./coursesService');

/**
 * Define what to do after info about couse and course page is received.
 * This step does the Axios requests via apiRequests[githubRequest] statement.
 * List of possible apiRequests is defined above.
 * Responses are saved into components, files, sources parts in res.locals, respectively.
 */
const responseAction = async (req, res, next) => {
  const {
    githubRequest,
  } = res.locals;
  console.log();

  let apiResponse;
  // eslint-disable-next-line no-prototype-builtins
  if (apiRequests.hasOwnProperty(githubRequest)) {
    func = await apiRequests[githubRequest];
    // console.log('func1:', func);
    await func(res.locals, req).then((response) => {
      // console.log('response1:', response);
      apiResponse = response;
    });
  }

  // console.log('githubRequest1:', githubRequest);
  // console.log('githubRequest1type:', typeof githubRequest);

  // console.log('resComponents3:', apiResponse);

  const { components, files, sources } = apiResponse;
  res.locals.resComponents = components;
  res.locals.resFiles = files;
  res.locals.resSources = sources;

  return next();
};

/**
 * Last step to render page now that we have resComponents, resFiles and resSources values from Axios.
 * We have everything needed to render the page.
 */
const renderPage = async (req, res) => {
  const {
    config,
    breadcrumbNames,
    path,
    allCourses,
    singleCoursePaths,
    coursePathInGithub,
  } = res.locals;

  const {
    resComponents,
    resFiles,
    resSources,
  } = res.locals;

  // console.log('resComponents in responseAction:', resComponents);
  // console.log('resFiles in responseAction:', resComponents);

  // console.log('resComponents1:', resComponents);
  const resComponentsContent = resComponents.data.content;

  const componentDecoded = base64.decode(resComponentsContent);
  const componentDecodedUtf8 = utf8.decode(componentDecoded);

  /**
   * Sisuteema piltide kuvamine
   * - functions: https://stackoverflow.com/a/58542933
   * - changing img src: https://www.npmjs.com/package/modify-image-url-md?activeTab=explore
   */
  const markdownWithModifiedImgSources = await function1(coursePathInGithub, path, componentDecodedUtf8);

  // console.log('markdownWithModifiedImgSources:', markdownWithModifiedImgSources);

  const componentMarkdown = await MarkdownIt.render(markdownWithModifiedImgSources);

  // define sources as NULL by default.
  let sourcesJSON = null;
  // NB! Sources are sent only with "Teemade endpointid" axios call. If sourcesJSON stays NULL (is false), then content.handlebars does not display "Allikad" div. If sourcesJSON gets filled (is true), then "Allikad" div is displayed.
  if (resSources) {
    const sources = resSources.data;
    const sourcesDecoded = base64.decode(sources.content);
    const sourcesDecodedUtf8 = utf8.decode(sourcesDecoded);
    sourcesJSON = JSON.parse(sourcesDecodedUtf8);
  }

  res.render('home', {
    component: componentMarkdown,
    docs: config.docs,
    additionalMaterials: config.additionalMaterials,
    concepts: config.concepts,
    practices: config.practices,
    lessons: config.lessons,
    sources: sourcesJSON,
    breadcrumb: breadcrumbNames,
    path,
    singleCoursePaths,
    courses: allCourses,
    returnPreviousPage,
    returnNextPage,
    config,
    files: resFiles,
    user: req.user,
  });
};

const allCoursesController = {

  /**
   * for '/' and '/courses' routes
   */
  getAllCourses: async (req, res) => {
    const allCourses = await getAllCourses();
    const allCoursesActive = allCourses.filter((x) => x.courseIsActive);
    // console.log('allCoursesActive:', allCoursesActive);

    // console.log('req.user1:', req.user);
    return res.render('allcourses', {
      courses: allCoursesActive,
      user: req.user,
    });
  },

  /**
   * for '/course/:courseSlug/:contentSlug?/:componentSlug?' route
   */
  getSpecificCourse: async (req, res, next) => {
    /**
     * Read parameters sent with endpoint
     */
    const { courseSlug, contentSlug, componentSlug } = req.params;
    // console.log('req.params.courseSlug:', courseSlug);
    // console.log('req.params.contentSlug:', contentSlug);
    // console.log('req.params.componentSlug:', componentSlug);

    /**
     * Get all available courses
     */
    const allCourses2 = await getAllCourses();
    // console.log('allCourses2:', allCourses2);
    /**
     * Get active course
     */
    const course = allCourses2.filter((x) => x.courseIsActive && x.courseSlug === courseSlug)[0];

    /**
     * Save routepath for the active course to cache its config file
     */
    const routePath = `${req.url}+config`;
    // console.log('routePath1:', routePath);

    let config;
    if (cache.has(routePath)) {
      config = res.locals.cache;
      // console.log('config from cache');
    } else {
      try {
        config = await getConfig(course.coursePathInGithub);
      } catch (error) {
        /**
         * If config file is not returned with course.coursePathInGithub, the coursePathInGithub is invalid.
         * Redirect back to homepage
         */
        return res.render('notfound');
      }
      cache.set(routePath, config);
      // console.log('config from api');
    }

    res.locals.course = course;
    res.locals.config = config;
    res.locals.allCourses = allCourses2;
    res.locals.singleCoursePaths = setSingleCoursePaths(config);

    /**
     * Find from multiple object arrays
     * For contentSlug, find slug from docs, additionalMaterials, lessons, lessons additionalMaterials
     * For componentSlug, find slug from concepts, practices
     * If exists, add to breadcrumbNames and path
     */

    /**
     * Collect docs arrays from config under one object array.
     */
    let docsArray = config.docs.concat(config.additionalMaterials, config.lessons);
    config.lessons.forEach((x) => {
      docsArray = docsArray.concat(x.additionalMaterials);
    });
    /**
     * Then check for matching slug from docs object array.
     * If a match, get the respective contentName.
     */
    let contentName;
    let githubRequest;

    config.docs.forEach((x) => {
      if (x.slug === contentSlug) {
        contentName = x.name;
        githubRequest = 'docsService';
        // console.log('githubRequest3:', githubRequest);
        // console.log('Slug found in config.docs');
      }
    });
    config.additionalMaterials.forEach(async (x) => {
      if (x.slug === contentSlug) {
        contentName = x.name;
        githubRequest = 'courseAdditionalMaterialsService';
        // console.log('Slug found in config.additionalMaterials');
      }
    });
    config.lessons.forEach(async (x) => {
      if (x.slug === contentSlug) {
        contentName = x.name;
        githubRequest = 'lessonsService';
        // console.log('Slug found in config.lessons');
      }
    });

    /**
     * Check for matching slug from concepts, practices and lessons additionaMaterials arrays.
     * If a match, get the componentName and set componentType.
     */
    let componentName;
    let componentType;

    config.concepts.forEach(async (x) => {
      if (x.slug === componentSlug && contentSlug) {
        componentName = x.name;
        componentType = 'concept';
        githubRequest = 'lessonComponentsService';
        // console.log('Slug found in config.concepts');
      }
    });
    config.practices.forEach(async (x) => {
      if (x.slug === componentSlug && contentSlug) {
        componentName = x.name;
        componentType = 'practice';
        githubRequest = 'lessonComponentsService';
        // console.log('Slug found in config.practices');
      }
    });
    config.lessons.forEach(async (x) => {
      if (x.additionalMaterials[0].slug === componentSlug && contentSlug) {
        componentName = x.additionalMaterials[0].name;
        componentType = 'docs';
        githubRequest = 'lessonAdditionalMaterialsService';
        // console.log('Slug found in config.lessons.additionalMaterials');
      }
    });

    /**
     * IF contentSlug exists, but contentName is not returned
     * OR if contentSlug, contentName and componentSlug exist, but componentName is not returned
     * THEN either of the slug is invalid and does not exist in config file!
     * AND Redirect back to homepage.
     */
    if ((contentSlug && !contentName)
    || (contentSlug && contentName && componentSlug && !componentName)) {
      return res.render('notfound');
    }
    /**
     * You can check values:
     *
      console.log('courseSlug1:', courseSlug);
      console.log('course.courseName1:', course.courseName);
      console.log('contentSlug1:', contentSlug);
      console.log('contentName1:', contentName);
      console.log('componentSlug1:', componentSlug);
      console.log('componentName1:', componentName);
      console.log('githubRequest1:', githubRequest);
    */

    /**
     * Function to set correct fullPath, depending on if componentSlug and/or contentSlug exist.
     * This defines correct fullPath, depeonding how deep into subpages you are.
     */
    function getFullPath() {
      if (componentSlug) {
        return `${contentSlug}/${componentSlug}`;
      }
      if (contentSlug) {
        return `${contentSlug}`;
      }
      return undefined;
    }

    /**
     * Function to set correct componentType, depending on if componentSlug and/or contentSlug exist.
     * This defines correct componentType, depeonding how deep into subpages you are.
     */
    function getType() {
      if (componentSlug) {
        return componentType;
      }
      if (contentSlug) {
        return 'docs';
      }
      return undefined;
    }

    /**
     * Save page names for breadcrumb
     */
    const breadcrumbNames = {
      courseName: course.courseName,
      contentName,
      componentName,
    };
    /**
     * Save page slugs, fullPath and page type for address, menu icons, for most following BE logic tbh
     */
    const path = {
      courseSlug,
      contentSlug,
      componentSlug,
      fullPath: getFullPath(contentSlug, componentSlug),
      type: getType(contentSlug, componentSlug),
    };

    res.locals.githubRequest = githubRequest;
    res.locals.coursePathInGithub = course.coursePathInGithub;
    res.locals.breadcrumbNames = breadcrumbNames;
    res.locals.path = path;

    // console.log('res.locals1:', res.locals);
    return next();
  },

};

module.exports = {
  allCoursesController, verifyCache, responseAction, renderPage,
};
