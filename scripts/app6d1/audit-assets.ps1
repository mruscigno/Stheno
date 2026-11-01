param(
  [string]$Downloads = 'C:\Users\matth\Downloads',
  [string]$Manifest = '.app6d1-audit-package\UPLOADED_ARCHIVE_MANIFEST.csv',
  [string]$Output = 'docs\mobile\app6d1'
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

$outputPath = Join-Path (Get-Location) $Output
New-Item -ItemType Directory -Force -Path $outputPath | Out-Null
$manifestRows = Import-Csv -LiteralPath $Manifest
$catalog = Get-Content -Raw -LiteralPath 'content\exercises\canonical-exercises.json' | ConvertFrom-Json

function Normalize-Name([string]$value) {
  $name = [IO.Path]::GetFileNameWithoutExtension($value).ToLowerInvariant()
  $name = $name -replace '\s*\(\d+\)\s*$', ''
  $name = $name -replace '\b(exercise|video|animation|demo|demonstration)\b', ' '
  return (($name -replace '[^a-z0-9]+', ' ').Trim() -replace '\s+', ' ')
}

function Get-Sha256FromStream($stream) {
  $sha = [Security.Cryptography.SHA256]::Create()
  try { return ([Convert]::ToHexString($sha.ComputeHash($stream))).ToLowerInvariant() }
  finally { $sha.Dispose(); $stream.Dispose() }
}

function Get-Sha256FromFile([string]$path) {
  $stream = [IO.File]::OpenRead($path)
  return Get-Sha256FromStream $stream
}

function Get-GifDimensionsFromStream($stream) {
  $buffer = New-Object byte[] 10
  $read = $stream.Read($buffer, 0, 10)
  if ($read -eq 10 -and [Text.Encoding]::ASCII.GetString($buffer, 0, 3) -eq 'GIF') {
    return @([BitConverter]::ToUInt16($buffer, 6), [BitConverter]::ToUInt16($buffer, 8))
  }
  return @($null, $null)
}

$physicalArchives = @{
  'Bodybuilding GIFs-20261028T183903Z-1-001.zip' = Join-Path $Downloads 'Bodybuilding GIFs-20261028T183903Z-1-001.zip'
  'CALISTHENICS GIFs-20261028T183905Z-1-001.zip' = Join-Path $Downloads 'CALISTHENICS GIFs-20261028T183905Z-1-001.zip'
  'functional.zip' = Join-Path $Downloads 'Functional Training GIFs-20261028T183908Z-1-001.zip'
  'functional 2.zip' = Join-Path $Downloads 'Functional Training GIFs-20261028T183908Z-1-001.zip'
  'premium gifs.zip' = Join-Path $Downloads 'PREMIUM EXERCISE GIFs-20261028T183911Z-1-001.zip'
  'premium2.zip' = Join-Path $Downloads 'PREMIUM EXERCISE GIFs-20261028T183911Z-1-001.zip'
  'premium 3.zip' = Join-Path $Downloads 'PREMIUM EXERCISE GIFs-20261028T183911Z-1-001.zip'
}

$zipCache = @{}
foreach ($path in ($physicalArchives.Values | Select-Object -Unique)) {
  if (-not (Test-Path -LiteralPath $path)) { continue }
  $archive = [IO.Compression.ZipFile]::OpenRead($path)
  $entries = @{}
  $entriesByNameAndSize = @{}
  foreach ($entry in $archive.Entries) {
    if ($entry.Length -gt 0) {
      $entries[$entry.FullName] = $entry
      $key = ([IO.Path]::GetFileName($entry.FullName).ToLowerInvariant() + '|' + $entry.Length)
      if (-not $entriesByNameAndSize.ContainsKey($key)) { $entriesByNameAndSize[$key] = $entry }
    }
  }
  $zipCache[$path] = @{ Archive = $archive; Entries = $entries; EntriesByNameAndSize = $entriesByNameAndSize }
}

$canonical = foreach ($exercise in $catalog) {
  [pscustomobject]@{ slug = $exercise.slug; name = $exercise.name; normalized = Normalize-Name $exercise.name }
}

function Find-Canonical([string]$assetName) {
  $normalized = Normalize-Name $assetName
  $exact = $canonical | Where-Object normalized -eq $normalized | Select-Object -First 1
  if ($exact) { return @($exact.slug, 'exact_name', '1.00') }
  $assetTokens = @($normalized.Split(' ', [StringSplitOptions]::RemoveEmptyEntries) | Select-Object -Unique)
  $best = $null; $bestScore = 0.0
  foreach ($candidate in $canonical) {
    $candidateTokens = @($candidate.normalized.Split(' ', [StringSplitOptions]::RemoveEmptyEntries) | Select-Object -Unique)
    $intersection = @($assetTokens | Where-Object { $candidateTokens -contains $_ }).Count
    $union = @($assetTokens + $candidateTokens | Select-Object -Unique).Count
    $score = if ($union) { $intersection / $union } else { 0 }
    if ($score -gt $bestScore) { $bestScore = $score; $best = $candidate }
  }
  if ($bestScore -ge 0.8) { return @($best.slug, 'high_name_similarity', ('{0:N2}' -f $bestScore)) }
  if ($bestScore -ge 0.55) { return @($best.slug, 'review_name_similarity', ('{0:N2}' -f $bestScore)) }
  return @('', 'unresolved', ('{0:N2}' -f $bestScore))
}

$inventory = [Collections.Generic.List[object]]::new()
$index = 0
foreach ($row in $manifestRows) {
  $index++
  $sourceStatus = 'missing'
  $sourcePath = ''
  $sha256 = ''
  $width = $null
  $height = $null
  $physicalArchive = ''
  if ($physicalArchives.ContainsKey($row.archive)) {
    $physicalArchive = $physicalArchives[$row.archive]
    $cache = $zipCache[$physicalArchive]
    $entry = $cache.Entries[$row.entry_path]
    if (-not $entry) {
      $entryKey = ([IO.Path]::GetFileName($row.entry_path).ToLowerInvariant() + '|' + $row.uncompressed_bytes)
      $entry = $cache.EntriesByNameAndSize[$entryKey]
    }
    if ($entry) {
      $sourceStatus = 'present_in_archive'
      $sourcePath = $physicalArchive + '::' + $entry.FullName
      if ($row.extension -eq '.gif') {
        $dimStream = $entry.Open()
        try { $dims = Get-GifDimensionsFromStream $dimStream; $width = $dims[0]; $height = $dims[1] }
        finally { $dimStream.Dispose() }
      }
      $sha256 = Get-Sha256FromStream ($entry.Open())
    }
  } else {
    $root = Join-Path $Downloads ([IO.Path]::GetFileNameWithoutExtension($row.archive))
    $fileName = [IO.Path]::GetFileName($row.entry_path)
    $match = Get-ChildItem -LiteralPath $root -Recurse -File -ErrorAction SilentlyContinue | Where-Object Name -eq $fileName | Select-Object -First 1
    if (-not $match -and $fileName -eq 'Ab Wheel Rollout — Standing to Kneeling Progression, Arm, Hip, and Spine Position.mp4') {
      $fallbackRoot = Join-Path $Downloads 'PREMIUM EXERCISE GIFs-20261028T183911Z-1-001'
      $match = Get-ChildItem -LiteralPath $fallbackRoot -Recurse -File -Filter $fileName -ErrorAction SilentlyContinue | Select-Object -First 1
      if ($match) { $sourceStatus = 'present_outside_module_duplicate' }
    }
    if ($match) {
      if ($sourceStatus -eq 'missing') { $sourceStatus = 'present_extracted' }
      $sourcePath = $match.FullName
      $sha256 = Get-Sha256FromFile $match.FullName
    }
  }
  $mapping = Find-Canonical ([IO.Path]::GetFileName($row.entry_path))
  $inventory.Add([pscustomobject]@{
    asset_id = ('asset-{0:D4}' -f $index)
    logical_archive = $row.archive
    physical_archive = $physicalArchive
    entry_path = $row.entry_path
    extension = $row.extension
    uncompressed_bytes = $row.uncompressed_bytes
    manifest_crc32 = $row.zip_crc32
    source_status = $sourceStatus
    source_path = $sourcePath
    sha256 = $sha256
    width = $width
    height = $height
    duration_seconds = ''
    codec = ''
    proposed_canonical_slug = $mapping[0]
    mapping_basis = $mapping[1]
    mapping_confidence = $mapping[2]
    visual_review_status = 'not_reviewed'
    safety_review_status = 'not_reviewed'
    recommendation = if ($sourceStatus -eq 'missing') { 'BLOCKED_SOURCE' } else { 'REVIEW' }
  })
  if (($index % 100) -eq 0) { Write-Output "Inventoried $index/$($manifestRows.Count)" }
}

foreach ($cached in $zipCache.Values) { $cached.Archive.Dispose() }
$inventory | Export-Csv -NoTypeInformation -Encoding utf8 -LiteralPath (Join-Path $outputPath 'asset_inventory.csv')

$duplicates = foreach ($group in ($inventory | Where-Object sha256 | Group-Object sha256 | Where-Object Count -gt 1)) {
  $cluster = 'sha256-' + $group.Name.Substring(0, 12)
  foreach ($asset in $group.Group) {
    [pscustomobject]@{ duplicate_cluster = $cluster; sha256 = $group.Name; asset_id = $asset.asset_id; logical_archive = $asset.logical_archive; entry_path = $asset.entry_path; cluster_size = $group.Count }
  }
}
$duplicates | Export-Csv -NoTypeInformation -Encoding utf8 -LiteralPath (Join-Path $outputPath 'duplicate_clusters.csv')

$inventory | Select-Object asset_id,logical_archive,entry_path,proposed_canonical_slug,mapping_basis,mapping_confidence,visual_review_status,safety_review_status,recommendation | Export-Csv -NoTypeInformation -Encoding utf8 -LiteralPath (Join-Path $outputPath 'asset_to_exercise_mapping.csv')

$unresolved = $inventory | Where-Object { $_.source_status -eq 'missing' -or $_.mapping_basis -in @('unresolved','review_name_similarity') -or $_.visual_review_status -ne 'reviewed' }
$unresolved | Select-Object asset_id,logical_archive,entry_path,source_status,proposed_canonical_slug,mapping_basis,mapping_confidence,visual_review_status,safety_review_status,recommendation | Export-Csv -NoTypeInformation -Encoding utf8 -LiteralPath (Join-Path $outputPath 'unresolved_review_queue.csv')

$coverage = foreach ($exercise in $canonical) {
  $matches = @($inventory | Where-Object proposed_canonical_slug -eq $exercise.slug)
  [pscustomobject]@{ canonical_slug = $exercise.slug; canonical_name = $exercise.name; candidate_assets = $matches.Count; exact_name_candidates = @($matches | Where-Object mapping_basis -eq 'exact_name').Count; visually_approved = 0; safety_approved = 0; coverage_status = if ($matches.Count) { 'candidate_unreviewed' } else { 'no_candidate' } }
}
$coverage | Export-Csv -NoTypeInformation -Encoding utf8 -LiteralPath (Join-Path $outputPath 'exercise_coverage_matrix.csv')

$proposed = $inventory | Where-Object mapping_basis -eq 'unresolved' | ForEach-Object {
  [pscustomobject]@{ asset_id=$_.asset_id; source_name=[IO.Path]::GetFileNameWithoutExtension($_.entry_path); proposed_exercise_slug=''; distinct_exercise_status='not_determined'; reason='Requires movement-level visual review before proposing a new canonical exercise'; decision='HOLD' }
}
$proposed | Export-Csv -NoTypeInformation -Encoding utf8 -LiteralPath (Join-Path $outputPath 'proposed_exercises.csv')

$supplementary = $inventory | Where-Object logical_archive -like 'MODULE*' | Select-Object asset_id,logical_archive,entry_path,extension,source_status,sha256,@{n='intended_use';e={'not_determined'}},@{n='license_status';e={'written_grant_missing'}},@{n='content_review_status';e={'not_reviewed'}},@{n='recommendation';e={if($_.source_status -eq 'missing'){'BLOCKED_SOURCE'}else{'HOLD'}}}
$supplementary | Export-Csv -NoTypeInformation -Encoding utf8 -LiteralPath (Join-Path $outputPath 'supplementary_resource_matrix.csv')

$summary = [pscustomobject]@{
  manifest_rows = $inventory.Count
  present = @($inventory | Where-Object source_status -ne 'missing').Count
  missing = @($inventory | Where-Object source_status -eq 'missing').Count
  exercise_media = @($inventory | Where-Object logical_archive -notlike 'MODULE*').Count
  supplementary_assets = @($inventory | Where-Object logical_archive -like 'MODULE*').Count
  unique_sha256 = @($inventory | Where-Object sha256 | Select-Object -ExpandProperty sha256 -Unique).Count
  duplicate_assets = @($duplicates).Count
  duplicate_clusters = @($duplicates | Select-Object -ExpandProperty duplicate_cluster -Unique).Count
  exact_name_mappings = @($inventory | Where-Object mapping_basis -eq 'exact_name').Count
  high_similarity_mappings = @($inventory | Where-Object mapping_basis -eq 'high_name_similarity').Count
  review_similarity_mappings = @($inventory | Where-Object mapping_basis -eq 'review_name_similarity').Count
  unresolved_name_mappings = @($inventory | Where-Object mapping_basis -eq 'unresolved').Count
  visually_reviewed = 0
  safety_reviewed = 0
}
$summary | ConvertTo-Json | Set-Content -Encoding utf8 -LiteralPath (Join-Path $outputPath 'audit-summary.json')
$summary | Format-List
