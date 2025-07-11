// src/components/QuestionCard.tsx
import React from "react";

interface QuestionCardProps {
  question: string;
  options: string[];
  selected: number | null;
  onSelect: (index: number) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  options,
  selected,
  onSelect,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg transition">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{question}</h2>
      <div className="space-y-3">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => onSelect(index)}
            className={`w-full text-left px-4 py-2 rounded border transition hover:bg-indigo-50 dark:hover:bg-gray-700 ${
              selected === index
                ? "bg-indigo-100 border-indigo-500 dark:bg-indigo-600 dark:text-white"
                : "border-gray-300 dark:border-gray-600"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuestionCard;
