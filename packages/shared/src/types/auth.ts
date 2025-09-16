// Auth-related types for Swift Travel
// Import and re-export User and UserPreferences from main types
import type { User, UserPreferences } from './index';
export type { User, UserPreferences };

export interface AuthToken {
  token: string;
  email: string;
  expiresAt: Date;
}

export interface SessionToken {
  userId: string;
  email: string;
  expiresAt: Date;
}

export interface MagicLinkRequest {
  email: string;
}

export interface MagicLinkResponse {
  message: string;
  success: boolean;
}

export interface VerifyTokenRequest {
  token: string;
}

export interface VerifyTokenResponse {
  user: User;
  sessionToken: string;
  success: boolean;
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
}