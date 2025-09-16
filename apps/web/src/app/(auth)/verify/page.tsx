'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';

export default function VerifyPage() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const {
    isAuthenticated,
    error,
    verifyMagicLink,
    clearError
  } = useAuthStore();
  
  const token = searchParams.get('token');
  
  useEffect(() => {
    clearError();
    
    const handleVerification = async () => {
      if (!token) {
        setStatus('error');
        return;
      }
      
      try {
        await verifyMagicLink(token);
        setStatus('success');
        
        // Redirect to dashboard after a brief delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } catch (error) {
        setStatus('error');
        console.error('Token verification failed:', error);
      }
    };
    
    handleVerification();
  }, [token, verifyMagicLink, clearError, router]);
  
  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && status === 'success') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, status, router]);
  
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Invalid Link</h2>
          <p className="text-gray-600">
            This magic link is missing required information. Please request a new magic link.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Request New Magic Link
          </Link>
        </div>
      </div>
    );
  }
  
  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Verifying your magic link...</h2>
          <p className="text-gray-600">
            Please wait while we securely sign you in.
          </p>
        </div>
      </div>
    );
  }
  
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome to Swift Travel!</h2>
          <p className="text-gray-600">
            You've been successfully signed in. Redirecting you to your dashboard...
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm">
              <strong>🎉 Success!</strong> Your account is ready and you can start planning your next adventure.
            </p>
          </div>
          
          <Link
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">❌</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Verification Failed</h2>
        <p className="text-gray-600 mb-4">
          We couldn't verify your magic link. This could happen if:
        </p>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
          <ul className="text-red-800 text-sm space-y-1">
            <li>• The link has expired (links expire after 15 minutes)</li>
            <li>• The link has already been used</li>
            <li>• The link is invalid or corrupted</li>
          </ul>
        </div>
        
        {error && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-gray-700 text-sm">
              <strong>Error details:</strong> {error}
            </p>
          </div>
        )}
        
        <div className="space-y-4">
          <Link
            href="/login"
            className="block w-full px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Request New Magic Link
          </Link>
          
          <Link
            href="/"
            className="block w-full px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}