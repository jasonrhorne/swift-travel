export interface EmailTemplate {
    subject: string;
    html: string;
    text: string;
}
export interface MagicLinkEmailData {
    email: string;
    magicLink: string;
    expirationMinutes: number;
}
export declare function generateMagicLinkEmail(data: MagicLinkEmailData): EmailTemplate;
