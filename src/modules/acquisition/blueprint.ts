export type BlueprintInput={goal:"strength"|"muscle"|"fat_loss"|"general";experience:"new"|"returning"|"consistent";days:2|3|4|5;weightKg?:number;diet:"omnivore"|"vegetarian"|"vegan";};
export type Blueprint={training:{days:number;structure:string;focus:string};nutrition:{proteinGrams:[number,number];approach:string};trajectory:string[];disclaimer:string;version:string};
export function createBlueprint(input:BlueprintInput):Blueprint{
 const weight=Math.min(220,Math.max(40,input.weightKg??75));
 const proteinFactor=input.goal==="muscle"?1.8:input.goal==="fat_loss"?1.7:1.6;
 const low=Math.round(weight*proteinFactor); const high=Math.round(weight*(proteinFactor+.25));
 const structure=input.days<=2?"Two full-body sessions":input.days===3?"Three full-body sessions":input.days===4?"Upper/lower split":"Three strength sessions plus two lighter skill sessions";
 const focus=input.goal==="fat_loss"?"Keep strength while building sustainable activity":input.goal==="muscle"?"Progressive overload with recoverable volume":input.goal==="strength"?"Practice the main movement patterns and add load gradually":"Build repeatable strength, nutrition, and recovery habits";
 return {training:{days:input.days,structure,focus},nutrition:{proteinGrams:[low,high],approach:`A practical ${input.diet} pattern built around protein, produce, and flexible portions.`},trajectory:["Weeks 1–2: learn the plan and establish repeatable effort.","Weeks 3–6: progress repetitions or load when form stays consistent.","Weeks 7–8: review performance, recovery, and adherence before adjusting."],disclaimer:"Educational guidance only—not medical advice. Stop for sharp pain, chest pain, faintness, or unusual shortness of breath and seek qualified care.",version:"1.0.0"};
}
