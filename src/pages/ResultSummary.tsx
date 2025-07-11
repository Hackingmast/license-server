type Props = {
  total: number;
  correct: number;
  incorrect: number;
  passing: number;
  onReview: () => void;
  onRetry: () => void;
};

export default function ResultSummary({ total, correct, incorrect, passing, onReview, onRetry }: Props) {
  const score = Math.round((correct / total) * 100);
  const passed = score >= passing;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white flex items-center justify-center p-6">
      <div className="bg-white text-gray-900 p-8 rounded-xl shadow-2xl w-full max-w-md transition-all duration-500">
        <h2 className="text-2xl font-bold text-center mb-4 text-indigo-700">🏁 Test Finished!</h2>
        <p className="text-sm text-center text-gray-600 mb-6">Here are your results:</p>

        <ul className="space-y-2 mb-6 text-sm">
          <li><strong>Total Questions:</strong> {total}</li>
          <li><strong>Correct Answers:</strong> {correct}</li>
          <li><strong>Incorrect Answers:</strong> {incorrect}</li>
          <li><strong>Your Score:</strong> {score}%</li>
          <li><strong>Passing Score:</strong> {passing}%</li>
          <li>
            <strong>Result:</strong>{" "}
            <span className={`font-bold ${passed ? "text-green-600" : "text-red-600"}`}>
              {passed ? "Passed" : "Failed"}
            </span>
          </li>
        </ul>

        {passed ? (
          <p className="text-center text-green-600 font-medium mb-6">Test Passed</p>
        ) : (
          <p className="text-center text-red-500 font-medium mb-6">
            Test Failed. You will now review the questions you got wrong for the next 30 minutes Ha Ha Ha Ha !.
          </p>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={onReview}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded transition duration-300"
          >
            Start Review Session
          </button>
          <button
            onClick={onRetry}
            className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-black rounded transition duration-300"
          >
            Configure New Test
          </button>
        </div>
      </div>
    </div>
  );
}
