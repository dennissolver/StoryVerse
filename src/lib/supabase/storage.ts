import { getSupabaseClient } from './client';

// ============================================
// MULTI-TENANT STORAGE HELPER
// All paths include family_id for RLS compliance
// ============================================

// Storage bucket names
export const BUCKETS = {
  AVATARS: 'avatars',       // User avatars (public)
  CHILDREN: 'children',     // Child photos (family-scoped)
  BOOKS: 'books',          // Book covers and pages (family-scoped)
  AUDIO: 'audio',          // Voice samples and narrations (family-scoped)
} as const;

export type StorageBucket = typeof BUCKETS[keyof typeof BUCKETS];

// ============================================
// PATH BUILDERS (ensure RLS compliance)
// Storage structure:
// - /avatars/{user_id}/profile.jpg
// - /children/{family_id}/{child_id}/photo.jpg
// - /books/{family_id}/{book_id}/cover.webp
// - /books/{family_id}/{book_id}/pages/page_001.webp
// - /audio/{family_id}/voice_samples/{voice_id}/sample.mp3
// - /audio/{family_id}/narrations/{book_id}/page_001.mp3
// ============================================

export function avatarPath(userId: string, filename: string): string {
  return `${userId}/${filename}`;
}

export function childPhotoPath(familyId: string, childId: string, filename: string): string {
  return `${familyId}/${childId}/${filename}`;
}

export function bookCoverPath(familyId: string, bookId: string): string {
  return `${familyId}/${bookId}/cover.webp`;
}

export function bookPagePath(familyId: string, bookId: string, pageNumber: number): string {
  const paddedPage = String(pageNumber).padStart(3, '0');
  return `${familyId}/${bookId}/pages/page_${paddedPage}.webp`;
}

export function voiceSamplePath(familyId: string, voiceProfileId: string, filename: string): string {
  return `${familyId}/voice_samples/${voiceProfileId}/${filename}`;
}

export function narrationPath(familyId: string, bookId: string, pageNumber: number): string {
  const paddedPage = String(pageNumber).padStart(3, '0');
  return `${familyId}/narrations/${bookId}/page_${paddedPage}.mp3`;
}

// ============================================
// UPLOAD FUNCTIONS
// ============================================

export async function uploadAvatar(
  userId: string, 
  file: File
): Promise<string | null> {
  const supabase = getSupabaseClient();
  const ext = file.name.split('.').pop() || 'jpg';
  const path = avatarPath(userId, `profile.${ext}`);
  
  const { error } = await supabase.storage
    .from(BUCKETS.AVATARS)
    .upload(path, file, { upsert: true });

  if (error) {
    console.error('Avatar upload error:', error);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKETS.AVATARS)
    .getPublicUrl(path);

  return publicUrl;
}

export async function uploadChildPhoto(
  familyId: string,
  childId: string, 
  file: File
): Promise<string | null> {
  const supabase = getSupabaseClient();
  const ext = file.name.split('.').pop() || 'jpg';
  const path = childPhotoPath(familyId, childId, `photo.${ext}`);
  
  const { error } = await supabase.storage
    .from(BUCKETS.CHILDREN)
    .upload(path, file, { upsert: true });

  if (error) {
    console.error('Child photo upload error:', error);
    return null;
  }

  // Children bucket is private - return signed URL
  const { data } = await supabase.storage
    .from(BUCKETS.CHILDREN)
    .createSignedUrl(path, 86400); // 24 hours

  return data?.signedUrl || null;
}

export async function uploadBookCover(
  familyId: string,
  bookId: string, 
  imageData: Blob | ArrayBuffer
): Promise<string | null> {
  const supabase = getSupabaseClient();
  const path = bookCoverPath(familyId, bookId);
  
  const { error } = await supabase.storage
    .from(BUCKETS.BOOKS)
    .upload(path, imageData, { 
      upsert: true,
      contentType: 'image/webp'
    });

  if (error) {
    console.error('Book cover upload error:', error);
    return null;
  }

  // Books bucket is private - return signed URL
  const { data } = await supabase.storage
    .from(BUCKETS.BOOKS)
    .createSignedUrl(path, 86400);

  return data?.signedUrl || null;
}

export async function uploadBookPage(
  familyId: string,
  bookId: string,
  pageNumber: number,
  imageData: Blob | ArrayBuffer
): Promise<string | null> {
  const supabase = getSupabaseClient();
  const path = bookPagePath(familyId, bookId, pageNumber);
  
  const { error } = await supabase.storage
    .from(BUCKETS.BOOKS)
    .upload(path, imageData, { 
      upsert: true,
      contentType: 'image/webp'
    });

  if (error) {
    console.error('Book page upload error:', error);
    return null;
  }

  const { data } = await supabase.storage
    .from(BUCKETS.BOOKS)
    .createSignedUrl(path, 86400);

  return data?.signedUrl || null;
}

export async function uploadVoiceSample(
  familyId: string,
  voiceProfileId: string,
  audioBlob: Blob
): Promise<string | null> {
  const supabase = getSupabaseClient();
  const path = voiceSamplePath(familyId, voiceProfileId, 'sample.mp3');
  
  const { error } = await supabase.storage
    .from(BUCKETS.AUDIO)
    .upload(path, audioBlob, { 
      upsert: true,
      contentType: 'audio/mpeg'
    });

  if (error) {
    console.error('Voice sample upload error:', error);
    return null;
  }

  const { data } = await supabase.storage
    .from(BUCKETS.AUDIO)
    .createSignedUrl(path, 3600); // 1 hour

  return data?.signedUrl || null;
}

export async function uploadNarration(
  familyId: string,
  bookId: string,
  pageNumber: number,
  audioBlob: Blob
): Promise<string | null> {
  const supabase = getSupabaseClient();
  const path = narrationPath(familyId, bookId, pageNumber);
  
  const { error } = await supabase.storage
    .from(BUCKETS.AUDIO)
    .upload(path, audioBlob, { 
      upsert: true,
      contentType: 'audio/mpeg'
    });

  if (error) {
    console.error('Narration upload error:', error);
    return null;
  }

  const { data } = await supabase.storage
    .from(BUCKETS.AUDIO)
    .createSignedUrl(path, 3600);

  return data?.signedUrl || null;
}

// ============================================
// URL FUNCTIONS
// ============================================

export async function getSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('Signed URL error:', error);
    return null;
  }

  return data.signedUrl;
}

export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const supabase = getSupabaseClient();
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return publicUrl;
}

// ============================================
// DELETE FUNCTIONS
// ============================================

export async function deleteFile(bucket: StorageBucket, path: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    console.error('Delete file error:', error);
    return false;
  }

  return true;
}

export async function deleteBookAssets(familyId: string, bookId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  // Delete cover and pages
  const { data: bookFiles } = await supabase.storage
    .from(BUCKETS.BOOKS)
    .list(`${familyId}/${bookId}`);

  if (bookFiles && bookFiles.length > 0) {
    const paths = bookFiles.map(f => `${familyId}/${bookId}/${f.name}`);
    await supabase.storage.from(BUCKETS.BOOKS).remove(paths);
    
    // Also check pages subfolder
    const { data: pageFiles } = await supabase.storage
      .from(BUCKETS.BOOKS)
      .list(`${familyId}/${bookId}/pages`);
    
    if (pageFiles && pageFiles.length > 0) {
      const pagePaths = pageFiles.map(f => `${familyId}/${bookId}/pages/${f.name}`);
      await supabase.storage.from(BUCKETS.BOOKS).remove(pagePaths);
    }
  }

  // Delete narrations
  const { data: narrationFiles } = await supabase.storage
    .from(BUCKETS.AUDIO)
    .list(`${familyId}/narrations/${bookId}`);

  if (narrationFiles && narrationFiles.length > 0) {
    const narrationPaths = narrationFiles.map(f => `${familyId}/narrations/${bookId}/${f.name}`);
    await supabase.storage.from(BUCKETS.AUDIO).remove(narrationPaths);
  }

  return true;
}

// ============================================
// UTILITY: Download image from URL and persist to storage
// (Used when FLUX returns a temporary URL)
// ============================================

export async function persistImageFromUrl(
  imageUrl: string,
  familyId: string,
  bookId: string,
  type: 'cover' | 'page',
  pageNumber?: number
): Promise<string | null> {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Failed to fetch image');
    
    const blob = await response.blob();
    
    // Determine path
    const path = type === 'cover' 
      ? bookCoverPath(familyId, bookId)
      : bookPagePath(familyId, bookId, pageNumber || 1);
    
    // Upload to Supabase
    const supabase = getSupabaseClient();
    const { error } = await supabase.storage
      .from(BUCKETS.BOOKS)
      .upload(path, blob, { 
        upsert: true,
        contentType: 'image/webp'
      });

    if (error) throw error;

    // Return signed URL
    const { data } = await supabase.storage
      .from(BUCKETS.BOOKS)
      .createSignedUrl(path, 86400);

    return data?.signedUrl || null;
  } catch (error) {
    console.error('Persist image error:', error);
    return null;
  }
}

// ============================================
// BATCH URL REFRESH
// Get fresh signed URLs for all pages of a book
// ============================================

export async function refreshBookUrls(
  familyId: string,
  bookId: string,
  pageCount: number
): Promise<{ cover: string | null; pages: (string | null)[] }> {
  const supabase = getSupabaseClient();
  
  // Get cover URL
  const coverPath = bookCoverPath(familyId, bookId);
  const { data: coverData } = await supabase.storage
    .from(BUCKETS.BOOKS)
    .createSignedUrl(coverPath, 86400);
  
  // Get page URLs
  const pageUrls: (string | null)[] = [];
  for (let i = 1; i <= pageCount; i++) {
    const pagePath = bookPagePath(familyId, bookId, i);
    const { data: pageData } = await supabase.storage
      .from(BUCKETS.BOOKS)
      .createSignedUrl(pagePath, 86400);
    pageUrls.push(pageData?.signedUrl || null);
  }
  
  return {
    cover: coverData?.signedUrl || null,
    pages: pageUrls
  };
}
