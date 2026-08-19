import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Methodology & Editorial Standard",
  description:
    "How STHENO handles estimates, evidence, review status, safety boundaries, and updates.",
};

const standards = [
  {
    title: "How recommendations are made",
    copy: "Deterministic rules use the information a person provides—goal, experience, schedule, equipment, training history, and relevant constraints—to produce a starting range. Subsequent changes use completed training, reported effort, recovery, and trend data rather than a one-time prediction.",
  },
  {
    title: "Evidence and editorial status",
    copy: "Articles identify their author, update date, methodology version, evidence notes, and whether independent review occurred. STHENO does not imply independent medical review where none occurred. Published content is edited for a clear claim, practical decision, limits, and safety boundary.",
  },
  {
    title: "Exercise library",
    copy: "Only production exercises with reviewed status appear publicly. Profiles expose the content version, exercise taxonomy, education, caution context, and media provenance. The movement schematics are original STHENO illustrations, not scraped third-party demonstrations.",
  },
  {
    title: "Tools and estimates",
    copy: "Calculators are deterministic and repeatable. Results are starting ranges—not diagnoses, guarantees, or precise measurements of metabolism or body composition. Each tool explains its inputs, useful interpretation, and main limitations.",
  },
  {
    title: "Safety boundary",
    copy: "STHENO provides fitness education and coaching support. It is not emergency care and does not diagnose injury, illness, eating disorders, or other medical conditions. Sharp pain, chest pain, faintness, neurological symptoms, or unusual shortness of breath require appropriate qualified care.",
  },
];

export default function Methodology() {
  return (
    <main className="methodology-page shell">
      <nav className="breadcrumbs">
        <Link href="/">Home</Link> / Methodology
      </nav>
      <header className="methodology-hero">
        <p className="eyebrow">The STHENO standard</p>
        <h1>Useful guidance with visible limits.</h1>
        <p className="lede">
          STHENO turns established fitness principles into practical starting
          decisions. We show where an answer is an estimate, preserve the
          context behind changes, and do not present education as diagnosis.
        </p>
      </header>
      <div className="methodology-grid">
        {standards.map((standard, index) => (
          <section key={standard.title}>
            <span aria-hidden="true">0{index + 1}</span>
            <div>
              <h2>{standard.title}</h2>
              <p>{standard.copy}</p>
            </div>
          </section>
        ))}
      </div>
      <div className="methodology-actions">
        <Link className="button" href="/assessment">
          Build my free plan
        </Link>
        <Link className="methodology-link" href="/insights">
          Read published guides →
        </Link>
      </div>
    </main>
  );
}
