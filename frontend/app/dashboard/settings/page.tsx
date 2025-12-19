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
  created_at: string;
}

export default function Settings() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'email' | 'slack' | 'sms' | 'discord'>('email');
  const [user, setUser] = useState<any>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    slackWebhook: '',
    discordWebhook: '',
    smsNumber: '',
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
        console.error('Failed to fetch integrations');
        setIntegrations([]);
      }
    } catch (error) {
      console.error('Error fetching integrations:', error);
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIntegration = async (e: React.FormEvent) => {
    e.preventDefault();

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
    } else if (selectedType === 'sms') {
      payload.credentials = { phone_number: formData.smsNumber };
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

      if (response.ok) {
        const newIntegration = await response.json();
        setIntegrations([...integrations, newIntegration]);
        setShowModal(false);
        setFormData({ name: '', email: '', slackWebhook: '', discordWebhook: '', smsNumber: '' });
        alert('Integration added successfully! Check your channel for a test message.');
      } else {
        const error = await response.json();
        alert(`Failed to create integration: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating integration:', error);
      alert('An error occurred while creating the integration');
    }
  };

  const handleTestIntegration = async (integrationId: string) => {
    // Note: Slack integrations are automatically tested when created
    // This function can be used for other integration types in the future
    alert('Slack integrations are automatically tested when you add them. Check your channel for the test message!');
  };

  const handleDeleteIntegration = async (integrationId: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) return;

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
        alert('Failed to delete integration');
      }
    } catch (error) {
      console.error('Error deleting integration:', error);
      alert('An error occurred while deleting the integration');
    } finally {
      setDeletingId(null);
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'email':
        return '✉️';
      case 'slack':
        return '💬';
      case 'discord':
        return '🎮';
      case 'sms':
        return '📱';
      default:
        return '🔔';
    }
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
            <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-700">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your notification integrations</p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Notification Integrations</h2>
            <button
              onClick={() => setShowModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              + Add Integration
            </button>
          </div>

          <div className="p-6">
            {integrations.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No integrations connected yet</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  Add your first integration
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {integrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">
                          {getIntegrationIcon(integration.integration_type)}
                        </span>
                        <div>
                          <p className="font-semibold text-gray-900">{integration.name}</p>
                          <p className="text-sm text-gray-600 capitalize">
                            {integration.integration_type}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            integration.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {integration.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTestIntegration(integration.id)}
                          disabled={testingId === integration.id}
                          className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 disabled:opacity-50"
                        >
                          {testingId === integration.id ? 'Testing...' : 'Test'}
                        </button>
                        <button
                          onClick={() => handleDeleteIntegration(integration.id)}
                          disabled={deletingId === integration.id}
                          className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 disabled:opacity-50"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Add Integration</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddIntegration} className="p-6 space-y-4">
              {/* Integration Type Tabs */}
              <div className="flex gap-2 mb-6">
                {(['email', 'slack', 'discord', 'sms'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setSelectedType(type);
                      setFormData({ name: '', email: '', slackWebhook: '', discordWebhook: '', smsNumber: '' });
                    }}
                    className={`flex-1 px-4 py-2 rounded font-medium transition-colors ${
                      selectedType === type
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>

              {/* Common Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Integration Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={`e.g., "Team Slack", "Discord Alerts", or "Alert Email"`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Email Fields */}
              {selectedType === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alerts@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              )}

              {/* Slack Fields */}
              {selectedType === 'slack' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slack Webhook URL
                  </label>
                  <input
                    type="url"
                    value={formData.slackWebhook}
                    onChange={(e) => setFormData({ ...formData, slackWebhook: e.target.value })}
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Get your webhook URL from Slack's Incoming Webhooks app
                  </p>
                </div>
              )}

              {/* Discord Fields */}
              {selectedType === 'discord' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discord Webhook URL
                  </label>
                  <input
                    type="url"
                    value={formData.discordWebhook}
                    onChange={(e) => setFormData({ ...formData, discordWebhook: e.target.value })}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Get your webhook URL from Discord Server Settings → Integrations → Webhooks
                  </p>
                </div>
              )}

              {/* SMS Fields */}
              {selectedType === 'sms' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.smsNumber}
                    onChange={(e) => setFormData({ ...formData, smsNumber: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Add Integration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
