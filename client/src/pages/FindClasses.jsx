import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import AcademicSelector from "../components/AcademicSelector";
import {
  BookOpen,
  Calendar,
  Users,
  Plus,
  CheckCircle2,
  Sparkles,
  Star,
  CreditCard,
  X,
} from "lucide-react";

const CLASS_TYPES = [
  "All",
  "Topic Class",
  "Unit Class",
  "Group Class",
  "Paper Class",
  "Full Subject",
  "Class Series",
];

const FindClasses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isTeacher = user?.role === "teacher";
  const isStudent = user?.role === "student";
  const isGuest = !user;

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("All");
  const [searchTopic, setSearchTopic] = useState(
    searchParams.get("topic") || ""
  );
  const [selectedMedium, setSelectedMedium] = useState("");

  // Teacher Create Class modal state
  const [showCreateModal, setShowCreateModal] = useState(
    isTeacher && searchParams.get("create") === "true"
  );
  const [creating, setCreating] = useState(false);
  const [newClass, setNewClass] = useState({
    title: searchParams.get("topic")
      ? `${searchParams.get("topic")} - Complete Mastery Session`
      : "",
    classType: "Topic Class",
    grade: searchParams.get("grade") || "A/L",
    stream: "Physical Science",
    subject: searchParams.get("subject") || "Combined Mathematics",
    unitTitle: searchParams.get("unit") || "Pure Mathematics",
    topicName: searchParams.get("topic") || "",
    medium: "English",
    description: "",
    date: "2026-11-07",
    time: "6:00 PM - 8:00 PM",
    duration: "2 Hours",
    fee: 1200,
    maxStudents: 25,
    posterUrl: "",
    demandId: searchParams.get("demandId") || "",
  });

  // Simulated Payment Checkout Modal for Student Class Enrollment
  const [checkoutClass, setCheckoutClass] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await API.get("/marketplace/classes");
      setClasses(res.data);
    } catch (err) {
      setError("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await API.post("/marketplace/classes", newClass);
      setMessage("Class published successfully! Matching students notified.");
      setShowCreateModal(false);
      fetchClasses();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create class");
    } finally {
      setCreating(false);
    }
  };

  const handleConfirmEnroll = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setEnrolling(true);
    setError("");
    try {
      await API.post(`/marketplace/classes/${checkoutClass._id}/enroll`);
      setCheckoutClass(null);
      navigate("/bookings?enrolled=true");
    } catch (err) {
      setError(err.response?.data?.message || "Enrollment failed");
      setCheckoutClass(null);
    } finally {
      setEnrolling(false);
    }
  };

  const filteredClasses = classes.filter((c) => {
    if (selectedType !== "All" && c.classType !== selectedType) return false;
    if (selectedMedium && c.medium !== selectedMedium) return false;
    if (searchTopic) {
      const q = searchTopic.toLowerCase();
      const matchTitle = (c.title || "").toLowerCase().includes(q);
      const matchTopic = (c.topicName || "").toLowerCase().includes(q);
      const matchSubject = (c.subject || "").toLowerCase().includes(q);
      if (!matchTitle && !matchTopic && !matchSubject) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Role-Specific Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            {isTeacher ? "Teacher Class Management" : "Class Marketplace"}
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {isTeacher
              ? "Publish & Manage Topic, Unit, Group & Paper Classes"
              : "Browse Topic, Unit, Group & Paper Classes"}
          </h1>
          <p className="text-sm text-slate-500">
            {isTeacher
              ? "Create targeted classes for high-demand syllabus topics and track student enrollments."
              : "Enroll in scheduled classes by verified teachers or request a custom 1-to-1 session."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(isStudent || isGuest) && (
            <button
              onClick={() =>
                isGuest ? navigate("/login") : navigate("/bookings?tab=request")
              }
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-800 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-all"
            >
              Request 1-to-1 Class
            </button>
          )}
          {isTeacher && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Class</span>
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Filters & Category Pills */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-2">
          {CLASS_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedType === type
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <input
            type="text"
            value={searchTopic}
            onChange={(e) => setSearchTopic(e.target.value)}
            placeholder="Search by Topic, Subject, or Title..."
            className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          <select
            value={selectedMedium}
            onChange={(e) => setSelectedMedium(e.target.value)}
            className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">All Mediums (English / Sinhala / Tamil)</option>
            <option value="English">English Medium</option>
            <option value="Sinhala">Sinhala Medium</option>
            <option value="Tamil">Tamil Medium</option>
          </select>
          <button
            onClick={() => {
              setSelectedType("All");
              setSearchTopic("");
              setSelectedMedium("");
            }}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl px-4 py-2 transition-colors"
          >
            Reset Filters ({filteredClasses.length} classes shown)
          </button>
        </div>
      </div>

      {/* Class Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">
          Loading available classes...
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">
            No Matching Classes Found
          </h3>
          {isTeacher ? (
            <>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Publish a new class for this topic to match waiting students.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
              >
                + Create Class
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Can&apos;t find the exact topic you need? Request a 1-to-1 class
                or mark the topic as &quot;Not Clear&quot; on the Syllabus page!
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() =>
                    isGuest
                      ? navigate("/login")
                      : navigate("/bookings?tab=request")
                  }
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
                >
                  Request 1-to-1 Class
                </button>
                <button
                  onClick={() => navigate("/syllabus")}
                  className="px-4 py-2 bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold rounded-xl"
                >
                  Mark Topic as &quot;Not Clear&quot;
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => {
            let adminLockedStatus = null;
            try {
              const locks = JSON.parse(
                localStorage.getItem("adminClassStatusLocks") || "{}"
              );
              adminLockedStatus = locks[cls._id] || null;
            } catch {
              adminLockedStatus = null;
            }
            const effectiveStatus =
              adminLockedStatus || cls.status || "Published";
            const isClosedByAdmin = !["Published", "Ongoing"].includes(
              effectiveStatus
            );
            const enrolledCount = cls.enrolledStudents?.length || 0;
            const seatsLeft = Math.max(
              0,
              (cls.maxStudents || 25) - enrolledCount
            );
            const isMyClass =
              isTeacher &&
              (cls.teacher?._id === user?._id || cls.teacher === user?._id);
            const isAlreadyEnrolled =
              isStudent &&
              cls.enrolledStudents?.some(
                (id) => (id._id || id) === user?._id
              );

            return (
              <div
                key={cls._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden"
              >
                {/* Clean Header Banner */}
                <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-col justify-between gap-3">
                  <div className="flex justify-between items-start gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white text-slate-700 border border-slate-200">
                      {cls.classType}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          effectiveStatus === "Published" ||
                          effectiveStatus === "Ongoing"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : effectiveStatus === "Cancelled" ||
                              effectiveStatus === "Suspended"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {effectiveStatus}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-200/70 text-slate-700">
                        {cls.medium}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">
                      {cls.grade} • {cls.subject}
                    </p>
                    <h3 className="font-bold text-base text-slate-900 line-clamp-1">
                      {cls.title}
                    </h3>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        Topic: {cls.topicName || cls.unitTitle || cls.subject}
                      </span>
                      <span className="flex items-center gap-1 text-amber-600 font-semibold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {cls.teacher?.teacherProfile?.rating || "4.9"}
                      </span>
                    </div>

                    {cls.description && (
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {cls.description}
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-800">
                          Teacher: {cls.teacher?.name || "Verified Teacher"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {cls.date} • {cls.time} ({cls.duration})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {enrolledCount}/{cls.maxStudents} Enrolled •{" "}
                          <strong className="text-emerald-600">
                            {seatsLeft} seats left
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Role-Specific Card Action Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block">
                        Class Fee
                      </span>
                      <span className="text-lg font-extrabold text-slate-900">
                        LKR {cls.fee}
                      </span>
                    </div>

                    {(isStudent || isGuest) &&
                      (isAlreadyEnrolled ? (
                        <button
                          onClick={() => navigate("/bookings?tab=timetable")}
                          className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-xl"
                        >
                          Enrolled ✓ (View Timetable)
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            isGuest
                              ? navigate("/login")
                              : setCheckoutClass(cls)
                          }
                          disabled={seatsLeft === 0 || isClosedByAdmin}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                        >
                          {isClosedByAdmin
                            ? `Class ${effectiveStatus}`
                            : seatsLeft === 0
                            ? "Class Full"
                            : "Enroll & Pay"}
                        </button>
                      ))}

                    {isTeacher && (
                      <span
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                          isMyClass
                            ? "bg-slate-100 text-slate-800 border-slate-300"
                            : "bg-slate-50 text-slate-500 border-slate-200"
                        }`}
                      >
                        {isMyClass
                          ? `Your Class • ${effectiveStatus} (${enrolledCount} Enrolled)`
                          : `Status: ${effectiveStatus}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Teacher-Only Create Class Modal */}
      {isTeacher && showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Create &amp; Publish a Class
                </h3>
                <p className="text-xs text-slate-500">
                  Create a Topic, Unit, Group, Paper, or Series class
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <AcademicSelector
              onSelect={(sel) =>
                setNewClass((prev) => ({
                  ...prev,
                  grade: sel.grade,
                  stream: sel.stream,
                  subject: sel.subject,
                  unitTitle: sel.unitTitle,
                  topicName: sel.topicName,
                  title: `${sel.topicName} - ${prev.classType}`,
                }))
              }
            />

            <form onSubmit={handleCreateClass} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Class Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newClass.title}
                    onChange={(e) =>
                      setNewClass({ ...newClass, title: e.target.value })
                    }
                    placeholder="e.g. Integration Definite Integrals Masterclass"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Class Category
                  </label>
                  <select
                    value={newClass.classType}
                    onChange={(e) =>
                      setNewClass({ ...newClass, classType: e.target.value })
                    }
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    {CLASS_TYPES.filter((t) => t !== "All").map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={newClass.subject}
                    onChange={(e) =>
                      setNewClass({ ...newClass, subject: e.target.value })
                    }
                    className="w-full text-sm border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Topic Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newClass.topicName}
                    onChange={(e) =>
                      setNewClass({ ...newClass, topicName: e.target.value })
                    }
                    className="w-full text-sm border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Medium
                  </label>
                  <select
                    value={newClass.medium}
                    onChange={(e) =>
                      setNewClass({ ...newClass, medium: e.target.value })
                    }
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="English">English</option>
                    <option value="Sinhala">Sinhala</option>
                    <option value="Tamil">Tamil</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Date
                  </label>
                  <input
                    type="text"
                    required
                    value={newClass.date}
                    onChange={(e) =>
                      setNewClass({ ...newClass, date: e.target.value })
                    }
                    placeholder="2026-11-10"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Time
                  </label>
                  <input
                    type="text"
                    required
                    value={newClass.time}
                    onChange={(e) =>
                      setNewClass({ ...newClass, time: e.target.value })
                    }
                    placeholder="6:00 PM - 8:00 PM"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Fee (LKR)
                  </label>
                  <input
                    type="number"
                    required
                    value={newClass.fee}
                    onChange={(e) =>
                      setNewClass({ ...newClass, fee: e.target.value })
                    }
                    className="w-full text-sm border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Max Students
                  </label>
                  <input
                    type="number"
                    required
                    value={newClass.maxStudents}
                    onChange={(e) =>
                      setNewClass({ ...newClass, maxStudents: e.target.value })
                    }
                    className="w-full text-sm border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newClass.description}
                  onChange={(e) =>
                    setNewClass({ ...newClass, description: e.target.value })
                  }
                  placeholder="What students will learn in this session..."
                  className="w-full text-sm border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm"
                >
                  {creating ? "Publishing..." : "Publish Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student-Only Checkout Modal */}
      {isStudent && checkoutClass && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-slate-800" />
                <h3 className="text-base font-bold text-slate-900">
                  LearnyMo Secure Class Checkout
                </h3>
              </div>
              <button
                onClick={() => setCheckoutClass(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <p className="font-bold text-sm text-slate-900">
                {checkoutClass.title}
              </p>
              <p className="text-slate-600">
                {checkoutClass.grade} • {checkoutClass.subject} (
                {checkoutClass.medium})
              </p>
              <p className="text-slate-600">
                Schedule: {checkoutClass.date} at {checkoutClass.time}
              </p>
              <div className="border-t border-slate-200 pt-2 mt-2 space-y-1">
                <div className="flex justify-between font-bold text-sm text-slate-900">
                  <span>Total Class Fee:</span>
                  <span>LKR {checkoutClass.fee}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Teacher Earnings (80% Split):</span>
                  <span>LKR {Math.round(checkoutClass.fee * 0.8)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>LearnyMo Platform Commission (20%):</span>
                  <span>
                    LKR{" "}
                    {checkoutClass.fee - Math.round(checkoutClass.fee * 0.8)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleConfirmEnroll}
              disabled={enrolling}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-sm transition-all"
            >
              {enrolling
                ? "Processing Payment..."
                : `Pay LKR ${checkoutClass.fee} & Unlock Classroom`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindClasses;
