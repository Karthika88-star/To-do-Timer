'use client';

import React, { useState } from 'react';
import { 
  Clock, 
  PlusCircle, 
  ArrowRight, 
  CheckCircle2, 
  Coffee,
  AlertCircle
} from 'lucide-react';
import { MiniTask } from '@/types';

interface TimerDecisionModalProps {
  isOpen: boolean;
  currentMiniTask: MiniTask | null;
  isFinalTask: boolean;
  onAddExtraTime: (minutes: number) => void;
  onMoveToNext: () => void;
  onFinishMajorTask: () => void;
}

export function TimerDecisionModal({
  isOpen,
  currentMiniTask,
  isFinalTask,
  onAddExtraTime,
  onMoveToNext,
  onFinishMajorTask,
}: TimerDecisionModalProps) {
  const [selectedQuick, setSelectedQuick] = useState<number | null>(null);
  const [customMinutes, setCustomMinutes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !currentMiniTask) return null;

  const handleApplyExtraTime = (mins: number) => {
    if (mins <= 0 || isNaN(mins)) {
      setError('Please provide a positive number of minutes (at least 1 min).');
      return;
    }
    if (mins > 180) {
      setError('Extra time cannot exceed 3 hours (180 minutes).');
      return;
    }
    setIsSubmitting(true);
    setError('');
    onAddExtraTime(mins);
    setIsSubmitting(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customMinutes, 10);
    handleApplyExtraTime(val);
  };

  const hasBreak = currentMiniTask.hasBreak && currentMiniTask.breakDurationMinutes > 0;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      role="dialog"
      aria-labelledby="decision-title"
      aria-modal="true"
    >
      <div className="bg-[var(--surface-card,#11211F)] text-[var(--text-primary,#F2F6F1)] rounded-3xl border border-[var(--border-color,#243A34)] w-full max-w-lg shadow-2xl p-6 sm:p-7 relative overflow-hidden">
        {/* Subtle accent glow */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-[var(--primary-accent,#5ACB91)]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-[var(--border-color,#243A34)]">
          <div className="w-10 h-10 rounded-2xl bg-[var(--primary-accent,#5ACB91)]/15 text-[var(--primary-accent,#5ACB91)] flex items-center justify-center shrink-0 border border-[var(--primary-accent,#5ACB91)]/25">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-[var(--primary-accent,#5ACB91)] block">
              Focus Interval Complete • 00:00
            </span>
            <h2 id="decision-title" className="text-lg font-bold text-[var(--text-primary,#F2F6F1)] leading-tight">
              Ready for the next step?
            </h2>
          </div>
        </div>

        {/* Task Details Banner */}
        <div className="my-4 p-3.5 rounded-2xl bg-[var(--surface-elevated,#172B27)] border border-[var(--border-color,#243A34)]">
          <p className="text-[11px] text-[var(--text-secondary,#A5B5AD)] font-medium">Completed Work Block:</p>
          <p className="text-sm font-semibold text-[var(--text-primary,#F2F6F1)] truncate mt-0.5">
            {currentMiniTask.title}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-secondary,#A5B5AD)]">
            <span>Planned: <strong className="text-[var(--text-primary,#F2F6F1)]">{currentMiniTask.durationMinutes} min</strong></span>
            {currentMiniTask.extraTimeMinutes ? (
              <span>• Added earlier: <strong className="text-[var(--primary-accent,#5ACB91)]">+{currentMiniTask.extraTimeMinutes} min</strong></span>
            ) : null}
            {hasBreak && (
              <span className="inline-flex items-center gap-1 text-[var(--secondary-accent,#8EE5AD)]">
                <Coffee className="w-3 h-3" /> {currentMiniTask.breakDurationMinutes}m break configured
              </span>
            )}
          </div>
        </div>

        {/* Option 1: Add Extra Time */}
        <div className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-semibold text-[var(--text-primary,#F2F6F1)] flex items-center gap-1.5 mb-2">
              <PlusCircle className="w-3.5 h-3.5 text-[var(--primary-accent,#5ACB91)]" />
              <span>Need more time on this task?</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 30].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setSelectedQuick(mins);
                    setCustomMinutes('');
                    handleApplyExtraTime(mins);
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                    selectedQuick === mins
                      ? 'bg-[var(--primary-accent,#5ACB91)] text-black border-transparent font-bold'
                      : 'bg-[var(--surface-elevated,#172B27)] border-[var(--border-color,#243A34)] text-[var(--text-primary,#F2F6F1)] hover:border-[var(--primary-accent,#5ACB91)]'
                  }`}
                >
                  +{mins} min
                </button>
              ))}
            </div>
          </div>

          {/* Custom Extra Time Input */}
          <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 mt-2">
            <input
              type="number"
              min="1"
              max="180"
              placeholder="Custom mins"
              value={customMinutes}
              onChange={(e) => {
                setCustomMinutes(e.target.value);
                setSelectedQuick(null);
                if (error) setError('');
              }}
              className="flex-1 px-3 py-2 text-xs bg-[var(--surface-main,#0B1715)] border border-[var(--border-color,#243A34)] rounded-xl text-[var(--text-primary,#F2F6F1)] placeholder:text-[var(--text-secondary,#A5B5AD)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-accent,#5ACB91)]"
              aria-label="Custom extra minutes"
            />
            <button
              type="submit"
              disabled={isSubmitting || !customMinutes}
              className="px-3.5 py-2 text-xs font-semibold bg-[var(--surface-elevated,#172B27)] hover:bg-[var(--border-color,#243A34)] text-[var(--text-primary,#F2F6F1)] rounded-xl border border-[var(--border-color,#243A34)] disabled:opacity-40 transition-colors shrink-0"
            >
              Add Custom
            </button>
          </form>

          {error && (
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-[var(--border-color,#243A34)] my-5" />

        {/* Primary Progression Actions */}
        <div className="space-y-2.5">
          {isFinalTask ? (
            /* Option 3: Finish Major Task (Final Task) */
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onFinishMajorTask}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--primary-accent,#5ACB91)] hover:bg-[var(--secondary-accent,#8EE5AD)] text-black font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4 text-black" />
              <span>Finish Major Task</span>
            </button>
          ) : (
            /* Option 2: Move to Next Task */
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onMoveToNext}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--primary-accent,#5ACB91)] hover:bg-[var(--secondary-accent,#8EE5AD)] text-black font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98]"
            >
              <span>{hasBreak ? 'Mark Done & Start Recharge Break' : 'Mark Done & Move to Next Task'}</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          )}

          {!isFinalTask && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onFinishMajorTask}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-transparent hover:bg-[var(--surface-elevated,#172B27)] border border-[var(--border-color,#243A34)] text-xs font-medium text-[var(--text-secondary,#A5B5AD)] hover:text-[var(--text-primary,#F2F6F1)] transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Whole Major Task Completed</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
