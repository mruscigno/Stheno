import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const root = process.cwd();
const source = path.join(root, "artifacts/app6d2a-private/contact-sheets");
const output = path.join(root, "artifacts/app6d2a-private/review-grids");
await mkdir(output, { recursive: true });
const text = await readFile(path.join(root, "docs/mobile/app6d2a/BATCH_2_CANDIDATES.csv"), "utf8");
const candidates = [...text.matchAll(/^"(asset-\d+)",(?:"(?:[^"]|"")*",){4}"([^"]*)"/gm)].map((match) => ({ id: match[1], slug: match[2] }));
for (let offset = 0; offset < candidates.length; offset += 9) {
  const batch = candidates.slice(offset, offset + 9);
  const canvas = createCanvas(1800, 660); const context = canvas.getContext("2d");
  context.fillStyle = "#fffaf3"; context.fillRect(0, 0, 1800, 660); context.font = "18px Arial"; context.fillStyle = "#171714";
  for (const [index, item] of batch.entries()) {
    const x = (index % 3) * 600; const y = Math.floor(index / 3) * 220;
    const image = await loadImage(path.join(source, `${item.id}.png`));
    context.drawImage(image, x, y + 30, 600, 175); context.fillText(`${item.id} · ${item.slug}`, x + 8, y + 22);
    context.strokeStyle = "#d8d0c4"; context.strokeRect(x, y, 600, 220);
  }
  await writeFile(path.join(output, `batch-2-grid-${String(offset / 9 + 1).padStart(2, "0")}.png`), canvas.toBuffer("image/png"));
}
console.log(`Built ${Math.ceil(candidates.length / 9)} grids for ${candidates.length} candidates.`);
