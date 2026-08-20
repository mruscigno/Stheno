export type ExerciseEducation = {
  setup?: string[];
  execution?: string[];
  feel?: string;
  cues?: string[];
  mistakes?: string[];
  stopModify?: string;
};

type GuideInput = {
  name: string;
  movementPattern: string;
  primaryMuscles: string[];
  equipment: string[];
  education?: ExerciseEducation | null;
};

const label = (value: string) => value.replaceAll("_", " ");

/** Convert stable snake_case taxonomy tokens embedded in copy into human prose. */
export const humanizeExerciseText = (value: string) =>
  value.replace(/\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/g, label);

const humanizeList = (values: string[]) => values.map(humanizeExerciseText);

const patternCopy: Record<string, { setup: string[]; execution: string[]; cues: string[]; mistakes: string[] }> = {
  squat: {
    setup: ["Set your feet about shoulder-width apart and turn the toes slightly out.", "Brace as if preparing for a firm push to the stomach, while keeping your ribs stacked over your pelvis."],
    execution: ["Sit down between your hips while letting the knees track in the same direction as the toes.", "Descend only as far as you can keep the whole foot planted and your torso controlled.", "Push the floor away to stand, keeping the knees aligned rather than letting them collapse inward."],
    cues: ["Keep your whole foot heavy on the floor.", "Let knees and toes point the same way.", "Stand tall without leaning back at the top."],
    mistakes: ["Heels lifting or weight rolling to the inside of the feet.", "Knees collapsing inward during the descent or ascent.", "Dropping faster than you can control or forcing depth by rounding."],
  },
  hinge: {
    setup: ["Stand with the load close to your body and soften—but do not deeply bend—the knees.", "Set your ribs over your pelvis and keep your neck in line with your torso."],
    execution: ["Push your hips backward while the load travels close to your legs.", "Stop when you feel strong tension through the back of the thighs without losing your torso position.", "Drive the hips forward to stand tall, then reset before the next repetition."],
    cues: ["Send the hips back, not down.", "Keep the load close to your legs.", "Finish tall without leaning backward."],
    mistakes: ["Turning the movement into a squat by bending the knees too much.", "Letting the load drift away from the body.", "Forcing extra depth after the pelvis or back begins to tuck or round."],
  },
  horizontal_push: {
    setup: ["Set your hands slightly wider than shoulder width and place the load over the middle of the chest.", "Draw the shoulders gently down and back, keep the wrists stacked over the forearms, and plant your feet or body support firmly."],
    execution: ["Lower the load toward the chest by bending the elbows at a comfortable angle from the torso.", "Stop at the deepest position you can control without the shoulders rolling forward.", "Press away until the arms are straight but not forcefully locked, then stabilize before the next repetition."],
    cues: ["Keep wrists over forearms.", "Lower toward the middle of the chest.", "Press without letting the shoulders roll forward."],
    mistakes: ["Flaring the elbows straight out to the sides.", "Bouncing or dropping through the bottom position.", "Losing foot pressure or lifting the hips to move more load."],
  },
  vertical_push: {
    setup: ["Set the hands just outside shoulder width with the wrists stacked and the load close to shoulder height.", "Brace the torso and keep your ribs from lifting as you prepare to press."],
    execution: ["Press the load upward while keeping the forearms nearly vertical.", "Move your head naturally out of the way, then finish with the load balanced over the shoulders.", "Lower to the starting position under control and reset your brace."],
    cues: ["Keep ribs down as the arms rise.", "Press up, not forward.", "Finish with the load balanced over your base."],
    mistakes: ["Leaning backward to turn the movement into an incline press.", "Letting the wrists fold back under the load.", "Lowering farther than the shoulders can comfortably control."],
  },
  horizontal_pull: {
    setup: ["Set the seat, bench, or stance so the handle can travel toward your lower ribs without obstruction.", "Take the prescribed grip, lengthen the arms, relax the shoulders away from the ears, and keep your torso stable."],
    execution: ["Begin by driving the elbows backward rather than curling the handle with the hands.", "Pull toward the lower ribs while keeping the chest tall and the torso mostly still.", "Pause when the elbows reach the body, then return until the arms are long without letting the shoulders shrug."],
    cues: ["Drive elbows back toward your pockets.", "Keep shoulders away from your ears.", "Return until the arms are long without rounding forward."],
    mistakes: ["Rocking the torso to create momentum.", "Shrugging as the handle approaches the body.", "Pulling mostly with the hands and stopping before the back has shortened."],
  },
  vertical_pull: {
    setup: ["Set your grip just outside shoulder width and secure your body against the seat, pad, or stable hanging position.", "Start with long arms, a tall chest, and shoulders relaxed away from the ears."],
    execution: ["Drive the elbows down toward your sides while bringing the chest toward the handle or bar.", "Stop before the shoulders roll forward or the torso has to swing.", "Return slowly to long arms while maintaining control of the shoulder position."],
    cues: ["Pull elbows down, not hands toward you.", "Keep the chest tall.", "Reach long at the top without shrugging."],
    mistakes: ["Swinging or leaning far backward to move the load.", "Pulling behind the neck.", "Cutting the return short and never reaching a controlled long-arm position."],
  },
  lunge: {
    setup: ["Take a stance long enough that both feet can stay stable as you lower.", "Square your hips forward and keep the front foot fully planted."],
    execution: ["Lower by bending both knees while the front knee tracks over the toes.", "Use a depth that keeps your balance and front heel down.", "Push through the front foot to return, then regain balance before the next repetition."],
    cues: ["Stay tall between both feet.", "Keep the front heel heavy.", "Move straight down and up."],
    mistakes: ["Using a stance so narrow that balance becomes the main challenge.", "Letting the front knee collapse inward.", "Pushing mostly from the trailing foot instead of the working leg."],
  },
  isolation: {
    setup: ["Adjust the machine, cable, band, or bench so the working joint lines up with the resistance and the rest of your body is supported.", "Choose a light starting load and place your hands or feet exactly as the equipment requires."],
    execution: ["Move only the intended joint while the rest of the body stays quiet.", "Use the fullest comfortable range that keeps tension on the target muscle.", "Pause briefly in the shortened position, then return slowly until the muscle is lengthened without the weight stack crashing."],
    cues: ["Keep the rest of your body still.", "Lead with the working joint, not momentum.", "Own the return as much as the lift."],
    mistakes: ["Swinging the torso or using the legs to start the repetition.", "Choosing a load that cuts the range short.", "Letting the weight stack, cable, or dumbbell drop between repetitions."],
  },
  carry: {
    setup: ["Clear a straight walking path and place the load where you can pick it up without twisting.", "Stand tall with the load secure, shoulders level, and ribs stacked over the pelvis."],
    execution: ["Walk with short, controlled steps while keeping the load close and the torso upright.", "Turn with several small steps rather than pivoting under load.", "Finish by stopping fully and lowering the load with the same controlled setup used to lift it."],
    cues: ["Walk tall and quiet.", "Keep shoulders level.", "Use small steps for every turn."],
    mistakes: ["Leaning away from the load.", "Rushing or crossing the feet while turning.", "Dropping the load instead of returning it to the floor under control."],
  },
};

export function completeExerciseGuide(input: GuideInput): Required<ExerciseEducation> {
  const base = patternCopy[input.movementPattern] ?? patternCopy.isolation;
  const existing = input.education ?? {};
  const equipment = input.equipment.map(label).join(", ") || "the prescribed equipment";
  const primary = input.primaryMuscles.map(label).join(" and ") || "target muscles";
  const setup = existing.setup && existing.setup.length >= 3 ? existing.setup : [
    `Go to the ${equipment} area, clear enough space to move, and confirm the equipment is secure before starting ${input.name}.`,
    ...base.setup,
    "Complete one unloaded or very light practice repetition and adjust the setup if the path feels awkward.",
  ];
  const execution = existing.execution && existing.execution.length >= 4 ? existing.execution : [
    ...base.execution,
    "Breathe out through the hardest part of the repetition, inhale as you return, and keep each repetition on the same path.",
    "After the final repetition, stabilize the load first and return it to the rack, stack, or floor without twisting or dropping it.",
  ];
  return {
    setup: humanizeList(setup),
    execution: humanizeList(execution),
    feel: humanizeExerciseText(existing.feel ?? `You should feel the ${primary} doing most of the work, with effort building in the muscle rather than sharp pressure in a joint.`),
    cues: humanizeList(existing.cues && existing.cues.length >= 3 ? existing.cues : base.cues),
    mistakes: humanizeList(existing.mistakes && existing.mistakes.length >= 3 ? existing.mistakes : base.mistakes),
    stopModify: humanizeExerciseText(existing.stopModify ?? "Stop or shorten the range if you feel sharp, sudden, worsening, or joint-focused pain. Choose a reviewed alternative if a comfortable setup is not available."),
  };
}

export function guideCompletenessErrors(education: ExerciseEducation) {
  const errors: string[] = [];
  if ((education.setup?.length ?? 0) < 3) errors.push("SETUP_STEPS_REQUIRED");
  if ((education.execution?.length ?? 0) < 4) errors.push("EXECUTION_STEPS_REQUIRED");
  if (!education.feel) errors.push("FEEL_DESCRIPTION_REQUIRED");
  if ((education.cues?.length ?? 0) < 3) errors.push("COACHING_CUES_REQUIRED");
  if ((education.mistakes?.length ?? 0) < 3) errors.push("COMMON_MISTAKES_REQUIRED");
  if (!education.stopModify) errors.push("STOP_MODIFY_GUIDANCE_REQUIRED");
  return errors;
}
