# Move videos

Normals use button/arrow icons (public/buttons). Other moves can show a demo clip recorded by us.
Clips are **never committed to git** — they live in Supabase Storage (bucket `move-videos`, public read,
project `sf6-session-lab`); git only holds small manifests (`src/data/videos/<char>.json`).

The Capcom-video scraper was removed (copyright/hotlink risk, untested selectors). Own recordings only.

## Source priority (src/data/characters/loader.js)
1. annotation `video` (hand-placed local file)
2. manifest `storageUrl` (our Storage copy)
3. manifest `url` — only if `USE_CAPCOM_URL_FALLBACK` (src/data/videoConfig.js) is true; off.

Naming: `<char>_<move>.mp4`, e.g. `ken_chin_buster.mp4`, `ken_hadoken_l.mp4`.

## Record your own movelist and cut it up
1. Record one long capture per character, moves in Capcom movelist order, short neutral pause between moves.
2. `node scripts/video/cut-clips.mjs --char=ken --input=ken-movelist.mov --detect` drafts `ken-cuts.csv`.
3. Fix names/times in the CSV (`move,start,end`, seconds or mm:ss.s).
4. `node scripts/video/cut-clips.mjs --char=ken --input=ken-movelist.mov --cuts=ken-cuts.csv` → `video-out/ken/*.mp4`
   (H.264, no audio, 480p). Add `--upload` (needs `SUPABASE_SERVICE_KEY`) to push to Storage and update the manifest.
Needs `ffmpeg` locally.
