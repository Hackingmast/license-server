export interface Question {
  id: string | number; // Unique identifier for the question
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null; // Explanation can be missing
}
