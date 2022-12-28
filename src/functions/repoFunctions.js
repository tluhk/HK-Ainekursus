/* eslint-disable max-len */

const baseUrl = 'https://api.github.com';
// Loen sisse repos.json faili, mis loeb demo_aine_repo asukohta githubis. Sinna on võimalik lisada ka teisi reposid.

// Github API request endpoints
module.exports = {
  requestCourses: 'https://api.github.com/orgs/tluhk/repos',
  // config
  requestConfig: (
    (coursePathInGithub) => `${baseUrl}/repos/${coursePathInGithub}/contents/config.json`
  ),
  // docs related
  requestDocs: (
    (coursePathInGithub) => `${baseUrl}/repos/${coursePathInGithub}/contents/docs/about.md`
  ),
  requestCourseAdditionalMaterials: (
    (coursePathInGithub) => `${baseUrl}/repos/${coursePathInGithub}/contents/docs/lisamaterjalid.md`
  ),
  requestCourseFiles: (
    (coursePathInGithub) => `${baseUrl}/repos/${coursePathInGithub}/contents/docs/files`
  ),
  // lessons related
  requestLessons: (
    (coursePathInGithub, opt) => `${baseUrl}/repos/${coursePathInGithub}/contents/lessons/${opt}/about.md`
  ),
  requestLessonAdditionalMaterials: (
    (coursePathInGithub, opt) => `${baseUrl}/repos/${coursePathInGithub}/contents/lessons/${opt}/lisamaterjalid.md`
  ),
  requestLessonFiles: (
    (coursePathInGithub, opt) => `${baseUrl}/repos/${coursePathInGithub}/contents/lessons/${opt}/files`
  ),
  // concepts related
  requestConcepts: (
    (coursePathInGithub, opt) => `${baseUrl}/repos/${coursePathInGithub}/contents/concepts/${opt}/about.md`
  ),
  requestSources: (
    (coursePathInGithub, opt) => `${baseUrl}/repos/${coursePathInGithub}/contents/concepts/${opt}/sources.json`
  ),
  requestStaticURL: (
    (coursePathInGithub, opt) => `${baseUrl}/repos/${coursePathInGithub}/contents/concepts/${opt}/images`
  ),
  // practices related
  requestPractices: (
    (coursePathInGithub, opt) => `${baseUrl}/repos/${coursePathInGithub}/contents/practices/${opt}/about.md`
  ),
};
