'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/Auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          {/* Instagram logo loader / simple pulse */}
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 p-0.5 animate-pulse">
            <div className="h-full w-full rounded-[14px] bg-white dark:bg-zinc-900 flex items-center justify-center">
              <div className="h-8 w-8 rounded-lg border-[3px] border-zinc-950 dark:border-white relative flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-zinc-950 dark:bg-white absolute top-1 right-1"></div>
                <div className="h-4.5 w-4.5 rounded-full border-[3px] border-zinc-950 dark:border-white"></div>
              </div>
            </div>
          </div>
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div className="h-full w-12 animate-[loading_1.5s_infinite_ease-in-out] rounded-full bg-gradient-to-r from-yellow-500 via-pink-500 to-purple-600"></div>
          </div>
        </div>
        <style jsx global>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Prevents flashing children while redirecting
  }

  return <>{children}</>;
};
export default ProtectedRoute;
