/* eslint-disable max-len */
/* eslint-disable no-undef */
require('core-js/actual/array/group-by');
const { base64, utf8, MarkdownIt } = require('../../setup/setupMarkdown');

// Enable in-memory cache
const { cache } = require('../../setup/setupCache');
const { getAllCourses } = require('../../functions/getAllCourses');
const { getConfig } = require('../../functions/getConfig');
const { function1 } = require('../../functions/imgFunctions');
const { returnPreviousPage, returnNextPage, setSingleCoursePaths } = require('../../functions/navButtonFunctions');
const { verifyCache } = require('./coursesVerifyCache');
const { apiRequests } = require('./coursesService');
const { getOneTeamMembers, teamsController } = require('../teams/teamsController');

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

  console.log('teachers3:', teachers);
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
    const allCourses = await getAllCourses(teamSlug);
    const allCoursesActive = allCourses.filter((x) => x.courseIsActive);
    console.log('allCoursesActive1:', allCoursesActive);

    const allCoursesGroupedByTeacher = allCoursesActive.groupBy(({ teacherUsername }) => teacherUsername);
    console.log('allCoursesGroupedByTeacher1:', allCoursesGroupedByTeacher);

    const allTeachers = await teamsController.getUsersInTeam('teachers');
    console.log('allTeachers1:', allTeachers);

    return res.render('dashboard', {
      courses: allCoursesActive,
      user: req.user,
      teacherCourses: allCoursesGroupedByTeacher,
      teachers: allTeachers,
    });
  },
  getCoursesOwners: async (req, res, next) => {

  },
  /**
   * for '/course/:courseSlug/:contentSlug?/:componentSlug?' route
   */
  getSpecificCourse: async (req, res, next) => {
    /**
     * Read parameters sent with endpoint
     */
    const { courseSlug, contentSlug, componentSlug } = req.params;
    // console.log('req.params.courseSlug:', courseSlug);
    // console.log('req.params.contentSlug:', contentSlug);
    // console.log('req.params.componentSlug:', componentSlug);

    let teamSlug;
    if (req.user.team.slug) teamSlug = req.user.team.slug;

    /**
     * Get all available courses
     */
    const allCourses2 = await getAllCourses(teamSlug);
    // console.log('allCourses2:', allCourses2);
    /**
     * Get active course
     */
    const course = allCourses2.filter((x) => x.courseIsActive && x.courseSlug === courseSlug)[0];

    console.log('course1:', course);
    res.locals.course = course;
    // console.log('course.courseSlugInGithub1:', course.courseSlugInGithub);

    const allTeachers = await teamsController.getUsersInTeam('teachers');
    console.log('allTeachers0:', allTeachers);

    res.locals.teachers = allTeachers;

    /**
     * Save routepath for the active course to cache its config file
     */
    let routePath = '';
    if (teamSlug) {
      routePath = `${req.url}+config+${teamSlug}`;
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
    try {
      // get all branches in selected course Repo
      const branches = await apiRequests.branchesService(res.locals, req);

      /**
       *  if repo has a branch that matches teamSlug (e.g. "rif20"), then save this to refBranch variable.
       * This variable is added to the end of Github API requests, e.g:
       * api.github.com/repos/tluhk/HK_Ainekursuse-mall/contents/config.json?${refBranch}`
       */
      if (branches.includes(teamSlug)) refBranch = `ref=${teamSlug}`;
      // console.log('isBranch2:', isBranch);
    } catch (error) {
      console.error(error);
    }

    /**
     * Save refBranch to res.locals. This is used by coursesService.js file.
     */
    res.locals.refBranch = refBranch;

    // console.log('cache.has(routePath)1:', cache.has(routePath));
    // console.log('cache.get(routePath)1:', cache.get(routePath));
    let config;
    if (cache.has(routePath) && cache.get(routePath) !== undefined) {
      config = cache.get(routePath);
      // console.log('res.locals.cache2:', res.locals.cache);
      console.log('config from cache');
    } else {
      console.log('config is NOT from cache');
      try {
        config = await getConfig(course.coursePathInGithub, teamSlug, refBranch);
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

    if (refBranch) {
      console.log(`reading data from ${refBranch} branch`);
    } else {
      console.log('reading data from branch');
    }

    // console.log('config2:', config);

    res.locals.course = course;
    res.locals.config = config;
    res.locals.allCourses = allCourses2;
    res.locals.singleCoursePaths = setSingleCoursePaths(config);

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
