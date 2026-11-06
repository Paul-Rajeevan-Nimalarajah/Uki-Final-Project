import { useTheme } from "../context/ThemeContext";
import { Sun, Moon } from "lucide-react";

const ThemeToggle = ({ className = "" }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleTheme}
      className={`relative inline-flex items-center h-8 w-14 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-blue/60 focus:ring-offset-2 dark:focus:ring-offset-slate-900 select-none cursor-pointer border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 ${className}`}
    >
      <span className="sr-only">Toggle theme</span>

      {/* Background icon indicator on the left (Sun) */}
      <span className="absolute left-1.5 flex items-center justify-center text-amber-500 pointer-events-none transition-opacity duration-200 opacity-90 dark:opacity-20">
        <Sun className="w-3.5 h-3.5" />
      </span>

      {/* Background icon indicator on the right (Moon) */}
      <span className="absolute right-1.5 flex items-center justify-center text-indigo-400 pointer-events-none transition-opacity duration-200 opacity-20 dark:opacity-90">
        <Moon className="w-3.5 h-3.5" />
      </span>

      {/* Animated Sliding Thumb */}
      <span
        className={`inline-flex items-center justify-center w-6 h-6 transform rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-700 transition-transform duration-300 ease-in-out ${
          isDark ? "translate-x-[26px]" : "translate-x-1"
        }`}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-indigo-400 transition-transform duration-300 rotate-0" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-amber-500 transition-transform duration-300 rotate-0" />
        )}
      </span>
    </button>
  );
};

export default ThemeToggle;

