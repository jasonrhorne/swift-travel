export declare const logger: import("pino").Logger<never>;
export declare const agentLogger: {
    agentStart: (agent: string, requestId: string, data?: Record<string, any>) => void;
    agentComplete: (agent: string, requestId: string, duration: number, data?: Record<string, any>) => void;
    agentError: (agent: string, requestId: string, error: any, data?: Record<string, any>) => void;
    orchestrationEvent: (event: string, requestId: string, data?: Record<string, any>) => void;
    timeout: (requestId: string, elapsed: number, maxDuration: number) => void;
};
