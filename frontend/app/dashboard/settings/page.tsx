'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import Modal from '../../../components/Modal';
import ConfirmModal from '../../../components/ConfirmModal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface Integration {
  id: string;
  name: string;
  integration_type: string;
  is_active: boolean;
  created_at: string;
}

export default function Settings() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'email' | 'slack' | 'discord' | 'webhook'>('slack');
  const [user, setUser] = useState<any>(null);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'info'; title?: string }>({ isOpen: false, message: '', type: 'info' });
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; isDangerous?: boolean }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, isDangerous: false });
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    slackWebhook: '',
    discordWebhook: '',
    webhookUrl: '',
  });

  useEffect(() => {
    checkAuthAndFetchIntegrations();
  }, []);

  const checkAuthAndFetchIntegrations = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/auth/login');
      return;
    }

    setUser(session.user);

    // Fetch user's plan
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('plan_id')
        .eq('id', session.user.id)
        .single();

      if (!profileError && profile) {
        const planId = profile.plan_id || 'free';
        setUserPlan(planId);
        // Set default selected type based on plan
        if (planId === 'free') {
          // Free users can't use any notifications, but we'll show upgrade message
          setSelectedType('slack'); // Default, but will be disabled
        } else if (planId !== 'pro' && selectedType === 'email') {
          setSelectedType('slack');
        }
      }
    } catch (error) {
      console.error('Error fetching user plan:', error);
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/manage-integrations`,
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
        setIntegrations(data || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch integrations. Status:', response.status, 'Error:', errorData);
        
        if (response.status === 401) {
          // Unauthorized - redirect to login
          router.push('/auth/login');
        } else if (response.status === 403) {
          // Forbidden - permission issue
          setAlertModal({ 
            isOpen: true,
            title: 'Permission Error',
            message: 'You do not have permission to view integrations. Please contact support.',
            type: 'error'
          });
          setIntegrations([]);
        } else {
          setAlertModal({ 
            isOpen: true,
            title: 'Error Loading Integrations',
            message: 'Failed to load your integrations. Please refresh the page or try again later.',
            type: 'error'
          });
          setIntegrations([]);
        }
      }
    } catch (error) {
      console.error('Error fetching integrations:', error);
      setAlertModal({ 
        isOpen: true,
        title: 'Connection Error',
        message: 'Failed to connect to the server. Please check your internet connection and try again.',
        type: 'error'
      });
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIntegration = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent free users from adding integrations
    if (userPlan === 'free') {
      setAlertModal({ isOpen: true, message: 'Free plan users can only view logs in the dashboard. Please upgrade to add notification integrations.', type: 'error' });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const payload: any = {
      name: formData.name,
      integration_type: selectedType,
    };

    if (selectedType === 'email') {
      payload.credentials = { email: formData.email };
    } else if (selectedType === 'slack') {
      payload.credentials = { webhook_url: formData.slackWebhook };
    } else if (selectedType === 'discord') {
      payload.credentials = { webhook_url: formData.discordWebhook };
    } else if (selectedType === 'webhook') {
      payload.credentials = { webhook_url: formData.webhookUrl };
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/manage-integrations`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setIntegrations([...integrations, data]);
        setShowModal(false);
        setFormData({ name: '', email: '', slackWebhook: '', discordWebhook: '', webhookUrl: '' });
        setAlertModal({ isOpen: true, message: 'Integration added successfully! Check your channel for a test message.', type: 'success', title: 'Success' });
      } else {
        console.error('Failed to create integration:', data);
        setAlertModal({ isOpen: true, message: `Failed to create integration: ${data.error || 'Unknown error'}`, type: 'error', title: 'Error' });
      }
    } catch (error) {
      console.error('Error creating integration:', error);
      setAlertModal({ isOpen: true, message: 'An error occurred while creating the integration. Please check the console for details.', type: 'error', title: 'Error' });
    }
  };

  const handleDeleteIntegration = async (integrationId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Integration',
      message: 'Are you sure you want to delete this integration?',
      isDangerous: true,
      onConfirm: async () => {
        setDeletingId(integrationId);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/manage-integrations/${integrationId}`,
            {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
            }
          );

          if (response.ok) {
            setIntegrations(integrations.filter(i => i.id !== integrationId));
          } else {
            setAlertModal({ isOpen: true, message: 'Failed to delete integration', type: 'error', title: 'Error' });
          }
        } catch (error) {
          console.error('Error deleting integration:', error);
          setAlertModal({ isOpen: true, message: 'An error occurred while deleting the integration', type: 'error', title: 'Error' });
        } finally {
          setDeletingId(null);
        }
      }
    });
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'email':
        return '✉️';
      case 'slack':
        return '💬';
      case 'discord':
        return '🎮';
      case 'webhook':
        return '🔗';
      default:
        return '🔔';
    }
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
    <Modal isOpen={alertModal.isOpen} title={alertModal.title} message={alertModal.message} type={alertModal.type} onClose={() => setAlertModal({ ...alertModal, isOpen: false })} />
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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center space-x-2 min-w-fit">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">AP</span>
              </div>
              <span className="text-lg sm:text-xl font-semibold text-gray-900 hidden sm:inline">API Schedulr</span>
            </Link>
            <div className="flex items-center space-x-3 sm:space-x-6">
              <span className="text-xs sm:text-sm text-gray-600 truncate max-w-xs">{user?.email}</span>
              <Link
                href="/dashboard"
                className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your notification integrations</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Notification Integrations</h2>
            <button
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-semibold transition-all duration-200 text-sm"
            >
              + Add Integration
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {integrations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-4 text-sm">No integrations connected yet</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="text-black font-semibold hover:underline text-sm"
                >
                  Add your first integration
                </button>
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4">
                {integrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-2xl flex-shrink-0">
                          {getIntegrationIcon(integration.integration_type)}
                        </span>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">{integration.name}</p>
                          <p className="text-xs text-gray-600 capitalize">
                            {integration.integration_type}
                          </p>
                          <span
                            className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                              integration.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {integration.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleDeleteIntegration(integration.id)}
                          disabled={deletingId === integration.id}
                          className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors font-medium"
                        >
                          {deletingId === integration.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Integration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">Add Integration</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddIntegration} className="p-4 sm:p-6 space-y-4">
              {userPlan === 'free' && (
                <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600 text-center">
                    Please upgrade to Starter or Pro plan to add notification integrations.
                  </p>
                </div>
              )}
              {/* Integration Type Tabs */}
              {userPlan === 'free' ? (
                <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">⚠️</span>
                    <div className="flex-1">
                      <h3 className="text-xs sm:text-sm font-semibold text-yellow-900 mb-1">
                        Notifications Not Available
                      </h3>
                      <p className="text-xs sm:text-sm text-yellow-800 mb-3">
                        Free plan users can only view logs in the dashboard. Upgrade to Starter or Pro to enable Slack, Discord, and Email notifications.
                      </p>
                      <Link
                        href="/pricing"
                        className="inline-block bg-yellow-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-yellow-700 text-xs sm:text-sm font-semibold transition-colors"
                      >
                        View Plans →
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 mb-6">
                  {(['slack', 'discord', ...(userPlan === 'pro' ? ['email', 'webhook'] : [])] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setSelectedType(type as 'email' | 'slack' | 'discord' | 'webhook');
                        setFormData({ name: '', email: '', slackWebhook: '', discordWebhook: '', webhookUrl: '' });
                      }}
                      className={`flex-1 min-w-max px-3 sm:px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                        selectedType === type
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                  {userPlan !== 'pro' && (
                    <>
                      <div className="flex-1 min-w-max px-3 sm:px-4 py-2 rounded-lg bg-gray-50 text-gray-400 font-semibold flex items-center justify-center relative text-sm">
                        Email
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded whitespace-nowrap">Pro</span>
                      </div>
                      <div className="flex-1 min-w-max px-3 sm:px-4 py-2 rounded-lg bg-gray-50 text-gray-400 font-semibold flex items-center justify-center relative text-sm">
                        Webhook
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded whitespace-nowrap">Pro</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Common Name Field */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Integration Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={`e.g., "Team Slack"`}
                  className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                  required
                  disabled={userPlan === 'free'}
                />
              </div>

              {/* Email Fields */}
              {selectedType === 'email' && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alerts@example.com"
                    className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                    required
                    disabled={userPlan === 'free'}
                  />
                </div>
              )}

              {/* Slack Fields */}
              {selectedType === 'slack' && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Slack Webhook URL
                  </label>
                  <input
                    type="url"
                    value={formData.slackWebhook}
                    onChange={(e) => setFormData({ ...formData, slackWebhook: e.target.value })}
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all font-mono text-xs sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                    disabled={userPlan === 'free'}
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Get your webhook URL from Slack's Incoming Webhooks app
                  </p>
                </div>
              )}

              {/* Discord Fields */}
              {selectedType === 'discord' && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Discord Webhook URL
                  </label>
                  <input
                    type="url"
                    value={formData.discordWebhook}
                    onChange={(e) => setFormData({ ...formData, discordWebhook: e.target.value })}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all font-mono text-xs sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                    disabled={userPlan === 'free'}
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Get your webhook URL from Discord Server Settings → Integrations → Webhooks
                  </p>
                </div>
              )}

              {/* Custom Webhook Fields (Pro only) */}
              {selectedType === 'webhook' && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Custom Webhook URL
                  </label>
                  <input
                    type="url"
                    value={formData.webhookUrl}
                    onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                    placeholder="https://your-endpoint.com/webhook"
                    className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all font-mono text-xs sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                    disabled={userPlan !== 'pro'}
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Enter any HTTP endpoint that accepts POST requests. We'll send task execution data as JSON.
                  </p>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 sm:py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={userPlan === 'free'}
                  className="px-4 py-2 sm:py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-semibold transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                >
                  {userPlan === 'free' ? 'Upgrade Required' : 'Add Integration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
