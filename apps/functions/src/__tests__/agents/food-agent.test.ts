import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const FAKE_TAVILY_RESPONSE = {
  results: [
    {
      title: 'Eater SF Best New Restaurants',
      url: 'https://www.eater.com/sf',
      content: 'Great ramen spots in the Mission.',
      score: 0.9,
    },
    {
      title: 'Reddit r/sanfrancisco food thread',
      url: 'https://reddit.com/r/sanfrancisco/food',
      content: 'Tartine is a must-visit bakery.',
      score: 0.85,
    },
    {
      title: 'Infatuation SF Guide',
      url: 'https://www.infatuation.com/sf',
      content: 'Kokkari Estiatorio is top Greek dining.',
      score: 0.8,
    },
  ],
};

function buildFakeLLMResponse(count: number) {
  const entries = Array.from({ length: count }, (_, i) => ({
    name: `Test Venue ${i + 1}`,
    entryType: i % 2 === 0 ? 'restaurant' : 'bakery',
    description: `A wonderful ${i % 2 === 0 ? 'restaurant' : 'bakery'} in San Francisco offering unique dining experiences.`,
    whyRecommended: `This pick matters because it represents the authentic local food culture of San Francisco with exceptional quality.`,
    estimatedCost: { min: 15 + i * 5, max: 40 + i * 10, currency: 'USD' },
    address: `${100 + i} Market St, San Francisco, CA`,
    hours: { monday: '11am-9pm', tuesday: '11am-9pm' },
    sources: [
      {
        title: 'Eater SF',
        url: 'https://www.eater.com/sf',
        snippet: 'Top pick',
      },
    ],
  }));
  return { entries };
}

// ---------------------------------------------------------------------------
// Mocks — openai + fetch for Tavily
// ---------------------------------------------------------------------------

const mockOpenaiCreate = vi.fn();
const mockFetch = vi.fn();

vi.mock('@swift-travel/shared', async importOriginal => {
  const orig = await importOriginal<typeof import('@swift-travel/shared')>();
  return {
    ...orig,
    config: {
      ...orig.config,
      api: {
        ...orig.config.api,
        tavilyApiKey: 'test-tavily',
        openaiApiKey: 'test-openai',
      },
    },
  };
});

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: { completions: { create: mockOpenaiCreate } },
  })),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Food & Dining research agent (D1-D3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock fetch to return Tavily response for any POST to tavily.com
    mockFetch.mockImplementation(async (url: string) => {
      if (typeof url === 'string' && url.includes('tavily.com')) {
        return new Response(JSON.stringify(FAKE_TAVILY_RESPONSE), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response('Not Found', { status: 404 });
    });

    // Mock OpenAI to return structured entries
    mockOpenaiCreate.mockResolvedValue({
      choices: [
        { message: { content: JSON.stringify(buildFakeLLMResponse(8)) } },
      ],
    });
  });

  it('returns 8-12 entries for a valid destination', async () => {
    const { researchFood } = await import('@swift-travel/agents');
    const result = await researchFood({
      destination: 'San Francisco',
      requestId: null,
      fetcher: mockFetch,
    });

    expect(result.entries).toHaveLength(8);
    expect(result.entries.length).toBeGreaterThanOrEqual(8);
    expect(result.entries.length).toBeLessThanOrEqual(12);
  });

  it('each entry includes "why this pick" reasoning (D2)', async () => {
    const { researchFood } = await import('@swift-travel/agents');
    const result = await researchFood({
      destination: 'San Francisco',
      requestId: null,
      fetcher: mockFetch,
    });

    for (const entry of result.entries) {
      expect(entry.whyRecommended).toBeTruthy();
      expect(entry.whyRecommended.length).toBeGreaterThan(10);
    }
  });

  it('each entry validates against the insert schema (D3)', async () => {
    const { researchFood } = await import('@swift-travel/agents');
    const result = await researchFood({
      destination: 'San Francisco',
      requestId: null,
      fetcher: mockFetch,
    });

    const { ResearchEntryInsertSchema } = await import(
      '@swift-travel/database'
    );
    for (const entry of result.entries) {
      const parsed = ResearchEntryInsertSchema.safeParse(entry);
      expect(parsed.success).toBe(true);
    }
  });

  it('entries have interest set to "food"', async () => {
    const { researchFood } = await import('@swift-travel/agents');
    const result = await researchFood({
      destination: 'San Francisco',
      requestId: null,
      fetcher: mockFetch,
    });

    for (const entry of result.entries) {
      expect(entry.interest).toBe('food');
    }
  });

  it('includes raw Tavily search results', async () => {
    const { researchFood } = await import('@swift-travel/agents');
    const result = await researchFood({
      destination: 'San Francisco',
      requestId: null,
      fetcher: mockFetch,
    });

    expect(result.rawResults).toHaveLength(3);
    expect(result.rawResults[0].title).toBe('Eater SF Best New Restaurants');
  });

  it('passes destination-specific queries to Tavily', async () => {
    const { researchFood } = await import('@swift-travel/agents');
    await researchFood({
      destination: 'Austin',
      requestId: '00000000-0000-0000-0000-000000000001',
      fetcher: mockFetch,
    });

    // Verify fetch was called multiple times (parallel queries)
    expect(mockFetch).toHaveBeenCalled();
    // Verify at least one call contains the destination
    const allBodies = mockFetch.mock.calls
      .filter(
        (call: unknown[]) =>
          typeof call[0] === 'string' && call[0].includes('tavily')
      )
      .map((call: unknown[]) => {
        const init = call[1] as RequestInit;
        return init.body as string;
      });
    expect(allBodies.some((b: string) => b.includes('Austin'))).toBe(true);
  });

  it('throws if LLM returns invalid JSON shape', async () => {
    mockOpenaiCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ wrong: 'shape' }) } }],
    });

    const { researchFood } = await import('@swift-travel/agents');
    await expect(
      researchFood({
        destination: 'San Francisco',
        requestId: null,
        fetcher: mockFetch,
      })
    ).rejects.toThrow('schema validation');
  });
});
