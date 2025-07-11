import { useState } from "react";
import ConfigureTest from "./pages/ConfigureTest";
import TestInterface from "./pages/TestInterface";
import ResultSummary from "./pages/ResultSummary";
import ReviewMode from "./pages/ReviewMode";
import "./index.css";
import "./App.css";

type MCQ = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

export default function App() {
  const [screen, setScreen] = useState<"login" | "configure" | "test" | "summary" | "review">("login");
  const [rollNumber, setRollNumber] = useState("");
  const [name, setName] = useState("");
  const [questions, setQuestions] = useState<MCQ[]>([]);
  const [settings, setSettings] = useState({ timer: 10, maxQuestions: 10, passing: 70 });

  const [userAnswers, setUserAnswers] = useState<{ [key: number]: number }>({});
  const [incorrectSet, setIncorrectSet] = useState<{ mcq: MCQ; userAnswer: number }[]>([]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumber || !name) return alert("Please fill in both fields.");
    setScreen("configure");
  };

  const startTest = (parsed: MCQ[], config: typeof settings) => {
    setQuestions(parsed);
    setSettings(config);
    setUserAnswers({});
    setIncorrectSet([]);
    setScreen("test");
  };

  const endTest = (answers: { [key: number]: number }) => {
    setUserAnswers(answers);
    const incorrect: { mcq: MCQ; userAnswer: number }[] = [];

    questions.forEach((q, i) => {
      const userAns = answers[i];
      if (!userAns || userAns !== q.answer) {
        incorrect.push({
          mcq: q,
          userAnswer: userAns ?? -1,
        });
      }
    });

    setIncorrectSet(incorrect);
    setScreen("summary");
  };

  const retry = () => setScreen("configure");

  const total = questions.length;
  const correct = total - incorrectSet.length;
  const incorrect = incorrectSet.length;

  if (screen === "review") {
    return <ReviewMode incorrectQuestions={incorrectSet} onFinish={retry} />;
  }

  if (screen === "summary") {
    return (
      <ResultSummary
        total={total}
        correct={correct}
        incorrect={incorrect}
        passing={settings.passing}
        onReview={() => setScreen("review")}
        onRetry={retry}
      />
    );
  }

  if (screen === "test") {
    return (
      <TestInterface
        questions={questions}
        settings={settings}
        onFinish={endTest}
      />
    );
  }

  if (screen === "configure") {
    return <ConfigureTest onStart={startTest} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 px-4">
      <header className="w-full text-center pt-6">
        <h1 className="text-3xl font-bold text-sky-600 dark:text-sky-400">🧠 StudyBuddy Pro</h1>
      </header>

      <div className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-lg rounded-xl p-6 space-y-6 border border-gray-200 dark:border-gray-700 transition-all">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Please enter your details to begin.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Roll Number</label>
              <input
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-md shadow-md hover:shadow-sky-400/50 transition-all"
            >
              Login
            </button>
          </form>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400 italic">
            Your personal study assistant.
          </p>
        </div>
      </div>
    </div>
  );
}
