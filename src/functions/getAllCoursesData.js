/* eslint-disable max-len */
/* eslint-disable camelcase */
import { performance } from 'perf_hooks';

import cheerio from 'cheerio';

import { axios, authToken } from '../setup/setupGithub';
import cache from '../setup/setupCache';
import githubReposRequests from './githubReposRequests';
import getConfig from './getConfigFuncs';
import apiRequests from '../components/courses/coursesService';

const { requestTeamCourses, requestRepos } = githubReposRequests;

const getAllCoursesData = (async (teamSlug, req) => {
  // console.log('teamSlug4:', teamSlug);
  /**
   * If user exists, they're in a team and team.slug exists, only then read Course repos.
   * Otherwise load courses array as empty (no courses to show).
   */
  const { user } = req;

  console.log('user55:', user);

  let courses = { data: [] };
  const routePath = `allCoursesData+${teamSlug}`;

  if (!cache.has(routePath)) {
    console.log(`❌❌ team courses IS NOT from cache: ${routePath}`);

    if (teamSlug && (teamSlug === 'master' || teamSlug === 'teachers')) {
      courses = await axios.get(requestRepos, authToken).catch((error) => {
        console.error(error);
      });
    } if (teamSlug && teamSlug !== 'master' && teamSlug !== 'teachers') {
      courses = await axios.get(requestTeamCourses(teamSlug), authToken).catch((error) => {
        console.error(error);
      });
    }
    cache.set(routePath, courses);
  } else {
    console.log(`✅✅ team courses FROM CACHE: ${routePath}`);
    courses = cache.get(routePath);
    // console.log('Cachecomponents2:', components);
  }

  if (!courses) return [];

  console.log('courses1:', courses);

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

    console.log('y.full_name4:', y.full_name);
    console.log('activeBranches4:', activeBranches);
    let refBranch;
    if (activeBranches && activeBranches.includes(teamSlug)) {
      refBranch = teamSlug;
    } else if (activeBranches.length && teamSlug === 'teachers') {
      // eslint-disable-next-line prefer-destructuring

      // Siin ei tohi by default [0] määrata! Võib olla, et õpetaja annab rif20 branchi ainet. Pead kontrollima kõiki branche!

      const branchConfigPromises = activeBranches.map(async (branch) => {
        const config = await getConfig(y.full_name, branch);
        return config;
      });

      // console.log('branchConfigPromises1:', branchConfigPromises);
      const branchConfigs = await Promise.all(branchConfigPromises);
      const correctBranchIndex = branchConfigs.findIndex((config) => config.teacherUsername === user.username);

      // console.log('branchConfigs1:', branchConfigs);
      // console.log('correctBranchIndex1:', correctBranchIndex);

      if (correctBranchIndex > -1) {
        refBranch = activeBranches[correctBranchIndex];
      } else if (correctBranchIndex <= -1) {
        const firstActiveBranchIndex = branchConfigs.findIndex((config) => config.active === true);
        refBranch = activeBranches[firstActiveBranchIndex];
      } else refBranch = 'master';
    } else {
      refBranch = 'master';
    }
    // console.log('refBranch4:', refBranch);

    const coursePromise = (param) => getConfig(param.full_name, refBranch)
      .then(async (config) => {
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
            await axios(config.courseUrl).then((response) => {
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
            console.error(error);
          }

          cache.set(routePathOisContent, oisContent);
        } else {
          console.log(`✅✅ oisContent FROM CACHE: ${routePathOisContent}`);
          oisContent = cache.get(routePathOisContent);
        }
        // const end6 = performance.now();
        // console.log(`Execution time oisContent: ${end6 - start6} ms`);

        console.log('oisContent.name5:', oisContent.name);

        const allComponentSlugs = [];
        config.lessons.forEach((lesson) => {
          allComponentSlugs.push(lesson.components);
        });

        const allComponentSlugsFlat = [].concat(...allComponentSlugs);
        console.log('allComponentSlugsFlat5:', allComponentSlugsFlat);

        const allComponentsUUIDs = [
          ...config.concepts.filter((concept) => allComponentSlugsFlat.includes(concept.slug)).map((concept) => concept.uuid),
          ...config.practices.filter((practice) => allComponentSlugsFlat.includes(practice.slug)).map((practice) => practice.uuid),
        ];

        console.log('allComponentsUUIDs5:', allComponentsUUIDs);

        return {
          courseUrl: config.courseUrl,
          teacherUsername: config.teacherUsername,
          courseIsActive: config.active,
          courseName: config.courseName || oisContent.name,
          courseSlug: oisContent.code, // || result.slug,
          courseCode: oisContent.code, // || result.courseCode,
          courseSemester: config.semester,
          courseSlugInGithub: y.name,
          coursePathInGithub: y.full_name,
          refBranch,
          courseEAP: Math.round(oisContent.EAP),
          courseGrading: oisContent.grading,
          // courseEesmargid: oisContent.eesmargid,
          // courseSummary: oisContent.summary,
          // courseOpivaljundid: oisContent.opivaljundid,
          courseAllComponentsUUIDs: allComponentsUUIDs,
        };
      });

    // console.log('coursePromise1:', coursePromise);

    return coursePromise(y);
  });
  // console.log('map1:', map1);

  return Promise.all(map1).then((results) => results);
});

export default getAllCoursesData;
