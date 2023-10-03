import express from "express";
import ensureAuthenticated from "../middleware/ensureAuthenticated.js";
import { Octokit } from "octokit";
import { v4 as uuidv4 } from "uuid";
import { getFile, updateFile } from "../functions/githubFieFunctions.js";
import slugify from "slugify";
import validateTeacher from "../middleware/validateTeacher.js";

const router = express.Router();
router.get("/", ensureAuthenticated, validateTeacher, (req, res) => {
  return res.render("course-add-new");
});

router.post("/", ensureAuthenticated, validateTeacher, async (req, res) => {
  // validate request
  let error = "";

  if (req.body.courseName && req.body.oisUrl) {
    const octokit = new Octokit({
      auth: process.env.AUTH,
    });

    const { user } = req;
    const template_owner = process.env.REPO_ORG_NAME;
    const template_repo = process.env.TEMPLATE_REPO;

    const created = await octokit
      .request(`POST /repos/${template_owner}/${template_repo}/generate`, {
        owner: template_owner,
        name: slugify(`${process.env.REPO_PREFIX}${req.body.courseName}`),
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
      const repo = created.data.name;
      let contentOK = false;
      let timeOut = false;
      let waitCounter = 0;
      while (!contentOK || !timeOut) {
        setTimeout(() => {
          // oota, kuni repo on loodud ja fail on saadaval
          waitCounter++;
          timeOut = waitCounter > 10;
        }, 2000);

        getFile(template_owner, repo, "config.json").then((config) => {
          if (config) {
            contentOK = true;
            config.content.courseName = req.body.courseName;
            config.content.courseUrl = req.body.oisUrl;
            config.content.teacherUsername = user.userName;
            config.content.semester = "";
            config.content.lessons.forEach((l) => (l.uuid = uuidv4()));
            config.content.concepts.forEach((c) => (c.uuid = uuidv4()));
            config.content.practices.forEach((p) => (p.uuid = uuidv4()));

            updateFile(
              template_owner,
              repo,
              "config.json",
              config,
              "fix config.json",
            ).then(() => console.log("config.json updated"));
          } else {
            error = "config.json loomine ebaõnnestus";
          }
        });
      }
      //kursusele oma readme.md
      getFile(template_owner, repo, "readme.md").then((readme) => {
        readme.content = req.body.readme;
        updateFile(
          template_owner,
          repo,
          "readme.md",
          readme,
          "initial readme",
        ).then(() => console.log("Readme updated"));
      });
    } else {
      error = "repo loomine ebaõnnestus";
    }
  } else {
    error = "kontrolli andmeid";
  }
  if (error) {
    res.send(error);
  } else res.redirect("/course/:courseSlug");
});

export default router;
