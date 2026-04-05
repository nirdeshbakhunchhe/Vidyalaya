
import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  initiatePayment,
  verifyPayment,
  getMyPayments,
  downloadReceiptPdf,
  getTeacherPayments,
  downloadTeacherReceiptPdf,
} from '../controllers/payment.controller.js';

const router = express.Router();

// Student initiates Khalti payment after teacher approves their enrollment
router.post('/initiate', protect, initiatePayment);

// Called after Khalti redirects back to /payment/verify?pidx=...
router.post('/verify',   protect, verifyPayment);

// Student's own payment history (optional utility route)
router.get('/history',   protect, getMyPayments);

// Download a PDF receipt for a completed payment (student-owned)
router.get('/:paymentId/receipt', protect, downloadReceiptPdf);

// Teacher's payment history (payments for teacher's courses)
router.get('/teacher/history', protect, authorize('teacher', 'admin'), getTeacherPayments);

// Teacher download payment record PDF (teacher-owned course payment)
router.get('/teacher/:paymentId/receipt', protect, authorize('teacher', 'admin'), downloadTeacherReceiptPdf);

export default router;