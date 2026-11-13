'use strict';
// Windows platform: two long-lived PowerShell collectors (perf counters + WMI), a lazy
// control worker for on-demand queries/actions, netstat for sockets, LHM for sensors.
const os = require('os');
const { spawn } = require('child_process');
const U = require('../util');
const assets = require('../assets');
const sockets = require('../sockets');
const S = require('../sensors');

const BOOT = "$s = New-Object Text.StringBuilder; while ($true) { $l = [Console]::In.ReadLine(); if ($null -eq $l -or $l -eq '#__RIGWATCH_END__') { break }; [void]$s.AppendLine($l) }; Invoke-Expression $s.ToString()";
const PRIO = { 4: 'idle', 6: 'below', 8: 'normal', 10: 'above', 13: 'high', 24: 'realtime' };
const PRIO_CLASS = { idle: 'Idle', below: 'BelowNormal', normal: 'Normal', above: 'AboveNormal', high: 'High' };

class PsWorker {
  constructor(name, file, onLine, opts = {}) {
    Object.assign(this, { name, file, onLine, opts, proc: null, ok: false, starts: 0, startedAt: 0, lastLine: 0, err: '', stopped: false, interval: opts.interval || 1000 });
  }
  start() {
    if (this.stopped || this.proc) return;
    this.starts++; this.startedAt = Date.now();
    let p;
    try {
      p = spawn(U.psExe(), ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', BOOT], {
        windowsHide: true,
        env: Object.assign({}, process.env, { RIG_PARENT_PID: String(process.pid), RIG_INTERVAL_MS: String(this.interval) }, this.opts.env || {}),
      });
    } catch (e) { this.err = e.message; return this.retry(); }
    this.proc = p;
    p.on('error', e => { this.err = e.message; });
    p.stdin.on('error', () => {});
    p.stdin.write(assets.read(this.file) + '\n#__RIGWATCH_END__\n');
    if (!this.opts.keepStdin) p.stdin.end();
    U.onLines(p.stdout, line => {
      this.lastLine = Date.now(); this.ok = true;
      try { this.onLine(line); } catch (e) { this.err = 'parse: ' + e.message; }
    });
    p.stderr.setEncoding('utf8');
    p.stderr.on('data', d => { this.err = (this.err + d).slice(-1500); });
    p.on('exit', code => {
      this.proc = null; this.ok = false;
      if (this.opts.onExit) this.opts.onExit(code);
      if (this.stopped || this.opts.noRestart) return;
      if (Date.now() - this.startedAt > 60000) this.starts = 0;
      if (this.starts <= 3) U.log(this.name + ' collector exited (' + code + ')' + (this.starts === 3 ? ', will keep retrying quietly' : ', restarting') + (this.err ? ': ' + U.trunc(this.err.trim().split('\n').pop(), 160) : ''));
      this.retry();
    });
  }
  retry() { setTimeout(() => this.start(), Math.min(30000, 1000 * 2 ** Math.min(this.starts, 5))).unref(); }
  stop() { this.stopped = true; try { if (this.proc) this.proc.kill(); } catch { /* gone */ } }
  get pid() { return this.proc ? this.proc.pid : 0; }
}

/**
 * Sends one JSON command at a time to control.ps1. Interactive requests jump ahead of
 * background ones (signature checks), and a hung request restarts the worker.
 */
class ControlWorker extends PsWorker {
  constructor() {
    super('control', 'lib/platform/ps/control.ps1', line => this.reply(line), { keepStdin: true, noRestart: true, onExit: () => this.failAll('control worker exited') });
    this.queue = []; this.current = null; this.seq = 0;
  }
  reply(line) {
    if (!line.startsWith('R\t')) return;
    let m; try { m = JSON.parse(line.slice(2)); } catch { return; }
    const c = this.current;
    if (!c || c.id !== m.id) return;
    clearTimeout(c.timer); this.current = null;
    if (m.ok) c.resolve(m.data); else c.reject(new Error(m.error || 'failed'));
    this.pump();
  }
  failAll(msg) {
    const all = (this.current ? [this.current] : []).concat(this.queue);
    this.current = null; this.queue = [];
    for (const c of all) { clearTimeout(c.timer); c.reject(new Error(msg)); }
  }
  pump() {
    if (this.current || !this.queue.length) return;
    if (!this.proc) this.start();
    if (!this.proc) return this.failAll('could not start PowerShell');
    const c = this.current = this.queue.shift();
    c.timer = setTimeout(() => { this.failAll(c.op + ' timed out'); try { this.proc.kill(); } catch { /* gone */ } }, c.timeout);
    this.proc.stdin.write(JSON.stringify(Object.assign({ id: c.id, op: c.op }, c.args)) + '\n');
  }
  request(op, args = {}, timeout = 30000, low = false) {
    return new Promise((resolve, reject) => {
      const c = { id: ++this.seq, op, args, timeout, low, resolve, reject };
      if (low) this.queue.push(c);
      else { const i = this.queue.findIndex(x => x.low); if (i < 0) this.queue.push(c); else this.queue.splice(i, 0, c); }
      this.pump();
    });
  }
}

const newFrame = () => ({ cpu: null, cores: [], sys: null, mem: null, procs: [], engines: [], gpuProc: [], gpuMem: [], gpuProcMem: [], net: [], tcp: null, disks: [], tz: [] });
const normEng = t => { const s = String(t || '').replace(/\s*\d+$/, '').trim(); return /^video codec/.test(s) ? 'video codec' : s; };
const normDesc = s => String(s || '').toLowerCase().replace(/\(/g, '[').replace(/\)/g, ']').replace(/#/g, '_').replace(/[\\/]/g, '_').trim();
/** "\??\C:\x", "\\?\C:\x", "\SystemRoot\x" -> normal Win32 paths */
const ntPath = p => String(p || '').replace(/^\\\?\?\\/, '').replace(/^\\\\\?\\/, '').replace(/^\\SystemRoot\\/i, (process.env.SystemRoot || 'C:\\Windows') + '\\');

function create(ctx) {
  const cfg = ctx.cfg;
  const st = { fast: null, fastAt: 0, fastMs: 0, frame: newFrame(), static: null, px: new Map(), pxMs: 0, lhm: null, lhmAt: 0, drives: [], battery: [], nics: [], pdisks: [] };
  let sock = sockets.empty();
  const lhmHttp = new S.LhmHttp(cfg.lhmUrl);
  const suspended = new Set();
  let lastPrune = 0;

  function onFast(line) {
    const f = line.split('\t'), F = st.frame, n = U.num;
    switch (f[0]) {
      case 'CPU': F.cpu = { util: n(f[1]), perf: n(f[2]), time: n(f[3]), baseMhz: n(f[4]), dpc: n(f[5]), irq: n(f[6]) }; break;
      case 'CORE': F.cores.push({ g: n(f[1]), i: n(f[2]), util: n(f[3]), perf: n(f[4]) }); break;
      case 'SYS': F.sys = { procs: n(f[1]), threads: n(f[2]), ctx: n(f[3]), syscalls: n(f[4]), queue: n(f[5]) }; break;
      case 'MEM': F.mem = { avail: n(f[1]), committed: n(f[2]), commitLimit: n(f[3]), standby: n(f[4]), modified: n(f[5]), paged: n(f[6]), nonpaged: n(f[7]), hardFaults: n(f[8]), faults: n(f[9]), cache: n(f[10]), free: n(f[11]) }; break;
      case 'P': F.procs.push({ pid: n(f[1]), ppid: n(f[2]), name: f[3], cpu: n(f[4]), pws: n(f[5]), ws: n(f[6]), pb: n(f[7]), io: n(f[8]), ior: n(f[9]), iow: n(f[10]), thr: n(f[11]), hnd: n(f[12]), age: n(f[13]), prio: n(f[14]) }); break;
      case 'GE': F.engines.push({ luid: f[1], eng: n(f[3]), type: f[4], util: n(f[5]) }); break;
      case 'GP': F.gpuProc.push({ pid: n(f[1]), luid: f[2], util: n(f[3]) }); break;
      case 'GM': F.gpuMem.push({ luid: f[1], ded: n(f[3]), shared: n(f[4]) }); break;
      case 'GPM': F.gpuProcMem.push({ pid: n(f[1]), ded: n(f[3]) }); break;
      case 'NET': F.net.push({ inst: f[1], rx: n(f[2]), tx: n(f[3]), rxp: n(f[4]), txp: n(f[5]), bw: n(f[6]), rxTot: n(f[7]), txTot: n(f[8]), rxpTot: n(f[9]), txpTot: n(f[10]), errors: n(f[11]) + n(f[13]), drops: n(f[12]) + n(f[14]) }); break;
      case 'TCP': F.tcp = { est: n(f[1]) + n(f[2]), retrans: n(f[3]), segs: n(f[4]), failures: n(f[5]), resets: n(f[6]) }; break;
      case 'DISK': F.disks.push({ inst: f[1], read: n(f[2]), write: n(f[3]), rIops: n(f[4]), wIops: n(f[5]), idle: n(f[6]), lat: n(f[7]), queue: n(f[8]) }); break;
      case 'TZ': F.tz.push({ name: f[1], c: n(f[2]) }); break;
      case 'END':
        st.fast = F; st.fastAt = Date.now(); st.fastMs = n(f[2]); st.frame = newFrame();
        if (ctx.onTick) ctx.onTick();
        break;
    }
  }
  function onSlow(line) {
    const tab = line.indexOf('\t');
    const kind = tab < 0 ? line : line.slice(0, tab), rest = tab < 0 ? '' : line.slice(tab + 1);
    switch (kind) {
      case 'STATIC': st.static = JSON.parse(rest); if (ctx.onInventory) ctx.onInventory(); break;
      case 'PX': { const f = rest.split('\t'); st.px.set(U.num(f[0]), { ppid: U.num(f[1]), start: U.num(f[2]), name: f[3] || '', exe: ntPath(f[4] || ''), cmd: f[5] || '' }); break; }
      case 'PXEND': st.pxMs = U.num(rest); break;
      case 'LHM': st.lhm = JSON.parse(rest); st.lhmAt = Date.now(); break;
      case 'DRIVES': st.drives = U.arr(JSON.parse(rest)); break;
      case 'BATTERY': st.battery = U.arr(JSON.parse(rest)); break;
      case 'NICS': st.nics = U.arr(JSON.parse(rest)); break;
      case 'PDISKS': st.pdisks = U.arr(JSON.parse(rest)); break;
    }
  }

  const fast = new PsWorker('perf-counter', 'lib/platform/ps/fast.ps1', onFast, { interval: cfg.interval });
  const slow = new PsWorker('wmi', 'lib/platform/ps/slow.ps1', onSlow);
  const ctl = new ControlWorker();

  // ---- sockets via netstat -ano ----
  let netstatTimer = null, netstatMs = 0;
  // netstat is fast but prints localised state words on non-English Windows; when we see one,
  // switch to Get-NetTCPConnection (enum states are always English) via the control worker.
  const EN_STATE = /^(LISTENING|LISTEN|ESTABLISHED|TIME_WAIT|CLOSE_WAIT|SYN_SENT|SYN_RECEIVED|FIN_WAIT_1|FIN_WAIT_2|LAST_ACK|CLOSING|CLOSED|DELETE_TCB|BOUND)$/;
  let sockMode = process.env.RIGWATCH_SOCKETS === 'ps' ? 'ps' : 'netstat';
  async function pollNetstat() {
    const t0 = Date.now();
    if (sockMode === 'ps') {
      try {
        const d = await ctl.request('sockets', {}, 30000, true);
        const rows = [];
        for (const l of U.arr(d.tcp)) { const f = String(l).split('|'); rows.push({ proto: 'TCP', lh: f[0], lp: U.num(f[1]), rh: f[2], rp: U.num(f[3]), state: f[4], pid: U.num(f[5]) }); }
        for (const l of U.arr(d.udp)) { const f = String(l).split('|'); rows.push({ proto: 'UDP', lh: f[0], lp: U.num(f[1]), rh: '*', rp: 0, state: '', pid: U.num(f[2]) }); }
        sock = sockets.build(rows); netstatMs = Date.now() - t0;
      } catch (e) { sock.ok = false; sock.err = e.message; }
      netstatTimer = setTimeout(pollNetstat, 4000);
      return;
    }
    const r = await U.run(U.sys32('netstat.exe'), ['-ano'], { timeout: 15000 });
    if (!r.ok) { sock.ok = false; sock.err = r.stderr; }
    else {
      const rows = [];
      let foreign = 0;
      for (const raw of r.stdout.split(/\r?\n/)) {
        const f = raw.trim().split(/\s+/);
        if (f[0] !== 'TCP' && f[0] !== 'UDP') continue;
        const [lh, lp] = sockets.splitHostPort(f[1]);
        const [rh, rp] = sockets.splitHostPort(f[2]);
        const tcp = f[0] === 'TCP';
        let state = tcp ? f[3] : '';
        if (tcp && state && !EN_STATE.test(state)) foreign++;
        if (tcp && rp === 0 && U.isAnyAddr(rh)) state = 'LISTEN';
        rows.push({ proto: f[0], lh, lp, rh, rp, state, pid: U.num(tcp ? f[4] : f[3]) });
      }
      sock = sockets.build(rows);
      netstatMs = r.ms;
      if (foreign > 0) { sockMode = 'ps'; U.log('localised netstat detected, using Get-NetTCPConnection for socket states'); }
    }
    netstatTimer = setTimeout(pollNetstat, 3000);
  }

  // ---- embedded LibreHardwareMonitor library (started once tools/ has it) ----
  let sensorWorker = null;
  const emb = { data: null, at: 0, info: null, err: '' };
  function startSensors(dir) {
    if (sensorWorker || !dir) return;
    sensorWorker = new PsWorker('sensors', 'lib/platform/ps/sensors.ps1', line => {
      const tab = line.indexOf('\t'), kind = line.slice(0, tab), rest = line.slice(tab + 1);
      if (kind === 'LHM') { emb.data = JSON.parse(rest); emb.at = Date.now(); }
      else if (kind === 'INFO') emb.info = JSON.parse(rest);
      else if (kind === 'ERR') emb.err = JSON.parse(rest).error;
    }, { env: { RIG_LHM_DIR: dir } });
    sensorWorker.start();
  }

  function sensors() {
    const now = Date.now();
    let list = [];
    if (emb.data && now - emb.at < 10000 && U.arr(emb.data.sensors).length) list = S.fromLhmWmi(emb.data);
    else if (st.lhm && now - st.lhmAt < 10000 && U.arr(st.lhm.sensors).length) list = S.fromLhmWmi(st.lhm);
    else { const h = lhmHttp.fresh(); if (h) list = h; }
    const F = st.fast;
    if (F) for (const z of F.tz) if (z.c > -50 && z.c < 150) list.push({ id: 'acpi/' + z.name, hw: 'ACPI thermal zone', hwType: 'Acpi', type: 'Temperature', name: z.name, value: U.r1(z.c), min: null, max: null, unit: '\u00b0C' });
    return list;
  }
  function sensorSource() {
    if (emb.data && Date.now() - emb.at < 10000 && U.arr(emb.data.sensors).length) return 'LibreHardwareMonitor (built in)';
    if (st.lhm && Date.now() - st.lhmAt < 10000 && U.arr(st.lhm.sensors).length) return /open/i.test(st.lhm.ns || '') ? 'OpenHardwareMonitor (WMI)' : 'LibreHardwareMonitor (WMI)';
    if (lhmHttp.fresh()) return 'LibreHardwareMonitor (web)';
    return null;
  }

  function sample() {
    const now = Date.now();
    const F = st.fast && now - st.fastAt < cfg.interval * 5 ? st.fast : null;
    if (!F) return null;
    const S0 = st.static || {};
    const c0 = os.cpus()[0] || {};
    const baseMhz = (S0.cpu && S0.cpu.maxMhz) || (F.cpu && F.cpu.baseMhz) || c0.speed || 0;
    const cpu = F.cpu ? {
      util: U.r1(U.clamp(F.cpu.util, 0, 100)), mhz: Math.round(baseMhz * F.cpu.perf / 100), baseMhz,
      cores: F.cores.slice().sort((a, b) => a.g - b.g || a.i - b.i).map(c => ({ u: U.r1(U.clamp(c.util, 0, 100)), mhz: Math.round(baseMhz * c.perf / 100) })),
      dpc: U.r1(F.cpu.dpc), irq: Math.round(F.cpu.irq),
    } : null;
    if (cpu && F.sys) Object.assign(cpu, { procs: F.sys.procs, threads: F.sys.threads, ctx: Math.round(F.sys.ctx), syscalls: Math.round(F.sys.syscalls), queue: F.sys.queue });

    const total = os.totalmem();
    let mem = null;
    if (F.mem) {
      const m = F.mem, avail = m.avail;
      mem = { total, avail, used: Math.max(0, total - avail), free: m.free, standby: m.standby, modified: m.modified, cached: m.standby + m.modified, committed: m.committed, commitLimit: m.commitLimit, paged: m.paged, nonpaged: m.nonpaged, hardFaults: Math.round(m.hardFaults), faults: Math.round(m.faults) };
      mem.breakdown = [['In use', Math.max(0, total - avail - m.modified)], ['Modified', m.modified], ['Standby', m.standby], ['Free', Math.max(0, avail - m.standby)]];
    }

    // GPUs (DXGI adapters matched to perf-counter LUIDs)
    let adapters = U.arr(S0.dxgi).filter(a => !a.software && a.luid);
    if (!adapters.length) adapters = [...new Set(F.gpuMem.map(g => g.luid))].map((l, i) => ({ luid: l, name: 'GPU ' + i, vram: 0 }));
    const gpus = adapters.map(a => {
      const luid = String(a.luid).toLowerCase();
      const engines = {}; let util = 0;
      for (const e of F.engines) if (e.luid === luid) { const t = normEng(e.type); engines[t] = Math.max(engines[t] || 0, e.util); util = Math.max(util, e.util); }
      for (const k in engines) engines[k] = U.r1(U.clamp(engines[k], 0, 100));
      const gm = F.gpuMem.filter(m => m.luid === luid);
      return { id: luid, name: a.name, vendorId: a.vendorId, util: U.r1(U.clamp(util, 0, 100)), engines, vramUsed: gm.reduce((s, m) => s + m.ded, 0), vramTotal: a.vram || 0, sharedUsed: gm.reduce((s, m) => s + m.shared, 0), sharedTotal: a.shared || 0, source: 'perf counters' };
    });
    const gpuProc = new Map();
    for (const g of F.gpuProc) { const e = gpuProc.get(g.pid) || { util: 0, vram: 0 }; e.util = Math.max(e.util, g.util); gpuProc.set(g.pid, e); }
    for (const g of F.gpuProcMem) { const e = gpuProc.get(g.pid) || { util: 0, vram: 0 }; e.vram += g.ded; gpuProc.set(g.pid, e); }

    // processes
    const procs = F.procs.map(p => {
      const x = st.px.get(p.pid);
      return {
        pid: p.pid, ppid: p.ppid, name: x && x.name ? x.name.replace(/\.exe$/i, '') : p.name, cpu: U.r1(p.cpu), mem: p.pws, ws: p.ws, priv: p.pb,
        io: Math.round(p.io), ior: Math.round(p.ior), iow: Math.round(p.iow), thr: p.thr, hnd: p.hnd, age: p.age, prio: PRIO[p.prio] || String(p.prio || ''),
        exe: x ? x.exe : '', cmd: x ? x.cmd : '', start: x ? x.start : 0, state: suspended.has(p.pid) ? 'suspended' : '',
      };
    });
    if (now - lastPrune > 30000) { lastPrune = now; const alive = new Set(F.procs.map(p => p.pid)); for (const pid of st.px.keys()) if (!alive.has(pid)) st.px.delete(pid); for (const pid of suspended) if (!alive.has(pid)) suspended.delete(pid); }

    // network
    const nicByDesc = new Map(st.nics.map(nn => [normDesc(nn.desc), nn]));
    const osIfs = os.networkInterfaces();
    const ifaces = F.net.map(nn => {
      const nic = nicByDesc.get(nn.inst) || null;
      const addrs = nic && osIfs[nic.name] ? osIfs[nic.name].filter(a => !a.internal).map(a => a.address) : [];
      const desc = nic ? nic.desc : nn.inst;
      return {
        name: nic ? nic.name : nn.inst, desc, mac: nic ? nic.mac : '', mtu: nic ? nic.mtu : null, status: nic ? nic.status : '', up: nic ? /^up$/i.test(nic.status) : nn.rx + nn.tx > 0,
        virtual: nic ? !!nic.virtual : /virtual|hyper-v|vethernet|wsl|loopback|vpn|tap|wan miniport/i.test(nn.inst),
        wireless: /802\.11|wi-?fi|wireless|wlan/i.test((nic && nic.media) + ' ' + desc),
        ipv4: addrs.filter(a => !a.includes(':')), ipv6: addrs.filter(a => a.includes(':')).slice(0, 3),
        rx: nn.rx, tx: nn.tx, rxp: U.r1(nn.rxp), txp: U.r1(nn.txp), speed: nn.bw, rxTot: nn.rxTot, txTot: nn.txTot, rxpTot: nn.rxpTot, txpTot: nn.txpTot, errors: nn.errors, drops: nn.drops,
      };
    }).filter(i => i.rxTot > 0 || i.txTot > 0 || i.up);
    const tcp = F.tcp ? { est: F.tcp.est, retrans: U.r1(F.tcp.retrans), segs: Math.round(F.tcp.segs), retransPct: F.tcp.segs + F.tcp.retrans > 0 ? U.r2(100 * F.tcp.retrans / (F.tcp.segs + F.tcp.retrans)) : 0, failures: F.tcp.failures, resets: F.tcp.resets } : null;

    // disks
    const pdById = new Map(st.pdisks.map(d => [String(d.id), d]));
    const disks = F.disks.map(d => {
      const id = d.inst.split(' ')[0], pd = pdById.get(id) || {};
      return { id, name: pd.name || ('Disk ' + id), letters: d.inst.split(' ').slice(1).map(s => s.toUpperCase()).join(' '), media: ({ 3: 'HDD', 4: 'SSD', 5: 'SCM' })[pd.media] || '', size: pd.size || null, health: pd.health, temp: pd.temp || null, wear: pd.wear == null ? null : pd.wear, read: Math.round(d.read), write: Math.round(d.write), rIops: Math.round(d.rIops), wIops: Math.round(d.wIops), active: U.r1(U.clamp(100 - d.idle, 0, 100)), latMs: Math.round(d.lat * 100000) / 100, queue: d.queue };
    });
    const fs = st.drives.map(v => ({ mount: v.id, label: v.label, fs: v.fs, size: v.size, free: v.free, kind: ({ 2: 'removable', 3: 'local', 4: 'network', 5: 'optical', 6: 'ram' })[v.type] || '' }));
    const battery = st.battery.map(b => ({ name: b.name, pct: b.pct, plugged: [2, 6, 7, 8, 9, 11].includes(b.status), charging: [6, 7, 8, 9].includes(b.status), minutes: b.minutes && b.minutes < 71582 ? b.minutes : null }));

    return { t: now, cpu, mem, gpus, gpuProc, disks, fs, net: { ifaces, tcp }, procs, sensors: sensors(), sensorSource: sensorSource(), battery };
  }

  function inventory() {
    const s = st.static || {};
    return { platform: 'win32', os: Object.assign({ kernel: os.release() }, s.os || {}), cpu: s.cpu || null, system: s.system || null, board: s.board || null, bios: s.bios || null, ram: U.arr(s.ram), video: U.arr(s.video), gpus: U.arr(s.dxgi).filter(d => !d.software), isAdmin: !!s.isAdmin, secureBoot: s.secureBoot == null ? null : !!s.secureBoot };
  }

  function status() {
    const lhm = require('../tools').state.lhm || {};
    const lhmWait = lhm.state === 'downloading' ? 'downloading…' : lhm.state === 'error' ? 'download failed' : process.env.NO_DOWNLOAD === '1' ? 'not in tools/ (NO_DOWNLOAD=1)' : 'waiting for download';
    return [
      { name: 'Perf counters (CPU, GPU, RAM, disk, net, processes)', ok: !!st.fast && Date.now() - st.fastAt < cfg.interval * 5, detail: st.fastMs ? st.fastMs + ' ms/sample' : '', err: fast.ok ? '' : U.trunc(fast.err, 300) },
      { name: 'WMI (inventory, command lines, drives, adapters)', ok: !!st.static, detail: st.pxMs ? 'process scan ' + st.pxMs + ' ms' : '', err: st.static ? '' : U.trunc(slow.err, 300) },
      { name: sockMode === 'ps' ? 'Sockets (Get-NetTCPConnection)' : 'Sockets (netstat -ano)', ok: sock.ok, detail: netstatMs ? netstatMs + ' ms' : '', err: sock.err },
      { name: 'Control worker (actions, services, net info)', ok: !!ctl.proc, detail: ctl.proc ? 'running' : 'starts on first use', err: U.trunc(ctl.err, 200) },
      { name: 'Sensor library (LibreHardwareMonitor, built in)', ok: !!emb.data && Date.now() - emb.at < 10000, detail: !sensorWorker ? lhmWait : emb.info ? (emb.data ? U.arr(emb.data.sensors).length + ' sensors' : 'starting') + (emb.info.admin ? '' : ' · no admin') + (emb.info.pawnio ? '' : ' · no PawnIO driver') : 'starting', err: U.trunc(sensorWorker ? emb.err : lhm.err, 200), optional: !sensorWorker && lhm.state !== 'downloading' },
    ];
  }

  async function wsl() {
    const exe = U.which(['wsl'], ['C:\\Windows\\System32']);
    if (!exe) return { installed: false, distros: [] };
    const r = await U.run(exe, ['-l', '-v'], { timeout: 8000, encoding: 'buffer' });
    const text = Buffer.isBuffer(r.stdout) ? r.stdout.toString(r.stdout.includes(0) ? 'utf16le' : 'utf8').replace(/\0/g, '').replace(/^\uFEFF/, '') : String(r.stdout);
    const errText = Buffer.isBuffer(r.stderr) ? r.stderr.toString('utf16le').replace(/\0/g, '') : String(r.stderr);
    if (/not installed|wsl(\.exe)? --install|0x8007019e|0x80070490/i.test(text + errText)) return { installed: false, distros: [] };
    const distros = [];
    for (const line of text.split(/\r?\n/).slice(1)) {
      const m = line.match(/^\s*(\*)?\s*(\S.*?)\s{2,}(\S+)\s+(\d+)\s*$/);
      if (m) distros.push({ name: m[2].trim(), state: m[3], version: +m[4], default: !!m[1] });
    }
    return { installed: true, distros };
  }

  return {
    id: 'win32', label: 'Windows',
    caps: { temps: 'LibreHardwareMonitor', fps: true, gpuProc: true, services: true, startup: true, suspend: true, priority: true, affinity: true, signatures: true, dnsCache: true, wifi: true, firewall: true, wsl: true, procInfo: true },
    start() { fast.start(); slow.start(); pollNetstat(); lhmHttp.start(); },
    stop() { fast.stop(); slow.stop(); ctl.stop(); if (sensorWorker) sensorWorker.stop(); clearTimeout(netstatTimer); lhmHttp.stop(); },
    sample, inventory, status, wsl, startSensors,
    restartSensors() { const dir = sensorWorker && sensorWorker.opts.env.RIG_LHM_DIR; if (!dir) return; sensorWorker.stop(); sensorWorker = null; emb.data = null; emb.info = null; setTimeout(() => startSensors(dir), 1500); },
    sensorInfo: () => emb.info,
    ctl,
    sockets: () => sock,
    selfPids: () => [fast.pid, slow.pid, ctl.pid, sensorWorker && sensorWorker.pid].filter(Boolean),
    isAdmin: () => (st.static ? !!st.static.isAdmin : require('../elevate').isAdmin()),
    netInfo: () => ctl.request('netinfo', {}, 30000).then(d => ({
      arp: U.arr(d.arp), routes: U.arr(d.routes), dns: U.arr(d.dns).map(x => ({ iface: x.iface, family: x.family, servers: U.arr(x.servers) })),
      av: U.arr(d.av), profiles: U.arr(d.profiles), firewall: U.arr(d.firewall).map(f => ({ name: f.name, enabled: /true/i.test(f.enabled), inbound: f.inbound, outbound: f.outbound })), defender: d.defender || null,
      wifi: U.arr(d.wifi).map(w => ({ name: w.Name, ssid: w.SSID, bssid: w['AP BSSID'] || w.BSSID, state: w.State, signal: w.Signal, radio: w['Radio type'], band: w.Band, channel: w.Channel, rx: w['Receive rate (Mbps)'], tx: w['Transmit rate (Mbps)'], auth: w.Authentication, cipher: w.Cipher, raw: w })),
    })),
    dnsCache: () => ctl.request('dnscache', {}, 30000).then(U.arr),
    services: () => ctl.request('services', {}, 30000).then(U.arr),
    serviceAction: (name, action) => ctl.request('service', { name, action }, 60000),
    startup: () => ctl.request('startup', {}, 60000).then(U.arr),
    signatures: paths => ctl.request('signatures', { paths }, 60000, true),
    procInfo: pid => ctl.request('procinfo', { pid }, 15000),
    async kill(pid, o = {}) {
      const args = ['/PID', String(pid)];
      if (o.tree) args.push('/T');
      args.push('/F');
      const r = await U.run(U.sys32('taskkill.exe'), args, { timeout: 15000 });
      if (!r.ok) throw new Error((r.stderr || r.stdout).trim() || 'taskkill failed (try an elevated terminal)');
      return r.stdout.trim();
    },
    async suspend(pid) { const r = await ctl.request('suspend', { pid }); suspended.add(pid); return r; },
    async resume(pid) { const r = await ctl.request('resume', { pid }); suspended.delete(pid); return r; },
    priority: (pid, level) => { if (!PRIO_CLASS[level]) return Promise.reject(new Error('bad priority level')); return ctl.request('priority', { pid, level: PRIO_CLASS[level] }); },
    affinity: (pid, mask) => ctl.request('affinity', { pid, mask: String(mask) }),
    async reveal(file) { spawn('explorer.exe', ['/select,', file], { detached: true, stdio: 'ignore' }).unref(); return 'opened'; },
    async wslAction(name, action) {
      const exe = U.which(['wsl'], ['C:\\Windows\\System32']);
      if (!exe) throw new Error('WSL is not installed');
      const args = action === 'shutdown' ? ['--shutdown'] : action === 'terminate' ? ['--terminate', name] : null;
      if (!args) throw new Error('bad action');
      const r = await U.run(exe, args, { timeout: 30000 });
      if (!r.ok) throw new Error('wsl ' + args.join(' ') + ' failed');
      return 'ok';
    },
  };
}

module.exports = { create };
