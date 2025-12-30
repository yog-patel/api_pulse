'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { PLANS } from '../lib/plans';
import Modal from '../components/Modal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [modal, setModal] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'info'; title?: string }>({ isOpen: false, message: '', type: 'info' });
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      
      // Fetch current plan if logged in
      if (session?.user?.id) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('plan_id')
            .eq('id', session.user.id)
            .single();
          
          if (data?.plan_id) {
            setCurrentPlan(data.plan_id);
          }
        } catch (err) {
          console.error('Error fetching plan:', err);
        }
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
        router.push(`/auth/login?redirect=/&plan=${planId}`);
        return;
      }

      const plan = PLANS[planId.toUpperCase() as 'STARTER' | 'PRO'];
      if (!plan.priceId) {
        setModal({ isOpen: true, message: 'This plan is not available for checkout. Please contact support.', type: 'error', title: 'Error' });
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
        setModal({ isOpen: true, message: error.error || 'Failed to create checkout session', type: 'error', title: 'Error' });
        setLoading(null);
        return;
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      setModal({ isOpen: true, message: 'An error occurred. Please try again.', type: 'error', title: 'Error' });
      setLoading(null);
    }
  };

  return (
    <>
    <Modal isOpen={modal.isOpen} title={modal.title} message={modal.message} type={modal.type} onClose={() => setModal({ ...modal, isOpen: false })} />
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2 group min-w-fit">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg flex-shrink-0">
                <span className="text-white font-bold text-sm">AP</span>
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent hidden sm:inline">API Schedulr</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm text-gray-700 hover:text-purple-600 font-medium transition-colors">Features</a>
              <a href="#pricing" className="text-sm text-gray-700 hover:text-purple-600 font-medium transition-colors">Pricing</a>
              <a href="#faq" className="text-sm text-gray-700 hover:text-purple-600 font-medium transition-colors">FAQ</a>
            </nav>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {isLoggedIn ? (
                <Link 
                  href="/dashboard" 
                  className="px-3 sm:px-5 py-2 sm:py-2.5 gradient-primary text-white text-xs sm:text-sm font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 whitespace-nowrap"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link 
                    href="/auth/login" 
                    className="hidden sm:block text-sm text-gray-700 hover:text-purple-600 font-medium transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/auth/signup" 
                    className="px-3 sm:px-5 py-2 sm:py-2.5 gradient-primary text-white text-xs sm:text-sm font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 glow-hover whitespace-nowrap"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-xs sm:text-sm font-semibold mb-6 sm:mb-8 border border-purple-200">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              <span className="hidden xs:inline">Now in public beta • Free forever plan available</span>
              <span className="inline xs:hidden">Now in public beta</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight tracking-tight">
              <span className="text-gray-900">Schedule API calls</span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient bg-200%">
                without complexity
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
              Automate API checks and background jobs with scheduled HTTP requests.
              <br />
              <span className="font-semibold text-gray-900">Get instant alerts in Slack, Discord, or Email — no servers, no cron, no DevOps.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Link 
                href="/auth/signup" 
                className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 gradient-primary text-white font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 relative overflow-hidden text-center"
              >
                <span className="relative z-10">Start Free</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
              <a 
                href="#how-it-works" 
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white text-gray-900 font-semibold rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-200 text-center"
              >
                See How It Works
              </a>
            </div>
          </div>
          
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold mb-4">
              Powerful Features
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything you need to
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"> succeed</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features wrapped in a simple, beautiful interface
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Feature 1 */}
            <div className="group relative bg-gradient-to-br from-white to-purple-50 rounded-2xl p-6 sm:p-8 border-2 border-purple-100 hover:border-purple-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute top-4 right-4 w-16 h-16 bg-purple-100 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative">
                <div className="w-12 sm:w-14 h-12 sm:h-14 gradient-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <svg className="w-6 sm:w-7 h-6 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Schedule Any API</h3>
                <ul className="text-gray-600 space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                    GET and POST requests with full customization
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                    Custom headers and request bodies
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                    Flexible intervals from minutes to days
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                    Pause and resume with one click
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 sm:p-8 border-2 border-blue-100 hover:border-blue-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute top-4 right-4 w-16 h-16 bg-blue-100 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative">
                <div className="w-12 sm:w-14 h-12 sm:h-14 gradient-accent rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <svg className="w-6 sm:w-7 h-6 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Multi-Channel Notifications</h3>
                <ul className="text-gray-600 space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></span>
                    Slack webhooks with rich formatting
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></span>
                    Discord webhooks with beautiful embeds
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></span>
                    Email notifications (Pro plan)
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></span>
                    Custom webhooks for any endpoint
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative bg-gradient-to-br from-white to-green-50 rounded-2xl p-6 sm:p-8 border-2 border-green-100 hover:border-green-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute top-4 right-4 w-16 h-16 bg-green-100 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative">
                <div className="w-12 sm:w-14 h-12 sm:h-14 gradient-success rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <svg className="w-6 sm:w-7 h-6 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Complete Run History</h3>
                <ul className="text-gray-600 space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></span>
                    View every execution with full details
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></span>
                    Success/failure status tracking
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></span>
                    Response preview and timing metrics
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></span>
                    Error details for easy debugging
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative bg-gradient-to-br from-white to-pink-50 rounded-2xl p-6 sm:p-8 border-2 border-pink-100 hover:border-pink-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute top-4 right-4 w-16 h-16 bg-pink-100 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative">
                <div className="w-12 sm:w-14 h-12 sm:h-14 gradient-secondary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <svg className="w-6 sm:w-7 h-6 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Zero Setup Required</h3>
                <ul className="text-gray-600 space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-pink-500 rounded-full mr-3 flex-shrink-0"></span>
                    No servers to manage or configure
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-pink-500 rounded-full mr-3 flex-shrink-0"></span>
                    No installation or dependencies
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-pink-500 rounded-full mr-3 flex-shrink-0"></span>
                    Just paste your API URL and go
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-pink-500 rounded-full mr-3 flex-shrink-0"></span>
                    Start monitoring in under 60 seconds
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-gradient-to-b from-purple-50 to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block px-4 py-2 rounded-full bg-white/80 backdrop-blur text-purple-700 text-sm font-semibold mb-4 shadow-lg">
              How It Works
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Three simple steps to
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"> automate</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in minutes, not hours
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="text-center group">
              <div className="relative inline-block mb-6">
                <div className="w-20 sm:w-24 h-20 sm:h-24 gradient-primary text-white rounded-3xl flex items-center justify-center font-bold text-2xl sm:text-3xl mx-auto shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  1
                </div>
                <div className="absolute -inset-2 bg-purple-200 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              </div>
              <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-3">Add an API URL</h3>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                Paste your API endpoint URL into the dashboard. No code, no configuration needed—just paste and go.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center group">
              <div className="relative inline-block mb-6">
                <div className="w-20 sm:w-24 h-20 sm:h-24 gradient-secondary text-white rounded-3xl flex items-center justify-center font-bold text-2xl sm:text-3xl mx-auto shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  2
                </div>
                <div className="absolute -inset-2 bg-pink-200 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              </div>
              <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-3">Choose a Schedule</h3>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                Select how often you want it to run: every minute, hour, day, or a custom interval that fits your needs.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center group sm:col-span-2 md:col-span-1">
              <div className="relative inline-block mb-6">
                <div className="w-20 sm:w-24 h-20 sm:h-24 gradient-accent text-white rounded-3xl flex items-center justify-center font-bold text-2xl sm:text-3xl mx-auto shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  3
                </div>
                <div className="absolute -inset-2 bg-blue-200 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              </div>
              <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-3">Get Results Automatically</h3>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                Results are delivered automatically via your preferred channels and logged for you to review anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold mb-4">
              Simple Pricing
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 pb-4">
              Choose the plan that
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"> fits you</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
              <div className="relative">
                {isLoggedIn && currentPlan === 'free' && (
                  <div className="mb-4">
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Free</h3>
                  <p className="text-gray-600 text-xs sm:text-sm mb-6">Perfect for personal projects</p>
                  <div className="mb-6">
                    <span className="text-3xl sm:text-5xl font-bold text-gray-900">$0</span>
                    <span className="text-gray-600 text-base sm:text-lg">/mo</span>
                  </div>
                </div>
                
                <ul className="space-y-3 sm:space-y-4 mb-8">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 text-sm"><strong className="text-gray-900">2</strong> API tasks</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 text-sm">Every <strong className="text-gray-900">hour</strong> minimum</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 text-sm"><strong className="text-gray-900">Unlimited</strong> runs/month</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 text-sm">Dashboard only</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 text-sm"><strong className="text-gray-900">7 day</strong> history</span>
                  </li>
                </ul>
        
                {isLoggedIn && currentPlan === 'free' ? (
                  <button disabled className="w-full text-center px-6 py-3 bg-gray-100 text-gray-900 rounded-lg font-semibold cursor-not-allowed opacity-50 text-sm sm:text-base">
                    Current Plan
                  </button>
                ) : (
                  <Link href="/auth/signup" className="block w-full text-center px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 font-semibold transition-colors text-sm sm:text-base">
                    Start Free
                  </Link>
                )}
              </div>
            </div>

            {/* Starter Plan - Featured */}
            <div className="relative sm:col-span-2 lg:col-span-1 lg:scale-105 lg:z-10">
              <div className="absolute -top-8 sm:-top-10 left-1/2 transform -translate-x-1/2 z-20">
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 sm:p-8 border-2 border-purple-500 shadow-2xl hover:shadow-3xl transition-all duration-300 h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-purple-200 rounded-full -mr-20 -mt-20 opacity-50 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-200 rounded-full -ml-20 -mb-20 opacity-50 blur-2xl"></div>
                <div className="relative">
                  {isLoggedIn && currentPlan === 'starter' && (
                    <div className="mb-4">
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Starter</h3>
                    <p className="text-gray-600 text-xs sm:text-sm mb-6">Great for small teams</p>
                    <div className="mb-6">
                      <span className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">$9</span>
                      <span className="text-gray-600 text-base sm:text-lg">/mo</span>
                    </div>
                  </div>
               
                  <ul className="space-y-3 sm:space-y-4 mb-8">
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700 text-sm"><strong className="text-gray-900">10</strong> API tasks</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700 text-sm">Every <strong className="text-gray-900">15 min</strong> minimum</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700 text-sm"><strong className="text-gray-900">Unlimited</strong> runs/month</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700 text-sm">Slack & Discord alerts</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700 text-sm"><strong className="text-gray-900">14 day</strong> history</span>
                    </li>
                  </ul>
               
                  <button
                    onClick={() => handleCheckout('starter')}
                    disabled={loading === 'starter' || (isLoggedIn && currentPlan === 'starter')}
                    className="w-full px-6 py-3 gradient-primary text-white rounded-lg hover:shadow-xl font-semibold transition-all duration-200 glow-hover disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {isLoggedIn && currentPlan === 'starter' ? 'Current Plan' : loading === 'starter' ? 'Processing...' : 'Get Started'}
                  </button>
                </div>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
              {isLoggedIn && currentPlan === 'pro' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                </div>
              )}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
              <div className="relative">
                {isLoggedIn && currentPlan === 'pro' && (
                  <div className="mb-4">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      CURRENT PLAN
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                  <p className="text-gray-600 text-xs sm:text-sm mb-6">Full-featured monitoring</p>
                  <div className="mb-6">
                    <span className="text-3xl sm:text-5xl font-bold text-gray-900">$15</span>
                    <span className="text-gray-600 text-base sm:text-lg">/mo</span>
                  </div>
                </div>
        
                <ul className="space-y-3 sm:space-y-4 mb-8">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 text-sm"><strong className="text-gray-900">50</strong> API tasks</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 text-sm">Every <strong className="text-gray-900">5 min</strong> minimum</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 text-sm"><strong className="text-gray-900">Unlimited</strong> runs/month</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 text-sm">Email, Slack, Discord and custom webhooks </span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 text-sm"><strong className="text-gray-900">30 day</strong> history</span>
                  </li>
                </ul>
                
                <button
                  onClick={() => handleCheckout('pro')}
                  disabled={loading === 'pro' || (isLoggedIn && currentPlan === 'pro')}
                  className="w-full px-6 py-3 gradient-accent text-white rounded-lg hover:shadow-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {isLoggedIn && currentPlan === 'pro' ? 'Current Plan' : loading === 'pro' ? 'Processing...' : 'Get Started'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 sm:py-24 bg-gray-50 relative">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold mb-4">
              FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Frequently Asked
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"> Questions</span>
            </h2>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {/* FAQ Item 1 */}
            <details className="group bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer">
              <summary className="font-semibold text-gray-900 flex justify-between items-center select-none text-base sm:text-lg">
                What is API Schedulr and how does it work?
                <span className="text-2xl text-purple-500 group-open:rotate-45 transition-transform duration-300 flex-shrink-0 ml-2">+</span>
              </summary>
              <div className="text-gray-600 mt-3 sm:mt-4 leading-relaxed space-y-3 text-sm sm:text-base">
                <p>
                  API Schedulr is a serverless API monitoring and scheduling service. You simply add your API endpoint URL, set a schedule (how often to check it), and we automatically make HTTP requests to your API at the specified intervals.
                </p>
                <p>
                  Each execution is logged with response status, timing, and error details. You can receive notifications via Slack, Discord, Email (Pro), or custom webhooks when your API succeeds or fails.
                </p>
              </div>
            </details>

            {/* FAQ Item 2 */}
            <details className="group bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer">
              <summary className="font-semibold text-gray-900 flex justify-between items-center select-none text-base sm:text-lg">
                How do I add webhooks and connect them to tasks?
                <span className="text-2xl text-purple-500 group-open:rotate-45 transition-transform duration-300 flex-shrink-0 ml-2">+</span>
              </summary>
              <div className="text-gray-600 mt-3 sm:mt-4 leading-relaxed space-y-3 text-sm sm:text-base">
                <p className="font-semibold text-gray-900">Step 1: Add a Webhook Integration</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Go to <strong>Dashboard → Settings</strong></li>
                  <li>Click <strong>"+ Add Integration"</strong></li>
                  <li>Select the <strong>"Webhook"</strong> tab</li>
                  <li>Enter a name (e.g., "My Custom Endpoint")</li>
                  <li>Paste your webhook URL (any HTTP endpoint that accepts POST requests)</li>
                  <li>Click <strong>"Add Integration"</strong></li>
                </ol>
                <p className="font-semibold text-gray-900 mt-4">Step 2: Connect to a Task</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Go to your <strong>Dashboard</strong> and find the task you want to monitor</li>
                  <li>Click the <strong>"🔔 Notifications"</strong> button in the Actions column</li>
                  <li>In the modal, select your webhook integration from the dropdown</li>
                  <li>Choose when to notify:
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                      <li><strong>Always</strong> - Every execution (success or failure)</li>
                      <li><strong>Failure Only</strong> - Only when API returns error status codes</li>
                      <li><strong>Timeout Only</strong> - Only on connection errors or timeouts</li>
                    </ul>
                  </li>
                  <li>Optionally check <strong>"Include API Response Body"</strong> to send the full response</li>
                  <li>Click <strong>"Add Notification"</strong></li>
                </ol>
              </div>
            </details>

            {/* FAQ Item 3 */}
            <details className="group bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer">
              <summary className="font-semibold text-gray-900 flex justify-between items-center select-none text-base sm:text-lg">
                What notification channels are available on each plan?
                <span className="text-2xl text-purple-500 group-open:rotate-45 transition-transform duration-300 flex-shrink-0 ml-2">+</span>
              </summary>
              <div className="text-gray-600 mt-3 sm:mt-4 leading-relaxed space-y-3 text-sm sm:text-base">
                <ul className="space-y-2">
                  <li><strong>Free Plan:</strong> Dashboard view only (view logs, no notifications)</li>
                  <li><strong>Starter Plan ($9/mo):</strong> Slack and Discord notifications</li>
                  <li><strong>Pro Plan ($15/mo):</strong> Email, Slack, Discord, and custom webhooks</li>
                </ul>
              </div>
            </details>

            {/* FAQ Item 4 */}
            <details className="group bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer">
              <summary className="font-semibold text-gray-900 flex justify-between items-center select-none text-base sm:text-lg">
                How do I authenticate my API requests?
                <span className="text-2xl text-purple-500 group-open:rotate-45 transition-transform duration-300 flex-shrink-0 ml-2">+</span>
              </summary>
              <div className="text-gray-600 mt-3 sm:mt-4 leading-relaxed space-y-3 text-sm sm:text-base">
                <p>
                  When creating a task, you can add custom headers including:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Authorization:</strong> Bearer tokens, API keys, Basic Auth</li>
                  <li><strong>Custom headers:</strong> Any header your API requires (X-API-Key, etc.)</li>
                  <li><strong>Request body:</strong> JSON payloads for POST requests</li>
                </ul>
              </div>
            </details>

            {/* FAQ Item 5 */}
            <details className="group bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer">
              <summary className="font-semibold text-gray-900 flex justify-between items-center select-none text-base sm:text-lg">
                What are the minimum check intervals for each plan?
                <span className="text-2xl text-purple-500 group-open:rotate-45 transition-transform duration-300 flex-shrink-0 ml-2">+</span>
              </summary>
              <div className="text-gray-600 mt-3 sm:mt-4 leading-relaxed space-y-3 text-sm sm:text-base">
                <ul className="space-y-2">
                  <li><strong>Free Plan:</strong> Minimum 1 hour (60 minutes) between checks</li>
                  <li><strong>Starter Plan:</strong> Minimum 15 minutes between checks</li>
                  <li><strong>Pro Plan:</strong> Minimum 5 minutes between checks</li>
                </ul>
              </div>
            </details>

            {/* FAQ Item 6 */}
            <details className="group bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer">
              <summary className="font-semibold text-gray-900 flex justify-between items-center select-none text-base sm:text-lg">
                How long are execution logs stored?
                <span className="text-2xl text-purple-500 group-open:rotate-45 transition-transform duration-300 flex-shrink-0 ml-2">+</span>
              </summary>
              <div className="text-gray-600 mt-3 sm:mt-4 leading-relaxed space-y-3 text-sm sm:text-base">
                <ul className="space-y-2">
                  <li><strong>Free Plan:</strong> Last 7 days of execution history</li>
                  <li><strong>Starter Plan:</strong> Last 14 days of execution history</li>
                  <li><strong>Pro Plan:</strong> Last 30 days of execution history</li>
                </ul>
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-90"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
            Ready to automate?
          </h2>
          <p className="text-purple-100 mb-8 sm:mb-10 text-base sm:text-lg md:text-xl leading-relaxed">
            Start scheduling your API calls in seconds.
          </p>
          <Link 
            href="/auth/signup" 
            className="inline-block bg-white text-purple-600 px-8 sm:px-10 py-3 sm:py-4 rounded-xl hover:bg-purple-50 font-bold text-base sm:text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-200"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
            <div>
              <h4 className="font-bold text-white mb-4">API Schedulr</h4>
              <p className="text-sm">Schedule and monitor API calls automatically.</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="text-sm space-y-2">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="text-sm space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Connect</h4>
              <ul className="text-sm space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-sm text-center">
            <p>&copy; 2025 API Schedulr. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
