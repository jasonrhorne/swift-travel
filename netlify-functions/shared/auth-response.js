"use strict";
// Auth-specific response utilities for Netlify Functions
// Handles special cases like Set-Cookie headers
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthResponse = createAuthResponse;
exports.createAuthErrorResponse = createAuthErrorResponse;
exports.createAuthSuccessResponse = createAuthSuccessResponse;
function createAuthResponse(statusCode, data, extraHeaders) {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Internal-Token',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    };
    // Add any extra headers
    if (extraHeaders) {
        Object.assign(headers, extraHeaders);
    }
    return {
        statusCode,
        headers,
        body: JSON.stringify(data),
    };
}
function createAuthErrorResponse(statusCode, message, code, details) {
    return createAuthResponse(statusCode, {
        error: code || `ERROR_${statusCode}`,
        message,
        ...(details && { details }),
        timestamp: new Date().toISOString(),
    });
}
function createAuthSuccessResponse(data, statusCode = 200, extraHeaders) {
    return createAuthResponse(statusCode, {
        success: true,
        data,
        timestamp: new Date().toISOString(),
    }, extraHeaders);
}
