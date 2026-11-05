import mongoose from "mongoose";

const classSessionSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Please provide a class title"],
      trim: true,
    },
    classType: {
      type: String,
      enum: [
        "Group Class",
        "Topic Class",
        "Unit Class",
        "Paper Class",
        "Full Subject",
        "Class Series",
        "1-to-1 Class",
      ],
      default: "Topic Class",
    },
    grade: {
      type: String,
      required: true,
      default: "A/L",
    },
    stream: {
      type: String,
      default: "Physical Science",
    },
    subject: {
      type: String,
      required: true,
    },
    unitTitle: {
      type: String,
      default: "",
    },
    topicName: {
      type: String,
      default: "",
    },
    medium: {
      type: String,
      enum: ["English", "Sinhala", "Tamil"],
      default: "English",
    },
    description: {
      type: String,
      default: "",
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      default: "2 Hours",
    },
    fee: {
      type: Number,
      required: true,
      default: 1000,
    },
    maxStudents: {
      type: Number,
      default: 25,
    },
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    posterUrl: {
      type: String,
      default: "",
    },
    seriesItems: [{ type: String }],
    status: {
      type: String,
      enum: [
        "Draft",
        "Published",
        "Full",
        "Ongoing",
        "Completed",
        "Cancelled",
        "Suspended",
      ],
      default: "Published",
    },
    lockedByAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const ClassSession = mongoose.model("ClassSession", classSessionSchema);
export default ClassSession;
