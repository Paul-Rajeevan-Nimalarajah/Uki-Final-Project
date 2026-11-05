import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Layers, Flame, CheckCircle2 } from "lucide-react";

const SyllabusAndDemand = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isTeacher = user?.role === "teacher";
  const isStudent = user?.role === "student";
  const isGuest = !user;

  const [hierarchy, setHierarchy] = useState([]);
  const [demands, setDemands] = useState([]);
  const [topicProgress, setTopicProgress] = useState([]);
  const [studyPlans, setStudyPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Student-Only 1-4-7 Study Planner Form
  const [planSubject, setPlanSubject] = useState("Combined Mathematics");
  const [planTopic, setPlanTopic] = useState("Integration");
  const [planSlot, setPlanSlot] = useState("Evening (5 PM - 8 PM)");
  const [planDate, setPlanDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [acadRes, demandRes] = await Promise.all([
        API.get("/academic"),
        API.get("/marketplace/demand"),
      ]);
      setHierarchy(acadRes.data);
      setDemands(demandRes.data);

      if (user && user.role === "student") {
        const dashRes = await API.get("/marketplace/dashboard");
        setTopicProgress(dashRes.data.topicProgress || []);
        setStudyPlans(dashRes.data.studyPlans || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const getTopicStatus = (subject, topicName) => {
    const found = topicProgress.find(
      (tp) => tp.subject === subject && tp.topicName === topicName
    );
    return found ? found.status : "not_started";
  };

  const handleStatusChange = async (item, unit, topicName, status) => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      const res = await API.post("/marketplace/syllabus/progress", {
        grade: item.grade,
        stream: item.stream,
        subject: item.subject,
        unitTitle: unit.title,
        topicName,
        status,
        medium: "English",
        demandType: "Topic Demand",
      });
      setTopicProgress(res.data.topicProgress);
      if (status === "not_clear") {
        setMessage(
          `Marked "${topicName}" as Not Clear! Recorded in Student Demand & activated Class Recommendations.`
        );
      } else {
        setMessage(res.data.message);
      }
      const demandRes = await API.get("/marketplace/demand");
      setDemands(demandRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateStudyPlan = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      const res = await API.post("/marketplace/syllabus/study-plan", {
        subject: planSubject,
        topicName: planTopic,
        preferredSlot: planSlot,
        startDate: planDate,
      });
      setStudyPlans(res.data);
      setMessage(
        `Generated 1–4–7 Study Rule schedule for "${planTopic}" (Day 1 Learn, Day 4 Review, Day 7 Recall/Test)!`
      );
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        Loading {isTeacher ? "Student Topic Demand Board" : "Syllabus & Study Planner"}...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Role-Specific Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full mb-2">
            <Layers className="w-3.5 h-3.5" />
            {isTeacher ? "Teacher Market Insights" : "Student Learning Loop"}
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {isTeacher
              ? "Live Student Topic Demand Board"
              : "My Syllabus Tracker & 1–4–7 Study Planner"}
          </h1>
          <p className="text-sm text-slate-500">
            {isTeacher
              ? "See which syllabus topics students have marked 'Not Clear' and publish a targeted class in 1 click."
              : "Mark topics as Not Clear to alert teachers, track your syllabus mastery, and plan revision with the 1–4–7 rule."}
          </p>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* SECTION 1: LIVE STUDENT DEMAND BOARD (Role-Specific Buttons) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isTeacher
                  ? "Topics Requested by Students ('Not Clear')"
                  : "Live Student Topic Demand & Matching Classes"}
              </h2>
              <p className="text-xs text-slate-500">
                {isTeacher
                  ? "Click '+ Create Class' on any high-demand topic below to publish a session for waiting students."
                  : "Topics marked 'Not Clear' by students and the classes created by teachers to resolve them."}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold bg-amber-50 text-amber-800 px-3 py-1 rounded-full border border-amber-200">
            {demands.length} Active Topic Demands
          </span>
        </div>

        {demands.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            No active topic demands yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demands.map((d) => {
              const count = d.interestedStudents?.length || 1;
              return (
                <div
                  key={d._id}
                  className="rounded-xl p-4 border border-slate-200 bg-slate-50/60 flex flex-col justify-between gap-3 shadow-sm"
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                        🔥 {count} {count === 1 ? "Student" : "Students"}{" "}
                        Interested
                      </span>
                      <span className="text-xs text-slate-500">
                        {d.medium} Medium
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700">
                      {d.grade} • {d.subject}
                    </p>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {d.unitTitle ? `${d.unitTitle} → ` : ""}
                      {d.topicName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Preferred: {d.preferredTime}
                    </p>
                  </div>

                  {d.resolvedByClass ? (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1.5">
                      <p className="text-[11px] font-bold text-emerald-800">
                        🎯 Matching Class Available!
                      </p>
                      <p className="text-xs text-emerald-700 line-clamp-1">
                        {d.resolvedByClass.title} (LKR {d.resolvedByClass.fee})
                      </p>
                      {(isStudent || isGuest) && (
                        <button
                          onClick={() =>
                            navigate(
                              `/classes?topic=${encodeURIComponent(d.topicName)}`
                            )
                          }
                          className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg"
                        >
                          View Class &amp; Enroll
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2 pt-1">
                      {isTeacher && (
                        <button
                          onClick={() =>
                            navigate(
                              `/classes?create=true&grade=${encodeURIComponent(
                                d.grade
                              )}&subject=${encodeURIComponent(
                                d.subject
                              )}&unit=${encodeURIComponent(
                                d.unitTitle
                              )}&topic=${encodeURIComponent(
                                d.topicName
                              )}&demandId=${d._id}`
                            )
                          }
                          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm"
                        >
                          + Create Class for This Topic
                        </button>
                      )}

                      {(isStudent || isGuest) && (
                        <button
                          onClick={() =>
                            isGuest
                              ? navigate("/login")
                              : navigate(
                                  `/bookings?tab=request&subject=${encodeURIComponent(
                                    d.subject
                                  )}&topic=${encodeURIComponent(d.topicName)}`
                                )
                          }
                          className="w-full py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg"
                        >
                          Request 1-to-1 Class
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* STUDENT-ONLY SECTION 2: INTERACTIVE SYLLABUS PROGRESS */}
      {(isStudent || isGuest) && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">
              My Syllabus &amp; Topic Progress
            </h2>
            <p className="text-xs text-slate-500">
              Click <strong>🟡 Not Clear</strong> on any topic to record your
              learning need and receive automatic class recommendations.
            </p>
          </div>

          <div className="space-y-6">
            {hierarchy.map((item) => (
              <div
                key={item._id}
                className="border border-slate-200 rounded-2xl overflow-hidden"
              >
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold uppercase text-slate-600">
                      {item.grade} • {item.stream}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      {item.subject}
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500">
                    {item.units?.length || 0} Units
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  {item.units?.map((unit, uIdx) => (
                    <div key={uIdx} className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Unit {unit.unitNumber}: {unit.title}
                      </h4>
                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl">
                        {unit.topics?.map((topic, tIdx) => {
                          const status = getTopicStatus(
                            item.subject,
                            topic.name
                          );
                          return (
                            <div
                              key={tIdx}
                              className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60"
                            >
                              <div>
                                <p className="text-sm font-semibold text-slate-800">
                                  {topic.name}
                                </p>
                                {topic.desciption && (
                                  <p className="text-xs text-slate-500">
                                    {topic.desciption}
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() =>
                                    handleStatusChange(
                                      item,
                                      unit,
                                      topic.name,
                                      "not_started"
                                    )
                                  }
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                    status === "not_started"
                                      ? "bg-slate-800 text-white border-slate-800"
                                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  ⬜ Not Started
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusChange(
                                      item,
                                      unit,
                                      topic.name,
                                      "not_clear"
                                    )
                                  }
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                    status === "not_clear"
                                      ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                                      : "bg-amber-50/60 text-amber-800 border-amber-200 hover:bg-amber-100"
                                  }`}
                                >
                                  🟡 Not Clear
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusChange(
                                      item,
                                      unit,
                                      topic.name,
                                      "clear"
                                    )
                                  }
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                    status === "clear"
                                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                      : "bg-emerald-50/60 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                  }`}
                                >
                                  🟢 Clear
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STUDENT-ONLY SECTION 3: 1-4-7 STUDY PLANNER RULE */}
      {(isStudent || isGuest) && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
              Scientific Memory Retention
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              LearnyMo 1–4–7 Study Rule Planner
            </h2>
            <p className="text-xs text-slate-500">
              Automatically schedule <strong>Day 1 (Learn)</strong> →{" "}
              <strong>Day 4 (Review)</strong> →{" "}
              <strong>Day 7 (Recall / Test)</strong> for any topic.
            </p>
          </div>

          <form
            onSubmit={handleCreateStudyPlan}
            className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200"
          >
            <input
              type="text"
              required
              value={planSubject}
              onChange={(e) => setPlanSubject(e.target.value)}
              placeholder="Subject (e.g. Physics)"
              className="text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
            />
            <input
              type="text"
              required
              value={planTopic}
              onChange={(e) => setPlanTopic(e.target.value)}
              placeholder="Topic (e.g. Doppler Effect)"
              className="text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
            />
            <select
              value={planSlot}
              onChange={(e) => setPlanSlot(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
            >
              <option value="Morning (6 AM - 8 AM)">Morning (6 AM - 8 AM)</option>
              <option value="Afternoon (2 PM - 4 PM)">
                Afternoon (2 PM - 4 PM)
              </option>
              <option value="Evening (5 PM - 8 PM)">Evening (5 PM - 8 PM)</option>
              <option value="Night (8 PM - 10 PM)">Night (8 PM - 10 PM)</option>
            </select>
            <input
              type="date"
              value={planDate}
              onChange={(e) => setPlanDate(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
            />
            <button
              type="submit"
              className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              Generate 1–4–7 Plan
            </button>
          </form>

          {studyPlans.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studyPlans.map((plan, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-slate-600">
                        {plan.subject}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900">
                        {plan.topicName}
                      </h4>
                    </div>
                    <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                      {plan.preferredSlot}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-bold text-slate-800 block">
                        Day 1 • Learn
                      </span>
                      <span className="text-[11px] text-slate-600">
                        {plan.day1Learn}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-bold text-slate-800 block">
                        Day 4 • Review
                      </span>
                      <span className="text-[11px] text-slate-600">
                        {plan.day4Review}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-bold text-slate-800 block">
                        Day 7 • Recall/Test
                      </span>
                      <span className="text-[11px] text-slate-600">
                        {plan.day7Recall}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SyllabusAndDemand;
