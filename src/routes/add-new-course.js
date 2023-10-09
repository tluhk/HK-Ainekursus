import express from "express";
import ensureAuthenticated from "../middleware/ensureAuthenticated.js";
import { Octokit } from "octokit";
import { v4 as uuidv4 } from "uuid";
import validateTeacher from "../middleware/validateTeacher.js";
import slugify from "slugify";
import { delay, getFile, updateFile } from "../functions/githubFieFunctions.js";

const router = express.Router();
router.get("/", ensureAuthenticated, validateTeacher, (req, res) => {
  return res.render("course-add-new");
});

router.post("/", ensureAuthenticated, validateTeacher, async (req, res) => {
  let error = "";
  // validate request
  if (req.body.courseName && req.body.oisUrl) {
    const octokit = new Octokit({
      auth: process.env.AUTH,
    });

    const { user } = req;
    const template_owner = process.env.REPO_ORG_NAME;
    const template_repo = process.env.TEMPLATE_REPO;
    const repo_prefix = process.env.REPO_PREFIX;

    // create repo
    const created = await octokit
      .request(`POST /repos/${template_owner}/${template_repo}/generate`, {
        owner: template_owner,
        name: slugify(`${repo_prefix}${req.body.courseName}`),
        description: req.body.description,
        include_all_branches: false,
        private: true,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      })
      .catch((err) => {
        console.log(err);
        error = "repo loomine ebaõnnestus";
      });

    if (created.status === 201) {
      const repo = slugify(`${repo_prefix}${req.body.courseName}`); //created.data.name;
      let contentOK = false;
      let timeOut = false;
      let waitCounter = 0;
      // wait for content be available and fetch config.json file
      while (!contentOK && !timeOut) {
        await delay(1000);

        const config = await getFile(template_owner, repo, "config.json");
        if (config) {
          contentOK = true;
          // fix some config.json fields
          const newConfig = updateConfig(
            config.content,
            req.body.courseName,
            req.body.oisUrl,
            user.username,
          );

          // upload modified file
          updateFile(
            template_owner,
            repo,
            "config.json",
            { content: newConfig, sha: config.sha },
            "fix config.json",
          )
            .then(() => {
              console.log("config.json updated");
            })
            .catch(() => {
              error = "config.json loomine ebaõnnestus";
            });
        }
        waitCounter++;
        timeOut = waitCounter > 20;
      }

      // replace readme file
      getFile(template_owner, repo, "README.md").then((readme) => {
        if (readme) {
          readme.content = req.body.readme;
          updateFile(
            template_owner,
            repo,
            "README.md",
            readme,
            "initial readme",
          ).then(() => console.log("Readme updated"));
        }
      });

      const tmpSlug = req.body.oisUrl.split("/").slice(-1);
      console.log(`✅✅  /course/${tmpSlug}/`);
      //await allCoursesController.getAllCourses(req, res);
      res.redirect(`/course/${tmpSlug}`);
    } else {
      error = "repo loomine ebaõnnestus";
    }
  } else {
    error = "kontrolli andmeid";
  }
  if (error) {
    res.send(error);
  }
});

function updateConfig(content, courseName, courseUrl, userName) {
  const conf = JSON.parse(content);
  conf.courseName = courseName;
  conf.courseUrl = courseUrl;
  conf.teacherUsername = userName;
  conf.semester = "";
  conf.lessons.forEach((l) => (l.uuid = uuidv4()));
  conf.concepts.forEach((c) => (c.uuid = uuidv4()));
  conf.practices.forEach((p) => (p.uuid = uuidv4()));
  return JSON.stringify(conf);
}

export default router;
