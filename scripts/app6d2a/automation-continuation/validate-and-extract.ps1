param(
  [string]$InventoryPath = 'docs\mobile\app6d1\asset_inventory.csv',
  [string]$PrivateRoot = 'artifacts\app6d2a-automation',
  [string]$OutputPath = 'docs\mobile\app6d2a\automation-continuation\TECHNICAL_VALIDATION.csv'
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$ffmpeg = Join-Path (Get-Location) 'node_modules\ffmpeg-static\ffmpeg.exe'
if (-not (Test-Path -LiteralPath $ffmpeg)) { throw 'ffmpeg-static is required' }
$rows = Import-Csv -LiteralPath $InventoryPath
$representatives = @{}
foreach ($row in $rows) { if ($row.sha256 -and -not $representatives.ContainsKey($row.sha256)) { $representatives[$row.sha256] = $row.asset_id } }
$tempDir = Join-Path $PrivateRoot 'temp'; $sheetDir = Join-Path $PrivateRoot 'contact-sheets'
New-Item -ItemType Directory -Force -Path $tempDir,$sheetDir,(Split-Path $OutputPath) | Out-Null
$archives = @{}; $results = [Collections.Generic.List[object]]::new(); $index = 0
try {
  foreach ($row in $rows) {
    $index++
    if ($row.source_status -eq 'missing' -or -not $row.source_path) {
      $results.Add([pscustomobject]@{asset_id=$row.asset_id;sha256=$row.sha256;hash_verified='false';decode_verified='false';representative='false';contact_sheet='';technical_status='missing_source';technical_reason='Source absent in App 6D-1 audit.'})
      continue
    }
    $extension = [IO.Path]::GetExtension($row.entry_path); if (-not $extension) { $extension = '.bin' }
    $temp = Join-Path $tempDir ($row.asset_id + $extension); $deleteTemp = $true
    if ($row.source_path -match '^(.*\.zip)::(.+)$') {
      $zipPath = $Matches[1]; $entryPath = $Matches[2]
      if (-not $archives.ContainsKey($zipPath)) { $archives[$zipPath] = [IO.Compression.ZipFile]::OpenRead($zipPath) }
      $entry = $archives[$zipPath].Entries | Where-Object FullName -eq $entryPath | Select-Object -First 1
      if (-not $entry) { $entry = $archives[$zipPath].Entries | Where-Object { $_.Length -eq [long]$row.uncompressed_bytes -and [IO.Path]::GetFileName($_.FullName) -eq [IO.Path]::GetFileName($row.entry_path) } | Select-Object -First 1 }
      if (-not $entry) { $results.Add([pscustomobject]@{asset_id=$row.asset_id;sha256=$row.sha256;hash_verified='false';decode_verified='false';representative='false';contact_sheet='';technical_status='missing_archive_entry';technical_reason='Archive entry could not be resolved.'}); continue }
      $input = $entry.Open(); $output = [IO.File]::Create($temp); try { $input.CopyTo($output) } finally { $input.Dispose(); $output.Dispose() }
    } else { $temp = $row.source_path; $deleteTemp = $false }
    try {
      $actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $temp).Hash.ToLowerInvariant(); $hashOk = $actualHash -eq $row.sha256
      $isRepresentative = $row.sha256 -and $representatives[$row.sha256] -eq $row.asset_id
      $isVisualMedia = @('.gif','.mp4','.mov','.webm','.png','.jpg','.jpeg','.webp') -contains $extension.ToLowerInvariant()
      $sheet = if ($isRepresentative -and $isVisualMedia) { Join-Path $sheetDir ($row.asset_id + '.jpg') } else { '' }
      $decodeOk = $true
      if ($isRepresentative -and $isVisualMedia -and -not (Test-Path -LiteralPath $sheet)) {
        & $ffmpeg -hide_banner -loglevel error -y -i $temp -vf 'fps=2,scale=320:360:force_original_aspect_ratio=decrease,pad=320:360:(ow-iw)/2:(oh-ih)/2:color=white,tile=4x1' -frames:v 1 -q:v 5 $sheet
        $decodeOk = $LASTEXITCODE -eq 0 -and (Test-Path -LiteralPath $sheet)
      } elseif ($isRepresentative) { $decodeOk = $true }
      $status = if(-not $hashOk){'hash_mismatch'}elseif(-not $isVisualMedia){'verified_supplementary_document'}elseif($decodeOk){'verified'}else{'decode_failed'}
      $reason = if(-not $hashOk){"Expected $($row.sha256), received $actualHash."}elseif(-not $isVisualMedia){'SHA-256 matches audit; exercise-media decoding is not applicable to this supplementary document.'}elseif($decodeOk){'SHA-256 matches audit; representative payload decoded when applicable.'}else{'ffmpeg could not generate multi-frame evidence.'}
      $results.Add([pscustomobject]@{asset_id=$row.asset_id;sha256=$row.sha256;hash_verified=$hashOk.ToString().ToLowerInvariant();decode_verified=if($isVisualMedia){$decodeOk.ToString().ToLowerInvariant()}else{'not_applicable'};representative=$isRepresentative.ToString().ToLowerInvariant();contact_sheet=$sheet;technical_status=$status;technical_reason=$reason})
    } finally { if ($deleteTemp -and (Test-Path -LiteralPath $temp)) { [IO.File]::Delete($temp) } }
    if ($index % 100 -eq 0) { Write-Output "Validated $index / $($rows.Count) assets." }
  }
} finally { foreach ($archive in $archives.Values) { $archive.Dispose() } }
$results | Export-Csv -NoTypeInformation -Encoding utf8 -LiteralPath $OutputPath
Write-Output "Validated $($results.Count) records; generated $(@($results|Where-Object { $_.representative -eq 'true' -and $_.contact_sheet }).Count) unique-payload contact sheets."
