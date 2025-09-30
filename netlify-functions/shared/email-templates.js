"use strict";
// Email templates for Swift Travel authentication
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMagicLinkEmail = generateMagicLinkEmail;
// Generate magic link email template
function generateMagicLinkEmail(data) {
    const { email, magicLink, expirationMinutes } = data;
    const subject = 'Your Swift Travel Magic Link';
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Swift Travel - Magic Link</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          padding: 40px 0;
          border-bottom: 2px solid #f0f0f0;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .tagline {
          color: #666;
          font-size: 16px;
        }
        .content {
          padding: 40px 0;
        }
        .magic-link-button {
          display: inline-block;
          background-color: #2563eb;
          color: white;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 20px 0;
          text-align: center;
        }
        .magic-link-button:hover {
          background-color: #1d4ed8;
        }
        .expiration-notice {
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
          padding: 16px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .security-note {
          background-color: #f3f4f6;
          padding: 16px;
          border-radius: 8px;
          margin: 20px 0;
          font-size: 14px;
          color: #666;
        }
        .footer {
          border-top: 1px solid #e5e7eb;
          padding: 20px 0;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
        .fallback-link {
          word-break: break-all;
          background-color: #f9fafb;
          padding: 10px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">✈️ Swift Travel</div>
        <div class="tagline">AI-Powered Travel Planning</div>
      </div>
      
      <div class="content">
        <h2>Welcome to Swift Travel!</h2>
        <p>Hello,</p>
        <p>You requested to sign in to Swift Travel with this email address: <strong>${email}</strong></p>
        <p>Click the button below to sign in securely:</p>
        
        <div style="text-align: center;">
          <a href="${magicLink}" class="magic-link-button">Sign In to Swift Travel</a>
        </div>
        
        <div class="expiration-notice">
          <strong>⏰ Important:</strong> This magic link will expire in ${expirationMinutes} minutes for your security.
        </div>
        
        <div class="security-note">
          <strong>🔒 Security Note:</strong> This link can only be used once and will expire automatically. 
          If you didn't request this email, you can safely ignore it.
        </div>
        
        <h3>Having trouble with the button?</h3>
        <p>Copy and paste this link into your browser:</p>
        <div class="fallback-link">${magicLink}</div>
      </div>
      
      <div class="footer">
        <p>This email was sent to ${email} because you requested a magic link to sign in to Swift Travel.</p>
        <p>If you have any questions, please contact our support team.</p>
        <p>&copy; 2025 Swift Travel. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
    const text = `
Swift Travel - Your Magic Link

Hello,

You requested to sign in to Swift Travel with this email address: ${email}

Click or copy this link to sign in securely:
${magicLink}

IMPORTANT: This magic link will expire in ${expirationMinutes} minutes for your security.

Security Note: This link can only be used once and will expire automatically. If you didn't request this email, you can safely ignore it.

---
This email was sent to ${email} because you requested a magic link to sign in to Swift Travel.

© 2025 Swift Travel. All rights reserved.
  `;
    return {
        subject,
        html: html.trim(),
        text: text.trim()
    };
}
