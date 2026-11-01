param(
  [string]$InventoryPath = 'docs\mobile\app6d1\asset_inventory.csv',
  [string]$CandidatePath = 'docs\mobile\app6d2a\BATCH_2_CANDIDATES.csv',
  [string]$PrivateOutput = 'artifacts\app6d2a-private'
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$ffmpeg = Join-Path (Get-Location) 'node_modules\ffmpeg-static\ffmpeg.exe'
if (-not (Test-Path -LiteralPath $ffmpeg)) { throw 'ffmpeg-static is required' }
$inventory = @{}; Import-Csv -LiteralPath $InventoryPath | ForEach-Object { $inventory[$_.asset_id] = $_ }
$candidates = Import-Csv -LiteralPath $CandidatePath
$mediaDir = Join-Path $PrivateOutput 'sources'; $sheetDir = Join-Path $PrivateOutput 'contact-sheets'
New-Item -ItemType Directory -Force -Path $mediaDir,$sheetDir | Out-Null
$archives = @{}
try {
  foreach ($candidate in $candidates) {
    $asset = $inventory[$candidate.asset_id]
    if (-not $asset) { throw "Missing inventory row $($candidate.asset_id)" }
    $extension = [IO.Path]::GetExtension($asset.entry_path).ToLowerInvariant()
    $source = Join-Path $mediaDir ($asset.asset_id + $extension)
    if ($asset.source_path -match '^(.*\.zip)::(.+)$') {
      $zipPath = $Matches[1]; $entryPath = $Matches[2]
      if (-not $archives.ContainsKey($zipPath)) { $archives[$zipPath] = [IO.Compression.ZipFile]::OpenRead($zipPath) }
      $entry = $archives[$zipPath].Entries | Where-Object FullName -eq $entryPath | Select-Object -First 1
      if (-not $entry) { $entry = $archives[$zipPath].Entries | Where-Object { $_.Length -eq [long]$asset.uncompressed_bytes -and [IO.Path]::GetFileName($_.FullName) -eq [IO.Path]::GetFileName($asset.entry_path) } | Select-Object -First 1 }
      if (-not $entry) { throw "Cannot locate $($asset.asset_id) in $zipPath" }
      $input = $entry.Open(); $output = [IO.File]::Create($source)
      try { $input.CopyTo($output) } finally { $input.Dispose(); $output.Dispose() }
    } else { Copy-Item -LiteralPath $asset.source_path -Destination $source -Force }
    $sheet = Join-Path $sheetDir ($asset.asset_id + '.png')
    & $ffmpeg -hide_banner -loglevel error -y -i $source -vf 'fps=2,scale=360:420:force_original_aspect_ratio=decrease,pad=360:420:(ow-iw)/2:(oh-ih)/2:color=white,tile=4x1' -frames:v 1 $sheet
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $sheet)) { throw "Contact sheet failed for $($asset.asset_id)" }
  }
} finally { foreach ($archive in $archives.Values) { $archive.Dispose() } }
Write-Output "Prepared $($candidates.Count) private sources and contact sheets."
