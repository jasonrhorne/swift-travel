/**
 * Response Agent handler - formats and stores final itinerary
 */
export declare function handler(event: any): Promise<{
    statusCode: number;
    headers: Record<string, string>;
    body: string;
}>;
