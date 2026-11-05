import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AdminAcademic from "./pages/AdminAcademic";
import TeacherProfileSettings from "./pages/TeacherProfileSettings";
import AdminTeacherVerification from "./pages/AdminTeacherVerification";
import FindClasses from "./pages/FindClasses";
import BookingsAndChat from "./pages/BookingsAndChat";
import OnlineClassroom from "./pages/OnlineClassroom";
import SyllabusAndDemand from "./pages/SyllabusAndDemand";
import RoleDashboard from "./pages/RoleDashboard";
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  Briefcase,
} from "lucide-react";

const HomeLanding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="space-y-10">
      {/* 1. CLEAN WHITE HERO SECTION */}
      <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center space-y-5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 px-3.5 py-1.5 rounded-full border border-slate-200">
          <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
          Sri Lanka&apos;s Topic-First Online Learning Platform
        </span>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight max-w-3xl mx-auto">
          Your Topic • Your Time • Your Teacher
        </h1>

        <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          Learn exactly what you need — a specific <strong>Topic</strong>, a
          complete <strong>Unit</strong>, a <strong>Past Paper</strong>, or a{" "}
          <strong>Full Subject</strong> — with verified Sri Lankan teachers at a
          time that works for you.
        </p>

        {/* Main Hero Buttons */}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            onClick={() => navigate("/bookings?tab=request")}
            className="px-5 py-2.5 bg-brand-blue hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2"
          >
            <span>Book a Class (1-to-1)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate("/classes")}
            className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-sm font-semibold rounded-xl transition-all"
          >
            Find a Class
          </button>
          <button
            onClick={() => navigate("/register")}
            className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-sm font-semibold rounded-xl transition-all"
          >
            Become a Teacher
          </button>
          {!user ? (
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-xl transition-all"
            >
              Login
            </button>
          ) : (
            <button
              onClick={() => navigate("/dashboard")}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-xl transition-all"
            >
              Go to My Dashboard
            </button>
          )}
        </div>

        {/* Platform Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-100 max-w-4xl mx-auto text-left">
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
            <p className="text-sm font-bold text-slate-900">7 Class Types</p>
            <p className="text-xs text-slate-500 mt-0.5">
              1-to-1, Group, Topic, Unit, Paper, Full Subject &amp; Series
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
            <p className="text-sm font-bold text-slate-900">
              &quot;Not Clear&quot; Match
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Mark any syllabus topic &quot;Not Clear&quot; to trigger teacher classes
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
            <p className="text-sm font-bold text-slate-900">1–4–7 Study Rule</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Day 1 Learn • Day 4 Review • Day 7 Recall &amp; Test
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
            <p className="text-sm font-bold text-slate-900">80% / 20% Split</p>
            <p className="text-xs text-slate-500 mt-0.5">
              80% directly to verified teachers • 3 Months Free Student Membership
            </p>
          </div>
        </div>
      </div>

      {/* 2. HOW IT WORKS */}
      <div className="space-y-5">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            How LearnyMo Works
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900">
            From Student Need to Live Online Class in 4 Simple Steps
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-bold text-xs flex items-center justify-center">
              01
            </span>
            <h3 className="font-bold text-slate-900">
              Pick Your Exact Topic or Unit
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Choose a specific syllabus topic you find &quot;Not Clear&quot;, request a
              1-to-1 class, or browse scheduled Group, Unit, and Paper classes.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-bold text-xs flex items-center justify-center">
              02
            </span>
            <h3 className="font-bold text-slate-900">
              Match with a Verified Teacher
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Admin-verified teachers accept your 1-to-1 request or create new
              classes based on live Student Topic Demand.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-bold text-xs flex items-center justify-center">
              03
            </span>
            <h3 className="font-bold text-slate-900">
              Confirm Booking &amp; Unlock Chat
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Once paid, your class appears on your Confirmed Timetable and
              unlocks Booking Chat with a dedicated Class Card.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-bold text-xs flex items-center justify-center">
              04
            </span>
            <h3 className="font-bold text-slate-900">
              Join Online Classroom &amp; Rate
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Click <strong>[ JOIN CLASS ]</strong> to enter the protected video
              classroom, complete your lesson, update your syllabus to Clear, and
              rate your teacher.
            </p>
          </div>
        </div>
      </div>

      {/* 3. FOR STUDENTS & FOR TEACHERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase text-slate-500">
                For Students
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Stop Paying for Full-Year Tuition for One Doubt
              </h3>
            </div>
          </div>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-700 shrink-0" />
              <span>
                Track your O/L &amp; A/L syllabus with{" "}
                <strong>Not Started / Not Clear / Clear</strong> statuses.
              </span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-700 shrink-0" />
              <span>
                Get automatic class recommendations whenever a teacher creates a
                session for your <strong>Not Clear</strong> topics.
              </span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-700 shrink-0" />
              <span>
                Built-in <strong>1–4–7 Study Planner</strong> for scientific exam
                revision.
              </span>
            </li>
          </ul>
          <button
            onClick={() => navigate("/syllabus")}
            className="px-4 py-2 bg-brand-blue hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
          >
            Explore Student Syllabus &amp; Planner →
          </button>
        </div>

        <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase text-slate-500">
                For Teachers
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Teach High-Demand Topics &amp; Earn 80% Revenue
              </h3>
            </div>
          </div>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-700 shrink-0" />
              <span>
                See real-time <strong>Student Demand</strong> (&quot;12 Students
                Interested in Integration&quot;) before creating a class.
              </span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-700 shrink-0" />
              <span>
                Accept 1-to-1 requests, publish Topic/Unit/Paper classes, and
                receive an automatic <strong>80% payout</strong> to your wallet.
              </span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-700 shrink-0" />
              <span>
                Build your verified profile with separate{" "}
                <strong>Star Ratings</strong> and{" "}
                <strong>Repeat Student Rate</strong> metrics.
              </span>
            </li>
          </ul>
          <button
            onClick={() => navigate("/classes")}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl"
          >
            View Class Marketplace →
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<HomeLanding />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/classes" element={<FindClasses />} />
              <Route path="/bookings" element={<BookingsAndChat />} />
              <Route
                path="/classroom/:bookingId"
                element={<OnlineClassroom />}
              />
              <Route path="/syllabus" element={<SyllabusAndDemand />} />
              <Route path="/dashboard" element={<RoleDashboard />} />
              <Route path="/admin/academic" element={<AdminAcademic />} />
              <Route
                path="/teacher/profile"
                element={<TeacherProfileSettings />}
              />
              <Route
                path="/admin/teachers"
                element={<AdminTeacherVerification />}
              />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
