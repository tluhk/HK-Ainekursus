import axios from "axios";
import {
  cacheBranches,
  cacheFiles,
  cachePageContent,
} from "../../setup/setupCache.js";
import githubReposRequests from "../../functions/githubReposRequests.js";
import { authToken } from "../../setup/setupGithub.js";
import getConfig from "../../functions/getConfigFuncs.js";

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
 * Define files to ignore from Github /files folders
 */
const ignoreFiles = [".DS_Store", ".gitkeep"];

/**
 * Define all API requests that are done to GitHub API
 */
const apiRequests = {
  validBranchesService: async (coursePathInGithub) => {
    const routePath = `${coursePathInGithub}+branches`;
    /**
     * Get list of repo branches
     * Then validate branches where config has active:true
     * Pass only those branches as array
     */

    let branches;
    let validBranches;

    if (!cacheBranches.has(routePath)) {
      console.log(`❌❌ branches IS NOT from cache: ${routePath}`);

      const branchesRaw = await axios.get(
        requestRepoBranches(coursePathInGithub),
        authToken,
      );

      branches = branchesRaw.data.map((branch) => branch.name);

      const branchPromises = await branches.reduce((acc, branch) => {
        /** IF CONFIG IS BROKEN (doesn't pass validation), the branch is not considered either! */
        acc[branch] = getConfig(coursePathInGithub, branch);
        return acc;
      }, {});

      const validBranchesRaw = await Promise.all(
        Object.entries(branchPromises).map(([key, promise]) =>
          promise.then((value) => [key, value]),
        ),
      )
        .then((resolvedArr) => {
          const resolvedObj = Object.fromEntries(resolvedArr);
          return Object.entries(resolvedObj).filter(
            ([, value]) => value.active,
          );
        })
        .catch((error) => {
          console.error(error); // handle error
        });

      if (!validBranchesRaw) return [];

      validBranches = validBranchesRaw.map((x) => x[0]);

      cacheBranches.set(routePath, validBranches);
    } else {
      console.log(`✅✅ branches FROM CACHE: ${routePath}`);
      validBranches = cacheBranches.get(routePath);
    }

    return validBranches;
  },
  docsService: async (req, res) => {
    const { coursePathInGithub } = res.locals.course;
    const { refBranch } = res.locals;

    const routePath = `${req.url}+${refBranch}+components`;

    let components;

    if (!cachePageContent.has(routePath)) {
      console.log(`❌❌ docs components IS NOT from cache: ${routePath}`);
      components = await axios
        .get(requestDocs(coursePathInGithub, refBranch), authToken)
        .catch((err) => {
          console.log(`❌❌ get docs failed: ${routePath}`);
        });

      cachePageContent.set(routePath, components);
    } else {
      console.log(`✅✅ docs components FROM CACHE: ${routePath}`);
      components = cachePageContent.get(routePath);
    }

    return { components };
  },
  courseAdditionalMaterialsService: async (req, res) => {
    const { coursePathInGithub } = res.locals.course;
    const { refBranch } = res.locals;

    const routePath = `${req.url}+${refBranch}+components`;
    const routePathFiles = `${req.url}+${refBranch}+files`;

    let components;
    let files;

    if (!cachePageContent.get(routePath) || !cacheFiles.get(routePathFiles)) {
      console.log(
        `❌❌ courseAdditionalMaterials components IS NOT from cache: ${routePath}`,
      );
      console.log(
        `❌❌ courseAdditionalMaterials files IS NOT from cache: ${routePathFiles}`,
      );

      const componentsRaw = await axios.get(
        requestCourseAdditionalMaterials(coursePathInGithub, refBranch),
        authToken,
      );
      // Github raw download_url juhend:
      // https://stackoverflow.com/questions/73819136/how-do-i-get-and-download-the-contents-of-a-file-in-github-using-the-rest-api/73824136
      //  Download_url token muutub iga 7 päeva tagant Githubi poolt: https://github.com/orgs/community/discussions/23845#discussioncomment-3241866
      const filesRaw = await axios.get(
        requestCourseFiles(coursePathInGithub, refBranch),
        authToken,
      );

      await axios
        .all([componentsRaw, filesRaw])
        .then(
          axios.spread((...responses) => {
            [components, files] = responses;
            files = responses[1].data.filter(
              (x) => !ignoreFiles.includes(x.name),
            );
            cachePageContent.set(routePath, components);
            cacheFiles.set(routePathFiles, files);
          }),
        )
        .catch((error) => {
          console.error(error);
        });
    } else {
      console.log(
        `✅✅ courseAdditionalMaterials components FROM CACHE: ${routePath}`,
      );
      console.log(
        `✅✅ courseAdditionalMaterials files FROM CACHE: ${routePathFiles}`,
      );
      components = cachePageContent.get(routePath);
      files = cacheFiles.get(routePathFiles);
    }
    return { components, files };
  },
  lessonsService: async (req, res) => {
    const { coursePathInGithub } = res.locals.course;
    const { path, refBranch } = res.locals;

    const routePath = `${req.url}+${refBranch}+components`;
    let components;
    if (!cachePageContent.get(routePath)) {
      console.log(`❌❌ lessons components IS NOT from cache: ${routePath}`);
      components = await axios.get(
        requestLessons(coursePathInGithub, `${path.contentSlug}`, refBranch),
        authToken,
      );
      cachePageContent.set(routePath, components);
    } else {
      console.log(`✅✅ lessons components FROM CACHE: ${routePath}`);
      components = cachePageContent.get(routePath);
    }

    return { components };
  },
  lessonAdditionalMaterialsService: async (req, res) => {
    const { coursePathInGithub } = res.locals.course;
    const { path, refBranch } = res.locals;

    const routePath = `${req.url}+${refBranch}+components`;
    const routePathFiles = `${req.url}+${refBranch}+files`;

    let components;
    let files;

    if (!cachePageContent.get(routePath) || !cacheFiles.get(routePathFiles)) {
      console.log(
        `❌❌ lessonAdditionalMaterials components IS NOT from cache: ${routePath}`,
      );
      console.log(
        `❌❌ lessonAdditionalMaterials files IS NOT from cache: ${routePathFiles}`,
      );

      const componentsRaw = await axios.get(
        requestLessonAdditionalMaterials(
          coursePathInGithub,
          `${path.contentSlug}`,
          refBranch,
        ),
        authToken,
      );
      // Github raw download_url juhend:
      // https://stackoverflow.com/questions/73819136/how-do-i-get-and-download-the-contents-of-a-file-in-github-using-the-rest-api/73824136
      // Download_url token muutub iga 7 päeva tagant Githubi poolt: https://github.com/orgs/community/discussions/23845#discussioncomment-3241866
      const filesRaw = await axios.get(
        requestLessonFiles(
          coursePathInGithub,
          `${path.contentSlug}`,
          refBranch,
        ),
        authToken,
      );

      await axios
        .all([componentsRaw, filesRaw])
        .then(
          axios.spread((...responses) => {
            [components, files] = responses;
            files = responses[1].data.filter(
              (x) => !ignoreFiles.includes(x.name),
            );
            cachePageContent.set(routePath, components);
            cacheFiles.set(routePathFiles, files);
          }),
        )
        .catch((error) => {
          console.error(error);
        });
    } else {
      console.log(
        `✅✅ lessonAdditionalMaterials components FROM CACHE: ${routePath}`,
      );
      console.log(
        `✅✅ lessonAdditionalMaterials files FROM CACHE: ${routePathFiles}`,
      );
      components = cachePageContent.get(routePath);
      files = cacheFiles.get(routePathFiles);
    }

    return { components, files };
  },
  lessonComponentsService: async (req, res) => {
    const { coursePathInGithub } = res.locals.course;
    const { path, refBranch } = res.locals;

    const routePath = `${req.url}+${refBranch}+components`;
    const routePathSources = `${req.url}+${refBranch}+sources`;

    let components;
    let sources;
    let componentsRaw;
    let sourcesRaw;

    if (path.type === "concept") {
      if (!cachePageContent.get(routePath)) {
        console.log(`❌❌ concept components IS NOT from cache: ${routePath}`);
        console.log(
          `❌❌ concept sources IS NOT from cache: ${routePathSources}`,
        );

        try {
          componentsRaw = await axios.get(
            requestConcepts(
              coursePathInGithub,
              `${path.componentSlug}`,
              refBranch,
            ),
            authToken,
          );
        } catch (error) {
          console.log("Unable to get componentsRaw");
          console.error(error);
        }
        try {
          sourcesRaw = await axios.get(
            requestSources(
              coursePathInGithub,
              `${path.componentSlug}`,
              refBranch,
            ),
            authToken,
          );
        } catch (error) {
          console.log("Unable to get sourcesRaw");
          console.error(error);
        }

        await axios
          .all([componentsRaw, sourcesRaw])
          .then(
            axios.spread((...responses) => {
              [components, sources] = responses;
              cachePageContent.set(routePath, components);
              cachePageContent.set(routePathSources, sources);
            }),
          )
          .catch((error) => error);
      } else {
        console.log(`✅✅ concept components FROM CACHE: ${routePath}`);
        console.log(`✅✅ concept sources FROM CACHE: ${routePathSources}`);
        components = cachePageContent.get(routePath);
        sources = cachePageContent.get(routePathSources);
      }
    }

    if (path.type === "practice") {
      if (!cachePageContent.get(routePath)) {
        console.log(`❌❌ practice components IS NOT from cache: ${routePath}`);
        components = await axios.get(
          requestPractices(
            coursePathInGithub,
            `${path.componentSlug}`,
            refBranch,
          ),
          authToken,
        );
        cachePageContent.set(routePath, components);
      } else {
        console.log(`✅✅ practice components FROM CACHE: ${routePath}`);
        components = cachePageContent.get(routePath);
      }
    }

    return { components, sources };
  },
};

export default apiRequests;
