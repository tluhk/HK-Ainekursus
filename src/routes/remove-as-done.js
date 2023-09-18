/** Endpoint to unmark/remove course component as Done */
import ensureAuthenticated from "../middleware/ensureAuthenticated.js";
import pool from "../../db.js";
import { cacheMarkedAsDoneComponents } from "../setup/setupCache.js";
import express from "express";

const router = express.Router();
router.post("/", ensureAuthenticated, async (req, res) => {
  const { courseSlug, componentSlug, componentUUID } = req.body;

  const githubID = req.user.id;

  if (!githubID || !courseSlug || !componentSlug || !componentUUID) {
    return res.redirect("/notfound");
  }

  if (githubID && courseSlug && componentSlug && componentUUID) {
    let conn;
    try {
      conn = await pool.getConnection();
      const res6 = await conn.query(
        "SELECT markedAsDoneComponents FROM users_progress WHERE githubID = ? AND courseCode = ?;",
        [githubID, courseSlug],
      );

      if (res6[0]) {
        const res7 = await conn.query(
          "UPDATE users_progress SET markedAsDoneComponents = JSON_REMOVE(markedAsDoneComponents, CONCAT('$.', ?)) WHERE githubID = ? AND courseCode = ?;",
          [componentUUID, githubID, courseSlug],
        );
      }

      /** Check if cache for markedAsDoneComponents for given user and given course exists.
       * If yes, delete cache for markedAsDoneComponents when user removes a done component from given course */
      if (
        cacheMarkedAsDoneComponents.has(
          `markedAsDoneComponents+${githubID}+${courseSlug}`,
        )
      )
        cacheMarkedAsDoneComponents.del(
          `markedAsDoneComponents+${githubID}+${courseSlug}`,
        );
    } catch (err) {
      // console.log('Unable to connect to MariaDB 3');
      console.log("Unable to remove component as done");
      console.error(err);
    } finally {
      if (conn) conn.release(); // release to pool
    }
  }

  return res.redirect("back");
});

export default router;
