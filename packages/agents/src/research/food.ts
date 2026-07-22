import OpenAI from 'openai';
import { z } from 'zod';
import { config } from '@swift-travel/shared';
import { SOURCING_GUIDANCE } from '@swift-travel/shared';
import { TavilyClient, type TavilySearchResult } from '../tavily';
import {
  ResearchEntryInsertSchema,
  type ResearchEntryInsert,
} from '@swift-travel/database';

// ---------------------------------------------------------------------------
// Zod schema for what we ask the LLM to produce (D3: validates before DB write)
// ---------------------------------------------------------------------------

const LLMEntrySchema = z.object({
  name: z.string().min(1),
  entryType: z.string().min(1), // e.g. "restaurant", "food-hall", "bakery"
  description: z.string().min(10),
  whyRecommended: z.string().min(10), // D2: "why this pick" reasoning
  estimatedCost: z
    .object({
      min: z.number().min(0),
      max: z.number().min(0),
      currency: z.string(),
    })
    .nullable(),
  address: z.string().nullable(),
  hours: z.record(z.string()).nullable(),
  sources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string(),
        snippet: z.string().optional(),
      })
    )
    .default([]),
});

const LLMOutputSchema = z.object({
  entries: z.array(LLMEntrySchema).min(1),
});

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface FoodResearchResult {
  entries: ResearchEntryInsert[];
  rawResults: TavilySearchResult[];
}

export interface FoodResearchOpts {
  destination: string;
  requestId: string | null;
  fetcher?: typeof fetch;
}

// ---------------------------------------------------------------------------
// Public function
// ---------------------------------------------------------------------------

/**
 * Research food & dining venues for a destination.
 *
 * Pipeline: Tavily search → OpenAI synthesis → Zod validation → structured entries
 */
export async function researchFood(
  opts: FoodResearchOpts
): Promise<FoodResearchResult> {
  const { destination, requestId } = opts;
  const guidance = SOURCING_GUIDANCE.food;

  // 1. Web search (Tavily)
  const tavily = new TavilyClient({
    apiKey: config.api.tavilyApiKey,
    fetcher: opts.fetcher,
  });
  const queries = guidance.queries.map(q => ({
    label: q.label,
    query: q.query.replace(/\{city\}/g, destination),
  }));
  const rawResults = await tavily.searchMany(queries, {
    searchDepth: 'advanced',
    maxResults: guidance.maxResults,
    includeDomains: guidance.trustedDomains,
    excludeDomains: guidance.excludeDomains,
  });

  // 2. LLM synthesis → structured entries
  const openai = new OpenAI({ apiKey: config.api.openaiApiKey });
  const llmEntries = await synthesizeEntries(destination, rawResults, openai);

  // 3. Map into ResearchEntryInsert shape (D3: validate insert shape)
  const entries: ResearchEntryInsert[] = llmEntries.map(e => {
    const insert: ResearchEntryInsert = {
      requestId,
      destination,
      interest: 'food',
      name: e.name,
      entryType: e.entryType,
      description: e.description,
      whyRecommended: e.whyRecommended,
      estimatedCost: e.estimatedCost,
      sources: e.sources,
      address: e.address ?? null,
      hours: e.hours ?? null,
      coordinates: null,
      googlePlaceId: null,
      validationStatus: 'unverified',
      validationDetails: {},
      researchedAt: new Date().toISOString(),
    };

    // Final shape validation before returning
    ResearchEntryInsertSchema.parse(insert);
    return insert;
  });

  return { entries, rawResults };
}

// ---------------------------------------------------------------------------
// LLM synthesis
// ---------------------------------------------------------------------------

async function synthesizeEntries(
  destination: string,
  webResults: TavilySearchResult[],
  openai: OpenAI
): Promise<z.infer<typeof LLMEntrySchema>[]> {
  const webContext = webResults
    .map((r, i) => `[${i + 1}] ${r.title}\n    ${r.url}\n    ${r.content}`)
    .join('\n\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3,
    max_tokens: 3000,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a local-food expert and travel concierge. Your job is to recommend genuinely interesting, culturally-aware food & dining venues — NOT the generic top-10 lists tourists find on TripAdvisor.

RULES:
- Prioritise local favourites, hidden gems, and places with character
- Each recommendation MUST include "whyRecommended": a 1-2 sentence explanation of WHY this pick suits a traveller interested in food culture, tying it to what makes the place special
- Use the provided web search results as your primary source of truth — reference specific venues and details from them
- Only recommend places you are confident actually exist based on the search results
- Output 8-12 entries total
- "entryType" should be one of: restaurant, cafe, bakery, food-hall, bar, brewery, market, food-truck, pop-up
- "estimatedCost" uses USD; use null if unknown
- "hours" is an object with day keys (monday-sunday) and "note" for special info; use null if unknown
- "sources" should reference the web search results you drew from (title + url)
- Do NOT fabricate URLs — only use URLs from the provided search results

Return valid JSON matching the schema.`,
      },
      {
        role: 'user',
        content: `Destination: ${destination}
Interest: Food & Dining

--- WEB SEARCH RESULTS ---
${webContext || '(No web results available — use your knowledge)'}
--- END ---

Return a JSON object with key "entries" containing an array of 8-12 venue recommendations.`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw)
    throw new Error('OpenAI returned empty response for food synthesis');

  const parsed = JSON.parse(raw);
  const validated = LLMOutputSchema.safeParse(parsed);

  if (!validated.success) {
    throw new Error(
      `LLM output failed schema validation: ${validated.error.issues.map(i => i.message).join('; ')}`
    );
  }

  return validated.data.entries;
}
