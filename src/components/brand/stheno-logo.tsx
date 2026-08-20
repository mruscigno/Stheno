type Props = { compact?: boolean; className?: string; decorative?: boolean };

/** The single production STHENO identity. Color and artwork are intentionally fixed. */
export function SthenoLogo({ compact = false, className = "", decorative = false }: Props) {
  return (
    <span className={`stheno-logo${compact ? " stheno-logo-compact" : ""} ${className}`.trim()}>
      <svg className="stheno-logo-mark" viewBox="0 0 64 64" role="img" aria-hidden="true">
        <path d="M12 8h43L43 20H24l-5 6h25l8 9-12 21H9l11-12h14l5-8H16L8 27z" />
      </svg>
      {!compact ? <span className="stheno-logo-type" aria-hidden="true"><b>STHENO</b><small>FITNESS</small></span> : null}
      <span className="sr-only">{decorative ? "" : "STHENO Fitness"}</span>
    </span>
  );
}
