'use client';

import { useEffect, useState } from 'react';

interface ErrorBoundaryProps {
  error: string;
  title?: string;
  onRetry?: () => void;
  children?: React.ReactNode;
}

export default function ErrorBoundary({ 
  error, 
  title = "Something went wrong", 
  onRetry,
  children 
}: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (error) {
      setHasError(true);
    }
  }, [error]);

  const getErrorIcon = () => {
    if (error.toLowerCase().includes('not found')) {
      return (
        <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m-6-4h6M5.05 16.05L4 17l1.05 1.05M18.95 16.05L20 17l-1.05 1.05" />
        </svg>
      );
    }
    
    if (error.toLowerCase().includes('timeout') || error.toLowerCase().includes('connection')) {
      return (
        <svg className="w-16 h-16 text-yellow-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.081 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    }

    return (
      <svg className="w-16 h-16 text-red-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const getErrorSuggestions = () => {
    if (error.toLowerCase().includes('not found')) {
      return [
        'Check if the itinerary ID is correct',
        'Try creating a new itinerary',
        'Contact support if this issue persists'
      ];
    }
    
    if (error.toLowerCase().includes('timeout')) {
      return [
        'Check your internet connection',
        'Try refreshing the page',
        'The service might be experiencing high traffic'
      ];
    }
    
    if (error.toLowerCase().includes('connection') || error.toLowerCase().includes('network')) {
      return [
        'Check your internet connection',
        'Try refreshing the page in a few moments',
        'Our servers might be temporarily unavailable'
      ];
    }

    return [
      'Try refreshing the page',
      'Clear your browser cache',
      'Contact support if the problem continues'
    ];
  };

  if (!hasError && !error) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="max-w-md w-full mx-auto text-center space-y-6 p-6">
        {getErrorIcon()}
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">
            {title}
          </h2>
          <p className="text-gray-600">
            {error}
          </p>
        </div>

        {/* Error Suggestions */}
        <div className="bg-gray-50 rounded-lg p-4 text-left">
          <h3 className="font-medium text-gray-900 mb-2">Try these solutions:</h3>
          <ul className="space-y-1 text-sm text-gray-600">
            {getErrorSuggestions().map((suggestion, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-gray-400 mt-1">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Refresh Page
          </button>
          
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>

        {/* Support Link */}
        <div className="text-sm text-gray-500">
          Need help? {' '}
          <a 
            href="mailto:support@swift-travel.com" 
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}