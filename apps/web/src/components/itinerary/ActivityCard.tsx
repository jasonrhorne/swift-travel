'use client';

import { useState } from 'react';
import type { Activity } from '@swift-travel/shared';

interface ActivityCardProps {
  activity: Activity;
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCategoryIcon = (category: string) => {
    const icons = {
      food: '🍽️',
      sightseeing: '🏛️',
      activity: '🎯',
      transport: '🚗',
      accommodation: '🏨',
      shopping: '🛍️',
      entertainment: '🎭'
    };
    return icons[category as keyof typeof icons] || '📍';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      food: 'bg-orange-100 text-orange-800 border-orange-200',
      sightseeing: 'bg-blue-100 text-blue-800 border-blue-200',
      activity: 'bg-green-100 text-green-800 border-green-200',
      transport: 'bg-gray-100 text-gray-800 border-gray-200',
      accommodation: 'bg-purple-100 text-purple-800 border-purple-200',
      shopping: 'bg-pink-100 text-pink-800 border-pink-200',
      entertainment: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getFlexibilityIcon = (flexibility: string) => {
    switch (flexibility) {
      case 'fixed':
        return '⏰';
      case 'flexible':
        return '🕐';
      case 'weather-dependent':
        return '🌤️';
      default:
        return '📅';
    }
  };

  const formatCost = () => {
    if (activity.estimatedCost) {
      const { min, max, currency } = activity.estimatedCost;
      if (min === max) {
        return `${currency} ${min}`;
      }
      return `${currency} ${min}-${max}`;
    }
    return null;
  };

  const getValidationStatus = () => {
    if (activity.validation) {
      const { status, confidence } = activity.validation;
      if (status === 'verified') {
        return { icon: '✅', text: 'Verified', color: 'text-green-600' };
      }
      if (status === 'validated' && confidence >= 0.8) {
        return { icon: '✓', text: 'Validated', color: 'text-blue-600' };
      }
      if (status === 'pending') {
        return { icon: '⏳', text: 'Pending', color: 'text-yellow-600' };
      }
    }
    return { icon: '📍', text: 'Located', color: 'text-gray-600' };
  };

  const validationStatus = getValidationStatus();

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Card Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getCategoryIcon(activity.category)}</span>
              <span className={`
                px-2 py-1 rounded-full text-xs font-medium border
                ${getCategoryColor(activity.category)}
              `}>
                {activity.category}
              </span>
              <span className={`text-xs ${validationStatus.color}`}>
                {validationStatus.icon} {validationStatus.text}
              </span>
            </div>
            
            <h4 className="font-semibold text-gray-900 leading-tight">
              {activity.name}
            </h4>
            
            <p className="text-gray-600 text-sm line-clamp-2">
              {activity.description}
            </p>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            <svg 
              className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Quick Info Bar */}
      <div className="px-4 pb-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center space-x-1">
            <span>⏱️</span>
            <span>{formatDuration(activity.timing.duration)}</span>
          </span>
          
          <span className="flex items-center space-x-1">
            <span>{getFlexibilityIcon(activity.timing.flexibility)}</span>
            <span className="capitalize">{activity.timing.flexibility}</span>
          </span>
          
          {formatCost() && (
            <span className="flex items-center space-x-1">
              <span>💰</span>
              <span>{formatCost()}</span>
            </span>
          )}
          
          {activity.bookingRequired && (
            <span className="flex items-center space-x-1 text-orange-600">
              <span>📅</span>
              <span>Booking required</span>
            </span>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50">
          <div className="p-4 space-y-4">
            {/* Location Details */}
            <div className="space-y-2">
              <h5 className="font-medium text-gray-900">Location</h5>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-start space-x-2">
                  <span>📍</span>
                  <div>
                    <div className="font-medium">{activity.location.name}</div>
                    {activity.location.address && (
                      <div className="text-gray-500">{activity.location.address}</div>
                    )}
                    {activity.location.neighborhood && (
                      <div className="text-gray-500">in {activity.location.neighborhood}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Persona Context */}
            {activity.personaContext && (
              <div className="space-y-2">
                <h5 className="font-medium text-gray-900">Why This Matters</h5>
                <div className="text-sm text-gray-600">
                  {activity.personaContext.reasoning && (
                    <p className="mb-2">{activity.personaContext.reasoning}</p>
                  )}
                  
                  {activity.personaContext.highlights && activity.personaContext.highlights.length > 0 && (
                    <div className="space-y-1">
                      <div className="font-medium text-gray-700">Highlights:</div>
                      <ul className="space-y-1">
                        {activity.personaContext.highlights.map((highlight, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-yellow-500 mt-0.5">⭐</span>
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {activity.personaContext.tips && activity.personaContext.tips.length > 0 && (
                    <div className="space-y-1 mt-2">
                      <div className="font-medium text-gray-700">Tips:</div>
                      <ul className="space-y-1">
                        {activity.personaContext.tips.map((tip, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-blue-500 mt-0.5">💡</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Accessibility Info */}
            {activity.location.accessibility && (
              <div className="space-y-2">
                <h5 className="font-medium text-gray-900">Accessibility</h5>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span>{activity.location.accessibility.wheelchairAccessible ? '♿' : '🚫'}</span>
                    <span>
                      Wheelchair {activity.location.accessibility.wheelchairAccessible ? 'accessible' : 'not accessible'}
                    </span>
                  </div>
                  
                  {activity.location.accessibility.notes && activity.location.accessibility.notes.length > 0 && (
                    <div className="mt-2">
                      {activity.location.accessibility.notes.map((note, index) => (
                        <div key={index} className="text-gray-500">{note}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Booking Information */}
            {activity.bookingRequired && activity.bookingUrl && (
              <div className="space-y-2">
                <h5 className="font-medium text-gray-900">Booking</h5>
                <a
                  href={activity.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  <span>🔗</span>
                  <span>Book now (opens in new tab)</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}