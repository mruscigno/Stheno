import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("native workout sync status remains a stable Android accessibility node", () => {
  const screen = fs.readFileSync("apps/mobile/app/workout.tsx", "utf8");
  const journey = fs.readFileSync("scripts/app5b2g/android-e2e.mjs", "utf8");
  assert.match(screen, /testID="workout-sync-status"/);
  assert.match(screen, /accessible\s+collapsable=\{false\}/);
  assert.match(
    screen,
    /accessibilityLabel=\{`Workout sync status: \$\{syncLabel\}`\}/,
  );
  assert.match(journey, /assertVisible\("workout-sync-status"/);
  assert.match(journey, /Workout sync status: Offline · saved locally/);
  assert.match(journey, /Workout sync status: Saved/);
  assert.match(journey, /function isActionable/);
  assert.match(journey, /bottom > top/);
  assert.match(journey, /focused !== "true"/);
  assert.match(journey, /captureTransitionFailure/);
  assert.match(journey, /captureSQLite\("13-first-kill-restored"\)/);
  assert.match(journey, /captureSQLite\("15-second-kill-restored"\)/);
  assert.match(journey, /captureSQLite\("16-reconciled"\)/);
  assert.match(journey, /files\/SQLite databases/);
});

test("acceptance actions use stable identifiers and split scenario entry points", () => {
  const root = fs.readFileSync("apps/mobile/app/_layout.tsx", "utf8");
  const assessment = fs.readFileSync("apps/mobile/app/index.tsx", "utf8");
  const signIn = fs.readFileSync("apps/mobile/app/sign-in.tsx", "utf8");
  const more = fs.readFileSync("apps/mobile/app/(member)/more.tsx", "utf8");
  const memberLayout = fs.readFileSync("apps/mobile/app/(member)/_layout.tsx", "utf8");
  const workout = fs.readFileSync("apps/mobile/app/workout.tsx", "utf8");
  const journey = fs.readFileSync("scripts/app5b2g/android-e2e.mjs", "utf8");
  const runner = fs.readFileSync("scripts/app5b2g/run-android-e2e.sh", "utf8");

  assert.match(root, /testID="navigation-state"/);
  assert.match(assessment, /testID="assessment-sign-in"/);
  assert.match(signIn, /testID="sign-in-email"/);
  assert.match(signIn, /testID="sign-in-password"/);
  assert.match(signIn, /testID="sign-in-submit"/);
  assert.match(more, /testID="member-sign-out"/);
  assert.doesNotMatch(memberLayout, /<Redirect/);
  assert.match(memberLayout, /router\.replace\("\/"\)/);
  assert.match(workout, /testID=\{`workout-set-\$\{ordinal\}-commit`\}/);
  assert.match(workout, /testID="workout-conflict-notice"/);
  assert.doesNotMatch(journey, /node\.text === identifier/);
  for (const name of [
    "bootstrap",
    "response-loss",
    "offline-recovery",
    "revision-conflict",
    "account-isolation",
  ]) {
    assert.match(journey, new RegExp(`scenario === "${name}"`));
    assert.match(runner, new RegExp(name));
  }
  assert.match(journey, /failure-\$\{safe\}-activity\.txt/);
  assert.match(journey, /failure-\$\{safe\}-navigation\.txt/);
});
