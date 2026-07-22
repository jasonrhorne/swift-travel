// Main export file for agents package
export const AGENT_VERSION = '0.1.0';

// Tavily web search client (reusable across all research agents)
export { TavilyClient, getTavilyClient } from './tavily';
export type {
  TavilySearchResult,
  TavilySearchResponse,
  TavilySearchParams,
} from './tavily';

// Placeholder exports for agent modules
export * from './research';
export * from './curation';
export * from './validation';
export * from './response';
export * from './orchestration';
