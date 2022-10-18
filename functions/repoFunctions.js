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
};
