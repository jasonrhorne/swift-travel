"use strict";
// Standard response utilities for Netlify Functions
// Based on coding standards - structured responses with proper error handling
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSuccessResponse = createSuccessResponse;
exports.createErrorResponse = createErrorResponse;
function createSuccessResponse(data, statusCode = 200) {
    const response = {
        success: true,
        data,
        timestamp: new Date().toISOString(),
    };
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Internal-Token',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        },
        body: JSON.stringify(response),
    };
}
function createErrorResponse(statusCode, message, details) {
    const response = {
        success: false,
        error: {
            code: `ERROR_${statusCode}`,
            message,
            details,
        },
        timestamp: new Date().toISOString(),
    };
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Internal-Token',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        },
        body: JSON.stringify(response),
    };
}
