# 08 — Data Pipeline Research (2026-04-25)

Research conducted overnight to inform the "kill the Sheet" architecture (Option C from chat). Findings drove the implementation choices in `feat/data-pipeline`.

---

## Question 1: Does an existing maintained community dataset exist?

**Search results** (GitHub, npm, fan sites):

| Project | Stack | Verdict |
|---|---|---|
| `sagansfault/sf6fd` | Java (Maven), scrapes some unnamed source | Wrong language. Useless for our Node pipeline. |
| `racpsjcsp/SF6-FrameData` | SwiftUI iOS app with bundled JSON | Wrong shape — data is iOS-app-bundled, not a clean export. MIT licensed though. |
| `jrfrancisco1123/sf6_framedata` | Flask + Python `frame_data/{name}.py` files (29 chars, full roster) | **Most promising.** Python files, hand-maintained, covers full roster. Worth a follow-up to evaluate. |
| `jeff502/Street-Fighter-6-Frame-Data-Discord-Bot` | Discord bot | Consumes data, doesn't expose it. |
| `avivace/sfx-framedata` | SFV-era project | Obsolete (SFV, not SF6). |
| Ultimate Frame Data (ultimateframedata.com) | Hand-curated web app | No public API, hand-scraping unwise. |
| SuperCombo wiki (wiki.supercombo.gg) | MediaWiki | **Anubis bot-protection enabled** — proof-of-work challenge blocks programmatic access. Killed as a primary source. |

**Conclusion:** There's no clean drop-in npm package or stable JSON dataset to depend on. The closest match (`jrfrancisco1123/sf6_framedata`) is Python files that would still need parsing. Building our own pipeline is the realistic path.

## Question 2: Is Capcom's HTML scrapeable?

**Tested 2026-04-25** against `https://www.streetfighter.com/6/character/ken/frame`:

- HTML returns 200 OK with a browser User-Agent (no JS UA → 403)
- `__NEXT_DATA__` script tag exists (Next.js app), but only contains **i18n translation strings** — frame data values (startup, active, etc.) are NOT pre-rendered into the HTML
- `/_next/data/{buildId}/en-us/character/ken/frame.json` returns 200 with 206KB JSON — but this is the same translation namespaces, no numeric values
- The page-specific JS chunk (`chunks/pages/character/[name]/frame-*.js`, 2.5MB minified) is the rendering logic; the actual data is fetched at runtime by client-side JS
- Found 30 character frame namespaces (`character/frame/{name}`) in the data — confirms the full SF6 roster is enumerable via the labels alone

**Conclusion:** Capcom's frame data is **not extractable via simple HTML/JSON fetching**. To pull values from Capcom directly we would need to either:
1. Run a headless browser (Playwright/Puppeteer) and let the page hydrate, then scrape the rendered DOM
2. Reverse-engineer the runtime fetch endpoint(s) the client JS uses (likely possible but requires browser network capture)

Either path is a 1-2 day project, fragile to Capcom redesigns, and overkill for monthly updates of a small roster.

## Question 3: Is Supercombo wiki usable?

No — the wiki is gated behind Anubis (a JavaScript proof-of-work bot challenge). Programmatic access without a real browser is blocked. Same Playwright requirement as Capcom, with the added risk that the wiki content is community-edited and varies in completeness across pages.

## Question 4: Move ID stability

Capcom uses Japanese move names as canonical i18n keys (`[t]立ち弱P`, `[t]波動拳`) with localized display strings. The keys themselves are stable across versions — they're effectively the move's permanent identifier. **Good news for an eventual scraper:** Japanese key → stable join key for overrides/annotations. Bad news: keys are non-ASCII, awkward in JSON files we hand-edit. Pre-mapping them to ASCII slugs (`stand_lp`, `hadoken`) at scrape time keeps the rest of the pipeline ergonomic.

---

## Architecture decision (executed in this branch)

Given all four findings, the right answer is **Option C as designed, but with the auto-scrape deferred**:

1. **Migrate existing 7 character JSONs into the layered structure** — the schema split (Capcom-owned vs annotation-owned) is well-defined, so we can do this safely with a one-shot migration script. ✅ done in this branch.
2. **Build the merge module** so app consumers see identical objects to today, just sourced from the split files. ✅ done.
3. **Defer the auto-scrape** — when ready, the cleanest path is Playwright. Sketched below.
4. **Hand-key new characters** until the auto-scrape lands. With the new schema, adding Akuma/Bison/Sagat etc. is just creating two small JSON files per character (frame data + annotations), each ~100 lines. Mechanical, splittable across many small PRs.

## Future: when to build the auto-scrape

Deferred until at least one of:
- Roster expands past ~12 characters (hand-keying gets old at scale)
- Capcom ships a balance patch and you want monthly verification across 20+ chars
- You want to ship V01.40+ with auto-updating frame data as a feature

When that happens, the cleanest implementation is:

```
scripts/sync/
├── playwright-capture.mjs   ← spawns headless Chrome, hits each /frame page,
│                              reads the rendered <table> DOM, writes JSON
├── parse-table.mjs          ← extract numeric values, normalize to schema
├── ascii-slug-map.json      ← Japanese-key → english-slug join table
└── apply.mjs                ← writes data/capcom/*.json, opens auto-PR if changed
```

**Cost of running monthly**: GitHub Actions free tier covers it (Playwright run ~5min/character × 30 chars = ~2.5h, free for public repos). Local dev test: `npm run sync-data:dry` — no commit, just diff preview.

**Risks**: Capcom redesigns break the parser; Cloudflare / WAF blocks GH Actions IPs; rate limiting. Mitigation: detect parse failures, fall back to last-known-good, surface "sync failed" in PR description.

## What about the Sheet?

Already effectively dead. `grep -rE "(google|sheet|csv|fetch)" src/` returns nothing — there's no actual Sheet fetcher in the codebase. CLAUDE.md and several handoff docs reference it as if it existed, but the only real data path is static JSON imports. Tonight's branch removes the misleading references.

If you want a Sheet for *editing* annotations (e.g., for collaborators), that becomes a separate "annotation editor" project — write Sheet → export to `data/annotations/*.json` on demand. Different shape, different problem, deferred.
