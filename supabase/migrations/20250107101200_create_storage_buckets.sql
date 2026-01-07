-- Note: Run this in Supabase Dashboard SQL Editor or via Supabase CLI
-- Storage buckets need to be created via the Supabase Storage API

-- This is a reference for the buckets needed:
-- 1. 'avatars' - User profile photos
-- 2. 'children' - Child photos
-- 3. 'books' - Book covers and page illustrations
-- 4. 'audio' - Voice samples and narrations

-- Example Storage Policies (apply via Dashboard):
/*
-- Avatars bucket
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Audio bucket
CREATE POLICY "Audio files are accessible to family members"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio');

CREATE POLICY "Users can upload audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio' AND auth.uid() IS NOT NULL);

-- Books bucket
CREATE POLICY "Book assets are accessible to family"
ON storage.objects FOR SELECT
USING (bucket_id = 'books');

CREATE POLICY "Users can upload book assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'books' AND auth.uid() IS NOT NULL);
*/

SELECT 'Storage buckets reference - apply via Supabase Dashboard' AS note;
