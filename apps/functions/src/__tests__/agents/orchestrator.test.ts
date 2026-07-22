import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AgentFn } from '@swift-travel/agents';

// ---------------------------------------------------------------------------
// Mocks — DB write only
// ---------------------------------------------------------------------------

const mockInsertBatch = vi.fn();

vi.mock('@swift-travel/database', async importOriginal => {
  const orig = await importOriginal<typeof import('@swift-travel/database')>();
  return {
    ...orig,
    researchEntries: { insertBatch: mockInsertBatch },
  };
});

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

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function fakeEntries(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    requestId: 'req-test',
    destination: 'San Francisco',
    interest: 'food' as const,
    name: `Venue ${i}`,
    entryType: 'restaurant',
    description: `Description ${i} for a restaurant in San Francisco`,
    whyRecommended: `Why this pick: great food culture and local atmosphere.`,
    estimatedCost: { min: 10, max: 30, currency: 'USD' },
    sources: [],
    validationStatus: 'unverified' as const,
    validationDetails: {},
    researchedAt: new Date().toISOString(),
    coordinates: null,
    googlePlaceId: null,
    address: null,
    hours: null,
  }));
}

function mockAgent(entries: number): AgentFn {
  return vi.fn().mockResolvedValue({ entries: fakeEntries(entries) });
}

function failingAgent(errorMsg: string): AgentFn {
  return vi.fn().mockRejectedValue(new Error(errorMsg));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Research orchestrator (E1-E3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsertBatch.mockImplementation(async (entries: unknown[]) =>
      entries.map((e, i) => ({ id: `row-${i}`, ...(e as object) }))
    );
  });

  it('fans out to all requested interests in parallel', async () => {
    const { orchestrateResearch } = await import('@swift-travel/agents');
    const result = await orchestrateResearch(
      {
        requestId: 'req-1',
        destination: 'San Francisco',
        interests: ['food'],
      },
      { agents: { food: mockAgent(8) } }
    );

    expect(result.agents).toHaveLength(1);
    expect(result.agents[0].interest).toBe('food');
    expect(result.agents[0].entries).toHaveLength(8);
  });

  it('batch-writes all entries to DB', async () => {
    const { orchestrateResearch } = await import('@swift-travel/agents');
    const result = await orchestrateResearch(
      {
        requestId: 'req-2',
        destination: 'San Francisco',
        interests: ['food'],
      },
      { agents: { food: mockAgent(8) } }
    );

    expect(mockInsertBatch).toHaveBeenCalledTimes(1);
    expect(mockInsertBatch.mock.calls[0][0]).toHaveLength(8);
    expect(result.entriesWritten).toBe(8);
    expect(result.totalEntries).toBe(8);
  });

  it('gracefully handles agent failure (E3)', async () => {
    const { orchestrateResearch } = await import('@swift-travel/agents');
    const result = await orchestrateResearch(
      {
        requestId: 'req-3',
        destination: 'San Francisco',
        interests: ['food'],
      },
      { agents: { food: failingAgent('Tavily timeout') } }
    );

    expect(result.agents[0].error).toContain('Tavily timeout');
    expect(result.agents[0].entries).toHaveLength(0);
    expect(result.totalEntries).toBe(0);
    expect(result.entriesWritten).toBe(0);
    expect(result.errors).toHaveLength(1);
  });

  it('returns 0 entries for interests with no agent yet', async () => {
    const { orchestrateResearch } = await import('@swift-travel/agents');
    const result = await orchestrateResearch({
      requestId: 'req-4',
      destination: 'San Francisco',
      interests: ['nightlife'],
    });

    expect(result.agents[0].entries).toHaveLength(0);
    expect(result.agents[0].error).toBeUndefined();
    expect(result.totalEntries).toBe(0);
  });

  it('returns results from multiple interests', async () => {
    const { orchestrateResearch } = await import('@swift-travel/agents');
    const result = await orchestrateResearch(
      {
        requestId: 'req-5',
        destination: 'San Francisco',
        interests: ['food', 'shopping'],
      },
      { agents: { food: mockAgent(8) } }
    );

    expect(result.agents).toHaveLength(2);
    expect(result.agents[0].entries).toHaveLength(8);
    expect(result.agents[1].entries).toHaveLength(0);
    expect(result.totalEntries).toBe(8);
  });
});
