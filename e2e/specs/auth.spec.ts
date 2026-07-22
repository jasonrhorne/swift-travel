import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage auth state to override dev mode's isAuthenticated: true
    await page.addInitScript(() => {
      localStorage.setItem(
        'swift-travel-auth',
        JSON.stringify({
          state: { user: null, isAuthenticated: false },
          version: 0,
        })
      );
    });
    await page.goto('/');
  });

  test('complete magic link authentication journey', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;

    await page.goto('/login');

    await expect(
      page.getByRole('heading', { name: /welcome to swift travel/i })
    ).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();

    await page.route('/.netlify/functions/auth/magic-link', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Magic link sent successfully. Please check your email.',
        }),
      });
    });

    await page.locator('input[type="email"]').fill(testEmail);
    await page.getByRole('button', { name: /send magic link/i }).click();

    await expect(
      page.getByRole('heading', { name: /check your email/i })
    ).toBeVisible();
    await expect(page.getByText(testEmail)).toBeVisible();
    await expect(
      page.getByText(/magic link will expire in 15 minutes/i)
    ).toBeVisible();

    const mockToken = 'mock-valid-token-for-testing';

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
                preferredActivities: [],
              },
              createdAt: new Date().toISOString(),
              lastActiveAt: new Date().toISOString(),
            },
            sessionToken: 'mock-session-token',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`/verify?token=${mockToken}`);

    await expect(
      page.getByRole('heading', { name: /welcome to swift travel!/i })
    ).toBeVisible();
    await expect(page.getByText(/successfully signed in/i)).toBeVisible();
  });

  test('handles invalid magic link token', async ({ page }) => {
    await page.route('/.netlify/functions/auth/verify', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Invalid token',
          message: 'The magic link token is invalid or has expired',
        }),
      });
    });

    await page.goto('/verify?token=invalid-token');

    await expect(
      page.getByRole('heading', { name: /verification failed/i })
    ).toBeVisible();
    await expect(page.getByText(/link has expired/i)).toBeVisible();
    await expect(
      page.getByRole('link', { name: /request new magic link/i })
    ).toBeVisible();

    await page.getByRole('link', { name: /request new magic link/i }).click();
    await expect(page).toHaveURL('/login');
  });

  test('handles missing token parameter', async ({ page }) => {
    await page.goto('/verify');

    await expect(
      page.getByRole('heading', { name: /invalid link/i })
    ).toBeVisible();
    await expect(page.getByText(/missing required information/i)).toBeVisible();
    await expect(
      page.getByRole('link', { name: /request new magic link/i })
    ).toBeVisible();
  });

  test('rate limiting on magic link requests', async ({ page }) => {
    const testEmail = 'ratelimit@example.com';

    await page.route('/.netlify/functions/auth/magic-link', async route => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        headers: {
          'X-RateLimit-Remaining': '0',
        },
        body: JSON.stringify({
          error: 'Too many requests',
          message:
            'Rate limit exceeded. Please wait 15 minutes before requesting another magic link.',
        }),
      });
    });

    await page.goto('/login');

    await page.locator('input[type="email"]').fill(testEmail);
    await page.getByRole('button', { name: /send magic link/i }).click();

    await expect(page.getByText(/something went wrong/i)).toBeVisible();
    await expect(page.getByText(/rate limit exceeded/i)).toBeVisible();
    await expect(page.getByText(/wait 15 minutes/i)).toBeVisible();
  });

  test('email validation on login form', async ({ page }) => {
    await page.goto('/login');

    await page.locator('input[type="email"]').fill('invalid-email');
    await page.getByRole('button', { name: /send magic link/i }).click();

    await expect(
      page.getByRole('button', { name: /send magic link/i })
    ).toBeVisible();

    await page.route('/.netlify/functions/auth/magic-link', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Magic link sent successfully. Please check your email.',
        }),
      });
    });

    await page.locator('input[type="email"]').fill('valid@example.com');
    await page.getByRole('button', { name: /send magic link/i }).click();

    await expect(
      page.getByRole('heading', { name: /check your email/i })
    ).toBeVisible();
  });
});
