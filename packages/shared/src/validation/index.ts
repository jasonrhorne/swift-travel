// Validation exports - manually written to avoid module resolution issues
import { z } from 'zod';

// Re-export the key schemas we need for alpha
export const userRequirementsSchema = z.object({
  destination: z.string().min(1),
  interests: z.array(z.string()).default([]),
  groupSize: z.number().min(1).default(1),
  specialRequests: z.array(z.string()).default([]),
  accessibilityNeeds: z.array(z.string()).default([]),
});

export const destinationStepSchema = z.object({
  destination: z.string().min(1),
});

export const interestsStepSchema = z.object({
  interests: z.array(z.string()),
});

export const travelersStepSchema = z.object({
  groupSize: z.number().min(1),
});

export const requestsStepSchema = z.object({
  specialRequests: z.array(z.string()),
  accessibilityNeeds: z.array(z.string()),
});

export const durationStepSchema = z.object({
  duration: z.literal('long-weekend'),
});

export const formatValidationError = (error: z.ZodError) => {
  return error.issues.reduce((acc, issue) => {
    const field = issue.path.join('.');
    acc[field] = issue.message;
    return acc;
  }, {} as Record<string, string>);
};

export const sanitizeStringInput = (input: string): string => {
  return input.trim();
};

// Types
export type UserRequirementsInput = z.infer<typeof userRequirementsSchema>;
export type DestinationStepInput = z.infer<typeof destinationStepSchema>;
export type InterestsStepInput = z.infer<typeof interestsStepSchema>;
export type TravelersStepInput = z.infer<typeof travelersStepSchema>;
export type RequestsStepInput = z.infer<typeof requestsStepSchema>;
export type DurationStepInput = z.infer<typeof durationStepSchema>;