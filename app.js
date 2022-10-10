const express = require('express');
const {
  engine,
} = require('express-handlebars');
const axios = require('axios').default;
const MarkdownIt = require('markdown-it');

const markdown = new MarkdownIt();

const app = express();
const port = 3000;

const base64 = require('base-64');
const utf8 = require('utf8');

const authToken = {
  headers: {
    Accept: 'application/vnd.github+json',
    Authorization: 'Bearer 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',
  },
};

const config = require('./demo_aine_repo/config.json');

const baseUrl = 'https://api.github.com';
const repo = require('./repos.json');

const repoRiistvara = repo[0];
const repoDemo = repo[1];

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.get('/', (req, res) => {
  res.render('menulist', { concepts: config.concepts });
});

app.get('/readme', (req, res) => {
  axios.get(`https://api.github.com/repos/${repoRiistvara.owner}/${repoRiistvara.name}/${repoRiistvara.path}`, authToken)
    // https://api.github.com/repos/tluhk/rif20-valikpraktika-1/readme/docs
    .then((response) => {
      const results = response.data;

      // Decode API response and convert to Utf8. Docs: https://www.npmjs.com/package/base-64
      const contentDecoded = base64.decode(results.content);
      const contentDecodedUtf8 = utf8.decode(contentDecoded);

      console.log(contentDecodedUtf8);

      const contentMarkdown = markdown.render(contentDecodedUtf8);
      res.render('readme', { readme: contentMarkdown });
    })
    .catch((error) => {
      console.log(error);
    });
});

app.get('/kursusest', (req, res) => {
  axios.get(`${baseUrl}/repos/${repoDemo.owner}/${repoDemo.name}/${repoDemo.path}/docs/about.md`, authToken)
    .then((response) => {
      const results = response.data;
      console.log('results:', results);

      const contentDecoded = base64.decode(results.content);
      const contentDecodedUtf8 = utf8.decode(contentDecoded);
      const contentMarkdown = markdown.render(contentDecodedUtf8);
      res.render('readme', { readme: contentMarkdown });
    })
    .catch((error) => {
      console.log(error);
    });
});

app.get('/hindamine', (req, res) => {
  axios.get(`${baseUrl}/repos/${repoDemo.owner}/${repoDemo.name}/${repoDemo.path}/docs/hindamine.md`, authToken)
    .then((response) => {
      const results = response.data;
      console.log('results:', results);

      const contentDecoded = base64.decode(results.content);
      const contentDecodedUtf8 = utf8.decode(contentDecoded);
      const contentMarkdown = markdown.render(contentDecodedUtf8);
      res.render('readme', { readme: contentMarkdown });
    })
    .catch((error) => {
      console.log(error);
    });
});

config.concepts.forEach((elem) => {
  console.log('elem.slug:', elem.slug);

  app.get(`/${elem.slug}`, (req, res) => {
    axios.get(`${baseUrl}/repos/${repoDemo.owner}/${repoDemo.name}/${repoDemo.path}/concepts/${elem.slug}/about.md`, authToken)
      .then((response) => {
        const results = response.data;
        console.log('results:', results);

        const contentDecoded = base64.decode(results.content);
        const contentDecodedUtf8 = utf8.decode(contentDecoded);
        const contentMarkdown = markdown.render(contentDecodedUtf8);
        res.render('readme', { readme: contentMarkdown });
      })
      .catch((error) => {
        console.log(error);
      });
  });
});

/*
app.get('/andmekandjad', (req, res) => {
  console.log(andmekandjad);

  const contentMarkdown = markdown.render(andmekandjad);
  res.render('andmekandjad', { readme: contentMarkdown });
}); */

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
