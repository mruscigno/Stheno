import vitalManifest from "@/modules/exercise-media/vital-manifest.json";

type Props = { slug: string; name: string; compact?: boolean };

export function ExerciseVideo({ slug, name, compact = false }: Props) {
  const providerMedia = vitalManifest[slug as keyof typeof vitalManifest];
  const videoPath = providerMedia?.videoPath ?? `/exercise-media/videos/${slug}.mp4`;
  const posterPath = providerMedia?.posterPath ?? `/exercise-media/posters/${slug}.webp`;
  return (
    <figure className={`exercise-video${compact ? " compact" : ""}`}>
      <video
        controls
        loop
        muted
        playsInline
        preload="none"
        poster={posterPath}
        aria-label={`${name} movement demonstration`}
      >
        <source src={videoPath} type="video/mp4" />
        {providerMedia ? <source src={`/exercise-media/videos/${slug}.mp4`} type="video/mp4" /> : null}
        Your browser does not support embedded video.
      </video>
      <figcaption>
        Exercise demonstration · Play, pause, or scrub without leaving this page.
      </figcaption>
    </figure>
  );
}
