import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  senderName: { type: String, required: true },
  senderRole: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const bookingRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    classSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassSession",
      default: null,
    },
    bookingType: {
      type: String,
      enum: ["1-to-1", "Group Enrollment"],
      default: "1-to-1",
    },
    learningRequirement: {
      type: String,
      enum: ["Specific Topic", "Unit", "Full Subject"],
      default: "Specific Topic",
    },
    grade: { type: String, required: true, default: "A/L" },
    stream: { type: String, default: "Physical Science" },
    subject: { type: String, required: true },
    unitTitle: { type: String, default: "" },
    topicName: { type: String, default: "" },
    medium: { type: String, default: "English" },
    preferredDate: { type: String, required: true },
    preferredTimeRange: { type: String, required: true },
    duration: { type: String, default: "1 Hour" },
    paymentPreference: {
      type: String,
      enum: ["Per Hour", "Per Class", "Monthly"],
      default: "Per Class",
    },
    budget: { type: Number, default: 0 },
    fee: { type: Number, default: 0 },
    teacherEarning: { type: Number, default: 0 },
    platformCommission: { type: Number, default: 0 },
    status: {
      type: String,
      enum: [
        "Pending",
        "Teacher Found",
        "Teacher Accepted",
        "Student Accepted",
        "Payment Pending",
        "Confirmed",
        "Completed",
        "Rejected",
        "Cancelled",
      ],
      default: "Pending",
    },
    lockedByAdmin: {
      type: Boolean,
      default: false,
    },
    meetingRoomId: {
      type: String,
      default: "",
    },
    messages: [messageSchema],
    rating: {
      stars: { type: Number, min: 1, max: 5 },
      feedback: { type: String, default: "" },
      ratedAt: { type: Date },
    },
  },
  { timestamps: true }
);

const BookingRequest = mongoose.model("BookingRequest", bookingRequestSchema);
export default BookingRequest;

