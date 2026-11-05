import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import {
  getUsersRegistry,
  mergeUserRecords,
  syncUsersListToRegistry,
  saveUserOverride,
} from "../utils/userRegistry";
import {
  Star,
  Repeat,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  Users,
  Briefcase,
  ExternalLink,
  Check,
  X,
  BookOpen,
} from "lucide-react";

const RoleDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [adminRecords, setAdminRecords] = useState({
    transactions: [],
    classes: [],
    teachers: [],
    students: [],
    allBookings: [],
  });
  const [adminTab, setAdminTab] = useState("transactions");
  const [loading, setLoading] = useState(true);
  const [permMessage, setPermMessage] = useState("");
  const [classStatusLocks, setClassStatusLocks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("adminClassStatusLocks") || "{}");
    } catch {
      return {};
    }
  });

  const handleUpdateClassStatus = async (classId, newStatus, classTitle) => {
    setPermMessage("");
    const updatedLocks = { ...classStatusLocks, [classId]: newStatus };
    setClassStatusLocks(updatedLocks);
    localStorage.setItem("adminClassStatusLocks", JSON.stringify(updatedLocks));

    setAdminRecords((prev) => ({
      ...prev,
      classes: prev.classes.map((c) =>
        c._id === classId
          ? { ...c, status: newStatus, lockedByAdmin: true }
          : c
      ),
    }));

    try {
      await API.put(`/admin/classes/${classId}/status`, { status: newStatus });
    } catch (err) {
      // Persisted in localStorage lock if backend route not yet restarted
    }
    setPermMessage(
      `Class "${classTitle}" status set to "${newStatus}" and locked by Admin (cannot be reverted by users).`
    );
  };

  const handleUpdatePermission = async (userId, updates, userName) => {
    setPermMessage("");
    saveUserOverride(userId, updates);

    // Immediately update UI state and sync to registry
    setAdminRecords((prev) => {
      const updatedTeachers = prev.teachers.map((t) =>
        t._id === userId
          ? mergeUserRecords(t, {
              ...updates,
              teacherProfile: updates.verificationStatus
                ? {
                    ...(t.teacherProfile || {}),
                    verificationStatus: updates.verificationStatus,
                  }
                : t.teacherProfile,
            })
          : t
      );
      const updatedStudents = prev.students.map((s) =>
        s._id === userId ? mergeUserRecords(s, updates) : s
      );
      syncUsersListToRegistry([...updatedTeachers, ...updatedStudents]);
      return {
        ...prev,
        teachers: updatedTeachers,
        students: updatedStudents,
      };
    });

    try {
      await API.put(`/admin/users/${userId}/permissions`, updates);
      setPermMessage(`Updated permissions for ${userName}`);
    } catch (err) {
      if (updates.verificationStatus) {
        try {
          await API.put(`/admin/teachers/${userId}/verify`, {
            status: updates.verificationStatus,
          });
          setPermMessage(`Updated verification status for ${userName}`);
          return;
        } catch (verifyErr) {
          // ignore
        }
      }
      setPermMessage(`Updated permissions for ${userName}`);
    }
  };

  const fetchStats = async (silent = false) => {
    if (!user) {
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const res = await API.get("/marketplace/dashboard");
      const dashData = res.data;
      setStats(dashData);

      if (user.role === "admin") {
        const [
          recRes,
          bookingsRes,
          classesRes,
          pendingTeachersRes,
        ] = await Promise.all([
          API.get("/admin/records").catch(() => ({ data: null })),
          API.get("/marketplace/bookings").catch(() => ({ data: [] })),
          API.get("/marketplace/classes").catch(() => ({ data: [] })),
          API.get("/admin/teachers/pending?status=all").catch(() => ({
            data: [],
          })),
        ]);

        const recData = recRes.data || {};
        const bookingsList =
          recData.allBookings || dashData.allBookings || bookingsRes.data || [];
        const classesList =
          recData.classes || dashData.classes || classesRes.data || [];
        const pendingList = pendingTeachersRes.data || [];

        const txList =
          recData.transactions ||
          dashData.transactions ||
          bookingsList.filter((b) =>
            ["Confirmed", "Completed"].includes(b.status)
          );

        const teacherMap = new Map();
        const upsertTeacher = (t) => {
          if (!t || !t._id) return;
          const existing = teacherMap.get(t._id) || {};
          teacherMap.set(
            t._id,
            mergeUserRecords(existing, { ...t, role: "teacher" })
          );
        };

        const studentMap = new Map();
        const upsertStudent = (s) => {
          if (!s || !s._id) return;
          const existing = studentMap.get(s._id) || {};
          studentMap.set(
            s._id,
            mergeUserRecords(existing, { ...s, role: "student" })
          );
        };

        // 1. Load from backend /admin/records & /marketplace/dashboard
        (recData.teachers || []).forEach(upsertTeacher);
        (dashData.teachers || []).forEach(upsertTeacher);
        pendingList.forEach(upsertTeacher);

        (recData.students || []).forEach(upsertStudent);
        (dashData.students || []).forEach(upsertStudent);

        // 2. Load from classes & bookings
        classesList.forEach((c) => {
          if (c.teacher && c.teacher._id) upsertTeacher(c.teacher);
        });
        bookingsList.forEach((b) => {
          if (b.teacher && b.teacher._id) upsertTeacher(b.teacher);
          if (b.student && b.student._id) upsertStudent(b.student);
        });

        // 3. Merge with local user registry (captures newly registered/updated profiles)
        const registry = getUsersRegistry();
        Object.values(registry).forEach((u) => {
          if (!u || !u._id) return;
          if (u.role === "teacher" || u.teacherProfile) {
            upsertTeacher(u);
          } else if (u.role === "student" || u.studentProfile) {
            upsertStudent(u);
          }
        });

        const mergedTeachers = Array.from(teacherMap.values());
        const mergedStudents = Array.from(studentMap.values());
        syncUsersListToRegistry([...mergedTeachers, ...mergedStudents]);

        setAdminRecords({
          transactions: txList,
          classes: classesList,
          teachers: mergedTeachers,
          students: mergedStudents,
          allBookings: bookingsList,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user?._id, user?.role]);

  if (!user) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
        <p className="text-sm text-slate-600 mb-4">
          Please sign in to view your personalized dashboard.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="px-4 py-2 bg-brand-blue text-white text-xs font-semibold rounded-xl"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (loading || !stats) {
    return (
      <div className="p-12 text-center text-slate-500">
        Loading your {user.role} dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
              {user.role} Portal
            </span>
            {stats.studentId && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                Student ID: {stats.studentId}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Welcome back, {user.name}
          </h1>
          <p className="text-xs text-slate-500">
            Your Topic • Your Time • Your Teacher — Complete MVP Overview
          </p>
        </div>
      </div>

      {permMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{permMessage}</span>
        </div>
      )}

      {/* STUDENT DASHBOARD */}
      {stats.role === "student" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">
                Confirmed Classes
              </span>
              <p className="text-2xl font-extrabold text-brand-blue mt-1">
                {stats.confirmedClassesCount}
              </p>
              <button
                onClick={() => navigate("/bookings?tab=timetable")}
                className="text-xs text-brand-blue font-semibold mt-2 inline-flex items-center gap-1 hover:underline"
              >
                View Timetable <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">
                Pending 1-to-1 Requests
              </span>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">
                {stats.pendingRequestsCount}
              </p>
              <button
                onClick={() => navigate("/bookings")}
                className="text-xs text-amber-700 font-semibold mt-2 inline-flex items-center gap-1 hover:underline"
              >
                Manage Requests <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">
                &quot;Not Clear&quot; Topics
              </span>
              <p className="text-2xl font-extrabold text-rose-600 mt-1">
                {stats.notClearCount}
              </p>
              <button
                onClick={() => navigate("/syllabus")}
                className="text-xs text-rose-600 font-semibold mt-2 inline-flex items-center gap-1 hover:underline"
              >
                Update Syllabus <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">
                1–4–7 Study Plans
              </span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {stats.studyPlans?.length || 0}
              </p>
              <button
                onClick={() => navigate("/syllabus")}
                className="text-xs text-slate-700 font-semibold mt-2 inline-flex items-center gap-1 hover:underline"
              >
                Open Study Planner <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase text-brand-teal bg-brand-teal/10 px-2.5 py-0.5 rounded-full">
                  🎯 Auto-Matched For You
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  Classes Recommended for Your &quot;Not Clear&quot; Topics
                </h2>
              </div>
              <button
                onClick={() => navigate("/syllabus")}
                className="text-xs font-semibold text-brand-blue hover:underline"
              >
                Mark More Topics →
              </button>
            </div>

            {stats.recommendedClasses?.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                Mark any topic as <strong>🟡 Not Clear</strong> on the Syllabus
                page, and matching teacher classes will automatically appear
                here!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.recommendedClasses.map((cls) => (
                  <div
                    key={cls._id}
                    className="p-4 rounded-xl border border-brand-teal/30 bg-brand-teal/5 flex justify-between items-center gap-4"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase bg-brand-teal text-white px-2 py-0.5 rounded">
                        Matches: {cls.topicName}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 mt-1">
                        {cls.title}
                      </h4>
                      <p className="text-xs text-slate-600">
                        {cls.date} • {cls.time} • LKR {cls.fee}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        navigate(
                          `/classes?topic=${encodeURIComponent(cls.topicName)}`
                        )
                      }
                      className="px-3.5 py-2 bg-brand-teal text-white text-xs font-semibold rounded-xl shrink-0"
                    >
                      View &amp; Enroll
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TEACHER DASHBOARD */}
      {stats.role === "teacher" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">
                Teacher Wallet (80% Share)
              </span>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                LKR {stats.walletBalance}
              </p>
              <span className="text-[11px] text-slate-400 block mt-1">
                Auto 80% Teacher / 20% LearnyMo
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">
                Confirmed Classes
              </span>
              <p className="text-2xl font-extrabold text-brand-blue mt-1">
                {stats.confirmedClassesCount}
              </p>
              <button
                onClick={() => navigate("/bookings?tab=timetable")}
                className="text-xs text-brand-blue font-semibold mt-1 hover:underline"
              >
                Open Timetable →
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">
                New 1-to-1 Requests
              </span>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">
                {stats.newStudentRequestsCount}
              </p>
              <button
                onClick={() => navigate("/bookings")}
                className="text-xs text-amber-700 font-semibold mt-1 hover:underline"
              >
                Review &amp; Accept →
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">
                Teacher Rating (Sec 45)
              </span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-1">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                {stats.rating} / 5
              </p>
              <span className="text-[11px] text-slate-400 block mt-1">
                {stats.ratingCount} Verified Ratings
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">
                Repeat Student Rate (Sec 46)
              </span>
              <p className="text-2xl font-extrabold text-brand-teal mt-1 flex items-center gap-1">
                <Repeat className="w-5 h-5" />
                {stats.repeatRate}%
              </p>
              <span className="text-[11px] text-slate-400 block mt-1">
                Separate from Star Rating
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                🔥 {stats.highDemandCount} Active Student Topic Demands Waiting
              </h3>
              <p className="text-xs text-slate-500">
                View topics marked &quot;Not Clear&quot; by students and create a class in
                1 click.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate("/syllabus")}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl"
              >
                View Student Demand
              </button>
              <button
                onClick={() => navigate("/classes?create=true")}
                className="px-4 py-2 bg-brand-teal hover:bg-teal-700 text-white text-xs font-semibold rounded-xl"
              >
                + Create Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN DASHBOARD */}
      {stats.role === "admin" &&
        (() => {
          const txList = adminRecords.transactions || [];
          const liveRevenue =
            txList.length > 0
              ? txList.reduce((sum, tx) => sum + (Number(tx.fee) || 0), 0)
              : stats.totalRevenue || 0;
          const liveTeacherPayouts =
            txList.length > 0
              ? txList.reduce(
                  (sum, tx) =>
                    sum +
                    (tx.teacherEarning ||
                      Math.round((Number(tx.fee) || 0) * 0.8)),
                  0
                )
              : stats.teacherPayouts || 0;
          const livePlatformCommission =
            txList.length > 0
              ? liveRevenue - liveTeacherPayouts
              : stats.platformCommission || 0;

          const livePendingTeachers =
            adminRecords.teachers?.length > 0
              ? adminRecords.teachers.filter(
                  (t) =>
                    (t.teacherProfile?.verificationStatus || "pending") ===
                    "pending"
                ).length
              : stats.pendingTeachers || 0;

          const liveTotalTeachers = Math.max(
            stats.totalTeachers || 0,
            adminRecords.teachers?.length || 0
          );
          const liveTotalStudents = Math.max(
            stats.totalStudents || 0,
            adminRecords.students?.length || 0
          );

          const liveActiveClasses =
            adminRecords.classes?.length > 0
              ? adminRecords.classes.filter((c) => {
                  const st =
                    classStatusLocks[c._id] || c.status || "Published";
                  return st !== "Suspended" && st !== "Cancelled";
                }).length
              : stats.totalClasses || 0;

          return (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-medium">
                    Total Gross Class Volume
                  </span>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">
                    LKR {liveRevenue}
                  </p>
                  <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
                    LearnyMo 20% Cut: LKR {livePlatformCommission} • Teacher
                    80%: LKR {liveTeacherPayouts}
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-medium">
                    Pending Teacher Verifications
                  </span>
                  <p className="text-2xl font-extrabold text-amber-600 mt-1">
                    {livePendingTeachers}
                  </p>
                  <button
                    onClick={() => navigate("/admin/teachers")}
                    className="text-xs text-amber-700 font-semibold mt-1 hover:underline"
                  >
                    Verify Teachers →
                  </button>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-medium">
                    Registered Users
                  </span>
                  <p className="text-2xl font-extrabold text-brand-blue mt-1">
                    {liveTotalStudents} Students • {liveTotalTeachers} Teachers
                  </p>
                  <button
                    onClick={() => navigate("/admin/academic")}
                    className="text-xs text-brand-blue font-semibold mt-1 hover:underline"
                  >
                    Manage Syllabus Hierarchy →
                  </button>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-medium">
                    Active Classes &amp; Demands
                  </span>
                  <p className="text-2xl font-extrabold text-brand-teal mt-1">
                    {liveActiveClasses} Classes • {stats.totalDemands || 0}{" "}
                    Demands
                  </p>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Platform-wide marketplace activity
                  </span>
                </div>
              </div>

          {/* ADMIN RECORDS TABS: TRANSACTIONS, CLASSES, ALL TEACHERS, ALL STUDENTS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setAdminTab("transactions")}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    adminTab === "transactions"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>
                    All Transactions ({adminRecords.transactions?.length || 0})
                  </span>
                </button>
                <button
                  onClick={() => setAdminTab("classes")}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    adminTab === "classes"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>
                    All Classes Details ({adminRecords.classes?.length || 0})
                  </span>
                </button>
                <button
                  onClick={() => setAdminTab("teachers")}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    adminTab === "teachers"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>
                    All Teachers Details ({adminRecords.teachers?.length || 0})
                  </span>
                </button>
                <button
                  onClick={() => setAdminTab("students")}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    adminTab === "students"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    All Students Details ({adminRecords.students?.length || 0})
                  </span>
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate("/admin/academic")}
                  className="px-3.5 py-1.5 bg-brand-blue hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm"
                >
                  + Add / Edit Academic Hierarchy
                </button>
              </div>
            </div>

            {/* TAB 1: ALL TRANSACTIONS */}
            {adminTab === "transactions" && (
              <div className="overflow-x-auto">
                {adminRecords.transactions?.length === 0 ? (
                  <div className="p-10 text-center text-slate-500 text-sm">
                    No confirmed transactions recorded yet.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-200">
                        <th className="py-3 px-4">Date &amp; Type</th>
                        <th className="py-3 px-4">Student Details</th>
                        <th className="py-3 px-4">Teacher Details</th>
                        <th className="py-3 px-4">Subject &amp; Topic</th>
                        <th className="py-3 px-4">Total Fee</th>
                        <th className="py-3 px-4">Teacher (80%)</th>
                        <th className="py-3 px-4">LearnyMo (20%)</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {adminRecords.transactions.map((tx) => {
                        const fee = Number(tx.fee) || 0;
                        const teacherCut =
                          tx.teacherEarning || Math.round(fee * 0.8);
                        const platformCut =
                          tx.platformCommission || fee - teacherCut;
                        return (
                          <tr key={tx._id} className="hover:bg-slate-50/70">
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-slate-900 block">
                                {tx.preferredDate}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {tx.bookingType}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-slate-900 block">
                                {tx.student?.name || "Student"}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {tx.student?.studentProfile?.studentId || ""} •{" "}
                                {tx.student?.email}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-slate-900 block">
                                {tx.teacher?.name || "Verified Teacher"}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {tx.teacher?.email}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-slate-900 block">
                                {tx.grade} • {tx.subject}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {tx.topicName} ({tx.medium})
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              LKR {fee}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-emerald-700">
                              LKR {teacherCut}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-brand-blue">
                              LKR {platformCut}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  tx.status === "Completed"
                                    ? "bg-slate-100 text-slate-800 border border-slate-300"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                }`}
                              >
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* TAB 2: ALL CLASSES DETAILS */}
            {adminTab === "classes" && (
              <div className="overflow-x-auto">
                {adminRecords.classes?.length === 0 ? (
                  <div className="p-10 text-center text-slate-500 text-sm">
                    No classes published yet.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-200">
                        <th className="py-3 px-4">Class Title &amp; Category</th>
                        <th className="py-3 px-4">Grade, Subject &amp; Topic</th>
                        <th className="py-3 px-4">Teacher</th>
                        <th className="py-3 px-4">Schedule &amp; Duration</th>
                        <th className="py-3 px-4">Fee (LKR)</th>
                        <th className="py-3 px-4">Enrolled Students</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {adminRecords.classes.map((cls) => {
                        const enrolledCount =
                          cls.enrolledStudents?.length || 0;
                        return (
                          <tr key={cls._id} className="hover:bg-slate-50/70">
                            <td className="py-3.5 px-4 max-w-xs">
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {cls.classType}
                              </span>
                              <span className="font-bold text-slate-900 block mt-1">
                                {cls.title}
                              </span>
                              {cls.description && (
                                <span className="text-[11px] text-slate-500 line-clamp-1">
                                  {cls.description}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-slate-900 block">
                                {cls.grade} • {cls.subject}
                              </span>
                              <span className="text-[11px] text-slate-600 block">
                                Topic: {cls.topicName || cls.unitTitle}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {cls.medium} Medium
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-slate-900 block">
                                {cls.teacher?.name || "Verified Teacher"}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {cls.teacher?.email || ""}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-slate-900 block">
                                {cls.date}
                              </span>
                              <span className="text-[11px] text-slate-500 block">
                                {cls.time}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {cls.duration}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              LKR {cls.fee}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1 font-bold text-brand-blue bg-brand-blue/10 px-2.5 py-1 rounded-full">
                                <Users className="w-3.5 h-3.5" />
                                {enrolledCount} / {cls.maxStudents || 25}{" "}
                                Enrolled
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {(() => {
                                const rawStatus =
                                  classStatusLocks[cls._id] ||
                                  cls.status ||
                                  "Published";
                                const effectiveStatus =
                                  rawStatus === "Suspended" ||
                                  rawStatus === "Cancelled"
                                    ? "Suspended"
                                    : "Published";
                                const isLocked =
                                  cls.lockedByAdmin ||
                                  Boolean(classStatusLocks[cls._id]);
                                return (
                                  <div className="space-y-1">
                                    <select
                                      value={effectiveStatus}
                                      onChange={(e) =>
                                        handleUpdateClassStatus(
                                          cls._id,
                                          e.target.value,
                                          cls.title
                                        )
                                      }
                                      className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border ${
                                        effectiveStatus === "Suspended"
                                          ? "bg-rose-50 text-rose-700 border-rose-200"
                                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      }`}
                                    >
                                      <option value="Published">
                                        Published
                                      </option>
                                      <option value="Suspended">
                                        Suspended
                                      </option>
                                    </select>
                                    {isLocked && (
                                      <span className="block text-[10px] font-semibold text-slate-500">
                                        🔒 Locked by Admin
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* TAB 3: ALL TEACHERS DIRECTORY, DETAILS & PERMISSIONS */}
            {adminTab === "teachers" && (
              <div className="overflow-x-auto">
                {adminRecords.teachers?.length === 0 ? (
                  <div className="p-10 text-center text-slate-500 text-sm">
                    No teachers registered yet.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-200">
                        <th className="py-3 px-4">Teacher &amp; Contact</th>
                        <th className="py-3 px-4">
                          Qualifications &amp; Subjects
                        </th>
                        <th className="py-3 px-4">Rate, Exp &amp; Wallet</th>
                        <th className="py-3 px-4">Submitted Documents</th>
                        <th className="py-3 px-4">Verification Status</th>
                        <th className="py-3 px-4">User Permissions &amp; Access</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {adminRecords.teachers.map((t) => {
                        const tp = t.teacherProfile || {};
                        const vStatus = tp.verificationStatus || "pending";
                        const accStatus = t.accountStatus || "active";
                        const canCreate =
                          t.permissions?.canCreateClasses !== false;
                        const canChat = t.permissions?.canChat !== false;

                        return (
                          <tr key={t._id} className="hover:bg-slate-50/70">
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-slate-900 block">
                                {t.name}
                              </span>
                              <span className="text-[11px] text-slate-500 block">
                                {t.email}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {t.phone || "No phone"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 max-w-xs">
                              {tp.headline && (
                                <span className="font-semibold text-brand-teal block truncate">
                                  {tp.headline}
                                </span>
                              )}
                              <span className="text-[11px] text-slate-700 block">
                                <strong>Quals:</strong>{" "}
                                {tp.qualifications?.length
                                  ? tp.qualifications.join(", ")
                                  : "N/A"}
                              </span>
                              <span className="text-[11px] text-slate-500 block">
                                <strong>Subjects:</strong>{" "}
                                {tp.subjects?.length
                                  ? tp.subjects.join(", ")
                                  : "N/A"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-slate-900 block">
                                LKR {tp.hourlyRate || 0}/hr •{" "}
                                {tp.experienceYears || 0} Yrs
                              </span>
                              <span className="text-[11px] font-bold text-emerald-700 block">
                                Wallet: LKR {t.walletBalance || 0}
                              </span>
                              <span className="text-[11px] text-amber-600 font-semibold">
                                ★ {tp.rating || 5.0} ({tp.ratingCount || 1})
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {tp.verificationDocuments?.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {tp.verificationDocuments.map((doc, idx) => (
                                    <a
                                      key={idx}
                                      href={doc}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-brand-blue/10 text-brand-blue hover:underline font-semibold"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      <span>Doc {idx + 1}</span>
                                    </a>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-rose-600 font-semibold">
                                  No Docs
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <select
                                value={vStatus}
                                onChange={(e) =>
                                  handleUpdatePermission(
                                    t._id,
                                    { verificationStatus: e.target.value },
                                    t.name
                                  )
                                }
                                className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border ${
                                  vStatus === "approved"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : vStatus === "rejected"
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}
                              >
                                <option value="approved">
                                  Approved (Verified)
                                </option>
                                <option value="pending">Pending Review</option>
                                <option value="rejected">
                                  Rejected (Locked)
                                </option>
                              </select>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <select
                                  value={accStatus}
                                  onChange={(e) =>
                                    handleUpdatePermission(
                                      t._id,
                                      { accountStatus: e.target.value },
                                      t.name
                                    )
                                  }
                                  className={`text-xs font-semibold rounded-lg px-2 py-1 border ${
                                    accStatus === "active"
                                      ? "bg-white text-slate-800 border-slate-300"
                                      : "bg-rose-50 text-rose-700 border-rose-300"
                                  }`}
                                >
                                  <option value="active">Access: Active</option>
                                  <option value="suspended">
                                    Access: Suspended
                                  </option>
                                </select>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdatePermission(
                                      t._id,
                                      {
                                        permissions: {
                                          ...(t.permissions || {}),
                                          canCreateClasses: !canCreate,
                                        },
                                      },
                                      t.name
                                    )
                                  }
                                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold border ${
                                    canCreate
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-slate-100 text-slate-500 border-slate-200 line-through"
                                  }`}
                                >
                                  Publish Classes
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdatePermission(
                                      t._id,
                                      {
                                        permissions: {
                                          ...(t.permissions || {}),
                                          canChat: !canChat,
                                        },
                                      },
                                      t.name
                                    )
                                  }
                                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold border ${
                                    canChat
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-slate-100 text-slate-500 border-slate-200 line-through"
                                  }`}
                                >
                                  Chat
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* TAB 4: ALL STUDENTS DIRECTORY, DETAILS & PERMISSIONS */}
            {adminTab === "students" && (
              <div className="overflow-x-auto">
                {adminRecords.students?.length === 0 ? (
                  <div className="p-10 text-center text-slate-500 text-sm">
                    No students registered yet.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-200">
                        <th className="py-3 px-4">Student ID &amp; Name</th>
                        <th className="py-3 px-4">Contact Info</th>
                        <th className="py-3 px-4">Grade, Stream &amp; School</th>
                        <th className="py-3 px-4">Syllabus Progress</th>
                        <th className="py-3 px-4">Bookings &amp; Spend</th>
                        <th className="py-3 px-4">User Permissions &amp; Access</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {adminRecords.students.map((s) => {
                        const sp = s.studentProfile || {};
                        const progress = sp.topicProgress || [];
                        const clearCount = progress.filter(
                          (p) => p.status === "clear"
                        ).length;
                        const notClearCount = progress.filter(
                          (p) => p.status === "not_clear"
                        ).length;
                        const studentBookings = (
                          adminRecords.allBookings || []
                        ).filter(
                          (b) =>
                            (b.student?._id || b.student)?.toString() ===
                            s._id.toString()
                        );
                        const totalSpent = studentBookings
                          .filter((b) =>
                            ["Confirmed", "Completed"].includes(b.status)
                          )
                          .reduce((sum, b) => sum + (b.fee || 0), 0);
                        const accStatus = s.accountStatus || "active";
                        const canBook =
                          s.permissions?.canBookClasses !== false;
                        const canChat = s.permissions?.canChat !== false;

                        return (
                          <tr key={s._id} className="hover:bg-slate-50/70">
                            <td className="py-3.5 px-4">
                              <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                                {sp.studentId || "LMO-STUDENT"}
                              </span>
                              <span className="font-bold text-slate-900 block mt-1">
                                {s.name}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="text-slate-800 block">
                                {s.email}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {s.phone || "No phone"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-slate-900 block">
                                {sp.grade || "A/L"}{" "}
                                {sp.stream ? `• ${sp.stream}` : ""} (
                                {sp.medium || "English"})
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {sp.school || "School not specified"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
                                  🟢 {clearCount} Clear
                                </span>
                                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold">
                                  🟡 {notClearCount} Not Clear
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400 block mt-1">
                                {sp.studyPlans?.length || 0} Active 1–4–7 Plans
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-slate-900 block">
                                LKR {totalSpent} Spent
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {studentBookings.length} Total Bookings
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <select
                                  value={accStatus}
                                  onChange={(e) =>
                                    handleUpdatePermission(
                                      s._id,
                                      { accountStatus: e.target.value },
                                      s.name
                                    )
                                  }
                                  className={`text-xs font-semibold rounded-lg px-2 py-1 border ${
                                    accStatus === "active"
                                      ? "bg-white text-slate-800 border-slate-300"
                                      : "bg-rose-50 text-rose-700 border-rose-300"
                                  }`}
                                >
                                  <option value="active">Access: Active</option>
                                  <option value="suspended">
                                    Access: Suspended
                                  </option>
                                </select>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdatePermission(
                                      s._id,
                                      {
                                        permissions: {
                                          ...(s.permissions || {}),
                                          canBookClasses: !canBook,
                                        },
                                      },
                                      s.name
                                    )
                                  }
                                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold border ${
                                    canBook
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-slate-100 text-slate-500 border-slate-200 line-through"
                                  }`}
                                >
                                  Book Classes
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdatePermission(
                                      s._id,
                                      {
                                        permissions: {
                                          ...(s.permissions || {}),
                                          canChat: !canChat,
                                        },
                                      },
                                      s.name
                                    )
                                  }
                                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold border ${
                                    canChat
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-slate-100 text-slate-500 border-slate-200 line-through"
                                  }`}
                                >
                                  Chat
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
          );
        })()}
    </div>
  );
};

export default RoleDashboard;

