export interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: Record<string, any>;
    };
    timestamp: string;
}
export declare function createSuccessResponse<T>(data: T, statusCode?: number): {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
};
export declare function createErrorResponse(statusCode: number, message: string, details?: Record<string, any>): {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
};
