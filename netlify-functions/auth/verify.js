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
const supabase_js_1 = require("@supabase/supabase-js");
const ioredis_1 = __importDefault(require("ioredis"));
const crypto_1 = require("crypto");
const jwt = __importStar(require("jsonwebtoken"));
const pino_1 = __importDefault(require("pino"));
const zod_1 = require("zod");
const shared_1 = require("@swift-travel/shared");
const auth_response_1 = require("../shared/auth-response");
// Initialize logger
const logger = (0, pino_1.default)({
    name: 'verify-token',
    level: 'info'
});
// Initialize clients
const supabase = (0, supabase_js_1.createClient)(shared_1.authConfig.supabaseUrl, shared_1.authConfig.supabaseServiceRoleKey);
const redis = new ioredis_1.default(shared_1.authConfig.upstashRedisUrl);
// Request validation schema
const VerifyTokenRequestSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Token is required')
});
// Token key generator
const getTokenKey = (token) => `magic_token:${token}`;
// Retrieve and validate token from Redis
async function validateMagicToken(token) {
    const key = getTokenKey(token);
    const tokenData = await redis.get(key);
    if (!tokenData) {
        return { valid: false };
    }
    try {
        const parsed = JSON.parse(tokenData);
        return { valid: true, email: parsed.email };
    }
    catch (error) {
        logger.error({ token: token.substring(0, 8) + '...', error }, 'Failed to parse token data');
        return { valid: false };
    }
}
// Delete token from Redis (single use)
async function consumeToken(token) {
    const key = getTokenKey(token);
    await redis.del(key);
    logger.info({ token: token.substring(0, 8) + '...' }, 'Magic token consumed');
}
// Create or update user in database
async function createOrUpdateUser(email) {
    logger.info({ email }, 'Creating or updating user');
    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
    if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(`Failed to fetch user: ${fetchError.message}`);
    }
    if (existingUser) {
        // Update last active time
        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({ last_active_at: new Date().toISOString() })
            .eq('id', existingUser.id)
            .select()
            .single();
        if (updateError) {
            throw new Error(`Failed to update user: ${updateError.message}`);
        }
        logger.info({ userId: updatedUser.id, email }, 'User updated');
        return {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            preferences: updatedUser.preferences || {
                defaultPersona: null,
                budgetRange: 'mid-range',
                accessibilityNeeds: [],
                dietaryRestrictions: [],
                travelStyle: 'balanced',
                preferredActivities: []
            },
            createdAt: new Date(updatedUser.created_at),
            lastActiveAt: new Date(updatedUser.last_active_at)
        };
    }
    else {
        // Create new user
        const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
            email,
            name: null,
            preferences: {
                defaultPersona: null,
                budgetRange: 'mid-range',
                accessibilityNeeds: [],
                dietaryRestrictions: [],
                travelStyle: 'balanced',
                preferredActivities: []
            },
            created_at: new Date().toISOString(),
            last_active_at: new Date().toISOString()
        })
            .select()
            .single();
        if (createError) {
            throw new Error(`Failed to create user: ${createError.message}`);
        }
        logger.info({ userId: newUser.id, email }, 'New user created');
        return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            preferences: newUser.preferences,
            createdAt: new Date(newUser.created_at),
            lastActiveAt: new Date(newUser.last_active_at)
        };
    }
}
// Generate JWT session token
function generateSessionToken(user) {
    const payload = {
        userId: user.id,
        email: user.email,
        expiresAt: new Date(Date.now() + shared_1.authConfig.sessionExpirationHours * 60 * 60 * 1000)
    };
    return jwt.sign(payload, shared_1.authConfig.jwtSecret, {
        expiresIn: `${shared_1.authConfig.sessionExpirationHours}h`
    });
}
const handler = async (event) => {
    const requestId = (0, crypto_1.randomBytes)(8).toString('hex');
    logger.info({ requestId, method: event.httpMethod, path: event.path }, 'Token verification request received');
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
        const validation = VerifyTokenRequestSchema.safeParse(body);
        if (!validation.success) {
            logger.warn({ requestId, errors: validation.error.errors }, 'Invalid request data');
            return (0, auth_response_1.createAuthErrorResponse)(400, validation.error.errors[0].message, 'INVALID_DATA');
        }
        const { token } = validation.data;
        logger.info({ requestId, token: token.substring(0, 8) + '...' }, 'Processing token verification');
        // Validate magic token
        const tokenValidation = await validateMagicToken(token);
        if (!tokenValidation.valid || !tokenValidation.email) {
            logger.warn({ requestId, token: token.substring(0, 8) + '...' }, 'Invalid or expired token');
            return (0, auth_response_1.createAuthErrorResponse)(401, 'The magic link token is invalid or has expired', 'INVALID_TOKEN');
        }
        // Consume the token (single use)
        await consumeToken(token);
        // Create or update user
        const user = await createOrUpdateUser(tokenValidation.email);
        // Generate session token
        const sessionToken = generateSessionToken(user);
        logger.info({
            requestId,
            userId: user.id,
            email: user.email
        }, 'Token verification successful');
        const response = {
            user,
            sessionToken,
            success: true
        };
        return (0, auth_response_1.createAuthSuccessResponse)(response, 200, {
            'Set-Cookie': `session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=${shared_1.authConfig.sessionExpirationHours * 3600}; Path=/`
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        logger.error({ requestId, error: errorMessage, stack: errorStack }, 'Token verification failed');
        return (0, auth_response_1.createAuthErrorResponse)(500, 'An internal error occurred while verifying your token', 'INTERNAL_ERROR', process.env.NODE_ENV === 'development' ? errorMessage : undefined);
    }
};
exports.handler = handler;
