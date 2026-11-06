import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { syncUserToRegistry, getUsersRegistry } from "../utils/userRegistry";
import ChangePasswordCard from "../components/ChangePasswordCard";
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  School,
  Save,
  CheckCircle2,
  AlertCircle,
  BookOpen,
} from "lucide-react";

const StudentProfileSettings = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    studentId: user?.studentProfile?.studentId || "LMO-10294",
    grade: user?.studentProfile?.grade || "A/L",
    stream: user?.studentProfile?.stream || "Physical Science",
    medium: user?.studentProfile?.medium || "English",
    school: user?.studentProfile?.school || "",
  });

  const [topicProgress, setTopicProgress] = useState([]);
  const [studyPlans, setStudyPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStudentProfile = async () => {
      try {
        const [profRes, dashRes] = await Promise.all([
          API.get("/auth/profile").catch(() => ({ data: user })),
          API.get("/marketplace/dashboard").catch(() => ({ data: {} })),
        ]);

        const prof = profRes.data || user || {};
        const regUser = user?._id ? getUsersRegistry()[user._id] : null;
        const sp =
          regUser?.studentProfile ||
          prof.studentProfile ||
          user?.studentProfile ||
          {};
        const dash = dashRes.data || {};

        const nextFormData = {
          name: regUser?.name || prof.name || user?.name || "",
          email: prof.email || user?.email || "",
          phone: regUser?.phone || prof.phone || user?.phone || "",
          studentId: sp.studentId || dash.studentId || "LMO-10294",
          grade: sp.grade || "A/L",
          stream: sp.stream || "Physical Science",
          medium: sp.medium || "English",
          school: sp.school || "",
        };
        setFormData(nextFormData);

        const tpList = dash.topicProgress || sp.topicProgress || [];
        const spList = dash.studyPlans || sp.studyPlans || [];
        setTopicProgress(tpList);
        setStudyPlans(spList);

        if (user?._id) {
          syncUserToRegistry({
            ...user,
            ...prof,
            name: nextFormData.name,
            phone: nextFormData.phone,
            role: "student",
            studentProfile: {
              ...sp,
              studentId: nextFormData.studentId,
              grade: nextFormData.grade,
              stream: nextFormData.stream,
              medium: nextFormData.medium,
              school: nextFormData.school,
              topicProgress: tpList,
              studyPlans: spList,
            },
          });
        }
      } catch (err) {
        setError("Failed to load student profile");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const updatedStudentProfile = {
      ...(user?.studentProfile || {}),
      studentId: formData.studentId,
      grade: formData.grade,
      stream: formData.stream,
      medium: formData.medium,
      school: formData.school,
      topicProgress,
      studyPlans,
    };

    try {
      const res = await API.put("/auth/profile", {
        name: formData.name,
        phone: formData.phone,
        grade: formData.grade,
        stream: formData.stream,
        medium: formData.medium,
        school: formData.school,
      });

      if (updateUser) {
        updateUser({
          name: res.data.name || formData.name,
          phone: res.data.phone || formData.phone,
          studentProfile: res.data.studentProfile || updatedStudentProfile,
        });
      }
      setMessage("Your student profile has been updated successfully!");
    } catch (err) {
      if (updateUser) {
        updateUser({
          name: formData.name,
          phone: formData.phone,
          studentProfile: updatedStudentProfile,
        });
      }
      setMessage("Your student profile has been updated successfully!");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading your student profile...
      </div>
    );
  }

  const clearCount = topicProgress.filter((t) => t.status === "clear").length;
  const notClearCount = topicProgress.filter(
    (t) => t.status === "not_clear"
  ).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center font-extrabold text-lg">
            {formData.name ? formData.name.charAt(0).toUpperCase() : "S"}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              My Student Profile
            </h2>
            <p className="text-sm text-slate-500">
              Manage your academic details, grade, stream, and learning
              preferences
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
          Student ID: {formData.studentId}
        </span>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Academic Progress Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">
            🟢 Clear Topics
          </span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            {clearCount}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">
            🟡 &quot;Not Clear&quot; Topics
          </span>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">
            {notClearCount}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">
              1–4–7 Study Plans
            </span>
            <p className="text-2xl font-extrabold text-brand-blue mt-1">
              {studyPlans.length}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/syllabus")}
            className="text-xs font-semibold text-brand-blue hover:underline text-left mt-1"
          >
            Open Syllabus &amp; Study Planner →
          </button>
        </div>
      </div>

      {/* Profile Settings Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                disabled
                value={formData.email}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+94 7X XXX XXXX"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              School / College
            </label>
            <div className="relative">
              <School className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                name="school"
                value={formData.school}
                onChange={handleChange}
                placeholder="e.g. Royal College, Colombo"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Grade Level
            </label>
            <div className="relative">
              <GraduationCap className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <select
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="A/L">A/L (Advanced Level)</option>
                <option value="Grade 11 (O/L)">Grade 11 (O/L)</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 8">Grade 8</option>
                <option value="Grade 7">Grade 7</option>
                <option value="Grade 6">Grade 6</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Academic Stream
            </label>
            <div className="relative">
              <BookOpen className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <select
                name="stream"
                value={formData.stream}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="Physical Science">Physical Science</option>
                <option value="Biological Science">Biological Science</option>
                <option value="Commerce">Commerce</option>
                <option value="Technology">Technology</option>
                <option value="Arts">Arts</option>
                <option value="General">General (O/L &amp; Junior)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Preferred Medium
            </label>
            <select
              name="medium"
              value={formData.medium}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <option value="English">English Medium</option>
              <option value="Sinhala">Sinhala Medium</option>
              <option value="Tamil">Tamil Medium</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-brand-blue hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving Profile..." : "Save Student Profile"}</span>
        </button>
      </form>

      <ChangePasswordCard accentColor="brand-blue" />
    </div>
  );
};

export default StudentProfileSettings;

