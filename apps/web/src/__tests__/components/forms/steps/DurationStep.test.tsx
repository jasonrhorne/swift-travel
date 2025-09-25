import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DurationStep from '../../../../components/forms/steps/DurationStep';
import { useRequirementsStore } from '../../../../stores/requirementsStore';

// Mock the store
vi.mock('../../../../stores/requirementsStore');

describe('DurationStep', () => {
  const mockSetDuration = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRequirementsStore).mockReturnValue({
      duration: 'long-weekend',
      setDuration: mockSetDuration,
    } as any);
  });
  
  it('should render duration step with heading', () => {
    render(<DurationStep />);
    
    expect(screen.getByText('Your Trip Duration')).toBeInTheDocument();
    expect(screen.getByText(/We'll create the perfect long weekend itinerary/)).toBeInTheDocument();
  });
  
  it('should display long weekend selection', () => {
    render(<DurationStep />);
    
    expect(screen.getByText('Long Weekend Getaway')).toBeInTheDocument();
    expect(screen.getByText('3-4 days of curated experiences')).toBeInTheDocument();
    expect(screen.getByText('Selected')).toBeInTheDocument();
  });
  
  it('should display what the itinerary includes', () => {
    render(<DurationStep />);
    
    expect(screen.getByText('What your itinerary will include:')).toBeInTheDocument();
    expect(screen.getByText('Day-by-day schedule')).toBeInTheDocument();
    expect(screen.getByText('Must-see attractions')).toBeInTheDocument();
    expect(screen.getByText('Restaurant recommendations')).toBeInTheDocument();
    expect(screen.getByText('Local experiences')).toBeInTheDocument();
  });
  
  it('should set duration to long-weekend when duration is not set', () => {
    vi.mocked(useRequirementsStore).mockReturnValue({
      duration: null as any,
      setDuration: mockSetDuration,
    } as any);
    
    render(<DurationStep />);
    
    expect(mockSetDuration).toHaveBeenCalledWith('long-weekend');
  });
  
  it('should not set duration when already set', () => {
    render(<DurationStep />);
    
    expect(mockSetDuration).not.toHaveBeenCalled();
  });
  
  it('should display perfect for long weekends message', () => {
    render(<DurationStep />);
    
    expect(screen.getByText('Perfect for Long Weekends')).toBeInTheDocument();
    expect(screen.getByText(/optimized for 3-4 day trips/)).toBeInTheDocument();
  });
});