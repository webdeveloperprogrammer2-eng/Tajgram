'use client';

import React from 'react';
import ProtectedRoute from './Auth/guards/ProtectedRoute';
import { useAuth } from './Auth/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './Auth/components/LanguageSelector';
import ThemeToggle from './Auth/components/ThemeToggle';
import { LogOut, Grid, Bookmark, User, Compass, Heart, Film } from 'lucide-react';
import Image from 'next/image';

function Dashboard() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  // Mock post grid to match premium Instagram profile style
  const mockPosts = [
    { id: 1, ratio: 'aspect-square', gradient: 'from-pink-500 to-rose-500' },
    { id: 2, ratio: 'aspect-square', gradient: 'from-purple-600 to-indigo-600' },
    { id: 3, ratio: 'aspect-square', gradient: 'from-amber-400 to-orange-500' },
    { id: 4, ratio: 'aspect-square', gradient: 'from-emerald-400 to-teal-600' },
    { id: 5, ratio: 'aspect-square', gradient: 'from-blue-500 to-cyan-500' },
    { id: 6, ratio: 'aspect-square', gradient: 'from-violet-600 to-fuchsia-600' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      {/* Premium Navbar */}
      <nav className="sticky top-0 bg-white/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 backdrop-blur-md z-30 transition-colors">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 bg-clip-text text-transparent select-none cursor-pointer">
            Tajgram
          </h1>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <ThemeToggle />
            <button
              onClick={logout}
              className="flex items-center gap-2 p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all font-medium text-sm cursor-pointer"
              title={t('auth.logout')}
            >
              <LogOut className="h-4.5 w-4.5" />
              <span className="hidden sm:inline">{t('auth.logout')}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Profile Header Section */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-16 border-b border-zinc-200 dark:border-zinc-800 pb-12">
          {/* Avatar Icon / Image */}
          <div className="relative">
            <div className="h-24 w-24 sm:h-36 sm:w-36 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 p-1 shadow-lg flex items-center justify-center">
              <div className="h-full w-full rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                {user?.image ? (
                  <Image
                    src={`https://instagram-back-qibs.onrender.com/${user.image}`}
                    alt={user.fullName}
                    width={140}
                    height={140}
                    className="object-cover h-full w-full"
                  />
                ) : (
                  <User className="h-12 w-12 sm:h-20 sm:w-20 text-zinc-400 dark:text-zinc-600" />
                )}
              </div>
            </div>
          </div>
                    <div className="flex-1 flex flex-col gap-4 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-center sm:justify-start">
              <h2 className="text-xl sm:text-2xl font-light">{user?.userName}</h2>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <button className="px-6 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-sm font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors">
                  Edit Profile
                </button>
              </div>
            </div>

            <div className="flex items-center gap-8 justify-center sm:justify-start text-sm sm:text-base">
              <div>
                <span className="font-semibold">{user?.postCount ?? 0}</span>{' '}
                <span className="text-zinc-500 dark:text-zinc-400">{t('auth.profile.posts')}</span>
              </div>
              <div>
                <span className="font-semibold">{user?.subscribersCount ?? 0}</span>{' '}
                <span className="text-zinc-500 dark:text-zinc-400">{t('auth.profile.followers')}</span>
              </div>
              <div>
                <span className="font-semibold">{user?.subscriptionsCount ?? 0}</span>{' '}
                <span className="text-zinc-500 dark:text-zinc-400">{t('auth.profile.following')}</span>
              </div>
            </div>

            {/* Full Name & Bio */}
            <div>
              <h3 className="font-bold text-base">{user?.fullName}</h3>
              <p className="text-sm mt-1 text-zinc-600 dark:text-zinc-400 max-w-md mx-auto sm:mx-0">
                {user?.about || 'No bio description available yet.'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center border-b border-zinc-200 dark:border-zinc-800 mb-8">
          <div className="flex gap-12 text-xs font-bold tracking-widest uppercase">
            <button className="flex items-center gap-2 py-4 border-t border-zinc-900 dark:border-white -mt-[1px] text-zinc-900 dark:text-white">
              <Grid className="h-3.5 w-3.5" />
              <span>Posts</span>
            </button>
            <button className="flex items-center gap-2 py-4 text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors">
              <Film className="h-3.5 w-3.5" />
              <span>Reels</span>
            </button>
            <button className="flex items-center gap-2 py-4 text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors">
              <Bookmark className="h-3.5 w-3.5" />
              <span>Saved</span>
            </button>
            <button className="flex items-center gap-2 py-4 text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors">
              <Compass className="h-3.5 w-3.5" />
              <span>Tagged</span>
            </button>
          </div>
        </div>

        {/* Media Grid */}
        <div className="grid grid-cols-3 gap-1 sm:gap-6">
          {mockPosts.map((post) => (
            <div
              key={post.id}
              className={`relative ${post.ratio} rounded-lg overflow-hidden group bg-gradient-to-tr ${post.gradient} shadow-sm border border-zinc-200/20 cursor-pointer`}
            >
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-6 text-white font-bold text-sm sm:text-base">
                <span className="flex items-center gap-1.5">
                  <Heart className="h-5 w-5 fill-current" />
                  124
                </span>
                <span className="flex items-center gap-1.5">
                  <Compass className="h-5 w-5" />
                  12
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
