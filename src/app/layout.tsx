"use client"; // Add this directive at the top

import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter font for clear readability
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { Toaster } from '@/components/ui/toaster'; // Ensure Toaster is imported
import { useEffect, useState } from 'react'; // Import useEffect and useState
import { useUserStore } from '@/store/userStore';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

// Metadata should be exported from a Server Component
// export const metadata: Metadata = {
//   title: 'StudyBuddy Pro',
//   description: 'Your Personal Study Assistant',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const logout = useUserStore((state) => state.logout);

  useEffect(() => {
    // Clear user on every load
    logout();

    // Client-side script to handle theme switching
    const theme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (theme === 'dark' || (!theme && systemPrefersDark)) {
      document.body.classList.add('dark');
      setIsDarkMode(true);
    } else {
      document.body.classList.remove('dark');
      setIsDarkMode(false);
    }

    // Listen for changes in system theme preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) { // Only react to system changes if no explicit theme is set
        if (e.matches) {
          document.body.classList.add('dark');
          setIsDarkMode(true);
        } else {
          document.body.classList.remove('dark');
          setIsDarkMode(false);
        }
      }
    };
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    const newDarkModeStatus = !isDarkMode;
    setIsDarkMode(newDarkModeStatus);
    if (newDarkModeStatus) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AppProvider>
          {children}
          <Toaster /> {/* Ensure Toaster is included here */}
          {/* Theme Toggle Switch */}
          <button
            onClick={toggleTheme}
            className="fixed top-2 right-2 z-[1000] flex items-center justify-center w-10 h-10 rounded-full border border-[hsl(var(--border))] cursor-pointer bg-[hsl(var(--muted))] transition-colors duration-300 shadow focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 md:w-10 md:h-10 md:top-2 md:right-2 sm:absolute sm:top-4 sm:right-4 sm:w-14 sm:h-14 sm:rounded-2xl sm:border-2 sm:shadow-lg"
            style={{
              backgroundColor: isDarkMode ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
            }}
            aria-label="Toggle theme"
            tabIndex={0}
          >
            {/* Sun Icon (Light Mode) */}
            {!isDarkMode && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: '#facc15' }}
              >
                <circle cx="12" cy="12" r="4"></circle>
                <path d="M12 2v2m0 16v2m9-9h-2M5 12H3m14.32-5.68l-1.44 1.44M6.05 17.95l-1.44 1.44m0-11.31l1.44-1.44M17.95 17.95l1.44 1.44"></path>
              </svg>
            )}
            {/* Moon Icon (Dark Mode) */}
            {isDarkMode && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: 'hsl(var(--primary-foreground))' }}
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>
        </AppProvider>
      </body>
    </html>
  );
}
