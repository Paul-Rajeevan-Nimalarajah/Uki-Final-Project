import User from "../models/User.js";
import Academic from "../models/Academic.js";
import ClassSession from "../models/ClassSession.js";
import BookingRequest from "../models/BookingRequest.js";
import TopicDemand from "../models/TopicDemand.js";

export const ensureProductionSampleData = async () => {
  try {
    // 1. Seed Admin Account
    let admin = await User.findOne({ email: "admin@learnymo.lk" });
    if (!admin) {
      admin = await User.create({
        name: "LearnyMo Super Admin",
        email: "admin@learnymo.lk",
        password: "Admin@123",
        role: "admin",
        phone: "+94 11 234 5678",
      });
      console.log("✅ Seeded Admin: admin@learnymo.lk / Admin@123");
    }

    // 2. Seed Verified Teacher Account
    let verifiedTeacher = await User.findOne({ email: "arjuna@learnymo.lk" });
    if (!verifiedTeacher) {
      verifiedTeacher = await User.create({
        name: "Eng. Arjuna Perera",
        email: "arjuna@learnymo.lk",
        password: "Teacher@123",
        role: "teacher",
        phone: "+94 77 123 4567",
        walletBalance: 16800,
        teacherProfile: {
          headline: "BSc Eng (Hons) Moratuwa • 8+ Yrs Combined Maths & Physics",
          bio: "Specializing in A/L Combined Mathematics and Physics rapid revision, past paper mastery, and 1-to-1 doubt clearing.",
          qualifications: [
            "BSc Engineering (Hons) - University of Moratuwa",
            "Postgraduate Diploma in Education",
          ],
          subjects: ["Combined Mathematics", "Physics", "Mathematics"],
          verificationDocuments: [
            "https://res.cloudinary.com/demo/image/upload/sample.pdf",
          ],
          verificationStatus: "approved",
          hourlyRate: 1500,
          experienceYears: 8,
          rating: 4.9,
          ratingCount: 28,
        },
      });
      console.log("✅ Seeded Verified Teacher: arjuna@learnymo.lk / Teacher@123");
    }

    // 3. Seed Pending Teacher Account (for Admin Verification Queue Demo)
    let pendingTeacher = await User.findOne({ email: "nimali@learnymo.lk" });
    if (!pendingTeacher) {
      pendingTeacher = await User.create({
        name: "Dr. Nimali Silva",
        email: "nimali@learnymo.lk",
        password: "Teacher@123",
        role: "teacher",
        phone: "+94 71 987 6543",
        teacherProfile: {
          headline: "PhD Chemistry (Colombo) • 6+ Yrs A/L Chemistry & Science",
          bio: "Dedicated educator helping students master Organic, Inorganic, and Physical Chemistry with structured past paper techniques.",
          qualifications: ["BSc (Hons) Chemistry", "PhD in Chemistry - UoC"],
          subjects: ["Chemistry", "Science"],
          verificationDocuments: [
            "https://res.cloudinary.com/demo/image/upload/sample.pdf",
          ],
          verificationStatus: "pending",
          hourlyRate: 1800,
          experienceYears: 6,
          rating: 5.0,
          ratingCount: 1,
        },
      });
      console.log("✅ Seeded Pending Teacher: nimali@learnymo.lk / Teacher@123");
    }

    // 4. Seed Student Account
    let student = await User.findOne({ email: "student@learnymo.lk" });
    if (!student) {
      student = await User.create({
        name: "Kasun Perera",
        email: "student@learnymo.lk",
        password: "Student@123",
        role: "student",
        phone: "+94 76 555 1234",
        walletBalance: 5000,
        studentProfile: {
          studentId: "LMO-00005",
          grade: "A/L",
          stream: "Physical Science",
          medium: "English",
          school: "Royal College, Colombo",
          topicProgress: [
            {
              grade: "A/L",
              subject: "Combined Mathematics",
              unitTitle: "Pure Mathematics",
              topicName: "Quadratic Functions and Roots",
              status: "clear",
            },
            {
              grade: "A/L",
              subject: "Combined Mathematics",
              unitTitle: "Pure Mathematics",
              topicName: "Integration",
              status: "not_clear",
            },
            {
              grade: "A/L",
              subject: "Physics",
              unitTitle: "Waves and Oscillations",
              topicName: "Doppler Effect",
              status: "not_clear",
            },
          ],
          studyPlans: [
            {
              subject: "Combined Mathematics",
              topicName: "Integration",
              preferredSlot: "Evening (5 PM - 8 PM)",
              day1Learn: "05 Nov 2026",
              day4Review: "08 Nov 2026",
              day7Recall: "11 Nov 2026",
            },
          ],
        },
      });
      console.log("✅ Seeded Student: student@learnymo.lk / Student@123");
    }

    // 5. Seed Academic Syllabus Hierarchy
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
      console.log("✅ Seeded Academic Syllabus Hierarchy");
    }

    // 6. Seed Published Classes across Categories
    let integrationClass = await ClassSession.findOne({
      topicName: "Integration",
    });
    const classCount = await ClassSession.countDocuments();
    if (classCount === 0) {
      const createdClasses = await ClassSession.insertMany([
        {
          teacher: verifiedTeacher._id,
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
          date: "2026-11-06",
          time: "6:00 PM - 8:00 PM",
          duration: "2 Hours",
          fee: 1200,
          maxStudents: 30,
          enrolledStudents: [student._id],
          status: "Published",
        },
        {
          teacher: verifiedTeacher._id,
          title: "Waves & Oscillations Complete Unit Crash Course",
          classType: "Unit Class",
          grade: "A/L",
          stream: "Physical Science",
          subject: "Physics",
          unitTitle: "Waves and Oscillations",
          topicName: "Simple Harmonic Motion",
          medium: "English",
          description:
            "Complete Unit 2 coverage with graphical analysis and 10 years of A/L MCQ discussions.",
          date: "2026-11-07",
          time: "5:00 PM - 7:30 PM",
          duration: "2.5 Hours",
          fee: 2000,
          maxStudents: 40,
          enrolledStudents: [],
          status: "Published",
        },
        {
          teacher: verifiedTeacher._id,
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
          enrolledStudents: [],
          status: "Published",
        },
        {
          teacher: verifiedTeacher._id,
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
          enrolledStudents: [],
          status: "Published",
        },
      ]);
      integrationClass = createdClasses[0];
      console.log("✅ Seeded 4 Published Classes");
    }

    // 7. Seed Sample Bookings (Confirmed, Pending 1-to-1, and Completed with Rating)
    const bookingCount = await BookingRequest.countDocuments();
    if (bookingCount === 0) {
      await BookingRequest.insertMany([
        {
          student: student._id,
          teacher: verifiedTeacher._id,
          classSession: integrationClass?._id || null,
          bookingType: "Group Enrollment",
          learningRequirement: "Specific Topic",
          grade: "A/L",
          stream: "Physical Science",
          subject: "Combined Mathematics",
          unitTitle: "Pure Mathematics",
          topicName: "Integration",
          medium: "English",
          preferredDate: "2026-11-06",
          preferredTimeRange: "6:00 PM - 8:00 PM",
          duration: "2 Hours",
          fee: 1200,
          teacherEarning: 960,
          platformCommission: 240,
          status: "Confirmed",
          meetingRoomId: "LearnyMo-Integration-Demo",
          messages: [
            {
              sender: verifiedTeacher._id,
              senderName: "Eng. Arjuna Perera",
              senderRole: "teacher",
              text: "Welcome Kasun! Your enrollment for Integration is confirmed. Click [ JOIN CLASS ] on the Class Card above when our session starts.",
            },
            {
              sender: student._id,
              senderName: "Kasun Perera",
              senderRole: "student",
              text: "Thank you sir! Looking forward to learning definite integrals.",
            },
          ],
        },
        {
          student: student._id,
          teacher: verifiedTeacher._id,
          bookingType: "1-to-1",
          learningRequirement: "Specific Topic",
          grade: "A/L",
          stream: "Physical Science",
          subject: "Physics",
          unitTitle: "Waves and Oscillations",
          topicName: "Doppler Effect",
          medium: "English",
          preferredDate: "2026-11-09",
          preferredTimeRange: "Evening: 5 PM – 8 PM",
          duration: "2 Hours",
          paymentPreference: "Per Class",
          budget: 1500,
          fee: 1500,
          status: "Pending",
          messages: [],
        },
        {
          student: student._id,
          teacher: verifiedTeacher._id,
          bookingType: "1-to-1",
          learningRequirement: "Specific Topic",
          grade: "A/L",
          stream: "Physical Science",
          subject: "Combined Mathematics",
          unitTitle: "Pure Mathematics",
          topicName: "Quadratic Functions and Roots",
          medium: "English",
          preferredDate: "2026-11-01",
          preferredTimeRange: "Morning: 8 AM – 12 PM",
          duration: "2 Hours",
          fee: 1500,
          teacherEarning: 1200,
          platformCommission: 300,
          status: "Completed",
          meetingRoomId: "LearnyMo-Quadratics-Done",
          messages: [
            {
              sender: verifiedTeacher._id,
              senderName: "Eng. Arjuna Perera",
              senderRole: "teacher",
              text: "Great job completing the Quadratic Functions session!",
            },
          ],
          rating: {
            stars: 5,
            feedback:
              "Cleared all my doubts on discriminant and root graphs in one session!",
            ratedAt: new Date(),
          },
        },
      ]);
      console.log("✅ Seeded 3 Sample Bookings (Confirmed, Pending, Completed)");
    }

    // 8. Seed Sample Topic Demands
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
          interestedStudents: [student._id],
          resolvedByClass: integrationClass?._id || null,
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
          interestedStudents: [student._id],
        },
      ]);
      console.log("✅ Seeded Student Topic Demands");
    }
  } catch (err) {
    console.error("Sample data seed check warning:", err.message);
  }
};

