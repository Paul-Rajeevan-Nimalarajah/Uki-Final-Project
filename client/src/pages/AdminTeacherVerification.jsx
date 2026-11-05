import { useState, useEffect } from "react";
import API from "../api/axios";
import {
  getUsersRegistry,
  mergeUserRecords,
  syncUsersListToRegistry,
  saveUserOverride,
} from "../utils/userRegistry";
import {
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Clock,
  AlertCircle,
  GraduationCap,
  FileText,
} from "lucide-react";

const AdminTeacherVerification = () => {
  const [teachers, setTeachers] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadTeachers = async (filter = statusFilter) => {
    setLoading(true);
    try {
      const [res, classesRes, bookingsRes, adminRecRes] = await Promise.all([
        API.get(`/admin/teachers/pending?status=${filter}`).catch(() => ({
          data: [],
        })),
        API.get("/marketplace/classes").catch(() => ({ data: [] })),
        API.get("/marketplace/bookings").catch(() => ({ data: [] })),
        API.get("/admin/records").catch(() => ({ data: {} })),
      ]);

      const map = new Map();
      const upsert = (t) => {
        if (!t || !t._id) return;
        const existing = map.get(t._id) || {};
        map.set(t._id, mergeUserRecords(existing, { ...t, role: "teacher" }));
      };

      const registry = getUsersRegistry();
      Object.values(registry).forEach((u) => {
        if (u.role === "teacher" || u.teacherProfile) upsert(u);
      });

      (adminRecRes.data?.teachers || []).forEach(upsert);
      (res.data || []).forEach(upsert);
      (classesRes.data || []).forEach((c) => {
        if (c.teacher?._id) upsert(c.teacher);
      });
      (bookingsRes.data || []).forEach((b) => {
        if (b.teacher?._id) upsert(b.teacher);
      });

      const allTeachers = Array.from(map.values());
      syncUsersListToRegistry(allTeachers);

      const merged = allTeachers.filter((t) => {
        const st = t.teacherProfile?.verificationStatus || "pending";
        return filter === "all" ? true : st === filter;
      });

      setTeachers(merged);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load teacher verification queue"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers(statusFilter);
  }, [statusFilter]);

  const handleVerify = async (teacherId, status, teacherName) => {
    setActionLoading(teacherId);
    setMessage("");
    setError("");
    saveUserOverride(teacherId, { verificationStatus: status });

    try {
      await API.put(`/admin/teachers/${teacherId}/verify`, { status });
      setMessage(
        `${teacherName} has been ${status}! ${
          status === "approved"
            ? "Platform access is now unlocked for this teacher."
            : "Platform access remains restricted."
        }`
      );
      loadTeachers(statusFilter);
    } catch (err) {
      setError(err.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Teacher Document &amp; Profile Verification
          </h2>
          <p className="text-sm text-slate-500">
            Verify submitted teacher documents and details before granting
            platform access
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl">
          {[
            { id: "pending", label: "Pending Review" },
            { id: "approved", label: "Approved" },
            { id: "rejected", label: "Rejected" },
            { id: "all", label: "All Teachers" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl">
          {message}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-500">
          Loading teacher verification list...
        </div>
      ) : teachers.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm">
          <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">
            No Teachers Found
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            There are no teacher registrations matching the &quot;{statusFilter}
            &quot; filter right now.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {teachers.map((t) => {
            const tp = t.teacherProfile || {};
            const vStatus = tp.verificationStatus || "pending";

            return (
              <div
                key={t._id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center font-bold">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">
                          {t.name}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {t.email} • {t.phone || "No phone provided"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        vStatus === "approved"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : vStatus === "rejected"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {vStatus}
                    </span>
                  </div>

                  {tp.headline && (
                    <p className="text-sm font-semibold text-brand-teal">
                      {tp.headline}
                    </p>
                  )}

                  {tp.qualifications && tp.qualifications.length > 0 && (
                    <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-700">
                      <GraduationCap className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="font-semibold">Qualifications:</span>
                      <span>{tp.qualifications.join(" • ")}</span>
                    </div>
                  )}

                  {tp.bio && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {tp.bio}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-medium">
                      Rate: {tp.hourlyRate || 0} LKR/hr
                    </span>
                    <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg font-medium">
                      Experience: {tp.experienceYears || 0} Years
                    </span>
                    {tp.subjects &&
                      tp.subjects.map((sub, i) => (
                        <span
                          key={i}
                          className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg"
                        >
                          {sub}
                        </span>
                      ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-brand-blue" />
                      <span>Submitted Verification Documents:</span>
                    </p>
                    {tp.verificationDocuments &&
                    tp.verificationDocuments.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {tp.verificationDocuments.map((docUrl, idx) => (
                          <a
                            key={idx}
                            href={docUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue hover:underline bg-brand-blue/5 px-3 py-1.5 rounded-lg border border-brand-blue/20"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>View Document {idx + 1}</span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>No verification documents submitted</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 shrink-0">
                  {vStatus !== "approved" && (
                    <button
                      disabled={actionLoading === t._id}
                      onClick={() => handleVerify(t._id, "approved", t.name)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
                    >
                      <Check className="w-4 h-4" />
                      <span>Verify &amp; Approve</span>
                    </button>
                  )}
                  {vStatus !== "rejected" && (
                    <button
                      disabled={actionLoading === t._id}
                      onClick={() => handleVerify(t._id, "rejected", t.name)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-all"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject Access</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminTeacherVerification;