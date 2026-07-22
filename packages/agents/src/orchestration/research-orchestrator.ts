import type {
  ResearchEntryInsert,
  ResearchInterest,
} from '@swift-travel/database';
import { researchEntries } from '@swift-travel/database';
import { researchFood } from '../research/food';
import type { FoodResearchOpts } from '../research/food';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ResearchRequest {
  requestId: string;
  destination: string;
  interests: ResearchInterest[];
}

export interface AgentResult {
  interest: ResearchInterest;
  entries: ResearchEntryInsert[];
  error?: string;
}

export interface OrchestratorResult {
  totalEntries: number;
  entriesWritten: number;
  agents: AgentResult[];
  errors: string[];
}

export type AgentFn = (
  opts: Omit<FoodResearchOpts, 'fetcher'> & { fetcher?: typeof fetch }
) => Promise<{ entries: ResearchEntryInsert[] }>;

export interface OrchestratorOptions {
  /** Override agent map (useful for testing). */
  agents?: Partial<Record<ResearchInterest, AgentFn>>;
}

// ---------------------------------------------------------------------------
// Default agent map
// ---------------------------------------------------------------------------

const DEFAULT_AGENTS: Partial<Record<ResearchInterest, AgentFn>> = {
  food: researchFood,
  // Other agents (arts-culture, nightlife, outdoors, shopping) — wired in
  // as they are built in future phases.
};

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

/**
 * Fan-out research agents in parallel, collect results, batch-write to DB.
 *
 * - Each interest gets its own agent run via Promise.allSettled
 * - Failed agents are logged but do not block other agents (E3)
 * - All successful entries are batch-written to research_entries (E2)
 */
export async function orchestrateResearch(
  request: ResearchRequest,
  options?: OrchestratorOptions
): Promise<OrchestratorResult> {
  const { requestId, destination, interests } = request;
  const agents = options?.agents ?? DEFAULT_AGENTS;

  // Fan-out: run all agents in parallel
  const settled = await Promise.allSettled(
    interests.map(interest =>
      runAgent(interest, { destination, requestId }, agents)
    )
  );

  // Fan-in: collect results and errors
  const agentResults: AgentResult[] = [];
  const errors: string[] = [];
  const allEntries: ResearchEntryInsert[] = [];

  for (let i = 0; i < interests.length; i++) {
    const interest = interests[i];
    const result = settled[i];

    if (result.status === 'fulfilled') {
      agentResults.push({ interest, entries: result.value.entries });
      allEntries.push(...result.value.entries);
    } else {
      const errorMsg =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);
      errors.push(`[${interest}] ${errorMsg}`);
      agentResults.push({ interest, entries: [], error: errorMsg });
    }
  }

  // Batch-write all entries to DB
  let entriesWritten = 0;
  if (allEntries.length > 0) {
    try {
      const written = await researchEntries.insertBatch(allEntries);
      entriesWritten = written.length;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`[db-write] ${msg}`);
    }
  }

  return {
    totalEntries: allEntries.length,
    entriesWritten,
    agents: agentResults,
    errors,
  };
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

async function runAgent(
  interest: ResearchInterest,
  opts: { destination: string; requestId: string },
  agents: Partial<Record<ResearchInterest, AgentFn>>
): Promise<{ entries: ResearchEntryInsert[] }> {
  const agentFn = agents[interest];
  if (!agentFn) return { entries: [] };
  return agentFn({ destination: opts.destination, requestId: opts.requestId });
}
