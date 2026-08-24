'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Globe, ChevronDown, Check } from 'lucide-react';

// Premium SVG flag components to ensure cross-platform visual consistency (e.g. on Windows)
const TJFlag = () => (
  <svg viewBox="0 0 14 7" className="w-5 h-3.5 rounded-sm shadow-sm object-cover border border-zinc-200/50 dark:border-zinc-800/50 flex-shrink-0">
    <rect width="14" height="2" fill="#CC0A2C"/>
    <rect width="14" height="3" y="2" fill="#FFFFFF"/>
    <rect width="14" height="2" y="5" fill="#00975E"/>
    <g fill="#F1B517" transform="translate(7, 3.5) scale(0.32)">
      <path d="M -3 2 L 3 2 L 4 -1 L 1.5 0 L 0 -3 L -1.5 0 L -4 -1 Z" />
      <path d="M 0 1 A 1.8 1.8 0 1 0 0 1.01 Z" />
      <circle cx="-5" cy="-2" r="0.4"/>
      <circle cx="-3" cy="-4" r="0.4"/>
      <circle cx="-1" cy="-5" r="0.4"/>
      <circle cx="1" cy="-5" r="0.4"/>
      <circle cx="3" cy="-4" r="0.4"/>
      <circle cx="5" cy="-2" r="0.4"/>
      <circle cx="0" cy="-5.5" r="0.4"/>
    </g>
  </svg>
);

const RUFlag = () => (
  <svg viewBox="0 0 9 6" className="w-5 h-3.5 rounded-sm shadow-sm object-cover border border-zinc-200/50 dark:border-zinc-800/50 flex-shrink-0">
    <rect width="9" height="2" fill="#FFFFFF"/>
    <rect width="9" height="2" y="2" fill="#0039A6"/>
    <rect width="9" height="2" y="4" fill="#D52B1E"/>
  </svg>
);

const GBFlag = () => (
  <svg viewBox="0 0 60 30" className="w-5 h-3.5 rounded-sm shadow-sm object-cover border border-zinc-200/50 dark:border-zinc-800/50 flex-shrink-0">
    <rect width="60" height="30" fill="#012169"/>
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFF" strokeWidth="6"/>
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/>
    <path d="M0,15 L60,15 M30,0 L30,30" stroke="#FFF" strokeWidth="10"/>
    <path d="M0,15 L60,15 M30,0 L30,30" stroke="#C8102E" strokeWidth="6"/>
  </svg>
);

export const LanguageSelector: React.FC = () => {
  const { language, changeLanguage } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'tj', name: 'Тоҷикӣ', flag: <TJFlag /> },
    { code: 'ru', name: 'Русский', flag: <RUFlag /> },
    { code: 'en', name: 'English', flag: <GBFlag /> },
  ] as const;

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all duration-300 shadow-sm cursor-pointer select-none
          bg-white dark:bg-zinc-900/90
          text-zinc-800 dark:text-zinc-200
          border-zinc-200 dark:border-zinc-800
          hover:bg-zinc-50 dark:hover:bg-zinc-800/80
          hover:border-zinc-300 dark:hover:border-zinc-700
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500/20 dark:focus:ring-offset-zinc-950
          ${isOpen ? 'ring-2 ring-zinc-500/20 dark:ring-offset-zinc-950 border-zinc-300 dark:border-zinc-700' : ''}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          {currentLang.flag}
          <span className="hidden sm:inline-block">{currentLang.name}</span>
          <span className="inline-block sm:hidden uppercase text-xs tracking-wider">{currentLang.code}</span>
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Options */}
      <div
        className={`absolute right-0 mt-2 w-44 origin-top-right rounded-2xl border bg-white dark:bg-zinc-900 p-1.5 shadow-xl focus:outline-none z-50 transition-all duration-300 ease-out
          border-zinc-200 dark:border-zinc-800
          ${isOpen 
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto visible' 
            : 'opacity-0 -translate-y-2 scale-95 pointer-events-none invisible'
          }`}
        role="menu"
        aria-orientation="vertical"
      >
        <div className="py-1 flex flex-col gap-0.5">
          {languages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  changeLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all duration-200 cursor-pointer select-none
                  ${isSelected
                    ? 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-white'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                role="menuitem"
              >
                <span className="flex items-center gap-2.5">
                  {lang.flag}
                  <span>{lang.name}</span>
                </span>
                {isSelected && (
                  <Check className="h-4 w-4 text-zinc-800 dark:text-zinc-200" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;

