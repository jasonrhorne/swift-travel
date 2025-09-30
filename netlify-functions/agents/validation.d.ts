import { Activity } from '@swift-travel/shared';
interface ValidationResults {
    validatedActivities: Activity[];
    validationSummary: {
        totalActivities: number;
        verifiedCount: number;
        pendingCount: number;
        failedCount: number;
        averageConfidence: number;
        familyFriendlyCount?: number;
    };
    apiUsage: {
        placesApiCalls: number;
        rateLimitHits: number;
        errors: number;
    };
}
/**
 * Validation Agent handler - verifies locations using Google Places API
 */
export declare function handler(event: any): Promise<{
    statusCode: number;
    headers: Record<string, string>;
    body: string;
}>;
/**
 * Retrieves validation results from Redis (for other agents)
 */
export declare function getValidationResults(requestId: string): Promise<ValidationResults | null>;
export {};
