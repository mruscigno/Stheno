import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { assessmentFixture } from "./assessment-fixture.mjs";

const appId = process.env.STHENO_ANDROID_APP_ID ?? "com.sthenofitness.app";
const evidence = process.env.STHENO_E2E_EVIDENCE ?? "artifacts/app5b2u/android";
const email = process.env.STHENO_E2E_EMAIL ?? `app5b2g-${Date.now()}@example.test`;
const secondEmail = email.replace("@", "+second@");
const password = process.env.STHENO_E2E_PASSWORD ?? "Stheno-CI-Only-2026!";
const apiBaseUrl = process.env.STHENO_API_BASE_URL ?? "http://127.0.0.1:3000";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
fs.mkdirSync(evidence, { recursive: true });

function adb(args, options = {}) {
  return execFileSync("adb", args, { encoding: "utf8", stdio: options.stdio ?? ["ignore", "pipe", "pipe"] }).trim();
}
function sleep(ms) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }
function captureTransitionFailure(identifier) {
  const safe = String(identifier).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase().slice(0, 64) || "unknown";
  try { screenshot(`failure-${safe}`); } catch {}
  try {
    const remote = `/sdcard/failure-${safe}.xml`;
    adb(["shell", "uiautomator", "dump", remote]);
    adb(["pull", remote, path.join(evidence, `failure-${safe}.xml`)]);
  } catch {}
  try { fs.writeFileSync(path.join(evidence, `failure-${safe}-logcat.txt`), adb(["logcat", "-d"])); } catch {}
}
function decode(value) { return value.replaceAll("&quot;", '"').replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">"); }
function isActionable(node) {
  if (!node?.bounds || !node.center) return false;
  const [left, top, right, bottom] = node.bounds;
  // UIAutomator includes clipped React Native descendants with inverted or
  // off-screen bounds. Tapping those coordinates is acknowledged by adb but
  // rejected by Android's InputManager, which was the source of the API-35
  // "input loss" in runs 40790540383 and 40794655253.
  return right > left && bottom > top && node.center[0] >= 0 && node.center[0] <= 1080
    && node.center[1] >= 128 && node.center[1] < 2274;
}
function nodes() {
  const remote="/sdcard/app5b2g.xml",local=path.join(evidence,"current-ui.xml");
  let xml="";
  for(let attempt=0;attempt<4;attempt+=1){
    try{
      adb(["shell","rm","-f",remote]);
      fs.rmSync(local,{force:true});
      adb(["shell","uiautomator","dump","--compressed",remote]);
      adb(["pull",remote,local]);
      xml=fs.readFileSync(local,"utf8");
      if(xml.includes("<hierarchy"))break;
    }catch{
      sleep(500);
    }
  }
  if(!xml.includes("<hierarchy"))throw new Error("Unable to capture a fresh Android UI hierarchy");
  return [...xml.matchAll(/<node\s+([^>]+)>/g)].map((match) => {
    const attrs = Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map((item) => [item[1], decode(item[2])]));
    const bounds = attrs.bounds?.match(/\[(\d+),(\d+)]\[(\d+),(\d+)]/);
    return { ...attrs, bounds: bounds ? [+bounds[1], +bounds[2], +bounds[3], +bounds[4]] : null, center: bounds ? [Math.round((+bounds[1] + +bounds[3]) / 2), Math.round((+bounds[2] + +bounds[4]) / 2)] : null };
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
    if (found && isActionable(found)) return found;
    if (attempt < 2) adb(["shell", "input", "swipe", "540", "500", "540", "1500", "350"]);
    else adb(["shell", "input", "swipe", "540", "1500", "540", "500", "350"]);
    sleep(350);
  }
  captureTransitionFailure(identifier);
  throw new Error(`Unable to locate actionable Android UI node: ${identifier}`);
}
function waitForNode(identifier, predicate, attempts = 30) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const node = locate(identifier);
    if (predicate(node)) return node;
    sleep(300);
  }
  captureTransitionFailure(identifier);
  throw new Error(`Android UI node did not reach the expected state: ${identifier}`);
}
function tap(identifier) {
  const node = waitForNode(identifier, (candidate) => candidate.enabled !== "false");
  adb(["shell", "input", "tap", String(node.center[0]), String(node.center[1])]);
  sleep(550);
}
function dismissExpoWarning() {
  const warning = nodes().find((node) => node["content-desc"]?.includes("Open debugger to view warnings") && node.bounds);
  if (!warning?.bounds) return;
  const [, top, right, bottom] = warning.bounds;
  adb(["shell", "input", "tap", String(right - 55), String(Math.round((top + bottom) / 2))]);
  sleep(550);
}
function input(identifier, value, hideKeyboard = true) {
  const expected = String(value);
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const node = locate(identifier);
    adb(["shell", "input", "tap", String(node.center[0]), String(node.center[1])]);
    sleep(500);
    const focused = locate(identifier);
    if (focused.focused !== "true") {
      sleep(350);
      continue;
    }
    if(/^\d+$/.test(expected)){
      // API 35 can acknowledge keyevent commands without delivering them to
      // a focused React Native numeric field. Inject and verify each digit as
      // text so a dropped character is caught by the existing bounded retry.
      let partial="";
      for(const digit of expected){
        partial+=digit;
        adb(["shell","input","text",digit]);
        sleep(180);
        const afterText=locate(identifier);
        if(afterText.text!==partial){
          // Some API 35 numeric keyboards intermittently discard `input text`
          // while offline. Retry the same digit through its Android keycode and
          // let the outer loop verify the complete value before advancing.
          adb(["shell","input","keyevent",String(7+Number(digit))]);
          sleep(180);
        }
      }
    }else{
      adb(["shell", "input", "text", expected.replaceAll(" ", "%s")]);
    }
    sleep(500);
    const filled = locate(identifier);
    const verifiedPassword = filled.password === "true" && filled.text?.length === expected.length;
    if (filled.text === expected || verifiedPassword) {
      const inputMethod = adb(["shell", "dumpsys", "input_method"]);
      if (hideKeyboard && /mInputShown=true|isInputViewShown=true/.test(inputMethod)) {
        adb(["shell", "input", "keyevent", "4"]);
      }
      sleep(300);
      return;
    }
    if (filled.text) {
      adb(["shell","input","tap",String(filled.center[0]),String(filled.center[1])]);
      adb(["shell","input","keyevent","123"]);
      for (let index = 0; index < Math.max(12, filled.text.length + 4); index += 1) {
        adb(["shell","input","keyevent","67"]);
      }
      sleep(500);
      continue;
    }
  }
  captureTransitionFailure(identifier);
  throw new Error(`Android field did not accept verified text: ${identifier}`);
}
function screenshot(name) { const target = path.join(evidence, `${name}.png`); fs.writeFileSync(target, execFileSync("adb", ["exec-out", "screencap", "-p"])); }
function snapshot(name) {
  screenshot(name);
  const remote=`/sdcard/${name}.xml`,local=path.join(evidence,`${name}.xml`);
  for(let attempt=0;attempt<6;attempt+=1){
    try{
      adb(["shell","rm","-f",remote]);
      adb(["shell","uiautomator","dump",remote]);
      adb(["pull",remote,local]);
      if(fs.existsSync(local)&&fs.statSync(local).size>0)return;
    }catch{
      sleep(750);
    }
  }
  throw new Error(`Unable to capture Android UI snapshot: ${name}`);
}
function captureSQLite(name) {
  const target = path.join(evidence, `${name}-sqlite.tar`);
  // expo-sqlite stores application databases in files/SQLite on Android;
  // include the platform databases directory as well for a complete snapshot.
  const archive = execFileSync("adb", ["exec-out", "run-as", appId, "sh", "-c", "tar -cf - files/SQLite databases"], { maxBuffer: 32 * 1024 * 1024 });
  fs.writeFileSync(target, archive);
}
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

async function verifyLatestLocalEmail(address) {
  let message;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const response = await fetch("http://127.0.0.1:54324/api/v1/messages");
    if (response.ok) {
      const mailbox = await response.json();
      const summary = mailbox.messages?.find((candidate) => candidate.To?.some((recipient) => recipient.Address === address));
      if (summary?.ID) {
        const detail = await fetch(`http://127.0.0.1:54324/api/v1/message/${summary.ID}`);
        if (detail.ok) { message = await detail.json(); break; }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!message) throw new Error("Supabase local confirmation email did not arrive");
  const source = JSON.stringify(message).replaceAll("\\u0026", "&").replaceAll("&amp;", "&");
  const link = source.match(/https?:\\?\/\\?\/[^\"'<> ]+\/auth\/v1\/verify\?[^\"'<> ]+/)?.[0]?.replaceAll("\\/", "/");
  if (!link) throw new Error("Supabase local confirmation email did not contain a verification link");
  const confirmation = await fetch(link, { redirect: "manual" });
  const deepLink = confirmation.headers.get("location");
  if (!deepLink?.startsWith("stheno://auth/callback")) throw new Error("Supabase verification did not return the expected native callback");
  adb(["shell", "am", "start", "-W", "-a", "android.intent.action.VIEW", "-d", deepLink, appId]);
  sleep(1500);
}

async function passwordSession(address) {
  if (!publishableKey) throw new Error("EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required");
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, { method:"POST", headers:{ apikey:publishableKey,"content-type":"application/json" }, body:JSON.stringify({email:address,password}) });
  if (!response.ok) throw new Error(`Password session failed: ${response.status} ${await response.text()}`);
  return response.json();
}
async function api(pathname, token, init={}) {
  const response = await fetch(`${apiBaseUrl}${pathname}`, { ...init, headers:{ accept:"application/json",authorization:`Bearer ${token}`,...(init.body?{"content-type":"application/json"}:{}),...init.headers } });
  const body = await response.json().catch(()=>null);
  return {response,body};
}
async function createSecondUser() {
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
  const response=await fetch(`${supabaseUrl}/auth/v1/admin/users`,{method:"POST",headers:{apikey:serviceRoleKey,authorization:`Bearer ${serviceRoleKey}`,"content-type":"application/json"},body:JSON.stringify({email:secondEmail,password,email_confirm:true})});
  if (!response.ok) throw new Error(`Second user creation failed: ${response.status} ${await response.text()}`);
  return response.json();
}
async function armResponseLoss(token) {
  const result=await api("/api/v1/test/native-acceptance",token,{method:"POST",body:JSON.stringify({action:"lose-next-workout-response"})});
  if(!result.response.ok)throw new Error(`Could not arm response loss: ${result.response.status} ${JSON.stringify(result.body)}`);
}
async function concurrentServerSet(token, sessionId, baseRevision, exerciseSlug) {
  const operationId=crypto.randomUUID(),setId=crypto.randomUUID();
  const result=await api(`/api/v1/workouts/sessions/${sessionId}/sets/${setId}`,token,{method:"PUT",body:JSON.stringify({operationId,baseRevision,schemaVersion:1,exerciseSlug,setOrdinal:99,setType:"working",prescribed:{},load:1,loadUnit:"lb",repetitions:1,rir:1,state:"completed",clientCreatedAt:new Date().toISOString()})});
  if(!result.response.ok)throw new Error(`Concurrent server update failed: ${result.response.status} ${JSON.stringify(result.body)}`);
  return result.body.data;
}
function signInThroughUi(address) {
  input("Email",address,false);input("Password",password,false);tap("Sign in");assertVisible("Member Today loaded",60);
}
function confirmSignOutIfNeeded() {
  for(let attempt=0;attempt<10;attempt+=1){
    const candidates=nodes().filter(node=>node.text==="Sign out"&&isActionable(node));
    if(candidates.length>1){const node=candidates.at(-1);adb(["shell","input","tap",String(node.center[0]),String(node.center[1])]);sleep(1200);return;}
    sleep(250);
  }
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
    // Free-form wording is not under test here. A short deterministic fixture
    // removes API-35 IME throughput as a source of false onboarding failures.
    input(`assessment-input-${key}`, key === "specificOutcome" ? "Progress" : raw === "" ? "None" : String(raw));
    if (nextKey) pressUntilStep(`Continue from ${key}`, nextKey);
    else tap(`Continue from ${key}`);
  }
  index += 1;
}

assertVisible("Create account and claim Blueprint", 50); screenshot("03-real-blueprint");
pressUntilVisible("Create account and claim Blueprint", "create-account-email");
snapshot("04-account-before-input");
input("create-account-email", email, false);
snapshot("05-account-after-email");
input("create-account-password", password, false);
snapshot("06-account-after-password");
tap("Create test account");
assertVisible("Verify, then come back.", 30);
snapshot("07-verification-required");
await verifyLatestLocalEmail(email);
assertVisible("Member Today loaded", 80);
const firstSession=await passwordSession(email);
await createSecondUser();
snapshot("08-member-today");
dismissExpoWarning();
tap("member-plan-tab");
assertVisible("Need to change this week?", 15);
snapshot("09-real-program");

tap("member-today-tab");
tap("Start workout");
assertVisible("workout-sync-status",30);
snapshot("10-workout-online");
input("Set 1 weight","50");input("Set 1 repetitions","8");input("Set 1 repetitions in reserve","2");
tap("Complete set 1");
waitForNode("workout-sync-status",candidate=>candidate["content-desc"]==="Workout sync status: Saved",30);
snapshot("11-workout-online-saved");
await armResponseLoss(firstSession.access_token);
input("Set 2 weight","55");tap("Complete set 2");
waitForNode("workout-sync-status",candidate=>candidate["content-desc"]==="Workout sync status: Saved",30);
snapshot("11f-response-loss-recovered-from-receipt");
adb(["shell","svc","wifi","disable"]);adb(["shell","svc","data","disable"]);sleep(1500);
// Keep the prescribed reps/RIR defaults for the offline sets. API 35's shell
// keyboard can discard focused numeric input after radios are disabled; the
// restoration proof verifies these exact default fields after process death.
tap("Complete set 3");
waitForNode("workout-sync-status",candidate=>candidate["content-desc"]==="Workout sync status: Offline · saved locally",20);snapshot("12-workout-offline-saved");
adb(["shell","am","force-stop",appId]);
adb(["shell","monkey","-p",appId,"-c","android.intent.category.LAUNCHER","1"]);sleep(3000);
assertVisible("workout-sync-status",50);
waitForNode("Set 1 weight",candidate=>candidate.text==="50",20);
waitForNode("Set 2 weight",candidate=>candidate.text==="55",20);
waitForNode("Set 3 weight",candidate=>candidate.text==="lb",20);
waitForNode("Set 2 repetitions",candidate=>candidate.text==="6",20);
waitForNode("Set 2 repetitions in reserve",candidate=>candidate.text==="3",20);
waitForNode("Set 3 repetitions",candidate=>candidate.text==="6",20);
waitForNode("Set 3 repetitions in reserve",candidate=>candidate.text==="3",20);
snapshot("13-workout-process-kill-restored-offline");
captureSQLite("13-first-kill-restored");
input("Set 2 weight","60");tap("Update set 2");
tap("Finish and save workout");
assertVisible("Member Today loaded",30);snapshot("14-workout-completed-offline");
adb(["shell","am","force-stop",appId]);
adb(["shell","monkey","-p",appId,"-c","android.intent.category.LAUNCHER","1"]);sleep(3000);
assertVisible("workout-sync-status",50);snapshot("15-workout-completion-restored-offline");
captureSQLite("15-second-kill-restored");
adb(["shell","svc","wifi","enable"]);adb(["shell","svc","data","enable"]);sleep(4000);
sleep(8000);adb(["shell","input","keyevent","4"]);assertVisible("Member Today loaded",50);snapshot("16-workout-reconciled");
captureSQLite("16-reconciled");

adb(["shell", "am", "force-stop", appId]);
adb(["shell", "monkey", "-p", appId, "-c", "android.intent.category.LAUNCHER", "1"]); sleep(3000);
assertVisible("Member Today loaded", 50); snapshot("17-cold-restart-restored");

// G: create a second genuine session, change its server revision out of band,
// then submit from the stale native revision and prove the app preserves local work.
tap("today-open-workout");
assertVisible("workout-sync-status",30);
waitForNode("workout-sync-status",candidate=>candidate["content-desc"]==="Workout sync status: Saved",30);
const today=await api("/api/v1/today",firstSession.access_token);
const conflictSession=today.body?.data?.activeWorkout;
if(!today.response.ok||!conflictSession?.id)throw new Error(`Second active workout missing: ${JSON.stringify(today.body)}`);
const conflictExerciseSlug=conflictSession.revised_workout?.exercises?.[0]?.exerciseSlug??conflictSession.original_workout?.exercises?.[0]?.exerciseSlug;
if(!conflictExerciseSlug)throw new Error("Second active workout has no canonical exercise slug");
await concurrentServerSet(firstSession.access_token,conflictSession.id,conflictSession.revision,conflictExerciseSlug);
input("Set 1 weight","65");tap("Complete set 1");
assertVisible("This workout changed elsewhere. Your local work is preserved; reconnect and retry before continuing.",40);
snapshot("18-native-visible-revision-conflict");
captureSQLite("18-conflict-preserved");

// H: switch to a separately created real account, prove A's local workout is
// not selected and A's server session is not readable, then switch back.
tap("member-more-tab");tap("Sign out");
confirmSignOutIfNeeded();
assertVisible("Already a member? Sign in",40);tap("Already a member? Sign in");
signInThroughUi(secondEmail);
assertVisible("Start workout",30);snapshot("19-second-user-isolated-today");captureSQLite("19-second-user-isolated");
const secondSession=await passwordSession(secondEmail);
const crossUser=await api(`/api/v1/workouts/sessions/${conflictSession.id}`,secondSession.access_token);
if(crossUser.response.status!==404)throw new Error(`Cross-user workout read was not hidden: ${crossUser.response.status}`);
tap("member-more-tab");tap("Sign out");
confirmSignOutIfNeeded();
assertVisible("Already a member? Sign in",40);tap("Already a member? Sign in");
signInThroughUi(email);
assertVisible("Open current workout",30);snapshot("20-first-user-conflict-restored-after-switch");captureSQLite("20-first-user-restored");
adb(["shell", "uiautomator", "dump", "/sdcard/app5b2g-final.xml"]);
adb(["pull", "/sdcard/app5b2g-final.xml", path.join(evidence, "final-ui.xml")]);
fs.writeFileSync(path.join(evidence, "test-identity.txt"), `${email}\n`);
fs.writeFileSync(path.join(evidence, "second-test-identity.txt"), `${secondEmail}\n`);
console.log(`STHENO_E2E_EMAIL=${email}`);
console.log("Native Assessment → Blueprint → Account → Claim → Program journey passed.");

