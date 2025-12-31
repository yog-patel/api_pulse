'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { PLANS, getPlan } from '../../../lib/plans';
import Modal from '../../../components/Modal';
import ConfirmModal from '../../../components/ConfirmModal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function Billing() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [modal, setModal] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'info'; title?: string }>({ isOpen: false, message: '', type: 'info' });
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; isDangerous?: boolean }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, isDangerous: false });
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Ensure profile exists (handles OAuth users and race conditions)
      try {
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single();

        if (profileError || !existingProfile) {
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
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleCheckout = async (planId: 'starter' | 'pro') => {
    setCheckoutLoading(planId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const plan = PLANS[planId.toUpperCase() as 'STARTER' | 'PRO'];
      if (!plan.priceId) {
        setModal({ isOpen: true, message: 'This plan is not available for checkout.', type: 'error', title: 'Error' });
        setCheckoutLoading(null);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            priceId: plan.priceId,
            planId: plan.id,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        setModal({ isOpen: true, message: error.error || 'Failed to create checkout session', type: 'error', title: 'Error' });
        setCheckoutLoading(null);
        return;
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      setModal({ isOpen: true, message: 'An error occurred. Please try again.', type: 'error', title: 'Error' });
      setCheckoutLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Cancel Subscription',
      message: 'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.',
      isDangerous: true,
      onConfirm: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;

          // In a real implementation, you would call Stripe API to cancel the subscription
          // For now, we'll just show a message
          setModal({ isOpen: true, message: 'To cancel your subscription, please contact support or manage it through your Stripe customer portal.', type: 'info', title: 'Info' });
        } catch (error) {
          console.error('Error canceling subscription:', error);
          setModal({ isOpen: true, message: 'Failed to cancel subscription. Please try again.', type: 'error', title: 'Error' });
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const currentPlan = getPlan(profile?.plan_id || 'free');
  const isPaidPlan = profile?.plan_id !== 'free';

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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AP</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">API Schedulr</span>
            </Link>
            <div className="flex items-center space-x-6">
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Subscription</h1>
          <p className="text-gray-600">Manage your subscription and billing information</p>
        </div>

        {/* Current Plan */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Current Plan</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 capitalize">{currentPlan.name}</h3>
                <p className="text-gray-600 mt-1">{currentPlan.description}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">${currentPlan.price}</div>
                <div className="text-gray-600">/month</div>
              </div>
            </div>

            {isPaidPlan && (
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status</span>
                  <span className={`font-semibold capitalize ${
                    profile?.subscription_status === 'active' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {profile?.subscription_status || 'active'}
                  </span>
                </div>
                {profile?.current_period_end && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Next billing date</span>
                    <span className="text-gray-900">
                      {new Date(profile.current_period_end).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {profile?.stripe_subscription_id && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subscription ID</span>
                    <span className="text-gray-900 font-mono text-xs">
                      {profile.stripe_subscription_id.substring(0, 20)}...
                    </span>
                  </div>
                )}
              </div>
            )}

            {isPaidPlan && (
              <div className="mt-6">
                <button
                  onClick={handleCancelSubscription}
                  className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Cancel Subscription
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Upgrade Options */}
        {!isPaidPlan && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Upgrade Your Plan</h2>
              <p className="text-gray-600 text-sm mt-1">Unlock more features and higher limits</p>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Starter Plan */}
                <div className="border border-gray-200 rounded-lg p-6 hover:border-purple-300 transition-colors">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Starter</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-4">$9<span className="text-lg text-gray-600">/mo</span></div>
                  <ul className="text-sm text-gray-600 space-y-2 mb-4">
                    <li>• 10 API tasks</li>
                    <li>• 15 min minimum interval</li>
                    <li>• Slack & Discord notifications</li>
                    <li>• 14 day log retention</li>
                  </ul>
                  <button
                    onClick={() => handleCheckout('starter')}
                    disabled={checkoutLoading === 'starter'}
                    className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkoutLoading === 'starter' ? 'Processing...' : 'Upgrade to Starter'}
                  </button>
                </div>

                {/* Pro Plan */}
                <div className="border-2 border-purple-500 rounded-lg p-6 hover:border-purple-600 transition-colors relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      Recommended
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Pro</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-4">$15<span className="text-lg text-gray-600">/mo</span></div>
                  <ul className="text-sm text-gray-600 space-y-2 mb-4">
                    <li>• 50 API tasks</li>
                    <li>• 5 min minimum interval</li>
                    <li>• Email, Slack, Discord & Webhooks</li>
                    <li>• 30 day log retention</li>
                    <li>• Priority support</li>
                  </ul>
                  <button
                    onClick={() => handleCheckout('pro')}
                    disabled={checkoutLoading === 'pro'}
                    className="w-full px-4 py-2 gradient-primary text-white rounded-lg hover:shadow-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkoutLoading === 'pro' ? 'Processing...' : 'Upgrade to Pro'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Change Plan (for existing subscribers) */}
        {isPaidPlan && profile?.plan_id !== 'pro' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Upgrade Plan</h2>
            </div>
            <div className="p-6">
              <div className="border-2 border-purple-500 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Pro Plan</h3>
                <div className="text-3xl font-bold text-gray-900 mb-4">$15<span className="text-lg text-gray-600">/mo</span></div>
                <ul className="text-sm text-gray-600 space-y-2 mb-4">
                  <li>• 50 API tasks (5x more)</li>
                  <li>• 5 min minimum interval</li>
                  <li>• Email notifications</li>
                  <li>• Custom webhooks</li>
                  <li>• 30 day log retention</li>
                  <li>• Priority support</li>
                </ul>
                <button
                  onClick={() => handleCheckout('pro')}
                  disabled={checkoutLoading === 'pro'}
                  className="w-full px-4 py-2 gradient-primary text-white rounded-lg hover:shadow-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkoutLoading === 'pro' ? 'Processing...' : 'Upgrade to Pro'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
    </>
  );
}

