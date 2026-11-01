import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { Body, Button, Card, Eyebrow, Notice, SectionTitle, Title } from "@/components/Primitives";
import { Screen } from "@/components/Screen";
import { createMobileApiClient, safeApiMessage } from "@/lib/api";
import { readEnvironment } from "@/lib/env";
import { colors, radius, spacing } from "@/theme";
import type { ExerciseDetailReadModel, ExerciseMediaReadModel } from "@shared/contracts/api";

type Exercise = {
  name: string;
  purpose: string;
  skill_level: string;
  required_equipment: string[];
  primary_muscles: string[];
  secondary_muscles: string[];
  education: { setup: string[]; execution: string[]; cues: string[]; mistakes: string[]; feel?: string; stopModify?: string };
};

function asExercise(value: Record<string, unknown>): Exercise {
  return value as unknown as Exercise;
}

function absoluteMediaUrl(path: string) {
  return new URL(path, readEnvironment().EXPO_PUBLIC_API_BASE_URL).toString();
}

function MediaPreview({ media, name }: { media: ExerciseMediaReadModel; name: string }) {
  const player = useVideoPlayer(absoluteMediaUrl(media.videoPath), (instance) => {
    instance.loop = true;
    instance.muted = true;
  });
  return (
    <View style={styles.media} testID="exercise-guide-media">
      <VideoView player={player} style={styles.video} nativeControls contentFit="contain" accessibilityLabel={`${name} movement demonstration`} />
      <Text style={styles.mediaNote}>{media.fallback ? "Approved fallback demonstration" : "Reviewed purchased demonstration"}</Text>
    </View>
  );
}

function Steps({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <SectionTitle>{title}</SectionTitle>
      {items.map((item, index) => <Body key={`${title}-${index}`}>{index + 1}. {item}</Body>)}
    </Card>
  );
}

export default function ExerciseGuideScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<ExerciseDetailReadModel | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    let active = true;
    createMobileApiClient().exercise(slug).then((response) => {
      if (active) setDetail(response.data);
    }).catch((reason) => {
      if (active) setError(safeApiMessage(reason));
    });
    return () => { active = false; };
  }, [slug]);

  if (error) return <Screen><Button variant="text" onPress={() => router.back()}>Back to workout</Button><Notice tone="error">{error}</Notice></Screen>;
  if (!detail) return <Screen><Eyebrow>Exercise guide</Eyebrow><Body muted>Loading reviewed instructions…</Body></Screen>;
  const exercise = asExercise(detail.exercise);
  return (
    <Screen>
      <Button testID="exercise-guide-back" accessibilityLabel="Back to workout" variant="text" onPress={() => router.back()}>Back to workout</Button>
      <Eyebrow>{exercise.skill_level} · {exercise.primary_muscles.join(" · ")}</Eyebrow>
      <Title>{exercise.name}</Title>
      <Body>{exercise.purpose}</Body>
      {detail.media ? <MediaPreview media={detail.media} name={exercise.name} /> : <Notice>Written guidance is available. No approved demonstration is currently available.</Notice>}
      <Card>
        <SectionTitle>What you need</SectionTitle>
        <Body>{exercise.required_equipment.join(", ") || "No equipment"}</Body>
      </Card>
      <Steps title="Set up" items={exercise.education.setup} />
      <Steps title="Perform" items={exercise.education.execution} />
      <Card>
        <SectionTitle>Coaching cues</SectionTitle>
        {exercise.education.cues.map((item, index) => <Body key={`cue-${index}`}>• {item}</Body>)}
      </Card>
      <Card>
        <SectionTitle>Common mistakes</SectionTitle>
        {exercise.education.mistakes.map((item, index) => <Body key={`mistake-${index}`}>• {item}</Body>)}
      </Card>
      {exercise.education.stopModify ? <Notice>{exercise.education.stopModify}</Notice> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  media: { backgroundColor: "#111", borderRadius: radius.medium, overflow: "hidden" },
  video: { width: "100%", height: 320, backgroundColor: "#111" },
  mediaNote: { color: colors.paper, padding: spacing.sm, fontSize: 12, fontWeight: "700" },
});
