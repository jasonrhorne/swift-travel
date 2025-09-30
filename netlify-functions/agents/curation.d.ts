import { Activity } from '@swift-travel/shared';
interface CurationResult {
    activities: Activity[];
    itineraryOverview: {
        totalActivities: number;
        estimatedCost: {
            min: number;
            max: number;
            currency: string;
        };
        themes: string[];
        highlights: string[];
        familyConsiderations?: string[];
    };
    curationMetadata: {
        interestAlignment: number;
        childFriendliness?: number;
        logisticalScore: number;
        diversityScore: number;
    };
}
/**
 * Curation Agent handler - creates structured itinerary from research data
 */
export declare function handler(event: any): Promise<{
    statusCode: number;
    headers: Record<string, string>;
    body: string;
}>;
/**
 * Retrieves curation results from Redis (for other agents)
 */
export declare function getCurationResults(requestId: string): Promise<CurationResult | null>;
export {};
