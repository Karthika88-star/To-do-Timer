'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles } from 'lucide-react';
import { MajorTask } from '@/types';
import { taskService } from '@/lib/services/taskService';

interface CreateMajorTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (task: MajorTask) => void;
  userId?: string;
}

export function CreateMajorTaskModal({
  isOpen,
  onClose,
  onCreated,
  userId,
}: CreateMajorTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

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

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setError('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!title.trim()) {
      setError('Major task title is required.');
      return;
    }

    if (!userId) {
      setError('You must be signed in to create tasks.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newTask = await taskService.createMajorTask(title.trim(), description.trim(), userId);
      if (newTask) {
        onCreated(newTask);
        setTitle('');
        setDescription('');
        setError('');
        onClose();
      } else {
        setError('Failed to create task. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
      role="dialog"
      aria-labelledby="create-task-heading"
      aria-modal="true"
    >
      <div
        className="bg-[var(--surface-card,#11211F)] text-[var(--text-primary,#F2F6F1)] rounded-2xl border border-[var(--border-color,#243A34)] w-full max-w-lg shadow-2xl p-6 relative overflow-hidden"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color,#243A34)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--surface-elevated,#172B27)] text-[var(--primary-accent,#5ACB91)] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 id="create-task-heading" className="text-base font-bold text-[var(--text-primary,#F2F6F1)]">
                Create Major Task
              </h2>
              <p className="text-xs text-[var(--text-secondary,#A5B5AD)]">Define your high-level objective</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-[var(--surface-elevated,#172B27)] text-[var(--text-secondary,#A5B5AD)] hover:text-[var(--text-primary,#F2F6F1)] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary,#F2F6F1)] mb-1.5">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              placeholder="e.g., Client Architecture Proposal & Sprint Breakdown"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              className="w-full px-3.5 py-2.5 text-sm bg-[var(--surface-main,#0B1715)] border border-[var(--border-color,#243A34)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent,#5ACB91)] text-[var(--text-primary,#F2F6F1)] placeholder:text-[var(--text-secondary,#A5B5AD)]"
              maxLength={120}
              required
            />
            {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary,#F2F6F1)] mb-1.5">
              Description <span className="text-[var(--text-muted,#6B7C74)] font-normal">(Optional context)</span>
            </label>
            <textarea
              placeholder="Outline the outcome or key criteria for this focus session..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm bg-[var(--surface-main,#0B1715)] border border-[var(--border-color,#243A34)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent,#5ACB91)] text-[var(--text-primary,#F2F6F1)] placeholder:text-[var(--text-secondary,#A5B5AD)] resize-none"
              maxLength={300}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--border-color,#243A34)]">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-[var(--text-secondary,#A5B5AD)] hover:bg-[var(--surface-elevated,#172B27)] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white dark:text-black bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] hover:opacity-90 rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create & Add Mini-Tasks'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
