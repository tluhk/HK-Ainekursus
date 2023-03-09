/* eslint-disable camelcase */
const cheerio = require('cheerio');
const { axios, authToken } = require('../setup/setupGithub');
const { requestTeamCourses, requestRepos } = require('./githubReposRequests');
const { getConfig } = require('./getConfig');

const getAllCourses = (async (teamSlug) => {
  console.log('teamSlug4:', teamSlug);
  /**
   * If user exists, they're in a team and team.slug exists, only then read Course repos.
   * Otherwise load courses array as empty (no courses to show).
   */
  let courses = { data: [] };

  if (teamSlug && teamSlug === 'teachers') {
    courses = await axios.get(requestRepos, authToken).catch((error) => {
      console.log(error);
    });
  } if (teamSlug && teamSlug !== 'teachers') {
    courses = await axios.get(requestTeamCourses(teamSlug), authToken).catch((error) => {
      console.log(error);
    });
  }

  console.log('courses2:', courses);
  /**
   * Set conditions, which Repositories (Courses) are read from tluhk org github account
   */
  const filter1 = courses.data.filter((x) => x.name.startsWith('HK_') && x.html_url !== 'https://github.com/tluhk/HK_Programmeerimine_II');
  console.log('filter1', filter1);

  const map1 = filter1.map((y) => {
    const coursePromise = (param) => getConfig(param.full_name, teamSlug)
      .then(async (result) => {
        /**
         * Read course information from ÕIS Ainekaart
         * https://hackernoon.com/how-to-build-a-web-scraper-with-nodejs
         */
        const oisContent = {};
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
              if (yldaine_c1 && yldaine_c1 === 'Õppeaine eesmärgid') oisContent.eesmargid = yldaine_c2;
              if (yldaine_c1 && yldaine_c1 === 'Õppeaine sisu lühikirjeldus') oisContent.summary = yldaine_c2;
              if (yldaine_c1 && yldaine_c1 === 'Õppeaine õpiväljundid') oisContent.opivaljundid = yldaine_c2;
            });
          });
        } catch (error) {
          console.log(error, error.message);
        }

        // console.log('oisContent1:', oisContent);

        return {
          courseUrl: result.courseUrl,
          teacherUsername: result.teacherUsername,
          courseIsActive: result.active,
          courseName: result.courseName || oisContent.name,
          courseSlug: oisContent.code, // || result.slug,
          courseCode: oisContent.code, // || result.courseCode,
          courseSlugInGithub: y.name,
          coursePathInGithub: y.full_name,
          courseEAP: Math.round(oisContent.EAP),
          courseGrading: oisContent.grading,
          courseEesmargid: oisContent.eesmargid,
          courseSummary: oisContent.summary,
          courseOpivaljundid: oisContent.opivaljundid,
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

module.exports = { getAllCourses };
