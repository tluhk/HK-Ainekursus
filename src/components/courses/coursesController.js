/* eslint-disable max-len */
/* eslint-disable no-undef */
import 'core-js/actual/array/group-by';

import { performance } from 'perf_hooks';
import { base64, utf8, markdown } from '../../setup/setupMarkdown';

// Enable in-memory cache
import getAllCoursesData from '../../functions/getAllCoursesData';

import getConfig from '../../functions/getConfigFuncs';
import { function1 } from '../../functions/imgFunctions';
import { returnPreviousPage, returnNextPage, setCourseButtonPaths } from '../../functions/navButtonFunctions';
import apiRequests from './coursesService';
import teamsController from '../teams/teamsController';
import allNotificationsController from '../notifications/notificationsController';
import pool from '../../../db';

/**
 * Define what to do after info about couse and course page is received.
 * This step does the Axios requests via apiRequests[githubRequest] statement.
 * List of possible apiRequests is defined above.
 * Responses are saved into components, files, sources parts in res.locals, respectively.
 */
const responseAction = async (req, res, next) => {
  const {
    githubRequest,
  } = res.locals;
  console.log();

  let apiResponse;
  // eslint-disable-next-line no-prototype-builtins
  if (apiRequests.hasOwnProperty(githubRequest)) {
    let func;

    try {
      func = await apiRequests[githubRequest];
    } catch (error) {
      console.log(`Unable to get ${githubRequest}`);
      console.error(error);
    }
    // console.log('func1:', func);
    await func(req, res).then((response) => {
      // console.log('response1:', response);
      apiResponse = response;
    });
  }

  // console.log('githubRequest1:', githubRequest);
  // console.log('githubRequest1type:', typeof githubRequest);

  /**
   * name: 'about.md',
    path: 'concepts/emaplaadid/about.md',
    sha: 'a1c74cf1ea13c19cc9c08bcec5bb6f6f693c4450',

    name: 'about.md',
    path: 'docs/about.md',
    sha: '08343c30068205a54d6736b25199c7791f2ca655',

    name: 'about.md',
    path: 'concepts/emaplaadid/about.md',
    sha: 'a1c74cf1ea13c19cc9c08bcec5bb6f6f693c4450',

    28aee17fe750820f1d0dd1012380f5befab998bc
    07d766e4ada35aa6f3794a213fd6d5cf70519b9f
   */

  const { components, files, sources } = apiResponse;
  res.locals.resComponents = components;
  res.locals.resFiles = files;
  res.locals.resSources = sources;

  return next();
};

/**
 * Last step to render page now that we have resComponents, resFiles and resSources values from Axios.
 * We have everything needed to render the page.
 */
const renderPage = async (req, res) => {
  const {
    config,
    breadcrumbNames,
    path,
    allCourses,
    backAndForwardPaths,
    markAsDonePaths,
    coursePathInGithub,
    teachers,
    branches,
    selectedVersion,
    markedAsDoneComponentsArr,
  } = res.locals;

  const {
    resComponents,
    resFiles,
    resSources,
    refBranch,
  } = res.locals;

  console.log('req.user55:', req.user);

  // console.log('resComponents in responseAction:', resComponents);
  // console.log('resFiles in responseAction:', resComponents);

  // console.log('resComponents1:', resComponents);
  /**
   * Sisulehe sisu lugemine
   */
  const resComponentsContent = resComponents.data.content;
  const componentDecoded = base64.decode(resComponentsContent);
  const componentDecodedUtf8 = utf8.decode(componentDecoded);

  /**
   * Sisulehe piltide kuvamine
   * - functions: https://stackoverflow.com/a/58542933
   * - changing img src: https://www.npmjs.com/package/modify-image-url-md?activeTab=explore
   */
  const start1 = performance.now();
  const markdownWithModifiedImgSources = await function1(coursePathInGithub, path, componentDecodedUtf8, refBranch);
  const end1 = performance.now();
  console.log(`Execution time markdownWithModifiedImgSources: ${end1 - start1} ms`);

  /**
   * Add Table of Contents markdown element to Markdown before rendering
   */
  const markdownWithModifiedImgSourcesToc = markdownWithModifiedImgSources.concat('\n\n ${toc} \n');
  // console.log('markdownWithModifiedImgSourcesToc:', markdownWithModifiedImgSourcesToc);

  /**
   * Render Markdown
   */
  const start2 = performance.now();
  const componentMarkdown = await markdown.render(markdownWithModifiedImgSourcesToc);
  const end2 = performance.now();
  console.log(`Execution time componentMarkdown: ${end2 - start2} ms`);
  // console.log('componentMarkdown:', componentMarkdown);

  /**
   * Select rendered Markdown html, excluding table of contents
   */
  const componentMarkdownWithoutTOC = componentMarkdown.substring(0, componentMarkdown.indexOf('<nav class="table-of-contents-from-markdown-123">'));

  /**
   * Select rendered Markdown table of contents, excluding preceding contents.
   */
  function getStringBetween(str, start, end) {
    const result = str.match(new RegExp(`${start}(.*)${end}`));
    return result[1];
  }
  const componentMarkdownOnlyTOCWithoutNav = getStringBetween(componentMarkdown, '<nav class="table-of-contents-from-markdown-123">', '</nav>');
  const componentMarkdownOnlyTOC = `<nav class="table-of-contents">${componentMarkdownOnlyTOCWithoutNav}</nav>`;

  // console.log('componentMarkdownWithoutTOC:', componentMarkdownWithoutTOC);
  // console.log('componentMarkdownOnlyTOC:', componentMarkdownOnlyTOC);

  // define sources as NULL by default.
  let sourcesJSON = null;
  // NB! Sources are sent only with "Teemade endpointid" axios call. If sourcesJSON stays NULL (is false), then content.handlebars does not display "Allikad" div. If sourcesJSON gets filled (is true), then "Allikad" div is displayed.
  if (resSources) {
    const sources = resSources.data;
    const sourcesDecoded = base64.decode(sources.content);
    const sourcesDecodedUtf8 = utf8.decode(sourcesDecoded);
    sourcesJSON = JSON.parse(sourcesDecodedUtf8);
  }

  console.log('markedAsDoneComponentsArr9:', markedAsDoneComponentsArr);
  // console.log('teachers3:', teachers);
  res.render('course', {
    component: componentMarkdownWithoutTOC,
    docs: config.docs,
    additionalMaterials: config.additionalMaterials,
    concepts: config.concepts,
    practices: config.practices,
    lessons: config.lessons,
    sources: sourcesJSON,
    breadcrumb: breadcrumbNames,
    path,
    backAndForwardPaths,
    markAsDonePaths,
    courses: allCourses,
    returnPreviousPage,
    returnNextPage,
    config,
    files: resFiles,
    user: req.user,
    ToC: componentMarkdownOnlyTOC,
    teachers,
    branches,
    selectedVersion,
    refBranch,
    currentPath: req.body.currentPath,
    markedAsDoneComponentsArr,
  });
};

const getMarkedAsDoneComponents = async (githubID, courseSlug) => {
  // console.log('githubID10:', githubID);
  // console.log('courseSlug10:', courseSlug);
  let res10;
  let keysArray = [];

  // read markedAsDoneComponents value from database
  if (githubID && courseSlug) {
    let conn;
    try {
      conn = await pool.getConnection();
      console.log('Connected to MariaDB 5!');

      res10 = await conn.query('SELECT markedAsDoneComponents FROM users_progress WHERE githubID = ? AND courseCode = ?;', [githubID, courseSlug]);
    } catch (err) {
      console.log('Unable to connect to MariaDB 5');
      console.error(err);
    } finally {
      if (conn) conn.release(); // release to pool
    }
    // console.log('res10:', res10);
    // console.log('typeof res10:', typeof res10);

    // if nothing has been saved to databse yet, return empty array
    if (!res10 || !res10[0]) return keysArray;
    // console.log('typeof res10[0].markedAsDoneComponents:', typeof res10[0].markedAsDoneComponents);

    // if sth had been saved to DB before, but then removed and DB now returns empty object, return empty array
    if (res10[0].markedAsDoneComponents === '{}') {
      return keysArray;
    } 

    // console.log('res10[0].markedAsDoneComponents:', res10[0].markedAsDoneComponents);

    // remove the curly braces around DB entry (that's string type)
    const string = res10[0].markedAsDoneComponents.slice(1, -1); 

    // convert DB string entry to object
    const obj = {};

    string.split(',').forEach((pair) => {
      const [key, value] = pair.trim().split(':');
      // console.log('key:', key);
      // console.log('value:', value);
      const keyUnqouted = key.slice(1, -1);
      const valueUnquoted = value.slice(1, -1);
      obj[keyUnqouted] = valueUnquoted;
    });
    // console.log('obj:', obj);

    // console.log('Object.keys(obj)', Object.keys(obj));
    // Finally, save keys from object to array and return the array of keys.
    keysArray = Object.keys(obj);
    // console.log('keysArray:', keysArray);
  }
  return keysArray;
};

/**
 * allCoursesActiveWithComponentsData
 * For each course, get arr of markedAsDoneComponents
 * For each course, get arr of component UUIDs that match with the user's ref version
 * Check how many markedAsDoneComponents match with allComponents
 */

const allCoursesActiveWithComponentsData = async (allCoursesActive, githubID) => {
  /**
     * Get getMarkedAsDoneComponents data – this is array of UUID-s of components  that have been marked as done by the user
     */

  const allCoursesActiveDoneComponentsPromises = allCoursesActive.map((course) => getMarkedAsDoneComponents(githubID, course.courseSlug));

  const allCoursesActiveDoneComponentsArr = await Promise.all(allCoursesActiveDoneComponentsPromises);
  console.log('allCoursesActiveDoneComponentsArr1:', allCoursesActiveDoneComponentsArr);

  allCoursesActive.forEach((course, index) => {
    allCoursesActive[index].markedAsDoneComponentsUUIDs = allCoursesActiveDoneComponentsArr[index];
  });

  console.log('allCoursesActive1:', allCoursesActive);
  return allCoursesActive;
};

const allCoursesController = {

  /**
   * for '/' and '/dashboard' routes
   */
  getAllCourses: async (req, res) => {
    // console.log('req3:', req);
    let teamSlug;
    if (req.user && req.user.team) teamSlug = req.user.team.slug;
    /**
     * Check if teamSlug is 'teachers'
     * If yes, then get teacher courses info
     * If not, then get user courses info
     */
    let isTeacher = false;
    if (teamSlug === 'teachers') isTeacher = true;
    res.locals.teamSlug = teamSlug;

    // console.log('teamSlug2:', teamSlug);
    // console.log('isTeacher2:', isTeacher);

    const start3 = performance.now();
    const allCourses = await getAllCoursesData(teamSlug, req);
    const end3 = performance.now();
    console.log(`Execution time getAllCoursesData: ${end3 - start3} ms`);
    // console.log('allCourses1:', allCourses);
    const allCoursesActive = allCourses.filter((x) => x.courseIsActive);
    console.log('allCoursesActive5:', allCoursesActive);

    /** Save all teachers in a variable, needed for rendering */
    const start4 = performance.now();
    const allTeachers = await teamsController.getUsersInTeam('teachers');
    const end4 = performance.now();
    console.log(`Execution time allTeachers: ${end4 - start4} ms`);

    res.locals.allCoursesActive = allCoursesActive;
    res.locals.allTeacher = allTeachers;

    if (isTeacher) {
      /*
      * Filter allCoursesActive where the teacher is logged in user
      */
      const allTeacherCourses = allCoursesActive
        .filter((course) => course.teacherUsername === req.user.username);
      console.log('allTeacherCourses1:', allTeacherCourses);

      /*
      * Sort allTeacherCourses, these are teacher's own courses
      */
      allTeacherCourses.sort((a, b) => a.courseName.localeCompare(b.courseName));
      // console.log('allTeacherCourses2:', allTeacherCourses);

      /* These are teachers of all other courses.
      * 1) group by teacher name
      * 2) remove logged in user from the list
      * 3) then sort by teacher name and by each teacher's courses
      * */
      const allCoursesGroupedByTeacher = allCoursesActive
        .groupBy(({ teacherUsername }) => teacherUsername);
      // console.log('allCoursesGroupedByTeacher1:', allCoursesGroupedByTeacher);

      delete allCoursesGroupedByTeacher[req.user.username];
      console.log('allCoursesGroupedByTeacher2:', allCoursesGroupedByTeacher);

      const sortedCoursesGroupedByTeacher = Object.keys(allCoursesGroupedByTeacher)
        .sort()
        .reduce((acc, teacher) => {
          acc[teacher] = allCoursesGroupedByTeacher[teacher].sort((a, b) => a.courseName.localeCompare(b.courseName));
          return acc;
        }, {});
      // console.log('allTeacherCourses5:', allTeacherCourses);
      // console.log('allCoursesGroupedByTeacher1:', allCoursesGroupedByTeacher);
      // console.log('allTeachers1:', allTeachers);
      // console.log('sortedCoursesGroupedByTeacher1:', sortedCoursesGroupedByTeacher);

      const courseUpdates = await allNotificationsController.getCoursesUpdates(allCoursesActive, allTeachers);

      return res.render('dashboard-teacher', {
        courses: allTeacherCourses,
        user: req.user,
        teacherCourses: sortedCoursesGroupedByTeacher,
        teachers: allTeachers,
        courseUpdates,
      });
    }

    if (!isTeacher) {
      /*
      * Sort allCoursesActive, these are student's courses
      */
      allCoursesActive.sort((a, b) => a.courseName.localeCompare(b.courseName));

      /* These are teachers of student's courses.
      * 1) group by teacher name
      * 2) then sort by teacher name and by each teacher's courses
      * */
      const allCoursesGroupedByTeacher = allCoursesActive
        .groupBy(({ teacherUsername }) => teacherUsername);
      // console.log('allCoursesGroupedByTeacher1:', allCoursesGroupedByTeacher);

      const sortedCoursesGroupedByTeacher = Object.keys(allCoursesGroupedByTeacher)
        .sort()
        .reduce((acc, teacher) => {
          acc[teacher] = allCoursesGroupedByTeacher[teacher].sort((a, b) => a.courseName.localeCompare(b.courseName));
          return acc;
        }, {});
      // console.log('allCoursesGroupedByTeacher5:', allCoursesGroupedByTeacher);

      /**
      * NOTIFICATIONS
      /**
       * Get commits per branch
       * -- and per path? (only main folders and config file):
       * https://api.github.com/repos/tluhk/HK_Riistvara-alused/commits?per_page=10&sha=rif20&path=docs
       * 
       * Get commit SHAs where comment_count > 0
       * Get all comments and user.login for each commit SHA:
       * https://api.github.com/repos/tluhk/HK_Riistvara-alused/commits/70b72e7f38430ba8c3f883510990e10fb11cefd3/comments
       * 
       * Save all comments, sort by created_at / updated_at
       * 
       * "Mrtrvl uuendas ainet ..." 
       * "Kommentaar"
       * //aeg väikselt
       * 
       * 
       * END OF NOTIFICATIONS
       */

      const courseUpdates = await allNotificationsController.getCoursesUpdates(allCoursesActive, allTeachers);

      let courses;
      if (req.user && req.user.id) {
        courses = await allCoursesActiveWithComponentsData(allCoursesActive, req.user.id);
      } else courses = allCoursesActive;

      console.log('allCoursesActiveWithComponentsData1:', allCoursesActiveWithComponentsData);
      res.locals.allCoursesActive = allCoursesActiveWithComponentsData;

      return res.render('dashboard-student', {
        courses,
        user: req.user,
        teacherCourses: sortedCoursesGroupedByTeacher,
        teachers: allTeachers,
        courseUpdates,
      });
    }
    console.log('isTeacher is neither true/false');
    return false;
  },
  /**
   * for '/course/:courseSlug/:contentSlug?/:componentSlug?' route
   */
  getSpecificCourse: async (req, res, next) => {
    /**
     * Read parameters sent with endpoint
     */
    const {
      courseSlug, contentSlug, componentSlug,
    } = req.params;

    const {
      ref,
    } = req.query;

    if (!req.user.team.slug) return res.redirect('/notfound');

    const teamSlug = req.user.team.slug;

    const selectedVersion = req.session.selectedVersion || ref || null;
    res.locals.selectedVersion = selectedVersion;
    // const selectedVersion = req.session.selectedVersion || null;
    console.log('selectedVersion1:', selectedVersion);
    // res.locals.selectedVersion = selectedVersion;
    res.locals.teamSlug = teamSlug;

    /**
     * Get getMarkedAsDoneComponents data – this is array of UUID-s of components  that have been marked as done by the user
     */
    const markedAsDoneComponentsArr = await getMarkedAsDoneComponents(req.user.id, courseSlug);
    console.log ('markedAsDoneComponentsArr10:', markedAsDoneComponentsArr);
    res.locals.markedAsDoneComponentsArr = markedAsDoneComponentsArr;

    /**
     * Get all available courses
     */
    const start7 = performance.now();
    const allCourses = await getAllCoursesData(teamSlug, req);
    const end7 = performance.now();
    console.log(`Execution time allCourses: ${end7 - start7} ms`);

    const allCoursesActive = allCourses.filter((x) => x.courseIsActive);

    console.log('allCoursesActive2:', allCoursesActive);
    await allCoursesActive.sort((a, b) => a.courseName.localeCompare(b.courseName));

    /**
     * Get active course
     */
    const course = allCoursesActive.filter((x) => x.courseIsActive && x.courseSlug === courseSlug)[0];

    /**
     * If no course is found (none of the branches is active), but the course URL is still visited by the user, then redirect to /notfound page.
     */
    // console.log('course1:', course);
    if (!course) return res.redirect('/notfound');

    // console.log('course1:', course);
    res.locals.course = course;
    // console.log('course.courseSlugInGithub1:', course.courseSlugInGithub);

    const allTeachers = await teamsController.getUsersInTeam('teachers');
    console.log('allTeachers0:', allTeachers);

    res.locals.teachers = allTeachers;

    /**
     * Check if course Repo has a branch that matches user team's slug.
     * -- If yes, then all Github requests must refer to this branch. The App user must see data only from the branch that has a matching Team name. E.g. user in team "rif20" should only see course information from branch "rif20" for any course, if such branch exists.
     * -- If such branch doesn't exist, then read data from the master/main branch.
     */
    let refBranch;
    let activeBranches;

    try {
      activeBranches = await apiRequests.activeBranchesService(course.coursePathInGithub);
    } catch (error) {
      console.error(error);
    }

    /**
     * Check if selectedVersion has been given with endpoint
     * If yes, check if selectedVersion is part of course repo active branches.
     * - If yes, then read info from the matching branch.
     * If not, check if teamSlug is part of course repo active branches.
     * - If yes, then read info from the matching branch.
     * If not, read info from master branch.
     */
    console.log('courseSlug1:', courseSlug);
    console.log('contentSlug1:', contentSlug);
    console.log('componentSlug1:', componentSlug);
    console.log('ref1:', ref);
    console.log('req.user.team.slug1:', req.user.team.slug);
    console.log('selectedVersion4:', selectedVersion);
    console.log('activeBranches4:', activeBranches);
    console.log('teamSlug:4', teamSlug);

    /**
     * ÕIGETE KURSUSE VERSIOONIDE NÄITAMISE LOOGIKA:
     * 1. Kui on antud selectedVersion ja kursuse aktiivsete branchide all on sama nimega branch, siis loe infot sellest branchist
     * 2. Kui on antud selectedVersion, ja kursuse aktiivsete branchide all EI OLE sama nimega branchi, siis suuna /notfound lehele. St, et kasutaja püüdis URLi ligi pääseda kursusele versioonile, mis ei ole aktiivne.
     * 3. Kui pole antud selectedVersion, siis vaata, kas kursuse aktiivsete branchide all on kasutaja tiiminimega sama branch. Kui jah, siis loe infot sellest branchist
     * 4. Kui pole antud selectedVersion, ja kui kursuse aktiivsete branchide all EI OLE kasutaja tiiminimega sama nimega branchi, siis pead kontrollima, kas kasutaja on äkki 'teachers' tiimis (NB! ('teachers') tiimil pole enda nimega branche).
     * -- 4a. Kui kasutaja ON 'teachers' tiimis, siis sa pead leidma aktiivsete branchide alt esimese kursuse, mille teacherUsername on kasutaja username. Kui kursusel nii master kui ka rif20 branchid aktiivsed, aga masteri teacher on muu kasutaja, siis peab sisseloginud kasutajale kuvama rif20 branchi, kus tema on määratud õpetaja. St, tagasta kursuse esimene aktiivne branch, mille lingitud õpetaja on sisseloginud õpetaja.
     * -- 4b. Kui kasutaja ON 'teachers' tiimis, ja kui aktiivsete branchide all pole ühtegi versioon, mille teacherUsername on sisseloginud kasutaja, siis tagasta kursuse esimene aktiivne branch.
     * -- 4c. Kui kursuse all pole ühtegi aktiivset branchi, suuna "/notfound" lehele.
     * 5. Kui kasutaja EI OLE 'teachers' tiimis, aga kui aktiivsete branchide all on mõni versioon, siis tagasta esimene aktiivne versioon.
     * 6. Kui kasutaja EI OLE 'teachers' tiimis, pole antud selectedVersion ja kasutaja tiim pole activeBranches hulgas, siis suuna "/notfound" lehele.
     */

    // 1.
    if (selectedVersion && activeBranches.includes(selectedVersion)) {
      refBranch = selectedVersion;
    // 2.
    } else if (selectedVersion && !activeBranches.includes(selectedVersion)) {
      return res.redirect('/notfound');
    // 3.
    } else if (!selectedVersion && activeBranches.includes(teamSlug)) {
      refBranch = teamSlug;
    // 4.
    } else if (!selectedVersion && !activeBranches.includes(teamSlug)) {
      const activeBranchConfigPromises = activeBranches.map(async (branch) => {
        const config = await getConfig(course.coursePathInGithub, branch);
        return config;
      });
      const activeBranchConfigs = await Promise.all(activeBranchConfigPromises);
      // console.log('activeBranchConfigs1:', activeBranchConfigs);

      if (allTeachers.find((teacher) => teacher.login === req.user.username)) {
        const correctBranchIndex = activeBranchConfigs.findIndex((config) => config.teacherUsername === req.user.username);
        // console.log('activeBranchConfigs1:', activeBranchConfigs1);
        // console.log('correctBranchIndex1:', correctBranchIndex);

        // 4a.
        if (correctBranchIndex > -1) {
          refBranch = activeBranches[correctBranchIndex];
        // 4b.
        } else if (correctBranchIndex <= -1 && activeBranches.length >= 0) {
          refBranch = activeBranches[0];
        // 4c.
        } return res.redirect('/notfound');
      }
      // 5.
      if (activeBranches.length >= 0) {
        const firstActiveBranchIndex = activeBranchConfigs.findIndex((config) => config.active === true);
        refBranch = activeBranches[firstActiveBranchIndex];
      }
    // 6.
    } else return res.redirect('/notfound');

    // console.log('refBranch3:', refBranch);

    /**
     * Save refBranch to res.locals. This is used by coursesService.js file.
     */
    res.locals.refBranch = refBranch;
    res.locals.branches = activeBranches;

    // console.log('cache.has(routePath)1:', cache.has(routePath));
    // console.log('cache.get(routePath)1:', cache.get(routePath));

    let config;

    // console.log('course.coursePathInGithub3:', course.coursePathInGithub);
    // console.log('refBranch3:', refBranch);
    try {
      config = await getConfig(course.coursePathInGithub, refBranch);
    } catch (error) {
      /**
       * If config file is not returned with course.coursePathInGithub, the coursePathInGithub is invalid.
       * Redirect to /notfound page
       */
      console.log('no config found');
      return res.redirect('/notfound');
    }

    console.log(`reading content data for ${course.coursePathInGithub} from ${refBranch} branch`);

    // console.log('config2:', config);
    // console.log('config.lessons2:', config.lessons);

    res.locals.course = course;
    res.locals.config = config;
    res.locals.allCourses = allCoursesActive;

    const { backAndForwardPaths, markAsDonePaths } = setCourseButtonPaths(config);
    // console.log('backAndForwardPaths4:', backAndForwardPaths);
    // console.log('markAsDonePaths4:', markAsDonePaths);
    res.locals.backAndForwardPaths = backAndForwardPaths;
    res.locals.markAsDonePaths = markAsDonePaths;

    // console.log('res.locals.allCourses1:', res.locals.allCourses);

    /**
     * Find from multiple object arrays
     * For contentSlug, find slug from docs, additionalMaterials, lessons, lessons additionalMaterials
     * For componentSlug, find slug from concepts, practices
     * If exists, add to breadcrumbNames and path
     */

    /**
     * Collect docs arrays from config under one object array.
     */
    let docsArray = config.docs.concat(config.additionalMaterials, config.lessons);
    config.lessons.forEach((x) => {
      docsArray = docsArray.concat(x.additionalMaterials);
    });
    /**
     * Then check for matching slug from docs object array.
     * If a match, get the respective contentName.
     */
    let contentName;
    let githubRequest;

    /**
   * Sisulehe content ja componenti UUID lugemine config failist, andmebaasis sisulehe märkimiseks
   */
    let contentUUID;
    let componentUUID;

    config.docs.forEach((x) => {
      if (x.slug === contentSlug) {
        contentName = x.name;
        githubRequest = 'docsService';
        // console.log('githubRequest3:', githubRequest);
        // console.log('Slug found in config.docs');
      }
    });
    config.additionalMaterials.forEach((x) => {
      if (x.slug === contentSlug) {
        contentName = x.name;
        githubRequest = 'courseAdditionalMaterialsService';
        // console.log('Slug found in config.additionalMaterials');
      }
    });
    config.lessons.forEach((x) => {
      if (x.slug === contentSlug) {
        contentName = x.name;
        contentUUID = x.uuid;
        githubRequest = 'lessonsService';
        // console.log('Slug found in config.lessons');
      }
    });

    /**
     * Check for matching slug from concepts, practices and lessons additionaMaterials arrays.
     * If a match, get the componentName and set componentType.
     */
    let componentName;
    let componentType;

    config.concepts.forEach((x) => {
      if (x.slug === componentSlug) {
        const lesson = config.lessons.find((les) => les.components.includes(componentSlug));
        // console.log('lesson1:', lesson);

        if (lesson && lesson.slug === contentSlug) {
          componentName = x.name;
          componentUUID = x.uuid;
          componentType = 'concept';
          githubRequest = 'lessonComponentsService';
          // console.log('Slug found in config.concepts');
        }
      }
    });
    config.practices.forEach((x) => {
      if (x.slug === componentSlug) {
        const lesson = config.lessons.find((les) => les.components.includes(componentSlug));
        // console.log('lesson1:', lesson);

        if (lesson && lesson.slug === contentSlug) {
          componentName = x.name;
          componentUUID = x.uuid;
          componentType = 'practice';
          githubRequest = 'lessonComponentsService';
          // console.log('Slug found in config.concepts');
        }
      }
    });
    config.lessons.forEach((x) => {
      if (x.additionalMaterials[0].slug === componentSlug && x.slug === contentSlug) {
        componentName = x.additionalMaterials[0].name;
        componentType = 'docs';
        githubRequest = 'lessonAdditionalMaterialsService';
        // console.log('Slug found in config.lessons.additionalMaterials');
      }
    });

    /**
     * You can check values:
     *
    */
    console.log('courseSlug1:', courseSlug);
    console.log('course.courseName1:', course.courseName);
    console.log('contentSlug1:', contentSlug);
    console.log('contentName1:', contentName);
    console.log('contentUUID1:', contentUUID);
    console.log('componentSlug1:', componentSlug);
    console.log('componentName1:', componentName);
    console.log('componentUUID1:', componentUUID);
    console.log('githubRequest1:', githubRequest);

    /**
     * IF contentSlug exists, but contentName is not returned
     * OR if contentSlug, contentName and componentSlug exist, but componentName is not returned
     * THEN either of the slug is invalid and does not exist in config file!
     * AND Redirect back to homepage.
     */
    if ((contentSlug && !contentName)
    || (contentSlug && contentName && componentSlug && !componentName)) {
      console.log('no contentName or componentName found');
      return res.redirect('/notfound');
    }

    /**
     * Function to set correct fullPath, depending on if componentSlug and/or contentSlug exist.
     * This defines correct fullPath, depeonding how deep into subpages you are.
     */
    function getFullPath() {
      if (componentSlug) {
        return `${contentSlug}/${componentSlug}`;
      }
      if (contentSlug) {
        return `${contentSlug}`;
      }
      return undefined;
    }

    /**
     * Function to set correct componentType, depending on if componentSlug and/or contentSlug exist.
     * This defines correct componentType, depeonding how deep into subpages you are.
     */
    function getType() {
      if (componentSlug) {
        return componentType;
      }
      if (contentSlug) {
        return 'docs';
      }
      return undefined;
    }

    /**
     * Save page names for breadcrumb
     */
    const breadcrumbNames = {
      courseName: course.courseName,
      contentName,
      componentName,
    };
    /**
     * Save page slugs, fullPath and page type for address, menu icons, for most following BE logic tbh
     */
    const path = {
      courseSlug,
      contentSlug,
      componentSlug,
      refBranch,
      contentUUID,
      componentUUID,
      fullPath: getFullPath(contentSlug, componentSlug),
      type: getType(contentSlug, componentSlug),
    };

    res.locals.githubRequest = githubRequest;
    res.locals.coursePathInGithub = course.coursePathInGithub;
    res.locals.breadcrumbNames = breadcrumbNames;
    res.locals.path = path;

    // console.log('res.locals1:', res.locals);
    return next();
  },
  // renderAllCoursesPage: async(req, res) => {
  // }

};

export {
  allCoursesController, responseAction, renderPage,
};
