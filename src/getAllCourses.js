const { axios, authToken } = require('./setup/setupGithub');
const { requestCourses } = require('./functions/repoFunctions');
const { getConfig } = require('./getConfig');

const getAllCourses = (async () => {
  const resp = await axios.get(requestCourses, authToken).catch((error) => {
    console.log(error);
  });

  const filter1 = resp.data.filter((x) => x.name.startsWith('HK_'));
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
  // console.log('map1', map1);

  return Promise.all(map1).then((results) => results);
});

module.exports = { getAllCourses };
