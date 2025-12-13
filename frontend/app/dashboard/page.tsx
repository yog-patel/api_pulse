'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

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
    const checkAuthAndFetchTasks = async () => {
      const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
     router.push('/auth/login');
     return;
      }

      setUser(session.user);

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
          console.error('Failed to fetch tasks');
       setTasks([]);
        }
 } catch (error) {
        console.error('Error fetching tasks:', error);
     setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchTasks();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

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
   alert('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('An error occurred while deleting the task');
    } finally {
      setDeletingTaskId(null);
    }
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
        alert('Failed to update task status');
 }
    } catch (error) {
      console.error('Error toggling task:', error);
      alert('An error occurred while updating the task');
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
      alert('Please select an integration');
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
  await response.json(); // Parse response
      // Refresh notifications
        openNotificationModal(selectedTask);
    setSelectedIntegration('');
  setIncludeResponse(false);
        alert('Notification added successfully!');
      } else {
const error = await response.json();
        alert(`Failed to add notification: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding notification:', error);
    alert('An error occurred while adding the notification');
    }
  };

  const handleRemoveNotification = async (linkId: string) => {
    if (!confirm('Remove this notification?')) return;

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
        alert('Failed to remove notification');
      }
    } catch (error) {
      console.error('Error removing notification:', error);
      alert('An error occurred while removing the notification');
    }
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
      <div className="flex items-center justify-center min-h-screen">
<p className="text-lg text-gray-600">Loading...</p>
</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
    <Link href="/" className="text-2xl font-bold text-indigo-600">
            API Pulse
  </Link>
          <div className="space-x-4">
  <span className="text-gray-600">{user?.email}</span>
            <Link
              href="/dashboard/settings"
   className="text-indigo-600 hover:text-indigo-700 font-medium"
     >
      Settings
       </Link>
            <button
 onClick={handleLogout}
    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
     >
           Sign Out
     </button>
   </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12">
     <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">API Tasks</h1>
      <Link
            href="/dashboard/create-task"
   className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
  >
            Create New Task
  </Link>
  </div>

        {tasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">No API tasks yet.</p>
          <Link
  href="/dashboard/create-task"
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 inline-block"
   >
   Create Your First Task
     </Link>
   </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
   <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Task Name</th>
    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">API URL</th>
       <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Method</th>
      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Schedule</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
           <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
     </thead>
              <tbody className="divide-y divide-gray-200">
   {tasks.map((task: any) => (
      <tr key={task.id} className="hover:bg-gray-50">
     <td className="px-6 py-4 text-sm text-gray-900">{task.task_name}</td>
       <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs">{task.api_url}</td>
         <td className="px-6 py-4 text-sm text-gray-600">
            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
              {task.method}
           </span>
            </td>
           <td className="px-6 py-4 text-sm text-gray-600">{task.schedule_interval}</td>
        <td className="px-6 py-4 text-sm">
          <button
             onClick={() => handleToggleTask(task.id, task.is_active)}
             disabled={togglingTaskId === task.id}
           className={`inline-block px-2 py-1 rounded text-xs font-medium transition-colors ${
            task.is_active
            ? 'bg-green-100 text-green-800 hover:bg-green-200 disabled:bg-gray-100'
        : 'bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:bg-gray-100'
}`}
   >
      {togglingTaskId === task.id ? 'Updating...' : (task.is_active ? '▶ Running' : '⏸ Paused')}
       </button>
     </td>
   <td className="px-6 py-4 text-sm space-x-2">
               <button
         onClick={() => openNotificationModal(task)}
              className="text-purple-600 hover:text-purple-900"
           >
         🔔 Notifications
      </button>
                <Link
         href={`/dashboard/task/${task.id}/logs`}
     className="text-indigo-600 hover:text-indigo-900"
          >
    View Logs
                   </Link>
    <button
         onClick={() => handleDeleteTask(task.id)}
              disabled={deletingTaskId === task.id}
          className="text-red-600 hover:text-red-900 disabled:text-gray-400"
         >
              {deletingTaskId === task.id ? 'Deleting...' : 'Delete'}
           </button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
       <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
  <div>
     <h3 className="text-lg font-semibold text-gray-900">Manage Notifications</h3>
    <p className="text-sm text-gray-600 mt-1">{selectedTask.task_name}</p>
  </div>
      <button
    onClick={() => setShowNotificationModal(false)}
      className="text-gray-500 hover:text-gray-700"
    >
                ✕
 </button>
            </div>

  <div className="p-6 space-y-6">
         {loadingNotifications ? (
     <p className="text-center text-gray-600">Loading...</p>
         ) : (
     <>
             {/* Current Notifications */}
         <div>
   <h4 className="font-medium text-gray-900 mb-3">Active Notifications</h4>
 {taskNotifications.length === 0 ? (
            <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded">
     No notifications configured for this task yet.
    </p>
    ) : (
    <div className="space-y-2">
  {taskNotifications.map((notif) => (
           <div
       key={notif.id}
       className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
         >
  <div className="flex items-center gap-3">
 <span className="text-xl">
        {notif.user_integrations.integration_type === 'slack' ? '💬' : 
            notif.user_integrations.integration_type === 'email' ? '✉️' : '📱'}
 </span>
          <div>
                <p className="font-medium text-gray-900">{notif.user_integrations.name}</p>
    <div className="mt-1 flex items-center gap-2">
     {getNotificationBadge(notif.notify_on)}
       {notif.include_response && (
   <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
      📝 With Response
     </span>
      )}
    </div>
   </div>
 </div>
             <button
   onClick={() => handleRemoveNotification(notif.id)}
    className="text-red-600 hover:text-red-900 text-sm"
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
       <h4 className="font-medium text-gray-900 mb-3">Add Notification</h4>
     <div className="space-y-4">
         <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Select Integration
            </label>
     <select
             value={selectedIntegration}
        onChange={(e) => setSelectedIntegration(e.target.value)}
   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
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
      <label className="block text-sm font-medium text-gray-700 mb-1">
           Notify When
         </label>
           <select
       value={notifyOn}
   onChange={(e) => setNotifyOn(e.target.value as any)}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
        >
      <option value="always">Always (every execution)</option>
    <option value="failure_only">Failure Only (status ≥ 400)</option>
    <option value="timeout">Timeout/Error Only</option>
   </select>
       <p className="text-xs text-gray-500 mt-1">
   Choose when you want to receive notifications for this task
    </p>
        </div>

         <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
  <input
     type="checkbox"
           id="includeResponse"
     checked={includeResponse}
       onChange={(e) => setIncludeResponse(e.target.checked)}
   className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="includeResponse" className="flex-1 cursor-pointer">
     <div className="text-sm font-medium text-gray-900">
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
className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
 Add Notification
     </button>
            </div>
    </div>
              ) : (
     <div className="border-t pt-6">
        <p className="text-sm text-gray-600 bg-yellow-50 p-4 rounded border border-yellow-200">
            No integrations available. Please <Link href="/dashboard/settings" className="text-indigo-600 hover:underline">create an integration</Link> first.
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
  );
}
