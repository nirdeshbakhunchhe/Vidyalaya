// controllers/payment.controller.js  ← NEW FILE
//
// Handles Khalti payment for paid course enrollments.
// Mirrors the RentPal paymentController.js pattern exactly:
//   POST /api/payments/initiate  → calls Khalti, saves pending Payment record
//   POST /api/payments/verify    → calls Khalti lookup, marks enrollment 'enrolled'
//   GET  /api/payments/history   → student's own payment history

import axios from 'axios';
import PDFDocument from 'pdfkit';
import Payment from '../models/payment.model.js';
import Enrollment from '../models/enrollmentModel.js';
import Course from '../models/courseModel.js';
import Notification from '../models/notification.model.js';
import { emitNotification } from '../socket.js';

// ── Shared Khalti header ──────────────────────────────────────────────────────
const khaltiHeaders = () => ({
  Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
  'Content-Type': 'application/json',
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/initiate
// Body: { enrollmentId }
//
// Flow:
//   1. Load enrollment; verify it belongs to this student and is 'approved'
//   2. Guard against double-payment
//   3. Call Khalti /epayment/initiate/ → get payment_url + pidx
//   4. Save a pending Payment record
//   5. Update enrollment.paymentStatus to 'pending'
//   6. Return { data: { payment_url, pidx, ... } } — same shape as RentPal
// ─────────────────────────────────────────────────────────────────────────────
export const initiatePayment = async (req, res) => {
  try {
    const { enrollmentId } = req.body;
    const studentId = req.user._id.toString(); // set by protect middleware

    if (!enrollmentId) {
      return res.status(400).json({ message: 'enrollmentId is required' });
    }

    // ── 1. Load and validate the enrollment ──────────────────────────────────
    const enrollment = await Enrollment.findById(enrollmentId).populate('course');

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    if (enrollment.student.toString() !== studentId) {
      return res.status(403).json({ message: 'This enrollment does not belong to you' });
    }
    // Teacher must have approved before the student can pay
    if (enrollment.status !== 'approved') {
      return res.status(400).json({
        message: `Cannot pay yet — enrollment status is "${enrollment.status}". Wait for teacher approval.`,
      });
    }
    // Guard: already fully enrolled (shouldn't happen normally, but be safe)
    if (enrollment.status === 'enrolled' || enrollment.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'You are already enrolled in this course.' });
    }

    const course = enrollment.course;
    if (!course?.price || course.price <= 0) {
      return res.status(400).json({ message: 'This course does not require payment.' });
    }

    // ── 2. Guard: Handle existing pending payments ─────────────
    // If a student abandons a previous checkout, allow them to try again.
    // We mark previous pending payments for this enrollment as 'expired'
    // so we don't block the student from paying again. Even if they complete an
    // "expired" one, the verify endpoint will still mark it completed correctly by pidx.
    await Payment.updateMany(
      { enrollment: enrollmentId, status: 'pending' },
      { $set: { status: 'expired' } }
    );

    // ── 3. Call Khalti to create a payment session ───────────────────────────
    const khaltiPayload = {
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/verify`, // Khalti redirects here
      website_url: process.env.FRONTEND_URL || 'http://localhost:5173',
      amount: course.price * 100,  // Khalti requires paisa (NPR × 100)
      purchase_order_id: `vidyalaya_${enrollmentId}_${Date.now()}`,
      purchase_order_name: course.title,
      customer_info: {
        name:  req.user.name  || 'Student',
        email: req.user.email || '',
        phone: req.user.phone || '9800000000',
      },
    };

    const khaltiRes = await axios.post(
      'https://a.khalti.com/api/v2/epayment/initiate/',
      khaltiPayload,
      { headers: khaltiHeaders() }
    );

    // ── 4. Save pending Payment record ───────────────────────────────────────
    await Payment.create({
      student:    studentId,
      course:     course._id,
      enrollment: enrollmentId,
      amount:     course.price,
      pidx:       khaltiRes.data.pidx,
      status:     'pending',
    });

    // ── 5. Update enrollment paymentStatus so the teacher dashboard can show it
    await Enrollment.findByIdAndUpdate(enrollmentId, { paymentStatus: 'pending' });

    // ── 6. Return the Khalti response to the frontend ─────────────────────────
    // IMPORTANT: response shape matches RentPal exactly so frontend code is identical:
    //   data.data.payment_url  ← the URL to redirect the student to Khalti
    return res.status(200).json({
      message: 'Payment initiation successful',
      payment_method: 'khalti',
      data: khaltiRes.data,   // { pidx, payment_url, expires_at, ... }
    });

  } catch (err) {
    console.error('Payment initiation error:', err.response?.data || err.message);
    return res.status(400).json({
      message: err.response?.data?.detail || err.message || 'Failed to initiate payment',
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/verify
// Body: { pidx }
//
// Called by PaymentVerify.jsx after Khalti redirects back.
// Flow:
//   1. Call Khalti /epayment/lookup/ with pidx — this is the authoritative check
//   2. Find our Payment record by pidx
//   3. If Completed: mark Payment 'completed', mark Enrollment 'enrolled' + 'paid'
//   4. If cancelled/expired: mark Payment 'failed', mark Enrollment paymentStatus 'failed'
//   5. Return Khalti's response so the frontend knows the status
// ─────────────────────────────────────────────────────────────────────────────
export const verifyPayment = async (req, res) => {
  try {
    const { pidx } = req.body;

    if (!pidx) {
      return res.status(400).json({ message: 'pidx is required' });
    }

    // ── 1. Ask Khalti for the authoritative payment status ───────────────────
    const khaltiRes = await axios.post(
      'https://a.khalti.com/api/v2/epayment/lookup/',
      { pidx },
      { headers: khaltiHeaders() }
    );
    const khaltiData = khaltiRes.data;
    // khaltiData.status: 'Completed' | 'Pending' | 'Initiated' | 'Refunded' | 'Expired' | 'User canceled'

    // ── 2. Find our Payment record ───────────────────────────────────────────
    const payment = await Payment.findOne({ pidx });
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found. Please contact support.' });
    }

    // ── 3. Handle COMPLETED payment ──────────────────────────────────────────
    if (khaltiData.status === 'Completed') {
      // Update Payment record
      payment.status        = 'completed';
      payment.transactionId = khaltiData.transaction_id || null;
      payment.paidAt        = new Date();
      await payment.save();

      // Mark the Enrollment as fully enrolled + paid, and add student to course.
      const enrollment = await Enrollment.findById(payment.enrollment);
      if (enrollment) {
        enrollment.status = 'enrolled';
        enrollment.paymentStatus = 'paid';
        enrollment.paidAt = new Date();
        enrollment.transactionId = khaltiData.transaction_id || null;
        await enrollment.save();

        // Add student to course if not already present
        const course = await Course.findById(enrollment.course);
        if (course) {
          const alreadyStudent = course.students.some(
            (id) => id.toString() === enrollment.student.toString()
          );
          if (!alreadyStudent) {
            course.students.push(enrollment.student);
            course.enrollmentCount = course.students.length;
            await course.save();
          }

          // Notify Student
          const studentNotif = await Notification.create({
            userId: enrollment.student,
            message: `Payment successful! You are now enrolled in ${course.title}.`,
            type: 'enrolled',
            courseId: course._id
          });
          emitNotification(enrollment.student, studentNotif);

          // Notify Teacher
          if (course.createdBy) {
            const teacherNotif = await Notification.create({
              userId: course.createdBy,
              message: `A student successfully paid and enrolled in your course ${course.title}.`,
              type: 'enrolled',
              courseId: course._id
            });
            emitNotification(course.createdBy, teacherNotif);
          }
        }
      }

      // Return enough data for the frontend receipt UI
      return res.status(200).json({
        status:         khaltiData.status,        // 'Completed'
        total_amount:   khaltiData.total_amount,  // in paisa
        transaction_id: khaltiData.transaction_id,
        pidx,
        courseId: payment.course,                 // so frontend can link to the course
      });
    }

    // ── 4. Handle FAILED / CANCELLED payments ────────────────────────────────
    const failedStatuses = ['User canceled', 'Expired', 'Refunded'];
    if (failedStatuses.includes(khaltiData.status)) {
      payment.status = 'failed';
      await payment.save();

      await Enrollment.findByIdAndUpdate(payment.enrollment, {
        paymentStatus: 'failed',
      });
    }

    // For Pending/Initiated: don't touch records; just return the status.
    return res.status(200).json({
      status:  khaltiData.status,
      message: `Payment status: ${khaltiData.status}`,
    });

  } catch (err) {
    console.error('Payment verification error:', err.response?.data || err.message);
    return res.status(400).json({
      message: err.response?.data?.detail || err.message || 'Failed to verify payment',
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/history
// Student's own completed payment records
// ─────────────────────────────────────────────────────────────────────────────
export const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ student: req.user._id })
      .sort({ createdAt: -1 })
      .populate('course', 'title image price');

    return res.status(200).json({ success: true, payments });
  } catch (err) {
    console.error('Get payments error:', err.message);
    return res.status(500).json({ message: 'Failed to fetch payment history' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/teacher/history
// Teacher's received payments (payments for courses created by the teacher)
//
// Shows: student name, course name, amount, date, and payment status.
// This uses the existing Payment collection created by Khalti initiate/verify.
// ─────────────────────────────────────────────────────────────────────────────
export const getTeacherPayments = async (req, res) => {
  try {
    // 1) Find the teacher's course IDs
    const myCourses = await Course.find({ createdBy: req.user._id }).select('_id');
    const courseIds = myCourses.map((c) => c._id);

    // 2) Fetch payments for those courses (any status: pending/completed/failed)
    const payments = await Payment.find({ course: { $in: courseIds } })
      .sort({ createdAt: -1 })
      .populate('course', 'title price createdBy')
      .populate('student', 'name email');

    return res.status(200).json({ success: true, payments });
  } catch (err) {
    console.error('Get teacher payments error:', err.message);
    return res.status(500).json({ message: 'Failed to fetch teacher payment history' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/:paymentId/receipt
// Streams a simple PDF receipt for the student's completed payment.
// ─────────────────────────────────────────────────────────────────────────────
export const downloadReceiptPdf = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate('course', 'title instructor duration price')
      .populate('student', 'name email');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    if (payment.student?._id?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this receipt' });
    }
    if (payment.status !== 'completed') {
      return res.status(400).json({ message: 'Receipt is available only for completed payments' });
    }

    const course = payment.course;
    const student = payment.student || req.user;
    const receiptNo = payment.transactionId || payment.pidx || payment._id.toString();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="vidyalaya-receipt-${String(receiptNo).replace(/[^a-zA-Z0-9_-]/g, '')}.pdf"`
    );

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Vidyalaya', { align: 'left' });
    doc.moveDown(0.25);
    doc.fontSize(14).text('Payment Receipt', { align: 'left' });
    doc.moveDown(1);

    // Receipt meta
    doc.fontSize(11);
    doc.text(`Receipt No: ${receiptNo}`);
    doc.text(`Date: ${new Date(payment.paidAt || payment.updatedAt || Date.now()).toLocaleString()}`);
    doc.moveDown(1);

    // Student
    doc.fontSize(12).text('Billed To', { underline: true });
    doc.moveDown(0.25);
    doc.fontSize(11).text(`${student?.name || 'Student'}`);
    if (student?.email) doc.text(`${student.email}`);
    doc.moveDown(1);

    // Course/payment details
    doc.fontSize(12).text('Course Details', { underline: true });
    doc.moveDown(0.25);
    doc.fontSize(11).text(`Course: ${course?.title || '—'}`);
    if (course?.instructor) doc.text(`Instructor: ${course.instructor}`);
    if (course?.duration) doc.text(`Duration: ${course.duration}`);
    doc.moveDown(0.75);

    doc.fontSize(12).text('Payment Details', { underline: true });
    doc.moveDown(0.25);
    doc.fontSize(11).text(`Payment Method: Khalti`);
    if (payment.pidx) doc.text(`PIDX: ${payment.pidx}`);
    if (payment.transactionId) doc.text(`Transaction ID: ${payment.transactionId}`);
    doc.text(`Amount Paid: NPR ${Number(payment.amount || course?.price || 0).toFixed(0)}`);
    doc.text(`Status: ${payment.status}`);
    doc.moveDown(1.5);

    // Footer
    doc
      .fontSize(10)
      .fillColor('gray')
      .text('This is a system-generated receipt. For support, contact Vidyalaya.', {
        align: 'left',
      });

    doc.end();
  } catch (err) {
    console.error('Receipt PDF error:', err.message);
    return res.status(500).json({ message: 'Failed to generate receipt' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/teacher/:paymentId/receipt
// Streams a PDF "payment record" for a teacher-owned course payment.
//
// Authorization:
//  - teacher/admin can download only if the payment's course was createdBy them
//  - payment must be completed (so the record is final)
// ─────────────────────────────────────────────────────────────────────────────
export const downloadTeacherReceiptPdf = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate('course', 'title instructor duration price createdBy')
      .populate('student', 'name email');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    if (payment.status !== 'completed') {
      return res.status(400).json({ message: 'PDF is available only for completed payments' });
    }

    const course = payment.course;
    const isOwner = course?.createdBy?.toString() === req.user._id.toString();
    const isAdmin = req.user?.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to access this payment record' });
    }

    const receiptNo = payment.transactionId || payment.pidx || payment._id.toString();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="vidyalaya-payment-record-${String(receiptNo).replace(/[^a-zA-Z0-9_-]/g, '')}.pdf"`
    );

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Vidyalaya', { align: 'left' });
    doc.moveDown(0.25);
    doc.fontSize(14).text('Payment Record (Teacher Copy)', { align: 'left' });
    doc.moveDown(1);

    // Meta
    doc.fontSize(11);
    doc.text(`Record No: ${receiptNo}`);
    doc.text(`Date: ${new Date(payment.paidAt || payment.updatedAt || Date.now()).toLocaleString()}`);
    doc.moveDown(1);

    // Student
    doc.fontSize(12).text('Student', { underline: true });
    doc.moveDown(0.25);
    doc.fontSize(11).text(`${payment.student?.name || 'Student'}`);
    if (payment.student?.email) doc.text(`${payment.student.email}`);
    doc.moveDown(1);

    // Course
    doc.fontSize(12).text('Course', { underline: true });
    doc.moveDown(0.25);
    doc.fontSize(11).text(`Course: ${course?.title || '—'}`);
    if (course?.instructor) doc.text(`Instructor: ${course.instructor}`);
    if (course?.duration) doc.text(`Duration: ${course.duration}`);
    doc.moveDown(0.75);

    // Payment
    doc.fontSize(12).text('Payment Details', { underline: true });
    doc.moveDown(0.25);
    doc.fontSize(11).text('Payment Method: Khalti');
    if (payment.pidx) doc.text(`PIDX: ${payment.pidx}`);
    if (payment.transactionId) doc.text(`Transaction ID: ${payment.transactionId}`);
    doc.text(`Amount: NPR ${Number(payment.amount || 0).toFixed(0)}`);
    doc.text(`Status: ${payment.status}`);
    doc.moveDown(1.5);

    // Footer
    doc
      .fontSize(10)
      .fillColor('gray')
      .text('This is a system-generated record for your course payments.', { align: 'left' });

    doc.end();
  } catch (err) {
    console.error('Teacher receipt PDF error:', err.message);
    return res.status(500).json({ message: 'Failed to generate payment record PDF' });
  }
};