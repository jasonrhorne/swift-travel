// Authentication state management with Zustand
// Following coding standards - proper Zustand patterns with immer for complex objects

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { User } from '@swift-travel/shared';
import {
  requestMagicLink,
  verifyToken,
  logout as logoutApi,
  updateUserProfile as updateUserProfileApi,
  getSessionStatus,
  AuthApiError,
} from '@/lib/api/auth';

export interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Magic link flow state
  magicLinkEmail: string | null;
  magicLinkSent: boolean;

  // Actions
  requestMagicLink: (email: string) => Promise<void>;
  verifyMagicLink: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: {
    name?: string;
    preferences?: Partial<User['preferences']>;
  }) => Promise<void>;
  clearError: () => void;
  resetMagicLinkState: () => void;
  checkSession: () => Promise<void>;
}

// Development mode bypass - automatically set a test user
const isDevelopment = process.env.NODE_ENV === 'development';
const devUser: User | null = isDevelopment
  ? {
      id: 'dev-user-123',
      email: 'dev@swift-travel.com',
      name: 'Development User',
      preferences: {
        travelStyle: 'balanced',
        pacePreference: 'moderate',
        budgetLevel: 'moderate',
        interests: ['culture', 'food', 'nature'],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  : null;

export const useAuthStore = create<AuthState>()(
  persist(
    immer(set => ({
      // Initial state - auto-authenticate in development
      user: devUser,
      isAuthenticated: isDevelopment,
      isLoading: false,
      error: null,
      magicLinkEmail: null,
      magicLinkSent: false,

      // Request magic link
      requestMagicLink: async (email: string) => {
        set(state => {
          state.isLoading = true;
          state.error = null;
          state.magicLinkEmail = email;
          state.magicLinkSent = false;
        });

        try {
          await requestMagicLink(email);

          set(state => {
            state.isLoading = false;
            state.magicLinkSent = true;
          });
        } catch (error) {
          const errorMessage =
            error instanceof AuthApiError
              ? error.message
              : 'Failed to send magic link';

          set(state => {
            state.isLoading = false;
            state.error = errorMessage;
            state.magicLinkSent = false;
          });

          throw error;
        }
      },

      // Verify magic link token
      verifyMagicLink: async (token: string) => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await verifyToken(token);

          set(state => {
            state.isLoading = false;
            state.user = response.user;
            state.isAuthenticated = true;
            state.magicLinkEmail = null;
            state.magicLinkSent = false;
          });
        } catch (error) {
          const errorMessage =
            error instanceof AuthApiError
              ? error.message
              : 'Failed to verify magic link';

          set(state => {
            state.isLoading = false;
            state.error = errorMessage;
          });

          throw error;
        }
      },

      // Logout
      logout: async () => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          await logoutApi();

          set(state => {
            state.isLoading = false;
            state.user = null;
            state.isAuthenticated = false;
            state.magicLinkEmail = null;
            state.magicLinkSent = false;
          });
        } catch (error) {
          // Even if logout API fails, clear local state
          set(state => {
            state.isLoading = false;
            state.user = null;
            state.isAuthenticated = false;
            state.magicLinkEmail = null;
            state.magicLinkSent = false;
          });

          const errorMessage =
            error instanceof AuthApiError
              ? error.message
              : 'Logout completed with warnings';

          console.warn('Logout API warning:', errorMessage);
        }
      },

      // Update user profile
      updateProfile: async updates => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await updateUserProfileApi(updates);

          set(state => {
            state.isLoading = false;
            state.user = response.user;
          });
        } catch (error) {
          const errorMessage =
            error instanceof AuthApiError
              ? error.message
              : 'Failed to update profile';

          set(state => {
            state.isLoading = false;
            state.error = errorMessage;
          });

          throw error;
        }
      },

      // Clear error
      clearError: () => {
        set(state => {
          state.error = null;
        });
      },

      // Reset magic link state
      resetMagicLinkState: () => {
        set(state => {
          state.magicLinkEmail = null;
          state.magicLinkSent = false;
          state.error = null;
        });
      },

      // Check current session
      checkSession: async () => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const sessionStatus = await getSessionStatus();

          set(state => {
            state.isLoading = false;
            state.isAuthenticated = sessionStatus.authenticated;
            state.user = sessionStatus.user || null;
          });
        } catch (error) {
          set(state => {
            state.isLoading = false;
            state.isAuthenticated = false;
            state.user = null;
          });

          // Don't throw for session check failures - just log
          console.info(
            'Session check failed:',
            error instanceof AuthApiError ? error.message : 'Unknown error'
          );
        }
      },
    })),
    {
      name: 'swift-travel-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        // Only persist user data and auth status
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
