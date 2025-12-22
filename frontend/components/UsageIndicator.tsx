'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { getPlanLimits } from '../lib/plans';
import Link from 'next/link';

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
    <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl border-2 border-purple-100 shadow-lg p-6 mb-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full -mr-16 -mt-16 opacity-30 blur-2xl"></div>
      <div className="relative">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Usage This Month</h3>
            <p className="text-sm text-gray-600 mt-1 font-medium">{usage.planName} Plan</p>
          </div>
          {isTasksNearLimit && (
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              Approaching Limit
            </span>
          )}
        </div>

        <div className="space-y-4">
          {/* API Runs Counter */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700 font-medium">API Runs This Month</span>
              <span className="text-black font-semibold">
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
              <span className="text-gray-700 font-medium">API Tasks</span>
              <span className={tasksPercentage >= 90 ? 'text-red-600 font-semibold' : 'text-gray-900 font-semibold'}>
                {usage.currentTasks} / {usage.maxTasks}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  tasksPercentage >= 90
                    ? 'bg-gradient-to-r from-red-500 to-red-600'
                    : tasksPercentage >= 80
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                    : 'gradient-primary'
                }`}
                style={{ width: `${Math.min(tasksPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Upgrade CTA */}
        {tasksPercentage >= 80 && usage.planId !== 'pro' && (
          <div className="mt-6 p-4 gradient-primary rounded-xl shadow-lg border border-purple-200">
            <p className="text-sm text-white mb-2 font-medium">
              You're approaching your task limit. Upgrade for more capacity!
            </p>
            <Link
              href="/pricing"
              className="text-sm font-bold text-white hover:text-purple-100 transition-colors inline-flex items-center"
            >
              View Plans →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
