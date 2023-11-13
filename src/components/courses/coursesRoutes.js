import express from 'express';
import ensureAuthenticated from '../../middleware/ensureAuthenticated.js';
import {
  allCoursesController, renderEditPage,
  renderPage,
  responseAction
} from './coursesController.js';
import validateTeacher from '../../middleware/validateTeacher.js';

const router = express.Router();

/**
 * Get single course by Id
 */
router.get(
  '/:courseId/:contentSlug?/:componentSlug?',
  //ensureAuthenticated,
  allCoursesController.getSpecificCourse,
  responseAction,
  renderPage
);

export default router;