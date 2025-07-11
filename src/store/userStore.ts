
"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  rollNo: string;
  name: string;
  // cnic: string; // Removed CNIC
}

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'user-storage', // Name of the item in storage (must be unique)
      storage: createJSONStorage(() => sessionStorage), // Persist to sessionStorage
    }
  )
);
