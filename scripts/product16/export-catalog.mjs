import { createClient } from "@supabase/supabase-js";
import { writeFile, mkdir } from "node:fs/promises";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("Supabase export credentials are not configured");

const db = createClient(url, key, { auth: { persistSession: false } });
const { data, error } = await db.from("exercises").select("*").order("slug").limit(400);
if (error) throw error;
if (data.length !== 330) throw new Error(`Expected 330 canonical exercises; received ${data.length}`);
await mkdir("content/exercises", { recursive: true });
await writeFile("content/exercises/canonical-exercises.json", `${JSON.stringify(data, null, 2)}\n`);
console.log(`Exported ${data.length} canonical exercises.`);
