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

// const { andmekandjad } = require('./views/andmekandjad/README.md');

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.get('/', (req, res) => {
  res.render('menulist');
});

/*
app.get('/andmekandjad', (req, res) => {
  console.log(andmekandjad);

  const contentMarkdown = markdown.render(andmekandjad);
  res.render('andmekandjad', { readme: contentMarkdown });
}); */

app.get('/readme', (req, res) => {
  const authToken = {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer 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',
    },
  };

  axios.get('https://api.github.com/repos/tluhk/Riistvara-ja-operatsioonisysteemide-alused-HKI5085.HK/readme', authToken)
    // https://api.github.com/repos/tluhk/rif20-valikpraktika-1/readme/docs
    .then((response) => {
      const results = response.data;

      // Decode API response and convert to Utf8. Docs: https://www.npmjs.com/package/base-64
      const contentDecoded = base64.decode(results.content);
      const contentDecodedUtf8 = utf8.decode(contentDecoded);

      console.log(contentDecodedUtf8);

      const contentMarkdown = markdown.render(contentDecodedUtf8);
      res.render('readme', { readme: contentMarkdown });

      // Trying to split by markdown headings and render each part individually:
      // const resultsSplit = results.match(/^#+ [^#]*(?:#(?!#)[^#]*)*/gm);

    /* console.log(resultsSplit);
      console.log(resultsSplit.length);
      res.render('home', { readme: resultsSplit, markdown }); */
    })
    .catch((error) => {
      console.log(error);
    });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
