'use client';

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useAuth();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="relative p-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 focus:outline-none transition-all duration-200 shadow-sm flex items-center justify-center overflow-hidden"
      aria-label="Toggle Theme"
    >
      <div className="relative h-5 w-5 flex items-center justify-center">
        {/* Sun Icon */}
        <Sun
          className={`h-5 w-5 text-yellow-500 absolute transition-all duration-300 transform ${
            theme === 'dark' ? 'translate-y-10 rotate-90 opacity-0' : 'translate-y-0 rotate-0 opacity-100'
          }`}
        />
        {/* Moon Icon */}
        <Moon
          className={`h-5 w-5 text-indigo-400 absolute transition-all duration-300 transform ${
            theme === 'light' ? '-translate-y-10 -rotate-90 opacity-0' : 'translate-y-0 rotate-0 opacity-100'
          }`}
        />
      </div>
    </button>
  );
};
export default ThemeToggle;
