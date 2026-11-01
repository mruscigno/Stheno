# App 6D-2A confidence calibration

## Calibration sample

The automated system was calibrated against the prior four-frame review set: **103 accepted mappings** and **6 known mismatches**, spanning archive sources, muscles, equipment and filename-confidence bands. The six known mismatches are the adversarial false-acceptance set; the sample is not represented as professional safety approval.

## Measured behavior

- Deterministic exact-name mapping alone: 77 accepted and 2 rejected; observed precision 97.5%.
- Local CLIP top-five agreement with the reviewed canonical slug: 6/103 accepted (5.8% recall) and 0/6 mismatches.
- The model is useful as reproducible visual evidence but is not reliable enough to distinguish fine-grained exercise variants across 330 labels.
- 0 previously unreviewed representative rows met the loose deterministic-confidence-plus-top-five agreement rule. They remain held because six negative examples cannot establish a safe false-acceptance bound for automatic publication.

## Promotion threshold

No new automatic promotion threshold was empirically defensible. The release therefore preserves the 103 previously reviewed accepted candidates and automatically classifies every other asset as duplicate, non-media, technical quarantine, known mismatch, or low-confidence hold. Medical, safety and technique approval is never inferred from CLIP output.
