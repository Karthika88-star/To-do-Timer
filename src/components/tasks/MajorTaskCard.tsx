'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Play,
  ArrowRight,
  Clock,
  CheckCircle2,
  ListOrdered,
  MoreHorizontal,
  Trash2,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { MajorTask } from '@/types';
import { isMajorTaskCompleted, isMajorTaskInProgress } from '@/lib/storage';

interface MajorTaskCardProps {
  task: MajorTask;
  onDelete?: (id: string) => void;
  onReuse?: (task: MajorTask) => void;
}

export function MajorTaskCard({ task, onDelete, onReuse }: MajorTaskCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const miniTasks = task.miniTasks || [];
  const totalCount = miniTasks.length;
  const completedCount = miniTasks.filter(m => m.isCompleted).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Calculate planned work minutes + break minutes
  const totalWorkMinutes = miniTasks.reduce((acc, m) => acc + (m.durationMinutes || 0) + (m.extraTimeMinutes || 0), 0);
  const totalBreakMinutes = miniTasks.reduce((acc, m) => acc + (m.hasBreak ? m.breakDurationMinutes || 0 : 0), 0);
  const totalDurationMinutes = totalWorkMinutes + totalBreakMinutes;

  const formatDuration = (mins: number) => {
    if (mins <= 0) return '0 min';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const formatCompletionDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const isCompleted = isMajorTaskCompleted(task);
  const isInProgress = isMajorTaskInProgress(task);

  // Navigate to task details when clicking card surface
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!task?.id) return;
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Prevent navigation if click originated inside an interactive child control
    if (target.closest('button, a, input, select, textarea, [data-interactive="true"]')) {
      return;
    }

    router.push(`/tasks/${task.id}`);
  };

  // Keyboard accessibility: Enter or Space on card navigates to task details
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!task?.id) return;
    const target = e.target as HTMLElement | null;
    if (target && target.closest('button, a, input, select, textarea, [data-interactive="true"]')) {
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      router.push(`/tasks/${task.id}`);
    }
  };

  return (
    <div 
      role="article"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      aria-label={`Major task: ${task.title}. Click to view details and sequence organizer.`}
      className="group bg-[var(--surface-card,#11211F)] rounded-2xl border border-[var(--border-color,#243A34)] hover:border-[var(--primary-accent,#5ACB91)]/50 shadow-xs hover:shadow-lg transition-all p-5 flex flex-col justify-between relative overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-accent,#5ACB91)]"
    >
      <div>
        {/* Header Row: Status badge and more menu */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide border ${isCompleted
              ? 'bg-[var(--soft-mint,#172B27)] text-[var(--primary-accent,#5ACB91)] border-[var(--primary-accent,#5ACB91)]/30'
              : isInProgress
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                : 'bg-[var(--surface-elevated,#172B27)] text-[var(--text-secondary,#A5B5AD)] border-[var(--border-color,#243A34)]'
              }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-[var(--primary-accent,#5ACB91)]" />
                <span>Completed</span>
              </>
            ) : isInProgress ? (
              <>
                <Clock className="w-3 h-3 text-amber-500" />
                <span>In Progress</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary,#A5B5AD)]" />
                <span>Not Started</span>
              </>
            )}
          </span>

          <div className="relative" ref={menuRef} data-interactive="true">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1.5 rounded-lg text-[var(--text-secondary,#A5B5AD)] hover:text-[var(--text-primary,#F2F6F1)] hover:bg-[var(--surface-elevated,#172B27)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-accent,#5ACB91)]"
              aria-label="Major task options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div 
                className="absolute right-0 top-full mt-1 w-40 bg-[var(--surface-card,#11211F)] text-[var(--text-primary,#F2F6F1)] rounded-xl shadow-xl border border-[var(--border-color,#243A34)] p-1 z-20 animate-in fade-in"
                data-interactive="true"
                onClick={(e) => e.stopPropagation()}
              >
                <Link
                  href={`/tasks/${task.id}`}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-[var(--text-primary,#F2F6F1)] hover:bg-[var(--surface-elevated,#172B27)] rounded-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--primary-accent,#5ACB91)]" />
                  <span>Open Details</span>
                </Link>

                {isCompleted && onReuse && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onReuse(task);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[var(--primary-accent,#5ACB91)] hover:bg-[var(--surface-elevated,#172B27)] rounded-lg text-left font-semibold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reuse Task</span>
                  </button>
                )}

                {onDelete && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(task.id);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-500/10 rounded-lg text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Task</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Task Title */}
        <Link 
          href={`/tasks/${task.id}`} 
          className="group/title block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-accent,#5ACB91)] rounded-sm"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <h3 className="font-extrabold text-base text-[var(--text-primary,#F2F6F1)] group-hover/title:text-[var(--primary-accent,#5ACB91)] transition-colors leading-snug line-clamp-2">
            {task.title}
          </h3>
        </Link>

        {/* Task Description */}
        <p className="text-xs text-[var(--text-secondary,#A5B5AD)] mt-1.5 line-clamp-2 leading-relaxed min-h-[32px]">
          {task.description || 'No description provided.'}
        </p>

        {/* Meta Stats Badges */}
        <div className="flex flex-wrap items-center gap-2.5 mt-4 text-xs text-[var(--text-secondary,#A5B5AD)]">
          <div className="flex items-center gap-1.5 bg-[var(--surface-elevated,#172B27)] px-2.5 py-1 rounded-lg border border-[var(--border-color,#243A34)]">
            <ListOrdered className="w-3.5 h-3.5 text-[var(--primary-accent,#5ACB91)]" />
            <span className="font-medium text-[11px]">
              {totalCount} {totalCount === 1 ? 'mini-task' : 'mini-tasks'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-[var(--surface-elevated,#172B27)] px-2.5 py-1 rounded-lg border border-[var(--border-color,#243A34)]">
            <Clock className="w-3.5 h-3.5 text-[var(--primary-accent,#5ACB91)]" />
            <span className="font-medium text-[11px]">
              {formatDuration(totalDurationMinutes)}
            </span>
          </div>

          {task.completedAt && (
            <span className="text-[10px] text-[var(--text-muted,#6B7C74)] font-medium">
              Done {formatCompletionDate(task.completedAt)}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-4 pt-3.5 border-t border-[var(--border-color,#243A34)]">
          <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium text-[var(--text-secondary,#A5B5AD)]">
            <span>Progress</span>
            <span className="text-[var(--text-primary,#F2F6F1)] font-bold">
              {completedCount} / {totalCount} completed ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[var(--surface-elevated,#172B27)] overflow-hidden">
            <div
              className="h-full bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="grid grid-cols-2 gap-2 mt-5 pt-3 border-t border-[var(--border-color,#243A34)]">
        {isCompleted ? (
          /* Completed Task Action: Reuse Task & View Details */
          <>
            <Link
              href={`/tasks/${task.id}`}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[var(--border-color,#243A34)] hover:bg-[var(--surface-elevated,#172B27)] text-xs font-bold text-[var(--text-primary,#F2F6F1)] transition-colors"
            >
              <span>Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={() => onReuse && onReuse(task)}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] hover:opacity-90 text-white dark:text-black shadow-sm transition-all active:scale-[0.98]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reuse Task</span>
            </button>
          </>
        ) : (
          /* Active Task Action: Organize & Start Focus */
          <>
            <Link
              href={`/tasks/${task.id}`}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[var(--border-color,#243A34)] hover:bg-[var(--surface-elevated,#172B27)] text-xs font-bold text-[var(--text-primary,#F2F6F1)] transition-colors"
            >
              <span>Organize</span>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--text-secondary,#A5B5AD)]" />
            </Link>

            <Link
              href={`/tasks/${task.id}/focus`}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold shadow-sm transition-all ${totalCount === 0
                ? 'bg-[var(--surface-elevated,#172B27)] text-[var(--text-muted,#6B7C74)] cursor-not-allowed pointer-events-none'
                : 'bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] hover:opacity-90 text-white dark:text-black active:scale-[0.98]'
                }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Focus</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
