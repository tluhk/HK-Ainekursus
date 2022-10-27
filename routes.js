/* eslint-disable max-len */
/* eslint-disable import/newline-after-import */

const auth = process.env.AUTH;
const axios = require('axios').default;
const base64 = require('base-64');
const utf8 = require('utf8');
const path = require('path');
const express = require('express');

// Markdown faili lugemiseks ja dekodeerimiseks
const MarkdownIt = require('markdown-it')({
  html: true, // Enable HTML tags in source
  xhtmlOut: true, // Use '/' to close single tags (<br />).
  linkify: true, // Autoconvert URL-like text to links
  typographer: true, // Enable some language-neutral replacement + quotes beautification.e https://github.com/markdown-it/markdown-it/blob/master/lib/rules_core/replacements.js
}).enable('image');

// Import request functions for Axios
const {
  requestDocs,
  requestLoengud,
  requestConcepts,
  requestSources,
  requestConfig,
} = require('./functions/repoFunctions');

// Github API token
const authToken = {
  headers: {
    Accept: 'application/vnd.github+json',
    Authorization: auth,
  },
};

// import and save tluhk organisation repos
const fun = require('./functions/matchingRepos');
const matchingRepos = fun.getRepos(authToken);
console.log('fun', fun);

// Loen config.json faili, mis kirjeldab demo_aine_repo struktuuri
// const config = require('./demo_aine_repo/config.json')
const config = axios
  .get(requestConfig(matchingRepos[1]), authToken)
  .then((response) => {
    console.log('response.data:', response.data);
    return response.data;
  })
  .catch((error) => {
    console.log(error);
  });

console.log('config:', config);

const repos = require('./repos.json');
const repoDemo = repos[0];

// 1. Read repos from github account, starting with HK_
// 2. Save each matching repo content into a variable

// Get repository content: https://docs.github.com/en/rest/repos/contents#get-repository-content
// Get a latest release: https://docs.github.com/en/rest/releases/releases#get-the-latest-release

// Define what to do with Axios Response, how it is rendered
function responseAction(resConcepts, res, ...options) {
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
    loengud: config.loengud,
    sources: sourcesJSON,
    gitToken: authToken.headers.Authorization,
  });
}

function routes(app) {
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
      axios
        .get(requestDocs(`${elem.slug}`), authToken)
        .then((response) => {
          responseAction(response, res);
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
      axios
        .get(requestLoengud(`${elem.slug}`), authToken)
        .then((response) => {
          responseAction(response, res);
        })
        .catch((error) => {
          console.log(error);
        });
    });
  });

  // Teemade endpointid
  config.concepts.forEach((elem) => {
    // define folder for each concept's static files:
    app.use(express.static(path.join(__dirname, `/demo_aine_repo/${repoDemo.subPath.concepts}/${elem.slug}`)));

    app.get(`/${elem.slug}`, (req, res) => {
      const concepts = axios.get(requestConcepts(`${elem.slug}`), authToken);
      const sources = axios.get(requestSources(`${elem.slug}`), authToken);

      axios
        .all([concepts, sources])
        .then(
          axios.spread((...responses) => {
            const resConcepts = responses[0];
            const resSources = responses[1];

            // console.log('resSources', resSources);
            responseAction(resConcepts, res, resSources);
          }),
        )
        .catch((error) => {
          console.log(error);
        });
    });
  });
}

module.exports = { routes };
