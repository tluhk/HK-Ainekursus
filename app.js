/* eslint-disable max-len */
/* eslint-disable import/newline-after-import */
require('dotenv').config();
const { default: axios } = require('axios');

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

/**
 * Create a session middleware with the given options
 * https://gist.github.com/jwo/ea79620b5229e7821e4ae61055899cf9
 */
const passport = require('passport');
const session = require('express-session');
const GitHubStrategy = require('passport-github2').Strategy;

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
 * Authentication
 * https://github.com/cfsghost/passport-github/blob/master/examples/login/app.js
 *
  // Simple route middleware to ensure user is authenticated.
  //   Use this route middleware on any resource that needs to be protected.  If
  //   the request is authenticated (typically via a persistent login session),
  //   the request will proceed.  Otherwise, the user will be redirected to the
  //   login page.
 */
const ensureAuthenticated = ((req, res, next) => {
  if (req.isAuthenticated()) {
    console.log('req.session.passport.user.id1:', req.session.passport.user.id);
    console.log('Authenticated');
    return next();
  }
  console.log('NOT Authenticated');
  return res.redirect('/');
});

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete GitHub profile is serialized
//   and deserialized.
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Use the GitHubStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and GitHub
//   profile), and invoke a callback with a user object.
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
    },
    ((accessToken, refreshToken, profile, done) => {
      // asynchronous verification, for effect...
      // console.log('GitHubStrategy1:', { accessToken, refreshToken, profile });
      console.log('github_profile_id1:', profile.id);
      // console.log('Logged in');
      return done(null, profile);

      // an example of how you might save a user
      // new User({ username: profile.username }).fetch().then(user => {
      //   if (!user) {
      //     user = User.forge({ username: profile.username })
      //   }
      //   user.save({ profile: profile, access_token: accessToken }).then(() => {
      //     return done(null, user)
      //   })
      // })
    }),
  ),
);

/**
 * Initialize Passport!
 * Also use passport.session() middleware, to support persistent login sessions (recommended).
 */
app.use(
  session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }),
);
app.use(passport.initialize());
app.use(passport.session());

// GET /login
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in GitHub authentication will involve redirecting
//   the user to github.com.  After authorization, GitHub will redirect the user
//   back to this application at /github-callback
app.get(
  '/login',
  passport.authenticate('github', { scope: ['read:user'] }),
);

// GET /github-callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function will be called,
//   which, in this example, will redirect the user to the home page.
app.get(
  '/github-callback',
  passport.authenticate('github', { failureRedirect: '/notfound' }),
  (req, res) => {
    console.log('Logged in');
    res.redirect('/');
  },
);

/**
 * Logout
 * https://www.tabnine.com/code/javascript/functions/express/Request/logout
 */
app.get('/logout', (req, res, next) => {
  console.log('Logging out process');

  req.session.destroy((err) => {
    if (err) { return next(err); }
    console.log('Logged out');
    return res.redirect('/'); // Inside a callback… bulletproof!
  });
});

/**
  * Available endpoints without login
  */
app.get('/', allCoursesController.getAllCourses);
app.get('/courses', allCoursesController.getAllCourses);

/**
 * Available endpoints with login
 */
app.get('/course/:courseSlug/:contentSlug?/:componentSlug?', ensureAuthenticated, verifyCache, allCoursesController.getSpecificCourse, responseAction, renderPage);

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
