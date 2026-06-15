# Focus Finder Media — Sponsorship Decks

A cinematic, scroll-driven sponsorship deck (Acts I–X) that we re-skin per sponsor.
One template + JSON content = consistent decks you can produce in seconds.

## TL;DR

```bash
python3 build.py                 # build every sponsor
python3 build.py ecoflow         # build just one (filename without .json)
```

Output lands in `decks/<sponsor-key>.html` plus a matching rich-link thumbnail
at `decks/assets/web/og-<sponsor-key>.jpg`.

## How it's organized

```
build.py                     ← the build script (run this)
template/deck.html.j2        ← the deck layout (HTML/CSS/JS) — edit ONCE for all decks
data/
  global.json                ← Focus Finder Media facts (shared by EVERY deck)
  sponsors/<brand>.json      ← one file per sponsor — the stuff that swaps
decks/<brand>.html           ← generated output (do not hand-edit; rebuild instead)
decks/assets/                ← images, video, textures (shared by all decks)
```

### Global vs. sponsor — what goes where

| Edit in `data/global.json` (changes everywhere) | Edit in `data/sponsors/<brand>.json` (per deck) |
|---|---|
| Founder bio + stats | Brand name + accent color |
| Crew members, handles, follower counts | Hero headline lines |
| Portfolio / "The Work" panels | Challenge section (nodes + quote) |
| Audience counters + demographics | Solution section (product, spec, spokes) |
| The Yosemite expedition (route + objectives) | Partnership copy + flow |
| Partnership metrics | Final Ask copy |
| Brand name (ticker, footer) | OG / rich-link title, description, thumbnail |

**Update a stat once in `global.json` → every deck reflects it on the next build.**

## Common tasks

**Change a number everywhere** (followers, monthly views, demographics):
edit `data/global.json`, then `python3 build.py`.

**Add a new sponsor:**
1. Copy an existing config, e.g. `cp data/sponsors/ecoflow.json data/sponsors/newbrand.json`
2. Edit `key`, `name`, `accent`, `meta`, `og`, and the Challenge/Solution/Partnership/Final-Ask copy.
3. `python3 build.py newbrand`

**Change layout, animation, or styling for all decks:** edit `template/deck.html.j2`, then rebuild.

## Thumbnails (Open Graph / rich link previews)

Each sponsor's `og` block drives an auto-generated 1200×630 thumbnail (built with Pillow):

```json
"og": {
  "baseImage": "assets/web/team-9224.jpg",   // any image under decks/assets/web
  "kicker": "FOCUS FINDER MEDIA",            // small line, uses the sponsor accent
  "headline": "EcoFlow\nSponsorship Deck"    // big headline; \n = line break
}
```

If Pillow isn't installed the HTML still builds; the thumbnail step is skipped with a note.

## Going live (hosting note)

`meta.image` in each sponsor config is a **relative** path, which is correct for the
deck running locally. For rich-link previews to render when hosted, change each
`meta.image` to an **absolute** `https://.../og-<brand>.jpg` URL — crawlers (iMessage,
Slack, X, etc.) don't resolve relative image paths or run JavaScript.

## Requirements

- Python 3.9+
- `jinja2` (templating) and `pillow` (thumbnails): `pip3 install jinja2 pillow`

## Current sponsors

Portable power: `ecoflow`, `anker-solix`, `bluetti`, `jackery`, `pecron`. DJI is listed separately as an ecosystem partner: `dji`.
Other categories: `cinema-lens` (starter / placeholder copy).

> `decks/ffm-experience.html`, `ffm-allies.html`, and `yosemite-batterypack.html` are
> older standalone files kept for reference and are **not** produced by this build.
