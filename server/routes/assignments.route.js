import express from 'express';

import { protect, authorize } from '../middleware/auth.js';
import {
  createAssignment,
  getMyAssignments,
  getTeacherAssignments,
  submitQuiz,
  submitProject,
  getAssignmentSubmissions,
  downloadSubmissionFile,
  gradeSubmission,
} from '../controllers/assignments.controller.js';

const router = express.Router();

// Teacher/admin creates assignments
router.post('/', protect, authorize('teacher', 'admin'), createAssignment);

// Student lists assignments
router.get('/', protect, authorize('student'), getMyAssignments);

// Teacher lists their course assignments
router.get('/teacher', protect, authorize('teacher', 'admin'), getTeacherAssignments);

// Student quiz submission
router.post('/:assignmentId/submissions/quiz', ...submitQuiz);

// Student project submission (file upload)
router.post(
  '/:assignmentId/submissions/project',
  ...submitProject
);

// Teacher view submissions for an assignment
router.get(
  '/:assignmentId/submissions',
  protect,
  authorize('teacher', 'admin'),
  getAssignmentSubmissions
);

// Teacher grades a submission
router.post(
  '/:assignmentId/submissions/:submissionId/grade',
  protect,
  authorize('teacher', 'admin'),
  gradeSubmission
);

// Proxy download
router.get(
  '/submissions/:submissionId/download',
  protect,
  downloadSubmissionFile
);

export default router;
