import  { useEffect, useState } from "react";

type MCQ = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

type Props = {
  incorrectQuestions: {
    mcq: MCQ;
    userAnswer: number;
  }[];
  onFinish: () => void;
};

export default function ReviewMode({ incorrectQuestions, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [reviewTimeLeft, setReviewTimeLeft] = useState(30 * 60); // 30 minutes
  const [questionTimer, setQuestionTimer] = useState(30); // 30 sec/question

  useEffect(() => {
    const interval = setInterval(() => {
      setReviewTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const qInterval = setInterval(() => {
      setQuestionTimer((prev) => {
        if (prev <= 1) {
          nextQuestion();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(qInterval);
  }, [index]);

  const nextQuestion = () => {
    if (index + 1 < incorrectQuestions.length) {
      setIndex(index + 1);
      setQuestionTimer(30);
    } else {
      onFinish();
    }
  };

  const { mcq, userAnswer } = incorrectQuestions[index];

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white flex items-center justify-center p-6">
      <div className="bg-white text-gray-900 p-8 rounded-xl shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center text-sm mb-4">
          <div>🔁 Review Mode ({index + 1}/{incorrectQuestions.length})</div>
          <div>⏱ Time Left: {formatTime(reviewTimeLeft)}</div>
        </div>

        <h2 className="text-lg font-semibold mb-4">{mcq.question}</h2>

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 underline">Your Answer:</p>
          <p
            className={`ml-3 mt-1 font-semibold ${
              userAnswer === mcq.answer ? "text-green-600" : "text-red-600"
            }`}
          >
            {mcq.options[userAnswer - 1]}
          </p>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 underline">Correct Answer:</p>
          <p className="ml-3 mt-1 font-semibold text-green-700">
            {mcq.options[mcq.answer - 1]}
          </p>
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 underline">Explanation:</p>
          <p className="ml-3 mt-1 text-gray-700">{mcq.explanation}</p>
        </div>

        <div className="flex flex-col items-center space-y-2">
          <button
            onClick={nextQuestion}
            className="w-full max-w-sm py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded"
          >
            {index + 1 === incorrectQuestions.length ? "Finish Review" : "Next"}
          </button>
          <button
            onClick={onFinish}
            className="text-sm text-gray-500 underline"
          >
            End Review Early
          </button>
        </div>

        <p className="mt-4 text-xs text-center text-gray-500">
          Auto-advancing in {questionTimer}s
        </p>
      </div>
    </div>
  );
}
