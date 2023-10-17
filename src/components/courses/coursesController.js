import "core-js/actual/array/group-by.js";

import { performance } from "perf_hooks";
import markdown from "../../setup/setupMarkdown.js";
import base64 from "base-64";
import utf8 from "utf8";
import getAllCoursesData from "../../functions/getAllCoursesData.js";
import getConfig from "../../functions/getConfigFuncs.js";
import { function1 } from "../../functions/imgFunctions.js";
import {
  returnNextPage,
  returnPreviousPage,
  setCourseButtonPaths,
} from "../../functions/navButtonFunctions.js";
import apiRequests from "./coursesService.js";
import teamsController from "../teams/teamsController.js";
import allNotificationsController from "../notifications/notificationsController.js";
import getMarkedAsDoneComponents from "../../functions/getListOfDoneComponentUUIDs.js";
import { getFile, getFolder } from "../../functions/githubFileFunctions.js";
import { cacheConcepts, cacheLessons } from "../../setup/setupCache.js";

/** responseAction function defines what to do after info about courses and current course page is received.
 * This step gets the data from GitHub, by doing Axios requests via apiRequests[githubRequest] statement.
 * Responses are saved into components, files, sources parts in res.locals, respectively.
 * After the responseAction() function, the renderPage() function is run which renders the page on frontend.
 */
const responseAction = async (req, res, next) => {
  const { githubRequest } = res.locals;

  let apiResponse;
  //if (apiRequests.hasOwnProperty(githubRequest)) {
  if (Object.prototype.hasOwnProperty.call(apiRequests, githubRequest)) {
    let func;

    try {
      func = await apiRequests[githubRequest];
    } catch (error) {
      console.log(`Unable to get ${githubRequest}`);
      console.error(error);
    }
    await func(req, res).then((response) => {
      apiResponse = response;
    });
  }

  const { components, files, sources } = apiResponse;

  /** If GitHub API responds with no data for components, sources or files, then save those as empty to res.locals + render an empty page.
   * GitHub API responds with no data if there's inconsistency in the course repo files or folder. E.g. if the config file refers to a folder with lowercase ("arvuti"), but the folder name in GitHub is actually camelcase ("Arvuti"). This is inconsistent and GitHub API does not respond with data if the folder name is sent incorrectly with the API request.
   * We require the teacher to write all folder names lowercase.
   * There's no good way to validate that folder names are all in lowercase, and if not, then change to lowercase from GitHub's side.
   */
  res.locals.resComponents = components
    ? components
    : { data: { content: "" } };
  res.locals.resFiles = files ? files : [];
  res.locals.resSources = sources ? sources : { data: { content: "" } };

  return next();
};

/**
 * Last step to render page now that we have resComponents, resFiles and resSources values from GitHub via Axios.
 * We have everything needed to render the page.
 * This function also makes sure everything out the markdown content is correctly parsed and passed to FE.
 */
const renderPage = async (req, res) => {
  const {
    config,
    breadcrumbNames,
    path,
    allCourses,
    backAndForwardPaths,
    markAsDonePaths,
    coursePathInGithub,
    teachers,
    branches,
    selectedVersion,
    markedAsDoneComponentsArr,
    allTeams,
  } = res.locals;

  const { resComponents, resFiles, resSources, refBranch } = res.locals;
  /** Sisulehe sisu lugemine */
  const resComponentsContent = resComponents.data.content;
  const componentDecoded = base64.decode(resComponentsContent);
  const componentDecodedUtf8 = utf8.decode(componentDecoded);

  /**  Sisulehe piltide kuvamine
   * - functions: https://stackoverflow.com/a/58542933
   * - changing img src: https://www.npmjs.com/package/modify-image-url-md?activeTab=explore
   */
  const start1 = performance.now();
  const markdownWithModifiedImgSources = await function1(
    coursePathInGithub,
    path,
    componentDecodedUtf8,
    refBranch,
  );
  const end1 = performance.now();
  console.log(
    `Execution time markdownWithModifiedImgSources: ${end1 - start1} ms`,
  );

  /** Add Table of Contents markdown element to Markdown before rendering Markdown */
  const markdownWithModifiedImgSourcesToc =
    markdownWithModifiedImgSources.concat("\n\n ${toc} \n");

  /** Render Markdown */
  const start2 = performance.now();
  const componentMarkdown = await markdown.render(
    markdownWithModifiedImgSourcesToc,
  );
  const end2 = performance.now();
  console.log(`Execution time componentMarkdown: ${end2 - start2} ms`);

  /** Select html from rendered Markdown, but exclude Table of Contents */
  const componentMarkdownWithoutTOC = componentMarkdown.substring(
    0,
    componentMarkdown.indexOf(
      '<nav class="table-of-contents-from-markdown-123">',
    ),
  );

  /** Select Table of Contents from rendered Markdown, but exclude preceding html. */
  function getStringBetween(str, start, end) {
    const result = str.match(new RegExp(`${start}(.*)${end}`));
    return result[1];
  }

  const componentMarkdownOnlyTOCWithoutNav = getStringBetween(
    componentMarkdown,
    '<nav class="table-of-contents-from-markdown-123">',
    "</nav>",
  );
  const componentMarkdownOnlyTOC = `<nav class="table-of-contents">${componentMarkdownOnlyTOCWithoutNav}</nav>`;

  /** You now have stored the markdown content in two variables:
   * componentMarkdownWithoutTOC
   * componentMarkdownOnlyTOC
   */

  /** Each sisuleht (concepts, practices) has a sources reference which is stored in sources.json file in GitHub. */
  // define sources as NULL by default.
  let sourcesJSON = null;

  // NB! Sources are sent only with "Teemade endpointid" axios call. If sourcesJSON stays NULL (is false), then content.handlebars does not display "Allikad" div. If sourcesJSON gets filled (is true), then "Allikad" div is displayed.
  if (
    resSources &&
    resSources.data &&
    resSources.data.content &&
    resSources.data.content !== ""
  ) {
    const sources = resSources.data;
    const sourcesDecoded = base64.decode(sources.content);
    const sourcesDecodedUtf8 = utf8.decode(sourcesDecoded);
    if (sourcesDecodedUtf8) sourcesJSON = JSON.parse(sourcesDecodedUtf8);
  }

  // used for adding new branch
  const curYear = new Date().getFullYear();
  const years = [curYear, curYear + 1, curYear + 2];

  /** Finally you can render the course view with all correct information you've collected from GitHub, and with all correctly rendered Markdown content! */
  res.render("course", {
    component: componentMarkdownWithoutTOC,
    docs: config.docs,
    additionalMaterials: config.additionalMaterials,
    concepts: config.concepts,
    practices: config.practices,
    lessons: config.lessons,
    sources: sourcesJSON,
    breadcrumb: breadcrumbNames,
    path,
    backAndForwardPaths,
    markAsDonePaths,
    courses: allCourses,
    returnPreviousPage,
    returnNextPage,
    config,
    files: resFiles,
    user: req.user,
    ToC: componentMarkdownOnlyTOC,
    teachers,
    branches,
    selectedVersion,
    refBranch,
    currentPath: req.body.currentPath,
    markedAsDoneComponentsArr,
    allTeams,
    years,
  });
};

const renderEditPage = async (req, res) => {
  const {
    config,
    path,
    allCourses,
    coursePathInGithub,
    teachers,
    branches,
    selectedVersion,
    allTeams,
  } = res.locals;

  const { resComponents, resFiles, resSources, refBranch } = res.locals;
  /** Sisulehe sisu lugemine */
  const resComponentsContent = resComponents.data.content;
  const componentDecoded = base64.decode(resComponentsContent);
  const componentDecodedUtf8 = utf8.decode(componentDecoded);

  /**  Sisulehe piltide kuvamine
   * - functions: https://stackoverflow.com/a/58542933
   * - changing img src: https://www.npmjs.com/package/modify-image-url-md?activeTab=explore
   */
  const start1 = performance.now();
  const markdownWithModifiedImgSources = await function1(
    coursePathInGithub,
    path,
    componentDecodedUtf8,
    refBranch,
  );
  const end1 = performance.now();
  console.log(
    `Execution time markdownWithModifiedImgSources: ${end1 - start1} ms`,
  );

  /** Each sisuleht (concepts, practices) has a sources reference which is stored in sources.json file in GitHub. */
  // define sources as NULL by default.
  let sourcesJSON = null;

  // NB! Sources are sent only with "Teemade endpointid" axios call. If sourcesJSON stays NULL (is false), then content.handlebars does not display "Allikad" div. If sourcesJSON gets filled (is true), then "Allikad" div is displayed.
  if (
    resSources &&
    resSources.data &&
    resSources.data.content &&
    resSources.data.content !== ""
  ) {
    const sources = resSources.data;
    const sourcesDecoded = base64.decode(sources.content);
    const sourcesDecodedUtf8 = utf8.decode(sourcesDecoded);
    if (sourcesDecodedUtf8) sourcesJSON = JSON.parse(sourcesDecodedUtf8);
  }

  // used for adding new branch
  const curYear = new Date().getFullYear();
  const years = [curYear, curYear + 1, curYear + 2];

  // get docs/lisamaterjalid.md
  const repoPath = coursePathInGithub.split("/").pop();

  const additionalMaterials = await getFile(
    process.env.REPO_ORG_NAME,
    repoPath,
    "docs/lisamaterjalid.md",
    refBranch,
  );

  // for each lessons get README and lisamaterjalid.md
  for await (const material of config.lessons.map((lesson) => {
    getFile(
      process.env.REPO_ORG_NAME,
      repoPath,
      `lessons/${lesson.slug}/lisamaterjalid.md`,
      refBranch,
    ).then((material) => (lesson.additionalMaterials = material));
  })) {
    //console.log(material);
  }
  for await (const about of config.lessons.map((lesson) =>
    getFile(
      process.env.REPO_ORG_NAME,
      repoPath,
      `lessons/${lesson.slug}/README.md`,
      refBranch,
    ).then((about) => (lesson.content = about)),
  )) {
    //console.log(material);
  }

  const allConcepts = await allCoursesController.getAllConcepts(
    allCourses,
    refBranch,
  );

  /*const test3 = await allCoursesController.getAllLessons(
          "test",
          allCourses,
          refBranch,
        );
        console.log(test3);*/

  /*config.lessons.forEach(lesson => {
                      const additionalMaterials = await getFile(
                          process.env.REPO_ORG_NAME,
                          repoPath.pop(),
                          "docs/lisamaterjalid.md",
                      );
                    })*/

  // replace each lesson.component slug with object
  config.lessons.map((l) => {
    l.components.map((slug) => {
      const def = allConcepts.find((concept) => concept.slug === slug);
      return def ? def : null;
    });
  });

  console.log(config.lessons);
  /** Finally you can render the course view with all correct information you've collected from GitHub, and with all correctly rendered Markdown content! */
  const viewVars = {
    component: markdownWithModifiedImgSources,
    docs: config.docs,
    additionalMaterials: additionalMaterials,
    concepts: config.concepts,
    practices: config.practices,
    lessons: config.lessons,
    sources: sourcesJSON,
    path,
    courses: allCourses,
    config,
    files: resFiles,
    user: req.user,
    teachers,
    branches,
    selectedVersion,
    refBranch,
    currentPath: req.body.currentPath,
    allTeams,
    years,
    allConcepts,
  };
  //console.log(JSON.stringify(config.lessons));
  const test = {
    component:
      '<h1 class="markdown-wrapper" id="kursuse-%C3%BClesehitus" tabindex="-1">Kursuse ülesehitus <a class="header-anchor" href="#kursuse-%C3%BClesehitus"><span class="material-symbols-outlined" style="0.75em">share</span></a></h1>\n' +
      "</ul>\n",
    docs: [{ slug: "about", name: "Aine info" }],
    additionalMaterials: [
      { slug: "lisamaterjalid", name: "Aine lisamaterjalid" },
    ],
    concepts: [
      {
        slug: "naidis-sisuteema",
        name: "Näidis Sisuteema",
        uuid: "7cc19837-3dfe-4da7-ac2e-b4f7132fb3a4",
      },
      {
        slug: "sisu-loomise-juhend",
        name: "Sisu loomise juhend",
        uuid: "49b640ef-5c58-41e2-9392-4514f49a9c17",
      },
    ],
    practices: [
      {
        slug: "praktikum_01",
        name: "Näidis Praktikum",
        uuid: "2a6b7b65-1014-4983-a7fc-c9aae6100563",
      },
    ],
    lessons: [
      {
        slug: "loeng_01",
        name: "Loeng 1 (näidisfailid)",
        uuid: "f7ebc48c-10b7-46ce-9195-ac506cc3ee99",
        components: [Array],
        additionalMaterials: [Array],
      },
    ],
    sources: null,

    path: {
      courseSlug: "HKI5076.HK",
      contentSlug: "about",
      componentSlug: undefined,
      refBranch: "master",
      contentUUID: undefined,
      componentUUID: undefined,
      fullPath: "about",
      type: "docs",
    },
    courses: [
      {
        courseUrl: "https://ois2.tlu.ee/tluois/aine/HKI5084.HK",
        teacherUsername: "LauraHein",
        courseIsActive: true,
        courseName: "Disaini alused",
        courseSlug: "HKI5084.HK",
        courseCode: "HKI5084.HK",
        courseSemester: "K2023",
        courseSlugInGithub: "HK_Disaini-alused",
        coursePathInGithub: "tluhk/HK_Disaini-alused",
        courseEAP: 5,
        courseGrading: "eksam",
        refBranch: "master",
        courseBranchComponentsUUIDs: [Array],
        courseAllActiveBranches: [Array],
        config: [Object],
      },
      {
        courseUrl: "https://ois2.tlu.ee/tluois/aine/HKI6001.HK",
        teacherUsername: "LauraHein",
        courseIsActive: true,
        courseName: "Kujundusgraafika",
        courseSlug: "HKI6001.HK",
        courseCode: "HKI6001.HK",
        courseSemester: "K2023",
        courseSlugInGithub: "HK_Kujundusgraafika",
        coursePathInGithub: "tluhk/HK_Kujundusgraafika",
        courseEAP: 3,
        courseGrading: "eksam",
        refBranch: "master",
        courseBranchComponentsUUIDs: [Array],
        courseAllActiveBranches: [Array],
        config: [Object],
      },
      {
        courseUrl: "https://ois2.tlu.ee/tluois/aine/HKI5080.HK",
        teacherUsername: "seppkh",
        courseIsActive: true,
        courseName: "Kursuse näide",
        courseSlug: "HKI5080.HK",
        courseCode: "HKI5080.HK",
        courseSemester: "S2019",
        courseSlugInGithub: "HK_Ainekursuse_mall",
        coursePathInGithub: "tluhk/HK_Ainekursuse_mall",
        courseEAP: 6,
        courseGrading: "arvestus",
        refBranch: "master",
        courseBranchComponentsUUIDs: [Array],
        courseAllActiveBranches: [Array],
        config: [Object],
      },
      {
        courseUrl: "https://ois2.tlu.ee/tluois/aine/HKI5097.HK",
        teacherUsername: "priit",
        courseIsActive: true,
        courseName: "Programmeerimine I",
        courseSlug: "HKI5097.HK",
        courseCode: "HKI5097.HK",
        courseSemester: "K2022",
        courseSlugInGithub: "HK_Programmeerimine-I",
        coursePathInGithub: "tluhk/HK_Programmeerimine-I",
        courseEAP: 5,
        courseGrading: "arvestus",
        refBranch: "rif20",
        courseBranchComponentsUUIDs: [Array],
        courseAllActiveBranches: [Array],
        config: [Object],
      },
      {
        courseUrl: "https://ois2.tlu.ee/tluois/aine/HKI5003.HK",
        teacherUsername: undefined,
        courseIsActive: true,
        courseName: "Programmeerimine II",
        courseSlug: "HKI5003.HK",
        courseCode: "HKI5003.HK",
        courseSemester: undefined,
        courseSlugInGithub: "HK_Programmeerimine_II",
        coursePathInGithub: "tluhk/HK_Programmeerimine_II",
        courseEAP: 3,
        courseGrading: "eksam",
        refBranch: "master",
        courseBranchComponentsUUIDs: [Array],
        courseAllActiveBranches: [Array],
        config: [Object],
      },
      {
        courseUrl: "https://ois2.tlu.ee/tluois/aine/HKI5076.HK",
        teacherUsername: "kaiusk",
        courseIsActive: true,
        courseName: "Programmeerimine III",
        courseSlug: "HKI5076.HK",
        courseCode: "HKI5076.HK",
        courseSemester: "K2023",
        courseSlugInGithub: "HK_Programmeerimine-III",
        coursePathInGithub: "tluhk/HK_Programmeerimine-III",
        courseEAP: 5,
        courseGrading: "arvestus",
        refBranch: "master",
        courseBranchComponentsUUIDs: [Array],
        courseAllActiveBranches: [Array],
        config: [Object],
      },
      {
        courseUrl: "https://ois2.tlu.ee/tluois/aine/HKI5085.HK",
        teacherUsername: "mrtrvl",
        courseIsActive: true,
        courseName: "Riistvara ja operatsioonisüsteemide alused",
        courseSlug: "HKI5085.HK",
        courseCode: "HKI5085.HK",
        courseSemester: "S2023",
        courseSlugInGithub: "HK_Riistvara-alused",
        coursePathInGithub: "tluhk/HK_Riistvara-alused",
        courseEAP: 4,
        courseGrading: "eksam",
        refBranch: "rif20",
        courseBranchComponentsUUIDs: [Array],
        courseAllActiveBranches: [Array],
        config: [Object],
      },
    ],
    config: {
      courseName: "Programmeerimine III",
      courseUrl: "https://ois2.tlu.ee/tluois/aine/HKI5076.HK",
      active: true,
      teacherUsername: "kaiusk",
      semester: "K2023",
      docs: [[Object]],
      additionalMaterials: [[Object]],
      lessons: [[Object]],
      concepts: [[Object], [Object]],
      practices: [[Object]],
    },
    files: [],
    user: {
      id: "9574245",
      nodeId: "MDQ6VXNlcjk1NzQyNDU=",
      displayName: "Kaius",
      username: "kaiusk",
      profileUrl: "https://github.com/kaiusk",
      photos: [[Object]],
      provider: "github",
      //_raw: '{"login":"kaiusk","id":9574245,"node_id":"MDQ6VXNlcjk1NzQyNDU=","avatar_url":"https://avatars.githubusercontent.com/u/9574245?v=4","gravatar_id":"","url":"https://api.github.com/users/kaiusk","html_url":"https://github.com/kaiusk","followers_url":"https://api.github.com/users/kaiusk/followers","f
      //ollowing_url:"https://api.github.com/users/kaiusk/following{/other_user}","gists_url":"https://api.github.com/users/kaiusk/gists{/gist_id}","starred_url":"https://api.github.com/users/kaiusk/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/kaiusk/subscriptions","organizations_url":
      //    "https://api.github.com/users/kaiusk/orgs",
      repos_url: "https://api.github.com/users/kaiusk/repos",
      events_url: "https://api.github.com/users/kaiusk/events{/privacy}",
      received_events_url:
        "https://api.github.com/users/kaiusk/received_events",
      type: "User",
      site_admin: false,
      name: null,
      company: null,
      blog: "",
      location: null,
      email: null,
      hireable: null,
      bio: null,
      twitter_username: null,
      public_repos: 15,
      public_gists: 0,
      followers: 0,
      following: 0,
      created_at: "2014-11-05T16:30:55Z",
      updated_at: "2023-08-29T06:42:29Z",
    },
    _json: {
      login: "kaiusk",
      id: 9574245,
      node_id: "MDQ6VXNlcjk1NzQyNDU=",
      avatar_url: "https://avatars.githubusercontent.com/u/9574245?v=4",
      gravatar_id: "",
      url: "https://api.github.com/users/kaiusk",
      html_url: "https://github.com/kaiusk",
      followers_url: "https://api.github.com/users/kaiusk/followers",
      following_url:
        "https://api.github.com/users/kaiusk/following{/other_user}",
      gists_url: "https://api.github.com/users/kaiusk/gists{/gist_id}",
      starred_url: "https://api.github.com/users/kaiusk/starred{/owner}{/repo}",
      subscriptions_url: "https://api.github.com/users/kaiusk/subscriptions",
      organizations_url: "https://api.github.com/users/kaiusk/orgs",
      repos_url: "https://api.github.com/users/kaiusk/repos",
      events_url: "https://api.github.com/users/kaiusk/events{/privacy}",
      received_events_url:
        "https://api.github.com/users/kaiusk/received_events",
      type: "User",
      site_admin: false,
      name: null,
      company: null,
      blog: "",
      location: null,
      email: null,
      hireable: null,
      bio: null,
      twitter_username: null,
      public_repos: 15,
      public_gists: 0,
      followers: 0,
      following: 0,
      created_at: "2014-11-05T16:30:55Z",
      updated_at: "2023-08-29T06:42:29Z",
    },
    team: {
      name: "Teachers",
      id: 7414189,
      node_id: "T_kwDOBqxQ5c4AcSGt",
      slug: "teachers",
      description: "",
      privacy: "closed",
      notification_setting: "notifications_enabled",
      url: "https://api.github.com/organizations/111956197/team/7414189",
      html_url: "https://github.com/orgs/tluhk/teams/teachers",
      members_url:
        "https://api.github.com/organizations/111956197/team/7414189/members{/member}",
      repositories_url:
        "https://api.github.com/organizations/111956197/team/7414189/repos",
      permission: "pull",
      parent: null,
      members: [Array],
      //}
    },
    teachers: [
      {
        login: "taavilarionov",
        id: 2972990,
        node_id: "MDQ6VXNlcjI5NzI5OTA=",
        avatar_url: "https://avatars.githubusercontent.com/u/2972990?v=4",
        gravatar_id: "",
        url: "https://api.github.com/users/taavilarionov",
        html_url: "https://github.com/taavilarionov",
        followers_url: "https://api.github.com/users/taavilarionov/followers",
        following_url:
          "https://api.github.com/users/taavilarionov/following{/other_user}",
        gists_url: "https://api.github.com/users/taavilarionov/gists{/gist_id}",
        starred_url:
          "https://api.github.com/users/taavilarionov/starred{/owner}{/repo}",
        subscriptions_url:
          "https://api.github.com/users/taavilarionov/subscriptions",
        organizations_url: "https://api.github.com/users/taavilarionov/orgs",
        repos_url: "https://api.github.com/users/taavilarionov/repos",
        events_url:
          "https://api.github.com/users/taavilarionov/events{/privacy}",
        received_events_url:
          "https://api.github.com/users/taavilarionov/received_events",
        type: "User",
        site_admin: false,
        displayName: "taavilarionov",
        email: undefined,
      },
      {
        login: "jaagup",
        id: 3866715,
        node_id: "MDQ6VXNlcjM4NjY3MTU=",
        avatar_url: "https://avatars.githubusercontent.com/u/3866715?v=4",
        gravatar_id: "",
        url: "https://api.github.com/users/jaagup",
        html_url: "https://github.com/jaagup",
        followers_url: "https://api.github.com/users/jaagup/followers",
        following_url:
          "https://api.github.com/users/jaagup/following{/other_user}",
        gists_url: "https://api.github.com/users/jaagup/gists{/gist_id}",
        starred_url:
          "https://api.github.com/users/jaagup/starred{/owner}{/repo}",
        subscriptions_url: "https://api.github.com/users/jaagup/subscriptions",
        organizations_url: "https://api.github.com/users/jaagup/orgs",
        repos_url: "https://api.github.com/users/jaagup/repos",
        events_url: "https://api.github.com/users/jaagup/events{/privacy}",
        received_events_url:
          "https://api.github.com/users/jaagup/received_events",
        type: "User",
        site_admin: false,
        displayName: "jaagup",
        email: undefined,
      },
      {
        login: "kaiusk",
        id: 9574245,
        node_id: "MDQ6VXNlcjk1NzQyNDU=",
        avatar_url: "https://avatars.githubusercontent.com/u/9574245?v=4",
        gravatar_id: "",
        url: "https://api.github.com/users/kaiusk",
        html_url: "https://github.com/kaiusk",
        followers_url: "https://api.github.com/users/kaiusk/followers",
        following_url:
          "https://api.github.com/users/kaiusk/following{/other_user}",
        gists_url: "https://api.github.com/users/kaiusk/gists{/gist_id}",
        starred_url:
          "https://api.github.com/users/kaiusk/starred{/owner}{/repo}",
        subscriptions_url: "https://api.github.com/users/kaiusk/subscriptions",
        organizations_url: "https://api.github.com/users/kaiusk/orgs",
        repos_url: "https://api.github.com/users/kaiusk/repos",
        events_url: "https://api.github.com/users/kaiusk/events{/privacy}",
        received_events_url:
          "https://api.github.com/users/kaiusk/received_events",
        type: "User",
        site_admin: false,
        displayName: "Kaius",
        email: null,
      },
      {
        login: "tarmore",
        id: 22474843,
        node_id: "MDQ6VXNlcjIyNDc0ODQz",
        avatar_url: "https://avatars.githubusercontent.com/u/22474843?v=4",
        gravatar_id: "",
        url: "https://api.github.com/users/tarmore",
        html_url: "https://github.com/tarmore",
        followers_url: "https://api.github.com/users/tarmore/followers",
        following_url:
          "https://api.github.com/users/tarmore/following{/other_user}",
        gists_url: "https://api.github.com/users/tarmore/gists{/gist_id}",
        starred_url:
          "https://api.github.com/users/tarmore/starred{/owner}{/repo}",
        subscriptions_url: "https://api.github.com/users/tarmore/subscriptions",
        organizations_url: "https://api.github.com/users/tarmore/orgs",
        repos_url: "https://api.github.com/users/tarmore/repos",
        events_url: "https://api.github.com/users/tarmore/events{/privacy}",
        received_events_url:
          "https://api.github.com/users/tarmore/received_events",
        type: "User",
        site_admin: false,
        displayName: "tarmore",
        email: undefined,
      },
      {
        login: "ipetuhhov",
        id: 22762639,
        node_id: "MDQ6VXNlcjIyNzYyNjM5",
        avatar_url: "https://avatars.githubusercontent.com/u/22762639?v=4",
        gravatar_id: "",
        url: "https://api.github.com/users/ipetuhhov",
        html_url: "https://github.com/ipetuhhov",
        followers_url: "https://api.github.com/users/ipetuhhov/followers",
        following_url:
          "https://api.github.com/users/ipetuhhov/following{/other_user}",
        gists_url: "https://api.github.com/users/ipetuhhov/gists{/gist_id}",
        starred_url:
          "https://api.github.com/users/ipetuhhov/starred{/owner}{/repo}",
        subscriptions_url:
          "https://api.github.com/users/ipetuhhov/subscriptions",
        organizations_url: "https://api.github.com/users/ipetuhhov/orgs",
        repos_url: "https://api.github.com/users/ipetuhhov/repos",
        events_url: "https://api.github.com/users/ipetuhhov/events{/privacy}",
        received_events_url:
          "https://api.github.com/users/ipetuhhov/received_events",
        type: "User",
        site_admin: false,
        displayName: "ipetuhhov",
        email: undefined,
      },
      {
        login: "cruulruul",
        id: 23344232,
        node_id: "MDQ6VXNlcjIzMzQ0MjMy",
        avatar_url: "https://avatars.githubusercontent.com/u/23344232?v=4",
        gravatar_id: "",
        url: "https://api.github.com/users/cruulruul",
        html_url: "https://github.com/cruulruul",
        followers_url: "https://api.github.com/users/cruulruul/followers",
        following_url:
          "https://api.github.com/users/cruulruul/following{/other_user}",
        gists_url: "https://api.github.com/users/cruulruul/gists{/gist_id}",
        starred_url:
          "https://api.github.com/users/cruulruul/starred{/owner}{/repo}",
        subscriptions_url:
          "https://api.github.com/users/cruulruul/subscriptions",
        organizations_url: "https://api.github.com/users/cruulruul/orgs",
        repos_url: "https://api.github.com/users/cruulruul/repos",
        events_url: "https://api.github.com/users/cruulruul/events{/privacy}",
        received_events_url:
          "https://api.github.com/users/cruulruul/received_events",
        type: "User",
        site_admin: false,
        displayName: "cruulruul",
        email: undefined,
      },
      {
        login: "mrtrvl",
        id: 26817366,
        node_id: "MDQ6VXNlcjI2ODE3MzY2",
        avatar_url: "https://avatars.githubusercontent.com/u/26817366?v=4",
        gravatar_id: "",
        url: "https://api.github.com/users/mrtrvl",
        html_url: "https://github.com/mrtrvl",
        followers_url: "https://api.github.com/users/mrtrvl/followers",
        following_url:
          "https://api.github.com/users/mrtrvl/following{/other_user}",
        gists_url: "https://api.github.com/users/mrtrvl/gists{/gist_id}",
        starred_url:
          "https://api.github.com/users/mrtrvl/starred{/owner}{/repo}",
        subscriptions_url: "https://api.github.com/users/mrtrvl/subscriptions",
        organizations_url: "https://api.github.com/users/mrtrvl/orgs",
        repos_url: "https://api.github.com/users/mrtrvl/repos",
        events_url: "https://api.github.com/users/mrtrvl/events{/privacy}",
        received_events_url:
          "https://api.github.com/users/mrtrvl/received_events",
        type: "User",
        site_admin: false,
        displayName: "mrtrvl",
        email: undefined,
      },
      {
        login: "andrusrinde",
        id: 29426077,
        node_id: "MDQ6VXNlcjI5NDI2MDc3",
        avatar_url: "https://avatars.githubusercontent.com/u/29426077?v=4",
        gravatar_id: "",
        url: "https://api.github.com/users/andrusrinde",
        html_url: "https://github.com/andrusrinde",
        followers_url: "https://api.github.com/users/andrusrinde/followers",
        following_url:
          "https://api.github.com/users/andrusrinde/following{/other_user}",
        gists_url: "https://api.github.com/users/andrusrinde/gists{/gist_id}",
        starred_url:
          "https://api.github.com/users/andrusrinde/starred{/owner}{/repo}",
        subscriptions_url:
          "https://api.github.com/users/andrusrinde/subscriptions",
        organizations_url: "https://api.github.com/users/andrusrinde/orgs",
        repos_url: "https://api.github.com/users/andrusrinde/repos",
        events_url: "https://api.github.com/users/andrusrinde/events{/privacy}",
        received_events_url:
          "https://api.github.com/users/andrusrinde/received_events",
        type: "User",
        site_admin: false,
        displayName: "andrusrinde",
        email: undefined,
      },
      {
        login: "seppkh",
        id: 62253084,
        node_id: "MDQ6VXNlcjYyMjUzMDg0",
        avatar_url: "https://avatars.githubusercontent.com/u/62253084?v=4",
        gravatar_id: "",
        url: "https://api.github.com/users/seppkh",
        html_url: "https://github.com/seppkh",
        followers_url: "https://api.github.com/users/seppkh/followers",
        following_url:
          "https://api.github.com/users/seppkh/following{/other_user}",
        gists_url: "https://api.github.com/users/seppkh/gists{/gist_id}",
        starred_url:
          "https://api.github.com/users/seppkh/starred{/owner}{/repo}",
        subscriptions_url: "https://api.github.com/users/seppkh/subscriptions",
        organizations_url: "https://api.github.com/users/seppkh/orgs",
        repos_url: "https://api.github.com/users/seppkh/repos",
        events_url: "https://api.github.com/users/seppkh/events{/privacy}",
        received_events_url:
          "https://api.github.com/users/seppkh/received_events",
        type: "User",
        site_admin: false,
        displayName: "seppkh",
        email: undefined,
      },
      {
        login: "mihkelpulst",
        id: 63843452,
        node_id: "MDQ6VXNlcjYzODQzNDUy",
        avatar_url: "https://avatars.githubusercontent.com/u/63843452?v=4",
        gravatar_id: "",
        url: "https://api.github.com/users/mihkelpulst",
        html_url: "https://github.com/mihkelpulst",
        followers_url: "https://api.github.com/users/mihkelpulst/followers",
        following_url:
          "https://api.github.com/users/mihkelpulst/following{/other_user}",
        gists_url: "https://api.github.com/users/mihkelpulst/gists{/gist_id}",
        starred_url:
          "https://api.github.com/users/mihkelpulst/starred{/owner}{/repo}",
        subscriptions_url:
          "https://api.github.com/users/mihkelpulst/subscriptions",
        organizations_url: "https://api.github.com/users/mihkelpulst/orgs",
        repos_url: "https://api.github.com/users/mihkelpulst/repos",
        events_url: "https://api.github.com/users/mihkelpulst/events{/privacy}",
        received_events_url:
          "https://api.github.com/users/mihkelpulst/received_events",
        type: "User",
        site_admin: false,
        displayName: "mihkelpulst",
        email: undefined,
      },
      {
        login: "LauraHein",
        id: 112770737,
        node_id: "U_kgDOBri-sQ",
        avatar_url: "https://avatars.githubusercontent.com/u/112770737?v=4",
        gravatar_id: "",
        url: "https://api.github.com/users/LauraHein",
        html_url: "https://github.com/LauraHein",
        followers_url: "https://api.github.com/users/LauraHein/followers",
        following_url:
          "https://api.github.com/users/LauraHein/following{/other_user}",
        gists_url: "https://api.github.com/users/LauraHein/gists{/gist_id}",
        starred_url:
          "https://api.github.com/users/LauraHein/starred{/owner}{/repo}",
        subscriptions_url:
          "https://api.github.com/users/LauraHein/subscriptions",
        organizations_url: "https://api.github.com/users/LauraHein/orgs",
        repos_url: "https://api.github.com/users/LauraHein/repos",
        events_url: "https://api.github.com/users/LauraHein/events{/privacy}",
        received_events_url:
          "https://api.github.com/users/LauraHein/received_events",
        type: "User",
        site_admin: false,
        displayName: "LauraHein",
        email: undefined,
      },
      {
        login: "HK-teacher",
        id: 130644094,
        node_id: "U_kgDOB8l4fg",
        avatar_url: "https://avatars.githubusercontent.com/u/130644094?v=4",
        gravatar_id: "",
        url: "https://api.github.com/users/HK-teacher",
        html_url: "https://github.com/HK-teacher",
        followers_url: "https://api.github.com/users/HK-teacher/followers",
        following_url:
          "https://api.github.com/users/HK-teacher/following{/other_user}",
        gists_url: "https://api.github.com/users/HK-teacher/gists{/gist_id}",
        starred_url:
          "https://api.github.com/users/HK-teacher/starred{/owner}{/repo}",
        subscriptions_url:
          "https://api.github.com/users/HK-teacher/subscriptions",
        organizations_url: "https://api.github.com/users/HK-teacher/orgs",
        repos_url: "https://api.github.com/users/HK-teacher/repos",
        events_url: "https://api.github.com/users/HK-teacher/events{/privacy}",
        received_events_url:
          "https://api.github.com/users/HK-teacher/received_events",
        type: "User",
        site_admin: false,
        displayName: "HK-teacher",
        email: undefined,
      },
      {
        login: "vile-ja-kell",
        id: 132268493,
        node_id: "U_kgDOB-JBzQ",
        avatar_url: "https://avatars.githubusercontent.com/u/132268493?v=4",
        gravatar_id: "",
        url: "https://api.github.com/users/vile-ja-kell",
        html_url: "https://github.com/vile-ja-kell",
        followers_url: "https://api.github.com/users/vile-ja-kell/followers",
        following_url:
          "https://api.github.com/users/vile-ja-kell/following{/other_user}",
        gists_url: "https://api.github.com/users/vile-ja-kell/gists{/gist_id}",
        starred_url:
          "https://api.github.com/users/vile-ja-kell/starred{/owner}{/repo}",
        subscriptions_url:
          "https://api.github.com/users/vile-ja-kell/subscriptions",
        organizations_url: "https://api.github.com/users/vile-ja-kell/orgs",
        email: undefined,
      },
    ],
    branches: ["master", "rif21"],
    selectedVersion: "master",
    refBranch: "master",
    currentPath: undefined,
    markedAsDoneComponentsArr: [],
    allTeams: ["rif20", "rif22", "rif23"],
    years: [2023, 2024, 2025],
  };

  res.render("course-edit", viewVars);
};
const allCoursesController = {
  /** For '/dashboard' route: */
  getAllCourses: async (req, res) => {
    const adminName = process.env.ADMIN_NAME;
    const adminEmail = process.env.ADMIN_EMAIL;

    let teamSlug;
    if (req.user && req.user.team) teamSlug = req.user.team.slug;
    /**
     * Check if teamSlug is 'teachers'
     * If yes, then get all courses for teacher
     * If not, then get all courses for student
     */
    let isTeacher = false;
    if (teamSlug === "teachers") isTeacher = true;
    res.locals.teamSlug = teamSlug;

    const start3 = performance.now();
    const allCourses = await getAllCoursesData(teamSlug, req);

    const end3 = performance.now();
    console.log(`Execution time getAllCoursesData: ${end3 - start3} ms`);
    const allCoursesActive = allCourses.filter((x) => x.courseIsActive);

    /** Save all teachers in a variable, needed for rendering */
    const start4 = performance.now();
    const allTeachers = await teamsController.getUsersInTeam("teachers");
    const end4 = performance.now();
    console.log(`Execution time allTeachers: ${end4 - start4} ms`);

    res.locals.allCoursesActive = allCoursesActive;
    res.locals.allTeacher = allTeachers;

    /** By default, courses are displayed on dashboard by their name. Set coursesDisplayBy to 'name'
     * If coursesDisplayBy is provided, use this instead - courses are then displayed on dashboard by Name, Progress or Semester.
     * Save coursesDisplayBy to req.session, so dashboard would be loaded with last visited coursesDisplayBy.
     */
    let coursesDisplayBy = req.session.coursesDisplayBy || "name";

    /** For INVALID coursesDisplayBy parameters, OR if teacher tries to load courses by Progress, redirect back to /dashboard page.
     * coursesDisplayBy is defaulted to 'name'  */
    if (
      (req.query.coursesDisplayBy &&
        req.query.coursesDisplayBy !== "name" &&
        req.query.coursesDisplayBy !== "progress" &&
        req.query.coursesDisplayBy !== "semester") ||
      (req.user &&
        req.user.team &&
        // NB! 'teachers' team doesn't have progress bars on courses, so they can't load courses by Progress:
        req.user.team.slug === "teachers" &&
        req.query.coursesDisplayBy &&
        req.query.coursesDisplayBy === "progress")
    )
      return res.redirect("/dashboard");

    /** For VALID coursesDisplayBy parameters, save req.session.coursesDisplayBy to the given coursesDisplayBy. On Dashboard, courses will be successfully displayed by either Name, Progress or Semester. */
    if (
      req.query.coursesDisplayBy &&
      (req.query.coursesDisplayBy === "name" ||
        req.query.coursesDisplayBy === "semester" ||
        // 'teachers' team doesn't have Progress bars on courses, so check that user's team is NOT 'teachers:
        (req.query.coursesDisplayBy === "progress" &&
          req.user.team.slug !== "teachers"))
    ) {
      coursesDisplayBy = req.query.coursesDisplayBy;
      req.session.coursesDisplayBy = req.query.coursesDisplayBy;
    }
    res.locals.coursesDisplayBy = coursesDisplayBy;

    /** Following describes different DASHBOARD logics for TEACHER, based on given coursesDisplayBy */
    if (isTeacher) {
      /*
       * Filter allCoursesActive where the teacher is logged-in user
       */
      const allTeacherCourses = allCoursesActive.filter(
        (course) => course.teacherUsername === req.user.username,
      );
      // console.log('allTeacherCourses1:', allTeacherCourses);

      /*
       * Sort allTeacherCourses, these are teacher's own courses
       */
      allTeacherCourses.sort((a, b) =>
        a.courseName.localeCompare(b.courseName),
      );
      // console.log('allTeacherCourses2:', allTeacherCourses);

      /* These are teachers of all other courses.
       * 1) group by teacher name
       * 2) remove logged in user from the list
       * 3) then sort by teacher name and by each teacher's courses
       * */
      const allCoursesGroupedByTeacher = allCoursesActive.groupBy(
        ({ teacherUsername }) => teacherUsername,
      );
      // console.log('allCoursesGroupedByTeacher1:', allCoursesGroupedByTeacher);

      delete allCoursesGroupedByTeacher[req.user.username];
      // console.log('allCoursesGroupedByTeacher2:', allCoursesGroupedByTeacher);

      const sortedCoursesGroupedByTeacher = Object.keys(
        allCoursesGroupedByTeacher,
      )
        .sort()
        .reduce((acc, teacher) => {
          acc[teacher] = allCoursesGroupedByTeacher[teacher].sort((a, b) =>
            a.courseName?.localeCompare(b.courseName),
          );
          return acc;
        }, {});

      /**
       * Get last 7 day notifications for active courses, needed for dashboard
       */
      const { courseUpdates7Days } =
        await allNotificationsController.getCoursesUpdates(
          allCoursesActive,
          allTeachers,
        );

      /** Rendering teacher's dashboard if courses are displayed by Name */
      if (coursesDisplayBy === "name") {
        return res.render("dashboard-teacher", {
          adminName,
          adminEmail,
          coursesDisplayBy,
          courses: allTeacherCourses,
          user: req.user,
          teacherCourses: sortedCoursesGroupedByTeacher,
          teachers: allTeachers,
          courseUpdates7Days,
        });
      }
      /** Rendering teacher's dashboard if courses are displayed by Semester */
      if (coursesDisplayBy === "semester") {
        const allCoursesGroupedBySemester = allTeacherCourses.groupBy(
          ({ courseSemester }) => courseSemester,
        );
        // console.log('allCoursesGroupedByTeacher1:', allCoursesGroupedByTeacher);
        const sortedCoursesGroupedBySemester = Object.keys(
          allCoursesGroupedBySemester,
        )
          .sort((a, b) => {
            // Extract the year and first letter of each element
            const yearA = a.slice(1);
            const yearB = b.slice(1);
            const letterA = a[0];
            const letterB = b[0];
            // Compare the years first
            if (yearA !== yearB) {
              return yearB - yearA;
            }
            // If the years are the same, compare the first letter
            return letterB.localeCompare(letterA);
          })
          .reduce((acc, semester) => {
            acc[semester] = allCoursesGroupedBySemester[semester].sort((a, b) =>
              a.courseName.localeCompare(b.courseName),
            );
            return acc;
          }, {});

        const seasons = {
          K: "Kevad",
          S: "Sügis",
        };
        const sortedCoursesGroupedBySemesterWithFullNames = {};

        Object.keys(sortedCoursesGroupedBySemester).forEach((semester) => {
          if (
            Object.prototype.hasOwnProperty.call(
              sortedCoursesGroupedBySemester,
              semester,
            )
          ) {
            const season = semester.substring(0, 1);
            const year = semester.substring(1);
            sortedCoursesGroupedBySemesterWithFullNames[
              `${seasons[season]} ${year}`
            ] = sortedCoursesGroupedBySemester[semester];
          }
        });
        // console.log('sortedCoursesGroupedBySemesterWithFullNames1:', sortedCoursesGroupedBySemesterWithFullNames);

        return res.render("dashboard-teacher", {
          adminName,
          adminEmail,
          coursesDisplayBy,
          courses: sortedCoursesGroupedBySemesterWithFullNames,
          user: req.user,
          teacherCourses: sortedCoursesGroupedByTeacher,
          teachers: allTeachers,
          courseUpdates7Days,
        });
      }
    }

    /** Following describes different DASHBOARD logics for STUDENT, based on given coursesDisplayBy */
    if (!isTeacher) {
      /*
       * Sort allCoursesActive, these are student's courses
       */
      allCoursesActive.sort((a, b) => a.courseName.localeCompare(b.courseName));

      /* These are teachers of student's courses.
       * 1) group by teacher name
       * 2) then sort by teacher name and by each teacher's courses
       * */
      const allCoursesGroupedByTeacher = allCoursesActive.groupBy(
        ({ teacherUsername }) => teacherUsername,
      );
      // console.log('allCoursesGroupedByTeacher1:', allCoursesGroupedByTeacher);

      const sortedCoursesGroupedByTeacher = Object.keys(
        allCoursesGroupedByTeacher,
      )
        .sort()
        .reduce((acc, teacher) => {
          acc[teacher] = allCoursesGroupedByTeacher[teacher].sort((a, b) =>
            a.courseName.localeCompare(b.courseName),
          );
          return acc;
        }, {});
      // console.log('allCoursesGroupedByTeacher5:', allCoursesGroupedByTeacher);

      /**
       * Get last 7 day notifications for active courses, needed for dashboard
       */
      const { courseUpdates7Days } =
        await allNotificationsController.getCoursesUpdates(
          allCoursesActive,
          allTeachers,
        );

      /** Next, you must get all active courses WITH the list of components that have been markedAsDone. Use the allCoursesController.allCoursesActiveWithComponentsData() function that store those courses. */
      let courses;
      if (req.user && req.user.id) {
        courses = await allCoursesController.allCoursesActiveWithComponentsData(
          allCoursesActive,
          req.user.id,
        );
      } else courses = allCoursesActive;

      // console.log('courses55:', courses);
      res.locals.allCoursesActive = courses;

      // console.log('coursesDisplayBy1:', coursesDisplayBy);

      /** Test entries for student: */
      /* courses[0].markedAsDoneComponentsUUIDs.push('9f953cdc-4d0d-4700-b5d0-90857cc039b9');
                                                                                                                courses[1].markedAsDoneComponentsUUIDs.push('73deac36-adf9-4205-9e69-dba0bc7976f1');
                                                                                                                courses[1].markedAsDoneComponentsUUIDs.push('188625d2-e039-4ea7-9737-2d4396820ec1');
                                                                                                                courses[1].markedAsDoneComponentsUUIDs.push('c6a0a770-7f11-425d-a748-f0a9fe13f89e');
                                                                                                                // courses[2].markedAsDoneComponentsUUIDs.push('8425abdd-9690-4bab-92b6-1c6feb5aead9');
                                                                                                                // courses[2].markedAsDoneComponentsUUIDs.push('138e043e-9aab-4400-85c8-d72d242f670b');
                                                                                                                // courses[2].markedAsDoneComponentsUUIDs.push('f24f3ffb-199d-4b78-aa00-dce4992f18d9');
                                                                                                                courses[4].markedAsDoneComponentsUUIDs.push('1bca8c63-7637-4a6f-844d-c0a231cbd397');
                                                                                                                courses[3].markedAsDoneComponentsUUIDs.push('fbbbf667-ec8b-4287-baad-6975b917f505');
                                                                                                                courses[3].markedAsDoneComponentsUUIDs.push('ea8b329e-1585-4d13-abcb-60d2c01a4da3');
                                                                                                                courses[3].markedAsDoneComponentsUUIDs.push('9e552ecd-728c-4556-91e9-d42611393dbe');
                                                                                                                courses[3].markedAsDoneComponentsUUIDs.push('750a3a40-6f2e-4575-b684-79608403642c'); */

      // console.log('allTeachers1:', allTeachers);
      /** Rendering student's dashboard if courses are displayed by Name */
      if (coursesDisplayBy === "name") {
        return res.render("dashboard-student", {
          coursesDisplayBy,
          courses,
          adminName,
          adminEmail,
          user: req.user,
          teacherCourses: sortedCoursesGroupedByTeacher,
          teachers: allTeachers,
          courseUpdates7Days,
        });
      }
      /** Rendering student's dashboard if courses are displayed by Progress */
      if (coursesDisplayBy === "progress") {
        /**
         * Sort courses by the % of elements in markedAsDoneComponentsUUIDs that are included in the courseBranchComponentsUUIDs array. A'ka the precentage of markedAsDone components.
         * If two elements have the same %, these elements are sorted by courseName
         */
        courses.sort((a, b) => {
          const aLength = a.courseBranchComponentsUUIDs.length;
          const bLength = b.courseBranchComponentsUUIDs.length;
          const aDoneLength = a.markedAsDoneComponentsUUIDs.filter((uuid) =>
            a.courseBranchComponentsUUIDs.includes(uuid),
          ).length;
          const bDoneLength = b.markedAsDoneComponentsUUIDs.filter((uuid) =>
            b.courseBranchComponentsUUIDs.includes(uuid),
          ).length;
          const aPercentage = aLength > 0 ? aDoneLength / aLength : 0;
          const bPercentage = bLength > 0 ? bDoneLength / bLength : 0;

          if (aPercentage === bPercentage) {
            return a.courseName.localeCompare(b.courseName);
          }
          if (aPercentage === 0) {
            return 1;
          }
          if (bPercentage === 0) {
            return -1;
          }
          return bPercentage - aPercentage;
        });
        // console.log('courses2:', courses);

        return res.render("dashboard-student", {
          coursesDisplayBy,
          courses,
          adminName,
          adminEmail,
          user: req.user,
          teacherCourses: sortedCoursesGroupedByTeacher,
          teachers: allTeachers,
          courseUpdates7Days,
        });
      }
      /** Rendering student's dashboard if courses are displayed by Semester */
      if (coursesDisplayBy === "semester") {
        const allCoursesGroupedBySemester = courses.groupBy(
          ({ courseSemester }) => courseSemester,
        );
        // console.log('allCoursesGroupedByTeacher1:', allCoursesGroupedByTeacher);
        const sortedCoursesGroupedBySemester = Object.keys(
          allCoursesGroupedBySemester,
        )
          .sort((a, b) => {
            // Extract the year and first letter of each element
            const yearA = a.slice(1);
            const yearB = b.slice(1);
            const letterA = a[0];
            const letterB = b[0];
            // Compare the years first
            if (yearA !== yearB) {
              return yearB - yearA;
            }
            // If the years are the same, compare the first letter
            return letterB.localeCompare(letterA);
          })
          .reduce((acc, semester) => {
            acc[semester] = allCoursesGroupedBySemester[semester].sort((a, b) =>
              a.courseName.localeCompare(b.courseName),
            );
            return acc;
          }, {});

        const seasons = {
          K: "Kevad",
          S: "Sügis",
        };
        const sortedCoursesGroupedBySemesterWithFullNames = {};

        Object.keys(sortedCoursesGroupedBySemester).forEach((semester) => {
          if (
            Object.prototype.hasOwnProperty.call(
              sortedCoursesGroupedBySemester,
              semester,
            )
          ) {
            const season = semester.substring(0, 1);
            const year = semester.substring(1);
            sortedCoursesGroupedBySemesterWithFullNames[
              `${seasons[season]} ${year}`
            ] = sortedCoursesGroupedBySemester[semester];
          }
        });
        // console.log('sortedCoursesGroupedBySemesterWithFullNames1:', sortedCoursesGroupedBySemesterWithFullNames);

        return res.render("dashboard-student", {
          coursesDisplayBy,
          adminName,
          adminEmail,
          courses: sortedCoursesGroupedBySemesterWithFullNames,
          user: req.user,
          teacherCourses: sortedCoursesGroupedByTeacher,
          teachers: allTeachers,
          courseUpdates7Days,
        });
      }
    }

    /** If isTeacher is somehow neither true/false, redirect back to /dashboard. */
    console.log("isTeacher is neither true/false");
    return res.redirect("/dashboard");
  },
  /** For '/course/:courseSlug/:contentSlug?/:componentSlug?' route */
  getSpecificCourse: async (req, res, next) => {
    /** Read parameters sent with endpoint */
    const { courseSlug, contentSlug, componentSlug } = req.params;

    const { ref } = req.query;

    /** If user's team is not found, route to /notfound. Only users with valid team are allowed to see course content. This is checked with app.js. */
    if (!req.user.team.slug) return res.redirect("/notfound");

    const teamSlug = req.user.team.slug;
    res.locals.teamSlug = teamSlug;

    /** selectedVersion variable refers to either:
     * - teacher's selected version on a course page
     * - manually entered ref= value in URL.
     * selectedVersion variable is used down below to get correct course version from GitHub.
     */
    const selectedVersion = req.session.selectedVersion || ref || null;
    res.locals.selectedVersion = selectedVersion;
    // console.log('selectedVersion1:', selectedVersion);

    /**
     * Get array of component UUID-s that have been marked as done by the user. This array is stored in MariaDB.
     */
    const markedAsDoneComponentsArr = await getMarkedAsDoneComponents(
      req.user.id,
      courseSlug,
    );
    // console.log('markedAsDoneComponentsArr10:', markedAsDoneComponentsArr);
    res.locals.markedAsDoneComponentsArr = markedAsDoneComponentsArr;

    /** Get all available courses for the user. */
    const start7 = performance.now();
    const allCourses = await getAllCoursesData(teamSlug, req);
    const end7 = performance.now();
    console.log(`Execution time allCourses: ${end7 - start7} ms`);

    const allCoursesActive = allCourses.filter((x) => x.courseIsActive);
    await allCoursesActive.sort((a, b) =>
      a.courseName.localeCompare(b.courseName),
    );
    // console.log('allCoursesActive2:', allCoursesActive);

    /** Get the selected course that was accessed with current endpoint  */
    const course = allCoursesActive.filter(
      (x) => x.courseIsActive && x.courseSlug === courseSlug,
    )[0];

    /** If no course is found (meaning that the courseSlug doesn't match any courses in GitHub OR none of the course branches in Github are active), then user tried to manually access an invalid course page. Redirect to /notfound page.
     */
    // console.log('course1:', course);
    if (!course) return res.redirect("/notfound");

    res.locals.course = course;

    /** Get all teachers */
    const allTeachers = await teamsController.getUsersInTeam("teachers");
    // console.log('allTeachers0:', allTeachers);
    res.locals.teachers = allTeachers;

    /** Check if course Repo has a branch that matches user team's slug.
     * -- If yes, then all GitHub requests must refer to this branch. In the app, STUDENT must see data only from the branch that has a matching Team name. E.g. student in team "rif20" should only see course information from branch "rif20" for any course, if such branch exists.
     * -- If such branch doesn't exist, then STUDENT should see data from master/main branch.
     * For TEACHERS, the logic is explained on following rows.
     */

    /** refBranch variable refers to the repo branch where course data must be read. refBranch is defined on following rows. */
    let refBranch;
    let validBranches;

    /** Get all course branches that have config as active:true */
    try {
      validBranches = await apiRequests.validBranchesService(
        course.coursePathInGithub,
      );
    } catch (error) {
      console.error(error);
    }

    /**
     * KURSUSE ÕIGE VERSIOONI NÄITAMISE LOOGIKA:
     * 1. Kui on antud selectedVersion ja kursuse aktiivsete branchide all on sama nimega branch, siis loe infot sellest branchist
     * 2. Kui on antud selectedVersion, ja kursuse aktiivsete branchide all EI OLE sama nimega branchi, siis suuna /notfound lehele. St, et kasutaja püüdis URLi ligi pääseda kursusele versioonile, mis ei ole aktiivne.
     * 3. Kui pole antud selectedVersion, siis vaata, kas kursuse aktiivsete branchide all on kasutaja tiiminimega sama branch. Kui jah, siis loe infot sellest branchist
     * 4. Kui pole antud selectedVersion, ja kui kursuse aktiivsete branchide all EI OLE kasutaja tiiminimega sama nimega branchi, siis pead kontrollima, kas kasutaja on äkki 'teachers' tiimis (NB! ('teachers') tiimil pole enda nimega branche).
     * -- 4a. Kui kasutaja ON 'teachers' tiimis, siis sa pead leidma aktiivsete branchide alt esimese kursuse, mille teacherUsername on kasutaja username. Kui kursusel nii master kui ka rif20 branchid aktiivsed, aga masteri teacher on muu kasutaja, siis peab sisseloginud kasutajale kuvama rif20 branchi, kus tema on määratud õpetaja. St, tagasta kursuse esimene aktiivne branch, mille lingitud õpetaja on sisseloginud õpetaja.
     * -- 4b. Kui kasutaja ON 'teachers' tiimis, ja kui aktiivsete branchide all pole ühtegi versioon, mille teacherUsername on sisseloginud kasutaja, siis tagasta kursuse esimene aktiivne branch.
     * -- 4c. Kui kursuse all pole ühtegi aktiivset branchi, suuna "/notfound" lehele.
     * 5. Kui kasutaja EI OLE 'teachers' tiimis, aga kui aktiivsete branchide all on mõni versioon, siis tagasta esimene aktiivne versioon.
     * 6. Kui kasutaja EI OLE 'teachers' tiimis, pole antud selectedVersion ja kasutaja tiim pole validBranches hulgas, siis suuna "/notfound" lehele.
     */

    // 1.
    if (selectedVersion && validBranches.includes(selectedVersion)) {
      refBranch = selectedVersion;
      // 2.
    } else if (selectedVersion && !validBranches.includes(selectedVersion)) {
      return res.redirect("/notfound");
      // 3.
    } else if (!selectedVersion && validBranches.includes(teamSlug)) {
      refBranch = teamSlug;
      // 4.
    } else if (!selectedVersion && !validBranches.includes(teamSlug)) {
      const validBranchConfigPromises = validBranches.map(async (branch) => {
        return await getConfig(course.coursePathInGithub, branch);
      });
      const validBranchConfigs = await Promise.all(validBranchConfigPromises);
      // console.log('validBranchConfigs1:', validBranchConfigs);

      if (allTeachers.find((teacher) => teacher.login === req.user.username)) {
        validBranchConfigs.findIndex(
          (config) => config.teacherUsername === req.user.username,
        );

        return res.redirect("/notfound");
      }
      // 5.
      if (validBranches.length >= 0) {
        const firstActiveBranchIndex = validBranchConfigs.findIndex(
          (config) => config.active === true,
        );
        refBranch = validBranches[firstActiveBranchIndex];
      }
      // 6.
    } else return res.redirect("/notfound");

    // console.log('refBranch3:', refBranch);

    /**
     * Save refBranch to res.locals. This is used by coursesService.js file.
     */
    res.locals.refBranch = refBranch;
    res.locals.branches = validBranches;
    res.locals.allTeams = (await teamsController.getAllValidTeams()).teams // get all teams names except for teachers and existing branches
      .filter(
        (team) =>
          team.name !== "Teachers" && !validBranches.includes(team.name),
      )
      .map((team) => team.name);

    /** Get config file for given course and its correct refBranch */
    let config;

    try {
      config = await getConfig(course.coursePathInGithub, refBranch);
    } catch (error) {
      /**
       * If config file is not returned with course.coursePathInGithub, the coursePathInGithub is invalid. User tried to access an invalid URL.
       * Redirect to /notfound page
       */
      console.log(
        "No config found with getConfig function when loading course page. Rerouting to /notfound.",
      );
      return res.redirect("/notfound");
    }

    console.log(
      `reading content data for ${course.coursePathInGithub} from ${refBranch} branch`,
    );

    // console.log('config2:', config);
    // console.log('config.lessons2:', config.lessons);

    res.locals.course = course;
    res.locals.config = config;
    res.locals.allCourses = allCoursesActive;

    /** Get arrays of components where Back and Forward buttons must be displayed.
     * Get arrays of components where "Märgi loetuks" options must be displayed. */
    const { backAndForwardPaths, markAsDonePaths } =
      setCourseButtonPaths(config);
    // console.log('backAndForwardPaths4:', backAndForwardPaths);
    // console.log('markAsDonePaths4:', markAsDonePaths);
    res.locals.backAndForwardPaths = backAndForwardPaths;
    res.locals.markAsDonePaths = markAsDonePaths;

    /** Following code works directly on the config file that was received.
     * It uses parameters given with current endpoint (courseSlug, contentSlug, componentSlug) and finds matching elements from the config file.
     * Once matching element is found from the config file, it makes a request to Github to pull this information with Github API.
     */

    /**
     * Find from multiple object arrays
     * For contentSlug, find slug from docs, additionalMaterials, lessons, lessons additionalMaterials
     * For componentSlug, find slug from concepts, practices
     * If exists, add to breadcrumbNames and path
     */

    /**
     * Collect docs arrays from config under one object array.
     */
    let docsArray = config.docs.concat(
      config.additionalMaterials,
      config.lessons,
    );
    config.lessons.forEach((x) => {
      docsArray = docsArray.concat(x.additionalMaterials);
    });
    /**
     * Then check for matching slug from docs object array.
     * If a match, get the respective contentName.
     */
    let contentName;
    let githubRequest;

    /**
     * Sisulehe content ja componenti UUID lugemine config failist, andmebaasis sisulehe märkimiseks
     */
    let contentUUID;
    let componentUUID;

    config.docs.forEach((x) => {
      if (x.slug === contentSlug) {
        contentName = x.name;
        githubRequest = "docsService";
        // console.log('Slug found in config.docs');
      }
    });
    config.additionalMaterials.forEach((x) => {
      if (x.slug === contentSlug) {
        contentName = x.name;
        githubRequest = "courseAdditionalMaterialsService";
        // console.log('Slug found in config.additionalMaterials');
      }
    });
    config.lessons.forEach((x) => {
      if (x.slug === contentSlug) {
        contentName = x.name;
        contentUUID = x.uuid;
        githubRequest = "lessonsService";
        // console.log('Slug found in config.lessons');
      }
    });

    /**
     * Check for matching slug from concepts, practices and lessons additionalMaterials arrays.
     * If a match, get the componentName, componentUUID and set componentType.
     */
    let componentName;
    let componentType;

    config.concepts.forEach((x) => {
      if (x.slug === componentSlug) {
        const lesson = config.lessons.find((les) =>
          les.components.includes(componentSlug),
        );
        // console.log('lesson1:', lesson);

        if (lesson && lesson.slug === contentSlug) {
          componentName = x.name;
          componentUUID = x.uuid;
          componentType = "concept";
          githubRequest = "lessonComponentsService";
          // console.log('Slug found in config.concepts');
        }
      }
    });
    config.practices.forEach((x) => {
      if (x.slug === componentSlug) {
        const lesson = config.lessons.find((les) =>
          les.components.includes(componentSlug),
        );
        // console.log('lesson1:', lesson);

        if (lesson && lesson.slug === contentSlug) {
          componentName = x.name;
          componentUUID = x.uuid;
          componentType = "practice";
          githubRequest = "lessonComponentsService";
          // console.log('Slug found in config.concepts');
        }
      }
    });
    config.lessons.forEach((x) => {
      if (
        x.additionalMaterials[0].slug === componentSlug &&
        x.slug === contentSlug
      ) {
        componentName = x.additionalMaterials[0].name;
        componentType = "docs";
        githubRequest = "lessonAdditionalMaterialsService";
        // console.log('Slug found in config.lessons.additionalMaterials');
      }
    });

    /** You can check all relevant values about current endpoint:
     */
    // console.log('courseSlug1:', courseSlug);
    // console.log('course.courseName1:', course.courseName);
    // console.log('contentSlug1:', contentSlug);
    // console.log('contentName1:', contentName);
    // console.log('contentUUID1:', contentUUID);
    // console.log('componentSlug1:', componentSlug);
    // console.log('componentName1:', componentName);
    // console.log('componentUUID1:', componentUUID);
    // console.log('githubRequest1:', githubRequest);

    /**
     * IF contentSlug exists, but contentName is NOT returned from config file.
     * OR if contentSlug, contentName and componentSlug exist, but componentName is NOT returned from config file.
     * THEN
     * - a) user accessed an URL that does not match with the config file.
     * - b) config file has inconsistencies (lesson components do not match with concepts or practices arrays).
     * Config file MUST BE checked for any inconsistencies.
     * Redirect back to homepage!
     */
    if (
      (contentSlug && !contentName) ||
      (contentSlug && contentName && componentSlug && !componentName)
    ) {
      console.log("no contentName or componentName found");
      return res.redirect("/notfound");
    }

    /** Function to set correct fullPath, depending on if componentSlug and/or contentSlug exist.
     * This defines correct fullPath, depending how deep into subpages you are.
     * This is used to assign correct a href-s for sidebar elements and for Back/Forward buttons.
     */
    function getFullPath() {
      if (componentSlug) {
        return `${contentSlug}/${componentSlug}`;
      }
      if (contentSlug) {
        return `${contentSlug}`;
      }
      return undefined;
    }

    /** Function to set correct componentType, depending on if componentSlug and/or contentSlug exist.
     * This defines correct componentType, depeonding how deep into subpages you are.
     * This is used to assign correct sidebar icons.
     */
    function getType() {
      if (componentSlug) {
        return componentType;
      }
      if (contentSlug) {
        return "docs";
      }
      return undefined;
    }

    /**  Save page names for breadcrumbs. */
    const breadcrumbNames = {
      courseName: course.courseName,
      contentName,
      componentName,
    };
    /** Save all relevant info about current page: slugs, fullPath, menu icons. These are used to render correct info on given page with responseAction() and renderPage() functions. */
    const path = {
      courseSlug,
      contentSlug,
      componentSlug,
      refBranch,
      contentUUID,
      componentUUID,
      fullPath: getFullPath(contentSlug, componentSlug),
      type: getType(contentSlug, componentSlug),
    };

    res.locals.githubRequest = githubRequest;
    res.locals.coursePathInGithub = course.coursePathInGithub;
    res.locals.breadcrumbNames = breadcrumbNames;
    res.locals.path = path;

    // console.log('res.locals1:', res.locals);
    return next();
  },
  /** The function allCoursesActiveWithComponentsData() is used to get info about markedAsDone components for each active course for the given user (githubID).
   * Parameters are list of all active courses + user's githubID whose markedAsDone info is requested.
   */
  allCoursesActiveWithComponentsData: async (allCoursesActive, githubID) => {
    /** First, for each course, get a list of component UUIDs that has been marked as done. Save this to allCoursesActiveDoneComponentsArr array. */
    const allCoursesActiveDoneComponentsPromises = allCoursesActive.map(
      (course) => getMarkedAsDoneComponents(githubID, course.courseSlug),
    );

    const allCoursesActiveDoneComponentsArr = await Promise.all(
      allCoursesActiveDoneComponentsPromises,
    );
    // console.log('allCoursesActiveDoneComponentsArr1:', allCoursesActiveDoneComponentsArr);

    /** Then, again for each course, add the respective array of done components as a key-value pair: */
    allCoursesActive.forEach((course, index) => {
      allCoursesActive[index].markedAsDoneComponentsUUIDs =
        allCoursesActiveDoneComponentsArr[index];
    });

    /** You now have a list of active courses where each course has a list of markedAsDone components' UUIDs by the given user. */
    // console.log('allCoursesActive1:', allCoursesActive);
    return allCoursesActive;
  },

  getAllConcepts: async (courses, refBranch) => {
    if (cacheConcepts.has("concepts")) {
      return new Promise((resolve) => {
        console.log(`✅✅  concepts IS from cache`);
        resolve(cacheConcepts.get("concepts"));
      });
    } else {
      console.log(`❌❌ concepts IS NOT from cache`);
      const allConcepts = [];
      await Promise.all(
        courses.map(async (course) => {
          const folderContent = await getFolder(
            process.env.REPO_ORG_NAME,
            course.courseSlugInGithub,
            "concepts",
            refBranch,
          );
          course.config.concepts.forEach((concept) => {
            // find where is concept defined
            if (folderContent.filter((f) => f.name === concept.slug).length) {
              concept.course = course.courseSlugInGithub;
            }
            // vaata kas sama uuid'ga on juba kirje, kui on, siis lisa sellele usedIn
            const isDefined = allConcepts.find((c) => c.uuid === concept.uuid);
            if (isDefined) {
              if (Array.isArray(isDefined.usedIn))
                isDefined.usedIn.push(course.courseSlugInGithub);
              else isDefined.usedIn = [course.courseSlugInGithub];
            } else {
              concept.course = course.courseSlugInGithub;
              if (Array.isArray(concept.usedIn)) {
                concept.usedIn.push(course.courseSlugInGithub);
              } else {
                concept.usedIn = [course.courseSlugInGithub];
              }
              allConcepts.push(concept);
            }
          });
        }),
      );
      cacheConcepts.set("concepts", allConcepts);
      // return only with course, sort by name then by course
      return allConcepts
        .filter((c) => !!c.course)
        .sort((a, b) =>
          a.name > b.name
            ? 1
            : b.name > a.name
            ? -1
            : a.course > b.course
            ? 1
            : b.course > a.course
            ? -1
            : 0,
        );
    }
  },

  getAllLessons: async (searchTerm, courses, refBranch) => {
    if (cacheLessons.has("lessons")) {
      return new Promise((resolve) => {
        console.log(`✅✅  lessons IS from cache`);
        resolve(cacheLessons.get("concepts"));
      });
    } else {
      console.log(`❌❌ lessons IS NOT from cache`);
      const allLessons = [];
      await Promise.all(
        courses.map(async (course) => {
          const folderContent = await getFolder(
            process.env.REPO_ORG_NAME,
            course.courseSlugInGithub,
            "lessons",
            refBranch,
          );
          course.config.lessons.forEach((lesson) => {
            if (folderContent.filter((f) => f.name === lesson.slug).length) {
              lesson.course = course.courseSlugInGithub;
              allLessons.push(lesson);
            }
          });
        }),
      );
      cacheLessons.set("lessons", allLessons);
      return allLessons;
    }
  },
  /*
                                Kursuse muutmine:
                                concepts = [
                                    {
                                        "slug": "naidis-sisuteema",
                                        "name": "Näidis Sisuteema",
                                        "uuid": "7cc19837-3dfe-4da7-ac2e-b4f7132fb3a4"
                                    }, {
                                        "slug": "sisu-loomise-juhend",
                                        "name": "Sisu loomise juhend",
                                        "uuid": "49b640ef-5c58-41e2-9392-4514f49a9c17"
                                    }],
                  
                                kasutaja peab saama "linkida" teistest repodest.
                                Link tähendab, et config.json concepts osas on objekt, mis kuulub tegelikult teise reposse.
                                Kasutaja peab saama otsida concepte (esialgu nime järgi, aga ka sisu järgi),
                                kasutaja peab nägema eelvaadet,
                                kasutaja peab saama muuta concepti - kui on lingitud sisu, siis näeb, kus veel on kasutatud,
                                kui hakkab sisu muutma, siis peaks saama valida, kas muudab originaali kõikjal, või luuakse orig põhjal uus sisu
                  
                                Äkki võiks sama loogika olla ka teiste plokkide kohta (lessons, praktikumid)
                  
                  
                                 */
};
export {
  allCoursesController,
  responseAction,
  renderPage,
  renderEditPage,
  getMarkedAsDoneComponents,
};
