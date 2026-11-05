import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  CheckCircle2,
  Star,
  ShieldCheck,
  ExternalLink,
  BookOpen,
} from "lucide-react";

const OnlineClassroom = () => {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [notes, setNotes] = useState(
    "• Key Formula 1: ∫ x^n dx = x^(n+1)/(n+1) + C\n• Exam Tip: Always verify limits on definite integrals."
  );

  // Rating & Completion Modal State
  const [showRateModal, setShowRateModal] = useState(false);
  const [stars, setStars] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await API.get("/marketplace/bookings");
        const found = res.data.find((b) => b._id === bookingId);
        setBooking(found || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  const handleCompleteAndRate = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setSubmitting(true);
    try {
      const payload =
        user?.role === "student" ? { stars, feedback } : {};
      const res = await API.put(
        `/marketplace/bookings/${bookingId}/complete`,
        payload
      );
      setBooking(res.data);
      setShowRateModal(false);
      navigate("/bookings");
    } catch (err) {
      alert("Failed to complete class");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        Connecting to LearnyMo Protected Online Classroom...
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 space-y-3">
        <h2 className="text-lg font-bold text-slate-900">
          Protected Classroom Access Denied
        </h2>
        <p className="text-xs text-slate-500">
          Only students and teachers associated with this confirmed booking can
          enter the online classroom (Section 26 &amp; 62).
        </p>
        <button
          onClick={() => navigate("/bookings")}
          className="px-4 py-2 bg-brand-blue text-white text-xs font-semibold rounded-xl"
        >
          Back to Bookings
        </button>
      </div>
    );
  }

  const roomName =
    booking.meetingRoomId || `LearnyMo-Room-${booking._id.slice(-6)}`;
  const jitsiUrl = `https://meet.jit.si/${roomName}#userInfo.displayName="${encodeURIComponent(
    user?.name || "LearnyMo User"
  )}"`;

  return (
    <div className="space-y-4">
      {/* Top Classroom Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-teal/20 text-brand-teal flex items-center justify-center">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                ● Live Protected Classroom
              </span>
              <span className="text-xs text-slate-400">Room: {roomName}</span>
            </div>
            <h1 className="text-base font-bold mt-0.5">
              {booking.grade} {booking.subject} — {booking.topicName} (
              {booking.medium} Medium)
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={jitsiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Pop Out Video</span>
          </a>
          {user?.role === "student" ? (
            <button
              onClick={() => setShowRateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Class &amp; Rate Teacher</span>
            </button>
          ) : (
            <button
              onClick={handleCompleteAndRate}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Class Completed</span>
            </button>
          )}
          <button
            onClick={() => navigate("/bookings")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>Leave</span>
          </button>
        </div>
      </div>

      {/* Main Classroom Grid: Live Video + Shared Lesson Scratchpad */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-lg flex flex-col h-[520px]">
          <iframe
            title="LearnyMo Live Video Classroom"
            src={jitsiUrl}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="w-full flex-1 border-0"
          />

          <div className="bg-slate-900 p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div>
              Teacher:{" "}
              <strong className="text-white">
                {booking.teacher?.name || "Verified Teacher"}
              </strong>{" "}
              • Student:{" "}
              <strong className="text-white">
                {booking.student?.name || "Student"}
              </strong>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMicOn(!micOn)}
                className={`p-2 rounded-lg ${
                  micOn ? "bg-slate-800 text-white" : "bg-rose-600 text-white"
                }`}
              >
                {micOn ? (
                  <Mic className="w-4 h-4" />
                ) : (
                  <MicOff className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setCamOn(!camOn)}
                className={`p-2 rounded-lg ${
                  camOn ? "bg-slate-800 text-white" : "bg-rose-600 text-white"
                }`}
              >
                {camOn ? (
                  <Video className="w-4 h-4" />
                ) : (
                  <VideoOff className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Live Class Notes & Payment Split Info */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <BookOpen className="w-4 h-4 text-brand-blue" />
              <h3 className="font-bold text-sm text-slate-900">
                Shared Class Notes &amp; Key Points
              </h3>
            </div>
            <textarea
              rows={10}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs font-mono border border-slate-200 rounded-xl p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-700 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Escrow &amp; Revenue Split Verified</span>
            </div>
            <p className="text-slate-600">
              Total Fee Paid: <strong>LKR {booking.fee}</strong>
            </p>
            <p className="text-slate-600">
              Teacher Share (80%):{" "}
              <strong className="text-emerald-700">
                LKR {booking.teacherEarning || Math.round(booking.fee * 0.8)}
              </strong>
            </p>
            <p className="text-slate-500">
              LearnyMo Commission (20%):{" "}
              <strong>
                LKR{" "}
                {booking.platformCommission ||
                  booking.fee - Math.round(booking.fee * 0.8)}
              </strong>
            </p>
          </div>
        </div>
      </div>

      {/* Complete Class & 1-5 Star Teacher Rating Modal */}
      {showRateModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCompleteAndRate}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
          >
            <h3 className="text-lg font-bold text-slate-900">
              Complete Class &amp; Rate Teacher
            </h3>
            <p className="text-xs text-slate-500">
              How was your session on{" "}
              <strong>
                {booking.subject} — {booking.topicName}
              </strong>
              ?
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
                Select Rating (1–5 Stars)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setStars(num)}
                    className={`flex-1 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-1 border transition-all ${
                      stars >= num
                        ? "bg-amber-50 border-amber-300 text-amber-600"
                        : "bg-slate-50 border-slate-200 text-slate-400"
                    }`}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        stars >= num ? "fill-amber-400 text-amber-400" : ""
                      }`}
                    />
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Written Feedback (Optional)
              </label>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Clear explanation of past paper questions..."
                className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm"
              >
                {submitting ? "Saving..." : "Submit Rating & Complete Class"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default OnlineClassroom;

