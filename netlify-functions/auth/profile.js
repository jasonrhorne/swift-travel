"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const crypto_1 = require("crypto");
const pino_1 = __importDefault(require("pino"));
const zod_1 = require("zod");
const shared_1 = require("@swift-travel/shared");
const auth_middleware_1 = require("../shared/auth-middleware");
const auth_response_1 = require("../shared/auth-response");
// Initialize logger
const logger = (0, pino_1.default)({
    name: 'profile-management',
    level: 'info',
});
// Initialize Supabase client
const supabase = (0, supabase_js_1.createClient)(shared_1.authConfig.supabaseUrl, shared_1.authConfig.supabaseServiceRoleKey);
// Update profile request schema
const UpdateProfileRequestSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    preferences: zod_1.z
        .object({
        defaultPersona: zod_1.z
            .enum(['photography', 'food-forward', 'architecture', 'family'])
            .nullable()
            .optional(),
        budgetRange: zod_1.z
            .enum(['budget', 'mid-range', 'luxury', 'no-limit'])
            .optional(),
        accessibilityNeeds: zod_1.z.array(zod_1.z.string()).optional(),
        dietaryRestrictions: zod_1.z.array(zod_1.z.string()).optional(),
        travelStyle: zod_1.z.enum(['relaxed', 'packed', 'balanced']).optional(),
        preferredActivities: zod_1.z
            .array(zod_1.z.enum([
            'dining',
            'sightseeing',
            'culture',
            'nature',
            'shopping',
            'nightlife',
            'transport',
        ]))
            .optional(),
    })
        .optional(),
});
// Get user profile from database
async function getUserProfile(userId) {
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
    if (error) {
        throw new Error(`Failed to fetch user profile: ${error.message}`);
    }
    if (!user) {
        throw new Error('User not found');
    }
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        preferences: user.preferences || {
            defaultPersona: null,
            budgetRange: 'mid-range',
            accessibilityNeeds: [],
            dietaryRestrictions: [],
            travelStyle: 'balanced',
            preferredActivities: [],
        },
        createdAt: new Date(user.created_at),
        lastActiveAt: new Date(user.last_active_at),
    };
}
// Update user profile in database
async function updateUserProfile(userId, updates) {
    const updateData = {
        last_active_at: new Date().toISOString(),
    };
    if (updates.name !== undefined) {
        updateData.name = updates.name;
    }
    if (updates.preferences !== undefined) {
        // Get current preferences and merge with updates
        const current = await getUserProfile(userId);
        updateData.preferences = {
            ...current.preferences,
            ...updates.preferences,
        };
    }
    const { data: updatedUser, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();
    if (error) {
        throw new Error(`Failed to update user profile: ${error.message}`);
    }
    return {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        preferences: updatedUser.preferences,
        createdAt: new Date(updatedUser.created_at),
        lastActiveAt: new Date(updatedUser.last_active_at),
    };
}
// Get user's itineraries (for ownership enforcement)
async function getUserItineraries(userId) {
    const { data: itineraries, error } = await supabase
        .from('itineraries')
        .select('id, destination, status, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error) {
        throw new Error(`Failed to fetch user itineraries: ${error.message}`);
    }
    return itineraries || [];
}
const handler = async (event) => {
    const requestId = (0, crypto_1.randomBytes)(8).toString('hex');
    logger.info({ requestId, method: event.httpMethod, path: event.path }, 'Profile request received');
    try {
        // Handle CORS preflight
        if (event.httpMethod === 'OPTIONS') {
            return (0, auth_response_1.createAuthSuccessResponse)('', 200);
        }
        // Validate session
        const authResult = await (0, auth_middleware_1.validateSession)(event);
        if (!authResult.success) {
            return (0, auth_response_1.createAuthErrorResponse)(authResult.error.statusCode, authResult.error.message, authResult.error.code);
        }
        const { user } = authResult.context;
        logger.info({ requestId, userId: user.userId, method: event.httpMethod }, 'Processing authenticated profile request');
        if (event.httpMethod === 'GET') {
            // Get user profile
            const profile = await getUserProfile(user.userId);
            // Get user's itineraries for ownership info
            const itineraries = await getUserItineraries(user.userId);
            return (0, auth_response_1.createAuthSuccessResponse)({
                user: profile,
                itineraries: itineraries,
            });
        }
        else if (event.httpMethod === 'PUT') {
            // Update user profile
            if (!event.body) {
                return (0, auth_response_1.createAuthErrorResponse)(400, 'Request body is required for profile updates', 'MISSING_BODY');
            }
            const body = JSON.parse(event.body);
            const validation = UpdateProfileRequestSchema.safeParse(body);
            if (!validation.success) {
                logger.warn({ requestId, errors: validation.error.errors }, 'Invalid profile update data');
                return (0, auth_response_1.createAuthErrorResponse)(400, validation.error.errors[0].message, 'INVALID_DATA');
            }
            // Update profile
            const updatedProfile = await updateUserProfile(user.userId, validation.data);
            logger.info({
                requestId,
                userId: user.userId,
                updates: Object.keys(validation.data),
            }, 'Profile updated successfully');
            return (0, auth_response_1.createAuthSuccessResponse)({
                user: updatedProfile,
            });
        }
        else {
            return (0, auth_response_1.createAuthErrorResponse)(405, 'Only GET and PUT methods are allowed', 'METHOD_NOT_ALLOWED');
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        logger.error({ requestId, error: errorMessage, stack: errorStack }, 'Profile request failed');
        return (0, auth_response_1.createAuthErrorResponse)(500, 'An internal error occurred while processing your profile request', 'INTERNAL_ERROR', process.env.NODE_ENV === 'development' ? errorMessage : undefined);
    }
};
exports.handler = handler;
