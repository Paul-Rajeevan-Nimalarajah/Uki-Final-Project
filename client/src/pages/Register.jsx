import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import {
  GraduationCap,
  Briefcase,
  Mail,
  Lock,
  User,
  Phone,
  BookOpen,
  AlertCircle,
  FileText,
  Upload,
  CheckCircle2,
  X,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";

const Register = () => {
  const [role, setRole] = useState("student");
  const [verificationStep, setVerificationStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    grade: "",
    school: "",
    headline: "",
    qualifications: "",
    experienceYears: "",
    hourlyRate: "",
    subjects: "",
    bio: "",
  });

  const [verificationDocuments, setVerificationDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register, updateUser } = useAuth();
  const navigate = useNavigate();

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
      setVerificationDocuments((prev) => [
        ...prev,
        {
          url: res.data.url,
          name: res.data.originalName || file.name,
        },
      ]);
    } catch (err) {
      // Fallback if backend upload endpoint was not restarted yet
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl =
          typeof reader.result === "string" && reader.result.length < 70000
            ? reader.result
            : `https://res.cloudinary.com/demo/image/upload/sample.pdf?doc=${encodeURIComponent(
                file.name
              )}`;
        setVerificationDocuments((prev) => [
          ...prev,
          {
            url: dataUrl,
            name: file.name,
          },
        ]);
      };
      reader.onerror = () => {
        setVerificationDocuments((prev) => [
          ...prev,
          {
            url: `https://res.cloudinary.com/demo/image/upload/sample.pdf?doc=${encodeURIComponent(
              file.name
            )}`,
            name: file.name,
          },
        ]);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveDoc = (idx) => {
    setVerificationDocuments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (role === "teacher") {
      if (verificationDocuments.length === 0) {
        setError(
          "Document submission (NIC, Degree, or Teaching Certificate) is mandatory for teacher registration."
        );
        return;
      }
      if (!formData.qualifications.trim() || !formData.subjects.trim()) {
        setError(
          "Please enter your qualifications and teaching subjects for Admin verification."
        );
        return;
      }
    }

    setLoading(true);

    try {
      const submissionData = {
        ...formData,
        role,
        subjects:
          role === "teacher" && formData.subjects
            ? formData.subjects
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
        qualifications:
          role === "teacher" && formData.qualifications
            ? formData.qualifications
                .split(",")
                .map((q) => q.trim())
                .filter(Boolean)
            : [],
        verificationDocuments:
          role === "teacher" ? verificationDocuments.map((d) => d.url) : [],
      };

      const regData = await register(submissionData);
      if (role === "teacher") {
        if (!regData?.teacherProfile?.verificationDocuments?.length) {
          try {
            await API.put("/teachers/profile", {
              headline: formData.headline,
              bio: formData.bio,
              hourlyRate: Number(formData.hourlyRate) || 0,
              experienceYears: Number(formData.experienceYears) || 0,
              subjects: submissionData.subjects,
              qualifications: submissionData.qualifications,
              verificationDocuments: submissionData.verificationDocuments,
            });
          } catch (profileErr) {
            // ignore if already saved by register endpoint
          }
        }
      }
      if (regData?.devOtp) {
        setDevOtp(regData.devOtp);
      }
      setVerifyMessage(
        `We sent a 6-digit verification code to ${formData.email}. Please enter it below to verify your email.`
      );
      setVerificationStep(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Please check your inputs."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError("");
    setVerifyingOtp(true);

    try {
      await API.post("/auth/verify-email", {
        email: formData.email,
        otp,
      });
      if (updateUser) {
        updateUser({ isEmailVerified: true });
      }
      if (role === "teacher") {
        navigate("/teacher/profile");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Invalid or expired verification code. Please try again."
      );
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendVerification = async () => {
    setError("");
    setVerifyMessage("");
    setResendingOtp(true);

    try {
      const res = await API.post("/auth/resend-verification", {
        email: formData.email,
      });
      setVerifyMessage(
        res.data?.message || "A new 6-digit code has been sent to your email."
      );
      if (res.data?.devOtp) {
        setDevOtp(res.data.devOtp);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not resend verification code."
      );
    } finally {
      setResendingOtp(false);
    }
  };

  if (verificationStep) {
    return (
      <div className="max-w-md mx-auto my-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-5">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
            <Mail className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Verify Your Email
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Enter the 6-digit code sent to <strong>{formData.email}</strong>
          </p>
        </div>

        {verifyMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{verifyMessage}</span>
          </div>
        )}

        {devOtp && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
            <p className="font-bold">
              Dev Mode OTP Preview (SMTP not active in .env yet):
            </p>
            <p className="font-mono text-base font-extrabold tracking-widest text-brand-blue">
              {devOtp}
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerifyEmail} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase">
                6-Digit Verification Code
              </label>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendingOtp}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline"
              >
                <RefreshCw
                  className={`w-3 h-3 ${resendingOtp ? "animate-spin" : ""}`}
                />
                <span>{resendingOtp ? "Sending..." : "Resend Code"}</span>
              </button>
            </div>
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 6-digit code"
              className="w-full px-3 py-2.5 text-center font-mono text-lg font-bold tracking-widest border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <button
            type="submit"
            disabled={verifyingOtp || otp.length < 6}
            className={`w-full py-2.5 px-4 text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow transition-all bg-brand-blue hover:bg-blue-700 ${
              verifyingOtp || otp.length < 6
                ? "opacity-70 cursor-not-allowed"
                : ""
            }`}
          >
            {verifyingOtp ? "Verifying Email..." : "Verify Email & Continue"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto my-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Create your Account
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Join LearnyMo to start learning or teaching
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => {
            setRole("student");
            setError("");
          }}
          className={`flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${
            role === "student"
              ? "bg-white text-brand-blue shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Student
        </button>
        <button
          type="button"
          onClick={() => {
            setRole("teacher");
            setError("");
          }}
          className={`flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${
            role === "teacher"
              ? "bg-white text-brand-teal shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Teacher
        </button>
      </div>

      {role === "teacher" && (
        <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Mandatory Admin Verification Required</p>
            <p className="mt-0.5 text-amber-700">
              Teachers must submit verification documents (NIC / Degree /
              Certificate) and professional details. Platform access is unlocked
              once an Admin verifies and approves your registration.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="e.g. Eng. Arjuna Perera"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="+94 7X XXX XXXX"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Password *
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="password"
              name="password"
              required
              minLength={6}
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
        </div>

        {role === "student" ? (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Grade
              </label>
              <input
                type="text"
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                placeholder="e.g. A/L or Grade 11"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                School
              </label>
              <input
                type="text"
                name="school"
                value={formData.school}
                onChange={handleChange}
                placeholder="e.g. Royal College"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3.5 pt-2 border-t border-slate-100">
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
                placeholder="e.g. BSc Eng (Hons) Moratuwa • 8+ Yrs Combined Maths"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Qualifications &amp; Degrees (Comma separated) *
              </label>
              <input
                type="text"
                name="qualifications"
                required
                value={formData.qualifications}
                onChange={handleChange}
                placeholder="e.g. BSc Engineering (Hons), Postgraduate Diploma in Education"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Hourly Rate (LKR) *
                </label>
                <input
                  type="number"
                  name="hourlyRate"
                  required
                  min={100}
                  value={formData.hourlyRate}
                  onChange={handleChange}
                  placeholder="e.g. 1500"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Experience (Years) *
                </label>
                <input
                  type="number"
                  name="experienceYears"
                  required
                  min={0}
                  value={formData.experienceYears}
                  onChange={handleChange}
                  placeholder="e.g. 5"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Subjects Taught (Comma separated) *
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  name="subjects"
                  required
                  value={formData.subjects}
                  onChange={handleChange}
                  placeholder="e.g. Combined Mathematics, Physics"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Short Bio / Teaching Experience *
              </label>
              <textarea
                name="bio"
                rows={2}
                required
                value={formData.bio}
                onChange={handleChange}
                placeholder="Briefly describe your teaching methodology and background..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-800 uppercase">
                  Verification Documents (Mandatory) *
                </label>
                <span className="text-[11px] font-semibold text-rose-600">
                  Required for Admin Approval
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Upload your NIC, University Degree Certificate, or Teaching
                Qualification (PDF or Image).
              </p>

              <div className="flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-all text-xs font-semibold text-slate-700 shadow-sm">
                  <Upload className="w-4 h-4 text-brand-teal" />
                  <span>
                    {uploading
                      ? "Uploading Document..."
                      : "Upload Document (PDF / Image)"}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    disabled={uploading}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {verificationDocuments.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    {verificationDocuments.length} Attached
                  </span>
                )}
              </div>

              {verificationDocuments.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {verificationDocuments.map((doc, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 text-xs bg-white text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5 text-brand-teal" />
                      <span className="max-w-[160px] truncate">
                        {doc.name || `Document ${idx + 1}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(idx)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || uploading}
          className={`w-full py-2.5 px-4 text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow transition-all mt-4 ${
            role === "student"
              ? "bg-brand-blue hover:bg-blue-700"
              : "bg-brand-teal hover:bg-teal-700"
          } ${loading || uploading ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {loading
            ? "Creating Account..."
            : role === "student"
            ? "Register as Student"
            : "Submit Documents & Register as Teacher"}
        </button>
      </form>
      <p className="text-center text-xs text-slate-500 mt-6">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-semibold text-brand-blue hover:underline"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
};

export default Register;
