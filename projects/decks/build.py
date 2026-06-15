#!/usr/bin/env python3
"""
Build Focus Finder Media sponsorship decks.

  python3 build.py              # build every sponsor in data/sponsors/
  python3 build.py ecoflow      # build just one (by filename, no .json)

Reads:  template/deck.html.j2  +  data/global.json  +  data/sponsors/*.json
Writes: decks/<sponsor-key>.html   (asset paths stay relative to decks/)
"""
import json
import sys
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

ROOT = Path(__file__).resolve().parent
TEMPLATE_DIR = ROOT / "template"
DATA_DIR = ROOT / "data"
SPONSOR_DIR = DATA_DIR / "sponsors"
OUT_DIR = ROOT / "decks"

# rich-link thumbnail (Open Graph) — standard 1200x630
OG_W, OG_H = 1200, 630
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_BLACK = "/System/Library/Fonts/Supplemental/Arial Black.ttf"


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def build_og_image(sponsor, out_path):
    """Generate a branded 1200x630 rich-link thumbnail. No-op if Pillow missing."""
    try:
        from PIL import Image, ImageDraw, ImageFont, ImageEnhance
    except ImportError:
        print("    (skipped thumbnail: Pillow not installed)")
        return False

    og = sponsor.get("og")
    if not og:
        return False
    base_path = OUT_DIR / og["baseImage"]
    if not base_path.exists():
        print(f"    (skipped thumbnail: missing base image {og['baseImage']})")
        return False

    accent = hex_to_rgb(sponsor.get("accent", "#c9ff4f"))

    # cover-crop the base image to 1200x630
    img = Image.open(base_path).convert("RGB")
    scale = max(OG_W / img.width, OG_H / img.height)
    img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    left = (img.width - OG_W) // 2
    top = (img.height - OG_H) // 2
    img = img.crop((left, top, left + OG_W, top + OG_H))

    # darken, then deepen the bottom for text legibility
    img = ImageEnhance.Brightness(img).enhance(0.55)
    grad = Image.new("L", (1, OG_H), 0)
    for y in range(OG_H):
        grad.putpixel((0, y), int(200 * (y / OG_H) ** 1.5))
    grad = grad.resize((OG_W, OG_H))
    shade = Image.new("RGB", (OG_W, OG_H), (0, 0, 0))
    img = Image.composite(shade, img, grad)

    draw = ImageDraw.Draw(img)
    kicker_font = ImageFont.truetype(FONT_BOLD, 34)
    title_font = ImageFont.truetype(FONT_BLACK, 92)

    # kicker (accent, top-left)
    draw.text((64, 60), og.get("kicker", ""), font=kicker_font, fill=accent)

    # headline (white, bottom-left, multi-line)
    lines = og.get("headline", "").split("\n")
    line_h = 104
    block_h = line_h * len(lines)
    y = OG_H - 64 - block_h
    for line in lines:
        draw.text((64, y), line, font=title_font, fill=(255, 255, 255))
        y += line_h

    img.save(out_path, "JPEG", quality=88)
    return True


def act_names(g, sponsor):
    """Nav-label sequence used by the scroll-position indicator (one per act)."""
    return [
        sponsor["navLabel"],
        g["founder"]["eyebrow"],
        g["team"]["eyebrow"],
        g["work"]["eyebrow"],
        g["audience"]["label"],
        g["expedition"]["label"],
        sponsor["challenge"]["label"],
        sponsor["solution"]["label"],
        sponsor["partnership"]["eyebrow"],
        sponsor["finalAsk"]["eyebrow"],
    ]


def main():
    # autoescape OFF: JSON values intentionally contain inline HTML (<br>, &amp;, <i>)
    env = Environment(loader=FileSystemLoader(str(TEMPLATE_DIR)), autoescape=False)
    template = env.get_template("deck.html.j2")
    g = load_json(DATA_DIR / "global.json")

    only = sys.argv[1:]
    sponsor_files = sorted(SPONSOR_DIR.glob("*.json"))
    if only:
        wanted = {name.removesuffix(".json") for name in only}
        sponsor_files = [p for p in sponsor_files if p.stem in wanted]
        missing = wanted - {p.stem for p in sponsor_files}
        for m in missing:
            print(f"  ! no sponsor config found: data/sponsors/{m}.json")

    if not sponsor_files:
        print("Nothing to build.")
        return 1

    OUT_DIR.mkdir(exist_ok=True)
    for path in sponsor_files:
        sponsor = load_json(path)
        key = sponsor.get("key", path.stem)
        html = template.render(g=g, sponsor=sponsor, act_names=act_names(g, sponsor))
        out = OUT_DIR / f"{key}.html"
        out.write_text(html, encoding="utf-8")
        print(f"  ✓ {path.name:24s} -> decks/{key}.html")

        og_out = OUT_DIR / f"assets/web/og-{key}.jpg"
        if build_og_image(sponsor, og_out):
            print(f"  ✓ {'':24s} -> decks/assets/web/og-{key}.jpg")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
