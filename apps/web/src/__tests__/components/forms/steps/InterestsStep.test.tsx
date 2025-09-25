import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import InterestsStep from '../../../../components/forms/steps/InterestsStep';
import { useRequirementsStore } from '../../../../stores/requirementsStore';

// Mock the store
vi.mock('../../../../stores/requirementsStore');

describe('InterestsStep', () => {
  const mockSetInterests = vi.fn();
  const defaultStore = {
    interests: [],
    setInterests: mockSetInterests,
    errors: {},
  };

  beforeEach(() => {
    vi.mocked(useRequirementsStore).mockReturnValue(defaultStore);
    mockSetInterests.mockClear();
  });

  it('should render all 12 interest categories', () => {
    render(<InterestsStep />);
    
    // Check all categories are present
    expect(screen.getByText('Arts and Culture')).toBeInTheDocument();
    expect(screen.getByText('Food and Dining')).toBeInTheDocument();
    expect(screen.getByText('History and Heritage')).toBeInTheDocument();
    expect(screen.getByText('Outdoor Activities')).toBeInTheDocument();
    expect(screen.getByText('Adventure and Sports')).toBeInTheDocument();
    expect(screen.getByText('Music and Entertainment')).toBeInTheDocument();
    expect(screen.getByText('Shopping')).toBeInTheDocument();
    expect(screen.getByText('Family Fun')).toBeInTheDocument();
    expect(screen.getByText('Wellness and Relaxation')).toBeInTheDocument();
    expect(screen.getByText('Learning and Education')).toBeInTheDocument();
    expect(screen.getByText('Photography and Sightseeing')).toBeInTheDocument();
    expect(screen.getByText('Local Life and Community')).toBeInTheDocument();
  });

  it('should display title and description', () => {
    render(<InterestsStep />);
    
    expect(screen.getByText('What are your interests?')).toBeInTheDocument();
    expect(screen.getByText(/Select all that apply/)).toBeInTheDocument();
  });

  it('should handle interest selection', () => {
    render(<InterestsStep />);
    
    const artsButton = screen.getByRole('button', { name: /Arts and Culture/i });
    fireEvent.click(artsButton);
    
    expect(mockSetInterests).toHaveBeenCalledWith(['arts-culture']);
  });

  it('should handle interest deselection', () => {
    vi.mocked(useRequirementsStore).mockReturnValue({
      ...defaultStore,
      interests: ['arts-culture'],
    });
    
    render(<InterestsStep />);
    
    const artsButton = screen.getByRole('button', { name: /Arts and Culture/i });
    fireEvent.click(artsButton);
    
    expect(mockSetInterests).toHaveBeenCalledWith([]);
  });

  it('should allow multiple selections', () => {
    const currentInterests: string[] = [];
    
    mockSetInterests.mockImplementation((interests) => {
      currentInterests.push(...interests);
    });
    
    const { rerender } = render(<InterestsStep />);
    
    // First selection
    const artsButton = screen.getByRole('button', { name: /Arts and Culture/i });
    fireEvent.click(artsButton);
    expect(mockSetInterests).toHaveBeenCalledWith(['arts-culture']);
    
    // Update mock to return new state
    vi.mocked(useRequirementsStore).mockReturnValue({
      ...defaultStore,
      interests: ['arts-culture'],
    });
    rerender(<InterestsStep />);
    
    // Second selection
    const foodButton = screen.getByRole('button', { name: /Food and Dining/i });
    fireEvent.click(foodButton);
    expect(mockSetInterests).toHaveBeenCalledWith(['arts-culture', 'food-dining']);
  });

  it('should display selected count', () => {
    vi.mocked(useRequirementsStore).mockReturnValue({
      ...defaultStore,
      interests: ['arts-culture', 'food-dining', 'shopping'],
    });
    
    render(<InterestsStep />);
    
    expect(screen.getByText('3 interests selected')).toBeInTheDocument();
  });

  it('should display singular form for single selection', () => {
    vi.mocked(useRequirementsStore).mockReturnValue({
      ...defaultStore,
      interests: ['shopping'],
    });
    
    render(<InterestsStep />);
    
    expect(screen.getByText('1 interest selected')).toBeInTheDocument();
  });

  it('should show visual indication for selected interests', () => {
    vi.mocked(useRequirementsStore).mockReturnValue({
      ...defaultStore,
      interests: ['arts-culture'],
    });
    
    render(<InterestsStep />);
    
    const artsButton = screen.getByRole('button', { name: /Arts and Culture/i });
    expect(artsButton).toHaveAttribute('aria-pressed', 'true');
    expect(artsButton).toHaveClass('border-indigo-500', 'bg-indigo-50');
  });

  it('should display validation errors', () => {
    vi.mocked(useRequirementsStore).mockReturnValue({
      ...defaultStore,
      errors: { interests: 'Please select at least one interest' },
    });
    
    render(<InterestsStep />);
    
    expect(screen.getByRole('alert')).toHaveTextContent('Please select at least one interest');
  });

  it('should display helpful tip', () => {
    render(<InterestsStep />);
    
    expect(screen.getByText('Personalized Recommendations')).toBeInTheDocument();
    expect(screen.getByText(/The more interests you select/)).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<InterestsStep />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('type', 'button');
    });
    
    // Check for icon accessibility
    const icons = screen.getAllByRole('img');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should maintain correct order of interests', () => {
    render(<InterestsStep />);
    
    const buttons = screen.getAllByRole('button');
    const labels = [
      'Arts and Culture',
      'Food and Dining',
      'History and Heritage',
      'Outdoor Activities',
      'Adventure and Sports',
      'Music and Entertainment',
      'Shopping',
      'Family Fun',
      'Wellness and Relaxation',
      'Learning and Education',
      'Photography and Sightseeing',
      'Local Life and Community'
    ];
    
    labels.forEach((label, index) => {
      expect(buttons[index]).toHaveTextContent(label);
    });
  });
});