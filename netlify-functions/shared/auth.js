"use strict";
// Internal authentication utilities for agent communication
// Based on coding standards - X-Internal-Token header security
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateInternalAuth = validateInternalAuth;
exports.requireInternalAuth = requireInternalAuth;
const config_1 = require("@swift-travel/shared/config");
/**
 * Validates internal API authentication for agent-to-agent communication
 */
function validateInternalAuth(headers) {
    const internalToken = headers['x-internal-token'] || headers['X-Internal-Token'];
    if (!internalToken) {
        return {
            valid: false,
            error: 'Missing X-Internal-Token header'
        };
    }
    if (internalToken !== config_1.config.api.internalApiKey) {
        return {
            valid: false,
            error: 'Invalid internal token'
        };
    }
    return { valid: true };
}
/**
 * Middleware for Netlify Functions to validate internal authentication
 */
function requireInternalAuth(event) {
    const validation = validateInternalAuth(event.headers || {});
    if (!validation.valid) {
        throw new Error(validation.error || 'Authentication failed');
    }
    return true;
}
