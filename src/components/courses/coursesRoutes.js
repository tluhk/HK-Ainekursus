import express from 'express';
import ensureAuthenticated from '../../middleware/ensureAuthenticated.js';
import {
  allCoursesController,
  renderPage,
  responseAction
} from './coursesController.js';

const router = express.Router();

/**
 * Get single course by Id
 */
router.get(
  '/:courseId/:contentSlug?/:componentSlug?',
  ensureAuthenticated,
  allCoursesController.getSpecificCourse,
  responseAction, renderPage
);

export default router;