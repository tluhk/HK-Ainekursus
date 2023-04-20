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

const coursePromise = (param, refBranch, validBranches) => getConfig(param.full_name, refBranch)
  .then(async (config) => {
    if (!config) {
      console.log(`No config found for ${param.full_name}, ${refBranch}`);
      return {};
    }

    /** Read course information from ÕIS Ainekaart using the courseUrl value from config file.
     * Guide: https://hackernoon.com/how-to-build-a-web-scraper-with-nodejs
     * Then store info from ÕIS Ainekaart under a course's object.
     * Finally return the object.
     */
    let oisContent = {};

    const routePathOisContent = `oisContent+${param.full_name}+${refBranch}`;

    const start6 = performance.now();

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
    const end6 = performance.now();
    console.log(`Execution time oisContent: ${end6 - start6} ms`);

    // console.log('oisContent.name5:', oisContent.name);

    console.log('config5:', config);
    const allComponentSlugs = [];

    config.lessons.forEach((lesson) => {
      allComponentSlugs.push(lesson.components);
    });

    const allComponentSlugsFlat = [].concat(...allComponentSlugs);
    // console.log('allComponentSlugsFlat5:', allComponentSlugsFlat);

    const allComponentsUUIDs = [
      ...config.concepts.filter((concept) => allComponentSlugsFlat.includes(concept.slug)).map((concept) => concept.uuid),
      ...config.practices.filter((practice) => allComponentSlugsFlat.includes(practice.slug)).map((practice) => practice.uuid),
    ];

    // console.log('allComponentsUUIDs5:', allComponentsUUIDs);

    return {
      courseUrl: config.courseUrl,
      teacherUsername: config.teacherUsername,
      courseIsActive: config.active,
      courseName: config.courseName || oisContent.name,
      courseSlug: oisContent.code, // || result.slug,
      courseCode: oisContent.code, // || result.courseCode,
      courseSemester: config.semester,
      courseSlugInGithub: param.name,
      coursePathInGithub: param.full_name,
      courseEAP: Math.round(oisContent.EAP),
      courseGrading: oisContent.grading,
      // courseEesmargid: oisContent.eesmargid,
      // courseSummary: oisContent.summary,
      // courseOpivaljundid: oisContent.opivaljundid,
      refBranch,
      courseBranchComponentsUUIDs: allComponentsUUIDs,
      courseAllActiveBranches: validBranches,
      config,
    };
  });

const getAllCoursesData = (async (teamSlug, req) => {
  // console.log('teamSlug4:', teamSlug);
  /**
   * Read Course repos only if the user exists, they are in a team and team.slug exists!
   * Otherwise load courses array as empty (no courses to show).
   */
  const { user } = req;

  console.log('user55:', user);

  let courses = { data: [] };
  const routePath = `allCoursesData+${teamSlug}`;

  if (!cache.has(routePath)) {
    console.log(`❌❌ team courses IS NOT from cache: ${routePath}`);

    /** For TEACHERS get all possible HK_ repos  */
    if (teamSlug && (teamSlug === 'master' || teamSlug === 'teachers')) {
      courses = await axios.get(requestRepos, authToken).catch((error) => {
        console.error(error);
      });
    /** For STUDENTS get only HK_ repos where they have access to */
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
  * Filter only repos that start with "HK_" prefix.
   */
  const coursesStartingWithHK = courses.data.filter((x) => x.name.startsWith('HK_') && x.html_url !== 'https://github.com/tluhk/HK_Programmeerimine_II');

  /**
   * Return empty array if tluhk org doesn't have any repos starting with "HK_"
   */
  if (!coursesStartingWithHK) return [];

  const allCourses = coursesStartingWithHK.map(async (course) => {
    // const start5 = performance.now();
    const validBranches = await apiRequests.validBranchesService(course.full_name);
    // const end5 = performance.now();
    // console.log(`Execution time validBranches: ${end5 - start5} ms`);

    console.log('course.full_name4:', course.full_name);
    console.log('validBranches4:', validBranches);
    let refBranch;
    if (validBranches && validBranches.includes(teamSlug)) {
      refBranch = teamSlug;
    } else if (validBranches.length && teamSlug === 'teachers') {
      // Siin ei tohi by default [0] määrata! Võib olla, et õpetaja annab rif20 branchi ainet. Pead kontrollima kõiki branche!
      const branchConfigPromises = validBranches.map(async (branch) => {
        const config = await getConfig(course.full_name, branch);
        return config;
      });
      const branchConfigs = await Promise.all(branchConfigPromises);
      console.log('branchConfigs1:', branchConfigs);

      const correctBranchIndex = branchConfigs.findIndex((config) => config.teacherUsername === user.username);

      // console.log('branchConfigs1:', branchConfigs);
      // console.log('correctBranchIndex1:', correctBranchIndex);

      if (correctBranchIndex > -1) {
        refBranch = validBranches[correctBranchIndex];
      } else if (correctBranchIndex <= -1) {
        const firstActiveBranchIndex = branchConfigs.findIndex((config) => config.active === true);
        refBranch = validBranches[firstActiveBranchIndex];
      } else refBranch = 'master';
    } else {
      refBranch = 'master';
    }
    console.log('refBranch4:', refBranch);

    /** Get selected course info from ÕIS Ainekaart with coursePromise() func. */
    const courseDataWithOIS = await coursePromise(course, refBranch, validBranches);

    console.log('courseDataWithOIS1:', courseDataWithOIS);
    return courseDataWithOIS;
  });
  // console.log('map1:', map1);

  return Promise.all(allCourses).then((results) => results);
});

export default getAllCoursesData;
