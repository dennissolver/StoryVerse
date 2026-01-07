-- Multi-Tenant Storage Configuration for StoryVerse
-- All storage is scoped to families using folder structure: /{family_id}/...

-- Create storage buckets (ignore if they already exist)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES 
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('children', 'children', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('books', 'books', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('audio', 'audio', false, 52428800, ARRAY['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg'])
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN others THEN
  -- Buckets might already exist or storage schema might not be ready
  RAISE NOTICE 'Storage buckets setup skipped: %', SQLERRM;
END;
$$;

-- ============================================
-- Helper function to get family_id for current user
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_family_id()
RETURNS UUID AS $$
  SELECT family_id FROM public.user_profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================
-- AVATARS BUCKET - Public read, user-scoped write
-- Path: /avatars/{user_id}/{filename}
-- ============================================

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- CHILDREN BUCKET - Family-scoped
-- Path: /children/{family_id}/{child_id}/{filename}
-- ============================================

DROP POLICY IF EXISTS "Family members can view child photos" ON storage.objects;
CREATE POLICY "Family members can view child photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'children'
  AND (storage.foldername(name))[1] IN (
    SELECT family_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Family members can upload child photos" ON storage.objects;
CREATE POLICY "Family members can upload child photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'children'
  AND (storage.foldername(name))[1] IN (
    SELECT family_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Family members can update child photos" ON storage.objects;
CREATE POLICY "Family members can update child photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'children'
  AND (storage.foldername(name))[1] IN (
    SELECT family_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Family members can delete child photos" ON storage.objects;
CREATE POLICY "Family members can delete child photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'children'
  AND (storage.foldername(name))[1] IN (
    SELECT family_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

-- ============================================
-- BOOKS BUCKET - Family-scoped
-- Path: /books/{family_id}/{book_id}/{covers|pages}/{filename}
-- ============================================

DROP POLICY IF EXISTS "Family members can view book assets" ON storage.objects;
CREATE POLICY "Family members can view book assets"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'books'
  AND (storage.foldername(name))[1] IN (
    SELECT family_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Family members can upload book assets" ON storage.objects;
CREATE POLICY "Family members can upload book assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'books'
  AND (storage.foldername(name))[1] IN (
    SELECT family_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Family members can update book assets" ON storage.objects;
CREATE POLICY "Family members can update book assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'books'
  AND (storage.foldername(name))[1] IN (
    SELECT family_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Family members can delete book assets" ON storage.objects;
CREATE POLICY "Family members can delete book assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'books'
  AND (storage.foldername(name))[1] IN (
    SELECT family_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

-- ============================================
-- AUDIO BUCKET - Family-scoped
-- Path: /audio/{family_id}/{voice_samples|narrations}/{filename}
-- ============================================

DROP POLICY IF EXISTS "Family members can listen to audio" ON storage.objects;
CREATE POLICY "Family members can listen to audio"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'audio'
  AND (storage.foldername(name))[1] IN (
    SELECT family_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Family members can upload audio" ON storage.objects;
CREATE POLICY "Family members can upload audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'audio'
  AND (storage.foldername(name))[1] IN (
    SELECT family_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Family members can update audio" ON storage.objects;
CREATE POLICY "Family members can update audio"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'audio'
  AND (storage.foldername(name))[1] IN (
    SELECT family_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Family members can delete audio" ON storage.objects;
CREATE POLICY "Family members can delete audio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'audio'
  AND (storage.foldername(name))[1] IN (
    SELECT family_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

-- ============================================
-- STORAGE PATH CONVENTIONS
-- ============================================
-- avatars/{user_id}/profile.jpg
-- children/{family_id}/{child_id}/photo.jpg
-- books/{family_id}/{book_id}/cover.webp
-- books/{family_id}/{book_id}/pages/page_001.webp
-- audio/{family_id}/voice_samples/{voice_profile_id}/sample.mp3
-- audio/{family_id}/narrations/{book_id}/page_001.mp3
