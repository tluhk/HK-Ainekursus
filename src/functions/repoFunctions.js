/* eslint-disable max-len */

const baseUrl = 'https://api.github.com';
// Loen sisse repos.json faili, mis loeb demo_aine_repo asukohta githubis. Sinna on võimalik lisada ka teisi reposid.
const repo = require('../repos.json');

// Github API request endpoints
module.exports = {
  requestCourses: 'https://api.github.com/orgs/tluhk/repos',
  requestConfig: (
    (coursePathInGithub) => `${baseUrl}/repos/${coursePathInGithub}/contents/config.json`
  ),
  requestDocs: (
    (coursePathInGithub, opt) => `${baseUrl}/repos/${coursePathInGithub}/contents/${repo.subPath.docs}/${opt}.md`
  ),
  requestCourseAdditionalMaterials: (
    (coursePathInGithub) => `${baseUrl}/repos/${coursePathInGithub}/contents/${repo.subPath.docs}/lisamaterjalid.md`
  ),
  requestLoengud: (
    (coursePathInGithub, opt) => `${baseUrl}/repos/${coursePathInGithub}/contents/${repo.subPath.docs}/${opt}/about.md`
  ),
  requestLessonAdditionalMaterials: (
    (coursePathInGithub, opt) => `${baseUrl}/repos/${coursePathInGithub}/contents/${repo.subPath.docs}/${opt}/lisamaterjalid.md`
  ),
  requestConcepts: (
    (coursePathInGithub, opt) => `${baseUrl}/repos/${coursePathInGithub}/contents/${repo.subPath.concepts}/${opt}/about.md`
  ),
  requestSources: (
    (coursePathInGithub, opt) => `${baseUrl}/repos/${coursePathInGithub}/contents/${repo.subPath.concepts}/${opt}/sources.json`
  ),
  requestStaticURL: (
    (coursePathInGithub, opt) => `${baseUrl}/repos/${coursePathInGithub}/contents/${repo.subPath.concepts}/${opt}/images`
  ),
  requestCourseFiles: (
    (coursePathInGithub) => `${baseUrl}/repos/${coursePathInGithub}/contents/${repo.subPath.docs}/files`
  ),
  requestLessonFiles: (
    (coursePathInGithub, opt) => `${baseUrl}/repos/${coursePathInGithub}/contents/${repo.subPath.docs}/${opt}/files`
  ),
  /* requestFiles: (
    (opt) => `${baseUrl}/repos/${repo.owner}/${repo.name}/contents/${repo.subPath.docs}/loeng_01/files/${opt}`
    /*
    curl -H 'Authorization: Bearer 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 ' -H 'Accept: application/vnd.github.v3.raw' -O -L https://api.github.com/repos/tluhk/rif20-valikpraktika-1/contents/demo_aine_repo/docs/loeng_01/files/1.loeng.pdf?ref=krister */
};