'use strict';
/* Dashboard: widget registry, drag/resize grid editor, and shared renderers used across pages. */
(() => {
const { esc, f: F, icon, setH } = RW;

// ---------- shared renderers ----------
RW.groupApps = procs => {
  const g = new Map();
  for (const p of procs || []) {
    if (p.kind === 'rigwatch') continue;
    const k = p.name.toLowerCase();
    let e = g.get(k);
    if (!e) { e = { name: p.name, kind: p.kind, n: 0, cpu: 0, mem: 0, gpu: 0, vram: 0, io: 0, conns: 0, ports: [], pids: [] }; g.set(k, e); }
    e.n++; e.cpu += p.cpu || 0; e.mem += p.mem || 0; e.gpu += p.gpu || 0; e.vram += p.vram || 0; e.io += p.io || 0; e.conns += p.conns || 0; e.pids.push(p.pid);
    for (const x of p.ports || []) if (!e.ports.includes(x)) e.ports.push(x);
  }
  return [...g.values()].map(e => Object.assign(e, { gpu: Math.min(100, e.gpu) }));
};
RW.topList = (apps, key, fmt, col, n) => {
  const a = apps.filter(x => x[key] > 0).sort((x, y) => y[key] - x[key]).slice(0, n || 6);
  if (!a.length) return '<div class="empty">nothing yet</div>';
  const mx = a[0][key] || 1;
  return a.map(x => RW.brow(esc(x.name) + (x.n > 1 ? ' <span class="muted">×' + x.n + '</span>' : ''), fmt(x[key]), 100 * x[key] / mx, col, 'data-q="' + esc(x.name) + '"')).join('');
};
const EV_ICON = { 'proc.start': 'play', 'proc.exit': 'stop', 'port.open': 'unlock', 'port.close': 'lock', 'net.newhost': 'globe', 'alert.fire': 'bell', 'alert.clear': 'check', 'finding.new': 'shield', 'finding.clear': 'check', action: 'zap', 'lan.device': 'wifi', system: 'info' };
RW.evRow = e => '<div class="ev ' + esc(e.sev) + '"><time title="' + esc(new Date(e.t).toLocaleString()) + '">' + F.time(e.t) + '</time>' + icon(EV_ICON[e.type] || 'info') + '<div class="et">' + esc(e.title) + '</div>' + (e.detail ? '<div class="ed">' + esc(e.detail) + '</div>' : '') + '</div>';
RW.healthChip = h => {
  if (!h) return '';
  if (h.kind === 'tcp' || (!h.status && h.err && !/ECONNREFUSED|timeout/i.test(h.err))) return '<span class="chip info" title="TCP port, not HTTP"><i></i>tcp</span>';
  if (!h.status) return '<span class="chip crit" title="' + esc(h.err || 'no response') + '"><i></i>down</span>';
  return '<span class="chip ' + (h.status < 400 ? 'good' : h.status < 500 ? 'warn' : 'crit') + '" title="' + esc((h.title || '') + (h.server ? ' · ' + h.server : '')) + '"><i></i>' + h.status + ' · ' + h.ms + ' ms</span>';
};
RW.devServers = s => {
  const devs = (s.procs || []).filter(p => RW.isDev(p) && p.ports && p.ports.length).sort((a, b) => a.ports[0] - b.ports[0]);
  if (!devs.length) return '<div class="empty">No dev server listening. Run <code>npm run dev</code> and it shows up within 3 s.</div>';
  const H = (s.dev && s.dev.health) || {};
  return '<div class="tw">' + RW.table('w-dev', [
    { k: 'label', label: 'Process', fmt: p => '<span class="pn" title="' + esc(p.cmd) + '">' + esc(p.label || p.name) + '</span>' + (p.project ? '<span class="sub">' + esc(p.project.name) + (p.project.branch ? ' · ' + esc(p.project.branch) : '') + '</span>' : '') },
    { k: 'ports', label: 'Ports', nosort: true, fmt: p => p.ports.slice(0, 3).map(pt => '<a class="plink" href="http://localhost:' + pt + '" target="_blank" rel="noopener noreferrer">:' + pt + '</a> ' + RW.healthChip(H[pt])).join(' ') },
    { k: 'cpu', label: 'CPU', num: true, fmt: p => F.pct(p.cpu, 1) },
    { k: 'mem', label: 'Mem', num: true, fmt: p => F.b(p.mem, 0) },
  ], devs, { row: p => 'class="click" data-pid="' + p.pid + '"' }) + '</div>';
};
RW.listenRows = (s, list, compact) => RW.table(compact ? 'w-listen' : 'listen', [
  { k: 'port', label: 'Port', num: true, fmt: l => '<b>' + l.port + '</b>' },
  { k: 'proto', label: 'Proto' },
  { k: 'svc', label: 'Service', sort: l => RW.svc(l.port, RW.pidMap(s).get(l.pid)), fmt: l => '<span class="muted">' + esc(RW.st && l.pid === RW.st.pid ? 'RigWatch (this page)' : RW.svc(l.port, RW.pidMap(s).get(l.pid) || { pid: l.pid })) + '</span>' },
  { k: 'scope', label: 'Bound to', fmt: l => (l.scope === 'all' ? '<span class="chip warn" title="All interfaces: reachable from your network if the firewall allows it"><i></i>all interfaces</span>' : l.scope === 'local' ? '<span class="chip good" title="Only reachable from this machine"><i></i>local only</span>' : '<span class="chip" title="' + esc(l.addrs.join(', ')) + '"><i></i>' + esc(l.addrs[0]) + '</span>') },
  { k: 'pid', label: 'Process', sort: l => RW.pname(s, l.pid), fmt: l => { const p = RW.pidMap(s).get(l.pid); return '<span class="pn">' + esc(RW.pname(s, l.pid)) + '</span>' + (p ? RW.kindTag(p) : '') + '<span class="sub">' + l.pid + '</span>'; } },
  { k: 'open', label: '', nosort: true, fmt: l => (l.proto === 'TCP' && l.scope !== 'iface' ? '<a class="plink" href="http://localhost:' + l.port + '" target="_blank" rel="noopener noreferrer">open</a>' : '') + (compact || !RW.canControl() ? '' : ' <button class="btn sm danger" data-killport="' + l.port + '" data-proto="' + l.proto + '" title="End the process that owns this port">kill</button>') },
], list, { row: l => 'class="click" data-pid="' + l.pid + '"', sortK: 'port', sortD: 1, max: compact ? 40 : 2000 });

// ---------- widget registry ----------
const W = RW.widgets = {};
const def = (id, o) => { W[id] = Object.assign({ id }, o); };
const chartbox = (id, h) => '<div class="chartbox" style="min-height:' + (h || 90) + 'px"><canvas class="chart" id="' + id + '"></canvas></div>';

def('kpis', {
  title: 'Key metrics', w: 12, h: 2, bare: true,
  mount(b) {
    const T = [['cpu', 'CPU', 'performance', 'cpu'], ['gpu', 'GPU', 'performance', 'gpu'], ['mem', 'Memory', 'processes', 'mem'], ['vram', 'VRAM', 'performance', 'vram'], ['fps', 'FPS', 'performance', 'fps'], ['net', 'Network', 'network', 'rx'], ['disk', 'Disk', 'performance', 'disk'], ['ping', 'Ping', 'network', 'ping']];
    b.innerHTML = '<div class="kpis">' + T.map(t => '<div class="kpi" data-go="' + t[2] + '"><div class="kl"><span>' + t[1] + '</span><span id="kc-' + t[0] + '"></span></div><div class="kv2" id="kv-' + t[0] + '">–</div><div class="ks" id="ks-' + t[0] + '">&nbsp;</div><canvas id="kspark-' + t[0] + '"></canvas></div>').join('') + '</div>';
    for (const t of T) RW.chart('kspark-' + t[0], RW.preset(t[3] === 'disk' ? 'disk' : t[3], { spark: true, points: 120, series: t[3] === 'disk' ? [{ k: 'dr', c: '--s1', l: 'Read' }] : RW.SER[t[3]].series.slice(0, 1) }));
  },
  update(b, s) {
    const c = s.cpu, g = s.gpus[0], m = s.mem, n = s.net, f = s.fps, d = s.disks;
    setH('kv-cpu', F.pct(c.util)); setH('ks-cpu', esc((c.mhz ? F.ghz(c.mhz) : '') + (c.power != null ? ' · ' + Math.round(c.power) + ' W' : '') + (c.load ? ' · load ' + c.load[0] : '') + (c.temp == null && !c.load ? ' · no temp' : ''))); setH('kc-cpu', RW.tchip(c.temp));
    if (g) { setH('kv-gpu', F.pct(g.util)); setH('ks-gpu', esc(g.name)); setH('kc-gpu', RW.tchip(g.temp, [75, 85, 95])); setH('kv-vram', RW.vu(F.b(g.vramUsed, 1))); setH('ks-vram', esc(g.vramTotal ? 'of ' + F.b(g.vramTotal, 0) + ' · ' + F.b(Math.max(0, g.vramTotal - g.vramUsed), 1) + ' free' : 'in use')); }
    else { setH('kv-gpu', '–'); setH('ks-gpu', 'no GPU data'); setH('kv-vram', '–'); setH('ks-vram', ''); }
    setH('kv-mem', F.pct(100 * m.used / m.total) + '<small>' + F.b(m.used, 1) + '</small>'); setH('ks-mem', esc(F.b(m.avail, 1) + ' free of ' + F.b(m.total, 0)));
    if (f.main) { setH('kv-fps', Math.round(f.main.fps) + '<small>fps</small>'); setH('ks-fps', esc(f.main.name + (f.main.low1 ? ' · 1% low ' + Math.round(f.main.low1) : ''))); }
    else { setH('kv-fps', '–'); setH('ks-fps', esc(f.status === 'running' ? 'waiting for a game' : f.status === 'needs-admin' ? 'needs admin terminal' : f.status === 'unsupported' ? 'Windows only' : 'add PresentMon')); }
    setH('kv-net', RW.vu(F.bits(n.rx), ' ↓')); setH('ks-net', esc('↑ ' + F.bits(n.tx) + ' · ' + F.num(n.rxp + n.txp) + ' pkt/s'));
    const rd = d.reduce((a, x) => a + (x.read != null ? x.read : x.total || 0), 0), wr = d.reduce((a, x) => a + (x.write || 0), 0), act = d.reduce((a, x) => Math.max(a, x.active || 0), 0);
    setH('kv-disk', RW.vu(F.rate(rd + wr))); setH('ks-disk', esc('R ' + F.rate(rd) + ' · W ' + F.rate(wr) + ' · ' + F.pct(act) + ' busy'));
    if (n.ping) { setH('kv-ping', n.ping.ms == null ? 'timeout' : RW.vu(F.ms(n.ping.ms))); setH('ks-ping', esc('jitter ' + F.ms(n.ping.jitter) + ' · loss ' + F.pct(n.ping.loss))); } else { setH('kv-ping', 'off'); setH('ks-ping', 'PING_TARGET=off'); }
  },
});
def('cpu', {
  title: 'CPU', w: 6, h: 4,
  mount(b) { b.innerHTML = chartbox('wc-cpu', 110) + '<div class="cores" id="wc-cores"></div><div id="wc-cstats"></div>'; RW.chart('wc-cpu', RW.preset('cpu')); },
  update(b, s, hd) {
    const c = s.cpu, inv = RW.st && RW.st.inventory;
    setH(hd, '<span class="muted" style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px">' + esc(inv && inv.cpu ? inv.cpu.name : '') + '</span><span class="big">' + F.pct(c.util) + '</span>' + RW.tchip(c.temp));
    const n = c.cores.length || 1, el = document.getElementById('wc-cores');
    if (el) el.style.gridTemplateColumns = 'repeat(' + (n <= 16 ? n : Math.ceil(n / Math.ceil(n / 16))) + ',minmax(0,1fr))';
    setH('wc-cores', c.cores.map((k, i) => '<div class="core" title="thread ' + i + ': ' + F.pct(k.u, 1) + (k.mhz ? ' @ ' + F.ghz(k.mhz) : '') + '"><div class="ctrack"><i style="height:' + RW.cl(k.u).toFixed(0) + '%"></i></div><b>' + Math.round(k.u) + '</b></div>').join(''));
    setH('wc-cstats', RW.stats([['Clock', F.ghz(c.mhz)], ['Processes', F.num(c.procs || s.procs.length)], ['Threads', F.num(c.threads)], c.load ? ['Load 1/5/15', c.load.join(' / ')] : ['Context sw/s', F.num(c.ctx)], ['Power', c.power != null ? c.power.toFixed(1) + ' W' : null], ['Run queue', c.queue != null ? String(c.queue) : null]]));
  },
});
def('gpu', {
  title: 'GPU', w: 6, h: 4,
  mount(b) { b.innerHTML = chartbox('wc-gpu', 100) + '<div id="wc-gpub"></div>'; RW.chart('wc-gpu', RW.preset('gpu')); },
  update(b, s, hd) {
    const g = s.gpus[0];
    if (!g) { setH(hd, ''); setH('wc-gpub', '<div class="empty">No GPU counters on this system.</div>'); return; }
    setH(hd, '<span class="muted" style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px">' + esc(g.name) + '</span><span class="big">' + F.pct(g.util) + '</span>' + RW.tchip(g.temp, [75, 85, 95]));
    const e = g.engines || {}, order = ['3d', 'compute', 'copy', 'video decode', 'video encode', 'video codec', 'renderer', 'tiler'];
    const keys = order.filter(k => k in e).slice(0, 4);
    setH('wc-gpub', '<div class="grid g2" style="gap:0 16px;margin:6px 0 0">' + keys.map(k => RW.brow(esc(k), F.pct(e[k], 1), e[k], '--s7')).join('') + (g.vramTotal ? RW.brow('VRAM', F.b(g.vramUsed, 1) + ' / ' + F.b(g.vramTotal, 0), 100 * g.vramUsed / g.vramTotal, '--s7') : '') + '</div>' +
      RW.stats([['Hotspot', g.hotspot != null ? F.temp(g.hotspot) : null], ['Power', g.power != null ? Math.round(g.power) + ' W' : null], ['Core clock', g.clock ? Math.round(g.clock) + ' MHz' : null], ['Fan', g.fan != null ? Math.round(g.fan) + ' RPM' : g.fanPct != null ? F.pct(g.fanPct) : null], ['Shared', g.sharedTotal ? F.b(g.sharedUsed, 1) : null]]));
  },
});
def('memory', {
  title: 'Memory', w: 4, h: 3,
  mount(b) { b.innerHTML = '<div id="wc-memstack"></div>' + chartbox('wc-mem', 70) + '<div id="wc-mems"></div>'; RW.chart('wc-mem', RW.preset('mem')); },
  update(b, s, hd) {
    const m = s.mem;
    setH(hd, '<span class="big">' + F.b(m.used, 1) + '</span><span class="muted">/ ' + F.b(m.total, 0) + '</span>');
    const cols = ['--s3', '--s2', '--s1', '--s4', null];
    setH('wc-memstack', m.breakdown ? '<div class="stack">' + m.breakdown.map((x, i) => '<i title="' + esc(x[0] + ': ' + F.b(x[1], 1)) + '" style="width:' + (100 * x[1] / m.total).toFixed(2) + '%;background:' + (i === m.breakdown.length - 1 ? 'transparent' : 'var(' + cols[i] + ')') + '"></i>').join('') + '</div><div class="legend" style="margin:6px 0 0">' + m.breakdown.map((x, i) => '<span><i style="background:' + (i === m.breakdown.length - 1 ? 'var(--panel3)' : 'var(' + cols[i] + ')') + '"></i>' + esc(x[0]) + ' <b>' + F.b(x[1], 1) + '</b></span>').join('') + '</div>' : RW.bar(100 * m.used / m.total, '--s3'));
    setH('wc-mems', RW.stats([['Committed', m.committed ? F.b(m.committed, 1) + ' / ' + F.b(m.commitLimit, 0) : null], ['Swap', m.swapTotal ? F.b(m.swapUsed, 1) + ' / ' + F.b(m.swapTotal, 0) : null], ['Hard faults/s', m.hardFaults != null ? F.num(m.hardFaults) : null]]));
  },
});
def('network', {
  title: 'Network', w: 4, h: 3,
  mount(b) { b.innerHTML = chartbox('wc-net', 80) + '<div id="wc-nets"></div>'; RW.chart('wc-net', RW.preset('net')); },
  update(b, s, hd) {
    const n = s.net, a = n.ifaces.filter(i => !i.virtual && i.up)[0] || n.ifaces[0];
    setH(hd, '<span class="muted" style="font-size:12px">' + esc(a ? a.name + (a.ipv4[0] ? ' · ' + a.ipv4[0] : '') + (a.speed ? ' · ' + F.link(a.speed) : '') : '') + '</span>');
    setH('wc-nets', RW.stats([['Packets in', F.num(n.rxp) + '/s'], ['Packets out', F.num(n.txp) + '/s'], ['TCP est.', n.tcp ? F.num(n.tcp.est) : null], ['Retransmits', n.tcp ? F.pct(n.tcp.retransPct, 2) : null], ['Session ↓', F.b(n.session.rx, 1)], ['Session ↑', F.b(n.session.tx, 1)]]));
  },
});
def('disk', {
  title: 'Disk', w: 4, h: 3,
  mount(b) { b.innerHTML = chartbox('wc-disk', 70) + '<div id="wc-disks"></div>'; RW.chart('wc-disk', RW.preset('disk')); },
  update(b, s) {
    setH('wc-disks', s.disks.map(d => RW.brow(esc(d.name) + ' <span class="muted">' + esc(d.letters || '') + '</span>' + (d.temp ? ' ' + RW.tchip(d.temp, [55, 65, 75]) : ''), d.active != null ? F.pct(d.active) + ' busy' + (d.latMs ? ' · ' + F.ms(d.latMs) : '') : F.rate(d.total), d.active || 0, '--s1')).join('') || '<div class="empty">no disk counters</div>');
  },
});
def('storage', {
  title: 'Storage', w: 6, h: 3,
  update(b, s) { setH(b, (s.fs || []).map(v => { const used = v.size - v.free; return RW.brow(esc(v.mount) + (v.label && v.label !== v.mount ? ' <span class="muted">' + esc(v.label) + '</span>' : '') + ' <span class="faint">' + esc(v.fs) + '</span>', F.b(v.free, 1) + ' free of ' + F.b(v.size, 0), 100 * used / v.size, used / v.size > 0.9 ? '--s8' : '--s3'); }).join('') || '<div class="empty">no volumes</div>'); },
});
def('topapps', {
  title: 'Most consuming apps', w: 8, h: 4,
  update(b, s, hd) {
    setH(hd, '<span class="muted" style="font-size:12px">grouped by app</span>');
    const apps = RW.groupApps(s.procs);
    setH(b, '<div class="grid g4" style="margin:0;gap:18px">' + [['CPU', 'cpu', v => F.pct(v, 1), '--s1'], ['Memory', 'mem', v => F.b(v, 1), '--s3'], ['GPU', 'gpu', v => F.pct(v, 1), '--s7'], ['I/O', 'io', F.rate, '--s2']].map(c => '<div><h3 style="margin:0 0 4px" class="muted">' + c[0] + '</h3>' + RW.topList(apps, c[1], c[2], c[3], 6) + '</div>').join('') + '</div>');
  },
});
def('security', {
  title: 'Security', w: 4, h: 4,
  update(b, s, hd) {
    const sec = s.security, c = sec.counts;
    setH(hd, '<a data-go="security" class="muted" style="font-size:12px">details →</a>');
    setH(b, '<div style="display:grid;grid-template-columns:150px 1fr;gap:12px;align-items:center">' + RW.gauge(sec.score, 100, RW.scoreColor(sec.score), sec.score + '/100', 'exposure score') +
      '<div>' + ['critical', 'high', 'medium', 'low'].map(k => '<div class="brow" style="margin:4px 0"><span class="bl">' + RW.sev(k) + '</span><span class="bv">' + c[k] + '</span></div>').join('') + '</div></div>' +
      (sec.top.filter(x => x.sev !== 'info').slice(0, 3).map(x => '<div class="ev ' + (x.sev === 'critical' || x.sev === 'high' ? 'alert' : 'warn') + '" style="grid-template-columns:22px 1fr"><span>' + icon('alert') + '</span><div class="et">' + esc(x.title) + '</div></div>').join('') || '<div class="empty" style="padding:10px">No risky exposure found.</div>'));
  },
});
def('fps', {
  title: 'FPS', w: 4, h: 3,
  mount(b) { b.innerHTML = '<div id="wc-fpsn"></div>' + chartbox('wc-ft', 70); RW.chart('wc-ft', { series: [{ k: 'ft', c: '--s6', l: 'Frame time' }], fmt: F.ms, min: 20, src: () => { const m = RW.snap && RW.snap.fps.main; const a = m ? m.frametimes : []; return { n: Math.max(a.length, 2), s: [a], label: i => 'frame ' + (i + 1) + ' of ' + a.length }; } }); },
  update(b, s, hd) {
    const f = s.fps;
    const box = b.querySelector('.chartbox'); if (box) box.style.display = f.main ? '' : 'none';
    if (f.main) { setH(hd, '<span class="muted" style="font-size:12px">' + esc(f.main.name) + '</span>'); setH('wc-fpsn', '<div style="display:flex;gap:16px;align-items:baseline;flex-wrap:wrap"><span class="huge">' + Math.round(f.main.fps) + '</span><span class="muted">fps</span><span>1% <b class="num">' + (f.main.low1 ? Math.round(f.main.low1) : '–') + '</b></span><span>0.1% <b class="num">' + (f.main.low01 ? Math.round(f.main.low01) : '–') + '</b></span><span class="muted">' + F.ms(f.main.ft) + '</span></div>'); return; }
    setH(hd, '');
    const pm = s.status.tools && s.status.tools.presentmon;
    setH('wc-fpsn', f.status === 'unsupported' ? '<div class="empty">FPS capture is Windows-only.</div>' : f.status === 'running' || f.status === 'starting' ? '<div class="empty">Ready. Start a game and its FPS shows up here.</div>' : f.status === 'needs-admin' ? '<div class="empty">Frame capture needs admin rights.<div style="margin-top:8px">' + RW.fixButtons('admin') + '</div></div>' : pm && pm.state === 'downloading' ? '<div class="empty">Downloading PresentMon (one time)…</div>' : '<div class="empty">' + esc(f.msg || 'Frame capture unavailable') + '</div>');
  },
});
def('temps', {
  title: 'Temperatures', w: 4, h: 3,
  update(b, s, hd) {
    setH(hd, '<span class="muted" style="font-size:12px">' + esc(s.sensors.source || '') + '</span>');
    const win = RW.st && RW.st.platform === 'win32';
    if (!s.temps.length) { setH(b, '<div class="empty">' + (win ? 'Starting sensors…' : RW.st && RW.st.platform === 'darwin' ? 'macOS hides CPU/GPU temps without sudo.' : 'No hwmon sensors: install lm-sensors.') + '</div>'); return; }
    const fix = win && s.cpu.temp == null ? RW.fixButtons('cpu') : '';
    setH(b, (fix ? '<div class="brow"><span class="bl muted">CPU temperature</span><span class="bv">' + fix + '</span></div>' : '') + s.temps.slice(0, 10).map(t => { const lim = t.src === 'disk' ? [55, 65, 75] : t.hot ? [85, 95, 105] : [70, 80, 90]; const st = RW.tstat(t.value, lim); return RW.brow(esc(t.label), RW.tchip(t.value, lim), t.value, st && st[0] === 'good' ? '--s3' : st && st[0] === 'warn' ? '--s4' : '--s8'); }).join(''));
  },
});
def('latency', {
  title: 'Latency', w: 4, h: 3,
  mount(b) { b.innerHTML = chartbox('wc-ping', 80) + '<div id="wc-pings"></div>'; RW.chart('wc-ping', RW.preset('ping')); },
  update(b, s, hd) {
    const p = s.net.ping;
    setH(hd, '<span class="muted" style="font-size:12px">' + esc(p ? 'TCP → ' + p.target : 'off') + '</span>');
    setH('wc-pings', p ? RW.stats([['Now', F.ms(p.ms)], ['Avg', F.ms(p.avg)], ['Jitter', F.ms(p.jitter)], ['Loss', F.pct(p.loss)]]) : '');
  },
});
def('devservers', { title: 'Dev servers', w: 6, h: 3, update(b, s, hd) { setH(hd, '<a data-go="dev" class="muted" style="font-size:12px">dev tab →</a>'); setH(b, RW.devServers(s)); } });
def('ports', {
  title: 'Open ports', w: 6, h: 3,
  update(b, s, hd) {
    const P = s.ports, pm = RW.pidMap(s);
    const list = P.listen.filter(l => { const p = pm.get(l.pid); return l.proto === 'TCP' && l.pid > 4 && (!p || p.kind !== 'system'); });
    setH(hd, '<span class="muted" style="font-size:12px">' + P.listen.length + ' listening · ' + P.listen.filter(l => l.scope === 'all').length + ' exposed</span>');
    setH(b, '<div class="tw">' + RW.listenRows(s, list, true) + '</div>');
  },
});
def('timeline', {
  title: 'Live timeline', w: 6, h: 4,
  update(b, s, hd) {
    setH(hd, '<a data-go="timeline" class="muted" style="font-size:12px">all events →</a>');
    const ev = RW.events.filter(e => e.type !== 'proc.exit').slice(-40).reverse();
    setH(b, ev.length ? ev.map(RW.evRow).join('') : '<div class="empty">Events show up here: processes, ports, new hosts, alerts.</div>');
  },
});
def('heatmap', {
  title: 'Per-thread load (last 2 min)', w: 6, h: 4,
  mount(b) { b.innerHTML = '<div class="chartbox"><canvas class="chart" id="wc-heat"></canvas></div><div class="muted" style="font-size:11px;margin-top:4px">each row is a hardware thread · darker = busier</div>'; RW.heat(document.getElementById('wc-heat')); },
  update() {},
});
def('docker', {
  title: 'Containers', w: 6, h: 3,
  update(b, s, hd) {
    const d = s.docker;
    setH(hd, d.available && d.info ? '<span class="muted" style="font-size:12px">Docker ' + esc(d.info.version) + ' · ' + d.containers.filter(c => c.state === 'running').length + '/' + d.containers.length + ' running</span>' : '');
    if (!d.available) { setH(b, '<div class="empty">Docker / Podman not running.</div>'); return; }
    setH(b, '<div class="tw">' + RW.table('w-docker', [
      { k: 'name', label: 'Container', fmt: c => '<span class="pn">' + esc(c.name) + '</span><span class="sub">' + esc(c.image) + '</span>' },
      { k: 'state', label: 'State', fmt: c => '<span class="chip ' + (c.state === 'running' ? 'good' : c.state === 'paused' ? 'warn' : '') + '"><i></i>' + esc(c.state) + '</span>' },
      { k: 'cpu', label: 'CPU', num: true, fmt: c => (c.state === 'running' ? F.pct(c.cpu, 1) : '') },
      { k: 'mem', label: 'Mem', num: true, fmt: c => (c.state === 'running' ? F.b(c.mem, 0) : '') },
      { k: 'ports', label: 'Ports', nosort: true, fmt: c => RW.portLinks([...new Set(c.ports.filter(p => p.pub).map(p => p.pub))], 3) },
    ], d.containers, { sortK: 'state', sortD: -1 }) + '</div>');
  },
});
def('connections', {
  title: 'Who is talking to the network', w: 6, h: 3,
  update(b, s) {
    const by = new Map();
    for (const c of s.ports.conns) { if (/^(127\.|::1$)/.test(c.rh)) continue; const n = RW.pname(s, c.pid); const e = by.get(n) || { name: n, n: 0, hosts: new Set() }; e.n++; e.hosts.add(c.rh); by.set(n, e); }
    const a = [...by.values()].sort((x, y) => y.n - x.n).slice(0, 8); const mx = a[0] ? a[0].n : 1;
    setH(b, a.map(e => RW.brow(esc(e.name) + ' <span class="muted">' + e.hosts.size + ' hosts</span>', e.n + ' conns', 100 * e.n / mx, '--s1', 'data-go="network"')).join('') || '<div class="empty">no remote connections</div>');
  },
});
def('alerts', {
  title: 'Alerts', w: 4, h: 2,
  update(b, s, hd) {
    setH(hd, '<a data-go="alerts" class="muted" style="font-size:12px">rules →</a>');
    setH(b, s.alerts.firing.length ? s.alerts.firing.map(a => '<div class="brow"><span class="bl"><span class="chip crit"><i></i>firing</span> ' + esc(a.name) + '</span><span class="bv">' + esc(a.value) + '</span></div>').join('') : '<div class="empty" style="padding:10px">All quiet. No alert is firing.</div>');
  },
});
def('battery', { title: 'Battery', w: 3, h: 2, update(b, s) { setH(b, (s.battery || []).map(x => RW.brow(esc(x.name), x.pct + '%' + (x.charging ? ' · charging' : x.plugged ? ' · plugged in' : '') + (x.minutes ? ' · ' + F.age(x.minutes * 60) + ' left' : ''), x.pct, x.pct < 20 ? '--s8' : '--s3')).join('') || '<div class="empty">No battery.</div>'); } });
def('sysinfo', {
  title: 'This machine', w: 4, h: 3,
  update(b, s) {
    const inv = (RW.st && RW.st.inventory) || {};
    setH(b, RW.kv([['Host', esc(RW.st ? RW.st.hostname : '')], ['OS', esc(inv.os ? inv.os.caption + (inv.os.display ? ' ' + inv.os.display : '') : '')], ['CPU', esc(inv.cpu ? inv.cpu.name : '')], ['GPU', esc((inv.gpus || []).map(g => g.name).join(', '))], ['Memory', F.b(s.mem.total, 0)], ['Uptime', F.age(s.uptime)], ['Elevated', inv.isAdmin ? 'yes' : 'no']]));
  },
});

// ---------- grid ----------
const DEFAULT = [['kpis', 12, 2], ['cpu', 6, 4], ['gpu', 6, 4], ['memory', 4, 3], ['network', 4, 3], ['disk', 4, 3], ['topapps', 8, 4], ['security', 4, 4], ['fps', 4, 3], ['temps', 4, 3], ['latency', 4, 3], ['devservers', 6, 3], ['ports', 6, 3], ['timeline', 6, 4], ['heatmap', 6, 4], ['docker', 6, 3], ['connections', 6, 3]].map(([id, w, h]) => ({ id, w, h }));
const WIDTHS = [3, 4, 6, 8, 12];
let layout = RW.load('rw.layout', null);
if (!Array.isArray(layout) || !layout.length) layout = DEFAULT.map(x => Object.assign({}, x));
layout = layout.filter(x => W[x.id]);
const saveLayout = () => RW.store('rw.layout', layout);
let editing = false, dragId = null;

function buildDash(root) {
  root.innerHTML = '<div class="dash' + (editing ? ' editing' : '') + '" id="dash">' + layout.map(L => {
    const d = W[L.id];
    return '<section class="w' + (d.bare ? ' bare' : '') + (L.id === 'kpis' ? ' kpiw' : '') + '" data-wid="' + L.id + '" style="grid-column:span ' + L.w + ';grid-row:span ' + L.h + '"' + (editing ? ' draggable="true"' : '') + '>' +
      '<div class="wtools"><button data-wt="w-" title="Narrower">' + icon('minus') + '</button><button data-wt="w+" title="Wider">' + icon('plus') + '</button><button data-wt="h-" title="Shorter">↕</button><button data-wt="h+" title="Taller">⇳</button><button data-wt="rm" title="Remove">' + icon('x') + '</button></div>' +
      (d.bare ? '' : '<header><h2>' + esc(d.title) + '</h2><div class="right" id="wh-' + L.id + '"></div></header>') + '<div class="wb" id="wb-' + L.id + '"></div></section>';
  }).join('') + '</div>';
  for (const L of layout) { const d = W[L.id]; if (d.mount) d.mount(document.getElementById('wb-' + L.id)); }
  const dash = document.getElementById('dash');
  dash.addEventListener('dragstart', e => { const w = e.target.closest('.w'); if (!w || !editing) return; dragId = w.dataset.wid; w.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
  dash.addEventListener('dragend', e => { const w = e.target.closest('.w'); if (w) w.classList.remove('dragging'); RW.$$('.w.over', dash).forEach(x => x.classList.remove('over')); });
  dash.addEventListener('dragover', e => { if (!editing || !dragId) return; e.preventDefault(); const w = e.target.closest('.w'); RW.$$('.w.over', dash).forEach(x => x !== w && x.classList.remove('over')); if (w && w.dataset.wid !== dragId) w.classList.add('over'); });
  dash.addEventListener('drop', e => {
    e.preventDefault(); const w = e.target.closest('.w'); if (!w || !dragId || w.dataset.wid === dragId) return;
    const from = layout.findIndex(x => x.id === dragId), to = layout.findIndex(x => x.id === w.dataset.wid);
    const [it] = layout.splice(from, 1); layout.splice(to, 0, it); dragId = null; saveLayout(); buildDash(root); if (RW.snap) updateDash(RW.snap);
  });
  dash.addEventListener('click', e => {
    const b = e.target.closest('[data-wt]'); if (!b) return;
    const id = b.closest('.w').dataset.wid, L = layout.find(x => x.id === id), t = b.dataset.wt;
    if (t === 'rm') layout = layout.filter(x => x.id !== id);
    else if (t === 'w+' || t === 'w-') { const i = WIDTHS.indexOf(L.w); L.w = WIDTHS[Math.max(0, Math.min(WIDTHS.length - 1, (i < 0 ? 2 : i) + (t === 'w+' ? 1 : -1)))]; }
    else if (t === 'h+') L.h = Math.min(8, L.h + 1); else if (t === 'h-') L.h = Math.max(1, L.h - 1);
    saveLayout(); buildDash(root); if (RW.snap) updateDash(RW.snap);
  });
}
function updateDash(s) {
  for (const L of layout) {
    const d = W[L.id], b = document.getElementById('wb-' + L.id);
    if (!b) continue;
    try { d.update(b, s, document.getElementById('wh-' + L.id)); } catch (e) { console.error(L.id, e); }
  }
}
RW.pages.dashboard = {
  title: 'Dashboard', sub: 'everything at a glance',
  topExtra: () => (editing ? '<button class="btn sm" data-cmd="addwidget">' + icon('plus') + 'Add widget</button><button class="btn sm" data-cmd="resetlayout">Reset</button><button class="btn sm primary" data-cmd="editdash">Done</button>' : '<button class="btn sm ghost" data-cmd="editdash" title="Rearrange, resize, add or remove widgets (E)">' + icon('edit') + 'Customize</button>'),
  mount(root) { buildDash(root); },
  update(s) { updateDash(s); },
};
RW.dashCmd = cmd => {
  const root = document.getElementById('page');
  if (cmd === 'editdash') { editing = !editing; buildDash(root); if (RW.snap) updateDash(RW.snap); RW.renderTopActions(); }
  if (cmd === 'resetlayout') { layout = DEFAULT.map(x => Object.assign({}, x)); saveLayout(); buildDash(root); if (RW.snap) updateDash(RW.snap); }
  if (cmd === 'addwidget') {
    const avail = Object.values(W).filter(d => !layout.some(x => x.id === d.id));
    if (!avail.length) return RW.toast('Every widget is already on the dashboard.');
    const m = RW.modal({ title: 'Add widget', body: '<div class="pl">' + avail.map(d => '<div class="pi" data-add="' + d.id + '">' + icon('plus') + '<span>' + esc(d.title) + '</span><span class="ph">' + d.w + '×' + d.h + '</span></div>').join('') + '</div>' });
    m.el.addEventListener('click', e => { const it = e.target.closest('[data-add]'); if (!it) return; const d = W[it.dataset.add]; layout.push({ id: d.id, w: d.w, h: d.h }); saveLayout(); m.close(); buildDash(root); if (RW.snap) updateDash(RW.snap); });
  }
};
})();
