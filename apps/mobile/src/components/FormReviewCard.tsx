import { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useVideoPlayer, VideoView } from "expo-video";
import { Body, Button, Card, Field, Notice, SectionTitle } from "./Primitives";
import { getSupabaseClient } from "@/lib/supabase";
import { readEnvironment } from "@/lib/env";
import { colors, spacing } from "@/theme";

type ReviewResult = {
  abstained: boolean;
  positives: string[];
  priorities: string[];
  limitations: string[];
  caution_note: string;
  recommended_camera_view: string | null;
};

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
  const [reviewId, setReviewId] = useState<string>();
  const [result, setResult] = useState<ReviewResult>();

  async function poll(base: string, headers: Record<string, string>, id: string) {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 4000));
      const response = await fetch(`${base}/api/v1/coach/form-reviews/${id}`, { headers });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Unable to load review status.");
      const review = body.review;
      if (["completed", "abstained"].includes(review.processing_status)) {
        setResult(review.structured_result);
        setStatus(review.processing_status === "abstained" ? "Review completed with limited evidence." : "Review complete.");
        return;
      }
      if (["failed", "deleted", "expired"].includes(review.processing_status)) {
        throw new Error("The review could not be completed. Failed processing does not use your monthly quota.");
      }
      setStatus("Private review is processing. You can return to Coach later.");
    }
    setStatus("Review is still queued. Return to Coach later to see the result.");
  }

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
      (selected.fileSize ?? 0) > 50 * 1024 * 1024 ||
      !["video/mp4", "video/quicktime"].includes(selected.mimeType ?? "")
    ) {
      setError("Choose an MP4 or MOV clip under 50 MB.");
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
      setReviewId(intent.reviewId);
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
      if (review.status === "queued") {
        setStatus("Queued for private review.");
        await poll(base, headers, intent.reviewId);
      } else {
        setResult(review.review);
        setStatus("Review safely abstained because processing is not enabled.");
      }
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
        <Body>I consent to private storage and OpenAI analysis of up to 12 sampled still frames. Audio is not sent. The video is deleted within 30 days, and I can delete it sooner.</Body>
      </View>
      {result ? <View style={styles.result}><SectionTitle>{result.abstained ? "We need a clearer recording" : "Your form review"}</SectionTitle>{result.positives.map((item) => <Body key={`positive-${item}`}>✓ {item}</Body>)}{result.priorities.map((item, index) => <Body key={`priority-${item}`}>{index + 1}. {item}</Body>)}{result.limitations.map((item) => <Body key={`limit-${item}`} muted>Limit: {item}</Body>)}{result.recommended_camera_view ? <Body muted>Suggested view: {result.recommended_camera_view}</Body> : null}<Notice>{result.caution_note}</Notice></View> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      {status ? <Notice>{status}</Notice> : null}
      <Button busy={busy} disabled={!asset || !consent} onPress={() => void submit()}>
        Submit private clip
      </Button>
      {reviewId ? <Body muted>Private review reference: {reviewId.slice(0, 8)}</Body> : null}
      <Body muted>Fitness guidance only. Video review cannot diagnose injury or guarantee safe lifting.</Body>
    </Card>
  );
}
const styles=StyleSheet.create({choices:{gap:spacing.xs},choice:{padding:spacing.sm,borderWidth:1,borderColor:colors.line,borderRadius:12,color:colors.ink,fontWeight:"700"},selected:{borderColor:colors.orange,backgroundColor:"#fff0e9"},video:{width:"100%",height:240,backgroundColor:"#111",borderRadius:14},consent:{flexDirection:"row",alignItems:"flex-start",gap:spacing.sm},result:{gap:spacing.xs,borderWidth:1,borderColor:colors.line,borderRadius:14,padding:spacing.md}});
