param(
  [string]$InventoryPath = 'docs\mobile\app6d1\asset_inventory.csv',
  [string]$PrivateOutput = 'artifacts\app6d2-private',
  [string]$BatchOutput = 'docs\mobile\app6d2\BATCH_1_CANDIDATES.csv'
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$ffmpeg = Join-Path (Get-Location) 'node_modules\ffmpeg-static\ffmpeg.exe'
if (-not (Test-Path -LiteralPath $ffmpeg)) { throw 'ffmpeg-static is required' }

$priority = @(
  'barbell-bench-press','dumbbell-bench-press','incline-barbell-bench-press','incline-dumbbell-bench-press','dumbbell-floor-press',
  'push-up','incline-push-up','decline-push-up','wide-push-up','pike-push-up',
  'pull-up','assisted-pull-up-machine','wide-grip-lat-pulldown','close-grip-lat-pulldown','cable-row','one-arm-dumbbell-row','t-bar-row','face-pull',
  'barbell-rdl','dumbbell-rdl','dumbbell-deadlift','barbell-good-morning','hip-thrust','single-leg-glute-bridge',
  'smith-machine-squat','dumbbell-sumo-squat','barbell-bulgarian-split-squat','dumbbell-forward-lunge','barbell-reverse-lunge','reverse-lunge-dumbbell','barbell-lateral-lunge','cable-step-up',
  'leg-press','leg-extension','lying-leg-curl','seated-leg-curl','standing-calf-raise','seated-dumbbell-calf-raise','machine-leg-press-calf-raise',
  'machine-shoulder-press','cable-lateral-raise','cable-front-raise','cable-reverse-fly','cable-upright-row','dumbbell-shrug',
  'barbell-curl','hammer-curl','incline-dumbbell-curl','overhead-cable-triceps-extension','cable-triceps-kickback',
  'dead-bug','bear-crawl','wall-sit'
)

$inventoryRows = Import-Csv -LiteralPath $InventoryPath
$selected = @(foreach ($slug in $priority) {
  $inventoryRows | Where-Object { $_.proposed_canonical_slug -eq $slug -and $_.mapping_basis -eq 'exact_name' -and $_.source_status -ne 'missing' } | Select-Object -First 1
})
if ($selected.Count -lt 40) { throw "Expected at least 40 exact-name candidates; found $($selected.Count)" }

$mediaDir = Join-Path $PrivateOutput 'sources'
$sheetDir = Join-Path $PrivateOutput 'contact-sheets'
New-Item -ItemType Directory -Force -Path $mediaDir,$sheetDir,(Split-Path $BatchOutput) | Out-Null
$archives = @{}

$rows = foreach ($asset in $selected) {
  $extension = [IO.Path]::GetExtension($asset.entry_path).ToLowerInvariant()
  $localSource = Join-Path $mediaDir ($asset.asset_id + $extension)
  if ($asset.source_path -match '^(.*\.zip)::(.+)$') {
    $zipPath = $Matches[1]; $entryPath = $Matches[2]
    if (-not $archives.ContainsKey($zipPath)) { $archives[$zipPath] = [IO.Compression.ZipFile]::OpenRead($zipPath) }
    $entry = $archives[$zipPath].Entries | Where-Object FullName -eq $entryPath | Select-Object -First 1
    if (-not $entry) {
      $entry = $archives[$zipPath].Entries | Where-Object { $_.Length -eq [long]$asset.uncompressed_bytes -and [IO.Path]::GetFileName($_.FullName) -eq [IO.Path]::GetFileName($asset.entry_path) } | Select-Object -First 1
    }
    if (-not $entry) { throw "Cannot find $($asset.asset_id) in $zipPath" }
    $inputStream = $entry.Open(); $outputStream = [IO.File]::Create($localSource)
    try { $inputStream.CopyTo($outputStream) } finally { $inputStream.Dispose(); $outputStream.Dispose() }
  } else {
    Copy-Item -LiteralPath $asset.source_path -Destination $localSource -Force
  }

  $sheet = Join-Path $sheetDir ($asset.asset_id + '.png')
  $filter = 'fps=2,scale=360:420:force_original_aspect_ratio=decrease,pad=360:420:(ow-iw)/2:(oh-ih)/2:color=white,tile=4x1'
  & $ffmpeg -hide_banner -loglevel error -y -i $localSource -vf $filter -frames:v 1 $sheet
  $sheetStatus = if (Test-Path -LiteralPath $sheet) { 'generated' } else { 'failed' }
  [pscustomobject]@{
    asset_id = $asset.asset_id
    canonical_slug = $asset.proposed_canonical_slug
    source_archive = $asset.logical_archive
    source_entry = $asset.entry_path
    source_sha256 = $asset.sha256
    source_bytes = $asset.uncompressed_bytes
    mapping_basis = $asset.mapping_basis
    candidate_role = 'primary_demo_candidate'
    contact_sheet = $sheet
    contact_sheet_status = $sheetStatus
    technical_review = 'pending'
    editorial_safety_review = 'pending'
    activation = 'disabled'
  }
}

foreach ($archive in $archives.Values) { $archive.Dispose() }
$rows | Export-Csv -NoTypeInformation -Encoding utf8 -LiteralPath $BatchOutput
Write-Output "Prepared $($rows.Count) private review candidates and contact sheets."
