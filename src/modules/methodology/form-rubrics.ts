export type FormReviewRubric = {
  exerciseId: string;
  version: string;
  reviewStatus: "reviewed";
  observableCheckpoints: string[];
  commonCompensations: string[];
  cameraViews: string[];
  safetyEscalation: string[];
  limitations: string;
};

const sharedLimit = "A future video review can describe visible movement only. It cannot diagnose injury, infer pain, or replace in-person clinical or coaching assessment.";

export const formReviewRubrics: FormReviewRubric[] = [
  { exerciseId: "goblet-squat", version: "2026.10.1", reviewStatus: "reviewed", observableCheckpoints: ["feet remain planted", "knees track consistently with toes", "torso and pelvis move under control", "depth stays within the member's controlled range"], commonCompensations: ["heels lift", "knees collapse inward", "loss of trunk control", "uncontrolled bottom position"], cameraViews: ["front three-quarter", "side"], safetyEscalation: ["member reports sharp or worsening pain", "visible loss of balance under load"], limitations: sharedLimit },
  { exerciseId: "barbell-rdl", version: "2026.10.1", reviewStatus: "reviewed", observableCheckpoints: ["hips travel backward", "bar stays close to legs", "spine position remains controlled", "range ends before position is lost"], commonCompensations: ["bar drifts forward", "movement becomes a squat", "uncontrolled spinal motion", "lockout leans backward"], cameraViews: ["side", "rear three-quarter"], safetyEscalation: ["member reports sharp back or radiating pain", "uncontrolled loaded position"], limitations: sharedLimit },
  { exerciseId: "lat-pulldown", version: "2026.10.1", reviewStatus: "reviewed", observableCheckpoints: ["torso remains stable", "elbows travel down with control", "bar path stays in front of the head", "return is controlled"], commonCompensations: ["large backward swing", "pulling behind the neck", "shrugging throughout", "dropping the weight stack"], cameraViews: ["front", "side three-quarter"], safetyEscalation: ["member reports sharp shoulder or neck pain", "loss of equipment control"], limitations: sharedLimit },
  { exerciseId: "dumbbell-bench-press", version: "2026.10.1", reviewStatus: "reviewed", observableCheckpoints: ["feet and torso stay stable", "wrists remain stacked over forearms", "dumbbells descend under control", "range remains comfortable and repeatable"], commonCompensations: ["wrists fold back", "shoulders roll forward", "dumbbells collide", "excessive torso movement"], cameraViews: ["side three-quarter", "front three-quarter"], safetyEscalation: ["member reports sharp shoulder or chest pain", "loss of control over a dumbbell"], limitations: sharedLimit },
  { exerciseId: "one-arm-dumbbell-row", version: "2026.10.1", reviewStatus: "reviewed", observableCheckpoints: ["support position stays stable", "elbow travels toward the hip", "torso rotation remains limited", "lowering is controlled"], commonCompensations: ["large torso twist", "shoulder shrugs", "weight is jerked from the floor", "support position collapses"], cameraViews: ["rear three-quarter", "side"], safetyEscalation: ["member reports sharp back or shoulder pain", "unstable support surface"], limitations: sharedLimit },
];

export function formRubricFor(exerciseId: string) {
  return formReviewRubrics.find((rubric) => rubric.exerciseId === exerciseId);
}
