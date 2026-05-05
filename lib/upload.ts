import { supabase } from "@/lib/supabase";

/**
 * Uploads a file to a Supabase bucket and returns the public or signed URL.
 * @param bucket - 'profile-photos' | 'expense-receipts'
 * @param path - e.g., 'members/123-photo.jpg'
 * @param file - The File object to upload
 */
export async function uploadFile(bucket: string, path: string, file: File) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
  });

  if (error) throw error;

  // For profile-photos (public bucket), get public URL
  if (bucket === "profile-photos") {
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrl;
  }

  // For private buckets (expenses), we might need data.path or create a signed URL later
  return data.path;
}

/**
 * Deletes a file from Supabase storage.
 */
export async function deleteFile(bucket: string, path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}
