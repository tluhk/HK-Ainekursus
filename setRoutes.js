/* eslint-disable max-len */
const express = require('express');

const { base64, utf8, MarkdownIt } = require('./setupMarkdown');
const { axios, authToken } = require('./setupGithub');

// Import request functions for Axios
const {
  requestDocs,
  requestLoengud,
  requestConcepts,
  requestSources,
  requestStatic,
} = require('./functions/repoFunctions');

// Define what to do with Axios Response, how it is rendered
function responseAction(resConcepts, config, res, pageName, ...options) {
  const concepts = resConcepts.data;
  const conceptsDecoded = base64.decode(concepts.content);
  const conceptsDecodedUtf8 = utf8.decode(conceptsDecoded);
  const conceptsMarkdown = MarkdownIt.render(conceptsDecodedUtf8);

  const resSources = options[0];
  // console.log('pageName', pageName);

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
    loengud: config.loengud,
    sources: sourcesJSON,
    gitToken: authToken.headers.Authorization,
    pageName,
  });
}

/* const getRoutes = async (conf) => {
  console.log('conf', conf);
}; */

const setRoutes = async (app, config) => {
  // console.log('config from setRoutes.js', config);
  // console.log('config.loengud[1].concepts from setRoutes.js', config.loengud[1].concepts);

  // *** ENDPOINTS ***

  // localhost:3000/ endpoint; renderdab "home" faili ja saadab kaasa "docs", "concepts" ja "loengud" optionid, mis pärinevad config.json failist
  app.get('/', (req, res) => {
    res.render('home', {
      docs: config.docs,
      concepts: config.concepts,
      loengud: config.loengud,
    });
  });

  // Ainekursusest ja Hindamine endpointid
  config.docs.forEach((elem) => {
    // console.log('elem.slug:', elem.slug);

    app.get(`/${elem.slug}`, (req, res) => {
      const pageName = elem.name;

      axios
        .get(requestDocs(`${elem.slug}`), authToken)
        .then((response) => {
          responseAction(response, config, res, pageName);
        })
        .catch((error) => {
          console.log(error);
        });
    });
  });

  // Loengute endpointid
  config.loengud.forEach((elem) => {
    // console.log('elem.slug:', elem.slug);

    app.get(`/${elem.slug}`, (req, res) => {
      const pageName = elem.name;

      axios
        .get(requestLoengud(`${elem.slug}`), authToken)
        .then((response) => {
          responseAction(response, config, res, pageName);
        })
        .catch((error) => {
          console.log(error);
        });
    });
  });

  // Teemade endpointid
  config.concepts.forEach((elem) => {
    // define folder for each concept's static files:
    app.use(express.static(requestStatic(elem)));

    app.get(`/${elem.slug}`, (req, res) => {
      const concepts = axios.get(requestConcepts(`${elem.slug}`), authToken);
      const sources = axios.get(requestSources(`${elem.slug}`), authToken);
      const pageName = elem.name;

      axios
        .all([concepts, sources])
        .then(
          axios.spread((...responses) => {
            const resConcepts = responses[0];
            const resSources = responses[1];

            // console.log('resSources', resSources);
            responseAction(resConcepts, config, res, pageName, resSources);
          }),
        )
        .catch((error) => {
          console.log(error);
        });
    });
  });
};

module.exports = { setRoutes };
