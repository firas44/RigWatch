'use strict';
/* Toolbox page (Windows power tools) + elevation / driver helpers used across the UI. */
(() => {
const { esc, f: F, icon, setH } = RW;
const WIN = () => RW.st && RW.st.platform === 'win32';
const tb = (what, q) => RW.api('/api/tb?what=' + what + (q ? '&' + new URLSearchParams(q) : ''));
const tbAct = async (body, quiet) => { try { const r = await RW.api('/api/tb', { method: 'POST', body }); if (!quiet) RW.toast(r.msg, 'ok', 6000); return r; } catch (e) { RW.toast(e.message, 'err', 8000); throw e; } };
RW.tbAct = tbAct;

// ---------- elevation / PawnIO one-click helpers ----------
RW.fixButtons = need => {
  if (!WIN() || !RW.auth || !RW.auth.local) return '';
  const s = RW.snap && RW.snap.status;
  const b = [];
  if ((need === 'admin' || need === 'cpu') && RW.st.canElevate) b.push('<button class="btn sm primary" data-cmd="elevate">' + icon('shield') + 'Restart as admin</button>');
  if (need === 'cpu' && !RW.st.canElevate && s && s.pawnio === false) b.push('<button class="btn sm primary" data-cmd="pawnio">' + icon('zap') + 'Enable CPU & board sensors</button>');
  return b.join(' ');
};
RW.elevate = async () => {
  if (!(await RW.confirm('Restart RigWatch as administrator?', 'Windows will show a UAC prompt. RigWatch restarts in a minimized window with full sensors, FPS capture, service control and firewall tools. This page reconnects by itself.', { ok: 'Restart as admin' }))) return;
  try { const r = await RW.api('/api/elevate', { method: 'POST' }); RW.toast(r.msg + ' Approve the Windows prompt.', 'ok', 9000); } catch (e) { RW.toast(e.message, 'err', 8000); }
};
RW.pawnio = async () => {
  if (!(await RW.confirm('Enable CPU and motherboard sensors?', 'CPU temperatures, CPU power and Super I/O fans need the <b>PawnIO</b> driver (signed by its author, the driver LibreHardwareMonitor uses). RigWatch downloads the official 2.2.0 installer (SHA-256 verified) and opens it. Click Install, and sensors restart automatically.', { ok: 'Download & open installer' }))) return;
  try { const r = await RW.api('/api/pawnio', { method: 'POST' }); RW.toast(r.msg, 'ok', 10000); } catch (e) { RW.toast(e.message, 'err', 8000); }
};

// ---------- toolbox page ----------
const TABS = [['quick', 'Quick actions'], ['events', 'Event logs'], ['apps', 'Installed apps'], ['startup', 'Startup & tasks'], ['devices', 'Devices & drivers'], ['updates', 'Updates'], ['hosts', 'Hosts file'], ['env', 'Environment & PATH'], ['du', 'Disk usage'], ['firewall', 'Firewall blocks']];
const TOOL_NAMES = { taskmgr: 'Task Manager', devmgmt: 'Device Manager', eventvwr: 'Event Viewer', services: 'Services', resmon: 'Resource Monitor', perfmon: 'Performance Monitor', firewall: 'Firewall (advanced)', network: 'Network adapters', programs: 'Programs & Features', sysprops: 'System properties', diskmgmt: 'Disk Management', compmgmt: 'Computer Management', regedit: 'Registry Editor', msinfo: 'System Information', power: 'Power options', sound: 'Sound', tasksched: 'Task Scheduler', gpedit: 'Group Policy', cmd: 'Command Prompt', powershell: 'PowerShell' };
const SEC_IDS = { 4625: 'Failed sign-in', 4740: 'Account locked out', 4720: 'User account created', 4726: 'User account deleted', 4732: 'Added to a local group', 4728: 'Added to a global group', 4756: 'Added to a universal group', 1102: 'Security log cleared', 4697: 'Service installed', 4719: 'Audit policy changed', 4648: 'Sign-in with explicit credentials', 7045: 'New service installed', 104: 'Event log cleared', 6008: 'Unexpected shutdown', 41: 'Kernel power loss (crash/hard reset)', 1116: 'Defender: malware detected', 1117: 'Defender: action taken', 5001: 'Defender: real-time protection disabled', 5010: 'Defender: scanning disabled', 5012: 'Defender: virus scanning disabled', 1006: 'Defender: malware found', 1015: 'Defender: suspicious behavior', 1149: 'RDP sign-in accepted', 4104: 'Suspicious PowerShell script block' };
const DEV_CODES = { 1: 'not configured correctly', 3: 'driver may be corrupted', 10: 'cannot start', 12: 'not enough free resources', 14: 'needs a restart', 18: 'reinstall the drivers', 19: 'registry problem', 21: 'being removed', 22: 'disabled', 24: 'not present / not working', 28: 'drivers not installed', 31: 'not working properly', 37: 'driver failed to initialize', 39: 'driver missing or corrupted', 43: 'stopped: reported problems', 45: 'not connected', 47: 'safely removed', 48: 'driver blocked', 52: 'driver signature not verified' };
let tab = 'quick', data = {}, loading = {}, evq = { log: 'System', level: 'warn', hours: '24' }, appQ = '', tasksAll = false, duJob = null, duDir = '';
const load = (key, fn) => { if (loading[key]) return; loading[key] = true; fn().then(d => { data[key] = d; }).catch(e => { data[key] = { error: e.message }; }).finally(() => { loading[key] = false; RW.pages.toolbox.draw(); }); };
const errBox = d => (d && d.error ? '<div class="note">' + esc(d.error) + (/admin|denied|privilege/i.test(d.error) ? ' ' + RW.fixButtons('admin') : '') + '</div>' : '');
const ctl = () => RW.canControl();

RW.pages.toolbox = {
  title: 'Toolbox', sub: 'Windows power tools: quick fixes, logs, apps, startup, drivers, hosts, PATH, disk usage, firewall', keepOnParams: true,
  mount(root, params) {
    tab = params.tab || tab;
    root.innerHTML = '<div class="toolbar"><div class="seg" id="tbtabs" style="flex-wrap:wrap">' + TABS.map(([k, l]) => '<button data-tbt="' + k + '" class="' + (tab === k ? 'on' : '') + '">' + l + '</button>').join('') + '</div></div><div id="tbb"></div>';
    this.open(tab);
    root.addEventListener('click', e => this.click(e));
    root.addEventListener('change', e => this.change(e));
    root.addEventListener('input', e => { if (e.target.id === 'appq') { appQ = e.target.value.trim().toLowerCase(); this.draw(); } });
    if (!this.bound) { RW.on('job', id => { if (RW.page === 'toolbox' && id === duJob) this.draw(); }); this.bound = true; }
  },
  onParams(p) { if (p.tab) this.open(p.tab); },
  open(t) {
    tab = t; RW.$$('#tbtabs button').forEach(b => b.classList.toggle('on', b.dataset.tbt === t));
    if (t === 'quick') { load('overview', () => tb('overview')); load('temp', () => tb('temp')); }
    if (t === 'events') load('events', () => (evq.log === 'Security' ? tb('secevents', { hours: evq.hours }) : tb('events', evq)));
    if (t === 'apps') load('apps', () => tb('apps'));
    if (t === 'startup') { load('startup', () => RW.api('/api/startup')); load('tasks', () => tb('tasks', { all: tasksAll ? '1' : '0' })); }
    if (t === 'devices') { load('devices', () => tb('devices')); load('drivers', () => tb('drivers')); }
    if (t === 'updates') load('updates', () => tb('updates'));
    if (t === 'hosts') load('hosts', () => tb('hosts'));
    if (t === 'env') load('env', () => tb('env'));
    if (t === 'firewall') load('fw', () => tb('fwlist'));
    this.draw();
  },
  refresh(key) { delete data[key]; this.open(tab); },
  async click(e) {
    const t = e.target.closest('[data-tbt]'); if (t) return this.open(t.dataset.tbt);
    const q = e.target.closest('[data-quick]');
    if (q) {
      const op = q.dataset.quick;
      const danger = { restartexplorer: 'Explorer (taskbar, desktop) restarts. Open File Explorer windows close.', renewip: 'Your network drops for a few seconds while Windows gets a new address.', cleantemp: 'Deletes temp files older than 24 hours from ' + esc((data.temp && data.temp.dirs || []).map(d => d.dir).join(' and ')) + '. Files in use are skipped. This cannot be undone.', emptyrecycle: 'Permanently deletes everything in the Recycle Bin. This cannot be undone.', shutdown: 'The PC shuts down in 1 minute. You can cancel it here.', restart: 'The PC restarts in 1 minute. You can cancel it here.' }[op];
      if (danger && !(await RW.confirm(q.textContent.trim() + '?', danger, { danger: op !== 'shutdown' && op !== 'restart' ? true : false, ok: q.textContent.trim() }))) return;
      q.disabled = true;
      try { await tbAct({ op, minutes: 1 }); if (op === 'cleantemp' || op === 'emptyrecycle') this.refresh('temp'); } catch { /* toasted */ } finally { q.disabled = false; }
      return;
    }
    const ot = e.target.closest('[data-open]'); if (ot) return tbAct({ op: 'opentool', name: ot.dataset.open }, true).catch(() => {});
    const pl = e.target.closest('[data-plan]'); if (pl) { await tbAct({ op: 'setplan', guid: pl.dataset.plan }).catch(() => {}); return this.refresh('overview'); }
    if (e.target.closest('#ultimate')) { await tbAct({ op: 'ultimateplan' }).catch(() => {}); return this.refresh('overview'); }
    const un = e.target.closest('[data-uninstall]');
    if (un && await RW.confirm('Uninstall ' + esc(un.dataset.name) + '?', 'Starts the app\u2019s own uninstaller. Follow its prompts.', { danger: true, ok: 'Start uninstaller' })) return tbAct({ op: 'uninstall', key: un.dataset.uninstall }).catch(() => {});
    const st = e.target.closest('[data-startup]');
    if (st) { await tbAct({ op: 'startup', name: st.dataset.startup, location: st.dataset.loc, enable: st.dataset.en === '1' }).catch(() => {}); return this.refresh('startup'); }
    const tk = e.target.closest('[data-task]');
    if (tk) { if (tk.dataset.act === 'disable' && !(await RW.confirm('Disable ' + esc(tk.dataset.task) + '?', 'The task will not run until you enable it again.', { ok: 'Disable' }))) return; await tbAct({ op: 'task', path: tk.dataset.path, name: tk.dataset.task, action: tk.dataset.act }).catch(() => {}); return this.refresh('tasks'); }
    const hs = e.target.closest('[data-hosts]');
    if (hs) { if (hs.dataset.hosts === 'remove' && !(await RW.confirm('Remove this hosts entry?', 'A backup is saved as hosts.rigwatch.bak.', { danger: true, ok: 'Remove' }))) return; await tbAct({ op: 'hosts', action: hs.dataset.hosts, line: +hs.dataset.line }).catch(() => {}); return this.refresh('hosts'); }
    if (e.target.closest('#hostadd')) { const v = await RW.prompt('Add hosts entry', [{ name: 'ip', label: 'IP address', value: '127.0.0.1' }, { name: 'host', label: 'Host name', placeholder: 'myapp.test' }], 'Add'); if (v) { await tbAct({ op: 'hosts', action: 'add', ip: v.ip, host: v.host }).catch(() => {}); this.refresh('hosts'); } return; }
    const ub = e.target.closest('[data-unblock]'); if (ub) { await tbAct({ op: 'fwblock', path: ub.dataset.unblock, on: false }).catch(() => {}); return this.refresh('fw'); }
    if (e.target.closest('#durun') || e.target.closest('[data-du]')) {
      const el = e.target.closest('[data-du]'); duDir = el ? el.dataset.du : (document.getElementById('dudir') || {}).value || '';
      try { const j = await RW.tool('du', { dir: duDir }); duJob = j.id; this.draw(); } catch (er) { RW.toast(er.message, 'err'); }
      return;
    }
    if (e.target.closest('#tbrefresh')) return this.refresh({ quick: 'overview', events: 'events', apps: 'apps', startup: 'startup', devices: 'devices', updates: 'updates', hosts: 'hosts', env: 'env', firewall: 'fw' }[tab]);
  },
  change(e) {
    const t = e.target;
    if (t.dataset.evq) { evq[t.dataset.evq] = t.value; delete data.events; this.open('events'); }
    if (t.id === 'tasksall') { tasksAll = t.checked; delete data.tasks; this.open('startup'); }
  },
  update() { this.draw(); },
  draw() {
    const d = data, c = ctl() ? '' : ' disabled';
    const refresh = '<button class="btn sm ghost" id="tbrefresh">' + icon('refresh') + 'Refresh</button>';
    let h = '';
    if (tab === 'quick') {
      const ov = d.overview || {}, tmp = d.temp || {};
      const tmpBytes = (tmp.dirs || []).reduce((a, x) => a + x.bytes, 0);
      const q = (op, ic, label, sub, dz) => '<button class="btn' + (dz ? ' danger' : '') + '" data-quick="' + op + '" style="flex-direction:column;align-items:flex-start;gap:2px;min-width:180px"' + c + '><span style="display:flex;gap:7px;align-items:center">' + icon(ic) + '<b>' + label + '</b></span><span class="muted" style="font-size:12px">' + sub + '</span></button>';
      h += '<div class="grid g3"><article class="card span2"><header><h2>Quick actions</h2><span class="right">' + refresh + '</span></header><div style="display:flex;gap:10px;flex-wrap:wrap">' +
        q('flushdns', 'refresh', 'Flush DNS', 'clear cached lookups') + (WIN() ? q('renewip', 'wifi', 'Renew IP', 'release + renew DHCP') + q('restartexplorer', 'grid', 'Restart Explorer', 'fix a stuck taskbar') : '') + q('lock', 'lock', 'Lock PC', 'lock this session') +
        q('cleantemp', 'trash', 'Clean temp files', tmp.dirs ? F.b(tmpBytes, 1) + ' in temp' + (tmp.partial ? '+' : '') : 'measuring\u2026', true) + (WIN() ? q('emptyrecycle', 'trash', 'Empty Recycle Bin', tmp.recycle ? tmp.recycle.items + ' items \u00b7 ' + F.b(tmp.recycle.bytes, 1) : '\u2026', true) : '') +
        q('restart', 'refresh', 'Restart in 1 min', 'scheduled, cancelable') + q('shutdown', 'power', 'Shut down in 1 min', 'scheduled, cancelable') + q('abortshutdown', 'x', 'Cancel shutdown', 'abort a scheduled one') + '</div>' +
        (ov.reboot && ov.reboot.length ? '<div class="note" style="margin-top:12px">' + icon('alert') + ' <b>Restart pending</b> (' + esc(ov.reboot.join(', ')) + ').</div>' : '') + '</article>' +
        '<article class="card"><header><h2>Privileges & drivers</h2></header>' + RW.kv([['Running as admin', RW.st.elevated ? '<span class="chip good"><i></i>yes</span>' : '<span class="chip warn"><i></i>no</span>'], ['Sensor driver', RW.snap && RW.snap.status.pawnio ? '<span class="chip good"><i></i>PawnIO installed</span>' : RW.snap && RW.snap.status.pawnio === false ? '<span class="chip warn"><i></i>PawnIO not installed</span>' : '<span class="muted">checking\u2026</span>'], ['Helpers', Object.entries((RW.snap && RW.snap.status.tools) || {}).map(([k, v]) => esc(k) + ' <span class="muted">' + esc(v.state) + '</span>').join(' \u00b7 ')]]) + '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">' + RW.fixButtons('cpu') + '</div></article></div>';
      h += '<div class="grid g2"><article class="card"><header><h2>Power plan</h2></header>' + ((ov.plans || []).map(p => '<div class="brow"><span class="bl">' + (p.active ? '<span class="chip good"><i></i>active</span> ' : '') + '<b>' + esc(p.name) + '</b></span><span class="bv">' + (p.active ? '' : '<button class="btn sm" data-plan="' + esc(p.guid) + '"' + c + '>Activate</button>') + '</span></div>').join('') || '<div class="empty">No power plans exposed on this OS.</div>') + (WIN() && ov.plans && !ov.plans.some(p => /ultimate/i.test(p.name)) ? '<button class="btn sm" id="ultimate" style="margin-top:8px"' + c + '>' + icon('zap') + 'Add Ultimate Performance plan</button>' : '') + '</article>' +
        (WIN() ? '<article class="card"><header><h2>Open Windows tools</h2></header><div style="display:flex;gap:6px;flex-wrap:wrap">' + Object.entries(TOOL_NAMES).map(([k, l]) => '<button class="btn sm" data-open="' + k + '"' + c + '>' + esc(l) + '</button>').join('') + '</div></article>' : '') + '</div>';
    } else if (tab === 'events') {
      const ev = d.events;
      const list = ev && !ev.error ? (Array.isArray(ev) ? ev : ev.events || []) : [];
      h += '<article class="card"><div class="toolbar"><select data-evq="log">' + ['System', 'Application', WIN() ? 'Security' : null].filter(Boolean).map(l => '<option value="' + l + '"' + (evq.log === l ? ' selected' : '') + '>' + (l === 'Security' ? 'Security highlights' : l) + '</option>').join('') + '</select>' +
        (evq.log !== 'Security' ? '<select data-evq="level"><option value="error"' + (evq.level === 'error' ? ' selected' : '') + '>Errors</option><option value="warn"' + (evq.level === 'warn' ? ' selected' : '') + '>Errors + warnings</option><option value="all"' + (evq.level === 'all' ? ' selected' : '') + '>Everything</option></select>' : '') +
        '<select data-evq="hours">' + [['1', 'last hour'], ['24', 'last 24 h'], ['72', 'last 3 days'], ['168', 'last 7 days'], ['720', 'last 30 days']].map(([v, l]) => '<option value="' + v + '"' + (evq.hours === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select><span class="grow"></span><span class="muted">' + (loading.events ? 'loading\u2026' : list.length + ' events') + '</span>' + refresh + '</div>' +
        errBox(ev) + (ev && ev.errors && ev.errors.length ? '<div class="muted" style="font-size:12px;margin-bottom:8px">' + esc(ev.errors.join(' \u00b7 ')) + (RW.st.elevated ? '' : ' ' + RW.fixButtons('admin')) + '</div>' : '') +
        '<div class="tw" style="max-height:calc(100vh - 250px)">' + RW.table('tbev', [
          { k: 't', label: 'Time', fmt: x => '<span class="muted">' + F.date(x.t) + '</span>' },
          { k: 'level', label: 'Level', fmt: x => (x.level <= 2 ? '<span class="chip crit"><i></i>error</span>' : x.level === 3 ? '<span class="chip warn"><i></i>warning</span>' : '<span class="chip"><i></i>info</span>') },
          { k: 'id', label: 'Event', fmt: x => '<b>' + x.id + '</b>' + (SEC_IDS[x.id] && evq.log === 'Security' ? ' ' + esc(SEC_IDS[x.id]) : '') + '<div class="muted" style="font-size:11.5px">' + esc(x.provider) + '</div>' },
          { k: 'msg', label: 'Details', cls: 'wrap', fmt: x => (x.user ? '<b>user</b> ' + esc(x.user) + (x.ip && x.ip !== '-' ? ' from <span class="mono">' + esc(x.ip) + '</span>' : '') + (x.logonType ? ' (logon type ' + x.logonType + ')' : '') + '<br>' : '') + (x.service ? '<b>' + esc(x.service) + '</b> <span class="mono">' + esc(x.image) + '</span><br>' : '') + '<span class="ink2" style="font-size:12.5px">' + esc(String(x.msg || '').slice(0, 300)) + '</span>' },
        ], list, { sortK: 't', max: 800 }) + '</div></article>';
    } else if (tab === 'apps') {
      const a = Array.isArray(d.apps) ? d.apps.filter(x => !appQ || (x.name + ' ' + x.publisher).toLowerCase().includes(appQ)) : [];
      h += '<article class="card"><div class="toolbar"><input type="search" id="appq" placeholder="Filter apps" value="' + esc(appQ) + '"><span class="grow"></span><span class="muted">' + (loading.apps ? 'loading\u2026' : a.length + ' apps \u00b7 ' + F.b(a.reduce((s, x) => s + (x.sizeKb || 0) * 1024, 0), 1)) + '</span>' + refresh + '</div>' + errBox(d.apps) +
        '<div class="tw" style="max-height:calc(100vh - 230px)">' + RW.table('tbapps', [
          { k: 'name', label: 'App', fmt: x => '<b>' + esc(x.name) + '</b>' + (x.arch === 'x86' ? '<span class="tag">32-bit</span>' : '') + (x.scope === 'user' ? '<span class="tag">per-user</span>' : '') },
          { k: 'version', label: 'Version', fmt: x => '<span class="mono muted">' + esc(x.version) + '</span>' },
          { k: 'publisher', label: 'Publisher', fmt: x => esc(x.publisher) },
          { k: 'date', label: 'Installed', fmt: x => esc(/^\d{8}$/.test(x.date || '') ? x.date.slice(0, 4) + '-' + x.date.slice(4, 6) + '-' + x.date.slice(6) : x.date || '') },
          { k: 'sizeKb', label: 'Size', num: true, fmt: x => (x.sizeKb ? F.b(x.sizeKb * 1024, 0) : '') },
          { k: 'x', label: '', nosort: true, fmt: x => (x.key && x.hasUninstall && ctl() ? '<button class="btn sm danger" data-uninstall="' + esc(x.key) + '" data-name="' + esc(x.name) + '">Uninstall</button>' : '') },
        ], a, { sortK: 'name', sortD: 1 }) + '</div></article>';
    } else if (tab === 'startup') {
      const su = Array.isArray(d.startup) ? d.startup : [], tk = Array.isArray(d.tasks) ? d.tasks : [];
      h += '<article class="card" style="margin-bottom:14px"><header><h2>Startup apps</h2><span class="right muted">' + su.length + ' items</span>' + refresh + '</header>' + errBox(d.startup) + RW.table('tbsu', [
        { k: 'name', label: 'Name', fmt: x => '<b>' + esc(x.name) + '</b>' },
        { k: 'enabled', label: 'State', sort: x => (x.enabled === false ? 0 : 1), fmt: x => (x.enabled === false ? '<span class="chip"><i></i>disabled</span>' : '<span class="chip good"><i></i>enabled</span>') },
        { k: 'kind', label: 'Type', fmt: x => '<span class="tag">' + esc(x.kind) + '</span>' },
        { k: 'cmd', label: 'Command', cls: 'wrap', fmt: x => '<span class="mono" style="font-size:12px">' + esc(x.cmd) + '</span>' },
        { k: 'x', label: '', nosort: true, fmt: x => (x.toggle && ctl() ? '<button class="btn sm' + (x.enabled === false ? '' : ' danger') + '" data-startup="' + esc(x.name) + '" data-loc="' + esc(x.location) + '" data-en="' + (x.enabled === false ? '1' : '0') + '">' + (x.enabled === false ? 'Enable' : 'Disable') + '</button>' : '') },
      ], su, { sortK: 'name', sortD: 1 }) + '</article>' +
        '<article class="card"><header><h2>Scheduled tasks</h2><span class="right"><label class="check"><input type="checkbox" id="tasksall"' + (tasksAll ? ' checked' : '') + '>include Microsoft tasks</label></span></header>' + errBox(d.tasks) + '<div class="tw" style="max-height:520px">' + RW.table('tbtasks', [
          { k: 'name', label: 'Task', fmt: x => '<b>' + esc(x.name) + '</b><div class="muted mono" style="font-size:11px">' + esc(x.path) + '</div>' },
          { k: 'state', label: 'State', fmt: x => '<span class="chip ' + (x.state === 'Running' ? 'good' : x.state === 'Disabled' ? '' : 'info') + '"><i></i>' + esc(x.state) + '</span>' },
          { k: 'triggers', label: 'Triggers', fmt: x => esc(x.triggers) },
          { k: 'actions', label: 'Runs', cls: 'wrap', fmt: x => '<span class="mono" style="font-size:12px">' + esc(x.actions) + '</span>' },
          { k: 'last', label: 'Last run', fmt: x => (x.last > 86400000 ? F.date(x.last) + (x.result ? ' <span class="chip warn" title="last result"><i></i>0x' + Number(x.result).toString(16) + '</span>' : '') : '<span class="muted">never</span>') },
          { k: 'next', label: 'Next', fmt: x => (x.next > 86400000 ? F.date(x.next) : '') },
          { k: 'x', label: '', nosort: true, fmt: x => (ctl() && WIN() ? '<span style="display:inline-flex;gap:4px"><button class="btn sm" data-task="' + esc(x.name) + '" data-path="' + esc(x.path) + '" data-act="run">Run</button>' + (x.state === 'Disabled' ? '<button class="btn sm" data-task="' + esc(x.name) + '" data-path="' + esc(x.path) + '" data-act="enable">Enable</button>' : '<button class="btn sm danger" data-task="' + esc(x.name) + '" data-path="' + esc(x.path) + '" data-act="disable">Disable</button>') + '</span>' : '') },
        ], tk, { sortK: 'name', sortD: 1 }) + '</div></article>';
    } else if (tab === 'devices') {
      const dv = Array.isArray(d.devices) ? d.devices : [], dr = Array.isArray(d.drivers) ? d.drivers : [];
      h += '<article class="card" style="margin-bottom:14px"><header><h2>Devices with problems</h2><span class="right">' + refresh + '</span></header>' + errBox(d.devices) + (dv.length ? RW.table('tbdev', [{ k: 'name', label: 'Device', fmt: x => '<b>' + esc(x.name || x.id) + '</b><div class="muted mono" style="font-size:11px">' + esc(x.id) + '</div>' }, { k: 'cls', label: 'Class' }, { k: 'code', label: 'Problem', fmt: x => '<span class="chip warn"><i></i>code ' + x.code + '</span> ' + esc(DEV_CODES[x.code] || '') }, { k: 'mfr', label: 'Maker' }], dv, { sortK: 'name', sortD: 1 }) : '<div class="empty">' + (loading.devices ? 'checking\u2026' : 'Every device is working.') + '</div>') + '</article>' +
        '<article class="card"><header><h2>Drivers</h2><span class="right muted">' + (loading.drivers ? 'loading (a few seconds)\u2026' : dr.length + ' drivers') + '</span></header><div class="tw" style="max-height:560px">' + RW.table('tbdrv', [{ k: 'name', label: 'Device', fmt: x => '<b>' + esc(x.name) + '</b>' }, { k: 'cls', label: 'Class', fmt: x => '<span class="tag">' + esc(String(x.cls).toLowerCase()) + '</span>' }, { k: 'version', label: 'Version', fmt: x => '<span class="mono">' + esc(x.version) + '</span>' }, { k: 'date', label: 'Date', fmt: x => (x.date ? new Date(x.date).toLocaleDateString() : '') }, { k: 'provider', label: 'Provider' }, { k: 'signed', label: 'Signed', fmt: x => (x.signed ? '<span class="chip good"><i></i>' + esc(x.signer || 'yes') + '</span>' : '<span class="chip crit"><i></i>unsigned</span>') }], dr, { sortK: 'cls', sortD: 1 }) + '</div></article>';
    } else if (tab === 'updates') {
      const u = d.updates || {};
      h += '<article class="card"><header><h2>Updates</h2><span class="right">' + refresh + '</span></header>' + errBox(u) + (u.reboot && u.reboot.length ? '<div class="note" style="margin-bottom:10px">' + icon('alert') + ' <b>A restart is pending</b>: ' + esc(u.reboot.join(', ')) + '</div>' : u.hotfixes ? '<div class="muted" style="margin-bottom:10px">' + icon('check') + ' No restart pending.' + (u.lastBoot ? ' Last boot ' + F.date(u.lastBoot) + '.' : '') + '</div>' : '') +
        RW.table('tbhf', [{ k: 'id', label: 'Update', fmt: x => '<b class="mono">' + esc(x.id) + '</b>' }, { k: 'desc', label: 'Type' }, { k: 'date', label: 'Installed', fmt: x => (x.date ? new Date(x.date).toLocaleDateString() : '') }, { k: 'by', label: 'By', fmt: x => '<span class="muted">' + esc(x.by) + '</span>' }], u.hotfixes || [], { sortK: 'date' }) + '</article>';
    } else if (tab === 'hosts') {
      const hs = d.hosts || {};
      h += '<article class="card"><header><h2>Hosts file</h2><span class="muted">' + esc(hs.file || '') + '</span><span class="right">' + (hs.writable === false ? '<span class="chip warn"><i></i>read-only without admin</span> ' + RW.fixButtons('admin') : '') + '<button class="btn sm" id="hostadd"' + (ctl() && hs.writable ? '' : ' disabled') + '>' + icon('plus') + 'Add entry</button>' + refresh + '</span></header>' + errBox(hs) +
        RW.table('tbhosts', [{ k: 'ip', label: 'IP', fmt: x => '<span class="mono">' + esc(x.ip) + '</span>' }, { k: 'hosts', label: 'Host names', sort: x => x.hosts.join(' '), fmt: x => '<span class="mono">' + esc(x.hosts.join(' ')) + '</span>' }, { k: 'enabled', label: 'State', fmt: x => (x.enabled ? '<span class="chip good"><i></i>active</span>' : '<span class="chip"><i></i>commented out</span>') }, { k: 'x', label: '', nosort: true, fmt: x => (ctl() && hs.writable ? '<button class="btn sm" data-hosts="toggle" data-line="' + x.line + '">' + (x.enabled ? 'Disable' : 'Enable') + '</button> <button class="btn sm danger" data-hosts="remove" data-line="' + x.line + '">Remove</button>' : '') }], hs.entries || [], { empty: 'No active entries: the hosts file only has comments.' }) + '</article>';
    } else if (tab === 'env') {
      const ev = d.env || {};
      const bad = (ev.path || []).filter(p => !p.exists || p.dup).length;
      h += '<div class="grid g2"><article class="card span2" style="grid-column:1/-1"><header><h2>PATH</h2><span class="right muted">' + (ev.path ? ev.path.length + ' entries' + (bad ? ' \u00b7 ' + bad + ' broken or duplicate' : ' \u00b7 all good') : '') + '</span>' + refresh + '</header>' + errBox(ev) + RW.table('tbpath', [{ k: 'i', label: '#', num: true, nosort: true, fmt: x => String((ev.path || []).indexOf(x) + 1) }, { k: 'scope', label: 'Scope', fmt: x => '<span class="tag">' + esc(x.scope) + '</span>' }, { k: 'dir', label: 'Directory', fmt: x => '<span class="mono">' + esc(x.dir) + '</span>' }, { k: 'exists', label: 'Status', fmt: x => (!x.exists ? '<span class="chip crit"><i></i>missing</span>' : x.dup ? '<span class="chip warn"><i></i>duplicate</span>' : '<span class="chip good"><i></i>ok</span>') }], ev.path || []) + '</article>' +
        ['user', 'machine'].map(sc => '<article class="card"><header><h2>' + (sc === 'user' ? 'User variables' : 'System variables') + '</h2><span class="right muted">secrets hidden</span></header><div class="tw" style="max-height:420px">' + RW.table('tbenv' + sc, [{ k: 'k', label: 'Name', fmt: x => '<b class="mono">' + esc(x.k) + '</b>' }, { k: 'v', label: 'Value', cls: 'wrap', fmt: x => '<span class="mono" style="font-size:12px">' + esc(String(x.v).slice(0, 500)) + '</span>' }], (ev[sc] || []).filter(x => !/^path$/i.test(x.k)), { sortK: 'k', sortD: 1 }) + '</div></article>').join('') + '</div>';
    } else if (tab === 'du') {
      const j = duJob && RW.jobs.get(duJob);
      const r = j && j.result;
      h += '<article class="card" style="margin-bottom:14px"><div class="form"><label class="field" style="flex:1">Folder<input type="text" id="dudir" value="' + esc(duDir || (WIN() ? 'C:\\' : '/')) + '"></label><button class="btn primary" id="durun"' + c + '>' + icon('disk') + 'Analyze</button></div>' + (j ? '<div class="term" style="min-height:60px;max-height:140px">' + j.lines.slice(-6).map(l => '<span class="' + esc(l.cls) + '">' + esc(l.text) + '</span>').join('\n') + '</div>' : '<div class="muted">Finds what is eating your disk. Click a folder in the result to drill down.</div>') + '</article>';
      if (r) {
        const mx = r.top[0] ? r.top[0].bytes : 1;
        h += '<div class="grid g2"><article class="card"><header><h2>' + esc(r.dir) + '</h2><span class="right muted">' + F.b(r.total, 1) + ' \u00b7 ' + F.num(r.files) + ' files' + (r.partial ? ' (partial)' : '') + '</span></header>' + r.top.map(t => RW.brow((t.dir ? '<a data-du="' + esc(t.path) + '" title="drill down">' + icon('folder') + ' ' + esc(t.path.split(/[\\/]/).pop()) + '</a>' : esc(t.path.split(/[\\/]/).pop())) + ' <span class="muted">' + F.num(t.files) + ' files</span>', F.b(t.bytes, 1), 100 * t.bytes / mx, '--s4')).join('') + '</article>' +
          '<article class="card"><header><h2>Biggest files</h2></header>' + (r.biggest.length ? r.biggest.map(b => '<div class="brow"><span class="bl mono" style="font-size:12px" title="' + esc(b.path) + '">' + esc(b.path) + '</span><span class="bv">' + F.b(b.bytes, 1) + '</span></div>').join('') : '<div class="empty">No files over 50 MB.</div>') + '</article></div>';
      }
    } else if (tab === 'firewall') {
      const fw = Array.isArray(d.fw) ? d.fw : [];
      h += '<article class="card"><header><h2>Apps blocked by RigWatch</h2><span class="right muted">block or unblock any app from its process drawer</span>' + refresh + '</header>' + errBox(d.fw) + (fw.length ? RW.table('tbfw', [{ k: 'name', label: 'Rule', fmt: x => '<b>' + esc(x.name) + '</b>' }, { k: 'dir', label: 'Direction' }, { k: 'program', label: 'Program', fmt: x => '<span class="mono" style="font-size:12px">' + esc(x.program) + '</span>' }, { k: 'x', label: '', nosort: true, fmt: x => (ctl() && /outbound/i.test(x.dir) ? '<button class="btn sm" data-unblock="' + esc(x.program) + '">Unblock</button>' : '') }], fw) : '<div class="empty">No apps blocked. Open a process and choose <b>Block network</b> to cut it off from the internet with a Windows Firewall rule.</div>') + '</article>';
    }
    const box = document.getElementById('tbb'); if (box) setH(box, h);
  },
};
})();
