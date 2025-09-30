interface ResearchResult {
    destination: {
        name: string;
        city: string;
        region: string;
        country: 'USA' | 'Canada';
        timeZone: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    contextData: {
        culture: string[];
        cuisine: string[];
        attractions: string[];
        neighborhoods: string[];
        transportation: string[];
        longWeekendHighlights: string[];
        familyFriendlyOptions?: string[];
    };
    interestRecommendations: Record<string, // Interest type (food, art, outdoors, etc.)
    {
        focus: string[];
        recommendations: string[];
        tips: string[];
    }>;
    ageAppropriateActivities?: {
        babies?: string[];
        toddlers?: string[];
        kids?: string[];
        teens?: string[];
    };
    researchSources: string[];
    confidence: number;
}
/**
 * Research Agent handler - analyzes requirements and gathers destination context
 */
export declare function handler(event: any): Promise<{
    statusCode: number;
    headers: Record<string, string>;
    body: string;
}>;
/**
 * Retrieves research results from Redis (for other agents)
 */
export declare function getResearchResults(requestId: string): Promise<ResearchResult | null>;
export {};
