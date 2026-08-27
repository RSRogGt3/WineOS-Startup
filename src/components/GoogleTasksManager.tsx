import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  CheckSquare,
  Plus,
  Trash2,
  ListTodo,
  Calendar,
  AlertCircle,
  RefreshCw,
  Sparkles,
  LogOut,
  FolderPlus,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  GoogleTaskList,
  GoogleTask,
  getTaskLists,
  createTaskList,
  deleteTaskList,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  clearCompletedTasks,
} from '../services/tasksApi';
import { googleSignIn, logout, initAuth } from '../services/auth';

export const GoogleTasksManager: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [taskLists, setTaskLists] = useState<GoogleTaskList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [tasks, setTasks] = useState<GoogleTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // New list dialog state
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);

  // Confirmation dialog state for destructive actions
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  // Expanded notes toggle
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
        setAuthLoading(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setAuthLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Fetch task lists whenever token changes
  useEffect(() => {
    if (token && user) {
      loadTaskLists();
    }
  }, [token, user]);

  // Fetch tasks whenever selectedListId changes
  useEffect(() => {
    if (selectedListId && token) {
      loadTasks(selectedListId);
    }
  }, [selectedListId, token]);

  const loadTaskLists = async () => {
    setError(null);
    try {
      const lists = await getTaskLists();
      setTaskLists(lists);
      if (lists.length > 0 && !selectedListId) {
        setSelectedListId(lists[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load task lists from Google Tasks');
    }
  };

  const loadTasks = async (listId: string) => {
    setLoadingTasks(true);
    setError(null);
    try {
      const items = await getTasks(listId);
      setTasks(items);
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
      }
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setTaskLists([]);
    setTasks([]);
    setSelectedListId('');
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedListId) return;

    setIsAddingTask(true);
    setError(null);
    try {
      const dueIso = newTaskDueDate ? new Date(newTaskDueDate).toISOString() : undefined;
      const created = await createTask(selectedListId, {
        title: newTaskTitle.trim(),
        notes: newTaskNotes.trim() || undefined,
        due: dueIso,
      });

      setTasks(prev => [created, ...prev]);
      setNewTaskTitle('');
      setNewTaskNotes('');
      setNewTaskDueDate('');
    } catch (err: any) {
      setError(err.message || 'Failed to create task in Google Tasks');
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleToggleTaskStatus = async (task: GoogleTask) => {
    if (!selectedListId) return;
    const newStatus = task.status === 'completed' ? 'needsAction' : 'completed';

    // Optimistic UI update
    setTasks(prev =>
      prev.map(t => (t.id === task.id ? { ...t, status: newStatus } : t))
    );

    try {
      await updateTask(selectedListId, task.id, { status: newStatus });
    } catch (err: any) {
      // Revert on error
      setTasks(prev =>
        prev.map(t => (t.id === task.id ? { ...t, status: task.status } : t))
      );
      setError(err.message || 'Failed to update task status');
    }
  };

  const requestDeleteTask = (task: GoogleTask) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Google Task',
      description: `Are you sure you want to permanently delete the task "${task.title}"? This action will remove it from your Google Tasks account.`,
      actionLabel: 'Delete Task',
      onConfirm: async () => {
        if (!selectedListId) return;
        try {
          await deleteTask(selectedListId, task.id);
          setTasks(prev => prev.filter(t => t.id !== task.id));
          setConfirmModal(null);
        } catch (err: any) {
          setError(err.message || 'Failed to delete task');
          setConfirmModal(null);
        }
      },
    });
  };

  const requestDeleteList = (list: GoogleTaskList) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Task List',
      description: `Are you sure you want to delete the task list "${list.title}" and all its tasks? This action cannot be undone.`,
      actionLabel: 'Delete List',
      onConfirm: async () => {
        try {
          await deleteTaskList(list.id);
          const remaining = taskLists.filter(l => l.id !== list.id);
          setTaskLists(remaining);
          setSelectedListId(remaining.length > 0 ? remaining[0].id : '');
          setConfirmModal(null);
        } catch (err: any) {
          setError(err.message || 'Failed to delete list');
          setConfirmModal(null);
        }
      },
    });
  };

  const requestClearCompleted = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Clear Completed Tasks',
      description: 'Are you sure you want to clear all completed tasks in this list? Completed items will be removed from your Google Tasks list view.',
      actionLabel: 'Clear Completed',
      onConfirm: async () => {
        if (!selectedListId) return;
        try {
          await clearCompletedTasks(selectedListId);
          setTasks(prev => prev.filter(t => t.status !== 'completed'));
          setConfirmModal(null);
        } catch (err: any) {
          setError(err.message || 'Failed to clear completed tasks');
          setConfirmModal(null);
        }
      },
    });
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    setIsCreatingList(true);
    try {
      const created = await createTaskList(newListTitle.trim());
      setTaskLists(prev => [...prev, created]);
      setSelectedListId(created.id);
      setNewListTitle('');
      setShowNewListModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create new task list');
    } finally {
      setIsCreatingList(false);
    }
  };

  const handleImportOsChecklist = async () => {
    if (!selectedListId) return;

    const checklistItems = [
      {
        title: 'Verify multilib repository in pacman.conf',
        notes: 'Ensure [multilib] section is uncommented for 32-bit Wine games and library dependencies.',
      },
      {
        title: 'Configure Wine Mono and Gecko dependencies',
        notes: 'Check packages.x86_64 for wine, wine-mono, and wine-gecko packages.',
      },
      {
        title: 'Apply UFW firewall rules & sync freshclam signatures',
        notes: 'Test airootfs/root/security_setup.sh for default deny incoming policy.',
      },
      {
        title: 'Compile ISO using sudo mkarchiso -v -w /tmp/archiso-tmp',
        notes: 'Verify output ISO file generated in ./out directory without warnings.',
      },
      {
        title: 'Test Live ISO boot in QEMU (UEFI x64 & BIOS)',
        notes: 'qemu-system-x86_64 -m 4G -cdrom ./out/wine-os-alpha.iso -enable-kvm',
      },
      {
        title: 'Validate Windows Application (.exe) execution in Wine',
        notes: 'Test launching standard Windows test binaries and DXVK HUD overlays.',
      },
    ];

    setLoadingTasks(true);
    try {
      for (const item of checklistItems) {
        await createTask(selectedListId, item);
      }
      await loadTasks(selectedListId);
    } catch (err: any) {
      setError(err.message || 'Failed to import OS checklist to Google Tasks');
    } finally {
      setLoadingTasks(false);
    }
  };

  const toggleNoteExpand = (taskId: string) => {
    setExpandedTaskIds(prev => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  if (authLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
        <p className="text-sm text-slate-400">Connecting to Google Tasks service...</p>
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-xl mx-auto shadow-2xl space-y-6 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <CheckSquare className="w-8 h-8 text-white" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">Connect to Google Tasks</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Sync and manage your Arch Wine OS development roadmap, build milestones, and testing checklists directly in your real Google Tasks account.
          </p>
        </div>

        {error && (
          <div className="bg-rose-950/30 border border-rose-500/30 rounded-lg p-3 text-xs text-rose-300 text-left flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="pt-2 flex justify-center">
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="flex items-center space-x-3 px-6 py-3 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-xl text-sm transition-all shadow-lg hover:shadow-xl cursor-pointer disabled:opacity-75"
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span>{isLoggingIn ? 'Signing in with Google...' : 'Sign in with Google'}</span>
          </button>
        </div>
      </div>
    );
  }

  const selectedList = taskLists.find(l => l.id === selectedListId);
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Google Tasks Integration</h2>
              <span className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-medium flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Connected</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live sync with Google account: <span className="text-slate-300 font-mono">{user.email}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadTaskLists}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors border border-slate-700 cursor-pointer"
            title="Refresh Lists & Tasks"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors border border-slate-700 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-4 text-xs text-rose-300 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Google Tasks API Notice:</span> {error}
          </div>
        </div>
      )}

      {/* Main Grid: List Selector & Task Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Task Lists Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 lg:col-span-1">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Task Lists</span>
            <button
              onClick={() => setShowNewListModal(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New List</span>
            </button>
          </div>

          <div className="space-y-1">
            {taskLists.map(list => {
              const isSelected = list.id === selectedListId;
              return (
                <div
                  key={list.id}
                  onClick={() => setSelectedListId(list.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors cursor-pointer group ${
                    isSelected
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                      : 'hover:bg-slate-800 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <ListTodo className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span className="text-sm font-medium truncate">{list.title}</span>
                  </div>

                  {taskLists.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        requestDeleteList(list);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-slate-500 transition-opacity cursor-pointer"
                      title="Delete List"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={handleImportOsChecklist}
              disabled={!selectedListId || loadingTasks}
              className="w-full flex items-center justify-center space-x-2 p-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Import OS Build Checklist</span>
            </button>
          </div>
        </div>

        {/* Right: Active Task List Content */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl lg:col-span-3 p-6 space-y-6 flex flex-col justify-between">
          {/* Header & Quick Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>{selectedList?.title || 'Tasks'}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {tasks.length} total tasks ({completedCount} completed)
              </p>
            </div>

            {completedCount > 0 && (
              <button
                onClick={requestClearCompleted}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors border border-slate-700 cursor-pointer self-start sm:self-auto"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Clear {completedCount} Completed</span>
              </button>
            )}
          </div>

          {/* Add New Task Form */}
          <form onSubmit={handleCreateTask} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Add a new task (e.g., Test Wine 32-bit DirectX 9 apps)..."
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="date"
                value={newTaskDueDate}
                onChange={e => setNewTaskDueDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isAddingTask || !newTaskTitle.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            </div>
            <input
              type="text"
              placeholder="Optional notes or command lines (e.g. pacman -S wine-gecko)..."
              value={newTaskNotes}
              onChange={e => setNewTaskNotes(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-3.5 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </form>

          {/* Task Items List */}
          <div className="flex-1 space-y-2 overflow-y-auto max-h-[500px] pr-1">
            {loadingTasks && (
              <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                <span className="text-xs">Loading tasks from Google...</span>
              </div>
            )}

            {!loadingTasks && tasks.length === 0 && (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <CheckSquare className="w-10 h-10 mx-auto text-slate-700" />
                <p className="text-sm">No tasks in this list yet.</p>
                <p className="text-xs text-slate-600">
                  Add a task above or click &ldquo;Import OS Build Checklist&rdquo; to populate default milestones.
                </p>
              </div>
            )}

            {!loadingTasks &&
              tasks.map(task => {
                const isCompleted = task.status === 'completed';
                const isExpanded = expandedTaskIds[task.id];
                return (
                  <div
                    key={task.id}
                    className={`bg-slate-950 border rounded-xl p-3.5 transition-all flex flex-col space-y-2 ${
                      isCompleted
                        ? 'border-slate-800/60 opacity-60'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleTaskStatus(task)}
                          className={`w-5 h-5 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                            isCompleted
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'border-slate-600 bg-slate-900 hover:border-indigo-400'
                          }`}
                        >
                          {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-sm font-medium leading-snug break-words ${
                              isCompleted ? 'line-through text-slate-500' : 'text-slate-200'
                            }`}
                          >
                            {task.title}
                          </div>

                          <div className="flex items-center space-x-3 mt-1.5 text-xs text-slate-500">
                            {task.due && (
                              <span className="flex items-center space-x-1 text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/50">
                                <Calendar className="w-3 h-3" />
                                <span>Due: {new Date(task.due).toLocaleDateString()}</span>
                              </span>
                            )}

                            {task.notes && (
                              <button
                                onClick={() => toggleNoteExpand(task.id)}
                                className="flex items-center space-x-1 text-slate-400 hover:text-slate-300 cursor-pointer"
                              >
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                <span>{isExpanded ? 'Hide Notes' : 'View Notes'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => requestDeleteTask(task)}
                        className="p-1 text-slate-600 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {task.notes && isExpanded && (
                      <div className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-2.5 text-xs text-slate-300 font-mono whitespace-pre-wrap mt-1">
                        {task.notes}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Destructive Actions (MANDATORY per skill guidelines) */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">{confirmModal.title}</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {confirmModal.description}
            </p>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                {confirmModal.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New List Modal */}
      {showNewListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-indigo-400">
              <FolderPlus className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Create Google Task List</h3>
            </div>

            <form onSubmit={handleCreateList} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  List Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Arch Wine OS Releases"
                  value={newListTitle}
                  onChange={e => setNewListTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewListModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingList || !newListTitle.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isCreatingList ? 'Creating...' : 'Create List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
