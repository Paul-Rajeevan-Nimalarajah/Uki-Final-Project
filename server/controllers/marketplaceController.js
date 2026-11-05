import User from "../models/User.js";
import Academic from "../models/Academic.js";
import ClassSession from "../models/ClassSession.js";
import BookingRequest from "../models/BookingRequest.js";
import TopicDemand from "../models/TopicDemand.js";
import { ensureProductionSampleData } from "../utils/seedProductionData.js";

// 1. GET ALL CLASSES (with optional filters)
export const getClasses = async (req, res) => {
  try {
    const { classType, subject, grade, medium, topicName } = req.query;
    const filter = { status: { $ne: "Cancelled" } };

    if (classType && classType !== "All") filter.classType = classType;
    if (subject) filter.subject = new RegExp(subject, "i");
    if (grade) filter.grade = grade;
    if (medium) filter.medium = medium;
    if (topicName) filter.topicName = new RegExp(topicName, "i");

    const classes = await ClassSession.find(filter)
      .populate("teacher", "name email teacherProfile")
      .sort({ createdAt: -1 });

    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. TEACHER CREATES A CLASS (and links to matching TopicDemand)
export const createClass = async (req, res) => {
  try {
    const {
      title,
      classType,
      grade,
      stream,
      subject,
      unitTitle,
      topicName,
      medium,
      description,
      date,
      time,
      duration,
      fee,
      maxStudents,
      posterUrl,
      seriesItems,
      demandId,
    } = req.body;

    const newClass = await ClassSession.create({
      teacher: req.user._id,
      title,
      classType: classType || "Topic Class",
      grade: grade || "A/L",
      stream: stream || "Physical Science",
      subject,
      unitTitle: unitTitle || "",
      topicName: topicName || "",
      medium: medium || "English",
      description: description || "",
      date,
      time,
      duration: duration || "2 Hours",
      fee: Number(fee) || 1000,
      maxStudents: Number(maxStudents) || 25,
      posterUrl: posterUrl || "",
      seriesItems: seriesItems || [],
      status: "Published",
    });

    // Link any matching student demand so students get notified/recommended
    if (demandId) {
      await TopicDemand.findByIdAndUpdate(demandId, {
        resolvedByClass: newClass._id,
      });
    } else if (topicName) {
      await TopicDemand.updateMany(
        { subject, topicName, resolvedByClass: null },
        { resolvedByClass: newClass._id }
      );
    }

    const populated = await ClassSession.findById(newClass._id).populate(
      "teacher",
      "name email teacherProfile"
    );
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. STUDENT ENROLLS & PAYS FOR A GROUP/TOPIC/UNIT/PAPER CLASS (80/20 Split)
export const enrollInClass = async (req, res) => {
  try {
    const classSession = await ClassSession.findById(req.params.id).populate(
      "teacher",
      "name email"
    );
    if (!classSession) {
      return res.status(404).json({ message: "Class not found" });
    }

    const alreadyEnrolled = classSession.enrolledStudents.some(
      (id) => id.toString() === req.user._id.toString()
    );
    if (alreadyEnrolled) {
      return res
        .status(400)
        .json({ message: "You are already enrolled in this class" });
    }

    if (classSession.enrolledStudents.length >= classSession.maxStudents) {
      return res.status(400).json({ message: "Class is full" });
    }

    const fee = Number(classSession.fee) || 0;
    const teacherEarning = Math.round(fee * 0.8);
    const platformCommission = fee - teacherEarning;

    classSession.enrolledStudents.push(req.user._id);
    if (classSession.enrolledStudents.length >= classSession.maxStudents) {
      classSession.status = "Full";
    }
    await classSession.save();

    // Credit 80% to Teacher wallet
    await User.findByIdAndUpdate(classSession.teacher._id, {
      $inc: { walletBalance: teacherEarning },
    });

    const roomSlug = `LearnyMo-${classSession._id.toString().slice(-6)}`;

    const booking = await BookingRequest.create({
      student: req.user._id,
      teacher: classSession.teacher._id,
      classSession: classSession._id,
      bookingType: "Group Enrollment",
      learningRequirement:
        classSession.classType === "Unit Class"
          ? "Unit"
          : classSession.classType === "Full Subject"
          ? "Full Subject"
          : "Specific Topic",
      grade: classSession.grade,
      stream: classSession.stream,
      subject: classSession.subject,
      unitTitle: classSession.unitTitle,
      topicName: classSession.topicName || classSession.title,
      medium: classSession.medium,
      preferredDate: classSession.date,
      preferredTimeRange: classSession.time,
      duration: classSession.duration,
      fee,
      teacherEarning,
      platformCommission,
      status: "Confirmed",
      meetingRoomId: roomSlug,
      messages: [
        {
          sender: classSession.teacher._id,
          senderName: classSession.teacher.name,
          senderRole: "teacher",
          text: `Welcome to "${classSession.title}"! Your enrollment and payment (LKR ${fee}) are confirmed. Use the Class Card below to join the live online classroom at the scheduled time.`,
        },
      ],
    });

    res.status(201).json({
      message: "Enrolled and payment confirmed! Chat & Classroom unlocked.",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. STUDENT CREATES A 1-TO-1 BOOKING REQUEST
export const createBookingRequest = async (req, res) => {
  try {
    const {
      learningRequirement,
      grade,
      stream,
      subject,
      unitTitle,
      topicName,
      medium,
      preferredDate,
      preferredTimeRange,
      duration,
      paymentPreference,
      budget,
      teacherId,
    } = req.body;

    // Try auto-matching a verified teacher if none specified
    let matchedTeacherId = teacherId || null;
    if (!matchedTeacherId) {
      const matchedTeacher = await User.findOne({
        role: "teacher",
        "teacherProfile.verificationStatus": "approved",
        "teacherProfile.subjects": { $in: [new RegExp(subject, "i")] },
      });
      if (matchedTeacher) {
        matchedTeacherId = matchedTeacher._id;
      }
    }

    const booking = await BookingRequest.create({
      student: req.user._id,
      teacher: matchedTeacherId,
      bookingType: "1-to-1",
      learningRequirement: learningRequirement || "Specific Topic",
      grade: grade || "A/L",
      stream: stream || "Physical Science",
      subject,
      unitTitle: unitTitle || "",
      topicName: topicName || subject,
      medium: medium || "English",
      preferredDate,
      preferredTimeRange,
      duration: duration || "1 Hour",
      paymentPreference: paymentPreference || "Per Class",
      budget: Number(budget) || 1500,
      fee: Number(budget) || 1500,
      status: matchedTeacherId ? "Teacher Found" : "Pending",
    });

    const populated = await BookingRequest.findById(booking._id)
      .populate("student", "name email studentProfile")
      .populate("teacher", "name email teacherProfile");

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. GET BOOKINGS FOR STUDENT, TEACHER, OR ADMIN
export const getMyBookings = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "student") {
      query = { student: req.user._id };
    } else if (req.user.role === "teacher") {
      query = {
        $or: [
          { teacher: req.user._id },
          { bookingType: "1-to-1", status: { $in: ["Pending", "Teacher Found"] } },
        ],
      };
    }

    const bookings = await BookingRequest.find(query)
      .populate("student", "name email studentProfile")
      .populate("teacher", "name email teacherProfile")
      .populate("classSession", "title classType posterUrl")
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. TEACHER ACCEPTS 1-TO-1 REQUEST & SETS FEE / SCHEDULE
export const acceptBookingRequest = async (req, res) => {
  try {
    const { fee, preferredDate, preferredTimeRange } = req.body;
    const booking = await BookingRequest.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking request not found" });
    }

    booking.teacher = req.user._id;
    if (fee !== undefined) booking.fee = Number(fee);
    if (preferredDate) booking.preferredDate = preferredDate;
    if (preferredTimeRange) booking.preferredTimeRange = preferredTimeRange;
    booking.status = "Teacher Accepted";

    await booking.save();

    const populated = await BookingRequest.findById(booking._id)
      .populate("student", "name email studentProfile")
      .populate("teacher", "name email teacherProfile");

    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 7. STUDENT PAYS & CONFIRMS 1-TO-1 BOOKING (80% Teacher / 20% LearnyMo Split)
export const payAndConfirmBooking = async (req, res) => {
  try {
    const booking = await BookingRequest.findById(req.params.id)
      .populate("teacher", "name email")
      .populate("student", "name email");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const fee = Number(booking.fee) || 1500;
    const teacherEarning = Math.round(fee * 0.8);
    const platformCommission = fee - teacherEarning;

    booking.fee = fee;
    booking.teacherEarning = teacherEarning;
    booking.platformCommission = platformCommission;
    booking.status = "Confirmed";
    booking.meetingRoomId = `LearnyMo-1to1-${booking._id.toString().slice(-6)}`;

    booking.messages.push({
      sender: booking.teacher?._id || req.user._id,
      senderName: booking.teacher?.name || "LearnyMo System",
      senderRole: "teacher",
      text: `Booking Confirmed! Payment of LKR ${fee} received (80% Teacher / 20% LearnyMo split applied). Chat and your dedicated Online Classroom Card are now active.`,
    });

    await booking.save();

    if (booking.teacher?._id) {
      await User.findByIdAndUpdate(booking.teacher._id, {
        $inc: { walletBalance: teacherEarning },
      });
    }

    const populated = await BookingRequest.findById(booking._id)
      .populate("student", "name email studentProfile")
      .populate("teacher", "name email teacherProfile");

    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 8. SEND MESSAGE IN BOOKING CHAT
export const sendBookingMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const booking = await BookingRequest.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.messages.push({
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      text: text.trim(),
    });

    await booking.save();

    const populated = await BookingRequest.findById(booking._id)
      .populate("student", "name email studentProfile")
      .populate("teacher", "name email teacherProfile");

    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 9. COMPLETE CLASS & RATE TEACHER
export const completeAndRateBooking = async (req, res) => {
  try {
    const { stars, feedback } = req.body;
    const booking = await BookingRequest.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.status = "Completed";

    if (stars) {
      booking.rating = {
        stars: Number(stars),
        feedback: feedback || "",
        ratedAt: new Date(),
      };

      if (booking.teacher) {
        const teacher = await User.findById(booking.teacher);
        if (teacher && teacher.teacherProfile) {
          const currentCount = teacher.teacherProfile.ratingCount || 1;
          const currentAvg = teacher.teacherProfile.rating || 5.0;
          const newCount = currentCount + 1;
          const newAvg = Number(
            ((currentAvg * currentCount + Number(stars)) / newCount).toFixed(1)
          );
          teacher.teacherProfile.rating = newAvg;
          teacher.teacherProfile.ratingCount = newCount;
          await teacher.save();
        }
      }
    }

    await booking.save();

    const populated = await BookingRequest.findById(booking._id)
      .populate("student", "name email studentProfile")
      .populate("teacher", "name email teacherProfile");

    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 10. SYLLABUS PROGRESS ("Not Started" / "Not Clear" / "Clear") & DEMAND SYSTEM
export const updateTopicProgressAndDemand = async (req, res) => {
  try {
    const {
      grade,
      stream,
      subject,
      unitTitle,
      topicName,
      status,
      medium,
      demandType,
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user.studentProfile) {
      user.studentProfile = { topicProgress: [], studyPlans: [] };
    }

    const existingIdx = user.studentProfile.topicProgress.findIndex(
      (tp) => tp.subject === subject && tp.topicName === topicName
    );

    if (existingIdx > -1) {
      user.studentProfile.topicProgress[existingIdx].status = status;
      user.studentProfile.topicProgress[existingIdx].updatedAt = new Date();
    } else {
      user.studentProfile.topicProgress.push({
        grade: grade || "A/L",
        subject,
        unitTitle: unitTitle || "",
        topicName,
        status,
      });
    }

    await user.save();

    // If marked "not_clear", automatically record Student Demand
    if (status === "not_clear") {
      let demand = await TopicDemand.findOne({ subject, topicName });
      if (!demand) {
        demand = await TopicDemand.create({
          grade: grade || "A/L",
          stream: stream || "Physical Science",
          subject,
          unitTitle: unitTitle || "",
          topicName,
          medium: medium || "English",
          demandType: demandType || "Topic Demand",
          interestedStudents: [req.user._id],
        });
      } else {
        const alreadyIn = demand.interestedStudents.some(
          (id) => id.toString() === req.user._id.toString()
        );
        if (!alreadyIn) {
          demand.interestedStudents.push(req.user._id);
          await demand.save();
        }
      }
    }

    res.status(200).json({
      message: `Topic "${topicName}" marked as ${status.replace("_", " ")}`,
      topicProgress: user.studentProfile.topicProgress,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 11. 1-4-7 STUDY PLANNER GENERATOR
export const addStudyPlan = async (req, res) => {
  try {
    const { subject, topicName, preferredSlot, startDate } = req.body;
    const user = await User.findById(req.user._id);

    const baseDate = startDate ? new Date(startDate) : new Date();
    const formatDay = (d) =>
      d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

    const day1 = new Date(baseDate);
    const day4 = new Date(baseDate);
    day4.setDate(day1.getDate() + 3);
    const day7 = new Date(baseDate);
    day7.setDate(day1.getDate() + 6);

    if (!user.studentProfile) user.studentProfile = { topicProgress: [], studyPlans: [] };

    user.studentProfile.studyPlans.unshift({
      subject,
      topicName,
      preferredSlot: preferredSlot || "Evening (5 PM - 8 PM)",
      day1Learn: formatDay(day1),
      day4Review: formatDay(day4),
      day7Recall: formatDay(day7),
    });

    await user.save();
    res.status(201).json(user.studentProfile.studyPlans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 12. GET ALL STUDENT DEMANDS (For Teachers & Admin & Students)
export const getTopicDemands = async (req, res) => {
  try {
    const demands = await TopicDemand.find({})
      .populate("interestedStudents", "name email")
      .populate({
        path: "resolvedByClass",
        select: "title fee date time classType teacher",
        populate: { path: "teacher", select: "name" },
      })
      .sort({ updatedAt: -1 });

    res.status(200).json(demands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 13. UNIFIED DASHBOARD SUMMARY (Student / Teacher / Admin)
export const getDashboardSummary = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const allClasses = await ClassSession.find({ status: "Published" }).populate(
      "teacher",
      "name teacherProfile"
    );
    const allDemands = await TopicDemand.find({}).populate("resolvedByClass");

    if (user.role === "student") {
      const myBookings = await BookingRequest.find({ student: user._id })
        .populate("teacher", "name teacherProfile")
        .sort({ createdAt: -1 });

      const notClearTopics = (user.studentProfile?.topicProgress || []).filter(
        (t) => t.status === "not_clear"
      );

      const recommendedClasses = allClasses.filter((cls) =>
        notClearTopics.some(
          (nc) =>
            nc.topicName.toLowerCase() === (cls.topicName || "").toLowerCase() ||
            nc.subject.toLowerCase() === (cls.subject || "").toLowerCase()
        )
      );

      return res.status(200).json({
        role: "student",
        studentId: user.studentProfile?.studentId || "LMO-10294",
        walletBalance: user.walletBalance || 0,
        confirmedClassesCount: myBookings.filter((b) => b.status === "Confirmed")
          .length,
        pendingRequestsCount: myBookings.filter((b) =>
          ["Pending", "Teacher Found", "Teacher Accepted"].includes(b.status)
        ).length,
        notClearCount: notClearTopics.length,
        topicProgress: user.studentProfile?.topicProgress || [],
        studyPlans: user.studentProfile?.studyPlans || [],
        recommendedClasses,
        recentBookings: myBookings.slice(0, 5),
      });
    }

    if (user.role === "teacher") {
      const teacherBookings = await BookingRequest.find({
        $or: [{ teacher: user._id }, { status: "Pending" }],
      })
        .populate("student", "name studentProfile")
        .sort({ createdAt: -1 });

      const completedForTeacher = teacherBookings.filter(
        (b) =>
          b.teacher?.toString() === user._id.toString() &&
          b.status === "Completed"
      );

      const studentCounts = {};
      completedForTeacher.forEach((b) => {
        const sid = b.student?._id?.toString();
        if (sid) studentCounts[sid] = (studentCounts[sid] || 0) + 1;
      });
      const uniqueStudents = Object.keys(studentCounts).length;
      const repeatStudents = Object.values(studentCounts).filter(
        (c) => c > 1
      ).length;
      const repeatRate =
        uniqueStudents > 0
          ? Math.round((repeatStudents / uniqueStudents) * 100)
          : 100;

      const totalEarnings = teacherBookings
        .filter(
          (b) =>
            b.teacher?.toString() === user._id.toString() &&
            ["Confirmed", "Completed"].includes(b.status)
        )
        .reduce((sum, b) => sum + (b.teacherEarning || 0), 0);

      return res.status(200).json({
        role: "teacher",
        verificationStatus:
          user.teacherProfile?.verificationStatus || "pending",
        rating: user.teacherProfile?.rating || 5.0,
        ratingCount: user.teacherProfile?.ratingCount || 1,
        repeatRate,
        walletBalance: user.walletBalance || totalEarnings,
        totalEarnings,
        confirmedClassesCount: teacherBookings.filter(
          (b) =>
            b.teacher?.toString() === user._id.toString() &&
            b.status === "Confirmed"
        ).length,
        newStudentRequestsCount: teacherBookings.filter((b) =>
          ["Pending", "Teacher Found"].includes(b.status)
        ).length,
        highDemandCount: allDemands.length,
        recentDemands: allDemands.slice(0, 5),
        recentBookings: teacherBookings.slice(0, 6),
      });
    }

    const totalStudents = await User.countDocuments({ role: "student" });
    const totalTeachers = await User.countDocuments({ role: "teacher" });
    const pendingTeachers = await User.countDocuments({
      role: "teacher",
      "teacherProfile.verificationStatus": "pending",
    });
    const allBookings = await BookingRequest.find({
      status: { $in: ["Confirmed", "Completed"] },
    });
    const totalRevenue = allBookings.reduce((sum, b) => sum + (b.fee || 0), 0);
    const platformCommission = allBookings.reduce(
      (sum, b) => sum + (b.platformCommission || 0),
      0
    );
    const teacherPayouts = allBookings.reduce(
      (sum, b) => sum + (b.teacherEarning || 0),
      0
    );

    return res.status(200).json({
      role: "admin",
      totalStudents,
      totalTeachers,
      pendingTeachers,
      totalClasses: allClasses.length,
      totalDemands: allDemands.length,
      totalRevenue,
      platformCommission,
      teacherPayouts,
      recentDemands: allDemands.slice(0, 5),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 14. 1-CLICK DEMO DATA SEEDER FOR ASSESSMENT PRESENTATION
export const seedAssessmentDemoData = async (req, res) => {
  try {
    await ensureProductionSampleData();
    res.status(200).json({
      message:
        "Assessment MVP Demo Data (Admin, Verified & Pending Teachers, Student, Syllabus, Classes, Bookings, and Student Demands) seeded successfully!",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

