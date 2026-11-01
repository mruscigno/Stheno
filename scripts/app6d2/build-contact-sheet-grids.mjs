import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const root = process.cwd();
const source = path.join(root, "artifacts", "app6d2-private", "contact-sheets");
const output = path.join(root, "artifacts", "app6d2-private");
const csv = await readFile(path.join(root, "docs", "mobile", "app6d2", "BATCH_1_CANDIDATES.csv"), "utf8");
const labels = new Map([...csv.matchAll(/^"?(asset-\d+)"?,"?([^",]+)"?/gm)].map((match) => [match[1], match[2]]));
const files = (await readdir(source)).filter((file) => file.endsWith(".png")).sort();

for (let offset = 0; offset < files.length; offset += 9) {
  const batch = files.slice(offset, offset + 9);
  const canvas = createCanvas(1800, 660);
  const context = canvas.getContext("2d");
  context.fillStyle = "#fffaf3";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.font = "18px Arial";
  context.fillStyle = "#171714";
  for (const [index, file] of batch.entries()) {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const x = column * 600;
    const y = row * 220;
    const assetId = path.basename(file, ".png");
    const image = await loadImage(path.join(source, file));
    context.drawImage(image, x, y + 30, 600, 175);
    context.fillText(`${assetId} · ${labels.get(assetId) ?? "unknown"}`, x + 8, y + 22);
    context.strokeStyle = "#d8d0c4";
    context.strokeRect(x, y, 600, 220);
  }
  await writeFile(path.join(output, `review-grid-${String(offset / 9 + 1).padStart(2, "0")}.png`), canvas.toBuffer("image/png"));
}

console.log(`Built ${Math.ceil(files.length / 9)} review grids for ${files.length} contact sheets.`);
