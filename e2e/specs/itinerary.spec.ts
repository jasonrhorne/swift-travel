import { test, expect } from '@playwright/test';

test.describe('Itinerary Generation Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Set up any necessary authentication or session state
    await page.goto('/');
  });

  test('complete user journey from requirements form to itinerary display', async ({ page }) => {
    // Step 1: Fill out requirements form
    await page.goto('/');
    
    // Fill destination
    await page.fill('[data-testid="destination-input"]', 'Paris, France');
    
    // Select persona
    await page.click('[data-testid="persona-photography"]');
    
    // Set dates
    await page.fill('[data-testid="start-date"]', '2024-06-01');
    await page.fill('[data-testid="end-date"]', '2024-06-02');
    
    // Add preferences
    await page.fill('[data-testid="preferences"]', 'Early morning photography, golden hour shots');
    
    // Submit form
    await page.click('[data-testid="submit-requirements"]');
    
    // Step 2: Progress tracking page
    await expect(page).toHaveURL(/\/itinerary\/[a-zA-Z0-9-]+/);
    
    // Verify progress tracker is visible
    await expect(page.locator('text=Creating Your Itinerary')).toBeVisible();
    await expect(page.locator('text=Progress:')).toBeVisible();
    await expect(page.locator('text=Elapsed:')).toBeVisible();
    
    // Check that progress steps are visible
    await expect(page.locator('text=Getting Started')).toBeVisible();
    await expect(page.locator('text=Research')).toBeVisible();
    await expect(page.locator('text=Curation')).toBeVisible();
    await expect(page.locator('text=Validation')).toBeVisible();
    await expect(page.locator('text=Finalizing')).toBeVisible();
    await expect(page.locator('text=Complete')).toBeVisible();
    
    // Wait for progress updates (mock SSE events in test environment)
    await page.evaluate(() => {
      // Simulate progress events
      const mockProgress = [
        { stage: 'research-in-progress', message: 'Discovering unique experiences...', progress: 25 },
        { stage: 'curation-in-progress', message: 'Creating your itinerary...', progress: 50 },
        { stage: 'validation-in-progress', message: 'Verifying locations...', progress: 75 },
        { stage: 'response-in-progress', message: 'Formatting your itinerary...', progress: 90 }
      ];
      
      // Dispatch custom events to simulate SSE
      mockProgress.forEach((progress, index) => {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('mock-progress', { detail: progress }));
        }, index * 1000);
      });
      
      // Simulate completion after all progress steps
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('mock-completed', { 
          detail: { itineraryId: 'test-itinerary-id' } 
        }));
      }, 5000);
    });
    
    // Verify progress updates are reflected in UI
    await expect(page.locator('text=Discovering unique experiences')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Progress: 25%')).toBeVisible();
    
    await expect(page.locator('text=Creating your itinerary')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Progress: 50%')).toBeVisible();
    
    // Step 3: Completed itinerary display
    // Wait for completion and redirect to final itinerary
    await expect(page.locator('text=Your personalized itinerary is ready')).toBeVisible({ timeout: 15000 });
    
    // Verify itinerary content is displayed
    await expect(page.locator('[data-testid="itinerary-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="itinerary-description"]')).toBeVisible();
    
    // Check day selector for multi-day itinerary
    await expect(page.locator('[data-testid="day-selector"]')).toBeVisible();
    
    // Verify activities are displayed
    await expect(page.locator('[data-testid="activity-card"]').first()).toBeVisible();
    
    // Check activity details
    const firstActivity = page.locator('[data-testid="activity-card"]').first();
    await expect(firstActivity.locator('[data-testid="activity-name"]')).toBeVisible();
    await expect(firstActivity.locator('[data-testid="activity-category"]')).toBeVisible();
    await expect(firstActivity.locator('[data-testid="activity-duration"]')).toBeVisible();
    
    // Verify metadata is shown
    await expect(page.locator('text=Generated in')).toBeVisible();
    await expect(page.locator('text=Quality Score')).toBeVisible();
    await expect(page.locator('text=Estimated Cost')).toBeVisible();
  });

  test('handles generation errors gracefully', async ({ page }) => {
    // Start the journey
    await page.goto('/');
    
    // Fill form with data that will trigger an error (in test environment)
    await page.fill('[data-testid="destination-input"]', 'Invalid Location');
    await page.click('[data-testid="persona-photography"]');
    await page.fill('[data-testid="start-date"]', '2024-06-01');
    await page.fill('[data-testid="end-date"]', '2024-06-02');
    await page.click('[data-testid="submit-requirements"]');
    
    // Wait for progress page
    await expect(page).toHaveURL(/\/itinerary\/[a-zA-Z0-9-]+/);
    
    // Simulate error event
    await page.evaluate(() => {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('mock-error', { 
          detail: { message: 'Unable to find valid activities for this destination' } 
        }));
      }, 2000);
    });
    
    // Verify error state is displayed
    await expect(page.locator('text=Generation Failed')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Try Again')).toBeVisible();
    await expect(page.locator('text=Go Home')).toBeVisible();
    
    // Test retry functionality
    await page.click('text=Try Again');
    await expect(page.locator('text=Creating Your Itinerary')).toBeVisible();
  });

  test('displays loading states appropriately', async ({ page }) => {
    await page.goto('/');
    
    // Fill and submit form
    await page.fill('[data-testid="destination-input"]', 'Tokyo, Japan');
    await page.click('[data-testid="persona-culture"]');
    await page.fill('[data-testid="start-date"]', '2024-07-01');
    await page.fill('[data-testid="end-date"]', '2024-07-03');
    await page.click('[data-testid="submit-requirements"]');
    
    // Verify loading indicators
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    await expect(page.locator('text=Initializing...')).toBeVisible();
    
    // Verify progress bar
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
    await expect(page.locator('text=Progress: 0%')).toBeVisible();
  });

  test('activity card expansion functionality', async ({ page }) => {
    // Navigate directly to a completed itinerary (mock data)
    await page.goto('/itinerary/mock-completed-itinerary');
    
    // Wait for itinerary to load
    await expect(page.locator('[data-testid="itinerary-title"]')).toBeVisible();
    
    // Find an activity card
    const activityCard = page.locator('[data-testid="activity-card"]').first();
    
    // Verify collapsed state
    await expect(activityCard.locator('text=Why This Matters')).not.toBeVisible();
    
    // Expand activity details
    await activityCard.locator('[aria-label="Expand details"]').click();
    
    // Verify expanded content
    await expect(activityCard.locator('text=Why This Matters')).toBeVisible();
    await expect(activityCard.locator('text=Location')).toBeVisible();
    await expect(activityCard.locator('text=Accessibility')).toBeVisible();
    
    // Check for booking information if available
    const bookingSection = activityCard.locator('text=Booking');
    if (await bookingSection.isVisible()) {
      await expect(activityCard.locator('text=Book now')).toBeVisible();
    }
  });

  test('day selection functionality for multi-day itineraries', async ({ page }) => {
    // Navigate to a multi-day itinerary
    await page.goto('/itinerary/mock-multi-day-itinerary');
    
    // Wait for itinerary to load
    await expect(page.locator('[data-testid="itinerary-title"]')).toBeVisible();
    
    // Verify day selector is present
    await expect(page.locator('[data-testid="day-selector"]')).toBeVisible();
    
    // Check day buttons
    await expect(page.locator('text=Day 1')).toBeVisible();
    await expect(page.locator('text=Day 2')).toBeVisible();
    
    // Click on Day 2
    await page.click('text=Day 2');
    
    // Verify activities change
    await expect(page.locator('[data-testid="activity-card"]')).toBeVisible();
    
    // Verify the selected day is highlighted
    await expect(page.locator('text=Day 2')).toHaveClass(/bg-blue-500|text-white/);
  });

  test('responsive design on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/itinerary/mock-completed-itinerary');
    
    // Verify mobile layout
    await expect(page.locator('[data-testid="itinerary-title"]')).toBeVisible();
    
    // Check that components stack properly on mobile
    const activityCard = page.locator('[data-testid="activity-card"]').first();
    await expect(activityCard).toBeVisible();
    
    // Verify touch-friendly button sizes
    const expandButton = activityCard.locator('[aria-label="Expand details"]');
    await expect(expandButton).toBeVisible();
    
    // Test touch interaction
    await expandButton.tap();
    await expect(activityCard.locator('text=Why This Matters')).toBeVisible();
  });
});