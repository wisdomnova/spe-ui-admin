import { supabase } from "./supabase";

/* ──────────────────────────────────────────────────
   Storage Utilities
   ────────────────────────────────────────────────── */

const BUCKET = "media";

/**
 * Upload a single file to Supabase Storage.
 * Returns the public URL.
 */
export async function uploadFile(
  file: File,
  folder: string = "uploads"
): Promise<string> {
  const ext = file.name.split(".").pop() || "bin";
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, { cacheControl: "31536000", upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

/**
 * Upload a base64 data URL string to Storage.
 * Returns the permanent public URL.
 */
export async function uploadBase64(
  dataUrl: string,
  folder: string = "blog-images"
): Promise<string> {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) throw new Error("Invalid base64 data URL");

  const mimeType = match[1];
  const ext = mimeType.split("/")[1] || "png";
  const base64 = match[2];

  // Convert base64 → Uint8Array
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, bytes, {
      contentType: mimeType,
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) throw new Error(`Base64 upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

/* ──────────────────────────────────────────────────
   Blog Content Processor - CRITICAL FOR FIDELITY
   
   Scans HTML from TipTap, finds any base64 <img> 
   sources, uploads them to permanent Storage, and 
   replaces the src with the permanent URL.
   
   Everything else (tags, classes, attributes, 
   styles, nesting) is preserved EXACTLY as-is.
   ────────────────────────────────────────────────── */

/**
 * Process blog HTML content before saving to DB.
 * - Finds all base64 image src attributes
 * - Uploads each to Supabase Storage
 * - Replaces base64 with permanent URL
 * - Returns the processed HTML (otherwise untouched)
 */
export async function processBlogContent(html: string): Promise<string> {
  // Match all base64 image sources in the HTML
  const base64Pattern = /src="(data:image\/[^"]+)"/g;
  const matches = [...html.matchAll(base64Pattern)];

  if (matches.length === 0) return html;

  let processed = html;

  // Upload all base64 images in parallel for speed
  const uploads = await Promise.all(
    matches.map(async (match) => {
      const base64Src = match[1];
      try {
        const permanentUrl = await uploadBase64(base64Src, "blog-images");
        return { original: base64Src, replacement: permanentUrl };
      } catch {
        // If upload fails, keep the original base64 (graceful degradation)
        console.error("Failed to upload embedded image, keeping base64");
        return { original: base64Src, replacement: base64Src };
      }
    })
  );

  // Replace each base64 source with its permanent URL
  for (const { original, replacement } of uploads) {
    processed = processed.replace(
      `src="${original}"`,
      `src="${replacement}"`
    );
  }

  return processed;
}

/**
 * Upload a cover image (File or base64 string) to Storage.
 */
export async function uploadCoverImage(
  image: File | string
): Promise<string> {
  if (typeof image === "string") {
    if (image.startsWith("data:")) {
      return uploadBase64(image, "covers");
    }
    // Already a URL - return as-is
    return image;
  }
  return uploadFile(image, "covers");
}

/**
 * Delete a file from storage by its public URL.
 */
export async function deleteStorageFile(publicUrl: string): Promise<void> {
  // Extract the path after /object/public/media/
  const marker = "/object/public/media/";
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;

  const filePath = publicUrl.slice(idx + marker.length);
  await supabase.storage.from(BUCKET).remove([filePath]);
}
