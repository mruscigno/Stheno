# App 6D-2A automation continuation

These scripts are intentionally local, resumable and production-inactive. Source media is never uploaded to an inference provider.

## 1. Technical validation and contact sheets

```powershell
pwsh scripts/app6d2a/automation-continuation/validate-and-extract.ps1
```

This rechecks every source SHA-256, decodes every unique visual payload and writes four-frame evidence sheets under the ignored `artifacts/app6d2a-automation` directory.

## 2. Local CLIP evidence

Install isolated no-cost runtimes outside the application dependency graph:

```powershell
python -m pip install --target artifacts/app6d2a-python-runtime transformers==4.57.3 pillow numpy
python -m pip install --target artifacts/app6d2a-python-ort117 onnxruntime==1.17.3 numpy==1.26.4
```

Download the public `Xenova/clip-vit-base-patch32` config, tokenizer, preprocessor, `text_model_quantized.onnx`, and `vision_model_quantized.onnx` files into:

`artifacts/app6d2a-automation/model-cache/Xenova/clip-vit-base-patch32`

Then run with both isolated targets on `PYTHONPATH`:

```powershell
$env:PYTHONPATH="$(Resolve-Path artifacts/app6d2a-python-ort117);$(Resolve-Path artifacts/app6d2a-python-runtime)"
python scripts/app6d2a/automation-continuation/classify-clip.py --batch-size 128
```

The JSONL output resumes by `asset_id`. ONNX Runtime 1.17.3 is pinned because current native builds require CPU instructions not available on the validation host.

## 3. Isolated database test

```powershell
npm install --prefix artifacts/app6d2a-pglite-runtime --no-save @electric-sql/pglite@0.3.14
node scripts/app6d2a/automation-continuation/test-isolated-database.mjs
```

The suite executes the real additive migration against disposable PostgreSQL-compatible storage and verifies RLS, grants, replay protection and rollback without touching Supabase production.

## 4. Reports

```powershell
node scripts/app6d2a/automation-continuation/finalize-automation-reports.mjs
```

Private model caches, contact sheets and runtime packages remain ignored/uncommitted. The committed CSV/Markdown reports contain the auditable evidence needed to reproduce the disposition decisions.
