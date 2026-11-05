import User from "../models/User.js";
import Academic from "../models/Academic.js";
import ClassSession from "../models/ClassSession.js";
import BookingRequest from "../models/BookingRequest.js";
import TopicDemand from "../models/TopicDemand.js";

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
    const academicCount = await Academic.countDocuments();
    if (academicCount === 0) {
      await Academic.insertMany([
        {
          grade: "A/L",
          stream: "Physical Science",
          subject: "Combined Mathematics",
          units: [
            {
              unitNumber: 1,
              title: "Pure Mathematics",
              topics: [
                {
                  name: "Quadratic Functions and Roots",
                  desciption: "Real roots, discriminant and graphs",
                },
                {
                  name: "Differentiation",
                  desciption: "Chain rule, product rule, and curve sketching",
                },
                {
                  name: "Integration",
                  desciption: "Definite integrals and area under curves",
                },
              ],
            },
            {
              unitNumber: 2,
              title: "Applied Mathematics",
              topics: [
                {
                  name: "Newtonian Dynamics",
                  desciption: "Motion in straight line and projectiles",
                },
                {
                  name: "Relative Velocity",
                  desciption: "Relative velocity vectors",
                },
              ],
            },
          ],
        },
        {
          grade: "A/L",
          stream: "Physical Science",
          subject: "Physics",
          units: [
            {
              unitNumber: 1,
              title: "Measurement & Mechanics",
              topics: [
                {
                  name: "Units and Dimensions",
                  desciption: "Dimensional analysis and error propagation",
                },
                {
                  name: "Circular Motion",
                  desciption: "Centripetal force and banking",
                },
              ],
            },
            {
              unitNumber: 2,
              title: "Waves and Oscillations",
              topics: [
                {
                  name: "Simple Harmonic Motion",
                  desciption: "Pendulums and spring oscillators",
                },
                {
                  name: "Doppler Effect",
                  desciption: "Sound frequency shift",
                },
              ],
            },
          ],
        },
        {
          grade: "Grade 11 (O/L)",
          stream: "General",
          subject: "Mathematics",
          units: [
            {
              unitNumber: 1,
              title: "Algebra",
              topics: [
                {
                  name: "Quadratic Equations",
                  desciption: "Solving quadratic equations and word problems",
                },
                {
                  name: "Simultaneous Equations",
                  desciption: "Linear equations with two variables",
                },
              ],
            },
          ],
        },
      ]);
    }

    let demoTeacher = await User.findOne({ email: "arjuna.teacher@learnymo.lk" });
    if (!demoTeacher) {
      demoTeacher = await User.create({
        name: "Eng. Arjuna Perera",
        email: "arjuna.teacher@learnymo.lk",
        password: "password123",
        role: "teacher",
        phone: "+94 77 123 4567",
        walletBalance: 14400,
        teacherProfile: {
          headline: "BSc Eng (Hons) Moratuwa • 8+ Yrs Combined Maths & Physics",
          bio: "Specializing in A/L Combined Mathematics and Physics rapid revision, past paper mastery, and 1-to-1 doubt clearing.",
          qualifications: ["BSc Engineering (Hons) - University of Moratuwa"],
          subjects: ["Combined Mathematics", "Physics", "Mathematics"],
          verificationStatus: "approved",
          hourlyRate: 1500,
          experienceYears: 8,
          rating: 4.9,
          ratingCount: 28,
        },
      });
    }

    const classCount = await ClassSession.countDocuments();
    if (classCount === 0) {
      await ClassSession.insertMany([
        {
          teacher: demoTeacher._id,
          title: "Integration Masterclass: Definite Integrals & Area",
          classType: "Topic Class",
          grade: "A/L",
          stream: "Physical Science",
          subject: "Combined Mathematics",
          unitTitle: "Pure Mathematics",
          topicName: "Integration",
          medium: "English",
          description:
            "Targeted 2-hour session covering integration by parts, definite integrals, and past paper structured questions.",
          date: "2026-11-05",
          time: "6:00 PM - 8:00 PM",
          duration: "2 Hours",
          fee: 1200,
          maxStudents: 30,
          status: "Published",
        },
        {
          teacher: demoTeacher._id,
          title: "Simple Harmonic Motion & Doppler Effect Crash Course",
          classType: "Unit Class",
          grade: "A/L",
          stream: "Physical Science",
          subject: "Physics",
          unitTitle: "Waves and Oscillations",
          topicName: "Simple Harmonic Motion",
          medium: "English",
          description:
            "Complete Unit 2 coverage with graphical analysis and 10 years of A/L MCQ discussions.",
          date: "2026-11-06",
          time: "5:00 PM - 7:30 PM",
          duration: "2.5 Hours",
          fee: 2000,
          maxStudents: 40,
          status: "Published",
        },
        {
          teacher: demoTeacher._id,
          title: "2020–2025 A/L Combined Maths Past Paper Discussion",
          classType: "Paper Class",
          grade: "A/L",
          stream: "Physical Science",
          subject: "Combined Mathematics",
          unitTitle: "Pure Mathematics",
          topicName: "Differentiation",
          medium: "English",
          description:
            "Timed paper writing and marking scheme breakdown for Part A & Part B questions.",
          date: "2026-11-08",
          time: "8:00 AM - 11:00 AM",
          duration: "3 Hours",
          fee: 1500,
          maxStudents: 50,
          status: "Published",
        },
        {
          teacher: demoTeacher._id,
          title: "O/L Grade 11 Algebra Master Series (4 Classes)",
          classType: "Class Series",
          grade: "Grade 11 (O/L)",
          stream: "General",
          subject: "Mathematics",
          unitTitle: "Algebra",
          topicName: "Quadratic Equations",
          medium: "English",
          description:
            "Class 01: Intro | Class 02: Basic Problems | Class 03: Word Problems | Class 04: Past Papers",
          date: "Every Saturday",
          time: "9:00 AM - 11:00 AM",
          duration: "4 Weeks (8 Hours)",
          fee: 2500,
          maxStudents: 25,
          status: "Published",
        },
      ]);
    }

    const demandCount = await TopicDemand.countDocuments();
    if (demandCount === 0) {
      await TopicDemand.insertMany([
        {
          grade: "A/L",
          stream: "Physical Science",
          subject: "Combined Mathematics",
          unitTitle: "Pure Mathematics",
          topicName: "Integration",
          medium: "English",
          demandType: "Topic Demand",
          preferredTime: "Evening (6 PM - 8 PM)",
          interestedStudents: [req.user._id],
        },
        {
          grade: "A/L",
          stream: "Physical Science",
          subject: "Physics",
          unitTitle: "Waves and Oscillations",
          topicName: "Doppler Effect",
          medium: "English",
          demandType: "Group Class Demand",
          preferredTime: "Weekend Morning (9 AM - 12 PM)",
          interestedStudents: [req.user._id],
        },
      ]);
    }

    res.status(200).json({
      message:
        "Assessment MVP Demo Data (Syllabus, Verified Teacher, Classes, and Student Demands) seeded successfully!",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

