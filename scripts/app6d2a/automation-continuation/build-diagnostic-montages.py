from __future__ import annotations

import csv
import hashlib
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path.cwd()
REMATCH = ROOT / "docs/mobile/app6d2a/automation-continuation/PRODUCTION_TAXONOMY_REMATCH.csv"
DISPOSITIONS = ROOT / "docs/mobile/app6d2a/automation-continuation/FULL_ASSET_DISPOSITIONS.csv"
OUT = ROOT / "artifacts/app6d2a-private/diagnostic-montages"

with REMATCH.open(encoding="utf-8-sig", newline="") as handle:
    rematch = list(csv.DictReader(handle))
with DISPOSITIONS.open(encoding="utf-8-sig", newline="") as handle:
    dispositions = {row["asset_id"]: row for row in csv.DictReader(handle)}

for row in rematch:
    row.update({"logical_archive": dispositions[row["asset_id"]]["logical_archive"]})

# Deterministic stratification across recommendation and source archive.
groups: dict[tuple[str, str], list[dict[str, str]]] = {}
for row in rematch:
    groups.setdefault((row["recommendation"], row["logical_archive"]), []).append(row)
for rows in groups.values():
    rows.sort(key=lambda row: hashlib.sha256(row["asset_id"].encode()).hexdigest())

sample: list[dict[str, str]] = []
ordered_groups = sorted(groups)
cursor = 0
while len(sample) < 100:
    key = ordered_groups[cursor % len(ordered_groups)]
    rows = groups[key]
    index = cursor // len(ordered_groups)
    if index < len(rows):
        sample.append(rows[index])
    cursor += 1

OUT.mkdir(parents=True, exist_ok=True)
font = ImageFont.load_default(size=18)
small = ImageFont.load_default(size=14)
for page in range(10):
    canvas = Image.new("RGB", (1800, 2200), "#f6f2e9")
    draw = ImageDraw.Draw(canvas)
    for index, row in enumerate(sample[page * 10 : page * 10 + 10]):
        y = index * 220
        contact = ROOT / "artifacts/app6d2a-automation/contact-sheets" / f"{row['asset_id']}.jpg"
        image = Image.open(contact).convert("RGB")
        image.thumbnail((720, 200))
        canvas.paste(image, (10, y + 10))
        x = 750
        draw.text((x, y + 10), f"{row['asset_id']} | {row['recommendation']}", fill="#111111", font=font)
        draw.text((x, y + 42), row["source_label"][:90], fill="#111111", font=font)
        draw.text((x, y + 78), f"candidate: {row['production_name']} ({row['match_score']})", fill="#444444", font=small)
        draw.text((x, y + 108), f"equipment: {row['production_equipment'][:80]}", fill="#444444", font=small)
        draw.text((x, y + 138), f"archive: {row['logical_archive'][:75]}", fill="#444444", font=small)
    canvas.save(OUT / f"diagnostic-{page + 1:02d}.jpg", quality=88)

with (OUT / "sample.csv").open("w", encoding="utf-8", newline="") as handle:
    writer = csv.DictWriter(handle, fieldnames=list(sample[0].keys()))
    writer.writeheader()
    writer.writerows(sample)

print(f"Wrote {len(sample)} stratified assets across 10 montages to {OUT}")
