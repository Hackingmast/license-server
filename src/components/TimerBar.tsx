// src/components/TimerBar.tsx
import React from "react";

interface TimerBarProps {
  timeLeft: number; // in seconds
  totalTime: number; // in seconds
}

const TimerBar: React.FC<TimerBarProps> = ({ timeLeft, totalTime }) => {
  const percentage = Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));
  const minutes = Math.floor(timeLeft / 60);
  const seconds = String(timeLeft % 60).padStart(2, "0");

  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs text-gray-700 dark:text-gray-300 mb-1">
        <span>Time Left: {minutes}:{seconds}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="w-full bg-gray-300 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
        <div
          className="bg-indigo-500 h-3 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default TimerBar;
