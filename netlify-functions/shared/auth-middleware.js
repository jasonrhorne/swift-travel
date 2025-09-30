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
exports.validateSession = validateSession;
exports.createAuthErrorResponse = createAuthErrorResponse;
const jwt = __importStar(require("jsonwebtoken"));
const ioredis_1 = __importDefault(require("ioredis"));
const pino_1 = __importDefault(require("pino"));
const shared_1 = require("@swift-travel/shared");
// Initialize logger
const logger = (0, pino_1.default)({
    name: 'auth-middleware',
    level: 'info'
});
// Initialize Redis client
const redis = new ioredis_1.default(shared_1.authConfig.upstashRedisUrl);
// Revoked token key generator
const getRevokedTokenKey = (jti) => `revoked_token:${jti}`;
// Check if token is revoked
async function isTokenRevoked(jti) {
    try {
        const key = getRevokedTokenKey(jti);
        const result = await redis.get(key);
        return result === 'revoked';
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error({ jti, error: errorMessage }, 'Failed to check token revocation status');
        return false; // Fail open for availability
    }
}
// Extract token from request headers
function extractToken(event) {
    // Try Authorization header first
    const authHeader = event.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    // Fallback to cookie
    const cookie = event.headers?.cookie;
    if (cookie) {
        const cookies = cookie.split(';');
        const sessionCookie = cookies.find((c) => c.trim().startsWith('session='));
        if (sessionCookie) {
            return sessionCookie.split('=')[1];
        }
    }
    return null;
}
// Validate JWT session token
async function validateSession(event) {
    try {
        const token = extractToken(event);
        if (!token) {
            return {
                success: false,
                error: {
                    code: 'NO_TOKEN',
                    message: 'No authentication token provided',
                    statusCode: 401
                }
            };
        }
        // Verify JWT signature and expiration
        let payload;
        try {
            payload = jwt.verify(token, shared_1.authConfig.jwtSecret);
        }
        catch (error) {
            if (error instanceof Error && error.name === 'TokenExpiredError') {
                return {
                    success: false,
                    error: {
                        code: 'TOKEN_EXPIRED',
                        message: 'Session token has expired',
                        statusCode: 401
                    }
                };
            }
            else if (error instanceof Error && error.name === 'JsonWebTokenError') {
                return {
                    success: false,
                    error: {
                        code: 'INVALID_TOKEN',
                        message: 'Invalid session token',
                        statusCode: 401
                    }
                };
            }
            else {
                throw error;
            }
        }
        // Check if token is revoked
        const decoded = jwt.decode(token);
        const jti = decoded.jti || token.substring(0, 16);
        if (await isTokenRevoked(jti)) {
            return {
                success: false,
                error: {
                    code: 'TOKEN_REVOKED',
                    message: 'Session token has been revoked',
                    statusCode: 401
                }
            };
        }
        // Additional expiration check from payload
        if (payload.expiresAt && new Date() > new Date(payload.expiresAt)) {
            return {
                success: false,
                error: {
                    code: 'TOKEN_EXPIRED',
                    message: 'Session token has expired',
                    statusCode: 401
                }
            };
        }
        logger.info({
            userId: payload.userId,
            email: payload.email
        }, 'Session validated successfully');
        return {
            success: true,
            context: {
                user: {
                    userId: payload.userId,
                    email: payload.email
                },
                sessionToken: token
            }
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error({ error: errorMessage }, 'Session validation failed');
        return {
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Failed to validate session',
                statusCode: 500
            }
        };
    }
}
// Helper function to create standardized auth error responses
function createAuthErrorResponse(error) {
    return {
        statusCode: error?.statusCode || 500,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            error: error?.code || 'UNKNOWN_ERROR',
            message: error?.message || 'An unknown error occurred'
        })
    };
}
