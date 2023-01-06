/* eslint-disable max-len */
/* eslint-disable import/newline-after-import */
require('dotenv').config();
const http = require('http');
const hostname = '0.0.0.0';

const path = require('path');

const express = require('express');
const exphbs = require('express-handlebars');
const app = express();
const port = 3000;

const livereload = require('livereload');
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(__dirname, '/views'));
liveReloadServer.watch(path.join(__dirname, 'public'));

liveReloadServer.server.once('connection', () => {
  setTimeout(() => {
    liveReloadServer.refresh('/');
  }, 100);
});

const connectLivereload = require('connect-livereload');

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

app.use(connectLivereload());

const { engine } = require('./engine');

engine(app);

app.listen(port, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
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
