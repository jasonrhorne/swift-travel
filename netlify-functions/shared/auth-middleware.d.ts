export interface AuthContext {
    user: {
        userId: string;
        email: string;
    };
    sessionToken: string;
}
export interface AuthValidationResult {
    success: boolean;
    context?: AuthContext;
    error?: {
        code: string;
        message: string;
        statusCode: number;
    };
}
export declare function validateSession(event: any): Promise<AuthValidationResult>;
export declare function createAuthErrorResponse(error: AuthValidationResult['error']): {
    statusCode: number;
    headers: {
        'Content-Type': string;
        'Access-Control-Allow-Origin': string;
    };
    body: string;
};
