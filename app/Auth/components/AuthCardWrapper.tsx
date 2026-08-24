'use client';

import React from 'react';
import LanguageSelector from './LanguageSelector';
import ThemeToggle from './ThemeToggle';

interface AuthCardWrapperProps {
  children: React.ReactNode;
}

export const AuthCardWrapper: React.FC<AuthCardWrapperProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300 relative overflow-hidden">
      {/* Decorative premium gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-yellow-100/30 via-pink-100/20 to-purple-200/30 dark:from-yellow-950/10 dark:via-pink-900/10 dark:to-purple-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-indigo-100/30 via-sky-100/20 to-pink-100/30 dark:from-indigo-950/10 dark:via-sky-950/10 dark:to-pink-900/10 blur-[120px] pointer-events-none" />

      {/* Top Header - Settings */}
      <header className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-end gap-3 z-10">
        <LanguageSelector />
        <ThemeToggle />
      </header>

      {/* Center Auth Card */}
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8 z-10">
        <div className="w-full max-w-[390px] bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-xl sm:shadow-2xl overflow-hidden transition-all duration-300 backdrop-blur-md">
          <div className="px-8 py-10 flex flex-col items-center">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-zinc-400 dark:text-zinc-600 z-10 border-t border-zinc-200/50 dark:border-zinc-800/40">
        <p>&copy; {new Date().getFullYear()} Tajgram. Built with Passion.</p>
      </footer>
    </div>
  );
};
export default AuthCardWrapper;
