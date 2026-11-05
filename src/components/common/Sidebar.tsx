'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { 
  LayoutDashboard, 
  CheckCircle2, 
  ListTodo, 
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '@/lib/themeContext';
import { AccountMenu } from './AccountMenu';

interface SidebarProps {
  taskCount?: number;
  completedCount?: number;
}

function SidebarNav({ taskCount = 0, completedCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get('view');
  const { toggleTheme, isDark, mounted } = useTheme();

  const isDashboardActive = pathname === '/dashboard' && (!view || view === 'dashboard');
  const isMyTasksActive = (pathname === '/dashboard' && view === 'my-tasks') || (pathname.startsWith('/tasks') && !pathname.includes('/focus'));
  const isCompletedActive = pathname === '/dashboard' && view === 'completed';

  const navLinks = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      active: isDashboardActive,
    },
    {
      name: 'My Tasks',
      href: '/dashboard?view=my-tasks',
      icon: ListTodo,
      badge: taskCount > 0 ? taskCount : undefined,
      active: isMyTasksActive,
    },
    {
      name: 'Completed',
      href: '/dashboard?view=completed',
      icon: CheckCircle2,
      badge: completedCount > 0 ? completedCount : undefined,
      active: isCompletedActive,
    },
  ];

  return (
    <aside 
      className="hidden md:flex flex-col justify-between w-64 bg-[var(--surface-sidebar,#0B1715)] border-r border-[var(--border-color,#243A34)] p-5 shrink-0 min-h-screen sticky top-0 z-40 transition-colors"
      aria-label="Main sidebar"
    >
      <div>
        {/* Brand Header with Theme Quick Toggle */}
        <div className="flex items-center justify-between mb-8 px-1">
          <Link 
            href="/dashboard"
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-accent,#5ACB91)] rounded-xl"
          >
            {/* Supplied Website Logo */}
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-[var(--border-color,#243A34)] shadow-md flex items-center justify-center shrink-0">
              <Image
                src="/images/todo-timer-logo.png"
                alt="To-do Timer Logo"
                width={40}
                height={40}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div>
              <span className="font-extrabold text-base text-[var(--text-primary,#F2F6F1)] tracking-tight block leading-tight">
                To-do Timer
              </span>
              <span className="text-[10px] text-[var(--primary-accent,#5ACB91)] font-bold tracking-wider uppercase flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Dark Focus Studio
              </span>
            </div>
          </Link>

          {/* Quick Theme Toggle Icon */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-[var(--surface-card,#11211F)] border border-[var(--border-color,#243A34)] text-[var(--text-secondary,#A5B5AD)] hover:text-[var(--text-primary,#F2F6F1)] hover:border-[var(--primary-accent,#5ACB91)]/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-accent,#5ACB91)]"
            aria-label={mounted && !isDark ? 'Switch to Dark Focus Studio theme' : 'Switch to warm light theme'}
            title={mounted && !isDark ? 'Switch to Dark Focus Studio' : 'Switch to Warm Light theme'}
          >
            {mounted && !isDark ? <Moon className="w-4 h-4 text-emerald-800" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="space-y-1.5" aria-label="Sidebar navigation">
          <p className="px-3 text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted,#6B7C74)] mb-2">
            Workspace
          </p>
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  item.active
                    ? 'bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] text-white dark:text-black shadow-sm'
                    : 'text-[var(--text-secondary,#A5B5AD)] hover:text-[var(--text-primary,#F2F6F1)] hover:bg-[var(--surface-card,#11211F)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${item.active ? 'text-white dark:text-black' : 'text-[var(--primary-accent,#5ACB91)]'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      item.active
                        ? 'bg-black/20 text-white dark:text-black'
                        : 'bg-[var(--surface-elevated,#172B27)] text-[var(--text-secondary,#A5B5AD)] border border-[var(--border-color,#243A34)]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile and Menu */}
      <div className="pt-4 border-t border-[var(--border-color,#243A34)]">
        <AccountMenu placement="top" />
      </div>
    </aside>
  );
}

export function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={
      <aside className="hidden md:flex flex-col justify-between w-64 bg-[var(--surface-sidebar,#0B1715)] border-r border-[var(--border-color,#243A34)] p-5 shrink-0 min-h-screen sticky top-0 z-40">
        <div className="animate-pulse space-y-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-card,#11211F)]" />
          <div className="h-8 bg-[var(--surface-card,#11211F)] rounded-xl" />
        </div>
      </aside>
    }>
      <SidebarNav {...props} />
    </Suspense>
  );
}
