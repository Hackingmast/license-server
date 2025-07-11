"use client";

import React from 'react';

// Currently, this provider doesn't do much, as state is managed by Zustand.
// It's kept here as a placeholder for potential future global context needs
// that might not fit well into specific Zustand stores.
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // You could add other global contexts here if necessary
  return <>{children}</>;
};
