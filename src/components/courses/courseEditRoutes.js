import express from 'express';
import {
  allCoursesController, renderEditPage,
  responseAction
} from './coursesController.js';
import validateTeacher from '../../middleware/validateTeacher.js';

const router = express.Router();

router.get(
  '/:courseId/:contentSlug?/:componentSlug?',
  validateTeacher,
  allCoursesController.getSpecificCourse,
  responseAction,
  renderEditPage
);

router.post(
  '/',
  allCoursesController.updateCourseData
);

export default router;