"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface TestConfig {
  timer: number; // in seconds
  questionLimit: number;
  passingPercentage: number;
}

interface TestConfigState {
  config: TestConfig;
  setConfig: (newConfig: Partial<TestConfig>) => void;
}

const initialConfig: TestConfig = {
  timer: 600, // Default 10 minutes
  questionLimit: 10,
  passingPercentage: 70,
};

export const useTestConfigStore = create<TestConfigState>()(
  persist(
    (set) => ({
      config: initialConfig,
      setConfig: (newConfig) =>
        set((state) => ({ config: { ...state.config, ...newConfig } })),
    }),
    {
      name: 'test-config-storage', // Unique name for storage
      storage: createJSONStorage(() => sessionStorage), // Persist to sessionStorage
    }
  )
);
