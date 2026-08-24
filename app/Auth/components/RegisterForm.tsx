'use client';

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';

export const RegisterForm: React.FC = () => {
  const { t } = useTranslation();
  const { register, error: apiError, clearError } = useAuth();

  const [userName, setUserName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    userName?: string;
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const errors: typeof validationErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!userName.trim()) {
      errors.userName = t('auth.validation.username_required');
    }
    if (!fullName.trim()) {
      errors.fullName = t('auth.validation.fullname_required');
    }
    if (!email.trim()) {
      errors.email = t('auth.validation.email_required');
    } else if (!emailRegex.test(email)) {
      errors.email = t('auth.validation.email_invalid');
    }
    if (!password) {
      errors.password = t('auth.validation.password_required');
    } else if (password.length < 6) {
      errors.password = t('auth.validation.password_short');
    }
    if (!confirmPassword) {
      errors.confirmPassword = t('auth.validation.confirm_password_required');
    } else if (password !== confirmPassword) {
      errors.confirmPassword = t('auth.validation.passwords_match');
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
      await register({
        userName,
        fullName,
        email,
        password,
        confirmPassword,
      });
    } catch (err) {
      console.error('Registration failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTranslatedError = (errKey: string) => {
    if (!errKey) return null;
    if (errKey.toLowerCase().includes('exist') || errKey.toLowerCase().includes('already') || errKey.toLowerCase().includes('conflict')) {
      return t('auth.errors.conflict_user');
    }
    return t('auth.errors.unknown');
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Premium Typographic Logo */}
      <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-2 select-none font-sans leading-normal">
        {t('auth.register.title')}
      </h1>
      <p className="text-zinc-500 dark:text-zinc-400 text-sm text-center mb-8 px-2">
        {t('auth.register.subtitle')}
      </p>

      {/* API / Backend Error Message */}
      {apiError && (
        <div className="w-full p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm text-center animate-shake">
          {getTranslatedError(apiError)}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        {/* Username */}
        <div className="w-full">
          <input
            type="text"
            placeholder={t('auth.register.username_placeholder')}
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

        {/* Full Name */}
        <div className="w-full">
          <input
            type="text"
            placeholder={t('auth.register.fullname_placeholder')}
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (validationErrors.fullName) {
                setValidationErrors((prev) => ({ ...prev, fullName: undefined }));
              }
            }}
            disabled={isSubmitting}
            className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-zinc-900 text-sm outline-none transition-all duration-200 ${
              validationErrors.fullName
                ? 'border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/50'
                : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-4 focus:ring-zinc-100 dark:focus:ring-zinc-900/50'
            }`}
          />
          {validationErrors.fullName && (
            <span className="text-xs text-red-500 mt-1 block pl-1">
              {validationErrors.fullName}
            </span>
          )}
        </div>

        {/* Email */}
        <div className="w-full">
          <input
            type="email"
            placeholder={t('auth.register.email_placeholder')}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (validationErrors.email) {
                setValidationErrors((prev) => ({ ...prev, email: undefined }));
              }
            }}
            disabled={isSubmitting}
            className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-zinc-900 text-sm outline-none transition-all duration-200 ${
              validationErrors.email
                ? 'border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/50'
                : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-4 focus:ring-zinc-100 dark:focus:ring-zinc-900/50'
            }`}
          />
          {validationErrors.email && (
            <span className="text-xs text-red-500 mt-1 block pl-1">
              {validationErrors.email}
            </span>
          )}
        </div>

        {/* Password */}
        <div className="w-full relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder={t('auth.register.password_placeholder')}
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

        {/* Confirm Password */}
        <div className="w-full relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder={t('auth.register.confirm_password_placeholder')}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (validationErrors.confirmPassword) {
                setValidationErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }
            }}
            disabled={isSubmitting}
            className={`w-full pl-4 pr-11 py-3 rounded-xl border bg-white dark:bg-zinc-900 text-sm outline-none transition-all duration-200 ${
              validationErrors.confirmPassword
                ? 'border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/50'
                : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-4 focus:ring-zinc-100 dark:focus:ring-zinc-900/50'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          {validationErrors.confirmPassword && (
            <span className="text-xs text-red-500 mt-1 block pl-1">
              {validationErrors.confirmPassword}
            </span>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-yellow-500 via-pink-500 to-purple-600 text-white font-semibold text-sm hover:opacity-95 focus:outline-none focus:ring-4 focus:ring-pink-200 dark:focus:ring-pink-900/30 transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t('auth.register.signing_up')}</span>
            </>
          ) : (
            <span>{t('auth.register.button')}</span>
          )}
        </button>
      </form>

      {/* Redirect to login */}
      <div className="w-full mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800/80 text-center">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          {t('auth.register.have_account')}{' '}
          <Link
            href="/Auth/login"
            className="font-bold text-pink-500 hover:text-pink-600 dark:text-pink-400 dark:hover:text-pink-300 transition-colors"
          >
            {t('auth.register.log_in')}
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
export default RegisterForm;
