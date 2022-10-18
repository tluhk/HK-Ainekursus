/* eslint-disable max-len */
/* eslint-disable import/newline-after-import */
require('dotenv').config();
const path = require('path');

const auth = process.env.AUTH;
const express = require('express');
const exphbs = require('express-handlebars');
const app = express();
const port = 3000;

const axios = require('axios').default;

const base64 = require('base-64');
const utf8 = require('utf8');

// Markdown faili lugemiseks ja dekodeerimiseks
const MarkdownIt = require('markdown-it')({
  html: true, // Enable HTML tags in source
  xhtmlOut: true, // Use '/' to close single tags (<br />).
  linkify: true, // Autoconvert URL-like text to links
  typographer: true, // Enable some language-neutral replacement + quotes beautification.e https://github.com/markdown-it/markdown-it/blob/master/lib/rules_core/replacements.js
}).enable('image');

// render images from Markdown - NOT WORKING ON BROWSER
// https://www.npmjs.com/package/markdown-it-image-figures
const implicitFigures = require('markdown-it-image-figures');

MarkdownIt.use(implicitFigures, {
  removeSrc: false,
  async: false,
});

// add handlebars helpers: https://stackoverflow.com/a/32707476
const handlebars = require('./helpers/handlebars')(exphbs);

// Github API token
const authToken = {
  headers: {
    Accept: 'application/vnd.github+json',
    Authorization: auth,
  },
};

// Loen config.json faili, mis kirjeldab demo_aine_repo struktuuri
const config = require('./demo_aine_repo/config.json');

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('views', (path.join(__dirname, '/views')));

app.use(express.static(path.join(__dirname, '/public')));

// Import request functions for Axios
const { requestDocs, requestLoengud, requestConcepts } = require('./functions/repoFunctions');

// Define what to do with Axios Response, how it is rendered
function responseAction(axiosResponse, res) {
  const results = axiosResponse.data;
  const contentDecoded = base64.decode(results.content);
  const contentDecodedUtf8 = utf8.decode(contentDecoded);
  const contentMarkdown = MarkdownIt.render(contentDecodedUtf8);
  res.render('home', {
    content: contentMarkdown,
    docs: config.docs,
    concepts: config.concepts,
    loengud: config.loengud,
  });
}

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
    axios.get(requestDocs(`${elem.slug}`), authToken)
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
    axios.get(requestLoengud(`${elem.slug}`), authToken)
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
  // console.log('elem.slug:', elem.slug);

  app.get(`/${elem.slug}`, (req, res) => {
    axios.get(requestConcepts(`${elem.slug}`), authToken)
      .then((response) => {
        responseAction(response, res);
      })
      .catch((error) => {
        console.log(error);
      });
  });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
