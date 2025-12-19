'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-indigo-600">API Pulse</div>
          <nav className="flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 text-sm">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 text-sm">Pricing</a>
            <a href="#faq" className="text-gray-600 hover:text-gray-900 text-sm">FAQ</a>
            {isLoggedIn ? (
              <Link href="/dashboard" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm">
                Dashboard
              </Link>
            ) : (
              <Link href="/auth/login" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm">
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Automate API Calls<br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">On Your Schedule</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Schedule any API endpoint. Get results delivered automatically. No servers, no cron, no DevOps.
          </p>
          <div className="flex gap-4 justify-center mb-20">
            <Link href="/auth/signup" className="bg-indigo-600 text-white px-8 py-4 rounded-lg hover:bg-indigo-700 font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200">
              Start Free
            </Link>
            <a href="#how-it-works" className="border-2 border-gray-300 text-gray-900 px-8 py-4 rounded-lg hover:border-indigo-600 hover:text-indigo-600 font-semibold transition-all duration-200">
              Learn More
            </a>
          </div>
        </div>
        
        {/* Hero Illustration */}
        <div className="animate-slide-up bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-2xl p-12 max-w-3xl mx-auto border border-gray-100 shadow-lg">
          <div className="flex items-center justify-between gap-6">
            <div className="text-center flex-1 hover:scale-110 transition-transform duration-300">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">1</div>
              <p className="text-sm font-semibold text-gray-900">Add API URL</p>
            </div>
            <div className="text-2xl text-indigo-400 font-light">→</div>
            <div className="text-center flex-1 hover:scale-110 transition-transform duration-300">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">2</div>
              <p className="text-sm font-semibold text-gray-900">Set Schedule</p>
            </div>
            <div className="text-2xl text-indigo-400 font-light">→</div>
            <div className="text-center flex-1 hover:scale-110 transition-transform duration-300">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">3</div>
              <p className="text-sm font-semibold text-gray-900">Get Results</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gradient-to-b from-gray-50 to-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to schedule and monitor API calls automatically
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div className="group bg-white rounded-xl p-8 border border-gray-100 hover:border-indigo-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Schedule Any API</h3>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li className="flex items-center"><span className="w-1 h-1 bg-indigo-600 rounded-full mr-3"></span> GET and POST requests</li>
                <li className="flex items-center"><span className="w-1 h-1 bg-indigo-600 rounded-full mr-3"></span> Custom headers and body</li>
                <li className="flex items-center"><span className="w-1 h-1 bg-indigo-600 rounded-full mr-3"></span> Run every minute, hour, or day</li>
                <li className="flex items-center"><span className="w-1 h-1 bg-indigo-600 rounded-full mr-3"></span> Pause and resume anytime</li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white rounded-xl p-8 border border-gray-100 hover:border-indigo-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Multiple Delivery Options</h3>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li className="flex items-center"><span className="w-1 h-1 bg-purple-600 rounded-full mr-3"></span> Email notifications</li>
                <li className="flex items-center"><span className="w-1 h-1 bg-purple-600 rounded-full mr-3"></span> Slack integration</li>
                <li className="flex items-center"><span className="w-1 h-1 bg-purple-600 rounded-full mr-3"></span> Discord webhooks</li>
                <li className="flex items-center"><span className="w-1 h-1 bg-purple-600 rounded-full mr-3"></span> Custom webhooks</li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white rounded-xl p-8 border border-gray-100 hover:border-indigo-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Complete Run History</h3>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li className="flex items-center"><span className="w-1 h-1 bg-green-600 rounded-full mr-3"></span> View every execution</li>
                <li className="flex items-center"><span className="w-1 h-1 bg-green-600 rounded-full mr-3"></span> Success/failure status</li>
                <li className="flex items-center"><span className="w-1 h-1 bg-green-600 rounded-full mr-3"></span> Response preview and timing</li>
                <li className="flex items-center"><span className="w-1 h-1 bg-green-600 rounded-full mr-3"></span> Error details and debugging</li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="group bg-white rounded-xl p-8 border border-gray-100 hover:border-indigo-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Zero Setup Required</h3>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li className="flex items-center"><span className="w-1 h-1 bg-orange-600 rounded-full mr-3"></span> No servers to manage</li>
                <li className="flex items-center"><span className="w-1 h-1 bg-orange-600 rounded-full mr-3"></span> No installation needed</li>
                <li className="flex items-center"><span className="w-1 h-1 bg-orange-600 rounded-full mr-3"></span> Just paste your API URL</li>
                <li className="flex items-center"><span className="w-1 h-1 bg-orange-600 rounded-full mr-3"></span> Start in seconds</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">How It Works</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to automate your API calls
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center group">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-full font-bold text-2xl mx-auto mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Add an API URL</h3>
              <p className="text-gray-600 leading-relaxed">
                Paste your API endpoint URL into the dashboard. No code, no configuration needed.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center group">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-full font-bold text-2xl mx-auto mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Choose a Schedule</h3>
              <p className="text-gray-600 leading-relaxed">
                Select how often you want it to run: every minute, hour, day, or a custom interval.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center group">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full font-bold text-2xl mx-auto mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Get Results Automatically</h3>
              <p className="text-gray-600 leading-relaxed">
                Results are delivered automatically and logged for you to review anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-gradient-to-b from-white to-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
 <div className="w-20 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
         Choose the plan that fits your monitoring needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
         {/* Free Plan */}
  <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300">
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
      <span className="text-gray-700">Dashboard only</span>
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
    <div className="absolute -top-5 left-0 right-0 flex justify-center">
    <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
 Most Popular
    </span>
            </div>
     <div className="bg-white rounded-2xl p-8 border-2 border-indigo-600 shadow-2xl hover:shadow-3xl transition-all duration-300 h-full">
           <div className="text-center mb-6">
             <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
                <p className="text-gray-600 text-sm mb-6">Great for small teams</p>
         <div className="mb-6">
       <span className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">$9</span>
 <span className="text-gray-600 text-lg">/mo</span>
       </div>
           </div>
             
     <ul className="space-y-4 mb-8">
      <li className="flex items-start">
   <svg className="w-5 h-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
         </svg>
    <span className="text-gray-700"><strong className="text-gray-900">10</strong> API tasks</span>
         </li>
             <li className="flex items-start">
      <svg className="w-5 h-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
          <span className="text-gray-700">Every <strong className="text-gray-900">15 min</strong> minimum</span>
     </li>
         <li className="flex items-start">
         <svg className="w-5 h-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
             </svg>
  <span className="text-gray-700"><strong className="text-gray-900">Unlimited</strong> runs/month</span>
         </li>
          <li className="flex items-start">
      <svg className="w-5 h-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
   <span className="text-gray-700">Email & Slack alerts</span>
        </li>
         <li className="flex items-start">
                    <svg className="w-5 h-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
     </svg>
        <span className="text-gray-700"><strong className="text-gray-900">14 day</strong> history</span>
    </li>
        </ul>
     
           <Link href="/auth/signup?plan=starter" className="block w-full text-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg hover:shadow-xl transition-all">
        Start 14-Day Trial
       </Link>
      </div>
            </div>

            {/* Pro Plan */}
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300">
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
      <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
    <span className="text-gray-700"><strong className="text-gray-900">50</strong> API tasks</span>
</li>
         <li className="flex items-start">
   <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
     <span className="text-gray-700">Every <strong className="text-gray-900">5 min</strong> minimum</span>
       </li>
        <li className="flex items-start">
         <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
   </svg>
            <span className="text-gray-700"><strong className="text-gray-900">Unlimited</strong> runs/month</span>
    </li>
        <li className="flex items-start">
     <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
       </svg>
                  <span className="text-gray-700">All channels + SMS</span>
   </li>
                <li className="flex items-start">
       <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
         <span className="text-gray-700"><strong className="text-gray-900">30 day</strong> history</span>
    </li>
          <li className="flex items-start">
 <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-gray-700">Priority support</span>
                </li>
       </ul>
              
              <Link href="/auth/signup?plan=pro" className="block w-full text-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-semibold transition-colors">
        Start 14-Day Trial
 </Link>
   </div>
          </div>
          
          <div className="text-center mt-12">
  <p className="text-gray-600">
              All plans include a <strong className="text-gray-900">14-day free trial</strong> • No credit card required
      </p>
          </div>
   </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 mx-auto"></div>
          </div>

          <div className="space-y-4">
            {/* FAQ Item 1 */}
            <details className="group bg-white rounded-xl p-6 border border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 cursor-pointer">
              <summary className="font-semibold text-gray-900 flex justify-between items-center select-none">
                How secure is API Pulse?
                <span className="text-2xl group-open:rotate-45 transition-transform duration-300">+</span>
              </summary>
              <p className="text-gray-600 mt-4 leading-relaxed">
                We use industry-standard encryption, Row-Level Security policies, and secure API authentication. Your API URLs and responses are encrypted at rest and in transit.
              </p>
            </details>

            {/* FAQ Item 2 */}
            <details className="group bg-white rounded-xl p-6 border border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 cursor-pointer">
              <summary className="font-semibold text-gray-900 flex justify-between items-center select-none">
                How do I authenticate API requests?
                <span className="text-2xl group-open:rotate-45 transition-transform duration-300">+</span>
              </summary>
              <p className="text-gray-600 mt-4 leading-relaxed">
                You can add custom headers to your requests, including Authorization headers. API keys, Bearer tokens, and Basic Auth are all supported.
              </p>
            </details>

            {/* FAQ Item 3 */}
            <details className="group bg-white rounded-xl p-6 border border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 cursor-pointer">
              <summary className="font-semibold text-gray-900 flex justify-between items-center select-none">
                Can I send POST bodies?
                <span className="text-2xl group-open:rotate-45 transition-transform duration-300">+</span>
              </summary>
              <p className="text-gray-600 mt-4 leading-relaxed">
                Yes! You can choose GET or POST methods and add custom JSON request bodies, headers, and parameters as needed.
              </p>
            </details>

            {/* FAQ Item 4 */}
            <details className="group bg-white rounded-xl p-6 border border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 cursor-pointer">
              <summary className="font-semibold text-gray-900 flex justify-between items-center select-none">
                Do you store my API response data?
                <span className="text-2xl group-open:rotate-45 transition-transform duration-300">+</span>
              </summary>
              <p className="text-gray-600 mt-4 leading-relaxed">
                Yes, we store response logs so you can review past executions. You can view logs for the duration of your plan (24h, 30d, or 90d).
              </p>
            </details>

            {/* FAQ Item 5 */}
            <details className="group bg-white rounded-xl p-6 border border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 cursor-pointer">
              <summary className="font-semibold text-gray-900 flex justify-between items-center select-none">
                Can I export logs?
                <span className="text-2xl group-open:rotate-45 transition-transform duration-300">+</span>
              </summary>
              <p className="text-gray-600 mt-4 leading-relaxed">
                Coming soon! We're working on CSV and JSON export features for Pro and Enterprise users.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold text-white mb-6">Ready to automate?</h2>
          <p className="text-indigo-100 mb-10 text-xl leading-relaxed">
            Start scheduling your API calls in seconds. No credit card required.
          </p>
          <Link href="/auth/signup" className="bg-white text-indigo-600 px-10 py-4 rounded-lg hover:bg-indigo-50 font-bold text-lg inline-block shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200">
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-white mb-4">API Pulse</h4>
              <p className="text-sm">Schedule and monitor API calls automatically.</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="text-sm space-y-2">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="text-sm space-y-2">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Connect</h4>
              <ul className="text-sm space-y-2">
                <li><a href="#" className="hover:text-white">GitHub</a></li>
                <li><a href="#" className="hover:text-white">Twitter</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-sm text-center">
            <p>&copy; 2025 API Pulse. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
