'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import UsageIndicator from '../../components/UsageIndicator';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface Integration {
  id: string;
  name: string;
  integration_type: string;
  is_active: boolean;
}

interface TaskNotification {
  id: string;
  integration_id: string;
  notify_on: string;
  include_response: boolean;
  user_integrations: Integration;
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);
  const [modal, setModal] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'info'; title?: string }>({ isOpen: false, message: '', type: 'info' });
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; isDangerous?: boolean }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, isDangerous: false });
  
  // Notification modal state
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [availableIntegrations, setAvailableIntegrations] = useState<Integration[]>([]);
  const [taskNotifications, setTaskNotifications] = useState<TaskNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState('');
  const [notifyOn, setNotifyOn] = useState<'always' | 'failure_only' | 'timeout'>('always');
  const [includeResponse, setIncludeResponse] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    // Check for Stripe checkout success
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    if (sessionId) {
      // Remove session_id from URL
      window.history.replaceState({}, document.title, '/dashboard');
      // Show success message
      setTimeout(() => {
        setModal({ isOpen: true, message: 'Payment successful! Your subscription has been activated.', type: 'success', title: 'Success' });
      }, 500);
    }

    const checkAuthAndFetchTasks = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUser(session.user);

      // Ensure profile exists (handles OAuth users and race conditions)
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single();

        if (profileError || !profile) {
          // Profile doesn't exist, create it
          const { error: createError } = await supabase
            .from('profiles')
            .insert([
              {
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || '',
              },
            ]);

          if (createError) {
            console.error('Error creating profile:', createError);
          }
        }
      } catch (err) {
        console.error('Error checking/creating profile:', err);
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/list-tasks`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setTasks(data || []);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to fetch tasks. Status:', response.status, 'Error:', errorData);
          
          if (response.status === 401) {
            // Unauthorized - redirect to login
            router.push('/auth/login');
          } else if (response.status === 403) {
            // Forbidden - permission issue
            setModal({ 
              isOpen: true, 
              title: 'Permission Error',
              message: 'You do not have permission to view tasks. Please contact support.',
              type: 'error'
            });
            setTasks([]);
          } else {
            setModal({ 
              isOpen: true,
              title: 'Error Loading Tasks',
              message: 'Failed to load your tasks. Please refresh the page or try again later.',
              type: 'error'
            });
            setTasks([]);
          }
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setModal({ 
          isOpen: true,
          title: 'Connection Error',
          message: 'Failed to connect to the server. Please check your internet connection and try again.',
          type: 'error'
        });
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchTasks();
  }, [router]);

  const handleLogout = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear session storage and redirect regardless
      sessionStorage.clear();
      localStorage.removeItem('supabase.auth.token');
      
      // Use window.location for hard redirect to ensure logout
      window.location.href = '/auth/login';
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task?',
      isDangerous: true,
      onConfirm: async () => {
        setDeletingTaskId(taskId);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            router.push('/auth/login');
            return;
          }

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-task/${taskId}`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.ok) {
            setTasks(tasks.filter((task: any) => task.id !== taskId));
          } else {
            setModal({ isOpen: true, message: 'Failed to delete task', type: 'error', title: 'Error' });
          }
        } catch (error) {
          console.error('Error deleting task:', error);
          setModal({ isOpen: true, message: 'An error occurred while deleting the task', type: 'error', title: 'Error' });
        } finally {
          setDeletingTaskId(null);
        }
      }
    });
  };

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    setTogglingTaskId(taskId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/toggle-task/${taskId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ is_active: !currentStatus }),
        }
      );

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(tasks.map((task: any) => 
          task.id === taskId ? updatedTask : task
        ));
      } else {
        setModal({ isOpen: true, message: 'Failed to update task status', type: 'error', title: 'Error' });
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      setModal({ isOpen: true, message: 'An error occurred while updating the task', type: 'error', title: 'Error' });
    } finally {
      setTogglingTaskId(null);
    }
  };

  const openNotificationModal = async (task: any) => {
    setSelectedTask(task);
    setShowNotificationModal(true);
    setLoadingNotifications(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      // Fetch available integrations
      const intResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/manage-integrations`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (intResponse.ok) {
        const integrations = await intResponse.json();
        setAvailableIntegrations(integrations || []);
      }

      // Fetch current task notifications
      const notifResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/link-task-notification?task_id=${task.id}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (notifResponse.ok) {
        const notifications = await notifResponse.json();
        setTaskNotifications(notifications || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleAddNotification = async () => {
    if (!selectedIntegration) {
      setModal({ isOpen: true, message: 'Please select an integration', type: 'error', title: 'Error' });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/link-task-notification`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            task_id: selectedTask.id,
            integration_id: selectedIntegration,
            notify_on: notifyOn,
            include_response: includeResponse,
          }),
        }
      );

      if (response.ok) {
        await response.json();
        openNotificationModal(selectedTask);
        setSelectedIntegration('');
        setIncludeResponse(false);
        setModal({ isOpen: true, message: 'Notification added successfully!', type: 'success', title: 'Success' });
      } else {
        const error = await response.json();
        setModal({ isOpen: true, message: `Failed to add notification: ${error.error || 'Unknown error'}`, type: 'error', title: 'Error' });
      }
    } catch (error) {
      console.error('Error adding notification:', error);
      setModal({ isOpen: true, message: 'An error occurred while adding the notification', type: 'error', title: 'Error' });
    }
  };

  const handleRemoveNotification = async (linkId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Notification',
      message: 'Remove this notification?',
      isDangerous: true,
      onConfirm: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/link-task-notification/${linkId}`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            }
          );

          if (response.ok) {
            setTaskNotifications(taskNotifications.filter(n => n.id !== linkId));
          } else {
            setModal({ isOpen: true, message: 'Failed to remove notification', type: 'error', title: 'Error' });
          }
        } catch (error) {
          console.error('Error removing notification:', error);
          setModal({ isOpen: true, message: 'An error occurred while removing the notification', type: 'error', title: 'Error' });
        }
      }
    });
  };

  const getNotificationBadge = (notifyOn: string) => {
    const badges = {
      always: { color: 'bg-blue-100 text-blue-800', text: 'All Executions' },
      failure_only: { color: 'bg-red-100 text-red-800', text: 'Failures Only' },
      timeout: { color: 'bg-yellow-100 text-yellow-800', text: 'Timeouts Only' },
    };
    const badge = badges[notifyOn as keyof typeof badges] || badges.always;
    return <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>{badge.text}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <Modal isOpen={modal.isOpen} title={modal.title} message={modal.message} type={modal.type} onClose={() => setModal({ ...modal, isOpen: false })} />
    <ConfirmModal 
      isOpen={confirmModal.isOpen} 
      title={confirmModal.title} 
      message={confirmModal.message} 
      isDangerous={confirmModal.isDangerous}
      onConfirm={confirmModal.onConfirm} 
      onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })} 
    />
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="glass border-b border-gray-200/50 sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2 group min-w-fit">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg flex-shrink-0">
                <span className="text-white font-bold text-sm">AP</span>
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent hidden sm:inline">API Schedulr</span>
            </Link>
            <div className="flex items-center space-x-3 sm:space-x-6">
              <span className="text-xs sm:text-sm text-gray-700 font-medium truncate max-w-xs">{user?.email}</span>
              <Link
                href="/dashboard/billing"
                className="hidden sm:block text-sm text-gray-700 hover:text-purple-600 font-medium transition-colors"
              >
                Billing
              </Link>
              <Link
                href="/dashboard/settings"
                className="text-xs sm:text-sm text-gray-700 hover:text-purple-600 font-medium transition-colors"
              >
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs sm:text-sm text-gray-700 hover:text-purple-600 font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Usage Indicator */}
        <UsageIndicator />
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">API Tasks</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage your scheduled API calls</p>
          </div>
          <Link
            href="/dashboard/create-task"
            className="w-full sm:w-auto px-4 sm:px-6 py-3 gradient-primary text-white rounded-xl hover:shadow-xl hover:scale-105 font-semibold transition-all duration-200 shadow-lg glow-hover text-center text-sm sm:text-base"
          >
            Create New Task
          </Link>
        </div>

        {/* Tasks Table */}
        {tasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No API tasks yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first scheduled API task</p>
            <Link
              href="/dashboard/create-task"
              className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-semibold transition-all duration-200"
            >
              Create Your First Task
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Task Name</th>
                  <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">API URL</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Method</th>
                  <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Schedule</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tasks.map((task: any) => (
                  <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{task.task_name}</div>
                      <div className="hidden sm:block text-xs text-gray-600 truncate max-w-xs font-mono mt-1">{task.api_url}</div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4">
                      <div className="text-sm text-gray-600 truncate max-w-xs font-mono">{task.api_url}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                        task.method === 'GET' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {task.method}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4">
                      <div className="text-sm text-gray-600">{task.schedule_interval}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <button
                        onClick={() => handleToggleTask(task.id, task.is_active)}
                        disabled={togglingTaskId === task.id}
                        className={`inline-flex px-2 sm:px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                          task.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        } disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}
                      >
                        {togglingTaskId === task.id ? 'Updating...' : (task.is_active ? '▶ Active' : '⏸ Paused')}
                      </button>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                        <button
                          onClick={() => openNotificationModal(task)}
                          className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap"
                        >
                          🔔 Notify
                        </button>
                        <Link
                          href={`/dashboard/task/${task.id}/logs`}
                          className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap"
                        >
                          Logs
                        </Link>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          disabled={deletingTaskId === task.id}
                          className="text-xs sm:text-sm text-red-600 hover:text-red-900 disabled:text-gray-400 transition-colors"
                        >
                          {deletingTaskId === task.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Notification Management Modal */}
      {showNotificationModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-start sticky top-0 bg-white">
              <div>
                <h3 className="text-lg sm:text-lg font-semibold text-gray-900">Manage Notifications</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">{selectedTask.task_name}</p>
              </div>
              <button
                onClick={() => setShowNotificationModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0 ml-4"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {loadingNotifications ? (
                <p className="text-center text-gray-600">Loading...</p>
              ) : (
                <>
                  {/* Current Notifications */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Active Notifications</h4>
                    {taskNotifications.length === 0 ? (
                      <p className="text-xs sm:text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        No notifications configured for this task yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {taskNotifications.map((notif) => (
                          <div
                            key={notif.id}
                            className="flex items-start sm:items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors gap-3"
                          >
                            <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                              <span className="text-lg flex-shrink-0">
                                {notif.user_integrations.integration_type === 'slack' ? '💬' : 
                                 notif.user_integrations.integration_type === 'email' ? '✉️' : 
                                 notif.user_integrations.integration_type === 'discord' ? '🎮' : '📱'}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900 text-sm break-words">{notif.user_integrations.name}</p>
                                <div className="mt-1 flex items-center gap-2 flex-wrap">
                                  {getNotificationBadge(notif.notify_on)}
                                  {notif.include_response && (
                                    <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 whitespace-nowrap">
                                      📝 With Response
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveNotification(notif.id)}
                              className="text-xs sm:text-sm text-red-600 hover:text-red-900 transition-colors flex-shrink-0 whitespace-nowrap"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add New Notification */}
                  {availableIntegrations.length > 0 ? (
                    <div className="border-t pt-6">
                      <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Add Notification</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                            Select Integration
                          </label>
                          <select
                            value={selectedIntegration}
                            onChange={(e) => setSelectedIntegration(e.target.value)}
                            className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm"
                          >
                            <option value="">Choose an integration...</option>
                            {availableIntegrations
                              .filter(int => !taskNotifications.some(tn => tn.integration_id === int.id))
                              .map((integration) => (
                                <option key={integration.id} value={integration.id}>
                                  {integration.name} ({integration.integration_type})
                                </option>
                              ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                            Notify When
                          </label>
                          <select
                            value={notifyOn}
                            onChange={(e) => setNotifyOn(e.target.value as any)}
                            className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm"
                          >
                            <option value="always">Always (every execution)</option>
                            <option value="failure_only">Failure Only (status ≥ 400)</option>
                            <option value="timeout">Timeout/Error Only</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-2">
                            Choose when you want to receive notifications for this task
                          </p>
                        </div>

                        <div className="flex items-start space-x-3 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <input
                            type="checkbox"
                            id="includeResponse"
                            checked={includeResponse}
                            onChange={(e) => setIncludeResponse(e.target.checked)}
                            className="mt-1 h-4 w-4 text-black focus:ring-black border-gray-300 rounded flex-shrink-0"
                          />
                          <label htmlFor="includeResponse" className="flex-1 cursor-pointer">
                            <div className="text-xs sm:text-sm font-medium text-gray-900">
                              Include API Response Body
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              Show the actual API response in notifications (useful for debugging). Long responses will be truncated.
                            </div>
                          </label>
                        </div>

                        <button
                          onClick={handleAddNotification}
                          disabled={!selectedIntegration}
                          className="w-full px-4 py-2 sm:py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-all duration-200 text-sm"
                        >
                          Add Notification
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t pt-6">
                      <p className="text-xs sm:text-sm text-gray-600 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        No integrations available. Please <Link href="/dashboard/settings" className="text-black font-semibold hover:underline">create an integration</Link> first.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
