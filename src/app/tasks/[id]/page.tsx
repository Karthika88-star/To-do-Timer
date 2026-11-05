'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy, 
  arrayMove 
} from '@dnd-kit/sortable';
import { 
  ArrowLeft, 
  Play, 
  Plus, 
  Clock, 
  ListOrdered, 
  Edit3, 
  Save, 
  ChevronRight,
  Coffee,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import { MajorTask, MiniTask } from '@/types';
import { storage } from '@/lib/storage';
import { taskService } from '@/lib/services/taskService';
import { useAuth } from '@/lib/authContext';
import { Sidebar } from '@/components/common/Sidebar';
import { Header } from '@/components/common/Header';
import { MiniTaskItem } from '@/components/tasks/MiniTaskItem';
import { MiniTaskModal } from '@/components/tasks/MiniTaskModal';
import { DeleteConfirmModal } from '@/components/tasks/DeleteConfirmModal';
import { EmptyState } from '@/components/common/EmptyState';
import { CompletionSummaryModal } from '@/components/timer/CompletionSummaryModal';

function TaskDetailContent() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || '';
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  const userId = currentUserId || undefined;
  const currentId = id || '';

  const [prevId, setPrevId] = useState<string>(currentId);
  const [prevUserId, setPrevUserId] = useState<string | null>(currentUserId);
  const [task, setTask] = useState<MajorTask | null>(null);
  const [isLoadingTask, setIsLoadingTask] = useState<boolean>(true);

  // Editing Major Task Header
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Adjust state during render when id or userId changes
  if (currentId !== prevId || currentUserId !== prevUserId) {
    setPrevId(currentId);
    setPrevUserId(currentUserId);
    setTask(null);
    setIsLoadingTask(true);
  }

  const refreshTask = async () => {
    if (!id || !userId) return;
    try {
      const fresh = await taskService.getTaskById(id, userId);
      if (fresh) {
        setTask(fresh);
        setEditTitle(fresh.title);
        setEditDescription(fresh.description || '');
      } else {
        setTask(null);
      }
    } catch (e) {
      console.error('Error refreshing task:', e);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (!id || !userId) return;

    taskService.getTaskById(id, userId)
      .then(loaded => {
        if (isMounted) {
          setTask(loaded);
          setEditTitle(loaded?.title || '');
          setEditDescription(loaded?.description || '');
          setIsLoadingTask(false);
        }
      })
      .catch(err => {
        console.error('Error loading task:', err);
        if (isMounted) {
          setIsLoadingTask(false);
        }
      });

    const handleSync = async () => {
      if (!id || !userId) return;
      const fresh = await taskService.getTaskById(id, userId);
      if (isMounted && fresh) {
        setTask(fresh);
      }
    };

    window.addEventListener('todo_timer_tasks_updated', handleSync);
    return () => {
      isMounted = false;
      window.removeEventListener('todo_timer_tasks_updated', handleSync);
    };
  }, [id, userId]);

  // Mini-task modal state
  const [isMiniModalOpen, setIsMiniModalOpen] = useState(false);
  const [editingMiniTask, setEditingMiniTask] = useState<MiniTask | null>(null);
  const [miniToDelete, setMiniToDelete] = useState<string | null>(null);

  // Completion modal state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  // Setup DnD sensors with activationConstraint to prevent interfering with clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires 5px drag movement before initiating drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSaveHeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !userId) return;
    const updated = await taskService.updateMajorTask(id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
    }, userId);
    if (updated) {
      setTask(updated);
      setIsEditingHeader(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !task || !userId) return;

    const oldIndex = task.miniTasks.findIndex(m => m.id === active.id);
    const newIndex = task.miniTasks.findIndex(m => m.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(task.miniTasks, oldIndex, newIndex).map((m, idx) => ({
        ...m,
        order: idx + 1,
      }));
      // Optimistic update
      setTask({
        ...task,
        miniTasks: reordered,
      });
      await taskService.reorderMiniTasks(task.id, reordered, userId);
    }
  };

  const handleToggleComplete = async (miniId: string, isCompleted: boolean) => {
    if (!task || !userId) return;
    // Optimistic update
    const updatedMinis = (task.miniTasks || []).map(m =>
      m.id === miniId ? { ...m, isCompleted, completedAt: isCompleted ? new Date().toISOString() : undefined } : m
    );
    setTask({
      ...task,
      miniTasks: updatedMinis,
    });

    await taskService.updateMiniTask(task.id, miniId, { isCompleted }, userId);
    const fresh = await taskService.getTaskById(task.id, userId);
    if (fresh) {
      setTask(fresh);
      const allDone = fresh.miniTasks?.length > 0 && fresh.miniTasks.every(m => m.isCompleted);
      if (allDone && isCompleted) {
        setShowCompletionModal(true);
      }
    }
  };

  // Save mini task, close modal immediately, remain on organizer without navigating
  const handleSaveMiniTask = async (data: {
    title: string;
    durationMinutes: number;
    hasBreak: boolean;
    breakDurationMinutes: number;
  }) => {
    if (!task || !userId) return;
    if (editingMiniTask) {
      await taskService.updateMiniTask(task.id, editingMiniTask.id, data, userId);
    } else {
      await taskService.addMiniTask(task.id, data, userId);
    }
    await refreshTask();
    setIsMiniModalOpen(false);
    setEditingMiniTask(null);
  };

  const handleDeleteMiniConfirm = async () => {
    if (!task || !miniToDelete || !userId) return;
    await taskService.deleteMiniTask(task.id, miniToDelete, userId);
    await refreshTask();
    setMiniToDelete(null);
  };

  // Finish major task flow
  const handleTriggerFinishMajor = () => {
    if (!task) return;
    const mini = task.miniTasks || [];
    const hasUnfinished = mini.some(m => !m.isCompleted);
    if (hasUnfinished) {
      setShowFinishConfirm(true);
    } else {
      completeAndShowModal();
    }
  };

  const completeAndShowModal = async () => {
    if (!task || !userId) return;
    await taskService.completeMajorTask(task.id, userId);
    await refreshTask();
    setShowFinishConfirm(false);
    setShowCompletionModal(true);
  };

  const handleReuseThisTask = async () => {
    if (!task || !userId) return;
    const cloned = await taskService.reuseTask(task.id, userId);
    if (cloned) {
      router.push(`/tasks/${cloned.id}`);
    }
  };

  if (isLoadingTask) {
    return (
      <div className="min-h-screen bg-[var(--bg-app,#091311)] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--primary-accent,#5ACB91)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-[var(--bg-app,#091311)] text-[var(--text-primary,#F2F6F1)] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold">Major Task Not Found</h2>
        <p className="text-xs text-[var(--text-secondary,#A5B5AD)] mt-1 mb-4">
          This task may have been removed or does not exist.
        </p>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] text-white dark:text-black text-xs font-bold rounded-xl"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const miniTasks = task.miniTasks || [];
  const totalCount = miniTasks.length;
  const completedCount = miniTasks.filter(m => m.isCompleted).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const totalWorkMinutes = miniTasks.reduce((acc, m) => acc + (m.durationMinutes || 0) + (m.extraTimeMinutes || 0), 0);
  const totalBreakMinutes = miniTasks.reduce((acc, m) => acc + (m.hasBreak ? m.breakDurationMinutes || 0 : 0), 0);
  const totalPlannedMinutes = totalWorkMinutes + totalBreakMinutes;

  const formatTotalTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h} hr ${m} min`;
    if (h > 0) return `${h} hours`;
    return `${m} minutes`;
  };

  const isCompleted = Boolean(task.isCompleted || (totalCount > 0 && completedCount === totalCount));

  return (
    <div className="flex min-h-screen bg-[var(--bg-app,#091311)] text-[var(--text-primary,#F2F6F1)] transition-colors">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary,#A5B5AD)] mb-5">
            <Link
              href="/dashboard"
              className="hover:text-[var(--text-primary,#F2F6F1)] flex items-center gap-1 font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[var(--text-primary,#F2F6F1)] font-bold truncate max-w-[240px]">
              {task.title}
            </span>
          </div>

          {/* Major Task Overview Header Card */}
          <div className="bg-[var(--surface-card,#11211F)] rounded-3xl border border-[var(--border-color,#243A34)] p-6 sm:p-7 shadow-xs mb-8">
            {isEditingHeader ? (
              <form onSubmit={handleSaveHeader} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary,#F2F6F1)] mb-1">
                    Major Task Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-base font-bold bg-[var(--surface-main,#0B1715)] border border-[var(--border-color,#243A34)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent,#5ACB91)] text-[var(--text-primary,#F2F6F1)]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary,#F2F6F1)] mb-1">
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3.5 py-2 text-sm bg-[var(--surface-main,#0B1715)] border border-[var(--border-color,#243A34)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent,#5ACB91)] text-[var(--text-primary,#F2F6F1)]"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditTitle(task.title);
                      setEditDescription(task.description || '');
                      setIsEditingHeader(false);
                    }}
                    className="px-3.5 py-1.5 text-xs text-[var(--text-secondary,#A5B5AD)] hover:bg-[var(--surface-elevated,#172B27)] rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] text-white dark:text-black rounded-xl shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Overview</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary,#F2F6F1)] tracking-tight">
                      {task.title}
                    </h1>
                    <button
                      onClick={() => setIsEditingHeader(true)}
                      className="p-1.5 text-[var(--text-secondary,#A5B5AD)] hover:text-[var(--text-primary,#F2F6F1)] hover:bg-[var(--surface-elevated,#172B27)] rounded-lg transition-colors shrink-0"
                      title="Edit task title and description"
                      aria-label="Edit title and description"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm text-[var(--text-secondary,#A5B5AD)] leading-relaxed max-w-2xl">
                    {task.description || 'No description provided. Click the edit icon to add details.'}
                  </p>

                  {/* Badges / Metrics Row */}
                  <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-semibold">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--surface-elevated,#172B27)] rounded-xl border border-[var(--border-color,#243A34)] text-[var(--text-primary,#F2F6F1)]">
                      <ListOrdered className="w-3.5 h-3.5 text-[var(--primary-accent,#5ACB91)]" />
                      <span>{totalCount} Mini-Tasks</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--surface-elevated,#172B27)] rounded-xl border border-[var(--border-color,#243A34)] text-[var(--text-primary,#F2F6F1)]">
                      <Clock className="w-3.5 h-3.5 text-[var(--primary-accent,#5ACB91)]" />
                      <span>{formatTotalTime(totalPlannedMinutes)} Estimated</span>
                    </div>

                    {totalBreakMinutes > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--surface-elevated,#172B27)] rounded-xl border border-[var(--border-color,#243A34)] text-[var(--secondary-accent,#8EE5AD)]">
                        <Coffee className="w-3.5 h-3.5" />
                        <span>Includes {totalBreakMinutes}m rest</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Ring & Launch Action */}
                <div className="flex items-center gap-4 border-t lg:border-t-0 lg:border-l border-[var(--border-color,#243A34)] pt-4 lg:pt-0 lg:pl-6 shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-secondary,#A5B5AD)]">
                      Sequence Progress
                    </p>
                    <p className="text-xl font-black text-[var(--primary-accent,#5ACB91)] mt-0.5">
                      {completedCount} / {totalCount} Done
                    </p>
                    <div className="w-28 h-2 rounded-full bg-[var(--surface-elevated,#172B27)] overflow-hidden mt-1.5 ml-auto">
                      <div
                        className="h-full bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {isCompleted ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleReuseThisTask}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] text-white dark:text-black shadow-md hover:opacity-90 transition-all active:scale-[0.98]"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reuse Task</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {totalCount > 0 && (
                        <button
                          onClick={handleTriggerFinishMajor}
                          className="px-3.5 py-3 rounded-2xl font-bold text-xs bg-[var(--surface-elevated,#172B27)] hover:bg-[var(--border-color,#243A34)] text-[var(--text-primary,#F2F6F1)] border border-[var(--border-color,#243A34)] transition-all flex items-center gap-1.5"
                          title="Finish whole task and save completed status"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary-accent,#5ACB91)]" />
                          <span className="hidden sm:inline">Finish Major</span>
                        </button>
                      )}
                      <Link
                        href={`/tasks/${task.id}/focus`}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] ${
                          totalCount === 0
                            ? 'bg-[var(--surface-elevated,#172B27)] text-[var(--text-muted,#6B7C74)] cursor-not-allowed pointer-events-none'
                            : 'bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] text-white dark:text-black'
                        }`}
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Launch Focus Timer</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mini-Tasks Section Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary,#F2F6F1)] tracking-tight">
                Ordered Mini-Tasks
              </h2>
              <p className="text-xs text-[var(--text-secondary,#A5B5AD)]">
                Drag handles to sequence your steps. Each mini-task runs with its own countdown block.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingMiniTask(null);
                setIsMiniModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] text-white dark:text-black font-bold text-xs shadow-sm transition-all active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Mini-Task</span>
            </button>
          </div>

          {/* Mini-Tasks List with @dnd-kit */}
          {miniTasks.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={miniTasks.map(m => m.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2.5" role="list">
                  {miniTasks.map((mini, idx) => (
                    <MiniTaskItem
                      key={mini.id}
                      miniTask={mini}
                      index={idx}
                      onToggleComplete={handleToggleComplete}
                      onEdit={(m) => {
                        setEditingMiniTask(m);
                        setIsMiniModalOpen(true);
                      }}
                      onDelete={(mid) => setMiniToDelete(mid)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <EmptyState
              onAddMiniTask={() => {
                setEditingMiniTask(null);
                setIsMiniModalOpen(true);
              }}
              title="No tasks here yet."
              description="Let's turn your goals into small steps. Add your first mini-task to define duration and breaks."
              buttonLabel="Add Your First Mini-Task"
            />
          )}
        </main>
      </div>

      {/* Mini-Task Modal (Add/Edit) */}
      <MiniTaskModal
        isOpen={isMiniModalOpen}
        editingTask={editingMiniTask}
        onClose={() => {
          setIsMiniModalOpen(false);
          setEditingMiniTask(null);
        }}
        onSave={handleSaveMiniTask}
      />

      {/* Delete Mini-Task Confirmation */}
      <DeleteConfirmModal
        isOpen={!!miniToDelete}
        title="Delete Mini-Task?"
        message="Are you sure you want to remove this mini-task from the sequence?"
        onConfirm={handleDeleteMiniConfirm}
        onCancel={() => setMiniToDelete(null)}
      />

      {/* Finish Major Task Confirmation Dialog (if unfinished tasks remain) */}
      {showFinishConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[var(--surface-card,#11211F)] text-[var(--text-primary,#F2F6F1)] rounded-2xl border border-[var(--border-color,#243A34)] w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-elevated,#172B27)] text-[var(--primary-accent,#5ACB91)] flex items-center justify-center mx-auto mb-3 border border-[var(--border-color,#243A34)]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold">
              Complete Entire Objective?
            </h3>
            <p className="text-xs text-[var(--text-secondary,#A5B5AD)] mt-1.5 leading-relaxed">
              Some mini-tasks are not marked completed yet. Marking this major task complete will mark all steps done and record the completion timestamp.
            </p>
            <div className="flex items-center justify-center gap-2.5 mt-5 pt-4 border-t border-[var(--border-color,#243A34)]">
              <button
                onClick={() => setShowFinishConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary,#A5B5AD)] hover:bg-[var(--surface-elevated,#172B27)] rounded-xl transition-colors"
              >
                Keep Incomplete
              </button>
              <button
                onClick={completeAndShowModal}
                className="px-4 py-2 text-xs font-bold text-white dark:text-black bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] hover:opacity-90 rounded-xl transition-all shadow-sm"
              >
                Confirm Completion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Summary Celebration Modal */}
      <CompletionSummaryModal
        isOpen={showCompletionModal}
        majorTaskId={task.id}
        majorTaskTitle={task.title}
        completedCount={miniTasks.filter(m => m.isCompleted).length || miniTasks.length}
        totalFocusedMinutes={(() => {
          const session = storage.getTimerSession(task.id, userId);
          if (session && typeof session.totalFocusedSeconds === 'number' && session.totalFocusedSeconds > 0) {
            return Math.max(1, Math.round(session.totalFocusedSeconds / 60));
          }
          const actualDoneMinutes = miniTasks
            .filter(m => m.isCompleted)
            .reduce((acc, m) => acc + m.durationMinutes + (m.extraTimeMinutes || 0), 0);
          return actualDoneMinutes > 0 ? actualDoneMinutes : totalPlannedMinutes;
        })()}
        userId={user?.id}
        onRestart={async () => {
          if (!userId) return;
          for (const m of miniTasks) {
            await taskService.updateMiniTask(task.id, m.id, { isCompleted: false }, userId);
          }
          await taskService.updateMajorTask(task.id, { status: 'in_progress' }, userId);
          await refreshTask();
          setShowCompletionModal(false);
        }}
        onClose={() => setShowCompletionModal(false)}
      />
    </div>
  );
}

export default function TaskDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg-app,#091311)] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--primary-accent,#5ACB91)] border-t-transparent animate-spin" />
        </div>
      }
    >
      <TaskDetailContent />
    </Suspense>
  );
}
