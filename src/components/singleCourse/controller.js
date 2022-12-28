/* eslint-disable max-len */
/* eslint-disable no-undef */

// Enable in-memory cache
const { cache } = require('../../setup/setupCache');

const { base64, utf8, MarkdownIt } = require('../../setup/setupMarkdown');
const { axios, authToken } = require('../../setup/setupGithub');

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

// Import request functions for Axios
const {
  requestDocs,
  requestLessons,
  requestConcepts,
  requestPractices,
  requestSources,
  requestCourseAdditionalMaterials,
  requestLessonAdditionalMaterials,
  requestCourseFiles,
  requestLessonFiles,
  // requestStaticURL,
} = require('../../functions/repoFunctions');

// Määra failinimed, mida githubis /files kaustadest ignoreeritakse ja Lisamaterjalid lehtedel ei kuvata
const ignoreFiles = ['.DS_Store', '.gitkeep'];

const returnPreviousPage = (currentPath, paths) => {
  // console.log('paths', paths);
  // console.log('currentPath', currentPath);
  const currentIndex = paths.findIndex((object) => object.path === currentPath);
  // console.log('currentIndex', currentIndex);
  if (currentIndex !== 0) {
    return paths[currentIndex - 1].path;
  } return currentPath;
};
const returnNextPage = (currentPath, paths) => {
  const currentIndex = paths.findIndex((object) => object.path === currentPath);
  if (currentIndex !== paths.lenght - 1) {
    return paths[currentIndex + 1].path;
  } return currentPath;
};

// Define what to do with Axios Response, how it is rendered
const responseAction = async (req, res) => {
  // console.log('res.locals from ResponseAction:', res.locals);

  const {
    config,
    breadcrumbNames,
    path,
    allCourses,
    singleCoursePaths,
  } = res.locals.params;

  // console.log('res.locals.data in ResponseAction:', res.locals.data);

  const {
    resComponents,
    resFiles,
    resSources,
  } = res.locals.dataObj;

  // console.log('resComponents in responseAction:', resComponents);
  // console.log('resFiles in responseAction:', resComponents);

  const resComponentsContent = resComponents.data.content;

  const componentDecoded = base64.decode(resComponentsContent);
  const componentDecodedUtf8 = utf8.decode(componentDecoded);
  const componentMarkdown = MarkdownIt.render(componentDecodedUtf8);

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

const singleCourseController = {
  requestDocsController: async (req, res, next) => {
    const {
      coursePathInGithub,
    } = res.locals.params;

    const routePath = req.url;

    if (!cache.get(routePath)) {
      const docs = await axios.get(requestDocs(coursePathInGithub), authToken);

      res.locals.dataObj = {
        resComponents: docs,
      };
      cache.set(routePath, res.locals.dataObj);
    } else {
      res.locals.dataObj = res.locals.cache;
    }

    return next();
  },
  requestCourseAdditionalMaterials: async (req, res, next) => {
    const {
      coursePathInGithub,
    } = res.locals.params;

    const routePath = req.url;

    if (!cache.get(routePath)) {
      const materials = await axios.get(requestCourseAdditionalMaterials(coursePathInGithub), authToken);
      // Github raw download_url juhend:
      // https://stackoverflow.com/questions/73819136/how-do-i-get-and-download-the-contents-of-a-file-in-github-using-the-rest-api/73824136
      //  Download_url token muutub iga 7 päeva tagant Githubi poolt: https://github.com/orgs/community/discussions/23845#discussioncomment-3241866
      const files = await axios.get(requestCourseFiles(coursePathInGithub), authToken);

      await axios
        .all([materials, files])
        .then(
          axios.spread((...responses) => {
            const resComponents = responses[0];
            const resFiles = responses[1].data.filter((x) => !ignoreFiles.includes(x.name));

            res.locals.dataObj = {
              resComponents,
              resFiles,
            };
            cache.set(routePath, res.locals.dataObj);
          }),
        )
        .catch((error) => {
          console.log('siin on addMat error');
          console.log(error);
        });
    } else {
      res.locals.dataObj = res.locals.cache;
    }

    return next();
  },
  requestLessons: async (req, res, next) => {
    const {
      coursePathInGithub,
      path,
    } = res.locals.params;

    const routePath = req.url;

    if (!cache.get(routePath)) {
      const lessons = await axios.get(requestLessons(coursePathInGithub, `${path.contentSlug}`), authToken);

      res.locals.dataObj = {
        resComponents: lessons,
      };
      cache.set(routePath, res.locals.dataObj);
    } else {
      res.locals.dataObj = res.locals.cache;
    }

    return next();
  },
  requestLessonAdditionalMaterials: async (req, res, next) => {
    const {
      coursePathInGithub,
      path,
    } = res.locals.params;

    const routePath = req.url;

    if (!cache.get(routePath)) {
      const materials = await axios.get(requestLessonAdditionalMaterials(coursePathInGithub, `${path.contentSlug}`), authToken);
      // Github raw download_url juhend:
      // https://stackoverflow.com/questions/73819136/how-do-i-get-and-download-the-contents-of-a-file-in-github-using-the-rest-api/73824136
      // Download_url token muutub iga 7 päeva tagant Githubi poolt: https://github.com/orgs/community/discussions/23845#discussioncomment-3241866
      const files = await axios.get(requestLessonFiles(coursePathInGithub, `${path.contentSlug}`), authToken);

      await axios
        .all([materials, files])
        .then(
          axios.spread((...responses) => {
            const resComponents = responses[0];
            const resFiles = responses[1].data.filter((x) => !ignoreFiles.includes(x.name));

            res.locals.dataObj = {
              resComponents,
              resFiles,
            };
            cache.set(routePath, res.locals.dataObj);
          }),
        )
        .catch((error) => {
          console.log('siin on addMat error');
          console.log(error);
        });
    } else {
      res.locals.dataObj = res.locals.cache;
    }

    return next();
  },
  requestLessonComponents: async (req, res, next) => {
    const {
      coursePathInGithub,
      path,
    } = res.locals.params;

    const routePath = req.url;

    if (path.type === 'concept') {
      if (!cache.get(routePath)) {
        const components = await axios.get(requestConcepts(coursePathInGithub, `${path.componentSlug}`), authToken);
        const sources = await axios.get(requestSources(coursePathInGithub, `${path.componentSlug}`), authToken);

        await axios
          .all([components, sources])
          .then(
            axios.spread((...responses) => {
              const resComponents = responses[0];
              const resSources = responses[1];

              res.locals.dataObj = {
                resComponents,
                resSources,
              };
              cache.set(routePath, res.locals.dataObj);
            }),
          )
          .catch((error) => {
            console.log('siin on addMat error');
            console.log(error);
          });
      } else {
        res.locals.dataObj = res.locals.cache;
      }
    }

    if (path.type === 'practice') {
      if (!cache.get(routePath)) {
        const components = await axios.get(requestPractices(coursePathInGithub, `${path.componentSlug}`), authToken);

        res.locals.dataObj = {
          resComponents: components,
        };
        cache.set(routePath, res.locals.dataObj);
      } else {
        res.locals.dataObj = res.locals.cache;
      }

      return next();
    }

    return next();
  },
};

module.exports = { singleCourseController, verifyCache, responseAction };
