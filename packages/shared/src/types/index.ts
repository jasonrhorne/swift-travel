export type PersonaType = 'photography' | 'food-forward' | 'architecture' | 'family';
export type BudgetRange = 'budget' | 'mid-range' | 'luxury' | 'no-limit';
export type ProcessingStatus = 
  | 'initiated' 
  | 'research-in-progress' 
  | 'research-completed'
  | 'curation-in-progress'
  | 'curation-completed'
  | 'validation-in-progress'
  | 'validation-completed'
  | 'response-in-progress'
  | 'completed'
  | 'failed';

export interface UserPreferences {
  defaultPersona: PersonaType | null;
  budgetRange: BudgetRange;
  accessibilityNeeds: string[];
  dietaryRestrictions: string[];
  travelStyle: 'relaxed' | 'packed' | 'balanced';
  preferredActivities: string[];
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  preferences: UserPreferences;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface UserRequirements {
  destination: string;
  persona: PersonaType;
  dates: {
    startDate: Date;
    endDate: Date;
  };
  budgetRange: BudgetRange;
  groupSize: number;
  specialRequests: string[];
  accessibilityNeeds: string[];
}

export interface ItineraryRequest {
  id: string;
  userId: string;
  itineraryId: string | null;
  requirements: UserRequirements;
  processingLog: any[];
  status: ProcessingStatus;
  errorDetails: any | null;
  createdAt: Date;
  updatedAt: Date;
}

// Additional types for agent system
export type ActivityCategory = 'food' | 'sightseeing' | 'activity' | 'transport' | 'accommodation' | 'shopping' | 'entertainment';
export type ItineraryStatus = 'draft' | 'validated' | 'finalized' | 'archived';

export interface ActivityTiming {
  dayNumber: number;
  startTime: string;
  duration: number;
  flexibility: 'fixed' | 'flexible' | 'preferred';
  bufferTime: number;
}

export interface ActivityLocation {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  neighborhood?: string;
  googlePlaceId?: string | null;
  placeId?: string;
  accessibility: AccessibilityInfo;
}

export interface Activity {
  id: string;
  itineraryId?: string;
  name: string;
  description: string;
  category: ActivityCategory;
  timing: ActivityTiming;
  location: ActivityLocation;
  estimatedDuration: number; // in minutes
  estimatedCost?: {
    min: number;
    max: number;
    currency: string;
  };
  persona: PersonaType;
  accessibilityNotes?: string[];
  bookingRequired?: boolean;
  bookingUrl?: string;
  validation?: ValidationResult;
  personaContext?: PersonaContext;
}

export interface ValidationResult {
  status: 'pending' | 'validated' | 'verified' | 'failed';
  isValid?: boolean;
  confidence: number;
  issues: string[];
  source?: 'google-places' | 'manual' | 'ai-validation';
  googlePlaceId?: string | null;
  lastUpdated?: Date;
}

export interface PersonaContext {
  persona?: PersonaType;
  preferences?: string[];
  priorityCategories?: ActivityCategory[];
  avoidCategories?: ActivityCategory[];
  reasoning?: string;
  highlights?: string[];
  tips?: string[];
}

export interface AccessibilityInfo {
  wheelchairAccessible: boolean;
  hearingAssistance?: boolean;
  visualAssistance?: boolean;
  notes: string[];
  alternativeOptions?: string[];
}

export interface Itinerary {
  id: string;
  userId: string;
  title?: string;
  description?: string;
  destination: string;
  persona?: PersonaType;
  startDate?: Date;
  endDate?: Date;
  status: ItineraryStatus;
  activities: Activity[];
  days?: ItineraryDay[];
  metadata: ItineraryMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItineraryDay {
  dayNumber: number;
  date: Date;
  theme?: string;
  activities: Activity[];
  notes?: string;
}

export interface ItineraryMetadata {
  agentVersions: AgentVersions;
  processingTime?: number;
  processingTimeSeconds?: number;
  totalEstimatedCost?: CostEstimate;
  costEstimate?: CostEstimate;
  lastValidated?: Date;
  qualityScore?: number;
  validationResults?: ValidationResults;
}

export interface AgentVersions {
  research: string;
  curation: string;
  validation: string;
  response: string;
}

export interface CostEstimate {
  min: number;
  max: number;
  currency: string;
  breakdown: {
    activities: number;
    food?: number;
    dining?: number;
    transport: number;
    accommodation?: number;
  };
}

export interface ValidationResults {
  overall?: ValidationResult;
  activities?: Array<{
    activityId: string;
    validation: ValidationResult;
  }>;
  overallScore?: number;
  checks?: {
    locationVerified: boolean;
    timingRealistic: boolean;
    accessibilityChecked: boolean;
    costEstimated: boolean;
  };
}