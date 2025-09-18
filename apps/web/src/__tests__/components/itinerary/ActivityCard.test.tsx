import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ActivityCard from '@/components/itinerary/ActivityCard';
import type { Activity } from '@swift-travel/shared';

const mockActivity: Activity = {
  id: 'activity-1',
  itineraryId: 'itinerary-1',
  name: 'Eiffel Tower Photography',
  description: 'Golden hour photography session at the iconic Eiffel Tower with stunning views of Paris.',
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
      notes: ['Accessible entrance available', 'Elevator to first floor']
    }
  },
  estimatedDuration: 120,
  estimatedCost: {
    min: 25,
    max: 30,
    currency: 'EUR'
  },
  persona: 'photography',
  bookingRequired: true,
  bookingUrl: 'https://example.com/book-eiffel-tower',
  validation: {
    status: 'verified',
    confidence: 0.95,
    issues: [],
    source: 'google-places'
  },
  personaContext: {
    reasoning: 'Perfect for photography enthusiasts with great lighting opportunities',
    highlights: ['Iconic architecture', 'Golden hour lighting', 'Panoramic city views'],
    tips: ['Best light in early morning', 'Bring tripod for stability', 'Check weather conditions']
  }
};

describe('ActivityCard', () => {
  it('renders activity basic information', () => {
    render(<ActivityCard activity={mockActivity} />);
    
    expect(screen.getByText('Eiffel Tower Photography')).toBeInTheDocument();
    expect(screen.getByText(/Golden hour photography session at the iconic Eiffel Tower/)).toBeInTheDocument();
    expect(screen.getByText('sightseeing')).toBeInTheDocument();
  });

  it('displays category icon and styling', () => {
    render(<ActivityCard activity={mockActivity} />);
    
    expect(screen.getByText('🏛️')).toBeInTheDocument(); // sightseeing icon
    expect(screen.getByText('sightseeing')).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('shows validation status', () => {
    render(<ActivityCard activity={mockActivity} />);
    
    expect(screen.getByText(/✅.*Verified/)).toBeInTheDocument();
  });

  it('displays timing information', () => {
    render(<ActivityCard activity={mockActivity} />);
    
    expect(screen.getByText('2h')).toBeInTheDocument(); // 120 minutes
    expect(screen.getByText('flexible')).toBeInTheDocument(); // lowercase due to capitalize class
  });

  it('shows cost when available', () => {
    render(<ActivityCard activity={mockActivity} />);
    
    expect(screen.getByText('EUR 25-30')).toBeInTheDocument();
  });

  it('indicates booking requirement', () => {
    render(<ActivityCard activity={mockActivity} />);
    
    expect(screen.getByText('📅')).toBeInTheDocument();
    expect(screen.getByText('Booking required')).toBeInTheDocument();
  });

  it('expands to show detailed information when clicked', () => {
    render(<ActivityCard activity={mockActivity} />);
    
    // Initially collapsed
    expect(screen.queryByText('Why This Matters')).not.toBeInTheDocument();
    
    // Click expand button
    const expandButton = screen.getByLabelText('Expand details');
    fireEvent.click(expandButton);
    
    // Should now show expanded content
    expect(screen.getByText('Why This Matters')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Accessibility')).toBeInTheDocument();
    expect(screen.getByText('Booking')).toBeInTheDocument();
  });

  it('displays location details in expanded view', () => {
    render(<ActivityCard activity={mockActivity} />);
    
    // Expand
    fireEvent.click(screen.getByLabelText('Expand details'));
    
    expect(screen.getByText('Eiffel Tower')).toBeInTheDocument();
    expect(screen.getByText('Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France')).toBeInTheDocument();
    expect(screen.getByText('in Champ de Mars')).toBeInTheDocument();
  });

  it('shows persona context in expanded view', () => {
    render(<ActivityCard activity={mockActivity} />);
    
    // Expand
    fireEvent.click(screen.getByLabelText('Expand details'));
    
    expect(screen.getByText('Perfect for photography enthusiasts with great lighting opportunities')).toBeInTheDocument();
    
    // Check highlights
    expect(screen.getByText('Highlights:')).toBeInTheDocument();
    expect(screen.getByText('Iconic architecture')).toBeInTheDocument();
    expect(screen.getByText('Golden hour lighting')).toBeInTheDocument();
    
    // Check tips
    expect(screen.getByText('Tips:')).toBeInTheDocument();
    expect(screen.getByText('Best light in early morning')).toBeInTheDocument();
    expect(screen.getByText('Bring tripod for stability')).toBeInTheDocument();
  });

  it('displays accessibility information in expanded view', () => {
    render(<ActivityCard activity={mockActivity} />);
    
    // Expand
    fireEvent.click(screen.getByLabelText('Expand details'));
    
    expect(screen.getByText('♿')).toBeInTheDocument();
    expect(screen.getByText(/Wheelchair.*accessible/)).toBeInTheDocument();
    expect(screen.getByText('Accessible entrance available')).toBeInTheDocument();
    expect(screen.getByText('Elevator to first floor')).toBeInTheDocument();
  });

  it('shows booking link in expanded view when available', () => {
    render(<ActivityCard activity={mockActivity} />);
    
    // Expand
    fireEvent.click(screen.getByLabelText('Expand details'));
    
    const bookingLink = screen.getByText('Book now (opens in new tab)');
    expect(bookingLink).toBeInTheDocument();
    expect(bookingLink.closest('a')).toHaveAttribute('href', 'https://example.com/book-eiffel-tower');
    expect(bookingLink.closest('a')).toHaveAttribute('target', '_blank');
  });

  it('handles activity without cost gracefully', () => {
    const activityWithoutCost = {
      ...mockActivity,
      estimatedCost: undefined
    };
    
    render(<ActivityCard activity={activityWithoutCost} />);
    
    expect(screen.queryByText(/💰/)).not.toBeInTheDocument();
  });

  it('handles activity without booking requirement', () => {
    const activityWithoutBooking = {
      ...mockActivity,
      bookingRequired: false,
      bookingUrl: undefined
    };
    
    render(<ActivityCard activity={activityWithoutBooking} />);
    
    expect(screen.queryByText('Booking required')).not.toBeInTheDocument();
  });

  it('handles different validation statuses', () => {
    const activityPending = {
      ...mockActivity,
      validation: {
        status: 'pending' as const,
        confidence: 0.5,
        issues: []
      }
    };
    
    render(<ActivityCard activity={activityPending} />);
    
    expect(screen.getByText(/⏳.*Pending/)).toBeInTheDocument();
  });

  it('formats duration correctly for different time periods', () => {
    // Test 45 minutes
    const shortActivity = {
      ...mockActivity,
      timing: { ...mockActivity.timing, duration: 45 }
    };
    
    const { rerender } = render(<ActivityCard activity={shortActivity} />);
    expect(screen.getByText('45m')).toBeInTheDocument();
    
    // Test 3 hours (180 minutes)
    const longActivity = {
      ...mockActivity,
      timing: { ...mockActivity.timing, duration: 180 }
    };
    
    rerender(<ActivityCard activity={longActivity} />);
    expect(screen.getByText('3h')).toBeInTheDocument();
    
    // Test 2.5 hours (150 minutes)
    const mixedActivity = {
      ...mockActivity,
      timing: { ...mockActivity.timing, duration: 150 }
    };
    
    rerender(<ActivityCard activity={mixedActivity} />);
    expect(screen.getByText('2h 30m')).toBeInTheDocument();
  });
});