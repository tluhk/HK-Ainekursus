/* eslint-disable max-len */
/* eslint-disable no-undef */
require('core-js/actual/array/group-by');
const { base64, utf8, MarkdownIt } = require('../../setup/setupMarkdown');

// Enable in-memory cache
const { cache } = require('../../setup/setupCache');
const { getAllCoursesData } = require('../../functions/getAllCoursesData');
const { getConfig } = require('../../functions/getConfigFuncs');
const { function1 } = require('../../functions/imgFunctions');
const { returnPreviousPage, returnNextPage, setSingleCoursePaths } = require('../../functions/navButtonFunctions');
const { verifyCache } = require('./coursesVerifyCache');
const { apiRequests } = require('./coursesService');
const { teamsController } = require('../teams/teamsController');

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
    func = await apiRequests[githubRequest];
    // console.log('func1:', func);
    await func(res.locals, req).then((response) => {
      // console.log('response1:', response);
      apiResponse = response;
    });
  }

  // console.log('githubRequest1:', githubRequest);
  // console.log('githubRequest1type:', typeof githubRequest);

  // console.log('resComponents3:', apiResponse);

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
    singleCoursePaths,
    coursePathInGithub,
    teachers,
    branches,
    selectedVersion,
  } = res.locals;

  const {
    resComponents,
    resFiles,
    resSources,
    refBranch,
  } = res.locals;

  // console.log('resComponents in responseAction:', resComponents);
  // console.log('resFiles in responseAction:', resComponents);

  // console.log('resComponents1:', resComponents);
  const resComponentsContent = resComponents.data.content;

  const componentDecoded = base64.decode(resComponentsContent);
  const componentDecodedUtf8 = utf8.decode(componentDecoded);

  /**
   * Sisuteema piltide kuvamine
   * - functions: https://stackoverflow.com/a/58542933
   * - changing img src: https://www.npmjs.com/package/modify-image-url-md?activeTab=explore
   */
  const markdownWithModifiedImgSources = await function1(coursePathInGithub, path, componentDecodedUtf8, refBranch);

  /**
   * Add Table of Contents markdown element to Markdown before rendering
   */
  const markdownWithModifiedImgSourcesToc = markdownWithModifiedImgSources.concat('\n\n ${toc} \n');
  // console.log('markdownWithModifiedImgSourcesToc:', markdownWithModifiedImgSourcesToc);

  /**
   * Render Markdown
   */
  const componentMarkdown = await MarkdownIt.render(markdownWithModifiedImgSourcesToc);
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

  console.log('config7:', config);

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
    singleCoursePaths,
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
  });
};

const allCoursesController = {

  /**
   * for '/' and '/courses' routes
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

    if (isTeacher) {
      const allCourses = await getAllCoursesData(teamSlug);
      // console.log('allCourses1:', allCourses);
      const allCoursesActive = allCourses.filter((x) => x.courseIsActive);
      // console.log('allCoursesActive1:', allCoursesActive);

      allCoursesActive
        .sort((a, b) => ((a.teacherUsername > b.teacherUsername) ? 1 : -1))
        .groupBy(({ teacherUsername }) => teacherUsername);

      // console.log('allCoursesActive1:', allCoursesActive);
      // console.log('req.user3:', req.user);

      allTeacherCourses = allCoursesActive
        .filter((course) => course.teacherUsername === req.user.username);

      allTeacherCourses.sort((a, b) => a.courseName.localeCompare(b.courseName));

      // console.log('allTeacherCourses1:', allTeacherCourses);
      /**
       * First, sort by teacherUsername values,
       * Second, group by teacherUsername values
       */
      const allCoursesGroupedByTeacher = allCoursesActive
        .sort((a, b) => ((a.teacherUsername > b.teacherUsername) ? 1 : -1))
        .groupBy(({ teacherUsername }) => teacherUsername);
      // console.log('allCoursesGroupedByTeacher1:', allCoursesGroupedByTeacher);

      delete allCoursesGroupedByTeacher[req.user.username];
      // console.log('allCoursesGroupedByTeacher2:', allCoursesGroupedByTeacher);

      const allTeachers = await teamsController.getUsersInTeam('teachers');
      // console.log('allTeacherCourses1:', allTeacherCourses);
      // console.log('allCoursesGroupedByTeacher1:', allCoursesGroupedByTeacher);
      // console.log('allTeachers1:', allTeachers);

      return res.render('dashboard-teacher', {
        courses: allTeacherCourses,
        user: req.user,
        teacherCourses: allCoursesGroupedByTeacher,
        teachers: allTeachers,
      });
    }

    if (!isTeacher) {
      const allCourses = await getAllCoursesData(teamSlug);
      const allCoursesActive = allCourses.filter((x) => x.courseIsActive);

      // eslint-disable-next-line no-nested-ternary

      /**
       * First, sort by teacherUsername values,
       * Second, group by teacherUsername values
       */
      const allCoursesGroupedByTeacher = allCoursesActive
        .sort((a, b) => ((a.teacherUsername > b.teacherUsername) ? 1 : -1))
        .groupBy(({ teacherUsername }) => teacherUsername);

      Object.keys(allCoursesGroupedByTeacher).forEach((teacher) => {
        allCoursesGroupedByTeacher[teacher].sort((a, b) => a.courseName.localeCompare(b.courseName));
      });
      // console.log('allCoursesGroupedByTeacher5:', allCoursesGroupedByTeacher);

      const allTeachers = await teamsController.getUsersInTeam('teachers');
      // console.log('allTeachers1:', allTeachers);

      allCoursesActive.sort((a, b) => a.courseName.localeCompare(b.courseName));

      /**
      * NOTIFICATIONS
      */
      console.log('allCoursesActive5:', allCoursesActive);
      console.log('teamSlug5:', teamSlug);
      console.log('isTeacher5:', isTeacher);

      /**
       * END OF NOTIFICATIONS
       */

      return res.render('dashboard', {
        courses: allCoursesActive,
        user: req.user,
        teacherCourses: allCoursesGroupedByTeacher,
        teachers: allTeachers,
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

    const selectedVersion = req.session.selectedVersion || null;
    console.log('selectedVersion1:', selectedVersion);

    let teamSlug;
    if (req.user.team.slug) teamSlug = req.user.team.slug;

    res.locals.selectedVersion = selectedVersion;
    res.locals.teamSlug = teamSlug;

    /**
     * You need to add an event listener to your radio buttons to update the value of the hidden input whenever a radio button is clicked. Here's an example:
     *
      <!-- Radio buttons -->
      <input type="radio" name="default-radio" value="value1" onclick="handleRadioClick('value1')">
      <input type="radio" name="default-radio" value="value2" onclick="handleRadioClick('value2')">
      <input type="radio" name="default-radio" value="value3" onclick="handleRadioClick('value3')">

      <!-- Hidden form -->
      <form id="my-form" style="display:none;" method="GET" action="/course/{{courseSlug}}/{{contentSlug}}/{{componentSlug}}">
        <input type="hidden" name="selectedValue" id="selectedValue">
      </form>

      <script>
      function handleRadioClick(value) {
        document.getElementById("selectedValue").value = value;
        document.getElementById("my-form").submit();
      }
      </script>

      This code sets the value of the hidden input to the value of the clicked radio button, and then submits the form using JavaScript's submit() method. The form will then perform a GET request to your server with the selected value as a query parameter.
     */

    /**
     * Get all available courses
     */
    const allCourses = await getAllCoursesData(teamSlug);
    const allCoursesActive = allCourses.filter((x) => x.courseIsActive);

    console.log('allCoursesActive2:', allCoursesActive);
    allCoursesActive.sort((a, b) => a.courseName.localeCompare(b.courseName));

    /**
     * Get active course
     */
    const course = allCoursesActive.filter((x) => x.courseIsActive && x.courseSlug === courseSlug)[0];

    /**
     * If no course is found (none of the branches is active), but the course URL is still visited by the user, then redirect to /notfound page.
     */
    if (!course) return res.redirect('/notfound');

    // console.log('course1:', course);
    res.locals.course = course;
    // console.log('course.courseSlugInGithub1:', course.courseSlugInGithub);

    const allTeachers = await teamsController.getUsersInTeam('teachers');
    // console.log('allTeachers0:', allTeachers);

    res.locals.teachers = allTeachers;

    /**
     * Save routepath for the active course to cache its config file
     */
    let routePath = '';
    if (selectedVersion) {
      routePath = `${req.url}+config+version+${selectedVersion}`;
    } else if (teamSlug) {
      routePath = `${req.url}+config+team+${teamSlug}`;
    } else {
      routePath = `${req.url}+config`;
    }
    // console.log('routePath1:', routePath);

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
    if (activeBranches && teamSlug === 'teachers') {
      refBranch = activeBranches[0];
    } else if (selectedVersion && activeBranches.includes(selectedVersion)) {
      refBranch = selectedVersion;
    } else if (!selectedVersion && activeBranches.includes(teamSlug)) {
      refBranch = teamSlug;
    } else {
      refBranch = 'master';
    }

    console.log('refBranch3:', refBranch);

    /**
     * Save refBranch to res.locals. This is used by coursesService.js file.
     */
    res.locals.refBranch = refBranch;
    res.locals.branches = activeBranches;

    // console.log('cache.has(routePath)1:', cache.has(routePath));
    // console.log('cache.get(routePath)1:', cache.get(routePath));

    let config;
    if (cache.has(routePath) && cache.get(routePath) !== undefined) {
      config = cache.get(routePath);
      console.log('config from cache');
    } else {
      console.log('config is NOT from cache');
      try {
        config = await getConfig(course.coursePathInGithub, refBranch);
      } catch (error) {
        /**
         * If config file is not returned with course.coursePathInGithub, the coursePathInGithub is invalid.
         * Redirect back to homepage
         */
        return res.redirect('/notfound');
      }
      cache.set(routePath, config);
      // console.log('config from api');
    }

    console.log(`reading data from ${refBranch} branch`);

    // console.log('config2:', config);

    res.locals.course = course;
    res.locals.config = config;
    res.locals.allCourses = allCoursesActive;
    res.locals.singleCoursePaths = setSingleCoursePaths(config);

    console.log('res.locals.allCourses1:', res.locals.allCourses);

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

    config.docs.forEach((x) => {
      if (x.slug === contentSlug) {
        contentName = x.name;
        githubRequest = 'docsService';
        // console.log('githubRequest3:', githubRequest);
        // console.log('Slug found in config.docs');
      }
    });
    config.additionalMaterials.forEach(async (x) => {
      if (x.slug === contentSlug) {
        contentName = x.name;
        githubRequest = 'courseAdditionalMaterialsService';
        // console.log('Slug found in config.additionalMaterials');
      }
    });
    config.lessons.forEach(async (x) => {
      if (x.slug === contentSlug) {
        contentName = x.name;
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

    config.concepts.forEach(async (x) => {
      if (x.slug === componentSlug && contentSlug) {
        componentName = x.name;
        componentType = 'concept';
        githubRequest = 'lessonComponentsService';
        // console.log('Slug found in config.concepts');
      }
    });
    config.practices.forEach(async (x) => {
      if (x.slug === componentSlug && contentSlug) {
        componentName = x.name;
        componentType = 'practice';
        githubRequest = 'lessonComponentsService';
        // console.log('Slug found in config.practices');
      }
    });
    config.lessons.forEach(async (x) => {
      if (x.additionalMaterials[0].slug === componentSlug && contentSlug) {
        componentName = x.additionalMaterials[0].name;
        componentType = 'docs';
        githubRequest = 'lessonAdditionalMaterialsService';
        // console.log('Slug found in config.lessons.additionalMaterials');
      }
    });

    /**
     * IF contentSlug exists, but contentName is not returned
     * OR if contentSlug, contentName and componentSlug exist, but componentName is not returned
     * THEN either of the slug is invalid and does not exist in config file!
     * AND Redirect back to homepage.
     */
    if ((contentSlug && !contentName)
    || (contentSlug && contentName && componentSlug && !componentName)) {
      return res.redirect('/notfound');
    }
    /**
     * You can check values:
     *
      console.log('courseSlug1:', courseSlug);
      console.log('course.courseName1:', course.courseName);
      console.log('contentSlug1:', contentSlug);
      console.log('contentName1:', contentName);
      console.log('componentSlug1:', componentSlug);
      console.log('componentName1:', componentName);
      console.log('githubRequest1:', githubRequest);
    */

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

};

module.exports = {
  allCoursesController, verifyCache, responseAction, renderPage,
};
