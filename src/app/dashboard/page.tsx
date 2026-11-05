'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { 
  isMajorTaskCompleted, 
  isMajorTaskInProgress, 
  isMajorTaskNotStarted,
  isMajorTaskActive 
} from '@/lib/storage';
import { taskService } from '@/lib/services/taskService';
import { MajorTask } from '@/types';
import { Sidebar } from '@/components/common/Sidebar';
import { Header } from '@/components/common/Header';
import { MajorTaskCard } from '@/components/tasks/MajorTaskCard';
import { CreateMajorTaskModal } from '@/components/tasks/CreateMajorTaskModal';
import { DeleteConfirmModal } from '@/components/tasks/DeleteConfirmModal';
import { Mascot } from '@/components/common/Mascot';
import { 
  Plus, 
  Target, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Search, 
  Check,
  ListTodo
} from 'lucide-react';

function DashboardContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  
  // Navigation view: 'dashboard' | 'my-tasks' | 'completed'
  const rawView = searchParams.get('view');
  const rawFilter = searchParams.get('filter');
  const view: 'dashboard' | 'my-tasks' | 'completed' = 
    rawView === 'my-tasks' || rawView === 'tasks'
      ? 'my-tasks'
      : rawView === 'completed' || rawFilter === 'completed'
      ? 'completed'
      : 'dashboard';

  const userId = user?.id;
  const [prevUserId, setPrevUserId] = useState<string | null>(userId || null);
  const [tasks, setTasks] = useState<MajorTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState<boolean>(Boolean(userId));

  if (userId !== prevUserId) {
    setPrevUserId(userId || null);
    setTasks([]);
    setIsLoadingTasks(Boolean(userId));
  }

  const [dashboardFilter, setDashboardFilter] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const reloadTasks = async () => {
    if (userId) {
      const fresh = await taskService.getTasks(userId);
      setTasks(fresh);
    } else {
      setTasks([]);
    }
  };

  // Immediate reactive synchronization across tabs, routes, and focus sessions
  useEffect(() => {
    let isMounted = true;

    if (!userId) {
      setTasks([]);
      setIsLoadingTasks(false);
      return;
    }

    const loadInitialTasks = async () => {
      try {
        const fresh = await taskService.getTasks(userId);
        if (isMounted) {
          setTasks(fresh);
          setIsLoadingTasks(false);
        }
      } catch (err) {
        console.error('Error loading tasks:', err);
        if (isMounted) setIsLoadingTasks(false);
      }
    };

    loadInitialTasks();

    const handleSync = async () => {
      if (!userId) return;
      try {
        const fresh = await taskService.getTasks(userId);
        if (isMounted) {
          setTasks(fresh);
        }
      } catch {
        // Ignored in background sync
      }
    };

    window.addEventListener('todo_timer_tasks_updated', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);
    return () => {
      isMounted = false;
      window.removeEventListener('todo_timer_tasks_updated', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [userId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleCreated = async (newTask: MajorTask) => {
    await reloadTasks();
    showToast(`Created objective "${newTask.title}"`);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete || !userId) return;
    const targetId = taskToDelete;
    // Optimistic UI update
    setTasks(prev => prev.filter(t => t.id !== targetId));
    setTaskToDelete(null);

    const success = await taskService.deleteMajorTask(targetId, userId);
    if (success) {
      showToast('Task removed from workspace.');
    } else {
      await reloadTasks();
      showToast('Failed to delete task.');
    }
  };

  const handleReuseTask = async (taskToReuse: MajorTask) => {
    if (!userId) return;
    showToast(`Cloning "${taskToReuse.title}"...`);
    const cloned = await taskService.reuseTask(taskToReuse.id, userId);
    if (cloned) {
      await reloadTasks();
      showToast(`Restored "${cloned.title}" as a new active sequence!`);
    } else {
      showToast('Failed to restore task sequence.');
    }
  };

  // Synchronized counts from single source of truth
  const totalMajorTasks = tasks.length;
  const activeTasks = tasks.filter(t => isMajorTaskActive(t));
  const completedTasks = tasks.filter(t => isMajorTaskCompleted(t));
  const inProgressTasks = tasks.filter(t => isMajorTaskInProgress(t));
  const notStartedTasks = tasks.filter(t => isMajorTaskNotStarted(t));

  const allMiniTasks = tasks.flatMap(t => t.miniTasks || []);
  const totalCompletedMiniTasks = allMiniTasks.filter(m => m.isCompleted).length;
  const totalMiniTasksCount = allMiniTasks.length;

  // Real focused time recorded in user profile
  const profileFocusedMinutes = user?.totalFocusedMinutes || 0;
  const focusedHours = Math.floor(profileFocusedMinutes / 60);
  const focusedMinutesRem = profileFocusedMinutes % 60;

  // Helper filter function for search
  const matchesSearch = (task: MajorTask) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchTitle = task.title.toLowerCase().includes(q);
    const matchDesc = task.description?.toLowerCase().includes(q);
    const matchMini = (task.miniTasks || []).some(m => m.title.toLowerCase().includes(q));
    return matchTitle || matchDesc || matchMini;
  };

  // Time-based friendly greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = user?.name ? user.name.split(' ')[0] : 'friend';

  // Filtered lists for current view
  const searchedActive = activeTasks.filter(matchesSearch);
  const searchedCompleted = completedTasks.filter(matchesSearch);
  const searchedInProgress = inProgressTasks.filter(matchesSearch);
  const searchedNotStarted = notStartedTasks.filter(matchesSearch);

  return (
    <div className="flex min-h-screen bg-[var(--bg-app,#091311)] text-[var(--text-primary,#F2F6F1)] transition-colors">
      {/* Persistent Left Sidebar */}
      <Sidebar 
        taskCount={activeTasks.length} 
        completedCount={completedTasks.length} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed bottom-6 right-6 z-50 bg-[var(--surface-card,#11211F)] text-[var(--text-primary,#F2F6F1)] border border-[var(--primary-accent,#5ACB91)] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
              <Check className="w-4 h-4 text-[var(--primary-accent,#5ACB91)]" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* VIEW: MY TASKS */}
          {view === 'my-tasks' && (
            <div>
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--border-color,#243A34)]">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--soft-mint,#172B27)] text-[var(--primary-accent,#5ACB91)] text-xs font-bold mb-2 border border-[var(--border-color,#243A34)]">
                    <ListTodo className="w-3.5 h-3.5" />
                    <span>My Tasks Workspace</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                    My Tasks
                  </h1>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary,#A5B5AD)] mt-1">
                    Showing <strong className="text-[var(--text-primary,#F2F6F1)]">{activeTasks.length} active and in-progress</strong> major tasks. Completed tasks are safely archived in Completed.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] hover:opacity-90 text-white dark:text-black font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-accent,#5ACB91)]"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Create Major Task</span>
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="my-6">
                <div className="relative max-w-md">
                  <Search className="w-4 h-4 text-[var(--text-secondary,#A5B5AD)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search active objectives..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-[var(--surface-card,#11211F)] border border-[var(--border-color,#243A34)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent,#5ACB91)] text-[var(--text-primary,#F2F6F1)] placeholder:text-[var(--text-secondary,#A5B5AD)]"
                  />
                </div>
              </div>

              {/* Active Tasks Grid */}
              {searchedActive.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {searchedActive.map((task) => (
                    <MajorTaskCard
                      key={task.id}
                      task={task}
                      onDelete={(id) => setTaskToDelete(id)}
                      onReuse={handleReuseTask}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-6 bg-[var(--surface-card,#11211F)] rounded-3xl border border-[var(--border-color,#243A34)] max-w-lg mx-auto">
                  <div className="mb-4 flex justify-center">
                    <Mascot variant="empty" size="md" alt="Girl studying at her desk with laptop and notebook against blue background" />
                  </div>
                  <h3 className="text-base font-bold text-[var(--text-primary,#F2F6F1)]">
                    {searchQuery ? 'No matching active tasks' : 'No active major tasks yet'}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary,#A5B5AD)] mt-1.5 mb-5 max-w-sm mx-auto leading-relaxed">
                    {searchQuery
                      ? 'Try adjusting your search query or clear the filter.'
                      : "Turn your ambitious projects into ordered, focused countdown sequences. Create your first major task to begin."}
                  </p>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] hover:opacity-90 text-white dark:text-black text-xs font-bold shadow-md transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-accent,#5ACB91)]"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Add Major Task</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* VIEW: COMPLETED */}
          {view === 'completed' && (
            <div>
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--border-color,#243A34)]">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--soft-mint,#172B27)] text-[var(--primary-accent,#5ACB91)] text-xs font-bold mb-2 border border-[var(--border-color,#243A34)]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Completed Archive</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                    Completed Objectives
                  </h1>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary,#A5B5AD)] mt-1">
                    Showing <strong className="text-[var(--text-primary,#F2F6F1)]">{completedTasks.length} completed</strong> major tasks with full history and template reuse.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] hover:opacity-90 text-white dark:text-black font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-accent,#5ACB91)]"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Create Major Task</span>
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="my-6">
                <div className="relative max-w-md">
                  <Search className="w-4 h-4 text-[var(--text-secondary,#A5B5AD)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search completed objectives..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-[var(--surface-card,#11211F)] border border-[var(--border-color,#243A34)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent,#5ACB91)] text-[var(--text-primary,#F2F6F1)] placeholder:text-[var(--text-secondary,#A5B5AD)]"
                  />
                </div>
              </div>

              {/* Completed Tasks Grid */}
              {searchedCompleted.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {searchedCompleted.map((task) => (
                    <MajorTaskCard
                      key={task.id}
                      task={task}
                      onDelete={(id) => setTaskToDelete(id)}
                      onReuse={handleReuseTask}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-14 px-6 bg-[var(--surface-card,#11211F)] rounded-3xl border border-[var(--border-color,#243A34)] max-w-lg mx-auto">
                  <div className="mb-4">
                    <Mascot variant="celebrating" size="md" />
                  </div>
                  <h3 className="text-base font-bold text-[var(--text-primary,#F2F6F1)]">
                    {searchQuery ? 'No matching completed tasks' : 'No completed tasks yet'}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary,#A5B5AD)] mt-1.5 mb-5 max-w-sm mx-auto leading-relaxed">
                    {searchQuery
                      ? 'Try searching with different keywords.'
                      : 'Finish your first major sequence in the focus timer to build your completed history.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* VIEW: DASHBOARD (Overview) */}
          {view === 'dashboard' && (
            <div>
              {/* Top Greeting & Action Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--border-color,#243A34)]">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--soft-mint,#172B27)] text-[var(--primary-accent,#5ACB91)] text-xs font-bold mb-2 border border-[var(--border-color,#243A34)]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Dark Focus Studio</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                    {getGreeting()}, {displayName}
                  </h1>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary,#A5B5AD)] mt-1">
                    You have <strong className="text-[var(--text-primary,#F2F6F1)]">{activeTasks.length} active objectives</strong> in sequence. Choose a project to enter deep focus.
                  </p>
                </div>

                {/* Create Major Task Action */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] hover:opacity-90 text-white dark:text-black font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-accent,#5ACB91)]"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Create Major Task</span>
                  </button>
                </div>
              </div>

              {/* 3 Summary Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
                {/* 1. Total Major Tasks */}
                <div className="bg-[var(--surface-card,#11211F)] p-5 rounded-2xl border border-[var(--border-color,#243A34)] shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-secondary,#A5B5AD)] uppercase tracking-wider">Major Tasks</span>
                    <div className="w-8 h-8 rounded-xl bg-[var(--surface-elevated,#172B27)] text-[var(--primary-accent,#5ACB91)] flex items-center justify-center border border-[var(--border-color,#243A34)]">
                      <Target className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary,#F2F6F1)] mt-2 tracking-tight">
                    {totalMajorTasks}
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary,#A5B5AD)] mt-1">
                    {activeTasks.length} active • {completedTasks.length} completed
                  </p>
                </div>

                {/* 2. Mini-Tasks Completed */}
                <div className="bg-[var(--surface-card,#11211F)] p-5 rounded-2xl border border-[var(--border-color,#243A34)] shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-secondary,#A5B5AD)] uppercase tracking-wider">Mini-Tasks Completed</span>
                    <div className="w-8 h-8 rounded-xl bg-[var(--surface-elevated,#172B27)] text-[var(--primary-accent,#5ACB91)] flex items-center justify-center border border-[var(--border-color,#243A34)]">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[var(--primary-accent,#5ACB91)] mt-2 tracking-tight">
                    {totalCompletedMiniTasks}{' '}
                    <span className="text-sm font-semibold text-[var(--text-secondary,#A5B5AD)]">
                      / {totalMiniTasksCount}
                    </span>
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary,#A5B5AD)] mt-1">
                    {totalMiniTasksCount > 0
                      ? `${Math.round((totalCompletedMiniTasks / totalMiniTasksCount) * 100)}% overall completion rate`
                      : 'Add mini-tasks to begin'}
                  </p>
                </div>

                {/* 3. Focused Time */}
                <div className="bg-[var(--surface-card,#11211F)] p-5 rounded-2xl border border-[var(--border-color,#243A34)] shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-secondary,#A5B5AD)] uppercase tracking-wider">Focused Time</span>
                    <div className="w-8 h-8 rounded-xl bg-[var(--surface-elevated,#172B27)] text-[var(--primary-accent,#5ACB91)] flex items-center justify-center border border-[var(--border-color,#243A34)]">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary,#F2F6F1)] mt-2 tracking-tight">
                    {focusedHours}h {focusedMinutesRem}m
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary,#A5B5AD)] mt-1">
                    Pure focused countdown time
                  </p>
                </div>
              </div>

              {/* Filtering & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
                {/* Filter Tabs: All, Not Started, In Progress, Completed */}
                <div className="inline-flex p-1 bg-[var(--surface-card,#11211F)] rounded-xl border border-[var(--border-color,#243A34)]">
                  <button
                    onClick={() => setDashboardFilter('all')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      dashboardFilter === 'all'
                        ? 'bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] text-white dark:text-black shadow-xs'
                        : 'text-[var(--text-secondary,#A5B5AD)] hover:text-[var(--text-primary,#F2F6F1)]'
                    }`}
                  >
                    All ({totalMajorTasks})
                  </button>
                  <button
                    onClick={() => setDashboardFilter('not_started')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      dashboardFilter === 'not_started'
                        ? 'bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] text-white dark:text-black shadow-xs'
                        : 'text-[var(--text-secondary,#A5B5AD)] hover:text-[var(--text-primary,#F2F6F1)]'
                    }`}
                  >
                    Not Started ({notStartedTasks.length})
                  </button>
                  <button
                    onClick={() => setDashboardFilter('in_progress')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      dashboardFilter === 'in_progress'
                        ? 'bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] text-white dark:text-black shadow-xs'
                        : 'text-[var(--text-secondary,#A5B5AD)] hover:text-[var(--text-primary,#F2F6F1)]'
                    }`}
                  >
                    In Progress ({inProgressTasks.length})
                  </button>
                  <button
                    onClick={() => setDashboardFilter('completed')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      dashboardFilter === 'completed'
                        ? 'bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] text-white dark:text-black shadow-xs'
                        : 'text-[var(--text-secondary,#A5B5AD)] hover:text-[var(--text-primary,#F2F6F1)]'
                    }`}
                  >
                    Completed ({completedTasks.length})
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative min-w-[240px]">
                  <Search className="w-3.5 h-3.5 text-[var(--text-secondary,#A5B5AD)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search major objectives..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--surface-card,#11211F)] border border-[var(--border-color,#243A34)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent,#5ACB91)] text-[var(--text-primary,#F2F6F1)] placeholder:text-[var(--text-secondary,#A5B5AD)]"
                  />
                </div>
              </div>

              {/* Categorized Displays */}
              {dashboardFilter === 'all' && (
                <div className="space-y-10">
                  {/* Active Tasks Category */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-bold text-[var(--text-primary,#F2F6F1)] flex items-center gap-2">
                        <Target className="w-4 h-4 text-[var(--primary-accent,#5ACB91)]" />
                        <span>Active Objectives ({searchedActive.length})</span>
                      </h2>
                    </div>

                    {searchedActive.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {searchedActive.map((task) => (
                          <MajorTaskCard
                            key={task.id}
                            task={task}
                            onDelete={(id) => setTaskToDelete(id)}
                            onReuse={handleReuseTask}
                          />
                        ))}
                      </div>
                    ) : searchQuery ? (
                      <div className="p-6 text-center bg-[var(--surface-card,#11211F)] rounded-2xl border border-[var(--border-color,#243A34)] text-xs text-[var(--text-secondary,#A5B5AD)]">
                        No active tasks match your search.
                      </div>
                    ) : (
                      <div className="text-center py-10 px-6 bg-[var(--surface-card,#11211F)] rounded-3xl border border-[var(--border-color,#243A34)] max-w-lg mx-auto">
                        <div className="mb-4 flex justify-center">
                          <Mascot variant="empty" size="md" alt="Girl studying at her desk with laptop and notebook against blue background" />
                        </div>
                        <h3 className="text-base font-bold text-[var(--text-primary,#F2F6F1)]">
                          No active major tasks yet
                        </h3>
                        <p className="text-xs text-[var(--text-secondary,#A5B5AD)] mt-1.5 mb-5 max-w-sm mx-auto leading-relaxed">
                          Break ambitious projects into small, focused countdown sequences. Create your first major task to begin.
                        </p>
                        <button
                          onClick={() => setIsCreateModalOpen(true)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] hover:opacity-90 text-white dark:text-black text-xs font-bold shadow-md transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-accent,#5ACB91)]"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          <span>Add Major Task</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Completed Tasks Category */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-bold text-[var(--text-primary,#F2F6F1)] flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[var(--primary-accent,#5ACB91)]" />
                        <span>Completed Objectives ({searchedCompleted.length})</span>
                      </h2>
                    </div>

                    {searchedCompleted.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {searchedCompleted.map((task) => (
                          <MajorTaskCard
                            key={task.id}
                            task={task}
                            onDelete={(id) => setTaskToDelete(id)}
                            onReuse={handleReuseTask}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center bg-[var(--surface-card,#11211F)] rounded-2xl border border-[var(--border-color,#243A34)] text-xs text-[var(--text-secondary,#A5B5AD)]">
                        {searchQuery ? 'No completed tasks match your search.' : 'No completed tasks yet.'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Not Started Filter Display */}
              {dashboardFilter === 'not_started' && (
                <div>
                  {searchedNotStarted.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {searchedNotStarted.map((task) => (
                        <MajorTaskCard
                          key={task.id}
                          task={task}
                          onDelete={(id) => setTaskToDelete(id)}
                          onReuse={handleReuseTask}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-14 px-6 bg-[var(--surface-card,#11211F)] rounded-3xl border border-[var(--border-color,#243A34)] max-w-lg mx-auto">
                      <div className="mb-4">
                        <Mascot variant="empty" size="md" />
                      </div>
                      <h3 className="text-base font-bold text-[var(--text-primary,#F2F6F1)]">
                        No not-started tasks
                      </h3>
                      <p className="text-xs text-[var(--text-secondary,#A5B5AD)] mt-1.5 mb-5 max-w-sm mx-auto leading-relaxed">
                        All your active objectives have already been initiated into focus countdowns.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* In Progress Filter Display */}
              {dashboardFilter === 'in_progress' && (
                <div>
                  {searchedInProgress.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {searchedInProgress.map((task) => (
                        <MajorTaskCard
                          key={task.id}
                          task={task}
                          onDelete={(id) => setTaskToDelete(id)}
                          onReuse={handleReuseTask}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-14 px-6 bg-[var(--surface-card,#11211F)] rounded-3xl border border-[var(--border-color,#243A34)] max-w-lg mx-auto">
                      <div className="mb-4">
                        <Mascot variant="focused" size="md" />
                      </div>
                      <h3 className="text-base font-bold text-[var(--text-primary,#F2F6F1)]">
                        No in-progress tasks
                      </h3>
                      <p className="text-xs text-[var(--text-secondary,#A5B5AD)] mt-1.5 mb-5 max-w-sm mx-auto leading-relaxed">
                        Start a timer session on any active task to see it tracked here.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Completed Filter Display */}
              {dashboardFilter === 'completed' && (
                <div>
                  {searchedCompleted.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {searchedCompleted.map((task) => (
                        <MajorTaskCard
                          key={task.id}
                          task={task}
                          onDelete={(id) => setTaskToDelete(id)}
                          onReuse={handleReuseTask}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-14 px-6 bg-[var(--surface-card,#11211F)] rounded-3xl border border-[var(--border-color,#243A34)] max-w-lg mx-auto">
                      <div className="mb-4">
                        <Mascot variant="celebrating" size="md" />
                      </div>
                      <h3 className="text-base font-bold text-[var(--text-primary,#F2F6F1)]">
                        No completed tasks
                      </h3>
                      <p className="text-xs text-[var(--text-secondary,#A5B5AD)] mt-1.5 mb-5 max-w-sm mx-auto leading-relaxed">
                        Finish your first major objective in the focus timer to build your completed history.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateMajorTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleCreated}
        userId={user?.id}
      />

      <DeleteConfirmModal
        isOpen={!!taskToDelete}
        title="Delete Major Task?"
        message="This will delete the major task and all associated mini-tasks. This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg-app,#091311)] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--primary-accent,#5ACB91)] border-t-transparent animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
