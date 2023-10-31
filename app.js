/** Import express framework */
import express from "express";
import path, {join} from "path";
import exphbs from "express-handlebars";
import favicon from "serve-favicon";
import fileUpload from "express-fileupload";
/** Create a session middleware with the given options using passport
 * https://gist.github.com/jwo/ea79620b5229e7821e4ae61055899cf9
 * https://www.npmjs.com/package/passport-github2
 */
import session from "express-session";
import passport from "passport";
import {Strategy as GitHubStrategy} from "passport-github2";
import pkg from "body-parser";
import {fileURLToPath} from "url";
import pool from "./db.js";
import {
    allCoursesController,
    renderEditPage,
    renderPage,
    responseAction,
} from "./src/components/courses/coursesController.js";
import otherController from "./src/components/other/otherController.js";
import membersController from "./src/components/members/membersController.js";
import teamsController from "./src/components/teams/teamsController.js";
import allNotificationsController from "./src/components/notifications/notificationsController.js";
/** Import handlebars helpers: https://stackoverflow.com/a/32707476 */
import handlebarsFactory from "./src/helpers/handlebars.js";
/** Import middleware's */
import resetSelectedVersion from "./src/middleware/resetSelectedVersion.js";
import ensureAuthenticated from "./src/middleware/ensureAuthenticated.js";
import validateTeacher from "./src/middleware/validateTeacher.js";
import getTeamAssignments from "./src/middleware/getTeamAssignments.js";
/** Import routes */
import logoutRoutes from "./src/routes/logout.js";
import progressRoutes from "./src/routes/progress.js";
import saveEmailRoutes from "./src/routes/save-email.js";
import saveDisplayNameRoutes from "./src/routes/save-username.js";
import removeAsDone from "./src/routes/remove-as-done.js";
import markAsDone from "./src/routes/mark-as-done.js";
import addNewCourseRoutes from "./src/routes/add-new-course.js";
import addNewBranchRoutes from "./src/routes/add-new-branch.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Create express app */
const app = express();
const port = process.env.PORT || 3000;

/** Set up Handlebars views */
const handlebars = handlebarsFactory(exphbs);
app.engine("handlebars", handlebars.engine);
app.set("view engine", "handlebars");
app.set("views", join(__dirname, "/views"));

/** Define application static folder */
app.use(express.static(join(__dirname, "/public")));

/** Define favicon file */
app.use(favicon(join(__dirname, "/public/images", "favicon.ico")));

app.use(fileUpload());

app.use(express.json());

/** Testing API endpoints */
app.get("/ping", (req, res) => {
    res.status(200).json({
        message: "API is working",
    });
});

/** Set up Github credentials */
const loginConfig = {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
};

/** Initialize Passport.
 * Used for user login and session.
 * Also use passport.session() middleware, to support persistent login sessions (recommended).
 * https://github.com/jaredhanson/passport
 * https://www.npmjs.com/package/passport-github2
 */
app.use(
    session({
        name: "HK_ainekursused",
        secret: process.env.PASSPORT_SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        // prompt: 'login',
        cookie: {
            secure: false, // change this to true if you're using HTTPS
            maxAge: 60 * 60 * 1000, // 1 hour
            // name: 'HK_ainekursused', // specify your cookie name here
        },
    }),
);
app.use(passport.initialize());
app.use(passport.session());

/** Middleware for parsing bodies from URL. Options can be found here. Source code can be found here.
 * https://github.com/expressjs/body-parser#bodyparserurlencodedoptions
 * // { extended: true } precises that the req.Body object will contain values of any type instead of just strings. https://stackoverflow.com/a/55558485
 */
const {urlencoded} = pkg;
app.use(urlencoded({extended: true}));

/** Setup passport session.
 To support persistent login sessions, Passport needs to be able to
 serialize users into and deserialize users out of the session.  Typically,
 this will be as simple as storing the user ID when serializing, and finding
 the user by ID when deserializing. However, since this example does not
 have a database of user records, the complete GitHub profile is serialized
 and deserialized.
 */
passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

/** LOGIN LOGIC FULL DESCRIPTION:
 * check if githubUserID exists in tluhk GitHub organisation members
 * if not, redirect to /noauth page, showing they must ask access from tluhk personnel
 * -- if yes:
 * get all tluhk teams
 * get all githubUserID teams
 * get all tluhk HK_ teams' assignments
 * check if githubUserID exists in tluhk GitHub organisation's teams
 * -- if not, redirect to /noauth page, showing they must ask access from tluhk personnel
 * -- if yes:
 * check which teams the user exists in
 * check if githubID exists in users
 * -- if yes, check that DB user data is up-to-date with GitHub user data
 * -- if no, add githubUser to DB users
 * -- if yes, read user's displayName and/or email info from Database. Everything else about the user is read from GitHub.
 */

/** Function to check if user exists in DB and insert/update/read user's displayName and email from DB.
 */
async function userDBFunction(userData) {
    const {githubID, username, displayName, email} = userData;

    let conn;
    try {
        conn = await pool.getConnection();
        /**
         * If user exists in DB, don't insert new user. Check if DB data matches with BE data. If not, get users' displayName and email data from DB.
         * If user doesn't exist in DB, insert it to DB based on values in GitHub. If displayName doesn't exist, use username to save this to DB. Return same GitHub values you insert to DB.
         */

        const user = await conn.query("SELECT * FROM users WHERE githubID = ?", [
            githubID,
        ]);

        if (user[0]) {
            if (user[0].displayName && displayName !== user[0].displayName) {
                userData.displayName = user[0].displayName;
            }
            if (user[0].email && email !== user[0].email) {
                userData.email = user[0].email;
            }
            return userData;
        }

        if (!user[0]) {
            if (displayName) {
                await conn.query(
                    "INSERT INTO users (githubID, username, displayName, email) VALUES (?, ?, ?, ?)",
                    [githubID, username, displayName, email],
                );
                return userData;
            }
            await conn.query(
                "INSERT INTO users (githubID, username, displayName, email) VALUES (?, ?, ?, ?)",
                [githubID, username, username, email],
            );
            userData.displayName = username;
            return userData;
        }
    } catch (err) {
        console.log("Unable read or update user data from database");
        console.error(err);
    } finally {
        if (conn) conn.release(); // release to pool
    }
    return true;
}

// Use the GitHubStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and GitHub
//   profile), and invoke a callback with a user object.
passport.use(
    new GitHubStrategy(
        {
            clientID: loginConfig.clientID,
            clientSecret: loginConfig.clientSecret,
            callbackURL: loginConfig.callbackURL,
            // proxy: true,
        },
        async (accessToken, refreshToken, profile, done) => {
            process.nextTick(async () => {
                // console.log('GitHubStrategy1:', { accessToken, refreshToken, profile });
                // console.log('accessToken1:', accessToken);

                /** Double check that GitHub user is part of tluhk GitHub org members.
                 * If not, forbid access by not returning passport profile.
                 * If yes, return GitHub user profile with the passport.
                 */
                    // console.log('profile1:', profile);
                const userInOrgMembers = await membersController.isUserInOrgMembers(
                        profile.username,
                    );

                if (!userInOrgMembers) {
                    console.log("No user in tluhk org");
                    return done(null, null);
                }
                console.log("User exists in tluhk org");

                // console.log('profile1:', profile);
                const {id, username, displayName, _json} = profile;
                const {email} = _json;

                const userData = {
                    githubID: id,
                    username,
                    displayName,
                    email,
                };

                /**
                 * Read user data from DB.
                 * If user NOT in DB, insert user data.
                 * If user is in DB, read its data. Get displayName and email info from DB. Then store it to user profile.
                 */
                const userDataAfterDB = await userDBFunction(userData);

                if (userDataAfterDB) {
                    if (
                        userDataAfterDB.displayName &&
                        profile.displayName !== userDataAfterDB.displayName
                    )
                        profile.displayName = userDataAfterDB.displayName;
                    if (userDataAfterDB.email) profile.email = userDataAfterDB.email;
                }

                console.log("Logging in...");
                /**
                 * Return user profile with a successful login,
                 */
                return done(null, profile);
            });
        },
    ),
);

/** Endpoint to get team assignments from tluhk GitHub account when app is running.
 * Used as middleware to add user's team info to session's profile.
 * https://stackoverflow.com/a/25687358
 */
app.use(getTeamAssignments, async (req, res, next) => {
    // console.log('req.user5:', req.user);
    if (req.user && !req.user.team) {
        const {user} = req;
        // console.log('user1:', user);
        // console.log('userTeam1:', userTeam);
        req.user.team = await teamsController.getUserTeam(
            user.id,
            res.locals.teamAssignments,
        );
        // eslint-disable-next-line brace-style
    } /* else {
    /**
   * TO ALLOW LOGGING IN WITH ANY USER, COMMENT OUT FOLLOWING else STATEMENT!
   * FOR TESTING, THE APP IS BY DEFAULT LOGGED IN AS seppkh IN TEAM rif20
   *
   * IF YOU WANT TO LOG IN AS seppkh AND USE ITS TRUE GITHUB TEAM:
   * 1. ENABLE FULL else STATEMENT
   * 2. COMMENT OUT team: {} KEY.
   * 3. THEN ENABLE FOLLOWING if (req.user && !req.user.team) {} CONDITION */
    // else {
    /*req.user = {
      id: "62253084",
      nodeId: "MDQ6VXNlcjYyMjUzMDg0",
      displayName: null,
      username: "seppkh",
      profileUrl: "https://github.com/seppkh",
      provider: "github",
      _json: {
        avatar_url: "https://avatars.githubusercontent.com/u/62253084?v=4",
        type: "User",
      },
      team: {
        name: "rif20",
        id: 6514564,
        node_id: "T_kwDOBqxQ5c4AY2eE",
        slug: "rif20",
      },
    };

    if (req.user && !req.user.team) {
      const { user } = req;
      const userTeam = await teamsController.getUserTeam(
        user.id,
        res.locals.teamAssignments,
      );
      // console.log('user1:', user);
      // console.log('userTeam1:', userTeam);
      req.user.team = userTeam;
    }*/

    /*req.user = {
      id: "132268493",
      nodeId: "U_kgDOB-JBzQ=",
      displayName: null,
      username: "vile-ja-kell",
      profileUrl: "https://github.com/vile-ja-kell",
      provider: "github",
      _json: {
        avatar_url: "https://avatars.githubusercontent.com/u/132268493?v=4",
        type: "User",
      },
      team: {
        name: "rif20",
        id: 6514564,
        node_id: "T_kwDOBqxQ5c4AY2eE",
        slug: "rif20",
      },
    };
    if (req.user && !req.user.team) {
      const { user } = req;
      const userTeam = await teamsController.getUserTeam(
        user.id,
        res.locals.teamAssignments,
      );
      // console.log('user1:', user);
      // console.log('userTeam1:', userTeam);
      req.user.team = userTeam;
    }*/

    next();
});

/** Endpoints for logging in
 //   Use passport.authenticate() as route middleware to authenticate the
 //   request. The first step in GitHub authentication will involve redirecting
 //   the user to GitHub.com.  After authorization, GitHub will redirect the user
 //   back to this application at /github-callback
 */
app.get("/login", (req, res) => {
    let message = "";
    /**
     * Validate that text input is not empty or is not an email
     */
    if (req.query.invalid)
        message =
            "Sisestatud Github kasutajanimi pole korrektne või ei kuulu kolledži kasutajate hulka";
    if (req.query.email) message = "Emaili sisestamine pole lubatud";

    return res.render("login", {
        message,
    });
});

app.post("/login", async (req, res, next) => {
    /**
     * If entered value is empty, redirect back to log in and show "invalid username" message
     */
    if (!req.body.login || !req.body.login.trim())
        return res.redirect("/login?invalid=true");

    /**
     * If entered value is email, redirect back to log in and show "entering email is not allowed" message
     */
    // eslint-disable-next-line no-useless-escape
    if (req.body.login.trim().match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,}$/)) {
        console.log(`Invalid login – email not allowed`);
        return res.redirect("/login?email=true");
    }

    /** If entered username doesn't exist in GitHub, redirect back to log in and show "invalid username" message */
    // const userFromGithub = await apiRequests.getUserFromGithub(req.body.login);
    // if (!userFromGithub) return res.redirect('/login?invalid=true');

    /**  If entered username doesn't exist in GitHub tluhk organisation members, redirect back to log in and show "invalid username" message */

    const userInOrgMembers = await membersController.isUserInOrgMembers(
        req.body.login,
    );
    if (!userInOrgMembers) {
        console.log(`Invalid login – entered username is not in tluhk org members`);
        return res.redirect("/login?invalid=true");
    }

    return passport.authenticate("github", {
        login: req.body.login,
    })(req, res, next);
});

/** GitHub callback to confirm/reject login
 * Use passport.authenticate() as route middleware to authenticate the callback request.
 * If authentication fails, the user will be redirected back to the "/noauth" page.
 * Otherwise, the primary route function will be called, which will redirect the user to the "/" homepage.
 */
app.get(
    "/github-callback",
    passport.authenticate("github", {
        successRedirect: "/dashboard",
        failureRedirect: "/noauth",
        scope: ["user"],
    }),
);

/** From here on, following endpoints are available only with successful login and authentication */
app.use(ensureAuthenticated);

/** General endpoint, duplicates /dashboard for now */
app.get(
    "/",
    resetSelectedVersion,
    ensureAuthenticated,
    allCoursesController.getAllCourses,
);

/** Endpoint for dashboard */
app.get(
    "/dashboard",
    resetSelectedVersion,
    ensureAuthenticated,
    allCoursesController.getAllCourses,
);

/** Endpoint to load course pages */
app.get(
    "/course/:courseSlug/:contentSlug?/:componentSlug?",
    resetSelectedVersion,
    allCoursesController.getSpecificCourse,
    responseAction,
    renderPage,
);

app.get(
    "/course-edit/:courseSlug/:contentSlug?/:componentSlug?",
    ensureAuthenticated,
    validateTeacher,
    allCoursesController.getSpecificCourse,
    responseAction,
    renderEditPage,
);
/** Endpoints to change course version.
 * Only available for teachers.
 */
app.post("/save-selected-version", validateTeacher, (req, res) => {
    // Store the selectedValue in the session
    req.session.selectedVersion = req.body.selectedVersion;
    req.session.courseSlug = req.body.courseSlug;
    // console.log('req.session.selectedVersion1:', req.session.selectedVersion);
    // console.log('req.session.currentPath1:', req.body.currentPath);

    /**
     * Stores selectedVersion correctly,
     * and then makes the original GET request again to reload same page with selectedVersion value.
     */
    res.redirect(`${req.body.currentPath}?ref=${req.session.selectedVersion}`);
});

/** Endpoint for notifications page */
app.get(
    "/notifications",
    resetSelectedVersion,
    allNotificationsController.renderNotificationsPage,
);

/** Endpoint to change how courses are displayed on dashboard */
app.post("/courses-display-by", (req, res) => {
    // Store the displayBy in the session
    req.session.coursesDisplayBy = req.body.coursesDisplayBy;

    return res.redirect(
        `/dashboard?coursesDisplayBy=${req.session.coursesDisplayBy}`,
    );
});

app.use("/mark-component-as-done", markAsDone);
app.use("/remove-component-as-done", removeAsDone);
/** Endpoint for 404 page for invalid or inaccessible links */
app.get("/notfound", resetSelectedVersion, otherController.notFound);

/** Page for not authorized login attempt (GitHub user not part of tluhk organisation) */
app.get("/noauth", otherController.noAuth);

app.use("/save-displayName", saveDisplayNameRoutes);
app.use("/save-email", saveEmailRoutes);
app.use("/progress-overview", progressRoutes);
app.use("/logout", logoutRoutes);
app.use("/add-course", addNewCourseRoutes);
app.use("/add-branch", addNewBranchRoutes);

/** Redirect all unknown paths to 404 page */
app.all("*", resetSelectedVersion, otherController.notFound);

/** Start a server and listen on port 3000 */
app.listen(port, () => {
    console.log(`App is running`);
});

export default app;
