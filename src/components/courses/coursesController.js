/* eslint-disable max-len */
/* eslint-disable no-undef */
import 'core-js/actual/array/group-by.js';

import { performance } from 'perf_hooks';
import { base64, utf8, markdown } from '../../setup/setupMarkdown.js';

// Enable in-memory cache
import getAllCoursesData from '../../functions/getAllCoursesData.js';

import getConfig from '../../functions/getConfigFuncs.js';
import { function1 } from '../../functions/imgFunctions.js';
import { returnPreviousPage, returnNextPage, setCourseButtonPaths } from '../../functions/navButtonFunctions.js';
import apiRequests from './coursesService.js';
import teamsController from '../teams/teamsController.js';
import allNotificationsController from '../notifications/notificationsController.js';
import getMarkedAsDoneComponents from '../../functions/getListOfDoneComponentUUIDs.js';

/** responseAction function defines what to do after info about courses and current course page is received.
 * This step gets the data from Github, by doing Axios requests via apiRequests[githubRequest] statement.
 * Responses are saved into components, files, sources parts in res.locals, respectively.
 * After the responseAction() function, the renderPage() function is run which renders the page on frontend.
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

  const { components, files, sources } = apiResponse;
  // console.log('components1:', components);
  // console.log('files1:', files);
  // console.log('sources1:', sources);

  res.locals.resComponents = components;
  res.locals.resFiles = files;
  res.locals.resSources = sources;

  /** If Github API responds with no data for components, sources or files, then save those as empty to res.locals + render an empty page.
   * Github API responds with no data if there's inconsistency in the course repo files or folder. E.g. if the config file refers to a folder with lowercase ("arvuti"), but the folder name in Github is actually camelcase ("Arvuti"). This is inconsistent and Github API does not respond with data if the folder name is sent incorrectly with the API request.
   * We require the teacher to write all folder names lowercase.
   * There's no good way to validate that folder names are all in lowercase, and if not, then change to lowercase from Github's side.
   */
  if (!components) res.locals.resComponents = { data: { content: '' } };
  if (!sources) res.locals.resSources = { data: { content: '' } };
  if (!files) res.locals.resFiles = [];

  return next();
};

/**
 * Last step to render page now that we have resComponents, resFiles and resSources values from Github via Axios.
 * We have everything needed to render the page.
 * This function also makes sure everything out the markdown content is correctly parsed and passed to FE.
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

  // console.log('req.user55:', req.user);

  // console.log('resComponents in responseAction:', resComponents);
  // console.log('resFiles in responseAction:', resComponents);

  /** Sisulehe sisu lugemine */
  const resComponentsContent = resComponents.data.content;
  const componentDecoded = base64.decode(resComponentsContent);
  const componentDecodedUtf8 = utf8.decode(componentDecoded);

  /**  Sisulehe piltide kuvamine
   * - functions: https://stackoverflow.com/a/58542933
   * - changing img src: https://www.npmjs.com/package/modify-image-url-md?activeTab=explore
   */
  const start1 = performance.now();
  const markdownWithModifiedImgSources = await function1(coursePathInGithub, path, componentDecodedUtf8, refBranch);
  const end1 = performance.now();
  console.log(`Execution time markdownWithModifiedImgSources: ${end1 - start1} ms`);

  /** Add Table of Contents markdown element to Markdown before rendering Markdown */
  const markdownWithModifiedImgSourcesToc = markdownWithModifiedImgSources.concat('\n\n ${toc} \n');
  // console.log('markdownWithModifiedImgSourcesToc:', markdownWithModifiedImgSourcesToc);

  /** Render Markdown */
  const start2 = performance.now();
  const componentMarkdown = await markdown.render(markdownWithModifiedImgSourcesToc);
  const end2 = performance.now();
  console.log(`Execution time componentMarkdown: ${end2 - start2} ms`);
  // console.log('componentMarkdown:', componentMarkdown);

  /** Select html from rendered Markdown, but exclude Table of Contents */
  const componentMarkdownWithoutTOC = componentMarkdown.substring(0, componentMarkdown.indexOf('<nav class="table-of-contents-from-markdown-123">'));

  /** Select Table of Contents from rendered Markdown, but exclude preceding html. */
  function getStringBetween(str, start, end) {
    const result = str.match(new RegExp(`${start}(.*)${end}`));
    return result[1];
  }
  const componentMarkdownOnlyTOCWithoutNav = getStringBetween(componentMarkdown, '<nav class="table-of-contents-from-markdown-123">', '</nav>');
  const componentMarkdownOnlyTOC = `<nav class="table-of-contents">${componentMarkdownOnlyTOCWithoutNav}</nav>`;

  /** You now have stored the markdown content in two variables:
   * componentMarkdownWithoutTOC
   * componentMarkdownOnlyTOC
   */
  // console.log('componentMarkdownWithoutTOC:', componentMarkdownWithoutTOC);
  // console.log('componentMarkdownOnlyTOC:', componentMarkdownOnlyTOC);

  /** Each sisuleht (concepts, practices) has a sources reference which is stored in sources.json file in Github. */
  // define sources as NULL by default.
  let sourcesJSON = null;

  // NB! Sources are sent only with "Teemade endpointid" axios call. If sourcesJSON stays NULL (is false), then content.handlebars does not display "Allikad" div. If sourcesJSON gets filled (is true), then "Allikad" div is displayed.
  if (resSources
    && resSources.data
    && resSources.data.content
    && resSources.data.content !== '') {
    const sources = resSources.data;
    const sourcesDecoded = base64.decode(sources.content);
    const sourcesDecodedUtf8 = utf8.decode(sourcesDecoded);
    // console.log('sourcesDecodedUtf8:', sourcesDecodedUtf8);
    if (sourcesDecodedUtf8) sourcesJSON = JSON.parse(sourcesDecodedUtf8);
  }

  /** Finally you can render the course view with all correct information you've collected from Github, and with all correctly rendered Markdown content! */

  // console.log('branches1:', branches);
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

const allCoursesController = {

  /** For '/dashboard' route: */
  getAllCourses: async (req, res) => {
    let teamSlug;
    if (req.user && req.user.team) teamSlug = req.user.team.slug;
    /**
     * Check if teamSlug is 'teachers'
     * If yes, then get all courses for teacher
     * If not, then get all courses for student
     */
    let isTeacher = false;
    if (teamSlug === 'teachers') isTeacher = true;
    res.locals.teamSlug = teamSlug;

    const start3 = performance.now();
    const allCourses = await getAllCoursesData(teamSlug, req);
    const end3 = performance.now();
    console.log(`Execution time getAllCoursesData: ${end3 - start3} ms`);
    // console.log('allCourses5:', allCourses);
    const allCoursesActive = allCourses.filter((x) => x.courseIsActive);
    // console.log('allCoursesActive5:', allCoursesActive);

    /** Save all teachers in a variable, needed for rendering */
    const start4 = performance.now();
    const allTeachers = await teamsController.getUsersInTeam('teachers');
    const end4 = performance.now();
    console.log(`Execution time allTeachers: ${end4 - start4} ms`);

    res.locals.allCoursesActive = allCoursesActive;
    res.locals.allTeacher = allTeachers;

    /* By default, courses are displayed on dashboard by their name. Set coursesDisplayBy to 'name'
    * If coursesDisplayBy is provided, use this instead - courses are then displayed on dashboard by Name, Progress or Semester.
    * Save coursesDisplayBy to req.session, so dashboard would be loaded with last visited coursesDisplayBy.
    */
    // console.log('req.session.coursesDisplayBy1:', req.session.coursesDisplayBy);
    // console.log('req.query.coursesDisplayBy1:', req.query.coursesDisplayBy);
    let coursesDisplayBy = req.session.coursesDisplayBy || 'name';

    /** For INVALID coursesDisplayBy parameters, OR if teacher tries to load courses by Progress, redirect back to /dashboard page.
     * coursesDisplayBy is defaulted to 'name'  */
    if ((req.query.coursesDisplayBy
      && req.query.coursesDisplayBy !== 'name'
      && req.query.coursesDisplayBy !== 'progress'
      && req.query.coursesDisplayBy !== 'semester')
      || (req.user && req.user.team
        // NB! 'teachers' team doesn't have progress bars on courses, so they can't load courses by Progress:
        && req.user.team.slug === 'teachers'
        && req.query.coursesDisplayBy
        && req.query.coursesDisplayBy === 'progress')) return res.redirect('/dashboard');

    /** For VALID coursesDisplayBy parameters, save req.session.coursesDisplayBy to the given coursesDisplayBy. On Dashboard, courses will be successfully displayed by either Name, Progress or Semester. */
    if (req.query.coursesDisplayBy && (
      req.query.coursesDisplayBy === 'name'
      || req.query.coursesDisplayBy === 'semester'
      // 'teachers' team doesn't have Progress bars on courses, so check that user's team is NOT 'teachers:
      || (req.query.coursesDisplayBy === 'progress' && req.user.team.slug !== 'teachers'))) {
      coursesDisplayBy = req.query.coursesDisplayBy;
      req.session.coursesDisplayBy = req.query.coursesDisplayBy;
    }
    res.locals.coursesDisplayBy = coursesDisplayBy;

    /** Following describes different DASHBOARD logics for TEACHER, based on given coursesDisplayBy */
    if (isTeacher) {
      /*
      * Filter allCoursesActive where the teacher is logged in user
      */
      const allTeacherCourses = allCoursesActive
        .filter((course) => course.teacherUsername === req.user.username);
      // console.log('allTeacherCourses1:', allTeacherCourses);

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
      // console.log('allCoursesGroupedByTeacher2:', allCoursesGroupedByTeacher);

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

      /**
      * Get last 7 day notifications for active courses, needed for dashboard
       */
      const { courseUpdates7Days } = await allNotificationsController.getCoursesUpdates(allCoursesActive, allTeachers);

      /** Rendering teacher's dashboard if courses are displayed by Name */
      if (coursesDisplayBy === 'name') {
        return res.render('dashboard-teacher', {
          coursesDisplayBy,
          courses: allTeacherCourses,
          user: req.user,
          teacherCourses: sortedCoursesGroupedByTeacher,
          teachers: allTeachers,
          courseUpdates7Days,
        });
      }
      /** Rendering teacher's dashboard if courses are displayed by Semester */
      if (coursesDisplayBy === 'semester') {
        const allCoursesGroupedBySemester = allTeacherCourses
          .groupBy(({ courseSemester }) => courseSemester);
        // console.log('allCoursesGroupedByTeacher1:', allCoursesGroupedByTeacher);
        const sortedCoursesGroupedBySemester = Object.keys(allCoursesGroupedBySemester)
          .sort((a, b) => {
            // Extract the year and first letter of each element
            const yearA = a.slice(1);
            const yearB = b.slice(1);
            const letterA = a[0];
            const letterB = b[0];
            // Compare the years first
            if (yearA !== yearB) {
              return yearB - yearA;
            }
            // If the years are the same, compare the first letter
            return letterB.localeCompare(letterA);
          })
          .reduce((acc, semester) => {
            acc[semester] = allCoursesGroupedBySemester[semester].sort((a, b) => a.courseName.localeCompare(b.courseName));
            return acc;
          }, {});

        const seasons = {
          K: 'Kevad',
          S: 'Sügis',
        };
        const sortedCoursesGroupedBySemesterWithFullNames = {};

        Object.keys(sortedCoursesGroupedBySemester).forEach((semester) => {
          if (Object.prototype.hasOwnProperty.call(sortedCoursesGroupedBySemester, semester)) {
            const season = semester.substring(0, 1);
            const year = semester.substring(1);
            sortedCoursesGroupedBySemesterWithFullNames[`${seasons[season]} ${year}`] = sortedCoursesGroupedBySemester[semester];
          }
        });
        // console.log('sortedCoursesGroupedBySemesterWithFullNames1:', sortedCoursesGroupedBySemesterWithFullNames);

        return res.render('dashboard-teacher', {
          coursesDisplayBy,
          courses: sortedCoursesGroupedBySemesterWithFullNames,
          user: req.user,
          teacherCourses: sortedCoursesGroupedByTeacher,
          teachers: allTeachers,
          courseUpdates7Days,
        });
      }
    }

    /** Following describes different DASHBOARD logics for STUDENT, based on given coursesDisplayBy */
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
      * Get last 7 day notifications for active courses, needed for dashboard
       */
      const { courseUpdates7Days } = await allNotificationsController.getCoursesUpdates(allCoursesActive, allTeachers);

      /** Next, you must get all active courses WITH the list of components that have been markedAsDone. Use the allCoursesController.allCoursesActiveWithComponentsData() function that store those courses. */
      let courses;
      if (req.user && req.user.id) {
        courses = await allCoursesController.allCoursesActiveWithComponentsData(allCoursesActive, req.user.id);
      } else courses = allCoursesActive;

      // console.log('courses55:', courses);
      res.locals.allCoursesActive = courses;

      // console.log('coursesDisplayBy1:', coursesDisplayBy);

      /** Test entries for student: */
      /* courses[0].markedAsDoneComponentsUUIDs.push('9f953cdc-4d0d-4700-b5d0-90857cc039b9');
      courses[1].markedAsDoneComponentsUUIDs.push('73deac36-adf9-4205-9e69-dba0bc7976f1');
      courses[1].markedAsDoneComponentsUUIDs.push('188625d2-e039-4ea7-9737-2d4396820ec1');
      courses[1].markedAsDoneComponentsUUIDs.push('c6a0a770-7f11-425d-a748-f0a9fe13f89e');
      // courses[2].markedAsDoneComponentsUUIDs.push('8425abdd-9690-4bab-92b6-1c6feb5aead9');
      // courses[2].markedAsDoneComponentsUUIDs.push('138e043e-9aab-4400-85c8-d72d242f670b');
      // courses[2].markedAsDoneComponentsUUIDs.push('f24f3ffb-199d-4b78-aa00-dce4992f18d9');
      courses[4].markedAsDoneComponentsUUIDs.push('1bca8c63-7637-4a6f-844d-c0a231cbd397');
      courses[3].markedAsDoneComponentsUUIDs.push('fbbbf667-ec8b-4287-baad-6975b917f505');
      courses[3].markedAsDoneComponentsUUIDs.push('ea8b329e-1585-4d13-abcb-60d2c01a4da3');
      courses[3].markedAsDoneComponentsUUIDs.push('9e552ecd-728c-4556-91e9-d42611393dbe');
      courses[3].markedAsDoneComponentsUUIDs.push('750a3a40-6f2e-4575-b684-79608403642c'); */

      /** Rendering student's dashboard if courses are displayed by Name */
      if (coursesDisplayBy === 'name') {
        return res.render('dashboard-student', {
          coursesDisplayBy,
          courses,
          user: req.user,
          teacherCourses: sortedCoursesGroupedByTeacher,
          teachers: allTeachers,
          courseUpdates7Days,
        });
      }
      /** Rendering student's dashboard if courses are displayed by Progress */
      if (coursesDisplayBy === 'progress') {
        /**
         * Sort courses by the % of elements in markedAsDoneComponentsUUIDs that are included in the courseBranchComponentsUUIDs array. A'ka the precentage of markedAsDone components.
         * If two elements have the same %, these elements are sorted by courseName
         */
        courses.sort((a, b) => {
          const aLength = a.courseBranchComponentsUUIDs.length;
          const bLength = b.courseBranchComponentsUUIDs.length;
          const aDoneLength = a.markedAsDoneComponentsUUIDs.filter((uuid) => a.courseBranchComponentsUUIDs.includes(uuid)).length;
          const bDoneLength = b.markedAsDoneComponentsUUIDs.filter((uuid) => b.courseBranchComponentsUUIDs.includes(uuid)).length;
          const aPercentage = aLength > 0 ? aDoneLength / aLength : 0;
          const bPercentage = bLength > 0 ? bDoneLength / bLength : 0;

          if (aPercentage === bPercentage) {
            return a.courseName.localeCompare(b.courseName);
          }
          if (aPercentage === 0) {
            return -1;
          }
          if (bPercentage === 0) {
            return 1;
          }
          return aPercentage - bPercentage;
        });
        // console.log('courses2:', courses);

        return res.render('dashboard-student', {
          coursesDisplayBy,
          courses,
          user: req.user,
          teacherCourses: sortedCoursesGroupedByTeacher,
          teachers: allTeachers,
          courseUpdates7Days,
        });
      }
      /** Rendering student's dashboard if courses are displayed by Semester */
      if (coursesDisplayBy === 'semester') {
        const allCoursesGroupedBySemester = courses
          .groupBy(({ courseSemester }) => courseSemester);
        // console.log('allCoursesGroupedByTeacher1:', allCoursesGroupedByTeacher);
        const sortedCoursesGroupedBySemester = Object.keys(allCoursesGroupedBySemester)
          .sort((a, b) => {
            // Extract the year and first letter of each element
            const yearA = a.slice(1);
            const yearB = b.slice(1);
            const letterA = a[0];
            const letterB = b[0];
            // Compare the years first
            if (yearA !== yearB) {
              return yearB - yearA;
            }
            // If the years are the same, compare the first letter
            return letterB.localeCompare(letterA);
          })
          .reduce((acc, semester) => {
            acc[semester] = allCoursesGroupedBySemester[semester].sort((a, b) => a.courseName.localeCompare(b.courseName));
            return acc;
          }, {});

        const seasons = {
          K: 'Kevad',
          S: 'Sügis',
        };
        const sortedCoursesGroupedBySemesterWithFullNames = {};

        Object.keys(sortedCoursesGroupedBySemester).forEach((semester) => {
          if (Object.prototype.hasOwnProperty.call(sortedCoursesGroupedBySemester, semester)) {
            const season = semester.substring(0, 1);
            const year = semester.substring(1);
            sortedCoursesGroupedBySemesterWithFullNames[`${seasons[season]} ${year}`] = sortedCoursesGroupedBySemester[semester];
          }
        });
        // console.log('sortedCoursesGroupedBySemesterWithFullNames1:', sortedCoursesGroupedBySemesterWithFullNames);

        return res.render('dashboard-student', {
          coursesDisplayBy,
          courses: sortedCoursesGroupedBySemesterWithFullNames,
          user: req.user,
          teacherCourses: sortedCoursesGroupedByTeacher,
          teachers: allTeachers,
          courseUpdates7Days,
        });
      }
    }

    /** If isTeacher is somehow neither true/false, redirect back to /dashboard. */
    console.log('isTeacher is neither true/false');
    return res.redirect('/dashboard');
  },
  /** For '/course/:courseSlug/:contentSlug?/:componentSlug?' route */
  getSpecificCourse: async (req, res, next) => {
    /** Read parameters sent with endpoint */
    const {
      courseSlug, contentSlug, componentSlug,
    } = req.params;

    const {
      ref,
    } = req.query;

    /** If user's team is not found, route to /notfound. Only users with valid team are allowed to see course content. This is checked with app.js. */
    if (!req.user.team.slug) return res.redirect('/notfound');

    const teamSlug = req.user.team.slug;
    res.locals.teamSlug = teamSlug;

    /** selectedVersion variable refers to either:
     * - teacher's selected version on a course page
     * - manually entered ref= value in URL.
     * selectedVersion variable is used down below to get correct course version from Github.
     */
    const selectedVersion = req.session.selectedVersion || ref || null;
    res.locals.selectedVersion = selectedVersion;
    // console.log('selectedVersion1:', selectedVersion);

    /**
     * Get array of component UUID-s that have been marked as done by the user. This array is stored in MariaDB.
     */
    const markedAsDoneComponentsArr = await getMarkedAsDoneComponents(req.user.id, courseSlug);
    // console.log('markedAsDoneComponentsArr10:', markedAsDoneComponentsArr);
    res.locals.markedAsDoneComponentsArr = markedAsDoneComponentsArr;

    /** Get all available courses for the user. */
    const start7 = performance.now();
    const allCourses = await getAllCoursesData(teamSlug, req);
    const end7 = performance.now();
    console.log(`Execution time allCourses: ${end7 - start7} ms`);

    const allCoursesActive = allCourses.filter((x) => x.courseIsActive);
    await allCoursesActive.sort((a, b) => a.courseName.localeCompare(b.courseName));
    // console.log('allCoursesActive2:', allCoursesActive);

    /** Get the selected course that was accessed with current endpoint  */
    const course = allCoursesActive.filter((x) => x.courseIsActive && x.courseSlug === courseSlug)[0];

    /** If no course is found (meaning that the courseSlug doesn't match any courses in Github OR none of the course branches in Github are active), then user tried to manually access an invalid course page. Redirect to /notfound page.
     */
    // console.log('course1:', course);
    if (!course) return res.redirect('/notfound');

    res.locals.course = course;

    /** Get all teachers */
    const allTeachers = await teamsController.getUsersInTeam('teachers');
    // console.log('allTeachers0:', allTeachers);
    res.locals.teachers = allTeachers;

    /** Check if course Repo has a branch that matches user team's slug.
     * -- If yes, then all Github requests must refer to this branch. In the app, STUDENT must see data only from the branch that has a matching Team name. E.g. student in team "rif20" should only see course information from branch "rif20" for any course, if such branch exists.
     * -- If such branch doesn't exist, then STUDENT should see data from master/main branch.
     * For TEACHERS, the logic is explained on following rows.
     */

    /** refBranch variable refers to the repo branch where course data must be read. refBranch is defined on following rows. */
    let refBranch;
    let validBranches;

    /** Get all course branches that have config as active:true */
    try {
      validBranches = await apiRequests.validBranchesService(course.coursePathInGithub);
    } catch (error) {
      console.error(error);
    }

    /* console.log('courseSlug1:', courseSlug);
    console.log('contentSlug1:', contentSlug);
    console.log('componentSlug1:', componentSlug);
    console.log('ref1:', ref);
    console.log('req.user.team.slug1:', req.user.team.slug);
    console.log('selectedVersion4:', selectedVersion);
    console.log('validBranches4:', validBranches);
    console.log('teamSlug:4', teamSlug); */

    /**
     * KURSUSE ÕIGE VERSIOONI NÄITAMISE LOOGIKA:
     * 1. Kui on antud selectedVersion ja kursuse aktiivsete branchide all on sama nimega branch, siis loe infot sellest branchist
     * 2. Kui on antud selectedVersion, ja kursuse aktiivsete branchide all EI OLE sama nimega branchi, siis suuna /notfound lehele. St, et kasutaja püüdis URLi ligi pääseda kursusele versioonile, mis ei ole aktiivne.
     * 3. Kui pole antud selectedVersion, siis vaata, kas kursuse aktiivsete branchide all on kasutaja tiiminimega sama branch. Kui jah, siis loe infot sellest branchist
     * 4. Kui pole antud selectedVersion, ja kui kursuse aktiivsete branchide all EI OLE kasutaja tiiminimega sama nimega branchi, siis pead kontrollima, kas kasutaja on äkki 'teachers' tiimis (NB! ('teachers') tiimil pole enda nimega branche).
     * -- 4a. Kui kasutaja ON 'teachers' tiimis, siis sa pead leidma aktiivsete branchide alt esimese kursuse, mille teacherUsername on kasutaja username. Kui kursusel nii master kui ka rif20 branchid aktiivsed, aga masteri teacher on muu kasutaja, siis peab sisseloginud kasutajale kuvama rif20 branchi, kus tema on määratud õpetaja. St, tagasta kursuse esimene aktiivne branch, mille lingitud õpetaja on sisseloginud õpetaja.
     * -- 4b. Kui kasutaja ON 'teachers' tiimis, ja kui aktiivsete branchide all pole ühtegi versioon, mille teacherUsername on sisseloginud kasutaja, siis tagasta kursuse esimene aktiivne branch.
     * -- 4c. Kui kursuse all pole ühtegi aktiivset branchi, suuna "/notfound" lehele.
     * 5. Kui kasutaja EI OLE 'teachers' tiimis, aga kui aktiivsete branchide all on mõni versioon, siis tagasta esimene aktiivne versioon.
     * 6. Kui kasutaja EI OLE 'teachers' tiimis, pole antud selectedVersion ja kasutaja tiim pole validBranches hulgas, siis suuna "/notfound" lehele.
     */

    // 1.
    if (selectedVersion && validBranches.includes(selectedVersion)) {
      refBranch = selectedVersion;
    // 2.
    } else if (selectedVersion && !validBranches.includes(selectedVersion)) {
      return res.redirect('/notfound');
    // 3.
    } else if (!selectedVersion && validBranches.includes(teamSlug)) {
      refBranch = teamSlug;
    // 4.
    } else if (!selectedVersion && !validBranches.includes(teamSlug)) {
      const validBranchConfigPromises = validBranches.map(async (branch) => {
        const config = await getConfig(course.coursePathInGithub, branch);
        return config;
      });
      const validBranchConfigs = await Promise.all(validBranchConfigPromises);
      console.log('validBranchConfigs1:', validBranchConfigs);

      if (allTeachers.find((teacher) => teacher.login === req.user.username)) {
        const correctBranchIndex = validBranchConfigs.findIndex((config) => config.teacherUsername === req.user.username);
        // console.log('validBranchConfigs1:', validBranchConfigs1);
        // console.log('correctBranchIndex1:', correctBranchIndex);

        // 4a.
        if (correctBranchIndex > -1) {
          refBranch = validBranches[correctBranchIndex];
        // 4b.
        } else if (correctBranchIndex <= -1 && validBranches.length >= 0) {
          refBranch = validBranches[0];
        // 4c.
        } return res.redirect('/notfound');
      }
      // 5.
      if (validBranches.length >= 0) {
        const firstActiveBranchIndex = validBranchConfigs.findIndex((config) => config.active === true);
        refBranch = validBranches[firstActiveBranchIndex];
      }
    // 6.
    } else return res.redirect('/notfound');

    // console.log('refBranch3:', refBranch);

    /**
     * Save refBranch to res.locals. This is used by coursesService.js file.
     */
    res.locals.refBranch = refBranch;
    res.locals.branches = validBranches;

    // console.log('cache.has(routePath)1:', cache.has(routePath));
    // console.log('cache.get(routePath)1:', cache.get(routePath));

    /** Get config file for given course and its correct refBranch */
    let config;

    try {
      config = await getConfig(course.coursePathInGithub, refBranch);
    } catch (error) {
      /**
       * If config file is not returned with course.coursePathInGithub, the coursePathInGithub is invalid. User tried to access an invalid URL.
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

    /** Get arrays of components where Back and Forward buttons must be displayed.
     * Get arrays of components where "Märgi loetuks" options must be displayed. */
    const { backAndForwardPaths, markAsDonePaths } = setCourseButtonPaths(config);
    // console.log('backAndForwardPaths4:', backAndForwardPaths);
    // console.log('markAsDonePaths4:', markAsDonePaths);
    res.locals.backAndForwardPaths = backAndForwardPaths;
    res.locals.markAsDonePaths = markAsDonePaths;

    /** Following code works directly on the config file that was received.
     * It uses parameters given with current endpoint (courseSlug, contentSlug, componentSlug) and finds matching elements from the config file.
     * Once matching element is found from the config file, it makes a request to Github to pull this information with Github API.
     */

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
     * If a match, get the componentName, componentUUID and set componentType.
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

    /** You can check all relevant values about current endpoint:
    */
    /* console.log('courseSlug1:', courseSlug);
    console.log('course.courseName1:', course.courseName);
    console.log('contentSlug1:', contentSlug);
    console.log('contentName1:', contentName);
    console.log('contentUUID1:', contentUUID);
    console.log('componentSlug1:', componentSlug);
    console.log('componentName1:', componentName);
    console.log('componentUUID1:', componentUUID);
    console.log('githubRequest1:', githubRequest); */

    /**
     * IF contentSlug exists, but contentName is NOT returned from config file.
     * OR if contentSlug, contentName and componentSlug exist, but componentName is NOT returned from config file.
     * THEN
     * - a) user accessed an URL that does not match with the config file.
     * - b) config file has inconsistencies (lesson components do not match with concepts or practices arrays).
     * Config file MUST BE checked for any inconsistencies.
     * Redirect back to homepage!
     */
    if ((contentSlug && !contentName)
    || (contentSlug && contentName && componentSlug && !componentName)) {
      console.log('no contentName or componentName found');
      return res.redirect('/notfound');
    }

    /** Function to set correct fullPath, depending on if componentSlug and/or contentSlug exist.
     * This defines correct fullPath, depending how deep into subpages you are.
     * This is used to assign correct a href-s for sidebar elements and for Back/Forward buttons.
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

    /** Function to set correct componentType, depending on if componentSlug and/or contentSlug exist.
     * This defines correct componentType, depeonding how deep into subpages you are.
     * This is used to assign correct sidebar icons.
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

    /**  Save page names for breadcrumbs. */
    const breadcrumbNames = {
      courseName: course.courseName,
      contentName,
      componentName,
    };
    /** Save all relevant info about current page: slugs, fullPath, menu icons. These are used to render correct info on given page with responseAction() and renderPage() functions. */
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
  /** The function allCoursesActiveWithComponentsData() is used to get info about markedAsDone components for each active course for the given user (githubID).
  * Parameters are list of all active courses + user's githubID whose markedAsDone info is requested.
  */
  allCoursesActiveWithComponentsData: async (allCoursesActive, githubID) => {
    /** First, for each course, get a list of component UUIDs that has been marked as done. Save this to allCoursesActiveDoneComponentsArr array. */
    const allCoursesActiveDoneComponentsPromises = allCoursesActive.map((course) => getMarkedAsDoneComponents(githubID, course.courseSlug));

    const allCoursesActiveDoneComponentsArr = await Promise.all(allCoursesActiveDoneComponentsPromises);
    // console.log('allCoursesActiveDoneComponentsArr1:', allCoursesActiveDoneComponentsArr);

    /** Then, again for each course, add the respective array of done components as a key-value pair: */
    allCoursesActive.forEach((course, index) => {
      allCoursesActive[index].markedAsDoneComponentsUUIDs = allCoursesActiveDoneComponentsArr[index];
    });

    /** You now have a list of active courses where each course has a list of markedAsDone components' UUIDs by the given user. */
    // console.log('allCoursesActive1:', allCoursesActive);
    return allCoursesActive;
  },
};

export {
  allCoursesController, responseAction, renderPage, getMarkedAsDoneComponents,
};
