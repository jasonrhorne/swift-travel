import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ItineraryCard from '@/components/itinerary/ItineraryCard';
import type { Itinerary, Activity } from '@swift-travel/shared';

// Mock activity data
const mockActivity: Activity = {
  id: 'activity-1',
  itineraryId: 'itinerary-1',
  name: 'Eiffel Tower Photography',
  description: 'Golden hour photography session at the iconic Eiffel Tower',
  category: 'sightseeing',
  timing: {
    dayNumber: 1,
    startTime: '07:00',
    duration: 120,
    flexibility: 'flexible',
    bufferTime: 30,
  },
  location: {
    name: 'Eiffel Tower',
    address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France',
    coordinates: { lat: 48.8584, lng: 2.2945 },
    neighborhood: 'Champ de Mars',
    googlePlaceId: 'ChIJLU7jZClu5kcR4PcOOO6p3I0',
    accessibility: {
      wheelchairAccessible: true,
      hearingAssistance: false,
      visualAssistance: false,
      notes: ['Accessible entrance available']
    }
  },
  estimatedDuration: 120,
  estimatedCost: {
    min: 25,
    max: 30,
    currency: 'EUR'
  },
  persona: 'photography',
  validation: {
    status: 'verified',
    confidence: 0.95,
    issues: [],
    source: 'google-places'
  },
  personaContext: {
    reasoning: 'Perfect for photography enthusiasts with great lighting opportunities',
    highlights: ['Iconic architecture', 'Golden hour lighting'],
    tips: ['Best light in early morning', 'Bring tripod for stability']
  }
};

const mockItinerary: Itinerary = {
  id: 'itinerary-1',
  userId: 'user-1',
  title: 'Paris Photography Weekend',
  description: 'A weekend adventure focused on capturing the beauty of Paris',
  destination: 'Paris, France',
  persona: 'photography',
  startDate: new Date('2024-06-01'),
  endDate: new Date('2024-06-02'),
  status: 'finalized',
  activities: [mockActivity],
  metadata: {
    processingTimeSeconds: 25,
    agentVersions: {
      research: '1.0.0',
      curation: '1.0.0',
      validation: '1.0.0',
      response: '1.0.0'
    },
    qualityScore: 0.92,
    costEstimate: {
      min: 150,
      max: 200,
      currency: 'EUR',
      breakdown: {
        activities: 120,
        dining: 50,
        transport: 30
      }
    }
  },
  createdAt: new Date('2024-05-30'),
  updatedAt: new Date('2024-05-30')
};

describe('ItineraryCard', () => {
  it('renders itinerary title and basic information', () => {
    render(<ItineraryCard itinerary={mockItinerary} />);
    
    expect(screen.getByText('Paris Photography Weekend')).toBeInTheDocument();
    expect(screen.getByText('A weekend adventure focused on capturing the beauty of Paris')).toBeInTheDocument();
    expect(screen.getAllByText('1 activities')).toHaveLength(2); // Appears in summary and day header
    expect(screen.getByText(/photography.*focused/i)).toBeInTheDocument();
  });

  it('displays cost estimate when available', () => {
    render(<ItineraryCard itinerary={mockItinerary} />);
    
    expect(screen.getByText('Estimated Cost')).toBeInTheDocument();
    expect(screen.getByText('EUR 150-200')).toBeInTheDocument();
  });

  it('displays quality score when available', () => {
    render(<ItineraryCard itinerary={mockItinerary} />);
    
    expect(screen.getByText('Quality Score')).toBeInTheDocument();
    expect(screen.getByText('9/10')).toBeInTheDocument();
  });

  it('shows day selector for multi-day itineraries', () => {
    const multiDayItinerary = {
      ...mockItinerary,
      activities: [
        mockActivity,
        { ...mockActivity, id: 'activity-2', timing: { ...mockActivity.timing, dayNumber: 2 } }
      ]
    };
    
    render(<ItineraryCard itinerary={multiDayItinerary} />);
    
    // Based on the output, we see buttons for dates in May/June
    expect(screen.getByRole('button', { name: /saturday, jun 1/i })).toBeInTheDocument();
  });

  it('switches between days when day selector is clicked', () => {
    const multiDayItinerary = {
      ...mockItinerary,
      activities: [
        mockActivity,
        { 
          ...mockActivity, 
          id: 'activity-2', 
          name: 'Louvre Museum Visit',
          timing: { ...mockActivity.timing, dayNumber: 2 } 
        }
      ]
    };
    
    render(<ItineraryCard itinerary={multiDayItinerary} />);
    
    // Initially shows day 1
    expect(screen.getByText('Eiffel Tower Photography')).toBeInTheDocument();
    
    // Click day 2 (Saturday, Jun 1)
    fireEvent.click(screen.getByRole('button', { name: /saturday, jun 1/i }));
    
    // Should now show day 2 activity
    expect(screen.getByText('Louvre Museum Visit')).toBeInTheDocument();
  });

  it('displays activities sorted by start time', () => {
    const itineraryWithMultipleActivities = {
      ...mockItinerary,
      activities: [
        { 
          ...mockActivity, 
          id: 'activity-1',
          name: 'Morning Activity',
          timing: { ...mockActivity.timing, startTime: '09:00' }
        },
        { 
          ...mockActivity, 
          id: 'activity-2',
          name: 'Early Activity',
          timing: { ...mockActivity.timing, startTime: '07:00' }
        }
      ]
    };
    
    render(<ItineraryCard itinerary={itineraryWithMultipleActivities} />);
    
    // Check that activities are in the right order based on headings
    const activityHeadings = screen.getAllByRole('heading', { level: 4 });
    expect(activityHeadings[0]).toHaveTextContent('Early Activity');
    expect(activityHeadings[1]).toHaveTextContent('Morning Activity');
  });

  it('shows metadata information', () => {
    render(<ItineraryCard itinerary={mockItinerary} />);
    
    expect(screen.getByText('Generated in 25s')).toBeInTheDocument();
    expect(screen.getByText(/Agent versions:/)).toBeInTheDocument();
    expect(screen.getByText(/Created:/)).toBeInTheDocument();
  });

  it('handles itinerary without cost estimate gracefully', () => {
    const itineraryWithoutCost = {
      ...mockItinerary,
      metadata: {
        ...mockItinerary.metadata,
        costEstimate: undefined
      }
    };
    
    render(<ItineraryCard itinerary={itineraryWithoutCost} />);
    
    expect(screen.queryByText('Estimated Cost')).not.toBeInTheDocument();
  });

  it('handles itinerary without quality score gracefully', () => {
    const itineraryWithoutScore = {
      ...mockItinerary,
      metadata: {
        ...mockItinerary.metadata,
        qualityScore: undefined
      }
    };
    
    render(<ItineraryCard itinerary={itineraryWithoutScore} />);
    
    expect(screen.queryByText('Quality Score')).not.toBeInTheDocument();
  });
});