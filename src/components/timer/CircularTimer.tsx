'use client';

import React from 'react';
import { TimerPhase } from '@/types';
import { Coffee, Flame, CheckCircle, HelpCircle } from 'lucide-react';

interface CircularTimerProps {
  remainingSeconds: number;
  totalDurationSeconds: number;
  phase: TimerPhase;
  isBreak: boolean;
  miniTaskTitle?: string;
  sequenceNumber?: number;
  totalSequenceCount?: number;
}

export function CircularTimer({
  remainingSeconds,
  totalDurationSeconds,
  phase,
  isBreak,
  miniTaskTitle,
  sequenceNumber,
  totalSequenceCount,
}: CircularTimerProps) {
  // SVG Ring dimensions
  const size = 340;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate proportional progress: 1 = full, 0 = empty
  const progressRatio = totalDurationSeconds > 0
    ? Math.max(0, Math.min(1, remainingSeconds / totalDurationSeconds))
    : 1;

  const strokeDashoffset = circumference * (1 - progressRatio);

  // Format time numerals: HH:MM:SS or MM:SS
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
  };

  const isRunning = phase === 'running' || phase === 'break';
  const isCompleted = phase === 'completed';
  const isDecision = phase === 'decision';

  return (
    <div className="flex flex-col items-center justify-center select-none" role="timer" aria-live="polite">
      {/* Sequence Badge / Phase indicator */}
      <div className="mb-4">
        {isCompleted ? (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--soft-mint,#172B27)] text-[var(--primary-accent,#5ACB91)] text-xs font-bold border border-[var(--primary-accent,#5ACB91)]/30 shadow-xs">
            <CheckCircle className="w-3.5 h-3.5" /> All Mini-Tasks Completed!
          </span>
        ) : isDecision ? (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/30 shadow-xs animate-pulse">
            <HelpCircle className="w-3.5 h-3.5" /> Interval Complete • Choose Next Step
          </span>
        ) : isBreak ? (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--surface-elevated,#172B27)] text-[var(--secondary-accent,#8EE5AD)] text-xs font-bold border border-[var(--border-color,#243A34)] shadow-xs animate-pulse">
            <Coffee className="w-3.5 h-3.5" /> Rest & Recharge Interval
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--soft-mint,#172B27)] text-[var(--primary-accent,#5ACB91)] text-xs font-bold border border-[var(--primary-accent,#5ACB91)]/30 shadow-xs">
            <Flame className="w-3.5 h-3.5" />
            {sequenceNumber && totalSequenceCount
              ? `Step ${sequenceNumber} of ${totalSequenceCount}: Deep Focus`
              : 'Deep Focus Block'}
          </span>
        )}
      </div>

      {/* Circular Ring Container */}
      <div className="relative w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] flex items-center justify-center">
        {/* Soft emerald glow halo around the active ring */}
        {isRunning && (
          <div 
            className="absolute inset-4 rounded-full filter blur-2xl transition-all duration-700 pointer-events-none animate-emerald-glow opacity-80"
            style={{
              backgroundColor: isBreak ? 'var(--secondary-accent, #8EE5AD)' : 'var(--primary-accent, #5ACB91)',
              opacity: 0.15,
            }}
          />
        )}

        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90 transform drop-shadow-md"
        >
          {/* Subtle Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--timer-track, #172B27)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Smooth Dynamic Countdown Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isBreak ? 'var(--secondary-accent, #8EE5AD)' : 'var(--primary-accent, #5ACB91)'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-300 ease-linear"
          />
        </svg>

        {/* Center Content: Numerals & Mini-task preview */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          {/* Remaining Time Numerals */}
          <div className="font-mono text-5xl sm:text-6xl font-black text-[var(--text-primary,#F2F6F1)] tracking-tight leading-none mb-1">
            {isCompleted ? '00:00' : formatTime(remainingSeconds)}
          </div>

          {/* Status text */}
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary,#A5B5AD)] mt-2">
            {isCompleted
              ? 'Sequence Complete'
              : isDecision
              ? 'Time Expired • Decide'
              : phase === 'paused'
              ? 'Paused'
              : isBreak
              ? 'Break Remaining'
              : 'Work Remaining'}
          </p>

          {/* Current Mini-Task Title snippet */}
          {miniTaskTitle && !isCompleted && (
            <p className="text-xs font-semibold text-[var(--text-secondary,#A5B5AD)] mt-3 max-w-[220px] truncate px-3 py-1 rounded-full bg-[var(--surface-elevated,#172B27)] border border-[var(--border-color,#243A34)]">
              {miniTaskTitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
