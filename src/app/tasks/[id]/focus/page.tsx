'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  ChevronRight, 
  Coffee, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { MajorTask } from '@/types';
import { storage } from '@/lib/storage';
import { useAuth } from '@/lib/authContext';
import { useTimer } from '@/hooks/useTimer';
import { CircularTimer } from '@/components/timer/CircularTimer';
import { TimerControls } from '@/components/timer/TimerControls';
import { CompletionSummaryModal } from '@/components/timer/CompletionSummaryModal';
import { TimerDecisionModal } from '@/components/timer/TimerDecisionModal';

function FocusTimerContent() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || '';
  const { user, updatePreferences, isLoading } = useAuth();
  const userId = user?.id;

  const [prevId, setPrevId] = useState<string>(id);
  const [prevUserId, setPrevUserId] = useState<string | null>(userId || null);

  const [task, setTask] = useState<MajorTask | null>(() => {
    if (typeof window !== 'undefined' && id && userId) {
      return storage.getTaskById(id, userId);
    }
    return null;
  });

  // Adjust state during render when id or userId changes
  if (id !== prevId || userId !== prevUserId) {
    setPrevId(id);
    setPrevUserId(userId || null);
    const loaded = id && userId ? storage.getTaskById(id, userId) : null;
    setTask(loaded);
  }

  const refreshTask = () => {
    if (!id || !userId) return;
    const fresh = storage.getTaskById(id, userId);
    setTask(fresh);
  };

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [completedStats, setCompletedStats] = useState({
    completedCount: 0,
    focusedMinutes: 0,
  });

  const soundEnabled = user?.preferences?.soundEnabled ?? true;

  const timer = useTimer({
    majorTask: task,
    userId: user?.id,
    soundEnabled,
    onMiniTaskCompleted: () => {
      refreshTask();
    },
    onAllCompleted: (stats) => {
      refreshTask();
      setCompletedStats(stats);
      setShowSummaryModal(true);
    },
  });

  // Keyboard navigation: Space = Pause/Resume, Shift+C = Complete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (timer.isRunning) {
          timer.pause();
        } else {
          timer.start();
        }
      } else if (e.code === 'KeyC' && e.shiftKey) {
        e.preventDefault();
        timer.completeCurrentStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timer]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-app,#091311)] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--primary-accent,#5ACB91)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!task || !task.miniTasks || task.miniTasks.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg-app,#091311)] text-[var(--text-primary,#F2F6F1)] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold tracking-tight">No Mini-Tasks to Focus On</h2>
        <p className="text-xs text-[var(--text-secondary,#A5B5AD)] mt-1.5 mb-6 max-w-sm">
          Please add ordered mini-tasks to this project before launching the countdown sequence.
        </p>
        <Link
          href={`/tasks/${id}`}
          className="px-5 py-2.5 bg-[var(--primary-accent,#5ACB91)] hover:bg-[var(--secondary-accent,#8EE5AD)] text-black text-xs font-bold rounded-xl transition-all shadow-md"
        >
          Add Mini-Tasks
        </Link>
      </div>
    );
  }

  const miniTasks = task.miniTasks;
  const currentMini = timer.currentMiniTask;
  const currentIndex = currentMini
    ? miniTasks.findIndex(m => m.id === currentMini.id)
    : 0;

  // Next mini-task preview
  const nextMiniTask = miniTasks.find(
    (m, idx) => idx > currentIndex && !m.isCompleted
  ) || miniTasks.find(m => !m.isCompleted && m.id !== currentMini?.id);

  // Is this the final unfinished mini-task?
  const isFinalTask = !miniTasks.some(m => !m.isCompleted && m.id !== currentMini?.id);

  // Completed counts
  const completedCount = miniTasks.filter(m => m.isCompleted).length;
  const progressRatio = miniTasks.length > 0 ? (completedCount / miniTasks.length) * 100 : 0;

  const handleReturnClick = () => {
    if (timer.isRunning) {
      setShowExitConfirm(true);
    } else {
      router.push(`/tasks/${task.id}`);
    }
  };

  const handleRestartSequence = () => {
    // Unmark mini tasks to restart sequence fresh
    miniTasks.forEach(m => {
      storage.updateMiniTask(task.id, m.id, { isCompleted: false }, user?.id);
    });
    refreshTask();
    if (miniTasks[0]) {
      timer.selectMiniTask(miniTasks[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app,#091311)] text-[var(--text-primary,#F2F6F1)] flex flex-col justify-between p-4 sm:p-8 select-none relative overflow-hidden transition-colors duration-300">
      {/* Distraction-free ambient emerald background glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[550px] bg-[var(--primary-accent,#5ACB91)]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Breadcrumb Bar */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between relative z-10 pt-2">
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary,#A5B5AD)]">
          <button
            onClick={handleReturnClick}
            className="flex items-center gap-1.5 hover:text-[var(--text-primary,#F2F6F1)] font-semibold transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--primary-accent,#5ACB91)] rounded-lg px-2 py-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Task Overview</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <span className="text-[var(--text-primary,#F2F6F1)] font-semibold truncate max-w-[200px] sm:max-w-xs">
            {task.title}
          </span>
        </div>

        {/* Mini Overall Progress Pill */}
        <div className="flex items-center gap-2 bg-[var(--surface-elevated,#172B27)] px-3.5 py-1.5 rounded-full border border-[var(--border-color,#243A34)] text-xs font-semibold text-[var(--text-primary,#F2F6F1)] shadow-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary-accent,#5ACB91)]" />
          <span>
            {completedCount} of {miniTasks.length} Completed
          </span>
        </div>
      </div>

      {/* Center Stage: Countdown Ring & Controls */}
      <div className="my-auto py-6 flex flex-col items-center justify-center relative z-10 w-full max-w-xl mx-auto">
        {/* Current Mini-Task Title Card */}
        <div className="text-center mb-6 max-w-md mx-auto">
          <p className="text-[11px] uppercase font-extrabold tracking-widest text-[var(--primary-accent,#5ACB91)] mb-1">
            {timer.isBreak ? 'Recharge Interval' : 'Current Focus Step'}
          </p>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary,#F2F6F1)] tracking-tight leading-snug">
            {timer.isBreak ? 'Take a Breath & Recharge' : (currentMini?.title || 'Preparing next step...')}
          </h1>
          {!timer.isBreak && currentMini?.hasBreak && currentMini.breakDurationMinutes > 0 && (
            <p className="text-xs text-[var(--text-secondary,#A5B5AD)] font-semibold mt-1.5 flex items-center justify-center gap-1.5">
              <Coffee className="w-3.5 h-3.5 text-[var(--primary-accent,#5ACB91)]" />
              Followed by a {currentMini.breakDurationMinutes}-minute break
            </p>
          )}
        </div>

        {/* Large Circular Countdown Ring */}
        <div className="mb-8 relative">
          <CircularTimer
            remainingSeconds={timer.remainingSeconds}
            totalDurationSeconds={timer.totalDurationSeconds}
            phase={timer.phase}
            isBreak={timer.isBreak}
            miniTaskTitle={currentMini?.title}
            sequenceNumber={currentIndex + 1}
            totalSequenceCount={miniTasks.length}
          />
        </div>

        {/* Tactile Timer Controls */}
        <div className="w-full max-w-md">
          <TimerControls
            phase={timer.phase}
            isBreak={timer.isBreak}
            onStart={timer.start}
            onPause={timer.pause}
            onComplete={timer.completeCurrentStep}
            onReset={timer.resetCurrentStep}
            onSkipBreak={timer.skipBreak}
            soundEnabled={soundEnabled}
            onToggleSound={() => updatePreferences({ soundEnabled: !soundEnabled })}
          />
        </div>

        {/* Next Mini-Task Preview Card */}
        {nextMiniTask && (
          <div className="w-full max-w-md mt-7 p-3.5 rounded-2xl bg-[var(--surface-card,#11211F)] border border-[var(--border-color,#243A34)] flex items-center justify-between text-xs animate-in fade-in shadow-xs">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-6 h-6 rounded-lg bg-[var(--surface-elevated,#172B27)] text-[var(--primary-accent,#5ACB91)] flex items-center justify-center font-bold text-[10px] border border-[var(--border-color,#243A34)]">
                Next
              </div>
              <div className="truncate">
                <span className="text-[var(--text-muted,#68736C)] text-[10px] block font-medium">Up Next</span>
                <span className="font-semibold text-[var(--text-primary,#F2F6F1)] truncate block">
                  {nextMiniTask.title}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-[var(--primary-accent,#5ACB91)] shrink-0 bg-[var(--surface-elevated,#172B27)] px-2.5 py-1 rounded-lg border border-[var(--border-color,#243A34)]">
              {nextMiniTask.durationMinutes} min
            </span>
          </div>
        )}
      </div>

      {/* Bottom Sequence Progress Bar */}
      <div className="w-full max-w-xl mx-auto pt-4 pb-2 relative z-10">
        <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary,#A5B5AD)] font-medium mb-1.5">
          <span>Overall Sequence Progress</span>
          <span className="font-bold text-[var(--text-primary,#F2F6F1)]">
            {Math.round(progressRatio)}%
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-[var(--surface-elevated,#172B27)] border border-[var(--border-color,#243A34)] overflow-hidden">
          <div
            className="h-full bg-[var(--primary-accent,#5ACB91)] rounded-full transition-all duration-500 ease-out shadow-xs"
            style={{ width: `${progressRatio}%` }}
          />
        </div>
      </div>

      {/* Timer Expiry Decision Modal (Phase 1 Requirement) */}
      <TimerDecisionModal
        isOpen={timer.phase === 'decision'}
        currentMiniTask={currentMini}
        isFinalTask={isFinalTask}
        onAddExtraTime={(minutes) => timer.addExtraTime(minutes)}
        onMoveToNext={() => timer.moveToNextTask()}
        onFinishMajorTask={() => timer.finishMajorTask()}
      />

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          role="dialog"
          aria-labelledby="exit-modal-title"
          aria-modal="true"
        >
          <div className="bg-[var(--surface-card,#11211F)] text-[var(--text-primary,#F2F6F1)] rounded-2xl border border-[var(--border-color,#243A34)] w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-elevated,#172B27)] text-[var(--primary-accent,#5ACB91)] flex items-center justify-center mx-auto mb-3 border border-[var(--border-color,#243A34)]">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 id="exit-modal-title" className="text-base font-bold text-[var(--text-primary,#F2F6F1)]">
              Pause and Leave Focus Screen?
            </h3>
            <p className="text-xs text-[var(--text-secondary,#A5B5AD)] mt-1.5 leading-relaxed">
              Your countdown progress will be safely paused. You can return to this sequence at any time.
            </p>
            <div className="flex items-center justify-center gap-2.5 mt-5 pt-4 border-t border-[var(--border-color,#243A34)]">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary,#A5B5AD)] hover:bg-[var(--surface-elevated,#172B27)] rounded-xl transition-colors"
              >
                Keep Focusing
              </button>
              <button
                onClick={() => {
                  timer.pause();
                  router.push(`/tasks/${task.id}`);
                }}
                className="px-4 py-2 text-xs font-semibold text-black bg-[var(--primary-accent,#5ACB91)] hover:bg-[var(--secondary-accent,#8EE5AD)] rounded-xl transition-all shadow-sm"
              >
                Pause & Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Summary Celebration Modal */}
      <CompletionSummaryModal
        isOpen={showSummaryModal}
        majorTaskId={task.id}
        majorTaskTitle={task.title}
        completedCount={completedStats.completedCount}
        totalFocusedMinutes={completedStats.focusedMinutes}
        userId={user?.id}
        onRestart={handleRestartSequence}
        onClose={() => setShowSummaryModal(false)}
      />
    </div>
  );
}

export default function FocusTimerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg-app,#091311)] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--primary-accent,#5ACB91)] border-t-transparent animate-spin" />
        </div>
      }
    >
      <FocusTimerContent />
    </Suspense>
  );
}

