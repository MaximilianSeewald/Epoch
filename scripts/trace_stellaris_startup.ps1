# Local-only process trace for launcher/direct-start comparison. Raw command
# lines can contain private data; never publish the output directory wholesale.
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$OutputDirectory,
    [ValidateRange(5, 3600)][int]$DurationSeconds = 900
)
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$tracePath = Join-Path $OutputDirectory 'process-trace.jsonl'
if (Test-Path -LiteralPath $tracePath) { throw 'Refusing to append to an earlier trace.' }
$query = "name='stellaris.exe' OR name='dowser.exe' OR name='Paradox Launcher.exe' OR name='bootstrapper-v2.exe'"
$handles = @{}
$seen = @{}
try {
    # Polling avoids a permanent WMI event subscription; retain process handles
    # so exit codes remain available after short-lived children disappear.
    Write-Output "TRACE_READY=$tracePath"
    $deadline = [datetime]::UtcNow.AddSeconds($DurationSeconds)
    while ([datetime]::UtcNow -lt $deadline -and -not (Test-Path -LiteralPath (Join-Path $OutputDirectory 'stop-trace'))) {
        foreach ($native in @(Get-CimInstance Win32_Process -Filter $query)) {
            $key = [string]$native.ProcessId
            $identity = $key + '@' + $native.CreationDate.ToUniversalTime().Ticks
            if ($seen.ContainsKey($identity)) { continue }
            try {
                $handle = [Diagnostics.Process]::GetProcessById($native.ProcessId)
                $null = $handle.Handle
                $handles[$key] = $handle
                $seen[$identity] = $true
                [ordered]@{ kind = 'start-observed'; observedUtc = [datetime]::UtcNow.ToString('o'); eventUtc = $native.CreationDate.ToUniversalTime().ToString('o'); name = $native.Name; processId = $native.ProcessId; parentProcessId = $native.ParentProcessId; commandLine = $native.CommandLine; executablePath = $native.ExecutablePath } | ConvertTo-Json -Compress | Add-Content -LiteralPath $tracePath -Encoding UTF8
            } catch { Write-Warning 'A process ended before its handle could be retained.' }
        }
        foreach ($key in @($handles.Keys)) {
            if ($handles[$key].HasExited) {
                [ordered]@{ kind = 'exit-observed'; observedUtc = [datetime]::UtcNow.ToString('o'); processId = [int]$key; exitCode = $handles[$key].ExitCode } | ConvertTo-Json -Compress | Add-Content -LiteralPath $tracePath -Encoding UTF8
                $handles[$key].Dispose()
                $handles.Remove($key)
            }
        }
        Start-Sleep -Milliseconds 100
    }
} finally {
    foreach ($handle in $handles.Values) { $handle.Dispose() }
}
