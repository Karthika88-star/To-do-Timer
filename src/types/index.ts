export interface UserPreferences {
  soundEnabled: boolean;
  autoStartBreak: boolean;
  autoStartNextTask: boolean;
  defaultWorkDurationMinutes: number;
  defaultBreakDurationMinutes: number;
  themePreference: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  preferences: UserPreferences;
  totalFocusedMinutes: number;
  completedMiniTasksCount: number;
}

export interface MiniTask {
  id: string;
  majorTaskId: string;
  title: string;
  durationMinutes: number; // 1 min to 1440 min (24 hours)
  extraTimeMinutes?: number; // Preserves durationMinutes separately from additional time
  order: number;
  isCompleted: boolean;
  hasBreak: boolean;
  breakDurationMinutes: number; // positive number if hasBreak is true
  createdAt: string;
  completedAt?: string;
}

export type MajorTaskStatus = 'not_started' | 'in_progress' | 'completed';

export interface MajorTask {
  id: string;
  title: string;
  description: string;
  status?: MajorTaskStatus;
  startedAt?: string;
  miniTasks: MiniTask[];
  createdAt: string;
  updatedAt: string;
  isArchived?: boolean;
  isCompleted?: boolean;
  completedAt?: string;
}

export type TimerPhase = 'idle' | 'running' | 'paused' | 'break' | 'decision' | 'completed';

export interface TimerSession {
  majorTaskId: string;
  currentMiniTaskId: string | null;
  phase: TimerPhase;
  targetEndTime: number | null; // Timestamp in milliseconds for drift-free countdown
  remainingSeconds: number; // Current remaining seconds for active step (work or break)
  totalDurationSeconds: number; // Initial duration for progress percentage
  isBreak: boolean;
  completedMiniTaskIds: string[];
  totalFocusedSeconds: number;
  lastTickTimestamp: number | null;
}
