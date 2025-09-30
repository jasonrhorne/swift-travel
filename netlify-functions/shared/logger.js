"use strict";
// Structured logging for agent functions
// Based on coding standards - Pino with structured JSON logging
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentLogger = exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const config_1 = require("@swift-travel/shared/config");
// Create logger instance with proper configuration
exports.logger = (0, pino_1.default)({
    name: 'swift-travel-agents',
    level: config_1.config.environment === 'development' ? 'debug' : 'info',
    formatters: {
        level: (label) => {
            return { level: label };
        },
    },
    timestamp: pino_1.default.stdTimeFunctions.isoTime,
    base: {
        environment: config_1.config.environment,
        service: 'agent-orchestration',
    },
});
// Convenience methods for agent logging
exports.agentLogger = {
    agentStart: (agent, requestId, data) => {
        exports.logger.info('Agent processing started', { agent, requestId, ...data });
    },
    agentComplete: (agent, requestId, duration, data) => {
        exports.logger.info('Agent processing completed', { agent, requestId, duration, ...data });
    },
    agentError: (agent, requestId, error, data) => {
        exports.logger.error('Agent processing failed', { agent, requestId, error: error.message, stack: error.stack, ...data });
    },
    orchestrationEvent: (event, requestId, data) => {
        exports.logger.info('Orchestration event', { event, requestId, ...data });
    },
    timeout: (requestId, elapsed, maxDuration) => {
        exports.logger.warn('Processing timeout', { requestId, elapsed, maxDuration, timeout: true });
    }
};
