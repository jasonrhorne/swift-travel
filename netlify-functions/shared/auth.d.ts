export interface AuthValidationResult {
    valid: boolean;
    error?: string;
}
/**
 * Validates internal API authentication for agent-to-agent communication
 */
export declare function validateInternalAuth(headers: Record<string, string>): AuthValidationResult;
/**
 * Middleware for Netlify Functions to validate internal authentication
 */
export declare function requireInternalAuth(event: any): boolean;
