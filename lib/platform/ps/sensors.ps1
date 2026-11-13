# RigWatch sensor worker: hosts LibreHardwareMonitorLib.dll directly (no GUI, no tray app).
# Without admin it still reads GPU sensors (vendor APIs); with admin + the PawnIO driver it
# also reads CPU, motherboard (Super I/O) and storage sensors.
$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = New-Object Text.UTF8Encoding($false)
$parentPid = [int]$env:RIG_PARENT_PID
$dir = $env:RIG_LHM_DIR
$TAB = [string][char]9
$NL = [string][char]10
$out = [Console]::Out
function Clean($s) { if ($null -eq $s) { return '' }; return ([string]$s -replace '[\t\r\n]+', ' ').Trim() }
function Send([string]$kind, $obj) {
  $json = ConvertTo-Json -InputObject $obj -Compress -Depth 5
  try { $out.Write($kind + $TAB + $json + $NL); $out.Flush() } catch { exit 0 }
}

try { Add-Type -Path (Join-Path $dir 'LibreHardwareMonitorLib.dll') -ErrorAction Stop }
catch { Send 'ERR' @{ error = (Clean $_.Exception.Message) }; exit 1 }

$admin = $false
try { $admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator) } catch {}
$pawn = Test-Path 'HKLM:\SYSTEM\CurrentControlSet\Services\PawnIO'

$c = New-Object LibreHardwareMonitor.Hardware.Computer
$c.IsCpuEnabled = $true; $c.IsGpuEnabled = $true; $c.IsMotherboardEnabled = $true; $c.IsMemoryEnabled = $true
$c.IsControllerEnabled = $true; $c.IsStorageEnabled = $true; $c.IsBatteryEnabled = $true; $c.IsPsuEnabled = $true; $c.IsNetworkEnabled = $false
$sw0 = [Diagnostics.Stopwatch]::StartNew()
try { $c.Open() } catch { Send 'ERR' @{ error = (Clean $_.Exception.Message) }; exit 1 }
Send 'INFO' @{ admin = [bool]$admin; pawnio = [bool]$pawn; openMs = $sw0.ElapsedMilliseconds; hardware = @($c.Hardware | ForEach-Object { [string]$_.HardwareType + ': ' + (Clean $_.Name) }) }

# Without the driver some CPU/board sensors exist but always read 0: hide those
$lowLevel = @('Cpu', 'Motherboard', 'SuperIO')
$loop = 0
while ($true) {
  $sw = [Diagnostics.Stopwatch]::StartNew()
  $loop++
  if ($parentPid -gt 0 -and ($loop % 3) -eq 0) {
    try { [void][Diagnostics.Process]::GetProcessById($parentPid) } catch { try { $c.Close() } catch {}; exit 0 }
  }
  $hw = New-Object Collections.ArrayList
  $se = New-Object Collections.ArrayList
  $queue = New-Object Collections.Queue
  foreach ($h in $c.Hardware) { $queue.Enqueue(@($h, '')) }
  while ($queue.Count -gt 0) {
    $item = $queue.Dequeue(); $h = $item[0]; $parent = $item[1]
    try { $h.Update() } catch {}
    [void]$hw.Add(@{ id = [string]$h.Identifier; name = (Clean $h.Name); type = [string]$h.HardwareType; parent = $parent })
    foreach ($s in $h.Sensors) {
      if ($null -eq $s.Value) { continue }
      $v = [double]$s.Value
      $t = [string]$s.SensorType
      if ($v -eq 0 -and ($lowLevel -contains [string]$h.HardwareType) -and $t -ne 'Load' -and $t -ne 'Fan' -and $t -ne 'Control') { continue }
      $mn = $null; $mx = $null
      if ($null -ne $s.Min) { $mn = [Math]::Round([double]$s.Min, 2) }
      if ($null -ne $s.Max) { $mx = [Math]::Round([double]$s.Max, 2) }
      [void]$se.Add(@{ id = [string]$s.Identifier; name = (Clean $s.Name); type = $t; value = [Math]::Round($v, 3); min = $mn; max = $mx; parent = [string]$h.Identifier })
    }
    foreach ($sub in $h.SubHardware) { $queue.Enqueue(@($sub, [string]$h.Identifier)) }
  }
  Send 'LHM' @{ ns = 'embedded'; hw = $hw; sensors = $se; ms = $sw.ElapsedMilliseconds }
  $left = 2000 - $sw.ElapsedMilliseconds
  if ($left -gt 10) { Start-Sleep -Milliseconds $left }
}
