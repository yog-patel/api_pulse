'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { PLANS } from '../../lib/plans';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function Pricing() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      console.log('=== Pricing Page Loaded ===');
      
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session:', session?.user?.id);
      setIsLoggedIn(!!session);
      
      // Fetch current plan if logged in
      if (session?.user?.id) {
        try {
          console.log('Fetching plan for user:', session.user.id);
          
          const { data, error } = await supabase
            .from('profiles')
            .select('plan_id')
            .eq('id', session.user.id)
            .single();
          
          console.log('Supabase response:', { data, error });
          
          if (error) {
            console.error('Error fetching plan:', error);
          } else {
            console.log('Profile data:', data);
            console.log('plan_id value:', data?.plan_id);
            if (data?.plan_id) {
              setCurrentPlan(data.plan_id);
              console.log('Set current plan to:', data.plan_id);
            } else {
              console.log('plan_id is null or undefined');
            }
          }
        } catch (err) {
          console.error('Exception fetching plan:', err);
        }
      } else {
        console.log('No session found - not logged in');
      }
    };
    checkAuth();
  }, []);

  const handleCheckout = async (planId: 'starter' | 'pro') => {
    if (!isLoggedIn) {
      router.push(`/auth/signup?plan=${planId}`);
      return;
    }

    setLoading(planId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/auth/login?redirect=/pricing&plan=${planId}`);
        return;
      }

      const plan = PLANS[planId.toUpperCase() as 'STARTER' | 'PRO'];
      if (!plan.priceId) {
        alert('This plan is not available for checkout. Please contact support.');
        setLoading(null);
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
        alert(error.error || 'Failed to create checkout session');
        setLoading(null);
        return;
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert('An error occurred. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                <span className="text-white font-bold text-sm">AP</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">API Pulse</span>
            </Link>
            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                <Link 
                  href="/dashboard" 
                  className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link 
                    href="/auth/login" 
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/auth/signup" 
                    className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Pricing Section */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that fits your monitoring needs
            </p>
            <p className="text-sm text-gray-500 max-w-2xl mx-auto mt-2">
              No credit card required
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="relative bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-gray-300 transition-all duration-300">
              {isLoggedIn && currentPlan === 'free' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gray-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                    CURRENT
                  </span>
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <p className="text-gray-600 text-sm mb-6">Perfect for personal projects</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">$0</span>
                  <span className="text-gray-600 text-lg">/mo</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700"><strong className="text-gray-900">2</strong> API tasks</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Every <strong className="text-gray-900">hour</strong> minimum</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700"><strong className="text-gray-900">Unlimited</strong> runs/month</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Dashboard view only (no notifications)</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700"><strong className="text-gray-900">7 day</strong> history</span>
                </li>
              </ul>
    
              <Link href="/auth/signup" className="block w-full text-center px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 font-semibold transition-colors">
                Start Free
              </Link>
            </div>

            {/* Starter Plan - Featured */}
            <div className="relative transform md:scale-105 z-10">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2">
                <span className="bg-black text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg whitespace-nowrap">
                  Most Popular
                </span>
                {currentPlan === 'starter' && (
                  <span className="bg-green-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                    CURRENT
                  </span>
                )}
              </div>
              <div className="bg-white rounded-2xl p-8 border-2 border-black shadow-2xl hover:shadow-3xl transition-all duration-300 h-full">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
                  <p className="text-gray-600 text-sm mb-6">Great for small teams</p>
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-gray-900">$9</span>
                    <span className="text-gray-600 text-lg">/mo</span>
                  </div>
                </div>
             
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-black mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700"><strong className="text-gray-900">10</strong> API tasks</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-black mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Every <strong className="text-gray-900">15 min</strong> minimum</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-black mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700"><strong className="text-gray-900">Unlimited</strong> runs/month</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-black mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Slack & Discord alerts</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-black mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700"><strong className="text-gray-900">14 day</strong> history</span>
                  </li>
                </ul>
             
                <button
                  onClick={() => handleCheckout('starter')}
                  disabled={loading === 'starter'}
                  className="w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === 'starter' ? 'Processing...' : 'Get Started'}
                </button>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="relative bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-gray-300 transition-all duration-300">
              {currentPlan === 'pro' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                    CURRENT
                  </span>
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                <p className="text-gray-600 text-sm mb-6">Full-featured monitoring</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">$15</span>
                  <span className="text-gray-600 text-lg">/mo</span>
                </div>
              </div>
    
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-black mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700"><strong className="text-gray-900">50</strong> API tasks</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-black mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Every <strong className="text-gray-900">5 min</strong> minimum</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-black mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700"><strong className="text-gray-900">Unlimited</strong> runs/month</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-black mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Email, Slack & Discord</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-black mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700"><strong className="text-gray-900">30 day</strong> history</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-black mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Priority support</span>
                </li>
              </ul>
              
              <button
                onClick={() => handleCheckout('pro')}
                disabled={loading === 'pro'}
                className="w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'pro' ? 'Processing...' : 'Get Started'}
              </button>
            </div>
          </div>
          
        </div>
      </section>
    </div>
  );
}

