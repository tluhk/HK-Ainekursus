/* eslint-disable max-len */
/* eslint-disable no-undef */
const { default: axios } = require('axios');
const { base64, utf8, MarkdownIt } = require('../../setup/setupMarkdown');

// Enable in-memory cache
const { cache } = require('../../setup/setupCache');
const { getAllCourses } = require('../../routes/getAllCourses');
const { getConfig } = require('../../getConfig');
const {
  requestDocs, requestCourseAdditionalMaterials, requestCourseFiles, requestLessons, requestLessonAdditionalMaterials, requestLessonFiles, requestConcepts, requestSources, requestPractices,
} = require('../../functions/repoFunctions');
const { authToken } = require('../../setup/setupGithub');
const { function1 } = require('../../functions/imgFunctions');
const { returnPreviousPage, returnNextPage, setSingleCoursePaths } = require('../../functions/navButtonFunctions');
const { verifyCache } = require('./coursesVerifyCache');

/**
 * Define files to ignore from /files folders
 */
const ignoreFiles = ['.DS_Store', '.gitkeep'];

/**
 * Define all API requests that are done to GitHub API
 */
const apiRequests = {
  requestDocs: async (locals, request) => {
    const {
      coursePathInGithub,
    } = locals.course;

    // console.log('request.url1:', request.url);

    const routePath = `${request.url}+components`;
    // console.log('routePath2:', routePath);

    let components;

    if (!cache.has(routePath)) {
      components = await axios.get(requestDocs(coursePathInGithub), authToken);

      // console.log('Axioscomponents1:', components);
      cache.set(routePath, components);
    } else {
      // console.log('taken from cache');
      components = cache.get(routePath);
      // console.log('Cachecomponents2:', components);
    }

    return { components };
  },
  requestCourseAdditionalMaterials: async (locals, request) => {
    const {
      coursePathInGithub,
    } = locals.course;

    const routePath = `${request.url}+components`;
    const routePathFiles = `${request.url}+files`;

    let components;
    let files;

    if (!cache.get(routePath) || !cache.get(routePathFiles)) {
      const componentsRaw = await axios.get(requestCourseAdditionalMaterials(coursePathInGithub), authToken);
      // Github raw download_url juhend:
      // https://stackoverflow.com/questions/73819136/how-do-i-get-and-download-the-contents-of-a-file-in-github-using-the-rest-api/73824136
      //  Download_url token muutub iga 7 päeva tagant Githubi poolt: https://github.com/orgs/community/discussions/23845#discussioncomment-3241866
      const filesRaw = await axios.get(requestCourseFiles(coursePathInGithub), authToken);

      await axios
        .all([componentsRaw, filesRaw])
        .then(
          axios.spread((...responses) => {
            [components, files] = responses;
            files = responses[1].data.filter((x) => !ignoreFiles.includes(x.name));

            // console.log('files1:', files);

            cache.set(routePath, components);
            cache.set(routePathFiles, files);
          }),
        )
        .catch((error) => {
          console.log('siin on addMat error');
          console.log(error);
        });
    } else {
      // console.log('taken from cache');
      components = cache.get(routePath);
      files = cache.get(routePathFiles);
      // console.log('Cachecomponents2:', components);
      // console.log('CacheFiles2:', files);
    }

    return { components, files };
  },
  requestLessons: async (locals, request) => {
    const {
      coursePathInGithub,
    } = locals.course;
    const {
      path,
    } = locals;

    const routePath = `${request.url}+components`;

    let components;

    if (!cache.get(routePath)) {
      components = await axios.get(requestLessons(coursePathInGithub, `${path.contentSlug}`), authToken);

      cache.set(routePath, components);
    } else {
      components = cache.get(routePath);
    }

    return { components };
  },
  requestLessonAdditionalMaterials: async (locals, request) => {
    const {
      coursePathInGithub,
    } = locals.course;
    const {
      path,
    } = locals;

    const routePath = `${request.url}+components`;
    const routePathFiles = `${request.url}+files`;

    let components;
    let files;

    if (!cache.get(routePath) || !cache.get(routePathFiles)) {
      const componentsRaw = await axios.get(requestLessonAdditionalMaterials(coursePathInGithub, `${path.contentSlug}`), authToken);
      // Github raw download_url juhend:
      // https://stackoverflow.com/questions/73819136/how-do-i-get-and-download-the-contents-of-a-file-in-github-using-the-rest-api/73824136
      // Download_url token muutub iga 7 päeva tagant Githubi poolt: https://github.com/orgs/community/discussions/23845#discussioncomment-3241866
      const filesRaw = await axios.get(requestLessonFiles(coursePathInGithub, `${path.contentSlug}`), authToken);

      await axios
        .all([componentsRaw, filesRaw])
        .then(
          axios.spread((...responses) => {
            [components, files] = responses;
            files = responses[1].data.filter((x) => !ignoreFiles.includes(x.name));

            cache.set(routePath, components);
            cache.set(routePathFiles, files);
          }),
        )
        .catch((error) => {
          console.log('siin on addMat error');
          console.log(error);
        });
    } else {
      components = cache.get(routePath);
      files = cache.get(routePathFiles);
    }

    return { components, files };
  },
  requestLessonComponents: async (locals, request) => {
    const {
      coursePathInGithub,
    } = locals.course;
    const {
      path,
    } = locals;

    const routePath = `${request.url}+components`;
    const routePathSources = `${request.url}+sources`;

    let components;
    let sources;

    if (path.type === 'concept') {
      if (!cache.get(routePath) || !cache.get(routePathSources)) {
        const componentsRaw = await axios.get(requestConcepts(coursePathInGithub, `${path.componentSlug}`), authToken);
        const sourcesRaw = await axios.get(requestSources(coursePathInGithub, `${path.componentSlug}`), authToken);

        await axios
          .all([componentsRaw, sourcesRaw])
          .then(
            axios.spread((...responses) => {
              [components, sources] = responses;

              cache.set(routePath, components);
              cache.set(routePathSources, sources);
            }),
          )
          .catch((error) => {
            console.log('siin on addMat error');
            console.log(error);
          });
      } else {
        components = cache.get(routePath);
        sources = cache.get(routePathSources);
      }
    }

    if (path.type === 'practice') {
      if (!cache.get(routePath) || !cache.get(routePathSources)) {
        components = await axios.get(requestPractices(coursePathInGithub, `${path.componentSlug}`), authToken);

        cache.set(routePath, components);
      } else {
        components = cache.get(routePath);
      }
    }

    return { components, sources };
  },
};

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

  // sisuteema piltide kuvamine
  // *** code sources: ***
  // functions: https://stackoverflow.com/a/58542933
  // changing img src: https://www.npmjs.com/package/modify-image-url-md?activeTab=explore
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

    return res.render('allcourses', {
      courses: allCoursesActive,
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
      config = await getConfig(course.coursePathInGithub);
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

    config.docs.find((x) => {
      if (x.slug === contentSlug && !componentSlug) {
        contentName = x.name;
        githubRequest = 'requestDocs';
        // console.log('githubRequest3:', githubRequest);
        console.log('Slug found in config.docs');
      }
      return { contentName, githubRequest };
    });
    config.additionalMaterials.find(async (x) => {
      if (x.slug === contentSlug && !componentSlug) {
        contentName = x.name;
        githubRequest = 'requestCourseAdditionalMaterials';
        console.log('Slug found in config.additionalMaterials');
      }
      return { contentName, githubRequest };
    });
    config.lessons.forEach(async (x) => {
      if (x.slug === contentSlug && !componentSlug) {
        contentName = x.name;
        githubRequest = 'requestLessons';
        console.log('Slug found in config.lessons');
      }
      return { contentName, githubRequest };
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
        githubRequest = 'requestLessonComponents';
        console.log('Slug found in config.concepts');
      }
      return { contentName, componentType, githubRequest };
    });
    config.practices.forEach(async (x) => {
      if (x.slug === componentSlug && contentSlug) {
        componentName = x.name;
        componentType = 'practice';
        githubRequest = 'requestLessonComponents';
        console.log('Slug found in config.practices');
      }
      return { contentName, componentType, githubRequest };
    });
    config.lessons.forEach(async (x) => {
      if (x.additionalMaterials[0].slug === componentSlug && contentSlug) {
        componentName = x.additionalMaterials[0].name;
        componentType = 'docs';
        githubRequest = 'requestLessonAdditionalMaterials';
        console.log('Slug found in config.lessons.additionalMaterials');
      }
      return { contentName, componentType, githubRequest };
    });

    /* console.log('contentSlug:', contentSlug);
    console.log('contentName:', contentName);
    console.log('componentSlug:', componentSlug);
    console.log('componentName:', componentName);
    console.log('githubRequest:', githubRequest); */

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
