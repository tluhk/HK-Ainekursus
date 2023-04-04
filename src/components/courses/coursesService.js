/* eslint-disable max-len */

import axios from 'axios';

import cache from '../../setup/setupCache';

import githubReposRequests from '../../functions/githubReposRequests';

import { authToken } from '../../setup/setupGithub';
import getConfig from '../../functions/getConfigFuncs';

const {
  requestDocs,
  requestCourseAdditionalMaterials,
  requestCourseFiles,
  requestLessons,
  requestLessonAdditionalMaterials,
  requestLessonFiles,
  requestConcepts,
  requestSources,
  requestPractices,
  requestRepoBranches,
} = githubReposRequests;

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
      console.log(`❌❌ branches IS NOT from cache: ${routePath}`);

      const branchesRaw = await axios.get(requestRepoBranches(coursePathInGithub), authToken);

      branches = branchesRaw.data.map((branch) => branch.name);
      // console.log('coursePathInGithub5:', coursePathInGithub);
      // console.log('truebranches5:', branches);

      const branchPromises = await branches.reduce((acc, branch) => {
        acc[branch] = getConfig(coursePathInGithub, branch);
        return acc;
      }, {});

      // console.log('branchPromises5:', branchPromises);

      const activeBranchesRaw = await Promise.all(Object.entries(branchPromises).map(([key, promise]) => promise.then((value) => [key, value])))
        .then((resolvedArr) => {
          const resolvedObj = Object.fromEntries(resolvedArr);
          // console.log('resolvedObj5:', resolvedObj);
          const response = Object.entries(resolvedObj).filter(([key, value]) => value.active);
          return response;
        })
        .catch((error) => {
          console.error(error); // handle error
        });

      // console.log('branchesWithConfig5:', branchesWithConfig);

      // const activeBranchesRaw = Object.entries(branchesWithConfig).filter(([key, value]) => value.active);

      if (!activeBranchesRaw) return [];

      activeBranches = activeBranchesRaw.map((x) => x[0]);

      // console.log('coursePathInGithub1:', coursePathInGithub);
      // console.log('activeBranchesRaw0:', activeBranchesRaw);
      // console.log('activeBranches0:', activeBranches);

      cache.set(routePath, activeBranches);
    } else {
      console.log(`✅✅ branches FROM CACHE: ${routePath}`);
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
      refBranch,
    } = locals;

    // console.log('refBranch8:', refBranch);

    const routePath = `${request.url}+${refBranch}+components`;

    let components;

    if (!cache.has(routePath)) {
      console.log(`❌❌ docs components IS NOT from cache: ${routePath}`);
      components = await axios.get(requestDocs(coursePathInGithub, refBranch), authToken);

      cache.set(routePath, components);
    } else {
      console.log(`✅✅ docs components FROM CACHE: ${routePath}`);
      components = cache.get(routePath);
    }

    return { components };
  },
  courseAdditionalMaterialsService: async (locals, request) => {
    const {
      coursePathInGithub,
    } = locals.course;
    const {
      refBranch,
    } = locals;

    // console.log('refBranch8:', refBranch);

    const routePath = `${request.url}+${refBranch}+components`;
    const routePathFiles = `${request.url}+${refBranch}+files`;

    let components;
    let files;

    if (!cache.get(routePath) || !cache.get(routePathFiles)) {
      console.log(`❌❌ courseAdditionalMaterials components IS NOT from cache: ${routePath}`);
      console.log(`❌❌ courseAdditionalMaterials files IS NOT from cache: ${routePathFiles}`);

      const componentsRaw = await axios.get(requestCourseAdditionalMaterials(coursePathInGithub, refBranch), authToken);
      // Github raw download_url juhend:
      // https://stackoverflow.com/questions/73819136/how-do-i-get-and-download-the-contents-of-a-file-in-github-using-the-rest-api/73824136
      //  Download_url token muutub iga 7 päeva tagant Githubi poolt: https://github.com/orgs/community/discussions/23845#discussioncomment-3241866
      const filesRaw = await axios.get(requestCourseFiles(coursePathInGithub, refBranch), authToken);

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
          console.error(error);
        });
    } else {
      console.log(`✅✅ courseAdditionalMaterials components FROM CACHE: ${routePath}`);
      console.log(`✅✅ courseAdditionalMaterials files FROM CACHE: ${routePathFiles}`);
      components = cache.get(routePath);
      files = cache.get(routePathFiles);
      // console.log('Cachecomponents2:', components);
      // console.log('CacheFiles2:', files);
    }

    // console.log('components2:', components);
    // console.log('files2:', files);

    return { components, files };
  },
  lessonsService: async (locals, request) => {
    const {
      coursePathInGithub,
    } = locals.course;
    const {
      path,
      refBranch,
    } = locals;

    // console.log('refBranch8:', refBranch);

    const routePath = `${request.url}+${refBranch}+components`;

    let components;

    if (!cache.get(routePath)) {
      console.log(`❌❌ lessons components IS NOT from cache: ${routePath}`);

      components = await axios.get(requestLessons(coursePathInGithub, `${path.contentSlug}`, refBranch), authToken);

      cache.set(routePath, components);
    } else {
      console.log(`✅✅ lessons components FROM CACHE: ${routePath}`);

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
      refBranch,
    } = locals;

    const routePath = `${request.url}+${refBranch}+components`;
    const routePathFiles = `${request.url}+${refBranch}+files`;

    let components;
    let files;

    if (!cache.get(routePath) || !cache.get(routePathFiles)) {
      console.log(`❌❌ lessonAdditionalMaterials components IS NOT from cache: ${routePath}`);
      console.log(`❌❌ lessonAdditionalMaterials files IS NOT from cache: ${routePathFiles}`);

      const componentsRaw = await axios.get(requestLessonAdditionalMaterials(coursePathInGithub, `${path.contentSlug}`, refBranch), authToken);
      // Github raw download_url juhend:
      // https://stackoverflow.com/questions/73819136/how-do-i-get-and-download-the-contents-of-a-file-in-github-using-the-rest-api/73824136
      // Download_url token muutub iga 7 päeva tagant Githubi poolt: https://github.com/orgs/community/discussions/23845#discussioncomment-3241866
      const filesRaw = await axios.get(requestLessonFiles(coursePathInGithub, `${path.contentSlug}`, refBranch), authToken);

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
          console.error(error);
        });
    } else {
      console.log(`✅✅ lessonAdditionalMaterials components FROM CACHE: ${routePath}`);
      console.log(`✅✅ lessonAdditionalMaterials files FROM CACHE: ${routePathFiles}`);
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
      refBranch,
    } = locals;

    // ('refBranch8:', refBranch);

    const routePath = `${request.url}+${refBranch}+components`;
    const routePathSources = `${request.url}+${refBranch}+sources`;

    let components;
    let sources;

    if (path.type === 'concept') {
      if (!cache.get(routePath) || !cache.get(routePathSources)) {
        console.log(`❌❌ concept components IS NOT from cache: ${routePath}`);
        console.log(`❌❌ concept sources IS NOT from cache: ${routePathSources}`);
        const componentsRaw = await axios.get(requestConcepts(coursePathInGithub, `${path.componentSlug}`, refBranch), authToken);
        const sourcesRaw = await axios.get(requestSources(coursePathInGithub, `${path.componentSlug}`, refBranch), authToken);

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
            console.error(error);
          });
      } else {
        console.log(`✅✅ concept components FROM CACHE: ${routePath}`);
        console.log(`✅✅ concept sources FROM CACHE: ${routePathSources}`);
        components = cache.get(routePath);
        sources = cache.get(routePathSources);
      }
    }

    if (path.type === 'practice') {
      if (!cache.get(routePath)) {
        console.log(`❌❌ practice components IS NOT from cache: ${routePath}`);
        components = await axios.get(requestPractices(coursePathInGithub, `${path.componentSlug}`, refBranch), authToken);

        cache.set(routePath, components);
      } else {
        console.log(`✅✅ practice components FROM CACHE: ${routePath}`);
        components = cache.get(routePath);
      }
    }

    return { components, sources };
  },
};

export default apiRequests;
