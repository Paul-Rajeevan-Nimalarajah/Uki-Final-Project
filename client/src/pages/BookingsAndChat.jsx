import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import AcademicSelector from "../components/AcademicSelector";
import {
  Calendar,
  Clock,
  MessageSquare,
  Video,
  CheckCircle2,
  CreditCard,
  Send,
  Star,
} from "lucide-react";

const TIME_RANGES = [
  "Morning: 8 AM – 12 PM",
  "Afternoon: 1 PM – 4 PM",
  "Evening: 5 PM – 8 PM",
  "Night: 8 PM – 10 PM",
];

const BookingsAndChat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") === "request" ? "request" : "bookings"
  );
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChatBooking, setActiveChatBooking] = useState(null);
  const [chatText, setChatText] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  const [message, setMessage] = useState(
    searchParams.get("enrolled")
      ? "Enrollment & payment confirmed! Your Booking Chat and Classroom Card are ready below."
      : ""
  );
  const [error, setError] = useState("");

  // 1-to-1 Request Form State
  const [reqForm, setReqForm] = useState({
    learningRequirement: "Specific Topic",
    grade: searchParams.get("grade") || "A/L",
    stream: searchParams.get("stream") || "Physical Science",
    subject: searchParams.get("subject") || "Combined Mathematics",
    unitTitle: searchParams.get("unit") || "Pure Mathematics",
    topicName: searchParams.get("topic") || "Integration",
    medium: "English",
    preferredDate: "2026-11-06",
    preferredTimeRange: "Evening: 5 PM – 8 PM",
    duration: "2 Hours",
    paymentPreference: "Per Class",
    budget: 1500,
  });
  const [submittingReq, setSubmittingReq] = useState(false);

  // Teacher Accept Fee State
  const [customFee, setCustomFee] = useState({});

  const loadBookings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await API.get("/marketplace/bookings");
      setBookings(res.data);
      if (res.data.length > 0 && !activeChatBooking) {
        const firstConfirmed =
          res.data.find((b) => b.status === "Confirmed") || res.data[0];
        setActiveChatBooking(firstConfirmed);
      } else if (activeChatBooking) {
        const updated = res.data.find((b) => b._id === activeChatBooking._id);
        if (updated) setActiveChatBooking(updated);
      }
    } catch (err) {
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [user]);

  const handleCreate1to1Request = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    setSubmittingReq(true);
    setError("");
    try {
      const res = await API.post("/marketplace/bookings/request", reqForm);
      setMessage(
        "1-to-1 Class Request submitted! Matched teacher notified for acceptance."
      );
      setActiveTab("bookings");
      setBookings((prev) => [res.data, ...prev]);
      setActiveChatBooking(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit request");
    } finally {
      setSubmittingReq(false);
    }
  };

  const handleTeacherAccept = async (booking) => {
    try {
      const feeToSet =
        customFee[booking._id] !== undefined
          ? customFee[booking._id]
          : booking.fee || 1500;
      const res = await API.put(`/marketplace/bookings/${booking._id}/accept`, {
        fee: feeToSet,
      });
      setMessage(
        `Accepted 1-to-1 request for ${booking.topicName} at LKR ${feeToSet}. Waiting for student payment.`
      );
      loadBookings();
      setActiveChatBooking(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to accept booking");
    }
  };

  const handleStudentPay = async (booking) => {
    try {
      const res = await API.put(`/marketplace/bookings/${booking._id}/pay`);
      setMessage(
        `Payment of LKR ${res.data.fee} confirmed (80% Teacher / 20% LearnyMo split)! Chat & Online Classroom unlocked.`
      );
      loadBookings();
      setActiveChatBooking(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Payment failed");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatText.trim() || !activeChatBooking) return;
    setSendingMsg(true);
    try {
      const res = await API.post(
        `/marketplace/bookings/${activeChatBooking._id}/chat`,
        { text: chatText }
      );
      setChatText("");
      setActiveChatBooking(res.data);
      setBookings((prev) =>
        prev.map((b) => (b._id === res.data._id ? res.data : b))
      );
    } catch (err) {
      setError("Failed to send message");
    } finally {
      setSendingMsg(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-slate-900">
          Sign in to Book Classes &amp; Chat with Teachers
        </h2>
        <p className="text-sm text-slate-500">
          Create a student or teacher account to request 1-to-1 sessions, manage
          your confirmed timetable, and join the online classroom.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="px-5 py-2.5 bg-brand-blue text-white text-sm font-semibold rounded-xl"
        >
          Go to Login
        </button>
      </div>
    );
  }

  const confirmedTimetable = bookings.filter((b) => b.status === "Confirmed");

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Tabs */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            1-to-1 Booking, Timetable &amp; Classroom Chat
          </h1>
          <p className="text-sm text-slate-500">
            Student Need → Teacher Match → Payment (80/20 Split) → Confirmed
            Timetable → Chat &amp; Class Card → Online Class
          </p>
        </div>

        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "bookings"
                ? "bg-white text-brand-blue shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Bookings &amp; Chat ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab("timetable")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "timetable"
                ? "bg-white text-brand-teal shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Confirmed Timetable ({confirmedTimetable.length})
          </button>
          <button
            onClick={() => setActiveTab("request")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "request"
                ? "bg-brand-blue text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            + Request 1-to-1 Class
          </button>
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

      {/* TAB 1: REQUEST A 1-TO-1 CLASS */}
      {activeTab === "request" && (
        <div className="max-w-3xl mx-auto space-y-6">
          <AcademicSelector
            onSelect={(sel) =>
              setReqForm((prev) => ({
                ...prev,
                grade: sel.grade,
                stream: sel.stream,
                subject: sel.subject,
                unitTitle: sel.unitTitle,
                topicName: sel.topicName,
              }))
            }
          />

          <form
            onSubmit={handleCreate1to1Request}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4"
          >
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Configure Your Exact 1-to-1 Learning Requirement
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Learning Scope
                </label>
                <select
                  value={reqForm.learningRequirement}
                  onChange={(e) =>
                    setReqForm({
                      ...reqForm,
                      learningRequirement: e.target.value,
                    })
                  }
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white"
                >
                  <option value="Specific Topic">Specific Topic</option>
                  <option value="Unit">Complete Unit</option>
                  <option value="Full Subject">Full Subject / Syllabus</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={reqForm.subject}
                  onChange={(e) =>
                    setReqForm({ ...reqForm, subject: e.target.value })
                  }
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Topic / Unit Name
                </label>
                <input
                  type="text"
                  required
                  value={reqForm.topicName}
                  onChange={(e) =>
                    setReqForm({ ...reqForm, topicName: e.target.value })
                  }
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Medium
                </label>
                <select
                  value={reqForm.medium}
                  onChange={(e) =>
                    setReqForm({ ...reqForm, medium: e.target.value })
                  }
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white"
                >
                  <option value="English">English Medium</option>
                  <option value="Sinhala">Sinhala Medium</option>
                  <option value="Tamil">Tamil Medium</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Preferred Date
                </label>
                <input
                  type="date"
                  required
                  value={reqForm.preferredDate}
                  onChange={(e) =>
                    setReqForm({ ...reqForm, preferredDate: e.target.value })
                  }
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Preferred Time Range
                </label>
                <select
                  value={reqForm.preferredTimeRange}
                  onChange={(e) =>
                    setReqForm({
                      ...reqForm,
                      preferredTimeRange: e.target.value,
                    })
                  }
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white"
                >
                  {TIME_RANGES.map((tr) => (
                    <option key={tr} value={tr}>
                      {tr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Duration
                </label>
                <select
                  value={reqForm.duration}
                  onChange={(e) =>
                    setReqForm({ ...reqForm, duration: e.target.value })
                  }
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white"
                >
                  <option value="1 Hour">1 Hour</option>
                  <option value="2 Hours">2 Hours</option>
                  <option value="3 Hours">3 Hours (Custom)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Payment Preference
                </label>
                <select
                  value={reqForm.paymentPreference}
                  onChange={(e) =>
                    setReqForm({
                      ...reqForm,
                      paymentPreference: e.target.value,
                    })
                  }
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white"
                >
                  <option value="Per Hour">Per Hour</option>
                  <option value="Per Class">Per Class</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Budget / Proposed Fee (LKR)
                </label>
                <input
                  type="number"
                  value={reqForm.budget}
                  onChange={(e) =>
                    setReqForm({ ...reqForm, budget: e.target.value })
                  }
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingReq}
              className="w-full py-3 bg-brand-blue hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all"
            >
              {submittingReq
                ? "Matching with Verified Teachers..."
                : "Submit 1-to-1 Booking Request"}
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: CONFIRMED TIMETABLE */}
      {activeTab === "timetable" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Confirmed Class Timetable
              </h3>
              <p className="text-xs text-slate-500">
                Only confirmed &amp; paid classes appear in your official timetable.
              </p>
            </div>
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
              {confirmedTimetable.length} Confirmed Sessions
            </span>
          </div>

          {confirmedTimetable.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No confirmed classes in your timetable yet. Complete payment on an
              accepted request or enroll in a Group Class!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
                    <th className="py-3 px-4">Date &amp; Time</th>
                    <th className="py-3 px-4">Subject &amp; Topic</th>
                    <th className="py-3 px-4">Type &amp; Duration</th>
                    <th className="py-3 px-4">Teacher / Student</th>
                    <th className="py-3 px-4 text-right">Online Classroom</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {confirmedTimetable.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {item.preferredDate}
                        <span className="block text-xs text-slate-500 font-normal">
                          {item.preferredTimeRange}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-brand-blue">
                          {item.subject}
                        </span>
                        <span className="block text-xs text-slate-600">
                          {item.topicName} ({item.medium})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {item.bookingType} • {item.duration}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                        {user.role === "student"
                          ? item.teacher?.name || "Verified Teacher"
                          : item.student?.name || "Student"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => navigate(`/classroom/${item._id}`)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-teal hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-sm"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Class</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BOOKINGS LIST + IN-BOOKING CHAT & DEDICATED CLASS CARD */}
      {activeTab === "bookings" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            {loading ? (
              <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-500">
                Loading bookings...
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 space-y-3">
                <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="font-bold text-slate-800">
                  No Bookings or Requests Yet
                </h3>
                <p className="text-xs text-slate-500">
                  Request a 1-to-1 session or enroll in a Group/Topic class to
                  start learning.
                </p>
                <button
                  onClick={() => setActiveTab("request")}
                  className="px-4 py-2 bg-brand-blue text-white text-xs font-semibold rounded-xl"
                >
                  Request 1-to-1 Class
                </button>
              </div>
            ) : (
              bookings.map((b) => {
                const isSelected = activeChatBooking?._id === b._id;
                return (
                  <div
                    key={b._id}
                    onClick={() => setActiveChatBooking(b)}
                    className={`cursor-pointer bg-white rounded-2xl p-5 border transition-all space-y-3 ${
                      isSelected
                        ? "border-brand-blue ring-2 ring-brand-blue/20 shadow-md"
                        : "border-slate-200 hover:border-slate-300 shadow-sm"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {b.bookingType}
                          </span>
                          <span className="text-xs text-slate-500">
                            {b.grade} • {b.medium} Medium
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-slate-900 mt-1">
                          {b.subject} — {b.topicName}
                        </h3>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          b.status === "Confirmed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : b.status === "Completed"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : b.status === "Teacher Accepted"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-brand-blue" />
                        {b.preferredDate} ({b.preferredTimeRange})
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-brand-teal" />
                        {b.duration}
                      </span>
                      <span className="font-bold text-slate-900">
                        Fee: LKR {b.fee || b.budget || 1500}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex justify-between items-center pt-2 border-t border-slate-100">
                      <span>
                        Student:{" "}
                        <strong>
                          {b.student?.name || "Student"}{" "}
                          {b.student?.studentProfile?.studentId
                            ? `(${b.student.studentProfile.studentId})`
                            : ""}
                        </strong>{" "}
                        • Teacher:{" "}
                        <strong>
                          {b.teacher?.name || "Matching Verified Teacher..."}
                        </strong>
                      </span>
                    </div>

                    <div
                      className="pt-2 flex flex-wrap items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {(user.role === "teacher" || user.role === "admin") &&
                        ["Pending", "Teacher Found"].includes(b.status) && (
                          <div className="flex items-center gap-2 w-full bg-teal-50/70 p-2.5 rounded-xl border border-teal-200">
                            <input
                              type="number"
                              placeholder="Set Fee (LKR)"
                              defaultValue={b.fee || b.budget || 1500}
                              onChange={(e) =>
                                setCustomFee({
                                  ...customFee,
                                  [b._id]: e.target.value,
                                })
                              }
                              className="w-28 text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white"
                            />
                            <button
                              onClick={() => handleTeacherAccept(b)}
                              className="px-3.5 py-1.5 bg-brand-teal hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                            >
                              Accept Request &amp; Send Fee
                            </button>
                          </div>
                        )}

                      {(user.role === "student" || user.role === "admin") &&
                        ["Teacher Accepted", "Teacher Found", "Pending"].includes(
                          b.status
                        ) && (
                          <button
                            onClick={() => handleStudentPay(b)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-brand-blue hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>
                              Pay LKR {b.fee || 1500} &amp; Confirm Booking (80/20
                              Split)
                            </span>
                          </button>
                        )}

                      {b.status === "Confirmed" && (
                        <button
                          onClick={() => navigate(`/classroom/${b._id}`)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Live Online Classroom</span>
                        </button>
                      )}

                      {b.rating?.stars && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          Rated {b.rating.stars}/5 ★
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Booking Chat & Dedicated Class Card */}
          <div className="lg:col-span-5">
            {activeChatBooking ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[600px] sticky top-20 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      {activeChatBooking.subject} —{" "}
                      {activeChatBooking.topicName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {activeChatBooking.status === "Confirmed" ||
                      activeChatBooking.status === "Completed"
                        ? "Booking Confirmed • Chat & Class Card Active"
                        : "Chat unlocks automatically once Booking is Confirmed"}
                    </p>
                  </div>
                  <MessageSquare className="w-5 h-5 text-brand-blue" />
                </div>

                {(activeChatBooking.status === "Confirmed" ||
                  activeChatBooking.status === "Completed") && (
                  <div className="p-3 bg-gradient-to-r from-brand-blue/10 to-brand-teal/10 border-b border-brand-teal/20">
                    <div className="bg-white rounded-xl p-3.5 border border-brand-teal/30 shadow-sm space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-teal bg-brand-teal/10 px-2 py-0.5 rounded">
                            Official LearnyMo Class Card
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 mt-1">
                            📚 {activeChatBooking.grade}{" "}
                            {activeChatBooking.subject} —{" "}
                            {activeChatBooking.topicName}
                          </h4>
                        </div>
                      </div>
                      <div className="text-xs text-slate-600 space-y-0.5">
                        <p>
                          📅 {activeChatBooking.preferredDate} • 🕖{" "}
                          {activeChatBooking.preferredTimeRange}
                        </p>
                        <p>
                          👨‍🏫 Teacher:{" "}
                          <strong>
                            {activeChatBooking.teacher?.name ||
                              "Verified Teacher"}
                          </strong>
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          navigate(`/classroom/${activeChatBooking._id}`)
                        }
                        className="w-full py-2 bg-brand-teal hover:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Video className="w-4 h-4" />
                        <span>
                          {activeChatBooking.status === "Completed"
                            ? "VIEW COMPLETED CLASSROOM & RATING"
                            : "[ JOIN CLASS ]"}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
                  {activeChatBooking.status !== "Confirmed" &&
                  activeChatBooking.status !== "Completed" ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                      <MessageSquare className="w-8 h-8 text-slate-300" />
                      <p className="text-xs font-medium text-slate-600">
                        Anti-Bypass Protection Active (Section 24 &amp; 61)
                      </p>
                      <p className="text-xs text-slate-400">
                        Complete booking confirmation &amp; payment on the left to
                        unlock direct Student–Teacher chat and the Online
                        Classroom link.
                      </p>
                    </div>
                  ) : activeChatBooking.messages?.length === 0 ? (
                    <p className="text-xs text-center text-slate-400 py-8">
                      No messages yet. Say hello to start preparing for class!
                    </p>
                  ) : (
                    activeChatBooking.messages.map((msg, idx) => {
                      const isMe = msg.senderRole === user.role;
                      return (
                        <div
                          key={idx}
                          className={`flex flex-col ${
                            isMe ? "items-end" : "items-start"
                          }`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs ${
                              isMe
                                ? "bg-brand-blue text-white rounded-br-none"
                                : "bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm"
                            }`}
                          >
                            <p className="font-bold text-[10px] opacity-75 mb-0.5">
                              {msg.senderName} ({msg.senderRole})
                            </p>
                            <p>{msg.text}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form
                  onSubmit={handleSendMessage}
                  className="p-3 bg-white border-t border-slate-200 flex gap-2"
                >
                  <input
                    type="text"
                    disabled={
                      activeChatBooking.status !== "Confirmed" &&
                      activeChatBooking.status !== "Completed"
                    }
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    placeholder={
                      activeChatBooking.status === "Confirmed"
                        ? "Type a message to your teacher/student..."
                        : "Confirm booking to enable chat..."
                    }
                    className="flex-1 text-xs border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:bg-slate-100"
                  />
                  <button
                    type="submit"
                    disabled={
                      sendingMsg ||
                      (activeChatBooking.status !== "Confirmed" &&
                        activeChatBooking.status !== "Completed")
                    }
                    className="px-3.5 py-2 bg-brand-blue hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                Select any booking on the left to view its Chat &amp; Classroom
                Card.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsAndChat;

