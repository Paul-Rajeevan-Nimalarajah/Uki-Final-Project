import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import {
  Mail,
  Lock,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Enter OTP & New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [devOtp, setDevOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await API.post("/auth/forgot-password", { email });
      setMessage(
        res.data?.message ||
          "A 6-digit password reset code has been sent to your email."
      );
      if (res.data?.devOtp) {
        setDevOtp(res.data.devOtp);
      } else {
        setDevOtp("");
      }
      setStep(2);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not send reset code. Please check your email address."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setMessage("");
    setResending(true);

    try {
      const res = await API.post("/auth/forgot-password", { email });
      setMessage("A fresh 6-digit reset code has been sent to your email.");
      if (res.data?.devOtp) {
        setDevOtp(res.data.devOtp);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to resend code. Try again."
      );
    } finally {
      setResending(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await API.post("/auth/reset-password", {
        email,
        otp,
        newPassword,
      });
      setMessage(
        res.data?.message || "Password reset successfully! Redirecting to login..."
      );
      setDevOtp("");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Invalid or expired reset code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-5">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          {step === 1 ? "Forgot Password?" : "Reset Your Password"}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {step === 1
            ? "Enter your registered email address to receive a 6-digit reset code"
            : `Enter the 6-digit code sent to ${email} and choose a new password`}
        </p>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{message}</span>
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

      {step === 1 ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Registered Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 px-4 text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow transition-all bg-brand-blue hover:bg-blue-700 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Sending Reset Code..." : "Send 6-Digit Reset Code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase">
                6-Digit Verification Code
              </label>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline"
              >
                <RefreshCw
                  className={`w-3 h-3 ${resending ? "animate-spin" : ""}`}
                />
                <span>{resending ? "Sending..." : "Resend Code"}</span>
              </button>
            </div>
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 6-digit code"
              className="w-full px-3 py-2 text-center font-mono text-base font-bold tracking-widest border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 px-4 text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow transition-all bg-brand-blue hover:bg-blue-700 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Resetting Password..." : "Reset Password"}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep(1);
              setError("");
              setMessage("");
            }}
            className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            Change email address
          </button>
        </form>
      )}

      <div className="pt-2 border-t border-slate-100 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-blue"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;

