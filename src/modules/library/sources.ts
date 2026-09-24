import type { Pillar } from "./articles";

export type EditorialSource = {
  title: string;
  authors: string;
  publication: string;
  year: number;
  url: string;
  supports: string;
};

const progression: EditorialSource = { title: "Progression models in resistance training for healthy adults", authors: "American College of Sports Medicine", publication: "Medicine & Science in Sports & Exercise", year: 2009, url: "https://pubmed.ncbi.nlm.nih.gov/19204579/", supports: "Progressive resistance-training structure, overload, and exercise sequencing." };
const activity: EditorialSource = { title: "WHO guidelines on physical activity and sedentary behaviour", authors: "World Health Organization", publication: "World Health Organization", year: 2020, url: "https://www.who.int/publications/i/item/9789240015128", supports: "Evidence-based recommendations for the frequency, intensity, and duration of physical activity." };
const protein: EditorialSource = { title: "International Society of Sports Nutrition position stand: protein and exercise", authors: "Jäger R, Kerksick CM, Campbell BI, et al.", publication: "Journal of the International Society of Sports Nutrition", year: 2017, url: "https://pubmed.ncbi.nlm.nih.gov/28642676/", supports: "Protein intake ranges and the interaction between protein intake and resistance exercise." };
const bodyComposition: EditorialSource = { title: "International society of sports nutrition position stand: diets and body composition", authors: "Aragon AA, Schoenfeld BJ, Wildman R, et al.", publication: "Journal of the International Society of Sports Nutrition", year: 2017, url: "https://pubmed.ncbi.nlm.nih.gov/28630601/", supports: "Energy balance, dietary approaches, and body-composition outcomes." };
const supplements: EditorialSource = { title: "Dietary Supplements for Exercise and Athletic Performance", authors: "National Institutes of Health, Office of Dietary Supplements", publication: "NIH Office of Dietary Supplements", year: 2025, url: "https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-HealthProfessional/", supports: "Evidence, limitations, safety, and regulation of performance supplements." };

export const sourcesByPillar: Record<Pillar, EditorialSource[]> = {
  "getting-started": [activity, progression],
  "fat-loss": [bodyComposition, protein],
  "muscle-strength": [progression, protein],
  nutrition: [protein, bodyComposition],
  supplements: [supplements, protein],
  recovery: [activity, progression],
};
