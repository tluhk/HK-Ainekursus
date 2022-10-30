/* eslint-disable max-len */

const baseUrl = 'https://api.github.com';
// Loen sisse repos.json faili, mis loeb demo_aine_repo asukohta githubis. Sinna on võimalik lisada ka teisi reposid.
const repoDemo = require('../repos.json');

// Github API request endpoints
module.exports = {
  requestCourses: 'https://api.github.com/orgs/tluhk/repos',
  requestConfig: (
    (repoPath) => `${baseUrl}/repos/${repoPath}/${repoDemo.mainPath}/config.json`
  ),
  requestDocs: (
    (opt) => `${baseUrl}/repos/${repoDemo.name}/${repoDemo.mainPath}/${repoDemo.subPath.docs}/${opt}.md`
  ),
  requestLoengud: (
    (opt) => `${baseUrl}/repos/${repoDemo.name}/${repoDemo.mainPath}/${repoDemo.subPath.docs}/${opt}/about.md`
  ),
  requestConcepts: (
    (opt) => `${baseUrl}/repos/${repoDemo.name}/${repoDemo.mainPath}/${repoDemo.subPath.concepts}/${opt}/about.md`
  ),
  requestSources: (
    (opt) => `${baseUrl}/repos/${repoDemo.name}/${repoDemo.mainPath}/${repoDemo.subPath.concepts}/${opt}/sources.json`
  ),
  requestStaticURL: (
    (opt) => `${baseUrl}/repos/${repoDemo.name}/${repoDemo.mainPath}/${repoDemo.subPath.concepts}/${opt}`
  ),
  /* requestFiles: (
    (opt) => `${baseUrl}/repos/${repoDemo.owner}/${repoDemo.name}/${repoDemo.mainPath}/${repoDemo.subPath.docs}/loeng_01/files/${opt}`
    /*
    curl -H 'Authorization: Bearer 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 ' -H 'Accept: application/vnd.github.v3.raw' -O -L https://api.github.com/repos/tluhk/rif20-valikpraktika-1/contents/demo_aine_repo/docs/loeng_01/files/1.loeng.pdf?ref=krister */
};
