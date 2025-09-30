"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const crypto_1 = require("crypto");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const pino_1 = __importDefault(require("pino"));
const shared_1 = require("@swift-travel/shared");
const auth_response_1 = require("../shared/auth-response");
// Initialize logger
const logger = (0, pino_1.default)({
    name: 'logout',
    level: 'info',
});
// Initialize Redis client
const redis = new ioredis_1.default(shared_1.authConfig.upstashRedisUrl);
// Revoked token key generator
const getRevokedTokenKey = (jti) => `revoked_token:${jti}`;
// Extract and validate session token
function extractSessionToken(event) {
    // Try to get token from Authorization header first
    let token = event.headers?.authorization?.replace('Bearer ', '');
    // Fallback to cookie
    if (!token && event.headers?.cookie) {
        const cookies = event.headers.cookie.split(';');
        const sessionCookie = cookies.find((c) => c.trim().startsWith('session='));
        if (sessionCookie) {
            token = sessionCookie.split('=')[1];
        }
    }
    if (!token) {
        return { valid: false };
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, shared_1.authConfig.jwtSecret);
        return { valid: true, token, payload };
    }
    catch (error) {
        return { valid: false };
    }
}
// Add token to revoked list
async function revokeToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.decode(token);
        const jti = decoded.jti || token.substring(0, 16); // Use jti if available, otherwise use token prefix
        const key = getRevokedTokenKey(jti);
        // Store revoked token with expiration matching the token's expiration
        const expiresAt = decoded.exp
            ? decoded.exp * 1000
            : Date.now() + shared_1.authConfig.sessionExpirationHours * 60 * 60 * 1000;
        const secondsUntilExpiry = Math.max(1, Math.floor((expiresAt - Date.now()) / 1000));
        await redis.setex(key, secondsUntilExpiry, 'revoked');
        logger.info({ jti, expiresIn: secondsUntilExpiry }, 'Token revoked');
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error({ error: errorMessage }, 'Failed to revoke token');
        throw error;
    }
}
const handler = async (event) => {
    const requestId = (0, crypto_1.randomBytes)(8).toString('hex');
    logger.info({ requestId, method: event.httpMethod, path: event.path }, 'Logout request received');
    try {
        // Only allow POST requests
        if (event.httpMethod !== 'POST') {
            return (0, auth_response_1.createAuthErrorResponse)(405, 'Method not allowed: Only POST requests are allowed');
        }
        // Extract and validate session token
        const tokenValidation = extractSessionToken(event);
        if (!tokenValidation.valid ||
            !tokenValidation.token ||
            !tokenValidation.payload) {
            logger.warn({ requestId }, 'No valid session token found');
            return (0, auth_response_1.createAuthErrorResponse)(401, 'No valid session token found');
        }
        const { token, payload } = tokenValidation;
        logger.info({
            requestId,
            userId: payload.userId,
            email: payload.email,
        }, 'Processing logout request');
        // Revoke the token
        await revokeToken(token);
        logger.info({
            requestId,
            userId: payload.userId,
            email: payload.email,
        }, 'Logout successful');
        return (0, auth_response_1.createAuthSuccessResponse)({
            message: 'Logged out successfully',
            success: true,
        }, 200, {
            'Set-Cookie': 'session=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/'
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        logger.error({ requestId, error: errorMessage, stack: errorStack }, 'Logout failed');
        return (0, auth_response_1.createAuthErrorResponse)(500, 'An internal error occurred during logout', 'INTERNAL_ERROR', process.env.NODE_ENV === 'development' ? { details: errorMessage } : undefined);
    }
};
exports.handler = handler;
