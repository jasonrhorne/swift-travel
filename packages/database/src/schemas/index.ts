import { z } from 'zod';
import type { 
  User, 
  UserPreferences, 
  Itinerary, 
  Activity, 
  ItineraryRequest,
  PersonaType,
  BudgetRange,
  ActivityCategory,
  ItineraryStatus,
  ProcessingStatus 
} from '@swift-travel/shared';

// Zod schemas for validation
export const PersonaTypeSchema = z.enum(['photography', 'food-forward', 'architecture', 'family']);
export const BudgetRangeSchema = z.enum(['budget', 'mid-range', 'luxury', 'no-limit']);
export const ActivityCategorySchema = z.enum(['dining', 'sightseeing', 'culture', 'nature', 'shopping', 'nightlife', 'transport']);
export const ItineraryStatusSchema = z.enum(['processing', 'completed', 'failed', 'archived']);

export const UserPreferencesSchema = z.object({
  defaultPersona: PersonaTypeSchema.nullable(),
  budgetRange: BudgetRangeSchema,
  accessibilityNeeds: z.array(z.string()),
  dietaryRestrictions: z.array(z.string()),
  travelStyle: z.enum(['relaxed', 'packed', 'balanced']),
  preferredActivities: z.array(ActivityCategorySchema),
});

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  preferences: UserPreferencesSchema,
  createdAt: z.date(),
  lastActiveAt: z.date(),
});

export const DestinationSchema = z.object({
  name: z.string(),
  city: z.string(),
  region: z.string(),
  country: z.string(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  timeZone: z.string(),
});

export const ActivityTimingSchema = z.object({
  dayNumber: z.number().min(1),
  startTime: z.string(),
  duration: z.number().min(1),
  flexibility: z.enum(['fixed', 'flexible', 'weather-dependent']),
  bufferTime: z.number().min(0),
});

export const ActivityLocationSchema = z.object({
  name: z.string(),
  address: z.string(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  neighborhood: z.string(),
  googlePlaceId: z.string().nullable(),
  accessibility: z.object({
    wheelchairAccessible: z.boolean(),
    hearingAssistance: z.boolean(),
    visualAssistance: z.boolean(),
    notes: z.array(z.string()),
  }),
});

export const ActivitySchema = z.object({
  id: z.string().uuid(),
  itineraryId: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  category: ActivityCategorySchema,
  timing: ActivityTimingSchema,
  location: ActivityLocationSchema,
  validation: z.object({
    status: z.enum(['verified', 'pending', 'failed']),
    googlePlaceId: z.string().nullable(),
    lastUpdated: z.date(),
    confidence: z.number().min(0).max(1),
    issues: z.array(z.string()),
  }),
  personaContext: z.object({
    reasoning: z.string(),
    highlights: z.array(z.string()),
    tips: z.array(z.string()),
  }),
});

export const ItinerarySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  destination: DestinationSchema,
  persona: PersonaTypeSchema,
  status: ItineraryStatusSchema,
  activities: z.array(ActivitySchema),
  metadata: z.object({
    processingTimeSeconds: z.number(),
    agentVersions: z.object({
      research: z.string(),
      curation: z.string(),
      validation: z.string(),
      response: z.string(),
    }),
    qualityScore: z.number().min(0).max(1),
    validationResults: z.object({
      overallScore: z.number(),
      checks: z.object({
        locationVerified: z.boolean(),
        timingRealistic: z.boolean(),
        accessibilityChecked: z.boolean(),
        costEstimated: z.boolean(),
      }),
    }),
    costEstimate: z.object({
      min: z.number(),
      max: z.number(),
      currency: z.string(),
      breakdown: z.record(z.number()),
    }),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});