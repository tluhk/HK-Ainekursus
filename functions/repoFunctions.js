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
    (opt) => `${baseUrl}/repos/${repoDemo.owner}/${repoDemo.name}/${repoDemo.mainPath}/${repoDemo.subPath.docs}/loeng_01/files/${opt}?${repoDemo.branch}`
    /*
    curl -H 'Authorization: Bearer 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 ' -H 'Accept: application/vnd.github.v3.raw' -O -L https://api.github.com/repos/tluhk/rif20-valikpraktika-1/contents/demo_aine_repo/docs/loeng_01/files/1.loeng.pdf?ref=krister */
  ),
};
