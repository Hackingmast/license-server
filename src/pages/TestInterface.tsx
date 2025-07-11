import React, { useState, useEffect } from "react";
import TopNav from "../components/TopNav";
import QuestionCard from "../components/QuestionCard";
import TimerBar from "../components/TimerBar";
import { Button } from "../components/ui/button";

export default function TestInterface({ questions, settings, onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(settings.timer * 60);
  const [skipped, setSkipped] = useState([]);
  const [reviewingSkipped, setReviewingSkipped] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          onFinish(userAnswers);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onFinish]);

  const handleSubmit = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (skipped.length > 0 && !reviewingSkipped) {
      setCurrentIndex(skipped[0]);
      setSkipped(skipped.slice(1));
      setReviewingSkipped(true);
    } else {
      onFinish(userAnswers);
    }
  };

  const handleSkip = () => {
    if (!skipped.includes(currentIndex)) {
      setSkipped((prev) => [...prev, currentIndex]);
    }
    handleSubmit();
  };

  const handleAnswer = (ans) => {
    setUserAnswers((prev) => ({ ...prev, [currentIndex]: ans }));
  };

  const question = questions[currentIndex];

  const score = Object.keys(userAnswers).filter(
    (i) => userAnswers[i] === questions[i].answer
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 p-4">
      <TopNav title="🧠 StudyBuddy Pro" />

      <div className="max-w-4xl w-full mx-auto bg-white dark:bg-gray-800 rounded-xl shadow p-6 mt-6">
        <TimerBar
          timeLeft={timeLeft}
          totalTime={settings.timer * 60}
          progress={(currentIndex + 1) / questions.length}
          percentage={Math.floor((score / questions.length) * 100)}
        />

        <QuestionCard
          question={question.question}
          options={question.options}
          selected={userAnswers[currentIndex] ?? null}
          onSelect={handleAnswer}
        />

        <div className="flex justify-between items-center mt-6">
          <Button onClick={handleSkip} variant="outline" className="hover:bg-yellow-100">
            Skip Question
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={userAnswers[currentIndex] == null}
            className="hover:bg-blue-700"
          >
            {currentIndex === questions.length - 1 && skipped.length === 0
              ? "Finish Test"
              : "Submit Answer"}
          </Button>
        </div>
      </div>

      {skipped.length > 0 && (
        <div className="max-w-4xl w-full mx-auto mt-4 text-right text-sm text-gray-500">
          Skipped Questions: {skipped.map((i) => i + 1).join(", ")}
        </div>
      )}
    </div>
  );
}
