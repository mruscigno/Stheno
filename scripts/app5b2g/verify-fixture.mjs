import assert from "node:assert/strict";
import fs from "node:fs";
import { assessmentFixture, expectedVisibleKeys } from "./assessment-fixture.mjs";

const source = fs.readFileSync(new URL("../../src/modules/acquisition/assessment-model.ts", import.meta.url), "utf8");
const canonicalKeys = [...source.matchAll(/\{key:"([^"]+)"/g)].map((match) => match[1]);
assert.equal(canonicalKeys.length, 45, "The canonical assessment registry must remain exactly 45 definitions.");
assert.equal(new Set(canonicalKeys).size, 45, "Assessment keys must be unique.");
assert.deepEqual(expectedVisibleKeys, canonicalKeys, "The deterministic maximal-branch fixture must track the canonical registry order.");
assert.equal(Object.keys(assessmentFixture).length, 45);
console.log("App 5B-2G assessment fixture verified: 45 canonical steps in registry order.");

