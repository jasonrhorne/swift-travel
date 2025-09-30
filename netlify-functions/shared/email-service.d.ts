import { EmailTemplate } from './email-templates';
import type { MagicLinkEmailData } from './email-templates';
export interface EmailProvider {
    name: string;
    sendEmail(to: string, template: EmailTemplate): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
}
export interface EmailServiceConfig {
    providers: EmailProvider[];
    retryAttempts: number;
    retryDelayMs: number;
}
declare class EmailService {
    private config;
    constructor(config: EmailServiceConfig);
    private delay;
    sendEmailWithRetry(to: string, template: EmailTemplate): Promise<{
        success: boolean;
        provider?: string;
        messageId?: string;
        error?: string;
    }>;
    sendMagicLinkEmail(data: MagicLinkEmailData): Promise<{
        success: boolean;
        provider?: string;
        messageId?: string;
        error?: string;
    }>;
}
export declare const emailService: EmailService;
export {};
