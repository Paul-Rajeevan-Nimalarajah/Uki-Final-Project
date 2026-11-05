import mongoose from "mongoose";

const topicDemandSchema = new mongoose.Schema(
  {
    grade: { type: String, required: true, default: "A/L" },
    stream: { type: String, default: "Physical Science" },
    subject: { type: String, required: true },
    unitTitle: { type: String, default: "" },
    topicName: { type: String, required: true },
    medium: { type: String, default: "English" },
    demandType: {
      type: String,
      enum: ["Topic Demand", "Unit Demand", "Paper Demand", "Group Class Demand"],
      default: "Topic Demand",
    },
    preferredTime: { type: String, default: "Evening (5 PM - 8 PM)" },
    interestedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    resolvedByClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassSession",
      default: null,
    },
  },
  { timestamps: true }
);

const TopicDemand = mongoose.model("TopicDemand", topicDemandSchema);
export default TopicDemand;

