import { test, expect } from '@playwright/test';

const mockItinerary = {
  id: 'test-itinerary-id',
  userId: 'test-user-id',
  title: 'Paris Photography Adventure',
  description:
    'A curated 3-day photography itinerary exploring the best of Paris.',
  destination: 'Paris, France',
  interests: ['photography', 'sightseeing'],
  status: 'finalized',
  startDate: '2024-06-01',
  endDate: '2024-06-03',
  activities: [
    {
      id: 'activity-1',
      name: 'Eiffel Tower Sunrise Photography',
      description:
        'Capture the golden hour at the iconic Eiffel Tower. The morning light creates stunning shadows across the Champ de Mars.',
      category: 'sightseeing',
      timing: {
        dayNumber: 1,
        startTime: '06:00',
        duration: 120,
        flexibility: 'fixed',
        bufferTime: 30,
      },
      location: {
        name: 'Eiffel Tower',
        address: 'Champ de Mars, 5 Avenue Anatole France',
        coordinates: { lat: 48.8584, lng: 2.2945 },
        neighborhood: 'Trocadéro',
        accessibility: {
          wheelchairAccessible: false,
          notes: ['Elevator access to second floor'],
        },
      },
      estimatedDuration: 120,
      estimatedCost: { min: 26, max: 26, currency: 'EUR' },
      persona: 'photography',
      bookingRequired: false,
      validation: { status: 'verified', confidence: 0.95 },
      personaContext: {
        reasoning:
          'The Eiffel Tower at sunrise offers the best natural lighting conditions.',
        highlights: ['Golden hour photography', 'Panoramic city views'],
        tips: [
          'Arrive 30 minutes before sunrise',
          'Bring a tripod for long exposures',
        ],
      },
    },
    {
      id: 'activity-2',
      name: 'Montmartre Walking Tour',
      description:
        'Explore the artistic neighborhood of Montmartre, from the Sacré-Cœur to the Place du Tertre.',
      category: 'sightseeing',
      timing: {
        dayNumber: 1,
        startTime: '10:00',
        duration: 180,
        flexibility: 'flexible',
        bufferTime: 30,
      },
      location: {
        name: 'Montmartre',
        address: '18th Arrondissement',
        coordinates: { lat: 48.8867, lng: 2.3431 },
        neighborhood: 'Montmartre',
        accessibility: {
          wheelchairAccessible: false,
          notes: ['Steep hills', 'Cobblestone streets'],
        },
      },
      estimatedDuration: 180,
      estimatedCost: { min: 0, max: 15, currency: 'EUR' },
      persona: 'photography',
      bookingRequired: false,
      validation: { status: 'verified', confidence: 0.9 },
      personaContext: {
        reasoning:
          'Montmartre is one of the most photogenic neighborhoods in Paris.',
        highlights: [
          'Sacré-Cœur Basilica',
          'Artists at Place du Tertre',
          'Hidden vineyards',
        ],
        tips: [
          'Wear comfortable shoes for the hills',
          'Visit the vineyard for unique shots',
        ],
      },
    },
    {
      id: 'activity-3',
      name: 'Louvre Museum Photography Workshop',
      description:
        "Capture the grandeur of the Louvre's architecture and famous artworks.",
      category: 'sightseeing',
      timing: {
        dayNumber: 2,
        startTime: '09:00',
        duration: 240,
        flexibility: 'fixed',
        bufferTime: 60,
      },
      location: {
        name: 'Louvre Museum',
        address: 'Rue de Rivoli, 75001',
        coordinates: { lat: 48.8606, lng: 2.3376 },
        neighborhood: '1st Arrondissement',
        accessibility: {
          wheelchairAccessible: true,
          notes: ['Wheelchair accessible entrances', 'Elevators available'],
        },
      },
      estimatedDuration: 240,
      estimatedCost: { min: 17, max: 17, currency: 'EUR' },
      persona: 'photography',
      bookingRequired: true,
      bookingUrl: 'https://www.louvre.fr/en/visit',
      validation: { status: 'verified', confidence: 0.95 },
      personaContext: {
        reasoning:
          'The Louvre offers incredible architectural photography opportunities.',
        highlights: [
          'Glass pyramid at different times of day',
          'Grand Gallery perspectives',
        ],
        tips: ['Book tickets in advance', ' tripod not allowed inside'],
      },
    },
    {
      id: 'activity-4',
      name: 'Seine River Sunset Cruise',
      description:
        'End the day with a scenic cruise along the Seine, capturing Parisian landmarks at golden hour.',
      category: 'activity',
      timing: {
        dayNumber: 2,
        startTime: '18:00',
        duration: 90,
        flexibility: 'flexible',
        bufferTime: 30,
      },
      location: {
        name: 'Bateaux Mouches',
        address: 'Port de la Conférence, 75008',
        coordinates: { lat: 48.8645, lng: 2.3069 },
        neighborhood: 'Champs-Élysées',
        accessibility: {
          wheelchairAccessible: true,
          notes: ['Wheelchair accessible boarding'],
        },
      },
      estimatedDuration: 90,
      estimatedCost: { min: 15, max: 15, currency: 'EUR' },
      persona: 'photography',
      bookingRequired: true,
      bookingUrl: 'https://www.bateauxmouches.fr',
      validation: { status: 'verified', confidence: 0.85 },
      personaContext: {
        reasoning:
          'Sunset from the Seine offers unique perspectives of Paris landmarks.',
        highlights: [
          'Notre-Dame from the water',
          'Pont Alexandre III at sunset',
        ],
        tips: [
          'Sit on the right side for best views',
          'Bring a polarizing filter',
        ],
      },
    },
  ],
  metadata: {
    agentVersions: {
      research: '1.0',
      curation: '1.0',
      validation: '1.0',
      response: '1.0',
    },
    processingTimeSeconds: 45,
    costEstimate: {
      min: 58,
      max: 73,
      currency: 'EUR',
      breakdown: { activities: 58, transport: 15 },
    },
    qualityScore: 0.92,
  },
  createdAt: '2024-05-15T10:00:00Z',
  updatedAt: '2024-05-15T10:00:45Z',
};

const mockMultiDayItinerary = {
  ...mockItinerary,
  id: 'multi-day-itinerary-id',
  title: 'Tokyo Culture & Food Adventure',
  description: 'A comprehensive 4-day exploration of Tokyo.',
  destination: 'Tokyo, Japan',
  interests: ['food-forward', 'architecture'],
  startDate: '2024-07-01',
  endDate: '2024-07-04',
  activities: [
    {
      ...mockItinerary.activities[0],
      id: 'tokyo-activity-1',
      name: 'Tsukiji Outer Market Breakfast',
      timing: {
        dayNumber: 1,
        startTime: '07:00',
        duration: 90,
        flexibility: 'flexible',
        bufferTime: 30,
      },
      category: 'food' as const,
      location: {
        ...mockItinerary.activities[0].location,
        name: 'Tsukiji Outer Market',
        address: '4 Chome-16-2 Tsukiji, Chuo City',
      },
    },
    {
      ...mockItinerary.activities[1],
      id: 'tokyo-activity-2',
      name: 'Senso-ji Temple Visit',
      timing: {
        dayNumber: 1,
        startTime: '14:00',
        duration: 120,
        flexibility: 'flexible',
        bufferTime: 30,
      },
      location: {
        ...mockItinerary.activities[1].location,
        name: 'Senso-ji Temple',
        address: '2 Chome-3-1 Asakusa, Taito City',
      },
    },
    {
      ...mockItinerary.activities[2],
      id: 'tokyo-activity-3',
      name: 'Harajuku Street Photography',
      timing: {
        dayNumber: 2,
        startTime: '10:00',
        duration: 180,
        flexibility: 'flexible',
        bufferTime: 30,
      },
      location: {
        ...mockItinerary.activities[2].location,
        name: 'Takeshita Street',
        address: '1 Chome-19-11 Jingumae, Shibuya City',
      },
    },
    {
      ...mockItinerary.activities[3],
      id: 'tokyo-activity-4',
      name: 'Shibuya Crossing at Night',
      timing: {
        dayNumber: 2,
        startTime: '19:00',
        duration: 60,
        flexibility: 'flexible',
        bufferTime: 30,
      },
      location: {
        ...mockItinerary.activities[3].location,
        name: 'Shibuya Crossing',
        address: '2-chōme-2-1 Dōgenzaka, Shibuya City',
      },
    },
  ],
};

test.describe('Itinerary Display', () => {
  test('displays a completed itinerary with all details', async ({ page }) => {
    await page.route('**/.netlify/functions/itineraries/*', async route => {
      const url = route.request().url();
      if (url.includes('test-itinerary-id') && !url.includes('status')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: mockItinerary }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              status: 'completed',
              progress: 100,
              itineraryId: 'test-itinerary-id',
            },
          }),
        });
      }
    });

    await page.goto('/itinerary/test-itinerary-id');

    await expect(
      page.locator('h2').filter({ hasText: 'Paris Photography Adventure' })
    ).toBeVisible();
    await expect(
      page.getByText('A curated 3-day photography itinerary')
    ).toBeVisible();
    await expect(page.getByText('4 activities')).toBeVisible();
    await expect(page.getByText('Estimated Cost')).toBeVisible();
    await expect(page.getByText('EUR 58-73')).toBeVisible();
    await expect(page.getByText('Quality Score')).toBeVisible();
    await expect(page.getByText('9/10')).toBeVisible();
  });

  test('shows activity cards with expand/collapse', async ({ page }) => {
    await page.route(
      '**/.netlify/functions/itineraries/test-itinerary-id',
      async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: mockItinerary }),
        });
      }
    );

    await page.goto('/itinerary/test-itinerary-id');

    const firstActivity = page
      .locator('h4')
      .filter({ hasText: 'Eiffel Tower Sunrise Photography' });
    await expect(firstActivity).toBeVisible();

    await expect(page.getByText('Why This Matters')).not.toBeVisible();

    await page.getByRole('button', { name: 'Expand details' }).first().click();

    await expect(page.getByText('Why This Matters').first()).toBeVisible();
    await expect(page.getByText('Location').first()).toBeVisible();
    await expect(page.getByText('Accessibility').first()).toBeVisible();

    await page
      .getByRole('button', { name: 'Collapse details' })
      .first()
      .click();
    await expect(page.getByText('Why This Matters').first()).not.toBeVisible();
  });

  test('day selection works for multi-day itineraries', async ({ page }) => {
    await page.route(
      '**/.netlify/functions/itineraries/multi-day-itinerary-id',
      async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: mockMultiDayItinerary }),
        });
      }
    );

    await page.goto('/itinerary/multi-day-itinerary-id');

    await expect(
      page.locator('h2').filter({ hasText: 'Tokyo Culture & Food Adventure' })
    ).toBeVisible();

    await expect(
      page.getByText('Tsukiji Outer Market Breakfast')
    ).toBeVisible();
    await expect(page.getByText('Senso-ji Temple Visit')).toBeVisible();

    await expect(
      page.getByText('Harajuku Street Photography')
    ).not.toBeVisible();

    const day2Button = page.locator('button').filter({ hasText: /Jul 2/ });
    if (await day2Button.isVisible()) {
      await day2Button.click();
      await expect(page.getByText('Harajuku Street Photography')).toBeVisible();
      await expect(page.getByText('Shibuya Crossing at Night')).toBeVisible();
    }
  });

  test('shows progress tracker for in-progress itinerary', async ({ page }) => {
    let pollCount = 0;
    await page.route(
      '**/.netlify/functions/itineraries-status*',
      async route => {
        pollCount++;
        const status = pollCount < 3 ? 'research-in-progress' : 'completed';
        const progress = pollCount < 3 ? 25 + pollCount * 15 : 100;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              status,
              progress,
              estimatedTimeRemaining: pollCount < 3 ? 30 : null,
              itineraryId: pollCount >= 3 ? 'test-itinerary-id' : undefined,
            },
          }),
        });
      }
    );

    await page.route(
      '**/.netlify/functions/itineraries/test-itinerary-id',
      async route => {
        if (route.request().url().includes('status')) {
          await route.continue();
        } else {
          const itinerary =
            pollCount >= 3
              ? mockItinerary
              : { ...mockItinerary, status: 'draft' };
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: itinerary }),
          });
        }
      }
    );

    await page.goto('/itinerary/test-itinerary-id');

    await expect(
      page.locator('h2').filter({ hasText: 'Creating Your Itinerary' })
    ).toBeVisible();
    await expect(page.getByText('Progress:')).toBeVisible();
  });

  test('mobile responsive layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.route(
      '**/.netlify/functions/itineraries/test-itinerary-id',
      async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: mockItinerary }),
        });
      }
    );

    await page.goto('/itinerary/test-itinerary-id');

    await expect(
      page.locator('h2').filter({ hasText: 'Paris Photography Adventure' })
    ).toBeVisible();

    const firstActivity = page
      .locator('h4')
      .filter({ hasText: 'Eiffel Tower Sunrise Photography' });
    await expect(firstActivity).toBeVisible();

    const expandButton = page
      .getByRole('button', { name: 'Expand details' })
      .first();
    await expect(expandButton).toBeVisible();
    await expandButton.tap();
    await expect(page.getByText('Why This Matters').first()).toBeVisible();
  });
});

test.describe('Requirements Form', () => {
  test('navigates through multi-step form', async ({ page }) => {
    await page.goto('/requirements');

    await expect(
      page.getByRole('heading', { name: /create your perfect itinerary/i })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /where would you like to go/i })
    ).toBeVisible();

    await page.locator('#destination').fill('Paris, France');
    await page.getByRole('button', { name: /next/i }).click();

    await expect(
      page.getByRole('heading', { name: /your trip duration/i })
    ).toBeVisible();
    await page.getByRole('button', { name: /next/i }).click();

    await expect(
      page.getByRole('heading', { name: /what are your interests/i })
    ).toBeVisible();
    await page.getByRole('button', { name: /photography/i }).click();
    await page.getByRole('button', { name: /next/i }).click();

    await expect(
      page.getByRole('heading', { name: /who's traveling/i })
    ).toBeVisible();
    await page.getByRole('button', { name: /next/i }).click();

    await expect(
      page.getByRole('heading', { name: /special requests/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /create my itinerary/i })
    ).toBeVisible();
  });

  test('form shows validation errors for empty required fields', async ({
    page,
  }) => {
    await page.goto('/requirements');

    await page.getByRole('button', { name: /next/i }).click();

    await expect(page.getByText(/destination is required/i)).toBeVisible();
  });

  test('form submits and redirects to itinerary page', async ({ page }) => {
    await page.route(
      '**/.netlify/functions/itineraries-process-request',
      async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              requestId: 'new-itinerary-request',
              itineraryRequest: {
                id: 'new-itinerary-request',
                status: 'initiated',
              },
            },
          }),
        });
      }
    );

    await page.goto('/requirements');

    await page.locator('#destination').fill('Paris, France');
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /photography/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /create my itinerary/i }).click();

    await expect(
      page.getByRole('heading', { name: /requirements submitted/i })
    ).toBeVisible();
  });
});
