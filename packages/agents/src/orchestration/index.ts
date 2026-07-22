// Research orchestrator — fan-out / fan-in for parallel agent runs
export const ORCHESTRATION_AGENT_VERSION = '0.1.0';
export { orchestrateResearch } from './research-orchestrator';
export type {
  ResearchRequest,
  AgentResult,
  AgentFn,
  OrchestratorResult,
} from './research-orchestrator';
