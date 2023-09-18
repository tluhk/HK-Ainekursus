const baseUrl = "https://api.github.com";

// Github API request endpoints
const githubReposRequests = {
  requestRepos: `${baseUrl}/orgs/tluhk/repos`,
  requestTeamCourses: (teamSlug) =>
    `${baseUrl}/orgs/tluhk/teams/${teamSlug}/repos`,
  requestRepoBranches: (coursePathInGithub) =>
    `${baseUrl}/repos/${coursePathInGithub}/branches`,
  // config
  requestConfig:
    /**
     * if refBranch is provided:
     * - check if repo has branch with same name
     * if yes, get the config from that branch
     * if not, get the config from main branch
     */
    (coursePathInGithub, refBranch) =>
      `${baseUrl}/repos/${coursePathInGithub}/contents/config.js?ref=${refBranch}`,
  // docs related
  requestDocs: (coursePathInGithub, refBranch) =>
    `${baseUrl}/repos/${coursePathInGithub}/contents/docs/about.md?ref=${refBranch}`,
  requestCourseAdditionalMaterials: (coursePathInGithub, refBranch) =>
    `${baseUrl}/repos/${coursePathInGithub}/contents/docs/lisamaterjalid.md?ref=${refBranch}`,
  requestCourseFiles: (coursePathInGithub, refBranch) =>
    `${baseUrl}/repos/${coursePathInGithub}/contents/docs/files?ref=${refBranch}`,
  // lessons related
  requestLessons: (coursePathInGithub, opt, refBranch) =>
    `${baseUrl}/repos/${coursePathInGithub}/contents/lessons/${opt}/about.md?ref=${refBranch}`,
  requestLessonAdditionalMaterials: (coursePathInGithub, opt, refBranch) =>
    `${baseUrl}/repos/${coursePathInGithub}/contents/lessons/${opt}/lisamaterjalid.md?ref=${refBranch}`,
  requestLessonFiles: (coursePathInGithub, opt, refBranch) =>
    `${baseUrl}/repos/${coursePathInGithub}/contents/lessons/${opt}/files?ref=${refBranch}`,
  // concepts related
  requestConcepts: (coursePathInGithub, opt, refBranch) =>
    `${baseUrl}/repos/${coursePathInGithub}/contents/concepts/${opt}/about.md?ref=${refBranch}`,
  requestSources: (coursePathInGithub, opt, refBranch) =>
    `${baseUrl}/repos/${coursePathInGithub}/contents/concepts/${opt}/sources.json?ref=${refBranch}`,
  requestStaticURL: (coursePathInGithub, opt, refBranch) =>
    `${baseUrl}/repos/${coursePathInGithub}/contents/concepts/${opt}/images?ref=${refBranch}`,
  // practices related
  requestPractices: (coursePathInGithub, opt, refBranch) =>
    `${baseUrl}/repos/${coursePathInGithub}/contents/practices/${opt}/about.md?ref=${refBranch}`,
  // images related
  requestImgURL: (coursePathInGithub, path, url, refBranch) => {
    if (path.type === "docs")
      return `${baseUrl}/repos/${coursePathInGithub}/contents/docs/${url}?ref=${refBranch}`;
    if (path.type === "concept")
      return `${baseUrl}/repos/${coursePathInGithub}/contents/concepts/${path.componentSlug}/${url}?ref=${refBranch}`;
    if (path.type === "practice")
      return `${baseUrl}/repos/${coursePathInGithub}/contents/practices/${path.componentSlug}/${url}?ref=${refBranch}`;
    return "";
  },
};

export default githubReposRequests;
