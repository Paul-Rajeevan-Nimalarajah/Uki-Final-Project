import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, User as UserIcon } from "lucide-react";
import logo from "../assets/logo.png";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) =>
    location.pathname === path
      ? "text-slate-900 font-semibold bg-slate-100 px-3 py-1.5 rounded-lg"
      : "text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors";

  const getNavLinks = () => {
    // 1. Guest / Landing Page (Not logged in)
    if (!user) {
      return [
        { to: "/", label: "Home" },
        { to: "/classes", label: "Find Classes" },
        { to: "/bookings", label: "1-to-1 & Bookings" },
        { to: "/syllabus", label: "Syllabus & Demand" },
      ];
    }

    // 2. Admin Role
    if (user.role === "admin") {
      return [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/admin/teachers", label: "Verify Teachers" },
        { to: "/admin/academic", label: "Syllabus Admin" },
      ];
    }

    // 3. Teacher Role
    if (user.role === "teacher") {
      const verificationStatus =
        user.teacherProfile?.verificationStatus ||
        user.verificationStatus ||
        "pending";

      if (verificationStatus !== "approved") {
        return [
          { to: "/teacher/profile", label: "Verification & Profile" },
        ];
      }

      return [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/classes", label: "Classes" },
        { to: "/bookings", label: "Student Requests" },
        { to: "/syllabus", label: "Topic Demand" },
        { to: "/teacher/profile", label: "My Profile" },
      ];
    }

    // 4. Student Role
    return [
      { to: "/dashboard", label: "Dashboard" },
      { to: "/classes", label: "Find Classes" },
      { to: "/bookings", label: "1-to-1 & Bookings" },
      { to: "/syllabus", label: "Syllabus & Study Plan" },
      { to: "/student/profile", label: "My Profile" },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            to={user ? "/dashboard" : "/"}
            className="flex items-center gap-2 shrink-0"
          >
            <img
              src={logo}
              alt="LearnyMo Logo"
              className="w-10 h-10 object-contain rounded-full"
            />
            <div>
              <span className="text-xl font-bold text-slate-900">LearnyMo</span>
              <p className="text-[10px] text-slate-400 -mt-1 font-medium tracking-tight">
                Your Topic • Your Time • Your Teacher
              </p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={isActive(link.to)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to={
                    user.role === "teacher" &&
                    (user.teacherProfile?.verificationStatus ||
                      user.verificationStatus ||
                      "pending") !== "approved"
                      ? "/teacher/profile"
                      : "/dashboard"
                  }
                  className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700 max-w-[110px] truncate">
                    {user.name}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                    {user.role}
                  </span>
                  {user.role === "teacher" &&
                    (user.teacherProfile?.verificationStatus ||
                      user.verificationStatus ||
                      "pending") !== "approved" && (
                      <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        Unverified
                      </span>
                    )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-xs sm:text-sm text-rose-600 hover:text-rose-700 font-medium px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-lg shadow-sm transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile quick navigation bar */}
        <div className="flex md:hidden items-center gap-2 overflow-x-auto py-2 border-t border-slate-100 text-xs font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`shrink-0 px-2.5 py-1 rounded ${
                location.pathname === link.to
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
