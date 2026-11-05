'use client';

import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
      role="alertdialog"
      aria-labelledby="del-title"
      aria-describedby="del-desc"
    >
      <div
        className="bg-[var(--surface-card,#11211F)] text-[var(--text-primary,#F2F6F1)] rounded-2xl border border-[var(--border-color,#243A34)] w-full max-w-sm shadow-2xl p-6 relative overflow-hidden"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 border border-red-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 id="del-title" className="text-sm font-bold text-[var(--text-primary,#F2F6F1)]">
              {title}
            </h3>
            <p id="del-desc" className="text-xs text-[var(--text-secondary,#A5B5AD)] mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-5 mt-4 border-t border-[var(--border-color,#243A34)]">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary,#A5B5AD)] hover:bg-[var(--surface-elevated,#172B27)] rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-sm active:scale-[0.98]"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
