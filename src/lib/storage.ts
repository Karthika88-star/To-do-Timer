import { MajorTask, MajorTaskStatus, MiniTask, TimerSession, UserProfile } from '@/types';

const STORAGE_KEYS = {
  LEGACY_TASKS: 'todo_timer_major_tasks_v1',
  USER_TASKS_PREFIX: 'todo_timer_tasks_',
  LEGACY_PROFILE: 'todo_timer_user_profile_v1',
  PROFILE_PREFIX: 'todo_timer_profile_',
  AUTH_SESSION: 'todo_timer_auth_session_v1',
  ACTIVE_USER_ID: 'todo_timer_active_user_id_v1',
  TIMER_SESSION_PREFIX: 'todo_timer_session_',
  THEME: 'todo_timer_theme_v1',
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'usr_mock_001',
  name: 'Alex Morgan',
  email: 'alex.morgan@company.com',
  avatarUrl: '',
  preferences: {
    soundEnabled: true,
    autoStartBreak: true,
    autoStartNextTask: false,
    defaultWorkDurationMinutes: 25,
    defaultBreakDurationMinutes: 5,
    themePreference: 'Dark Focus Studio',
  },
  totalFocusedMinutes: 285,
  completedMiniTasksCount: 12,
};

export const INITIAL_SEED_TASKS: MajorTask[] = [
  {
    id: 'task_001',
    title: 'Brand Strategy & Landing Page Launch',
    description: 'Sequenced focus session to finalize messaging, layout specs, and responsive styling.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    status: 'in_progress',
    startedAt: new Date(Date.now() - 86400000).toISOString(),
    isCompleted: false,
    miniTasks: [
      {
        id: 'mini_001',
        majorTaskId: 'task_001',
        title: 'Draft core value propositions & hero copy',
        durationMinutes: 25,
        order: 1,
        isCompleted: true,
        hasBreak: true,
        breakDurationMinutes: 5,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        completedAt: new Date(Date.now() - 82800000).toISOString(),
      },
      {
        id: 'mini_002',
        majorTaskId: 'task_001',
        title: 'Design component layout specs in Figma',
        durationMinutes: 30,
        order: 2,
        isCompleted: true,
        hasBreak: true,
        breakDurationMinutes: 5,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        completedAt: new Date(Date.now() - 43200000).toISOString(),
      },
      {
        id: 'mini_003',
        majorTaskId: 'task_001',
        title: 'Inspect responsive grid & mobile spacing',
        durationMinutes: 20,
        order: 3,
        isCompleted: false,
        hasBreak: true,
        breakDurationMinutes: 5,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'mini_004',
        majorTaskId: 'task_001',
        title: 'Audit accessibility contrast & keyboard focus',
        durationMinutes: 15,
        order: 4,
        isCompleted: false,
        hasBreak: false,
        breakDurationMinutes: 0,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
  },
  {
    id: 'task_002',
    title: 'Client Proposal Architecture & Estimates',
    description: 'Break down scope requirements into engineering sprints and milestone estimates.',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    status: 'in_progress',
    startedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    isCompleted: false,
    miniTasks: [
      {
        id: 'mini_201',
        majorTaskId: 'task_002',
        title: 'Map core functional modules & API contracts',
        durationMinutes: 45,
        order: 1,
        isCompleted: true,
        hasBreak: true,
        breakDurationMinutes: 10,
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        completedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'mini_202',
        majorTaskId: 'task_002',
        title: 'Calculate pessimistic and realistic dev hours',
        durationMinutes: 30,
        order: 2,
        isCompleted: false,
        hasBreak: true,
        breakDurationMinutes: 5,
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
    ],
  },
  {
    id: 'task_003',
    title: 'Mobile App Iconography & Design System',
    description: 'Set up icon sets, color tokens, and elevation guidelines for the upcoming mobile release.',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: 'not_started',
    isCompleted: false,
    miniTasks: [],
  },
  {
    id: 'task_004',
    title: 'Quarterly Product Roadmap & OKR Alignment',
    description: 'Synthesized user research, feature requests, and delivery milestones for Q4 engineering review.',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    status: 'completed',
    isCompleted: true,
    completedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    miniTasks: [
      {
        id: 'mini_401',
        majorTaskId: 'task_004',
        title: 'Synthesize user interview feedback and recurring themes',
        durationMinutes: 30,
        order: 1,
        isCompleted: true,
        hasBreak: true,
        breakDurationMinutes: 5,
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        completedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'mini_402',
        majorTaskId: 'task_004',
        title: 'Draft OKR target metrics and team ownership matrix',
        durationMinutes: 25,
        order: 2,
        isCompleted: true,
        hasBreak: true,
        breakDurationMinutes: 5,
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        completedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
    ],
  },
];

// Consistent status helpers
export function isMajorTaskCompleted(task: MajorTask): boolean {
  if (task.status === 'completed') return true;
  if (task.isCompleted) return true;
  if (task.miniTasks && task.miniTasks.length > 0 && task.miniTasks.every(m => m.isCompleted)) {
    return true;
  }
  return false;
}

export function isMajorTaskInProgress(task: MajorTask): boolean {
  if (isMajorTaskCompleted(task)) return false;
  if (task.status === 'in_progress') return true;
  if (task.startedAt) return true;
  return Boolean(task.miniTasks && task.miniTasks.some(m => m.isCompleted));
}

export function isMajorTaskNotStarted(task: MajorTask): boolean {
  return !isMajorTaskCompleted(task) && !isMajorTaskInProgress(task);
}

export function isMajorTaskActive(task: MajorTask): boolean {
  return !isMajorTaskCompleted(task);
}

export function getMajorTaskStatus(task: MajorTask): MajorTaskStatus {
  if (isMajorTaskCompleted(task)) return 'completed';
  if (isMajorTaskInProgress(task)) return 'in_progress';
  return 'not_started';
}

class StorageService {
  private activeUserId: string | null = null;

  private isClient(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  // --- User-Scoped Session & Key Management ---

  /**
   * Sets the currently authenticated user ID for scoped task isolation.
   * Emits a reactive sync event so all components reload their tasks immediately.
   */
  setActiveUser(userId: string | null): void {
    this.activeUserId = userId;
    if (this.isClient()) {
      if (userId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, userId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER_ID);
      }
      window.dispatchEvent(new CustomEvent('todo_timer_tasks_updated'));
    }
  }

  /**
   * Resolves the active user ID strictly from validated in-memory session.
   * Does not use LocalStorage as an authorization fallback.
   */
  getActiveUserId(): string | null {
    return this.activeUserId;
  }

  /**
   * Computes the isolated storage key for a user's task collection.
   * - usr_mock_001 maps to the legacy key to preserve Alex Morgan's existing tasks.
   * - Authenticated users get their own independent key: todo_timer_tasks_<userId>.
   * - Returns null if no user is authenticated.
   */
  getTaskKey(userId?: string): string | null {
    const id = userId || this.getActiveUserId();
    if (!id) return null;
    if (id === 'usr_mock_001') {
      return STORAGE_KEYS.LEGACY_TASKS;
    }
    return `${STORAGE_KEYS.USER_TASKS_PREFIX}${id}`;
  }

  /**
   * Computes the isolated timer session key for a major task.
   * Returns null if neither an explicit authenticated user ID nor a validated in-memory active user ID exists.
   * Preserves demo behavior only for explicit demo identity 'usr_mock_001'.
   */
  getTimerSessionKey(majorTaskId: string, userId?: string): string | null {
    const id = userId || this.getActiveUserId();
    if (!id) return null;
    if (id === 'usr_mock_001') {
      return `${STORAGE_KEYS.TIMER_SESSION_PREFIX}${majorTaskId}`;
    }
    return `${STORAGE_KEYS.TIMER_SESSION_PREFIX}${id}_${majorTaskId}`;
  }

  /**
   * Safely normalizes and validates task objects from raw parsed storage.
   */
  private normalizeTasks(parsed: unknown[]): MajorTask[] {
    return parsed.map((item: unknown, index: number) => {
      const taskObj = (typeof item === 'object' && item !== null ? item : {}) as Partial<MajorTask>;
      const miniTasks = Array.isArray(taskObj.miniTasks)
        ? taskObj.miniTasks.map((m: Partial<MiniTask>, mIdx: number) => ({
            id: m.id || `mini_${Date.now()}_${mIdx}`,
            majorTaskId: m.majorTaskId || taskObj.id || `task_${index}`,
            title: m.title || 'Untitled Step',
            durationMinutes:
              typeof m.durationMinutes === 'number' && m.durationMinutes > 0 ? m.durationMinutes : 25,
            extraTimeMinutes: typeof m.extraTimeMinutes === 'number' ? m.extraTimeMinutes : 0,
            order: typeof m.order === 'number' ? m.order : mIdx + 1,
            isCompleted: Boolean(m.isCompleted),
            hasBreak: Boolean(m.hasBreak),
            breakDurationMinutes:
              typeof m.breakDurationMinutes === 'number' ? m.breakDurationMinutes : 5,
            createdAt: m.createdAt || new Date().toISOString(),
            completedAt: m.completedAt,
          }))
        : [];

      const allMinisDone = miniTasks.length > 0 && miniTasks.every(m => m.isCompleted);
      const anyMiniDone = miniTasks.some(m => m.isCompleted);
      const isCompleted = taskObj.isCompleted !== undefined ? Boolean(taskObj.isCompleted) : allMinisDone;

      let status: MajorTaskStatus = 'not_started';
      if (isCompleted) {
        status = 'completed';
      } else if (taskObj.status === 'in_progress' || taskObj.startedAt || anyMiniDone) {
        status = 'in_progress';
      } else {
        status = 'not_started';
      }

      return {
        id: taskObj.id || `task_${Date.now()}_${index}`,
        title: taskObj.title || 'Untitled Objective',
        description: taskObj.description || '',
        status,
        startedAt: taskObj.startedAt,
        miniTasks,
        createdAt: taskObj.createdAt || new Date().toISOString(),
        updatedAt: taskObj.updatedAt || new Date().toISOString(),
        isArchived: Boolean(taskObj.isArchived),
        isCompleted,
        completedAt: taskObj.completedAt || (isCompleted ? new Date().toISOString() : undefined),
      } as MajorTask;
    });
  }

  // --- Task Methods with User Scoping ---

  /**
   * Retrieves all major tasks for the active (or specified) user.
   * If unauthenticated, returns an empty list immediately.
   * For newly registered accounts, returns an empty list without seeding demo data.
   */
  getTasks(userId?: string): MajorTask[] {
    if (!this.isClient()) return [];
    try {
      const key = this.getTaskKey(userId);
      if (!key) {
        return [];
      }

      const data = localStorage.getItem(key);
      if (!data) {
        // If legacy demo user key, seed with initial demo tasks
        if (key === STORAGE_KEYS.LEGACY_TASKS) {
          this.saveTasks(INITIAL_SEED_TASKS, userId);
          return INITIAL_SEED_TASKS;
        }
        // Newly registered users start with an empty dashboard
        return [];
      }

      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return this.normalizeTasks(parsed);
      }
      return [];
    } catch (e) {
      console.warn('StorageService: Error parsing tasks', e);
      return [];
    }
  }

  /**
   * Returns Alex Morgan's demo tasks from legacy storage (preserves demo data without leakage).
   */
  getLegacyDemoTasks(): MajorTask[] {
    if (!this.isClient()) return INITIAL_SEED_TASKS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LEGACY_TASKS);
      if (!data) return INITIAL_SEED_TASKS;
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? this.normalizeTasks(parsed) : INITIAL_SEED_TASKS;
    } catch {
      return INITIAL_SEED_TASKS;
    }
  }

  saveTasks(tasks: MajorTask[], userId?: string): void {
    if (!this.isClient()) return;
    try {
      const key = this.getTaskKey(userId);
      if (!key) {
        console.warn('StorageService: Cannot save tasks without an active authenticated user.');
        return;
      }
      localStorage.setItem(key, JSON.stringify(tasks));
      window.dispatchEvent(new CustomEvent('todo_timer_tasks_updated'));
    } catch (e) {
      console.error('StorageService: Error saving tasks', e);
    }
  }

  getTaskById(id: string, userId?: string): MajorTask | null {
    const tasks = this.getTasks(userId);
    return tasks.find(t => t.id === id) || null;
  }

  createMajorTask(title: string, description: string = '', userId?: string): MajorTask | null {
    const key = this.getTaskKey(userId);
    if (!key) {
      console.warn('StorageService: Cannot create major task without an active authenticated user.');
      return null;
    }

    const tasks = this.getTasks(userId);
    const newTask: MajorTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      description: description.trim(),
      status: 'not_started',
      miniTasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCompleted: false,
    };
    tasks.unshift(newTask);
    this.saveTasks(tasks, userId);
    return newTask;
  }

  startMajorTask(id: string, userId?: string): MajorTask | null {
    const tasks = this.getTasks(userId);
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return null;

    if (tasks[index].isCompleted) return tasks[index];

    tasks[index] = {
      ...tasks[index],
      status: 'in_progress',
      startedAt: tasks[index].startedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.saveTasks(tasks, userId);
    return tasks[index];
  }

  updateMajorTask(
    id: string,
    updates: Partial<Pick<MajorTask, 'title' | 'description' | 'status' | 'startedAt' | 'isArchived' | 'isCompleted' | 'completedAt'>>,
    userId?: string
  ): MajorTask | null {
    const tasks = this.getTasks(userId);
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return null;

    tasks[index] = {
      ...tasks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveTasks(tasks, userId);
    return tasks[index];
  }

  completeMajorTask(id: string, userId?: string): MajorTask | null {
    const tasks = this.getTasks(userId);
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return null;

    const completionTime = new Date().toISOString();
    const task = tasks[index];

    const updatedMiniTasks = (task.miniTasks || []).map(m => ({
      ...m,
      isCompleted: true,
      completedAt: m.completedAt || completionTime,
    }));

    tasks[index] = {
      ...task,
      status: 'completed',
      isCompleted: true,
      completedAt: completionTime,
      updatedAt: completionTime,
      miniTasks: updatedMiniTasks,
    };

    this.saveTasks(tasks, userId);
    this.clearTimerSession(id, userId);
    return tasks[index];
  }

  reuseTask(completedTaskId: string, userId?: string): MajorTask | null {
    const tasks = this.getTasks(userId);
    const original = tasks.find(t => t.id === completedTaskId);
    if (!original) return null;

    const newTaskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const clonedMiniTasks: MiniTask[] = (original.miniTasks || []).map((m, idx) => ({
      id: `mini_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
      majorTaskId: newTaskId,
      title: m.title,
      durationMinutes: m.durationMinutes,
      extraTimeMinutes: 0,
      order: idx + 1,
      isCompleted: false,
      hasBreak: m.hasBreak,
      breakDurationMinutes: m.breakDurationMinutes,
      createdAt: now,
    }));

    const newTask: MajorTask = {
      id: newTaskId,
      title: original.title,
      description: original.description,
      miniTasks: clonedMiniTasks,
      status: 'not_started',
      createdAt: now,
      updatedAt: now,
      isCompleted: false,
      isArchived: false,
    };

    tasks.unshift(newTask);
    this.saveTasks(tasks, userId);
    return newTask;
  }

  deleteMajorTask(id: string, userId?: string): boolean {
    const tasks = this.getTasks(userId);
    const filtered = tasks.filter(t => t.id !== id);
    if (filtered.length !== tasks.length) {
      this.saveTasks(filtered, userId);
      this.clearTimerSession(id, userId);
      return true;
    }
    return false;
  }

  // --- MiniTask Methods with User Scoping ---

  addMiniTask(
    majorTaskId: string,
    miniTaskData: Omit<MiniTask, 'id' | 'majorTaskId' | 'order' | 'isCompleted' | 'createdAt'>,
    userId?: string
  ): MiniTask | null {
    const tasks = this.getTasks(userId);
    const taskIndex = tasks.findIndex(t => t.id === majorTaskId);
    if (taskIndex === -1) return null;

    const currentMiniTasks = tasks[taskIndex].miniTasks || [];
    const newMiniTask: MiniTask = {
      ...miniTaskData,
      id: `mini_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      majorTaskId,
      extraTimeMinutes: 0,
      order: currentMiniTasks.length + 1,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    tasks[taskIndex].miniTasks = [...currentMiniTasks, newMiniTask];
    if (tasks[taskIndex].isCompleted) {
      tasks[taskIndex].isCompleted = false;
      delete tasks[taskIndex].completedAt;
    }
    tasks[taskIndex].updatedAt = new Date().toISOString();
    this.saveTasks(tasks, userId);
    return newMiniTask;
  }

  updateMiniTask(
    majorTaskId: string,
    miniTaskId: string,
    updates: Partial<MiniTask>,
    userId?: string
  ): MiniTask | null {
    const tasks = this.getTasks(userId);
    const taskIndex = tasks.findIndex(t => t.id === majorTaskId);
    if (taskIndex === -1) return null;

    const miniTaskIndex = tasks[taskIndex].miniTasks.findIndex(m => m.id === miniTaskId);
    if (miniTaskIndex === -1) return null;

    const updatedMini = {
      ...tasks[taskIndex].miniTasks[miniTaskIndex],
      ...updates,
    };

    if (updates.isCompleted && !tasks[taskIndex].miniTasks[miniTaskIndex].isCompleted) {
      updatedMini.completedAt = new Date().toISOString();
      this.incrementCompletedMiniTasksCount(1, userId);
    } else if (updates.isCompleted === false && tasks[taskIndex].miniTasks[miniTaskIndex].isCompleted) {
      delete updatedMini.completedAt;
      this.incrementCompletedMiniTasksCount(-1, userId);
    }

    tasks[taskIndex].miniTasks[miniTaskIndex] = updatedMini;

    const allMinisDone = tasks[taskIndex].miniTasks.length > 0 && tasks[taskIndex].miniTasks.every(m => m.isCompleted);
    const anyMiniDone = tasks[taskIndex].miniTasks.some(m => m.isCompleted);

    if (allMinisDone) {
      tasks[taskIndex].isCompleted = true;
      tasks[taskIndex].status = 'completed';
      tasks[taskIndex].completedAt = tasks[taskIndex].completedAt || new Date().toISOString();
    } else if (anyMiniDone || tasks[taskIndex].status === 'in_progress' || tasks[taskIndex].startedAt) {
      tasks[taskIndex].isCompleted = false;
      tasks[taskIndex].status = 'in_progress';
      delete tasks[taskIndex].completedAt;
    } else {
      tasks[taskIndex].isCompleted = false;
      tasks[taskIndex].status = 'not_started';
      delete tasks[taskIndex].completedAt;
    }

    tasks[taskIndex].updatedAt = new Date().toISOString();
    this.saveTasks(tasks, userId);
    return updatedMini;
  }

  deleteMiniTask(majorTaskId: string, miniTaskId: string, userId?: string): boolean {
    const tasks = this.getTasks(userId);
    const taskIndex = tasks.findIndex(t => t.id === majorTaskId);
    if (taskIndex === -1) return false;

    const prevLength = tasks[taskIndex].miniTasks.length;
    const remaining = tasks[taskIndex].miniTasks.filter(m => m.id !== miniTaskId);
    if (remaining.length === prevLength) return false;

    tasks[taskIndex].miniTasks = remaining.map((task, idx) => ({
      ...task,
      order: idx + 1,
    }));

    const allMinisDone = tasks[taskIndex].miniTasks.length > 0 && tasks[taskIndex].miniTasks.every(m => m.isCompleted);
    const anyMiniDone = tasks[taskIndex].miniTasks.some(m => m.isCompleted);
    if (allMinisDone) {
      tasks[taskIndex].isCompleted = true;
      tasks[taskIndex].status = 'completed';
      tasks[taskIndex].completedAt = tasks[taskIndex].completedAt || new Date().toISOString();
    } else if (anyMiniDone || tasks[taskIndex].status === 'in_progress' || tasks[taskIndex].startedAt) {
      tasks[taskIndex].isCompleted = false;
      tasks[taskIndex].status = 'in_progress';
      delete tasks[taskIndex].completedAt;
    } else {
      tasks[taskIndex].isCompleted = false;
      tasks[taskIndex].status = 'not_started';
      delete tasks[taskIndex].completedAt;
    }

    tasks[taskIndex].updatedAt = new Date().toISOString();
    this.saveTasks(tasks, userId);
    return true;
  }

  reorderMiniTasks(majorTaskId: string, reorderedMiniTasks: MiniTask[], userId?: string): void {
    const tasks = this.getTasks(userId);
    const taskIndex = tasks.findIndex(t => t.id === majorTaskId);
    if (taskIndex === -1) return;

    tasks[taskIndex].miniTasks = reorderedMiniTasks.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));
    tasks[taskIndex].updatedAt = new Date().toISOString();
    this.saveTasks(tasks, userId);
  }

  // --- Profile & Stat Methods with User Scoping ---

  getProfile(userId?: string): UserProfile {
    if (!this.isClient()) return DEFAULT_USER_PROFILE;
    try {
      const id = userId || this.getActiveUserId();
      const key = id && id !== 'usr_mock_001' ? `${STORAGE_KEYS.PROFILE_PREFIX}${id}` : STORAGE_KEYS.LEGACY_PROFILE;
      const data = localStorage.getItem(key);
      if (!data) {
        if (!id || id === 'usr_mock_001') {
          this.saveProfile(DEFAULT_USER_PROFILE, id || undefined);
          return DEFAULT_USER_PROFILE;
        }
        return {
          ...DEFAULT_USER_PROFILE,
          id,
          name: 'Focus Builder',
          email: '',
          totalFocusedMinutes: 0,
          completedMiniTasksCount: 0,
        };
      }
      return { ...DEFAULT_USER_PROFILE, ...JSON.parse(data) };
    } catch {
      return DEFAULT_USER_PROFILE;
    }
  }

  saveProfile(profile: UserProfile, userId?: string): void {
    if (!this.isClient()) return;
    try {
      const id = userId || profile.id || this.getActiveUserId();
      const key = id && id !== 'usr_mock_001' ? `${STORAGE_KEYS.PROFILE_PREFIX}${id}` : STORAGE_KEYS.LEGACY_PROFILE;
      localStorage.setItem(key, JSON.stringify(profile));
    } catch (e) {
      console.error('StorageService: Error saving profile', e);
    }
  }

  addFocusedMinutes(minutes: number, userId?: string): void {
    if (minutes <= 0) return;
    const profile = this.getProfile(userId);
    profile.totalFocusedMinutes = (profile.totalFocusedMinutes || 0) + minutes;
    this.saveProfile(profile, userId);
  }

  incrementCompletedMiniTasksCount(delta: number = 1, userId?: string): void {
    const profile = this.getProfile(userId);
    profile.completedMiniTasksCount = Math.max(0, (profile.completedMiniTasksCount || 0) + delta);
    this.saveProfile(profile, userId);
  }

  // --- Auth Session Methods (Mock / Local Cache) ---

  getAuthSession(): { email: string; name: string } | null {
    if (!this.isClient()) return null;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  setAuthSession(session: { email: string; name: string }): void {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
  }

  clearAuthSession(): void {
    if (!this.isClient()) return;
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  }

  // --- Timer Session Persistence with User Scoping ---

  getTimerSession(majorTaskId: string, userId?: string): TimerSession | null {
    if (!this.isClient()) return null;
    try {
      const key = this.getTimerSessionKey(majorTaskId, userId);
      if (!key) return null;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  saveTimerSession(session: TimerSession, userId?: string): void {
    if (!this.isClient()) return;
    try {
      const key = this.getTimerSessionKey(session.majorTaskId, userId);
      if (!key) {
        console.warn('StorageService: Cannot save timer session without an active authenticated user.');
        return;
      }
      localStorage.setItem(key, JSON.stringify(session));
    } catch (e) {
      console.error('StorageService: Error saving timer session', e);
    }
  }

  clearTimerSession(majorTaskId: string, userId?: string): void {
    if (!this.isClient()) return;
    try {
      const key = this.getTimerSessionKey(majorTaskId, userId);
      if (!key) return;
      localStorage.removeItem(key);
    } catch (e) {
      console.error('StorageService: Error clearing timer session', e);
    }
  }

  // --- Theme Persistence ---

  getTheme(): 'dark' | 'light' {
    if (!this.isClient()) return 'dark';
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.THEME);
      if (stored === 'light' || stored === 'dark') return stored;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
      return 'dark';
    } catch {
      return 'dark';
    }
  }

  saveTheme(theme: 'dark' | 'light'): void {
    if (!this.isClient()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) {
      console.error('StorageService: Error saving theme', e);
    }
  }
}

export const storage = new StorageService();
