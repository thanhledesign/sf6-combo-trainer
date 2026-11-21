// Where a move's demo video comes from, in priority order:
//   1. annotation `video` (hand-placed local file, e.g. /videos/ken/chin_buster.mp4)
//   2. manifest `storageUrl` (file uploaded to our Supabase Storage bucket `move-videos`)
//   3. manifest `url` (Capcom's own file, hotlinked) — only if this flag is true.
// Hotlinking depends on Capcom's CDN staying open and is their copyrighted media; switch it
// off once the storage bucket is populated if you'd rather only serve files we host.
export const USE_CAPCOM_URL_FALLBACK = false;
