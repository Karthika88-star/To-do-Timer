'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { Menu, X, LayoutDashboard, ListTodo, CheckCircle2, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/themeContext';
import { AccountMenu } from './AccountMenu';

function HeaderContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get('view');
  const { toggleTheme, isDark, mounted } = useTheme();

  // If in distraction-free focus screen, keep header minimal/invisible
  const isFocusScreen = pathname.includes('/focus');
  if (isFocusScreen) {
    return null;
  }

  const isDashboardActive = pathname === '/dashboard' && (!view || view === 'dashboard');
  const isMyTasksActive = (pathname === '/dashboard' && view === 'my-tasks') || (pathname.startsWith('/tasks') && !pathname.includes('/focus'));
  const isCompletedActive = pathname === '/dashboard' && view === 'completed';

  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[var(--surface-sidebar,#0B1715)] border-b border-[var(--border-color,#243A34)] sticky top-0 z-40 transition-colors">
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg overflow-hidden bg-white border border-[var(--border-color,#243A34)] shadow-xs flex items-center justify-center shrink-0">
          <Image
            src="/images/todo-timer-logo.png"
            alt="To-do Timer Logo"
            width={32}
            height={32}
            className="w-full h-full object-contain"
            priority
          />
        </div>
        <span className="font-extrabold text-sm text-[var(--text-primary,#F2F6F1)]">To-do Timer</span>
      </Link>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-[var(--surface-card,#11211F)] border border-[var(--border-color,#243A34)] text-[var(--text-secondary,#A5B5AD)] hover:text-[var(--text-primary,#F2F6F1)]"
          aria-label={mounted && !isDark ? 'Switch to Dark Focus Studio' : 'Switch to warm light theme'}
        >
          {mounted && !isDark ? <Moon className="w-4 h-4 text-emerald-800" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-[var(--surface-card,#11211F)] border border-[var(--border-color,#243A34)] text-[var(--text-secondary,#A5B5AD)] hover:text-[var(--text-primary,#F2F6F1)]"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-[var(--surface-card,#11211F)] border-b border-[var(--border-color,#243A34)] p-4 shadow-2xl z-50 animate-in slide-in-from-top-2">
          <nav className="space-y-2 mb-4">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                isDashboardActive
                  ? 'bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] text-white dark:text-black border-transparent shadow-xs'
                  : 'bg-[var(--surface-elevated,#172B27)] border-[var(--border-color,#243A34)] text-[var(--text-primary,#F2F6F1)]'
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 ${isDashboardActive ? 'text-white dark:text-black' : 'text-[var(--primary-accent,#5ACB91)]'}`} />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/dashboard?view=my-tasks"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                isMyTasksActive
                  ? 'bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] text-white dark:text-black border-transparent shadow-xs'
                  : 'bg-[var(--surface-elevated,#172B27)] border-[var(--border-color,#243A34)] text-[var(--text-primary,#F2F6F1)]'
              }`}
            >
              <ListTodo className={`w-4 h-4 ${isMyTasksActive ? 'text-white dark:text-black' : 'text-[var(--primary-accent,#5ACB91)]'}`} />
              <span>My Tasks</span>
            </Link>
            <Link
              href="/dashboard?view=completed"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                isCompletedActive
                  ? 'bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] text-white dark:text-black border-transparent shadow-xs'
                  : 'bg-[var(--surface-elevated,#172B27)] border-[var(--border-color,#243A34)] text-[var(--text-primary,#F2F6F1)]'
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${isCompletedActive ? 'text-white dark:text-black' : 'text-[var(--primary-accent,#5ACB91)]'}`} />
              <span>Completed</span>
            </Link>
          </nav>

          <AccountMenu placement="bottom" />
        </div>
      )}
    </header>
  );
}

export function Header() {
  return (
    <React.Suspense fallback={null}>
      <HeaderContent />
    </React.Suspense>
  );
}
