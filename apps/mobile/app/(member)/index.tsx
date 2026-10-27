import { useRouter } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { Body, Button, Card, Eyebrow, Row, SectionTitle, Title } from "@/components/Primitives";
import { Screen } from "@/components/Screen";
import { SthenoLogo } from "@/components/SthenoLogo";
import { useAuth } from "@/providers/AuthProvider";
import { colors, spacing } from "@/theme";
import { useWorkout } from "@/providers/WorkoutProvider";

export default function TodayScreen() {
  const auth = useAuth(), workoutState=useWorkout(), router = useRouter(), today = auth.today;
  const name = auth.member?.profile?.display_name?.trim()?.split(/\s+/)[0];
  const workouts = auth.program?.prescription.workouts ?? [], active = today?.activeWorkout;
  const next = active ? workouts.find((item) => item.key === active.workout_key) : workouts[0];
  return <Screen><SthenoLogo/><Eyebrow>Today</Eyebrow><Title>{name ? `Ready, ${name}?` : "Your plan for today."}</Title>
    <Card><Row><SectionTitle>{active||workoutState.workout ? "Continue workout" : next?.name ?? "Training day"}</SectionTitle><Text style={styles.pill}>{active||workoutState.workout ? "In progress" : auth.program?.prescription.phase ?? "Current phase"}</Text></Row><Body muted>{next?.estimatedMinutes ? `${next.estimatedMinutes} minutes · ` : ""}{next?.exercises?.length ?? 0} exercises</Body><Button onPress={() => router.push("/(member)/workout")}>{active||workoutState.workout ? "Open current workout" : "Start workout"}</Button></Card>
    <Row><Button variant="secondary" onPress={() => router.push("/(member)/adapt")}>Adjust today</Button><Button variant="secondary" onPress={() => router.push("/(member)/coach")}>Ask Coach</Button></Row>
    {today?.nutrition ? <Card><Eyebrow>Nutrition</Eyebrow><SectionTitle>{today.nutrition.calories_kcal.toLocaleString()} kcal</SectionTitle><Body muted>{today.nutrition.protein_g}g protein · {today.nutrition.carbohydrate_g}g carbs · {today.nutrition.fat_g}g fat</Body><Button variant="text" onPress={() => router.push("/(member)/nutrition")}>See nutrition plan →</Button></Card> : <Card><SectionTitle>Nutrition targets unavailable</SectionTitle><Body muted>Complete or refresh your plan before using nutrition targets.</Body></Card>}
    <Card><Eyebrow>Review</Eyebrow><SectionTitle>{today?.review?.monthly_review_due ? "Your monthly review is due" : "Your plan is monitoring progress"}</SectionTitle><Body muted>{today?.review?.next_monthly_review_at ? `Next review ${new Date(today.review.next_monthly_review_at).toLocaleDateString()}.` : "Review timing will appear when enough plan history exists."}</Body><Button variant="text" onPress={() => router.push("/(member)/progress")}>View progress →</Button></Card>
    <Button testID="member-today-ready" accessibilityLabel="Member Today loaded" variant="text" onPress={() => void auth.refresh()}>Refresh today</Button>
  </Screen>;
}
const styles=StyleSheet.create({pill:{color:colors.orangeDark,backgroundColor:colors.soft,paddingHorizontal:spacing.sm,paddingVertical:spacing.xs,borderRadius:999,fontWeight:"700"}});
