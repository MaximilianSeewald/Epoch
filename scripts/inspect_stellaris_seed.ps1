[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$SavePath,
    [Parameter(Mandatory = $true)][string]$RunId
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [IO.Compression.ZipFile]::OpenRead($SavePath)
try {
    $entry = $archive.GetEntry('gamestate')
    if (-not $entry) { throw 'Save has no gamestate entry.' }
    $reader = [IO.StreamReader]::new($entry.Open())
    try { $stateText = $reader.ReadToEnd() } finally { $reader.Dispose() }
    $receipt = [ordered]@{
        schemaVersion = 1; scenarioVersion = 'seed-save-load-probe-v1'; runId = $RunId
        saveSha256 = (Get-FileHash -LiteralPath $SavePath -Algorithm SHA256).Hash.ToLowerInvariant()
        saveBytes = (Get-Item -LiteralPath $SavePath).Length
        date = [regex]::Match($stateText, '(?m)^date="([^"]+)"').Groups[1].Value
        seedMarker = $stateText.Contains('epoch36_seed_v1')
        runFlag = $stateText.Contains('epoch36_run_' + $RunId.Replace('-', '_'))
        runName = $stateText.Contains('EPOCH36_' + $RunId)
        guardianCombatPrepared = $false
    }
    $receipt | ConvertTo-Json -Depth 5
    if (-not ($receipt.seedMarker -and $receipt.runFlag -and $receipt.runName)) { exit 3 }
} finally { $archive.Dispose() }
