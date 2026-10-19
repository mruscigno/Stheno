import { Body, Button, Card, Eyebrow, SectionTitle, Title } from "@/components/Primitives";
import { Screen } from "@/components/Screen";
import { SthenoLogo } from "@/components/SthenoLogo";
import { useAuth } from "@/providers/AuthProvider";

export default function ProgressScreen(){const {progress}=useAuth(),checkins=progress?.checkins??[],reviews=progress?.reviews??[];return <Screen><SthenoLogo/><Eyebrow>Progress</Eyebrow><Title>Evidence, not guesswork.</Title><Card><SectionTitle>{checkins.length} weekly check-in{checkins.length===1?"":"s"}</SectionTitle><Body muted>{checkins.length>=3?"Your recorded trend is available on the web while native progress review is completed in App 6.":"Three or more observations support a useful trajectory."}</Body></Card><Card><SectionTitle>{reviews.length} monthly review{reviews.length===1?"":"s"}</SectionTitle><Body muted>Full monthly review, photo comparison, and recommendation decisions remain intentionally deferred to App 6.</Body></Card><Button disabled variant="secondary">Monthly review arrives in App 6</Button></Screen>}
