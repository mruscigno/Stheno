import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("native workout sync status remains a stable Android accessibility node",()=>{
  const screen=fs.readFileSync("apps/mobile/app/workout.tsx","utf8");
  const journey=fs.readFileSync("scripts/app5b2g/android-e2e.mjs","utf8");
  assert.match(screen,/testID="workout-sync-status"/);
  assert.match(screen,/accessible collapsable=\{false\}/);
  assert.match(screen,/accessibilityLabel=\{`Workout sync status: \$\{syncLabel\}`\}/);
  assert.match(journey,/assertVisible\("workout-sync-status"/);
  assert.match(journey,/Workout sync status: Offline · saved locally/);
  assert.match(journey,/Workout sync status: Saved/);
  assert.match(journey,/function isActionable/);
  assert.match(journey,/bottom > top/);
  assert.match(journey,/focused !== "true"/);
  assert.match(journey,/captureTransitionFailure/);
  assert.match(journey,/captureSQLite\("13-first-kill-restored"\)/);
  assert.match(journey,/captureSQLite\("15-second-kill-restored"\)/);
  assert.match(journey,/captureSQLite\("16-reconciled"\)/);
  assert.match(journey,/files\/SQLite databases/);
});
