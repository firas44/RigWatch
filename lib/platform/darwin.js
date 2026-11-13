'use strict';
// macOS platform: built-in command line tools only (no sudo needed).
const os = require('os');
const path = require('path');
const fs = require('fs');
const U = require('../util');
const sockets = require('../sockets');

// ---------------------------------------------------------------------------
// pure parsers (exported for tests)
// ---------------------------------------------------------------------------
function parseVmStat(text) {
  const page = +((String(text).match(/page size of (\d+) bytes/) || [])[1] || 4096);
  const v = {};
  for (const line of String(text).split('\n')) { const m = line.match(/^"?([^":]+)"?:\s+(\d+)\.?$/); if (m) v[m[1].trim()] = +m[2] * page; }
  return { page, v };
}
function parseSwap(text) {
  const g = k => { const m = String(text).match(new RegExp(k + '\\s*=\\s*([\\d.]+)([KMGT])')); return m ? +m[1] * ({ K: 1024, M: 1048576, G: 1073741824, T: 1099511627776 })[m[2]] : 0; };
  return { total: g('total'), used: g('used') };
}
/** ps -axww -o pid=,ppid=,user=,state=,nice=,rss=,time=,etime=,comm= */
function parsePsMain(text) {
  const out = [];
  for (const line of String(text).split('\n')) {
    const m = line.trim().match(/^(\d+)\s+(\d+)\s+(\S+)\s+(\S+)\s+(-?\d+|-)\s+(\d+)\s+(\S+)\s+(\S+)\s+(.+)$/);
    if (!m) continue;
    out.push({ pid: +m[1], ppid: +m[2], user: m[3], state: m[4], nice: m[5] === '-' ? 0 : +m[5], rss: +m[6] * 1024, cpuSec: U.parseDuration(m[7]), age: U.parseDuration(m[8]), comm: m[9] });
  }
  return out;
}
function parsePsArgs(text) {
  const m = new Map();
  for (const line of String(text).split('\n')) { const x = line.match(/^\s*(\d+)\s+(.*)$/); if (x) m.set(+x[1], x[2]); }
  return m;
}
/** iostat -Id: header with disk names, label row, one value row (KB/t xfrs MB per disk). */
function parseIostat(text) {
  const lines = String(text).split('\n').filter(l => l.trim());
  if (lines.length < 3) return [];
  const names = lines[0].trim().split(/\s+/);
  const vals = lines[lines.length - 1].trim().split(/\s+/).map(Number);
  return names.map((n, i) => ({ name: n, xfrs: vals[i * 3 + 1] || 0, mb: vals[i * 3 + 2] || 0 }));
}
function parseDf(text) {
  const out = [];
  for (const line of String(text).split('\n').slice(1)) {
    const m = line.match(/^(\S+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)%\s+(.+)$/);
    if (!m || !/^\/dev\//.test(m[1])) continue;
    if (/^\/System\/Volumes\/(VM|Preboot|Update|xarts|iSCPreboot|Hardware)/.test(m[6])) continue;
    out.push({ mount: m[6], label: path.basename(m[6]) || '/', fs: 'apfs', size: +m[2] * 1024, free: +m[4] * 1024, kind: 'local' });
  }
  return out;
}
/** netstat -ibn: only <Link#> rows carry the per-interface counters. */
function parseNetstatIb(text) {
  const out = [];
  for (const line of String(text).split('\n').slice(1)) {
    const f = line.trim().split(/\s+/);
    if (f.length < 10 || !/^<Link#\d+>$/.test(f[2])) continue;
    const c = f.slice(-7).map(x => (x === '-' ? 0 : +x));
    out.push({ name: f[0].replace(/\*$/, ''), mtu: +f[1], mac: f.length >= 11 ? f[3].toUpperCase().replace(/:/g, '-') : '', rxPackets: c[0], rxErrs: c[1], rxBytes: c[2], txPackets: c[3], txErrs: c[4], txBytes: c[5] });
  }
  return out;
}
/** lsof -nP -iTCP -iUDP -F pcPnT */
function parseLsof(text) {
  const rows = []; let pid = 0, name = '', cur = null;
  const flush = () => {
    if (!cur || !cur.n) return;
    const [l, r] = cur.n.split('->');
    const [lh, lp] = sockets.splitHostPort(l);
    const [rh, rp] = r ? sockets.splitHostPort(r) : ['*', 0];
    rows.push({ proto: cur.P === 'UDP' ? 'UDP' : 'TCP', lh, lp, rh, rp, state: cur.T || (cur.P === 'UDP' ? (r ? 'ESTABLISHED' : 'UNCONN') : ''), pid, name });
  };
  for (const line of String(text).split('\n')) {
    if (!line) continue;
    const k = line[0], v = line.slice(1);
    if (k === 'p') { flush(); cur = null; pid = +v; name = ''; }
    else if (k === 'c') name = v;
    else if (k === 'f') { flush(); cur = {}; }
    else if (cur && k === 'P') cur.P = v;
    else if (cur && k === 'n') cur.n = v;
    else if (cur && k === 'T' && v.startsWith('ST=')) cur.T = v.slice(3);
  }
  flush();
  return rows;
}
function parseIoregGpu(text) {
  const out = [];
  const re = /"PerformanceStatistics"\s*=\s*\{([^}]*)\}/g; let m;
  while ((m = re.exec(String(text)))) {
    const body = m[1];
    const g = k => { const x = body.match(new RegExp('"' + k.replace(/[%]/g, '\\$&') + '"\\s*=\\s*(\\d+)')); return x ? +x[1] : null; };
    out.push({ util: g('Device Utilization %') ?? g('GPU Activity(%)'), renderer: g('Renderer Utilization %'), tiler: g('Tiler Utilization %'), memUsed: g('In use system memory') ?? g('vramUsedBytes'), memAlloc: g('Alloc system memory') });
  }
  return out;
}
function parsePmset(text) {
  const out = [];
  for (const line of String(text).split('\n')) {
    const m = line.match(/-(\S+).*?\t(\d+)%;\s*([^;]+);\s*(\d+:\d+|\(no estimate\))?/);
    if (m) { const st = m[3].trim(); const t = (m[4] || '').match(/(\d+):(\d+)/); out.push({ name: m[1], pct: +m[2], plugged: !/discharging/.test(st), charging: /^charging/.test(st), minutes: t && /discharging/.test(st) ? +t[1] * 60 + +t[2] : null }); }
  }
  return out;
}
function parseArpMac(text) {
  const out = [];
  for (const line of String(text).split('\n')) {
    const m = line.match(/\(([\d.]+)\) at ([0-9a-f:]+) on (\S+)/i);
    if (m) out.push({ ip: m[1], mac: m[2].split(':').map(x => x.padStart(2, '0')).join('-').toUpperCase(), state: /permanent/.test(line) ? 'Permanent' : 'Reachable', iface: m[3] });
  }
  return out;
}
function parseNetstatRoutes(text) {
  const out = []; let started = false;
  for (const line of String(text).split('\n')) {
    if (/^Destination\s+Gateway/.test(line)) { started = true; continue; }
    if (!started) continue;
    const f = line.trim().split(/\s+/);
    if (f.length < 4) continue;
    out.push({ dest: f[0] === 'default' ? '0.0.0.0/0' : f[0], gw: f[1], iface: f[3], metric: 0, family: f[0].includes(':') ? 'IPv6' : 'IPv4' });
  }
  return out;
}
function parseScutilDns(text) { return [...new Set((String(text).match(/nameserver\[\d+\]\s*:\s*(\S+)/g) || []).map(s => s.split(':').slice(1).join(':').trim()))]; }
function parseLaunchctl(text) {
  const out = [];
  for (const line of String(text).split('\n').slice(1)) {
    const f = line.trim().split(/\t|\s{1,}/);
    if (f.length < 3) continue;
    out.push({ name: f[2], display: f[2], state: f[0] !== '-' ? 'Running' : 'Stopped', start: '', pid: f[0] === '-' ? 0 : +f[0], user: '', path: '', desc: f[1] !== '0' && f[1] !== '-' ? 'last exit ' + f[1] : '' });
  }
  return out;
}

// ---------------------------------------------------------------------------
function create(ctx) {
  const cfg = ctx.cfg;
  const NCPU = os.cpus().length || 1;
  const st = { data: null, prevCpu: null, prevProc: new Map(), prevNet: new Map(), prevDisk: new Map(), prevTcp: null, args: new Map(), at: 0, tick: 0, fsList: [], gpus: [], battery: [], sensors: [], inv: null, gpuNames: [], wifiDevs: new Set(), tcp: null, errs: {} };
  let sock = sockets.empty(), sockMs = 0, timer = null, sockTimer = null, stopped = false;

  function osCpu() {
    const cur = os.cpus().map(c => { const t = c.times; return { total: t.user + t.nice + t.sys + t.idle + t.irq, idle: t.idle }; });
    const p = st.prevCpu; st.prevCpu = cur;
    let ti = 0, tt = 0;
    const per = cur.map((c, i) => { const q = p && p[i]; if (!q) return 0; const dt = c.total - q.total, di = c.idle - q.idle; ti += di; tt += dt; return dt > 0 ? U.r1(U.clamp(100 * (1 - di / dt), 0, 100)) : 0; });
    return { util: tt > 0 ? U.r1(U.clamp(100 * (1 - ti / tt), 0, 100)) : 0, per };
  }

  async function slowBits() {
    const [df, pm, io] = await Promise.all([U.run('df', ['-kP'], { timeout: 5000 }), U.run('pmset', ['-g', 'batt'], { timeout: 5000 }), U.run('ioreg', ['-r', '-n', 'AppleSmartBattery'], { timeout: 5000 })]);
    if (df.ok) st.fsList = parseDf(df.stdout);
    if (pm.ok) st.battery = parsePmset(pm.stdout);
    const t = io.ok ? io.stdout.match(/"Temperature"\s*=\s*(\d+)/) : null;
    st.sensors = t ? [{ id: 'battery/temp', hw: 'Battery', hwType: 'Battery', type: 'Temperature', name: 'Battery', value: U.r1(+t[1] / 100), min: null, max: null, unit: '°C' }] : [];
  }

  async function collect() {
    const now = Date.now();
    const dt = st.at ? (now - st.at) / 1000 : cfg.interval / 1000;
    st.tick++;
    try {
      const [vm, ps, ni, ios, ior, args, tcpS] = await Promise.all([
        U.run('vm_stat', [], { timeout: 5000 }),
        U.run('ps', ['-axww', '-o', 'pid=,ppid=,user=,state=,nice=,rss=,time=,etime=,comm='], { timeout: 8000 }),
        U.run('netstat', ['-ibn'], { timeout: 5000 }),
        U.run('iostat', ['-Id'], { timeout: 5000 }),
        U.run('ioreg', ['-r', '-d', '1', '-w', '0', '-c', 'IOAccelerator'], { timeout: 5000 }),
        st.tick % 3 === 1 ? U.run('ps', ['-axww', '-o', 'pid=,args='], { timeout: 8000 }) : Promise.resolve(null),
        st.tick % 2 === 1 ? U.run('netstat', ['-s', '-p', 'tcp'], { timeout: 5000 }) : Promise.resolve(null),
      ]);
      if (args && args.ok) st.args = parsePsArgs(args.stdout);
      if (st.tick % 10 === 1) await slowBits();

      const c = osCpu();
      const cpu = { util: c.util, cores: c.per.map(u => ({ u, mhz: 0 })), mhz: (os.cpus()[0] || {}).speed || 0, load: os.loadavg().map(U.r2) };

      const total = os.totalmem();
      const { v } = parseVmStat(vm.stdout || '');
      const swap = parseSwap((await U.run('sysctl', ['-n', 'vm.swapusage'], { timeout: 3000 })).stdout);
      const wired = v['Pages wired down'] || 0, comp = v['Pages occupied by compressor'] || 0;
      const anon = v['Anonymous pages'] != null ? v['Anonymous pages'] - (v['Pages purgeable'] || 0) : (v['Pages active'] || 0);
      const cached = (v['File-backed pages'] || 0) + (v['Pages purgeable'] || 0);
      const used = Math.min(total, anon + wired + comp);
      const mem = { total, used, avail: Math.max(0, total - used), free: (v['Pages free'] || 0) + (v['Pages speculative'] || 0), cached, wired, compressed: comp, swapTotal: swap.total, swapUsed: swap.used };
      mem.breakdown = [['App', anon], ['Wired', wired], ['Compressed', comp], ['Cached', cached], ['Free', mem.free]];

      const procs = [];
      const alive = new Set();
      for (const p of parsePsMain(ps.stdout || '')) {
        alive.add(p.pid);
        const prev = st.prevProc.get(p.pid);
        const cpuPct = prev && prev.age <= p.age && dt > 0 ? U.clamp(100 * (p.cpuSec - prev.cpuSec) / dt / NCPU, 0, 100) : 0;
        st.prevProc.set(p.pid, { cpuSec: p.cpuSec, age: p.age });
        const cmd = st.args.get(p.pid) || p.comm;
        procs.push({ pid: p.pid, ppid: p.ppid, name: path.basename(p.comm), user: p.user, cpu: U.r1(cpuPct), mem: p.rss, ws: p.rss, priv: null, io: 0, ior: 0, iow: 0, thr: null, hnd: null, age: Math.round(p.age), prio: p.nice >= 15 ? 'idle' : p.nice > 0 ? 'below' : p.nice <= -10 ? 'high' : p.nice < 0 ? 'above' : 'normal', nice: p.nice, exe: p.comm.startsWith('/') ? p.comm : '', cmd, start: 0, state: /T/.test(p.state) ? 'suspended' : /Z/.test(p.state) ? 'zombie' : '' });
      }
      for (const pid of st.prevProc.keys()) if (!alive.has(pid)) st.prevProc.delete(pid);
      cpu.procs = procs.length;

      const osIfs = os.networkInterfaces();
      const ifaces = parseNetstatIb(ni.stdout || '').filter(n => n.name !== 'lo0').map(n => {
        const p = st.prevNet.get(n.name); st.prevNet.set(n.name, n);
        const rate = (a, b) => (p && a >= b ? (a - b) / dt : 0);
        const addrs = (osIfs[n.name] || []).filter(a => !a.internal).map(a => a.address);
        return { name: n.name, desc: n.name, mac: n.mac, mtu: n.mtu, status: addrs.length ? 'Up' : 'Down', up: addrs.length > 0, virtual: /^(utun|awdl|llw|bridge|gif|stf|anpi|ap\d|vmenet|vnic)/.test(n.name), wireless: st.wifiDevs.has(n.name), ipv4: addrs.filter(a => !a.includes(':')), ipv6: addrs.filter(a => a.includes(':')).slice(0, 3), rx: Math.round(rate(n.rxBytes, p && p.rxBytes)), tx: Math.round(rate(n.txBytes, p && p.txBytes)), rxp: U.r1(rate(n.rxPackets, p && p.rxPackets)), txp: U.r1(rate(n.txPackets, p && p.txPackets)), speed: 0, rxTot: n.rxBytes, txTot: n.txBytes, rxpTot: n.rxPackets, txpTot: n.txPackets, errors: n.rxErrs + n.txErrs, drops: 0 };
      }).filter(i => i.up || i.rxTot > 0);

      if (tcpS && tcpS.ok) {
        const sent = +((tcpS.stdout.match(/(\d+) packets sent/) || [])[1] || 0);
        const retr = +((tcpS.stdout.match(/(\d+) data packets? \([\d]+ bytes\) retransmitted/) || [])[1] || 0);
        const p = st.prevTcp; st.prevTcp = { sent, retr, t: now };
        if (p) { const d = (now - p.t) / 1000; const segs = Math.max(0, (sent - p.sent) / d), rt = Math.max(0, (retr - p.retr) / d); st.tcp = { est: 0, segs: Math.round(segs), retrans: U.r1(rt), retransPct: segs + rt > 0 ? U.r2(100 * rt / (segs + rt)) : 0 }; }
      }
      const tcp = st.tcp ? Object.assign({}, st.tcp, { est: sock.conns.filter(x => x.proto === 'TCP' && x.state === 'ESTABLISHED').length }) : null;

      const disks = parseIostat(ios.stdout || '').map(d => {
        const p = st.prevDisk.get(d.name); st.prevDisk.set(d.name, d);
        return { id: d.name, name: d.name, letters: '/dev/' + d.name, media: 'SSD', size: null, temp: null, read: null, write: null, total: p ? Math.round(Math.max(0, d.mb - p.mb) * 1048576 / dt) : 0, rIops: null, wIops: null, iops: p ? Math.round(Math.max(0, d.xfrs - p.xfrs) / dt) : 0, active: null, latMs: null };
      });

      const gs = parseIoregGpu(ior.stdout || '');
      const gpus = gs.map((g, i) => ({ id: 'gpu' + i, name: st.gpuNames[i] || 'GPU ' + i, util: g.util, engines: g.renderer != null ? { renderer: g.renderer, tiler: g.tiler } : {}, vramUsed: g.memUsed || 0, vramTotal: 0, source: 'IOAccelerator' }));

      st.data = { t: now, cpu, mem, gpus, gpuProc: new Map(), disks, fs: st.fsList, net: { ifaces, tcp }, procs, sensors: st.sensors, sensorSource: st.sensors.length ? 'IOKit' : null, battery: st.battery };
      st.at = now; st.errs.collect = '';
    } catch (e) { st.errs.collect = e.message; }
    if (ctx.onTick) ctx.onTick();
    if (!stopped) timer = setTimeout(collect, Math.max(100, cfg.interval - (Date.now() - now)));
  }

  async function pollSockets() {
    const t0 = Date.now();
    const r = await U.run('lsof', ['-nP', '-iTCP', '-iUDP', '-F', 'pcPnT'], { timeout: 15000 });
    if (r.ok || r.stdout) { sock = sockets.build(parseLsof(r.stdout)); sockMs = Date.now() - t0; } else { sock.ok = false; sock.err = r.stderr; }
    if (!stopped) sockTimer = setTimeout(pollSockets, 5000);
  }

  async function init() {
    const q = async k => (await U.run('sysctl', ['-n', k], { timeout: 3000 })).stdout.trim();
    const [brand, model, phys, logical, prodName, prodVer, build] = await Promise.all([q('machdep.cpu.brand_string'), q('hw.model'), q('hw.physicalcpu'), q('hw.logicalcpu'), U.run('sw_vers', ['-productName']), U.run('sw_vers', ['-productVersion']), U.run('sw_vers', ['-buildVersion'])]);
    let video = [];
    const sp = await U.run('system_profiler', ['SPDisplaysDataType', '-json'], { timeout: 20000 });
    try { video = (JSON.parse(sp.stdout).SPDisplaysDataType || []).map(d => ({ name: d.sppci_model || d._name, cores: d.sppci_cores || null, vendor: d.spdisplays_vendor || '', vram: d.spdisplays_vram || d.spdisplays_vram_shared || '' })); } catch { /* old macOS */ }
    st.gpuNames = video.map(v => v.name);
    const hp = await U.run('networksetup', ['-listallhardwareports'], { timeout: 8000 });
    for (const m of hp.stdout.matchAll(/Hardware Port:\s*(Wi-?Fi|AirPort)[^\n]*\nDevice:\s*(\S+)/gi)) st.wifiDevs.add(m[2]);
    st.inv = {
      platform: 'darwin',
      os: { caption: (prodName.stdout.trim() || 'macOS') + ' ' + prodVer.stdout.trim(), version: prodVer.stdout.trim(), build: build.stdout.trim(), kernel: os.release(), arch: os.arch(), bootMs: Date.now() - os.uptime() * 1000 },
      cpu: { name: brand || (os.cpus()[0] || {}).model, cores: +phys || null, threads: +logical || NCPU, maxMhz: null },
      system: { manufacturer: 'Apple', model }, board: null, bios: null, ram: [], video: video.map(v => ({ name: v.name, driver: '', hz: 0 })), gpus: video.map(v => ({ name: v.name, vram: 0 })),
      isAdmin: process.getuid ? process.getuid() === 0 : false, secureBoot: null,
    };
  }

  return {
    id: 'darwin', label: 'macOS',
    caps: { temps: 'none', fps: false, gpuProc: false, services: true, startup: true, suspend: true, priority: true, affinity: false, signatures: false, dnsCache: false, wifi: false, firewall: true, wsl: false, procInfo: true },
    async start() { init().catch(() => {}); collect(); pollSockets(); },
    stop() { stopped = true; clearTimeout(timer); clearTimeout(sockTimer); },
    sample: () => st.data,
    inventory: () => st.inv || { platform: 'darwin', os: { caption: 'macOS', kernel: os.release() }, cpu: { name: (os.cpus()[0] || {}).model, threads: NCPU }, ram: [], video: [], gpus: [] },
    sockets: () => sock,
    selfPids: () => [],
    isAdmin: () => (process.getuid ? process.getuid() === 0 : false),
    status: () => [
      { name: 'ps / vm_stat / netstat / iostat', ok: !!st.data && !st.errs.collect, detail: st.data ? st.data.procs.length + ' processes' : '', err: st.errs.collect || '' },
      { name: 'Sockets (lsof)', ok: sock.ok, detail: sockMs ? sockMs + ' ms' : '', err: sock.err || 'Without sudo, only your own processes’ sockets are visible.' },
    ],
    async netInfo() {
      const [arp, rt, dns, fw] = await Promise.all([U.run('arp', ['-an'], { timeout: 8000 }), U.run('netstat', ['-rn', '-f', 'inet'], { timeout: 8000 }), U.run('scutil', ['--dns'], { timeout: 8000 }), U.run('/usr/libexec/ApplicationFirewall/socketfilterfw', ['--getglobalstate'], { timeout: 5000 })]);
      return { arp: parseArpMac(arp.stdout), routes: parseNetstatRoutes(rt.stdout), dns: [{ iface: 'scutil', family: 'any', servers: parseScutilDns(dns.stdout) }], profiles: [], firewall: fw.ok ? [{ name: 'Application Firewall', enabled: /enabled/i.test(fw.stdout), inbound: '', outbound: '' }] : [], defender: null, wifi: [] };
    },
    async services() { const r = await U.run('launchctl', ['list'], { timeout: 10000 }); if (!r.ok) throw new Error(r.stderr || 'launchctl failed'); return parseLaunchctl(r.stdout); },
    async serviceAction(name, action) {
      if (!/^[\w.@-]+$/.test(name)) throw new Error('bad name');
      const uid = process.getuid ? process.getuid() : 501;
      const args = action === 'restart' ? ['kickstart', '-k', 'gui/' + uid + '/' + name] : action === 'stop' ? ['stop', name] : action === 'start' ? ['start', name] : null;
      if (!args) throw new Error('bad action');
      const r = await U.run('launchctl', args, { timeout: 15000 });
      if (!r.ok) throw new Error(r.stderr.trim() || 'launchctl failed');
      return 'ok';
    },
    async startup() {
      const out = [];
      for (const dir of [path.join(os.homedir(), 'Library/LaunchAgents'), '/Library/LaunchAgents', '/Library/LaunchDaemons']) {
        let files = []; try { files = fs.readdirSync(dir); } catch { /* none */ }
        for (const f of files) if (f.endsWith('.plist')) out.push({ name: f.replace(/\.plist$/, ''), cmd: '', location: dir, user: dir.startsWith('/Library/LaunchDaemons') ? 'root' : dir.startsWith('/Library') ? 'all users' : os.userInfo().username, kind: dir.includes('Daemons') ? 'launch daemon' : 'launch agent' });
      }
      return out;
    },
    async procInfo(pid) { const r = await U.run('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn'], { timeout: 5000 }); const cwd = (r.stdout.match(/^n(.+)$/m) || [])[1] || null; return { pid, cwd }; },
    async cwd(pid) { const r = await U.run('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn'], { timeout: 5000 }); return (r.stdout.match(/^n(.+)$/m) || [])[1] || null; },
    async kill(pid, o = {}) { process.kill(pid, o.force ? 'SIGKILL' : 'SIGTERM'); return 'sent ' + (o.force ? 'SIGKILL' : 'SIGTERM'); },
    async suspend(pid) { process.kill(pid, 'SIGSTOP'); return 'stopped (SIGSTOP)'; },
    async resume(pid) { process.kill(pid, 'SIGCONT'); return 'continued (SIGCONT)'; },
    async priority(pid, level) { const nice = { idle: 19, below: 10, normal: 0, above: -5, high: -10 }[level]; if (nice == null) throw new Error('bad level'); os.setPriority(pid, nice); return 'nice ' + nice; },
    async reveal(file) { const r = await U.run('open', ['-R', file], { timeout: 5000 }); if (!r.ok) throw new Error('open -R failed'); return 'opened'; },
  };
}

module.exports = { create, parseVmStat, parseSwap, parsePsMain, parsePsArgs, parseIostat, parseDf, parseNetstatIb, parseLsof, parseIoregGpu, parsePmset, parseArpMac, parseNetstatRoutes, parseScutilDns, parseLaunchctl };
