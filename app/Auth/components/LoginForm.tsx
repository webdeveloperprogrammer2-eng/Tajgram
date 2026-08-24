'use client';

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';

export const LoginForm: React.FC = () => {
  const { t } = useTranslation();
  const { login, error: apiError, clearError } = useAuth();
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ userName?: string; password?: string }>({});

  const validate = () => {
    const errors: { userName?: string; password?: string } = {};
    if (!userName.trim()) {
      errors.userName = t('auth.validation.username_required');
    }
    if (!password) {
      errors.password = t('auth.validation.password_required');
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await login({ userName, password });
    } catch (err) {
      console.error('Login failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTranslatedError = (errKey: string) => {
    if (!errKey) return null;
    if (errKey === 'unauthorized' || errKey.toLowerCase().includes('unauthorized') || errKey.toLowerCase().includes('password')) {
      return t('auth.errors.unauthorized');
    }
    return t('auth.errors.unknown');
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Premium Typographic Logo */}
      <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-2 select-none font-sans leading-normal">
        {t('auth.login.title')}
      </h1>
      <p className="text-zinc-500 dark:text-zinc-400 text-sm text-center mb-8 px-2">
        {t('auth.login.subtitle')}
      </p>

      {/* API / Backend Error Message */}
      {apiError && (
        <div className="w-full p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm text-center animate-shake">
          {getTranslatedError(apiError)}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        {/* Username/Email Input */}
        <div className="w-full">
          <input
            type="text"
            placeholder={t('auth.login.username_placeholder')}
            value={userName}
            onChange={(e) => {
              setUserName(e.target.value);
              if (validationErrors.userName) {
                setValidationErrors((prev) => ({ ...prev, userName: undefined }));
              }
            }}
            disabled={isSubmitting}
            className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-zinc-900 text-sm outline-none transition-all duration-200 ${
              validationErrors.userName
                ? 'border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/50'
                : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-4 focus:ring-zinc-100 dark:focus:ring-zinc-900/50'
            }`}
          />
          {validationErrors.userName && (
            <span className="text-xs text-red-500 mt-1 block pl-1">
              {validationErrors.userName}
            </span>
          )}
        </div>

        {/* Password Input */}
        <div className="w-full relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder={t('auth.login.password_placeholder')}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (validationErrors.password) {
                setValidationErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
            disabled={isSubmitting}
            className={`w-full pl-4 pr-11 py-3 rounded-xl border bg-white dark:bg-zinc-900 text-sm outline-none transition-all duration-200 ${
              validationErrors.password
                ? 'border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/50'
                : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-4 focus:ring-zinc-100 dark:focus:ring-zinc-900/50'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          {validationErrors.password && (
            <span className="text-xs text-red-500 mt-1 block pl-1">
              {validationErrors.password}
            </span>
          )}
        </div>

        {/* Forgot Password */}
        <div className="flex justify-end">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert('Password reset link requested. Tokens are printed in backend logs according to API specifications.');
            }}
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            {t('auth.login.forgot_password')}
          </a>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-yellow-500 via-pink-500 to-purple-600 text-white font-semibold text-sm hover:opacity-95 focus:outline-none focus:ring-4 focus:ring-pink-200 dark:focus:ring-pink-900/30 transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t('auth.login.logging_in')}</span>
            </>
          ) : (
            <span>{t('auth.login.button')}</span>
          )}
        </button>
      </form>

      {/* Redirect to register */}
      <div className="w-full mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800/80 text-center">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          {t('auth.login.no_account')}{' '}
          <Link
            href="/Auth/register"
            className="font-bold text-pink-500 hover:text-pink-600 dark:text-pink-400 dark:hover:text-pink-300 transition-colors"
          >
            {t('auth.login.sign_up')}
          </Link>
        </p>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 2;
        }
      `}</style>
    </div>
  );
};
export default LoginForm;
