type Props = { slug: string; name: string; compact?: boolean };

export function ExerciseVideo({ slug, name, compact = false }: Props) {
  return (
    <figure className={`exercise-video${compact ? " compact" : ""}`}>
      <video
        controls
        loop
        muted
        playsInline
        preload="metadata"
        poster={`/exercise-media/posters/${slug}.webp`}
        aria-label={`${name} movement demonstration`}
      >
        <source src={`/exercise-media/videos/${slug}.mp4`} type="video/mp4" />
        Your browser does not support embedded video.
      </video>
      <figcaption>
        STHENO movement guide · Play, pause, or scrub without leaving this page.
      </figcaption>
    </figure>
  );
}
