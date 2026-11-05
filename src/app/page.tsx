'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/sign-in');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen bg-[var(--bg-app,#091311)] text-[var(--text-primary,#F2F6F1)] flex flex-col items-center justify-center p-6 text-center transition-colors duration-300">
      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border border-[var(--border-color,#243A34)] shadow-lg mb-4 flex items-center justify-center animate-pulse">
        <Image
          src="/images/todo-timer-logo.png"
          alt="To-do Timer Logo"
          width={64}
          height={64}
          className="w-full h-full object-contain"
          priority
        />
      </div>
      <h2 className="text-base font-bold text-[var(--text-primary,#F2F6F1)]">To-do Timer</h2>
      <p className="text-xs text-[var(--text-secondary,#A5B5AD)] mt-1">Preparing your focus workspace...</p>
    </div>
  );
}
