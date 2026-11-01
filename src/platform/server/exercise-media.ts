import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import vitalManifest from "@/modules/exercise-media/vital-manifest.json";
import type { ExerciseMediaReadModel } from "../contracts/api";

type ExerciseIdentity = { id: string; slug: string };

function deliveryUrl(storageKey: string) {
  if (/^https:\/\//.test(storageKey)) return storageKey;
  const base = process.env.STHENO_MEDIA_CDN_BASE_URL;
  if (!base) return null;
  return new URL(storageKey.replace(/^\/+/, ""), base.endsWith("/") ? base : `${base}/`).toString();
}

function legacyFallback(slug: string): ExerciseMediaReadModel | null {
  const media = vitalManifest[slug as keyof typeof vitalManifest];
  if (!media) return null;
  return {
    kind: "provider_animation",
    role: "primary_demo",
    videoPath: media.videoPath,
    posterPath: media.posterPath,
    mimeType: "video/mp4",
    width: null,
    height: null,
    durationSeconds: null,
    segmentStartSeconds: null,
    segmentEndSeconds: null,
    fallback: true,
  };
}

export async function resolveExerciseMediaSet(db: SupabaseClient, exercise: ExerciseIdentity): Promise<ExerciseMediaReadModel[]> {
  const fallback = legacyFallback(exercise.slug);
  if (process.env.STHENO_MEDIA_6D2_ENABLED !== "true") return fallback ? [fallback] : [];
  const { data: links, error: linkError } = await db
    .from("exercise_media_links")
    .select("derivative_id,poster_derivative_id,media_role,segment_start_seconds,segment_end_seconds")
    .eq("exercise_id", exercise.id)
    .eq("active", true)
    .eq("mapping_review_state", "approved")
    .eq("technical_review_state", "approved")
    .eq("editorial_review_state", "approved")
    .order("precedence")
    .limit(6);
  if (linkError || !links?.length) return fallback ? [fallback] : [];
  const derivativeIds = [...new Set(links.flatMap((link) => [link.derivative_id, link.poster_derivative_id]).filter((id): id is string => Boolean(id)))];
  const { data: derivatives, error: derivativeError } = await db
    .from("exercise_media_derivatives")
    .select("id,storage_key,mime_type,width,height,duration_seconds,kind")
    .in("id", derivativeIds)
    .eq("approved", true);
  if (derivativeError || !derivatives?.length) return fallback ? [fallback] : [];
  const resolved = links.flatMap((link): ExerciseMediaReadModel[] => {
    const video = derivatives.find((item) => item.id === link.derivative_id);
    const poster = derivatives.find((item) => item.id === link.poster_derivative_id);
    if (!video) return [];
    const videoPath = deliveryUrl(video.storage_key);
    if (!videoPath) return [];
    return [{
      kind: "reviewed_purchased",
      role: link.media_role,
      videoPath,
      posterPath: poster ? deliveryUrl(poster.storage_key) : null,
      mimeType: video.mime_type,
      width: video.width,
      height: video.height,
      durationSeconds: video.duration_seconds == null ? null : Number(video.duration_seconds),
      segmentStartSeconds: link.segment_start_seconds == null ? null : Number(link.segment_start_seconds),
      segmentEndSeconds: link.segment_end_seconds == null ? null : Number(link.segment_end_seconds),
      fallback: false,
    }];
  });
  return resolved.length ? resolved : fallback ? [fallback] : [];
}

export async function resolveExerciseMedia(db: SupabaseClient, exercise: ExerciseIdentity): Promise<ExerciseMediaReadModel | null> {
  return (await resolveExerciseMediaSet(db, exercise))[0] ?? null;
}
