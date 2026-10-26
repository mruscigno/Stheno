import assert from "node:assert/strict";
import fs from "node:fs";

const base = (process.env.STHENO_API_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const evidence = "artifacts/app5b2h/backend";
fs.mkdirSync(evidence, { recursive: true });
const results = [];

async function request(path, init = {}) {
  const response = await fetch(`${base}${path}`, init);
  const body = await response.json();
  results.push({ path, method: init.method ?? "GET", status: response.status, requestId: body.requestId ?? null, code: body.error?.code ?? null });
  return { response, body };
}

const health = await request("/api/health");
assert.equal(health.response.status, 200);
assert.equal(health.body.status, "ok");

const created = await request("/api/v1/assessment-sessions", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
assert.equal(created.response.status, 201);
const { sessionId, capability, revision } = created.body.data;
assert.ok(sessionId && capability);

const noCapability = await request(`/api/v1/assessment-sessions/${sessionId}`);
assert.equal(noCapability.response.status, 401);
const tampered = await request(`/api/v1/assessment-sessions/${sessionId}`, { headers: { "x-stheno-assessment-capability": `${capability}x` } });
assert.equal(tampered.response.status, 404);

const saved = await request(`/api/v1/assessment-sessions/${sessionId}/answers`, { method: "PUT", headers: { "content-type": "application/json", "x-stheno-assessment-capability": capability }, body: JSON.stringify({ revision, currentStepKey: "goal", answers: { goal: "muscle" } }) });
assert.equal(saved.response.status, 200);
const stale = await request(`/api/v1/assessment-sessions/${sessionId}/answers`, { method: "PUT", headers: { "content-type": "application/json", "x-stheno-assessment-capability": capability }, body: JSON.stringify({ revision, currentStepKey: "goal", answers: { goal: "strength" } }) });
assert.equal(stale.response.status, 409);

fs.writeFileSync(`${evidence}/negative-results.json`, JSON.stringify(results, null, 2));
console.log("Backend reachability and capability/revision negative tests passed.");

