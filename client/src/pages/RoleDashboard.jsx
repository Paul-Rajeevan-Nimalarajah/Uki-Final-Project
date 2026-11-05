import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import {
  Star,
  Repeat,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const RoleDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState("");

  const fetchStats = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await API.get("/marketplace/dashboard");
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  const handleSeedDemo = async () => {
    setSeeding(true);
    setSeedMessage("");
    try {
      const res = await API.post("/marketplace/seed-demo");
      setSeedMessage(res.data.message);
      fetchStats();
    } catch (err) {
      alert("Failed to seed demo data");
    } finally {
      setSeeding(false);
    }
  };

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
      {/* Top Banner + 1-Click Assessment Demo Seeder */}
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

        <button
          onClick={handleSeedDemo}
          disabled={seeding}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-all shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>
            {seeding
              ? "Seeding Demo Data..."
              : "Load Assessment Demo Data"}
          </span>
        </button>
      </div>

      {seedMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{seedMessage}</span>
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
                Membership Status (Sec 59)
              </span>
              <p className="text-lg font-extrabold text-emerald-600 mt-1">
                First 3 Months FREE
              </p>
              <span className="text-[11px] text-slate-400 block mt-2">
                Then LKR 99/mo or LKR 999/yr
              </span>
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
      {stats.role === "admin" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">
                Total Gross Class Volume
              </span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                LKR {stats.totalRevenue}
              </p>
              <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
                LearnyMo 20% Cut: LKR {stats.platformCommission}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">
                Pending Teacher Verifications
              </span>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">
                {stats.pendingTeachers}
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
                {stats.totalStudents} Students • {stats.totalTeachers} Teachers
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
                {stats.totalClasses} Classes • {stats.totalDemands} Demands
              </p>
              <button
                onClick={() => navigate("/syllabus")}
                className="text-xs text-brand-teal font-semibold mt-1 hover:underline"
              >
                View Demand Board →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleDashboard;

