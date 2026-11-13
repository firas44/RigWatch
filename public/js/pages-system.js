'use strict';
/* Pages: Performance, Processes (+ process drawer), Sensors, System. */
(() => {
const { esc, f: F, icon, setH } = RW;

// ======================= Performance =======================
const PERF = [
  ['CPU', 'cpu'], ['GPU', 'gpu'], ['Memory', 'mem'], ['VRAM', 'vram'], ['Network throughput', 'net'], ['Packets', 'pkts'],
  ['Disk I/O', 'disk'], ['Temperatures', 'temp'], ['Game FPS', 'fps'], ['Ping', 'ping'], ['Packet loss', 'loss'], ['Open connections', 'conns'],
];
let perfTimer = null;
RW.pages.performance = {
  title: 'Performance', sub: 'history for every headline metric', ranges: true,
  topExtra: () => '<a class="btn sm ghost" href="/api/history?range=' + RW.prefs.range + '&format=csv" download>' + icon('download') + 'CSV</a>',
  mount(root) {
    root.innerHTML = '<div class="grid g2">' + PERF.map(([t, k]) => '<article class="card"><header><h2>' + esc(t) + '</h2><span class="right muted" id="pf-v-' + k + '"></span></header><div class="chartbox" style="min-height:170px"><canvas class="chart" id="pf-' + k + '"></canvas></div></article>').join('') +
      '<article class="card" style="grid-column:1/-1"><header><h2>Per-thread load</h2><span class="right muted">last 2 minutes, live</span></header><div class="chartbox" style="min-height:' + Math.max(120, (RW.coreHist.length || 8) * 9) + 'px"><canvas class="chart" id="pf-heat"></canvas></div></article></div>';
    for (const [, k] of PERF) RW.chart('pf-' + k, RW.preset(k, { range: true, xAxis: true }));
    RW.heat(document.getElementById('pf-heat'));
    const refresh = () => RW.loadRange(RW.prefs.range).then(() => RW.drawCharts()).catch(e => RW.toast(e.message, 'err'));
    this.onRange = () => { refresh(); RW.renderTopActions(); };
    RW.on('range', r => { if (RW.page === 'performance') this.onRange(r); });
    refresh();
    clearInterval(perfTimer); perfTimer = setInterval(() => { if (RW.page === 'performance' && RW.prefs.range !== '15m') refresh(); }, 30000);
  },
  unmount() { clearInterval(perfTimer); RW.remoteHist = null; },
  update(s) {
    const g = s.gpus[0], n = s.net;
    const v = { cpu: F.pct(s.cpu.util), gpu: g ? F.pct(g.util) : '', mem: F.b(s.mem.used, 1), vram: g ? F.b(g.vramUsed, 1) : '', net: '↓ ' + F.bits(n.rx) + ' ↑ ' + F.bits(n.tx), pkts: F.num(n.rxp + n.txp) + ' pkt/s', disk: '', temp: s.cpu.temp != null ? 'CPU ' + F.temp(s.cpu.temp) : 'no sensors', fps: s.fps.main ? Math.round(s.fps.main.fps) + ' fps' : '', ping: n.ping ? F.ms(n.ping.ms) : 'off', loss: n.ping ? F.pct(n.ping.loss) : '', conns: F.num(s.ports.total) };
    for (const k in v) setH('pf-v-' + k, esc(v[k]));
  },
};

// ======================= Processes =======================
const PCOLS = [
  { k: 'name', label: 'Name', fmt: p => '<span class="pn" title="' + esc(p.cmd || p.name) + '">' + (p._d ? '<span class="tree-i">' + '│ '.repeat(Math.max(0, p._d - 1)) + '├ ' + '</span>' : '') + esc(p.name) + '</span>' + RW.kindTag(p) + RW.flagTags(p) + (p.label && p.label !== p.name ? '<span class="sub">' + esc(p.label) + '</span>' : '') },
  { k: 'pid', label: 'PID', num: true },
  { k: 'user', label: 'User', fmt: p => '<span class="muted">' + esc(p.user || '') + '</span>', unix: true },
  { k: 'cpu', label: 'CPU', num: true, fmt: p => '<div class="cb">' + F.pct(p.cpu, 1) + RW.bar(p.cpu * (RW.st ? Math.min(4, RW.st.cores / 4) : 1), '--s1') + '</div>' },
  { k: 'mem', label: 'Memory', num: true, fmt: p => '<div class="cb">' + F.b(p.mem, 1) + RW.bar(400 * p.mem / ((RW.snap && RW.snap.mem.total) || 1), '--s3') + '</div>' },
  { k: 'gpu', label: 'GPU', num: true, fmt: p => (p.gpu > 0 ? F.pct(p.gpu, 1) : '<span class="faint">–</span>') },
  { k: 'vram', label: 'VRAM', num: true, fmt: p => (p.vram > 0 ? F.b(p.vram, 0) : '<span class="faint">–</span>') },
  { k: 'io', label: 'I/O', num: true, fmt: p => (p.io > 0 ? F.rate(p.io) : '<span class="faint">–</span>') },
  { k: 'thr', label: 'Threads', num: true, fmt: p => (p.thr ? F.num(p.thr) : '') },
  { k: 'prio', label: 'Priority', fmt: p => '<span class="muted">' + esc(p.prio || '') + '</span>' },
  { k: 'age', label: 'Uptime', num: true, fmt: p => F.age(p.age) },
  { k: 'ports', label: 'Ports', sort: p => (p.ports || []).length, fmt: p => (p.ports && p.ports.length ? RW.portLinks(p.ports, 3) : '') },
  { k: 'conns', label: 'Conns', num: true, fmt: p => (p.conns ? p.conns : '<span class="faint">–</span>') },
  { k: 'sig', label: 'Signature', sort: p => (p.sig ? p.sig.status : ''), fmt: p => (p.sig ? (p.sig.status === 'Valid' ? '<span class="muted" title="' + esc(p.sig.signer) + '">' + esc(p.sig.signer.slice(0, 26)) + '</span>' : '<span class="chip ' + (p.sig.status === 'NotSigned' ? 'warn' : 'crit') + '"><i></i>' + esc(p.sig.status) + '</span>') : ''), win: true },
];
const FILTERS = [['all', 'All'], ['apps', 'Apps'], ['dev', 'Dev'], ['game', 'Games'], ['gpu', 'GPU'], ['net', 'Network'], ['flagged', 'Flagged'], ['system', 'System']];
let pq = '';
function procMatch(p, f, q) {
  if (f === 'apps' && (p.kind === 'system' || p.kind === 'rigwatch' || p.kernel)) return false;
  if (f === 'dev' && !(RW.isDev(p) || p.kind === 'editor' || p.kind === 'shell')) return false;
  if (f === 'game' && !(p.kind === 'game' || p.kind === 'launcher' || p.fps > 0)) return false;
  if (f === 'gpu' && !(p.gpu > 0 || p.vram > 0)) return false;
  if (f === 'net' && !((p.ports && p.ports.length) || p.conns)) return false;
  if (f === 'flagged' && !((p.flags && p.flags.length) || p.state === 'suspended' || (p.sig && p.sig.status !== 'Valid'))) return false;
  if (f === 'system' && p.kind !== 'system') return false;
  if (!q) return true;
  for (const term of q.toLowerCase().split(/\s+/).filter(Boolean)) {
    let m;
    if ((m = term.match(/^(?:port:|:)(\d+)$/))) { if (!(p.ports || []).includes(+m[1])) return false; continue; }
    if ((m = term.match(/^pid:(\d+)$/))) { if (p.pid !== +m[1] && p.ppid !== +m[1]) return false; continue; }
    if ((m = term.match(/^kind:(\w+)$/))) { if (!(p.kind === m[1] || (m[1] === 'dev' && RW.isDev(p)))) return false; continue; }
    if ((m = term.match(/^user:(.+)$/))) { if (!String(p.user || '').toLowerCase().includes(m[1])) return false; continue; }
    if (!(p.name + ' ' + p.pid + ' ' + (p.label || '') + ' ' + (p.cmd || '') + ' ' + (p.project ? p.project.name : '')).toLowerCase().includes(term)) return false;
  }
  return true;
}
function treeOrder(list, all) {
  const byPid = new Map(all.map(p => [p.pid, p])), keep = new Set(list.map(p => p.pid));
  for (const p of list) { let c = byPid.get(p.ppid), i = 0; while (c && i++ < 64 && !keep.has(c.pid)) { keep.add(c.pid); c = byPid.get(c.ppid); } }
  const kids = new Map();
  for (const p of all) if (keep.has(p.pid)) { const parent = keep.has(p.ppid) && p.ppid !== p.pid ? p.ppid : 0; if (!kids.has(parent)) kids.set(parent, []); kids.get(parent).push(p); }
  const out = [], seen = new Set();
  const walk = (pid, d) => { for (const c of (kids.get(pid) || []).sort((a, b) => b.cpu - a.cpu || b.mem - a.mem)) { if (seen.has(c.pid)) continue; seen.add(c.pid); out.push(Object.assign({}, c, { _d: d })); walk(c.pid, d + 1); } };
  walk(0, 0);
  return out;
}
RW.pages.processes = {
  title: 'Processes', sub: 'every process with its CPU, memory, GPU, I/O and ports',
  keepOnParams: true,
  topExtra: () => '<a class="btn sm ghost" href="/api/export?what=processes&format=csv" download>' + icon('download') + 'CSV</a>',
  mount(root, params) {
    pq = params.q || '';
    root.innerHTML = '<article class="card"><div class="toolbar"><input type="search" id="pq" placeholder="Filter: name, pid, cmd · port:3000 · kind:dev · user:root" value="' + esc(pq) + '">' +
      '<div class="seg" id="pf">' + FILTERS.map(([k, l]) => '<button data-pf="' + k + '" class="' + (RW.prefs.procFilter === k ? 'on' : '') + '">' + l + '</button>').join('') + '</div>' +
      '<div class="seg" id="pv">' + [['table', 'Table'], ['tree', 'Tree'], ['apps', 'By app']].map(([k, l]) => '<button data-pv="' + k + '" class="' + (RW.prefs.procView === k ? 'on' : '') + '">' + l + '</button>').join('') + '</div><span class="grow"></span><span class="muted" id="pcount"></span></div><div class="tw" id="ptab"></div></article>';
    document.getElementById('pq').addEventListener('input', e => { pq = e.target.value.trim(); RW.renderAll(); });
    root.addEventListener('click', async e => {
      const ka = e.target.closest('[data-killapp]');
      if (ka) {
        e.stopPropagation();
        const name = ka.dataset.killapp, pids = (RW.snap.procs || []).filter(p => p.name === name && p.kind !== 'rigwatch').map(p => p.pid);
        if (!(await RW.confirm('End all ' + esc(name) + '?', pids.length + ' processes will be terminated.', { danger: true, ok: 'End all' }))) return;
        let ok = 0, fail = 0;
        for (const pid of pids) { try { await RW.action({ type: 'proc.kill', pid }, true); ok++; } catch { fail++; } }
        RW.toast('Ended ' + ok + ' of ' + pids.length + ' ' + name + ' processes' + (fail ? ' (' + fail + ' refused or already gone)' : ''), fail ? 'warn' : 'ok');
        return;
      }
      const f = e.target.closest('[data-pf]'); if (f) { RW.prefs.procFilter = f.dataset.pf; RW.savePrefs(); RW.$$('#pf button').forEach(b => b.classList.toggle('on', b === f)); RW.renderAll(); }
      const v = e.target.closest('[data-pv]'); if (v) { RW.prefs.procView = v.dataset.pv; RW.savePrefs(); RW.$$('#pv button').forEach(b => b.classList.toggle('on', b === v)); RW.renderAll(); }
    });
    if (params.pid) setTimeout(() => RW.openProc(+params.pid), 50);
  },
  onParams(params) { if (params.q != null) { pq = params.q; const i = document.getElementById('pq'); if (i) i.value = pq; } if (params.pid) RW.openProc(+params.pid); },
  update(s) {
    const win = RW.st && RW.st.platform === 'win32';
    const cols = PCOLS.filter(c => !(c.unix && win) && !(c.win && !win));
    const list = s.procs.filter(p => procMatch(p, RW.prefs.procFilter, pq));
    if (RW.prefs.procView === 'apps') {
      const g = RW.groupApps(list);
      setH('pcount', g.length + ' apps · ' + list.length + ' processes');
      setH('ptab', RW.table('papps', [
        { k: 'name', label: 'App', fmt: a => '<span class="pn">' + esc(a.name) + '</span>' + RW.kindTag(a) },
        { k: 'n', label: 'Processes', num: true },
        { k: 'cpu', label: 'CPU', num: true, fmt: a => '<div class="cb">' + F.pct(a.cpu, 1) + RW.bar(a.cpu * 2, '--s1') + '</div>' },
        { k: 'mem', label: 'Memory', num: true, fmt: a => '<div class="cb">' + F.b(a.mem, 1) + RW.bar(400 * a.mem / s.mem.total, '--s3') + '</div>' },
        { k: 'gpu', label: 'GPU', num: true, fmt: a => (a.gpu > 0 ? F.pct(a.gpu, 1) : '') },
        { k: 'vram', label: 'VRAM', num: true, fmt: a => (a.vram > 0 ? F.b(a.vram, 0) : '') },
        { k: 'io', label: 'I/O', num: true, fmt: a => (a.io > 0 ? F.rate(a.io) : '') },
        { k: 'conns', label: 'Conns', num: true },
        { k: 'ports', label: 'Ports', sort: a => a.ports.length, fmt: a => RW.portLinks(a.ports, 4) },
        { k: 'x', label: '', nosort: true, fmt: a => (RW.canControl() && a.kind !== 'system' ? '<button class="btn sm danger" data-killapp="' + esc(a.name) + '" title="End every ' + esc(a.name) + ' process">End all</button>' : '') },
      ], g, { sortK: 'cpu', row: a => 'class="click" data-q="' + esc(a.name) + '"' }));
      return;
    }
    setH('pcount', list.length + ' of ' + s.procs.length + ' processes');
    if (RW.prefs.procView === 'tree') {
      RW.sorts.ptree = { k: null, d: -1 };
      setH('ptab', RW.table('ptree', cols.map(c => Object.assign({}, c, { nosort: true })), treeOrder(list, s.procs), { row: p => 'class="click" data-pid="' + p.pid + '"', max: 3000 }));
    } else setH('ptab', RW.table('procs', cols, list, { sortK: 'cpu', row: p => 'class="click" data-pid="' + p.pid + '"', max: 2000 }));
  },
};

// ======================= Process drawer =======================
RW.openProc = pid => {
  pid = +pid;
  const H = { t: [], cpu: [], mem: [] };
  let detail = null, info = null, hash = null;
  const ctl = RW.canControl();
  RW.drawer.open('PID ' + pid, {
    mount(b) {
      b.innerHTML = '<div id="pd-head" style="margin-bottom:8px"></div><div class="actions" id="pd-act"></div>' +
        '<div class="grid g2" style="margin-bottom:12px"><div class="card" style="padding:10px 12px"><h3 style="margin:0 0 4px">CPU</h3><div class="chartbox" style="min-height:90px"><canvas class="chart" id="pd-cpu"></canvas></div></div><div class="card" style="padding:10px 12px"><h3 style="margin:0 0 4px">Memory</h3><div class="chartbox" style="min-height:90px"><canvas class="chart" id="pd-mem"></canvas></div></div></div><div id="pd-body"></div>';
      const src = k => () => ({ n: 180, t: H.t, s: [H[k]] });
      RW.chart('pd-cpu', { series: [{ k: 'cpu', c: '--s1', l: 'CPU' }], fmt: v => F.pct(v, 1), min: 5, src: src('cpu') });
      RW.chart('pd-mem', { series: [{ k: 'mem', c: '--s3', l: 'Memory' }], fmt: v => F.b(v, 0), min: 1048576, src: src('mem') });
      RW.api('/api/process?pid=' + pid).then(d => { detail = d; if (d.history) { H.t = d.history.t.slice(); H.cpu = d.history.cpu.slice(); H.mem = d.history.mem.slice(); } RW.drawer.update(RW.snap); }).catch(e => { detail = { error: e.message }; });
      RW.api('/api/procinfo?pid=' + pid).then(d => { info = d; }).catch(() => { info = {}; });
      b.addEventListener('click', async e => {
        const a = e.target.closest('[data-pa]'); if (!a) return;
        const p = RW.pidMap(RW.snap).get(pid) || {}, t = a.dataset.pa;
        if (t === 'kill' || t === 'tree') { if (await RW.confirm('End ' + p.name + '?', 'PID ' + pid + (t === 'tree' ? ' and all of its child processes' : '') + ' will be terminated. Unsaved work in it is lost.', { danger: true, ok: 'End process' })) RW.action({ type: 'proc.kill', pid, tree: t === 'tree' }); }
        if (t === 'suspend' || t === 'resume') RW.action({ type: 'proc.' + t, pid });
        if (t === 'reveal') RW.action({ type: 'proc.reveal', pid });
        if (t === 'hash') { a.disabled = true; try { const r = await RW.action({ type: 'proc.hash', pid }, true); hash = r.data; RW.drawer.update(RW.snap); } finally { a.disabled = false; } }
        if (t === 'fwblock') {
          if (await RW.confirm('Block ' + esc(p.name) + ' from the network?', 'Adds Windows Firewall rules (group "RigWatch") that block <b>' + esc(p.exe) + '</b> inbound and outbound. Undo it any time in Toolbox → Firewall blocks. Needs admin.', { danger: true, ok: 'Block' })) RW.tbAct({ op: 'fwblock', pid, on: true }).catch(() => {});
        }
        if (t === 'modules') {
          RW.api('/api/tb?what=modules&pid=' + pid).then(list => {
            RW.modal({ title: 'Loaded modules: ' + p.name + ' (' + list.length + ')', wide: true, body: '<div class="tw" style="max-height:60vh">' + RW.table('mods', [{ k: 'name', label: 'Module', fmt: m => '<b>' + esc(m.name) + '</b>' }, { k: 'company', label: 'Company', fmt: m => (m.company ? esc(m.company) : '<span class="chip warn"><i></i>no company</span>') }, { k: 'version', label: 'Version', fmt: m => '<span class="mono muted">' + esc(m.version || '') + '</span>' }, { k: 'path', label: 'Path', cls: 'wrap', fmt: m => '<span class="mono" style="font-size:11.5px">' + esc(m.path) + '</span>' }], list, { sortK: 'company', sortD: 1, max: 3000 }) + '</div>', actions: [{ label: 'Close' }] });
          }).catch(er => RW.toast(er.message, 'err', 7000));
        }
        if (t === 'copy') { navigator.clipboard && navigator.clipboard.writeText((detail && detail.cmd) || p.cmd || '').then(() => RW.toast('Command line copied')); }
        if (t === 'affinity') {
          const n = (RW.st && RW.st.cores) || 8;
          const cur = info && info.affinity ? BigInt(info.affinity) : (1n << BigInt(n)) - 1n;
          const m = RW.modal({ title: 'CPU affinity for ' + p.name, body: '<div class="muted">Pick the logical CPUs this process may run on.</div><div style="display:grid;grid-template-columns:repeat(8,1fr);gap:6px">' + Array.from({ length: n }, (_, i) => '<label class="check"><input type="checkbox" value="' + i + '"' + ((cur >> BigInt(i)) & 1n ? ' checked' : '') + '>' + i + '</label>').join('') + '</div>', actions: [{ label: 'Cancel' }, { label: 'Apply', primary: true, onClick: bd => { const cores = RW.$$('input:checked', bd).map(i => +i.value); RW.action({ type: 'proc.affinity', pid, cores }).then(() => RW.api('/api/procinfo?pid=' + pid).then(d => { info = d; })); } }] });
          void m;
        }
        if (t === 'killport') { const port = +a.dataset.port; if (await RW.confirm('Free port ' + port + '?', 'Ends ' + esc(p.name) + ' (and its children) which listens on ' + port + '.', { danger: true, ok: 'Kill' })) RW.action({ type: 'port.kill', port }); }
      });
      b.addEventListener('change', e => { if (e.target.id === 'pd-prio' && e.target.value) RW.action({ type: 'proc.priority', pid, level: e.target.value }).then(() => RW.api('/api/procinfo?pid=' + pid).then(d => { info = d; })); });
    },
    update(b, s) {
      const p = RW.pidMap(s).get(pid);
      if (!p) { setH('pd-head', '<div class="note"><b>This process has exited.</b></div>'); setH('pd-act', ''); return; }
      if (!H.t.length || H.t[H.t.length - 1] < s.t) { H.t.push(s.t); H.cpu.push(p.cpu); H.mem.push(p.mem); if (H.t.length > 180) { H.t.shift(); H.cpu.shift(); H.mem.shift(); } }
      document.getElementById('drawerTitle').textContent = p.name + ' · ' + pid;
      setH('pd-head', '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' + RW.kindTag(p) + RW.flagTags(p) + (p.label && p.label !== p.name ? '<b>' + esc(p.label) + '</b>' : '') + (p.project ? '<span class="chip info"><i></i>' + esc(p.project.name) + (p.project.branch ? ' · ' + esc(p.project.branch) : '') + '</span>' : '') + '</div>' +
        RW.stats([['CPU', F.pct(p.cpu, 1)], ['Memory', F.b(p.mem, 1)], ['GPU', p.gpu ? F.pct(p.gpu, 1) : null], ['VRAM', p.vram ? F.b(p.vram, 0) : null], ['I/O', F.rate(p.io)], ['Threads', p.thr ? F.num(p.thr) : null], ['Handles', p.hnd ? F.num(p.hnd) : null], ['Uptime', F.age(p.age)], ['Priority', esc(p.prio || '')], ['FPS', p.fps ? Math.round(p.fps) : null]]));
      const caps = (RW.st && RW.st.caps) || {};
      setH('pd-act', ctl ? '<button class="btn sm danger" data-pa="kill">' + icon('x') + 'End</button><button class="btn sm danger" data-pa="tree">End tree</button>' +
        (caps.suspend ? (p.state === 'suspended' ? '<button class="btn sm" data-pa="resume">' + icon('play') + 'Resume</button>' : '<button class="btn sm" data-pa="suspend">' + icon('pause') + 'Suspend</button>') : '') +
        (caps.priority ? '<select id="pd-prio" class="btn sm" title="Priority"><option value="">Priority…</option>' + ['idle', 'below', 'normal', 'above', 'high'].map(l => '<option value="' + l + '">' + l + (p.prio === l ? ' ✓' : '') + '</option>').join('') + '</select>' : '') +
        (caps.affinity ? '<button class="btn sm" data-pa="affinity">' + icon('cpu') + 'Affinity</button>' : '') +
        (p.exe ? '<button class="btn sm" data-pa="reveal">' + icon('folder') + 'Open location</button><button class="btn sm" data-pa="hash">' + icon('hash') + 'SHA-256</button>' : '') +
        (caps.signatures && p.exe ? '<button class="btn sm" data-pa="fwblock">' + icon('ban') + 'Block network</button>' : '') +
        '<button class="btn sm" data-pa="modules">' + icon('layers') + 'DLLs / libs</button>' +
        '<a class="btn sm ghost" href="https://www.google.com/search?q=' + encodeURIComponent('"' + p.name + (/\.exe$/i.test(p.exe || '') ? '.exe' : '') + '" process') + '" target="_blank" rel="noopener noreferrer">' + icon('search') + 'Search web</a>' +
        '<button class="btn sm" data-pa="copy">' + icon('copy') + 'Copy cmd</button>' + (p.ports || []).slice(0, 3).map(pt => '<button class="btn sm" data-pa="killport" data-port="' + pt + '">Free :' + pt + '</button>').join('')
        : '<span class="muted">Read-only on this device.</span>');
      const d = detail || {}, i = info || {};
      const conns = (s.ports.conns || []).filter(c => c.pid === pid);
      setH('pd-body', '<h3>Command</h3><div class="cmd">' + esc(d.cmd || p.cmd || '(hidden: system process, or run RigWatch elevated)') + '</div>' +
        '<h3>Details</h3>' + RW.kv([
          ['Executable', esc(p.exe || '')], ['Parent', d.parent ? '<a data-pid="' + p.ppid + '">' + esc(d.parent) + ' (' + p.ppid + ')</a>' : String(p.ppid)],
          ['Children', d.children && d.children.length ? d.children.slice(0, 20).map(c => '<a data-pid="' + c.pid + '">' + esc(c.name) + '</a>').join(', ') + (d.children.length > 20 ? ' …' : '') : ''],
          ['User', esc(i.user || p.user || '')], ['Company', esc(i.company || '')], ['Description', esc(i.description || '')], ['Version', esc(i.version || '')], ['Working dir', esc(i.cwd || '')],
          ['Open files', i.fds != null ? String(i.fds) : ''], ['Container', esc(i.container || '')], ['Modules', i.modules ? String(i.modules) : ''], ['Affinity', i.affinity ? 'mask 0x' + BigInt(i.affinity).toString(16) : ''],
          ['Signature', p.sig ? esc(p.sig.status + (p.sig.signer ? ' · ' + p.sig.signer : '')) : ''], ['Project', p.project ? esc(p.project.dir) : ''],
          ['SHA-256', hash ? '<code>' + esc(hash.sha256) + '</code><br><a href="' + esc(hash.virustotal) + '" target="_blank" rel="noopener noreferrer">look up on VirusTotal ' + icon('ext') + '</a> <span class="muted">(opens the hash page; the file is not uploaded)</span>' : ''],
        ]) +
        ((p.ports && p.ports.length) || conns.length ? '<h3>Network</h3>' + (p.ports.length ? '<div style="margin-bottom:8px">Listening: ' + RW.portLinks(p.ports, 20) + '</div>' : '') +
          (conns.length ? '<div class="tw">' + RW.table('pd-conns', [{ k: 'rh', label: 'Remote', fmt: c => '<span class="mono">' + esc(F.hp(c.rh, c.rp)) + '</span> <span class="muted">' + esc(RW.svc(c.rp) || '') + '</span>' }, { k: 'lp', label: 'Local port', num: true }, { k: 'state', label: 'State', fmt: c => esc(c.state.toLowerCase().replace(/_/g, ' ')) }], conns, { max: 200 }) + '</div>' : '') : ''));
    },
  });
};

// ======================= Sensors =======================
const SORDER = ['Temperature', 'Fan', 'Power', 'Clock', 'Load', 'Voltage', 'Control', 'Current', 'Data', 'SmallData', 'Throughput', 'Level', 'Factor', 'Frequency', 'Energy', 'Noise', 'TimeSpan'];
const fsv = (v, u) => { if (v == null || isNaN(v)) return '–'; if (u === 'B/s') return F.rate(v); const d = u === 'V' ? 3 : u === 'RPM' || u === 'MHz' ? 0 : Math.abs(v) < 10 ? 2 : 1; return (+v).toFixed(d) + (u ? ' ' + u : ''); };
// live history per sensor (kept in the browser, ~10 min)
const SH = RW.sensHist = new Map();
RW.on('snap', s => {
  for (const x of (s.sensors && s.sensors.list) || []) {
    let h = SH.get(x.id); if (!h) { h = { t: [], v: [] }; SH.set(x.id, h); }
    if (h.t.length && h.t[h.t.length - 1] >= s.t) continue;
    h.t.push(s.t); h.v.push(x.value == null ? null : x.value);
    if (h.t.length > 600) { h.t.shift(); h.v.shift(); }
  }
});
const STATIC_TYPES = new Set(['Timing', 'Data', 'SmallData', 'Factor', 'Level', 'TimeSpan', 'Energy']);
const PCT_TYPES = new Set(['Load', 'Control', 'Level']);
const LIMITS = /limit|resolution|warning|critical|threshold/i;
const histSrc = ids => () => {
  const hs = ids.map(id => SH.get(id) || { t: [], v: [] });
  const L = Math.max(2, ...hs.map(h => h.v.length));
  const longest = hs.reduce((a, h) => (h.t.length > a.length ? h.t : a), []);
  return { n: L, t: longest, s: hs.map(h => new Array(L - h.v.length).fill(null).concat(h.v)) };
};
const orderSeries = (type, items) => {
  let l = items.filter(x => !LIMITS.test(x.name));
  if (type === 'Fan') l = l.filter(x => x.value > 0).concat(l.filter(x => !(x.value > 0)));
  else if (type !== 'Temperature' && type !== 'Voltage') l = l.slice().sort((a, b) => (b.value || 0) - (a.value || 0));
  return l.concat(items.filter(x => LIMITS.test(x.name)));
};
const sval = x => (x.type === 'Temperature' ? RW.tchip(x.value) : esc(fsv(x.value, x.unit)));
let sview = RW.prefs.sensorView || 'graphs', sq = '', ssig = '';
const sidx = new Map();

RW.openSensor = id => {
  const find = s => ((s && s.sensors.list) || []).find(x => x.id === id);
  const x0 = find(RW.snap); if (!x0) return;
  RW.drawer.open(x0.hw + ' · ' + x0.name, {
    mount(b) {
      b.innerHTML = '<div id="sd-head" style="margin-bottom:10px"></div><div class="chartbox" style="min-height:280px"><canvas class="chart" id="sd-chart"></canvas></div><div id="sd-stats"></div>';
      RW.chart('sd-chart', { series: [{ k: id, c: '--s1', l: x0.name }], fmt: v => fsv(v, x0.unit), max: PCT_TYPES.has(x0.type) ? 100 : undefined, xAxis: true, src: histSrc([id]) });
    },
    update(b, s) {
      const x = find(s); if (!x) return;
      const v = ((SH.get(id) || {}).v || []).filter(n => n != null);
      const avg = v.length ? v.reduce((a, n) => a + n, 0) / v.length : null;
      setH('sd-head', '<div style="display:flex;gap:12px;align-items:baseline;flex-wrap:wrap"><span class="huge">' + sval(x) + '</span><span class="tag">' + esc(x.type) + '</span><span class="muted">' + esc(x.hw) + '</span></div>');
      setH('sd-stats', RW.stats([['Now', esc(fsv(x.value, x.unit))], ['Min (this view)', v.length ? esc(fsv(Math.min(...v), x.unit)) : ''], ['Max (this view)', v.length ? esc(fsv(Math.max(...v), x.unit)) : ''], ['Average', avg != null ? esc(fsv(avg, x.unit)) : ''], ['Min / max since start', esc(fsv(x.min, x.unit) + ' / ' + fsv(x.max, x.unit))], ['Samples', String(v.length)]]) + '<div class="muted mono" style="font-size:11px;margin-top:10px">' + esc(x.id) + '</div>');
    },
  });
};

RW.pages.sensors = {
  title: 'Sensors', sub: 'live graphs for every temperature, fan, power rail, clock and voltage',
  mount(root) {
    ssig = '';
    root.innerHTML = '<div class="toolbar"><div class="seg" id="sview">' + [['graphs', 'activity', 'Graphs'], ['table', 'list', 'Table']].map(([k, ic, l]) => '<button data-sv="' + k + '" class="' + (sview === k ? 'on' : '') + '" style="display:inline-flex;gap:6px;align-items:center">' + icon(ic) + l + '</button>').join('') + '</div><input type="search" id="sq" placeholder="Filter sensors: cpu, fan, vrm, hotspot…" value="' + esc(sq) + '"><span class="grow"></span><span class="muted" id="ssrc"></span></div><div id="sfix"></div><div id="sbody"></div><div id="sbat"></div>';
    root.addEventListener('click', e => {
      const v = e.target.closest('[data-sv]');
      if (v) { sview = v.dataset.sv; RW.prefs.sensorView = sview; RW.savePrefs(); RW.$$('#sview button').forEach(b => b.classList.toggle('on', b === v)); ssig = ''; RW.renderAll(); return; }
      const x = e.target.closest('[data-sensor]'); if (x) RW.openSensor(x.dataset.sensor);
    });
    root.addEventListener('input', e => { if (e.target.id === 'sq') { sq = e.target.value.trim().toLowerCase(); RW.renderAll(); } });
  },
  update(s) {
    const all = s.sensors.list || [];
    const list = sq ? all.filter(x => (x.hw + ' ' + x.name + ' ' + x.type).toLowerCase().includes(sq)) : all;
    const plat = RW.st ? RW.st.platform : '', lhm = s.status && s.status.tools && s.status.tools.lhm;
    setH('ssrc', esc((s.sensors.source || '') + (all.length ? ' · ' + all.length + ' sensors' : '')));
    let fix = '';
    if (!all.filter(x => x.hwType !== 'Acpi').length) {
      fix = plat === 'win32' ? '<div class="empty">' + (lhm && lhm.state === 'downloading' ? 'Downloading the sensor library (one time)…' : lhm && lhm.state === 'error' ? 'Sensor library download failed: ' + esc(lhm.err) : 'Starting the built-in sensor library…') + '</div>'
        : '<div class="note" style="margin-bottom:14px">' + (plat === 'linux' ? '<b>No hwmon sensors found.</b> Install <code>lm-sensors</code> and run <code>sudo sensors-detect</code> to load the right kernel modules (k10temp, coretemp, nct6775, it87...).' : '<b>macOS does not expose CPU/GPU temperatures without sudo.</b> GPU load, memory and battery temperature are shown where available.') + '</div>';
    } else if (plat === 'win32' && s.cpu.temp == null && RW.fixButtons('cpu')) {
      fix = '<div class="banner" style="margin:0 0 14px">' + icon('thermo') + '<span>' + (RW.st.canElevate ? 'CPU and motherboard sensors need admin rights.' : 'CPU and motherboard sensors need the PawnIO driver (one-time install).') + '</span><span class="spacer"></span>' + RW.fixButtons('cpu') + '</div>';
    }
    setH('sfix', fix);
    const sig = sview + '|' + list.map(x => x.id).join(',');
    if (sig !== ssig) { ssig = sig; this.build(list); }
    for (const x of list) {
      const i = sidx.get(x.id);
      const el = document.getElementById('sv' + i); if (el) { const h = sval(x); if (el.__h !== h) { el.innerHTML = h; el.__h = h; } }
      const mm = document.getElementById('sm' + i); if (mm) { const t = fsv(x.min, x.unit) + ' / ' + fsv(x.max, x.unit); if (mm.textContent !== t) mm.textContent = t; }
    }
    setH('sbat', (s.battery || []).length ? '<article class="card" style="margin-top:14px"><header><h2>Battery</h2></header>' + s.battery.map(x => RW.brow(esc(x.name), x.pct + '%' + (x.charging ? ' · charging' : '') + (x.minutes ? ' · ' + F.age(x.minutes * 60) + ' left' : ''), x.pct, '--s3')).join('') + '</article>' : '');
  },
  build(list) {
    sidx.clear(); list.forEach((x, i) => sidx.set(x.id, i));
    const hw = new Map(); for (const x of list) { if (!hw.has(x.hw)) hw.set(x.hw, []); hw.get(x.hw).push(x); }
    const charts = [];
    let g = 0, h = '<div class="sensor-grid" style="grid-template-columns:repeat(auto-fill,minmax(' + (sview === 'graphs' ? 460 : 380) + 'px,1fr))">';
    for (const [name, items] of hw) {
      const types = new Map(); for (const x of items) { if (!types.has(x.type)) types.set(x.type, []); types.get(x.type).push(x); }
      h += '<article class="card"><header><h2>' + esc(name) + '</h2><span class="right muted">' + esc(items[0].hwType || '') + '</span></header>';
      for (const [t, xs] of [...types].sort((a, b) => SORDER.indexOf(a[0]) - SORDER.indexOf(b[0]))) {
        h += '<div class="sgrp"><h3>' + esc(t) + ' <span class="faint" style="text-transform:none;letter-spacing:0">' + xs.length + '</span></h3>';
        if (sview === 'table') {
          h += xs.map(x => { const i = sidx.get(x.id); charts.push(['sp' + i, { spark: true, series: [{ k: x.id, c: '--s1', l: x.name }], fmt: v => fsv(v, x.unit), max: PCT_TYPES.has(x.type) ? 100 : undefined, src: histSrc([x.id]) }]); return '<div class="srow" data-sensor="' + esc(x.id) + '"><span class="sn" title="' + esc(x.name) + '">' + esc(x.name) + '</span><canvas class="spark-row" id="sp' + i + '"></canvas><span class="sv" id="sv' + i + '"></span><span class="sm" id="sm' + i + '" title="min / max"></span></div>'; }).join('');
        } else if (STATIC_TYPES.has(t)) {
          h += '<div class="kchips">' + xs.map(x => '<span class="kchip" data-sensor="' + esc(x.id) + '">' + esc(x.name) + ' <b id="sv' + sidx.get(x.id) + '"></b></span>').join('') + '</div>';
        } else {
          const ord = orderSeries(t, xs), series = ord.filter(x => !LIMITS.test(x.name)).slice(0, 8);
          const cid = 'sc' + (g++);
          charts.push([cid, { series: series.map((x, j) => ({ k: x.id, c: '--s' + (j + 1), l: x.name })), legend: false, fmt: v => fsv(v, xs[0].unit), max: PCT_TYPES.has(t) ? 100 : undefined, min: t === 'Temperature' ? 50 : t === 'Fan' ? 500 : undefined, src: histSrc(series.map(x => x.id)) }]);
          h += '<div class="chartbox" style="min-height:' + (xs.length > 4 ? 150 : 120) + 'px"><canvas class="chart" id="' + cid + '"></canvas></div><div class="kchips" style="margin-top:6px">' +
            ord.map(x => { const j = series.indexOf(x); return '<span class="kchip" data-sensor="' + esc(x.id) + '" title="click to zoom">' + (j >= 0 ? '<i style="width:10px;height:3px;border-radius:2px;display:inline-block;background:var(--s' + (j + 1) + ');align-self:center"></i>' : '') + esc(x.name) + ' <b id="sv' + sidx.get(x.id) + '"></b></span>'; }).join('') + '</div>';
        }
        h += '</div>';
      }
      h += '</article>';
    }
    h += '</div>';
    const body = document.getElementById('sbody');
    body.innerHTML = list.length ? h : ''; body.__h = null;
    for (const [id, o] of charts) RW.chart(id, o);
    RW.drawCharts();
  },
};

// ======================= System =======================
RW.pages.system = {
  title: 'System', sub: 'hardware, collectors, settings, access and API',
  mount(root) {
    root.innerHTML = '<div class="grid g2"><article class="card"><header><h2>Hardware</h2></header><div id="sy-hw"></div></article><article class="card"><header><h2>Operating system & RigWatch</h2></header><div id="sy-os"></div></article>' +
      '<article class="card"><header><h2>Collectors</h2><span class="right"><button class="btn sm" id="sy-diag" title="Copies versions and collector status (no host name, user name or paths) for a bug report">' + icon('copy') + 'Copy diagnostics</button></span></header><div id="sy-col"></div></article><article class="card"><header><h2>Settings</h2></header><div id="sy-set"></div></article>' +
      '<article class="card"><header><h2>Access</h2></header><div id="sy-acc"></div></article><article class="card"><header><h2>Admin & helpers</h2></header><div id="sy-setup"></div></article>' +
      '<article class="card"><header><h2>Keyboard</h2></header><div id="sy-keys"></div></article><article class="card"><header><h2>API</h2><span class="right muted">build your own overlays & bots</span></header><div id="sy-api"></div></article></div>';
    root.querySelector('.grid').insertAdjacentHTML('afterbegin', '<article class="card" style="grid-column:1/-1"><header><h2>Appearance & units</h2><span class="right muted">saved in this browser</span></header><div style="display:flex;gap:28px;flex-wrap:wrap;align-items:center">' +
      '<div><div class="muted" style="font-size:12px;margin-bottom:6px">Theme</div><div class="seg"><button data-ap="theme:dark" class="' + (RW.prefs.theme === 'dark' ? 'on' : '') + '">Dark</button><button data-ap="theme:light" class="' + (RW.prefs.theme === 'light' ? 'on' : '') + '">Light</button></div></div>' +
      '<div><div class="muted" style="font-size:12px;margin-bottom:6px">Accent</div><div class="swatches">' + Object.entries(RW.ACCENTS).map(([k, v]) => '<button data-ap="accent:' + k + '" title="' + k + '" class="' + ((RW.prefs.accent || 'blue') === k ? 'on' : '') + '" style="background:' + v[0] + '"></button>').join('') + '</div></div>' +
      '<div><div class="muted" style="font-size:12px;margin-bottom:6px">Network speed</div><div class="seg"><button data-ap="net:bits" class="' + (!RW.prefs.netBytes ? 'on' : '') + '">Mb/s (bits)</button><button data-ap="net:bytes" class="' + (RW.prefs.netBytes ? 'on' : '') + '">MB/s (bytes)</button></div></div>' +
      '<div><div class="muted" style="font-size:12px;margin-bottom:6px">Density</div><div class="seg"><button data-ap="density:comfy" class="' + (!RW.prefs.compact ? 'on' : '') + '">Comfortable</button><button data-ap="density:compact" class="' + (RW.prefs.compact ? 'on' : '') + '">Compact</button></div></div>' +
      '<div><div class="muted" style="font-size:12px;margin-bottom:6px">Overlay for OBS / 2nd screen</div><a class="btn sm" href="/overlay" target="_blank" rel="noopener">' + icon('ext') + 'Open /overlay</a></div></div></article>');
    root.addEventListener('click', e => {
      if (e.target.closest('#sy-diag')) {
        fetch('/api/diagnostics').then(r => r.text()).then(t => (navigator.clipboard ? navigator.clipboard.writeText('```json\n' + t + '\n```') : Promise.reject(new Error('clipboard unavailable')))).then(() => RW.toast('Diagnostics copied. Paste them into your GitHub issue.', 'ok', 6000)).catch(er => RW.toast(er.message, 'err'));
        return;
      }
      const b = e.target.closest('[data-ap]'); if (!b) return;
      const [k, v] = b.dataset.ap.split(':');
      if (k === 'theme') RW.applyTheme(v);
      if (k === 'accent') { RW.prefs.accent = v; RW.savePrefs(); RW.applyAppearance(); RW.emit('theme'); }
      if (k === 'net') { RW.prefs.netBytes = v === 'bytes'; RW.savePrefs(); RW.renderAll(); }
      if (k === 'density') { RW.prefs.compact = v === 'compact'; RW.savePrefs(); RW.applyAppearance(); setTimeout(RW.drawCharts, 30); }
      RW.$$('[data-ap^="' + k + ':"]', root).forEach(x => x.classList.toggle('on', x === b));
    });
    root.addEventListener('change', async e => {
      const k = e.target.dataset.setting; if (!k) return;
      try { const r = await RW.api('/api/settings', { method: 'PUT', body: { [k]: e.target.checked } }); RW.settings = r.settings; RW.toast('Saved', 'ok'); } catch (er) { RW.toast(er.message, 'err'); e.target.checked = !e.target.checked; }
    });
  },
  update(s) {
    const st = RW.st || {}, inv = st.inventory || {}, o = inv.os || {};
    setH('sy-hw', RW.kv([['CPU', esc(inv.cpu ? inv.cpu.name : '')], ['Cores / threads', inv.cpu ? (inv.cpu.cores || '?') + ' / ' + (inv.cpu.threads || '?') : ''], ['Max clock', inv.cpu && inv.cpu.maxMhz ? F.ghz(inv.cpu.maxMhz) : ''], ['Cache', inv.cpu && inv.cpu.l3Kb ? 'L2 ' + F.b(inv.cpu.l2Kb * 1024, 0) + ' · L3 ' + F.b(inv.cpu.l3Kb * 1024, 0) : ''], ['Virtualization', inv.cpu && inv.cpu.virt != null ? (inv.cpu.virt ? 'enabled' : 'disabled in firmware') : ''], ['Memory', F.b(st.totalMem, 1)]]
      .concat((inv.ram || []).map(r => ['  ' + r.slot, esc(F.b(r.bytes, 0) + ' ' + r.maker + ' ' + r.part + ' @ ' + r.mhz + ' MT/s')]))
      .concat((inv.gpus || []).map(g => ['GPU', esc(g.name + (g.vram ? ' · ' + F.b(g.vram, 0) : ''))]))
      .concat((inv.video || []).filter(v => v.hz).map(v => ['Display', esc(v.w + '×' + v.h + ' @ ' + v.hz + ' Hz (' + v.name + ', driver ' + v.driver + ')')]))
      .concat([['Board', inv.board ? esc(inv.board.manufacturer + ' ' + inv.board.product) : ''], ['BIOS', inv.bios ? esc(inv.bios.version + (inv.bios.dateMs ? ' (' + new Date(inv.bios.dateMs).toLocaleDateString() + ')' : '')) : ''], ['System', inv.system ? esc((inv.system.manufacturer || '') + ' ' + (inv.system.model || '')) : ''], ['Secure Boot', inv.secureBoot == null ? '' : inv.secureBoot ? 'on' : 'off']])));
    setH('sy-os', RW.kv([['OS', esc((o.caption || '') + (o.display ? ' ' + o.display : ''))], ['Build', esc(o.build ? o.build + (o.ubr ? '.' + o.ubr : '') : o.version || '')], ['Kernel', esc(o.kernel || '')], ['Booted', F.date(o.bootMs)], ['Uptime', F.age(s.uptime)], ['Hostname', esc(st.hostname)], ['Elevated', inv.isAdmin ? 'yes' : 'no'], ['RigWatch', esc('v' + st.version + ' · PID ' + st.pid + ' · ' + st.bind + ' · every ' + st.interval + ' ms')], ['Node.js', esc(st.node)], ['Data dir', '<code>' + esc(st.home) + '</code>' + (st.persist ? '' : ' (persistence off)')]]));
    setH('sy-col', '<table class="t"><tbody>' + s.status.collectors.map(c => '<tr><td>' + esc(c.name) + (c.err ? '<div class="muted" style="font-size:12px;white-space:normal">' + esc(c.err) + '</div>' : '') + '</td><td class="n"><span class="chip ' + (c.ok ? 'good' : c.optional ? '' : 'warn') + '"><i></i>' + esc(c.detail || (c.ok ? 'ok' : 'off')) + '</span></td></tr>').join('') + '</tbody></table>');
    const ss = RW.settings || {};
    setH('sy-set', [['resolveHostnames', 'Reverse-resolve remote IPs in the connections table'], ['procEvents', 'Record process start/exit in the timeline'], ['hostEvents', 'Record first contact with new remote hosts'], ['healthChecks', 'HTTP health-check dev servers every 10 s']].map(([k, l]) => '<label class="check" style="display:flex;margin:8px 0"><input type="checkbox" data-setting="' + k + '"' + (ss[k] ? ' checked' : '') + (RW.canControl() ? '' : ' disabled') + '>' + esc(l) + '</label>').join(''));
    const a = RW.auth || {};
    setH('sy-acc', RW.kv([['This device', a.control ? 'full control' : 'read-only'], ['Listening on', '<code>' + esc(st.bind) + '</code>']]) + (a.local ? (a.lanUrl && a.lanUrl.length ? '<h3>Control from your phone / another PC</h3><div class="muted" style="margin-bottom:6px">Open once on that device; it remembers a cookie. Treat it like a password.</div>' + a.lanUrl.map(u => '<div class="cmd" style="margin-bottom:6px">' + esc(u) + '</div>').join('') : '<div class="note" style="margin-top:10px">Only this machine can reach the dashboard. Start with <code>HOST=0.0.0.0</code> to open it to your LAN: other devices get read-only, and the token URL shown here unlocks control.</div>') : ''));
    if (st.platform === 'win32') {
      const T = s.status.tools || {};
      setH('sy-setup', RW.kv([
        ['Administrator', inv.isAdmin ? '<span class="chip good"><i></i>yes: everything unlocked</span>' : '<span class="chip warn"><i></i>no</span> ' + RW.fixButtons('admin')],
        ['Sensor library', T.lhm ? '<span class="chip ' + (T.lhm.state === 'ready' ? 'good' : T.lhm.state === 'error' ? 'crit' : '') + '"><i></i>' + esc(T.lhm.state) + '</span> <span class="muted">LibreHardwareMonitor 0.9.6, built in</span>' : ''],
        ['CPU / board driver', s.status.pawnio ? '<span class="chip good"><i></i>PawnIO installed</span>' : s.status.pawnio === false ? '<span class="chip warn"><i></i>not installed</span> ' + RW.fixButtons('cpu') : '<span class="muted">checking…</span>'],
        ['Frame capture', T.presentmon ? '<span class="chip ' + (s.fps.status === 'running' ? 'good' : 'warn') + '"><i></i>' + esc(s.fps.status) + '</span> <span class="muted">PresentMon 2.6.0</span>' : ''],
      ]) + '<div class="muted" style="font-size:12px;margin-top:10px">Helpers are downloaded automatically on first run from their official releases and verified by SHA-256. Set <code>NO_DOWNLOAD=1</code> to disable, <code>--no-elevate</code> to skip the admin prompt.</div>');
    } else setH('sy-setup', '<div class="note"><ol>' + (st.platform === 'linux' ? '<li><b>Temps</b>: <code>sudo sensors-detect</code> (lm-sensors).</li><li><b>All sockets with owners</b>: run as root (otherwise only your own processes show a PID).</li><li><b>Docker</b>: add yourself to the <code>docker</code> group.</li>' : '<li><b>Sockets of all users</b>: run with sudo.</li><li>Temperatures need SMC access, which RigWatch does not use.</li>') + '<li><b>NVIDIA</b>: anything with <code>nvidia-smi</code> on PATH is picked up automatically.</li><li><b>Docker / Podman</b>: detected on the default socket or <code>DOCKER_HOST</code>.</li></ol></div>');
    setH('sy-keys', RW.kv([['Ctrl K', 'command palette'], ['1 – 9', 'jump to a page'], ['/', 'filter processes'], ['P', 'pause / resume'], ['T', 'toggle theme'], ['E', 'customize dashboard'], ['[', 'collapse sidebar'], ['Esc', 'close drawer / dialog']]));
    const API = [['GET /api/stream', 'SSE: hello, history, snap, events, job, alert, siem'], ['GET /api/snapshot', 'everything, as JSON'], ['GET /api/history?range=24h', 'metric history (&format=csv)'], ['GET /api/timeline', 'events (&format=csv)'], ['GET /api/process?pid=', 'one process in depth'], ['GET /api/netinfo', 'ARP, routes, DNS, firewall, Wi-Fi'], ['GET /api/security', 'findings + posture'], ['POST /api/action', 'kill, suspend, priority, services, docker'], ['POST /api/jobs', 'run a Net Lab tool'], ['GET /api/siem/overview?range=7d', 'SIEM summary: severities, modules, top rules'], ['GET /api/siem/events?q=level>=10', 'security events (q: ip: user: rule: group: mitre: level>=)'], ['GET /api/siem/facets?module=auth', 'counts per field + histogram for a module'], ['GET /api/siem/export?format=csv', 'export events (csv or json)'], ['POST /api/siem/block', 'block an IP or range ({ip, minutes, reason})'], ['GET /overlay', 'compact page for OBS or a second screen']];
    setH('sy-api', RW.kv(API.map(([k, v]) => [k, esc(v)])));
  },
};
})();
