-- Create book translations table for caching translated content
CREATE TABLE IF NOT EXISTS book_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  translated_pages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, language)
);

-- Enable RLS
ALTER TABLE book_translations ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies are defined in 20250107101700_comprehensive_rls_policies.sql

-- Index for faster lookups
CREATE INDEX idx_book_translations_book_id ON book_translations(book_id);
CREATE INDEX idx_book_translations_language ON book_translations(language);

-- Add preferred_language to children table for default story language
ALTER TABLE children ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- Add preferred_language to families table for default UI language
ALTER TABLE families ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';
