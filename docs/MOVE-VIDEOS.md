# Move videos

Every move card can show a demo clip. Clips are **never committed to git** — they live in Supabase
Storage (bucket `move-videos`, public read, project `sf6-session-lab`). Git only holds small manifests.

## Source priority (src/data/characters/loader.js)
1. annotation `video` (hand-placed local file)
2. manifest `storageUrl` (our Storage copy)
3. manifest `url` (Capcom's file, hotlinked) — toggle with `USE_CAPCOM_URL_FALLBACK` in `src/data/videoConfig.js`

Naming: `<char>_<move>.mp4`, e.g. `ken_chin_buster.mp4`, `ken_hadoken_l.mp4`.

## A. Map moves → Capcom videos (manifest)
GitHub → Actions → **Sync move videos** → Run workflow (blank chars = Ken + most-faced roster; `all` = everyone).
Merge the PR it opens. Local: `node scripts/sync/scrape-videos.mjs --chars=ken`.
The scraper's selectors are modelled on the frame-data scraper and have not been verified against live
Capcom markup: if a run finds no videos, rerun with **probe** on and read the `video-out` artifact.

## B. Copy them into Storage (optional)
Add repo secret `SUPABASE_SERVICE_KEY` (Supabase → Project Settings → API → service_role), then run the workflow
with **download** on (or `--download` locally). Re-runs skip files already uploaded (`--force` to redo).
Note: Capcom's videos are their copyrighted media; self-hosting them is a decision for the owner.

## C. Record your own movelist and cut it up
1. Record the in-game movelist playback as one long capture.
2. `node scripts/video/cut-clips.mjs --char=ken --input=ken-movelist.mov --detect` drafts `ken-cuts.csv`
   (scene changes, names pre-filled in Capcom movelist order).
3. Fix the names/times in the CSV (`move,start,end`, seconds or mm:ss.s).
4. `node scripts/video/cut-clips.mjs --char=ken --input=ken-movelist.mov --cuts=ken-cuts.csv` → `video-out/ken/*.mp4`
   (H.264, no audio, 480p, ~100 KB each). Add `--upload` (with `SUPABASE_SERVICE_KEY`) to push to Storage and
   update `src/data/videos/ken.json`; commit that manifest.
Needs `ffmpeg` installed locally.
