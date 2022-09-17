const express = require('express');
const {
  engine,
} = require('express-handlebars');
const axios = require('axios').default;
const MarkdownIt = require('markdown-it');

const markdown = new MarkdownIt();

const app = express();
const port = 3000;

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.get('/', (req, res) => {
  axios.get('https://raw.githubusercontent.com/tluhk/Riistvara-ja-operatsioonisysteemide-alused-HKI5085.HK/main/README.md')
    .then((response) => {
      const results = response.data;
      console.log(results);

      const resultsMarkdown = markdown.render(results);
      res.render('home', { readme: resultsMarkdown });

      // const resultsSplit = results.match(/^#+ [^#]*(?:#(?!#)[^#]*)*/gm);
      /* resultsSplit.forEach(element => {
      });
      console.log(resultsSplit);
      console.log(resultsSplit.length); */
    })
    .catch((error) => {
      console.log(error);
    });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
