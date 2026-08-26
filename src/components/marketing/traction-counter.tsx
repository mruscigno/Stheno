import { TrackView } from "@/components/analytics/tracked-link";
import { getPublicTraction } from "@/modules/marketing/traction";

export async function TractionCounter() {
  const traction = await getPublicTraction();
  if (!traction) return null;
  return (
    <p className="mr-traction">
      <TrackView event="traction_counter_viewed" eventProperties={{ count: traction.count }} />
      <strong>{traction.count.toLocaleString()}+</strong> personalized assessments completed
    </p>
  );
}
