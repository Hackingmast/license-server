// src/components/TopNav.tsx
import React from "react";

interface TopNavProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ darkMode, toggleDarkMode }) => {
  return (
    <nav className="w-full p-4 shadow bg-indigo-600 text-white flex justify-between items-center">
      <h1 className="text-lg font-semibold">🧠 StudyBuddy Pro</h1>
      <button
        onClick={toggleDarkMode}
        className="text-sm bg-white text-indigo-600 font-semibold px-3 py-1 rounded hover:bg-indigo-100 transition"
      >
        {darkMode ? "Light Mode" : "Dark Mode"}
      </button>
    </nav>
  );
};

export default TopNav;
