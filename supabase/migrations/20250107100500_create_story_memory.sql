-- Create story memory table for persistent characters and events
CREATE TABLE IF NOT EXISTS story_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE UNIQUE,
  
  -- Persistent characters across books
  -- [{name, description, relationship, first_appeared_book_id, traits, image_embedding}]
  characters JSONB DEFAULT '[]'::jsonb,
  
  -- Story events for continuity
  -- [{event, book_id, significance, date}]
  story_events JSONB DEFAULT '[]'::jsonb,
  
  -- Learned preferences from interactions
  -- {favorite_themes, disliked_elements, preferred_story_length, etc.}
  preferences JSONB DEFAULT '{}'::jsonb,
  
  -- Running story arcs
  -- [{arc_name, status, related_books}]
  ongoing_arcs JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE story_memory ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view child story memory" ON story_memory
  FOR SELECT USING (
    child_id IN (
      SELECT id FROM children WHERE family_id IN (
        SELECT family_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can upsert child story memory" ON story_memory
  FOR INSERT WITH CHECK (
    child_id IN (
      SELECT id FROM children WHERE family_id IN (
        SELECT family_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update child story memory" ON story_memory
  FOR UPDATE USING (
    child_id IN (
      SELECT id FROM children WHERE family_id IN (
        SELECT family_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

-- Index
CREATE INDEX idx_story_memory_child_id ON story_memory(child_id);

-- Trigger to auto-create story memory when child is created
CREATE OR REPLACE FUNCTION create_child_memory()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO story_memory (child_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_memory_on_child_insert ON children;
CREATE TRIGGER create_memory_on_child_insert
  AFTER INSERT ON children
  FOR EACH ROW EXECUTE FUNCTION create_child_memory();
