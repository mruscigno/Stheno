import vitalManifest from "@/modules/exercise-media/vital-manifest.json";
import type { ExerciseMediaReadModel } from "@/platform/contracts/api";

type Props = { slug: string; name: string; compact?: boolean; media?: ExerciseMediaReadModel | null };

export function ExerciseVideo({ slug, name, compact = false, media }: Props) {
  const legacy = vitalManifest[slug as keyof typeof vitalManifest];
  const providerMedia = media ?? (legacy ? { videoPath: legacy.videoPath, posterPath: legacy.posterPath, mimeType: "video/mp4", kind: "provider_animation" as const } : null);
  if (!providerMedia) return null;
  return (
    <figure className={`exercise-video${compact ? " compact" : ""}`}>
      <video
        controls
        loop
        muted
        playsInline
        preload="none"
        poster={providerMedia.posterPath ?? undefined}
        aria-label={`${name} movement demonstration`}
      >
        <source src={providerMedia.videoPath} type={providerMedia.mimeType} />
        Your browser does not support embedded video.
      </video>
      <figcaption>
        {providerMedia.kind === "reviewed_purchased" ? "Reviewed exercise demonstration" : "Exercise demonstration"} · Play, pause, or scrub without leaving this page.
      </figcaption>
    </figure>
  );
}
