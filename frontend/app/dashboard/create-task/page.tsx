'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { canCreateTask, getPlanLimits, isIntervalAllowed, getAvailableIntervals } from '../../../../lib/plans';

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
    schedule_unit: 'm',
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

    if (!canCreate) {
      const limits = getPlanLimits(userPlan);
      setError(`You've reached the maximum of ${limits.maxTasks} tasks for your ${userPlan} plan. Please upgrade to create more tasks.`);
      return;
    }

    // Validate interval based on plan limits
    const scheduleValue = parseInt(formData.schedule_value);
    let intervalMinutes = 0;
    
    if (formData.schedule_unit === 'm') {
      intervalMinutes = scheduleValue;
    } else if (formData.schedule_unit === 'h') {
      intervalMinutes = scheduleValue * 60;
    } else if (formData.schedule_unit === 'd') {
      intervalMinutes = scheduleValue * 1440;
    }

    if (!isIntervalAllowed(intervalMinutes, userPlan)) {
      const limits = getPlanLimits(userPlan);
      setError(`Your ${userPlan} plan requires a minimum interval of ${limits.minIntervalMinutes} minutes. Please increase the interval or upgrade your plan.`);
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

      const schedule_interval = `${formData.schedule_value}${formData.schedule_unit}`;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-task`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/dashboard" className="inline-flex items-center space-x-2 group">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg">
              <span className="text-white font-bold text-sm">AP</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">API Pulse</span>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Task</h1>
              <p className="text-gray-600 mt-1">Schedule a new API endpoint to monitor</p>
            </div>
            {userPlan && (
              <div className="text-right">
                <div className="text-sm text-gray-600">Task usage</div>
                <div className="text-lg font-semibold text-gray-900">
                  {taskCount} / {getPlanLimits(userPlan).maxTasks}
                </div>
              </div>
            )}
          </div>

          {!canCreate && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <span className="text-2xl mr-3">⚠️</span>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                    Task Limit Reached
                  </h3>
                  <p className="text-sm text-yellow-800 mb-3">
                    You've reached the maximum of {getPlanLimits(userPlan).maxTasks} tasks for your{' '}
                    <span className="font-semibold capitalize">{userPlan}</span> plan.
                  </p>
                  <Link
                    href="/pricing"
                    className="inline-block gradient-primary text-white px-4 py-2 rounded-lg hover:shadow-lg text-sm font-semibold transition-all hover:scale-105"
                  >
                    Upgrade Plan →
                  </Link>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="task_name" className="block text-sm font-medium text-gray-700 mb-2">
                Task Name
              </label>
              <input
                id="task_name"
                type="text"
                name="task_name"
                value={formData.task_name}
                onChange={handleChange}
                required
                disabled={!canCreate}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                placeholder="e.g., Check API Status"
              />
            </div>

            <div>
              <label htmlFor="api_url" className="block text-sm font-medium text-gray-700 mb-2">
                API URL
              </label>
              <input
                id="api_url"
                type="url"
                name="api_url"
                value={formData.api_url}
                onChange={handleChange}
                required
                disabled={!canCreate}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all font-mono text-sm"
                placeholder="https://api.example.com/endpoint"
              />
            </div>

            <div>
              <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-2">
                HTTP Method
              </label>
              <select
                id="method"
                name="method"
                value={formData.method}
                onChange={handleChange}
                disabled={!canCreate}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
            </div>

            <div>
              <label htmlFor="schedule" className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                  placeholder="5"
                />
                <select
                  name="schedule_unit"
                  value={formData.schedule_unit}
                  onChange={handleChange}
                  disabled={!canCreate}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                >
                  <option value="m">Minutes</option>
                  <option value="h">Hours</option>
                  <option value="d">Days</option>
                </select>
              </div>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500">
                  Minimum interval: <span className="font-semibold text-purple-600">{getPlanLimits(userPlan).minIntervalMinutes} minutes</span> for {userPlan} plan
                  {getPlanLimits(userPlan).minIntervalMinutes === 60 && ' (1 hour)'}
                  {getPlanLimits(userPlan).minIntervalMinutes === 15 && ' (15 minutes)'}
                  {getPlanLimits(userPlan).minIntervalMinutes === 5 && ' (5 minutes)'}
                </p>
                {(() => {
                  const scheduleValue = parseInt(formData.schedule_value) || 0;
                  let currentMinutes = 0;
                  if (formData.schedule_unit === 'm') currentMinutes = scheduleValue;
                  else if (formData.schedule_unit === 'h') currentMinutes = scheduleValue * 60;
                  else if (formData.schedule_unit === 'd') currentMinutes = scheduleValue * 1440;
                  
                  const minRequired = getPlanLimits(userPlan).minIntervalMinutes;
                  const isValid = currentMinutes >= minRequired;
                  
                  if (scheduleValue > 0 && !isValid) {
                    return (
                      <p className="text-xs text-red-600 font-medium">
                        ⚠️ Interval too short. Minimum: {minRequired} minutes for {userPlan} plan.
                      </p>
                    );
                  }
                  if (scheduleValue > 0 && isValid) {
                    return (
                      <p className="text-xs text-green-600 font-medium">
                        ✓ Interval meets plan requirements
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading || !canCreate}
                className="flex-1 gradient-primary text-white px-6 py-3 rounded-xl hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 shadow-lg hover:scale-[1.02] glow-hover"
              >
                {loading ? 'Creating...' : !canCreate ? 'Upgrade Required' : 'Create Task'}
              </button>
              <Link
                href="/dashboard"
                className="flex-1 bg-white text-gray-900 px-6 py-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 text-center font-semibold transition-all"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
