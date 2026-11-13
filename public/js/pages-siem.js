'use strict';
/* SIEM: a Wazuh-style security center. Modules grouped in categories, every view is charts and cards. */
(() => {
const { esc, f: F, icon, setH } = RW;

// ------------------------------------------------------------------ constants
const SEVC = ['var(--faint)', 'var(--s1)', 'var(--warn)', 'var(--serious)', 'var(--crit)'];
const SEVN = ['Info', 'Low', 'Medium', 'High', 'Critical'];
const SEVR = ['level 0–3', 'level 4–6', 'level 7–9', 'level 10–11', 'level 12–15'];
const band = lv => (lv >= 12 ? 4 : lv >= 10 ? 3 : lv >= 7 ? 2 : lv >= 4 ? 1 : 0);
const CAT = i => 'var(--s' + ((i % 8) + 1) + ')';
const RANGES = [['24h', '24 h'], ['7d', '7 days'], ['30d', '30 days'], ['90d', '90 days'], ['365d', '1 year']];
RW.prefs.siemRange = RW.prefs.siemRange || '7d';
const range = () => RW.prefs.siemRange;
const rangeLabel = () => (RANGES.find(r => r[0] === range()) || RANGES[1])[1];

const MODS = {
  overview: { name: 'Security center', icon: 'shield', desc: 'every security module of this machine at a glance' },
  hunt: { cat: 'sim', name: 'Threat hunting', icon: 'search', desc: 'search, slice and drill into every security event' },
  fim: { cat: 'sim', name: 'Integrity monitoring', icon: 'file', desc: 'hosts file, startup folders, tasks, SSH keys and autostart registry', api: 'fim' },
  mitre: { cat: 'detect', name: 'MITRE ATT&CK', icon: 'target', desc: 'tactics and techniques detected on this machine', api: 'mitre' },
  malware: { cat: 'detect', name: 'Malware detection', icon: 'fire', desc: 'Defender detections, suspicious and first-run programs, threat-feed hits', api: 'malware' },
  network: { cat: 'detect', name: 'Network & IPs', icon: 'globe', desc: 'every remote address, inbound attempts, scans and drops', api: 'network' },
  response: { cat: 'detect', name: 'Active response', icon: 'ban', desc: 'block addresses by hand or automatically', api: 'response' },
  auth: { cat: 'audit', name: 'Authentication', icon: 'user', desc: 'sign-ins, failures, brute force, sessions and accounts', api: 'auth' },
  sca: { cat: 'audit', name: 'Configuration assessment', icon: 'clipboard', desc: 'hardening benchmark for this machine, with a score', api: 'sca' },
  audit: { cat: 'audit', name: 'System auditing', icon: 'list', desc: 'accounts, services, tasks, policies, cleared logs, firewall rules', api: 'audit' },
  compliance: { cat: 'comp', name: 'Regulatory compliance', icon: 'book', desc: 'PCI DSS, GDPR, NIST 800-53 and HIPAA views of your events' },
};
const CATS = [['sim', 'Security information management'], ['detect', 'Threat detection and response'], ['audit', 'Auditing and policy monitoring'], ['comp', 'Regulatory compliance']];
const FWS = [['pci_dss', 'PCI DSS'], ['gdpr', 'GDPR'], ['nist_800_53', 'NIST 800-53'], ['hipaa', 'HIPAA']];
const QUICK = [['Failed logons', 'group:authentication_failed'], ['Brute force', 'group:brute_force'], ['Level 10+', 'level>=10'], ['Inbound from internet', 'rule:6005'], ['New programs', 'rule:7001'], ['Firewall rule changes', 'group:firewall'], ['File changes', 'group:syscheck'], ['Account changes', 'group:account_changed']];

// ------------------------------------------------------------------ data
const cache = new Map();
async function get(url, ttl = 8000) {
  const c = cache.get(url);
  if (c && Date.now() - c.at < ttl) return c.data;
  const data = await RW.api(url);
  cache.set(url, { at: Date.now(), data });
  return data;
}
const qs = o => Object.entries(o).filter(([, v]) => v != null && v !== '').map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');
const facets = (o = {}) => get('/api/siem/facets?' + qs(Object.assign({ range: range() }, o)));
const overview = () => get('/api/siem/overview?range=' + range());
let rulesMeta = null;
const meta = async () => rulesMeta || (rulesMeta = await RW.api('/api/siem/rules?range=' + range()));

// ------------------------------------------------------------------ chart kit (SVG, theme tokens)
const TIPS = {};
let tipSeq = 0;
const nid = p => (p || 'c') + (++tipSeq);
const fmtT = (t, step) => { const d = new Date(t); return step >= 86400e3 ? d.toLocaleDateString([], { month: 'short', day: 'numeric' }) : d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); };
const pct = (v, t) => (t ? Math.round(100 * v / t) : 0) + '%';
const nf = n => F.num(n);

function legend(items) { return '<div class="slegend">' + items.map(([c, l]) => '<span><i style="background:' + c + '"></i>' + esc(l) + '</span>').join('') + '</div>'; }
/** stacked severity columns over time */
function stackBars(hist, step, o = {}) {
  if (!hist || !hist.length) return '<div class="empty">No data.</div>';
  const id = nid('sb'), n = hist.length, H = o.h || 150, W = 1000, bw = W / n, gap = n > 80 ? 0.6 : n > 40 ? 1.5 : 3;
  const tot = hist.map(h => h.b.reduce((a, x) => a + x, 0)), mx = Math.max(1, ...tot);
  let s = '';
  for (let g = 1; g <= 3; g++) s += '<line x1="0" x2="' + W + '" y1="' + (H - g * H / 4) + '" y2="' + (H - g * H / 4) + '" class="gl"/>';
  hist.forEach((h, i) => {
    let y = H;
    for (let k = 0; k < 5; k++) { const v = h.b[k]; if (!v) continue; const hh = Math.max(1.5, v / mx * (H - 6)); y -= hh; s += '<rect x="' + (i * bw + gap / 2).toFixed(2) + '" y="' + y.toFixed(2) + '" width="' + Math.max(0.5, bw - gap).toFixed(2) + '" height="' + hh.toFixed(2) + '" fill="' + SEVC[k] + '"/>'; }
    s += '<rect class="hit" data-tipk="' + id + ':' + i + '" x="' + (i * bw).toFixed(2) + '" y="0" width="' + bw.toFixed(2) + '" height="' + H + '"/>';
  });
  TIPS[id] = i => '<b>' + esc(fmtT(hist[i].t, step)) + '</b>' + (step >= 86400e3 ? '' : '') + '<div class="tiprows">' + [4, 3, 2, 1, 0].filter(k => hist[i].b[k]).map(k => '<div><i style="background:' + SEVC[k] + '"></i>' + SEVN[k] + '<b>' + nf(hist[i].b[k]) + '</b></div>').join('') + '<div class="tt">Total<b>' + nf(tot[i]) + '</b></div></div>';
  const ax = [0, Math.floor(n / 2), n - 1].map(i => '<span>' + esc(fmtT(hist[i].t, step)) + '</span>').join('');
  return '<div class="schart"><span class="ymax">' + nf(mx) + '</span><svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" style="height:' + H + 'px">' + s + '</svg><div class="xax">' + ax + '</div></div>' + (o.noLegend ? '' : legend(SEVN.map((l, k) => [SEVC[k], l]).reverse()));
}
/** line chart for a few series sharing x */
function lines(t, series, step, o = {}) {
  const n = t.length; if (!n) return '<div class="empty">No data.</div>';
  const id = nid('ln'), H = o.h || 150, W = 1000, mx = Math.max(1, ...series.flatMap(s => s.v));
  const x = i => (n === 1 ? W / 2 : i * W / (n - 1)), y = v => H - 4 - (v / mx) * (H - 10);
  let s = '';
  for (let g = 1; g <= 3; g++) s += '<line x1="0" x2="' + W + '" y1="' + (H - g * H / 4) + '" y2="' + (H - g * H / 4) + '" class="gl"/>';
  for (const se of series) {
    const pts = se.v.map((v, i) => x(i).toFixed(1) + ',' + y(v).toFixed(1));
    s += '<path d="M' + x(0).toFixed(1) + ',' + H + ' L' + pts.join(' L') + ' L' + x(n - 1).toFixed(1) + ',' + H + ' Z" fill="' + se.c + '" opacity=".10"/>';
    s += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + se.c + '" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>';
  }
  const bw = W / n;
  for (let i = 0; i < n; i++) s += '<rect class="hit" data-tipk="' + id + ':' + i + '" x="' + (x(i) - bw / 2).toFixed(1) + '" y="0" width="' + bw.toFixed(1) + '" height="' + H + '"/>';
  TIPS[id] = i => '<b>' + esc(fmtT(t[i], step)) + '</b><div class="tiprows">' + series.map(se => '<div><i style="background:' + se.c + '"></i>' + esc(se.l) + '<b>' + nf(se.v[i]) + '</b></div>').join('') + '</div>';
  const ax = [0, Math.floor(n / 2), n - 1].map(i => '<span>' + esc(fmtT(t[i], step)) + '</span>').join('');
  return '<div class="schart"><span class="ymax">' + nf(mx) + '</span><svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" style="height:' + H + 'px">' + s + '</svg><div class="xax">' + ax + '</div></div>' + legend(series.map(se => [se.c, se.l]));
}
/** donut with legend; items [{l, v, c, f}] (f = hunt filter on click) */
function donut(items, center, o = {}) {
  items = items.filter(x => x.v > 0);
  const tot = items.reduce((a, x) => a + x.v, 0);
  if (!tot) return '<div class="empty">' + esc(o.empty || 'Nothing in this period.') + '</div>';
  const id = nid('dn'), r = 40, C = 2 * Math.PI * r;
  let off = 0, s = '';
  items.forEach((x, i) => {
    const len = x.v / tot * C, g = items.length > 1 ? Math.min(1.6, len / 3) : 0;
    s += '<circle r="' + r + '" cx="50" cy="50" fill="none" stroke="' + x.c + '" stroke-width="14" stroke-dasharray="' + Math.max(0.01, len - g).toFixed(2) + ' ' + (C - len + g).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" data-tipk="' + id + ':' + i + '"' + (x.f ? ' data-f="' + esc(x.f) + '" class="clk"' : '') + '/>';
    off += len;
  });
  TIPS[id] = i => '<b>' + esc(items[i].l) + '</b><div class="tiprows"><div>' + nf(items[i].v) + ' events<b>' + pct(items[i].v, tot) + '</b></div></div>';
  return '<div class="donut"><div class="dsvg"><svg viewBox="0 0 100 100" role="img" aria-label="' + esc(o.label || 'distribution') + '"><g transform="rotate(-90 50 50)">' + s + '</g></svg><div class="dc"><b>' + nf(tot) + '</b><span>' + esc(center || 'events') + '</span></div></div>' +
    '<div class="dleg">' + items.map(x => '<div class="' + (x.f ? 'clk' : '') + '"' + (x.f ? ' data-f="' + esc(x.f) + '"' : '') + '><i style="background:' + x.c + '"></i><span class="dl" title="' + esc(x.l) + '">' + esc(x.l) + '</span><b>' + nf(x.v) + '</b><em>' + pct(x.v, tot) + '</em></div>').join('') + '</div></div>';
}
/** ranked bars; rows [{l, v, sub, attrs, c}] */
function bars(rows, o = {}) {
  rows = rows.filter(r => r.v > 0);
  if (!rows.length) return '<div class="empty">' + esc(o.empty || 'Nothing in this period.') + '</div>';
  const mx = Math.max(...rows.map(r => r.v));
  return '<div class="hbars sb">' + rows.slice(0, o.max || 12).map((r, i) => '<div class="hb' + (r.attrs ? ' click" ' + r.attrs : '"') + '><span class="hbl" title="' + esc(r.title || r.l) + '">' + (r.html || esc(r.l)) + (r.sub ? ' <span class="muted">' + esc(r.sub) + '</span>' : '') + '</span><span class="hbt"><i style="width:' + Math.max(1, 100 * r.v / mx).toFixed(1) + '%;background:' + (r.c || o.c || 'var(--s1)') + '"></i></span><span class="hbv">' + nf(r.v) + '</span></div>').join('') + '</div>';
}
/** day-of-week x hour heatmap */
function weekHeat(week) {
  const mx = Math.max(1, ...week.flat()), days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return '<div class="wheat">' + week.map((row, d) => '<span class="wd">' + days[d] + '</span>' + row.map((v, h) => '<i title="' + days[d] + ' ' + String(h).padStart(2, '0') + ':00 · ' + v + ' events" style="background:' + (v ? 'color-mix(in srgb, var(--s1) ' + Math.round(15 + 85 * v / mx) + '%, var(--panel2))' : 'var(--panel2)') + '"></i>').join('')).join('') +
    '<span></span>' + Array.from({ length: 24 }, (_, h) => '<span class="wh">' + (h % 6 === 0 ? h : '') + '</span>').join('') + '</div>';
}
function spark(vals, c) {
  if (!vals || vals.length < 2) return '';
  const mx = Math.max(1, ...vals), W = 100, H = 24;
  const pts = vals.map((v, i) => (i * W / (vals.length - 1)).toFixed(1) + ',' + (H - 2 - v / mx * (H - 4)).toFixed(1)).join(' ');
  return '<svg class="spk" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><polyline points="' + pts + '" fill="none" stroke="' + (c || 'var(--accent)') + '" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>';
}
function sevStrip(b) { const t = b.reduce((a, x) => a + x, 0); return t ? '<div class="sstrip">' + [4, 3, 2, 1, 0].filter(k => b[k]).map(k => '<i style="flex:' + b[k] + ';background:' + SEVC[k] + '" title="' + SEVN[k] + ': ' + b[k] + '"></i>').join('') + '</div>' : '<div class="sstrip"><i style="flex:1;background:var(--panel3)"></i></div>'; }
const kpi = (label, value, sub, color, attrs, ic) => '<div class="kpi skpi"' + (attrs ? ' ' + attrs : ' style="cursor:default"') + '><div class="kl"><span>' + esc(label) + '</span>' + (ic ? '<span style="color:' + (color || 'var(--muted)') + '">' + icon(ic) + '</span>' : '') + '</div><div class="kv2"' + (color ? ' style="color:' + color + '"' : '') + '>' + esc(value) + '</div><div class="ks">' + esc(sub || '') + '</div></div>';
const card = (title, body, o = {}) => '<article class="card' + (o.cls ? ' ' + o.cls : '') + '"' + (o.style ? ' style="' + o.style + '"' : '') + '><header><h2>' + esc(title) + '</h2>' + (o.right ? '<span class="right">' + o.right + '</span>' : o.sub ? '<span class="right muted" style="font-size:12px">' + esc(o.sub) + '</span>' : '') + '</header>' + body + '</article>';
const facetRows = (list, key, o = {}) => (list || []).map(([v, n]) => ({ l: o.label ? o.label(v) : v, v: n, attrs: key ? 'data-f="' + esc(key + ':' + (/\s/.test(v) ? '"' + v + '"' : v)) + '"' : '', title: v }));
const histTotals = h => { const b = [0, 0, 0, 0, 0]; for (const x of h || []) x.b.forEach((v, i) => { b[i] += v; }); return b; };
const levelBadge = lv => '<span class="lvb" style="--c:' + SEVC[band(lv)] + '">' + lv + '</span>';

// ------------------------------------------------------------------ event feed
const expanded = new Set();
const evKey = e => e.ts + ':' + e.rule.id + ':' + (e.ip || '') + ':' + (e.user || '') + ':' + String(e.msg).length;
function evItem(e) {
  const k = evKey(e), open = expanded.has(k), mitre = (e.rule.mitre || []);
  const chips = [];
  if (e.ip) chips.push('<a class="echip" data-ipd="' + esc(e.ip) + '">' + icon('globe') + esc(e.ip) + '</a>');
  if (e.user) chips.push('<a class="echip" data-f="user:' + esc(e.user) + '">' + icon('user') + esc(e.user) + '</a>');
  if (e.process) chips.push('<a class="echip" data-f="proc:' + esc(e.process) + '">' + icon('box') + esc(e.process) + '</a>');
  for (const m of mitre) chips.push('<a class="echip mitre" data-f="mitre:' + esc(m) + '" title="' + esc((rulesMeta && rulesMeta.mitre[m]) || '') + '">' + esc(m) + '</a>');
  chips.push('<a class="echip faint" data-f="rule:' + e.rule.id + '">rule ' + e.rule.id + '</a>');
  return '<div class="sev-ev' + (open ? ' open' : '') + '" style="--c:' + SEVC[band(e.rule.level)] + '">' +
    '<div class="evh" data-evx="' + esc(k) + '">' + levelBadge(e.rule.level) + '<div class="evm"><div class="evt"><b>' + esc(e.rule.description) + '</b><time title="' + esc(new Date(e.ts).toLocaleString()) + '">' + esc(F.date(e.ts)) + '</time></div><div class="evd">' + esc(e.msg) + '</div></div></div>' +
    '<div class="evc">' + chips.join('') + '</div>' +
    (open ? evDetail(e) : '') + '</div>';
}
function evDetail(e) {
  const rows = [['Time', new Date(e.ts).toLocaleString()], ['Rule', e.rule.id + ' · level ' + e.rule.level + ' (' + SEVN[band(e.rule.level)].toLowerCase() + ')'], ['Groups', e.rule.groups.join(', ')], ['MITRE', (e.rule.mitre || []).map(m => m + ' ' + ((rulesMeta && rulesMeta.mitre[m]) || '')).join(', ')], ['Source', e.location], ['Address', e.ip], ['User', e.user], ['Process', e.process]];
  for (const [k, v] of Object.entries(e.data || {})) rows.push(['data.' + k, typeof v === 'object' ? JSON.stringify(v) : String(v)]);
  const acts = [];
  if (e.ip && RW.canControl() && RW.ipKind(e.ip) !== 'loopback') acts.push('<button class="btn sm danger" data-block="' + esc(e.ip) + '">' + icon('ban') + 'Block ' + esc(e.ip) + '</button>');
  if (e.ip) acts.push('<button class="btn sm" data-ipd="' + esc(e.ip) + '">' + icon('globe') + 'IP details</button>');
  acts.push('<button class="btn sm" data-f="rule:' + e.rule.id + '">' + icon('search') + 'Same rule</button>');
  acts.push('<button class="btn sm" data-copyev="' + esc(JSON.stringify(e)) + '">' + icon('copy') + 'Copy JSON</button>');
  return '<div class="evx"><dl class="evkv">' + rows.filter(r => r[1] != null && r[1] !== '').map(r => '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>').join('') + '</dl><div class="evacts">' + acts.join('') + '</div><pre class="evjson">' + esc(JSON.stringify(e, null, 2)) + '</pre></div>';
}
const feed = (list, empty) => (list && list.length ? '<div class="sfeed">' + list.map(evItem).join('') + '</div>' : '<div class="empty">' + esc(empty || 'No events in this period.') + '</div>');

// ------------------------------------------------------------------ IP drawer
let drawerEvents = [];
RW.openIp = ip => {
  RW.drawer.open(ip, {
    mount(b) {
      b.innerHTML = '<div class="empty">Loading…</div>';
      RW.api('/api/siem/ip?ip=' + encodeURIComponent(ip)).then(d => {
        drawerEvents = d.events || [];
        const e = d.entry || {}, pub = d.kind === 'public', name = RW.rdns && RW.rdns.get(ip);
        b.innerHTML = '<div class="iph"><span class="mono big">' + esc(ip) + '</span>' + kindChip(d.kind) + (d.feed ? '<span class="chip crit"><i></i>' + esc(d.feed) + '</span>' : '') + (d.blocked ? '<span class="chip crit"><i></i>blocked</span>' : '') + '</div>' + (name ? '<div class="muted" style="margin:-4px 0 10px">' + esc(name) + '</div>' : '') +
          '<div class="ipstats">' + [['Events', e.events || 0], ['Connections', e.conns || 0], ['Inbound', e.inb || 0], ['Outbound', e.outb || 0], ['Failed logons', e.fail || 0], ['Dropped pkts', e.drops || 0]].map(x => '<div><b>' + nf(x[1]) + '</b><span>' + x[0] + '</span></div>').join('') + '</div>' +
          RW.kv([['First seen', e.first ? F.date(e.first) : '–'], ['Last seen', e.last ? F.ago(e.last) : '–'], ['Apps', esc((e.procs || []).join(', '))], ['Remote ports', esc((e.rports || []).join(', '))], ['Local ports hit', esc((e.lports || []).join(', '))], ['Highest level', e.maxLevel ? levelBadge(e.maxLevel) : '']]) +
          '<div class="evacts" style="margin:12px 0">' + (RW.canControl() ? (d.blocked ? '<button class="btn sm" data-unblock="' + esc(ip) + '">' + icon('check') + 'Unblock</button>' : '<button class="btn sm danger" data-block="' + esc(ip) + '">' + icon('ban') + 'Block</button>') : '') +
          '<button class="btn sm" data-f="ip:' + esc(ip) + '">' + icon('search') + 'Hunt this IP</button>' + (pub ? '<a class="btn sm" href="https://www.abuseipdb.com/check/' + encodeURIComponent(ip) + '" target="_blank" rel="noopener noreferrer">' + icon('ext') + 'AbuseIPDB</a><a class="btn sm" href="https://www.virustotal.com/gui/ip-address/' + encodeURIComponent(ip) + '" target="_blank" rel="noopener noreferrer">' + icon('ext') + 'VirusTotal</a>' : '<button class="btn sm" data-go="lab">' + icon('radar') + 'Net Lab</button>') + '</div>' +
          '<h3 style="margin:14px 0 8px;font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.6px">History</h3>' + feed(d.events, 'No security events for this address yet.');
      }).catch(er => { b.innerHTML = '<div class="empty">' + esc(er.message) + '</div>'; });
    },
  });
};
const kindChip = k => '<span class="chip ' + (k === 'public' ? 'info' : k === 'private' ? 'good' : '') + '"><i></i>' + esc(k === 'private' ? 'LAN' : k) + '</span>';

// ------------------------------------------------------------------ page shell
let cur = null, renderTimer = null, renderSeq = 0;
function shell(id) {
  const m = MODS[id];
  const pills = '<div class="mbar">' + ['overview'].concat(Object.keys(MODS).filter(k => k !== 'overview')).map(k => '<a data-mod="' + k + '" class="' + (k === id ? 'on' : '') + '">' + icon(MODS[k].icon) + '<span>' + esc(MODS[k].name) + '</span></a>').join('') + '</div>';
  return pills + '<div class="mhead"><span class="mico">' + icon(m.icon) + '</span><div><h2>' + esc(m.name) + '</h2><div class="muted">' + esc(m.desc) + '</div></div><span class="grow"></span><span id="sm-new"></span><div id="sm-agent" class="agent"></div><div class="srange"><div class="seg">' + RANGES.map(([k, l]) => '<button data-srange="' + k + '" class="' + (range() === k ? 'on' : '') + '" title="Last ' + l + '">' + l.replace(' days', 'd').replace(' year', 'y').replace(' h', 'h') + '</button>').join('') + '</div><button class="icon-btn" data-srefresh="1" title="Refresh">' + icon('refresh') + '</button></div></div><div id="sm-tabs"></div><div id="sm-body"><div class="empty">Loading…</div></div>';
}
function tabs(list, curTab) { return '<div class="toolbar"><div class="seg" id="smtabs">' + list.map(([k, l]) => '<button data-stab="' + k + '" class="' + (curTab === k ? 'on' : '') + '">' + esc(l) + '</button>').join('') + '</div></div>'; }
async function agentStrip() {
  try {
    const o = await overview();
    const a = o.agent, st = o.stats;
    setH('sm-agent', '<span class="chip good"><i></i>active</span><span title="' + esc(a.os) + '">' + icon('cpu') + esc(a.name) + '</span>' + (a.ip ? '<span class="mono">' + esc(a.ip) + '</span>' : '') + (a.elevated ? '<span class="chip good"><i></i>admin</span>' : '<a class="chip warn link" data-cmd="elevate" title="Security log, sessions of other users and blocking need admin"><i></i>not admin</a>') + '<span class="muted" title="Kept on disk: ' + esc(st.dir || '') + '">' + (st.days || 0) + ' of ' + st.retentionDays + ' days · ' + F.b(st.bytes || 0) + '</span>');
    return o;
  } catch { return null; }
}
const huntGo = q => RW.go('siem-hunt', { q });
function addFilter(f) {
  if (RW.page === 'siem-hunt') {
    const inp = document.getElementById('hq');
    const parts = (inp.value.trim() ? inp.value.trim().split(/\s+(?=(?:[^"]*"[^"]*")*[^"]*$)/) : []).filter(x => x.split(':')[0] !== f.split(':')[0] || /^level/.test(f));
    parts.push(f); inp.value = parts.join(' '); hunt.q = inp.value; hunt.events = null; render();
  } else huntGo(f);
}

function schedule(ms) { if (renderTimer) return; renderTimer = setTimeout(() => { renderTimer = null; render(); }, ms || 0); }
async function render() {
  if (!cur || RW.page !== 'siem' + (cur.id === 'overview' ? '' : '-' + cur.id)) return;
  const seq = ++renderSeq;
  fresh = 0; pill();
  agentStrip();
  try {
    const html = await RENDER[cur.id](cur);
    if (seq !== renderSeq || !cur) return;
    if (html != null) { const b = document.getElementById('sm-body'); if (b) { b.innerHTML = html; b.__h = null; } }
    if (RENDER[cur.id].after) RENDER[cur.id].after(cur);
  } catch (e) { const b = document.getElementById('sm-body'); if (b) b.innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; }
}
// live events: count them in a "new events" pill instead of re-rendering under the user's cursor;
// the overview refreshes itself at most every 30 s
let fresh = 0, lastAuto = 0;
function pill() {
  const el = document.getElementById('sm-new'); if (!el) return;
  el.innerHTML = fresh ? '<button class="btn sm newpill" data-srefresh="1">' + icon('refresh') + nf(fresh) + ' new event' + (fresh > 1 ? 's' : '') + '</button>' : '';
}
RW.on('siem', d => {
  if (d && d.events) {
    const n = d.events.filter(e => e.rule.level >= 3).length;
    const hi = d.events.filter(e => e.rule.level >= 10).length;
    if (hi) { RW.siemNew = (RW.siemNew || 0) + hi; const el = document.getElementById('nb-siem'); if (el && RW.page !== 'siem') { el.textContent = RW.siemNew; el.className = 'badge crit'; } }
    if (!n) return;
    fresh += n;
  }
  if (!cur || !RW.page || !RW.page.startsWith('siem')) return;
  if (cur.id === 'overview' && Date.now() - lastAuto > 30000) { lastAuto = Date.now(); cache.clear(); schedule(500); return; }
  if (!d || !d.events) { fresh = Math.max(fresh, 1); }
  pill();
});

// ------------------------------------------------------------------ module renderers
const RENDER = {};
const huntLink = (q, label) => '<a class="muted" style="font-size:12px" data-f="' + esc(q) + '">' + esc(label || 'hunt →') + '</a>';

// ===== Security center (overview)
RENDER.overview = async () => {
  const o = await overview();
  const s = o.summary, t = s.totals, b = t.bands, mods = o.modules.totals || {};
  const daysOf = id => o.modules.days.map(d => d.m[id] || 0);
  const kpis = '<div class="skpis">' +
    kpi('Total events', nf(t.n), rangeLabel(), null, 'data-mod="hunt"', 'activity') +
    kpi('Critical', nf(b[4]), 'level 12 or above', b[4] ? 'var(--crit)' : null, 'data-f="level>=12"', 'alert') +
    kpi('High', nf(b[3]), 'level 10–11', b[3] ? 'var(--serious)' : null, 'data-f="level>=10 level<=11"', 'alert') +
    kpi('Failed logons', nf(t.fail), 'authentication failures', t.fail ? 'var(--warn)' : null, 'data-f="group:authentication_failed"', 'lock') +
    kpi('Successful logons', nf(t.ok), 'sign-ins', null, 'data-mod="auth"', 'unlock') +
    kpi('Remote IPs', nf(o.ips.tracked), o.ips.public + ' public · ' + o.ips.inbound + ' inbound', null, 'data-mod="network"', 'globe') +
    kpi('Config score', o.sca.score == null ? '–' : o.sca.score + '%', o.sca.failed + ' checks failing', o.sca.score == null ? null : 'var(' + RW.scoreColor(o.sca.score) + ')', 'data-mod="sca"', 'clipboard') +
    kpi('Blocked IPs', nf(o.blocks), 'active response', null, 'data-mod="response"', 'ban') + '</div>';
  const evo = card('Alert level evolution', stackBars(s.buckets.map(x => ({ t: x.t, b: x.bands })), s.step, { h: 170 }), { right: '<a class="muted" style="font-size:12px" data-mod="hunt">open in threat hunting →</a>' });
  const sev = card('Alerts by severity', donut([4, 3, 2, 1, 0].map(k => ({ l: SEVN[k] + ' · ' + SEVR[k].replace('level ', ''), v: b[k], c: SEVC[k], f: k === 4 ? 'level>=12' : k === 3 ? 'level>=10 level<=11' : k === 2 ? 'level>=7 level<=9' : k === 1 ? 'level>=4 level<=6' : 'level<=3' })), 'alerts'));
  const catHtml = CATS.map(([c, title]) => {
    const ids = Object.keys(MODS).filter(k => MODS[k].cat === c);
    let cards = ids.map(id => {
      const m = MODS[id], api = m.api, sv = api && mods[api] ? mods[api] : null, n = sv ? sv.reduce((a, x) => a + x, 0) : null;
      const extra = id === 'sca' ? (o.sca.score == null ? 'not run yet' : o.sca.score + '% · ' + o.sca.failed + ' failing') : id === 'fim' ? nf(o.fim.files) + ' files · ' + nf(o.fim.registry) + ' autostart entries' : id === 'response' ? o.blocks + ' blocked' : id === 'network' ? nf(o.ips.tracked) + ' addresses' : id === 'hunt' ? nf(t.n) + ' events' : '';
      return '<div class="mcard" data-mod="' + id + '"><div class="mct">' + icon(m.icon) + '<b>' + esc(m.name) + '</b></div><div class="mcd">' + esc(m.desc) + '</div><div class="mcn"><span class="big">' + (n == null ? '' : nf(n)) + '</span><span class="muted">' + esc(extra || (n == null ? '' : 'events')) + '</span></div>' + (sv ? sevStrip(sv) + spark(daysOf(api), 'var(--accent)') : '') + '</div>';
    }).join('');
    if (c === 'comp') cards = FWS.map(([fw, name]) => '<div class="mcard" data-mod="compliance" data-fwp="' + fw + '"><div class="mct">' + icon('book') + '<b>' + esc(name) + '</b></div><div class="mcd">' + esc({ pci_dss: 'Payment Card Industry Data Security Standard', gdpr: 'EU General Data Protection Regulation', nist_800_53: 'NIST security and privacy controls', hipaa: 'US health data security rule' }[fw]) + '</div></div>').join('');
    return '<h3 class="scat">' + esc(title) + '</h3><div class="mgrid">' + cards + '</div>';
  }).join('');
  const top = '<div class="grid g3">' +
    card('Top rules', bars(s.top.rules.map(([id, n, d, lv]) => ({ l: d || 'rule ' + id, sub: '#' + id, v: n, c: SEVC[band(lv || 0)], attrs: 'data-f="rule:' + id + '"' })))) +
    card('Top remote addresses', bars(s.top.ips.map(([ip, n]) => ({ l: ip, v: n, html: '<span class="mono">' + esc(ip) + '</span>', attrs: 'data-ipd="' + esc(ip) + '"' })), { c: 'var(--s7)', empty: 'No address-related events.' })) +
    card('MITRE ATT&CK techniques', bars(s.top.mitre.map(([m, n]) => ({ l: m + ' ' + ((rulesMeta && rulesMeta.mitre[m]) || ''), v: n, attrs: 'data-f="mitre:' + esc(m) + '"' })), { c: 'var(--s5)' }), { right: '<a class="muted" style="font-size:12px" data-mod="mitre">matrix →</a>' }) + '</div>';
  const coll = o.collectors, src = [];
  if (coll.kind === 'windows') {
    const names = { 'sec': 'Security log', 'sec-logon': 'Logons', 'sys': 'System log', 'def': 'Defender', 'fw': 'Firewall rules', 'rdp': 'Remote Desktop', 'ssh': 'OpenSSH' };
    for (const [k, v] of Object.entries(coll.logs || {})) if (names[k]) src.push('<span class="chip ' + (v.ok ? 'good' : v.err === 'not present' ? '' : 'warn') + '" title="' + esc(v.err || 'reading') + '"><i></i>' + esc(names[k]) + (v.ok ? '' : ': ' + esc(v.err)) + '</span>');
    src.push('<span class="chip ' + (coll.firewallLog && coll.firewallLog.enabled ? 'good' : '') + '"><i></i>Firewall drop log' + (coll.firewallLog && coll.firewallLog.enabled ? '' : ': off') + '</span>');
  } else if (coll.kind === 'linux') src.push('<span class="chip ' + (coll.auth.ok ? 'good' : 'warn') + '" title="' + esc(coll.auth.err || '') + '"><i></i>' + esc(coll.auth.source || 'auth logs') + '</span>');
  else src.push('<span class="muted">' + esc(coll.note || '') + '</span>');
  src.push('<span class="chip good"><i></i>Connections & ports</span><span class="chip good"><i></i>Programs</span><span class="chip ' + (o.fim.at ? 'good' : '') + '"><i></i>File integrity</span><span class="chip ' + (o.sca.at ? 'good' : '') + '"><i></i>Configuration</span>');
  const needAdmin = coll.kind === 'windows' && !o.agent.elevated ? '<div class="note snote">' + icon('shield') + '<div><b>Running without admin.</b> Windows only lets administrators read the Security log (sign-ins, failures, account changes), see other users\' sessions and add firewall blocks. <button class="btn sm primary" data-cmd="elevate">' + icon('shield') + 'Restart as admin</button></div></div>' : '';
  return needAdmin + kpis + '<div class="grid g21">' + evo + sev + '</div>' + catHtml + top +
    '<div class="grid g2">' + card('Latest high-severity alerts', feed(o.recent, 'Nothing at level 7 or above in this period. Calm seas.'), { right: '<a class="muted" style="font-size:12px" data-f="level>=7">all →</a>' }) + card('Data sources', '<div class="srcs">' + src.join('') + '</div><div class="muted" style="font-size:12px;margin-top:10px">History is kept for ' + o.stats.retentionDays + ' days in daily JSON files (older days compressed) under ' + esc(o.stats.dir || '~/.rigwatch/siem') + '. Change with RETENTION_DAYS.</div>') + '</div>';
};
RENDER.overview.after = () => { meta().then(() => {}).catch(() => {}); };

// ===== Threat hunting (Discover)
const hunt = { q: '', events: null, more: false, cursor: null, min: '' };
RENDER.hunt = async c => {
  if (c.params.q != null && c.params.q !== hunt.q && !c.used) { hunt.q = c.params.q; hunt.events = null; }
  c.used = true;
  await meta().catch(() => {});
  const fc = await facets({ q: hunt.q, min: hunt.min });
  if (!hunt.events) { hunt.events = fc.latest; hunt.more = fc.total > fc.latest.length; hunt.cursor = fc.latest.length ? fc.latest[fc.latest.length - 1].ts : null; }
  const side = [['rule', 'Rules', 'rule', v => { const r = (fc.facets.rule || []).find(x => x[0] === v); return r ? r[2] : v; }], ['group', 'Groups', 'group'], ['ip', 'Addresses', 'ip'], ['user', 'Users', 'user'], ['process', 'Processes', 'proc'], ['location', 'Sources', 'loc'], ['tactic', 'MITRE tactics', null]]
    .filter(([k]) => (fc.facets[k] || []).length).map(([k, title, key, lab]) => '<div class="fset"><h4>' + esc(title) + '</h4>' + (fc.facets[k] || []).slice(0, 8).map(([v, n]) => '<a ' + (key ? 'data-f="' + esc(key + ':' + (/\s/.test(v) ? '"' + v + '"' : v)) + '"' : '') + ' title="' + esc(v) + '"><span>' + esc(lab ? lab(v) : v) + '</span><b>' + nf(n) + '</b></a>').join('') + '</div>').join('');
  return '<div class="hbar"><div class="hsearch">' + icon('search') + '<input id="hq" type="search" placeholder="Search events: text, ip:1.2.3.4  user:admin  rule:2004  group:brute_force  mitre:T1110  proc:sshd  level>=7" value="' + esc(hunt.q) + '"></div>' +
    '<select id="hmin"><option value="">all levels</option>' + [[3, '3+'], [7, '7+ medium'], [10, '10+ high'], [12, '12+ critical']].map(([v, l]) => '<option value="' + v + '"' + (String(hunt.min) === String(v) ? ' selected' : '') + '>level ' + l + '</option>').join('') + '</select>' +
    '<a class="btn sm" href="/api/siem/export?' + qs({ range: range(), q: hunt.q, min: hunt.min, format: 'csv' }) + '" download>' + icon('download') + 'CSV</a><a class="btn sm" href="/api/siem/export?' + qs({ range: range(), q: hunt.q, min: hunt.min, format: 'json' }) + '" download>' + icon('download') + 'JSON</a></div>' +
    '<div class="qchips">' + QUICK.map(([l, q]) => '<a class="echip" data-hq="' + esc(q) + '">' + esc(l) + '</a>').join('') + (hunt.q ? '<a class="echip faint" data-hq="">' + icon('x') + 'clear</a>' : '') + '</div>' +
    '<div class="hgrid"><aside class="card facets">' + (side || '<div class="empty">No fields.</div>') + '</aside><div>' +
    card(nf(fc.total) + ' hits' + (fc.capped ? ' (first ' + nf(fc.total) + ')' : ''), stackBars(fc.hist, fc.step, { h: 120 }), { sub: rangeLabel() }) +
    '<article class="card"><div id="hfeed">' + feed(hunt.events, hunt.q ? 'No events match this search.' : 'No events in this period yet.') + '</div>' + (hunt.more ? '<div style="text-align:center;margin-top:10px"><button class="btn" data-more="1">' + icon('plus') + 'Load older events</button></div>' : '') + '</article></div></div>';
};
async function huntMore() {
  if (!hunt.cursor) return;
  const r = await RW.api('/api/siem/events?' + qs({ range: range(), q: hunt.q, min: hunt.min, before: hunt.cursor, limit: 100 }));
  hunt.events = hunt.events.concat(r.events); hunt.more = r.more; hunt.cursor = r.cursor;
  render();
}

// ===== MITRE ATT&CK
let mitreSel = null;
RENDER.mitre = async () => {
  const [m, fc] = await Promise.all([meta(), facets({ module: 'mitre' })]);
  const tech = new Map(fc.facets.mitre || []), tac = new Map(fc.facets.tactic || []);
  const all = Object.keys(m.mitre);
  const mx = Math.max(1, ...tech.values());
  const matrix = '<div class="mtx">' + m.tactics.map(t => {
    const list = all.filter(x => (m.techTactics[x] || []).includes(t)).sort((a, b) => (tech.get(b) || 0) - (tech.get(a) || 0));
    return '<div class="mcol"><div class="mth"><b>' + esc(t) + '</b><span>' + nf(tac.get(t) || 0) + '</span></div>' + (list.length ? list.map(x => { const n = tech.get(x) || 0; return '<a class="mtile' + (n ? '' : ' zero') + (mitreSel === x ? ' sel' : '') + '" data-tech="' + esc(x) + '" style="' + (n ? 'background:color-mix(in srgb, var(--crit) ' + Math.round(14 + 60 * n / mx) + '%, var(--panel2))' : '') + '" title="' + esc(x + ' ' + m.mitre[x] + ': ' + n + ' events') + '"><span>' + esc(m.mitre[x]) + '</span><em>' + esc(x) + (n ? ' · ' + nf(n) : '') + '</em></a>'; }).join('') : '<div class="mnone">not monitored</div>') + '</div>';
  }).join('') + '</div>';
  const kp = '<div class="skpis">' + kpi('Events with ATT&CK', nf(fc.total), rangeLabel(), null, null, 'target') + kpi('Techniques seen', nf(tech.size), 'of ' + all.length + ' monitored', null, null, 'layers') + kpi('Tactics hit', nf(tac.size), 'of ' + m.tactics.length, null, null, 'activity') + kpi('Top technique', (fc.facets.mitre || [])[0] ? fc.facets.mitre[0][0] : '–', (fc.facets.mitre || [])[0] ? m.mitre[fc.facets.mitre[0][0]] : '', null, null, 'fire') + '</div>';
  let sel = '';
  if (mitreSel) {
    const ev = await get('/api/siem/events?' + qs({ range: range(), q: 'mitre:' + mitreSel, limit: 50 }));
    sel = card(mitreSel + ' · ' + (m.mitre[mitreSel] || ''), '<div class="muted" style="margin-bottom:10px">Tactics: ' + esc((m.techTactics[mitreSel] || []).join(', ')) + ' · <a href="https://attack.mitre.org/techniques/' + esc(mitreSel.replace('.', '/')) + '/" target="_blank" rel="noopener noreferrer">attack.mitre.org ' + icon('ext') + '</a></div>' + feed(ev.events, 'No events for this technique in this period.'), { right: '<button class="btn sm ghost" data-tech="">' + icon('x') + 'close</button>' });
  }
  return kp + card('ATT&CK matrix', matrix, { sub: 'click a technique' }) + sel + '<div class="grid g2">' +
    card('Tactics', bars((fc.facets.tactic || []).map(([t, n]) => ({ l: t, v: n })), { c: 'var(--s5)' })) +
    card('Techniques over time', stackBars(fc.hist, fc.step)) + '</div>';
};

// ===== Authentication
let authTab = 'dash';
RENDER.auth = async () => {
  setH('sm-tabs', tabs([['dash', 'Dashboard'], ['sessions', 'Sessions & accounts'], ['events', 'Events']], authTab));
  if (authTab === 'events') return moduleEvents('auth');
  if (authTab === 'sessions') return authSessions();
  const [o, fc] = await Promise.all([overview(), facets({ module: 'auth' })]);
  const s = o.summary, f = fc.facets;
  const rules = new Map((f.rule || []).map(r => [r[0], r[1]]));
  const sum = ids => ids.reduce((a, id) => a + (rules.get(String(id)) || 0), 0);
  const secOff = o.collectors.kind === 'windows' && o.collectors.logs && o.collectors.logs.sec && !o.collectors.logs.sec.ok;
  const kp = '<div class="skpis">' + kpi('Successful', nf(s.totals.ok), 'sign-ins', null, 'data-f="rule:2001,2002,2003,2020,2032"', 'unlock') + kpi('Failed', nf(s.totals.fail), 'wrong password, unknown user…', s.totals.fail ? 'var(--warn)' : null, 'data-f="group:authentication_failed"', 'lock') +
    kpi('Brute force', nf(sum([2010, 2011])), 'bursts of failures', sum([2010, 2011]) ? 'var(--crit)' : null, 'data-f="group:brute_force"', 'alert') + kpi('Lockouts', nf(sum([2005])), 'accounts locked', null, 'data-f="rule:2005"', 'ban') +
    kpi('Remote', nf(sum([2002, 2003, 2016, 2020])), 'RDP, SSH, network', null, 'data-f="rule:2002,2003,2016,2020"', 'globe') + kpi('Users', nf((f.user || []).length), 'distinct accounts', null, null, 'user') + '</div>';
  const t = s.buckets.map(b => b.t);
  return (secOff ? '<div class="note snote">' + icon('shield') + '<div><b>The Windows Security log needs admin.</b> Sign-ins and failures come from it. <button class="btn sm primary" data-cmd="elevate">' + icon('shield') + 'Restart as admin</button></div></div>' : '') + kp +
    '<div class="grid g21">' + card('Sign-ins over time', lines(t, [{ l: 'Successful', c: 'var(--good)', v: s.buckets.map(b => b.ok) }, { l: 'Failed', c: 'var(--crit)', v: s.buckets.map(b => b.fail) }], s.step, { h: 170 })) +
    card('Logon types', donut((f.logonType || []).map(([l, n], i) => ({ l, v: n, c: CAT(i) })), 'logons', { empty: 'No logon events yet.' })) + '</div>' +
    '<div class="grid g3">' + card('Failure reasons', donut((f.reason || []).map(([l, n], i) => ({ l, v: n, c: CAT(i + 1) })), 'failures', { empty: 'No failed sign-ins. ' })) +
    card('Top users', bars(facetRows(f.user, 'user'), { c: 'var(--s3)' })) + card('Sign-in sources', bars((f.ip || []).map(([ip, n]) => ({ l: ip, v: n, html: '<span class="mono">' + esc(ip) + '</span>', attrs: 'data-ipd="' + esc(ip) + '"' })), { c: 'var(--s7)', empty: 'Only local sign-ins.' })) + '</div>' +
    '<div class="grid g2">' + card('When it happens', weekHeat(fc.week), { sub: 'day of week × hour' }) + card('Latest', feed(fc.latest.slice(0, 8)), { right: '<a class="muted" style="font-size:12px" data-stab="events">all →</a>' }) + '</div>';
};
async function authSessions() {
  const d = await get('/api/siem/sessions?days=' + ({ '24h': 7, '7d': 7, '30d': 30 }[range()] || 90), 15000);
  const now = Date.now();
  const sess = (d.sessions || []).filter(x => x.user || x.state === 'active');
  const scards = sess.map(x => '<div class="ucard"><div class="uav">' + esc((x.user || '?').replace(/^.*\\/, '').slice(0, 2).toUpperCase()) + '</div><div class="ub"><b>' + esc(x.user || '(no user)') + '</b>' + (x.self ? '<span class="tag">this RigWatch</span>' : '') + '<div class="muted">' + esc(x.station || '') + ' · session ' + x.id + (x.addr ? ' · from ' + esc(x.addr) : x.client ? ' · ' + esc(x.client) : '') + '</div><div class="ufoot"><span class="chip ' + (x.state === 'active' ? 'good' : x.state === 'disconnected' ? 'warn' : '') + '"><i></i>' + esc(x.state) + '</span>' + (x.logon ? '<span class="muted">since ' + esc(F.date(x.logon)) + '</span>' : '') + (x.idleSec != null && x.idleSec > 60 && !/^console$/i.test(x.station || '') ? '<span class="muted">idle ' + F.age(x.idleSec) + '</span>' : '') + '</div></div>' +
    (RW.canControl() && x.id > 0 && d.platform === 'win32' ? '<div class="uacts"><button class="btn sm" data-sess="disconnect" data-sid="' + x.id + '" data-label="' + esc(x.user) + '">Disconnect</button><button class="btn sm danger" data-sess="logoff" data-sid="' + x.id + '" data-label="' + esc(x.user) + '"' + (x.self ? ' data-self="1"' : '') + '>Sign out</button></div>' : RW.canControl() && x.pid && d.platform !== 'win32' ? '<div class="uacts"><button class="btn sm danger" data-sess="logoff" data-pid="' + x.pid + '" data-label="' + esc(x.user) + '">Sign out</button></div>' : '') + '</div>').join('');
  const users = (d.users || []).map(u => '<div class="acard' + (u.enabled ? '' : ' off') + '"><div class="uav sm">' + esc(u.name.slice(0, 2).toUpperCase()) + '</div><div><b>' + esc(u.name) + '</b>' + (u.admin ? '<span class="tag flag">admin</span>' : '') + (!u.enabled ? '<span class="tag">disabled</span>' : '') + (u.source && u.source !== 'Local' ? '<span class="tag">' + esc(u.source) + '</span>' : '') + '<div class="muted">' + (u.last ? 'last sign-in ' + esc(F.ago(u.last)) : 'never signed in') + (u.desc ? ' · ' + esc(u.desc) : '') + '</div></div></div>').join('');
  const smb = (d.smb || []).map(x => '<div class="acard"><div class="uav sm">' + icon('folder') + '</div><div><b class="mono">' + esc(x.client) + '</b> <span class="muted">' + esc(x.user) + '</span><div class="muted">' + x.opens + ' open files · connected ' + F.age(x.secs) + ' · SMB ' + esc(x.dialect) + '</div></div>' + (RW.canControl() ? '<button class="btn sm danger" data-sess="smbclose" data-sid="' + esc(x.id) + '" data-label="' + esc(x.client) + '">Close</button>' : '') + '</div>').join('');
  const lg = (d.logons || []).slice(0, 30).map(l => '<span class="chip" title="' + esc(l.auth) + ' · logon id ' + esc(l.id) + '"><i></i>' + esc(l.user) + ' · ' + esc(RW.LT[l.type] || 'type ' + l.type) + (l.start ? ' · ' + esc(F.ago(l.start)) : '') + '</span>').join('');
  // who was signed in when (gantt)
  const H = d.history || [], from = Math.min(now - 7 * 864e5, ...H.map(x => x.start)), span = now - from;
  const lanes = [...new Set(H.map(x => x.user))].slice(0, 12);
  const TC = { interactive: 'var(--s1)', 'remote desktop': 'var(--s2)', session: 'var(--s3)' };
  const gid = nid('gt');
  TIPS[gid] = i => { const x = H[i]; return '<b>' + esc(x.user) + '</b><div class="tiprows"><div>' + esc(x.type) + (x.admin ? ' · admin' : '') + '</div><div>' + esc(F.date(x.start)) + ' → ' + (x.end ? esc(F.date(x.end)) : 'still signed in or unknown') + '</div>' + (x.ip ? '<div>from ' + esc(x.ip) + '</div>' : '') + '</div>'; };
  const gantt = lanes.length ? '<div class="gantt">' + lanes.map(u => '<div class="glane"><span class="gl-u" title="' + esc(u) + '">' + esc(u.replace(/^.*\\/, '')) + '</span><div class="gl-t">' + H.map((x, i) => x.user !== u ? '' : '<i data-tipk="' + gid + ':' + i + '" style="left:' + (100 * (x.start - from) / span).toFixed(2) + '%;width:' + Math.max(0.4, 100 * ((x.end || now) - x.start) / span).toFixed(2) + '%;background:' + (TC[x.type] || 'var(--s4)') + (x.admin ? ';box-shadow:inset 0 0 0 2px var(--serious)' : '') + (x.end ? '' : ';opacity:.6') + '"></i>').join('') + '</div></div>').join('') + '<div class="glane gax"><span></span><div class="xax"><span>' + esc(F.date(from)) + '</span><span>' + esc(F.date(from + span / 2)) + '</span><span>now</span></div></div></div>' + legend([['var(--s1)', 'interactive'], ['var(--s2)', 'remote desktop'], ['var(--s3)', 'session (Linux)'], ['var(--serious)', 'outline: admin']]) : '<div class="empty">No sign-in history yet' + (d.platform === 'win32' && !d.admin ? ' (the Security log needs admin)' : '') + '.</div>';
  return card('Signed in now', sess.length ? '<div class="ugrid">' + scards + '</div>' : '<div class="empty">No interactive sessions.</div>', { sub: (d.errors || []).join(' · ') }) +
    card('Who was signed in when', gantt, { sub: 'last ' + Math.round(span / 864e5) + ' days' }) +
    '<div class="grid g2">' + card('Local accounts', users ? '<div class="agrid">' + users + '</div>' : '<div class="empty">Not available on this OS.</div>') + card('Logon sessions & file-sharing clients', (lg ? '<div class="srcs">' + lg + '</div>' : '<div class="muted">No other logon sessions visible' + (d.admin ? '' : ' (admin sees all)') + '.</div>') + '<h3>SMB clients</h3>' + (smb ? '<div class="agrid">' + smb + '</div>' : '<div class="muted">Nobody is connected to your shared folders.</div>')) + '</div>';
}
RW.LT = { 2: 'interactive', 3: 'network', 4: 'batch', 7: 'unlock', 8: 'network cleartext', 9: 'new credentials', 10: 'remote desktop', 11: 'cached', 12: 'cached remote', 13: 'cached unlock' };

// ===== Network & IPs
let netTab = 'dash', ipFilter = 'all', ipQ = '', ipShow = 60;
RENDER.network = async () => {
  setH('sm-tabs', tabs([['dash', 'Dashboard'], ['ips', 'IP intelligence'], ['events', 'Events']], netTab));
  if (netTab === 'events') return moduleEvents('network');
  const [o, ips] = await Promise.all([overview(), get('/api/siem/ips?range=' + range())]);
  if (netTab === 'ips') return ipCards(ips);
  const fc = await facets({ module: 'network' }), f = fc.facets, L = ips.list;
  const rules = new Map((f.rule || []).map(r => [r[0], r[1]]));
  const scope = {}; for (const e of L) scope[e.kind] = (scope[e.kind] || 0) + 1;
  const apps = {}; for (const e of L) for (const p of e.procs || []) apps[p] = (apps[p] || 0) + 1;
  const kp = '<div class="skpis">' + kpi('Remote addresses', nf(L.length), rangeLabel(), null, 'data-stab="ips"', 'globe') + kpi('Public', nf(scope.public || 0), 'internet addresses', null, null, 'globe') +
    kpi('Inbound from internet', nf(L.filter(e => e.inb && e.kind === 'public').length), 'addresses that connected in', L.some(e => e.inb && e.kind === 'public') ? 'var(--warn)' : null, 'data-f="rule:6005"', 'alert') +
    kpi('Port scans', nf(rules.get('6008') || 0), 'from the firewall log', rules.get('6008') ? 'var(--crit)' : null, 'data-f="rule:6008"', 'radar') + kpi('Threat-feed hits', nf(L.filter(e => e.bad).length), ips.feedOn ? 'feed on' : 'feed off', L.some(e => e.bad) ? 'var(--crit)' : null, 'data-mod="response"', 'fire') + kpi('Blocked', nf(o.blocks), 'addresses', null, 'data-mod="response"', 'ban') + '</div>';
  return kp + '<div class="grid g21">' + card('Network events over time', stackBars(fc.hist, fc.step, { h: 160 })) + card('Address scope', donut(Object.entries(scope).sort((a, b) => b[1] - a[1]).map(([k, n], i) => ({ l: k === 'private' ? 'LAN' : k, v: n, c: CAT(i) })), 'addresses')) + '</div>' +
    '<div class="grid g3">' + card('Most active addresses', bars(L.slice().sort((a, b) => b.conns - a.conns).slice(0, 12).map(e => ({ l: e.ip, v: e.conns, sub: (e.procs || []).slice(-1)[0] || '', html: '<span class="mono">' + esc(e.ip) + '</span>', attrs: 'data-ipd="' + esc(e.ip) + '"' })), { c: 'var(--s1)' }), { sub: 'connections' }) +
    card('Apps by remote addresses', bars(Object.entries(apps).sort((a, b) => b[1] - a[1]).map(([p, n]) => ({ l: p, v: n, attrs: 'data-f="proc:' + esc(p) + '"' })), { c: 'var(--s3)' })) +
    card('Event types', bars((f.rule || []).map(([id, n, d, lv]) => ({ l: d, v: n, c: SEVC[band(lv || 0)], attrs: 'data-f="rule:' + id + '"' })))) + '</div>' +
    '<div class="grid g2">' + card('Inbound ports targeted', bars(facetRows(f.port, null).map(r => Object.assign(r, { l: 'port ' + r.l })), { c: 'var(--s2)', empty: 'No inbound attempts recorded.' })) + card('Latest', feed(fc.latest.slice(0, 8)), { right: '<a class="muted" style="font-size:12px" data-stab="events">all →</a>' }) + '</div>';
};
function ipCards(ips) {
  let L = ips.list;
  if (ipFilter === 'public') L = L.filter(e => e.kind === 'public');
  else if (ipFilter === 'lan') L = L.filter(e => e.kind === 'private' || e.kind === 'linklocal');
  else if (ipFilter === 'inbound') L = L.filter(e => e.inb);
  else if (ipFilter === 'flagged') L = L.filter(e => e.fail || e.drops || e.bad || e.maxLevel >= 7);
  else if (ipFilter === 'blocked') L = L.filter(e => e.blocked);
  if (ipQ) L = L.filter(e => (e.ip + ' ' + (e.procs || []).join(' ') + ' ' + ((RW.rdns && RW.rdns.get(e.ip)) || '')).toLowerCase().includes(ipQ));
  resolve(L.slice(0, ipShow).map(e => e.ip));
  const mxc = Math.max(1, ...L.map(e => e.conns));
  const cards = L.slice(0, ipShow).map(e => {
    const name = RW.rdns && RW.rdns.get(e.ip);
    const flags = [e.bad ? '<span class="chip crit"><i></i>' + esc(e.bad) + '</span>' : '', e.blocked ? '<span class="chip crit"><i></i>blocked</span>' : '', e.inb ? '<span class="chip warn"><i></i>inbound</span>' : '', e.fail ? '<span class="chip serious"><i></i>' + e.fail + ' failed logons</span>' : '', e.drops ? '<span class="chip"><i></i>' + nf(e.drops) + ' dropped</span>' : ''].join('');
    return '<div class="ipcard' + (e.maxLevel >= 10 ? ' hot' : '') + '" data-ipd="' + esc(e.ip) + '"><div class="ipt"><span class="mono">' + esc(e.ip) + '</span>' + kindChip(e.kind) + (e.maxLevel ? levelBadge(e.maxLevel) : '') + '</div><div class="muted ipn">' + esc(name || (e.procs || []).join(', ') || '—') + '</div>' +
      '<div class="ipbar"><i style="width:' + Math.max(2, 100 * e.conns / mxc).toFixed(1) + '%"></i></div><div class="ipm"><span><b>' + nf(e.conns) + '</b> conns</span><span>↓ ' + nf(e.inb) + ' ↑ ' + nf(e.outb) + '</span><span>' + esc(F.ago(e.last)) + '</span></div>' + (flags ? '<div class="ipf">' + flags + '</div>' : '') + '</div>';
  }).join('');
  return '<div class="toolbar"><input type="search" id="ipq" placeholder="Filter by address, app or host name" value="' + esc(ipQ) + '"><div class="seg">' + [['all', 'All'], ['public', 'Public'], ['lan', 'LAN'], ['inbound', 'Inbound'], ['flagged', 'Flagged'], ['blocked', 'Blocked']].map(([k, l]) => '<button data-ipf="' + k + '" class="' + (ipFilter === k ? 'on' : '') + '">' + l + '</button>').join('') + '</div><span class="grow"></span><span class="muted">' + nf(L.length) + ' addresses · last ' + rangeLabel() + '</span></div>' +
    (L.length ? '<div class="ipgrid">' + cards + '</div>' + (L.length > ipShow ? '<div style="text-align:center;margin-top:12px"><button class="btn" data-ipmore="1">Show more</button></div>' : '') : '<div class="empty">No addresses match.</div>');
}
let rdnsBusy = false;
function resolve(list) {
  if (rdnsBusy || !RW.rdns || !RW.settings.resolveHostnames) return;
  const want = list.filter(ip => !RW.rdns.has(ip) && RW.ipKind(ip) === 'public').slice(0, 50);
  if (!want.length) return;
  rdnsBusy = true; want.forEach(ip => RW.rdns.set(ip, ''));
  RW.api('/api/rdns?ips=' + want.join(',')).then(r => { let any = false; for (const [ip, n] of Object.entries(r)) { RW.rdns.set(ip, n); if (n) any = true; } if (any && cur && cur.id === 'network' && netTab === 'ips') schedule(50); }).catch(() => {}).finally(() => { rdnsBusy = false; });
}

// ===== Malware detection
RENDER.malware = async () => {
  const [fc, progs, sc] = await Promise.all([facets({ module: 'malware' }), get('/api/siem/programs?range=' + range()), get('/api/siem/sca', 30000).catch(() => null)]);
  const f = fc.facets, rules = new Map((f.rule || []).map(r => [r[0], r[1]]));
  const av = sc && sc.checks ? sc.checks.find(c => c.id === 'win.av.on') : null;
  const kp = '<div class="skpis">' + kpi('Detections', nf((rules.get('5001') || 0) + (rules.get('5002') || 0)), 'antivirus', rules.get('5001') ? 'var(--crit)' : null, 'data-f="group:malware"', 'fire') +
    kpi('Suspicious processes', nf(rules.get('7002') || 0), 'fake names, temp folders, tampered binaries', rules.get('7002') ? 'var(--serious)' : null, 'data-f="rule:7002"', 'alert') +
    kpi('First-run programs', nf(progs.length), rangeLabel(), null, 'data-f="rule:7001"', 'box') + kpi('Threat-feed hits', nf(rules.get('6006') || 0), 'known-bad addresses', rules.get('6006') ? 'var(--crit)' : null, 'data-f="rule:6006"', 'globe') +
    kpi('Protection changes', nf((rules.get('5003') || 0) + (rules.get('5004') || 0)), 'turned off, exclusions', (rules.get('5003') || rules.get('5004')) ? 'var(--serious)' : null, 'data-f="group:defender"', 'shield') +
    kpi('Antivirus', av ? (av.result === 'passed' ? 'active' : av.result === 'failed' ? 'off' : 'unknown') : '–', av ? av.detail : '', av && av.result === 'failed' ? 'var(--crit)' : av && av.result === 'passed' ? 'var(--good)' : null, 'data-mod="sca"', 'shield') + '</div>';
  const pc = progs.slice(0, 24).map(p => '<div class="pcard"><div class="uav sm">' + icon('box') + '</div><div style="min-width:0"><b>' + esc(p.name) + '</b><div class="muted mono ell" title="' + esc(p.exe) + '">' + esc(p.exe) + '</div><div class="muted">first ran ' + esc(F.date(p.first)) + '</div></div></div>').join('');
  return kp + '<div class="grid g21">' + card('Malware-related events over time', stackBars(fc.hist, fc.step, { h: 160 })) + card('By type', donut((f.rule || []).map(([id, n, d], i) => ({ l: d, v: n, c: CAT(i), f: 'rule:' + id })), 'events')) + '</div>' +
    '<div class="grid g2">' + card('Threats', bars(facetRows(f.threat, null), { c: 'var(--crit)', empty: 'No threats detected. ' })) + card('Latest', feed(fc.latest.slice(0, 6))) + '</div>' +
    card('Programs that ran for the first time', pc ? '<div class="pgrid">' + pc + '</div>' + (progs.length > 24 ? '<div class="muted" style="margin-top:8px">+ ' + (progs.length - 24) + ' more · ' + huntLink('rule:7001', 'see all') + '</div>' : '') : '<div class="empty">No new programs in this period. RigWatch learns what normally runs here and reports newcomers.</div>');
};

// ===== Integrity monitoring
let fimTab = 'dash';
RENDER.fim = async () => {
  setH('sm-tabs', tabs([['dash', 'Dashboard'], ['monitored', 'Monitored locations'], ['events', 'Events']], fimTab));
  if (fimTab === 'events') return moduleEvents('fim');
  const v = await get('/api/siem/fim', 10000);
  if (fimTab === 'monitored') {
    const o = await overview();
    const loc = v.locations.map(l => '<div class="lcard"><div class="uav sm">' + icon(l.custom ? 'folder' : 'file') + '</div><div style="min-width:0"><b>' + esc(l.tag) + '</b>' + (l.custom ? '<span class="tag">custom</span>' : '') + '<div class="mono muted ell" title="' + esc(l.path) + '">' + esc(l.path) + '</div><div class="ufoot"><span class="chip ' + (l.ok ? 'good' : l.err === 'not present' ? '' : 'warn') + '"><i></i>' + (l.ok ? nf(l.files) + ' files' : esc(l.err || 'pending')) + '</span><span class="muted">level ' + l.level + '</span></div></div>' + (l.custom && RW.canControl() ? '<button class="btn sm ghost" data-fimdel="' + esc(l.path) + '">' + icon('x') + '</button>' : '') + '</div>').join('');
    const reg = (v.autostart || []).map(x => '<div class="rrow"><b>' + esc(x.name) + '</b><span class="mono muted ell" title="' + esc(x.value) + '">' + esc(x.value) + '</span><span class="muted ell" title="' + esc(x.key) + '">' + esc(x.key.replace(/^HK(LM|CU)\\SOFTWARE\\/, 'HK$1\\…\\')) + '</span></div>').join('');
    return '<div class="toolbar"><button class="btn primary" data-fimscan="1"' + (RW.canControl() ? '' : ' disabled') + '>' + icon('refresh') + 'Scan now</button>' + (RW.canControl() ? '<button class="btn" data-fimadd="1">' + icon('plus') + 'Watch a folder</button>' : '') + '<span class="muted">Last scan ' + (v.at ? esc(F.ago(v.at)) : 'pending') + ' · every 10 minutes and on change · ' + nf(v.files) + ' files</span></div>' +
      '<div class="lgrid">' + loc + '</div>' + (v.registryStatus || (o.agent.platform === 'win32') ? card('Autostart registry entries', reg ? '<div class="rlist">' + reg + '</div>' : '<div class="empty">' + esc((v.registryStatus && v.registryStatus.err) || 'Not scanned yet.') + '</div>', { sub: nf(v.registry) + ' entries: Run / RunOnce, Winlogon, debugger hijacks' }) : '');
  }
  const fc = await facets({ module: 'fim' }), f = fc.facets, rules = new Map((f.rule || []).map(r => [r[0], r[1]]));
  const kp = '<div class="skpis">' + kpi('Files monitored', nf(v.files), v.locations.filter(l => l.ok).length + ' locations', null, 'data-stab="monitored"', 'file') + kpi('Autostart entries', nf(v.registry), 'registry', null, 'data-stab="monitored"', 'key') +
    kpi('Changes', nf(fc.total), rangeLabel(), null, null, 'activity') + kpi('Added', nf(rules.get('9101') || 0), 'files', null, 'data-f="rule:9101"', 'plus') + kpi('Modified', nf(rules.get('9102') || 0), 'files', rules.get('9102') ? 'var(--warn)' : null, 'data-f="rule:9102"', 'edit') + kpi('Deleted', nf(rules.get('9103') || 0), 'files', null, 'data-f="rule:9103"', 'trash') + '</div>';
  return kp + '<div class="grid g21">' + card('Changes over time', stackBars(fc.hist, fc.step, { h: 150 })) + card('Actions', donut((f.rule || []).map(([id, n, d], i) => ({ l: d.replace(/ (to|from) a monitored location|Monitored file /g, '').replace(/^File /, ''), v: n, c: CAT(i), f: 'rule:' + id })), 'changes', { empty: 'No changes yet. A baseline is taken on the first scan.' })) + '</div>' +
    '<div class="grid g2">' + card('Most changed files', bars((f.path || []).map(([p, n]) => ({ l: p.split(/[\\/]/).pop(), sub: p.split(/[\\/]/).slice(-2, -1)[0] || '', title: p, v: n, attrs: 'data-f="' + esc('"' + p + '"') + '"' })), { c: 'var(--s4)', empty: 'Nothing changed.' })) + card('By location', donut((f.tag || []).map(([t, n], i) => ({ l: t, v: n, c: CAT(i + 2) })), 'changes')) + '</div>' +
    card('Latest changes', feed(fc.latest.slice(0, 10), 'No file or autostart changes in this period.'));
};

// ===== Configuration assessment
let scaFilter = 'all';
RENDER.sca = async () => {
  const v = await get('/api/siem/sca', 10000);
  const hist = v.history || [];
  const cats = [...new Set(v.checks.map(c => c.cat))];
  const list = v.checks.filter(c => scaFilter === 'all' || (scaFilter === 'failed' ? c.result === 'failed' : scaFilter === 'passed' ? c.result === 'passed' : c.result === 'not applicable'));
  const res = r => (r === 'passed' ? '<span class="chip good"><i></i>Passed</span>' : r === 'failed' ? '<span class="chip crit"><i></i>Failed</span>' : '<span class="chip"><i></i>N/A</span>');
  const byCat = cats.map(c => { const xs = v.checks.filter(x => x.cat === c), p = xs.filter(x => x.result === 'passed').length, fl = xs.filter(x => x.result === 'failed').length; return { c, p, fl, s: p + fl ? Math.round(100 * p / (p + fl)) : null }; });
  const head = '<div class="grid g3">' +
    card('Score', '<div style="max-width:230px;margin:0 auto">' + RW.gauge(v.score || 0, 100, RW.scoreColor(v.score || 0), v.score == null ? '–' : v.score + '%', 'checks passed') + '</div><div class="scac"><span class="chip good"><i></i>' + v.passed + ' passed</span><span class="chip crit"><i></i>' + v.failed + ' failed</span><span class="chip"><i></i>' + v.na + ' not applicable</span></div><div class="muted" style="text-align:center;font-size:12px;margin-top:8px">' + esc(v.policy) + '</div>', { right: '<button class="btn sm" data-scarun="1"' + (RW.canControl() ? '' : ' disabled') + '>' + icon('refresh') + 'Run now</button>' }) +
    card('Score by category', bars(byCat.filter(x => x.s != null).map(x => ({ l: x.c, v: Math.max(1, x.s), sub: x.p + '/' + (x.p + x.fl), c: 'var(' + RW.scoreColor(x.s) + ')' })), { max: 20 })) +
    card('Score history', hist.length > 1 ? lines(hist.map(h => h.at), [{ l: 'Score %', c: 'var(--good)', v: hist.map(h => h.score || 0) }, { l: 'Failed checks', c: 'var(--crit)', v: hist.map(h => h.failed) }], 864e5, { h: 140 }) : '<div class="empty">One point per day. Come back tomorrow for a trend.</div>', { sub: v.at ? 'last run ' + F.ago(v.at) : '' }) + '</div>';
  const checks = '<div class="toolbar"><div class="seg">' + [['all', 'All ' + v.checks.length], ['failed', 'Failed ' + v.failed], ['passed', 'Passed ' + v.passed], ['na', 'N/A ' + v.na]].map(([k, l]) => '<button data-scaf="' + k + '" class="' + (scaFilter === k ? 'on' : '') + '">' + l + '</button>').join('') + '</div></div>' +
    cats.map(c => { const xs = list.filter(x => x.cat === c); if (!xs.length) return ''; return '<h3 class="scat">' + esc(c) + '</h3><div class="sclist">' + xs.map(x => '<details class="scrow ' + x.result.replace(/ /g, '') + '"><summary>' + res(x.result) + '<b>' + esc(x.title) + '</b><span class="muted ell">' + esc(x.detail || '') + '</span></summary><div class="scd"><p><b>Why:</b> ' + esc(x.rationale || '') + '</p><p><b>Fix:</b> <span class="mono">' + esc(x.remediation || '') + '</span></p><div class="srcs">' + Object.entries(x.compliance || {}).map(([fw, reqs]) => (reqs || []).map(r => '<span class="chip"><i></i>' + esc((FWS.find(z => z[0] === fw) || [0, fw])[1]) + ' ' + esc(r) + '</span>').join('')).join('') + '<span class="chip"><i></i>' + esc(x.id) + '</span></div></div></details>').join('') + '</div>'; }).join('');
  return head + card('Checks', checks, { sub: v.err ? 'note: ' + v.err : 'click a check for the reason and the fix' });
};

// ===== System auditing
RENDER.audit = async () => {
  const fc = await facets({ module: 'audit' }), f = fc.facets, rules = new Map((f.rule || []).map(r => [r[0], r[1]]));
  const sum = ids => ids.reduce((a, id) => a + (rules.get(String(id)) || 0), 0);
  const kp = '<div class="skpis">' + kpi('Account changes', nf(sum([3001, 3002, 3003, 3004, 3005, 3006, 3007])), 'created, deleted, groups', sum([3007]) ? 'var(--crit)' : null, 'data-f="group:account_changed"', 'user') +
    kpi('New services', nf(sum([4004])), 'installed', sum([4004]) ? 'var(--warn)' : null, 'data-f="rule:4004"', 'cog') + kpi('Scheduled tasks', nf(sum([4005])), 'created', null, 'data-f="rule:4005"', 'clock') +
    kpi('Logs cleared', nf(sum([4001, 4002])), 'anti-forensics', sum([4001, 4002]) ? 'var(--crit)' : null, 'data-f="group:log_cleared"', 'trash') + kpi('Firewall rule changes', nf(sum([5005, 5006, 5007])), 'by programs', null, 'data-f="group:firewall"', 'shield') +
    kpi('Restarts', nf(sum([1002, 1003, 1004])), sum([1004]) + ' unexpected', sum([1004]) ? 'var(--warn)' : null, 'data-f="group:system"', 'power') + '</div>';
  return kp + '<div class="grid g21">' + card('Audit events over time', stackBars(fc.hist, fc.step, { h: 160 })) + card('Categories', donut((f.group || []).filter(([g]) => ['account_changed', 'service_installed', 'scheduled_task', 'log_cleared', 'policy_changed', 'audit', 'system', 'firewall', 'defender'].includes(g)).map(([g, n], i) => ({ l: g.replace(/_/g, ' '), v: n, c: CAT(i), f: 'group:' + g })), 'events')) + '</div>' +
    '<div class="grid g2">' + card('What happened', bars((f.rule || []).map(([id, n, d, lv]) => ({ l: d, v: n, c: SEVC[band(lv || 0)], attrs: 'data-f="rule:' + id + '"' })))) + card('Changed by', bars(facetRows(f.process, 'proc'), { c: 'var(--s4)', empty: 'No program information.' })) + '</div>' +
    card('Latest', feed(fc.latest.slice(0, 12)));
};

// ===== Active response
RENDER.response = async () => {
  const [b, fc] = await Promise.all([get('/api/siem/blocks', 5000), facets({ module: 'response' })]);
  const S = b.settings, can = RW.canControl();
  const now = Date.now();
  const bl = b.list.map(x => '<div class="bcard"><div class="uav sm" style="color:var(--crit)">' + icon('ban') + '</div><div style="min-width:0"><b class="mono clk" data-ipd="' + esc(x.ip.split('/')[0]) + '">' + esc(x.ip) + '</b><span class="tag' + (x.by === 'auto' ? ' flag' : '') + '">' + esc(x.by) + '</span><div class="muted ell" title="' + esc(x.reason) + '">' + esc(x.reason || '') + '</div><div class="muted">' + (x.at ? 'since ' + esc(F.date(x.at)) : 'found in firewall') + ' · ' + (x.until ? 'expires in ' + F.age((x.until - now) / 1000) : 'permanent') + '</div></div>' + (can ? '<button class="btn sm" data-unblock="' + esc(x.ip) + '">Unblock</button>' : '') + '</div>').join('');
  const lvOpt = (v, list) => list.map(([k, l]) => '<option value="' + k + '"' + (String(v) === String(k) ? ' selected' : '') + '>' + l + '</option>').join('');
  const durs = [[60, '1 hour'], [360, '6 hours'], [1440, '24 hours'], [10080, '7 days'], [43200, '30 days'], [0, 'permanent']];
  const fwl = b.firewallLog;
  return (!b.supported ? '<div class="note snote">' + icon('info') + '<div>Blocking addresses is available on Windows and Linux.</div></div>' : !b.admin ? '<div class="note snote">' + icon('shield') + '<div><b>Blocking needs admin</b> (Windows Firewall rules). <button class="btn sm primary" data-cmd="elevate">' + icon('shield') + 'Restart as admin</button></div></div>' : '') +
    '<div class="grid g3 g311">' +
    card('Blocked addresses', (can ? '<div class="bform"><input id="bip" placeholder="IP or range, e.g. 203.0.113.7 or 203.0.113.0/24"><select id="bdur">' + lvOpt(1440, durs) + '</select><input id="breason" placeholder="Reason (optional)"><button class="btn danger" data-blockform="1">' + icon('ban') + 'Block</button></div>' : '') + (bl ? '<div class="blist">' + bl + '</div>' : '<div class="empty">Nothing blocked. Block from any event, IP card, or here.</div>') + (b.err ? '<div class="muted" style="margin-top:8px">' + esc(b.err) + '</div>' : ''), { sub: b.list.length + ' active' }) +
    card('Automatic blocking', '<label class="tgl"><input type="checkbox" data-sset="autoBlock"' + (S.autoBlock ? ' checked' : '') + (can ? '' : ' disabled') + '><span>Block attackers automatically</span></label><div class="muted" style="font-size:12.5px;margin:6px 0 12px">When a brute-force, port-scan or threat-feed alert fires for a public address, RigWatch adds a Windows Firewall / iptables block. Never blocks this machine, your gateway, DNS servers or trusted addresses.</div>' +
      '<label class="field">Minimum level<select data-sset="autoLevel"' + (can ? '' : ' disabled') + '>' + lvOpt(S.autoLevel, [[8, '8+'], [10, '10+ (high)'], [12, '12+ (critical)']]) + '</select></label><label class="field">Block for<select data-sset="autoMinutes"' + (can ? '' : ' disabled') + '>' + lvOpt(S.autoMinutes, durs) + '</select></label>' +
      '<label class="tgl"><input type="checkbox" data-sset="allowPrivate"' + (S.allowPrivate ? ' checked' : '') + (can ? '' : ' disabled') + '><span>Also block LAN addresses</span></label>' +
      '<h3>Notifications</h3><label class="field">Pop-up and webhook from level<select data-sset="notifyLevel"' + (can ? '' : ' disabled') + '>' + lvOpt(S.notifyLevel, [[7, '7+'], [10, '10+'], [12, '12+'], [16, 'never']]) + '</select></label>') +
    card('Threat intelligence', '<label class="tgl"><input type="checkbox" data-sset="feed"' + (S.feed ? ' checked' : '') + (can ? '' : ' disabled') + '><span>Check addresses against threat feeds</span></label><div class="muted" style="font-size:12.5px;margin:6px 0 10px">Downloads FireHOL level 1 and the abuse.ch Feodo list once a day (no data is sent). Matches raise level-12 alerts.</div>' +
      (S.feed ? '<div class="kvs">' + b.feed.feeds.map(x => '<div><span>' + esc(x.name) + '</span><b>' + (x.entries ? nf(x.entries) + ' ranges' : '–') + '</b></div>').join('') + '</div><div class="muted" style="font-size:12px;margin-top:6px">' + (b.feed.at ? 'updated ' + esc(F.ago(b.feed.at)) : 'not downloaded yet') + (b.feed.err ? ' · ' + esc(b.feed.err) : '') + '</div>' + (can ? '<button class="btn sm" style="margin-top:8px" data-feedref="1">' + icon('refresh') + 'Update now</button>' : '') : '') +
      (fwl ? '<h3>Firewall drop log</h3><label class="tgl"><input type="checkbox" data-fwlog="1"' + (fwl.enabled ? ' checked' : '') + (can && b.admin ? '' : ' disabled') + '><span>Log dropped packets (detects port scans)</span></label><div class="muted mono ell" style="font-size:11.5px;margin-top:4px" title="' + esc(fwl.file) + '">' + esc(fwl.file || '') + '</div>' + (fwl.err ? '<div class="muted" style="font-size:12px">' + esc(fwl.err) + '</div>' : '') : '') +
      '<h3>Trusted addresses</h3><textarea id="trusted" rows="3" placeholder="one IP per line: never blocked"' + (can ? '' : ' disabled') + '>' + esc((S.trusted || []).join('\n')) + '</textarea>' + (can ? '<button class="btn sm" data-trustsave="1">Save</button>' : '')) + '</div>' +
    '<div class="grid g2">' + card('Responses over time', stackBars(fc.hist, fc.step, { h: 140 })) + card('History', feed(fc.latest.slice(0, 10), 'No blocks yet.')) + '</div>';
};

// ===== Compliance
let fwSel = 'pci_dss';
RENDER.compliance = async c => {
  if (c.params.fw && !c.fwUsed) { fwSel = c.params.fw; c.fwUsed = true; }
  setH('sm-tabs', '<div class="toolbar"><div class="seg">' + FWS.map(([k, l]) => '<button data-fwsel="' + k + '" class="' + (fwSel === k ? 'on' : '') + '">' + l + '</button>').join('') + '</div><span class="muted" style="font-size:12px">Requirement tags follow the style of the Wazuh ruleset: a guide for audits, not a certification.</span></div>');
  const [m, fc] = await Promise.all([meta(), facets({ module: 'compliance', fw: fwSel })]);
  const fw = m.compliance[fwSel], reqs = Object.keys(fw.reqs), cnt = new Map(fc.facets.req || []), mx = Math.max(1, ...cnt.values());
  const rulesFor = r => m.rules.filter(x => (x.compliance[fwSel] || []).includes(r)).map(x => x.id).join(',');
  const tiles = reqs.map(r => { const n = cnt.get(r) || 0, ids = rulesFor(r); return '<a class="ctile' + (n ? '' : ' zero') + '"' + (ids ? ' data-f="rule:' + ids + '"' : '') + ' style="' + (n ? 'background:color-mix(in srgb, var(--s1) ' + Math.round(12 + 55 * n / mx) + '%, var(--panel2))' : '') + '"><b>' + esc(r) + '</b><span>' + esc(fw.reqs[r]) + '</span><em>' + (n ? nf(n) + ' events' : 'no events') + '</em></a>'; }).join('');
  const kp = '<div class="skpis">' + kpi('Events mapped', nf(fc.total), fw.name + ' · ' + rangeLabel(), null, null, 'book') + kpi('Requirements with events', cnt.size + ' / ' + reqs.length, 'covered by RigWatch rules', null, null, 'clipboard') + kpi('Top requirement', (fc.facets.req || [])[0] ? fc.facets.req[0][0] : '–', (fc.facets.req || [])[0] ? fw.reqs[fc.facets.req[0][0]] || '' : '', null, null, 'target') + kpi('High or critical', nf(histTotals(fc.hist)[3] + histTotals(fc.hist)[4]), 'level 10+', null, null, 'alert') + '</div>';
  return kp + card('Requirements', '<div class="cgrid">' + tiles + '</div>', { sub: 'click to see the events' }) +
    '<div class="grid g2">' + card('Events per requirement', bars((fc.facets.req || []).map(([r, n]) => ({ l: r + ' · ' + (fw.reqs[r] || ''), v: n, attrs: 'data-f="rule:' + rulesFor(r) + '"' })), { c: 'var(--s1)', max: 14 })) + card(fw.name + ' events over time', stackBars(fc.hist, fc.step, { h: 160 })) + '</div>';
};

// ===== shared "Events" tab of a module
async function moduleEvents(mod) {
  const fc = await facets({ module: mod });
  return card(nf(fc.total) + ' events', stackBars(fc.hist, fc.step, { h: 110 }), { sub: rangeLabel() }) + '<article class="card">' + feed(fc.latest, 'No events in this period.') + (fc.total > fc.latest.length ? '<div style="text-align:center;margin-top:10px"><button class="btn" data-f="' + esc('group:' + ({ auth: 'authentication_success,authentication_failed,authentication_failures,logoff,session,rdp,sshd,sudo', network: 'network', fim: 'syscheck' }[mod] || mod)) + '">' + icon('search') + 'All in threat hunting</button></div>' : '') + '</article>';
}

// ------------------------------------------------------------------ pages + interaction
function makePage(id) {
  const m = MODS[id];
  RW.pages[id === 'overview' ? 'siem' : 'siem-' + id] = {
    title: m.name, sub: 'SIEM · ' + m.desc, keepOnParams: true,
    mount(root, params) {
      cur = { id, params, root };
      if (id === 'overview') { RW.siemNew = 0; const el = document.getElementById('nb-siem'); if (el) el.className = 'badge hidden'; }
      root.innerHTML = shell(id);
      render();
    },
    onParams(p) { cur = { id, params: p, root: cur && cur.root }; if (id === 'hunt' && p.q != null) { hunt.q = p.q; hunt.events = null; } if (id === 'compliance' && p.fw) fwSel = p.fw; render(); },
    unmount() { cur = null; clearTimeout(renderTimer); renderTimer = null; },
    update() {},
  };
}
Object.keys(MODS).forEach(makePage);

document.addEventListener('click', async e => {
  if (!RW.page || (!RW.page.startsWith('siem') && !e.target.closest('#drawer'))) return;
  const t = e.target;
  const el = s => t.closest(s);
  let x;
  if ((x = el('[data-mod]'))) { e.preventDefault(); const id = x.dataset.mod; return RW.go(id === 'overview' ? 'siem' : 'siem-' + id, x.dataset.fwp ? { fw: x.dataset.fwp } : undefined); }
  if ((x = el('[data-srange]'))) { RW.prefs.siemRange = x.dataset.srange; RW.savePrefs(); RW.$$('[data-srange]').forEach(b => b.classList.toggle('on', b === x)); cache.clear(); rulesMeta = null; hunt.events = null; return render(); }
  if (el('[data-srefresh]')) { cache.clear(); hunt.events = null; return render(); }
  if ((x = el('[data-stab]'))) { const k = x.dataset.stab; if (cur.id === 'auth') authTab = k; else if (cur.id === 'network') netTab = k; else if (cur.id === 'fim') fimTab = k; return render(); }
  if ((x = el('[data-copyev]'))) { e.stopPropagation(); try { await navigator.clipboard.writeText(JSON.stringify(JSON.parse(x.dataset.copyev), null, 2)); RW.toast('Event copied', 'ok'); } catch { RW.toast('Copy failed', 'err'); } return; }
  if ((x = el('[data-block]'))) {
    e.stopPropagation();
    const ip = x.dataset.block;
    const v = await RW.prompt('Block ' + ip + '?', [{ name: 'minutes', label: 'For how long', options: [['60', '1 hour'], ['1440', '24 hours'], ['10080', '7 days'], ['43200', '30 days'], ['0', 'permanently']], value: '1440' }, { name: 'reason', label: 'Reason (optional)', placeholder: 'e.g. brute force on RDP' }], 'Block');
    if (!v) return;
    try { const r = await RW.api('/api/siem/block', { method: 'POST', body: { ip, minutes: +v.minutes, reason: v.reason } }); RW.toast(r.msg, 'ok'); cache.clear(); render(); if (RW.drawer.cur) RW.openIp(ip); } catch (er) { RW.toast(er.message, 'err', 8000); }
    return;
  }
  if ((x = el('[data-unblock]'))) { e.stopPropagation(); try { const r = await RW.api('/api/siem/unblock', { method: 'POST', body: { ip: x.dataset.unblock } }); RW.toast(r.msg, 'ok'); cache.clear(); render(); } catch (er) { RW.toast(er.message, 'err', 8000); } return; }
  if ((x = el('[data-ipd]'))) { e.preventDefault(); e.stopPropagation(); return RW.openIp(x.dataset.ipd); }
  if ((x = el('[data-evx]'))) { if (String(window.getSelection())) return; const k = x.dataset.evx; if (expanded.has(k)) expanded.delete(k); else expanded.add(k); const item = x.closest('.sev-ev'); const ev = findEv(k); if (item && ev) item.outerHTML = evItem(ev); return; }
  if ((x = el('[data-f]'))) { e.preventDefault(); if (RW.drawer.cur) RW.drawer.close(); return addFilter(x.dataset.f); }
  if (!cur) return;
  if ((x = el('[data-hq]'))) { hunt.q = x.dataset.hq; hunt.events = null; const i = document.getElementById('hq'); if (i) i.value = hunt.q; return render(); }
  if (el('[data-more]')) return huntMore();
  if ((x = el('[data-tech]'))) { mitreSel = x.dataset.tech || null; return render(); }
  if ((x = el('[data-ipf]'))) { ipFilter = x.dataset.ipf; ipShow = 60; return render(); }
  if (el('[data-ipmore]')) { ipShow += 90; return render(); }
  if ((x = el('[data-scaf]'))) { scaFilter = x.dataset.scaf; return render(); }
  if (el('[data-scarun]')) { x = el('[data-scarun]'); x.disabled = true; x.textContent = 'Running…'; try { await RW.api('/api/siem/sca/run', { method: 'POST' }); cache.clear(); } catch (er) { RW.toast(er.message, 'err'); } return render(); }
  if (el('[data-fimscan]')) { x = el('[data-fimscan]'); x.disabled = true; try { const r = await RW.api('/api/siem/fim/scan', { method: 'POST' }); RW.toast(r.msg, 'ok'); cache.clear(); } catch (er) { RW.toast(er.message, 'err'); } return render(); }
  if (el('[data-fimadd]')) { const v = await RW.prompt('Watch a folder', [{ name: 'p', label: 'Absolute path (up to 3 levels deep, 20 folders max)', placeholder: 'C:\\Users\\you\\projects\\api\\config' }], 'Watch'); if (!v || !v.p) return; const list = (await overview()).settings.fimPaths || []; return saveSettings({ fimPaths: list.concat([v.p.trim()]) }, 'Watching ' + v.p); }
  if ((x = el('[data-fimdel]'))) { const list = ((await overview()).settings.fimPaths || []).filter(p => p !== x.dataset.fimdel); return saveSettings({ fimPaths: list }, 'Removed'); }
  if ((x = el('[data-fwsel]'))) { fwSel = x.dataset.fwsel; return render(); }
  if (el('[data-blockform]')) {
    const ip = document.getElementById('bip').value.trim(); if (!ip) return RW.toast('Enter an address', 'err');
    try { const r = await RW.api('/api/siem/block', { method: 'POST', body: { ip, minutes: +document.getElementById('bdur').value, reason: document.getElementById('breason').value } }); RW.toast(r.msg, 'ok'); cache.clear(); render(); } catch (er) { RW.toast(er.message, 'err', 8000); }
    return;
  }
  if (el('[data-trustsave]')) return saveSettings({ trusted: document.getElementById('trusted').value.split(/\s+/).filter(Boolean) }, 'Trusted addresses saved');
  if (el('[data-feedref]')) { try { const r = await RW.api('/api/siem/feeds/refresh', { method: 'POST' }); RW.toast(r.msg, 'ok'); cache.clear(); render(); } catch (er) { RW.toast(er.message, 'err'); } return; }
  if ((x = el('[data-sess]'))) {
    const a = x.dataset.sess, label = x.dataset.label || '';
    const msg = a === 'logoff' ? (x.dataset.self ? 'This is the session RigWatch runs in: signing it out stops RigWatch and closes every app in it.' : 'Closes every app of ' + label + ' without saving.') : a === 'disconnect' ? 'Disconnects ' + label + ' (apps keep running).' : 'Closes the file-sharing connection from ' + label + '.';
    if (!(await RW.confirm({ logoff: 'Sign out ' + label + '?', disconnect: 'Disconnect ' + label + '?', smbclose: 'Close SMB session?' }[a], esc(msg), { danger: a !== 'disconnect', ok: { logoff: 'Sign out', disconnect: 'Disconnect', smbclose: 'Close' }[a] }))) return;
    try { const r = await RW.api('/api/siem/session', { method: 'POST', body: { action: a === 'smbclose' ? 'smbclose' : a, id: x.dataset.sid, pid: x.dataset.pid, label } }); RW.toast(r.msg, 'ok'); cache.clear(); render(); } catch (er) { RW.toast(er.message, 'err', 8000); }
  }
});
document.addEventListener('change', e => {
  if (!RW.page || !RW.page.startsWith('siem')) return;
  const t = e.target;
  if (t.id === 'hmin') { hunt.min = t.value; hunt.events = null; return render(); }
  if (t.dataset.sset) { const k = t.dataset.sset; return saveSettings({ [k]: t.type === 'checkbox' ? t.checked : +t.value }, 'Saved'); }
  if (t.dataset.fwlog) { RW.api('/api/siem/fwlog', { method: 'POST', body: { on: t.checked } }).then(r => { RW.toast(r.msg, 'ok'); cache.clear(); render(); }).catch(er => { RW.toast(er.message, 'err', 8000); t.checked = !t.checked; }); }
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'hq') { hunt.q = e.target.value.trim(); hunt.events = null; render(); } });
document.addEventListener('input', e => { if (e.target.id === 'ipq') { ipQ = e.target.value.trim().toLowerCase(); clearTimeout(ipCards.t); ipCards.t = setTimeout(() => { render().then(() => { const i = document.getElementById('ipq'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }); }, 250); } });
async function saveSettings(body, msg) { try { await RW.api('/api/siem/settings', { method: 'PUT', body }); RW.toast(msg || 'Saved', 'ok'); cache.clear(); render(); } catch (er) { RW.toast(er.message, 'err', 8000); } }
function findEv(k) {
  const pools = [hunt.events || [], drawerEvents];
  for (const v of cache.values()) { const d = v.data; if (d && d.latest) pools.push(d.latest); if (d && d.events) pools.push(d.events); if (d && d.recent) pools.push(d.recent); }
  for (const p of pools) for (const ev of p) if (evKey(ev) === k) return ev;
  return null;
}
// tooltips for every SIEM chart
document.addEventListener('mousemove', e => {
  const h = e.target.closest && e.target.closest('[data-tipk]');
  if (!h) { if (RW.__stip) { RW.tip(null); RW.__stip = false; } return; }
  const [id, i] = h.dataset.tipk.split(':');
  if (TIPS[id]) { RW.tip(TIPS[id](+i), e.clientX, e.clientY); RW.__stip = true; }
});
})();
