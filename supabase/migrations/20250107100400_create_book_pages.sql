-- Create book pages table
CREATE TABLE IF NOT EXISTS book_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  text_content TEXT,
  image_url TEXT,
  image_prompt TEXT,
  layout TEXT DEFAULT 'full' CHECK (layout IN ('full', 'split', 'text-only')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, page_number)
);

-- Enable RLS
ALTER TABLE book_pages ENABLE ROW LEVEL SECURITY;

-- Policies (inherit from books)
CREATE POLICY "Users can view book pages" ON book_pages
  FOR SELECT USING (
    book_id IN (
      SELECT id FROM books WHERE family_id IN (
        SELECT family_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert book pages" ON book_pages
  FOR INSERT WITH CHECK (
    book_id IN (
      SELECT id FROM books WHERE family_id IN (
        SELECT family_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update book pages" ON book_pages
  FOR UPDATE USING (
    book_id IN (
      SELECT id FROM books WHERE family_id IN (
        SELECT family_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

-- Index
CREATE INDEX idx_book_pages_book_id ON book_pages(book_id);
