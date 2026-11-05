'use client';

import React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { Mascot } from './Mascot';

interface EmptyStateProps {
  onAddMiniTask: () => void;
  title?: string;
  description?: string;
  buttonLabel?: string;
}

export function EmptyState({
  onAddMiniTask,
  title = "No tasks here yet.",
  description = "Let's turn your goals into small steps.",
  buttonLabel = "Add Your First Mini-Task",
}: EmptyStateProps) {
  const { user } = useAuth();
  const displayName = user?.name ? user.name.split(' ')[0] : 'friend';

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center max-w-lg mx-auto bg-[var(--surface-card,#11211F)] rounded-3xl border border-[var(--border-color,#243A34)] shadow-xs my-6 transition-colors">
      {/* Productivity Empty State Illustration */}
      <div className="mb-4">
        <Mascot variant="empty" size="md" alt="Girl studying at her desk with laptop and notebook against blue background" />
      </div>

      {/* Personalized Greeting */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--soft-mint,#172B27)] text-[var(--primary-accent,#5ACB91)] text-xs font-semibold mb-3 border border-[var(--border-color,#243A34)]">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Hey, {displayName}!</span>
      </div>

      <h3 className="text-xl font-bold text-[var(--text-primary,#F2F6F1)] tracking-tight mb-2">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-[var(--text-secondary,#A5B5AD)] leading-relaxed mb-6 max-w-sm">
        {description}
      </p>

      {/* Clear Action Button */}
      <button
        onClick={onAddMiniTask}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] hover:opacity-90 text-white dark:text-black font-bold text-xs shadow-md transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-accent,#5ACB91)]"
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
        <span>{buttonLabel}</span>
      </button>
    </div>
  );
}
