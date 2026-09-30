#!/usr/bin/env python3
"""
Populate the SF6 Frame Data Sheet from src/data/capcom/*.json.

Layout:
  · "All Moves" tab — flat overview with a Character column (great for
    cross-character filtering via the Google Table's filter chips).
  · One tab per character (Ken, Ryu, …) — narrower per-character view.
  · Every tab gets: purple header, frozen top row, sized columns,
    and a real Google Table for the filter chips + banding.

Uses the google-sheets-service-account skill's guarded client — writes
can only reach IDs listed in ~/.config/sf6-sheets/targets.json.

Idempotent: preflight wipes bandings/tables/filters, then rewrites.
Everything ships in ~6 API calls total to stay well under the 60/min quota.

    npm run populate-sheet
    # or
    GSHEETS_CONFIG=~/.config/sf6-sheets python3 scripts/populate-sheet.py
"""
from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

# Make the skill's client importable
sys.path.insert(0, str(Path.home() / ".claude/skills/google-sheets-service-account/scripts"))
from sheets_client import open_target  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
CAPCOM = ROOT / "src/data/capcom"
ANNOT = ROOT / "src/data/annotations"

FLAT_TAB = "All Moves"
CATEGORY_LABEL = {
    "normal": "Normal",
    "unique": "Unique",
    "target_combo": "Target Combo",
    "throw": "Throw",
    "special": "Special",
    "super": "Super",
}
FLAT_HEADERS = [
    "Character", "Category", "Move", "Notation", "Input", "Str",
    "Damage", "Startup", "Active", "Recovery", "Total",
    "On Block", "On Hit", "Cancel", "Hit Level",
]
FLAT_WIDTHS = [110, 105, 240, 100, 160, 45, 70, 70, 70, 80, 60, 80, 70, 70, 90]

CHAR_HEADERS = [
    "Category", "Move", "Notation", "Input", "Str",
    "Damage", "Startup", "Active", "Recovery", "Total",
    "On Block", "On Hit", "Cancel", "Hit Level",
]
CHAR_WIDTHS = [105, 240, 100, 160, 45, 70, 70, 70, 80, 60, 80, 70, 70, 90]

PURPLE = {"red": 0.486, "green": 0.227, "blue": 0.929}
WHITE = {"red": 1, "green": 1, "blue": 1}


def load_characters() -> list[dict]:
    chars = []
    for f in sorted(CAPCOM.glob("*.json")):
        capcom = json.loads(f.read_text())
        annot = None
        annot_path = ANNOT / f.name
        if annot_path.exists():
            annot = json.loads(annot_path.read_text())
        display = (
            (annot or {}).get("character", {}).get("displayName")
            or (annot or {}).get("character", {}).get("name")
            or capcom.get("character", {}).get("title")
            or capcom.get("id")
        )
        chars.append({"id": capcom.get("id"), "displayName": display, "capcom": capcom})
    chars.sort(key=lambda c: c["displayName"])
    return chars


def _cell(v):
    return "" if v is None else v


def _move_row(m: dict, with_character: str | None = None) -> list:
    fd = m.get("frameData") or {}
    fa = m.get("frameAdvantage") or {}
    props = m.get("properties") or {}
    level = m.get("level") or ""
    if level not in ("L", "M", "H"):
        level = ""
    row = [
        CATEGORY_LABEL.get(m.get("category"), m.get("category") or ""),
        m.get("displayName") or "",
        m.get("notation") or "",
        m.get("input") or "",
        level,
        m.get("damage"),
        fd.get("startup"),
        fd.get("active") or fd.get("activeRange"),
        fd.get("recovery"),
        fd.get("total"),
        fa.get("onBlock"),
        fa.get("onHit"),
        props.get("cancelFlags") or "",
        props.get("hitLevel") or "",
    ]
    if with_character is not None:
        row.insert(0, with_character)
    return [_cell(v) for v in row]


def build_flat_rows(characters: list[dict]) -> list[list]:
    rows = []
    for c in characters:
        moves = list((c["capcom"].get("moves") or {}).values())
        moves.sort(key=lambda m: (m.get("category") or "", m.get("displayName") or ""))
        rows.extend(_move_row(m, with_character=c["displayName"]) for m in moves)
    return rows


def build_char_rows(character: dict) -> list[list]:
    moves = list((character["capcom"].get("moves") or {}).values())
    moves.sort(key=lambda m: (m.get("category") or "", m.get("displayName") or ""))
    return [_move_row(m) for m in moves]


def format_reqs_for(sheet_id: int, row_count: int, headers: list[str], widths: list[int]) -> list:
    reqs = []
    # Resize grid to fit exactly (nicer visual — no infinite blank rows below)
    reqs.append({
        "updateSheetProperties": {
            "properties": {
                "sheetId": sheet_id,
                "gridProperties": {
                    "rowCount": row_count + 1,  # +1 for header
                    "columnCount": len(headers),
                    "frozenRowCount": 1,
                },
            },
            "fields": "gridProperties(rowCount,columnCount,frozenRowCount)",
        }
    })
    # Column widths
    for i, w in enumerate(widths):
        reqs.append({
            "updateDimensionProperties": {
                "range": {"sheetId": sheet_id, "dimension": "COLUMNS",
                          "startIndex": i, "endIndex": i + 1},
                "properties": {"pixelSize": w},
                "fields": "pixelSize",
            }
        })
    # Header row style
    reqs.append({
        "repeatCell": {
            "range": {"sheetId": sheet_id, "startRowIndex": 0, "endRowIndex": 1,
                      "startColumnIndex": 0, "endColumnIndex": len(headers)},
            "cell": {"userEnteredFormat": {
                "backgroundColor": PURPLE,
                "textFormat": {"bold": True, "foregroundColor": WHITE},
                "verticalAlignment": "MIDDLE",
                "horizontalAlignment": "LEFT",
                "padding": {"left": 8},
            }},
            "fields": "userEnteredFormat(backgroundColor,textFormat,"
                      "verticalAlignment,horizontalAlignment,padding)",
        }
    })
    return reqs


def sanitize_table_name(display: str) -> str:
    # Google Table names must be alphanumeric, start with a letter
    slug = re.sub(r"[^A-Za-z0-9]", "", display)
    if not slug or not slug[0].isalpha():
        slug = "T" + slug
    return slug + "Table"


def main():
    characters = load_characters()
    flat_rows = build_flat_rows(characters)
    per_char_rows = {c["displayName"]: build_char_rows(c) for c in characters}
    print(f"Loaded {len(characters)} characters, {len(flat_rows)} total moves")

    t = open_target("sf6")
    sh = t._sh
    print(f"Target: {t.title!r} (id={t.id})")

    # Snapshot current state — explicit fields so tables/bandings/filter are included
    meta = sh.fetch_sheet_metadata(params={
        "fields": "sheets(properties,bandedRanges,tables,basicFilter)"
    })
    existing = {sm["properties"]["title"]: sm for sm in meta.get("sheets", [])}

    # Preflight: wipe all bandings/tables/filters (they persist across values.clear
    # and will conflict on the next addTable). tableId is a string per API spec.
    cleanup = []
    for sm in existing.values():
        sid = sm["properties"]["sheetId"]
        for br in sm.get("bandedRanges", []) or []:
            cleanup.append({"deleteBanding": {"bandedRangeId": br["bandedRangeId"]}})
        for tbl in sm.get("tables", []) or []:
            cleanup.append({"deleteTable": {"tableId": str(tbl["tableId"])}})
        if "basicFilter" in sm:
            cleanup.append({"clearBasicFilter": {"sheetId": sid}})
    if cleanup:
        print(f"Preflight: clearing {len(cleanup)} prior banding/filter/table")
        # Delete tables FIRST (they contain bandings implicitly). If any single
        # delete fails, retry them one at a time so a stale entry doesn't kill
        # the whole cleanup batch.
        try:
            sh.batch_update({"requests": cleanup})
        except Exception as e:
            print(f"  batch cleanup failed ({str(e)[:120]}) — retrying individually")
            for req in cleanup:
                try:
                    sh.batch_update({"requests": [req]})
                except Exception as ie:
                    print(f"  skip: {list(req.keys())[0]} — {str(ie)[:80]}")

    # Rename "Sheet1" to FLAT_TAB if that's still the default
    if "Sheet1" in existing and FLAT_TAB not in existing:
        sh.worksheet("Sheet1").update_title(FLAT_TAB)
        existing[FLAT_TAB] = existing.pop("Sheet1")

    # Add any missing tabs (flat + per-character)
    all_char_names = [c["displayName"] for c in characters]
    all_needed = [FLAT_TAB] + all_char_names
    add_requests = []
    for name in all_needed:
        if name not in existing:
            add_requests.append({"addSheet": {"properties": {"title": name}}})
    if add_requests:
        print(f"Creating {len(add_requests)} new tabs")
        sh.batch_update({"requests": add_requests})

    # Refetch to pick up new IDs
    meta = sh.fetch_sheet_metadata()
    all_sheets = {sm["properties"]["title"]: sm["properties"] for sm in meta.get("sheets", [])}
    tab_id = {name: props["sheetId"] for name, props in all_sheets.items()}

    # Delete tabs no longer needed (e.g. if roster shrank)
    delete_requests = []
    for name, sid in tab_id.items():
        if name not in all_needed:
            delete_requests.append({"deleteSheet": {"sheetId": sid}})
    if delete_requests:
        # Can't delete the only remaining tab — but we're keeping >=1 always
        print(f"Deleting {len(delete_requests)} unused tabs")
        sh.batch_update({"requests": delete_requests})
        meta = sh.fetch_sheet_metadata()
        all_sheets = {sm["properties"]["title"]: sm["properties"] for sm in meta.get("sheets", [])}
        tab_id = {name: props["sheetId"] for name, props in all_sheets.items()}

    # Reorder: flat first, then characters alphabetically
    reorder = []
    for i, name in enumerate(all_needed):
        if name in tab_id:
            reorder.append({
                "updateSheetProperties": {
                    "properties": {"sheetId": tab_id[name], "index": i},
                    "fields": "index",
                }
            })
    if reorder:
        sh.batch_update({"requests": reorder})

    # Clear + write ALL tabs in two batched calls (one clear, one write)
    print("Clearing all tabs…")
    sh.values_batch_clear(params={"ranges": [f"'{name}'" for name in all_needed]})

    print(f"Writing {len(all_needed)} tabs in one batch…")
    value_updates = [{
        "range": f"'{FLAT_TAB}'!A1",
        "values": [FLAT_HEADERS] + flat_rows,
    }]
    for name in all_char_names:
        value_updates.append({
            "range": f"'{name}'!A1",
            "values": [CHAR_HEADERS] + per_char_rows[name],
        })
    sh.values_batch_update({
        "valueInputOption": "USER_ENTERED",
        "data": value_updates,
    })

    # Formatting: sizes, freeze, widths, header style — for every tab
    print("Applying formatting…")
    fmt_reqs = format_reqs_for(tab_id[FLAT_TAB], len(flat_rows), FLAT_HEADERS, FLAT_WIDTHS)
    for name in all_char_names:
        fmt_reqs.extend(format_reqs_for(
            tab_id[name], len(per_char_rows[name]), CHAR_HEADERS, CHAR_WIDTHS))
    sh.batch_update({"requests": fmt_reqs})

    # Google Tables — one per tab
    print(f"Creating {len(all_needed)} Google Tables…")
    table_reqs = [{
        "addTable": {"table": {
            "name": "AllMovesTable",
            "range": {"sheetId": tab_id[FLAT_TAB], "startRowIndex": 0,
                      "endRowIndex": len(flat_rows) + 1,
                      "startColumnIndex": 0, "endColumnIndex": len(FLAT_HEADERS)},
        }}
    }]
    for name in all_char_names:
        table_reqs.append({
            "addTable": {"table": {
                "name": sanitize_table_name(name),
                "range": {"sheetId": tab_id[name], "startRowIndex": 0,
                          "endRowIndex": len(per_char_rows[name]) + 1,
                          "startColumnIndex": 0, "endColumnIndex": len(CHAR_HEADERS)},
            }}
        })
    try:
        sh.batch_update({"requests": table_reqs})
        print(f"  ✓ {len(table_reqs)} Google Tables created")
    except Exception as e:
        print(f"  ⚠ addTable batch failed ({str(e)[:200]})")

    # Sanity: read back one character's header + first row
    sample = characters[len(characters) // 2]["displayName"]
    got = t.values(sample, "A1:N2")
    print(f"\nVerification — {sample!r} A1:N2:")
    for r in got:
        print(f"  {r}")

    print(f"\nDone. https://docs.google.com/spreadsheets/d/{t.id}/edit")


if __name__ == "__main__":
    if "GSHEETS_CONFIG" not in os.environ:
        os.environ["GSHEETS_CONFIG"] = str(Path.home() / ".config/sf6-sheets")
    main()
