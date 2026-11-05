'use client';

import React from 'react';
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  RotateCcw, 
  SkipForward, 
  Volume2, 
  VolumeX 
} from 'lucide-react';
import { TimerPhase } from '@/types';

interface TimerControlsProps {
  phase: TimerPhase;
  isBreak: boolean;
  onStart: () => void;
  onPause: () => void;
  onComplete: () => void;
  onReset: () => void;
  onSkipBreak: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export function TimerControls({
  phase,
  isBreak,
  onStart,
  onPause,
  onComplete,
  onReset,
  onSkipBreak,
  soundEnabled,
  onToggleSound,
}: TimerControlsProps) {
  const isRunning = phase === 'running' || phase === 'break';
  const isCompleted = phase === 'completed';

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
      {/* Primary Control Buttons */}
      <div className="flex items-center justify-center gap-3 w-full">
        {/* Reset button */}
        <button
          onClick={onReset}
          disabled={isCompleted}
          className="p-3.5 rounded-2xl bg-[var(--surface-card,#11211F)] border border-[var(--border-color,#243A34)] hover:border-[var(--primary-accent,#5ACB91)]/40 text-[var(--text-secondary,#A5B5AD)] hover:text-[var(--text-primary,#F2F6F1)] shadow-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-accent,#5ACB91)]"
          title="Reset current step"
          aria-label="Reset current step"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {/* Large Play / Pause button */}
        <button
          onClick={isRunning ? onPause : onStart}
          disabled={isCompleted}
          className={`flex-1 flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl font-bold text-sm sm:text-base shadow-lg transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-accent,#5ACB91)] ${
            isRunning
              ? 'bg-[var(--surface-elevated,#172B27)] border-2 border-[var(--primary-accent,#5ACB91)] text-[var(--primary-accent,#5ACB91)]'
              : 'bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] text-white dark:text-black hover:opacity-90'
          }`}
          aria-label={isRunning ? 'Pause timer' : 'Start or resume timer'}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5 fill-current" />
              <span>Pause Focus</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>{phase === 'paused' ? 'Resume Focus' : 'Start Focus'}</span>
            </>
          )}
        </button>

        {/* Complete Step button */}
        <button
          onClick={isBreak ? onSkipBreak : onComplete}
          disabled={isCompleted}
          className="flex items-center gap-2 py-4 px-5 rounded-2xl bg-[var(--surface-card,#11211F)] hover:bg-[var(--surface-elevated,#172B27)] text-[var(--primary-accent,#5ACB91)] border border-[var(--border-color,#243A34)] font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-accent,#5ACB91)]"
          title={isBreak ? 'End rest and advance to next task' : 'Mark task complete and continue'}
          aria-label={isBreak ? 'End break and advance' : 'Complete task and advance'}
        >
          {isBreak ? (
            <>
              <SkipForward className="w-4 h-4" />
              <span>Skip Rest</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete</span>
            </>
          )}
        </button>
      </div>

      {/* Auxiliary bar: Mute sound and keyboard shortcut reminder */}
      <div className="flex items-center justify-between w-full px-2 text-[11px] text-[var(--text-secondary,#A5B5AD)]">
        <button
          onClick={onToggleSound}
          className="flex items-center gap-1.5 p-1 rounded-lg hover:text-[var(--text-primary,#F2F6F1)] transition-colors"
          aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}
        >
          {soundEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-[var(--primary-accent,#5ACB91)]" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-[var(--text-muted,#6B7C74)]" />
          )}
          <span>{soundEnabled ? 'Audio chime on' : 'Sound muted'}</span>
        </button>

        <span className="hidden sm:inline font-mono text-[10px] bg-[var(--surface-card,#11211F)] px-2.5 py-0.5 rounded border border-[var(--border-color,#243A34)] text-[var(--text-secondary,#A5B5AD)]">
          Space = Pause / Resume
        </span>
      </div>
    </div>
  );
}
