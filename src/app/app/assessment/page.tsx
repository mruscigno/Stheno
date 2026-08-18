import{AssessmentExperience}from"@/components/assessment/assessment-experience";
export default async function AssessmentPage({searchParams}:{searchParams:Promise<{restart?:string}>}){const{restart}=await searchParams;return <AssessmentExperience restart={restart==="1"}/>}
