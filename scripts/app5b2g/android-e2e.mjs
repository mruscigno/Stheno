import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { assessmentFixture } from "./assessment-fixture.mjs";

const appId = process.env.STHENO_ANDROID_APP_ID ?? "com.sthenofitness.app";
const evidence = process.env.STHENO_E2E_EVIDENCE ?? "artifacts/app5b2g/android";
const email = process.env.STHENO_E2E_EMAIL ?? `app5b2g-${Date.now()}@example.test`;
const password = process.env.STHENO_E2E_PASSWORD ?? "Stheno-CI-Only-2026!";
fs.mkdirSync(evidence, { recursive: true });

function adb(args, options = {}) {
  return execFileSync("adb", args, { encoding: "utf8", stdio: options.stdio ?? ["ignore", "pipe", "pipe"] }).trim();
}
function sleep(ms) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }
function decode(value) { return value.replaceAll("&quot;", '"').replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">"); }
function nodes() {
  adb(["shell", "uiautomator", "dump", "/sdcard/app5b2g.xml"]);
  adb(["pull", "/sdcard/app5b2g.xml", path.join(evidence, "current-ui.xml")]);
  const xml = fs.readFileSync(path.join(evidence, "current-ui.xml"), "utf8");
  return [...xml.matchAll(/<node\s+([^>]+)>/g)].map((match) => {
    const attrs = Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map((item) => [item[1], decode(item[2])]));
    const bounds = attrs.bounds?.match(/\[(\d+),(\d+)]\[(\d+),(\d+)]/);
    return { ...attrs, center: bounds ? [Math.round((+bounds[1] + +bounds[3]) / 2), Math.round((+bounds[2] + +bounds[4]) / 2)] : null };
  });
}
function locate(identifier, attempts = 16) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const currentNodes = nodes();
    const systemWait = currentNodes.find((node) => node.text === "Wait" && node.center);
    if (systemWait?.center) {
      adb(["shell", "input", "tap", String(systemWait.center[0]), String(systemWait.center[1])]);
      sleep(1000);
      continue;
    }
    const retry = currentNodes.find((node) => node.text === "Try again" && node.center);
    if (retry?.center) {
      adb(["shell", "input", "tap", String(retry.center[0]), String(retry.center[1])]);
      sleep(2000);
      continue;
    }
    if (!currentNodes.some((node) => node.package === appId)) {
      adb(["shell", "monkey", "-p", appId, "-c", "android.intent.category.LAUNCHER", "1"]);
      sleep(2500);
      continue;
    }
    const found = currentNodes.find((node) =>
      node["resource-id"] === identifier
      || node["resource-id"]?.endsWith(`/${identifier}`)
      || node["content-desc"] === identifier
      || node.text === identifier
    );
    if (found?.center) return found;
    if (attempt < 2) adb(["shell", "input", "swipe", "540", "500", "540", "1500", "350"]);
    else adb(["shell", "input", "swipe", "540", "1500", "540", "500", "350"]);
    sleep(350);
  }
  throw new Error(`Unable to locate Android UI node: ${identifier}`);
}
function waitForNode(identifier, predicate, attempts = 30) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const node = locate(identifier);
    if (predicate(node)) return node;
    sleep(300);
  }
  throw new Error(`Android UI node did not reach the expected state: ${identifier}`);
}
function tap(identifier) {
  const node = waitForNode(identifier, (candidate) => candidate.enabled !== "false");
  adb(["shell", "input", "tap", String(node.center[0]), String(node.center[1])]);
  sleep(550);
}
function input(identifier, value) {
  const expected = String(value);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const node = locate(identifier);
    adb(["shell", "input", "tap", String(node.center[0]), String(node.center[1])]);
    sleep(500);
    adb(["shell", "input", "text", expected.replaceAll(" ", "%s")]);
    sleep(500);
    const filled = locate(identifier);
    const verifiedPassword = filled.password === "true" && filled.text?.length === expected.length;
    if (filled.text === expected || verifiedPassword) {
      adb(["shell", "input", "keyevent", "4"]);
      sleep(300);
      return;
    }
    if (filled.text) throw new Error(`Android field ${identifier} contained unexpected text: ${filled.text}`);
  }
  throw new Error(`Android field did not accept text: ${identifier}`);
}
function screenshot(name) { const target = path.join(evidence, `${name}.png`); fs.writeFileSync(target, execFileSync("adb", ["exec-out", "screencap", "-p"])); }
function assertVisible(identifier, attempts = 30) { return locate(identifier, attempts); }
function pressUntilStep(button, nextStep, attempts = 3) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    tap(button);
    try {
      return assertVisible(`assessment-step-${nextStep}`, 5);
    } catch {
      sleep(500);
    }
  }
  throw new Error(`Android assessment did not advance from ${button} to ${nextStep}`);
}
function pressUntilVisible(button, target, attempts = 3) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    tap(button);
    try {
      return assertVisible(target, 5);
    } catch {
      sleep(500);
    }
  }
  throw new Error(`Android UI did not advance from ${button} to ${target}`);
}

console.log(`Starting native journey for ${email}`);
assertVisible("assessment-step-goal", 40); screenshot("01-opening-question");

let index = 0;
const fixtureEntries = Object.entries(assessmentFixture);
for (const [key, raw] of fixtureEntries) {
  const nextKey = fixtureEntries[index + 1]?.[0];
  assertVisible(`assessment-step-${key}`, 30);
  if (index === 8) {
    screenshot("02-assessment-progress");
    adb(["shell", "am", "force-stop", appId]);
    adb(["shell", "monkey", "-p", appId, "-c", "android.intent.category.LAUNCHER", "1"]); sleep(2500);
    assertVisible(`assessment-step-${key}`, 30);
  }
  if (Array.isArray(raw)) {
    for (const value of raw) {
      const option = `Select ${value === "mon" ? "Monday" : value === "wed" ? "Wednesday" : value === "fri" ? "Friday" : value === "gym" ? "Gym programs" : value === "dumbbells" ? "Dumbbells" : value === "bench" ? "Bench" : value === "bands" ? "Bands" : value === "none" ? "None" : value} for ${key}`;
      tap(option);
      waitForNode(option, (candidate) => candidate.checked === "true");
      waitForNode(`Continue from ${key}`, (candidate) => candidate.enabled === "true");
    }
    if (nextKey) pressUntilStep(`Continue from ${key}`, nextKey);
    else tap(`Continue from ${key}`);
  } else if (["goal","secondaryGoal","timeframe","priorityStyle","sex","experience","consistencyHistory","currentFrequency","days","duration","schedule","travel","location","familiarity","activity","steps","sleep","stress","diet","meals","tracking","proteinContext","supplementGuidance","barriers","supportStyle"].includes(key)) {
    const labels = {
      muscle:"Build muscle", energy:"More energy", "3-6":"3–6 months", strength:"Strength", prefer_not:"Prefer not to say", returning:"Returning after time away", intermittent:"Starts and stops", "1-2":"1–2 days", "3":key === "meals" ? "3 meals" : "3 days", "45":"45 minutes", variable:"Changes week to week", occasional:"Occasional travel", mixed:key === "location" ? "Home and gym" : "Inconsistent", some:"I know common movements", moderate:key === "activity" ? "A mix of sitting and moving" : "Busy but workable", "7-10k":"7,000–10,000", flexible:key === "diet" ? "No specific pattern" : "Flexible backup options", portions:"Simple portions", most:"At most meals", maybe:"Only when relevant", time:"Time"
    };
    const option = `Select ${labels[raw] ?? raw} for ${key}`;
    if (nextKey) pressUntilStep(option, nextKey);
    else tap(option);
  } else {
    input(`assessment-input-${key}`, raw === "" ? "No current limitations" : raw);
    if (nextKey) pressUntilStep(`Continue from ${key}`, nextKey);
    else tap(`Continue from ${key}`);
  }
  index += 1;
}

assertVisible("Create account and claim Blueprint", 50); screenshot("03-real-blueprint");
pressUntilVisible("Create account and claim Blueprint", "create-account-email");
input("create-account-email", email);
input("create-account-password", password);
pressUntilVisible("Create test account", "Member Today loaded");
screenshot("04-member-today");
pressUntilVisible("Plan", "Need to change this week?");
screenshot("05-real-program");

adb(["shell", "am", "force-stop", appId]);
adb(["shell", "monkey", "-p", appId, "-c", "android.intent.category.LAUNCHER", "1"]); sleep(3000);
assertVisible("Member Today loaded", 50); screenshot("06-cold-restart-restored");
adb(["shell", "uiautomator", "dump", "/sdcard/app5b2g-final.xml"]);
adb(["pull", "/sdcard/app5b2g-final.xml", path.join(evidence, "final-ui.xml")]);
fs.writeFileSync(path.join(evidence, "test-identity.txt"), `${email}\n`);
console.log(`STHENO_E2E_EMAIL=${email}`);
console.log("Native Assessment → Blueprint → Account → Claim → Program journey passed.");

