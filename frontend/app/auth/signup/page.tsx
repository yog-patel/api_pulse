'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Modal from '../../../components/Modal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const router = useRouter();

  const getErrorMessage = (errorMessage: string): string => {
    // Handle specific error cases with user-friendly messages
    if (errorMessage.includes('User already registered')) {
      return 'This email is already registered. Please sign in instead or use a different email.';
    }
    if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
      return 'An account with this email already exists. Please sign in or use a different email.';
    }
    if (errorMessage.includes('Password should be minimum')) {
      return 'Password must be at least 6 characters long.';
    }
    if (errorMessage.includes('Invalid email')) {
      return 'Please enter a valid email address.';
    }
    if (errorMessage.includes('Network')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (errorMessage.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    return errorMessage || 'An unexpected error occurred. Please try again.';
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Client-side validation
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      setLoading(false);
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address.');
      setLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    if (!password) {
      setError('Please enter a password.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      // Determine the correct redirect URL based on environment
      const redirectUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://api-pulse.netlify.app';
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${redirectUrl}/auth/callback`,
        },
      });

      if (authError) {
        setError(getErrorMessage(authError.message));
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Show verification modal first
        setVerificationEmail(email);
        setShowVerificationModal(true);
        setLoading(false);

        // Insert profile in background
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: authData.user.id,
            email,
            full_name: fullName,
          },
        ]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Don't block the user even if profile creation fails
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(getErrorMessage(errorMsg));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Modal
        isOpen={showVerificationModal}
        title="Verify Your Email"
        message={`We've sent a verification email to ${verificationEmail}. Please check your inbox and click the verification link to complete your signup. You'll be redirected to your dashboard once verified.`}
        type="info"
        onClose={() => {
          setShowVerificationModal(false);
          setEmail('');
          setPassword('');
          setFullName('');
        }}
      />
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6 group">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg">
              <span className="text-white font-bold text-sm">AP</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">API Pulse</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h2>
          <p className="text-gray-600">Get started with API Pulse today</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary text-white py-3 rounded-xl hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 shadow-lg hover:scale-[1.02] glow-hover"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-black font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
