'use client';

import React from 'react';
import { useRequirementsStore } from '@/stores/requirementsStore';
import type { BudgetRange } from '@swift-travel/shared';

interface BudgetOption {
  id: BudgetRange;
  title: string;
  description: string;
  range: string;
  icon: string;
  color: string;
}

const budgetOptions: BudgetOption[] = [
  {
    id: 'budget',
    title: 'Budget Friendly',
    description: 'Great value experiences without breaking the bank',
    range: '$50-100/day',
    icon: '💰',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'mid-range',
    title: 'Mid-Range',
    description: 'Balanced mix of comfort and experiences',
    range: '$100-250/day',
    icon: '⭐',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'luxury',
    title: 'Luxury',
    description: 'Premium experiences and top-tier accommodations',
    range: '$250-500/day',
    icon: '💎',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'no-limit',
    title: 'No Limit',
    description: 'The finest experiences money can buy',
    range: '$500+/day',
    icon: '👑',
    color: 'from-yellow-500 to-orange-500'
  }
];

export default function PreferencesStep() {
  const { budgetRange, setBudgetRange, groupSize, setGroupSize, errors } = useRequirementsStore();
  
  const handleBudgetSelect = (budget: BudgetRange) => {
    setBudgetRange(budget);
  };
  
  const handleGroupSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = parseInt(e.target.value, 10);
    if (!isNaN(size) && size >= 1 && size <= 20) {
      setGroupSize(size);
    }
  };
  
  const getGroupSizeLabel = (size: number): string => {
    if (size === 1) return 'Solo traveler';
    if (size === 2) return 'Couple';
    if (size <= 4) return 'Small group';
    if (size <= 8) return 'Medium group';
    return 'Large group';
  };
  
  const hasBudgetError = errors.budgetRange;
  const hasGroupSizeError = errors.groupSize;
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Travel Preferences
        </h2>
        <p className="text-gray-600">
          Help us tailor recommendations to your budget and group size.
        </p>
      </div>
      
      {/* Budget Range */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          What's your budget range? *
        </h3>
        
        {hasBudgetError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600" role="alert">
              {hasBudgetError}
            </p>
          </div>
        )}
        
        <div className="grid gap-3 sm:grid-cols-2">
          {budgetOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleBudgetSelect(option.id)}
              className={`p-4 border-2 rounded-lg text-left transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                budgetRange === option.id
                  ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              aria-pressed={budgetRange === option.id}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${option.color} flex items-center justify-center text-lg flex-shrink-0`}>
                  {option.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium mb-1 ${
                    budgetRange === option.id ? 'text-indigo-900' : 'text-gray-900'
                  }`}>
                    {option.title}
                  </h4>
                  
                  <p className={`text-sm mb-1 ${
                    budgetRange === option.id ? 'text-indigo-700' : 'text-gray-600'
                  }`}>
                    {option.description}
                  </p>
                  
                  <p className={`text-xs font-medium ${
                    budgetRange === option.id ? 'text-indigo-600' : 'text-gray-500'
                  }`}>
                    {option.range}
                  </p>
                </div>
                
                {budgetRange === option.id && (
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Group Size */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Group Size *
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <label htmlFor="group-size" className="block text-sm font-medium text-gray-700">
              Number of travelers:
            </label>
            
            <input
              type="number"
              id="group-size"
              value={groupSize}
              onChange={handleGroupSizeChange}
              min="1"
              max="20"
              className={`w-20 px-3 py-2 border rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                hasGroupSizeError 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300'
              }`}
              aria-invalid={hasGroupSizeError ? 'true' : 'false'}
              aria-describedby={hasGroupSizeError ? 'group-size-error' : 'group-size-help'}
            />
            
            <span className="text-sm text-gray-600">
              ({getGroupSizeLabel(groupSize)})
            </span>
          </div>
          
          {hasGroupSizeError && (
            <p id="group-size-error" className="text-sm text-red-600" role="alert">
              {hasGroupSizeError}
            </p>
          )}
          
          <p id="group-size-help" className="text-sm text-gray-500">
            This helps us recommend appropriately sized activities and dining options.
          </p>
        </div>
        
        {/* Quick select buttons */}
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 4, 6, 8].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setGroupSize(size)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  groupSize === size
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {size} {size === 1 ? 'person' : 'people'}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Budget explanation */}
      {budgetRange && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                Budget Range: {budgetOptions.find(b => b.id === budgetRange)?.title}
              </h4>
              <p className="text-sm text-blue-700">
                We'll curate activities and dining options that align with your {budgetRange === 'no-limit' ? 'unlimited' : budgetOptions.find(b => b.id === budgetRange)?.range} budget. 
                {groupSize > 1 && ` Group discounts and shared experiences will be prioritized for your ${getGroupSizeLabel(groupSize).toLowerCase()}.`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}