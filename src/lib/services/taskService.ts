import { MajorTask, MiniTask } from '@/types';
import { storage } from '@/lib/storage';
import { getBrowserClient } from '@/lib/supabase/client';
import {
  MajorTaskWithMiniTasksRow,
  MiniTaskRow,
  MajorTaskRow,
} from '@/lib/supabase/types';
import {
  toMajorTask,
  toMajorTaskList,
  toMiniTask,
  prepareMajorTaskInsert,
  prepareMiniTaskInsert,
  prepareMajorTaskStatusUpdates,
  prepareMiniTaskCompletionUpdates,
} from '@/lib/supabase/mappers';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(id?: string | null): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

/**
 * TaskService manages asynchronous Supabase CRUD operations for Major Tasks and Mini Tasks,
 * while safely preserving legacy LocalStorage behavior for mock identity 'usr_mock_001'.
 */
class TaskService {
  private isMockUser(userId?: string): boolean {
    return !userId || userId === 'usr_mock_001' || !isValidUuid(userId);
  }

  /**
   * Helper that retrieves the Supabase browser client and ensures the auth
   * session is resolved so that the Authorization: Bearer <jwt> header is attached.
   */
  private async getClient() {
    const supabase = getBrowserClient();
    if (typeof window !== 'undefined') {
      try {
        await supabase.auth.getSession();
      } catch (err) {
        console.warn('TaskService: Session check warning:', err);
      }
    }
    return supabase;
  }

  private emitSync(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('todo_timer_tasks_updated'));
    }
  }

  // ==========================================================================
  // MAJOR TASK CRUD
  // ==========================================================================

  /**
   * Retrieves all non-archived major tasks for the specified user, including nested mini-tasks.
   */
  async getTasks(userId: string): Promise<MajorTask[]> {
    if (this.isMockUser(userId)) {
      return storage.getTasks(userId);
    }

    const supabase = await this.getClient();

    // Temporary Safe Diagnostic Logging (Zero secrets printed)
    const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
    console.log('[TaskService Auth Diagnostic]', {
      hasSession: Boolean(session),
      sessionUserId: session?.user?.id ?? 'none',
      requestedUserId: userId,
      userIdsMatch: session?.user?.id === userId,
      userRole: session?.user?.role ?? 'none',
      hasAccessToken: Boolean(session?.access_token),
      tokenLength: session?.access_token ? session.access_token.length : 0,
      isTokenExpired: session?.expires_at ? (session.expires_at * 1000 < Date.now()) : 'N/A',
      sessionError: sessionErr?.message ?? 'none',
    });

    const { data, error, status, statusText } = await supabase
      .from('major_tasks')
      .select('*, mini_tasks(*)')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('TaskService.getTasks error:', error);
      console.error('TaskService.getTasks error details:', {
        status,
        statusText,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return [];
    }

    return toMajorTaskList((data as MajorTaskWithMiniTasksRow[]) || []);
  }

  /**
   * Retrieves a single major task by ID for the specified user, including nested mini-tasks.
   */
  async getTaskById(id: string, userId: string): Promise<MajorTask | null> {
    if (this.isMockUser(userId) || !isValidUuid(id)) {
      return storage.getTaskById(id, userId);
    }

    const supabase = await this.getClient();
    const { data, error, status, statusText } = await supabase
      .from('major_tasks')
      .select('*, mini_tasks(*)')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      if (error) {
        console.error('TaskService.getTaskById error:', error);
        console.error('TaskService.getTaskById error details:', {
          status,
          statusText,
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          id,
          userId,
        });
      }
      return null;
    }

    const row = data as MajorTaskWithMiniTasksRow;
    return toMajorTask(row, row.mini_tasks || []);
  }

  /**
   * Creates a new major task in Supabase.
   */
  async createMajorTask(
    title: string,
    description: string = '',
    userId: string
  ): Promise<MajorTask | null> {
    if (this.isMockUser(userId)) {
      const task = storage.createMajorTask(title, description, userId);
      this.emitSync();
      return task;
    }

    const supabase = await this.getClient();
    const payload = prepareMajorTaskInsert(title, description, userId);

    const { data, error } = await supabase
      .from('major_tasks')
      .insert(payload)
      .select('*, mini_tasks(*)')
      .single();

    if (error || !data) {
      console.error('TaskService.createMajorTask error:', error?.message);
      return null;
    }

    const created = toMajorTask(data as MajorTaskRow, []);
    this.emitSync();
    return created;
  }

  /**
   * Starts a major task, moving its status to 'in_progress' and setting started_at.
   */
  async startMajorTask(id: string, userId: string): Promise<MajorTask | null> {
    if (this.isMockUser(userId)) {
      const updated = storage.startMajorTask(id, userId);
      this.emitSync();
      return updated;
    }

    const current = await this.getTaskById(id, userId);
    if (!current || current.status === 'completed' || current.status === 'in_progress') {
      return current;
    }

    const supabase = await this.getClient();
    const updates = prepareMajorTaskStatusUpdates('in_progress', current.startedAt, current.createdAt);

    const { data, error } = await supabase
      .from('major_tasks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*, mini_tasks(*)')
      .single();

    if (error || !data) {
      console.error('TaskService.startMajorTask error:', error?.message);
      return null;
    }

    const updated = toMajorTask(data as MajorTaskWithMiniTasksRow, (data as MajorTaskWithMiniTasksRow).mini_tasks || []);
    this.emitSync();
    return updated;
  }

  /**
   * Updates major task attributes (title, description, isArchived, etc.).
   */
  async updateMajorTask(
    id: string,
    updates: Partial<Pick<MajorTask, 'title' | 'description' | 'status' | 'startedAt' | 'isArchived' | 'isCompleted' | 'completedAt'>>,
    userId: string
  ): Promise<MajorTask | null> {
    if (this.isMockUser(userId)) {
      const updated = storage.updateMajorTask(id, updates, userId);
      this.emitSync();
      return updated;
    }

    const current = await this.getTaskById(id, userId);
    if (!current) return null;

    const supabase = await this.getClient();
    const dbUpdates: Record<string, unknown> = {};

    if (updates.title !== undefined) dbUpdates.title = updates.title.trim();
    if (updates.description !== undefined) dbUpdates.description = updates.description.trim();
    if (updates.isArchived !== undefined) dbUpdates.is_archived = updates.isArchived;

    // Handle status / completion synchronization
    if (updates.status !== undefined || updates.isCompleted !== undefined) {
      let targetStatus = updates.status;
      if (!targetStatus && updates.isCompleted !== undefined) {
        targetStatus = updates.isCompleted ? 'completed' : 'in_progress';
      }
      if (targetStatus) {
        const statusUpdates = prepareMajorTaskStatusUpdates(
          targetStatus,
          updates.startedAt !== undefined ? updates.startedAt : current.startedAt,
          current.createdAt
        );
        Object.assign(dbUpdates, statusUpdates);
      }
    }

    const { data, error } = await supabase
      .from('major_tasks')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*, mini_tasks(*)')
      .single();

    if (error || !data) {
      console.error('TaskService.updateMajorTask error:', error?.message);
      return null;
    }

    const updated = toMajorTask(data as MajorTaskWithMiniTasksRow, (data as MajorTaskWithMiniTasksRow).mini_tasks || []);
    this.emitSync();
    return updated;
  }

  /**
   * Completes a major task and all its mini-tasks, clearing active timer sessions.
   */
  async completeMajorTask(id: string, userId: string): Promise<MajorTask | null> {
    if (this.isMockUser(userId)) {
      const completed = storage.completeMajorTask(id, userId);
      this.emitSync();
      return completed;
    }

    const current = await this.getTaskById(id, userId);
    if (!current) return null;

    const supabase = await this.getClient();
    const now = new Date().toISOString();

    // 1. Mark all incomplete mini-tasks as completed
    await supabase
      .from('mini_tasks')
      .update({ is_completed: true, completed_at: now })
      .eq('major_task_id', id)
      .eq('user_id', userId)
      .eq('is_completed', false);

    // 2. Mark major task completed with required non-null started_at and completed_at
    const statusUpdates = prepareMajorTaskStatusUpdates('completed', current.startedAt, current.createdAt);

    const { data, error } = await supabase
      .from('major_tasks')
      .update(statusUpdates)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*, mini_tasks(*)')
      .single();

    // 3. Clear active timer session in storage
    storage.clearTimerSession(id, userId);

    if (error || !data) {
      console.error('TaskService.completeMajorTask error:', error?.message);
      return null;
    }

    const completed = toMajorTask(data as MajorTaskWithMiniTasksRow, (data as MajorTaskWithMiniTasksRow).mini_tasks || []);
    this.emitSync();
    return completed;
  }

  /**
   * Reuses a completed major task: creates a fresh major task and clones its mini-tasks.
   */
  async reuseTask(completedTaskId: string, userId: string): Promise<MajorTask | null> {
    if (this.isMockUser(userId)) {
      const cloned = storage.reuseTask(completedTaskId, userId);
      this.emitSync();
      return cloned;
    }

    const original = await this.getTaskById(completedTaskId, userId);
    if (!original) {
      console.warn(`TaskService.reuseTask: Original task "${completedTaskId}" not found for user "${userId}".`);
      return null;
    }

    // 1. Create new major task
    const newTask = await this.createMajorTask(original.title, original.description, userId);
    if (!newTask) return null;

    // 2. Clone mini-tasks
    const originalMinis = original.miniTasks || [];
    for (let idx = 0; idx < originalMinis.length; idx++) {
      const m = originalMinis[idx];
      await this.addMiniTask(
        newTask.id,
        {
          title: m.title,
          durationMinutes: m.durationMinutes,
          hasBreak: m.hasBreak,
          breakDurationMinutes: m.breakDurationMinutes,
          extraTimeMinutes: 0,
        },
        userId
      );
    }

    const fullCloned = await this.getTaskById(newTask.id, userId);
    this.emitSync();
    return fullCloned;
  }

  /**
   * Deletes a major task. PostgreSQL foreign keys cascade deletion to mini_tasks and timer_sessions.
   */
  async deleteMajorTask(id: string, userId: string): Promise<boolean> {
    if (this.isMockUser(userId)) {
      const res = storage.deleteMajorTask(id, userId);
      this.emitSync();
      return res;
    }

    const supabase = await this.getClient();
    const { error } = await supabase
      .from('major_tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    storage.clearTimerSession(id, userId);

    if (error) {
      console.error('TaskService.deleteMajorTask error:', error.message);
      return false;
    }

    this.emitSync();
    return true;
  }

  // ==========================================================================
  // MINI TASK CRUD
  // ==========================================================================

  /**
   * Adds a new mini-task step to a major task.
   */
  async addMiniTask(
    majorTaskId: string,
    miniTaskData: {
      title: string;
      durationMinutes: number;
      hasBreak: boolean;
      breakDurationMinutes: number;
      extraTimeMinutes?: number;
    },
    userId: string
  ): Promise<MiniTask | null> {
    if (this.isMockUser(userId)) {
      const created = storage.addMiniTask(majorTaskId, miniTaskData, userId);
      this.emitSync();
      return created;
    }

    const supabase = await this.getClient();

    // Query existing mini-tasks count for order_index calculation
    const { count } = await supabase
      .from('mini_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('major_task_id', majorTaskId)
      .eq('user_id', userId);

    const nextOrder = (count || 0) + 1;
    const payload = prepareMiniTaskInsert(majorTaskId, userId, miniTaskData, nextOrder);

    const { data, error } = await supabase
      .from('mini_tasks')
      .insert(payload)
      .select('*')
      .single();

    if (error || !data) {
      console.error('TaskService.addMiniTask error:', error?.message);
      return null;
    }

    this.emitSync();
    return toMiniTask(data as MiniTaskRow);
  }

  /**
   * Updates an existing mini-task and recalculates the parent major task status.
   */
  async updateMiniTask(
    majorTaskId: string,
    miniTaskId: string,
    updates: Partial<MiniTask>,
    userId: string
  ): Promise<MiniTask | null> {
    if (this.isMockUser(userId)) {
      const updated = storage.updateMiniTask(majorTaskId, miniTaskId, updates, userId);
      this.emitSync();
      return updated;
    }

    const supabase = await this.getClient();
    const dbUpdates: Record<string, unknown> = {};

    if (updates.title !== undefined) dbUpdates.title = updates.title.trim();
    if (updates.durationMinutes !== undefined) dbUpdates.duration_minutes = updates.durationMinutes;
    if (updates.extraTimeMinutes !== undefined) dbUpdates.extra_time_minutes = updates.extraTimeMinutes;
    if (updates.hasBreak !== undefined) dbUpdates.has_break = updates.hasBreak;
    if (updates.breakDurationMinutes !== undefined) dbUpdates.break_duration_minutes = updates.breakDurationMinutes;
    if (updates.order !== undefined) dbUpdates.order_index = updates.order;

    if (updates.isCompleted !== undefined) {
      const completionUpdates = prepareMiniTaskCompletionUpdates(updates.isCompleted, updates.completedAt);
      Object.assign(dbUpdates, completionUpdates);

      // Track focus statistics when a mini-task is completed
      if (updates.isCompleted) {
        storage.incrementCompletedMiniTasksCount(1, userId);
      } else {
        storage.incrementCompletedMiniTasksCount(-1, userId);
      }
    }

    const { data, error } = await supabase
      .from('mini_tasks')
      .update(dbUpdates)
      .eq('id', miniTaskId)
      .eq('major_task_id', majorTaskId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error || !data) {
      console.error('TaskService.updateMiniTask error:', error?.message);
      return null;
    }

    // Recalculate parent major task completion / progress status
    const parentTask = await this.getTaskById(majorTaskId, userId);
    if (parentTask && parentTask.miniTasks) {
      const allDone = parentTask.miniTasks.length > 0 && parentTask.miniTasks.every((m) => m.isCompleted);
      const anyDone = parentTask.miniTasks.some((m) => m.isCompleted);

      if (allDone && parentTask.status !== 'completed') {
        await this.completeMajorTask(majorTaskId, userId);
      } else if (!allDone && parentTask.status === 'completed') {
        await this.updateMajorTask(majorTaskId, { status: 'in_progress' }, userId);
      } else if (anyDone && parentTask.status === 'not_started') {
        await this.startMajorTask(majorTaskId, userId);
      }
    }

    this.emitSync();
    return toMiniTask(data as MiniTaskRow);
  }

  /**
   * Deletes a mini-task and re-indexes remaining steps.
   */
  async deleteMiniTask(
    majorTaskId: string,
    miniTaskId: string,
    userId: string
  ): Promise<boolean> {
    if (this.isMockUser(userId)) {
      const res = storage.deleteMiniTask(majorTaskId, miniTaskId, userId);
      this.emitSync();
      return res;
    }

    const supabase = await this.getClient();

    const { error } = await supabase
      .from('mini_tasks')
      .delete()
      .eq('id', miniTaskId)
      .eq('major_task_id', majorTaskId)
      .eq('user_id', userId);

    if (error) {
      console.error('TaskService.deleteMiniTask error:', error.message);
      return false;
    }

    // Re-index remaining mini-tasks
    const { data: remaining } = await supabase
      .from('mini_tasks')
      .select('*')
      .eq('major_task_id', majorTaskId)
      .eq('user_id', userId)
      .order('order_index', { ascending: true });

    if (remaining && remaining.length > 0) {
      for (let i = 0; i < remaining.length; i++) {
        const item = remaining[i];
        if (item.order_index !== i + 1) {
          await supabase
            .from('mini_tasks')
            .update({ order_index: i + 1 })
            .eq('id', item.id)
            .eq('user_id', userId);
        }
      }
    }

    this.emitSync();
    return true;
  }

  /**
   * Reorders mini-tasks by their new sequence.
   */
  async reorderMiniTasks(
    majorTaskId: string,
    reorderedMiniTasks: MiniTask[],
    userId: string
  ): Promise<void> {
    if (this.isMockUser(userId)) {
      storage.reorderMiniTasks(majorTaskId, reorderedMiniTasks, userId);
      this.emitSync();
      return;
    }

    const supabase = await this.getClient();

    // Update order_index sequentially for each task in reordered order
    await Promise.all(
      reorderedMiniTasks.map((task, idx) =>
        supabase
          .from('mini_tasks')
          .update({ order_index: idx + 1 })
          .eq('id', task.id)
          .eq('major_task_id', majorTaskId)
          .eq('user_id', userId)
      )
    );

    this.emitSync();
  }
}

export const taskService = new TaskService();

