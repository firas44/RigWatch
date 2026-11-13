# RigWatch fast collector: reads whole perf-counter categories once per interval and
# streams tab-separated lines to stdout. Started and fed by lib/platform/win.js.
$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = New-Object Text.UTF8Encoding($false)
$parentPid = [int]$env:RIG_PARENT_PID
$interval = [int]$env:RIG_INTERVAL_MS
if ($interval -lt 250) { $interval = 1000 }
$TAB = [string][char]9
$NL = [string][char]10
$ncpu = [Environment]::ProcessorCount
$out = [Console]::Out

$cats = @{}
foreach ($n in @('Processor Information','Process','GPU Engine','GPU Adapter Memory','GPU Process Memory','Network Interface','PhysicalDisk','Thermal Zone Information','Memory','TCPv4','TCPv6','System')) {
  try { $c = New-Object Diagnostics.PerformanceCounterCategory($n); [void]$c.ReadCategory(); $cats[$n] = $c } catch {}
}
$prev = @{}
$gpuParse = @{}
$rxGpu = [regex]'^pid_(\d+)_luid_(0x[0-9a-f]+_0x[0-9a-f]+)_phys_(\d+)_eng_(\d+)_engtype_(.*)$'
$rxGpm = [regex]'^pid_(\d+)_luid_(0x[0-9a-f]+_0x[0-9a-f]+)_phys_(\d+)$'

function Read-Cat([string]$name) {
  $c = $cats[$name]
  if ($null -eq $c) { return $null }
  try { return $c.ReadCategory() } catch { return $null }
}
function RateOf($pc, $cc, [string]$inst) {
  if ($null -eq $pc -or $null -eq $cc) { return 0.0 }
  $a = $pc[$inst]; $b = $cc[$inst]
  if ($null -eq $a -or $null -eq $b) { return 0.0 }
  try { return [double][Diagnostics.CounterSample]::Calculate($a.Sample, $b.Sample) } catch { return 0.0 }
}
function RawOf($cc, [string]$inst) {
  if ($null -eq $cc) { return 0 }
  $b = $cc[$inst]
  if ($null -eq $b) { return 0 }
  return $b.RawValue
}
function R2([double]$v) { return [Math]::Round($v, 2) }

$loop = 0
while ($true) {
  $sw = [Diagnostics.Stopwatch]::StartNew()
  $loop++
  if ($parentPid -gt 0 -and ($loop % 5) -eq 0) {
    try { [void][Diagnostics.Process]::GetProcessById($parentPid) } catch { exit 0 }
  }
  $sb = New-Object Text.StringBuilder
  $cur = @{}
  foreach ($k in @($cats.Keys)) { $cur[$k] = Read-Cat $k }

  $pi = $cur['Processor Information']; $pp = $prev['Processor Information']
  if ($pi -and $pp) {
    $u = $pi['% processor utility']; $up = $pp['% processor utility']
    $f = $pi['% processor performance']; $fp = $pp['% processor performance']
    $tm = $pi['% processor time']; $tmp = $pp['% processor time']
    $mhz = $pi['processor frequency']
    $dpc = $pi['% dpc time']; $dpcp = $pp['% dpc time']
    $irq = $pi['interrupts/sec']; $irqp = $pp['interrupts/sec']
    [void]$sb.Append('CPU' + $TAB + (R2 (RateOf $up $u '_total')) + $TAB + (R2 (RateOf $fp $f '_total')) + $TAB + (R2 (RateOf $tmp $tm '_total')) + $TAB + (RawOf $mhz '_total') + $TAB + (R2 (RateOf $dpcp $dpc '_total')) + $TAB + (R2 (RateOf $irqp $irq '_total')) + $NL)
    foreach ($inst in $u.Keys) {
      if ($inst -match '^(\d+),(\d+)$') {
        [void]$sb.Append('CORE' + $TAB + $matches[1] + $TAB + $matches[2] + $TAB + (R2 (RateOf $up $u $inst)) + $TAB + (R2 (RateOf $fp $f $inst)) + $TAB + (R2 (RateOf $tmp $tm $inst)) + $NL)
      }
    }
  }

  $sy = $cur['System']; $syp = $prev['System']
  if ($sy -and $syp) {
    [void]$sb.Append('SYS' + $TAB + (RawOf $sy['processes'] '') + $TAB + (RawOf $sy['threads'] '') + $TAB + (R2 (RateOf $syp['context switches/sec'] $sy['context switches/sec'] '')) + $TAB + (R2 (RateOf $syp['system calls/sec'] $sy['system calls/sec'] '')) + $TAB + (RawOf $sy['processor queue length'] '') + $NL)
  }

  $me = $cur['Memory']; $mep = $prev['Memory']
  if ($me -and $mep) {
    $standby = [double](RawOf $me['standby cache normal priority bytes'] '') + [double](RawOf $me['standby cache reserve bytes'] '') + [double](RawOf $me['standby cache core bytes'] '')
    [void]$sb.Append('MEM' + $TAB + (RawOf $me['available bytes'] '') + $TAB + (RawOf $me['committed bytes'] '') + $TAB + (RawOf $me['commit limit'] '') + $TAB + $standby + $TAB + (RawOf $me['modified page list bytes'] '') + $TAB + (RawOf $me['pool paged bytes'] '') + $TAB + (RawOf $me['pool nonpaged bytes'] '') + $TAB + (R2 (RateOf $mep['pages/sec'] $me['pages/sec'] '')) + $TAB + (R2 (RateOf $mep['page faults/sec'] $me['page faults/sec'] '')) + $TAB + (RawOf $me['cache bytes'] '') + $TAB + (RawOf $me['free & zero page list bytes'] '') + $NL)
  }

  $pr = $cur['Process']; $prp = $prev['Process']
  if ($pr) {
    $cpuC = $pr['% processor time']; $cpuP = $null; if ($prp) { $cpuP = $prp['% processor time'] }
    $idC = $pr['id process']; $idP = $null; if ($prp) { $idP = $prp['id process'] }
    $ioC = $pr['io data bytes/sec']; $ioP = $null; if ($prp) { $ioP = $prp['io data bytes/sec'] }
    $irC = $pr['io read bytes/sec']; $irP = $null; if ($prp) { $irP = $prp['io read bytes/sec'] }
    $iwC = $pr['io write bytes/sec']; $iwP = $null; if ($prp) { $iwP = $prp['io write bytes/sec'] }
    $pws = $pr['working set - private']; $ws = $pr['working set']; $pb = $pr['private bytes']
    $thr = $pr['thread count']; $hnd = $pr['handle count']; $ppid = $pr['creating process id']; $el = $pr['elapsed time']; $prio = $pr['priority base']
    foreach ($inst in $idC.Keys) {
      if ($inst -eq '_total' -or $inst -eq 'idle') { continue }
      $procId = $idC[$inst].RawValue
      $c = 0.0; $io = 0.0; $ir = 0.0; $iw = 0.0
      if ($idP) {
        $o = $idP[$inst]
        if ($o -and $o.RawValue -eq $procId) {
          $c = (RateOf $cpuP $cpuC $inst) / $ncpu
          $io = RateOf $ioP $ioC $inst; $ir = RateOf $irP $irC $inst; $iw = RateOf $iwP $iwC $inst
        }
      }
      $age = 0.0
      $e = $el[$inst]; if ($e) { $es = $e.Sample; if ($es.CounterFrequency -gt 0 -and $es.RawValue -gt 0) { $age = ($es.CounterTimeStamp - $es.RawValue) / $es.CounterFrequency } }
      $nm = $inst; $hash = $nm.IndexOf('#'); if ($hash -gt 0) { $nm = $nm.Substring(0, $hash) }
      [void]$sb.Append('P' + $TAB + $procId + $TAB + (RawOf $ppid $inst) + $TAB + $nm + $TAB + (R2 $c) + $TAB + (RawOf $pws $inst) + $TAB + (RawOf $ws $inst) + $TAB + (RawOf $pb $inst) + $TAB + [Math]::Round($io) + $TAB + [Math]::Round($ir) + $TAB + [Math]::Round($iw) + $TAB + (RawOf $thr $inst) + $TAB + (RawOf $hnd $inst) + $TAB + [Math]::Round($age) + $TAB + (RawOf $prio $inst) + $NL)
    }
  }

  $ge = $cur['GPU Engine']; $gep = $prev['GPU Engine']
  if ($ge -and $gep) {
    $uc = $ge['utilization percentage']; $upv = $gep['utilization percentage']
    $eng = @{}; $proc = @{}
    foreach ($inst in $uc.Keys) {
      $p = $gpuParse[$inst]
      if ($null -eq $p) {
        $m = $rxGpu.Match($inst)
        if (-not $m.Success) { continue }
        $p = @($m.Groups[1].Value, $m.Groups[2].Value, $m.Groups[3].Value, $m.Groups[4].Value, $m.Groups[5].Value)
        $gpuParse[$inst] = $p
      }
      $v = RateOf $upv $uc $inst
      $ek = $p[1] + '|' + $p[2] + '|' + $p[3] + '|' + $p[4]
      if ($eng.ContainsKey($ek)) { $eng[$ek] += $v } else { $eng[$ek] = $v }
      if ($v -gt 0.01) {
        $pk = $p[0] + '|' + $p[1]
        $pe = $proc[$pk]
        if ($null -eq $pe) { $proc[$pk] = @{ ($p[3] + '|' + $p[4]) = $v } }
        else { $kk = $p[3] + '|' + $p[4]; if ($pe.ContainsKey($kk)) { $pe[$kk] += $v } else { $pe[$kk] = $v } }
      }
    }
    foreach ($ek in $eng.Keys) {
      $parts = $ek.Split('|')
      [void]$sb.Append('GE' + $TAB + $parts[0] + $TAB + $parts[1] + $TAB + $parts[2] + $TAB + $parts[3] + $TAB + (R2 $eng[$ek]) + $NL)
    }
    foreach ($pk in $proc.Keys) {
      $best = 0.0; $bestType = ''
      foreach ($kk in $proc[$pk].Keys) { if ($proc[$pk][$kk] -gt $best) { $best = $proc[$pk][$kk]; $bestType = $kk.Split('|')[1] } }
      $parts = $pk.Split('|')
      [void]$sb.Append('GP' + $TAB + $parts[0] + $TAB + $parts[1] + $TAB + (R2 $best) + $TAB + $bestType + $NL)
    }
    if ($gpuParse.Count -gt 20000) { $gpuParse = @{} }
  }

  $gm = $cur['GPU Adapter Memory']
  if ($gm) {
    $d = $gm['dedicated usage']; $s = $gm['shared usage']; $tc = $gm['total committed']
    foreach ($inst in $d.Keys) {
      if ($inst -match '^luid_(0x[0-9a-f]+_0x[0-9a-f]+)_phys_(\d+)$') {
        [void]$sb.Append('GM' + $TAB + $matches[1] + $TAB + $matches[2] + $TAB + (RawOf $d $inst) + $TAB + (RawOf $s $inst) + $TAB + (RawOf $tc $inst) + $NL)
      }
    }
  }
  $gpm = $cur['GPU Process Memory']
  if ($gpm) {
    $d = $gpm['dedicated usage']; $s = $gpm['shared usage']
    foreach ($inst in $d.Keys) {
      $dv = RawOf $d $inst
      if ($dv -lt 1048576) { continue }
      $m = $rxGpm.Match($inst)
      if ($m.Success) { [void]$sb.Append('GPM' + $TAB + $m.Groups[1].Value + $TAB + $m.Groups[2].Value + $TAB + $dv + $TAB + (RawOf $s $inst) + $NL) }
    }
  }

  $ni = $cur['Network Interface']; $nip = $prev['Network Interface']
  if ($ni -and $nip) {
    $rb = $ni['bytes received/sec']; $tb = $ni['bytes sent/sec']; $rp = $ni['packets received/sec']; $tp = $ni['packets sent/sec']
    $rbp = $nip['bytes received/sec']; $tbp = $nip['bytes sent/sec']; $rpp = $nip['packets received/sec']; $tpp = $nip['packets sent/sec']
    foreach ($inst in $rb.Keys) {
      [void]$sb.Append('NET' + $TAB + $inst + $TAB + [Math]::Round((RateOf $rbp $rb $inst)) + $TAB + [Math]::Round((RateOf $tbp $tb $inst)) + $TAB + (R2 (RateOf $rpp $rp $inst)) + $TAB + (R2 (RateOf $tpp $tp $inst)) + $TAB + (RawOf $ni['current bandwidth'] $inst) + $TAB + (RawOf $rb $inst) + $TAB + (RawOf $tb $inst) + $TAB + (RawOf $rp $inst) + $TAB + (RawOf $tp $inst) + $TAB + (RawOf $ni['packets received errors'] $inst) + $TAB + (RawOf $ni['packets received discarded'] $inst) + $TAB + (RawOf $ni['packets outbound errors'] $inst) + $TAB + (RawOf $ni['packets outbound discarded'] $inst) + $NL)
    }
  }

  $t4 = $cur['TCPv4']; $t4p = $prev['TCPv4']; $t6 = $cur['TCPv6']; $t6p = $prev['TCPv6']
  if ($t4 -and $t4p) {
    $retr = (RateOf $t4p['segments retransmitted/sec'] $t4['segments retransmitted/sec'] '') + (RateOf $t6p['segments retransmitted/sec'] $t6['segments retransmitted/sec'] '')
    $segs = (RateOf $t4p['segments sent/sec'] $t4['segments sent/sec'] '') + (RateOf $t6p['segments sent/sec'] $t6['segments sent/sec'] '')
    [void]$sb.Append('TCP' + $TAB + (RawOf $t4['connections established'] '') + $TAB + (RawOf $t6['connections established'] '') + $TAB + (R2 $retr) + $TAB + (R2 $segs) + $TAB + ([double](RawOf $t4['connection failures'] '') + [double](RawOf $t6['connection failures'] '')) + $TAB + ([double](RawOf $t4['connections reset'] '') + [double](RawOf $t6['connections reset'] '')) + $NL)
  }

  $pd = $cur['PhysicalDisk']; $pdp = $prev['PhysicalDisk']
  if ($pd -and $pdp) {
    $names = @('disk read bytes/sec','disk write bytes/sec','disk reads/sec','disk writes/sec','% idle time','avg. disk sec/transfer')
    foreach ($inst in $pd['disk read bytes/sec'].Keys) {
      if ($inst -eq '_total') { continue }
      $line = 'DISK' + $TAB + $inst
      foreach ($cn in $names) { $line += $TAB + [Math]::Round((RateOf $pdp[$cn] $pd[$cn] $inst), 6) }
      $line += $TAB + (RawOf $pd['current disk queue length'] $inst)
      [void]$sb.Append($line + $NL)
    }
  }

  $tz = $cur['Thermal Zone Information']
  if ($tz) {
    $hp = $tz['high precision temperature']; $tt = $tz['temperature']
    foreach ($inst in $tt.Keys) {
      $kv = [double](RawOf $hp $inst)
      if ($kv -gt 0) { $cC = $kv / 10.0 - 273.15 } else { $cC = [double](RawOf $tt $inst) - 273.15 }
      [void]$sb.Append('TZ' + $TAB + $inst + $TAB + (R2 $cC) + $NL)
    }
  }

  $prev = $cur
  [void]$sb.Append('END' + $TAB + $loop + $TAB + $sw.ElapsedMilliseconds + $NL)
  try { $out.Write($sb.ToString()); $out.Flush() } catch { exit 0 }
  $left = $interval - $sw.ElapsedMilliseconds
  if ($left -gt 10) { Start-Sleep -Milliseconds $left }
}
