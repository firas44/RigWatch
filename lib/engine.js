'use strict';
// The engine owns every collector and builds one snapshot per interval for the UI.
const os = require('os');
const U = require('./util');
const { CFG, store, save, VERSION } = require('./config');
const platform = require('./platform');
const S = require('./sensors');
const { kindOf } = require('./classify');
const { History } = require('./history');
const { Timeline } = require('./timeline');
const { Alerts, METRICS } = require('./alerts');
const { Security } = require('./security');
const { Jobs } = require('./jobs');
const { TOOLS } = require('./nettools');
const tools = require('./tools');

const normName = s => String(s || '').toLowerCase().replace(/\(tm\)|\(r\)|graphics|amd|nvidia|intel|radeon|geforce|corporation|apple|\s+/g, '');
function sameName(a, b) {
  const x = normName(a), y = normName(b);
  if (x && y) return x.includes(y) || y.includes(x);
  return String(a || '').toLowerCase().trim() === String(b || '').toLowerCase().trim();
}

function createEngine(broadcast) {
  const e = { startedAt: Date.now() };
  const timeline = new Timeline(CFG.home, CFG.persist);
  const history = new History(CFG.home, CFG.persist);
  const nv = require('./nvidia').create(CFG.interval);
  const plat = platform.create({ cfg: CFG, onTick: () => tick(), onInventory: () => broadcast('static', JSON.stringify(e.staticPayload())), hasNvidia: () => !!nv.exe });
  const fps = require('./fps').create(CFG, kindOf);
  const ping = require('./ping').create(CFG.pingTarget);
  const alerts = new Alerts(store, save, timeline);
  const security = new Security(plat, timeline);
  const docker = require('./docker').create(CFG);
  const dev = require('./dev').create(plat, store.settings);
  const jobs = new Jobs(broadcast);
  Object.assign(e, { plat, timeline, history, alerts, security, docker, dev, jobs, nv, fps, ping });
  e.control = require('./control').create(e);
  e.toolbox = require('./toolbox').create(e);
  e.siem = require('./siem').create(e, broadcast, CFG, store, save);
  timeline.onAdd = ev => e.siem.fromTimeline(ev);

  let lastProcs = [], lastSnap = null, lastSnapJson = '', lastBuild = 0, seq = 0, building = false;
  let lastSockAt = -1, lastHealth = 0, secSummary = { score: 100, counts: { critical: 0, high: 0, medium: 0, low: 0, info: 0 }, top: [] };
  const session = { rx: 0, tx: 0, since: Date.now() };
  const procHist = new Map();
  let lastHistPrune = 0;
  e.lastProcs = () => lastProcs;
  e.lastSnap = () => lastSnap;
  e.lastSnapJson = () => lastSnapJson;
  e.procHistory = pid => procHist.get(pid) || null;

  // ---- cached network info (ARP, routes, DNS, firewall, AV, Wi-Fi) ----
  let netCache = null, netAt = 0, netPending = null;
  e.netInfo = force => {
    if (!plat.netInfo) return Promise.reject(new Error('not supported'));
    if (!force && netCache && Date.now() - netAt < 15000) return Promise.resolve(netCache);
    if (netPending) return netPending;
    netPending = plat.netInfo().then(n => { netCache = n; netAt = Date.now(); security.setNetInfo(n); return n; }).finally(() => { netPending = null; });
    return netPending;
  };

  // ---- fallback when the platform collector has nothing yet ----
  let prevCpu = null;
  function fallback() {
    const cur = os.cpus().map(c => { const t = c.times; return { total: t.user + t.nice + t.sys + t.idle + t.irq, idle: t.idle }; });
    let ti = 0, tt = 0;
    const per = cur.map((c, i) => { const p = prevCpu && prevCpu[i]; if (!p) return 0; const d = c.total - p.total, di = c.idle - p.idle; ti += di; tt += d; return d > 0 ? U.r1(100 * (1 - di / d)) : 0; });
    prevCpu = cur;
    const total = os.totalmem(), free = os.freemem();
    return { t: Date.now(), cpu: { util: tt > 0 ? U.r1(100 * (1 - ti / tt)) : 0, cores: per.map(u => ({ u, mhz: 0 })), mhz: (os.cpus()[0] || {}).speed || 0 }, mem: { total, avail: free, used: total - free }, gpus: [], gpuProc: new Map(), disks: [], fs: [], net: { ifaces: [], tcp: null }, procs: [], sensors: [], sensorSource: null, battery: [], fallback: true };
  }

  function build() {
    const now = Date.now();
    const dt = lastBuild ? U.clamp((now - lastBuild) / 1000, 0.05, 30) : CFG.interval / 1000;
    lastBuild = now;
    // broken perf counters / locked-down PowerShell: fill CPU and memory from Node itself
    let fbs = null; const fb = () => fbs || (fbs = fallback());
    const s = plat.sample() || fb();
    if (!s.cpu || s.cpu.util == null) s.cpu = fb().cpu;
    if (!s.mem || !s.mem.total) s.mem = fb().mem;
    const sock = plat.sockets();
    const SL = s.sensors || [];
    const inv = plat.inventory();

    // ---- CPU ----
    const cpu = Object.assign({ cores: [] }, s.cpu);
    cpu.temp = S.pick(SL, /^cpu$/i, 'Temperature', [/package|tctl|tdie/i, /core max/i, /average/i, /ccd/i, /core/i, /./]);
    cpu.tempSrc = cpu.temp != null ? 'sensor' : null;
    if (cpu.temp == null) { const z = SL.filter(x => x.hwType === 'Acpi' && x.type === 'Temperature' && x.value > 0).map(x => x.value); if (z.length) { cpu.temp = U.r1(Math.max(...z)); cpu.tempSrc = 'acpi'; } }
    cpu.power = S.pick(SL, /^cpu$/i, 'Power', [/package|cpu/i, /core/i]);
    cpu.voltage = S.pick(SL, /^cpu$/i, 'Voltage', [/core|vid|vcore|svi/i]);
    if (!cpu.baseMhz) cpu.baseMhz = (inv.cpu && inv.cpu.maxMhz) || 0;
    const mem = Object.assign({}, s.mem);

    // ---- GPUs: platform + sensors + nvidia-smi ----
    const gpuHws = [...new Set(SL.filter(x => /^gpu/i.test(x.hwType)).map(x => x.hw))];
    const gpus = (s.gpus || []).map(g => Object.assign({ temp: null, hotspot: null, memTemp: null, power: null, clock: null, memClock: null, fan: null, fanPct: null, engines: {} }, g));
    for (const g of gpus) {
      const hw = gpuHws.find(h => sameName(h, g.name)) || (gpuHws.length === 1 && gpus.length === 1 ? gpuHws[0] : null);
      if (!hw) continue;
      const L = SL.filter(x => x.hw === hw);
      const p = (type, rxs) => S.pick(L, /./, type, rxs);
      g.temp = p('Temperature', [/^gpu core$/i, /core|edge/i, /^gpu$/i, /./]);
      g.hotspot = p('Temperature', [/hot ?spot|junction/i]);
      g.memTemp = p('Temperature', [/mem/i]);
      g.power = p('Power', [/package|total|board|ppt|gpu power|ppt|average/i, /core/i, /./]);
      g.clock = p('Clock', [/core|shader|graphics|sclk/i]) || g.clock;
      g.memClock = p('Clock', [/memory|mclk/i]) || g.memClock;
      g.fan = p('Fan', [/./]);
      g.fanPct = p('Control', [/fan/i, /./]);
      if (g.util == null) g.util = p('Load', [/^gpu core$/i, /core/i]);
      g.source = (g.source || '') + ' + sensors';
    }
    if (nv.ok) {
      const nvList = gpus.filter(g => g.vendorId === 4318 || /nvidia|geforce|rtx|gtx|quadro|tesla/i.test(g.name));
      nv.gpus.forEach((n, i) => {
        let g = nvList.find(x => sameName(x.name, n.name)) || nvList[i];
        if (!g) { g = { id: 'nv' + n.index, name: n.name, util: 0, engines: {}, vramUsed: 0, vramTotal: 0 }; gpus.push(g); }
        if (n.util != null) g.util = Math.max(g.util || 0, n.util);
        if (n.vramUsed != null) g.vramUsed = n.vramUsed;
        if (n.vramTotal) g.vramTotal = n.vramTotal;
        if (n.enc != null) g.engines['video encode'] = n.enc;
        if (n.dec != null) g.engines['video decode'] = n.dec;
        Object.assign(g, { temp: n.temp, power: n.power, powerLimit: n.powerLimit, clock: n.clock, memClock: n.memClock, fanPct: n.fanPct, pstate: n.pstate, source: 'nvidia-smi' });
      });
    }
    gpus.sort((a, b) => (b.vramTotal || 0) - (a.vramTotal || 0));
    const gpuProc = s.gpuProc || new Map();

    // ---- processes ----
    const fpsInfo = fps.payload();
    const fpsBy = new Map(fpsInfo.apps.map(a => [a.pid, a.fps]));
    const self = new Set([process.pid, ...plat.selfPids(), fps.pid()].filter(Boolean));
    const procs = (s.procs || []).map(p => {
      const o = Object.assign({}, p);
      o.kind = self.has(p.pid) ? 'rigwatch' : kindOf(p.name);
      if (fpsBy.get(p.pid) > 0 && !['browser', 'system', 'comms', 'editor', 'shell'].includes(o.kind) && !/^dwm$/i.test(p.name)) o.kind = 'game';
      const g = gpuProc.get(p.pid);
      o.gpu = g ? U.r1(U.clamp(g.util, 0, 100)) : 0;
      o.vram = (g && g.vram) || nv.procs.get(p.pid) || 0;
      o.ports = sock.byPid.get(p.pid) || [];
      o.conns = sock.connsByPid.get(p.pid) || 0;
      o.fps = fpsBy.get(p.pid) || 0;
      if (o.kind === 'rigwatch') o.label = p.pid === process.pid ? 'RigWatch server' : 'RigWatch collector';
      else dev.annotate(o);
      const sig = security.signature(p.exe); if (sig) o.sig = sig;
      const fl = security.flags(p.pid); if (fl) o.flags = fl;
      return o;
    });
    lastProcs = procs;
    for (const p of procs) {
      let h = procHist.get(p.pid);
      if (!h || h.name !== p.name) { h = { name: p.name, t: [], cpu: [], mem: [] }; procHist.set(p.pid, h); }
      h.t.push(now); h.cpu.push(p.cpu); h.mem.push(p.mem);
      if (h.cpu.length > 180) { h.t.shift(); h.cpu.shift(); h.mem.shift(); }
    }
    if (now - lastHistPrune > 30000) { lastHistPrune = now; const alive = new Set(procs.map(p => p.pid)); for (const pid of procHist.keys()) if (!alive.has(pid)) procHist.delete(pid); }

    // ---- network ----
    const ifaces = s.net.ifaces || [];
    const counted = ifaces.some(i => !i.virtual) ? ifaces.filter(i => !i.virtual) : ifaces;
    const nt = { rx: 0, tx: 0, rxp: 0, txp: 0 };
    for (const i of counted) { nt.rx += i.rx || 0; nt.tx += i.tx || 0; nt.rxp += i.rxp || 0; nt.txp += i.txp || 0; }
    session.rx += nt.rx * dt; session.tx += nt.tx * dt;
    const pst = ping.stats();

    // ---- disks: storage sensors -> temps ----
    const disks = (s.disks || []).map(d => {
      if (d.temp == null) { const L = SL.filter(x => x.hwType === 'Storage' && x.type === 'Temperature' && (sameName(x.hw, d.name) || x.hw === d.id)); if (L.length) d.temp = L[0].value; }
      return d;
    });

    // ---- temps summary ----
    const temps = [];
    if (cpu.temp != null) temps.push({ label: 'CPU', value: cpu.temp, src: cpu.tempSrc });
    for (const g of gpus) { if (g.temp != null) temps.push({ label: g.name, value: g.temp, src: 'gpu' }); if (g.hotspot != null) temps.push({ label: g.name + ' hotspot', value: g.hotspot, src: 'gpu', hot: true }); }
    for (const d of disks) if (d.temp) temps.push({ label: d.name, value: d.temp, src: 'disk' });
    for (const x of SL) if (x.type === 'Temperature' && /motherboard|superio/i.test(x.hwType) && x.value > 5 && x.value < 120) temps.push({ label: x.name, value: x.value, src: 'board' });
    if (!temps.length) for (const x of SL) if (x.type === 'Temperature' && x.hwType === 'Acpi') temps.push({ label: x.hw + ' ' + x.name, value: x.value, src: 'acpi' });

    // ---- security + timeline (on every fresh socket table) ----
    if (sock.at !== lastSockAt) {
      lastSockAt = sock.at;
      security.queueSignatures(procs, sock);
      secSummary = security.analyze(procs, sock, { inv, exposed: !['127.0.0.1', 'localhost', '::1'].includes(CFG.host), host: CFG.host });
      try { e.siem.observe(procs, sock); } catch (err) { U.log('siem observe:', err.message); }
    }
    timeline.observe(procs, sock, store.settings);
    if (now - lastHealth > 10000) { lastHealth = now; dev.check(procs, sock).catch(() => {}); }

    const primary = gpus[0] || null;
    const hp = {
      t: now, cpu: cpu.util, gpu: primary ? primary.util : null, mem: mem.total ? U.r1(100 * mem.used / mem.total) : null,
      vram: primary && primary.vramTotal ? U.r1(100 * primary.vramUsed / primary.vramTotal) : null,
      rx: Math.round(nt.rx), tx: Math.round(nt.tx), rxp: Math.round(nt.rxp), txp: Math.round(nt.txp),
      dr: disks.reduce((a, d) => a + (d.read != null ? d.read : d.total || 0), 0), dw: disks.reduce((a, d) => a + (d.write || 0), 0),
      ct: cpu.temp, gt: primary ? primary.temp : null, fps: fpsInfo.main ? fpsInfo.main.fps : null,
      ping: pst ? pst.ms : null, loss: pst ? pst.loss : null, conns: sock.conns.length, swap: mem.swapTotal ? U.r1(100 * mem.swapUsed / mem.swapTotal) : null,
    };
    history.push(hp);

    const outProcs = procs.map(p => Object.assign({}, p, { cmd: U.trunc(U.redact(p.cmd), 300) }));
    const snap = {
      seq: ++seq, t: now, interval: CFG.interval, uptime: Math.round(os.uptime()), fallback: !!s.fallback,
      cpu, mem, gpus, disks, fs: s.fs || [],
      net: { ifaces, rx: Math.round(nt.rx), tx: Math.round(nt.tx), rxp: Math.round(nt.rxp), txp: Math.round(nt.txp), session: { rx: Math.round(session.rx), tx: Math.round(session.tx), since: session.since }, tcp: s.net.tcp || null, ping: pst, ephemeral: sock.conns.filter(c => c.lp >= 49152).length },
      procs: outProcs,
      ports: { listen: sock.listen, conns: sock.conns.slice(0, 3000), total: sock.conns.length, at: sock.at, names: Object.fromEntries(sock.names) },
      temps, sensors: { source: s.sensorSource || null, list: SL },
      fps: fpsInfo, battery: s.battery || [],
      docker: docker.summary(),
      dev: { health: dev.healthList(), wsl: dev.wsl },
      security: secSummary,
      status: e.status(),
      hp,
    };
    snap.alerts = { fired: alerts.evaluate(Object.assign({}, snap, { procs })), firing: alerts.firing() };
    return snap;
  }

  function tick() {
    if (building) return;
    if (Date.now() - lastBuild < CFG.interval * 0.4) return;
    building = true;
    try {
      lastSnap = build();
      lastSnapJson = JSON.stringify(lastSnap);
      broadcast('snap', lastSnapJson);
      const ev = timeline.drain();
      if (ev.length) broadcast('events', JSON.stringify(ev));
      if (lastSnap.alerts.fired.length) broadcast('alert', JSON.stringify(lastSnap.alerts.fired));
    } catch (err) { U.log('snapshot error:', err.stack || err.message); }
    building = false;
  }
  e.tick = tick;

  e.status = () => {
    const list = plat.status();
    list.push({ name: 'Hardware sensors', ok: !!(lastSnap && lastSnap.sensors.source), detail: lastSnap && lastSnap.sensors.source ? lastSnap.sensors.source + ' · ' + lastSnap.sensors.list.length + ' sensors' : (plat.caps.temps === 'LibreHardwareMonitor' ? 'waiting for the sensor library' : plat.caps.temps === 'none' ? 'not available on this OS without sudo' : 'none found'), err: '' });
    list.push({ name: 'NVIDIA (nvidia-smi)', ok: nv.ok, detail: nv.ok ? nv.gpus.length + ' GPU(s)' : nv.exe ? 'starting' : 'not found', err: nv.ok ? '' : U.trunc(nv.err, 200), optional: !nv.exe });
    if (plat.caps.fps) list.push({ name: 'FPS (PresentMon)', ok: fps.status === 'running', detail: fps.status, err: fps.status === 'running' ? '' : U.trunc(fps.err || fps.msg, 200), optional: fps.status === 'missing' });
    list.push({ name: 'Docker / Podman', ok: docker.available, detail: docker.available ? (docker.info ? 'v' + docker.info.version + ' · ' + docker.containers.length + ' containers' : 'connected') : 'not running', err: '', optional: true });
    list.push({ name: 'Ping', ok: !!ping.target, detail: ping.target || 'off', err: '' });
    try { list.push(...e.siem.status()); } catch { /* starting */ }
    const si = plat.sensorInfo ? plat.sensorInfo() : null;
    return { admin: plat.isAdmin(), collectors: list, fallback: !plat.sample(), tools: tools.state, pawnio: si ? si.pawnio : null, sensorAdmin: si ? si.admin : null };
  };

  e.staticPayload = () => ({
    version: VERSION, hostname: os.hostname(), platform: process.platform, platformLabel: plat.label, release: os.release(), arch: os.arch(), node: process.version,
    pid: process.pid, interval: CFG.interval, bind: CFG.host + ':' + CFG.port, startedAt: e.startedAt, home: CFG.home, persist: CFG.persist, lhmUrl: CFG.lhmUrl,
    caps: Object.assign({}, plat.caps, { nvidia: !!nv.exe, docker: true, tools: CFG.allowTools, control: CFG.allowControl }),
    inventory: plat.inventory(), totalMem: os.totalmem(), cores: os.cpus().length,
    elevated: plat.isAdmin(), canElevate: U.IS_WIN && !plat.isAdmin(), tools: tools.state, sensorInfo: plat.sensorInfo ? plat.sensorInfo() : null,
    metrics: Object.fromEntries(Object.entries(METRICS).map(([k, m]) => [k, { label: m.label, unit: m.unit, target: m.target || null }])),
  });

  // ---- tools (jobs) ----
  e.startTool = (tool, params = {}) => {
    if (tool === 'dockerlogs') return jobs.start('dockerlogs', 'logs ' + params.name, params, api => docker.logs(String(params.id || ''), api, params.tail));
    if (tool === 'du') return jobs.start('du', 'disk usage ' + (params.dir || ''), params, api => e.toolbox.du(params.dir, api));
    const T = TOOLS[tool];
    if (!T) throw new Error('unknown tool ' + tool);
    const title = T.title(params);
    timeline.add('action', 'info', 'tool: ' + title, {});
    return jobs.start(tool, title, params, api => T.run(params, api, { netInfo: e.netInfo, onDevices: trackDevices }));
  };
  function trackDevices(devices) {
    const known = new Map((store.knownDevices || []).map(d => [d.key, d]));
    const first = known.size === 0;
    for (const d of devices) {
      if (d.self) continue;
      const key = d.mac || d.ip;
      const k = known.get(key);
      if (!k && !first) timeline.add('lan.device', 'warn', 'New device on your network: ' + d.ip + (d.name ? ' (' + d.name + ')' : ''), { ip: d.ip, detail: (d.mac ? 'MAC ' + d.mac + (d.randomMac ? ' (randomised)' : '') : 'no MAC') + (d.ports.length ? ' · open ' + d.ports.join(', ') : '') });
      d.firstSeen = k ? k.firstSeen : Date.now(); d.known = !!k || first;
      known.set(key, { key, ip: d.ip, mac: d.mac || '', name: d.name || (k && k.name) || '', firstSeen: d.firstSeen, lastSeen: Date.now(), label: k ? k.label || '' : '' });
    }
    store.knownDevices = [...known.values()].sort((a, b) => b.lastSeen - a.lastSeen).slice(0, 500);
    save();
  }

  e.start = async () => {
    nv.start();
    await plat.start();
    ping.start(); docker.start();
    if (U.IS_WIN) {
      // fetch helpers on first run (pinned + SHA-256 verified), then start them
      tools.ensure('lhm').then(dir => { if (dir && plat.startSensors) plat.startSensors(dir); });
      tools.ensure('presentmon').then(p => fps.start(p));
    } else fps.start();
    dev.loadToolchain().catch(() => {}); dev.pollWsl();
    setInterval(() => dev.pollWsl(), 30000).unref();
    setInterval(() => { if (Date.now() - lastBuild > CFG.interval * 2.5) tick(); }, CFG.interval).unref();
    if (plat.netInfo) { setTimeout(() => e.netInfo(true).catch(() => {}), 15000).unref(); setInterval(() => e.netInfo(true).catch(() => {}), 120000).unref(); }
    timeline.add('system', 'info', 'RigWatch started', { detail: 'v' + VERSION + ' on ' + plat.label + ', Node ' + process.version });
    e.siem.start();
  };
  e.stop = () => { try { e.siem.stop(); } catch { /* exiting */ } try { plat.stop(); nv.stop(); fps.stop(); ping.stop(); docker.stop(); history.flush(); timeline.flush(); } catch { /* exiting */ } };
  return e;
}

module.exports = { createEngine };
