import { config } from '@swift-travel/shared';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  publishedDate?: string;
}

export interface TavilySearchResponse {
  results: TavilySearchResult[];
  answer?: string;
}

export interface TavilySearchParams {
  query: string;
  searchDepth?: 'basic' | 'advanced';
  maxResults?: number;
  includeAnswer?: boolean;
  includeDomains?: string[];
  excludeDomains?: string[];
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

const TAVILY_API_URL = 'https://api.tavily.com/search';
const DEFAULT_MAX_RESULTS = 10;
const DEFAULT_SEARCH_DEPTH: 'basic' | 'advanced' = 'advanced';

export class TavilyClient {
  private apiKey: string;
  private fetcher: typeof fetch;

  constructor(opts?: { apiKey?: string; fetcher?: typeof fetch }) {
    this.apiKey = opts?.apiKey ?? config.api.tavilyApiKey;
    this.fetcher = opts?.fetcher ?? fetch;
  }

  async search(params: TavilySearchParams): Promise<TavilySearchResponse> {
    const {
      query,
      searchDepth = DEFAULT_SEARCH_DEPTH,
      maxResults = DEFAULT_MAX_RESULTS,
      includeAnswer = false,
      includeDomains,
      excludeDomains,
    } = params;

    const body: Record<string, unknown> = {
      api_key: this.apiKey,
      query,
      search_depth: searchDepth,
      max_results: maxResults,
      include_answer: includeAnswer,
    };
    if (includeDomains?.length) body.include_domains = includeDomains;
    if (excludeDomains?.length) body.exclude_domains = excludeDomains;

    const response = await this.fetcher(TAVILY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(
        `Tavily search failed (${response.status}): ${text || response.statusText}`
      );
    }

    const data = (await response.json()) as {
      results?: TavilySearchResult[];
      answer?: string;
    };

    return {
      results: (data.results ?? []).filter(
        r => r.url && r.content && r.score >= 0.3
      ),
      answer: data.answer,
    };
  }

  /**
   * Convenience: run a single query and return only the filtered results.
   */
  async searchQuery(
    query: string,
    opts?: Omit<TavilySearchParams, 'query'>
  ): Promise<TavilySearchResult[]> {
    const { results } = await this.search({ query, ...opts });
    return results;
  }

  /**
   * Run multiple queries in parallel and deduplicate results by URL.
   * Returns results sorted by score descending.
   */
  async searchMany(
    queries: Array<{ label: string; query: string }>,
    opts?: Omit<TavilySearchParams, 'query'>
  ): Promise<TavilySearchResult[]> {
    const batches = await Promise.allSettled(
      queries.map(q => this.search({ query: q.query, ...opts }))
    );

    const seen = new Map<string, TavilySearchResult>();

    for (const batch of batches) {
      if (batch.status !== 'fulfilled') continue;
      for (const result of batch.value.results) {
        const existing = seen.get(result.url);
        if (!existing || result.score > existing.score) {
          seen.set(result.url, result);
        }
      }
    }

    return Array.from(seen.values()).sort((a, b) => b.score - a.score);
  }
}

/** Shared singleton – callers can also create their own instance for DI. */
let _default: TavilyClient | null = null;

export function getTavilyClient(): TavilyClient {
  if (!_default) _default = new TavilyClient();
  return _default;
}
