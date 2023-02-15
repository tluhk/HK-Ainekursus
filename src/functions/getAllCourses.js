const { axios, authToken } = require('../setup/setupGithub');
const { requestCourses, requestTeamCourses } = require('./githubReposRequests');
const { getConfig } = require('./getConfig');

const getAllCourses = (async (teamSlug) => {
  let courses;
  // console.log('teamSlug1:', teamSlug);
  /**
   * If user exists, they're in a team and team.slug exists, only then read Course repos.
   * Otherwise load courses array as empty (no courses to show).
   */
  if (teamSlug) {
    courses = await axios.get(requestTeamCourses(teamSlug), authToken).catch((error) => {
      console.log(error);
    });
  } else {
    courses = { data: [] };
    /* await axios.get(requestCourses, authToken).catch((error) => {
      console.log(error);
    }); */
  }

  // console.log('courses1:', courses);
  const filter1 = courses.data.filter((x) => x.name.startsWith('HK_') && x.html_url !== 'https://github.com/tluhk/HK_Programmeerimine_II');
  // console.log('filter1', filter1);

  const map1 = filter1.map((y) => {
    const coursePromise = (param) => getConfig(param.full_name)
      .then((result) => ({
        courseName: result.courseName,
        courseSlug: result.slug,
        courseSlugInGithub: y.name,
        coursePathInGithub: y.full_name,
        courseCode: result.courseCode,
        courseCardUrl: result.courseUrl,
        courseIsActive: result.active,
      }));

    return coursePromise(y);
  });
  // console.log('map1:', map1);

  return Promise.all(map1).then((results) => results);
});

module.exports = { getAllCourses };
