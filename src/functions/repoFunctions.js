/* eslint-disable max-len */

const baseUrl = 'https://api.github.com';
// Loen sisse repos.json faili, mis loeb demo_aine_repo asukohta githubis. Sinna on võimalik lisada ka teisi reposid.
const repoDemo = require('../repos.json');

// Github API request endpoints
module.exports = {
  requestCourses: 'https://api.github.com/orgs/tluhk/repos',
  requestConfig: (
    (coursePathInGithub) => `${baseUrl}/repos/${coursePathInGithub}/${repoDemo.mainPath}/config.json`
  ),
  requestDocs: (
    (coursePathInGithub, opt) => `${baseUrl}/repos/${coursePathInGithub}/${repoDemo.mainPath}/${repoDemo.subPath.docs}/${opt}.md`
  ),
  requestCourseAdditionalMaterials: (
    (coursePathInGithub, opt) => `${baseUrl}/repos/${coursePathInGithub}/${repoDemo.mainPath}/${repoDemo.subPath.docs}/${opt}/about.md`
  ),
  requestLoengud: (
    (coursePathInGithub, opt) => `${baseUrl}/repos/${coursePathInGithub}/${repoDemo.mainPath}/${repoDemo.subPath.docs}/${opt}/about.md`
  ),
  requestLessonAdditionalMaterials: (
    (coursePathInGithub, opt) => `${baseUrl}/repos/${coursePathInGithub}/${repoDemo.mainPath}/${repoDemo.subPath.docs}/${opt}/lisamaterjalid/about.md`
  ),
  requestConcepts: (
    (coursePathInGithub, opt) => `${baseUrl}/repos/${coursePathInGithub}/${repoDemo.mainPath}/${repoDemo.subPath.concepts}/${opt}/about.md`
  ),
  requestSources: (
    (coursePathInGithub, opt) => `${baseUrl}/repos/${coursePathInGithub}/${repoDemo.mainPath}/${repoDemo.subPath.concepts}/${opt}/sources.json`
  ),
  requestStaticURL: (
    (coursePathInGithub, opt) => `${baseUrl}/repos/${coursePathInGithub}/${repoDemo.mainPath}/${repoDemo.subPath.concepts}/${opt}/images`
  ),
  requestFiles: (
    (coursePathInGithub, opt) => `${baseUrl}/repos/${coursePathInGithub}/${repoDemo.mainPath}/${repoDemo.subPath.docs}/${opt}/files`
  ),
  /* requestFiles: (
    (opt) => `${baseUrl}/repos/${repoDemo.owner}/${repoDemo.name}/${repoDemo.mainPath}/${repoDemo.subPath.docs}/loeng_01/files/${opt}`
    /*
    curl -H 'Authorization: Bearer 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 ' -H 'Accept: application/vnd.github.v3.raw' -O -L https://api.github.com/repos/tluhk/rif20-valikpraktika-1/contents/demo_aine_repo/docs/loeng_01/files/1.loeng.pdf?ref=krister */
};
