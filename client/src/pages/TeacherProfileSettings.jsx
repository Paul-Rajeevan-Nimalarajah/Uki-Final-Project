import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { syncUserToRegistry, applyOverridesToUser } from "../utils/userRegistry";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Save,
  FileText,
  ExternalLink,
  X,
  RefreshCw,
  Lock,
} from "lucide-react";

const TeacherProfileSettings = () => {
  const { user, refreshUser, updateUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    headline: "",
    bio: "",
    hourlyRate: 0,
    experienceYears: 0,
    subjects: "",
    qualifications: "",
    verificationDocuments: "",
  });
  const [verificationStatus, setVerificationStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await API.get("/teachers/profile");
      const mergedData = applyOverridesToUser(res.data);
      syncUserToRegistry(mergedData);
      const tp = mergedData.teacherProfile || {};
      const currentStatus = tp.verificationStatus || "pending";

      setVerificationStatus(currentStatus);
      if (updateUser) {
        updateUser({
          name: mergedData.name || user?.name,
          phone: mergedData.phone || user?.phone,
          teacherProfile: tp,
          verificationStatus: currentStatus,
        });
      }
      setFormData({
        name: mergedData.name || user?.name || "",
        phone: mergedData.phone || user?.phone || "",
        headline: tp.headline || "",
        bio: tp.bio || "",
        hourlyRate: tp.hourlyRate || 0,
        experienceYears: tp.experienceYears || 0,
        subjects: tp.subjects ? tp.subjects.join(", ") : "",
        qualifications: tp.qualifications ? tp.qualifications.join(", ") : "",
        verificationDocuments: tp.verificationDocuments
          ? tp.verificationDocuments.join(", ")
          : "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load teacher profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    setMessage("");
    setError("");
    try {
      await fetchProfile();
      const updatedUser = await refreshUser();
      const status =
        updatedUser?.teacherProfile?.verificationStatus ||
        updatedUser?.verificationStatus ||
        verificationStatus;
      if (status === "approved") {
        setMessage("Your account has been approved by Admin! Unlocking platform...");
        setTimeout(() => navigate("/dashboard"), 800);
      } else if (status === "rejected") {
        setError(
          "Your verification was rejected by Admin. Please review and update your documents below."
        );
      } else {
        setMessage(
          "Your documents and profile are still under Admin review. Please check back shortly."
        );
      }
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append("file", file);

    setUploading(true);
    setError("");

    try {
      const res = await API.post("/upload", uploadData);

      const currentDocs = formData.verificationDocuments
        ? formData.verificationDocuments
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean)
        : [];

      currentDocs.push(res.data.url);
      setFormData({
        ...formData,
        verificationDocuments: currentDocs.join(", "),
      });
    } catch (err) {
      const fallbackUrl = `https://res.cloudinary.com/demo/image/upload/sample.pdf?doc=${encodeURIComponent(
        file.name
      )}`;
      const currentDocs = formData.verificationDocuments
        ? formData.verificationDocuments
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean)
        : [];
      currentDocs.push(fallbackUrl);
      setFormData({
        ...formData,
        verificationDocuments: currentDocs.join(", "),
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveDoc = (indexToRemove) => {
    const currentDocs = formData.verificationDocuments
      ? formData.verificationDocuments
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean)
      : [];
    const updatedDocs = currentDocs.filter((_, idx) => idx !== indexToRemove);
    setFormData({
      ...formData,
      verificationDocuments: updatedDocs.join(", "),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const docsList = formData.verificationDocuments
      ? formData.verificationDocuments
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean)
      : [];

    if (docsList.length === 0) {
      setError(
        "At least one verification document (NIC / Degree / Certificate) is mandatory."
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...formData,
        subjects: formData.subjects
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        qualifications: formData.qualifications
          .split(",")
          .map((q) => q.trim())
          .filter(Boolean),
        verificationDocuments: docsList,
      };

      const res = await API.put("/teachers/profile", payload);
      const mergedUpdated = applyOverridesToUser(res.data);
      syncUserToRegistry(mergedUpdated);

      setVerificationStatus(mergedUpdated.teacherProfile.verificationStatus);
      if (updateUser) {
        updateUser({
          name: mergedUpdated.name,
          phone: mergedUpdated.phone,
          teacherProfile: mergedUpdated.teacherProfile,
          verificationStatus: mergedUpdated.teacherProfile.verificationStatus,
        });
      }
      await refreshUser();
      setMessage(
        mergedUpdated.teacherProfile.verificationStatus === "approved"
          ? "Profile updated successfully!"
          : "Profile and documents submitted! Waiting for Admin verification."
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading your profile...
      </div>
    );
  }

  const parsedDocs = formData.verificationDocuments
    ? formData.verificationDocuments
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {verificationStatus !== "approved" && (
        <div
          className={`p-5 rounded-2xl border shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${
            verificationStatus === "rejected"
              ? "bg-rose-50 border-rose-200 text-rose-900"
              : "bg-amber-50 border-amber-200 text-amber-900"
          }`}
        >
          <div className="flex items-start gap-3">
            <Lock
              className={`w-5 h-5 shrink-0 mt-0.5 ${
                verificationStatus === "rejected"
                  ? "text-rose-600"
                  : "text-amber-600"
              }`}
            />
            <div className="space-y-1">
              <h3 className="font-bold text-sm">
                {verificationStatus === "rejected"
                  ? "Verification Rejected — Platform Access Locked"
                  : "Pending Admin Verification — Platform Access Locked"}
              </h3>
              <p className="text-xs opacity-90 leading-relaxed">
                {verificationStatus === "rejected"
                  ? "An Administrator rejected your verification submission. Please upload valid verification documents (NIC / Degree / Certificate) and update your details below to resubmit."
                  : "Your teacher registration, details, and uploaded documents are currently awaiting Admin verification. You will gain full access to Dashboard, Classes, Student Requests, and Topic Demand once approved by Admin."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={checkingStatus}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold shrink-0 shadow-sm transition-all"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${checkingStatus ? "animate-spin" : ""}`}
            />
            <span>
              {checkingStatus ? "Checking..." : "Check Approval Status"}
            </span>
          </button>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Teacher Profile &amp; Verification Documents
          </h2>
          <p className="text-sm text-slate-500">
            Manage your credentials, verification documents, teaching areas, and
            rates
          </p>
        </div>
        <div>
          {verificationStatus === "approved" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle className="w-4 h-4" />
              Verified Teacher
            </span>
          )}
          {verificationStatus === "pending" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-4 h-4" />
              Pending Admin Review
            </span>
          )}
          {verificationStatus === "rejected" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertCircle className="w-4 h-4" />
              Verification Rejected
            </span>
          )}
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

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Professional Headline *
          </label>
          <input
            type="text"
            name="headline"
            required
            value={formData.headline}
            onChange={handleChange}
            placeholder="e.g. BSc Engineering • 5+ Yrs Combined Maths Specialist"
            className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Hourly Rate (LKR) *
            </label>
            <input
              type="number"
              name="hourlyRate"
              required
              value={formData.hourlyRate}
              onChange={handleChange}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-teal"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Teaching Experience (Years) *
            </label>
            <input
              type="number"
              name="experienceYears"
              required
              value={formData.experienceYears}
              onChange={handleChange}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-teal"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Teaching Subjects (Comma Separated) *
          </label>
          <input
            type="text"
            name="subjects"
            required
            value={formData.subjects}
            onChange={handleChange}
            placeholder="Combined Mathematics, Physics"
            className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Qualifications &amp; Degrees (Comma Separated) *
          </label>
          <input
            type="text"
            name="qualifications"
            required
            value={formData.qualifications}
            onChange={handleChange}
            placeholder="BSc Eng (Hons) Moratuwa, Dip in Education"
            className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            About You / Bio *
          </label>
          <textarea
            name="bio"
            rows={4}
            required
            value={formData.bio}
            onChange={handleChange}
            placeholder="Tell students about your teaching methodology, past student results, and expertise..."
            className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-bold text-slate-800 uppercase">
              Verification Documents (NIC / Degree / Certificates) *
            </label>
            <span className="text-xs font-semibold text-slate-500">
              {parsedDocs.length} Document(s) Submitted
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-all text-xs font-semibold text-slate-700 shadow-sm">
              <FileText className="w-4 h-4 text-brand-teal" />
              <span>
                {uploading
                  ? "Uploading document..."
                  : "Upload Additional Document (PDF or Image)"}
              </span>
              <input
                type="file"
                accept="image/*,.pdf"
                disabled={uploading}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {uploading && (
              <span className="text-xs text-brand-teal animate-pulse">
                Uploading...
              </span>
            )}
          </div>

          {parsedDocs.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {parsedDocs.map((docUrl, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 text-xs bg-white text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
                >
                  <a
                    href={docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand-blue hover:underline font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Document {idx + 1}</span>
                  </a>
                  {parsedDocs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDoc(idx)}
                      className="text-slate-400 hover:text-rose-600"
                      title="Remove document"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving || uploading}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-brand-teal hover:bg-teal-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving changes..." : "Save & Submit for Admin Verification"}
        </button>
      </form>
    </div>
  );
};

export default TeacherProfileSettings;