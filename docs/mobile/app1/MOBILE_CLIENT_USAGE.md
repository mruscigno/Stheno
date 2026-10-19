# Mobile Client Usage

Use the Supabase React Native client to obtain and refresh the member session. Pass the current access token to `createSthenoApiClient`; never embed a service/secret key.

```ts
const api = createSthenoApiClient({
  baseUrl: "https://www.sthenofitness.com",
  getAccessToken: async () => (await supabase.auth.getSession()).data.session?.access_token ?? null,
});

const { data: member } = await api.me();
```

Every authenticated request sends `Authorization: Bearer <access-token>`. The client creates `X-Request-Id`; mutation bodies include a stable UUID `operationId`. Generate an operation once and persist it with the queued operation. Never generate a new ID merely because a request timed out.

```ts
await api.request("/api/v1/workouts/sessions", {
  method: "POST",
  body: JSON.stringify({ operationId, clientSessionKey, workoutKey }),
});
```

```ts
await api.request(`/api/v1/workouts/sessions/${sessionId}/sets/${setId}`, {
  method: "PUT",
  body: JSON.stringify({
    operationId, baseRevision, exerciseSlug: "goblet-squat",
    setOrdinal: 1, prescribed: { reps: [8, 12] },
    load: 50, loadUnit: "lb", repetitions: 10, rir: 2,
    state: "completed", clientTimestamp: new Date().toISOString(),
  }),
});
```

Success envelopes contain `{ apiVersion, requestId, data, meta? }`. Failures contain `{ apiVersion, requestId, error: { code, message, details? } }`. Treat `401` as refresh/sign-in, `409 IDEMPOTENCY_CONFLICT` as a programming/data-integrity error, other `409` as a user-visible state conflict, and `503` as retryable with bounded backoff. Do not retry validation errors.
