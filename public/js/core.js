'use strict';
/* RigWatch UI core: state, formatting, icons, API, SSE, router, drawer, modal, palette, tables. */
(() => {
const HKEYS = ['t', 'cpu', 'gpu', 'mem', 'vram', 'rx', 'tx', 'rxp', 'txp', 'dr', 'dw', 'ct', 'gt', 'fps', 'ping', 'loss', 'conns', 'swap'];
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : Object.assign(Array.isArray(d) ? [] : {}, d, v); } catch { return d; } };
const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };

const RW = window.RW = {
  HKEYS, HMAX: 900, hist: {}, st: null, auth: {}, settings: {}, webhook: {}, snap: null, prev: null,
  events: [], jobs: new Map(), pages: {}, page: null, params: {}, paused: false, connected: false, sorts: {},
  prefs: load('rw.prefs', { theme: 'dark', side: 'open', range: '15m', notify: false, procView: 'table', procFilter: 'all' }),
  load, store, listeners: {},
};
HKEYS.forEach(k => { RW.hist[k] = []; });
RW.savePrefs = () => store('rw.prefs', RW.prefs);
RW.on = (ev, fn) => { (RW.listeners[ev] = RW.listeners[ev] || []).push(fn); };
RW.emit = (ev, d) => { for (const fn of RW.listeners[ev] || []) { try { fn(d); } catch (e) { console.error(e); } } };

// ---------- DOM ----------
const $ = RW.$ = (s, r) => (r || document).querySelector(s);
RW.$$ = (s, r) => [...(r || document).querySelectorAll(s)];
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = RW.esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ESC[c]);
RW.setH = (el, html) => { if (typeof el === 'string') el = document.getElementById(el); if (el && el.__h !== html) { el.innerHTML = html; el.__h = html; } return el; };
RW.cl = v => { v = +v || 0; return v < 0 ? 0 : v > 100 ? 100 : v; };

// ---------- formatting ----------
const D = '–';
const F = RW.f = {
  b(b, d) { if (b == null || isNaN(b)) return D; const u = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']; let i = 0; b = +b; while (Math.abs(b) >= 1024 && i < u.length - 1) { b /= 1024; i++; } return (i === 0 ? Math.round(b) : b.toFixed(d != null ? d : b >= 100 ? 0 : b >= 10 ? 1 : 2)) + ' ' + u[i]; },
  rate(b) { return b == null || isNaN(b) ? D : F.b(b) + '/s'; },
  bits(B) { if (B == null || isNaN(B)) return D; if (RW.prefs.netBytes) return F.rate(B); let b = B * 8, i = 0; const u = ['b/s', 'Kb/s', 'Mb/s', 'Gb/s', 'Tb/s']; while (b >= 1000 && i < u.length - 1) { b /= 1000; i++; } return (i === 0 ? Math.round(b) : b.toFixed(b >= 100 ? 0 : b >= 10 ? 1 : 2)) + ' ' + u[i]; },
  link(bits) { if (!bits) return D; return bits >= 1e9 ? (bits / 1e9).toFixed(bits % 1e9 ? 1 : 0) + ' Gb/s' : Math.round(bits / 1e6) + ' Mb/s'; },
  pct(v, d) { return v == null || isNaN(v) ? D : (+v).toFixed(d == null ? 0 : d) + '%'; },
  num(n) { if (n == null || isNaN(n)) return D; n = +n; const a = Math.abs(n); if (a >= 1e9) return (n / 1e9).toFixed(1) + 'B'; if (a >= 1e6) return (n / 1e6).toFixed(1) + 'M'; if (a >= 1e4) return (n / 1e3).toFixed(1) + 'k'; return Math.round(n).toLocaleString(); },
  ghz(m) { return m ? (m / 1000).toFixed(2) + ' GHz' : D; },
  age(s) { s = Math.max(0, Math.floor(s || 0)); const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); if (d) return d + 'd ' + h + 'h'; if (h) return h + 'h ' + m + 'm'; if (m) return m + 'm ' + (s % 60) + 's'; return s + 's'; },
  temp(c) { return c == null || isNaN(c) ? D : Math.round(c) + '°C'; },
  ms(v) { return v == null || isNaN(v) ? D : (v < 10 ? (+v).toFixed(1) : Math.round(v)) + ' ms'; },
  date(ms) { if (!ms) return D; const d = new Date(ms); return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); },
  time(ms) { return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); },
  ago(t) { const s = Math.round((Date.now() - t) / 1000); if (s < 2) return 'now'; if (s < 60) return s + 's ago'; if (s < 3600) return Math.floor(s / 60) + 'm ago'; if (s < 86400) return Math.floor(s / 3600) + 'h ago'; return Math.floor(s / 86400) + 'd ago'; },
  hp(h, p) { return (String(h).includes(':') ? '[' + h + ']' : h) + ':' + p; },
};
RW.vu = (str, extra) => { const i = String(str).lastIndexOf(' '); return i < 0 ? esc(str) : esc(str.slice(0, i)) + '<small>' + esc(str.slice(i + 1)) + (extra || '') + '</small>'; };

// ---------- icons (24x24 stroke) ----------
const P = {
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', activity: 'M3 12h4l3-8 4 16 3-8h4', list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  thermo: 'M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0z', globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z',
  shield: 'M12 3l7 3v6c0 4.4-3 8-7 9-4-1-7-4.6-7-9V6z', flask: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3', code: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',
  cog: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0', clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2', info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 16v-4M12 8h.01',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3', pause: 'M7 5h3v14H7zM14 5h3v14h-3z', play: 'M7 4l13 8-13 8z', sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z', x: 'M6 6l12 12M18 6L6 18', plus: 'M12 5v14M5 12h14', minus: 'M5 12h14', edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14', ext: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5', trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1', folder: 'M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z', hash: 'M5 9h14M5 15h14M10 4L8 20M16 4l-2 16',
  menu: 'M4 6h16M4 12h16M4 18h16', alert: 'M12 3l10 18H2zM12 10v4M12 17h.01', check: 'M5 12l5 5 9-10', lock: 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3', unlock: 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 7.5-2',
  stop: 'M6 6h12v12H6z', zap: 'M13 2L4 14h7l-1 8 9-12h-7z', cpu: 'M7 7h10v10H7zM9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4', gpu: 'M2 7h20v10H2zM6 17v3M10 17v3M7 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0M15 12h3',
  disk: 'M4 5h16v14H4zM4 13h16M16 16h.01', box: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9', terminal: 'M4 5h16v14H4zM7 9l3 3-3 3M12 15h5', wifi: 'M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5', eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7', drag: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
  radar: 'M12 3a9 9 0 1 0 9 9M12 7a5 5 0 1 0 5 5M12 12l7-7', wrench: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z', ban: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM5.6 5.6l12.8 12.8', key: 'M15 7a4 4 0 1 1-3.9 5H4v3h3v3h3v-3h1.1A4 4 0 0 1 15 7z', power: 'M12 3v9M6.3 6.3a8 8 0 1 0 11.4 0', fire: 'M12 21c4 0 7-3 7-7 0-4-3-6-4-10-2 3-3 4-5 4 0-2-1-3-2-4-1 3-3 5-3 10 0 4 3 7 7 7z',
};
RW.icon = (n, cls) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"' + (cls ? ' class="' + cls + '"' : '') + ' aria-hidden="true"><path d="' + (P[n] || P.info) + '"/></svg>';

// ---------- status helpers ----------
RW.tstat = (c, lim) => { if (c == null) return null; lim = lim || [70, 80, 90]; if (c < lim[0]) return ['good', 'cool']; if (c < lim[1]) return ['warn', 'warm']; if (c < lim[2]) return ['serious', 'hot']; return ['crit', 'critical']; };
RW.tchip = (c, lim) => { const s = RW.tstat(c, lim); return s ? '<span class="chip ' + s[0] + '" title="' + s[1] + '"><i></i>' + F.temp(c) + ' ' + s[1] + '</span>' : ''; };
const SEV_ICON = { critical: 'alert', high: 'alert', medium: 'alert', low: 'info', info: 'info' };
RW.sev = s => '<span class="sev ' + esc(s) + '">' + RW.icon(SEV_ICON[s] || 'info') + esc(s) + '</span>';
RW.bar = (p, col, title) => '<div class="bar"' + (title ? ' title="' + esc(title) + '"' : '') + '><i style="width:' + RW.cl(p).toFixed(1) + '%;background:var(' + (col || '--s1') + ')"></i></div>';
RW.brow = (label, value, p, col, attrs) => '<div class="brow' + (attrs ? ' click" ' + attrs : '"') + '><span class="bl">' + label + '</span><span class="bv">' + value + '</span>' + RW.bar(p, col) + '</div>';
RW.stats = rows => '<dl class="stats">' + rows.filter(r => r && r[1] != null && r[1] !== '' && r[1] !== D).map(r => '<div><dt>' + esc(r[0]) + '</dt><dd' + (r[2] ? ' title="' + esc(r[2]) + '"' : '') + '>' + r[1] + '</dd></div>').join('') + '</dl>';
RW.kv = rows => '<dl class="kv">' + rows.filter(r => r && r[1] != null && r[1] !== '').map(r => '<dt>' + esc(r[0]) + '</dt><dd>' + r[1] + '</dd>').join('') + '</dl>';
RW.portLinks = (ports, max = 8) => '<span class="plinks">' + (ports || []).slice(0, max).map(p => '<a class="plink" href="http://localhost:' + p + '" target="_blank" rel="noopener noreferrer" title="Open http://localhost:' + p + '">:' + p + '</a>').join('') + ((ports || []).length > max ? ' <span class="muted">+' + (ports.length - max) + '</span>' : '') + '</span>';
const SVC = { 20: 'ftp-data', 21: 'ftp', 22: 'ssh', 23: 'telnet', 25: 'smtp', 53: 'dns', 67: 'dhcp', 68: 'dhcp', 80: 'http', 88: 'kerberos', 110: 'pop3', 123: 'ntp', 135: 'rpc', 137: 'netbios-ns', 138: 'netbios-dgm', 139: 'netbios', 143: 'imap', 161: 'snmp', 389: 'ldap', 443: 'https', 445: 'smb', 465: 'smtps', 500: 'ipsec', 514: 'syslog', 587: 'smtp', 631: 'ipp', 993: 'imaps', 995: 'pop3s', 1194: 'openvpn', 1433: 'sql server', 1900: 'ssdp/upnp', 1883: 'mqtt', 2375: 'docker', 2376: 'docker tls', 3000: 'dev server', 3001: 'dev server', 3306: 'mysql', 3389: 'rdp', 3478: 'stun', 4000: 'dev server', 4200: 'angular', 4500: 'ipsec nat-t', 5000: 'dev server', 5037: 'adb', 5040: 'cdp', 5173: 'vite', 5174: 'vite', 5353: 'mdns', 5355: 'llmnr', 5432: 'postgres', 5500: 'live server', 5555: 'adb', 5672: 'amqp', 5900: 'vnc', 6379: 'redis', 6443: 'k8s api', 6463: 'discord rpc', 7680: 'delivery opt.', 8000: 'dev server', 8080: 'http-alt', 8081: 'http-alt', 8085: 'librehw', 8443: 'https-alt', 8888: 'jupyter', 9000: 'dev server', 9090: 'prometheus', 9200: 'elasticsearch', 9222: 'chrome devtools', 9229: 'node inspector', 11211: 'memcached', 11434: 'ollama', 15672: 'rabbitmq ui', 25565: 'minecraft', 27015: 'steam/source', 27017: 'mongodb', 27036: 'steam', 32400: 'plex', 51820: 'wireguard' };
RW.svc = (port, proc) => { const s = SVC[port] || ''; return s === 'dev server' && proc && (proc.kind === 'system' || proc.pid <= 4) ? '' : s; };
RW.pidMap = s => { if (s.__pm) return s.__pm; const m = new Map(); for (const p of s.procs || []) m.set(p.pid, p); s.__pm = m; return m; };
RW.pname = (s, pid) => { const p = RW.pidMap(s).get(pid); return p ? (p.label || p.name) : (s.ports && s.ports.names && s.ports.names[pid]) || (pid === 0 ? 'System Idle' : pid === 4 ? 'System' : 'pid ' + pid); };
RW.isDev = p => ['runtime', 'db', 'server', 'container', 'ai', 'tool'].includes(p.kind);
RW.kindTag = p => { if (!p.kind || p.kind === 'app') return ''; const c = p.kind === 'game' ? ' game' : RW.isDev(p) ? ' dev' : ''; return '<span class="tag' + c + '">' + esc(p.kind) + '</span>'; };
RW.flagTags = p => (p.flags || []).map(f => '<span class="tag flag" title="security flag">' + esc(f.split(':')[0]) + '</span>').join('') + (p.state === 'suspended' ? '<span class="tag flag">suspended</span>' : '');

// ---------- API ----------
RW.api = async (path, opts = {}) => {
  const r = await fetch(path, { method: opts.method || 'GET', headers: { 'content-type': 'application/json', 'x-rigwatch': '1' }, body: opts.body ? JSON.stringify(opts.body) : undefined, credentials: 'same-origin' });
  let j = null; try { j = await r.json(); } catch { j = null; }
  if (!r.ok || (j && j.ok === false)) throw new Error((j && j.error) || 'HTTP ' + r.status);
  return j;
};
RW.action = async (a, quiet) => {
  try { const r = await RW.api('/api/action', { method: 'POST', body: a }); if (!quiet) RW.toast(r.msg || 'Done', 'ok'); return r; }
  catch (e) { RW.toast(e.message, 'err', 7000); throw e; }
};
RW.tool = async (tool, params) => { const r = await RW.api('/api/jobs', { method: 'POST', body: { tool, params } }); RW.jobs.set(r.job.id, { s: r.job, lines: [], result: null }); return r.job; };
RW.canControl = () => !!(RW.auth && RW.auth.control);

// ---------- toasts / modal / confirm / prompt ----------
RW.toast = (msg, kind, ms) => {
  const t = document.createElement('div'); t.className = 'toast ' + (kind || ''); t.textContent = msg;
  $('#toasts').appendChild(t); setTimeout(() => t.remove(), ms || 4200);
};
RW.modal = ({ title, body, actions = [], wide, onMount, cls }) => {
  const bd = document.createElement('div'); bd.className = 'backdrop';
  bd.innerHTML = '<div class="modal' + (wide ? ' wide' : '') + (cls ? ' ' + cls : '') + '" role="dialog" aria-modal="true">' + (title ? '<header>' + esc(title) + '</header>' : '') + '<div class="mb">' + (body || '') + '</div>' + (actions.length ? '<footer></footer>' : '') + '</div>';
  const close = () => { bd.remove(); document.removeEventListener('keydown', onKey, true); };
  const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  document.addEventListener('keydown', onKey, true);
  bd.addEventListener('mousedown', e => { if (e.target === bd) close(); });
  const foot = bd.querySelector('footer');
  for (const a of actions) {
    const b = document.createElement('button'); b.className = 'btn' + (a.primary ? ' primary' : '') + (a.danger ? ' danger' : ''); b.textContent = a.label;
    b.onclick = async () => { const keep = a.onClick ? await a.onClick(bd) : false; if (keep !== true) close(); };
    foot.appendChild(b);
  }
  $('#modalRoot').appendChild(bd);
  if (onMount) onMount(bd, close);
  const f = bd.querySelector('input,select,textarea,button.primary'); if (f) setTimeout(() => f.focus(), 30);
  return { el: bd, close };
};
RW.confirm = (title, msg, o = {}) => new Promise(res => {
  RW.modal({ title, body: '<div class="ink2">' + msg + '</div>', actions: [{ label: 'Cancel', onClick: () => res(false) }, { label: o.ok || 'Confirm', primary: !o.danger, danger: !!o.danger, onClick: () => res(true) }] });
});
RW.prompt = (title, fields, okLabel) => new Promise(res => {
  const body = fields.map(f => '<label class="field">' + esc(f.label) + (f.options ? '<select name="' + f.name + '">' + f.options.map(o => '<option value="' + esc(o[0]) + '"' + (o[0] === f.value ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select>' : '<input type="' + (f.type || 'text') + '" name="' + f.name + '" value="' + esc(f.value || '') + '" placeholder="' + esc(f.placeholder || '') + '">') + '</label>').join('');
  let done = false;
  const m = RW.modal({ title, body, actions: [{ label: 'Cancel', onClick: () => { done = true; res(null); } }, { label: okLabel || 'OK', primary: true, onClick: bd => { done = true; const v = {}; RW.$$('[name]', bd).forEach(i => { v[i.name] = i.value; }); res(v); } }] });
  m.el.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { m.el.querySelector('button.primary').click(); } });
  const obs = new MutationObserver(() => { if (!document.body.contains(m.el)) { obs.disconnect(); if (!done) res(null); } });
  obs.observe($('#modalRoot'), { childList: true });
});

// ---------- drawer ----------
RW.drawer = {
  cur: null,
  open(title, o) {
    this.cur = o; $('#drawerTitle').textContent = title; const b = $('#drawerBody'); b.innerHTML = ''; b.__h = null;
    $('#drawer').hidden = false;
    if (o.mount) o.mount(b);
    if (RW.snap && o.update) o.update(b, RW.snap);
  },
  close() { if (this.cur && this.cur.onClose) this.cur.onClose(); this.cur = null; $('#drawer').hidden = true; },
  update(s) { if (this.cur && this.cur.update) this.cur.update($('#drawerBody'), s); },
};

// ---------- tables (every table can also be shown as a chart) ----------
RW.prefs.views = RW.prefs.views || {};
RW.prefs.chartBy = RW.prefs.chartBy || {};
const rawOf = (c, r) => (c.sort ? c.sort(r) : r[c.k]);
const plain = h => String(h == null ? '' : h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const NO_NUM = /^(pid|ppid|port|lp|rp|id|line|i|index|code|x)$/;
/** chart options a table supports: numeric bars, count-by-category, histogram over time */
function chartOpts(cols, rows) {
  const out = [], sample = rows.slice(0, 300);
  cols.forEach((c, ci) => {
    if (c.nosort || c.chart === false) return;
    const vals = sample.map(r => rawOf(c, r)).filter(v => v != null && v !== '');
    if (!vals.length) return;
    const nums = vals.filter(v => typeof v === 'number' && isFinite(v));
    if (nums.length >= vals.length * 0.8) {
      if (nums.filter(v => v > 1e12 && v < 4e12).length >= nums.length * 0.8) out.push({ key: 'time:' + c.k, label: 'over time (' + c.label + ')' });
      else if (ci > 0 && !NO_NUM.test(c.k) && nums.some(v => v > 0)) out.push({ key: 'num:' + c.k, label: c.label });
      return;
    }
    if (ci === 0 || vals.some(v => typeof v === 'object')) return;
    const distinct = new Set(vals.map(v => String(v)));
    if (distinct.size >= 2 && distinct.size <= 30) out.push({ key: 'cnt:' + c.k, label: 'count by ' + c.label });
  });
  return out;
}
function autoChart(id, cols, rows, o, sel) {
  const [kind, k] = sel.split(':');
  const c = cols.find(x => x.k === k) || cols[0];
  const lab = cols[0];
  const labelOf = r => {
    if (o.label) return plain(o.label(r));
    const v = lab.sort ? lab.sort(r) : r[lab.k];
    let s = typeof v === 'string' || typeof v === 'number' ? String(v) : plain(lab.fmt ? lab.fmt(r) : v);
    if (typeof r.label === 'string' && r.label && r.label !== s) s += ' · ' + r.label;
    return s;
  };
  if (kind === 'time') {
    const ts = rows.map(r => rawOf(c, r)).filter(v => typeof v === 'number' && v > 1e12);
    if (!ts.length) return '<div class="empty">No dates to chart.</div>';
    const lo = Math.min(...ts), hi = Math.max(...ts), N = 36, span = Math.max(1, hi - lo), b = new Array(N).fill(0);
    for (const t of ts) b[Math.min(N - 1, Math.floor((t - lo) / span * N))]++;
    const mx = Math.max(...b), fmt = t => (span > 3 * 86400e3 ? new Date(t).toLocaleDateString() : new Date(t).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
    return '<div class="histo">' + b.map((n, i) => '<i title="' + esc(fmt(lo + span * i / N) + ' – ' + fmt(lo + span * (i + 1) / N) + ': ' + n) + '" style="height:' + (n ? Math.max(3, 100 * n / mx) : 0) + '%"></i>').join('') + '</div><div class="histo-ax"><span>' + esc(fmt(lo)) + '</span><span class="muted">' + ts.length + ' items</span><span>' + esc(fmt(hi)) + '</span></div>';
  }
  if (kind === 'cnt') {
    const m = new Map();
    for (const r of rows) { let v = rawOf(c, r); v = v === true ? 'yes' : v === false ? 'no' : v == null || v === '' ? '(none)' : plain(c.fmt && typeof v !== 'string' ? c.fmt(r) : v); m.set(v, (m.get(v) || 0) + 1); }
    const list = [...m].sort((a, b) => b[1] - a[1]), mx = list[0] ? list[0][1] : 1;
    return '<div class="hbars">' + list.map(([v, n], i) => '<div class="hb"><span class="hbl" title="' + esc(v) + '">' + esc(v) + '</span><span class="hbt"><i style="width:' + (100 * n / mx) + '%;background:var(--s' + ((i % 8) + 1) + ')"></i></span><span class="hbv">' + n + '</span></div>').join('') + '</div>';
  }
  const list = rows.map(r => ({ r, v: +rawOf(c, r) || 0 })).filter(x => x.v > 0).sort((a, b) => b.v - a.v);
  const top = list.slice(0, o.chartMax || 40), mx = top[0] ? top[0].v : 1;
  if (!top.length) return '<div class="empty">Nothing above zero to chart.</div>';
  return '<div class="hbars">' + top.map(x => '<div class="hb' + (o.row ? ' click"' + o.row(x.r).replace(/^class="click"\s*/, ' ') : '"') + '><span class="hbl" title="' + esc(labelOf(x.r)) + '">' + esc(labelOf(x.r)) + '</span><span class="hbt"><i style="width:' + Math.max(0.5, 100 * x.v / mx).toFixed(1) + '%"></i></span><span class="hbv">' + esc(plain(c.fmt ? c.fmt(x.r) : x.v)) + '</span></div>').join('') + '</div>' + (list.length > top.length ? '<div class="muted" style="font-size:12px;padding:6px 0">top ' + top.length + ' of ' + list.length + '</div>' : '');
}
RW.table = (id, cols, rows, o = {}) => {
  const opts = o.noChart ? [] : chartOpts(cols, rows);
  if (!opts.length) return tableHTML(id, cols, rows, o);
  const view = RW.prefs.views[id] || o.view || 'table';
  let sel = RW.prefs.chartBy[id];
  if (!opts.some(x => x.key === sel)) sel = (o.chartBy && opts.find(x => x.key.endsWith(':' + o.chartBy)) || (RW.sorts[id] && RW.sorts[id].k && opts.find(x => x.key.endsWith(':' + RW.sorts[id].k))) || opts[0]).key;
  const bar = '<div class="tv"><div class="seg">' + [['table', 'list', 'Table'], ['chart', 'activity', 'Chart'], ['both', 'layers', 'Both']].map(([v, ic, l]) => '<button data-tview="' + id + ':' + v + '" class="' + (view === v ? 'on' : '') + '" title="' + l + ' view">' + RW.icon(ic) + l + '</button>').join('') + '</div>' +
    (view !== 'table' ? (opts.length > 1 ? '<select data-tmetric="' + id + '">' + opts.map(x => '<option value="' + x.key + '"' + (x.key === sel ? ' selected' : '') + '>' + esc(x.label) + '</option>').join('') + '</select>' : '<span class="muted" style="font-size:12px">' + esc(opts[0].label) + '</span>') : '') + '</div>';
  if (view === 'chart') return bar + autoChart(id, cols, rows, o, sel);
  if (view === 'both') return bar + autoChart(id, cols, rows, o, sel) + '<div style="height:12px"></div>' + tableHTML(id, cols, rows, o);
  return bar + tableHTML(id, cols, rows, o);
};
/** cols: [{k,label,num,fmt(row),sort(row),cls,title}] -> html. Sorting state lives in RW.sorts[id]. */
const tableHTML = (id, cols, rows, o = {}) => {
  const st = RW.sorts[id] || (RW.sorts[id] = { k: o.sortK || null, d: o.sortD || -1 });
  if (st.k) {
    const c = cols.find(x => x.k === st.k);
    if (c) { const g = c.sort || (r => r[c.k]); rows = rows.slice().sort((a, b) => { const x = g(a), y = g(b); if (typeof x === 'string' || typeof y === 'string') return st.d * String(x || '').localeCompare(String(y || '')); return st.d * ((x || 0) - (y || 0)); }); }
  }
  const max = o.max || 1000;
  const head = '<tr>' + cols.map(c => '<th class="' + (c.num ? 'n ' : '') + (c.nosort ? '' : 's ') + (st.k === c.k ? 'on' : '') + '"' + (c.nosort ? '' : ' data-sort="' + id + '" data-k="' + c.k + '"') + (c.title ? ' title="' + esc(c.title) + '"' : '') + '>' + esc(c.label) + (st.k === c.k ? (st.d < 0 ? ' ↓' : ' ↑') : '') + '</th>').join('') + '</tr>';
  const body = rows.slice(0, max).map(r => '<tr' + (o.row ? ' ' + o.row(r) : '') + '>' + cols.map(c => '<td class="' + (c.num ? 'n ' : '') + (c.cls || '') + '">' + (c.fmt ? c.fmt(r) : esc(r[c.k])) + '</td>').join('') + '</tr>').join('');
  return '<table class="t"><thead>' + head + '</thead><tbody>' + (body || '<tr><td colspan="' + cols.length + '" class="empty">' + esc(o.empty || 'Nothing here.') + '</td></tr>') + '</tbody></table>' + (rows.length > max ? '<div class="muted" style="padding:8px">showing ' + max + ' of ' + rows.length + '</div>' : '');
};

// ---------- router ----------
RW.NAV = [
  ['Monitor', [['dashboard', 'Dashboard', 'grid'], ['performance', 'Performance', 'activity'], ['processes', 'Processes', 'list'], ['sensors', 'Sensors', 'thermo']]],
  ['Network', [['network', 'Network', 'globe'], ['security', 'Security', 'shield'], ['lab', 'Net Lab', 'flask']]],
  ['Build', [['dev', 'Dev & Containers', 'code'], ['services', 'Services & Startup', 'cog']]],
  ['Ops', [['toolbox', 'Toolbox', 'wrench'], ['alerts', 'Alerts', 'bell'], ['timeline', 'Timeline', 'clock'], ['system', 'System', 'info']]],
];
RW.go = (page, params) => { const q = params ? '?' + new URLSearchParams(params).toString() : ''; if (location.hash === '#/' + page + q) RW.route(); else location.hash = '#/' + page + q; };
RW.route = () => {
  const m = location.hash.match(/^#\/([\w-]+)(?:\?(.*))?$/);
  const page = m && RW.pages[m[1]] ? m[1] : 'dashboard';
  const params = Object.fromEntries(new URLSearchParams((m && m[2]) || ''));
  const P = RW.pages[page];
  if (RW.page && RW.page !== page && RW.pages[RW.page].unmount) RW.pages[RW.page].unmount();
  const same = RW.page === page;
  RW.page = page; RW.params = params;
  $('#pageTitle').textContent = P.title;
  $('#pageSub').textContent = P.sub || '';
  document.title = P.title + ' · RigWatch';
  RW.$$('#nav a').forEach(a => a.classList.toggle('on', a.dataset.page === page));
  const root = $('#page');
  if (!same || !P.keepOnParams) { root.innerHTML = ''; root.__h = null; root.scrollTop = 0; P.mount(root, params); }
  else if (P.onParams) P.onParams(params);
  RW.renderTopActions();
  document.getElementById('app').classList.remove('mobile-open');
  if (RW.snap && P.update) P.update(RW.snap);
};
RW.renderNav = () => {
  RW.setH('nav', RW.NAV.map(([g, items]) => '<h6>' + g + '</h6>' + items.map(([id, label, ic]) => '<a href="#/' + id + '" data-page="' + id + '" title="' + label + '">' + RW.icon(ic) + '<span>' + label + '</span><em class="badge hidden" id="nb-' + id + '"></em></a>').join('')).join(''));
};
RW.renderTopActions = () => {
  const P = RW.pages[RW.page] || {};
  let h = '';
  if (P.ranges) h += '<div class="seg" id="rangeSeg">' + ['15m', '1h', '6h', '24h', '7d'].map(r => '<button data-range="' + r + '" class="' + (RW.prefs.range === r ? 'on' : '') + '">' + r + '</button>').join('') + '</div>';
  if (P.topExtra) h += P.topExtra();
  h += '<button class="icon-btn' + (RW.paused ? ' on' : '') + '" data-cmd="pause" title="' + (RW.paused ? 'Resume' : 'Pause') + ' live updates (P)">' + RW.icon(RW.paused ? 'play' : 'pause') + '</button>';
  h += '<button class="icon-btn" data-cmd="theme" title="Toggle theme (T)">' + RW.icon(RW.prefs.theme === 'dark' ? 'sun' : 'moon') + '</button>';
  h += '<span class="icon-btn" title="' + (RW.canControl() ? 'Control unlocked on this device' : 'Read-only: open the token URL from the RigWatch console to unlock control') + '" style="cursor:default">' + RW.icon(RW.canControl() ? 'unlock' : 'lock') + '</span>';
  RW.setH('topActions', h);
};
RW.setRange = r => { RW.prefs.range = r; RW.savePrefs(); RW.renderTopActions(); RW.emit('range', r); };

// ---------- live data ----------
RW.histFor = range => (range === '15m' || !RW.remoteHist || RW.remoteHist.range !== range ? RW.hist : RW.remoteHist);
RW.loadRange = async range => {
  if (range === '15m') { RW.remoteHist = null; return RW.hist; }
  const h = await RW.api('/api/history?range=' + range);
  RW.remoteHist = h; return h;
};
function pushHist(hp) {
  if (!hp) return;
  const H = RW.hist;
  if (H.t.length && H.t[H.t.length - 1] >= hp.t) return;
  for (const k of HKEYS) { const a = H[k]; a.push(hp[k] == null ? null : hp[k]); if (a.length > RW.HMAX) a.shift(); }
}
RW.renderAll = () => {
  const s = RW.snap; if (!s) return;
  try { RW.renderStatus(s); RW.renderBadges(s); } catch (e) { console.error(e); }
  const P = RW.pages[RW.page];
  try { if (P && P.update) P.update(s); } catch (e) { console.error(e); }
  try { RW.drawer.update(s); } catch (e) { console.error(e); }
  RW.emit('rendered', s);
};
RW.renderBadges = s => {
  const set = (id, n, cls) => { const el = document.getElementById('nb-' + id); if (!el) return; el.textContent = n || ''; el.className = 'badge ' + (cls || '') + (n ? '' : ' hidden'); };
  const sc = s.security.counts; set('security', sc.critical + sc.high || sc.medium || 0, sc.critical + sc.high ? 'crit' : sc.medium ? 'warn' : '');
  set('alerts', s.alerts.firing.length, 'crit');
  set('dev', (s.procs || []).filter(p => RW.isDev(p) && p.ports && p.ports.length).length + (s.docker && s.docker.containers ? s.docker.containers.filter(c => c.state === 'running').length : 0));
  set('lab', [...RW.jobs.values()].filter(j => j.s.status === 'running').length);
};
RW.renderStatus = s => {
  const g = s.gpus[0], n = s.net;
  const parts = [
    '<span class="dot ' + (RW.connected ? 'live' : 'off') + '"></span><span>' + (RW.paused ? 'paused' : RW.connected ? 'live' : 'reconnecting…') + '</span>',
    '<span class="sep"></span><span>CPU <b>' + F.pct(s.cpu.util) + '</b>' + (s.cpu.temp != null ? ' ' + F.temp(s.cpu.temp) : '') + '</span>',
    g ? '<span>GPU <b>' + F.pct(g.util) + '</b>' + (g.temp != null ? ' ' + F.temp(g.temp) : '') + '</span>' : '',
    '<span>RAM <b>' + F.pct(100 * s.mem.used / s.mem.total) + '</b></span>',
    '<span class="hide-m">↓ <b>' + F.bits(n.rx) + '</b> ↑ <b>' + F.bits(n.tx) + '</b></span>',
    n.ping ? '<span class="hide-m">ping <b>' + F.ms(n.ping.ms) + '</b></span>' : '',
    s.fps.main ? '<span>FPS <b>' + Math.round(s.fps.main.fps) + '</b></span>' : '',
    '<span class="spacer"></span>',
    s.alerts.firing.length ? '<a data-go="alerts" class="chip crit"><i></i>' + s.alerts.firing.length + ' alert' + (s.alerts.firing.length > 1 ? 's' : '') + ' firing</a>' : '',
    '<a data-go="security" class="hide-m">security <b>' + s.security.score + '</b>/100</a>',
    '<span class="hide-m">' + esc(RW.st ? RW.st.hostname : '') + ' · up ' + F.age(s.uptime) + '</span>',
  ];
  RW.setH('status', parts.join(''));
  const warn = [];
  if (s.fallback) warn.push('Detailed collectors are starting or unavailable; showing basic CPU and memory only.');
  RW.setH('banner', warn.length ? '<div class="banner">' + RW.icon('alert') + esc(warn.join(' ')) + '</div>' : '');
};

// ---------- SSE ----------
RW.connect = () => {
  const es = new EventSource('/api/stream');
  es.addEventListener('hello', e => {
    const h = JSON.parse(e.data);
    RW.st = h.static; RW.auth = h.auth; RW.settings = h.settings; RW.webhook = h.webhook;
    $('#ver').textContent = 'v' + RW.st.version;
    RW.setH('sideFoot', '<span class="txt">' + esc(RW.st.hostname) + '</span><span class="txt faint">' + esc(RW.st.platformLabel) + ' · Node ' + esc(RW.st.node) + '</span>');
    RW.renderTopActions(); RW.emit('hello', h);
  });
  es.addEventListener('static', e => { RW.st = JSON.parse(e.data); RW.emit('static'); });
  es.addEventListener('history', e => { const h = JSON.parse(e.data); HKEYS.forEach(k => { RW.hist[k] = (h[k] || []).slice(-RW.HMAX); }); });
  es.addEventListener('snap', e => {
    const s = JSON.parse(e.data);
    RW.prev = RW.snap; RW.snap = s; pushHist(s.hp);
    RW.emit('snap', s);
    if (!RW.connected) { RW.connected = true; }
    if (!RW.paused && !document.hidden) RW.renderAll();
  });
  es.addEventListener('events', e => {
    const list = JSON.parse(e.data);
    const known = new Set(RW.events.slice(-500).map(x => x.id));
    for (const ev of list) if (!known.has(ev.id)) RW.events.push(ev);
    if (RW.events.length > 3000) RW.events.splice(0, RW.events.length - 3000);
    RW.emit('events', list);
  });
  es.addEventListener('job', e => {
    const m = JSON.parse(e.data);
    let j = RW.jobs.get(m.id); if (!j) { j = { s: { id: m.id, status: 'running' }, lines: [], result: null }; RW.jobs.set(m.id, j); }
    for (const it of m.items) {
      if (it.type === 'line') j.lines.push(it.data);
      else if (it.type === 'result') j.result = it.data;
      else if (it.type === 'progress') j.s.progress = it.data;
      else if (it.type === 'start' || it.type === 'done') Object.assign(j.s, it.data);
    }
    if (j.lines.length > 5000) j.lines.splice(0, 1000);
    RW.emit('job', m.id);
  });
  es.addEventListener('alert', e => {
    for (const a of JSON.parse(e.data)) {
      RW.toast(a.msg, 'warn', 9000);
      if (RW.prefs.notify && 'Notification' in window && Notification.permission === 'granted') { try { new Notification('RigWatch', { body: a.msg, tag: a.id }); } catch { /* ignore */ } }
    }
  });
  es.onerror = () => { RW.connected = false; if (RW.snap) RW.renderStatus(RW.snap); };
};

// ---------- tooltip ----------
RW.tip = (html, x, y) => {
  const el = $('#tip');
  if (!html) { el.classList.add('hidden'); return; }
  el.innerHTML = html; el.classList.remove('hidden');
  const w = el.offsetWidth, h = el.offsetHeight;
  let left = x + 14; if (left + w > innerWidth - 8) left = x - w - 14;
  let top = y; if (top + h > innerHeight - 8) top = innerHeight - h - 8;
  el.style.left = Math.max(8, left) + 'px'; el.style.top = Math.max(8, top) + 'px';
};

// ---------- theme & appearance ----------
RW.ACCENTS = { blue: ['#3987e5', '#2a78d6'], violet: ['#9085e9', '#6250d6'], aqua: ['#199e70', '#1baf7a'], orange: ['#d95926', '#eb6834'], pink: ['#d55181', '#e87ba4'], amber: ['#c98500', '#b37500'] };
RW.applyAppearance = () => {
  const a = RW.ACCENTS[RW.prefs.accent] || RW.ACCENTS.blue;
  document.documentElement.style.setProperty('--accent', RW.prefs.theme === 'light' ? a[1] : a[0]);
  document.body.classList.toggle('compact', !!RW.prefs.compact);
};
RW.applyTheme = t => { RW.prefs.theme = t; RW.savePrefs(); document.documentElement.setAttribute('data-theme', t); RW.applyAppearance(); RW.emit('theme', t); RW.renderTopActions(); };
})();
