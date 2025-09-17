'use client';

import React, { useState, useEffect } from 'react';
import { useRequirementsStore } from '@/stores/requirementsStore';

export default function DatesStep() {
  const { dates, setDates, errors } = useRequirementsStore();
  const [startDate, setStartDate] = useState(
    dates.startDate ? dates.startDate.toISOString().split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState(
    dates.endDate ? dates.endDate.toISOString().split('T')[0] : ''
  );
  
  // Smart defaults
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextWeekend = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000);
  
  // Update store when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      setDates(start, end);
    }
  }, [startDate, endDate, setDates]);
  
  // Handle start date change
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    
    // Auto-adjust end date if it's before or equal to start date
    if (endDate && newStartDate >= endDate) {
      const start = new Date(newStartDate);
      const newEnd = new Date(start.getTime() + 2 * 24 * 60 * 60 * 1000); // +2 days
      setEndDate(newEnd.toISOString().split('T')[0]);
    }
  };
  
  // Handle end date change
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };
  
  // Quick select handlers
  const handleQuickSelect = (days: number) => {
    const start = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // Start next week
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };
  
  // Calculate trip duration
  const getTripDuration = (): string => {
    if (!startDate || !endDate) return '';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day';
    if (diffDays === 2) return 'Weekend (2 days)';
    if (diffDays <= 7) return `${diffDays} days`;
    if (diffDays <= 14) return `${diffDays} days (${Math.ceil(diffDays / 7)} week${diffDays > 7 ? 's' : ''})`;
    
    return `${diffDays} days`;
  };
  
  const hasStartError = errors['dates.startDate'];
  const hasEndError = errors['dates.endDate'] || errors.dates;
  const duration = getTripDuration();
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          When are you traveling?
        </h2>
        <p className="text-gray-600">
          Choose your travel dates so we can plan activities and check availability.
        </p>
      </div>
      
      {/* Quick select options */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Quick select:</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => handleQuickSelect(2)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Weekend
          </button>
          <button
            type="button"
            onClick={() => handleQuickSelect(3)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            3 Days
          </button>
          <button
            type="button"
            onClick={() => handleQuickSelect(5)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Work Week
          </button>
          <button
            type="button"
            onClick={() => handleQuickSelect(7)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            1 Week
          </button>
        </div>
      </div>
      
      {/* Date inputs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
            Start Date *
          </label>
          <input
            type="date"
            id="start-date"
            value={startDate}
            onChange={handleStartDateChange}
            min={today.toISOString().split('T')[0]}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
              hasStartError 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300'
            }`}
            aria-invalid={hasStartError ? 'true' : 'false'}
            aria-describedby={hasStartError ? 'start-date-error' : undefined}
          />
          {hasStartError && (
            <p id="start-date-error" className="mt-2 text-sm text-red-600" role="alert">
              {hasStartError}
            </p>
          )}
        </div>
        
        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
            End Date *
          </label>
          <input
            type="date"
            id="end-date"
            value={endDate}
            onChange={handleEndDateChange}
            min={startDate || today.toISOString().split('T')[0]}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
              hasEndError 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300'
            }`}
            aria-invalid={hasEndError ? 'true' : 'false'}
            aria-describedby={hasEndError ? 'end-date-error' : undefined}
          />
          {hasEndError && (
            <p id="end-date-error" className="mt-2 text-sm text-red-600" role="alert">
              {hasEndError}
            </p>
          )}
        </div>
      </div>
      
      {/* Trip duration display */}
      {duration && (
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-green-900">
                Trip Duration: {duration}
              </h4>
              <p className="text-sm text-green-700">
                Perfect for a {duration.includes('Weekend') ? 'quick getaway' : 'memorable adventure'}!
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Travel tips */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Travel Tip
            </h4>
            <p className="text-sm text-blue-700">
              Consider booking flights and accommodations early for better prices. Our AI will factor in seasonal events and local holidays when planning your itinerary.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}