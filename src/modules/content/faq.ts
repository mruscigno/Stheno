import { membership } from "@/modules/commerce/product";

export type FaqItem = { id: string; question: string; answer: string; category: string };

export const faqItems: FaqItem[] = [
  { id: "what-is-stheno", category: "Getting started", question: "What is STHENO Fitness?", answer: "STHENO is personalized fitness coaching that connects your training, nutrition guidance, progress, and coaching in one experience." },
  { id: "who-is-it-for", category: "Getting started", question: "Who is STHENO for?", answer: "STHENO is for adults who want a clear fitness plan without making fitness their entire life. It supports beginners who want direction and experienced trainees who want a more organized approach." },
  { id: "beginners", category: "Getting started", question: "Is STHENO good for beginners?", answer: "Yes. Your experience, equipment, schedule, and goals shape your starting plan, and the exercise library explains setup, execution, useful cues, and common mistakes." },
  { id: "get-started", category: "Getting started", question: "How do I get started?", answer: "Start with the free assessment. It asks about your goals, training background, schedule, equipment, preferences, and constraints, then creates your starting Blueprint." },
  { id: "personalized", category: "Training and personalization", question: "How personalized is my training plan?", answer: "Your plan uses the information you provide, including your goals, experience, available days, session length, training environment, equipment, preferences, and relevant limitations." },
  { id: "miss-workout", category: "Training and personalization", question: "What happens if I miss a workout?", answer: "You do not need to start over. Use STHENO Coach or the plan-adjustment tools to explain what changed and get a practical next step for your schedule." },
  { id: "change-exercise", category: "Training and personalization", question: "Can I change an exercise I cannot do?", answer: "Yes. The workout experience supports substitutions selected for the movement pattern, training role, equipment, and relevant limitations." },
  { id: "home-training", category: "Training and personalization", question: "Can I train at home or while traveling?", answer: "Yes. Your available equipment shapes the program, and you can update STHENO Coach when your equipment or schedule changes." },
  { id: "nutrition", category: "Nutrition", question: "Does STHENO include nutrition guidance?", answer: "Yes. STHENO provides high-level fitness nutrition guidance aligned with your goal, including calorie and macronutrient targets where appropriate. It is not medical nutrition therapy." },
  { id: "meal-plan", category: "Nutrition", question: "Do I have to follow a strict meal plan?", answer: "No. STHENO provides useful targets and principles you can apply to foods you enjoy and a lifestyle you can sustain." },
  { id: "coach", category: "STHENO Coach", question: "What can I ask STHENO Coach?", answer: "You can ask about your training, exercises, nutrition guidance, progress, recovery, equipment, and supported changes to your plan." },
  { id: "medical", category: "STHENO Coach", question: "Is STHENO Coach a replacement for a doctor or physical therapist?", answer: "No. STHENO is a fitness product, not medical care. Medical symptoms, diagnosis, treatment, medication questions, and rehabilitation decisions belong with an appropriate licensed healthcare professional." },
  { id: "price", category: "Membership and billing", question: "How much does STHENO cost?", answer: `STHENO costs ${membership.monthly.label} per month or ${membership.annual.label} per year after the ${membership.trialDays}-day trial.` },
  { id: "billing-options", category: "Membership and billing", question: "Can I choose monthly or annual billing?", answer: "Yes. Both monthly and annual memberships are available through the Pricing page." },
  { id: "cancel", category: "Membership and billing", question: "Can I cancel?", answer: "Yes. Signed-in members can open Account, select Manage billing, and manage or cancel their Stripe subscription." },
  { id: "export", category: "Account, privacy, and data", question: "Can I export my data?", answer: "Yes. Account > Data & privacy provides an authenticated ZIP export containing a complete JSON file plus readable CSV files for supported time-series data, including stored assessment, plan, workout, nutrition, activity, and progress records." },
  { id: "delete", category: "Account, privacy, and data", question: "Can I delete my account?", answer: "Yes. Account > Data & privacy includes a confirmed self-service account deletion action. Cancel billing first if you have an active subscription." },
];

export const homepageFaqItems = faqItems.filter(({ id }) => ["what-is-stheno", "beginners", "personalized", "miss-workout", "home-training", "nutrition", "cancel", "export"].includes(id));
