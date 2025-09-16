import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('complete magic link authentication journey', async ({ page, context }) => {
    const testEmail = `test-${Date.now()}@example.com`;
    
    // Navigate to login page
    await page.goto('/login');
    
    // Verify login page elements
    await expect(page.getByRole('heading', { name: /welcome to swift travel/i })).toBeVisible();
    await expect(page.getByLabelText(/email address/i)).toBeVisible();
    
    // Enter email and submit
    await page.getByLabelText(/email address/i).fill(testEmail);
    await page.getByRole('button', { name: /send magic link/i }).click();
    
    // Verify success state
    await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible();
    await expect(page.getByText(testEmail)).toBeVisible();
    await expect(page.getByText(/magic link will expire in 15 minutes/i)).toBeVisible();
    
    // In a real test, we would:
    // 1. Check the email service for the magic link
    // 2. Extract the token from the magic link
    // 3. Navigate to the verify page with the token
    // 4. Verify successful login
    
    // For this test, we'll simulate the magic link verification
    // In development, the magic link is logged to console, but for E2E tests
    // we need to mock or intercept the email service
    
    // Mock successful verification by navigating directly
    // In a real scenario, this would be extracted from email
    const mockToken = 'mock-valid-token-for-testing';
    
    // Intercept the verify API call and mock success
    await page.route('/.netlify/functions/auth/verify', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: {
              id: 'test-user-id',
              email: testEmail,
              name: null,
              preferences: {
                defaultPersona: null,
                budgetRange: 'mid-range',
                accessibilityNeeds: [],
                dietaryRestrictions: [],
                travelStyle: 'balanced',
                preferredActivities: []
              },
              createdAt: new Date().toISOString(),
              lastActiveAt: new Date().toISOString()
            },
            sessionToken: 'mock-session-token'
          })
        });
      } else {
        await route.continue();
      }
    });
    
    // Navigate to verify page with mock token
    await page.goto(`/auth/verify?token=${mockToken}`);
    
    // Verify success state
    await expect(page.getByRole('heading', { name: /welcome to swift travel/i })).toBeVisible();
    await expect(page.getByText(/successfully signed in/i)).toBeVisible();
    
    // Wait for automatic redirect or click manual link
    await page.waitForTimeout(1000); // Brief wait to see success state
    
    // Click dashboard link if auto-redirect doesn't happen
    const dashboardLink = page.getByRole('link', { name: /go to dashboard/i });
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
    }
    
    // Verify we're on dashboard (or at least redirected from verify)
    await expect(page).toHaveURL(/\/(dashboard|$)/);
  });

  test('handles invalid magic link token', async ({ page }) => {
    // Navigate directly to verify page with invalid token
    await page.goto('/auth/verify?token=invalid-token');
    
    // Mock failed verification
    await page.route('/.netlify/functions/auth/verify', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Invalid token',
          message: 'The magic link token is invalid or has expired'
        })
      });
    });
    
    // Wait for page to process the invalid token
    await page.waitForTimeout(1000);
    
    // Verify error state
    await expect(page.getByRole('heading', { name: /verification failed/i })).toBeVisible();
    await expect(page.getByText(/link has expired/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /request new magic link/i })).toBeVisible();
    
    // Test navigation back to login
    await page.getByRole('link', { name: /request new magic link/i }).click();
    await expect(page).toHaveURL('/login');
  });

  test('handles missing token parameter', async ({ page }) => {
    // Navigate to verify page without token
    await page.goto('/auth/verify');
    
    // Verify invalid link state
    await expect(page.getByRole('heading', { name: /invalid link/i })).toBeVisible();
    await expect(page.getByText(/missing required information/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /request new magic link/i })).toBeVisible();
  });

  test('rate limiting on magic link requests', async ({ page }) => {
    const testEmail = 'ratelimit@example.com';
    
    // Mock rate limit exceeded response
    await page.route('/.netlify/functions/auth/magic-link', async route => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        headers: {
          'X-RateLimit-Remaining': '0'
        },
        body: JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please wait 15 minutes before requesting another magic link.'
        })
      });
    });
    
    await page.goto('/login');
    
    // Try to send magic link
    await page.getByLabelText(/email address/i).fill(testEmail);
    await page.getByRole('button', { name: /send magic link/i }).click();
    
    // Verify rate limit error is displayed
    await expect(page.getByText(/something went wrong/i)).toBeVisible();
    await expect(page.getByText(/rate limit exceeded/i)).toBeVisible();
    await expect(page.getByText(/wait 15 minutes/i)).toBeVisible();
  });

  test('email validation on login form', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit with invalid email
    await page.getByLabelText(/email address/i).fill('invalid-email');
    await page.getByRole('button', { name: /send magic link/i }).click();
    
    // Browser should prevent submission due to HTML5 validation
    // The form should still be visible (not submitted)
    await expect(page.getByRole('button', { name: /send magic link/i })).toBeVisible();
    
    // Try with valid email format
    await page.getByLabelText(/email address/i).fill('valid@example.com');
    
    // Mock successful request
    await page.route('/.netlify/functions/auth/magic-link', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Magic link sent successfully. Please check your email.'
        })
      });
    });
    
    await page.getByRole('button', { name: /send magic link/i }).click();
    
    // Should proceed to success state
    await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible();
  });

  test('logout functionality', async ({ page }) => {
    // First, mock a logged-in state
    // In a real app, this would involve completing the login flow
    
    // Mock session check to return authenticated user
    await page.route('/.netlify/functions/auth/profile', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'test-user',
            email: 'test@example.com',
            name: 'Test User',
            preferences: {},
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString()
          },
          itineraries: []
        })
      });
    });
    
    // Mock successful logout
    await page.route('/.netlify/functions/auth/logout', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Logged out successfully'
        })
      });
    });
    
    // Navigate to a page that would have logout functionality
    // Since we don't have dashboard implemented yet, we'll test the logout button component
    await page.goto('/dashboard'); // This would redirect to login if not authenticated
    
    // For now, just verify the logout API endpoint works
    const response = await page.request.post('/.netlify/functions/auth/logout');
    expect(response.status()).toBe(200);
  });
});