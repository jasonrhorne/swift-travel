import { z } from 'zod';
import type { PersonaType, BudgetRange } from '../types';

// Persona validation
export const personaSchema = z.enum(['photography', 'food-forward', 'architecture', 'family'] as const);

// Budget range validation
export const budgetRangeSchema = z.enum(['budget', 'mid-range', 'luxury', 'no-limit'] as const);

// Date validation with future date requirement
export const dateSchema = z.date().refine(
  (date) => date > new Date(),
  { message: "Date must be in the future" }
);

// Date range validation
export const dateRangeSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
}).refine(
  (data) => data.endDate > data.startDate,
  { 
    message: "End date must be after start date",
    path: ["endDate"]
  }
).refine(
  (data) => {
    const diffTime = data.endDate.getTime() - data.startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 1 && diffDays <= 14;
  },
  {
    message: "Trip duration must be between 1 and 14 days",
    path: ["endDate"]
  }
);

// User requirements validation schema
export const userRequirementsSchema = z.object({
  destination: z.string()
    .min(2, "Destination must be at least 2 characters")
    .max(100, "Destination must be less than 100 characters")
    .regex(/^[a-zA-Z\s,.-]+$/, "Destination contains invalid characters"),
  
  persona: personaSchema,
  
  dates: dateRangeSchema,
  
  budgetRange: budgetRangeSchema,
  
  groupSize: z.number()
    .int("Group size must be a whole number")
    .min(1, "Group size must be at least 1")
    .max(20, "Group size cannot exceed 20 people"),
  
  specialRequests: z.array(z.string().max(500, "Each request must be less than 500 characters"))
    .max(5, "Maximum 5 special requests allowed"),
  
  accessibilityNeeds: z.array(z.string().max(200, "Each accessibility need must be less than 200 characters"))
    .max(10, "Maximum 10 accessibility needs allowed"),
});

// Form step validation schemas for multi-step form
export const destinationStepSchema = z.object({
  destination: userRequirementsSchema.shape.destination,
});

export const datesStepSchema = z.object({
  dates: userRequirementsSchema.shape.dates,
});

export const personaStepSchema = z.object({
  persona: userRequirementsSchema.shape.persona,
});

export const preferencesStepSchema = z.object({
  budgetRange: userRequirementsSchema.shape.budgetRange,
  groupSize: userRequirementsSchema.shape.groupSize,
});

export const requestsStepSchema = z.object({
  specialRequests: userRequirementsSchema.shape.specialRequests,
  accessibilityNeeds: userRequirementsSchema.shape.accessibilityNeeds,
});

// Validation error formatting
export const formatValidationError = (error: z.ZodError) => {
  return error.issues.reduce((acc, issue) => {
    const field = issue.path.join('.');
    acc[field] = issue.message;
    return acc;
  }, {} as Record<string, string>);
};

// Input sanitization helpers
export const sanitizeStringInput = (input: string): string => {
  return input
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, ''); // Remove HTML tags
};

export const sanitizeArrayInput = (input: string[]): string[] => {
  return input
    .filter(item => typeof item === 'string' && item.trim().length > 0)
    .map(sanitizeStringInput)
    .slice(0, 10); // Limit array size
};

// Export types for TypeScript inference
export type UserRequirementsInput = z.infer<typeof userRequirementsSchema>;
export type DestinationStepInput = z.infer<typeof destinationStepSchema>;
export type DatesStepInput = z.infer<typeof datesStepSchema>;
export type PersonaStepInput = z.infer<typeof personaStepSchema>;
export type PreferencesStepInput = z.infer<typeof preferencesStepSchema>;
export type RequestsStepInput = z.infer<typeof requestsStepSchema>;