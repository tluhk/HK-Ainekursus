/* eslint-disable max-len */
/* eslint-disable camelcase */
const cheerio = require('cheerio');
const { axios, authToken } = require('../setup/setupGithub');
const { cache } = require('../setup/setupCache');
const { requestTeamCourses, requestRepos } = require('./githubReposRequests');
const { getConfig } = require('./getConfigFuncs');
const { apiRequests } = require('../components/courses/coursesService');

const getAllCoursesData = (async (teamSlug) => {
  // console.log('teamSlug4:', teamSlug);
  /**
   * If user exists, they're in a team and team.slug exists, only then read Course repos.
   * Otherwise load courses array as empty (no courses to show).
   */
  let courses = { data: [] };
  const routePath = `allCoursesData+${teamSlug}`;

  if (!cache.has(routePath)) {
    console.log(`❌❌ team courses IS NOT from cache: ${routePath}`);

    if (teamSlug && (teamSlug === 'master' || teamSlug === 'teachers')) {
      courses = await axios.get(requestRepos, authToken).catch((error) => {
        console.log(error);
      });
    } if (teamSlug && teamSlug !== 'master' && teamSlug !== 'teachers') {
      courses = await axios.get(requestTeamCourses(teamSlug), authToken).catch((error) => {
        console.log(error);
      });
    }
    cache.set(routePath, courses);
  } else {
    console.log(`✅✅ team courses FROM CACHE: ${routePath}`);
    courses = cache.get(routePath);
    // console.log('Cachecomponents2:', components);
  }

  if (!courses) return [];

  // console.log('courses1:', courses);

  /*
  * Set conditions, which Repositories (Courses) are read from tluhk org github account
   */
  const coursesStartingWithHK = courses.data.filter((x) => x.name.startsWith('HK_') && x.html_url !== 'https://github.com/tluhk/HK_Programmeerimine_II');
  // console.log('filter1', filter1);

  /**
   * Return empty array if tluhk org doesn't have any repos starting with "HK_"
   */
  if (!coursesStartingWithHK) return [];

  const map1 = coursesStartingWithHK.map(async (y) => {
    // const start5 = performance.now();
    const activeBranches = await apiRequests.activeBranchesService(y.full_name);
    // const end5 = performance.now();
    // console.log(`Execution time activeBranches: ${end5 - start5} ms`);

    // console.log('y.full_name4:', y.full_name);
    // console.log('activeBranches4:', activeBranches);
    let refBranch;
    if (activeBranches && activeBranches.includes(teamSlug)) {
      refBranch = teamSlug;
    } else if (activeBranches.length && teamSlug === 'teachers') {
      refBranch = activeBranches[0];
    } else {
      refBranch = 'master';
    }
    // console.log('refBranch4:', refBranch);

    const coursePromise = (param) => getConfig(param.full_name, refBranch)
      .then(async (result) => {
        /**
         * Read course information from ÕIS Ainekaart
         * https://hackernoon.com/how-to-build-a-web-scraper-with-nodejs
         */
        let oisContent = {};

        const routePathOisContent = `oisContent+${param.full_name}+${refBranch}`;

        // const start6 = performance.now();

        if (!cache.has(routePathOisContent)) {
          console.log(`❌❌ oisContent IS NOT from cache: ${routePathOisContent}`);

          try {
            await axios(result.courseUrl).then((response) => {
              const { data } = response;
              const $ = cheerio.load(data);

              $('.yldaine_r', data).each(function () {
                const ryhmHeader = $(this).find('div.ryhmHeader').text();
                const yldaine_c1 = $(this).find('div.yldaine_c1').text();
                const yldaine_c2 = $(this).find('div.yldaine_c2').text();

                if (ryhmHeader && ryhmHeader !== '') oisContent.oisName = ryhmHeader;
                if (yldaine_c1 && yldaine_c1 === 'Õppeaine kood') oisContent.code = yldaine_c2;
                if (yldaine_c1 && yldaine_c1 === 'Õppeaine nimetus eesti k') oisContent.name = yldaine_c2;
                if (yldaine_c1 && yldaine_c1 === 'Õppeaine maht EAP') oisContent.EAP = yldaine_c2;
                if (yldaine_c1 && yldaine_c1 === 'Kontrollivorm') oisContent.grading = yldaine_c2;
                // if (yldaine_c1 && yldaine_c1 === 'Õppeaine eesmärgid') oisContent.eesmargid = yldaine_c2;
                // if (yldaine_c1 && yldaine_c1 === 'Õppeaine sisu lühikirjeldus') oisContent.summary = yldaine_c2;
                // if (yldaine_c1 && yldaine_c1 === 'Õppeaine õpiväljundid') oisContent.opivaljundid = yldaine_c2;
              });
            });
          } catch (error) {
            console.log(error, error.message);
          }

          cache.set(routePathOisContent, oisContent);
        } else {
          console.log(`✅✅ oisContent FROM CACHE: ${routePathOisContent}`);
          oisContent = cache.get(routePathOisContent);
        }
        // const end6 = performance.now();
        // console.log(`Execution time oisContent: ${end6 - start6} ms`);

        return {
          courseUrl: result.courseUrl,
          teacherUsername: result.teacherUsername,
          courseIsActive: result.active,
          courseName: result.courseName || oisContent.name,
          courseSlug: oisContent.code, // || result.slug,
          courseCode: oisContent.code, // || result.courseCode,
          courseSemester: result.semester,
          courseSlugInGithub: y.name,
          coursePathInGithub: y.full_name,
          refBranch,
          courseEAP: Math.round(oisContent.EAP),
          courseGrading: oisContent.grading,
          // courseEesmargid: oisContent.eesmargid,
          // courseSummary: oisContent.summary,
          // courseOpivaljundid: oisContent.opivaljundid,
        };
      });

    // console.log('coursePromise1:', coursePromise);

    return coursePromise(y);
  });
  // console.log('map1:', map1);

  return Promise.all(map1).then((results) => {
    // console.log('results1:', results);
    return results;
  });
});

module.exports = { getAllCoursesData };
