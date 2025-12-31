'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function AuthCallback() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the current session (which should be set after email verification or OAuth)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setError('Error verifying email. Please try again.');
          setLoading(false);
          return;
        }

        if (session) {
          // Check if profile exists for this user
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .single();

          // If profile doesn't exist, create it (handles OAuth users)
          if (profileError || !profile) {
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
              // Continue anyway - the profile may have been created concurrently
            }
          }

          // Email verified or OAuth success - redirect to dashboard
          router.push('/dashboard');
        } else {
          setError('Email verification failed. Please try signing up again.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Callback error:', err);
        setError('An error occurred during verification.');
        setLoading(false);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying your email...</p>
          </>
        ) : (
          <>
            <p className="text-red-600 font-semibold">{error}</p>
            <p className="text-gray-600 mt-2">
              Redirecting you back...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
