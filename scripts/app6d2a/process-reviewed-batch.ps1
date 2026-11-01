param(
  [string]$CandidatePath = 'docs\mobile\app6d2a\BATCH_2_CANDIDATES.csv',
  [string]$PrivateRoot = 'artifacts\app6d2a-private',
  [string]$Output = 'docs\mobile\app6d2a'
)

$ErrorActionPreference = 'Stop'
$ffmpeg = Join-Path (Get-Location) 'node_modules\ffmpeg-static\ffmpeg.exe'
$videoDir = Join-Path $PrivateRoot 'derived\videos'; $posterDir = Join-Path $PrivateRoot 'derived\posters'
New-Item -ItemType Directory -Force -Path $videoDir,$posterDir,$Output | Out-Null
$rejected = @{
  'asset-0061' = 'Ambiguous kneeling cable motion is not a reliable primary single-arm cable triceps-extension demonstration.'
  'asset-0125' = 'Clip is a horizontal cable kickback/extension variation and does not accurately represent the canonical primary movement.'
  'asset-0605' = 'Clip shows a floor single-leg glute bridge without the barbell required by the mapped exercise.'
  'asset-0760' = 'Clip uses dumbbells, not the cable equipment required by the mapped exercise.'
  'asset-0886' = 'Clip shows an angled bodyweight/inverted row rather than a vertical pull-up.'
}
$supplemental = @{
  'asset-0869' = 'close_grip_wall_push_up'
  'asset-1066' = 'close_grip_knee_push_up'
  'asset-1067' = 'close_grip_wall_push_up'
}
$rows = Import-Csv -LiteralPath $CandidatePath
$review = foreach ($row in $rows) {
  $decision = if ($rejected.ContainsKey($row.asset_id)) { 'rejected' } else { 'approved_candidate' }
  $role = if ($supplemental.ContainsKey($row.asset_id)) { 'technique_tip' } else { 'primary_demo' }
  [pscustomobject]@{
    asset_id = $row.asset_id; canonical_slug = $row.canonical_slug_candidate; source_sha256 = $row.sha256
    visual_mapping_review = $decision; media_role = $role
    movement_identification = if ($decision -eq 'rejected') { 'mismatch_or_ambiguous' } elseif ($supplemental.ContainsKey($row.asset_id)) { $supplemental[$row.asset_id] } else { $row.canonical_slug_candidate }
    technical_metadata_review = if ($decision -eq 'rejected') { 'rejected' } else { 'consistent_with_visual_evidence' }
    editorial_clarity_review = if ($decision -eq 'rejected') { 'rejected' } else { 'clear_four_frame_demonstration' }
    credentialed_safety_review = 'not_provided'
    review_note = if ($decision -eq 'rejected') { $rejected[$row.asset_id] } elseif ($role -eq 'technique_tip') { 'Accurate variation retained as supplemental media; it must not replace the canonical primary demonstration.' } else { 'Four-frame visual review supports the existing canonical mapping; no new exercise is created.' }
    activation = 'disabled'
  }
}
$review | Export-Csv -NoTypeInformation -Encoding utf8 -LiteralPath (Join-Path $Output 'BATCH_2_QUALITY_AND_SAFETY_REVIEW.csv')

$manifest = foreach ($row in ($rows | Where-Object { -not $rejected.ContainsKey($_.asset_id) })) {
  $source = Get-ChildItem -LiteralPath (Join-Path $PrivateRoot 'sources') -File | Where-Object BaseName -eq $row.asset_id | Select-Object -First 1
  if (-not $source) { throw "Missing private source for $($row.asset_id)" }
  $video = Join-Path $videoDir ($row.asset_id + '.mp4'); $poster = Join-Path $posterDir ($row.asset_id + '.webp')
  & $ffmpeg -hide_banner -loglevel error -y -i $source.FullName -an -vf 'scale=720:720:force_original_aspect_ratio=decrease,pad=720:720:(ow-iw)/2:(oh-ih)/2:color=white' -r 24 -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p -movflags +faststart $video
  if ($LASTEXITCODE -ne 0) { throw "Video conversion failed for $($row.asset_id)" }
  & $ffmpeg -hide_banner -loglevel error -y -i $source.FullName -frames:v 1 -vf 'scale=720:720:force_original_aspect_ratio=decrease,pad=720:720:(ow-iw)/2:(oh-ih)/2:color=white' $poster
  if ($LASTEXITCODE -ne 0) { throw "Poster conversion failed for $($row.asset_id)" }
  [pscustomobject]@{
    asset_id = ('sha256:' + $row.sha256 + ':stheno-6d2a'); review_asset_id = $row.asset_id
    canonical_slug = $row.canonical_slug_candidate; media_role = if ($supplemental.ContainsKey($row.asset_id)) { 'technique_tip' } else { 'primary_demo' }
    source_sha256 = $row.sha256; source_bytes = (Get-Item -LiteralPath $source.FullName).Length
    video_file = $video; video_sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $video).Hash.ToLowerInvariant(); video_bytes = (Get-Item $video).Length
    video_codec = 'h264'; video_dimensions = '720x720'; video_frame_rate = '24'; video_audio = 'removed'
    poster_file = $poster; poster_sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $poster).Hash.ToLowerInvariant(); poster_bytes = (Get-Item $poster).Length
    conversion_profile = 'app6d2a-h264-720-square-crf23-v1'
    storage_key = ('exercise-media/6d2a/' + $row.sha256 + '/primary.mp4'); poster_storage_key = ('exercise-media/6d2a/' + $row.sha256 + '/poster.webp')
    activation = 'disabled'
  }
}
$manifest | Export-Csv -NoTypeInformation -Encoding utf8 -LiteralPath (Join-Path $Output 'BATCH_2_SOURCE_DERIVATIVE_MANIFEST.csv')
Write-Output "Reviewed $($review.Count): accepted $($manifest.Count), rejected $($rejected.Count), supplemental $($supplemental.Count)."
