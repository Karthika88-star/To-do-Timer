'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MajorTask, MiniTask, TimerPhase, TimerSession } from '@/types';
import { storage } from '@/lib/storage';
import { taskService } from '@/lib/services/taskService';
import { sound } from '@/lib/audio';

interface UseTimerOptions {
  majorTask: MajorTask | null;
  userId?: string;
  onMiniTaskCompleted?: (miniTaskId: string) => void;
  onAllCompleted?: (stats: { completedCount: number; focusedMinutes: number }) => void;
  soundEnabled?: boolean;
}

export function useTimer({
  majorTask,
  userId,
  onMiniTaskCompleted,
  onAllCompleted,
  soundEnabled = true,
}: UseTimerOptions) {
  // Initialize from initial majorTask
  const initialTarget = majorTask?.miniTasks?.find(m => !m.isCompleted) || majorTask?.miniTasks?.[0] || null;
  const initialSeconds = initialTarget ? initialTarget.durationMinutes * 60 : 0;

  const currentTaskId = majorTask?.id ?? null;
  const [prevTaskId, setPrevTaskId] = useState<string | null>(currentTaskId);
  const [phase, setPhase] = useState<TimerPhase>(() => {
    if (!majorTask?.miniTasks?.length) return 'idle';
    return initialTarget && !initialTarget.isCompleted ? 'paused' : 'completed';
  });
  const [isBreak, setIsBreak] = useState<boolean>(false);
  const [currentMiniTask, setCurrentMiniTask] = useState<MiniTask | null>(initialTarget);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(initialSeconds);
  const [totalDurationSeconds, setTotalDurationSeconds] = useState<number>(initialSeconds);
  const [sessionFocusedSeconds, setSessionFocusedSeconds] = useState<number>(0);
  const [sessionCompletedIds, setSessionCompletedIds] = useState<string[]>([]);

  const targetEndTimeRef = useRef<number | null>(null);
  const isTransitioningRef = useRef<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const workStartTimeRef = useRef<number | null>(null);
  const accumulatedFocusedSecondsRef = useRef<number>(0);
  const completedIdsRef = useRef<Set<string>>(new Set());

  // Restore saved timer session on mount or task change
  useEffect(() => {
    if (!majorTask?.id || !userId) return;
    const saved = storage.getTimerSession(majorTask.id, userId);
    if (saved) {
      if (saved.completedMiniTaskIds && saved.completedMiniTaskIds.length > 0) {
        saved.completedMiniTaskIds.forEach(id => completedIdsRef.current.add(id));
        setSessionCompletedIds(Array.from(completedIdsRef.current));
      }
      if (typeof saved.totalFocusedSeconds === 'number') {
        accumulatedFocusedSecondsRef.current = saved.totalFocusedSeconds;
        setSessionFocusedSeconds(saved.totalFocusedSeconds);
      }
    }
  }, [majorTask?.id, userId]);

  // Adjust state during render when majorTask ID changes (React 19 recommended pattern)
  if (currentTaskId !== prevTaskId) {
    setPrevTaskId(currentTaskId);
    const target = majorTask?.miniTasks.find(m => !m.isCompleted) || majorTask?.miniTasks[0] || null;
    setCurrentMiniTask(target);
    const secs = target ? target.durationMinutes * 60 : 0;
    setRemainingSeconds(secs);
    setTotalDurationSeconds(secs);
    setIsBreak(false);
    setPhase(target && !target.isCompleted ? 'paused' : 'completed');
  }

  // Helper: Is this the last unfinished mini-task?
  const allMini = majorTask?.miniTasks || [];
  const incompleteRemaining = allMini.filter(
    m => !m.isCompleted && m.id !== currentMiniTask?.id && !sessionCompletedIds.includes(m.id)
  );
  const isFinalTask = incompleteRemaining.length === 0;

  // Flush in-flight active focused seconds into accumulated total
  const flushWorkTime = useCallback(() => {
    if (!isBreak && workStartTimeRef.current) {
      const elapsed = Math.max(0, Math.round((Date.now() - workStartTimeRef.current) / 1000));
      accumulatedFocusedSecondsRef.current += elapsed;
      workStartTimeRef.current = null;
      setSessionFocusedSeconds(accumulatedFocusedSecondsRef.current);
    }
  }, [isBreak]);

  // Save current timer session state to storage for persistence across reloads
  const saveSession = useCallback(
    (newPhase: TimerPhase, remSecs: number, targetEnd: number | null) => {
      if (!majorTask?.id || !userId) return;
      const session: TimerSession = {
        majorTaskId: majorTask.id,
        currentMiniTaskId: currentMiniTask?.id || null,
        phase: newPhase,
        targetEndTime: targetEnd,
        remainingSeconds: remSecs,
        totalDurationSeconds,
        isBreak,
        completedMiniTaskIds: Array.from(completedIdsRef.current),
        totalFocusedSeconds: accumulatedFocusedSecondsRef.current,
        lastTickTimestamp: Date.now(),
      };
      storage.saveTimerSession(session, userId);
    },
    [majorTask, userId, currentMiniTask?.id, totalDurationSeconds, isBreak]
  );

  // Capture completion stats before resetting state or clearing timer session
  const captureCompletionStats = useCallback(
    (isFinal: boolean) => {
      flushWorkTime();
      const allM = majorTask?.miniTasks || [];
      const completedSet = new Set([
        ...Array.from(completedIdsRef.current),
        ...(currentMiniTask ? [currentMiniTask.id] : []),
        ...allM.filter(m => m.isCompleted).map(m => m.id),
      ]);

      const completedCount = isFinal
        ? Math.max(completedSet.size, allM.length)
        : completedSet.size;

      const actualSecs = accumulatedFocusedSecondsRef.current;
      // Calculate actual completed focus duration using timer-session data
      // If actual focus time was recorded, round to minutes (at least 1 if >0)
      const focusedMinutes = actualSecs > 0 ? Math.max(1, Math.round(actualSecs / 60)) : 0;

      return { completedCount, focusedMinutes };
    },
    [flushWorkTime, majorTask?.miniTasks, currentMiniTask]
  );

  // Work timer expiry handler: PAUSE at 00:00 and open decision dialog
  const handleWorkTimerExpired = useCallback(() => {
    targetEndTimeRef.current = null;
    flushWorkTime();
    setRemainingSeconds(0);
    setPhase('decision');
    saveSession('decision', 0, null);

    if (soundEnabled) {
      sound.playCompletionChime();
    }
  }, [flushWorkTime, saveSession, soundEnabled]);

  // Break timer expiry handler: automatically advance after break
  const handleBreakTimerExpired = useCallback(() => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    if (soundEnabled) {
      sound.playCompletionChime();
    }

    setIsBreak(false);
    targetEndTimeRef.current = null;

    if (!majorTask) {
      isTransitioningRef.current = false;
      return;
    }

    const taskList = majorTask.miniTasks || [];
    const nextTask = taskList.find(m => !m.isCompleted && !completedIdsRef.current.has(m.id));

    if (nextTask) {
      setCurrentMiniTask(nextTask);
      const workSecs = nextTask.durationMinutes * 60;
      setTotalDurationSeconds(workSecs);
      setRemainingSeconds(workSecs);
      setPhase('paused');
      saveSession('paused', workSecs, null);
    } else {
      // All done!
      const stats = captureCompletionStats(true);
      setPhase('completed');
      if (userId) {
        if (stats.focusedMinutes > 0) {
          storage.addFocusedMinutes(stats.focusedMinutes, userId);
        }
        taskService.completeMajorTask(majorTask.id, userId);
      }
      if (onAllCompleted) {
        onAllCompleted(stats);
      }
    }

    isTransitioningRef.current = false;
  }, [majorTask, soundEnabled, captureCompletionStats, saveSession, userId, onAllCompleted]);

  // Main countdown tick loop (drift-free timestamp calculation)
  useEffect(() => {
    if (phase === 'running' || phase === 'break') {
      intervalRef.current = setInterval(() => {
        if (!targetEndTimeRef.current) return;

        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current - now) / 1000));
        setRemainingSeconds(remaining);

        // Keep sessionFocusedSeconds reactive during active focus work
        if (!isBreak && workStartTimeRef.current) {
          const liveElapsed = Math.max(0, Math.round((now - workStartTimeRef.current) / 1000));
          setSessionFocusedSeconds(accumulatedFocusedSecondsRef.current + liveElapsed);
        }

        if (remaining <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (isBreak) {
            handleBreakTimerExpired();
          } else {
            handleWorkTimerExpired();
          }
        }
      }, 250);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [phase, isBreak, handleWorkTimerExpired, handleBreakTimerExpired]);

  // Action 1: Add Extra Time
  const addExtraTime = useCallback(
    (minutes: number) => {
      if (minutes <= 0 || !majorTask || !currentMiniTask) return;

      const addedMinutes = Math.min(180, Math.max(1, minutes));
      const previousExtra = currentMiniTask.extraTimeMinutes || 0;
      const newExtra = previousExtra + addedMinutes;

      // Persist to database/service, preserving original planned duration separately
      if (userId) {
        taskService.updateMiniTask(majorTask.id, currentMiniTask.id, { extraTimeMinutes: newExtra }, userId);
      }

      setCurrentMiniTask(prev => (prev ? { ...prev, extraTimeMinutes: newExtra } : null));

      const extraSeconds = addedMinutes * 60;
      setRemainingSeconds(extraSeconds);
      setTotalDurationSeconds(extraSeconds);
      const targetEnd = Date.now() + extraSeconds * 1000;
      targetEndTimeRef.current = targetEnd;
      workStartTimeRef.current = Date.now();
      setPhase('running');
      saveSession('running', extraSeconds, targetEnd);
    },
    [majorTask, currentMiniTask, userId, saveSession]
  );

  // Action 2: Move to Next Task (marks current completed, starts break if configured)
  const moveToNextTask = useCallback(() => {
    if (isTransitioningRef.current || !majorTask || !currentMiniTask) return;
    isTransitioningRef.current = true;

    flushWorkTime();

    // 1. Mark current mini-task as completed in storage/database
    completedIdsRef.current.add(currentMiniTask.id);
    setSessionCompletedIds(Array.from(completedIdsRef.current));

    if (userId) {
      taskService.updateMiniTask(majorTask.id, currentMiniTask.id, { isCompleted: true }, userId);
    }

    if (onMiniTaskCompleted) {
      onMiniTaskCompleted(currentMiniTask.id);
    }

    // 2. Check if this mini-task has an optional break
    if (currentMiniTask.hasBreak && currentMiniTask.breakDurationMinutes > 0) {
      setIsBreak(true);
      const breakSeconds = currentMiniTask.breakDurationMinutes * 60;
      setTotalDurationSeconds(breakSeconds);
      setRemainingSeconds(breakSeconds);
      setPhase('break');
      const targetEnd = Date.now() + breakSeconds * 1000;
      targetEndTimeRef.current = targetEnd;
      saveSession('break', breakSeconds, targetEnd);
      isTransitioningRef.current = false;
      return;
    }

    // 3. Otherwise find next incomplete task
    setIsBreak(false);
    const allMiniTasks = majorTask.miniTasks || [];
    const nextTask = allMiniTasks.find(
      m => !m.isCompleted && m.id !== currentMiniTask.id && !completedIdsRef.current.has(m.id)
    );

    if (nextTask) {
      setCurrentMiniTask(nextTask);
      const workSeconds = nextTask.durationMinutes * 60;
      setTotalDurationSeconds(workSeconds);
      setRemainingSeconds(workSeconds);
      setPhase('paused');
      targetEndTimeRef.current = null;
      saveSession('paused', workSeconds, null);
    } else {
      // All mini-tasks are finished! Capture stats FIRST before completing in database
      const stats = captureCompletionStats(true);
      setPhase('completed');
      targetEndTimeRef.current = null;

      if (userId) {
        if (stats.focusedMinutes > 0) {
          storage.addFocusedMinutes(stats.focusedMinutes, userId);
        }
        taskService.completeMajorTask(majorTask.id, userId);
      }

      if (onAllCompleted) {
        onAllCompleted(stats);
      }
    }

    isTransitioningRef.current = false;
  }, [
    majorTask,
    currentMiniTask,
    flushWorkTime,
    userId,
    onMiniTaskCompleted,
    saveSession,
    captureCompletionStats,
    onAllCompleted,
  ]);

  // Action 3: Finish Major Task (records completion timestamp and shows feedback)
  const finishMajorTask = useCallback(() => {
    if (!majorTask) return;
    targetEndTimeRef.current = null;
    flushWorkTime();

    if (currentMiniTask && userId) {
      completedIdsRef.current.add(currentMiniTask.id);
      setSessionCompletedIds(Array.from(completedIdsRef.current));
      taskService.updateMiniTask(majorTask.id, currentMiniTask.id, { isCompleted: true }, userId);
      if (onMiniTaskCompleted) onMiniTaskCompleted(currentMiniTask.id);
    }

    // Capture stats FIRST before completing in database
    const stats = captureCompletionStats(true);
    setPhase('completed');

    if (userId) {
      if (stats.focusedMinutes > 0) {
        storage.addFocusedMinutes(stats.focusedMinutes, userId);
      }
      taskService.completeMajorTask(majorTask.id, userId);
    }

    if (onAllCompleted) {
      onAllCompleted(stats);
    }
  }, [
    majorTask,
    currentMiniTask,
    flushWorkTime,
    userId,
    onMiniTaskCompleted,
    captureCompletionStats,
    onAllCompleted,
  ]);

  // Skip break directly to next task
  const skipBreak = useCallback(() => {
    if (!isBreak) return;
    setIsBreak(false);
    targetEndTimeRef.current = null;

    if (!majorTask || !currentMiniTask) return;
    const allM = majorTask.miniTasks || [];
    const nextTask = allM.find(
      m => !m.isCompleted && m.id !== currentMiniTask.id && !completedIdsRef.current.has(m.id)
    );

    if (nextTask) {
      setCurrentMiniTask(nextTask);
      const workSeconds = nextTask.durationMinutes * 60;
      setTotalDurationSeconds(workSeconds);
      setRemainingSeconds(workSeconds);
      setPhase('paused');
      saveSession('paused', workSeconds, null);
    } else {
      const stats = captureCompletionStats(true);
      setPhase('completed');
      if (userId) {
        if (stats.focusedMinutes > 0) {
          storage.addFocusedMinutes(stats.focusedMinutes, userId);
        }
        taskService.completeMajorTask(majorTask.id, userId);
      }
      if (onAllCompleted) {
        onAllCompleted(stats);
      }
    }
  }, [isBreak, majorTask, currentMiniTask, saveSession, captureCompletionStats, userId, onAllCompleted]);

  // Manual complete current step (used by "Complete" button / Shift+C)
  const completeCurrentStep = useCallback(() => {
    if (isBreak) {
      // If currently on break, skipping rest moves directly to next task
      skipBreak();
    } else {
      moveToNextTask();
    }
  }, [isBreak, moveToNextTask, skipBreak]);

  // Start or resume
  const start = useCallback(() => {
    if (phase === 'completed') return;
    const targetEnd = Date.now() + remainingSeconds * 1000;
    targetEndTimeRef.current = targetEnd;
    if (!isBreak) {
      workStartTimeRef.current = Date.now();
    }
    const newPhase: TimerPhase = isBreak ? 'break' : 'running';
    setPhase(newPhase);
    saveSession(newPhase, remainingSeconds, targetEnd);
    if (majorTask?.id && userId) {
      taskService.startMajorTask(majorTask.id, userId);
    }
  }, [phase, remainingSeconds, isBreak, saveSession, majorTask, userId]);

  // Pause
  const pause = useCallback(() => {
    if (targetEndTimeRef.current) {
      const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      targetEndTimeRef.current = null;
    }
    flushWorkTime();
    setPhase('paused');
    saveSession('paused', remainingSeconds, null);
    if (majorTask?.id && userId) {
      taskService.startMajorTask(majorTask.id, userId);
    }
  }, [flushWorkTime, saveSession, remainingSeconds, majorTask, userId]);

  // Reset current step back to full duration
  const resetCurrentStep = useCallback(() => {
    targetEndTimeRef.current = null;
    workStartTimeRef.current = null;
    if (isBreak && currentMiniTask) {
      const breakSeconds = currentMiniTask.breakDurationMinutes * 60;
      setRemainingSeconds(breakSeconds);
      setTotalDurationSeconds(breakSeconds);
      saveSession('paused', breakSeconds, null);
    } else if (currentMiniTask) {
      const workSeconds = currentMiniTask.durationMinutes * 60;
      setRemainingSeconds(workSeconds);
      setTotalDurationSeconds(workSeconds);
      saveSession('paused', workSeconds, null);
    }
    setPhase('paused');
  }, [isBreak, currentMiniTask, saveSession]);

  // Select a specific mini-task manually
  const selectMiniTask = useCallback(
    (miniTask: MiniTask) => {
      targetEndTimeRef.current = null;
      workStartTimeRef.current = null;
      setIsBreak(false);
      setCurrentMiniTask(miniTask);
      const workSeconds = miniTask.durationMinutes * 60;
      setTotalDurationSeconds(workSeconds);
      setRemainingSeconds(workSeconds);
      setPhase('paused');
      saveSession('paused', workSeconds, null);
    },
    [saveSession]
  );

  const currentProgressPercent =
    totalDurationSeconds > 0
      ? Math.min(100, Math.max(0, ((totalDurationSeconds - remainingSeconds) / totalDurationSeconds) * 100))
      : 0;

  return {
    phase,
    isBreak,
    currentMiniTask,
    remainingSeconds,
    totalDurationSeconds,
    currentProgressPercent,
    sessionFocusedSeconds,
    sessionCompletedIds,
    isFinalTask,
    start,
    pause,
    resume: start,
    resetCurrentStep,
    completeCurrentStep,
    addExtraTime,
    moveToNextTask,
    finishMajorTask,
    skipBreak,
    selectMiniTask,
    isRunning: phase === 'running' || phase === 'break',
  };
}
