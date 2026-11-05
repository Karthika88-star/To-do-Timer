'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  GripVertical, 
  Check, 
  Clock, 
  Coffee, 
  MoreHorizontal, 
  Edit3, 
  Trash2,
  Plus
} from 'lucide-react';
import { MiniTask } from '@/types';

interface MiniTaskItemProps {
  miniTask: MiniTask;
  index: number;
  onToggleComplete: (id: string, isCompleted: boolean) => void;
  onEdit: (miniTask: MiniTask) => void;
  onDelete: (id: string) => void;
}

export function MiniTaskItem({
  miniTask,
  index,
  onToggleComplete,
  onEdit,
  onDelete,
}: MiniTaskItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: miniTask.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
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

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m} min`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border transition-all ${
        isDragging
          ? 'border-[var(--primary-accent,#5ACB91)] shadow-xl ring-2 ring-[var(--primary-accent,#5ACB91)]/20 z-30 bg-[var(--surface-elevated,#172B27)]'
          : miniTask.isCompleted
          ? 'border-[var(--border-color,#243A34)] bg-[var(--surface-card,#11211F)] opacity-70'
          : 'border-[var(--border-color,#243A34)] bg-[var(--surface-card,#11211F)] hover:border-[var(--primary-accent,#5ACB91)]/40 shadow-xs'
      }`}
    >
      {/* Left: Drag Handle, Sequence Number, Completion Checkbox, Title */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Drag Handle button */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 rounded text-[var(--text-secondary,#A5B5AD)] hover:text-[var(--text-primary,#F2F6F1)] hover:bg-[var(--surface-elevated,#172B27)] cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--primary-accent,#5ACB91)] shrink-0"
          aria-label={`Reorder task: ${miniTask.title}`}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Sequence order number */}
        <span className="text-[11px] font-bold text-[var(--text-muted,#6B7C74)] w-4 text-center shrink-0">
          {index + 1}
        </span>

        {/* Completion checkbox button */}
        <button
          onClick={() => onToggleComplete(miniTask.id, !miniTask.isCompleted)}
          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-accent,#5ACB91)] ${
            miniTask.isCompleted
              ? 'bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] border-[var(--primary-accent,#5ACB91)] text-white dark:text-black font-bold'
              : 'border-[var(--border-color,#243A34)] bg-[var(--surface-main,#0B1715)] hover:border-[var(--primary-accent,#5ACB91)]'
          }`}
          aria-label={miniTask.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {miniTask.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Mini-task name */}
        <span
          className={`text-xs sm:text-sm font-semibold truncate select-none transition-colors ${
            miniTask.isCompleted
              ? 'text-[var(--text-muted,#6B7C74)] line-through'
              : 'text-[var(--text-primary,#F2F6F1)]'
          }`}
          title={miniTask.title}
        >
          {miniTask.title}
        </span>
      </div>

      {/* Right: Duration badges & actions menu */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Extra time indicator if added */}
        {miniTask.extraTimeMinutes ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--soft-mint,#172B27)] text-[var(--primary-accent,#5ACB91)] text-[10px] font-bold border border-[var(--border-color,#243A34)]">
            <Plus className="w-2.5 h-2.5" />
            <span>{miniTask.extraTimeMinutes}m extra</span>
          </span>
        ) : null}

        {/* Optional Break indicator */}
        {miniTask.hasBreak && miniTask.breakDurationMinutes > 0 && (
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--surface-elevated,#172B27)] text-[var(--secondary-accent,#8EE5AD)] text-[10px] font-semibold border border-[var(--border-color,#243A34)]">
            <Coffee className="w-2.5 h-2.5" />
            <span>+{miniTask.breakDurationMinutes}m rest</span>
          </span>
        )}

        {/* Work duration (consistently aligned) */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-elevated,#172B27)] border border-[var(--border-color,#243A34)] text-xs font-bold text-[var(--primary-accent,#5ACB91)] min-w-[70px] justify-center">
          <Clock className="w-3 h-3 text-[var(--secondary-accent,#8EE5AD)]" />
          <span>{formatDuration(miniTask.durationMinutes)}</span>
        </div>

        {/* More Actions Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-[var(--text-secondary,#A5B5AD)] hover:text-[var(--text-primary,#F2F6F1)] hover:bg-[var(--surface-elevated,#172B27)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-accent,#5ACB91)]"
            aria-label="Mini-task actions"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-[var(--surface-card,#11211F)] text-[var(--text-primary,#F2F6F1)] rounded-xl shadow-xl border border-[var(--border-color,#243A34)] p-1 z-30 animate-in fade-in">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(miniTask);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[var(--text-primary,#F2F6F1)] hover:bg-[var(--surface-elevated,#172B27)] rounded-lg text-left"
              >
                <Edit3 className="w-3.5 h-3.5 text-[var(--primary-accent,#5ACB91)]" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(miniTask.id);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-500/10 rounded-lg text-left"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
