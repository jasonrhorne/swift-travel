'use client';

import { useState } from 'react';
import type { Itinerary, Activity } from '@swift-travel/shared';
import ActivityCard from './ActivityCard';

interface ItineraryCardProps {
  itinerary: Itinerary;
}

export default function ItineraryCard({ itinerary }: ItineraryCardProps) {
  const [selectedDay, setSelectedDay] = useState(1);

  // Group activities by day
  const activitiesByDay = itinerary.activities.reduce((acc, activity) => {
    const day = activity.timing.dayNumber;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(activity);
    return acc;
  }, {} as Record<number, Activity[]>);

  // Sort activities within each day by start time
  Object.keys(activitiesByDay).forEach(day => {
    activitiesByDay[parseInt(day)].sort((a, b) => {
      return a.timing.startTime.localeCompare(b.timing.startTime);
    });
  });

  const dayNumbers = Object.keys(activitiesByDay)
    .map(Number)
    .sort((a, b) => a - b);

  const getDateForDay = (dayNumber: number) => {
    if (itinerary.startDate) {
      const date = new Date(itinerary.startDate);
      date.setDate(date.getDate() + (dayNumber - 1));
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
    return `Day ${dayNumber}`;
  };

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(`2000-01-01T${timeString}`);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return timeString;
    }
  };

  const getTotalEstimatedCost = () => {
    if (itinerary.metadata?.costEstimate) {
      const { min, max, currency } = itinerary.metadata.costEstimate;
      return `${currency} ${min}-${max}`;
    }
    return null;
  };

  const getQualityScore = () => {
    if (itinerary.metadata?.qualityScore) {
      return Math.round(itinerary.metadata.qualityScore * 10);
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Itinerary Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              {itinerary.title || `${itinerary.destination} Adventure`}
            </h2>
            {itinerary.description && (
              <p className="text-gray-600">{itinerary.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span>{itinerary.activities.length} activities</span>
              {dayNumbers.length > 0 && (
                <span>{dayNumbers.length} day{dayNumbers.length > 1 ? 's' : ''}</span>
              )}
              {itinerary.persona && (
                <span className="capitalize">{itinerary.persona.replace('-', ' ')} focused</span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {getTotalEstimatedCost() && (
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-xs text-green-600 font-medium">Estimated Cost</div>
                <div className="text-lg font-bold text-green-700">
                  {getTotalEstimatedCost()}
                </div>
              </div>
            )}
            
            {getQualityScore() && (
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-xs text-blue-600 font-medium">Quality Score</div>
                <div className="text-lg font-bold text-blue-700">
                  {getQualityScore()}/10
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Day Selector */}
      {dayNumbers.length > 1 && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-wrap gap-2">
            {dayNumbers.map(dayNumber => (
              <button
                key={dayNumber}
                onClick={() => setSelectedDay(dayNumber)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${selectedDay === dayNumber 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {getDateForDay(dayNumber)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Day Activities */}
      {activitiesByDay[selectedDay] && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              {getDateForDay(selectedDay)}
            </h3>
            <div className="text-sm text-gray-500">
              {activitiesByDay[selectedDay].length} activities
            </div>
          </div>
          
          <div className="space-y-4">
            {activitiesByDay[selectedDay].map((activity, index) => (
              <div key={activity.id} className="relative">
                {/* Timeline connector */}
                {index < activitiesByDay[selectedDay].length - 1 && (
                  <div className="absolute left-6 top-20 w-0.5 h-8 bg-gray-200 z-0" />
                )}
                
                {/* Time marker */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-sm font-medium z-10">
                    {formatTime(activity.timing.startTime)}
                  </div>
                  
                  <div className="flex-1">
                    <ActivityCard activity={activity} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!activitiesByDay[selectedDay] && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">No activities planned for this day.</p>
        </div>
      )}

      {/* Itinerary Metadata */}
      {itinerary.metadata && (
        <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 space-y-1">
          <div className="font-medium">Itinerary Details</div>
          {itinerary.metadata.processingTimeSeconds && (
            <div>Generated in {itinerary.metadata.processingTimeSeconds}s</div>
          )}
          {itinerary.metadata.agentVersions && (
            <div>
              Agent versions: R{itinerary.metadata.agentVersions.research} • 
              C{itinerary.metadata.agentVersions.curation} • 
              V{itinerary.metadata.agentVersions.validation} • 
              F{itinerary.metadata.agentVersions.response}
            </div>
          )}
          <div>Created: {new Date(itinerary.createdAt).toLocaleDateString()}</div>
        </div>
      )}
    </div>
  );
}