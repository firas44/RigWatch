# RigWatch control worker: reads one JSON command per line on stdin, answers "R<TAB>{json}".
# Started lazily on first use by lib/platform/win.js. Everything here is on-demand.
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object Text.UTF8Encoding($false)
$TAB = [string][char]9
$NL = [string][char]10
$out = [Console]::Out

$ctlSrc = @'
using System;
using System.Runtime.InteropServices;
public static class RigCtl {
  [DllImport("ntdll.dll")] static extern int NtSuspendProcess(IntPtr h);
  [DllImport("ntdll.dll")] static extern int NtResumeProcess(IntPtr h);
  [DllImport("kernel32.dll", SetLastError = true)] static extern IntPtr OpenProcess(uint access, bool inherit, int pid);
  [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr h);
  public static string SuspendResume(int pid, bool resume) {
    IntPtr h = OpenProcess(0x0800, false, pid);
    if (h == IntPtr.Zero) return "OpenProcess failed (Win32 error " + Marshal.GetLastWin32Error() + "): access denied or process gone. Try an elevated terminal.";
    int r = resume ? NtResumeProcess(h) : NtSuspendProcess(h);
    CloseHandle(h);
    return r == 0 ? "" : ("NTSTATUS 0x" + r.ToString("X8"));
  }
}
'@
try { if (-not ('RigCtl' -as [type])) { Add-Type -TypeDefinition $ctlSrc -Language CSharp } } catch {}

function Clean($s) { if ($null -eq $s) { return '' }; return ([string]$s -replace '[\t\r\n]+', ' ').Trim() }
function Reply($id, [bool]$ok, $data, $err) {
  $o = @{ id = $id; ok = $ok; data = $data; error = $err }
  $j = ConvertTo-Json -InputObject $o -Compress -Depth 7
  try { $out.Write('R' + $TAB + $j + $NL); $out.Flush() } catch { exit 0 }
}

function Op-NetInfo {
  $r = @{}
  $r.arp = @(Get-NetNeighbor -ErrorAction SilentlyContinue | Where-Object { [string]$_.State -ne 'Unreachable' -and $_.LinkLayerAddress -and $_.LinkLayerAddress -notmatch '^(00-){5}00$|^(FF-){5}FF$' } | ForEach-Object { @{ ip = [string]$_.IPAddress; mac = [string]$_.LinkLayerAddress; state = [string]$_.State; iface = [string]$_.InterfaceAlias } })
  $r.routes = @(Get-NetRoute -ErrorAction SilentlyContinue | ForEach-Object { @{ dest = [string]$_.DestinationPrefix; gw = [string]$_.NextHop; iface = [string]$_.InterfaceAlias; metric = ([int]$_.RouteMetric + [int]$_.InterfaceMetric); family = [string]$_.AddressFamily } })
  $r.dns = @(Get-DnsClientServerAddress -ErrorAction SilentlyContinue | Where-Object { $_.ServerAddresses } | ForEach-Object { @{ iface = [string]$_.InterfaceAlias; family = [string]$_.AddressFamily; servers = @($_.ServerAddresses) } })
  $r.profiles = @(Get-NetConnectionProfile -ErrorAction SilentlyContinue | ForEach-Object { @{ name = [string]$_.Name; iface = [string]$_.InterfaceAlias; category = [string]$_.NetworkCategory; ipv4 = [string]$_.IPv4Connectivity; ipv6 = [string]$_.IPv6Connectivity } })
  $r.firewall = @(Get-NetFirewallProfile -ErrorAction SilentlyContinue | ForEach-Object { @{ name = [string]$_.Name; enabled = [string]$_.Enabled; inbound = [string]$_.DefaultInboundAction; outbound = [string]$_.DefaultOutboundAction } })
  try { $r.av = @(Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct -ErrorAction Stop | ForEach-Object { $s = [int]$_.productState; @{ name = [string]$_.displayName; enabled = ((($s -shr 12) -band 0xF) -eq 1); upToDate = ((($s -shr 4) -band 0xF) -eq 0) } }) } catch { $r.av = @() }
  try { $m = Get-MpComputerStatus -ErrorAction Stop; $r.defender = @{ realtime = [bool]$m.RealTimeProtectionEnabled; antivirus = [bool]$m.AntivirusEnabled; tamper = [bool]$m.IsTamperProtected; sigAgeDays = [int]$m.AntivirusSignatureAge; quickScanAgeDays = [int]$m.QuickScanAge } } catch { $r.defender = $null }
  $wifi = @(); $cur = $null
  try {
    foreach ($line in @(netsh.exe wlan show interfaces 2>$null)) {
      if ($line -match '^\s*([^:]+?)\s*:\s(.*)$') {
        $k = $matches[1].Trim(); $v = $matches[2].Trim()
        if ($k -eq 'Name') { if ($null -ne $cur) { $wifi += $cur }; $cur = @{} }
        if ($null -ne $cur) { $cur[$k] = $v }
      }
    }
    if ($null -ne $cur) { $wifi += $cur }
  } catch {}
  $r.wifi = $wifi
  return $r
}

function Op-DnsCache {
  return @(Get-DnsClientCache -ErrorAction SilentlyContinue | Select-Object -First 3000 | ForEach-Object { @{ name = [string]$_.Entry; rname = [string]$_.Name; type = [int]$_.Type; data = [string]$_.Data; ttl = [int]$_.TimeToLive; section = [int]$_.Section } })
}

function Op-Services {
  return @(Get-CimInstance Win32_Service -Property Name,DisplayName,State,StartMode,ProcessId,StartName,PathName,Description | ForEach-Object {
    $d = Clean $_.Description; if ($d.Length -gt 220) { $d = $d.Substring(0, 219) + '...' }
    @{ name = [string]$_.Name; display = [string]$_.DisplayName; state = [string]$_.State; start = [string]$_.StartMode; pid = [int]$_.ProcessId; user = [string]$_.StartName; path = Clean $_.PathName; desc = $d }
  })
}

function Op-Service([string]$name, [string]$action) {
  $svc = Get-Service -Name $name -ErrorAction Stop
  switch ($action) {
    'start' { Start-Service -InputObject $svc -ErrorAction Stop }
    'stop' { Stop-Service -InputObject $svc -Force -ErrorAction Stop }
    'restart' { Restart-Service -InputObject $svc -Force -ErrorAction Stop }
    default { throw "unknown service action $action" }
  }
  return (Get-Service -Name $name).Status.ToString()
}

function Op-Startup {
  $items = @(Get-CimInstance Win32_StartupCommand | ForEach-Object {
    $k = Approved-Key ([string]$_.Location); $en = $true
    if ($k) { $an = Approved-Name $_; try { $v = (Get-ItemProperty -Path $k -Name $an -ErrorAction Stop).$an; if ($v -and ($v[0] -band 1)) { $en = $false } } catch {} }
    @{ name = [string]$_.Name; cmd = Clean $_.Command; location = [string]$_.Location; user = Clean $_.User; kind = $(if ([string]$_.Location -like '*Startup') { 'startup folder' } else { 'run key' }); enabled = $en; toggle = [bool]$k }
  })
  try {
    $items += @(Get-ScheduledTask -ErrorAction Stop | Where-Object { [string]$_.State -ne 'Disabled' -and (@($_.Triggers) | Where-Object { $_ -and $_.CimClass.CimClassName -match 'Logon|Boot' }) } | ForEach-Object {
      @{ name = [string]$_.TaskName; cmd = Clean ((@($_.Actions) | ForEach-Object { ([string]$_.Execute + ' ' + [string]$_.Arguments).Trim() }) -join '; '); location = [string]$_.TaskPath; user = [string]$_.Principal.UserId; kind = 'scheduled task' }
    })
  } catch {}
  return $items
}

function Op-Signatures($paths) {
  $res = @{}
  foreach ($p in @($paths)) {
    try {
      $s = Get-AuthenticodeSignature -FilePath ([string]$p) -ErrorAction Stop
      $subj = ''
      if ($s.SignerCertificate) { $subj = [string]$s.SignerCertificate.Subject; if ($subj -match 'CN=("?)([^,"]+)') { $subj = $matches[2] } }
      $res[[string]$p] = @{ status = [string]$s.Status; signer = $subj; os = [bool]$s.IsOSBinary }
    } catch { $res[[string]$p] = @{ status = 'Error'; signer = ''; os = $false } }
  }
  return $res
}

function Op-ProcInfo([int]$procId) {
  $p = Get-Process -Id $procId -ErrorAction Stop
  $r = @{ pid = $p.Id }
  try { $r.priority = $p.PriorityClass.ToString() } catch {}
  try { $r.affinity = [string]$p.ProcessorAffinity.ToInt64() } catch {}
  try { $r.startMs = [long](($p.StartTime.ToUniversalTime() - (New-Object DateTime(1970,1,1,0,0,0,[DateTimeKind]::Utc))).TotalMilliseconds) } catch {}
  try { $r.threads = $p.Threads.Count } catch {}
  try { $r.modules = $p.Modules.Count } catch {}
  try { $v = $p.MainModule.FileVersionInfo; $r.company = Clean $v.CompanyName; $r.description = Clean $v.FileDescription; $r.product = Clean $v.ProductName; $r.version = Clean $v.FileVersion } catch {}
  try { $w = Get-CimInstance Win32_Process -Filter ("ProcessId=" + $procId); $own = Invoke-CimMethod -InputObject $w -MethodName GetOwner; if ($own.User) { $r.user = [string]$own.Domain + '\' + [string]$own.User } } catch {}
  return $r
}

$epoch = New-Object DateTime(1970, 1, 1, 0, 0, 0, [DateTimeKind]::Utc)
function EpochMs($d) { if ($null -eq $d) { return 0 }; try { return [long](([DateTime]$d).ToUniversalTime() - $epoch).TotalMilliseconds } catch { return 0 } }
function Short([string]$s, [int]$n) { $s = Clean $s; if ($s.Length -gt $n) { return $s.Substring(0, $n - 1) + '...' }; return $s }

function Ev($e) { return @{ t = (EpochMs $e.TimeCreated); id = [int]$e.Id; level = [int]$e.Level; provider = [string]$e.ProviderName; log = [string]$e.LogName; msg = (Short $e.Message 600) } }
function Op-Events([string]$log, $levels, [int]$hours, [int]$max) {
  $f = @{ LogName = $log; StartTime = (Get-Date).AddHours(-$hours) }
  if ($levels) { $f.Level = @($levels | ForEach-Object { [int]$_ }) }
  try { return @(Get-WinEvent -FilterHashtable $f -MaxEvents $max -ErrorAction Stop | ForEach-Object { Ev $_ }) }
  catch { if ($_.Exception.Message -match 'No events') { return @() }; throw }
}
function Op-SecEvents([int]$hours) {
  $since = (Get-Date).AddHours(-$hours); $res = @(); $errs = @()
  $qs = @(
    @{ LogName = 'Security'; Id = @(4625, 4740, 4720, 4726, 4732, 4728, 4756, 1102, 4697, 4719, 4648); StartTime = $since },
    @{ LogName = 'System'; Id = @(7045, 104, 6008, 41); StartTime = $since },
    @{ LogName = 'Microsoft-Windows-Windows Defender/Operational'; Id = @(1116, 1117, 5001, 5010, 5012, 1006, 1015); StartTime = $since },
    @{ LogName = 'Microsoft-Windows-TerminalServices-RemoteConnectionManager/Operational'; Id = @(1149); StartTime = $since },
    @{ LogName = 'Microsoft-Windows-PowerShell/Operational'; Id = @(4104); Level = @(3); StartTime = $since }
  )
  foreach ($f in $qs) {
    try {
      $res += @(Get-WinEvent -FilterHashtable $f -MaxEvents 300 -ErrorAction Stop | ForEach-Object {
        $o = Ev $_
        if ($_.Id -eq 4625) { try { $o.user = [string]$_.Properties[5].Value; $o.ip = [string]$_.Properties[19].Value; $o.logonType = [int]$_.Properties[10].Value } catch {} }
        if ($_.Id -eq 7045) { try { $o.service = [string]$_.Properties[0].Value; $o.image = [string]$_.Properties[1].Value } catch {} }
        $o
      })
    } catch { if ($_.Exception.Message -notmatch 'No events') { $errs += ([string]$f.LogName + ': ' + (Short $_.Exception.Message 160)) } }
  }
  return @{ events = $res; errors = $errs }
}
$uninstRoots = @('HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall', 'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall', 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall')
function Op-Apps {
  $out = @()
  foreach ($root in $uninstRoots) {
    foreach ($k in @(Get-ChildItem $root -ErrorAction SilentlyContinue)) {
      $p = Get-ItemProperty $k.PSPath -ErrorAction SilentlyContinue
      if (-not $p.DisplayName -or $p.SystemComponent -eq 1 -or $p.ParentKeyName) { continue }
      $out += @{ name = (Clean $p.DisplayName); version = (Clean $p.DisplayVersion); publisher = (Clean $p.Publisher); date = [string]$p.InstallDate; sizeKb = [long]$p.EstimatedSize; location = (Clean $p.InstallLocation); hasUninstall = [bool]$p.UninstallString; key = ($root + '\' + $k.PSChildName); scope = $(if ($root -like 'HKCU*') { 'user' } else { 'machine' }); arch = $(if ($root -like '*WOW6432*') { 'x86' } else { 'x64' }) }
    }
  }
  return $out
}
function Op-Uninstall([string]$key) {
  if (-not ($uninstRoots | Where-Object { $key.StartsWith($_ + '\') })) { throw 'not an uninstall key' }
  $p = Get-ItemProperty $key -ErrorAction Stop
  $u = [string]$p.UninstallString
  if (-not $u) { throw 'this app has no uninstaller registered' }
  $psi = New-Object Diagnostics.ProcessStartInfo('cmd.exe', '/c "' + $u + '"')
  $psi.UseShellExecute = $true; $psi.WindowStyle = 'Hidden'
  [void][Diagnostics.Process]::Start($psi)
  return ('uninstaller for ' + [string]$p.DisplayName + ' started')
}
function Op-Tasks([bool]$all) {
  return @(Get-ScheduledTask -ErrorAction Stop | Where-Object { $all -or $_.TaskPath -notlike '\Microsoft\*' } | ForEach-Object {
    $i = $null; try { $i = Get-ScheduledTaskInfo -InputObject $_ -ErrorAction Stop } catch {}
    @{ name = [string]$_.TaskName; path = [string]$_.TaskPath; state = [string]$_.State; author = (Clean $_.Author); desc = (Short $_.Description 200)
       actions = (Short ((@($_.Actions) | ForEach-Object { ([string]$_.Execute + ' ' + [string]$_.Arguments).Trim() }) -join '; ') 300)
       triggers = (Clean ((@($_.Triggers) | Where-Object { $_ } | ForEach-Object { $_.CimClass.CimClassName -replace '^MSFT_Task', '' -replace 'Trigger$', '' }) -join ', '))
       last = $(if ($i) { EpochMs $i.LastRunTime } else { 0 }); next = $(if ($i) { EpochMs $i.NextRunTime } else { 0 }); result = $(if ($i) { [long]$i.LastTaskResult } else { $null }); user = [string]$_.Principal.UserId }
  })
}
function Op-Task([string]$path, [string]$name, [string]$action) {
  switch ($action) {
    'enable' { [void](Enable-ScheduledTask -TaskPath $path -TaskName $name -ErrorAction Stop) }
    'disable' { [void](Disable-ScheduledTask -TaskPath $path -TaskName $name -ErrorAction Stop) }
    'run' { Start-ScheduledTask -TaskPath $path -TaskName $name -ErrorAction Stop }
    'stop' { Stop-ScheduledTask -TaskPath $path -TaskName $name -ErrorAction Stop }
    default { throw 'bad action' }
  }
  return ([string](Get-ScheduledTask -TaskPath $path -TaskName $name).State)
}
function Approved-Key([string]$location) {
  if ($location -match '^HKU\\[^\\]+\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run$' -or $location -match '^HKCU') { return 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run' }
  if ($location -match '^HKLM\\SOFTWARE\\(WOW6432Node\\)?Microsoft\\Windows\\CurrentVersion\\Run$') { if ($matches[1]) { return 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run32' }; return 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run' }
  if ($location -eq 'Startup') { return 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\StartupFolder' }
  if ($location -eq 'Common Startup') { return 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\StartupFolder' }
  return $null
}
function Approved-Name($item) { if ($item.Location -like '*Startup') { return [IO.Path]::GetFileName([string]$item.Command) }; return [string]$item.Name }
function Op-StartupToggle([string]$name, [string]$location, [bool]$enable) {
  $item = Get-CimInstance Win32_StartupCommand | Where-Object { [string]$_.Name -eq $name -and [string]$_.Location -eq $location } | Select-Object -First 1
  if (-not $item) { throw 'startup item not found' }
  $k = Approved-Key $location
  if (-not $k) { throw 'this startup location cannot be toggled' }
  if (-not (Test-Path $k)) { [void](New-Item -Path $k -Force) }
  $b = [byte[]](0,0,0,0,0,0,0,0,0,0,0,0)
  if ($enable) { $b[0] = 2 } else { $b[0] = 3; $ft = [BitConverter]::GetBytes([DateTime]::UtcNow.ToFileTimeUtc()); [Array]::Copy($ft, 0, $b, 4, 8) }
  Set-ItemProperty -Path $k -Name (Approved-Name $item) -Value $b -Type Binary -ErrorAction Stop
  return $(if ($enable) { 'enabled' } else { 'disabled' })
}
function Op-Devices {
  return @(Get-CimInstance Win32_PnPEntity -Filter 'ConfigManagerErrorCode <> 0' -ErrorAction SilentlyContinue | ForEach-Object { @{ name = (Clean $_.Name); cls = [string]$_.PNPClass; code = [int]$_.ConfigManagerErrorCode; status = [string]$_.Status; id = [string]$_.PNPDeviceID; mfr = (Clean $_.Manufacturer) } })
}
function Op-Drivers {
  $keep = @('DISPLAY', 'NET', 'MEDIA', 'SCSIADAPTER', 'HDC', 'BLUETOOTH', 'USB', 'AUDIOENDPOINT', 'MONITOR', 'HIDCLASS', 'DISKDRIVE', 'SYSTEM', 'CAMERA', 'IMAGE')
  return @(Get-CimInstance Win32_PnPSignedDriver -ErrorAction SilentlyContinue | Where-Object { $_.DeviceName -and ($keep -contains [string]$_.DeviceClass) } | ForEach-Object { @{ name = (Clean $_.DeviceName); cls = [string]$_.DeviceClass; version = [string]$_.DriverVersion; date = (EpochMs $_.DriverDate); provider = (Clean $_.DriverProviderName); signer = (Clean $_.Signer); signed = [bool]$_.IsSigned; inf = [string]$_.InfName } })
}
function Op-Updates {
  $hf = @(Get-HotFix -ErrorAction SilentlyContinue | ForEach-Object { @{ id = [string]$_.HotFixID; desc = [string]$_.Description; date = (EpochMs $_.InstalledOn); by = [string]$_.InstalledBy } })
  $reboot = @()
  if (Test-Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending') { $reboot += 'Component servicing' }
  if (Test-Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired') { $reboot += 'Windows Update' }
  try { if ((Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager' -Name PendingFileRenameOperations -ErrorAction Stop).PendingFileRenameOperations) { $reboot += 'Pending file renames' } } catch {}
  $lastBoot = 0; try { $lastBoot = EpochMs (Get-CimInstance Win32_OperatingSystem).LastBootUpTime } catch {}
  return @{ hotfixes = $hf; reboot = $reboot; lastBoot = $lastBoot }
}
function Op-Modules([int]$procId) {
  $p = Get-Process -Id $procId -ErrorAction Stop
  return @($p.Modules | ForEach-Object { $v = $_.FileVersionInfo; @{ name = [string]$_.ModuleName; path = [string]$_.FileName; size = [long]$_.ModuleMemorySize; company = (Clean $v.CompanyName); version = (Clean $v.FileVersion); desc = (Clean $v.FileDescription) } })
}
function Op-FwBlock([string]$path, [string]$label, [bool]$on) {
  if (-not (Test-Path -LiteralPath $path)) { throw 'executable not found' }
  if ($on) {
    $n = 'RigWatch block: ' + $label
    [void](New-NetFirewallRule -DisplayName $n -Group 'RigWatch' -Direction Outbound -Program $path -Action Block -Profile Any -ErrorAction Stop)
    [void](New-NetFirewallRule -DisplayName ($n + ' (inbound)') -Group 'RigWatch' -Direction Inbound -Program $path -Action Block -Profile Any -ErrorAction Stop)
    return 'blocked'
  }
  $rules = @(Get-NetFirewallRule -Group 'RigWatch' -ErrorAction SilentlyContinue | Where-Object { (Get-NetFirewallApplicationFilter -AssociatedNetFirewallRule $_).Program -eq $path })
  if (-not $rules.Count) { throw 'no RigWatch rule for this program' }
  $rules | Remove-NetFirewallRule -ErrorAction Stop
  return 'unblocked'
}
function Op-FwList {
  return @(Get-NetFirewallRule -Group 'RigWatch' -ErrorAction SilentlyContinue | ForEach-Object { $f = Get-NetFirewallApplicationFilter -AssociatedNetFirewallRule $_; @{ name = [string]$_.DisplayName; program = [string]$f.Program; dir = [string]$_.Direction; enabled = [string]$_.Enabled } })
}
function Op-Env {
  $u = [Environment]::GetEnvironmentVariables('User'); $m = [Environment]::GetEnvironmentVariables('Machine')
  return @{ user = @($u.Keys | ForEach-Object { @{ k = [string]$_; v = [string]$u[$_] } }); machine = @($m.Keys | ForEach-Object { @{ k = [string]$_; v = [string]$m[$_] } }) }
}
function Op-Sockets {
  $t = @(Get-NetTCPConnection -ErrorAction SilentlyContinue | ForEach-Object { [string]$_.LocalAddress + '|' + [string]$_.LocalPort + '|' + [string]$_.RemoteAddress + '|' + [string]$_.RemotePort + '|' + [string]$_.State + '|' + [string]$_.OwningProcess })
  $u = @(Get-NetUDPEndpoint -ErrorAction SilentlyContinue | ForEach-Object { [string]$_.LocalAddress + '|' + [string]$_.LocalPort + '|' + [string]$_.OwningProcess })
  return @{ tcp = $t; udp = $u }
}
function Op-Recycle([bool]$empty) {
  if ($empty) { Clear-RecycleBin -Force -ErrorAction Stop; return @{ emptied = $true } }
  $sh = New-Object -ComObject Shell.Application; $rb = $sh.Namespace(10); $n = 0; [double]$sz = 0
  foreach ($i in $rb.Items()) { $n++; try { $sz += [double]$i.Size } catch {} }
  return @{ items = $n; bytes = $sz }
}

# ---------------------------------------------------------------- SIEM
# Event logs read incrementally: each query keeps its own EventRecordID bookmark ("mark").
$siemQ = @(
  @{ k = 'sec-logon'; log = 'Security'; ids = @(4624); extra = " and *[EventData[Data[@Name='LogonType']!='5' and Data[@Name='LogonType']!='4' and Data[@Name='LogonType']!='0' and Data[@Name='TargetUserSid']!='S-1-5-18' and Data[@Name='TargetUserSid']!='S-1-5-19' and Data[@Name='TargetUserSid']!='S-1-5-20']]" },
  @{ k = 'sec-priv'; log = 'Security'; ids = @(4672); extra = " and *[EventData[Data[@Name='SubjectUserSid']!='S-1-5-18' and Data[@Name='SubjectUserSid']!='S-1-5-19' and Data[@Name='SubjectUserSid']!='S-1-5-20']]" },
  @{ k = 'sec-logoff'; log = 'Security'; ids = @(4634); extra = " and *[EventData[Data[@Name='LogonType']='2' or Data[@Name='LogonType']='10' or Data[@Name='LogonType']='11' or Data[@Name='LogonType']='12']]" },
  @{ k = 'sec'; log = 'Security'; ids = @(4625, 4647, 4648, 4720, 4722, 4724, 4725, 4726, 4728, 4732, 4756, 4740, 4719, 1102, 4697, 4698, 4778, 4779, 4800, 4801) },
  @{ k = 'sys'; log = 'System'; ids = @(7045, 104, 1074, 6005, 41); msg = @(104) },
  @{ k = 'def'; log = 'Microsoft-Windows-Windows Defender/Operational'; ids = @(1116, 1117, 5001, 5007, 5010, 5012); msg = @(1116, 1117, 5007) },
  @{ k = 'fw'; log = 'Microsoft-Windows-Windows Firewall With Advanced Security/Firewall'; ids = @(2003, 2004, 2005, 2006, 2052, 2097, 2099) },
  @{ k = 'rdp'; log = 'Microsoft-Windows-TerminalServices-RemoteConnectionManager/Operational'; ids = @(1149) },
  @{ k = 'ssh'; log = 'OpenSSH/Operational'; ids = @(4); msg = @(4) }
)
function Op-SiemPoll($marks, [int]$backHours, [int]$max) {
  $events = New-Object System.Collections.ArrayList; $state = @{}
  foreach ($q in $siemQ) {
    $last = [long]0
    if ($marks -and $marks.PSObject.Properties[$q.k]) { $last = [long]$marks.($q.k) }
    $ids = '(' + (($q.ids | ForEach-Object { 'EventID=' + $_ }) -join ' or ') + ')'
    if ($last -gt 0) { $win = 'EventRecordID > ' + $last } else { $win = 'TimeCreated[timediff(@SystemTime) <= ' + ([long]$backHours * 3600000) + ']' }
    $xp = '*[System[' + $ids + ' and ' + $win + ']]' + [string]$q.extra
    $st = @{ ok = $true; n = 0; err = ''; mark = $last; full = $false }
    try {
      $list = @(Get-WinEvent -LogName $q.log -FilterXPath $xp -Oldest -MaxEvents $max -ErrorAction Stop)
      foreach ($e in $list) {
        $o = @{ k = $q.k; id = [int]$e.Id; rid = [long]$e.RecordId; t = (EpochMs $e.TimeCreated); p = @($e.Properties | ForEach-Object { [string]$_.Value }) }
        if ($q.msg -and ($q.msg -contains [int]$e.Id)) { try { $o.m = (Short $e.Message 700) } catch {} }
        [void]$events.Add($o)
        if ($o.rid -gt $st.mark) { $st.mark = $o.rid }
      }
      $st.n = $list.Count; $st.full = ($list.Count -ge $max)
    } catch {
      $fq = [string]$_.FullyQualifiedErrorId
      if ($fq -match 'NoMatchingEventsFound') { }
      elseif ($_.Exception -is [System.UnauthorizedAccessException] -or $fq -match 'UnauthorizedAccess') { $st.ok = $false; $st.err = 'needs admin' }
      elseif ($fq -match 'NoMatchingLogsFound') { $st.ok = $false; $st.err = 'not present' }
      else { $st.ok = $false; $st.err = (Short $_.Exception.Message 200) }
    }
    if ($st.ok -and $st.n -eq 0) {
      try {
        $nw = @(Get-WinEvent -LogName $q.log -MaxEvents 1 -ErrorAction Stop)
        if ($nw.Count) {
          $top = [long]$nw[0].RecordId
          if ($last -eq 0) { $st.mark = $top }                     # empty backfill window: start from now
          elseif ($top -lt $last) { $st.mark = $top; $st.reset = $true }  # log was cleared
        }
      } catch {}
    }
    $state[$q.k] = $st
  }
  return @{ events = $events; state = $state }
}
function Op-FwLog([string]$mode) {
  if ($mode -eq 'on') { Set-NetFirewallProfile -All -LogBlocked True -LogMaxSizeKilobytes 16384 -ErrorAction Stop }
  elseif ($mode -eq 'off') { Set-NetFirewallProfile -All -LogBlocked False -ErrorAction Stop }
  return @(Get-NetFirewallProfile -ErrorAction Stop | ForEach-Object { @{ name = [string]$_.Name; blocked = [string]$_.LogBlocked; file = [Environment]::ExpandEnvironmentVariables([string]$_.LogFileName) } })
}
function IpRuleKey([string]$ip) { return 'RigWatchIP_' + ($ip -replace '[^0-9A-Za-z]', '_') }
function Op-IpBlock([string]$ip, [bool]$on, [string]$note) {
  $k = IpRuleKey $ip
  Remove-NetFirewallRule -Name ($k + '_in'), ($k + '_out') -ErrorAction SilentlyContinue
  if ($on) {
    [void](New-NetFirewallRule -Name ($k + '_in') -DisplayName ('RigWatch block ' + $ip + ' (inbound)') -Description $note -Group 'RigWatch IP' -Direction Inbound -RemoteAddress $ip -Action Block -Profile Any -ErrorAction Stop)
    [void](New-NetFirewallRule -Name ($k + '_out') -DisplayName ('RigWatch block ' + $ip) -Description $note -Group 'RigWatch IP' -Direction Outbound -RemoteAddress $ip -Action Block -Profile Any -ErrorAction Stop)
    return 'blocked'
  }
  return 'unblocked'
}
function Op-IpList {
  return @(Get-NetFirewallRule -Group 'RigWatch IP' -ErrorAction SilentlyContinue | ForEach-Object { $a = Get-NetFirewallAddressFilter -AssociatedNetFirewallRule $_; @{ name = [string]$_.Name; dir = [string]$_.Direction; ip = (@($a.RemoteAddress) -join ','); enabled = [string]$_.Enabled; desc = [string]$_.Description } })
}
$wtsSrc = @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public static class RigWts {
  [DllImport("wtsapi32.dll", SetLastError = true)] static extern bool WTSEnumerateSessionsW(IntPtr server, int reserved, int version, out IntPtr info, out int count);
  [DllImport("wtsapi32.dll", SetLastError = true)] static extern bool WTSQuerySessionInformationW(IntPtr server, int sessionId, int infoClass, out IntPtr buffer, out int bytes);
  [DllImport("wtsapi32.dll")] static extern void WTSFreeMemory(IntPtr memory);
  [DllImport("wtsapi32.dll", SetLastError = true)] static extern bool WTSLogoffSession(IntPtr server, int sessionId, bool wait);
  [DllImport("wtsapi32.dll", SetLastError = true)] static extern bool WTSDisconnectSession(IntPtr server, int sessionId, bool wait);
  [StructLayout(LayoutKind.Sequential)] struct SI { public int Id; public IntPtr Station; public int State; }
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)] struct INFO {
    public int State; public int SessionId; public int InB, OutB, InF, OutF, InCB, OutCB;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)] public string Station;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 17)] public string Domain;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 21)] public string User;
    public long Connect, Disconnect, LastInput, Logon, Current;
  }
  static readonly string[] States = { "active", "connected", "connectquery", "shadow", "disconnected", "idle", "listen", "reset", "down", "init" };
  static string Str(int id, int cls) { IntPtr b; int n; if (!WTSQuerySessionInformationW(IntPtr.Zero, id, cls, out b, out n) || b == IntPtr.Zero) return ""; try { return Marshal.PtrToStringUni(b) ?? ""; } finally { WTSFreeMemory(b); } }
  static string Addr(int id) {
    IntPtr b; int n; if (!WTSQuerySessionInformationW(IntPtr.Zero, id, 14, out b, out n) || b == IntPtr.Zero) return "";
    try { int fam = Marshal.ReadInt32(b); byte[] a = new byte[20]; Marshal.Copy(IntPtr.Add(b, 4), a, 0, 20); if (fam == 2) return a[2] + "." + a[3] + "." + a[4] + "." + a[5]; return ""; } finally { WTSFreeMemory(b); }
  }
  static long Ms(long ft) { return ft > 0 ? (ft - 116444736000000000L) / 10000L : 0; }
  public static List<Dictionary<string, object>> List() {
    var res = new List<Dictionary<string, object>>(); IntPtr p; int c;
    if (!WTSEnumerateSessionsW(IntPtr.Zero, 0, 1, out p, out c)) return res;
    try {
      int sz = Marshal.SizeOf(typeof(SI));
      for (int i = 0; i < c; i++) {
        SI s = (SI)Marshal.PtrToStructure(IntPtr.Add(p, i * sz), typeof(SI));
        var d = new Dictionary<string, object>();
        d["id"] = s.Id; d["station"] = Marshal.PtrToStringUni(s.Station) ?? ""; d["state"] = s.State >= 0 && s.State < States.Length ? States[s.State] : s.State.ToString();
        d["user"] = Str(s.Id, 5); d["domain"] = Str(s.Id, 7); d["client"] = Str(s.Id, 10); d["addr"] = Addr(s.Id);
        IntPtr b; int n;
        if (WTSQuerySessionInformationW(IntPtr.Zero, s.Id, 24, out b, out n) && b != IntPtr.Zero) {
          try { INFO inf = (INFO)Marshal.PtrToStructure(b, typeof(INFO)); d["logon"] = Ms(inf.Logon); d["connect"] = Ms(inf.Connect); d["lastInput"] = Ms(inf.LastInput); d["now"] = Ms(inf.Current); } finally { WTSFreeMemory(b); }
        }
        res.Add(d);
      }
    } finally { WTSFreeMemory(p); }
    return res;
  }
  public static string Logoff(int id) { return WTSLogoffSession(IntPtr.Zero, id, false) ? "" : ("sign-out failed (Win32 error " + Marshal.GetLastWin32Error() + "): needs admin for other users"); }
  public static string Disconnect(int id) { return WTSDisconnectSession(IntPtr.Zero, id, false) ? "" : ("disconnect failed (Win32 error " + Marshal.GetLastWin32Error() + ")"); }
}
'@
function EnsureWts { if (-not ('RigWts' -as [type])) { Add-Type -TypeDefinition $wtsSrc -Language CSharp } }
function Op-Sessions {
  $res = @{ wts = @(); logons = @(); smb = @(); users = @(); errors = @(); self = [Diagnostics.Process]::GetCurrentProcess().SessionId }
  try { EnsureWts; $res.wts = @([RigWts]::List()) } catch { $res.errors += ('sessions: ' + (Short $_.Exception.Message 160)) }
  try {
    $map = @{}
    foreach ($l in @(Get-CimInstance Win32_LoggedOnUser -ErrorAction Stop)) { $map[[string]$l.Dependent.LogonId] = ([string]$l.Antecedent.Domain + '\' + [string]$l.Antecedent.Name) }
    $res.logons = @(Get-CimInstance Win32_LogonSession -ErrorAction Stop | Where-Object { $_.LogonType -ne 5 -and $_.LogonType -ne 0 } | ForEach-Object { @{ id = [string]$_.LogonId; type = [int]$_.LogonType; auth = [string]$_.AuthenticationPackage; start = (EpochMs $_.StartTime); user = [string]$map[[string]$_.LogonId] } })
  } catch { $res.errors += ('logon sessions: ' + (Short $_.Exception.Message 160)) }
  try { $res.smb = @(Get-SmbSession -ErrorAction Stop | ForEach-Object { @{ id = [string]$_.SessionId; client = [string]$_.ClientComputerName; user = [string]$_.ClientUserName; opens = [int]$_.NumOpens; secs = [long]$_.SecondsExists; idle = [long]$_.SecondsIdle; dialect = [string]$_.Dialect } }) } catch { $res.errors += ('file sharing (SMB): ' + (Short $_.Exception.Message 120)) }
  try {
    $adm = @{}; try { foreach ($m in @(Get-LocalGroupMember -SID 'S-1-5-32-544' -ErrorAction Stop)) { $adm[[string]$m.SID] = $true } } catch {}
    $res.users = @(Get-LocalUser -ErrorAction Stop | ForEach-Object { @{ name = [string]$_.Name; enabled = [bool]$_.Enabled; last = (EpochMs $_.LastLogon); pwdSet = (EpochMs $_.PasswordLastSet); desc = (Clean $_.Description); admin = [bool]$adm[[string]$_.SID]; sid = [string]$_.SID; source = [string]$_.PrincipalSource } })
  } catch { $res.errors += ('local accounts: ' + (Short $_.Exception.Message 120)) }
  return $res
}
function Op-Session([int]$sid, [string]$action) {
  EnsureWts
  if ($action -eq 'logoff') { $e = [RigWts]::Logoff($sid) } else { $e = [RigWts]::Disconnect($sid) }
  if ($e) { throw $e }
  if ($action -eq 'logoff') { return 'signed out session ' + $sid }; return 'disconnected session ' + $sid
}
function RegVal([string]$path, [string]$name) { try { return (Get-ItemProperty -LiteralPath $path -Name $name -ErrorAction Stop).$name } catch { return $null } }
function Op-ScaFacts {
  $f = @{}
  $f.admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
  try { $f.fw = @(Get-NetFirewallProfile -ErrorAction Stop | ForEach-Object { @{ name = [string]$_.Name; on = [string]$_.Enabled; inbound = [string]$_.DefaultInboundAction } }) } catch { $f.fwErr = (Short $_.Exception.Message 120) }
  try { $m = Get-MpComputerStatus -ErrorAction Stop; $f.def = @{ rtp = [bool]$m.RealTimeProtectionEnabled; av = [bool]$m.AntivirusEnabled; sigAge = [int]$m.AntivirusSignatureAge; tamper = [bool]$m.IsTamperProtected } } catch { $f.defErr = (Short $_.Exception.Message 120) }
  try { $f.av = @(Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct -ErrorAction Stop | ForEach-Object { @{ name = [string]$_.displayName; state = [long]$_.productState } }) } catch {}
  $sys = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System'
  $f.uac = RegVal $sys 'EnableLUA'; $f.uacPrompt = RegVal $sys 'ConsentPromptBehaviorAdmin'
  $ts = 'HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server'
  $f.rdpDeny = RegVal $ts 'fDenyTSConnections'; $f.rdpNla = RegVal ($ts + '\WinStations\RDP-Tcp') 'UserAuthentication'
  $lan = 'HKLM:\SYSTEM\CurrentControlSet\Services\LanmanServer\Parameters'
  $f.smb1 = RegVal $lan 'SMB1'; $f.smbSigning = RegVal $lan 'RequireSecuritySignature'
  try { $sc = Get-SmbServerConfiguration -ErrorAction Stop; $f.smb1Server = [bool]$sc.EnableSMB1Protocol; $f.smbSigning = [int][bool]$sc.RequireSecuritySignature } catch {}
  try { $f.users = @(Get-LocalUser -ErrorAction Stop | ForEach-Object { @{ sid = [string]$_.SID; name = [string]$_.Name; enabled = [bool]$_.Enabled; pwdRequired = [bool]$_.PasswordRequired } }) } catch {}
  $f.llmnr = RegVal 'HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\DNSClient' 'EnableMulticast'
  $f.autorun = RegVal 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer' 'NoDriveTypeAutoRun'
  $f.autorunUser = RegVal 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer' 'NoDriveTypeAutoRun'
  $f.wdigest = RegVal 'HKLM:\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest' 'UseLogonCredential'
  $f.lsaPpl = RegVal 'HKLM:\SYSTEM\CurrentControlSet\Control\Lsa' 'RunAsPPL'
  $f.ntlmLevel = RegVal 'HKLM:\SYSTEM\CurrentControlSet\Control\Lsa' 'LmCompatibilityLevel'
  $f.psv2 = RegVal 'HKLM:\SOFTWARE\Microsoft\PowerShell\1\PowerShellEngine' 'PowerShellVersion'
  $f.scriptBlockLog = RegVal 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging' 'EnableScriptBlockLogging'
  try { $f.remoteReg = [string](Get-Service RemoteRegistry -ErrorAction Stop).StartType } catch { $f.remoteReg = '' }
  try { $f.wuStart = [string](Get-Service wuauserv -ErrorAction Stop).StartType } catch { $f.wuStart = '' }
  try { $h = @(Get-HotFix -ErrorAction Stop | Where-Object { $_.InstalledOn } | Sort-Object InstalledOn -Descending); if ($h.Count) { $f.lastPatch = EpochMs $h[0].InstalledOn } } catch {}
  try { $bl = Get-CimInstance -Namespace 'root/cimv2/security/microsoftvolumeencryption' -ClassName Win32_EncryptableVolume -Filter ("DriveLetter='" + $env:SystemDrive + "'") -ErrorAction Stop; if ($bl) { $f.bitlocker = [int]$bl.ProtectionStatus } } catch {}
  if ($f.admin) {
    try {
      $tmp = [IO.Path]::GetTempFileName()
      [void](& (Join-Path $env:SystemRoot 'System32\secedit.exe') /export /cfg $tmp /areas SECURITYPOLICY /quiet)
      $txt = [IO.File]::ReadAllText($tmp); Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
      foreach ($k in 'MinimumPasswordLength', 'PasswordComplexity', 'LockoutBadCount', 'MaximumPasswordAge') { if ($txt -match ('(?m)^' + $k + '\s*=\s*(-?\d+)')) { $f['sec_' + $k] = [int]$Matches[1] } }
    } catch {}
  }
  return $f
}
function Op-RunKeys {
  $out = New-Object System.Collections.ArrayList
  $skip = @('PSPath', 'PSParentPath', 'PSChildName', 'PSDrive', 'PSProvider')
  $keys = @('HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run', 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce', 'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Run', 'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\RunOnce', 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run', 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce', 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer\Run', 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer\Run')
  foreach ($k in $keys) {
    $p = $null; try { $p = Get-ItemProperty -LiteralPath $k -ErrorAction Stop } catch { continue }
    foreach ($n in $p.PSObject.Properties) { if ($skip -contains $n.Name) { continue }; [void]$out.Add(@{ key = ($k -replace ':', ''); name = [string]$n.Name; value = (Clean ([string]$n.Value)) }) }
  }
  $wl = 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon'
  foreach ($n in 'Shell', 'Userinit') { $v = RegVal $wl $n; if ($null -ne $v) { [void]$out.Add(@{ key = ($wl -replace ':', ''); name = $n; value = (Clean ([string]$v)) }) } }
  $ifeo = 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Image File Execution Options'
  foreach ($s in @(Get-ChildItem -LiteralPath $ifeo -ErrorAction SilentlyContinue)) { $d = $s.GetValue('Debugger'); if ($d) { [void]$out.Add(@{ key = (($ifeo -replace ':', '') + '\' + $s.PSChildName); name = 'Debugger'; value = (Clean ([string]$d)) }) } }
  return $out
}

while ($true) {
  $line = [Console]::In.ReadLine()
  if ($null -eq $line) { break }
  if (-not $line.Trim()) { continue }
  $cmd = $null
  try { $cmd = ConvertFrom-Json $line } catch { continue }
  try {
    switch ([string]$cmd.op) {
      'ping' { Reply $cmd.id $true 'pong' $null }
      'suspend' { $e = [RigCtl]::SuspendResume([int]$cmd.pid, $false); if ($e) { throw $e }; Reply $cmd.id $true 'suspended' $null }
      'resume' { $e = [RigCtl]::SuspendResume([int]$cmd.pid, $true); if ($e) { throw $e }; Reply $cmd.id $true 'resumed' $null }
      'priority' { $p = Get-Process -Id ([int]$cmd.pid); $p.PriorityClass = [Diagnostics.ProcessPriorityClass]([string]$cmd.level); Reply $cmd.id $true $p.PriorityClass.ToString() $null }
      'affinity' { $p = Get-Process -Id ([int]$cmd.pid); $p.ProcessorAffinity = [IntPtr]([long]$cmd.mask); Reply $cmd.id $true ([string]$p.ProcessorAffinity.ToInt64()) $null }
      'procinfo' { Reply $cmd.id $true (Op-ProcInfo ([int]$cmd.pid)) $null }
      'netinfo' { Reply $cmd.id $true (Op-NetInfo) $null }
      'dnscache' { Reply $cmd.id $true (Op-DnsCache) $null }
      'services' { Reply $cmd.id $true (Op-Services) $null }
      'service' { Reply $cmd.id $true (Op-Service ([string]$cmd.name) ([string]$cmd.action)) $null }
      'startup' { Reply $cmd.id $true (Op-Startup) $null }
      'signatures' { Reply $cmd.id $true (Op-Signatures $cmd.paths) $null }
      'events' { Reply $cmd.id $true (Op-Events ([string]$cmd.log) $cmd.levels ([int]$cmd.hours) ([int]$cmd.max)) $null }
      'secevents' { Reply $cmd.id $true (Op-SecEvents ([int]$cmd.hours)) $null }
      'apps' { Reply $cmd.id $true (Op-Apps) $null }
      'uninstall' { Reply $cmd.id $true (Op-Uninstall ([string]$cmd.key)) $null }
      'tasks' { Reply $cmd.id $true (Op-Tasks ([bool]$cmd.all)) $null }
      'task' { Reply $cmd.id $true (Op-Task ([string]$cmd.path) ([string]$cmd.name) ([string]$cmd.action)) $null }
      'startuptoggle' { Reply $cmd.id $true (Op-StartupToggle ([string]$cmd.name) ([string]$cmd.location) ([bool]$cmd.enable)) $null }
      'devices' { Reply $cmd.id $true (Op-Devices) $null }
      'drivers' { Reply $cmd.id $true (Op-Drivers) $null }
      'updates' { Reply $cmd.id $true (Op-Updates) $null }
      'modules' { Reply $cmd.id $true (Op-Modules ([int]$cmd.pid)) $null }
      'fwblock' { Reply $cmd.id $true (Op-FwBlock ([string]$cmd.path) ([string]$cmd.label) ([bool]$cmd.on)) $null }
      'fwlist' { Reply $cmd.id $true (Op-FwList) $null }
      'env' { Reply $cmd.id $true (Op-Env) $null }
      'recycle' { Reply $cmd.id $true (Op-Recycle ([bool]$cmd.empty)) $null }
      'sockets' { Reply $cmd.id $true (Op-Sockets) $null }
      'siempoll' { Reply $cmd.id $true (Op-SiemPoll $cmd.marks ([int]$cmd.backHours) ([int]$cmd.max)) $null }
      'fwlog' { Reply $cmd.id $true (Op-FwLog ([string]$cmd.mode)) $null }
      'ipblock' { Reply $cmd.id $true (Op-IpBlock ([string]$cmd.ip) ([bool]$cmd.on) ([string]$cmd.note)) $null }
      'iplist' { Reply $cmd.id $true (Op-IpList) $null }
      'sessions' { Reply $cmd.id $true (Op-Sessions) $null }
      'session' { Reply $cmd.id $true (Op-Session ([int]$cmd.sid) ([string]$cmd.action)) $null }
      'smbclose' { Close-SmbSession -SessionId ([uint64]$cmd.smbId) -Force -ErrorAction Stop; Reply $cmd.id $true ('closed SMB session ' + $cmd.smbId) $null }
      'scafacts' { Reply $cmd.id $true (Op-ScaFacts) $null }
      'runkeys' { Reply $cmd.id $true (Op-RunKeys) $null }
      default { Reply $cmd.id $false $null ('unknown op ' + [string]$cmd.op) }
    }
  } catch { Reply $cmd.id $false $null ([string]$_.Exception.Message) }
}
