/* eslint-disable max-len */
/* eslint-disable import/newline-after-import */
require('dotenv').config();

const path = require('path');

const express = require('express');
const exphbs = require('express-handlebars');
const app = express();
const port = process.env.PORT || 3000;
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

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
    'https://api.github.com/tluhk/HK_Riistvara-alused/contents/concepts/arvuti/images',
  ),
);

app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: 'SECRET',
}));

/*
app.get('/', (req, res) => {
  res.render('pages/auth');
}); */

const { engine } = require('./engine');

engine(app);

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

/*  PASSPORT SETUP  */

let userProfile;

app.use(passport.initialize());
app.use(passport.session());

app.get('/success', (req, res) => res.send(userProfile));
app.get('/error', (req, res) => res.send('error logging in'));

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((obj, cb) => {
  cb(null, obj);
});

/*  Google AUTH  */

const GOOGLE_CLIENT_ID = '383549708462-na4dmnr8qv17rl90k5r9fjv8dssmh64o.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';

passport.use(new GoogleStrategy(
  {
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/callback',
  },
  ((accessToken, refreshToken, profile, done) => {
    userProfile = profile;
    console.log('userProfile:', userProfile);
    return done(null, userProfile);
  }),
));

app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }),
);

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/error' }),
  (req, res) => {
    // Successful authentication, redirect success.
    res.redirect('/');
  },
);
