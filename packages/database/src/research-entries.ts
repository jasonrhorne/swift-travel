import { supabase } from './client';
import type { Database } from './types/database';

type Row = Database['public']['Tables']['research_entries']['Row'];

export interface ResearchEntryInsert {
  requestId: string | null;
  destination: string;
  interest: 'food' | 'arts-culture' | 'nightlife' | 'outdoors' | 'shopping';
  name: string;
  entryType: string;
  description: string;
  whyRecommended: string;
  estimatedCost?: { min: number; max: number; currency: string } | null;
  coordinates?: { lat: number; lng: number } | null;
  address?: string | null;
  hours?: Record<string, string> | null;
  sources?: Array<{ title: string; url: string; snippet?: string }>;
  googlePlaceId?: string | null;
  validationStatus?: 'unverified' | 'verified' | 'rejected';
  validationDetails?: Record<string, unknown>;
  researchedAt?: string;
}

export interface ResearchEntriesRepo {
  insertBatch(entries: ResearchEntryInsert[]): Promise<Row[]>;
  insert(entry: ResearchEntryInsert): Promise<Row>;
  getByRequest(requestId: string): Promise<Row[]>;
  getByDestinationInterest(
    destination: string,
    interest: string
  ): Promise<Row[]>;
  updateValidationStatus(
    id: string,
    status: 'unverified' | 'verified' | 'rejected',
    details?: Record<string, unknown>
  ): Promise<Row>;
}

function toRow(e: ResearchEntryInsert) {
  return {
    request_id: e.requestId,
    destination: e.destination,
    interest: e.interest,
    name: e.name,
    entry_type: e.entryType,
    description: e.description,
    why_recommended: e.whyRecommended,
    estimated_cost: e.estimatedCost ?? null,
    coordinates: e.coordinates
      ? { type: 'Point', coordinates: [e.coordinates.lng, e.coordinates.lat] }
      : null,
    address: e.address ?? null,
    hours: e.hours ?? null,
    sources: e.sources ?? [],
    google_place_id: e.googlePlaceId ?? null,
    validation_status: e.validationStatus ?? 'unverified',
    validation_details: e.validationDetails ?? {},
    researched_at: e.researchedAt ?? new Date().toISOString(),
  };
}

// Supabase typed client struggles with geography columns and bulk inserts.
// The runtime is correct; we use `any` casts on the query builder calls only.
export const researchEntries: ResearchEntriesRepo = {
  async insertBatch(entries) {
    const rows = entries.map(toRow);
    const { data, error } = await (supabase as any)
      .from('research_entries')
      .insert(rows)
      .select();
    if (error)
      throw new Error(`research_entries insertBatch: ${error.message}`);
    return data as Row[];
  },

  async insert(entry) {
    const { data, error } = await (supabase as any)
      .from('research_entries')
      .insert(toRow(entry))
      .select()
      .single();
    if (error) throw new Error(`research_entries insert: ${error.message}`);
    return data as Row;
  },

  async getByRequest(requestId) {
    const { data, error } = await (supabase as any)
      .from('research_entries')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });
    if (error)
      throw new Error(`research_entries getByRequest: ${error.message}`);
    return data as Row[];
  },

  async getByDestinationInterest(destination, interest) {
    const { data, error } = await (supabase as any)
      .from('research_entries')
      .select('*')
      .eq('destination', destination)
      .eq('interest', interest)
      .order('created_at', { ascending: true });
    if (error)
      throw new Error(
        `research_entries getByDestinationInterest: ${error.message}`
      );
    return data as Row[];
  },

  async updateValidationStatus(id, status, details) {
    const update: Record<string, unknown> = {
      validation_status: status,
      updated_at: new Date().toISOString(),
    };
    if (status === 'verified' || status === 'rejected') {
      update.validated_at = new Date().toISOString();
    }
    if (details) {
      update.validation_details = details;
    }
    const { data, error } = await (supabase as any)
      .from('research_entries')
      .update(update)
      .eq('id', id)
      .select()
      .single();
    if (error)
      throw new Error(
        `research_entries updateValidationStatus: ${error.message}`
      );
    return data as Row;
  },
};
