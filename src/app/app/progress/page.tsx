import "@/components/progress/progress-page.css";
import { ProgressExperience } from "@/components/coaching/progress-experience";
import { MonthlyReviewExperience } from "@/components/progress/monthly-review";
import { PerformanceIntelligenceExperience } from "@/components/progress/performance-intelligence";
import { GoalProjection } from "@/components/progress/goal-projection";
import { AdaptiveCoachingSnapshot } from "@/components/progress/adaptive-coaching-snapshot";
export default function ProgressPage() {
  return (
    <div className="progress-page">
      <GoalProjection />
      <AdaptiveCoachingSnapshot />
      <PerformanceIntelligenceExperience />
      <MonthlyReviewExperience />
      <ProgressExperience />
    </div>
  );
}
