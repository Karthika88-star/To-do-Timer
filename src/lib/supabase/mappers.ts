import { MajorTask, MiniTask } from '@/types';
import {
  MajorTaskRow,
  MiniTaskRow,
  MajorTaskWithMiniTasksRow,
  MajorTaskInsert,
  MajorTaskUpdate,
  MiniTaskInsert,
  MiniTaskUpdate,
} from './types';

/**
 * Transforms a Supabase mini_tasks row to the frontend MiniTask interface.
 */
export function toMiniTask(row: MiniTaskRow): MiniTask {
  return {
    id: row.id,
    majorTaskId: row.major_task_id,
    title: row.title,
    durationMinutes: row.duration_minutes,
    extraTimeMinutes: row.extra_time_minutes || 0,
    order: row.order_index,
    isCompleted: row.is_completed,
    hasBreak: row.has_break,
    breakDurationMinutes: row.break_duration_minutes,
    createdAt: row.created_at,
    completedAt: row.completed_at || undefined,
  };
}

/**
 * Transforms a Supabase major_tasks row and its child mini_tasks rows to the frontend MajorTask interface.
 */
export function toMajorTask(row: MajorTaskRow, miniRows: MiniTaskRow[] = []): MajorTask {
  const sortedMinis = [...miniRows].sort((a, b) => a.order_index - b.order_index);
  const miniTasks = sortedMinis.map(toMiniTask);
  const isCompleted = row.status === 'completed';

  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    status: row.status,
    startedAt: row.started_at || undefined,
    completedAt: row.completed_at || undefined,
    isArchived: row.is_archived,
    isCompleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    miniTasks,
  };
}

/**
 * Transforms an array of relational MajorTask rows (with nested mini_tasks) to MajorTask[].
 */
export function toMajorTaskList(rows: MajorTaskWithMiniTasksRow[]): MajorTask[] {
  return rows.map((row) => toMajorTask(row, row.mini_tasks || []));
}

/**
 * Prepares payload for inserting a new major task in Supabase.
 */
export function prepareMajorTaskInsert(
  title: string,
  description: string = '',
  userId: string
): MajorTaskInsert {
  return {
    user_id: userId,
    title: title.trim(),
    description: description.trim(),
    status: 'not_started',
    is_archived: false,
    started_at: null,
    completed_at: null,
  };
}

/**
 * Prepares payload for inserting a new mini-task in Supabase.
 */
export function prepareMiniTaskInsert(
  majorTaskId: string,
  userId: string,
  data: {
    title: string;
    durationMinutes: number;
    hasBreak: boolean;
    breakDurationMinutes: number;
    extraTimeMinutes?: number;
  },
  orderIndex: number
): MiniTaskInsert {
  return {
    major_task_id: majorTaskId,
    user_id: userId,
    title: data.title.trim(),
    duration_minutes: Math.max(1, Math.min(1440, data.durationMinutes)),
    extra_time_minutes: Math.max(0, Math.min(180, data.extraTimeMinutes || 0)),
    order_index: Math.max(1, orderIndex),
    has_break: Boolean(data.hasBreak),
    break_duration_minutes: Math.max(0, Math.min(180, data.breakDurationMinutes || 5)),
    is_completed: false,
    completed_at: null,
  };
}

/**
 * Prepares status and timestamp updates for major tasks complying with check_major_task_status_timestamps:
 * - not_started: started_at is null AND completed_at is null
 * - in_progress: started_at is not null AND completed_at is null
 * - completed: started_at is not null AND completed_at is not null AND completed_at >= started_at
 */
export function prepareMajorTaskStatusUpdates(
  status: 'not_started' | 'in_progress' | 'completed',
  currentStartedAt?: string | null,
  currentCreatedAt?: string | null
): MajorTaskUpdate {
  const now = new Date().toISOString();

  if (status === 'not_started') {
    return {
      status: 'not_started',
      started_at: null,
      completed_at: null,
    };
  }

  if (status === 'in_progress') {
    return {
      status: 'in_progress',
      started_at: currentStartedAt || now,
      completed_at: null,
    };
  }

  // status === 'completed'
  // Guarantee started_at is not null so constraint check_major_task_status_timestamps passes
  const validStartedAt = currentStartedAt || currentCreatedAt || now;
  return {
    status: 'completed',
    started_at: validStartedAt,
    completed_at: now,
  };
}

/**
 * Prepares mini-task completion updates complying with check_mini_task_completion:
 * - is_completed: true requires completed_at to be non-null
 * - is_completed: false requires completed_at to be null
 */
export function prepareMiniTaskCompletionUpdates(
  isCompleted: boolean,
  completedAt?: string
): MiniTaskUpdate {
  if (isCompleted) {
    return {
      is_completed: true,
      completed_at: completedAt || new Date().toISOString(),
    };
  }
  return {
    is_completed: false,
    completed_at: null,
  };
}
