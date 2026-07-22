import { z } from 'zod';
// Zod schemas for validation
export const PersonaTypeSchema = z.enum([
  'photography',
  'food-forward',
  'architecture',
  'family',
]);
export const BudgetRangeSchema = z.enum([
  'budget',
  'mid-range',
  'luxury',
  'no-limit',
]);
export const ActivityCategorySchema = z.enum([
  'dining',
  'sightseeing',
  'culture',
  'nature',
  'shopping',
  'nightlife',
  'transport',
]);
export const ItineraryStatusSchema = z.enum([
  'processing',
  'completed',
  'failed',
  'archived',
]);

// ── Research Entries (Phase 1) ──────────────────────────────────────
export const ResearchInterestSchema = z.enum([
  'food',
  'arts-culture',
  'nightlife',
  'outdoors',
  'shopping',
]);

export const ValidationStatusSchema = z.enum([
  'unverified',
  'verified',
  'rejected',
]);

export const ResearchSourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  snippet: z.string().optional(),
});

export const EstimatedCostSchema = z
  .object({
    min: z.number().min(0),
    max: z.number().min(0),
    currency: z.string().default('USD'),
  })
  .optional();

export const HoursSchema = z
  .object({
    monday: z.string().optional(),
    tuesday: z.string().optional(),
    wednesday: z.string().optional(),
    thursday: z.string().optional(),
    friday: z.string().optional(),
    saturday: z.string().optional(),
    sunday: z.string().optional(),
    note: z.string().optional(),
  })
  .optional();

export const ValidationDetailsSchema = z
  .object({
    googlePlaceId: z.string().nullable().optional(),
    confidence: z.number().min(0).max(1).optional(),
    issues: z.array(z.string()).default([]),
    verifiedAt: z.string().datetime().optional(),
  })
  .default({});

export const ResearchEntrySchema = z.object({
  id: z.string().uuid(),
  requestId: z.string().uuid().nullable(),
  destination: z.string().min(1),
  interest: ResearchInterestSchema,
  name: z.string().min(1),
  entryType: z.string().min(1),
  description: z.string().min(1),
  whyRecommended: z.string().min(1),
  estimatedCost: EstimatedCostSchema,
  coordinates: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .nullable(),
  address: z.string().nullable(),
  hours: HoursSchema,
  sources: z.array(ResearchSourceSchema).default([]),
  googlePlaceId: z.string().nullable(),
  validationStatus: ValidationStatusSchema.default('unverified'),
  validationDetails: ValidationDetailsSchema,
  researchedAt: z.string().datetime(),
  validatedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/** Insert shape — omits auto-generated fields (id, timestamps). */
export const ResearchEntryInsertSchema = ResearchEntrySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  validatedAt: true,
});

export type ResearchInterest = z.infer<typeof ResearchInterestSchema>;
export type ValidationStatus = z.infer<typeof ValidationStatusSchema>;
export type ResearchSource = z.infer<typeof ResearchSourceSchema>;
export type ResearchEntry = z.infer<typeof ResearchEntrySchema>;

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
