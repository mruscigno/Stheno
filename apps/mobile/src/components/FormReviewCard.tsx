import { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useVideoPlayer, VideoView } from "expo-video";
import { Body, Button, Card, Field, Notice, SectionTitle } from "./Primitives";
import { getSupabaseClient } from "@/lib/supabase";
import { readEnvironment } from "@/lib/env";
import { colors, spacing } from "@/theme";

const CONSENT_VERSION = "2026.10-app6b.1";
const reviewedExercises = [
  { slug: "goblet-squat", name: "Goblet Squat" },
  { slug: "barbell-rdl", name: "Barbell Romanian Deadlift" },
  { slug: "lat-pulldown", name: "Lat Pulldown" },
  { slug: "dumbbell-bench-press", name: "Dumbbell Bench Press" },
  { slug: "one-arm-dumbbell-row", name: "One-Arm Dumbbell Row" },
] as const;
const defaultExerciseId = reviewedExercises[0]?.slug ?? "goblet-squat";
function Preview({uri}:{uri:string}){const player=useVideoPlayer(uri);return <VideoView player={player} style={styles.video} nativeControls contentFit="contain"/>}
export function FormReviewCard() {
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset>();
  const [exerciseId, setExerciseId] = useState<string>(defaultExerciseId);
  const [question, setQuestion] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function pick() {
    setError("");
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Allow photo-library access to choose a recorded set.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsEditing: true,
      videoMaxDuration: 30,
      quality: 1,
    });
    if (result.canceled) return;
    const selected = result.assets[0];
    if (!selected) {
      setError("No video was selected. Please try again.");
      return;
    }
    if (
      (selected.fileSize ?? 0) > 75 * 1024 * 1024 ||
      !["video/mp4", "video/quicktime"].includes(selected.mimeType ?? "")
    ) {
      setError("Choose an MP4 or MOV clip under 75 MB.");
      return;
    }
    setAsset(selected);
  }

  async function submit() {
    if (!asset || !consent) return;
    setBusy(true);
    setError("");
    try {
      const supabase = getSupabaseClient();
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error("Sign in again to continue.");
      const base = readEnvironment().EXPO_PUBLIC_API_BASE_URL;
      const headers = { authorization: `Bearer ${token}`, "content-type": "application/json" };
      const mediaType = asset.mimeType ?? "";
      const intentResponse = await fetch(`${base}/api/v1/coach/form-reviews/upload-intent`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          exerciseId,
          cameraView: "unknown",
          fileName: asset.fileName ?? "set.mp4",
          byteSize: asset.fileSize ?? 0,
          mediaType,
          consentVersion: CONSENT_VERSION,
          consentAccepted: true,
          question: question || undefined,
          idempotencyKey: `mobile-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        }),
      });
      const intent = await intentResponse.json();
      if (!intentResponse.ok) throw new Error(intent.error ?? "Unable to prepare upload.");
      setStatus("Uploading privately…");
      const blob = await (await fetch(asset.uri)).blob();
      const upload = await supabase.storage
        .from("coach-form-videos")
        .uploadToSignedUrl(intent.path, intent.token, blob, { contentType: mediaType, upsert: false });
      if (upload.error) throw upload.error;
      const reviewResponse = await fetch(`${base}/api/v1/coach/form-reviews`, {
        method: "POST",
        headers,
        body: JSON.stringify({ reviewId: intent.reviewId, durationSeconds: (asset.duration ?? 0) / 1000 }),
      });
      const review = await reviewResponse.json();
      if (!reviewResponse.ok) throw new Error(review.error ?? "Unable to submit review.");
      setStatus(
        review.status === "queued"
          ? "Queued for private review."
          : "Review safely abstained because processing is not enabled.",
      );
    } catch (next) {
      setError(next instanceof Error ? next.message : "Unable to submit form review.");
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <SectionTitle>Review my exercise form</SectionTitle>
      <Body muted>Choose one private recorded set, up to 30 seconds. Initial coverage is limited to five reviewed exercises.</Body>
      <View style={styles.choices}>
        {reviewedExercises.map((exercise) => (
          <Text
            key={exercise.slug}
            onPress={() => setExerciseId(exercise.slug)}
            style={[styles.choice, exerciseId === exercise.slug && styles.selected]}
          >
            {exercise.name}
          </Text>
        ))}
      </View>
      <Field label="Optional question" value={question} onChangeText={setQuestion} maxLength={500} />
      <Button onPress={() => void pick()}>{asset ? "Choose a different clip" : "Choose recorded clip"}</Button>
      {asset ? <Preview uri={asset.uri} /> : null}
      <View style={styles.consent}>
        <Switch value={consent} onValueChange={setConsent} />
        <Body>I consent to private storage and the external processing disclosed before activation. I can delete the video and review independently.</Body>
      </View>
      {error ? <Notice tone="error">{error}</Notice> : null}
      {status ? <Notice>{status}</Notice> : null}
      <Button busy={busy} disabled={!asset || !consent} onPress={() => void submit()}>
        Submit private clip
      </Button>
      <Body muted>Fitness guidance only. Video review cannot diagnose injury or guarantee safe lifting.</Body>
    </Card>
  );
}
const styles=StyleSheet.create({choices:{gap:spacing.xs},choice:{padding:spacing.sm,borderWidth:1,borderColor:colors.line,borderRadius:12,color:colors.ink,fontWeight:"700"},selected:{borderColor:colors.orange,backgroundColor:"#fff0e9"},video:{width:"100%",height:240,backgroundColor:"#111",borderRadius:14},consent:{flexDirection:"row",alignItems:"flex-start",gap:spacing.sm}});
