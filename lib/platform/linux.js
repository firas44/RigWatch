'use strict';
// Linux platform: /proc and /sys only (plus `ss`, `systemctl`, `taskset` when present).
const fs = require('fs');
const fsp = fs.promises;
const os = require('os');
const path = require('path');
const U = require('../util');
const sockets = require('../sockets');

// ---------------------------------------------------------------------------
// pure parsers (exported for tests)
// ---------------------------------------------------------------------------
function parseProcStat(text) {
  const cpus = []; let total = null; const r = {};
  for (const line of String(text).split('\n')) {
    const f = line.trim().split(/\s+/);
    if (/^cpu\d*$/.test(f[0])) {
      const v = f.slice(1).map(Number);
      const [user = 0, nice = 0, sys = 0, idle = 0, iowait = 0, irq = 0, softirq = 0, steal = 0] = v;
      const o = { idle: idle + iowait, busy: user + nice + sys + irq + softirq + steal, iowait, irq: irq + softirq };
      o.total = o.idle + o.busy;
      if (f[0] === 'cpu') total = o; else cpus[+f[0].slice(3)] = o;
    } else if (f[0] === 'ctxt') r.ctxt = +f[1];
    else if (f[0] === 'intr') r.intr = +f[1];
    else if (f[0] === 'procs_running') r.running = +f[1];
    else if (f[0] === 'procs_blocked') r.blocked = +f[1];
    else if (f[0] === 'processes') r.forks = +f[1];
  }
  return Object.assign(r, { total, cpus: cpus.filter(Boolean) });
}

function parseMeminfo(text) {
  const m = {};
  for (const line of String(text).split('\n')) {
    const x = line.match(/^([\w()]+):\s+(\d+)(\s+kB)?/);
    if (x) m[x[1]] = +x[2] * (x[3] ? 1024 : 1);
  }
  return m;
}

function parsePidStat(text) {
  const a = text.indexOf('('), b = text.lastIndexOf(')');
  if (a < 0 || b < 0) return null;
  const f = text.slice(b + 2).trim().split(/\s+/);
  return { pid: +text.slice(0, a).trim(), comm: text.slice(a + 1, b), state: f[0], ppid: +f[1], majflt: +f[9], utime: +f[11], stime: +f[12], priority: +f[15], nice: +f[16], threads: +f[17], starttime: +f[19], vsize: +f[20], rss: +f[21] };
}

function parseNetDev(text) {
  const out = [];
  for (const line of String(text).split('\n').slice(2)) {
    const i = line.indexOf(':'); if (i < 0) continue;
    const f = line.slice(i + 1).trim().split(/\s+/).map(Number);
    out.push({ name: line.slice(0, i).trim(), rxBytes: f[0], rxPackets: f[1], rxErrs: f[2], rxDrop: f[3], txBytes: f[8], txPackets: f[9], txErrs: f[10], txDrop: f[11] });
  }
  return out;
}

function parseSnmp(text) {
  const lines = String(text).split('\n'); const out = {};
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].startsWith('Tcp:') && lines[i + 1].startsWith('Tcp:')) {
      const k = lines[i].trim().split(/\s+/).slice(1), v = lines[i + 1].trim().split(/\s+/).slice(1).map(Number);
      k.forEach((kk, j) => { out[kk] = v[j]; });
      break;
    }
  }
  return out;
}

function parseDiskstats(text) {
  const out = [];
  for (const line of String(text).split('\n')) {
    const f = line.trim().split(/\s+/);
    if (f.length < 14) continue;
    out.push({ name: f[2], reads: +f[3], readSectors: +f[5], readMs: +f[6], writes: +f[7], writeSectors: +f[9], writeMs: +f[10], inFlight: +f[11], ioMs: +f[12] });
  }
  return out;
}

function compress6(s) {
  const g = s.split(':'); let best = -1, bl = 0;
  for (let i = 0; i < g.length;) {
    if (g[i] === '0') { let j = i; while (j < g.length && g[j] === '0') j++; if (j - i > bl) { best = i; bl = j - i; } i = j; } else i++;
  }
  if (bl < 2) return g.join(':');
  return g.slice(0, best).join(':') + '::' + g.slice(best + bl).join(':');
}
/** /proc/net hex address -> printable IP (little-endian 32-bit words). */
function hexIp(h) {
  if (h.length === 8) return [3, 2, 1, 0].map(i => parseInt(h.substr(i * 2, 2), 16)).join('.');
  let full = '';
  for (let w = 0; w < 4; w++) { const g = h.substr(w * 8, 8); full += g.substr(6, 2) + g.substr(4, 2) + g.substr(2, 2) + g.substr(0, 2); }
  full = full.toLowerCase();
  if (full.startsWith('00000000000000000000ffff')) { const v4 = full.substr(24); return '::ffff:' + [0, 2, 4, 6].map(i => parseInt(v4.substr(i, 2), 16)).join('.'); }
  const groups = [];
  for (let i = 0; i < 32; i += 4) groups.push(full.substr(i, 4).replace(/^0+(?=.)/, ''));
  return compress6(groups.join(':'));
}
const TCP_ST = { '01': 'ESTABLISHED', '02': 'SYN_SENT', '03': 'SYN_RECV', '04': 'FIN_WAIT1', '05': 'FIN_WAIT2', '06': 'TIME_WAIT', '07': 'CLOSED', '08': 'CLOSE_WAIT', '09': 'LAST_ACK', '0A': 'LISTEN', '0B': 'CLOSING' };
function parseProcNet(text, proto) {
  const rows = [];
  for (const line of String(text).split('\n').slice(1)) {
    const f = line.trim().split(/\s+/);
    if (f.length < 10) continue;
    const [la, lpx] = f[1].split(':'), [ra, rpx] = f[2].split(':');
    const st = f[3].toUpperCase();
    const state = proto === 'UDP' ? (st === '07' ? 'UNCONN' : 'ESTABLISHED') : (TCP_ST[st] || st);
    rows.push({ proto, lh: hexIp(la), lp: parseInt(lpx, 16), rh: hexIp(ra), rp: parseInt(rpx, 16), state, uid: +f[7], inode: +f[9], pid: 0 });
  }
  return rows;
}

/** `ss -tunap` output -> socket rows with pid/name when visible. */
function parseSs(text) {
  const rows = [];
  for (const line of String(text).split('\n')) {
    const f = line.trim().split(/\s+/);
    if (f.length < 6) continue;
    const proto = f[0] === 'tcp' ? 'TCP' : f[0] === 'udp' ? 'UDP' : null;
    if (!proto) continue;
    const [lh, lp] = sockets.splitHostPort(f[4]);
    const [rh, rp] = sockets.splitHostPort(f[5]);
    const m = line.match(/users:\(\("([^"]*)",pid=(\d+)/);
    rows.push({ proto, lh, lp, rh, rp, state: f[1], pid: m ? +m[2] : 0, name: m ? m[1] : '' });
  }
  return rows;
}

function parseArp(text) {
  const out = [];
  for (const line of String(text).split('\n').slice(1)) {
    const f = line.trim().split(/\s+/);
    if (f.length < 6 || f[2] === '0x0') continue;
    out.push({ ip: f[0], mac: f[3].toUpperCase().replace(/:/g, '-'), state: f[2] === '0x6' ? 'Permanent' : 'Reachable', iface: f[5] });
  }
  return out;
}

function parseRoute(text) {
  const out = [];
  const ip = h => [3, 2, 1, 0].map(i => parseInt(h.substr(i * 2, 2), 16)).join('.');
  const bits = h => parseInt(h, 16).toString(2).split('').filter(c => c === '1').length;
  for (const line of String(text).split('\n').slice(1)) {
    const f = line.trim().split(/\s+/);
    if (f.length < 8) continue;
    out.push({ dest: ip(f[1]) + '/' + bits(f[7]), gw: ip(f[2]), iface: f[0], metric: +f[6], family: 'IPv4' });
  }
  return out;
}

function parseResolv(text) {
  return String(text || '').split('\n').map(l => l.trim().match(/^nameserver\s+(\S+)/)).filter(Boolean).map(m => m[1]);
}

function parseSystemctl(text) {
  const out = [];
  for (const line of String(text).split('\n')) {
    const f = line.trim().replace(/^●\s*/, '').split(/\s+/);
    if (f.length < 4 || !/\.service$/.test(f[0])) continue;
    out.push({ name: f[0], display: f.slice(4).join(' ') || f[0], load: f[1], state: f[2] === 'active' ? (f[3] === 'running' ? 'Running' : f[3]) : f[2] === 'failed' ? 'Failed' : 'Stopped', sub: f[3] });
  }
  return out;
}

const HW_TYPES = [[/k10temp|coretemp|zenpower|cpu_thermal|cpu-thermal|soc_thermal|x86_pkg|cpu/i, 'Cpu'], [/amdgpu|radeon/i, 'GpuAmd'], [/nouveau/i, 'GpuNvidia'], [/i915|^xe$/i, 'GpuIntel'], [/nvme|drivetemp|sata/i, 'Storage'], [/acpitz|pch_|nct|it87|asus|dell_smm|thinkpad|f71|w83|gigabyte|msi/i, 'Motherboard'], [/iwlwifi|ath|mt7|wifi|r8169/i, 'Network'], [/bat|battery/i, 'Battery']];
const hwType = name => (HW_TYPES.find(([rx]) => rx.test(name)) || [null, 'Other'])[1];

// ---------------------------------------------------------------------------
async function ls(dir) { try { return await fsp.readdir(dir); } catch { return []; } }
async function rd(p) { return U.readTextAsync(p); }
async function link(p) { try { return await fsp.readlink(p); } catch { return null; } }

function create(ctx) {
  const cfg = ctx.cfg;
  const NCPU = os.cpus().length || 1;
  let CLK = 100, PAGE = 4096;
  const st = { data: null, prevCpu: null, prevProc: new Map(), prevNet: new Map(), prevDisk: new Map(), prevSnmp: null, prevCtx: null, prevIntr: null, prevMaj: null, at: 0, tick: 0, ifInfo: new Map(), fsList: [], users: new Map(), sensors: [], gpus: [], battery: [], procMeta: new Map(), cwd: new Map(), errs: {} };
  let sock = sockets.empty(), sockMs = 0, sockMode = '';
  let timer = null, sockTimer = null, stopped = false;
  const ssExe = U.which(['ss'], ['/usr/sbin', '/usr/bin', '/sbin', '/bin']);

  async function init() {
    const a = await U.run('getconf', ['CLK_TCK'], { timeout: 3000 }); if (a.ok && +a.stdout > 0) CLK = +a.stdout;
    const b = await U.run('getconf', ['PAGESIZE'], { timeout: 3000 }); if (b.ok && +b.stdout > 0) PAGE = +b.stdout;
  }
  async function loadUsers() {
    const t = await rd('/etc/passwd');
    if (t) for (const line of t.split('\n')) { const f = line.split(':'); if (f.length > 3) st.users.set(+f[2], f[0]); }
  }

  async function readIfInfo() {
    for (const name of await ls('/sys/class/net')) {
      const d = '/sys/class/net/' + name;
      const [speed, mtu, mac, oper, dev, wl] = await Promise.all([rd(d + '/speed'), rd(d + '/mtu'), rd(d + '/address'), rd(d + '/operstate'), link(d + '/device'), ls(d + '/wireless')]);
      st.ifInfo.set(name, { speed: speed && +speed > 0 ? +speed * 1e6 : 0, mtu: mtu ? +mtu : null, mac: mac ? mac.trim().toUpperCase().replace(/:/g, '-') : '', up: (oper || '').trim() === 'up', virtual: !dev || /^(lo|docker|veth|br-|virbr|tun|tap|wg|zt|tailscale|vmnet|cni|flannel|kube)/.test(name), wireless: wl.length > 0 || /^wl/.test(name) });
    }
  }
  async function readFs() {
    const t = await rd('/proc/mounts'); const out = [];
    const keep = /^(ext[234]|xfs|btrfs|vfat|exfat|ntfs3?|fuseblk|zfs|f2fs|jfs|reiserfs|hfsplus|apfs|9p|nfs4?|cifs|smb3|overlay)$/;
    const seen = new Set();
    if (t) for (const line of t.split('\n')) {
      const f = line.split(' ');
      if (f.length < 3 || !keep.test(f[2]) || seen.has(f[0])) continue;
      if (/^\/(snap|var\/lib\/docker|run\/user\/\d+\/doc)/.test(f[1]) || (f[2] === 'overlay' && f[1] !== '/')) continue;
      seen.add(f[0]);
      try { const s = await fsp.statfs(f[1].replace(/\\040/g, ' ')); out.push({ mount: f[1].replace(/\\040/g, ' '), label: path.basename(f[0]), fs: f[2], size: s.blocks * s.bsize, free: s.bavail * s.bsize, kind: /nfs|cifs|smb|9p/.test(f[2]) ? 'network' : 'local' }); } catch { /* no access */ }
    }
    st.fsList = out;
  }
  async function readSensors() {
    const out = [];
    for (const d of await ls('/sys/class/hwmon')) {
      const dir = '/sys/class/hwmon/' + d;
      const name = ((await rd(dir + '/name')) || d).trim();
      const files = await ls(dir);
      for (const f of files) {
        const m = f.match(/^(temp|fan|in|power|curr|freq)(\d+)_(input|average)$/);
        if (!m) continue;
        const raw = +(await rd(dir + '/' + f));
        if (!Number.isFinite(raw)) continue;
        const label = ((await rd(dir + '/' + m[1] + m[2] + '_label')) || (m[1] + m[2])).trim();
        const conv = { temp: [1000, 'Temperature', '°C'], fan: [1, 'Fan', 'RPM'], in: [1000, 'Voltage', 'V'], power: [1e6, 'Power', 'W'], curr: [1000, 'Current', 'A'], freq: [1e6, 'Clock', 'MHz'] }[m[1]];
        out.push({ id: name + '/' + d + '/' + f, hw: name, hwType: hwType(name), type: conv[1], name: label, value: U.r2(raw / conv[0]), min: null, max: null, unit: conv[2] });
      }
    }
    if (!out.some(s => s.type === 'Temperature')) {
      for (const z of await ls('/sys/class/thermal')) {
        if (!z.startsWith('thermal_zone')) continue;
        const [type, temp] = await Promise.all([rd('/sys/class/thermal/' + z + '/type'), rd('/sys/class/thermal/' + z + '/temp')]);
        if (temp && Number.isFinite(+temp)) out.push({ id: 'thermal/' + z, hw: (type || z).trim(), hwType: /x86_pkg|cpu|soc/i.test(type || '') ? 'Cpu' : 'Acpi', type: 'Temperature', name: (type || z).trim(), value: U.r1(+temp / 1000), min: null, max: null, unit: '°C' });
      }
    }
    st.sensors = out;
  }
  async function readGpus() {
    const out = [];
    for (const c of await ls('/sys/class/drm')) {
      if (!/^card\d+$/.test(c)) continue;
      const d = '/sys/class/drm/' + c + '/device';
      const vendor = ((await rd(d + '/vendor')) || '').trim();
      if (!vendor || (vendor === '0x10de' && ctx.hasNvidia && ctx.hasNvidia())) continue;
      const [busy, used, total, product] = await Promise.all([rd(d + '/gpu_busy_percent'), rd(d + '/mem_info_vram_used'), rd(d + '/mem_info_vram_total'), rd(d + '/product_name')]);
      const vname = { '0x1002': 'AMD', '0x10de': 'NVIDIA', '0x8086': 'Intel' }[vendor] || vendor;
      out.push({ id: c, name: (product && product.trim()) || (vname + ' GPU (' + c + ')'), vendor: vname, util: busy != null ? +busy : null, engines: {}, vramUsed: used ? +used : 0, vramTotal: total ? +total : 0, source: 'sysfs' });
    }
    st.gpus = out;
  }
  async function readBattery() {
    const out = [];
    for (const b of await ls('/sys/class/power_supply')) {
      const d = '/sys/class/power_supply/' + b;
      if (((await rd(d + '/type')) || '').trim() !== 'Battery') continue;
      const [cap, status, en, pw] = await Promise.all([rd(d + '/capacity'), rd(d + '/status'), rd(d + '/energy_now'), rd(d + '/power_now')]);
      const s = (status || '').trim();
      out.push({ name: b, pct: +cap || 0, plugged: s !== 'Discharging', charging: s === 'Charging', minutes: s === 'Discharging' && +pw > 0 ? Math.round(60 * (+en) / (+pw)) : null });
    }
    st.battery = out;
  }

  async function readProcs(now, dt) {
    const out = [];
    const ents = (await ls('/proc')).filter(n => /^\d+$/.test(n));
    const uptime = os.uptime();
    const alive = new Set();
    await Promise.all(ents.map(async e => {
      const pid = +e;
      const statT = await rd('/proc/' + e + '/stat');
      if (!statT) return;
      const s = parsePidStat(statT);
      if (!s) return;
      alive.add(pid);
      let meta = st.procMeta.get(pid);
      if (!meta || meta.start !== s.starttime) {
        const [cmd, status, exe] = await Promise.all([rd('/proc/' + e + '/cmdline'), rd('/proc/' + e + '/status'), link('/proc/' + e + '/exe')]);
        const uid = status ? +((status.match(/^Uid:\s+(\d+)/m) || [])[1]) : -1;
        meta = { start: s.starttime, cmd: cmd ? cmd.replace(/\0+$/, '').replace(/\0/g, ' ') : '', exe: exe || '', user: st.users.get(uid) || (uid >= 0 ? String(uid) : ''), uid };
        st.procMeta.set(pid, meta);
      }
      const ticks = s.utime + s.stime;
      const io = await rd('/proc/' + e + '/io');
      let rb = null, wb = null;
      if (io) { rb = +((io.match(/^rchar:\s+(\d+)/m) || [])[1] || 0); wb = +((io.match(/^wchar:\s+(\d+)/m) || [])[1] || 0); }
      const p = st.prevProc.get(pid);
      const same = p && p.start === s.starttime;
      const cpu = same && dt > 0 ? U.clamp(100 * ((ticks - p.ticks) / CLK) / dt / NCPU, 0, 100) : 0;
      const ior = same && rb != null && p.rb != null ? Math.max(0, (rb - p.rb) / dt) : 0;
      const iow = same && wb != null && p.wb != null ? Math.max(0, (wb - p.wb) / dt) : 0;
      st.prevProc.set(pid, { ticks, start: s.starttime, rb, wb });
      const name = s.comm || path.basename(meta.exe || '');
      out.push({
        pid, ppid: s.ppid, name, user: meta.user, cpu: U.r1(cpu), mem: s.rss * PAGE, ws: s.rss * PAGE, priv: null, io: Math.round(ior + iow), ior: Math.round(ior), iow: Math.round(iow),
        thr: s.threads, hnd: null, age: Math.max(0, Math.round(uptime - s.starttime / CLK)), prio: s.nice >= 15 ? 'idle' : s.nice > 0 ? 'below' : s.nice <= -10 ? 'high' : s.nice < 0 ? 'above' : 'normal', nice: s.nice,
        exe: meta.exe, cmd: meta.cmd || '[' + name + ']', start: 0, state: s.state === 'T' || s.state === 't' ? 'suspended' : s.state === 'Z' ? 'zombie' : s.state === 'D' ? 'disk wait' : '', kernel: !meta.cmd,
      });
    }));
    for (const pid of st.prevProc.keys()) if (!alive.has(pid)) { st.prevProc.delete(pid); st.procMeta.delete(pid); }
    return out;
  }

  async function collect() {
    const now = Date.now();
    const dt = st.at ? (now - st.at) / 1000 : cfg.interval / 1000;
    st.tick++;
    try {
      const [statT, memT, loadT, netT, snmpT, diskT, vmT] = await Promise.all(['/proc/stat', '/proc/meminfo', '/proc/loadavg', '/proc/net/dev', '/proc/net/snmp', '/proc/diskstats', '/proc/vmstat'].map(rd));
      if (st.tick % 10 === 1) { await Promise.all([readIfInfo(), readFs(), readBattery()]); if (st.tick % 60 === 1) await loadUsers(); }
      if (st.tick % 2 === 1) await Promise.all([readSensors(), readGpus()]);

      // CPU
      const ps = parseProcStat(statT || '');
      const freqs = await Promise.all(ps.cpus.map((_, i) => rd('/sys/devices/system/cpu/cpu' + i + '/cpufreq/scaling_cur_freq')));
      const pc = st.prevCpu;
      const util = (c, p) => (p && c.total > p.total ? U.r1(U.clamp(100 * (c.busy - p.busy) / (c.total - p.total), 0, 100)) : 0);
      const cpu = {
        util: ps.total ? util(ps.total, pc && pc.total) : 0,
        cores: ps.cpus.map((c, i) => ({ u: util(c, pc && pc.cpus[i]), mhz: freqs[i] ? Math.round(+freqs[i] / 1000) : 0 })),
        load: os.loadavg().map(U.r2), procs: 0, threads: 0,
        ctx: st.prevCtx != null && ps.ctxt >= st.prevCtx ? Math.round((ps.ctxt - st.prevCtx) / dt) : null,
        irq: st.prevIntr != null && ps.intr >= st.prevIntr ? Math.round((ps.intr - st.prevIntr) / dt) : null,
        iowait: ps.total && pc && pc.total ? U.r1(100 * (ps.total.iowait - pc.total.iowait) / Math.max(1, ps.total.total - pc.total.total)) : null,
        queue: ps.running != null ? Math.max(0, ps.running - 1) : null,
      };
      const mhzList = cpu.cores.map(c => c.mhz).filter(Boolean);
      cpu.mhz = mhzList.length ? Math.round(mhzList.reduce((a, b) => a + b, 0) / mhzList.length) : (os.cpus()[0] || {}).speed || 0;
      st.prevCpu = ps; st.prevCtx = ps.ctxt; st.prevIntr = ps.intr;

      // memory
      const mi = parseMeminfo(memT || '');
      const total = mi.MemTotal || os.totalmem(), avail = mi.MemAvailable != null ? mi.MemAvailable : os.freemem();
      const cached = (mi.Cached || 0) + (mi.SReclaimable || 0) - (mi.Shmem || 0);
      const mem = { total, avail, used: Math.max(0, total - avail), free: mi.MemFree || 0, cached, buffers: mi.Buffers || 0, swapTotal: mi.SwapTotal || 0, swapUsed: Math.max(0, (mi.SwapTotal || 0) - (mi.SwapFree || 0)), committed: mi.Committed_AS || null, commitLimit: mi.CommitLimit || null, dirty: mi.Dirty || 0, shmem: mi.Shmem || 0 };
      mem.breakdown = [['Used', Math.max(0, total - (mi.MemFree || 0) - cached - (mi.Buffers || 0))], ['Buffers', mi.Buffers || 0], ['Cache', Math.max(0, cached)], ['Free', mi.MemFree || 0]];
      const maj = vmT ? +((vmT.match(/^pgmajfault\s+(\d+)/m) || [])[1] || 0) : null;
      if (maj != null && st.prevMaj != null) mem.hardFaults = Math.round(Math.max(0, maj - st.prevMaj) / dt);
      st.prevMaj = maj;

      // processes
      const procs = await readProcs(now, dt);
      cpu.procs = procs.length; cpu.threads = procs.reduce((a, p) => a + (p.thr || 0), 0);

      // network
      const osIfs = os.networkInterfaces();
      const ifaces = parseNetDev(netT || '').filter(n => n.name !== 'lo').map(n => {
        const p = st.prevNet.get(n.name); st.prevNet.set(n.name, n);
        const rate = (a, b) => (p && a >= b ? (a - b) / dt : 0);
        const info = st.ifInfo.get(n.name) || {};
        const addrs = (osIfs[n.name] || []).filter(a => !a.internal).map(a => a.address);
        return { name: n.name, desc: n.name, mac: info.mac || '', mtu: info.mtu, status: info.up ? 'Up' : 'Down', up: !!info.up, virtual: info.virtual != null ? info.virtual : /^(docker|veth|br-|virbr|tun|tap|wg)/.test(n.name), wireless: !!info.wireless, ipv4: addrs.filter(a => !a.includes(':')), ipv6: addrs.filter(a => a.includes(':')).slice(0, 3), rx: Math.round(rate(n.rxBytes, p && p.rxBytes)), tx: Math.round(rate(n.txBytes, p && p.txBytes)), rxp: U.r1(rate(n.rxPackets, p && p.rxPackets)), txp: U.r1(rate(n.txPackets, p && p.txPackets)), speed: info.speed || 0, rxTot: n.rxBytes, txTot: n.txBytes, rxpTot: n.rxPackets, txpTot: n.txPackets, errors: n.rxErrs + n.txErrs, drops: n.rxDrop + n.txDrop };
      }).filter(i => i.up || i.rxTot > 0);
      const sn = parseSnmp(snmpT || ''); const psn = st.prevSnmp; st.prevSnmp = sn;
      let tcp = null;
      if (sn.CurrEstab != null) {
        const segs = psn ? Math.max(0, (sn.OutSegs - psn.OutSegs) / dt) : 0, retr = psn ? Math.max(0, (sn.RetransSegs - psn.RetransSegs) / dt) : 0;
        tcp = { est: sn.CurrEstab, segs: Math.round(segs), retrans: U.r1(retr), retransPct: segs + retr > 0 ? U.r2(100 * retr / (segs + retr)) : 0, failures: sn.AttemptFails, resets: sn.EstabResets };
      }

      // disks (whole devices only)
      const blocks = new Set((await ls('/sys/block')).filter(n => !/^(loop|ram|zram|fd|sr|md\d+p)/.test(n)));
      const disks = [];
      for (const d of parseDiskstats(diskT || '')) {
        if (!blocks.has(d.name)) continue;
        const p = st.prevDisk.get(d.name); st.prevDisk.set(d.name, d);
        let meta = st.ifInfo.get('disk:' + d.name);
        if (!meta) {
          const [model, rot, size] = await Promise.all([rd('/sys/block/' + d.name + '/device/model'), rd('/sys/block/' + d.name + '/queue/rotational'), rd('/sys/block/' + d.name + '/size')]);
          meta = { model: (model || '').trim(), rot: (rot || '').trim() === '1', size: (+size || 0) * 512 };
          st.ifInfo.set('disk:' + d.name, meta);
        }
        const dio = p ? (d.reads - p.reads) + (d.writes - p.writes) : 0;
        disks.push({ id: d.name, name: meta.model || d.name, letters: '/dev/' + d.name, media: /^nvme/.test(d.name) ? 'NVMe' : meta.rot ? 'HDD' : 'SSD', size: meta.size, temp: null, read: p ? Math.round(Math.max(0, d.readSectors - p.readSectors) * 512 / dt) : 0, write: p ? Math.round(Math.max(0, d.writeSectors - p.writeSectors) * 512 / dt) : 0, rIops: p ? Math.round((d.reads - p.reads) / dt) : 0, wIops: p ? Math.round((d.writes - p.writes) / dt) : 0, active: p ? U.r1(U.clamp(100 * (d.ioMs - p.ioMs) / (dt * 1000), 0, 100)) : 0, latMs: p && dio > 0 ? U.r2(((d.readMs - p.readMs) + (d.writeMs - p.writeMs)) / dio) : 0, queue: d.inFlight });
      }

      st.data = { t: now, cpu, mem, gpus: st.gpus, gpuProc: new Map(), disks, fs: st.fsList, net: { ifaces, tcp }, procs, sensors: st.sensors, sensorSource: st.sensors.length ? 'Linux hwmon' : null, battery: st.battery };
      st.at = now;
      st.errs.collect = '';
    } catch (e) { st.errs.collect = e.message; }
    if (ctx.onTick) ctx.onTick();
    if (!stopped) timer = setTimeout(collect, Math.max(100, cfg.interval - (Date.now() - now)));
  }

  async function pollSockets() {
    const t0 = Date.now();
    try {
      let rows = null;
      if (ssExe) {
        const r = await U.run(ssExe, ['-tunap'], { timeout: 8000 });
        if (r.ok) { rows = parseSs(r.stdout); sockMode = 'ss'; }
      }
      if (!rows) {
        rows = [];
        for (const [f, proto] of [['tcp', 'TCP'], ['tcp6', 'TCP'], ['udp', 'UDP'], ['udp6', 'UDP']]) rows.push(...parseProcNet((await rd('/proc/net/' + f)) || '', proto));
        // inode -> pid map (only visible for our own processes unless root)
        const inodes = new Map(); let budget = 30000;
        for (const pid of (await ls('/proc')).filter(n => /^\d+$/.test(n))) {
          const fds = await ls('/proc/' + pid + '/fd');
          for (const fd of fds) {
            if (--budget < 0) break;
            const l = await link('/proc/' + pid + '/fd/' + fd);
            const m = l && l.match(/^socket:\[(\d+)\]$/);
            if (m) inodes.set(+m[1], +pid);
          }
        }
        for (const r of rows) r.pid = inodes.get(r.inode) || 0;
        sockMode = '/proc/net';
      }
      sock = sockets.build(rows); sockMs = Date.now() - t0;
    } catch (e) { sock.ok = false; sock.err = e.message; }
    if (!stopped) sockTimer = setTimeout(pollSockets, 3000);
  }

  function inventory() {
    const cpuinfo = U.readText('/proc/cpuinfo') || '';
    const model = (cpuinfo.match(/^model name\s*:\s*(.+)$/m) || cpuinfo.match(/^Model\s*:\s*(.+)$/m) || cpuinfo.match(/^Hardware\s*:\s*(.+)$/m) || [])[1] || (os.cpus()[0] || {}).model;
    const cores = new Set(cpuinfo.split(/\n\s*\n/).map(b => ((b.match(/^physical id\s*:\s*(\d+)/m) || [])[1] || '0') + ':' + ((b.match(/^core id\s*:\s*(\d+)/m) || [])[1] || '')).filter(k => !k.endsWith(':'))).size;
    const maxKhz = +(U.readText('/sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_max_freq') || 0);
    const osr = U.readText('/etc/os-release') || '';
    const dmi = k => (U.readText('/sys/class/dmi/id/' + k) || '').trim() || null;
    return {
      platform: 'linux',
      os: { caption: ((osr.match(/^PRETTY_NAME="?([^"\n]+)"?/m) || [])[1]) || 'Linux', version: os.release(), kernel: os.release(), arch: os.arch(), bootMs: Date.now() - os.uptime() * 1000 },
      cpu: { name: String(model || '').trim(), cores: cores || null, threads: NCPU, maxMhz: maxKhz ? Math.round(maxKhz / 1000) : null, vendor: ((cpuinfo.match(/^vendor_id\s*:\s*(.+)$/m) || [])[1] || '').trim() },
      system: { manufacturer: dmi('sys_vendor'), model: dmi('product_name') },
      board: dmi('board_name') ? { manufacturer: dmi('board_vendor'), product: dmi('board_name') } : null,
      bios: dmi('bios_version') ? { version: dmi('bios_version'), vendor: dmi('bios_vendor') } : null,
      ram: [], video: [], gpus: st.gpus.map(g => ({ name: g.name, vram: g.vramTotal })), isAdmin: process.getuid ? process.getuid() === 0 : false,
      secureBoot: null,
    };
  }

  async function systemctl(args) { const r = await U.run('systemctl', args, { timeout: 30000 }); if (!r.ok) throw new Error((r.stderr || 'systemctl failed').trim()); return r.stdout; }

  return {
    id: 'linux', label: 'Linux',
    caps: { temps: 'hwmon', fps: false, gpuProc: false, services: !!U.which(['systemctl']), startup: true, suspend: true, priority: true, affinity: !!U.which(['taskset']), signatures: false, dnsCache: false, wifi: true, firewall: false, wsl: false, procInfo: true },
    async start() { await init(); await loadUsers(); collect(); pollSockets(); },
    stop() { stopped = true; clearTimeout(timer); clearTimeout(sockTimer); },
    sample: () => st.data, inventory,
    sockets: () => sock,
    selfPids: () => [],
    isAdmin: () => (process.getuid ? process.getuid() === 0 : false),
    status: () => [
      { name: 'procfs / sysfs collector', ok: !!st.data && !st.errs.collect, detail: st.data ? st.data.procs.length + ' processes' : '', err: st.errs.collect || '' },
      { name: 'Sockets (' + (sockMode || 'ss / procfs') + ')', ok: sock.ok, detail: sockMs ? sockMs + ' ms' : '', err: sock.err || (process.getuid && process.getuid() !== 0 ? 'Not root: sockets of other users show without a process.' : '') },
      { name: 'Sensors (hwmon)', ok: st.sensors.length > 0, detail: st.sensors.length + ' sensors', err: '' },
    ],
    async netInfo() {
      const [arpT, routeT, resolv, wl] = await Promise.all([rd('/proc/net/arp'), rd('/proc/net/route'), rd('/etc/resolv.conf'), rd('/proc/net/wireless')]);
      const wifi = [];
      if (wl) for (const line of wl.split('\n').slice(2)) { const f = line.trim().split(/\s+/); if (f.length > 3) wifi.push({ name: f[0].replace(':', ''), state: 'connected', signal: f[3].replace(/\.$/, '') + ' dBm', quality: f[2].replace(/\.$/, '') }); }
      if (wifi.length && U.which(['iwgetid'])) { const r = await U.run('iwgetid', ['-r'], { timeout: 3000 }); if (r.ok) wifi[0].ssid = r.stdout.trim(); }
      let firewall = [];
      if (U.which(['ufw'])) { const r = await U.run('ufw', ['status'], { timeout: 5000 }); if (r.ok) firewall = [{ name: 'ufw', enabled: /Status:\s*active/i.test(r.stdout), inbound: '', outbound: '' }]; }
      return { arp: parseArp(arpT || ''), routes: parseRoute(routeT || ''), dns: [{ iface: 'resolv.conf', family: 'any', servers: parseResolv(resolv) }], profiles: [], firewall, defender: null, wifi };
    },
    async services() {
      const [units, files] = await Promise.all([systemctl(['list-units', '--type=service', '--all', '--no-legend', '--no-pager', '--plain']), systemctl(['list-unit-files', '--type=service', '--no-legend', '--no-pager']).catch(() => '')]);
      const startMode = new Map(files.split('\n').map(l => l.trim().split(/\s+/)).filter(f => f.length >= 2).map(f => [f[0], f[1]]));
      return parseSystemctl(units).map(s => Object.assign(s, { start: startMode.get(s.name) || '', pid: 0, user: '', path: '', desc: s.display }));
    },
    async serviceAction(name, action) {
      if (!/^[\w@.:-]+$/.test(name) || !['start', 'stop', 'restart'].includes(action)) throw new Error('bad request');
      await systemctl([action, name]);
      return (await systemctl(['is-active', name]).catch(e => e.message)).trim();
    },
    async startup() {
      const out = [];
      try { for (const l of (await systemctl(['list-unit-files', '--type=service', '--state=enabled', '--no-legend', '--no-pager'])).split('\n')) { const f = l.trim().split(/\s+/); if (f[0]) out.push({ name: f[0], cmd: '', location: 'systemd', user: 'system', kind: 'systemd unit' }); } } catch { /* no systemd */ }
      for (const dir of [path.join(os.homedir(), '.config/autostart'), '/etc/xdg/autostart']) {
        for (const f of await ls(dir)) { if (!f.endsWith('.desktop')) continue; const t = (await rd(path.join(dir, f))) || ''; out.push({ name: ((t.match(/^Name=(.*)$/m) || [])[1]) || f, cmd: ((t.match(/^Exec=(.*)$/m) || [])[1]) || '', location: dir, user: dir.startsWith('/etc') ? 'all users' : os.userInfo().username, kind: 'autostart' }); }
      }
      const cr = await U.run('crontab', ['-l'], { timeout: 3000 });
      if (cr.ok) for (const l of cr.stdout.split('\n')) if (/^@reboot\s+/.test(l.trim())) out.push({ name: '@reboot', cmd: l.trim().replace(/^@reboot\s+/, ''), location: 'crontab', user: os.userInfo().username, kind: 'cron' });
      return out;
    },
    async procInfo(pid) {
      const [status, cwd, fds, cgroup] = await Promise.all([rd('/proc/' + pid + '/status'), link('/proc/' + pid + '/cwd'), ls('/proc/' + pid + '/fd'), rd('/proc/' + pid + '/cgroup')]);
      if (!status) throw new Error('process not found');
      const g = k => ((status.match(new RegExp('^' + k + ':\\s+(.+)$', 'm')) || [])[1] || '').trim();
      const cg = (cgroup || '').trim();
      return { pid, cwd: cwd || null, fds: fds.length || null, vmPeak: g('VmPeak'), vmSwap: g('VmSwap'), ctxVoluntary: g('voluntary_ctxt_switches'), ctxInvoluntary: g('nonvoluntary_ctxt_switches'), cgroup: cg, container: /docker|containerd|kubepods|libpod/.test(cg) ? (cg.match(/([0-9a-f]{12,64})/) || [])[1] || 'yes' : null, seccomp: g('Seccomp'), capEff: g('CapEff') };
    },
    async cwd(pid) { return link('/proc/' + pid + '/cwd'); },
    async kill(pid, o = {}) { process.kill(pid, o.force ? 'SIGKILL' : 'SIGTERM'); return 'sent ' + (o.force ? 'SIGKILL' : 'SIGTERM'); },
    async suspend(pid) { process.kill(pid, 'SIGSTOP'); return 'stopped (SIGSTOP)'; },
    async resume(pid) { process.kill(pid, 'SIGCONT'); return 'continued (SIGCONT)'; },
    async priority(pid, level) { const nice = { idle: 19, below: 10, normal: 0, above: -5, high: -10 }[level]; if (nice == null) throw new Error('bad level'); os.setPriority(pid, nice); return 'nice ' + nice; },
    async affinity(pid, mask) { const r = await U.run('taskset', ['-p', BigInt(mask).toString(16), String(pid)], { timeout: 5000 }); if (!r.ok) throw new Error(r.stderr.trim() || 'taskset failed'); return r.stdout.trim(); },
    async reveal(file) { const r = await U.run('xdg-open', [path.dirname(file)], { timeout: 5000 }); if (!r.ok) throw new Error('xdg-open failed'); return 'opened'; },
  };
}

module.exports = { create, parseProcStat, parseMeminfo, parsePidStat, parseNetDev, parseSnmp, parseDiskstats, hexIp, parseProcNet, parseSs, parseArp, parseRoute, parseResolv, parseSystemctl };
