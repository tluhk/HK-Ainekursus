import express from "express";
import ensureAuthenticated from "../middleware/ensureAuthenticated.js";
import { Octokit } from "octokit";
import { v4 as uuidv4 } from "uuid";
import validateTeacher from "../middleware/validateTeacher.js";
import slugify from "slugify";
import {
  delay,
  getFile,
  updateFile,
} from "../functions/githubFileFunctions.js";
import { cacheTeamCourses } from "../setup/setupCache.js";
import { axios } from "../setup/setupGithub.js";
import * as cheerio from "cheerio";
import getAllCoursesData from "../functions/getAllCoursesData.js";

const router = express.Router();
router.get("/", ensureAuthenticated, validateTeacher, (req, res) => {
  return res.render("course-add-new");
});

router.post(
  "/",
  ensureAuthenticated,
  validateTeacher,
  async (req, res, next) => {
    let errorMessage = "";
    // validate request
    if (req.body.oisUrl) {
      const octokit = new Octokit({
        auth: process.env.AUTH,
      });

      const { user } = req;
      const template_owner = process.env.REPO_ORG_NAME;
      const template_repo = process.env.TEMPLATE_REPO;
      const repo_prefix = process.env.REPO_PREFIX;

      let oisUrl = req.body.oisUrl;
      let shortDescription = "";
      let longDescription = "";
      let courseName = "";

      // figure out what user sent: a) OIS url 2) ainekood
      try {
        new URL(oisUrl);
      } catch (error) {
        oisUrl = `https://ois2.tlu.ee/tluois/aine/${req.body.oisUrl}`;
      }
      const tmpSlug = oisUrl.split("/").slice(-1)[0];
      // if course exists...
      const allCourses = await getAllCoursesData("teachers", req);
      const oisCodeExists = allCourses.find(
        (course) => course.courseCode === tmpSlug,
      );

      if (oisCodeExists) {
        res.status(400).send({ msg: "duplicate", courseCode: tmpSlug });
        return next;
      }

      // fetch OIS content
      try {
        await axios(oisUrl).then((response) => {
          const { data } = response;
          if (data.includes(" ei leitud!")) {
            errorMessage = data;
          } else {
            const $ = cheerio.load(data);

            $(".yldaine_r", data).each(function () {
              const yldaine_c1 = $(this).find("div.yldaine_c1").text();
              const yldaine_c2 = $(this).find("div.yldaine_c2").text();

              switch (yldaine_c1) {
                case "Õppeaine nimetus eesti k":
                  courseName = yldaine_c2;
                  break;
                case "Õppeaine eesmärgid":
                  shortDescription = yldaine_c2;
                  break;
                case "Õppeaine sisu lühikirjeldus":
                  longDescription = yldaine_c2;
                  break;
                case "Õppeaine õpiväljundid":
                  longDescription += yldaine_c2;
              }
            });
          }
        });
      } catch (error) {
        errorMessage = "ÕIS'st ei saanud andmeid: " + oisUrl;
      }
      if (!courseName || !longDescription || errorMessage) {
        errorMessage = "Kontrolli ÕIS`i linki, andmeid ei leitud";
        res.status(400).send({ msg: errorMessage });
        return next;
      }

      // check for repo name availability
      let repoName = slugify(`${repo_prefix}${courseName}`);
      const nameExists = cacheTeamCourses
        .get("allCoursesData+teachers")
        .data.filter((course) =>
          course.full_name.startsWith(`${template_owner}/${repoName}`),
        );

      if (nameExists.length) {
        // we have matching name, lets add suffix
        let suffix = 1;
        while (
          nameExists.findIndex(
            (course) =>
              course.full_name === `${template_owner}/${repoName}_${suffix}`,
          ) >= 0
        ) {
          suffix++;
        }
        repoName = `${repoName}_${suffix}`;
      }

      // create repo
      const created = await octokit
        .request(`POST /repos/${template_owner}/${template_repo}/generate`, {
          owner: template_owner,
          name: repoName,
          description: shortDescription
            .replace(/(<|&lt;)br\s*\/*(>|&gt;)/g, " ")
            .trim(),
          include_all_branches: false,
          private: true,
          headers: {
            "X-GitHub-Api-Version": "2022-11-28",
          },
        })
        .catch((err) => {
          console.log(err);
          errorMessage = "Kursuse loomine ebaõnnestus";
          res.status(400).send({ msg: errorMessage });
        });

      if (created.status === 201) {
        let contentOK = false;
        let timeOut = false;
        let waitCounter = 0;
        // wait for content be available and fetch config.json file
        while (!contentOK && !timeOut) {
          await delay(1000);

          const config = await getFile(template_owner, repoName, "config.json");
          if (config) {
            contentOK = true;
            // fix some config.json fields
            const newConfig = updateConfig(
              config.content,
              courseName,
              oisUrl,
              user.username,
              repoName,
            );

            // upload modified file
            updateFile(
              template_owner,
              repoName,
              "config.json",
              { content: newConfig, sha: config.sha },
              "fix config.json",
            )
              .then(() => {
                console.log("config.json updated");
              })
              .catch(() => {
                errorMessage = "config.json loomine ebaõnnestus";
              });
          }
          waitCounter++;
          timeOut = waitCounter > 20;
        }

        // replace readme file
        const readme = await getFile(template_owner, repoName, "README.md");
        if (readme) {
          readme.content = longDescription;
          updateFile(
            template_owner,
            repoName,
            "README.md",
            readme,
            "initial readme",
          ).then(() => console.log("Readme updated"));
        }

        console.log(`✅✅  /course-edit/${tmpSlug}/`);
        cacheTeamCourses.del("allCoursesData+teachers");
        res.status(201).send({ msg: "OK", courseCode: tmpSlug });
        return next;
      }
    } else {
      errorMessage = "Kontrolli andmeid";
      res.status(400).send({ msg: errorMessage });
    }
  },
);

function updateConfig(content, courseName, courseUrl, userName, repoName) {
  const conf = JSON.parse(content);
  conf.courseName = courseName;
  conf.courseUrl = courseUrl;
  conf.teacherUsername = userName;
  conf.semester = "";
  conf.lessons.forEach((l) => (l.uuid = uuidv4()));
  conf.concepts.forEach((c) => {
    c.uuid = uuidv4();
    c.repo = repoName;
  });
  conf.practices.forEach((p) => (p.uuid = uuidv4()));
  return JSON.stringify(conf);
}

export default router;
