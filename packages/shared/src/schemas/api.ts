import { z } from 'zod';

// ── Enums ────────────────────────────────────────────────────────────
export const ProcessingStatus = z.enum([
  'initiated',
  'research-in-progress',
  'research-completed',
  'curation-in-progress',
  'curation-completed',
  'validation-in-progress',
  'validation-completed',
  'response-in-progress',
  'completed',
  'failed',
]);
export type ProcessingStatus = z.infer<typeof ProcessingStatus>;

export const BudgetRange = z.enum([
  'budget',
  'mid-range',
  'luxury',
  'no-limit',
]);
export const Duration = z.enum(['long-weekend']);
export const ActivityCategory = z.enum([
  'food',
  'sightseeing',
  'activity',
  'transport',
  'accommodation',
  'shopping',
  'entertainment',
]);
export const ItineraryStatus = z.enum([
  'processing',
  'completed',
  'failed',
  'archived',
]);
export const Flexibility = z.enum(['fixed', 'flexible', 'preferred']);
export const ValidationStatus = z.enum([
  'pending',
  'validated',
  'verified',
  'failed',
]);

// ── Domain objects ───────────────────────────────────────────────────
export const Coordinates = z.object({
  lat: z.number(),
  lng: z.number(),
});

export const TravelerComposition = z.object({
  adults: z.number().int().min(1).max(10),
  children: z.number().int().min(0).max(10),
  childrenAges: z.array(z.number().int().min(0).max(17)),
});

export const UserRequirements = z.object({
  destination: z
    .string()
    .min(2, 'Destination must be at least 2 characters')
    .max(100),
  interests: z.array(z.string()).min(1, 'Select at least one interest').max(12),
  duration: Duration.default('long-weekend'),
  budgetRange: BudgetRange.optional(),
  groupSize: z.number().int().min(1).max(20),
  travelerComposition: TravelerComposition.optional(),
  specialRequests: z.array(z.string().max(500)).max(5).default([]),
  accessibilityNeeds: z.array(z.string().max(200)).max(10).default([]),
});

// ── Request schemas ──────────────────────────────────────────────────
export const CreateItineraryRequest = z.object({
  requirements: UserRequirements,
});

export const AgentRequest = z.object({
  requestId: z.string().uuid(),
});

// ── Activity sub-schemas ─────────────────────────────────────────────
export const ActivityTiming = z.object({
  dayNumber: z.number().int(),
  startTime: z.string(),
  duration: z.number().int(),
  flexibility: Flexibility,
  bufferTime: z.number().int(),
});

export const ActivityLocation = z.object({
  name: z.string(),
  address: z.string(),
  coordinates: Coordinates,
  neighborhood: z.string().optional(),
  googlePlaceId: z.string().nullable().optional(),
});

export const ActivityValidation = z.object({
  status: ValidationStatus,
  confidence: z.number().min(0).max(1),
  googlePlaceId: z.string().nullable().optional(),
  issues: z.array(z.string()),
});

export const PersonaContext = z.object({
  reasoning: z.string(),
  highlights: z.array(z.string()),
  tips: z.array(z.string()),
});

export const Activity = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  category: ActivityCategory,
  timing: ActivityTiming,
  location: ActivityLocation,
  estimatedCost: z
    .object({
      min: z.number(),
      max: z.number(),
      currency: z.string(),
    })
    .optional(),
  validation: ActivityValidation.optional(),
  personaContext: PersonaContext.optional(),
});

// ── Itinerary ────────────────────────────────────────────────────────
export const CostEstimate = z.object({
  min: z.number(),
  max: z.number(),
  currency: z.string(),
});

export const ItineraryMetadata = z.object({
  processingTimeSeconds: z.number().int().optional(),
  qualityScore: z.number().optional(),
  costEstimate: CostEstimate.optional(),
  validationResults: z
    .object({
      overallScore: z.number().optional(),
      checks: z
        .object({
          locationVerified: z.boolean(),
          timingRealistic: z.boolean(),
          accessibilityChecked: z.boolean(),
          costEstimated: z.boolean(),
        })
        .optional(),
    })
    .optional(),
});

export const Itinerary = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  destination: z.any(),
  interests: z.array(z.string()),
  status: ItineraryStatus,
  activities: z.array(Activity),
  metadata: ItineraryMetadata,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ── API response envelopes ───────────────────────────────────────────
export const ProcessingAcceptedData = z.object({
  requestId: z.string().uuid(),
  status: ProcessingStatus,
  message: z.string(),
});

export const ProcessingStatusData = z.object({
  requestId: z.string().uuid(),
  itineraryId: z.string().uuid().nullable(),
  status: ProcessingStatus,
  progress: z.number().int().min(0).max(100),
  currentAgent: z
    .enum(['research', 'curation', 'validation', 'response'])
    .nullable(),
  estimatedTimeRemaining: z.number().int(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .nullable()
    .optional(),
});

export const AgentResultData = z.object({
  requestId: z.string().uuid(),
  status: z.string(),
  processingTime: z.number().int(),
});

// ── Envelope helpers ─────────────────────────────────────────────────
export function apiSuccess<T>(data: T) {
  return {
    success: true as const,
    data,
    timestamp: new Date().toISOString(),
  };
}

export function apiError(
  code: string,
  message: string,
  details?: Record<string, unknown>
) {
  return {
    success: false as const,
    error: { code, message, details },
    timestamp: new Date().toISOString(),
  };
}
