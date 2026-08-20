import vitalManifest from "@/modules/exercise-media/vital-manifest.json";

type Props = { slug: string; name: string; compact?: boolean };

export function ExerciseVideo({ slug, name, compact = false }: Props) {
  const providerMedia = vitalManifest[slug as keyof typeof vitalManifest];
  if (!providerMedia) return null;
  return (
    <figure className={`exercise-video${compact ? " compact" : ""}`}>
      <video
        controls
        loop
        muted
        playsInline
        preload="none"
        poster={providerMedia.posterPath}
        aria-label={`${name} movement demonstration`}
      >
        <source src={providerMedia.videoPath} type="video/mp4" />
        Your browser does not support embedded video.
      </video>
      <figcaption>
        Exercise demonstration · Play, pause, or scrub without leaving this page.
      </figcaption>
    </figure>
  );
}
