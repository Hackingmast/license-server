
"use client";

import { create } from 'zustand';
import type { Question } from '@/types/question';

// Note: Questions are not persisted here, they should be loaded fresh
// from the file each time the user configures a test.

interface QuestionState {
  questions: Question[];
  setQuestions: (questions: Question[]) => void;
  clearQuestions: () => void;
}

export const useQuestionStore = create<QuestionState>()(
  (set) => ({
    questions: [], // Initialize with an empty array
    setQuestions: (questions) => set({ questions }),
    clearQuestions: () => set({ questions: [] }),
  }),
);


    