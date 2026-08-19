import JSZip from "jszip";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { csvFromRows, csvSections, exportQueries } from "@/modules/account/export";

export async function GET() {
  const db = await createSupabaseServerClient();
  const { data: { user } } = db ? await db.auth.getUser() : { data: { user: null } };
  if (!db || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const requestedAt = new Date().toISOString();
  const { data: audit } = await db.from("data_export_events").insert({ user_id: user.id, status: "requested" }).select("id").maybeSingle();
  try {
    const results = await Promise.all(exportQueries.map(async ([name, table, fields]) => {
      const { data, error } = await db.from(table).select(fields).eq("user_id", user.id).limit(10000);
      if (error) throw new Error(`Unable to export ${name}`);
      return [name, data ?? []] as const;
    }));
    const sections = Object.fromEntries(results);
    const bundle = { exportVersion: "1.0", requestedAt, account: { email: user.email, createdAt: user.created_at }, sections };
    const zip = new JSZip();
    zip.file("stheno-data.json", JSON.stringify(bundle, null, 2));
    for (const [name, rows] of results) if (csvSections.has(name)) zip.file(`${name}.csv`, csvFromRows(rows as unknown as Record<string, unknown>[]));
    zip.file("README.txt", "This archive contains the fitness, assessment, plan, workout, nutrition, activity, and progress information stored for your STHENO account. JSON is the complete machine-readable export; CSV files cover commonly reviewed time-series data.\n");
    const body = await zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
    if (audit?.id) await db.from("data_export_events").update({ status: "completed", completed_at: new Date().toISOString(), record_count: results.reduce((sum, [, rows]) => sum + rows.length, 0) }).eq("id", audit.id).eq("user_id", user.id);
    return new Response(body, { headers: { "content-type": "application/zip", "content-disposition": `attachment; filename="stheno-data-${requestedAt.slice(0, 10)}.zip"`, "cache-control": "private, no-store" } });
  } catch {
    if (audit?.id) await db.from("data_export_events").update({ status: "failed", completed_at: new Date().toISOString() }).eq("id", audit.id).eq("user_id", user.id);
    return Response.json({ error: "Your export could not be completed. Please try again." }, { status: 500, headers: { "cache-control": "private, no-store" } });
  }
}
