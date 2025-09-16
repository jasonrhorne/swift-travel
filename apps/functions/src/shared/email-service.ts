// Email service for Swift Travel
// Supports multiple providers with fallback and retry logic

import pino from 'pino';
import { generateMagicLinkEmail, EmailTemplate } from './email-templates';
import type { MagicLinkEmailData } from './email-templates';

// Initialize logger
const logger = pino({
  name: 'email-service',
  level: 'info'
});

export interface EmailProvider {
  name: string;
  sendEmail(to: string, template: EmailTemplate): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

export interface EmailServiceConfig {
  providers: EmailProvider[];
  retryAttempts: number;
  retryDelayMs: number;
}

// Development email provider (logs to console)
class DevelopmentEmailProvider implements EmailProvider {
  name = 'development';
  
  async sendEmail(to: string, template: EmailTemplate): Promise<{ success: boolean; messageId?: string }> {
    logger.info({ 
      to, 
      subject: template.subject,
      provider: this.name 
    }, 'Sending email (development mode)');
    
    console.log('\n' + '='.repeat(80));
    console.log('📧 EMAIL SENT (Development Mode)');
    console.log('='.repeat(80));
    console.log(`To: ${to}`);
    console.log(`Subject: ${template.subject}`);
    console.log('\n--- TEXT VERSION ---');
    console.log(template.text);
    console.log('\n--- HTML VERSION ---');
    console.log('(HTML content available for email clients)');
    console.log('='.repeat(80) + '\n');
    
    return {
      success: true,
      messageId: `dev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }
}

// Placeholder for future email providers
class NetlifyEmailProvider implements EmailProvider {
  name = 'netlify';
  
  async sendEmail(to: string, template: EmailTemplate): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // TODO: Implement Netlify Email Integration
    // This is a placeholder for future implementation
    logger.warn({ to, provider: this.name }, 'Netlify email provider not yet implemented');
    
    return {
      success: false,
      error: 'Netlify email provider not yet implemented'
    };
  }
}

class SendGridProvider implements EmailProvider {
  name = 'sendgrid';
  
  async sendEmail(to: string, template: EmailTemplate): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // TODO: Implement SendGrid Integration
    // This is a placeholder for future implementation
    logger.warn({ to, provider: this.name }, 'SendGrid provider not yet implemented');
    
    return {
      success: false,
      error: 'SendGrid provider not yet implemented'
    };
  }
}

class EmailService {
  private config: EmailServiceConfig;
  
  constructor(config: EmailServiceConfig) {
    this.config = config;
  }
  
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async sendEmailWithRetry(to: string, template: EmailTemplate): Promise<{ success: boolean; provider?: string; messageId?: string; error?: string }> {
    let lastError: string | undefined;
    
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
          } else {
            lastError = result.error || 'Unknown error';
            logger.warn({ 
              to, 
              provider: provider.name, 
              attempt, 
              error: lastError 
            }, 'Email send attempt failed');
          }
        } catch (error) {
          lastError = error.message || 'Unknown error';
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
  
  async sendMagicLinkEmail(data: MagicLinkEmailData): Promise<{ success: boolean; provider?: string; messageId?: string; error?: string }> {
    const template = generateMagicLinkEmail(data);
    return this.sendEmailWithRetry(data.email, template);
  }
}

// Create email service instance based on environment
function createEmailService(): EmailService {
  const providers: EmailProvider[] = [];
  
  // In development, use console logging
  if (process.env.NODE_ENV === 'development') {
    providers.push(new DevelopmentEmailProvider());
  } else {
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
export const emailService = createEmailService();