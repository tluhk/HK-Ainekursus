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
  // requestStaticURL,
} = require('./functions/repoFunctions');

const returnPreviousPage = (currentPage, paths) => {
  const currentIndex = paths.indexOf(currentPage);
  if (currentIndex !== 0) {
    return paths[currentIndex - 1];
  } return currentPage;
};
const returnNextPage = (currentPage, paths) => {
  const currentIndex = paths.indexOf(currentPage);
  if (currentIndex !== paths.lenght - 1) {
    return paths[currentIndex + 1];
  } return currentPage;
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
    concepts: config.concepts,
    lessons: config.lessons,
    sources: sourcesJSON,
    breadcrumb: breadcrumbNames,
    path,
    singleCoursePaths,
    courses: allCourses,
    returnPreviousPage,
    returnNextPage,
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
  config.docs.map((x) => {
    singleCoursePaths.push(x.slug);
    return true;
  });
  config.lessons.map((x) => {
    singleCoursePaths.push(x.slug);
    x.concepts.map((y) => {
      singleCoursePaths.push(y);
      return true;
    });
    return true;
  });

  /* const lessons = course.lessons;
  console.log('lessonIndex:', lessons);
  const lessonConcepts = course.lessons.concepts;
  console.log('lessonConcepts:', lessonConcepts); */

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
    };

    app.get(`/${courseSlug}/${elem.slug}`, (req, res) => {
      axios
        .get(requestDocs(coursePathInGithub, `${elem.slug}`), authToken)
        .then((response) => {
          responseAction(response, config, res, breadcrumbNames, path, allCourses, singleCoursePaths);
        })
        .catch((error) => {
          console.log(error);
        });
    });
  });

  // Loengute endpointid
  config.lessons.forEach((elem) => {
    // console.log('elem.slug:', elem.slug);
    const breadcrumbNames = {
      courseName,
      contentName: elem.name,
    };
    const path = {
      courseSlug,
      contentSlug: elem.slug,
    };

    app.get(`/${courseSlug}/${elem.slug}`, (req, res) => {
      axios
        .get(requestLoengud(coursePathInGithub, `${elem.slug}`), authToken)
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
    /* console.log('prevConceptIndex', prevConceptIndex);
    console.log('nextConceptIndex', nextConceptIndex);
    console.log('conceptsLength', conceptsLength); */

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
};

module.exports = { setSingleCourseRoutes };
