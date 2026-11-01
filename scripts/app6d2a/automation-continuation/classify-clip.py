#!/usr/bin/env python3
"""Run zero-cost local CLIP classification for App 6D-2A contact sheets.

The script uses the separately downloaded Xenova CLIP ONNX models and writes a
resumable JSONL evidence stream. It never uploads source media or calls a paid
inference API.
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image
from transformers import AutoTokenizer, CLIPImageProcessor


def unit(values: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(values, axis=1, keepdims=True)
    return values / np.maximum(norms, 1e-12)


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    parser.add_argument("--batch-size", type=int, default=8)
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    root = Path(args.root).resolve()
    model_root = root / "artifacts/app6d2a-automation/model-cache/Xenova/clip-vit-base-patch32"
    onnx_root = model_root / "onnx"
    output = root / "artifacts/app6d2a-automation/clip-predictions.jsonl"
    validation = load_csv(root / "docs/mobile/app6d2a/automation-continuation/TECHNICAL_VALIDATION.csv")
    dispositions = {row["asset_id"]: row for row in load_csv(root / "docs/mobile/app6d2a/ASSET_DISPOSITION_MASTER.csv")}
    catalog = json.loads((root / "content/exercises/canonical-exercises.json").read_text(encoding="utf-8"))

    text_session = ort.InferenceSession(str(onnx_root / "text_model_quantized.onnx"), providers=["CPUExecutionProvider"])
    vision_session = ort.InferenceSession(str(onnx_root / "vision_model_quantized.onnx"), providers=["CPUExecutionProvider"])
    tokenizer = AutoTokenizer.from_pretrained(str(model_root), local_files_only=True)
    processor = CLIPImageProcessor.from_pretrained(str(model_root), local_files_only=True)

    prompts = [
        f"a clear instructional fitness demonstration of {exercise['name']}, "
        f"a {exercise.get('pattern', 'resistance training')} exercise using "
        f"{', '.join(exercise.get('requiredEquipment', [])) or 'bodyweight'}"
        for exercise in catalog
    ]
    tokens = tokenizer(prompts, padding=True, truncation=True, return_tensors="np")
    text_embeddings = unit(text_session.run(None, {"input_ids": tokens["input_ids"].astype(np.int64)})[0])

    completed: set[str] = set()
    if output.exists():
        for line in output.read_text(encoding="utf-8").splitlines():
            if line.strip():
                completed.add(json.loads(line)["asset_id"])

    queue = [
        row for row in validation
        if row["representative"].lower() == "true"
        and row["technical_status"] == "verified"
        and row["asset_id"] not in completed
    ]
    if args.limit:
        queue = queue[: args.limit]

    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("a", encoding="utf-8", newline="\n") as handle:
        for start in range(0, len(queue), args.batch_size):
            rows = queue[start : start + args.batch_size]
            images = [Image.open(root / row["contact_sheet"]).convert("RGB") for row in rows]
            pixels = processor(images=images, return_tensors="np")["pixel_values"].astype(np.float32)
            image_embeddings = unit(vision_session.run(None, {"pixel_values": pixels})[0])
            scores = image_embeddings @ text_embeddings.T

            for index, row in enumerate(rows):
                ordering = np.argsort(scores[index])[::-1][:5]
                top = [
                    {
                        "slug": catalog[int(candidate)]["slug"],
                        "name": catalog[int(candidate)]["name"],
                        "score": round(float(scores[index, candidate]), 6),
                    }
                    for candidate in ordering
                ]
                source = dispositions[row["asset_id"]]
                deterministic = source.get("canonical_slug_candidate") or None
                rank = next((rank + 1 for rank, item in enumerate(top) if item["slug"] == deterministic), None)
                record = {
                    "asset_id": row["asset_id"],
                    "sha256": row["sha256"],
                    "model": "Xenova/clip-vit-base-patch32",
                    "model_dtype": "q8",
                    "runtime": "onnxruntime-cpu-1.17.3",
                    "evidence_frames": 4,
                    "prompt_version": "app6d2a-clip-v1",
                    "deterministic_candidate": deterministic,
                    "deterministic_basis": source.get("mapping_basis") or "unresolved",
                    "deterministic_confidence": float(source.get("mapping_confidence") or 0),
                    "visual_top": top,
                    "visual_margin": round(top[0]["score"] - top[1]["score"], 6),
                    "candidate_rank": rank,
                }
                handle.write(json.dumps(record, separators=(",", ":")) + "\n")
                handle.flush()

            print(f"classified {min(start + len(rows), len(queue))}/{len(queue)}", flush=True)


if __name__ == "__main__":
    main()
