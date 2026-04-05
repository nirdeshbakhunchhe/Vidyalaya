import express from 'express';
import {
  getAllProgress,
  getCourseProgress,
  markLessonComplete,
  addWatchTime
} from '../controllers/progress.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getAllProgress);

router.route('/:courseId')
  .get(getCourseProgress);

router.route('/:courseId/mark-complete')
  .post(markLessonComplete);

router.route('/:courseId/time')
  .post(addWatchTime);

export default router;
