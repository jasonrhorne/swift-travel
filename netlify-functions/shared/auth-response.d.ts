export declare function createAuthResponse(statusCode: number, data: any, extraHeaders?: Record<string, string>): {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
};
export declare function createAuthErrorResponse(statusCode: number, message: string, code?: string, details?: any): {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
};
export declare function createAuthSuccessResponse(data: any, statusCode?: number, extraHeaders?: Record<string, string>): {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
};
