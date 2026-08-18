type Props = {
  topic: string;
  principle: string;
};

export function ArticleWorkbook({ topic, principle }: Props) {
  return (
    <section className="article-workbook" id="workbook">
      <h2>A four-week decision protocol</h2>
      <p>
        Advice about {topic.toLowerCase()} becomes useful only when it changes a decision. Use the next four
        weeks as a controlled trial. The aim is not to prove that one method works forever; it is to learn
        whether a reasonable starting choice works in your present circumstances. Begin by writing one outcome
        in plain language, one behavior you can repeat, and one signal that would justify an adjustment. Keep the
        scope narrow enough that you can tell what happened. A plan that changes training, food, sleep, steps,
        supplements, and schedule at once may feel comprehensive, but it produces very little usable feedback.
      </p>

      <h3>Week 0: define the experiment</h3>
      <p>
        Record your starting context before you act: normal schedule, available equipment, recent consistency,
        relevant symptoms or limitations, and the amount of effort you can realistically give. Choose a minimum
        version for difficult days as well as the intended version. Decide how often you will measure the result
        and when you will review it. Daily measurements can be useful, but daily decisions usually are not.
        Separate collection from interpretation so a noisy morning does not rewrite the week. The governing
        principle is: {principle}
      </p>

      <h3>Week 1: practice the setup</h3>
      <p>
        Treat the first week as rehearsal. Notice whether instructions are clear, the timing fits, and the
        required food, equipment, or environment is actually available. Small logistical failures are valuable
        findings. Fix the cue, preparation step, or calendar window before changing the underlying dose. Record
        completion and one short note about difficulty. Do not reward an unusually easy day by making several
        spontaneous increases, and do not punish one difficult day with a complete restart.
      </p>

      <h3>Week 2: repeat under ordinary conditions</h3>
      <p>
        Repetition creates a comparison. Keep the main choice stable and watch whether execution becomes more
        reliable. Look for patterns across exposures: the same exercise causing trouble, the same meal becoming
        inconvenient, the same evening session being displaced, or the same recovery signal declining. A pattern
        deserves attention; an isolated inconvenience usually deserves a note. If safety or concerning symptoms
        are involved, stop the experiment and seek qualified guidance rather than waiting for more data.
      </p>

      <h3>Week 3: test the weakest link</h3>
      <p>
        By now, identify the single point most likely to limit the result. Change only that point. You might move
        a session, reduce an exercise by one set, prepare a protein option earlier, set a more realistic activity
        floor, or protect a consistent bedtime window. Keep the intended outcome and the other important inputs
        steady. This is the week that turns tracking into coaching: the observation should lead to a proportionate
        action, and the action should be small enough to evaluate.
      </p>

      <h3>Week 4: review without grading yourself</h3>
      <p>
        Compare the result with the decision rule you wrote at the start. Ask four questions: Was the plan
        completed often enough to evaluate? Did the chosen outcome move in the expected direction? What did the
        plan cost in time, fatigue, hunger, stress, or attention? Would the same setup remain workable next month?
        A useful trial can produce three legitimate decisions: continue unchanged, make one measured adjustment,
        or replace a poor-fit method while preserving its purpose. None of those outcomes is a moral verdict.
      </p>

      <h3>How to interpret mixed results</h3>
      <p>
        Mixed signals are common. Performance can improve while scale weight is flat; attendance can improve while
        motivation feels ordinary; sleep duration can rise without immediately changing fatigue. Rank signals by
        their relationship to the goal and by measurement quality. Give more weight to repeated, comparable
        observations than to a vivid single event. When two important signals genuinely conflict, choose the option
        that protects health and keeps the experiment recoverable, then gather another short block of evidence.
        Precision is useful only when the underlying data and decision are equally precise.
      </p>

      <h3>What to carry forward</h3>
      <p>
        Keep a short record of the starting choice, the reason for it, the change you made, and what followed.
        That history prevents circular decision-making and helps a coach or clinician understand the context.
        Over time, the goal is not to eliminate uncertainty. It is to build a personal set of reliable responses:
        which schedule survives busy weeks, which dose supports progress, which measures clarify the trend, and
        which warning signs mean general fitness guidance is no longer enough. That is durable personalization—an
        informed process that can adapt without becoming random.
      </p>
    </section>
  );
}
