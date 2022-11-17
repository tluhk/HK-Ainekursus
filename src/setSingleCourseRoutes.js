/* eslint-disable max-len */
// const { promises } = require('fs');

const { base64, utf8, MarkdownIt } = require('./setup/setupMarkdown');
const { axios, authToken } = require('./setup/setupGithub');

// Import request functions for Axios
const {
  requestDocs,
  requestLoengud,
  requestConcepts,
  requestSources,
  requestCourseAdditionalMaterials,
  requestLessonAdditionalMaterials,
  // requestStaticURL,
} = require('./functions/repoFunctions');

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
function responseAction(
  resConcepts,
  config,
  res,
  breadcrumbNames,
  path,
  allCourses,
  singleCoursePaths,
  ...options
) {
  const concepts = resConcepts.data;
  const conceptsDecoded = base64.decode(concepts.content);
  const conceptsDecodedUtf8 = utf8.decode(conceptsDecoded);
  const conceptsMarkdown = MarkdownIt.render(conceptsDecodedUtf8);

  const resSources = options[0];

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
    content: conceptsMarkdown,
    docs: config.docs,
    additionalMaterials: config.additionalMaterials,
    concepts: config.concepts,
    lessons: config.lessons,
    sources: sourcesJSON,
    breadcrumb: breadcrumbNames,
    path,
    singleCoursePaths,
    courses: allCourses,
    returnPreviousPage,
    returnNextPage,
    config,
  });
}

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
  // *** ENDPOINTS ***
  const { courseName, courseSlug, coursePathInGithub } = course;

  // For Forward/Back buttons, push all possible paths in one course to an Array:
  const singleCoursePaths = [];
  // Comment out config.docs.map() if you don't want to show buttons on Ainekursusest and Hindamine pages
  config.docs.map((x) => singleCoursePaths.push({
    path: x.slug,
  }));
  config.additionalMaterials.map((x) => singleCoursePaths.push({
    path: x.slug,
  }));
  config.lessons.map((x) => {
    singleCoursePaths.push({
      path: x.slug,
    });
    x.concepts.map((y) => singleCoursePaths.push({
      path: `${x.slug}/${y}`,
    }));
    x.additionalMaterials.map((z) => singleCoursePaths.push({
      path: `${x.slug}/${z.slug}`,
    }));
    // console.log('singleCoursePaths:', singleCoursePaths);
    return true;
  });

  /*
  courseSlug,
  contentSlug,
  conceptSlug */
  // ** SINGLE COURSE ENDPOINTS (home.handlebars) **

  // Ainekursusest ja Hindamine endpointid
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
    };

    app.get(`/${courseSlug}/${path.contentSlug}`, (req, res) => {
      axios
        .get(requestDocs(coursePathInGithub, `${path.contentSlug}`), authToken)
        .then((response) => {
          responseAction(response, config, res, breadcrumbNames, path, allCourses, singleCoursePaths);
        })
        .catch((error) => {
          console.log(error);
        });
    });
  });

  // Aine lisamaterjalid endpoint
  config.additionalMaterials.forEach((mat) => {
    const breadcrumbNames = {
      courseName,
      contentName: mat.name,
    };
    const path = {
      courseSlug,
      contentSlug: mat.slug,
      fullPath: mat.slug,
    };

    app.get(`/${courseSlug}/${path.contentSlug}`, (req, res) => {
      axios
        .get(requestCourseAdditionalMaterials(coursePathInGithub, `${path.contentSlug}`), authToken)
        .then((response) => {
          responseAction(response, config, res, breadcrumbNames, path, allCourses, singleCoursePaths);
        })
        .catch((error) => {
          console.log(error);
        });
    });
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

    app.get(`/${courseSlug}/${path.contentSlug}`, (req, res) => {
      axios
        .get(requestLoengud(coursePathInGithub, `${path.contentSlug}`), authToken)
        .then((response) => {
          responseAction(
            response,
            config,
            res,
            breadcrumbNames,
            path,
            allCourses,
            singleCoursePaths,
          );
        })
        .catch((error) => {
          console.log(error);
        });
    });
  });

  // Loengu lisamaterjalid endpoint
  config.lessons.forEach((lesson) => {
    lesson.additionalMaterials.map((mat) => {
      const breadcrumbNames = {
        courseName,
        contentName: lesson.name,
        conceptName: mat.name,
      };
      const path = {
        courseSlug,
        contentSlug: lesson.slug,
        conceptSlug: mat.slug,
        fullPath: `${lesson.slug}/${mat.slug}`,
      };

      return app.get(`/${courseSlug}/${path.contentSlug}/${path.conceptSlug}`, (req, res) => {
        axios
          .get(requestLessonAdditionalMaterials(coursePathInGithub, `${path.contentSlug}`), authToken)
          .then((response) => {
            responseAction(
              response,
              config,
              res,
              breadcrumbNames,
              path,
              allCourses,
              singleCoursePaths,
            );
          })
          .catch((error) => {
            console.log(error);
          });
      });
    });
  });

  // Loengu concepts endpointid
  config.lessons.forEach((lesson) => {
    lesson.concepts.map((concept) => {
      const conceptInfo = config.concepts.find((x) => x.slug === concept);
      const breadcrumbNames = {
        courseName,
        contentName: lesson.name,
        conceptName: conceptInfo.name,
      };
      const path = {
        courseSlug,
        contentSlug: lesson.slug,
        conceptSlug: conceptInfo.slug,
        fullPath: `${lesson.slug}/${conceptInfo.slug}`,
      };

      return app.get(`/${courseSlug}/${path.contentSlug}/${path.conceptSlug}`, async (req, res) => {
        const concepts = await axios.get(requestConcepts(coursePathInGithub, `${path.conceptSlug}`), authToken);
        const sources = await axios.get(requestSources(coursePathInGithub, `${path.conceptSlug}`), authToken);

        /* console.log('concept', concept);
        console.log('conceptInfo', conceptInfo);
        console.log('breadcrumbNames:', breadcrumbNames);
        console.log('path:', path); */

        axios
          .all([concepts, sources])
          .then(
            axios.spread((...responses) => {
              const resConcepts = responses[0];
              const resSources = responses[1];

              responseAction(
                resConcepts,
                config,
                res,
                breadcrumbNames,
                path,
                allCourses,
                singleCoursePaths,
                resSources,
              );
            }),
          )
          .catch((error) => {
            console.log(error);
          });
      });
    });
  });
};

module.exports = { setSingleCourseRoutes };

/*
  // Teemade endpointid
  config.concepts.forEach((elem) => {
    const breadcrumbNames = {
      courseName,
      contentName: elem.name,
    };
    const path = {
      courseSlug,
      contentSlug: elem.slug,
    };
    // define folder for each concept's static files:
    // console.log('requestStatic(elem.slug)', requestStaticURL(elem.slug));
    // app.use(express.static(requestStaticURL(elem.slug)));

    app.get(`/${courseSlug}/${elem.slug}`, async (req, res) => {
      const concepts = axios.get(requestConcepts(coursePathInGithub, `${elem.slug}`), authToken);
      const sources = axios.get(requestSources(coursePathInGithub, `${elem.slug}`), authToken);

      // app.use('images', express.static('https://api.github.com/tluhk/HK_Riistvara-alused/contents/concepts/arvuti/images'));

      /* try {
        const response = await getImgPromises(coursePathInGithub, elem.slug);
        // console.log('response.data', response.data);
        const responseData = response.data;
        // console.log('data', responseData);

        const files = [];
        responseData.map((x) => files.push(x.download_url));
        // console.log('files', files);
      } catch (err) {
        console.error(err);
      } */
/*
      axios
        .all([concepts, sources])
        .then(
          axios.spread((...responses) => {
            const resConcepts = responses[0];
            const resSources = responses[1];

            responseAction(
              resConcepts,
              config,
              res,
              breadcrumbNames,
              path,
              allCourses,
              singleCoursePaths,
              resSources,
            );
          }),
        )
        .catch((error) => {
          console.log(error);
        });
    });
  });
  */
