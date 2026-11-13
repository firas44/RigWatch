# RigWatch slow collector: hardware inventory once, then WMI-backed data on staggered timers.
$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = New-Object Text.UTF8Encoding($false)
$parentPid = [int]$env:RIG_PARENT_PID
$TAB = [string][char]9
$NL = [string][char]10
$out = [Console]::Out
$epoch = New-Object DateTime(1970, 1, 1, 0, 0, 0, [DateTimeKind]::Utc)

function Send([string]$kind, $obj) {
  $json = ConvertTo-Json -InputObject $obj -Compress -Depth 6
  try { $out.Write($kind + $TAB + $json + $NL); $out.Flush() } catch { exit 0 }
}
function Clean($s) { if ($null -eq $s) { return '' }; return ([string]$s -replace '[\t\r\n]+', ' ').Trim() }
function EpochMs($d) { if ($null -eq $d) { return 0 }; return [long](($d.ToUniversalTime() - $epoch).TotalMilliseconds) }

$st = @{}
try {
  $st.isAdmin = [bool](([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator))
} catch { $st.isAdmin = $false }
$c = Get-CimInstance Win32_Processor | Select-Object -First 1
if ($c) { $st.cpu = @{ name = Clean $c.Name; cores = [int]$c.NumberOfCores; threads = [int]$c.NumberOfLogicalProcessors; maxMhz = [int]$c.MaxClockSpeed; l2Kb = [int]$c.L2CacheSize; l3Kb = [int]$c.L3CacheSize; socket = Clean $c.SocketDesignation; vendor = Clean $c.Manufacturer; virt = [bool]$c.VirtualizationFirmwareEnabled } }
$o = Get-CimInstance Win32_OperatingSystem
if ($o) { $st.os = @{ caption = Clean $o.Caption; version = Clean $o.Version; build = Clean $o.BuildNumber; arch = Clean $o.OSArchitecture; bootMs = (EpochMs $o.LastBootUpTime); installMs = (EpochMs $o.InstallDate) } }
try { $dv = Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion'; $st.os.display = Clean $dv.DisplayVersion; $st.os.ubr = [int]$dv.UBR } catch {}
$cs = Get-CimInstance Win32_ComputerSystem
if ($cs) { $st.system = @{ manufacturer = Clean $cs.Manufacturer; model = Clean $cs.Model; ramBytes = [double]$cs.TotalPhysicalMemory; domain = Clean $cs.Domain; partOfDomain = [bool]$cs.PartOfDomain } }
$bb = Get-CimInstance Win32_BaseBoard | Select-Object -First 1
if ($bb) { $st.board = @{ manufacturer = Clean $bb.Manufacturer; product = Clean $bb.Product } }
$bi = Get-CimInstance Win32_BIOS | Select-Object -First 1
if ($bi) { $st.bios = @{ version = Clean $bi.SMBIOSBIOSVersion; vendor = Clean $bi.Manufacturer; dateMs = (EpochMs $bi.ReleaseDate) } }
$st.ram = @(Get-CimInstance Win32_PhysicalMemory | ForEach-Object { @{ slot = Clean $_.DeviceLocator; bytes = [double]$_.Capacity; mhz = [int]$_.ConfiguredClockSpeed; maxMhz = [int]$_.Speed; maker = Clean $_.Manufacturer; part = Clean $_.PartNumber } })
$st.video = @(Get-CimInstance Win32_VideoController | ForEach-Object { @{ name = Clean $_.Name; driver = Clean $_.DriverVersion; driverDateMs = (EpochMs $_.DriverDate); hz = [int]$_.CurrentRefreshRate; w = [int]$_.CurrentHorizontalResolution; h = [int]$_.CurrentVerticalResolution; vendor = Clean $_.AdapterCompatibility } })
try { $st.secureBoot = [bool](Confirm-SecureBootUEFI -ErrorAction Stop) } catch { $st.secureBoot = $null }

$dxgiSrc = @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public static class RigDxgi {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct DESC1 {
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 128)] public string Description;
    public uint VendorId; public uint DeviceId; public uint SubSysId; public uint Revision;
    public UIntPtr DedicatedVideoMemory; public UIntPtr DedicatedSystemMemory; public UIntPtr SharedSystemMemory;
    public uint LuidLow; public int LuidHigh; public uint Flags;
  }
  [ComImport, Guid("29038f61-3839-4626-91fd-086879011a05"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface IAdapter1 {
    void SetPrivateData(); void SetPrivateDataInterface(); void GetPrivateData(); void GetParent();
    void EnumOutputs(); void GetDesc(); void CheckInterfaceSupport();
    [PreserveSig] int GetDesc1(out DESC1 desc);
  }
  [ComImport, Guid("770aae78-f26f-4dba-a829-253c83d1b387"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface IFactory1 {
    void SetPrivateData(); void SetPrivateDataInterface(); void GetPrivateData(); void GetParent();
    void EnumAdapters(); void MakeWindowAssociation(); void GetWindowAssociation(); void CreateSwapChain(); void CreateSoftwareAdapter();
    [PreserveSig] int EnumAdapters1(uint index, out IAdapter1 adapter);
  }
  [DllImport("dxgi.dll")] static extern int CreateDXGIFactory1(ref Guid riid, [MarshalAs(UnmanagedType.Interface)] out IFactory1 factory);
  public static string[] List() {
    var res = new List<string>();
    Guid g = new Guid("770aae78-f26f-4dba-a829-253c83d1b387");
    IFactory1 f;
    if (CreateDXGIFactory1(ref g, out f) != 0 || f == null) return res.ToArray();
    for (uint i = 0; i < 16; i++) {
      IAdapter1 a;
      if (f.EnumAdapters1(i, out a) != 0 || a == null) break;
      DESC1 d;
      if (a.GetDesc1(out d) == 0) {
        res.Add(string.Format("0x{0:x8}_0x{1:x8}|{2}|{3}|{4}|{5}|{6}", d.LuidHigh, d.LuidLow, d.Description, d.VendorId, d.DedicatedVideoMemory.ToUInt64(), d.SharedSystemMemory.ToUInt64(), d.Flags));
      }
      Marshal.ReleaseComObject(a);
    }
    Marshal.ReleaseComObject(f);
    return res.ToArray();
  }
}
'@
try {
  if (-not ('RigDxgi' -as [type])) { Add-Type -TypeDefinition $dxgiSrc -Language CSharp -ErrorAction Stop }
  $st.dxgi = @([RigDxgi]::List() | ForEach-Object { $p = $_.Split('|'); @{ luid = $p[0]; name = Clean $p[1]; vendorId = [int]$p[2]; vram = [double]$p[3]; shared = [double]$p[4]; software = (([int]$p[5] -band 2) -ne 0) } })
} catch { $st.dxgi = @(); $st.dxgiError = Clean $_.Exception.Message }
Send 'STATIC' $st

$seen = @{}
$lhmNs = $null
$diskTempsOk = $st.isAdmin
$tick = 0
while ($true) {
  $sw = [Diagnostics.Stopwatch]::StartNew()
  if ($parentPid -gt 0 -and ($tick % 5) -eq 4) {
    try { [void][Diagnostics.Process]::GetProcessById($parentPid) } catch { exit 0 }
  }

  if (($tick % 3) -eq 0) {
    $now = @{}
    $lines = New-Object Text.StringBuilder
    foreach ($p in (Get-CimInstance Win32_Process -Property ProcessId,ParentProcessId,Name,CommandLine,ExecutablePath,CreationDate)) {
      $k = [string]$p.ProcessId + '|' + [string](EpochMs $p.CreationDate)
      $now[$k] = 1
      if (-not $seen.ContainsKey($k)) {
        [void]$lines.Append('PX' + $TAB + $p.ProcessId + $TAB + $p.ParentProcessId + $TAB + (EpochMs $p.CreationDate) + $TAB + (Clean $p.Name) + $TAB + (Clean $p.ExecutablePath) + $TAB + (Clean $p.CommandLine) + $NL)
      }
    }
    $seen = $now
    [void]$lines.Append('PXEND' + $TAB + $sw.ElapsedMilliseconds + $NL)
    try { $out.Write($lines.ToString()); $out.Flush() } catch { exit 0 }
  }

  if ($null -eq $lhmNs -and ($tick % 15) -eq 0) {
    foreach ($ns in @('root/LibreHardwareMonitor', 'root/OpenHardwareMonitor')) {
      try { [void](Get-CimInstance -Namespace $ns -ClassName Hardware -ErrorAction Stop | Select-Object -First 1); $lhmNs = $ns; break } catch {}
    }
  }
  if ($lhmNs -and ($tick % 2) -eq 0) {
    try {
      $hw = @(Get-CimInstance -Namespace $lhmNs -ClassName Hardware -ErrorAction Stop | ForEach-Object { @{ id = [string]$_.Identifier; name = Clean $_.Name; type = [string]$_.HardwareType; parent = [string]$_.Parent } })
      $se = @(Get-CimInstance -Namespace $lhmNs -ClassName Sensor -ErrorAction Stop | ForEach-Object { @{ id = [string]$_.Identifier; name = Clean $_.Name; type = [string]$_.SensorType; value = [double]$_.Value; min = [double]$_.Min; max = [double]$_.Max; parent = [string]$_.Parent } })
      Send 'LHM' @{ ns = $lhmNs; hw = $hw; sensors = $se }
    } catch { $lhmNs = $null; Send 'LHM' @{ ns = $null; hw = @(); sensors = @() } }
  }

  if (($tick % 10) -eq 0) {
    $dr = @(Get-CimInstance Win32_LogicalDisk | Where-Object { $_.Size -gt 0 } | ForEach-Object { @{ id = Clean $_.DeviceID; label = Clean $_.VolumeName; fs = Clean $_.FileSystem; size = [double]$_.Size; free = [double]$_.FreeSpace; type = [int]$_.DriveType } })
    Send 'DRIVES' $dr
    $bt = @(Get-CimInstance Win32_Battery | ForEach-Object { @{ name = Clean $_.Name; pct = [int]$_.EstimatedChargeRemaining; status = [int]$_.BatteryStatus; minutes = [int]$_.EstimatedRunTime } })
    Send 'BATTERY' $bt
  }

  if (($tick % 30) -eq 0) {
    $na = @(Get-NetAdapter | ForEach-Object { @{ name = Clean $_.Name; desc = Clean $_.InterfaceDescription; status = Clean $_.Status; speed = [double]$_.ReceiveLinkSpeed; virtual = [bool]$_.Virtual; media = Clean $_.PhysicalMediaType; mac = Clean $_.MacAddress; mtu = [int]$_.MtuSize; index = [int]$_.ifIndex } })
    Send 'NICS' $na
  }
  if (($tick % 60) -eq 0) {
    $pdk = @(Get-CimInstance -Namespace root/Microsoft/Windows/Storage -ClassName MSFT_PhysicalDisk | ForEach-Object {
      $d = @{ id = [string]$_.DeviceId; name = Clean $_.FriendlyName; media = [int]$_.MediaType; bus = [int]$_.BusType; size = [double]$_.Size; health = [int]$_.HealthStatus; temp = $null; wear = $null }
      if ($diskTempsOk) {
        try { $r = Get-CimAssociatedInstance -InputObject $_ -ResultClassName MSFT_StorageReliabilityCounter -ErrorAction Stop; if ($r) { $d.temp = [int]$r.Temperature; $d.wear = [int]$r.Wear } } catch { $diskTempsOk = $false }
      }
      $d
    })
    Send 'PDISKS' $pdk
  }

  $tick++
  $left = 1000 - $sw.ElapsedMilliseconds
  if ($left -gt 10) { Start-Sleep -Milliseconds $left }
}
