import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { purgeExpiredFormReviews } from "./retention";

function clientWith(storageError: Error | null) {
  const remove = vi.fn().mockResolvedValue({ error: storageError });
  const terminal = { neq: vi.fn().mockResolvedValue({ error: null }), then: (resolve: (value: { error: null }) => unknown) => resolve({ error: null }) };
  const chain = { eq: vi.fn(() => chain), neq: terminal.neq, then: terminal.then };
  const update = vi.fn().mockImplementation(() => chain);
  const client = {
    rpc: vi.fn().mockResolvedValue({ data: [{ id: "review-1", object_path: "user/review/set.mp4", cleanup_lease_token: "lease-1", cleanup_attempt_count: 0 }], error: null }),
    from: () => ({ update }),
    storage: { from: () => ({ remove }) },
  } as unknown as SupabaseClient;
  return { client, remove, update };
}

describe("form review retention", () => {
  it("removes the private object before tombstoning and clearing member data", async () => {
    const { client, remove, update } = clientWith(null);
    await expect(purgeExpiredFormReviews(client, new Date("2026-10-21T12:00:00Z"))).resolves.toEqual({ deleted: 1, failed: 0 });
    expect(remove).toHaveBeenCalledWith(["user/review/set.mp4"]);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ processing_status: "deleted", structured_result: null, member_question: null, cleanup_lease_token: null }));
  });

  it("does not falsely tombstone a review when physical deletion fails and schedules a retry", async () => {
    const { client, update } = clientWith(new Error("storage unavailable"));
    await expect(purgeExpiredFormReviews(client)).resolves.toEqual({ deleted: 0, failed: 1 });
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ cleanup_attempt_count: 1, cleanup_failure_reason: "PRIVATE_OBJECT_DELETE_FAILED", cleanup_lease_token: null }));
  });
});
