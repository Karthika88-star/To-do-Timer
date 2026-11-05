'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, Coffee } from 'lucide-react';
import { MiniTask } from '@/types';

interface MiniTaskModalProps {
  isOpen: boolean;
  editingTask: MiniTask | null;
  onClose: () => void;
  onSave: (data: {
    title: string;
    durationMinutes: number;
    hasBreak: boolean;
    breakDurationMinutes: number;
  }) => void;
}

interface MiniTaskFormProps {
  editingTask: MiniTask | null;
  onClose: () => void;
  onSave: (data: {
    title: string;
    durationMinutes: number;
    hasBreak: boolean;
    breakDurationMinutes: number;
  }) => void;
}

function MiniTaskForm({ editingTask, onClose, onSave }: MiniTaskFormProps) {
  const [title, setTitle] = useState(editingTask?.title || '');
  const [hours, setHours] = useState(() => {
    if (!editingTask) return '0';
    return Math.floor(editingTask.durationMinutes / 60).toString();
  });
  const [minutes, setMinutes] = useState(() => {
    if (!editingTask) return '25';
    return (editingTask.durationMinutes % 60).toString();
  });
  const [hasBreak, setHasBreak] = useState(editingTask?.hasBreak || false);
  const [breakMinutes, setBreakMinutes] = useState(
    editingTask?.breakDurationMinutes?.toString() || '5'
  );
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');

    // Validation 1: Required title
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Mini-task title is required.');
      return;
    }

    // Validation 2: Work duration (1 minute to 24 hours)
    const h = parseInt(hours, 10) || 0;
    const m = parseInt(minutes, 10) || 0;
    const totalMinutes = h * 60 + m;

    if (totalMinutes < 1) {
      setError('Work duration must be at least 1 minute.');
      return;
    }

    if (totalMinutes > 1440) {
      setError('Work duration cannot exceed 24 hours (1440 minutes).');
      return;
    }

    // Validation 3: Optional break duration (must be positive if enabled)
    let finalBreakMinutes = 0;
    if (hasBreak) {
      finalBreakMinutes = parseInt(breakMinutes, 10) || 0;
      if (finalBreakMinutes <= 0) {
        setError('Break duration must be a valid positive number of minutes.');
        return;
      }
      if (finalBreakMinutes > 120) {
        setError('Break duration cannot exceed 120 minutes.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      onSave({
        title: trimmedTitle,
        durationMinutes: totalMinutes,
        hasBreak,
        breakDurationMinutes: finalBreakMinutes,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="bg-[var(--surface-card,#11211F)] text-[var(--text-primary,#F2F6F1)] rounded-2xl border border-[var(--border-color,#243A34)] w-full max-w-md shadow-2xl p-6 relative overflow-hidden"
      role="dialog"
      aria-labelledby="mini-modal-title"
      aria-modal="true"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color,#243A34)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--surface-elevated,#172B27)] text-[var(--primary-accent,#5ACB91)] flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h2 id="mini-modal-title" className="text-base font-bold text-[var(--text-primary,#F2F6F1)]">
              {editingTask ? 'Edit Mini-Task' : 'Add Mini-Task'}
            </h2>
            <p className="text-xs text-[var(--text-secondary,#A5B5AD)]">Define duration and optional rest</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-[var(--surface-elevated,#172B27)] text-[var(--text-secondary,#A5B5AD)] hover:text-[var(--text-primary,#F2F6F1)] transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-primary,#F2F6F1)] mb-1.5">
            Mini-Task Name <span className="text-red-500">*</span>
          </label>
          <input
            ref={titleInputRef}
            type="text"
            placeholder="e.g., Draft first 3 sections of copy"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError('');
            }}
            className="w-full px-3.5 py-2.5 text-sm bg-[var(--surface-main,#0B1715)] border border-[var(--border-color,#243A34)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent,#5ACB91)] text-[var(--text-primary,#F2F6F1)] placeholder:text-[var(--text-secondary,#A5B5AD)]"
            maxLength={100}
            required
          />
        </div>

        {/* Work Duration in Hours & Minutes */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-primary,#F2F6F1)] mb-1.5">
            Work Duration <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 bg-[var(--surface-main,#0B1715)] px-3 py-2 rounded-xl border border-[var(--border-color,#243A34)]">
              <input
                type="number"
                min="0"
                max="24"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full text-sm font-bold text-[var(--text-primary,#F2F6F1)] bg-transparent focus:outline-none"
                aria-label="Hours"
              />
              <span className="text-xs text-[var(--text-secondary,#A5B5AD)] font-medium shrink-0">hours</span>
            </div>

            <div className="flex items-center gap-2 bg-[var(--surface-main,#0B1715)] px-3 py-2 rounded-xl border border-[var(--border-color,#243A34)]">
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="w-full text-sm font-bold text-[var(--text-primary,#F2F6F1)] bg-transparent focus:outline-none"
                aria-label="Minutes"
              />
              <span className="text-xs text-[var(--text-secondary,#A5B5AD)] font-medium shrink-0">mins</span>
            </div>
          </div>
          <p className="text-[11px] text-[var(--text-secondary,#A5B5AD)] mt-1">Must be between 1 minute and 24 hours.</p>
        </div>

        {/* Optional Break Toggle */}
        <div className="pt-2 border-t border-[var(--border-color,#243A34)]">
          <label className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-elevated,#172B27)] border border-[var(--border-color,#243A34)] cursor-pointer hover:border-[var(--primary-accent,#5ACB91)]/50 transition-colors">
            <div className="flex items-center gap-2.5">
              <Coffee className="w-4 h-4 text-[var(--primary-accent,#5ACB91)]" />
              <div>
                <span className="text-xs font-bold text-[var(--text-primary,#F2F6F1)] block">Include Rest Break</span>
                <span className="text-[11px] text-[var(--text-secondary,#A5B5AD)] block">Take a pause immediately following this task</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={hasBreak}
              onChange={(e) => setHasBreak(e.target.checked)}
              className="w-4 h-4 accent-[var(--primary-accent,#5ACB91)] rounded cursor-pointer"
            />
          </label>
        </div>

        {/* Break Duration Field */}
        {hasBreak && (
          <div className="p-3 bg-[var(--surface-elevated,#172B27)] rounded-xl border border-[var(--border-color,#243A34)] animate-in fade-in slide-in-from-top-1">
            <label className="block text-xs font-semibold text-[var(--text-primary,#F2F6F1)] mb-1.5">
              Break Duration (Minutes) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2 bg-[var(--surface-main,#0B1715)] px-3 py-2 rounded-xl border border-[var(--border-color,#243A34)]">
              <input
                type="number"
                min="1"
                max="120"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(e.target.value)}
                className="w-full text-sm font-bold text-[var(--text-primary,#F2F6F1)] bg-transparent focus:outline-none"
                aria-label="Break duration in minutes"
              />
              <span className="text-xs text-[var(--text-secondary,#A5B5AD)] font-medium shrink-0">minutes</span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary,#A5B5AD)] mt-1">Recommended: 5 to 10 minutes restorative recharge.</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--border-color,#243A34)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[var(--text-secondary,#A5B5AD)] hover:bg-[var(--surface-elevated,#172B27)] rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 text-xs font-bold text-white dark:text-black bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] hover:opacity-90 rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : editingTask ? 'Save Changes' : 'Add to Sequence'}
          </button>
        </div>
      </form>
    </div>
  );
}

export function MiniTaskModal({
  isOpen,
  editingTask,
  onClose,
  onSave,
}: MiniTaskModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <MiniTaskForm
        key={editingTask ? editingTask.id : 'new_task'}
        editingTask={editingTask}
        onClose={onClose}
        onSave={onSave}
      />
    </div>
  );
}
