#!/usr/bin/env node
// Placeholder for the future automated frame-data sync.
//
// The intended pipeline is documented in:
//   docs/_handoff-2026-04-24/08-DATA-PIPELINE-RESEARCH.md
//
// Capcom's frame data values are not present in the page HTML — they're
// fetched at runtime by client-side JS. A real sync needs Playwright to
// hydrate the page and read the rendered table. That is deferred until
// we hit one of the triggers listed in the research doc:
//   - Roster expansion past ~12 chars
//   - Monthly verification of a 20+ char roster
//   - User-facing "auto-updating frame data" feature
//
// Until then, frame data is hand-keyed into src/data/capcom/*.json using
// the schema established by the migration. Run this script to be told
// what to do.

console.log(`
Auto-scrape not implemented yet.

Adding a new character — write two files:

  src/data/capcom/<name>.json
    Frame data only. Schema:
    {
      "id": "<name>",
      "moves": {
        "<move_id>": {
          "damage": 300,
          "frameData": { "startup": 4, "active": 3, "recovery": 7, "total": 14 },
          "frameAdvantage": { "onBlock": -1, "onHit": 4 },
          "properties": { "hitLevel": "high", "cancelable": true }
        }
      }
    }

  src/data/annotations/<name>.json
    Tactical content (Thanh's IP). Schema:
    {
      "character": { id, name, displayName, archetype, ... },
      "tactics":   { neutral, offensive, combo, corner: { name, description, icon, moveIds } },
      "moves": {
        "<move_id>": {
          "id": "<move_id>",
          "displayName": "Standing Light Punch",
          "shortName": "5LP",
          "notation": "5LP",
          "input": "LP",
          "category": "normal",
          "yourPerspective": { tacticalUse, whenToUse, situations, range, connectsTo, executionDifficulty },
          "opponentPerspective": { riskLevel, riskDescription },
          "properties": { comboScaling },
          "tacticalTags": []
        }
      }
    }

Then add the character to:
  src/data/characters/index.js  — exports + characterList[]

The merged Character object is built at runtime by loader.js — no build step needed.

Plan for replacing this placeholder:
  docs/_handoff-2026-04-24/08-DATA-PIPELINE-RESEARCH.md (§ "Future: when to build the auto-scrape")
`);
