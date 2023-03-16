/* eslint-disable max-len */

const { default: axios } = require('axios');

const { cache } = require('../../setup/setupCache');

const {
  requestDocs, requestCourseAdditionalMaterials, requestCourseFiles, requestLessons, requestLessonAdditionalMaterials, requestLessonFiles, requestConcepts, requestSources, requestPractices, requestRepoBranches,
} = require('../../functions/githubReposRequests');
const { authToken } = require('../../setup/setupGithub');
const { getConfig } = require('../../functions/getConfigFuncs');

console.log('typeof getConfig2:', typeof getConfig);
console.log('typeof requestRepoBranches2:', typeof requestRepoBranches);

/**
 * Define files to ignore from /files folders
 */
const ignoreFiles = ['.DS_Store', '.gitkeep'];

/**
 * Define all API requests that are done to GitHub API
 */
const apiRequests = {
  activeBranchesService: async (coursePathInGithub) => {
    const routePath = `${coursePathInGithub}+branches`;
    /**
     * Get list of repo branches
     * Then validate branches where config has active:true
     * Pass only those branches as array
     */

    let branches;
    let activeBranches;

    if (!cache.has(routePath)) {
      const branchesRaw = await axios.get(requestRepoBranches(coursePathInGithub), authToken);

      branches = branchesRaw.data.map((branch) => branch.name);
      console.log('coursePathInGithub5:', coursePathInGithub);
      console.log('truebranches5:', branches);

      const branchPromises = await branches.reduce((acc, branch) => {
        acc[branch] = getConfig(coursePathInGithub, branch);
        return acc;
      }, {});

      console.log('branchPromises5:', branchPromises);

      const branchesWithConfig = await Promise.all(Object.entries(branchPromises).map(([key, promise]) => promise.then((value) => [key, value])))
        .then((resolvedArr) => {
          const resolvedObj = Object.fromEntries(resolvedArr);
          console.log('resolvedObj5:', resolvedObj);
          return resolvedObj;
        })
        .catch((error) => {
          console.log(error); // handle error
        });

      // console.log('branchesWithConfig5:', branchesWithConfig);
      // if (config.active) return branch;
      const activeBranchesRaw = Object.entries(branchesWithConfig).filter(([key, value]) => value.active);

      activeBranches = activeBranchesRaw.map((x) => x[0]);

      console.log('coursePathInGithub1:', coursePathInGithub);
      // console.log('activeBranchesRaw1:', activeBranchesRaw);
      console.log('activeBranches1:', activeBranches);

      cache.set(routePath, activeBranches);
    } else {
      // console.log('taken from cache');
      activeBranches = cache.get(routePath);
      // console.log('Cachecomponents2:', components);
    }

    return activeBranches;
  },
  docsService: async (locals, request) => {
    const {
      coursePathInGithub,
    } = locals.course;
    const {
      selectedVersion,
      teamSlug,
      refBranch,
    } = locals;

    let branch;
    if (refBranch) {
      branch = refBranch;
    } else branch = 'master';

    console.log('branch8:', branch);

    let routePath;
    if (selectedVersion) {
      routePath = `${request.url}+components+version+${selectedVersion}`;
    } else if (teamSlug) {
      routePath = `${request.url}+components+team+${teamSlug}`;
    } else {
      routePath = `${request.url}+components`;
    }

    // console.log('routePath2:', routePath);

    let components;

    if (!cache.has(routePath)) {
      components = await axios.get(requestDocs(coursePathInGithub, branch), authToken);

      // console.log('Axioscomponents1:', components);
      cache.set(routePath, components);
    } else {
      // console.log('taken from cache');
      components = cache.get(routePath);
      // console.log('Cachecomponents2:', components);
    }

    return { components };
  },
  courseAdditionalMaterialsService: async (locals, request) => {
    const {
      coursePathInGithub,
    } = locals.course;
    const {
      selectedVersion,
      teamSlug,
      refBranch,
    } = locals;

    let routePath;
    if (selectedVersion) {
      routePath = `${request.url}+components+version+${selectedVersion}`;
    } else if (teamSlug) {
      routePath = `${request.url}+components+team+${teamSlug}`;
    } else {
      routePath = `${request.url}+components`;
    }
    let routePathFiles;
    if (selectedVersion) {
      routePathFiles = `${request.url}+files+version+${selectedVersion}`;
    } else if (teamSlug) {
      routePathFiles = `${request.url}+files+team+${teamSlug}`;
    } else {
      routePathFiles = `${request.url}+files`;
    }

    let components;
    let files;

    let branch;
    if (refBranch) {
      branch = refBranch;
    } else branch = 'master';

    if (!cache.get(routePath) || !cache.get(routePathFiles)) {
      const componentsRaw = await axios.get(requestCourseAdditionalMaterials(coursePathInGithub, branch), authToken);
      // Github raw download_url juhend:
      // https://stackoverflow.com/questions/73819136/how-do-i-get-and-download-the-contents-of-a-file-in-github-using-the-rest-api/73824136
      //  Download_url token muutub iga 7 päeva tagant Githubi poolt: https://github.com/orgs/community/discussions/23845#discussioncomment-3241866
      const filesRaw = await axios.get(requestCourseFiles(coursePathInGithub), authToken);

      await axios
        .all([componentsRaw, filesRaw])
        .then(
          axios.spread((...responses) => {
            [components, files] = responses;
            files = responses[1].data.filter((x) => !ignoreFiles.includes(x.name));

            // console.log('files1:', files);

            cache.set(routePath, components);
            cache.set(routePathFiles, files);
          }),
        )
        .catch((error) => {
          console.log('siin on addMat error');
          console.error(error);
        });
    } else {
      // console.log('taken from cache');
      components = cache.get(routePath);
      files = cache.get(routePathFiles);
      // console.log('Cachecomponents2:', components);
      // console.log('CacheFiles2:', files);
    }

    return { components, files };
  },
  lessonsService: async (locals, request) => {
    const {
      coursePathInGithub,
    } = locals.course;
    const {
      path,
      selectedVersion,
      teamSlug,
      refBranch,
    } = locals;

    let routePath;
    if (selectedVersion) {
      routePath = `${request.url}+components+version+${selectedVersion}`;
    } else if (teamSlug) {
      routePath = `${request.url}+components+team+${teamSlug}`;
    } else {
      routePath = `${request.url}+components`;
    }

    let components;

    let branch;
    if (refBranch) {
      branch = refBranch;
    } else branch = 'master';

    if (!cache.get(routePath)) {
      components = await axios.get(requestLessons(coursePathInGithub, `${path.contentSlug}`, branch), authToken);

      cache.set(routePath, components);
    } else {
      components = cache.get(routePath);
    }

    return { components };
  },
  lessonAdditionalMaterialsService: async (locals, request) => {
    const {
      coursePathInGithub,
    } = locals.course;
    const {
      path,
      selectedVersion,
      teamSlug,
      refBranch,
    } = locals;

    let routePath;
    if (selectedVersion) {
      routePath = `${request.url}+components+version+${selectedVersion}`;
    } else if (teamSlug) {
      routePath = `${request.url}+components+team+${teamSlug}`;
    } else {
      routePath = `${request.url}+components`;
    }
    let routePathFiles;
    if (selectedVersion) {
      routePathFiles = `${request.url}+files+version+${selectedVersion}`;
    } else if (teamSlug) {
      routePathFiles = `${request.url}+files+team+${teamSlug}`;
    } else {
      routePathFiles = `${request.url}+files`;
    }

    let components;
    let files;

    let branch;
    if (refBranch) {
      branch = refBranch;
    } else branch = 'master';

    if (!cache.get(routePath) || !cache.get(routePathFiles)) {
      const componentsRaw = await axios.get(requestLessonAdditionalMaterials(coursePathInGithub, `${path.contentSlug}`, branch), authToken);
      // Github raw download_url juhend:
      // https://stackoverflow.com/questions/73819136/how-do-i-get-and-download-the-contents-of-a-file-in-github-using-the-rest-api/73824136
      // Download_url token muutub iga 7 päeva tagant Githubi poolt: https://github.com/orgs/community/discussions/23845#discussioncomment-3241866
      const filesRaw = await axios.get(requestLessonFiles(coursePathInGithub, `${path.contentSlug}`, branch), authToken);

      await axios
        .all([componentsRaw, filesRaw])
        .then(
          axios.spread((...responses) => {
            [components, files] = responses;
            files = responses[1].data.filter((x) => !ignoreFiles.includes(x.name));

            cache.set(routePath, components);
            cache.set(routePathFiles, files);
          }),
        )
        .catch((error) => {
          console.log('siin on addMat error');
          console.error(error);
        });
    } else {
      components = cache.get(routePath);
      files = cache.get(routePathFiles);
    }

    return { components, files };
  },
  lessonComponentsService: async (locals, request) => {
    const {
      coursePathInGithub,
    } = locals.course;
    const {
      path,
      selectedVersion,
      teamSlug,
      refBranch,
    } = locals;

    let routePath;
    if (selectedVersion) {
      routePath = `${request.url}+components+version+${selectedVersion}`;
    } else if (teamSlug) {
      routePath = `${request.url}+components+team+${teamSlug}`;
    } else {
      routePath = `${request.url}+components`;
    }
    let routePathSources;
    if (selectedVersion) {
      routePathSources = `${request.url}+sources+version+${selectedVersion}`;
    } else if (teamSlug) {
      routePathSources = `${request.url}+sources+team+${teamSlug}`;
    } else {
      routePathSources = `${request.url}+sources`;
    }

    let components;
    let sources;

    let branch;
    if (refBranch) {
      branch = refBranch;
    } else branch = 'master';

    if (path.type === 'concept') {
      if (!cache.get(routePath) || !cache.get(routePathSources)) {
        const componentsRaw = await axios.get(requestConcepts(coursePathInGithub, `${path.componentSlug}`, branch), authToken);
        const sourcesRaw = await axios.get(requestSources(coursePathInGithub, `${path.componentSlug}`, branch), authToken);

        await axios
          .all([componentsRaw, sourcesRaw])
          .then(
            axios.spread((...responses) => {
              [components, sources] = responses;

              cache.set(routePath, components);
              cache.set(routePathSources, sources);
            }),
          )
          .catch((error) => {
            console.log('siin on addMat error');
            console.error(error);
          });
      } else {
        components = cache.get(routePath);
        sources = cache.get(routePathSources);
      }
    }

    if (path.type === 'practice') {
      if (!cache.get(routePath) || !cache.get(routePathSources)) {
        components = await axios.get(requestPractices(coursePathInGithub, `${path.componentSlug}`, branch), authToken);

        cache.set(routePath, components);
      } else {
        components = cache.get(routePath);
      }
    }

    return { components, sources };
  },
};

module.exports = { apiRequests };
