import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const migrations = [
  "20260818041000_el_01_commercial_gym.sql",
  "20260818051000_el_02_machines_cables.sql",
  "20260818071000_el_03_dumbbell_home.sql",
  "20260818072000_el_04_bodyweight_bands.sql",
  "20260818073000_el_05_variants_isolation.sql",
  "20260818081000_el_06_coverage_gaps.sql",
];

const catalog = [];
for (const file of migrations) {
  const sql = await readFile(path.join(root, "supabase/migrations", file), "utf8");
  const match = sql.match(/jsonb_array_elements\(\$[a-z0-9_]+\$(\[[\s\S]*?\])\$[a-z0-9_]+\$::jsonb\)/i);
  if (!match) throw new Error(`Could not find JSON catalog in ${file}`);
  catalog.push(...JSON.parse(match[1]));
}

const baselineSql = await readFile(
  path.join(root, "supabase/migrations/20260818010000_product_03_training_intelligence.sql"),
  "utf8",
);
const valuesBlock = baselineSql.match(/insert into public\.exercises\([\s\S]*?\) values\s*([\s\S]*?)\s*on conflict\(slug\)/i)?.[1];
if (!valuesBlock) throw new Error("Could not find Product 03 exercise values");

const rowPattern = /\('([^']+)','([^']+)','production','([^']+)','([^']+)','([^']+)','\{([^}]*)\}','\{([^}]*)\}','\{([^}]*)\}','([^']+)',(\d+),(\d+),(\d+),(\d+),'(\{[^']+\})'::jsonb/g;
for (const match of valuesBlock.matchAll(rowPattern)) {
  const split = (value) => (value ? value.split(",").filter(Boolean) : []);
  const education = JSON.parse(match[14]);
  catalog.push({
    slug: match[1], name: match[2], family: match[3], pattern: match[4], role: match[5],
    primaryMuscles: split(match[6]), secondaryMuscles: split(match[7]), requiredEquipment: split(match[8]),
    skill: match[9], fatigueCost: Number(match[10]), progressionSuitability: Number(match[11]),
    repRange: [Number(match[12]), Number(match[13])], unilateral: false,
    instructions: [...education.setup, ...education.execution], cues: education.cues, mistakes: education.mistakes,
    cautionTags: [],
  });
}

catalog.sort((a, b) => a.slug.localeCompare(b.slug));
const slugs = new Set(catalog.map((item) => item.slug));
if (catalog.length !== 330 || slugs.size !== 330) {
  throw new Error(`Expected 330 unique exercises, got ${catalog.length}/${slugs.size}`);
}
await mkdir(path.join(root, "content/exercises"), { recursive: true });
await writeFile(
  path.join(root, "content/exercises/canonical-exercises.json"),
  `${JSON.stringify(catalog, null, 2)}\n`,
);
console.log(`Built canonical catalog: ${catalog.length} exercises`);
