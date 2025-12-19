'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { getPlanLimits } from '../../lib/plans';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface UsageStats {
  currentRuns: number;
  currentTasks: number;
  maxTasks: number;
  planId: string;
  planName: string;
}

export default function UsageIndicator() {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get user's plan
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan_id')
        .eq('id', session.user.id)
        .single();

      const planId = profile?.plan_id || 'free';
      const limits = getPlanLimits(planId);

      // Get current usage
      const { data: usageData } = await supabase
        .rpc('get_current_month_usage', { p_user_id: session.user.id });

      // Get current task count
      const { count: taskCount } = await supabase
        .from('api_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id);

      setUsage({
        currentRuns: usageData?.[0]?.runs_count || 0,
        currentTasks: taskCount || 0,
        maxTasks: limits.maxTasks,
        planId,
        planName: planId.charAt(0).toUpperCase() + planId.slice(1),
      });
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !usage) return null;

  const tasksPercentage = (usage.currentTasks / usage.maxTasks) * 100;
  const isTasksNearLimit = tasksPercentage >= 80;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Usage This Month</h3>
          <p className="text-sm text-gray-600">{usage.planName} Plan</p>
        </div>
        {isTasksNearLimit && (
          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-1 rounded">
            Approaching Limit
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* API Runs Counter (no limit) */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700">API Runs This Month</span>
            <span className="text-indigo-600 font-semibold">
              {usage.currentRuns.toLocaleString()}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Unlimited runs on your plan
          </div>
        </div>

        {/* API Tasks */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700">API Tasks</span>
            <span className={tasksPercentage >= 90 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
              {usage.currentTasks} / {usage.maxTasks}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                tasksPercentage >= 90
                  ? 'bg-red-500'
                  : tasksPercentage >= 80
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(tasksPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Upgrade CTA */}
      {tasksPercentage >= 80 && usage.planId !== 'pro' && (
        <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <p className="text-sm text-indigo-900 mb-2">
            You're approaching your task limit. Upgrade for more capacity!
          </p>
          <a
            href="/pricing"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            View Plans →
          </a>
        </div>
      )}
    </div>
  );
}
