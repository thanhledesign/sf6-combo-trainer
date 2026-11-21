#!/usr/bin/env node
// Cut one long movelist recording into named, web-ready clips.
//
//   node scripts/video/cut-clips.mjs --char=ken --input=ken-movelist.mov --cuts=cuts.csv [--out=video-out/ken] [--upload]
//   node scripts/video/cut-clips.mjs --char=ken --input=ken-movelist.mov --detect      # drafts cuts.csv for you
//
// cuts.csv:   move,start,end      (times as seconds or mm:ss.s; header row optional)
//   Chin Buster,0:03.2,0:05.8
//   Hadoken L,0:07,0:09.4
// Output: <char>_<move>.mp4 (e.g. ken_chin_buster.mp4): H.264, no audio, 480p-ish, fast-start.
// --upload sends each clip to Supabase Storage (needs SUPABASE_SERVICE_KEY) and records it in
// src/data/videos/<char>.json so the app picks it up (storage beats Capcom's hotlink).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { clipName, publicUrl, uploadToStorage } from '../sync/lib/videos.mjs';

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, ...v] = a.replace(/^--/, '').split('=');
  return [k, v.length ? v.join('=') : true];
}));
const { char, input } = args;
if (!char || !input) {
  console.error('Usage: --char=ken --input=recording.mov (--cuts=cuts.csv | --detect) [--out=dir] [--height=480] [--crf=24] [--upload]');
  process.exit(1);
}
const out = args.out || path.join('video-out', char);
const height = Number(args.height || 480);
const crf = String(args.crf || 24);

const toSec = t => {
  const s = String(t).trim();
  if (!s.includes(':')) return Number(s);
  return s.split(':').reduce((acc, p) => acc * 60 + Number(p), 0);
};
const ff = (a, opts = {}) => spawnSync('ffmpeg', ['-hide_banner', '-y', ...a], { encoding: 'utf8', ...opts });

// --detect: find scene changes / quiet gaps, write a draft CSV with move names from the Capcom movelist order
if (args.detect) {
  const r = ff(['-i', input, '-vf', `select='gt(scene,${args.threshold || 0.25})',showinfo`, '-f', 'null', '-']);
  const times = [...r.stderr.matchAll(/pts_time:([\d.]+)/g)].map(m => Number(m[1]));
  const dur = Number((spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', input], { encoding: 'utf8' }).stdout || '0').trim());
  const bounds = [0, ...times, dur].filter((t, i, a) => i === 0 || t - a[i - 1] > 0.8);
  let names = [];
  try {
    const cap = JSON.parse(fs.readFileSync(`src/data/capcom/${char}.json`, 'utf8'));
    names = Object.values(cap.moves || {}).map(m => m.displayName || m.name).filter(Boolean);
  } catch { /* no capcom file: leave names blank */ }
  const rows = ['move,start,end'];
  for (let i = 0; i < bounds.length - 1; i++) rows.push(`${names[i] || `clip ${i + 1}`},${bounds[i].toFixed(2)},${bounds[i + 1].toFixed(2)}`);
  const file = args.cuts || `${char}-cuts.csv`;
  fs.writeFileSync(file, rows.join('\n') + '\n');
  console.log(`Wrote ${file} with ${rows.length - 1} draft cuts. Fix names/times, then re-run with --cuts=${file}`);
  process.exit(0);
}

if (!args.cuts) { console.error('Need --cuts=cuts.csv (or --detect to draft one)'); process.exit(1); }
const cuts = fs.readFileSync(args.cuts, 'utf8').split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  .map(l => l.split(',').map(s => s.trim()))
  .filter(([, s]) => s && !/^start$/i.test(s))
  .map(([move, start, end]) => ({ move, start: toSec(start), end: toSec(end) }));

fs.mkdirSync(out, { recursive: true });
const made = [];
for (const c of cuts) {
  if (!(c.end > c.start)) { console.warn(`skip "${c.move}": end must be after start`); continue; }
  const file = clipName(char, c.move);
  const dest = path.join(out, file);
  const r = ff(['-ss', String(c.start), '-i', input, '-t', String(c.end - c.start), '-an',
    '-vf', `scale=-2:${height}`, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', crf,
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', dest]);
  if (r.status !== 0) { console.warn(`ffmpeg failed for "${c.move}"`); continue; }
  console.log(`${file}  ${(fs.statSync(dest).size / 1024).toFixed(0)} KB`);
  made.push({ move: c.move, file, dest });
}

if (args.upload) {
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!key) { console.error('--upload needs SUPABASE_SERVICE_KEY in the environment'); process.exit(1); }
  const mfile = `src/data/videos/${char}.json`;
  const manifest = fs.existsSync(mfile) ? JSON.parse(fs.readFileSync(mfile, 'utf8')) : { id: char, moves: {} };
  const cap = fs.existsSync(`src/data/capcom/${char}.json`) ? JSON.parse(fs.readFileSync(`src/data/capcom/${char}.json`, 'utf8')) : { moves: {} };
  const { matchVideos } = await import('../sync/lib/videos.mjs');
  for (const m of made) {
    const p = `${char}/${m.file}`;
    await uploadToStorage(p, fs.readFileSync(m.dest), 'video/mp4', key);
    const matched = matchVideos([{ name: m.move, url: publicUrl(p) }], cap.moves || {});
    for (const [id, v] of Object.entries(matched.moves)) {
      manifest.moves[id] = { ...(manifest.moves[id] || {}), name: v.name, storageUrl: publicUrl(p), file: m.file };
    }
    if (!Object.keys(matched.moves).length) console.warn(`uploaded but no Capcom move matched "${m.move}"`);
  }
  fs.mkdirSync('src/data/videos', { recursive: true });
  fs.writeFileSync(mfile, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Updated ${mfile}`);
}
