type Props = { name: string; pattern: string; version?: string };
const angles: Record<string, { start: string; end: string; label: string }> = {
  squat: {
    start: "translateY(-8px)",
    end: "translateY(22px) scaleY(.84)",
    label: "Lower under control, then stand tall",
  },
  hinge: {
    start: "rotate(0deg)",
    end: "rotate(24deg)",
    label: "Send the hips back, then drive through",
  },
  lunge: {
    start: "translateX(-12px)",
    end: "translateX(14px) translateY(10px)",
    label: "Step, lower with control, then return",
  },
  horizontal_push: {
    start: "translateX(-12px)",
    end: "translateX(18px)",
    label: "Press away while the torso stays stable",
  },
  horizontal_pull: {
    start: "translateX(16px)",
    end: "translateX(-10px)",
    label: "Pull toward the body without shrugging",
  },
  vertical_push: {
    start: "translateY(18px)",
    end: "translateY(-18px)",
    label: "Press overhead through a comfortable path",
  },
  vertical_pull: {
    start: "translateY(-18px)",
    end: "translateY(14px)",
    label: "Pull down while keeping the ribs controlled",
  },
  carry: {
    start: "translateX(-18px)",
    end: "translateX(18px)",
    label: "Walk tall with a quiet, braced trunk",
  },
  isolation: {
    start: "rotate(-10deg)",
    end: "rotate(18deg)",
    label: "Move through the target joint with control",
  },
};
export function MovementDemo({ name, pattern }: Props) {
  const motion = angles[pattern] ?? angles.isolation;
  return (
    <figure className="movement-demo">
      <div className="demo-label">
        <span>Movement guide</span>
        <strong>{pattern.replaceAll("_", " ")}</strong>
      </div>
      <svg
        viewBox="0 0 620 400"
        role="img"
        aria-labelledby="movement-title movement-desc"
      >
        <title id="movement-title">{name} movement demonstration</title>
        <desc id="movement-desc">
          A simplified schematic showing the start and finish positions.{" "}
          {motion.label}.
        </desc>
        <line x1="55" y1="345" x2="565" y2="345" />
        <g className="start">
          <circle cx="220" cy="90" r="28" />
          <path d="M220 120 L220 232 M220 145 L165 205 M220 145 L274 202 M220 232 L180 330 M220 232 L265 330" />
        </g>
        <g
          className="finish"
          style={
            {
              "--motion-start": motion.start,
              "--motion-end": motion.end,
            } as React.CSSProperties
          }
        >
          <circle cx="410" cy="90" r="28" />
          <path d="M410 120 L410 232 M410 145 L355 205 M410 145 L464 202 M410 232 L370 330 M410 232 L455 330" />
        </g>
        <text x="220" y="375">
          START
        </text>
        <text x="410" y="375">
          FINISH
        </text>
        <path className="motion-path" d="M285 185 C315 160 330 160 350 185" />
        <path className="arrow" d="M340 171 L353 185 L338 196" />
      </svg>
      <figcaption>
        <span>{motion.label}</span>
      </figcaption>
    </figure>
  );
}
