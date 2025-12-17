'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { canCreateTask, getPlanLimits } from '../../../../lib/plans';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function CreateTask() {
  const [formData, setFormData] = useState({
    task_name: '',
    api_url: '',
    method: 'GET',
    schedule_value: '5',
    schedule_unit: 'm', // m, h, d
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userPlan, setUserPlan] = useState<string>('free');
  const [taskCount, setTaskCount] = useState<number>(0);
  const [canCreate, setCanCreate] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const checkUserLimits = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/login');
          return;
        }

        // Get user's plan from profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('plan_id')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return;
        }

        const planId = profile?.plan_id || 'free';
        setUserPlan(planId);

        // Get current task count
        const { count, error: tasksError } = await supabase
          .from('api_tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id);

        if (tasksError) {
          console.error('Error fetching tasks:', tasksError);
          return;
        }

        const currentTaskCount = count || 0;
        setTaskCount(currentTaskCount);

        // Check if user can create more tasks
        const allowed = canCreateTask(currentTaskCount, planId);
        setCanCreate(allowed);

        if (!allowed) {
          const limits = getPlanLimits(planId);
          setError(`You've reached the maximum of ${limits.maxTasks} tasks for your ${planId} plan. Please upgrade to create more tasks.`);
        }
      } catch (err) {
        console.error('Error checking user limits:', err);
      }
    };

    checkUserLimits();
  }, [router]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    // Final check before submission
    if (!canCreate) {
      const limits = getPlanLimits(userPlan);
      setError(`You've reached the maximum of ${limits.maxTasks} tasks for your ${userPlan} plan. Please upgrade to create more tasks.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Convert schedule_value and schedule_unit to schedule_interval format
      const schedule_interval = `${formData.schedule_value}${formData.schedule_unit}`;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-task`,
        {
          method: 'POST',
          headers:
           { Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            task_name: formData.task_name,
            api_url: formData.api_url,
            method: formData.method,
            schedule_interval,
          }),
        }
      );

      if (response.ok) {
        router.push('/dashboard');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create task');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-indigo-600">
            API Pulse
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create New Task</h1>
            {userPlan && (
              <span className="text-sm text-gray-600">
                {taskCount} / {getPlanLimits(userPlan).maxTasks} tasks used
              </span>
            )}
          </div>

          {!canCreate && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <span className="text-2xl mr-3">??</span>
                <div>
                  <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                    Task Limit Reached
                  </h3>
                  <p className="text-sm text-yellow-800 mb-3">
                    You've reached the maximum of {getPlanLimits(userPlan).maxTasks} tasks for your{" "}
                    <span className="font-semibold capitalize">{userPlan}</span> plan.
                  </p>
                  <Link
                    href="/pricing"
                    className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium"
                  >
                    Upgrade Plan ?
                  </Link>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Name
              </label>
              <input
                type="text"
                name="task_name"
                value={formData.task_name}
                onChange={handleChange}
                required
                disabled={!canCreate}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="e.g., Check API Status"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API URL
              </label>
              <input
                type="url"
                name="api_url"
                value={formData.api_url}
                onChange={handleChange}
                required
                disabled={!canCreate}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="https://api.example.com/endpoint"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HTTP Method
              </label>
              <select
                name="method"
                value={formData.method}
                onChange={handleChange}
                disabled={!canCreate}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule Interval
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="schedule_value"
                  value={formData.schedule_value}
                  onChange={handleChange}
                  required
                  min="1"
                  disabled={!canCreate}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="5"
                />
                <select
                  name="schedule_unit"
                  value={formData.schedule_unit}
                  onChange={handleChange}
                  disabled={!canCreate}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="m">Minutes</option>
                  <option value="h">Hours</option>
                  <option value="d">Days</option>
                </select>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                e.g., 5 minutes, 1 hour, 1 day (minimum {getPlanLimits(userPlan).minIntervalMinutes} minutes for {userPlan} plan)
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || !canCreate}
                className="flex-1 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : !canCreate ? 'Upgrade Required' : 'Create Task'}
              </button>
              <Link
                href="/dashboard"
                className="flex-1 bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400 text-center"
              >
                Cancel
              </Link>
            </div>

            {!canCreate && (
              <p className="text-red-500 text-sm mt-4">
                You have reached the task limit for your plan. Upgrade to a higher plan to create more tasks.
              </p>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
