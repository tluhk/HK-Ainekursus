/** Endpoint to mark a course component as Done */
import express from 'express';
import ensureAuthenticated from '../middleware/ensureAuthenticated.js';
import pool from '../../db.js';
import { cacheMarkedAsDoneComponents } from '../setup/setupCache.js';

const router = express.Router();
router.post('/', ensureAuthenticated, async (req, res) => {
  const {
    courseSlug,
    componentSlug,
    componentUUID,
    nextPagePath
  } = req.body;

  const githubID = req.user.id;

  if (!githubID || !courseSlug || !componentSlug || !componentUUID) {
    return res.redirect('/notfound');
  }

  if (githubID && courseSlug && componentSlug && componentUUID) {
    let conn;
    try {
      conn = await pool.getConnection();
      const res1 = await conn.query(
        'SELECT markedAsDoneComponents FROM users_progress WHERE githubID = ? AND courseCode = ?;',
        [githubID, courseSlug]
      );

      if (!res1[0]) {
        const keyValue = {};
        keyValue[componentUUID] = componentSlug;
        await conn.query(
          'INSERT INTO users_progress (githubID, courseCode, markedAsDoneComponents) VALUES (?, ?, ?);',
          [githubID, courseSlug, keyValue]
        );
      } else {
        await conn.query(
          'UPDATE users_progress SET markedAsDoneComponents = JSON_SET(markedAsDoneComponents, CONCAT(\'$.\', ?), ?) WHERE githubID = ? AND courseCode = ?;',
          [componentUUID, componentSlug, githubID, courseSlug]
        );
      }

      /** Check if cache for markedAsDoneComponents for given user and given course exists.
       * If yes, delete cache for markedAsDoneComponents when user adds a
       * component from given course */
      if (
        cacheMarkedAsDoneComponents.has(
          `markedAsDoneComponents+${ githubID }+${ courseSlug }`
        )
      ) {
        cacheMarkedAsDoneComponents.del(
          `markedAsDoneComponents+${ githubID }+${ courseSlug }`
        );
      }
    } catch (err) {
      console.log('Unable to mark component as done');
      console.error(err);
    } finally {
      if (conn) {
        await conn.release();
      } // release to pool
    }
  }

  return res.redirect(nextPagePath);
});

export default router;
