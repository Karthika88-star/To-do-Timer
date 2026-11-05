'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MajorTask, MiniTask, TimerPhase } from '@/types';
import { storage } from '@/lib/storage';
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

  const [prevTaskId, setPrevTaskId] = useState<string | null>(majorTask?.id || null);
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

  // Adjust state during render when majorTask ID changes (React 19 recommended pattern)
  if (majorTask && majorTask.id !== prevTaskId) {
    setPrevTaskId(majorTask.id);
    const target = majorTask.miniTasks.find(m => !m.isCompleted) || majorTask.miniTasks[0] || null;
    setCurrentMiniTask(target);
    const secs = target ? target.durationMinutes * 60 : 0;
    setRemainingSeconds(secs);
    setTotalDurationSeconds(secs);
    setIsBreak(false);
    setPhase(target && !target.isCompleted ? 'paused' : 'completed');
  }

  const targetEndTimeRef = useRef<number | null>(null);
  const isTransitioningRef = useRef<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper: Is this the last unfinished mini-task?
  const allMini = majorTask?.miniTasks || [];
  const incompleteRemaining = allMini.filter(m => !m.isCompleted && m.id !== currentMiniTask?.id);
  const isFinalTask = incompleteRemaining.length === 0;

  // Work timer expiry handler: PAUSE at 00:00 and open decision dialog
  const handleWorkTimerExpired = useCallback(() => {
    targetEndTimeRef.current = null;
    setRemainingSeconds(0);
    setPhase('decision');

    if (soundEnabled) {
      sound.playCompletionChime();
    }
  }, [soundEnabled]);

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

    const freshTask = storage.getTaskById(majorTask.id, userId);
    const taskList = freshTask?.miniTasks || majorTask.miniTasks;
    const nextTask = taskList.find(m => !m.isCompleted);

    if (nextTask) {
      setCurrentMiniTask(nextTask);
      const workSecs = nextTask.durationMinutes * 60;
      setTotalDurationSeconds(workSecs);
      setRemainingSeconds(workSecs);
      setPhase('paused');
    } else {
      // All done!
      setPhase('completed');
      storage.completeMajorTask(majorTask.id, userId);
      if (onAllCompleted) {
        const completedCount = taskList.filter(m => m.isCompleted).length;
        const totalMinutes = taskList.reduce((acc, m) => acc + (m.isCompleted ? m.durationMinutes + (m.extraTimeMinutes || 0) : 0), 0);
        onAllCompleted({ completedCount, focusedMinutes: totalMinutes });
      }
    }

    isTransitioningRef.current = false;
  }, [majorTask, soundEnabled, onAllCompleted, userId]);

  // Main countdown tick loop (drift-free timestamp calculation)
  useEffect(() => {
    if (phase === 'running' || phase === 'break') {
      intervalRef.current = setInterval(() => {
        if (!targetEndTimeRef.current) return;

        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current - now) / 1000));
        setRemainingSeconds(remaining);

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
  const addExtraTime = useCallback((minutes: number) => {
    if (minutes <= 0 || !majorTask || !currentMiniTask) return;

    const addedMinutes = Math.min(180, Math.max(1, minutes));
    const previousExtra = currentMiniTask.extraTimeMinutes || 0;
    const newExtra = previousExtra + addedMinutes;

    // Persist to storage, preserving original planned duration separately
    storage.updateMiniTask(majorTask.id, currentMiniTask.id, { extraTimeMinutes: newExtra }, userId);

    setCurrentMiniTask(prev => prev ? { ...prev, extraTimeMinutes: newExtra } : null);

    const extraSeconds = addedMinutes * 60;
    setRemainingSeconds(extraSeconds);
    setTotalDurationSeconds(extraSeconds);
    targetEndTimeRef.current = Date.now() + extraSeconds * 1000;
    setPhase('running');
  }, [majorTask, currentMiniTask, userId]);

  // Action 2: Move to Next Task (marks current completed, starts break if configured)
  const moveToNextTask = useCallback(() => {
    if (isTransitioningRef.current || !majorTask || !currentMiniTask) return;
    isTransitioningRef.current = true;

    // 1. Mark current mini-task as completed in storage
    storage.updateMiniTask(majorTask.id, currentMiniTask.id, { isCompleted: true }, userId);
    const focusedMinutes = currentMiniTask.durationMinutes + (currentMiniTask.extraTimeMinutes || 0);
    storage.addFocusedMinutes(focusedMinutes, userId);

    setSessionCompletedIds(prev => [...new Set([...prev, currentMiniTask.id])]);
    setSessionFocusedSeconds(prev => prev + focusedMinutes * 60);

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
      targetEndTimeRef.current = Date.now() + breakSeconds * 1000;
      isTransitioningRef.current = false;
      return;
    }

    // 3. Otherwise find next incomplete task
    setIsBreak(false);
    const freshTask = storage.getTaskById(majorTask.id, userId);
    const allMiniTasks = freshTask?.miniTasks || majorTask.miniTasks;
    const nextTask = allMiniTasks.find(m => !m.isCompleted && m.id !== currentMiniTask.id);

    if (nextTask) {
      setCurrentMiniTask(nextTask);
      const workSeconds = nextTask.durationMinutes * 60;
      setTotalDurationSeconds(workSeconds);
      setRemainingSeconds(workSeconds);
      setPhase('paused');
      targetEndTimeRef.current = null;
    } else {
      // All mini-tasks are finished!
      setPhase('completed');
      targetEndTimeRef.current = null;
      storage.completeMajorTask(majorTask.id, userId);
      if (onAllCompleted) {
        const completedCount = allMiniTasks.filter(m => m.isCompleted).length;
        const totalMinutes = allMiniTasks.reduce((acc, m) => acc + (m.isCompleted ? m.durationMinutes + (m.extraTimeMinutes || 0) : 0), 0);
        onAllCompleted({
          completedCount,
          focusedMinutes: totalMinutes,
        });
      }
    }

    isTransitioningRef.current = false;
  }, [majorTask, currentMiniTask, onMiniTaskCompleted, onAllCompleted, userId]);

  // Action 3: Finish Major Task (records completion timestamp and shows feedback)
  const finishMajorTask = useCallback(() => {
    if (!majorTask) return;
    targetEndTimeRef.current = null;

    if (currentMiniTask && !currentMiniTask.isCompleted) {
      storage.updateMiniTask(majorTask.id, currentMiniTask.id, { isCompleted: true }, userId);
      const focusedMinutes = currentMiniTask.durationMinutes + (currentMiniTask.extraTimeMinutes || 0);
      storage.addFocusedMinutes(focusedMinutes, userId);
      if (onMiniTaskCompleted) onMiniTaskCompleted(currentMiniTask.id);
    }

    const completed = storage.completeMajorTask(majorTask.id, userId);
    setPhase('completed');

    if (onAllCompleted) {
      const allM = completed?.miniTasks || majorTask.miniTasks;
      const count = allM.filter(m => m.isCompleted).length;
      const mins = allM.reduce((acc, m) => acc + (m.isCompleted ? m.durationMinutes + (m.extraTimeMinutes || 0) : 0), 0);
      onAllCompleted({
        completedCount: count,
        focusedMinutes: mins,
      });
    }
  }, [majorTask, currentMiniTask, onMiniTaskCompleted, onAllCompleted, userId]);

  // Skip break directly to next task
  const skipBreak = useCallback(() => {
    if (!isBreak) return;
    setIsBreak(false);
    targetEndTimeRef.current = null;

    if (!majorTask || !currentMiniTask) return;
    const freshTask = storage.getTaskById(majorTask.id, userId);
    const allMini = freshTask?.miniTasks || majorTask.miniTasks;
    const nextTask = allMini.find(m => !m.isCompleted);

    if (nextTask) {
      setCurrentMiniTask(nextTask);
      const workSeconds = nextTask.durationMinutes * 60;
      setTotalDurationSeconds(workSeconds);
      setRemainingSeconds(workSeconds);
      setPhase('paused');
    } else {
      setPhase('completed');
      storage.completeMajorTask(majorTask.id, userId);
      if (onAllCompleted) {
        const count = allMini.filter(m => m.isCompleted).length;
        const totalMinutes = allMini.reduce((acc, m) => acc + (m.isCompleted ? m.durationMinutes + (m.extraTimeMinutes || 0) : 0), 0);
        onAllCompleted({ completedCount: count, focusedMinutes: totalMinutes });
      }
    }
  }, [isBreak, majorTask, currentMiniTask, onAllCompleted, userId]);

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
    targetEndTimeRef.current = Date.now() + remainingSeconds * 1000;
    setPhase(isBreak ? 'break' : 'running');
    if (majorTask?.id) {
      storage.startMajorTask(majorTask.id, userId);
    }
  }, [phase, remainingSeconds, isBreak, majorTask, userId]);

  // Pause
  const pause = useCallback(() => {
    if (targetEndTimeRef.current) {
      const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      targetEndTimeRef.current = null;
    }
    setPhase('paused');
    // Ensure task status remains persisted in progress
    if (majorTask?.id) {
      storage.startMajorTask(majorTask.id, userId);
    }
  }, [majorTask, userId]);

  // Reset current step back to full duration
  const resetCurrentStep = useCallback(() => {
    targetEndTimeRef.current = null;
    if (isBreak && currentMiniTask) {
      const breakSeconds = currentMiniTask.breakDurationMinutes * 60;
      setRemainingSeconds(breakSeconds);
      setTotalDurationSeconds(breakSeconds);
    } else if (currentMiniTask) {
      const workSeconds = currentMiniTask.durationMinutes * 60;
      setRemainingSeconds(workSeconds);
      setTotalDurationSeconds(workSeconds);
    }
    setPhase('paused');
  }, [isBreak, currentMiniTask]);

  // Select a specific mini-task manually
  const selectMiniTask = useCallback((miniTask: MiniTask) => {
    targetEndTimeRef.current = null;
    setIsBreak(false);
    setCurrentMiniTask(miniTask);
    const workSeconds = miniTask.durationMinutes * 60;
    setTotalDurationSeconds(workSeconds);
    setRemainingSeconds(workSeconds);
    setPhase('paused');
  }, []);

  const currentProgressPercent = totalDurationSeconds > 0
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
