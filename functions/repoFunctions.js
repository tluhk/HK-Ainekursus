/* eslint-disable max-len */

const baseUrl = 'https://api.github.com';
// Loen sisse repos.json faili, mis loeb demo_aine_repo asukohta githubis. Sinna on võimalik lisada ka teisi reposid.
const repos = require('../repos.json');
// Loen demo_aine_repo kausta rif20-valikpraktika-1 repost
const repoDemo = repos[0];

// Github API request endpoints
module.exports = {
  requestDocs: (
    (opt) => `${baseUrl}/repos/${repoDemo.owner}/${repoDemo.name}/${repoDemo.mainPath}/${repoDemo.subPath.docs}/${opt}.md?${repoDemo.branch}`
  ),
  requestLoengud: (
    (opt) => `${baseUrl}/repos/${repoDemo.owner}/${repoDemo.name}/${repoDemo.mainPath}/${repoDemo.subPath.docs}/${opt}/about.md?${repoDemo.branch}`
  ),
  requestConcepts: (
    (opt) => `${baseUrl}/repos/${repoDemo.owner}/${repoDemo.name}/${repoDemo.mainPath}/${repoDemo.subPath.concepts}/${opt}/about.md?${repoDemo.branch}`
  ),
  requestSources: (
    (opt) => `${baseUrl}/repos/${repoDemo.owner}/${repoDemo.name}/${repoDemo.mainPath}/${repoDemo.subPath.concepts}/${opt}/sources.json?${repoDemo.branch}`
  ),
  requestFiles: (
    (opt) => `${baseUrl}/repos/${repoDemo.owner}/${repoDemo.name}/${repoDemo.mainPath}/${repoDemo.subPath.files}/${opt}?${repoDemo.branch}`
  ),
};

// https://api.github.com/repos/owner/repo/contents/path

// https://github.com/tluhk/rif20-valikpraktika-1/raw/krister/demo_aine_repo/files/1.loeng.pptx
// (opt) => `${baseUrl}/${repoDemo.owner}/${repoDemo.name}/raw/${repoDemo.branch}/demo_aine_repo/${repoDemo.subPath.files}/${opt}`
