"use client";
import Link from "next/link";
import { useEffect, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { SthenoLogo } from "@/components/brand/stheno-logo";
import { captureFunnel, rememberAttribution } from "@/lib/analytics/funnel-client";
import type { SocialCampaign } from "@/modules/acquisition/social-campaigns";

const LANDING_VERSION = "acquisition_v2";
type Props={source:string;campaign:SocialCampaign|null;touch:Record<string,string>};

export function SocialLanding({source,campaign,touch}:Props){
  const router=useRouter();
  const[resume,setResume]=useState(false);
  useEffect(()=>{
    const browser=/CriOS/i.test(navigator.userAgent)?"chrome-ios":/FxiOS/i.test(navigator.userAgent)?"firefox-ios":/Safari/i.test(navigator.userAgent)&&!/Chrome/i.test(navigator.userAgent)?"safari":/Chrome/i.test(navigator.userAgent)?"chrome":"other";
    queueMicrotask(()=>setResume(Boolean(localStorage.getItem("stheno_assessment_4.0.0")||localStorage.getItem("stheno_assessment_3.0.0"))));
    const attribution=rememberAttribution({...touch,source,campaign:campaign??touch.campaign??"",landing_version:LANDING_VERSION,first_landing_path:window.location.pathname});
    const properties={source,campaign:campaign??"",landing_version:LANDING_VERSION,device:matchMedia("(max-width: 700px)").matches?"mobile":"desktop",browser,session_present:Boolean(attribution.sessionId)};
    void captureFunnel("acquisition_landing_view",properties,{dedupeKey:LANDING_VERSION});
    void captureFunnel("social_landing_view",properties,{dedupeKey:LANDING_VERSION});
  },[campaign,source,touch]);
  const start=async(event:MouseEvent<HTMLAnchorElement>)=>{event.preventDefault();const properties={source,campaign:campaign??"",landing_version:LANDING_VERSION,entry:"acquisition_v2"};await Promise.all([captureFunnel("acquisition_primary_cta_click",properties),captureFunnel("social_primary_cta_click",properties)]);router.push("/assessment")};
  const cta=resume?"Continue building my plan":"Build my free plan";
  return <main className="social-start acquisition-v2">
    <header className="social-start-brand"><Link href="/" aria-label="STHENO Fitness home"><SthenoLogo/></Link><Link href="/login">Member sign in</Link></header>
    <section className="social-start-hero">
      <div><p className="kicker">Most fitness apps give you a plan.</p><h1>STHENO helps with what happens next.</h1><p>Your training should respond when real life does. Miss a workout, travel, get stronger, have less time, or change equipment—STHENO helps adjust the next step instead of making you start over.</p><Link className="button button-large" href="/assessment" onClick={start}>{cta}</Link><small>Free to start. No credit card required.</small></div>
      <aside className="product-proof hero-proof" aria-label="STHENO product preview"><p className="proof-label">This week · Upper / Lower</p><article><span>Tuesday</span><strong>Upper A</strong><small>Completed · 7 of 7 sets</small></article><article className="changed"><span>Thursday changed</span><strong>30-minute full-body session</strong><small>Priority work kept · accessories shortened</small></article><p className="proof-note">Schedule change recorded. Your plan stays intact.</p></aside>
    </section>
    <section className="adaptation-loop" aria-labelledby="loop-title"><div><p className="kicker">The plan is only the start</p><h2 id="loop-title">A plan that keeps listening.</h2></div><ol><li><b>01</b><strong>Start with a sensible plan</strong></li><li><b>02</b><strong>Train and record what happened</strong></li><li><b>03</b><strong>Bring in real-life changes</strong></li><li><b>04</b><strong>Get a clear next step</strong></li></ol></section>
    <section className="proof-stories" aria-label="How STHENO adapts">
      <article><div><p className="kicker">Missed Tuesday?</p><h2>Your week isn’t ruined.</h2><p>STHENO keeps the remaining work visible and gives schedule changes a deliberate path instead of treating one miss as failure.</p></div><div className="mini-ui"><span>Schedule repair</span><strong>Upper A · missed</strong><button type="button" tabIndex={-1}>Review this week</button></div></article>
      <article><div><p className="kicker">Only have 30 minutes?</p><h2>Keep the work that matters.</h2><p>The workout logger can shorten a session while preserving the highest-priority training instead of asking you to abandon the day.</p></div><div className="mini-ui"><span>Short on time</span><strong>Keep 4 priority movements</strong><small>Estimated time · 29 min</small></div></article>
      <article><div><p className="kicker">Different gym. Same goal.</p><h2>Change the equipment, not the purpose.</h2><p>Reviewed substitutions preserve the movement pattern when travel, a crowded gym, or equipment availability changes.</p></div><div className="mini-ui"><span>Exercise change</span><strong>Barbell row → Seated cable row</strong><small>Same training role · reviewed alternative</small></div></article>
    </section>
    <section className="guidance-proof"><div><p className="kicker">Know what to do. Know how to do it.</p><h2>Exercise guidance lives beside the workout.</h2><p>Each reviewed guide includes setup, execution steps, useful cues, common mistakes, and alternatives—so the plan is more than a list of exercise names.</p><Link href="/exercises">Browse exercise guidance</Link></div><aside className="mini-ui"><span>Dumbbell bench press</span><strong>Set up</strong><p>Plant your feet, set the shoulder blades, and begin with the dumbbells over the chest.</p><strong>Watch for</strong><p>Do not shorten the range just to increase the load.</p></aside></section>
    <section className="coach-continuity"><p className="kicker">STHENO Coach</p><h2>Your plan shouldn’t stop answering questions after Day 1.</h2><div>{["I missed Tuesday. What should I do?","I’m traveling and only have dumbbells.","Should I add weight next time?","What matters if I only have 30 minutes?"].map(question=><blockquote key={question}>{question}</blockquote>)}</div></section>
    <section className="acquisition-trust"><div><p className="kicker">No miracle promises</p><h2>Recommendations with visible reasons.</h2></div><p>STHENO starts with practical recommendations, records what actually happens, and uses workouts and check-ins to support measured changes. Nutrition targets are estimates. Exercise guidance is reviewed. Progress—not hype—guides the next decision.</p></section>
    <section className="social-how"><p className="kicker">Your starting plan</p><h2>Tell STHENO what the plan needs to handle.</h2><ol><li><strong>Share your real constraints.</strong><span>Goals, schedule, experience, equipment, preferences, and the date you want to begin.</span></li><li><strong>See your free Blueprint.</strong><span>Review the training and nutrition direction before creating an account.</span></li><li><strong>Keep the plan involved.</strong><span>Use workouts, check-ins, Progress, and Coach after Day 1.</span></li></ol></section>
    <section className="acquisition-offer"><div><p className="kicker">Free starting Blueprint</p><h2>Start free. Decide after you see the direction.</h2><p>No payment method is required to complete the assessment and view your starting Blueprint. Membership is $14.99/month after the existing trial period.</p></div><Link className="button button-large" href="/assessment" onClick={start}>{cta}</Link></section>
    <section className="acquisition-faq"><p className="kicker">A few direct answers</p>{[["Do I need a gym?","No. Your available equipment shapes the starting plan."],["What if I miss workouts?","A missed workout becomes information for the next decision—not a reason to restart."],["Is STHENO just an AI workout generator?","No. Technology supports the experience, but STHENO is built around structured training logic, reviewed exercise guidance, training history, and ongoing feedback."],["When do I create an account?","After you complete the assessment and see your free starting Blueprint."]].map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</section>
    <section className="acquisition-final"><p className="kicker">The initial plan is not the entire value.</p><h2>Build a plan that can keep up.</h2><Link className="button button-large" href="/assessment" onClick={start}>{cta}</Link><small>Free to start. No credit card required.</small></section>
  </main>
}
