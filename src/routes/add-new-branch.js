import express from "express";
import ensureAuthenticated from "../middleware/ensureAuthenticated.js";
import { Octokit } from "octokit";
import validateTeacher from "../middleware/validateTeacher.js";
import getAllCoursesData from "../functions/getAllCoursesData.js";
import { cacheBranches } from "../setup/setupCache.js";
import { delay, getFile, updateFile } from "../functions/githubFieFunctions.js";

const router = express.Router();

router.post("/", ensureAuthenticated, validateTeacher, async (req, res) => {
  let error = "";
  // 1. validate request
  if (
    req.body.courseSlug &&
    req.body.team &&
    req.body.parentBranch &&
    req.body.year &&
    req.body.semester
  ) {
    const octokit = new Octokit({
      auth: process.env.AUTH,
    });

    const template_owner = process.env.REPO_ORG_NAME;
    const ref = req.body.parentBranch;
    // 2. get repo from courseSlug
    const repoName = (await getAllCoursesData("teachers", req)).find(
      (course) => course.courseSlug === req.body.courseSlug,
    ).courseSlugInGithub;

    // 3. get parent branch sha
    const parent = await octokit.request(
      `GET /repos/${template_owner}/${repoName}/git/ref/heads/${ref}`,
      {
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );
    const parentSha = parent.data.object.sha;

    // 4. create new branch/ref
    const newBranch = await octokit.request(
      `POST /repos/${template_owner}/${repoName}/git/refs`,
      {
        ref: "refs/heads/" + req.body.team,
        sha: parentSha,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );
    // 5. update new branch config.json (set semester)
    let contentOK = false;
    let timeOut = false;
    let waitCounter = 0;
    while (!contentOK && !timeOut) {
      await delay(1000);
      const branchConfig = await getFile(
        template_owner,
        repoName,
        "config.json",
        req.body.team,
      );

      if (branchConfig && branchConfig.content) {
        contentOK = true;
        // 6. fix config.json semester field
        const conf = JSON.parse(branchConfig.content);
        conf.semester = `${req.body.semester}${req.body.year}`;
        await updateFile(
          template_owner,
          repoName,
          "config.json",
          { content: JSON.stringify(conf), sha: branchConfig.sha },
          "add semester",
          req.body.team,
        );
      }
      waitCounter++;
      timeOut = waitCounter > 20;
    }

    // 7. get status=201, redirect back to the course page
    cacheBranches.del(`${template_owner}/${repoName}+branches`);
    if (newBranch.status === 201) {
      const backURL = req.header("Referer") || "/";
      res.redirect(backURL);
    } else {
      error = "Uut haru ei saanud luua";
      res.send(error);
    }
  } else {
    res.send("invalid data");
  }
});

export default router;
