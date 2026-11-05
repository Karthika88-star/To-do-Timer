'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TasksPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard?view=my-tasks');
  }, [router]);

  return (
    <div className="min-h-screen bg-[var(--bg-app,#091311)] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[var(--primary-accent,#5ACB91)] border-t-transparent animate-spin" />
    </div>
  );
}

