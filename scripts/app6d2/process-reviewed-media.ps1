param(
  [string]$Batch = 'docs\mobile\app6d2\BATCH_1_CANDIDATES.csv',
  [string]$PrivateRoot = 'artifacts\app6d2-private',
  [string]$Output = 'docs\mobile\app6d2'
)

$ErrorActionPreference = 'Stop'
$ffmpeg = Join-Path (Get-Location) 'node_modules\ffmpeg-static\ffmpeg.exe'
$videoDir = Join-Path $PrivateRoot 'derived\videos'
$posterDir = Join-Path $PrivateRoot 'derived\posters'
New-Item -ItemType Directory -Force -Path $videoDir,$posterDir,$Output | Out-Null
$rows = Import-Csv -LiteralPath $Batch
$rejected = @{
  'asset-0848' = 'Visual evidence shows a chest-supported dumbbell row, not a push-up.'
}

$review = foreach ($row in $rows) {
  $decision = if ($rejected.ContainsKey($row.asset_id)) { 'rejected' } else { 'approved_candidate' }
  [pscustomobject]@{
    asset_id = $row.asset_id
    canonical_slug = $row.canonical_slug
    source_sha256 = $row.source_sha256
    visual_mapping_review = $decision
    visual_evidence = $row.contact_sheet
    movement_identification = if ($decision -eq 'rejected') { 'mismatch' } else { $row.canonical_slug }
    technical_metadata_review = if ($decision -eq 'rejected') { 'rejected' } else { 'consistent_with_existing_canonical_record' }
    editorial_clarity_review = if ($decision -eq 'rejected') { 'rejected' } else { 'clear_multi_frame_demonstration' }
    credentialed_safety_review = 'not_provided'
    review_note = if ($decision -eq 'rejected') { $rejected[$row.asset_id] } else { 'Four-frame visual review supports the existing canonical mapping; no new exercise is created.' }
    activation = 'disabled'
  }
}
$review | Export-Csv -NoTypeInformation -Encoding utf8 -LiteralPath (Join-Path $Output 'MEDIA_REVIEW_RESULTS.csv')

$mapping = foreach ($row in $review) {
  [pscustomobject]@{
    asset_id = $row.asset_id
    canonical_slug = $row.canonical_slug
    mapping_decision = if ($row.visual_mapping_review -eq 'approved_candidate') { 'existing_exercise_upgrade' } else { 'rejected' }
    new_exercise_id = ''
    new_exercise_approved = 'false'
    media_role = 'primary_demo_candidate'
    activation = 'disabled'
    reason = $row.review_note
  }
}
$mapping | Export-Csv -NoTypeInformation -Encoding utf8 -LiteralPath (Join-Path $Output 'CANONICAL_MAPPING_AND_NEW_EXERCISES.csv')

$manifest = foreach ($row in ($rows | Where-Object { -not $rejected.ContainsKey($_.asset_id) })) {
  $source = Get-ChildItem -LiteralPath (Join-Path $PrivateRoot 'sources') -File | Where-Object BaseName -eq $row.asset_id | Select-Object -First 1
  if (-not $source) { throw "Missing private source for $($row.asset_id)" }
  $video = Join-Path $videoDir ($row.asset_id + '.mp4')
  $poster = Join-Path $posterDir ($row.asset_id + '.webp')
  & $ffmpeg -hide_banner -loglevel error -y -i $source.FullName -an -vf 'scale=720:720:force_original_aspect_ratio=decrease,pad=720:720:(ow-iw)/2:(oh-ih)/2:color=white' -r 24 -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p -movflags +faststart $video
  if ($LASTEXITCODE -ne 0) { throw "Video conversion failed for $($row.asset_id)" }
  & $ffmpeg -hide_banner -loglevel error -y -i $source.FullName -frames:v 1 -vf 'scale=720:720:force_original_aspect_ratio=decrease,pad=720:720:(ow-iw)/2:(oh-ih)/2:color=white' $poster
  if ($LASTEXITCODE -ne 0) { throw "Poster conversion failed for $($row.asset_id)" }
  [pscustomobject]@{
    asset_id = ('sha256:' + $row.source_sha256 + ':stheno-6d2')
    review_asset_id = $row.asset_id
    canonical_slug = $row.canonical_slug
    source_sha256 = $row.source_sha256
    source_bytes = $row.source_bytes
    video_file = $video
    video_sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $video).Hash.ToLowerInvariant()
    video_bytes = (Get-Item -LiteralPath $video).Length
    video_codec = 'h264'
    video_dimensions = '720x720'
    video_frame_rate = '24'
    video_audio = 'removed'
    poster_file = $poster
    poster_sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $poster).Hash.ToLowerInvariant()
    poster_bytes = (Get-Item -LiteralPath $poster).Length
    conversion_profile = 'app6d2-h264-720-square-crf23-v1'
    storage_key = ('exercise-media/6d2/' + $row.source_sha256 + '/primary.mp4')
    poster_storage_key = ('exercise-media/6d2/' + $row.source_sha256 + '/poster.webp')
    activation = 'disabled'
  }
}
$manifest | Export-Csv -NoTypeInformation -Encoding utf8 -LiteralPath (Join-Path $Output 'SOURCE_AND_DERIVATIVE_MANIFEST.csv')

Write-Output "Reviewed $($review.Count) candidates; generated $($manifest.Count) private video/poster derivative pairs; rejected $($rejected.Count)."
