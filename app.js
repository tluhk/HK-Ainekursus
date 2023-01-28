/* eslint-disable max-len */

/* eslint-disable import/newline-after-import */
require('dotenv').config();

/**
 * Import express framework
 */
const express = require('express');

const path = require('path');
const exphbs = require('express-handlebars');

/**
  * Create express app
  */
const app = express();
const port = process.env.PORT || 3000;
const favicon = require('serve-favicon');

/* kui tahad livesse lasta, siis chekout production ja seal kustuta kogu livereload plokk ära – see blokeerib lehte */
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
app.use(connectLivereload());

const {
  allCoursesController, verifyCache, responseAction, renderPage,
} = require('./src/components/courses/coursesController');
const { otherController } = require('./src/components/other/otherController');
// const { setSingleCourseRoutes } = require('./src/routes/singleCourseRoutes');
// const { responseAction } = require('./src/components/singleCourse/controller');

/**
 *  Import handlebars helpers: https://stackoverflow.com/a/32707476
 */
const handlebars = require('./src/helpers/handlebars')(exphbs);

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, '/views'));

/**
 *  Define application static folder
 */
app.use(express.static(path.join(__dirname, '/public')));

/**
 *  Define favicon file
 */
app.use(favicon(path.join(__dirname, '/public/images', 'favicon.ico')));

/**
  * Testing API endpoints
  */
app.get('/ping', (req, res) => {
  res.status(200).json({
    message: 'API is working',
  });
});

/**
  * Available endpoints
  */
app.get('/', allCoursesController.getAllCourses);
app.get('/courses', allCoursesController.getAllCourses);
app.get('/course/:courseSlug/:contentSlug?/:componentSlug?', verifyCache, allCoursesController.getSpecificCourse, responseAction, renderPage);

/**
 * 404 page for wrong links
 */
app.get('/notfound', otherController.notFound);

/**
 * Redirect all unknown paths to main page
 */
app.all('*', (req, res) => {
  res.render('notfound');
});

/**
 * Start a server and listen on port 3000
 */
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
