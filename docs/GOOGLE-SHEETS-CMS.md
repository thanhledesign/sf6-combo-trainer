# Google Sheets CMS Setup Guide

## Overview

The SF6 Combo Trainer can pull frame data from your Google Sheet in real-time, with automatic fallback to static JSON data if the sheet is unavailable.

**Your Sheet:** https://docs.google.com/spreadsheets/d/1Z1InqW1dISE5kgDJWM47PF_gznjt7zJhw4_3LyriSpE/edit

---

## Step 1: Publish Your Sheet to the Web

1. Open your Google Sheet
2. Go to **File → Share → Publish to web**
3. In the dialog:
   - **Link**: Select "Entire Document" or specific tabs
   - **Embed**: Select "Comma-separated values (.csv)"
4. Click **Publish**
5. Copy the link (you'll need this to verify)

**Important:** The sheet must be publicly accessible (at least to anyone with the link) for the app to fetch data.

---

## Step 2: Get Tab GIDs

Each character tab in your sheet has a unique GID. You'll need to update the config with these.

### How to find a GID:
1. Click on a character tab (e.g., "Ken")
2. Look at the URL - it will look like:
   ```
   https://docs.google.com/spreadsheets/d/1Z1InqW1dISE5kgDJWM47PF_gznjt7zJhw4_3LyriSpE/edit#gid=123456789
   ```
3. The number after `#gid=` is the GID (e.g., `123456789`)

### Update the config:

Edit `src/utils/sheetsData.js` and update the `CHARACTER_GIDS` object:

```javascript
const CHARACTER_GIDS = {
  ken: '0',           // First tab is usually GID 0
  ryu: '123456789',   // Replace with actual GID
  terry: '987654321', // Replace with actual GID
  chunli: '...',
  luke: '...',
  cammy: '...',
  mai: '...',
};
```

---

## Step 3: Sheet Column Format

Your sheet should have these columns (in order):

| Column | Field | Example |
|--------|-------|---------|
| A | Move Name | Standing Light Punch |
| B | Start-up Frames | 4 |
| C | Active Frames | 4-6 |
| D | Recovery Frames | 7 |
| E | Hit Recovery (On Hit) | 4 |
| F | Block Recovery (On Block) | -1 |
| G | Cancel | Cancelable |
| H | Damage | 300 |
| I | Combo Scaling | Starter scaling 20% |
| J | Drive Gauge Increase on Hit | 250 |
| K | Drive Gauge Decrease on Block | -500 |
| L | Drive Gauge Decrease on Punish Counter | -2000 |
| M | Super Art Gauge Increase | 300 |
| N | Properties | High |
| O | Misc | Can be rapid canceled |

### Section Headers

Include section headers like:
- `Normal Moves (19)`
- `Unique Attacks (7)`
- `Special Moves (34)`
- `Super Arts (4)`
- `Throws (2)`
- `Common Moves (10)`

These help the app categorize moves correctly.

---

## Step 4: Test the Connection

1. Run the app locally: `npm run dev`
2. Open browser console (F12)
3. Look for messages like:
   - `✓ Loaded Ken from sheets` (success)
   - `⚠ Sheets fetch failed, using static` (fallback)

---

## Configuration Options

In `src/hooks/useCharacterData.js`:

```javascript
// Set to false to disable sheets entirely (use static only)
const USE_SHEETS_PRIMARY = true;

// Timeout before falling back to static data
const SHEETS_TIMEOUT = 5000; // 5 seconds
```

---

## How It Works

1. **App loads** → Tries to fetch from Google Sheets
2. **Success** → Uses sheet data, caches for 5 minutes
3. **Failure/Timeout** → Falls back to static JSON data
4. **Refresh** → User can force refresh from sheets

### Data Flow:

```
User opens app
      ↓
Check if GID configured for character
      ↓ yes                    ↓ no
Fetch from Google Sheets    Use static JSON
      ↓
Parse CSV → Transform to app format
      ↓
Cache in memory (5 min)
      ↓
Display in UI
```

---

## Troubleshooting

### "Failed to fetch sheet"
- Make sure sheet is published to web
- Check that the GID is correct
- Verify sheet is not private

### "No data for character"
- GID not configured in `sheetsData.js`
- Tab might be empty or have wrong format

### Data looks wrong
- Check column order matches expected format
- Verify header row is on row 3
- Check for section headers

---

## Updating Data

Once set up, you can update frame data by:
1. Edit your Google Sheet
2. Wait ~5 minutes for cache to expire
3. Refresh the app

Or use the refresh button (if implemented) to force reload.

---

## Benefits

✅ **Real-time updates** - Change data in sheets, see it in app  
✅ **No code changes** - Update frame data without deploying  
✅ **Collaborative** - Multiple people can edit the sheet  
✅ **Version history** - Google Sheets tracks all changes  
✅ **Fallback safety** - Static data if sheets unavailable  

---

*Last updated: December 2, 2025*
