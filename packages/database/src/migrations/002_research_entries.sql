-- Structured research collected by interest-specific agents.
CREATE TABLE public.research_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES public.itinerary_requests(id) ON DELETE SET NULL,
    destination TEXT NOT NULL,
    interest TEXT NOT NULL CHECK (interest IN ('food', 'arts-culture', 'nightlife', 'outdoors', 'shopping')),
    name TEXT NOT NULL,
    entry_type TEXT NOT NULL,
    description TEXT NOT NULL,
    why_recommended TEXT NOT NULL,
    estimated_cost JSONB,
    coordinates GEOGRAPHY(POINT, 4326),
    address TEXT,
    hours JSONB,
    sources JSONB NOT NULL DEFAULT '[]',
    google_place_id TEXT,
    validation_status TEXT NOT NULL DEFAULT 'unverified'
        CHECK (validation_status IN ('unverified', 'verified', 'rejected')),
    validation_details JSONB NOT NULL DEFAULT '{}',
    researched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    validated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (destination, interest, name)
);

CREATE INDEX idx_research_entries_request ON public.research_entries(request_id);
CREATE INDEX idx_research_entries_destination_interest
    ON public.research_entries(destination, interest);
CREATE INDEX idx_research_entries_validation
    ON public.research_entries(validation_status);
CREATE INDEX idx_research_entries_coordinates
    ON public.research_entries USING GIST(coordinates);

ALTER TABLE public.research_entries ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_research_entries_updated_at
    BEFORE UPDATE ON public.research_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
