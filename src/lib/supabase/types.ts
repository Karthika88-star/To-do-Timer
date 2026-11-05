export interface MajorTaskRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed';
  is_archived: boolean;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MiniTaskRow {
  id: string;
  major_task_id: string;
  user_id: string;
  title: string;
  duration_minutes: number;
  extra_time_minutes: number;
  order_index: number;
  is_completed: boolean;
  completed_at: string | null;
  has_break: boolean;
  break_duration_minutes: number;
  created_at: string;
  updated_at: string;
}

export type MajorTaskWithMiniTasksRow = MajorTaskRow & {
  mini_tasks: MiniTaskRow[];
};

export interface MajorTaskInsert {
  id?: string;
  user_id: string;
  title: string;
  description?: string;
  status?: 'not_started' | 'in_progress' | 'completed';
  is_archived?: boolean;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface MajorTaskUpdate {
  title?: string;
  description?: string;
  status?: 'not_started' | 'in_progress' | 'completed';
  is_archived?: boolean;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface MiniTaskInsert {
  id?: string;
  major_task_id: string;
  user_id: string;
  title: string;
  duration_minutes?: number;
  extra_time_minutes?: number;
  order_index: number;
  is_completed?: boolean;
  completed_at?: string | null;
  has_break?: boolean;
  break_duration_minutes?: number;
}

export interface MiniTaskUpdate {
  title?: string;
  duration_minutes?: number;
  extra_time_minutes?: number;
  order_index?: number;
  is_completed?: boolean;
  completed_at?: string | null;
  has_break?: boolean;
  break_duration_minutes?: number;
}
