// ConfigureTest.tsx (converted from Next.js version to Tauri-compatible React)
import React, { useState } from "react";

type Props = {
  onStart: (questions: MCQ[], config: Config) => void;
};

type MCQ = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

type Config = {
  timer: number;
  maxQuestions: number;
  passing: number;
};

export default function ConfigureTest({ onStart }: Props) {
  const [timer, setTimer] = useState(10);
  const [maxQuestions, setMaxQuestions] = useState(10);
  const [passing, setPassing] = useState(70);
  const [fileName, setFileName] = useState("");
  const [questions, setQuestions] = useState<MCQ[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const text = await file.text();
    const blocks = text.split(/\n\s*\n/);
    const parsed = blocks.map((block) => {
      const lines = block.trim().split("\n").filter(line => line.trim() !== "");
      if (lines.length < 6) return null;

      const question = lines[0];
      const options = lines.slice(1, 5).map(line => line.replace(/^([\dA-Da-d])\)\s*/, "").trim());
      const answerLine = lines.find(line => line.startsWith("Answer:"));
      const answer = parseInt(answerLine?.split(":")[1]?.trim() || "", 10);
      if (!answer || isNaN(answer)) return null;
      const explanationLine = lines.find(line => line.startsWith("Explanation:"));
      const explanation = explanationLine ? explanationLine.split(":")[1]?.trim() : "Not available";

      return { question, options, answer, explanation };
    }).filter(Boolean) as MCQ[];

    setQuestions(parsed);
    alert(`${parsed.length} valid questions loaded.`);
  };

  const handleStart = () => {
    if (!questions.length) return alert("Please upload a valid .txt file first.");
    const shuffled = questions.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(maxQuestions, shuffled.length));
    onStart(selected, { timer, maxQuestions, passing });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-950 px-4 py-8">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-8 w-full max-w-xl space-y-6 border dark:border-gray-700">
        <h2 className="text-2xl font-bold text-center text-indigo-600 dark:text-indigo-400">🛠️ Configure Your Test</h2>
        <p className="text-center text-sm text-gray-600 dark:text-gray-300 mb-4">
          Upload your question file and set test parameters.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium">Timer (min)</label>
            <input
              type="number"
              value={timer}
              onChange={(e) => setTimer(+e.target.value)}
              className="w-full p-2 mt-1 border rounded dark:bg-gray-800 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Max Questions</label>
            <input
              type="number"
              value={maxQuestions}
              onChange={(e) => setMaxQuestions(+e.target.value)}
              className="w-full p-2 mt-1 border rounded dark:bg-gray-800 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Passing %</label>
            <input
              type="number"
              value={passing}
              onChange={(e) => setPassing(+e.target.value)}
              className="w-full p-2 mt-1 border rounded dark:bg-gray-800 dark:border-gray-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Upload Questions File (.txt)</label>
          <input
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            className="w-full mt-2 text-sm"
          />
          <p className="text-xs text-green-500 mt-1">{fileName ? `Selected: ${fileName}` : "No file selected."}</p>
        </div>

        <button
          type="button"
          onClick={handleStart}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md shadow-md"
        >
          Start Test
        </button>
      </div>
    </div>
  );
}
