'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { getPlanLimits } from '../../../../../lib/plans';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function TaskLogs({ params }: { params: { id: string } }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskName, setTaskName] = useState('Task Logs');
  const [error, setError] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [retentionDays, setRetentionDays] = useState<number>(7);
  const router = useRouter();
  const taskId = params.id;

  useEffect(() => {
    const fetchLogsAndTask = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.push('/auth/login');
          return;
        }

        // Get user's plan for log retention
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan_id')
          .eq('id', session.user.id)
          .single();

        const planId = profile?.plan_id || 'free';
        setUserPlan(planId);
        const limits = getPlanLimits(planId);
        setRetentionDays(limits.logRetentionDays);

        // Fetch task details to get task name
        try {
          const taskResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/list-tasks`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (taskResponse.ok) {
            const tasks = await taskResponse.json();
            const task = tasks.find((t: any) => t.id === taskId);
            if (task) {
              setTaskName(task.task_name);
            }
          }
        } catch (taskError) {
          console.error('Error fetching task details:', taskError);
        }

        // Calculate cutoff date based on retention period
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - limits.logRetentionDays);

        // Fetch logs directly from database, filtered by retention period
        try {
          const { data: logs, error } = await supabase
            .from('api_task_logs')
            .select('*')
            .eq('task_id', taskId)
            .gte('executed_at', cutoffDate.toISOString())
            .order('executed_at', { ascending: false });

          if (error) {
            console.error('Database error:', error);
            setError(`Failed to fetch logs: ${error.message}`);
          } else {
            setLogs(Array.isArray(logs) ? logs : []);
            if (logs && logs.length > 0) {
              setExpandedLogId(logs[0].id);
            }
          }
        } catch (dbError: any) {
          console.error('Database fetch error:', dbError);
          setError(dbError.message || 'Failed to fetch logs');
        }
      } catch (err: any) {
        console.error('Error:', err);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchLogsAndTask();
  }, [taskId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <span className="text-white font-bold text-sm">AP</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">API Schedulr</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">Task Logs</h1>
              <p className="text-gray-600 mt-1">{taskName}</p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Showing last {retentionDays} days ({userPlan} plan)
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {error && (
            <div className="bg-red-50 border-b border-red-200 text-red-800 px-6 py-4">
              {error}
            </div>
          )}
          {logs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-600 mb-2">No logs found for this task.</p>
              <p className="text-sm text-gray-500">
                Showing logs from the last {retentionDays} days ({userPlan} plan)
              </p>
              {userPlan !== 'pro' && (
                <Link
                  href="/pricing"
                  className="inline-block mt-4 text-sm text-purple-600 hover:text-purple-700 font-semibold"
                >
                  Upgrade to see more history →
                </Link>
              )}
            </div>
          ) : (
            <>
              {userPlan !== 'pro' && (
                <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Note:</span> Showing logs from the last {retentionDays} days. 
                    <Link href="/pricing" className="ml-1 text-blue-600 hover:text-blue-700 font-semibold underline">
                      Upgrade to {userPlan === 'free' ? 'Starter' : 'Pro'} to see {userPlan === 'free' ? '14' : '30'} days of history
                    </Link>
                  </p>
                </div>
              )}
            <div className="divide-y divide-gray-200">
              {logs.map((log) => (
                <div key={log.id}>
                  <div 
                    className="flex items-center px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                  >
                    <span className="text-gray-400 font-semibold w-6 text-center flex-shrink-0">
                      {expandedLogId === log.id ? '▼' : '▶'}
                    </span>
                    <div className="flex-1 grid grid-cols-4 gap-6 ml-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Executed At</p>
                        <p className="text-sm text-gray-900 mt-1">
                          {new Date(log.executed_at).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Status</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${
                          log.status_code >= 200 && log.status_code < 300
                            ? 'bg-green-100 text-green-800'
                            : log.status_code ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {log.status_code || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Response Time</p>
                        <p className="text-sm text-gray-600 mt-1">{log.response_time_ms}ms</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Error</p>
                        <p className="text-sm text-red-600 mt-1 truncate">{log.error_message || '-'}</p>
                      </div>
                    </div>
                  </div>
                  {expandedLogId === log.id && (
                    <div className="bg-gray-50 px-6 py-6 border-t border-gray-200">
                      <div className="space-y-6">
                        {log.response_body && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 text-sm">Response Body:</h4>
                            <div className="bg-white border border-gray-200 rounded-lg p-4 overflow-auto max-h-64">
                              <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words font-mono">
                                {typeof log.response_body === 'string' 
                                  ? log.response_body 
                                  : JSON.stringify(log.response_body, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                        {log.response_headers && Object.keys(log.response_headers).length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 text-sm">Response Headers:</h4>
                            <div className="bg-white border border-gray-200 rounded-lg p-4 overflow-auto max-h-64">
                              <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words font-mono">
                                {JSON.stringify(log.response_headers, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                        {log.error_message && (
                          <div>
                            <h4 className="font-semibold text-red-900 mb-3 text-sm">Error Details:</h4>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <pre className="text-xs text-red-700 whitespace-pre-wrap break-words font-mono">
                                {log.error_message}
                              </pre>
                            </div>
                          </div>
                        )}
                        {!log.response_body && !log.error_message && (
                          <p className="text-sm text-gray-500">No additional details available</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
