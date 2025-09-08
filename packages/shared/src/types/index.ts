// Core data models for Swift Travel
// Based on architecture/data-models.md

export type PersonaType = 'photography' | 'food-forward' | 'architecture' | 'family';
export type BudgetRange = 'budget' | 'mid-range' | 'luxury' | 'no-limit';
export type ItineraryStatus = 'processing' | 'completed' | 'failed' | 'archived';
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

export type ActivityCategory = 
  | 'dining' 
  | 'sightseeing' 
  | 'culture' 
  | 'nature' 
  | 'shopping' 
  | 'nightlife' 
  | 'transport';

export interface UserPreferences {
  defaultPersona: PersonaType | null;
  budgetRange: BudgetRange;
  accessibilityNeeds: string[];
  dietaryRestrictions: string[];
  travelStyle: 'relaxed' | 'packed' | 'balanced';
  preferredActivities: ActivityCategory[];
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  preferences: UserPreferences;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface Destination {
  name: string;
  city: string;
  region: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  timeZone: string;
}

export interface ActivityTiming {
  dayNumber: number; // 1-based day within itinerary
  startTime: string; // ISO time string
  duration: number; // minutes
  flexibility: 'fixed' | 'flexible' | 'weather-dependent';
  bufferTime: number; // minutes for transitions
}

export interface ActivityLocation {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  neighborhood: string;
  googlePlaceId: string | null;
  accessibility: AccessibilityInfo;
}

export interface AccessibilityInfo {
  wheelchairAccessible: boolean;
  hearingAssistance: boolean;
  visualAssistance: boolean;
  notes: string[];
}

export interface ValidationResult {
  status: 'verified' | 'pending' | 'failed';
  googlePlaceId: string | null;
  lastUpdated: Date;
  confidence: number;
  issues: string[];
}

export interface PersonaContext {
  reasoning: string;
  highlights: string[];
  tips: string[];
}

export interface Activity {
  id: string;
  itineraryId: string;
  name: string;
  description: string;
  category: ActivityCategory;
  timing: ActivityTiming;
  location: ActivityLocation;
  validation: ValidationResult;
  personaContext: PersonaContext;
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
  breakdown: Record<string, number>;
}

export interface ValidationResults {
  overallScore: number;
  checks: {
    locationVerified: boolean;
    timingRealistic: boolean;
    accessibilityChecked: boolean;
    costEstimated: boolean;
  };
}

export interface ItineraryMetadata {
  processingTimeSeconds: number;
  agentVersions: AgentVersions;
  qualityScore: number;
  validationResults: ValidationResults;
  costEstimate: CostEstimate;
}

export interface Itinerary {
  id: string;
  userId: string;
  destination: Destination;
  persona: PersonaType;
  status: ItineraryStatus;
  activities: Activity[];
  metadata: ItineraryMetadata;
  createdAt: Date;
  updatedAt: Date;
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

export interface ProcessingError {
  code: string;
  message: string;
  details: Record<string, any>;
  timestamp: Date;
}

export interface AgentProcessingLog {
  agent: 'research' | 'curation' | 'validation' | 'response';
  startTime: Date;
  endTime: Date | null;
  status: 'running' | 'completed' | 'failed';
  data: Record<string, any>;
  error: ProcessingError | null;
}

export interface ItineraryRequest {
  id: string;
  userId: string;
  itineraryId: string | null;
  requirements: UserRequirements;
  processingLog: AgentProcessingLog[];
  status: ProcessingStatus;
  errorDetails: ProcessingError | null;
  createdAt: Date;
  updatedAt: Date;
}