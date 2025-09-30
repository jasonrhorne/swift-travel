"use strict";
// Email service for Swift Travel
// Supports multiple providers with fallback and retry logic
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const pino_1 = __importDefault(require("pino"));
const email_templates_1 = require("./email-templates");
// Initialize logger
const logger = (0, pino_1.default)({
    name: 'email-service',
    level: 'info'
});
// Development email provider (logs to console)
class DevelopmentEmailProvider {
    name = 'development';
    async sendEmail(to, template) {
        logger.info({
            to,
            subject: template.subject,
            provider: this.name
        }, 'Sending email (development mode)');
        // Log email details for development
        logger.info({
            to,
            subject: template.subject,
            textPreview: template.text.substring(0, 200),
            hasHtml: !!template.html
        }, 'Email logged (development mode)');
        return {
            success: true,
            messageId: `dev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
    }
}
// TODO: Placeholder for future email providers
// class NetlifyEmailProvider implements EmailProvider { ... }
// class SendGridProvider implements EmailProvider { ... }
class EmailService {
    config;
    constructor(config) {
        this.config = config;
    }
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async sendEmailWithRetry(to, template) {
        let lastError;
        for (const provider of this.config.providers) {
            for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
                try {
                    logger.info({
                        to,
                        provider: provider.name,
                        attempt,
                        subject: template.subject
                    }, 'Attempting to send email');
                    const result = await provider.sendEmail(to, template);
                    if (result.success) {
                        logger.info({
                            to,
                            provider: provider.name,
                            messageId: result.messageId
                        }, 'Email sent successfully');
                        return {
                            success: true,
                            provider: provider.name,
                            messageId: result.messageId
                        };
                    }
                    else {
                        lastError = result.error || 'Unknown error';
                        logger.warn({
                            to,
                            provider: provider.name,
                            attempt,
                            error: lastError
                        }, 'Email send attempt failed');
                    }
                }
                catch (error) {
                    lastError = error instanceof Error ? error.message : 'Unknown error';
                    logger.error({
                        to,
                        provider: provider.name,
                        attempt,
                        error: lastError
                    }, 'Email send attempt threw error');
                }
                // Wait before retry (except on last attempt)
                if (attempt < this.config.retryAttempts) {
                    await this.delay(this.config.retryDelayMs);
                }
            }
        }
        logger.error({
            to,
            attempts: this.config.retryAttempts * this.config.providers.length,
            lastError
        }, 'All email send attempts failed');
        return {
            success: false,
            error: lastError || 'All email providers failed'
        };
    }
    async sendMagicLinkEmail(data) {
        const template = (0, email_templates_1.generateMagicLinkEmail)(data);
        return this.sendEmailWithRetry(data.email, template);
    }
}
// Create email service instance based on environment
function createEmailService() {
    const providers = [];
    // In development, use console logging
    if (process.env.NODE_ENV === 'development') {
        providers.push(new DevelopmentEmailProvider());
    }
    else {
        // In production, add real email providers
        // For now, we'll use development provider as fallback
        providers.push(new DevelopmentEmailProvider());
        // TODO: Enable these when implemented
        // if (process.env.SENDGRID_API_KEY) {
        //   providers.push(new SendGridProvider());
        // }
        // if (process.env.NETLIFY_EMAIL_TOKEN) {
        //   providers.push(new NetlifyEmailProvider());
        // }
    }
    return new EmailService({
        providers,
        retryAttempts: 3,
        retryDelayMs: 1000
    });
}
// Export singleton instance
exports.emailService = createEmailService();
