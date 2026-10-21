# Privacy, consent, and retention

Consent version `2026.10-app6b.1` names OpenAI analysis of up to 12 sampled still frames, states that audio is not sent, explains limitations, and allows early deletion. The original remains in a private Supabase bucket for at most 30 days. Signed media URLs expire after five minutes; signed upload authorization expires after two hours.

Database rows and objects are owner-scoped. The inference request contains sampled frames, the reviewed rubric, and identifiers needed for processing—not audio or the original video. Temporary local bytes and frames are deleted after every worker attempt. Member deletion removes storage first and then tombstones the row and clears feedback/question content.

