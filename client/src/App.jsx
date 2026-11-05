import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AcademicSelector from "./components/AcademicSelector";
import AdminAcademic from "./pages/AdminAcademic";
import TeacherProfileSettings from "./pages/TeacherProfileSettings";
import AdminTeacherVerification from "./pages/AdminTeacherVerification";
import FindClasses from "./pages/FindClasses";
import BookingsAndChat from "./pages/BookingsAndChat";
import OnlineClassroom from "./pages/OnlineClassroom";
import SyllabusAndDemand from "./pages/SyllabusAndDemand";
import RoleDashboard from "./pages/RoleDashboard";
import { Sparkles, BookOpen, Flame, ShieldCheck } from "lucide-react";

const HomeLanding = () => {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-200 shadow-sm text-center space-y-4">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-blue bg-brand-blue/10 px-3 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5" />
          Sri Lanka&apos;s Topic-First Learning Marketplace
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          Your Topic • Your Time • Your Teacher
        </h1>
        <p className="text-slate-600 max-w-xl mx-auto text-sm sm:text-base">
          Learn a specific Topic, a complete Unit, or a Full Subject with
          verified teachers at a time that works for you.
        </p>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            onClick={() => navigate("/bookings?tab=request")}
            className="px-5 py-2.5 bg-brand-blue hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            Book a 1-to-1 Class
          </button>
          <button
            onClick={() => navigate("/classes")}
            className="px-5 py-2.5 bg-brand-teal hover:bg-teal-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            Find a Class
          </button>
          <button
            onClick={() => navigate("/syllabus")}
            className="px-5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-sm font-semibold rounded-xl transition-all"
          >
            My Syllabus &amp; 1–4–7 Planner
          </button>
          <button
            onClick={() => navigate("/register")}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all"
          >
            Become a Teacher
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        <AcademicSelector onSelect={(selected) => setSelectedTopic(selected)} />

        {selectedTopic && (
          <div className="bg-white rounded-2xl p-5 border-2 border-brand-teal/40 shadow-md flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase text-brand-teal">
                Ready to Learn This Exact Topic?
              </span>
              <h3 className="font-bold text-slate-900 text-base">
                {selectedTopic.grade} • {selectedTopic.subject} →{" "}
                {selectedTopic.topicName}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  navigate(
                    `/bookings?tab=request&grade=${encodeURIComponent(
                      selectedTopic.grade
                    )}&stream=${encodeURIComponent(
                      selectedTopic.stream
                    )}&subject=${encodeURIComponent(
                      selectedTopic.subject
                    )}&unit=${encodeURIComponent(
                      selectedTopic.unitTitle
                    )}&topic=${encodeURIComponent(selectedTopic.topicName)}`
                  )
                }
                className="px-4 py-2 bg-brand-blue hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm"
              >
                Request 1-to-1 Class
              </button>
              <button
                onClick={() =>
                  navigate(
                    `/classes?topic=${encodeURIComponent(
                      selectedTopic.topicName
                    )}`
                  )
                }
                className="px-4 py-2 bg-brand-teal hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-sm"
              >
                Browse Matching Classes
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900">1. Student System</h3>
          <p className="text-xs text-slate-600">
            Mark topics as <strong>Not Clear</strong>, use the{" "}
            <strong>1–4–7 Study Rule</strong>, request 1-to-1 or Group classes,
            chat via Class Cards, and join the live Online Classroom.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-brand-teal/10 text-brand-teal flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900">2. Teacher System</h3>
          <p className="text-xs text-slate-600">
            Get verified, see live <strong>Student Topic Demand</strong>,
            publish Topic/Unit/Paper/Series classes, accept 1-to-1 bookings, and
            earn an automatic <strong>80% revenue share</strong>.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900">3. LearnyMo Protection</h3>
          <p className="text-xs text-slate-600">
            Dynamic academic hierarchy, anti-bypass booking chat, automated
            80/20 escrow split, and separate Star Rating &amp; Repeat Student
            Rate tracking.
          </p>
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
