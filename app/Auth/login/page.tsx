'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import AuthCardWrapper from '../components/AuthCardWrapper';
import LoginForm from '../components/LoginForm';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-zinc-200 border-t-pink-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Prevents showing login form while redirecting
  }

  return (
    <AuthCardWrapper>
      <LoginForm />
    </AuthCardWrapper>
  );
}
