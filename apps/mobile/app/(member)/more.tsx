import { Linking } from "react-native";
import { useRouter } from "expo-router";
import { Body, Button, Card, Eyebrow, SectionTitle, Title } from "@/components/Primitives";
import { Screen } from "@/components/Screen";
import { SthenoLogo } from "@/components/SthenoLogo";
import { useAuth } from "@/providers/AuthProvider";

export default function MoreScreen(){const auth=useAuth(),router=useRouter();return <Screen><SthenoLogo/><Eyebrow>More</Eyebrow><Title>Your account and support.</Title><Card><SectionTitle>{auth.member?.profile?.display_name||"STHENO member"}</SectionTitle><Body muted>{auth.member?.email}</Body><Body>{auth.member?.access.state.replaceAll("_"," ")}</Body></Card><Button variant="secondary" onPress={()=>router.push("/(member)/nutrition")}>Nutrition</Button><Button variant="secondary" onPress={()=>router.push("/(member)/account")}>Account and preferences</Button><Button variant="secondary" onPress={()=>void Linking.openURL("https://www.sthenofitness.com/exercises")}>Exercise library</Button><Button variant="secondary" onPress={()=>void Linking.openURL("https://www.sthenofitness.com/contact")}>Contact support</Button><Button variant="text" onPress={()=>void auth.signOut()}>Sign out</Button></Screen>}
