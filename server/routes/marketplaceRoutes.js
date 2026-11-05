import express from "express";
import {
  getClasses,
  createClass,
  enrollInClass,
  createBookingRequest,
  getMyBookings,
  acceptBookingRequest,
  payAndConfirmBooking,
  sendBookingMessage,
  completeAndRateBooking,
  updateTopicProgressAndDemand,
  addStudyPlan,
  getTopicDemands,
  getDashboardSummary,
  seedAssessmentDemoData,
} from "../controllers/marketplaceController.js";
import { protect, requireVerifiedTeacher } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public & Protected Class Marketplace Routes
router.get("/classes", getClasses);
router.post("/classes", protect, requireVerifiedTeacher, createClass);
router.post("/classes/:id/enroll", protect, enrollInClass);

// 1-to-1 Booking Request & Lifecycle Routes
router.get("/bookings", protect, requireVerifiedTeacher, getMyBookings);
router.post("/bookings/request", protect, createBookingRequest);
router.put("/bookings/:id/accept", protect, requireVerifiedTeacher, acceptBookingRequest);
router.put("/bookings/:id/pay", protect, payAndConfirmBooking);
router.post("/bookings/:id/chat", protect, requireVerifiedTeacher, sendBookingMessage);
router.put("/bookings/:id/complete", protect, requireVerifiedTeacher, completeAndRateBooking);

// Syllabus "Not Clear" Tracker, 1-4-7 Study Planner & Demand Board
router.get("/demand", getTopicDemands);
router.post("/syllabus/progress", protect, updateTopicProgressAndDemand);
router.post("/syllabus/study-plan", protect, addStudyPlan);

// Unified Role Dashboard & One-Click Assessment Demo Seeder
router.get("/dashboard", protect, requireVerifiedTeacher, getDashboardSummary);
router.post("/seed-demo", protect, seedAssessmentDemoData);

export default router;

