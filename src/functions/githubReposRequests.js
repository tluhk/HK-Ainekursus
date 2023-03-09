/* eslint-disable max-len */

const baseUrl = 'https://api.github.com';

// Github API request endpoints
module.exports = {
  requestRepos: 'https://api.github.com/orgs/tluhk/repos',
  requestTeamCourses: (
    (teamSlug) => `${baseUrl}/orgs/tluhk/teams/${teamSlug}/repos`
  ),
  requestRepoBranches: (
    (coursePathInGithub) => `${baseUrl}/repos/${coursePathInGithub}/branches`
  ),
  // config
  requestConfig: (
    /**
     * if usrefBrancher is provided:
     * - check if repo has branch with same name
     * if yes, get the config from that branch
     * if not, get the config from main branch
     */
    // console.log('team2:', team);
    // console.log('refBranch2:', refBranch);
    (coursePathInGithub, refBranch) => `${baseUrl}/repos/${coursePathInGithub}/contents/config.json?${refBranch}`
  ),
  // docs related
  requestDocs: (
    (coursePathInGithub, refBranch) => `${baseUrl}/repos/${coursePathInGithub}/contents/docs/about.md?${refBranch}`
  ),
  requestCourseAdditionalMaterials: (
    (coursePathInGithub, refBranch) => `${baseUrl}/repos/${coursePathInGithub}/contents/docs/lisamaterjalid.md?${refBranch}`
  ),
  requestCourseFiles: (
    (coursePathInGithub, refBranch) => `${baseUrl}/repos/${coursePathInGithub}/contents/docs/files?${refBranch}`
  ),
  // lessons related
  requestLessons: (
    (coursePathInGithub, opt, refBranch) => `${baseUrl}/repos/${coursePathInGithub}/contents/lessons/${opt}/about.md?${refBranch}`
  ),
  requestLessonAdditionalMaterials: (
    (coursePathInGithub, opt, refBranch) => `${baseUrl}/repos/${coursePathInGithub}/contents/lessons/${opt}/lisamaterjalid.md?${refBranch}`
  ),
  requestLessonFiles: (
    (coursePathInGithub, opt, refBranch) => `${baseUrl}/repos/${coursePathInGithub}/contents/lessons/${opt}/files?${refBranch}`
  ),
  // concepts related
  requestConcepts: (
    (coursePathInGithub, opt, refBranch) => `${baseUrl}/repos/${coursePathInGithub}/contents/concepts/${opt}/about.md?${refBranch}`
  ),
  requestSources: (
    (coursePathInGithub, opt, refBranch) => `${baseUrl}/repos/${coursePathInGithub}/contents/concepts/${opt}/sources.json?${refBranch}`
  ),
  requestStaticURL: (
    (coursePathInGithub, opt, refBranch) => `${baseUrl}/repos/${coursePathInGithub}/contents/concepts/${opt}/images?${refBranch}`
  ),
  // practices related
  requestPractices: (
    (coursePathInGithub, opt, refBranch) => `${baseUrl}/repos/${coursePathInGithub}/contents/practices/${opt}/about.md?${refBranch}`
  ),
  // images related
  requestImgURL: (
    (coursePathInGithub, path, url, refBranch) => {
      if (path.type === 'docs') return `${baseUrl}/repos/${coursePathInGithub}/contents/docs/${url}?${refBranch}`;
      if (path.type === 'concept') return `${baseUrl}/repos/${coursePathInGithub}/contents/concepts/${path.componentSlug}/${url}?${refBranch}`;
      if (path.type === 'practice') return `${baseUrl}/repos/${coursePathInGithub}/contents/practices/${path.componentSlug}/${url}?${refBranch}`;
    }
  ),
};
