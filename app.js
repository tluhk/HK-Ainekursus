/* eslint-disable max-len */
/* eslint-disable import/newline-after-import */
require('dotenv').config();

const path = require('path');

const express = require('express');
const exphbs = require('express-handlebars');
const app = express();
const port = process.env.PORT || 3000;

/* kui tahad livesse lasta, siis chekout production ja seal kustuta kogu livereload plokk ära – see blokeerib lehte */
/* const livereload = require('livereload');
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(__dirname, '/views'));
liveReloadServer.watch(path.join(__dirname, 'public'));
liveReloadServer.server.once('connection', () => {
  setTimeout(() => {
    liveReloadServer.refresh('/');
  }, 100);
});
const connectLivereload = require('connect-livereload');
app.use(connectLivereload()); */

// add handlebars helpers: https://stackoverflow.com/a/32707476
const handlebars = require('./src/helpers/handlebars')(exphbs);

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, '/views'));

// define application static folder:
app.use(express.static(path.join(__dirname, '/public')));
app.use(
  '/images',
  express.static(
    'https://api.github.com/tluhk/HK_Riistvara-alused/contents/concepts/arvuti/images'
  )
);

const { engine } = require('./engine');

engine(app);

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

/* const start = (portProp) => {
  try {
    app.listen(portProp);
    console.log(`Listening on port ${portProp}`);
  } catch (err) {
    console.error(err);
    process.exit();
  }
};

start(port); */
