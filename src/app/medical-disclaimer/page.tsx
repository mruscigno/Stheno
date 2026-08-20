import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";
import { LEGAL_EFFECTIVE_DATE, LEGAL_VERSIONS } from "@/lib/legal";

export const metadata = { title: "Fitness & Medical Disclaimer", description: "Important health and safety limitations for STHENO Fitness guidance." };

export default function MedicalDisclaimerPage() {
  return <LegalPage eyebrow={`Fitness & medical disclaimer · version ${LEGAL_VERSIONS.medical_disclaimer} · effective ${LEGAL_EFFECTIVE_DATE}`} title="Fitness & Medical Disclaimer" summary="STHENO provides fitness education and coaching support. It does not diagnose, treat, or replace care from a qualified healthcare professional.">
    <h2>Educational guidance—not medical care</h2><p>Workouts, nutrition targets, Coach responses, calculators, and articles are general educational guidance. They are not medical advice, diagnosis, treatment, rehabilitation, or a substitute for an individual clinical evaluation.</p>
    <h2>Exercise and diet involve risk</h2><p>Physical activity and dietary changes can cause injury, illness, or other adverse effects. You are responsible for choosing whether to participate, using safe equipment and surroundings, and stopping when something does not feel appropriate.</p>
    <h2>When to seek professional guidance</h2><p>Obtain appropriate healthcare evaluation before making material exercise, diet, or supplement changes if you have symptoms, a medical condition, take medication, are pregnant or postpartum, have an injury concern, or have been advised to restrict activity.</p>
    <h2>Urgent symptoms</h2><p>STHENO Coach does not handle emergencies. Stop activity and seek urgent local help for chest pain, fainting, severe shortness of breath, new neurological symptoms, severe allergic reaction, or any other potentially urgent symptom.</p>
    <h2>Nutrition and supplements</h2><p>Calories, macros, body-composition estimates, and projected rates of change are estimates—not guarantees. Supplement information is educational and is not a prescription. STHENO does not diagnose nutrient deficiencies, disease, or eating disorders.</p>
    <h2>Individual response</h2><p>Results vary based on health, history, adherence, recovery, environment, and many other factors. No particular outcome is promised. Use the <Link href="/contact">contact page</Link> for service questions, not urgent care.</p>
  </LegalPage>;
}
