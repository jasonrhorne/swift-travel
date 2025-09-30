"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const crypto_1 = require("crypto");
const pino_1 = __importDefault(require("pino"));
const zod_1 = require("zod");
const shared_1 = require("@swift-travel/shared");
const auth_response_1 = require("../shared/auth-response");
// Initialize logger
const logger = (0, pino_1.default)({
    name: 'magic-link-auth',
    level: 'info'
});
// Initialize Redis client
const redis = new ioredis_1.default(shared_1.authConfig.upstashRedisUrl);
// Request validation schema
const MagicLinkRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address')
});
// Rate limiting key generator
const getRateLimitKey = (email) => `rate_limit:magic_link:${email}`;
const getTokenKey = (token) => `magic_token:${token}`;
// Rate limiting check
async function checkRateLimit(email) {
    const key = getRateLimitKey(email);
    const current = await redis.get(key);
    const count = current ? parseInt(current) : 0;
    if (count >= shared_1.authConfig.rateLimitPerWindow) {
        return { allowed: false, remaining: 0 };
    }
    // Increment counter
    const newCount = count + 1;
    await redis.setex(key, shared_1.authConfig.rateLimitWindowMinutes * 60, newCount.toString());
    return {
        allowed: true,
        remaining: shared_1.authConfig.rateLimitPerWindow - newCount
    };
}
// Generate secure token
function generateMagicToken() {
    return (0, crypto_1.randomBytes)(32).toString('hex');
}
// Store token in Redis
async function storeToken(token, email) {
    const key = getTokenKey(token);
    const expirationSeconds = shared_1.authConfig.tokenExpirationMinutes * 60;
    await redis.setex(key, expirationSeconds, JSON.stringify({
        email,
        createdAt: new Date().toISOString()
    }));
    logger.info({ token: token.substring(0, 8) + '...', email }, 'Magic token stored');
}
// Send magic link email using email service
async function sendMagicLinkEmail(email, token) {
    const { emailService } = await Promise.resolve().then(() => __importStar(require('../shared/email-service')));
    const magicLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify?token=${token}`;
    const result = await emailService.sendMagicLinkEmail({
        email,
        magicLink,
        expirationMinutes: shared_1.authConfig.tokenExpirationMinutes
    });
    if (!result.success) {
        logger.error({
            email,
            error: result.error,
            token: token.substring(0, 8) + '...'
        }, 'Failed to send magic link email');
        throw new Error(`Failed to send email: ${result.error}`);
    }
    logger.info({
        email,
        provider: result.provider,
        messageId: result.messageId,
        token: token.substring(0, 8) + '...'
    }, 'Magic link email sent successfully');
}
const handler = async (event) => {
    const requestId = (0, crypto_1.randomBytes)(8).toString('hex');
    logger.info({ requestId, method: event.httpMethod, path: event.path }, 'Magic link request received');
    try {
        // Only allow POST requests
        if (event.httpMethod !== 'POST') {
            return (0, auth_response_1.createAuthErrorResponse)(405, 'Only POST requests are allowed', 'METHOD_NOT_ALLOWED');
        }
        // Parse and validate request body
        if (!event.body) {
            return (0, auth_response_1.createAuthErrorResponse)(400, 'Request body is required', 'MISSING_BODY');
        }
        const body = JSON.parse(event.body);
        const validation = MagicLinkRequestSchema.safeParse(body);
        if (!validation.success) {
            logger.warn({ requestId, errors: validation.error.errors }, 'Invalid request data');
            return (0, auth_response_1.createAuthErrorResponse)(400, validation.error.errors[0].message, 'INVALID_DATA');
        }
        const { email } = validation.data;
        logger.info({ requestId, email }, 'Processing magic link request');
        // Check rate limiting
        const rateLimit = await checkRateLimit(email);
        if (!rateLimit.allowed) {
            logger.warn({ requestId, email }, 'Rate limit exceeded');
            return (0, auth_response_1.createAuthResponse)(429, {
                error: 'RATE_LIMIT_EXCEEDED',
                message: `Rate limit exceeded. Please wait ${shared_1.authConfig.rateLimitWindowMinutes} minutes before requesting another magic link.`,
                timestamp: new Date().toISOString()
            }, {
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': (Date.now() + (shared_1.authConfig.rateLimitWindowMinutes * 60 * 1000)).toString()
            });
        }
        // Generate magic token
        const token = generateMagicToken();
        // Store token in Redis
        await storeToken(token, email);
        // Send magic link email
        await sendMagicLinkEmail(email, token);
        logger.info({
            requestId,
            email,
            remaining: rateLimit.remaining
        }, 'Magic link sent successfully');
        const response = {
            message: 'Magic link sent successfully. Please check your email.',
            success: true
        };
        return (0, auth_response_1.createAuthSuccessResponse)(response, 200, {
            'X-RateLimit-Remaining': rateLimit.remaining.toString()
        });
    }
    catch (error) {
        const err = error;
        logger.error({ requestId, error: err.message, stack: err.stack }, 'Magic link request failed');
        return (0, auth_response_1.createAuthErrorResponse)(500, 'An internal error occurred while processing your request', 'INTERNAL_ERROR', process.env.NODE_ENV === 'development' ? err.message : undefined);
    }
};
exports.handler = handler;
