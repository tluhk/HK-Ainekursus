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
 * Create a session middleware with the given options using passport
 * https://gist.github.com/jwo/ea79620b5229e7821e4ae61055899cf9
 * https://www.npmjs.com/package/passport-github2
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

const { cache } = require('./src/setup/setupCache');

const {
  allCoursesController, verifyCache, responseAction, renderPage,
} = require('./src/components/courses/coursesController');
const { otherController } = require('./src/components/other/otherController');
const { membersController } = require('./src/components/members/membersController');
const { teamsController } = require('./src/components/teams/teamsController');

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
    // console.log('req.session1:', req.session);
    // console.log('req.session.passport.user.id1:', req.session.passport.user.id);
    // console.log('Authenticated');
    return next();
  }
  // console.log('req.session2:', req.session);
  console.log('NOT Authenticated');
  return res.redirect('/');
});

const cacheService = (async (req, res, next) => {
  const { cacheName } = res.locals;
  console.log('cacheName1:', cacheName);
  try {
    if (cache.has(cacheName) && cache.get(cacheName) !== undefined) {
      console.log(`${cacheName} loaded with CACHE`);
      res.locals[cacheName] = await cache.get(cacheName);
      delete res.locals.cacheName;
      console.log('res.locals2:', res.locals);

      return;
    }
    console.log(`${cacheName} loaded with API`);
  } catch (err) {
    console.log('err');
    throw new Error(err);
  }
});

/**
 * Request tluhk org teams and teamMembers once during app starting.
 * Save teamAssignments into res.locals
 */
const getTeamAssignments = (async (req, res, next) => {
  const cacheName = 'teamAssignments';
  res.locals.cacheName = cacheName;

  await cacheService(req, res);
  if (res.locals[cacheName]) return next();

  // console.log('res.locals3:', res.locals);
  const { teams } = await teamsController.getOrgTeams();
  const getAllTeamAssignments = await teamsController.getAllTeamAssignments(teams);
  // console.log('getAllTeamAssignments1:', getAllTeamAssignments);

  cache.set(cacheName, getAllTeamAssignments);
  res.locals[cacheName] = getAllTeamAssignments;
  delete res.locals.cacheName;
  console.log('res.locals4:', res.locals);

  // console.log('res.locals.teamAssignments1:', res.locals.teamAssignments);

  return next();
});

// app.use(getTeamAssignments);

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
    (async (accessToken, refreshToken, profile, done) => {
      // asynchronous verification, for effect...
      // console.log('GitHubStrategy1:', { accessToken, refreshToken, profile });
      console.log('github_profile_id1:', profile.id);

      /**
       * Check if Github user is part of tluhk Github org members.
       * If not, forbid access by not saving passport profile.
       * If yes, save github user profile in the passport.
       */
      const userInOrgMembers = membersController.isUserInOrgMembers(profile.id);

      if (!userInOrgMembers) {
        console.log('no user in tluhk org');
        return done(null, null);
      }
      console.log('user exists in tluhk org');

      // console.log('userInOrgMembers1:', userInOrgMembers);
      // console.log('profile1:', profile);
      // console.log('Logged in');
      return done(null, profile);

      /**
       * check if githubUserID exists in tluhk Github organisation members
       * if not, redirect to /noauth page, showing you must ask access from tluhk
       * -- if yes:
       * get all tluhk teams
       * get all githubUserID teams
       * get all tluhk HK_ team assignments
       * check if githubUserID exists in tluhk Github organisation teams
       * -- if not, redirect to /noauth page, showing you must ask access from tluhk
       * -- if yes:
       * check which teams it exists in
       * check if githubID exists in users
       * -- if yes, check that user is up-to-date with github user?? + update??
       * -- if yes, read user info from database? github?
       * -- if not, add githubUser to users
       */

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

/**
 * https://stackoverflow.com/a/25687358
 * in an express middleware (before the router).
 * I recommend the middleware route, I use such a function to add last visit date-time to the req.session, and am also developing middleware in using app.all('*') to do IP request tracking
 */
app.use(async (req, res, next) => {
  if (req.user && !req.user.team) {
    const { user } = req;
    const userTeam = await teamsController.getUserTeam(user.id, cache.get('teamAssignments'));
    // console.log('user1:', user);
    // console.log('userTeam1:', userTeam);
    req.user.team = userTeam;
  }

  // console.log('req.user1:', req.user);

  next();
});

// GET /login
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in GitHub authentication will involve redirecting
//   the user to github.com.  After authorization, GitHub will redirect the user
//   back to this application at /github-callback
app.get(
  '/login',
  getTeamAssignments,
  passport.authenticate('github', { scope: ['read:user'] }),
);

// GET /github-callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function will be called,
//   which, in this example, will redirect the user to the home page.
app.get(
  '/github-callback',
  passport.authenticate('github', { failureRedirect: '/noauth' }),
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
  req.logout((err) => {
    if (err) { return next(err); }
    console.log('Logged out');
    console.log();
    res.redirect('/');
  });
});

/*
app.get('/logout', async (req, res, next) => {
  console.log('Logging out process');
  await req.logout({ keepSessionInfo: false });
  req.session = null;
  return res.redirect('/');
/*
  req.session.destroy((err) => {
    if (err) { return next(err); }
    console.log('Logged out');
    return res.redirect('/'); // Inside a callback… bulletproof!
  });
}); */

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
 * Page for not authorized login attempt (github user not part of tluhk organisation)
 */
app.get('/noauth', otherController.noAuth);

/**
 * Redirect all unknown paths to 404 page
 */
app.all('*', otherController.notFound);

/**
 * Start a server and listen on port 3000
 */
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
