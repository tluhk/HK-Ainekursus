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
  requestImgURL,
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

const getImgResponse = async (coursePathInGithub, componentSlug, url) => {
  let response = '';

  // code without image cache:
  try {
    response = await axios.get(requestImgURL(coursePathInGithub, componentSlug, url), authToken);
  } catch (err) {
    // Handle Error Here
    console.error(err);
  }
  return response;
};

const function2 = async (coursePathInGithub, path, img) => {
  // *** code source: ***
  // functions: https://stackoverflow.com/a/58542933

  // Get the "img src" of single image
  const url = img.match(/[(].*[^)]/)[0].split('(')[1];

  if (!url) return;
  // encode "img src" so that special characters get changed. Example: kõvaketas – k%C3%B5vaketas; mälu – m%C3%A4lu
  const urlEncoded = encodeURI(url);

  // get full download URL only for images that don't already have full URL
  if (!urlEncoded.startsWith('http')) {
    const imgResponse = await getImgResponse(coursePathInGithub, path, urlEncoded);

    // console.log('getImgResponse:', getImgResponse);

    results = [];
    try {
      const imgDownloadUrl = imgResponse.data.download_url;

      results.push(url);
      results.push(imgDownloadUrl);
    } catch (error) {
      results.push(url);
    }
    return results;
  }
  return true;
};

const function3 = async (markdownText, finishedPromises) => {
  // console.log('text3:', markdownText);

  let newText = markdownText;
  /* DB call to reload data */
  // console.log('finishedPromises:', finishedPromises);
  // eslint-disable-next-line array-callback-return
  finishedPromises.map((urlPair) => {
    // console.log('urlPair:', urlPair);
    if (urlPair.length === 1) return newText;

    newText = newText.replace(urlPair[0], urlPair[1]);
  });
  return newText;
};

const function1 = async (coursePathInGithub, path, componentDecodedUtf8) => {
  const markdownText = componentDecodedUtf8;

  // *** code sources: ***
  // functions: https://stackoverflow.com/a/58542933
  // changing img src: https://www.npmjs.com/package/modify-image-url-md?activeTab=explore

  // Get all the images from the text
  const images = markdownText.match(/!\[.*\]\(.*\)/g);

  // async/await - create an array of promises
  // from function2, then await until Promise.all has
  // fully resolved/rejected

  // if markdown HAS NO images, then return same markdown text
  if (!images) return markdownText;

  // if markdown DOES HAVE images, then change "img src" to full URL from github:

  // for each image, get its used "img src" and needed "download_url" to display image on webapp. Response are Promises, save those in new array
  const promises = images.map((img) => function2(coursePathInGithub, path, img));
  // solve each Promise in previous array, save results in new array
  const finishedPromises = await Promise.all(promises);

  // finally call function that changes each "img src" value with the image's github "download_url" value in the markdown text:
  return function3(markdownText, finishedPromises);
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
    coursePathInGithub,
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
