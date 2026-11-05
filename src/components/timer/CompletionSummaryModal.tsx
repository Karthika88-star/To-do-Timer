'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  RotateCcw, 
  LayoutDashboard,
  ArrowRight
} from 'lucide-react';
import { triggerCelebrationConfetti } from '@/components/common/Confetti';
import { Mascot } from '@/components/common/Mascot';
import { taskService } from '@/lib/services/taskService';

interface CompletionSummaryModalProps {
  isOpen: boolean;
  majorTaskId: string;
  majorTaskTitle: string;
  completedCount: number;
  totalFocusedMinutes: number;
  userId?: string;
  onRestart: () => void;
  onClose: () => void;
}

export function CompletionSummaryModal({
  isOpen,
  majorTaskId,
  majorTaskTitle,
  completedCount,
  totalFocusedMinutes,
  userId,
  onRestart,
  onClose,
}: CompletionSummaryModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (isOpen && userId) {
      triggerCelebrationConfetti();
      // Ensure major task is marked completed in database with timestamp
      taskService.completeMajorTask(majorTaskId, userId);
    }
  }, [isOpen, majorTaskId, userId]);

  if (!isOpen) return null;

  const hours = Math.floor(totalFocusedMinutes / 60);
  const minutes = totalFocusedMinutes % 60;
  const formattedTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes} mins`;

  const handleGoToDashboard = () => {
    if (userId) {
      taskService.completeMajorTask(majorTaskId, userId);
    }
    onClose();
    router.push('/dashboard');
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      role="dialog"
      aria-labelledby="summary-title"
      aria-modal="true"
    >
      <div 
        className="bg-[var(--surface-card,#11211F)] rounded-3xl border border-[var(--border-color,#243A34)] w-full max-w-md shadow-2xl p-6 sm:p-7 text-center relative overflow-hidden text-[var(--text-primary,#F2F6F1)]"
      >
        {/* Decorative background glow */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-[var(--primary-accent,#5ACB91)]/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-[var(--secondary-accent,#8EE5AD)]/15 rounded-full blur-2xl pointer-events-none" />

        {/* Celebrating Illustration */}
        <div className="mb-3 flex justify-center">
          <Mascot variant="celebrating" size="md" alt="Girl celebrating with hands raised against pink background" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--soft-mint,#172B27)] text-[var(--primary-accent,#5ACB91)] text-xs font-bold mb-2 border border-[var(--border-color,#243A34)]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Major Objective Complete!</span>
        </div>

        <h2 id="summary-title" className="text-xl font-bold tracking-tight">
          Outstanding Focused Work!
        </h2>
        <p className="text-xs text-[var(--text-secondary,#A5B5AD)] mt-1.5 max-w-xs mx-auto leading-relaxed">
          You finished every planned step for{' '}
          <span className="font-semibold text-[var(--text-primary,#F2F6F1)]">“{majorTaskTitle}”</span>.
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 my-5">
          <div className="bg-[var(--surface-elevated,#172B27)] p-3 rounded-2xl border border-[var(--border-color,#243A34)]">
            <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-secondary,#A5B5AD)] mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary-accent,#5ACB91)]" />
              <span>Mini-Tasks</span>
            </div>
            <p className="text-xl font-bold text-[var(--primary-accent,#5ACB91)]">
              {completedCount} Done
            </p>
          </div>

          <div className="bg-[var(--surface-elevated,#172B27)] p-3 rounded-2xl border border-[var(--border-color,#243A34)]">
            <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-secondary,#A5B5AD)] mb-1">
              <Clock className="w-3.5 h-3.5 text-[var(--primary-accent,#5ACB91)]" />
              <span>Deep Focus</span>
            </div>
            <p className="text-xl font-bold text-[var(--primary-accent,#5ACB91)]">
              {formattedTime}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Primary: Return to Dashboard */}
          <button
            onClick={handleGoToDashboard}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] hover:opacity-90 text-white dark:text-black font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98]"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Finish & Return to Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                onClose();
                onRestart();
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[var(--surface-elevated,#172B27)] hover:bg-[var(--border-color,#243A34)] border border-[var(--border-color,#243A34)] text-xs font-semibold text-[var(--text-primary,#F2F6F1)] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[var(--primary-accent,#5ACB91)]" />
              <span>Restart Flow</span>
            </button>

            <button
              onClick={() => {
                onClose();
                router.push(`/tasks/${majorTaskId}`);
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[var(--surface-elevated,#172B27)] hover:bg-[var(--border-color,#243A34)] border border-[var(--border-color,#243A34)] text-xs font-semibold text-[var(--text-primary,#F2F6F1)] transition-colors"
            >
              <span>View Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
