'use strict';
/* Pages: Dev & Containers, Services & Startup, Alerts, Timeline. */
(() => {
const { esc, f: F, icon, setH } = RW;
const RT_COL = { node: '--s6', python: '--s4', java: '--s2', dotnet: '--s7', ruby: '--s8', php: '--s7', go: '--s3', bun: '--s5', deno: '--s3', db: '--s1', server: '--s3', container: '--s1', ai: '--s5', tool: '--s4' };
const rtOf = p => { const n = p.name.toLowerCase(); if (p.kind !== 'runtime') return p.kind; if (/^(node|nodejs)$/.test(n)) return 'node'; if (/^py|python/.test(n)) return 'python'; if (/^java/.test(n)) return 'java'; return n.replace(/w$/, ''); };

// logs viewer for docker containers (streams a job into a modal)
RW.showLogs = async (id, name) => {
  let job;
  try { job = await RW.tool('dockerlogs', { id, name, tail: 300 }); } catch (e) { return RW.toast(e.message, 'err'); }
  const m = RW.modal({ title: 'Logs: ' + name, wide: true, body: '<div class="term" id="logterm" style="height:60vh"></div>', actions: [{ label: 'Close' }] });
  const draw = jid => { if (jid !== job.id) return; const j = RW.jobs.get(job.id), t = document.getElementById('logterm'); if (!j || !t) return; const atB = t.scrollHeight - t.scrollTop - t.clientHeight < 40; t.innerHTML = j.lines.slice(-3000).map(l => '<span class="' + esc(l.cls) + '">' + esc(l.text) + '</span>').join('\n'); if (atB) t.scrollTop = t.scrollHeight; };
  RW.on('job', draw);
  const obs = new MutationObserver(() => { if (!document.body.contains(m.el)) { obs.disconnect(); RW.api('/api/jobs/' + job.id + '/cancel', { method: 'POST' }).catch(() => {}); } });
  obs.observe(document.getElementById('modalRoot'), { childList: true });
};
RW.inspectContainer = async (id, name) => {
  try {
    const j = await RW.api('/api/docker/inspect?id=' + encodeURIComponent(id));
    RW.drawer.open(name, { mount(b) {
      b.innerHTML = RW.kv([['Image', esc(j.image)], ['Command', '<span class="mono">' + esc(j.cmd) + '</span>'], ['Status', esc(j.state ? j.state.Status + (j.state.StartedAt ? ' since ' + new Date(j.state.StartedAt).toLocaleString() : '') : '')], ['Restart policy', esc(j.restart ? j.restart.Name : '')], ['User', esc(j.user)], ['Privileged', j.privileged ? '<span class="chip crit"><i></i>yes</span>' : 'no'], ['Capabilities added', esc((j.capAdd || []).join(', '))], ['Network mode', esc(j.networkMode)], ['Workdir', esc(j.workdir)]]) +
        '<h3>Networks</h3>' + RW.kv(j.networks.map(n => [n.name, '<span class="mono">' + esc(n.ip + ' via ' + n.gw) + '</span>'])) +
        '<h3>Ports</h3><div class="cmd">' + esc(Object.entries(j.ports || {}).map(([k, v]) => k + ' → ' + (v ? v.map(x => x.HostIp + ':' + x.HostPort).join(', ') : 'not published')).join('\n') || 'none') + '</div>' +
        '<h3>Mounts</h3><div class="cmd">' + esc(j.mounts.map(x => x.type + '  ' + x.src + ' → ' + x.dst + (x.rw ? '' : ' (ro)')).join('\n') || 'none') + '</div>' +
        '<h3>Environment</h3><div class="muted" style="font-size:12px;margin-bottom:4px">values are hidden</div><div class="cmd">' + esc(j.env.join('\n') || 'none') + '</div>';
    } });
  } catch (e) { RW.toast(e.message, 'err'); }
};

// ======================= Dev & Containers =======================
let devData = null, devTimer = null;
RW.pages.dev = {
  title: 'Dev & Containers', sub: 'dev servers, runtimes, Docker, WSL and your toolchain',
  mount(root) {
    root.innerHTML = '<div class="grid g4" id="dv-sum"></div><article class="card" style="margin-bottom:14px"><header><h2>Dev servers & runtimes</h2><span class="right muted">health-checked every 10 s · click a card for details</span></header><div class="devgrid" id="dv-grid"></div></article>' +
      '<article class="card" style="margin-bottom:14px"><header><h2>Containers</h2><span class="right muted" id="dv-dk"></span></header><div class="tw" id="dv-c"></div></article>' +
      '<div class="grid g3"><article class="card"><header><h2>WSL</h2></header><div id="dv-wsl"></div></article><article class="card"><header><h2>Toolchain</h2></header><div id="dv-tc"></div></article><article class="card"><header><h2>Editors & shells</h2></header><div id="dv-ed"></div></article></div>';
    const load = () => RW.api('/api/dev').then(d => { devData = d; RW.renderAll(); }).catch(() => {});
    load(); clearInterval(devTimer); devTimer = setInterval(() => { if (RW.page === 'dev') load(); }, 15000);
    root.addEventListener('click', async e => {
      const d = e.target.closest('[data-dk]');
      if (d) {
        e.stopPropagation();
        const { dk: act, id, name } = d.dataset;
        if (act === 'logs') return RW.showLogs(id, name);
        if (act === 'inspect') return RW.inspectContainer(id, name);
        if ((act === 'stop' || act === 'kill') && !(await RW.confirm(act + ' ' + name + '?', 'The container will be ' + (act === 'kill' ? 'killed immediately.' : 'stopped gracefully.'), { danger: true, ok: act }))) return;
        d.disabled = true; RW.action({ type: 'docker', id, action: act }).finally(() => { d.disabled = false; });
      }
      const w = e.target.closest('[data-wsl]');
      if (w && await RW.confirm(w.dataset.wsl === 'shutdown' ? 'Shut down WSL?' : 'Terminate ' + w.dataset.name + '?', 'Running Linux processes in ' + (w.dataset.wsl === 'shutdown' ? 'every distro' : 'it') + ' will stop.', { danger: true, ok: 'Do it' })) RW.action({ type: 'wsl', name: w.dataset.name, action: w.dataset.wsl }).then(() => RW.api('/api/dev').then(x => { devData = x; }));
      const k = e.target.closest('[data-killdev]');
      if (k) { e.stopPropagation(); if (await RW.confirm('Stop ' + k.dataset.name + '?', 'Ends PID ' + k.dataset.killdev + ' and its children.', { danger: true, ok: 'Stop' })) RW.action({ type: 'proc.kill', pid: +k.dataset.killdev, tree: true }); }
    });
  },
  unmount() { clearInterval(devTimer); },
  update(s) {
    const dev = s.procs.filter(RW.isDev), H = (s.dev && s.dev.health) || {};
    const by = new Map(); for (const p of dev) { const r = rtOf(p); const e = by.get(r) || { n: 0, mem: 0, cpu: 0 }; e.n++; e.mem += p.mem; e.cpu += p.cpu; by.set(r, e); }
    setH('dv-sum', [...by].sort((a, b) => b[1].mem - a[1].mem).slice(0, 4).map(([r, e]) => '<div class="kpi" style="cursor:default"><div class="kl"><span class="rt"><i style="background:var(' + (RT_COL[r] || '--s1') + ')"></i>' + esc(r) + '</span></div><div class="kv2">' + e.n + '<small>' + (e.n === 1 ? 'process' : 'processes') + '</small></div><div class="ks">' + F.b(e.mem, 1) + ' · ' + F.pct(e.cpu, 1) + ' CPU</div></div>').join('') || '<div class="kpi" style="grid-column:1/-1;cursor:default"><div class="ks">No node, python, java, dotnet, databases or containers running right now.</div></div>');
    dev.sort((a, b) => (b.ports.length ? 1 : 0) - (a.ports.length ? 1 : 0) || b.mem - a.mem);
    setH('dv-grid', dev.length ? dev.slice(0, 60).map(p => { const r = rtOf(p); return '<div class="devc click" data-pid="' + p.pid + '" style="cursor:pointer"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="rt"><i style="background:var(' + (RT_COL[r] || '--s1') + ')"></i>' + esc(r) + '</span><span class="muted" style="font-size:12px">PID ' + p.pid + ' · up ' + F.age(p.age) + '</span></div>' +
      '<div class="dl" title="' + esc(p.cmd) + '">' + esc(p.label || p.name) + '</div>' + (p.project ? '<div class="dm">' + icon('folder') + '<b>' + esc(p.project.name) + '</b>' + (p.project.branch ? '<span class="chip info"><i></i>' + esc(p.project.branch) + '</span>' : '') + (p.project.version ? '<span class="muted">v' + esc(p.project.version) + '</span>' : '') + '</div>' : '') +
      '<div class="dm"><span>CPU <b>' + F.pct(p.cpu, 1) + '</b></span><span>RAM <b>' + F.b(p.mem, 1) + '</b></span>' + (p.io > 0 ? '<span>I/O <b>' + F.rate(p.io) + '</b></span>' : '') + (p.conns ? '<span>' + p.conns + ' conns</span>' : '') + '</div>' + RW.bar(p.cpu * 4, '--s1') +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">' + (p.ports.length ? '<span class="plinks">' + p.ports.slice(0, 4).map(pt => '<a class="plink" href="http://localhost:' + pt + '" target="_blank" rel="noopener noreferrer">:' + pt + '</a>' + RW.healthChip(H[pt])).join(' ') + '</span>' : '<span class="muted" style="font-size:12px">no listening port</span>') + (RW.canControl() ? '<button class="btn sm danger" data-killdev="' + p.pid + '" data-name="' + esc(p.label || p.name) + '">Stop</button>' : '') + '</div></div>'; }).join('') : '<div class="empty">Nothing dev-ish running. Start <code>npm run dev</code>, a Python server or a database and it appears here.</div>');
    const d = s.docker;
    setH('dv-dk', d.available && d.info ? esc('Docker ' + d.info.version + ' · ' + d.info.os + ' · ' + d.info.images + ' images') : '');
    const ctl = RW.canControl();
    setH('dv-c', !d.available ? '<div class="empty">Docker / Podman is not running (or not reachable on its default socket / DOCKER_HOST).</div>' : RW.table('dockerc', [
      { k: 'name', label: 'Container', fmt: c => '<span class="pn">' + esc(c.name) + '</span><span class="sub">' + esc(c.image) + '</span>' + (c.compose ? '<span class="tag">' + esc(c.compose) + '</span>' : '') },
      { k: 'state', label: 'State', fmt: c => '<span class="chip ' + (c.state === 'running' ? 'good' : c.state === 'paused' ? 'warn' : c.state === 'exited' ? '' : 'crit') + '"><i></i>' + esc(c.state) + '</span><div class="muted" style="font-size:11px">' + esc(c.status) + '</div>' },
      { k: 'cpu', label: 'CPU', num: true, fmt: c => (c.state === 'running' ? F.pct(c.cpu, 1) : '') },
      { k: 'mem', label: 'Memory', num: true, fmt: c => (c.state === 'running' ? F.b(c.mem, 0) + (c.memLimit ? '<div class="muted" style="font-size:11px">of ' + F.b(c.memLimit, 0) + '</div>' : '') : '') },
      { k: 'rx', label: 'Net ↓/↑', num: true, fmt: c => (c.state === 'running' ? F.rate(c.rx) + ' / ' + F.rate(c.tx) : '') },
      { k: 'pids', label: 'PIDs', num: true, fmt: c => (c.pids || '') },
      { k: 'ports', label: 'Ports', nosort: true, fmt: c => RW.portLinks([...new Set(c.ports.filter(p => p.pub).map(p => p.pub))], 4) },
      { k: 'x', label: '', nosort: true, fmt: c => '<span style="display:inline-flex;gap:4px">' + (ctl ? (c.state === 'running' ? '<button class="btn sm" data-dk="restart" data-id="' + c.id + '" data-name="' + esc(c.name) + '">restart</button><button class="btn sm" data-dk="pause" data-id="' + c.id + '" data-name="' + esc(c.name) + '">pause</button><button class="btn sm danger" data-dk="stop" data-id="' + c.id + '" data-name="' + esc(c.name) + '">stop</button>' : c.state === 'paused' ? '<button class="btn sm" data-dk="unpause" data-id="' + c.id + '" data-name="' + esc(c.name) + '">unpause</button>' : '<button class="btn sm" data-dk="start" data-id="' + c.id + '" data-name="' + esc(c.name) + '">start</button>') : '') + '<button class="btn sm" data-dk="logs" data-id="' + c.id + '" data-name="' + esc(c.name) + '">logs</button><button class="btn sm ghost" data-dk="inspect" data-id="' + c.id + '" data-name="' + esc(c.name) + '">inspect</button></span>' },
    ], d.containers, { sortK: 'state', sortD: -1 }));
    const wsl = (devData && devData.wsl) || (s.dev && s.dev.wsl);
    setH('dv-wsl', !RW.st || RW.st.platform !== 'win32' ? '<div class="empty">WSL is Windows-only.</div>' : !wsl ? '<div class="empty">checking…</div>' : !wsl.installed ? '<div class="empty">WSL is not installed.</div>' : (wsl.distros.map(x => '<div class="brow"><span class="bl"><b>' + esc(x.name) + '</b>' + (x.default ? ' <span class="tag">default</span>' : '') + ' <span class="muted">WSL ' + x.version + '</span></span><span class="bv"><span class="chip ' + (x.state === 'Running' ? 'good' : '') + '"><i></i>' + esc(x.state) + '</span>' + (ctl && x.state === 'Running' ? ' <button class="btn sm" data-wsl="terminate" data-name="' + esc(x.name) + '">terminate</button>' : '') + '</span></div>').join('') || '<div class="empty">No distros.</div>') + (ctl && wsl.distros.some(x => x.state === 'Running') ? '<div style="margin-top:10px"><button class="btn sm danger" data-wsl="shutdown" data-name="">Shut down WSL (frees vmmem)</button></div>' : ''));
    setH('dv-tc', devData && devData.toolchain ? devData.toolchain.map(t => '<div class="brow"><span class="bl"><b>' + esc(t.name) + '</b></span><span class="bv mono" title="' + esc(t.path) + '">' + esc(t.version) + '</span></div>').join('') : '<div class="empty">detecting…</div>');
    const ed = RW.groupApps(s.procs.filter(p => p.kind === 'editor' || p.kind === 'shell')).sort((a, b) => b.mem - a.mem);
    setH('dv-ed', ed.length ? ed.map(a => RW.brow(esc(a.name) + ' <span class="muted">×' + a.n + '</span>', F.b(a.mem, 1) + ' · ' + F.pct(a.cpu, 1), 100 * a.mem / ed[0].mem, '--s3', 'data-q="' + esc(a.name) + '"')).join('') : '<div class="empty">No editors or terminals detected.</div>');
  },
};

// ======================= Services & Startup =======================
let svc = [], startup = null, svcTab = 'services', svcQ = '', svcState = 'all', svcTimer = null;
const loadSvc = fresh => RW.api('/api/services' + (fresh ? '?fresh=1' : '')).then(l => { svc = l; RW.renderAll(); }).catch(e => { svc = []; RW.toast(e.message, 'err'); });
RW.pages.services = {
  title: 'Services & Startup', sub: 'start, stop and restart services; see what launches at boot',
  mount(root) {
    root.innerHTML = '<article class="card"><div class="toolbar"><div class="seg" id="svtab"><button data-svtab="services" class="' + (svcTab === 'services' ? 'on' : '') + '">Services</button><button data-svtab="startup" class="' + (svcTab === 'startup' ? 'on' : '') + '">Startup items</button></div><input type="search" id="svq" placeholder="Filter" value="' + esc(svcQ) + '"><div class="seg" id="svst">' + [['all', 'All'], ['running', 'Running'], ['stopped', 'Stopped'], ['auto', 'Auto-start'], ['failed', 'Failed']].map(([k, l]) => '<button data-svst="' + k + '" class="' + (svcState === k ? 'on' : '') + '">' + l + '</button>').join('') + '</div><span class="grow"></span><span class="muted" id="svc-n"></span></div><div class="tw" id="svbody" style="max-height:calc(100vh - 210px)"><div class="empty">loading…</div></div></article>';
    loadSvc(); clearInterval(svcTimer); svcTimer = setInterval(() => { if (RW.page === 'services' && svcTab === 'services') loadSvc(); }, 10000);
    root.addEventListener('input', e => { if (e.target.id === 'svq') { svcQ = e.target.value.trim().toLowerCase(); this.draw(); } });
    root.addEventListener('click', async e => {
      const t = e.target.closest('[data-svtab]'); if (t) { svcTab = t.dataset.svtab; RW.$$('#svtab button').forEach(b => b.classList.toggle('on', b === t)); document.getElementById('svst').style.display = svcTab === 'services' ? '' : 'none'; if (svcTab === 'startup' && !startup) RW.api('/api/startup').then(l => { startup = l; this.draw(); }).catch(er => RW.toast(er.message, 'err')); this.draw(); }
      const st = e.target.closest('[data-svst]'); if (st) { svcState = st.dataset.svst; RW.$$('#svst button').forEach(b => b.classList.toggle('on', b === st)); this.draw(); }
      const a = e.target.closest('[data-svc]');
      if (a) {
        e.stopPropagation();
        const name = a.dataset.name, act = a.dataset.svc;
        if (act !== 'start' && !(await RW.confirm(act + ' ' + name + '?', 'Changing services usually needs an elevated RigWatch. Stopping system services can break things until reboot.', { danger: true, ok: act }))) return;
        a.disabled = true;
        RW.action({ type: 'service', name, action: act }).then(() => loadSvc(true)).catch(() => {}).finally(() => { a.disabled = false; });
      }
    });
  },
  unmount() { clearInterval(svcTimer); },
  draw() {
    if (svcTab === 'startup') {
      const l = (startup || []).filter(x => !svcQ || (x.name + ' ' + x.cmd + ' ' + x.location).toLowerCase().includes(svcQ));
      setH('svc-n', l.length + ' items');
      setH('svbody', startup ? RW.table('startup', [{ k: 'name', label: 'Name', fmt: x => '<b>' + esc(x.name) + '</b>' }, { k: 'kind', label: 'Type', fmt: x => '<span class="tag">' + esc(x.kind) + '</span>' }, { k: 'cmd', label: 'Command', cls: 'wrap mono', fmt: x => esc(x.cmd) }, { k: 'location', label: 'Location', cls: 'wrap', fmt: x => '<span class="muted">' + esc(x.location) + '</span>' }, { k: 'user', label: 'User' }], l, { sortK: 'name', sortD: 1 }) : '<div class="empty">loading…</div>');
      return;
    }
    const ctl = RW.canControl();
    const l = svc.filter(x => {
      const st = String(x.state).toLowerCase();
      if (svcState === 'running' && st !== 'running') return false;
      if (svcState === 'stopped' && st === 'running') return false;
      if (svcState === 'auto' && !/auto|enabled/i.test(x.start)) return false;
      if (svcState === 'failed' && !/fail/i.test(x.state + x.sub)) return false;
      return !svcQ || (x.name + ' ' + x.display + ' ' + (x.desc || '')).toLowerCase().includes(svcQ);
    });
    setH('svc-n', l.length + ' of ' + svc.length + ' · ' + svc.filter(x => /running/i.test(x.state)).length + ' running');
    setH('svbody', RW.table('svcs', [
      { k: 'display', label: 'Service', fmt: x => '<b>' + esc(x.display) + '</b>' + (x.display !== x.name ? '<span class="sub mono">' + esc(x.name) + '</span>' : '') + (x.desc && x.desc !== x.display ? '<div class="muted" style="font-size:12px;white-space:normal;max-width:620px">' + esc(x.desc) + '</div>' : '') },
      { k: 'state', label: 'State', fmt: x => '<span class="chip ' + (/running/i.test(x.state) ? 'good' : /fail/i.test(x.state) ? 'crit' : '') + '"><i></i>' + esc(x.state) + '</span>' },
      { k: 'start', label: 'Start', fmt: x => '<span class="muted">' + esc(x.start || '') + '</span>' },
      { k: 'pid', label: 'PID', num: true, fmt: x => (x.pid ? '<a data-pid="' + x.pid + '">' + x.pid + '</a>' : '') },
      { k: 'user', label: 'Account', fmt: x => '<span class="muted">' + esc(x.user || '') + '</span>' },
      { k: 'x', label: '', nosort: true, fmt: x => (ctl ? (/running/i.test(x.state) ? '<button class="btn sm" data-svc="restart" data-name="' + esc(x.name) + '">restart</button> <button class="btn sm danger" data-svc="stop" data-name="' + esc(x.name) + '">stop</button>' : '<button class="btn sm" data-svc="start" data-name="' + esc(x.name) + '">start</button>') : '') },
    ], l, { sortK: 'display', sortD: 1, max: 1500 }));
  },
  update() { this.draw(); },
};

// ======================= Alerts =======================
let rules = null, metrics = {}, dirty = false;
const loadRules = () => RW.api('/api/alerts').then(r => { rules = r.rules; metrics = r.metrics; dirty = false; RW.pages.alerts.draw(); }).catch(e => RW.toast(e.message, 'err'));
RW.pages.alerts = {
  title: 'Alerts', sub: 'threshold rules, browser notifications and webhooks',
  mount(root) {
    const ctl = RW.canControl(), w = RW.webhook || {};
    root.innerHTML = '<article class="card" style="margin-bottom:14px"><header><h2>Rules</h2><span class="right"><button class="btn sm" id="ar-add"' + (ctl ? '' : ' disabled') + '>' + icon('plus') + 'Add rule</button><button class="btn sm primary" id="ar-save"' + (ctl ? '' : ' disabled') + '>Save</button></span></header><div class="tw" id="ar-t"><div class="empty">loading…</div></div></article>' +
      '<div class="grid g2"><article class="card"><header><h2>Delivery</h2></header>' +
      '<label class="check" style="display:flex;margin:4px 0 12px"><input type="checkbox" id="ar-notify"' + (RW.prefs.notify ? ' checked' : '') + '>Browser notifications on this device</label>' +
      '<h3>Webhook (Discord, Slack or JSON)</h3><div class="form"><label class="field" style="flex:3">URL<input type="url" id="wh-url" placeholder="https://discord.com/api/webhooks/…" value="' + esc(w.url || '') + '"' + (ctl ? '' : ' disabled') + '></label><label class="field">Format<select id="wh-fmt"' + (ctl ? '' : ' disabled') + '>' + ['discord', 'slack', 'json'].map(f => '<option' + (w.format === f ? ' selected' : '') + '>' + f + '</option>').join('') + '</select></label></div>' +
      '<div style="display:flex;gap:8px;align-items:center"><label class="check"><input type="checkbox" id="wh-on"' + (w.enabled ? ' checked' : '') + (ctl ? '' : ' disabled') + '>enabled</label><span class="grow" style="flex:1"></span><button class="btn sm" id="wh-test"' + (ctl ? '' : ' disabled') + '>Send test</button><button class="btn sm primary" id="wh-save"' + (ctl ? '' : ' disabled') + '>Save webhook</button></div><div class="muted" style="font-size:12px;margin-top:8px">A rule only uses the webhook when its "webhook" box is ticked. Nothing leaves this machine otherwise.</div></article>' +
      '<article class="card"><header><h2>Alert history</h2></header><div id="ar-h" style="max-height:360px;overflow:auto"></div></article></div>';
    loadRules();
    const $ = s => root.querySelector(s);
    $('#ar-add').onclick = () => { rules.push({ id: 'rule-' + Date.now(), name: 'New rule', metric: 'cpu', target: '', op: '>', value: 90, forSec: 10, cooldownSec: 300, enabled: true, webhook: false }); dirty = true; this.draw(); };
    $('#ar-save').onclick = () => { this.collect(); RW.api('/api/alerts', { method: 'PUT', body: { rules } }).then(r => { rules = r.rules; dirty = false; this.draw(); RW.toast('Rules saved', 'ok'); }).catch(e => RW.toast(e.message, 'err')); };
    $('#ar-notify').onchange = async e => {
      if (e.target.checked && 'Notification' in window && Notification.permission !== 'granted') { const p = await Notification.requestPermission(); if (p !== 'granted') { e.target.checked = false; RW.toast('Notifications were blocked by the browser', 'err'); return; } }
      RW.prefs.notify = e.target.checked; RW.savePrefs();
    };
    $('#wh-save').onclick = () => RW.api('/api/webhook', { method: 'PUT', body: { url: $('#wh-url').value.trim(), format: $('#wh-fmt').value, enabled: $('#wh-on').checked } }).then(() => { RW.webhook = { url: $('#wh-url').value.trim(), format: $('#wh-fmt').value, enabled: $('#wh-on').checked }; RW.toast('Webhook saved', 'ok'); }).catch(e => RW.toast(e.message, 'err'));
    $('#wh-test').onclick = () => RW.api('/api/webhook/test', { method: 'POST' }).then(r => RW.toast(r.msg || 'sent', 'ok')).catch(e => RW.toast(e.message, 'err'));
    root.addEventListener('click', e => { const d = e.target.closest('[data-rmrule]'); if (d) { this.collect(); rules.splice(+d.dataset.rmrule, 1); dirty = true; this.draw(); } });
    root.addEventListener('input', e => { if (e.target.closest('#ar-t')) dirty = true; });
    root.addEventListener('change', e => { if (e.target.closest('#ar-t')) { dirty = true; if (e.target.name === 'metric') { this.collect(); this.draw(); } } });
  },
  collect() {
    RW.$$('#ar-t tr[data-i]').forEach(tr => {
      const r = rules[+tr.dataset.i]; if (!r) return;
      const v = n => tr.querySelector('[name="' + n + '"]');
      r.enabled = v('enabled').checked; r.name = v('name').value; r.metric = v('metric').value; r.target = v('target') ? v('target').value : ''; r.op = v('op').value; r.value = +v('value').value; r.forSec = +v('forSec').value; r.webhook = v('webhook').checked;
    });
  },
  draw() {
    if (!rules) return;
    const ctl = RW.canControl() ? '' : ' disabled';
    setH('ar-t', '<table class="t"><thead><tr><th>On</th><th>Name</th><th>Metric</th><th>Target</th><th>Condition</th><th>For (s)</th><th>Now</th><th>Webhook</th><th></th></tr></thead><tbody>' + rules.map((r, i) => {
      const m = metrics[r.metric] || {};
      return '<tr data-i="' + i + '"><td><input type="checkbox" name="enabled"' + (r.enabled ? ' checked' : '') + ctl + '></td><td><input type="text" name="name" value="' + esc(r.name) + '" style="width:190px"' + ctl + '></td>' +
        '<td><select name="metric"' + ctl + '>' + Object.entries(metrics).map(([k, x]) => '<option value="' + k + '"' + (k === r.metric ? ' selected' : '') + '>' + esc(x.label) + '</option>').join('') + '</select></td>' +
        '<td>' + (m.target ? '<input type="text" name="target" value="' + esc(r.target || '') + '" placeholder="' + esc(m.target) + '" style="width:130px"' + ctl + '>' : '<span class="faint">–</span>') + '</td>' +
        '<td style="white-space:nowrap"><select name="op"' + ctl + '><option' + (r.op === '>' ? ' selected' : '') + '>&gt;</option><option' + (r.op === '<' ? ' selected' : '') + '>&lt;</option></select> <input type="number" name="value" value="' + r.value + '" style="width:80px"' + ctl + '> <span class="muted">' + esc(m.unit || '') + '</span></td>' +
        '<td><input type="number" name="forSec" value="' + r.forSec + '" style="width:70px"' + ctl + '></td>' +
        '<td class="num">' + (r.state ? (r.state.firing ? '<span class="chip crit"><i></i>' + esc(r.state.value) + '</span>' : '<span class="muted">' + esc(r.state.value == null ? '–' : r.state.value) + '</span>') : '') + '</td>' +
        '<td><input type="checkbox" name="webhook"' + (r.webhook ? ' checked' : '') + ctl + '></td><td>' + (RW.canControl() ? '<button class="icon-btn" data-rmrule="' + i + '" title="Delete">' + icon('trash') + '</button>' : '') + '</td></tr>';
    }).join('') + '</tbody></table>' + (dirty ? '<div class="muted" style="padding:8px">Unsaved changes.</div>' : ''));
  },
  update(s) {
    if (!dirty && rules && s.seq % 5 === 0) RW.api('/api/alerts').then(r => { if (!dirty) { rules = r.rules; this.draw(); } }).catch(() => {});
    const h = RW.events.filter(e => e.type.startsWith('alert')).slice(-60).reverse();
    setH('ar-h', h.length ? h.map(RW.evRow).join('') : '<div class="empty">No alerts have fired yet.</div>');
  },
};

// ======================= Timeline =======================
const TTYPES = [['proc', 'Processes'], ['port', 'Ports'], ['net', 'New hosts'], ['finding', 'Security'], ['alert', 'Alerts'], ['action', 'Actions'], ['lan', 'LAN'], ['system', 'System']];
let tlTypes = new Set(TTYPES.map(t => t[0])), tlQ = '', tlSev = 'all', tlLoaded = false;
RW.pages.timeline = {
  title: 'Timeline', sub: 'everything that changed, newest first (kept on disk)',
  topExtra: () => '<a class="btn sm ghost" href="/api/timeline?limit=5000&format=csv" download>' + icon('download') + 'CSV</a>',
  mount(root) {
    root.innerHTML = '<article class="card"><div class="toolbar"><input type="search" id="tlq" placeholder="Search events" value="' + esc(tlQ) + '"><div class="seg" id="tlt">' + TTYPES.map(([k, l]) => '<button data-tlt="' + k + '" class="' + (tlTypes.has(k) ? 'on' : '') + '">' + l + '</button>').join('') + '</div><div class="seg" id="tls">' + [['all', 'All'], ['warn', 'Warnings'], ['alert', 'Critical']].map(([k, l]) => '<button data-tls="' + k + '" class="' + (tlSev === k ? 'on' : '') + '">' + l + '</button>').join('') + '</div><span class="grow"></span><span class="muted" id="tln"></span></div><div id="tlb"></div></article>';
    if (!tlLoaded) RW.api('/api/timeline?limit=3000').then(list => { const ids = new Set(RW.events.map(e => e.id)); RW.events = list.reverse().filter(e => !ids.has(e.id)).concat(RW.events).sort((a, b) => a.id - b.id); tlLoaded = true; this.draw(); }).catch(() => {});
    root.addEventListener('input', e => { if (e.target.id === 'tlq') { tlQ = e.target.value.trim().toLowerCase(); this.draw(); } });
    root.addEventListener('click', e => {
      const t = e.target.closest('[data-tlt]'); if (t) { const k = t.dataset.tlt; if (e.shiftKey || e.ctrlKey) { tlTypes = new Set([k]); } else if (tlTypes.has(k)) tlTypes.delete(k); else tlTypes.add(k); RW.$$('#tlt button').forEach(b => b.classList.toggle('on', tlTypes.has(b.dataset.tlt))); this.draw(); }
      const s = e.target.closest('[data-tls]'); if (s) { tlSev = s.dataset.tls; RW.$$('#tls button').forEach(b => b.classList.toggle('on', b === s)); this.draw(); }
    });
    if (!this.bound) { RW.on('events', () => { if (RW.page === 'timeline') this.draw(); }); this.bound = true; }
    this.draw();
  },
  draw() {
    const l = RW.events.filter(e => tlTypes.has(e.type.split('.')[0]) && (tlSev === 'all' || (tlSev === 'warn' ? e.sev !== 'info' : e.sev === 'alert')) && (!tlQ || (e.title + ' ' + (e.detail || '') + ' ' + (e.name || '')).toLowerCase().includes(tlQ)));
    setH('tln', l.length + ' events');
    let day = '';
    setH('tlb', l.slice(-600).reverse().map(e => { const d = new Date(e.t).toDateString(); const sep = d !== day ? '<h3>' + esc((day = d) === new Date().toDateString() ? 'Today' : d) + '</h3>' : ''; return sep + RW.evRow(e); }).join('') || '<div class="empty">No events match.</div>');
  },
  update() {},
};
})();
