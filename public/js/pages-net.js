'use strict';
/* Pages: Network, Security, Net Lab. */
(() => {
const { esc, f: F, icon, setH } = RW;
const rdns = RW.rdns = new Map();
let rdnsBusy = false;
function resolveIps(ips) {
  if (rdnsBusy || !RW.settings.resolveHostnames) return;
  const want = [...new Set(ips)].filter(ip => !rdns.has(ip) && /^(\d+\.){3}\d+$|:/.test(ip)).slice(0, 50);
  if (!want.length) return;
  rdnsBusy = true; want.forEach(ip => rdns.set(ip, ''));
  RW.api('/api/rdns?ips=' + want.join(',')).then(r => { for (const [ip, n] of Object.entries(r)) rdns.set(ip, n); }).catch(() => {}).finally(() => { rdnsBusy = false; });
}
const ipKind = ip => {
  ip = String(ip || '').replace(/^::ffff:/i, '');
  if (ip === '::1' || ip.startsWith('127.')) return 'loopback';
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip) || /^f[cd]/i.test(ip)) return 'private';
  if (ip.startsWith('169.254.') || /^fe[89ab]/i.test(ip)) return 'link-local';
  if (/^(22[4-9]|23\d)\./.test(ip) || /^ff/i.test(ip)) return 'multicast';
  if (ip === '0.0.0.0' || ip === '::' || ip === '*') return 'any';
  return 'public';
};
RW.ipKind = ipKind;
const kindChip = k => '<span class="chip ' + (k === 'public' ? 'info' : k === 'private' ? 'good' : '') + '"><i></i>' + k + '</span>';

// ======================= Network =======================
const NTABS = [['overview', 'Overview'], ['connections', 'Connections'], ['listening', 'Listening ports'], ['lan', 'LAN & neighbors'], ['routing', 'Routes & DNS'], ['wifi', 'Wi-Fi & firewall']];
let net = null, netTimer = null, nTab = 'overview';
const cf = { q: '', state: 'all', hideLoop: true, group: 'none' };
let knownDevs = [];
function loadNet(fresh) {
  RW.api('/api/dev').then(d => { knownDevs = d.devices || []; }).catch(() => {});
  return RW.api('/api/netinfo' + (fresh ? '?fresh=1' : '')).then(n => { net = n; RW.renderAll(); }).catch(e => { net = { error: e.message }; RW.renderAll(); });
}
RW.pages.network = {
  title: 'Network', sub: 'adapters, packets, connections, ports, neighbors, routes', keepOnParams: true,
  topExtra: () => '<a class="btn sm ghost" href="/api/export?what=connections&format=csv" download>' + icon('download') + 'Connections CSV</a>',
  mount(root, params) {
    nTab = params.tab || nTab;
    root.innerHTML = '<div class="toolbar"><div class="seg" id="ntabs">' + NTABS.map(([k, l]) => '<button data-ntab="' + k + '" class="' + (nTab === k ? 'on' : '') + '">' + l + '</button>').join('') + '</div></div><div id="nbody"></div>';
    this.build(); loadNet();
    clearInterval(netTimer); netTimer = setInterval(() => { if (RW.page === 'network' && ['lan', 'routing', 'wifi'].includes(nTab)) loadNet(); }, 15000);
    root.addEventListener('click', e => {
      const t = e.target.closest('[data-ntab]'); if (t) { nTab = t.dataset.ntab; RW.$$('#ntabs button').forEach(b => b.classList.toggle('on', b === t)); this.build(); RW.renderAll(); }
      const cs = e.target.closest('[data-cstate]'); if (cs) { cf.state = cs.dataset.cstate; RW.$$('#cstate button').forEach(b => b.classList.toggle('on', b === cs)); RW.renderAll(); }
      const cg = e.target.closest('[data-cgroup]'); if (cg) { cf.group = cg.dataset.cgroup; RW.$$('#cgroup button').forEach(b => b.classList.toggle('on', b === cg)); RW.renderAll(); }
      if (e.target.closest('#cloop')) { cf.hideLoop = !cf.hideLoop; e.target.closest('#cloop').classList.toggle('on', cf.hideLoop); RW.renderAll(); }
      if (e.target.closest('#nrefresh')) loadNet(true);
      if (e.target.closest('#ldisc')) { RW.go('lab', { tool: 'lan' }); }
      const wk = e.target.closest('[data-wake]'); if (wk) { RW.tool('wol', { mac: wk.dataset.wake }).then(() => RW.toast('Magic packet sent to ' + wk.dataset.wake, 'ok')).catch(er => RW.toast(er.message, 'err')); }
      const sc = e.target.closest('[data-scanhost]'); if (sc) RW.go('lab', { tool: 'scan', target: sc.dataset.scanhost });
    });
    root.addEventListener('input', e => { if (e.target.id === 'cq') { cf.q = e.target.value.trim().toLowerCase(); RW.renderAll(); } });
  },
  onParams(p) { if (p.tab && p.tab !== nTab) { nTab = p.tab; RW.$$('#ntabs button').forEach(b => b.classList.toggle('on', b.dataset.ntab === nTab)); this.build(); } },
  unmount() { clearInterval(netTimer); },
  build() {
    const b = document.getElementById('nbody'); b.__h = null;
    if (nTab === 'overview') {
      b.innerHTML = '<div class="grid g3"><article class="card"><header><h2>Throughput</h2></header><div class="chartbox" style="min-height:150px"><canvas class="chart" id="n-net"></canvas></div></article><article class="card"><header><h2>Packets</h2></header><div class="chartbox" style="min-height:150px"><canvas class="chart" id="n-pk"></canvas></div></article><article class="card"><header><h2>Latency</h2><span class="right muted" id="n-pt"></span></header><div class="chartbox" style="min-height:150px"><canvas class="chart" id="n-ping"></canvas></div></article></div>' +
        '<div class="grid g4" id="n-tiles"></div><article class="card"><header><h2>Adapters</h2></header><div class="tw" id="n-if"></div></article>';
      RW.chart('n-net', RW.preset('net')); RW.chart('n-pk', RW.preset('pkts')); RW.chart('n-ping', RW.preset('ping'));
    } else if (nTab === 'connections') {
      b.innerHTML = '<article class="card"><div class="toolbar"><input type="search" id="cq" placeholder="Filter by process, IP, host name, port or state" value="' + esc(cf.q) + '"><div class="seg" id="cstate">' + [['all', 'All'], ['ESTABLISHED', 'Established'], ['TIME_WAIT', 'Time wait'], ['CLOSE_WAIT', 'Close wait'], ['SYN_SENT', 'SYN sent'], ['other', 'Other']].map(([k, l]) => '<button data-cstate="' + k + '" class="' + (cf.state === k ? 'on' : '') + '">' + l + '</button>').join('') + '</div><div class="seg" id="cgroup">' + [['none', 'List'], ['app', 'By app'], ['host', 'By remote host']].map(([k, l]) => '<button data-cgroup="' + k + '" class="' + (cf.group === k ? 'on' : '') + '">' + l + '</button>').join('') + '</div><button class="btn sm' + (cf.hideLoop ? ' on' : '') + '" id="cloop">Hide loopback</button><span class="grow"></span><span class="muted" id="ccount"></span></div><div class="tw" id="cbody" style="max-height:calc(100vh - 230px)"></div></article>';
    } else if (nTab === 'listening') {
      b.innerHTML = '<article class="card"><header><h2>Listening ports</h2><span class="right muted" id="lsum"></span></header><div class="tw" id="lbody"></div></article>';
    } else if (nTab === 'lan') {
      b.innerHTML = '<div class="toolbar"><button class="btn primary" id="ldisc">' + icon('radar') + 'Discover devices (Net Lab)</button><button class="btn" id="nrefresh">' + icon('refresh') + 'Refresh</button><span class="muted">ARP table updates as your PC talks to devices. Discovery probes your subnet actively.</span></div><div class="grid g2"><article class="card"><header><h2>ARP / neighbor table</h2><span class="right muted" id="arpc"></span></header><div class="tw" id="arp"></div></article><article class="card"><header><h2>Known devices</h2><span class="right muted">from LAN discovery runs</span></header><div class="tw" id="known"></div></article></div>';
    } else if (nTab === 'routing') {
      b.innerHTML = '<div class="toolbar"><button class="btn" id="nrefresh">' + icon('refresh') + 'Refresh</button></div><div class="grid g2"><article class="card"><header><h2>DNS servers</h2></header><div id="dnss"></div><h3>Default gateway</h3><div id="gw"></div></article><article class="card"><header><h2>DNS cache</h2><span class="right"><button class="btn sm" id="dcl">' + icon('refresh') + 'Load</button></span></header><div class="tw" id="dcache" style="max-height:420px"><div class="empty">Load to see recently resolved names.</div></div></article></div><article class="card"><header><h2>Routing table</h2><span class="right muted" id="rtc"></span></header><div class="tw" id="routes"></div></article>';
      b.querySelector('#dcl').onclick = () => RW.api('/api/dnscache').then(list => { setH('dcache', list.length ? RW.table('dnsc', [{ k: 'name', label: 'Name' }, { k: 'type', label: 'Type', fmt: r => ({ 1: 'A', 28: 'AAAA', 5: 'CNAME', 12: 'PTR', 15: 'MX', 16: 'TXT', 33: 'SRV', 65: 'HTTPS' })[r.type] || r.type }, { k: 'data', label: 'Data', cls: 'mono' }, { k: 'ttl', label: 'TTL', num: true }], list, { sortK: 'name', sortD: 1 }) : '<div class="empty">The DNS client cache is empty or not readable for this account (Windows only; some builds need an elevated terminal).</div>'); }).catch(e => RW.toast(e.message, 'err'));
    } else if (nTab === 'wifi') {
      b.innerHTML = '<div class="toolbar"><button class="btn" id="nrefresh">' + icon('refresh') + 'Refresh</button></div><div class="grid g2"><article class="card"><header><h2>Wi-Fi</h2></header><div id="wifi"></div></article><article class="card"><header><h2>Firewall & antivirus</h2></header><div id="fw"></div><h3>Network profiles</h3><div id="prof"></div></article></div>';
    }
  },
  update(s) {
    const n = s.net;
    if (nTab === 'overview') {
      setH('n-pt', esc(n.ping ? n.ping.target : 'off'));
      const t = n.tcp || {};
      setH('n-tiles', [['Download', F.bits(n.rx), F.num(n.rxp) + ' pkt/s'], ['Upload', F.bits(n.tx), F.num(n.txp) + ' pkt/s'], ['TCP', F.num(t.est) + ' est.', 'retransmits ' + F.pct(t.retransPct, 2) + ' · ' + F.num(t.segs) + ' seg/s'], ['Sockets', F.num(s.ports.total) + ' conns', s.ports.listen.length + ' listening · ephemeral ' + F.num(n.ephemeral)]].map(x => '<div class="kpi" style="cursor:default"><div class="kl">' + x[0] + '</div><div class="kv2">' + RW.vu(x[1]) + '</div><div class="ks">' + esc(x[2]) + '</div></div>').join(''));
      setH('n-if', RW.table('ifs', [
        { k: 'name', label: 'Adapter', fmt: i => '<b>' + esc(i.name) + '</b>' + (i.virtual ? '<span class="tag">virtual</span>' : '') + (i.wireless ? '<span class="tag">wireless</span>' : '') + (i.desc && i.desc !== i.name ? '<div class="muted" style="font-size:12px">' + esc(i.desc) + '</div>' : '') },
        { k: 'ipv4', label: 'Address', sort: i => i.ipv4[0] || '', fmt: i => '<span class="mono">' + esc(i.ipv4.join(', ')) + '</span><div class="muted mono" style="font-size:11px">' + esc((i.ipv6 || []).slice(0, 1).join('')) + '</div>' },
        { k: 'mac', label: 'MAC / MTU', fmt: i => '<span class="mono">' + esc(i.mac || '') + '</span><div class="muted" style="font-size:12px">' + (i.mtu ? 'MTU ' + i.mtu : '') + '</div>' },
        { k: 'speed', label: 'Link', num: true, fmt: i => F.link(i.speed) },
        { k: 'rx', label: '↓', num: true, fmt: i => F.bits(i.rx) }, { k: 'tx', label: '↑', num: true, fmt: i => F.bits(i.tx) },
        { k: 'rxp', label: 'Pkts in/s', num: true, fmt: i => F.num(i.rxp) }, { k: 'txp', label: 'Pkts out/s', num: true, fmt: i => F.num(i.txp) },
        { k: 'rxTot', label: 'Total ↓', num: true, fmt: i => F.b(i.rxTot, 1) }, { k: 'txTot', label: 'Total ↑', num: true, fmt: i => F.b(i.txTot, 1) },
        { k: 'errors', label: 'Err / drop', num: true, fmt: i => F.num(i.errors) + ' / ' + F.num(i.drops) },
      ], n.ifaces, { sortK: 'rxTot' }));
    } else if (nTab === 'connections') {
      let C = s.ports.conns.filter(c => {
        if (cf.hideLoop && ipKind(c.rh) === 'loopback') return false;
        if (cf.state !== 'all') { if (cf.state === 'other') { if (/^(ESTABLISHED|TIME_WAIT|CLOSE_WAIT|SYN_SENT)$/.test(c.state)) return false; } else if (c.state !== cf.state) return false; }
        if (cf.q && !(RW.pname(s, c.pid) + ' ' + c.lh + ':' + c.lp + ' ' + c.rh + ':' + c.rp + ' ' + (rdns.get(c.rh) || '') + ' ' + c.state + ' ' + c.pid + ' ' + RW.svc(c.rp)).toLowerCase().includes(cf.q)) return false;
        return true;
      });
      const counts = {}; for (const c of s.ports.conns) counts[c.state] = (counts[c.state] || 0) + 1;
      setH('ccount', C.length + ' shown · ' + Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => k.toLowerCase().replace('_', ' ') + ' ' + v).join(' · '));
      resolveIps(C.slice(0, 200).filter(c => ipKind(c.rh) === 'public').map(c => c.rh));
      if (cf.group === 'app' || cf.group === 'host') {
        const g = new Map();
        for (const c of C) { const k = cf.group === 'app' ? RW.pname(s, c.pid) : c.rh; let e = g.get(k); if (!e) { e = { key: k, n: 0, est: 0, other: new Set(), pid: c.pid, ports: new Set() }; g.set(k, e); } e.n++; if (c.state === 'ESTABLISHED') e.est++; e.other.add(cf.group === 'app' ? c.rh : RW.pname(s, c.pid)); e.ports.add(c.rp); }
        setH('cbody', RW.table('cg-' + cf.group, [
          { k: 'key', label: cf.group === 'app' ? 'App' : 'Remote host', fmt: e => '<b class="mono">' + esc(e.key) + '</b>' + (cf.group === 'host' ? ' <span class="muted">' + esc(rdns.get(e.key) || '') + '</span> ' + kindChip(ipKind(e.key)) : '') },
          { k: 'n', label: 'Connections', num: true }, { k: 'est', label: 'Established', num: true },
          { k: 'other', label: cf.group === 'app' ? 'Remote hosts' : 'Apps', sort: e => e.other.size, fmt: e => '<span class="muted">' + e.other.size + '</span> ' + esc([...e.other].slice(0, 4).join(', ')) },
          { k: 'ports', label: 'Remote ports', nosort: true, fmt: e => '<span class="mono muted">' + esc([...e.ports].slice(0, 6).join(', ')) + '</span>' },
        ], [...g.values()], { sortK: 'n', row: e => (cf.group === 'app' ? 'class="click" data-pid="' + e.pid + '"' : '') }));
        return;
      }
      setH('cbody', RW.table('conns', [
        { k: 'pid', label: 'Process', sort: c => RW.pname(s, c.pid), fmt: c => '<span class="pn">' + esc(RW.pname(s, c.pid)) + '</span><span class="sub">' + c.pid + '</span>' },
        { k: 'proto', label: 'Proto' },
        { k: 'lp', label: 'Local', fmt: c => '<span class="mono">' + esc(F.hp(c.lh, c.lp)) + '</span>' },
        { k: 'rh', label: 'Remote', fmt: c => '<span class="mono">' + esc(F.hp(c.rh, c.rp)) + '</span>' + (RW.svc(c.rp) ? ' <span class="muted">' + esc(RW.svc(c.rp)) + '</span>' : '') + (rdns.get(c.rh) ? '<div class="muted" style="font-size:12px">' + esc(rdns.get(c.rh)) + '</div>' : '') },
        { k: 'kind', label: 'Scope', sort: c => ipKind(c.rh), fmt: c => kindChip(ipKind(c.rh)) },
        { k: 'state', label: 'State', fmt: c => esc(c.state.toLowerCase().replace(/_/g, ' ')) },
      ], C, { max: 600, row: c => 'class="click" data-pid="' + c.pid + '"' }));
    } else if (nTab === 'listening') {
      const L = s.ports.listen;
      setH('lsum', L.filter(l => l.proto === 'TCP').length + ' TCP · ' + L.filter(l => l.proto === 'UDP').length + ' UDP · ' + L.filter(l => l.scope === 'all').length + ' on all interfaces');
      setH('lbody', RW.listenRows(s, L, false));
    } else if (nTab === 'lan') {
      const arp = (net && net.arp) || [];
      setH('arpc', arp.length + ' entries');
      setH('arp', net && net.error ? '<div class="empty">' + esc(net.error) + '</div>' : RW.table('arp', [{ k: 'ip', label: 'IP', fmt: a => '<span class="mono">' + esc(a.ip) + '</span>' }, { k: 'mac', label: 'MAC', fmt: a => '<span class="mono">' + esc(a.mac) + '</span>' + (/^.[26AE]/i.test(a.mac) ? ' <span class="tag" title="locally administered / randomized">random</span>' : '') }, { k: 'state', label: 'State', fmt: a => '<span class="muted">' + esc(a.state) + '</span>' }, { k: 'iface', label: 'Interface' }, { k: 'x', label: '', nosort: true, fmt: a => (RW.canControl() ? '<button class="btn sm" data-scanhost="' + esc(a.ip) + '">scan</button> <button class="btn sm" data-wake="' + esc(a.mac) + '">wake</button>' : '') }], arp.filter(a => !/^(ff|224\.|239\.|255\.)/i.test(a.ip) && !/^(01-00-5E|33-33)/i.test(a.mac)), { sortK: 'ip', sortD: 1 }));
      setH('known', knownDevs.length ? RW.table('known', [{ k: 'ip', label: 'IP', fmt: x => '<span class="mono">' + esc(x.ip) + '</span>' }, { k: 'name', label: 'Name', fmt: x => esc(x.name || '') }, { k: 'mac', label: 'MAC', fmt: x => '<span class="mono">' + esc(x.mac) + '</span>' }, { k: 'firstSeen', label: 'First seen', fmt: x => F.date(x.firstSeen) }, { k: 'lastSeen', label: 'Last seen', fmt: x => F.ago(x.lastSeen) }], knownDevs, { sortK: 'lastSeen' }) : '<div class="empty">Run a discovery to build your device inventory. New devices show up in the timeline.</div>');
    } else if (nTab === 'routing') {
      if (!net) return;
      setH('dnss', (net.dns || []).filter(d => d.servers.length).map(d => '<div class="brow"><span class="bl">' + esc(d.iface) + ' <span class="muted">' + esc(d.family || '') + '</span></span><span class="bv mono">' + esc(d.servers.join(', ')) + '</span></div>').join('') || '<div class="empty">none</div>');
      const gws = (net.routes || []).filter(r => /^(0\.0\.0\.0\/0|::\/0)$/.test(r.dest));
      setH('gw', gws.map(r => '<div class="brow"><span class="bl mono">' + esc(r.gw) + '</span><span class="bv">' + esc(r.iface) + ' · metric ' + r.metric + '</span></div>').join('') || '<div class="empty">none</div>');
      setH('rtc', (net.routes || []).length + ' routes');
      setH('routes', RW.table('routes', [{ k: 'dest', label: 'Destination', fmt: r => '<span class="mono">' + esc(r.dest) + '</span>' }, { k: 'gw', label: 'Gateway', fmt: r => '<span class="mono">' + esc(r.gw) + '</span>' }, { k: 'iface', label: 'Interface' }, { k: 'metric', label: 'Metric', num: true }, { k: 'family', label: 'Family' }], net.routes || [], { sortK: 'metric', sortD: 1 }));
    } else if (nTab === 'wifi') {
      if (!net) return;
      const w = (net.wifi || []).filter(x => x.ssid || x.signal);
      setH('wifi', w.length ? w.map(x => RW.kv([['Interface', esc(x.name)], ['State', esc(x.state || '')], ['SSID', esc(x.ssid || '')], ['BSSID', '<span class="mono">' + esc(x.bssid || '') + '</span>'], ['Signal', esc(x.signal || '') + (x.quality ? ' (quality ' + esc(x.quality) + ')' : '')], ['Radio', esc((x.radio || '') + (x.band ? ' · ' + x.band : '') + (x.channel ? ' · ch ' + x.channel : ''))], ['Rate', x.rx ? esc(x.rx + ' / ' + x.tx + ' Mbps') : ''], ['Security', esc((x.auth || '') + (x.cipher ? ' · ' + x.cipher : ''))]])).join('<hr style="border:0;border-top:1px solid var(--line)">') : '<div class="empty">No connected Wi-Fi interface (or the OS hides Wi-Fi details from this account).</div>');
      setH('fw', ((net.firewall || []).map(f => '<div class="brow"><span class="bl">' + esc(f.name) + '</span><span class="bv">' + (f.enabled ? '<span class="chip good"><i></i>on</span>' : '<span class="chip crit"><i></i>off</span>') + (f.inbound ? ' <span class="muted">in: ' + esc(f.inbound) + '</span>' : '') + '</span></div>').join('') || '<div class="muted">Firewall state not readable on this OS.</div>') +
        (net.av || []).map(a => '<div class="brow"><span class="bl">' + esc(a.name) + '</span><span class="bv">' + (a.enabled ? '<span class="chip good"><i></i>active</span>' : '<span class="chip"><i></i>passive</span>') + '</span></div>').join(''));
      setH('prof', (net.profiles || []).map(p => '<div class="brow"><span class="bl">' + esc(p.name) + ' <span class="muted">' + esc(p.iface) + '</span></span><span class="bv">' + esc(p.category) + ' · ' + esc(p.ipv4 || '') + '</span></div>').join('') || '<div class="muted">n/a</div>');
    }
  },
};

// ======================= Security =======================
let secData = null, secTimer = null;
const loadSec = () => RW.api('/api/security').then(d => { secData = d; RW.renderAll(); }).catch(() => {});
RW.pages.security = {
  title: 'Security', sub: 'exposure audit, posture and suspicious activity',
  topExtra: () => '<a class="btn sm ghost" href="/api/export?what=findings&format=csv" download>' + icon('download') + 'Findings CSV</a>',
  mount(root) {
    root.innerHTML = '<div class="grid g3"><article class="card"><header><h2>Exposure score</h2></header><div id="sc-g"></div></article><article class="card"><header><h2>Posture</h2></header><div id="sc-p"></div></article><article class="card"><header><h2>Signatures</h2><span class="right muted">Windows Authenticode</span></header><div id="sc-sig"></div></article></div>' +
      '<article class="card" style="margin-bottom:14px"><header><h2>Findings</h2><span class="right muted" id="sc-fc"></span></header><div id="sc-f"></div></article>' +
      '<div class="grid g2"><article class="card"><header><h2>New remote hosts</h2><span class="right muted">first contact per app</span></header><div id="sc-h" style="max-height:420px;overflow:auto"></div></article><article class="card"><header><h2>Security events</h2></header><div id="sc-e" style="max-height:420px;overflow:auto"></div></article></div>';
    loadSec(); clearInterval(secTimer); secTimer = setInterval(() => { if (RW.page === 'security') loadSec(); }, 5000);
    root.addEventListener('click', async e => {
      const b = e.target.closest('[data-fixport]');
      if (b && await RW.confirm('Free port ' + b.dataset.fixport + '?', 'Ends the process that listens on it.', { danger: true, ok: 'Kill' })) RW.action({ type: 'port.kill', port: +b.dataset.fixport });
    });
  },
  unmount() { clearInterval(secTimer); },
  update(s) {
    const sec = s.security, inv = (RW.st && RW.st.inventory) || {};
    setH('sc-g', '<div style="max-width:240px;margin:0 auto">' + RW.gauge(sec.score, 100, RW.scoreColor(sec.score), sec.score + '/100', 'higher is better') + '</div><div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:8px">' + ['critical', 'high', 'medium', 'low'].map(k => RW.sev(k) + '<b class="num">' + sec.counts[k] + '</b>').join(' ') + '</div>');
    const n = secData && secData.net;
    setH('sc-p', RW.kv([
      ['Firewall', n && n.firewall && n.firewall.length ? n.firewall.map(f => esc(f.name) + ' ' + (f.enabled ? '<span class="chip good"><i></i>on</span>' : '<span class="chip crit"><i></i>off</span>')).join(' ') : '<span class="muted">checking…</span>'],
      ['Antivirus', n && n.defender ? (n.defender.realtime ? '<span class="chip good"><i></i>Defender real-time on</span>' : '<span class="muted">Defender passive</span>') : '<span class="muted">n/a</span>'],
      ['Network', n && n.profiles ? esc(n.profiles.map(p => p.name + ' (' + p.category + ')').join(', ')) : ''],
      ['Secure Boot', inv.secureBoot == null ? '' : inv.secureBoot ? '<span class="chip good"><i></i>on</span>' : '<span class="chip warn"><i></i>off</span>'],
      ['RigWatch', esc(RW.st ? RW.st.bind : '') + (RW.auth.local ? '' : ' (remote view)')],
      ['Elevated', inv.isAdmin ? 'yes' : 'no (some processes are hidden)'],
    ]));
    const sigs = s.procs.filter(p => p.sig && p.sig.status !== 'Valid');
    setH('sc-sig', RW.st && RW.st.caps && RW.st.caps.signatures ? (sigs.length ? RW.table('sigs', [{ k: 'name', label: 'Process', fmt: p => '<span class="pn">' + esc(p.name) + '</span>' }, { k: 'sig', label: 'Status', sort: p => p.sig.status, fmt: p => '<span class="chip ' + (p.sig.status === 'NotSigned' ? 'warn' : 'crit') + '"><i></i>' + esc(p.sig.status) + '</span>' }, { k: 'conns', label: 'Conns', num: true }], sigs, { row: p => 'class="click" data-pid="' + p.pid + '"', sortK: 'conns' }) : '<div class="empty">Every checked network-facing binary has a valid signature (' + s.procs.filter(p => p.sig).length + ' checked).</div>') : '<div class="empty">Signature checks are Windows-only.</div>');
    const F2 = secData ? secData.findings : sec.top;
    setH('sc-fc', F2.length + ' findings');
    setH('sc-f', F2.length ? F2.map(x => '<div class="finding">' + RW.sev(x.sev) + '<div class="ft">' + esc(x.title) + '</div><div>' + (x.pid ? '<button class="btn sm" data-pid="' + x.pid + '">Process</button> ' : '') + (x.port && RW.canControl() && x.sev !== 'info' ? '<button class="btn sm danger" data-fixport="' + x.port + '">Free port</button>' : '') + '</div>' + (x.detail ? '<div class="fd">' + esc(x.detail) + '</div>' : '') + (x.fix ? '<div class="ff">' + icon('check') + ' ' + esc(x.fix) + '</div>' : '') + '</div>').join('') : '<div class="empty">Nothing risky found. Nice.</div>');
    const hosts = RW.events.filter(e => e.type === 'net.newhost').slice(-80).reverse();
    setH('sc-h', hosts.length ? hosts.map(RW.evRow).join('') : '<div class="empty">New remote hosts per app are recorded here as they appear.</div>');
    const sev = RW.events.filter(e => /^(finding|alert|lan|port\.open)/.test(e.type) || (e.type === 'proc.start' && e.sev !== 'info')).slice(-80).reverse();
    setH('sc-e', sev.length ? sev.map(RW.evRow).join('') : '<div class="empty">No security events yet.</div>');
  },
};

// ======================= Net Lab =======================
const TOOLS = [
  ['ping', 'Ping', 'activity', 'ICMP echo via the system ping', [['host', 'Host or IP', 'text', '1.1.1.1'], ['count', 'Count', 'number', '10'], ['v6', 'IPv6', 'check', false]]],
  ['trace', 'Traceroute', 'layers', 'every hop to a host', [['host', 'Host or IP', 'text', 'github.com'], ['hops', 'Max hops', 'number', '30']]],
  ['dns', 'DNS lookup', 'search', 'A, AAAA, MX, TXT, NS, SOA, CAA, PTR', [['name', 'Name (or IP for PTR)', 'text', 'github.com'], ['type', 'Type', 'select', ['ALL', 'A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA', 'CAA', 'SRV', 'PTR']], ['server', 'Resolver (optional)', 'text', '']]],
  ['dnsbench', 'DNS benchmark', 'zap', 'which resolver is fastest for you', [['name', 'Domain', 'text', 'example.com']]],
  ['scan', 'Port scanner', 'radar', 'TCP connect scan with banners', [['target', 'Host, IP, CIDR (/24) or range 10.0.0.1-50', 'text', '127.0.0.1'], ['ports', 'Ports: top, all, 1-1024, 22,80,443', 'text', 'top'], ['timeout', 'Timeout ms', 'number', '800'], ['concurrency', 'Parallel', 'number', '300'], ['banner', 'Grab banners', 'check', true]]],
  ['tls', 'TLS inspector', 'lock', 'certificate chain, expiry, cipher', [['host', 'Host', 'text', 'github.com'], ['port', 'Port', 'number', '443'], ['sni', 'SNI (optional)', 'text', '']]],
  ['http', 'HTTP probe', 'globe', 'timings, redirects, security headers', [['url', 'URL', 'text', 'https://github.com'], ['method', 'Method', 'select', ['GET', 'HEAD']]]],
  ['lan', 'LAN discovery', 'wifi', 'find every device on your subnet', []],
  ['wol', 'Wake-on-LAN', 'power', 'send a magic packet', [['mac', 'MAC address', 'text', '']]],
  ['publicip', 'Public IP', 'eye', 'what the internet sees (asks ipify)', []],
];
let labTool = 'ping', labJob = null, labPre = {};
RW.pages.lab = {
  title: 'Net Lab', sub: 'network tools that stream live. Only test hosts and networks you own or are allowed to test.', keepOnParams: true,
  mount(root, params) {
    labTool = params.tool && TOOLS.some(t => t[0] === params.tool) ? params.tool : labTool; labPre = params;
    root.innerHTML = '<div class="lab"><article class="card toollist" style="padding:8px">' + TOOLS.map(t => '<a data-tool="' + t[0] + '" class="' + (labTool === t[0] ? 'on' : '') + '">' + icon(t[2]) + '<span>' + t[1] + '<small>' + t[3] + '</small></span></a>').join('') + '</article>' +
      '<div><article class="card" style="margin-bottom:14px"><div id="lab-form"></div><div class="progress hidden" id="lab-prog"><i></i></div><div class="term" id="lab-term"></div></article><div id="lab-res"></div></div>' +
      '<article class="card jobs"><header><h2>Runs</h2></header><div class="joblist" id="lab-jobs"></div></article></div>';
    this.form();
    root.addEventListener('click', e => {
      const t = e.target.closest('[data-tool]'); if (t) { labTool = t.dataset.tool; labPre = {}; RW.$$('.toollist a').forEach(a => a.classList.toggle('on', a === t)); this.form(); }
      const j = e.target.closest('[data-job]'); if (j) { labJob = +j.dataset.job; const jj = RW.jobs.get(labJob); if (jj && !jj.lines.length) RW.api('/api/jobs/' + labJob).then(d => { jj.lines = d.lineList || []; jj.result = d.result; this.renderJob(); }); this.renderJob(); }
      if (e.target.closest('#lab-run')) this.run();
      if (e.target.closest('#lab-stop') && labJob) RW.api('/api/jobs/' + labJob + '/cancel', { method: 'POST' }).catch(er => RW.toast(er.message, 'err'));
      const sh = e.target.closest('[data-scanhost]'); if (sh) { labTool = 'scan'; labPre = { target: sh.dataset.scanhost }; RW.$$('.toollist a').forEach(a => a.classList.toggle('on', a.dataset.tool === 'scan')); this.form(); }
      const wk = e.target.closest('[data-wake]'); if (wk) RW.tool('wol', { mac: wk.dataset.wake }).then(() => RW.toast('Magic packet sent', 'ok')).catch(er => RW.toast(er.message, 'err'));
    });
    root.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.closest('#lab-form input')) this.run(); });
    this.onJob = id => { if (RW.page !== 'lab') return; if (id === labJob) this.renderJob(); this.renderJobs(); };
    if (!this.bound) { RW.on('job', id => this.onJob && this.onJob(id)); RW.on('tableview', () => { if (RW.page === 'lab') this.renderJob(); }); this.bound = true; }
    RW.api('/api/jobs').then(list => { for (const s of list) if (!RW.jobs.has(s.id)) RW.jobs.set(s.id, { s, lines: [], result: null }); this.renderJobs(); });
    if (params.run === '1') setTimeout(() => this.run(), 50);
  },
  onParams(p) { if (p.tool) { labTool = p.tool; labPre = p; RW.$$('.toollist a').forEach(a => a.classList.toggle('on', a.dataset.tool === labTool)); this.form(); } },
  form() {
    const T = TOOLS.find(t => t[0] === labTool);
    document.getElementById('lab-form').innerHTML = '<header style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><h2 style="margin:0;font-size:15px">' + T[1] + '</h2><span class="muted">' + esc(T[3]) + '</span></header><div class="form">' +
      T[4].map(([k, l, type, def]) => type === 'check' ? '<label class="check"><input type="checkbox" name="' + k + '"' + ((labPre[k] != null ? labPre[k] === 'true' : def) ? ' checked' : '') + '>' + esc(l) + '</label>'
        : type === 'select' ? '<label class="field">' + esc(l) + '<select name="' + k + '">' + def.map(o => '<option' + (labPre[k] === o ? ' selected' : '') + '>' + o + '</option>').join('') + '</select></label>'
          : '<label class="field" style="flex:' + (k === 'target' || k === 'url' || k === 'ports' ? 2 : 1) + '">' + esc(l) + '<input type="' + type + '" name="' + k + '" value="' + esc(labPre[k] != null ? labPre[k] : def) + '"></label>').join('') +
      '<button class="btn primary" id="lab-run"' + (RW.canControl() ? '' : ' disabled title="Read-only on this device"') + '>' + icon('play') + 'Run</button><button class="btn" id="lab-stop">' + icon('stop') + 'Stop</button></div>' + (labTool === 'scan' || labTool === 'lan' ? '<div class="muted" style="font-size:12px;margin-top:-4px">Scanning networks you do not own or have permission to test may be illegal.</div>' : '');
  },
  async run() {
    if (!RW.canControl()) return RW.toast('Read-only on this device', 'err');
    const T = TOOLS.find(t => t[0] === labTool), params = {};
    for (const [k, , type] of T[4]) { const el = document.querySelector('#lab-form [name="' + k + '"]'); params[k] = type === 'check' ? el.checked : type === 'number' ? +el.value : el.value.trim(); }
    try { const j = await RW.tool(labTool, params); labJob = j.id; this.renderJob(); this.renderJobs(); } catch (e) { RW.toast(e.message, 'err', 7000); }
  },
  renderJobs() { setH('lab-jobs', [...RW.jobs.values()].sort((a, b) => b.s.id - a.s.id).slice(0, 30).map(j => '<a data-job="' + j.s.id + '" class="' + (j.s.id === labJob ? 'on' : '') + '">' + esc(j.s.title || j.s.tool) + '<small>' + esc(j.s.status) + (j.s.started ? ' · ' + F.ago(j.s.started) : '') + '</small></a>').join('') || '<div class="empty">No runs yet.</div>'); },
  renderJob() {
    const j = RW.jobs.get(labJob), term = document.getElementById('lab-term');
    if (!term) return;
    if (!j) { term.innerHTML = '<span class="dim">Output streams here.</span>'; return; }
    const atBottom = term.scrollHeight - term.scrollTop - term.clientHeight < 40;
    term.innerHTML = j.lines.slice(-2500).map(l => '<span class="' + esc(l.cls) + '">' + esc(l.text) + '</span>').join('\n') + (j.s.status === 'running' ? '\n<span class="dim">…</span>' : '\n<span class="dim">[' + esc(j.s.status) + ']</span>');
    if (atBottom) term.scrollTop = term.scrollHeight;
    const pr = document.getElementById('lab-prog');
    pr.classList.toggle('hidden', j.s.progress == null || j.s.status !== 'running'); pr.firstChild.style.width = (j.s.progress || 0) + '%';
    setH('lab-res', j.result ? this.result(j.s.tool, j.result) : '');
  },
  result(tool, r) {
    const card = (t, b) => '<article class="card" style="margin-bottom:14px"><header><h2>' + t + '</h2></header>' + b + '</article>';
    if (tool === 'scan') return card('Open ports (' + r.open.length + ' of ' + r.probed + ' probed)', '<div class="tw">' + RW.table('scanr', [{ k: 'host', label: 'Host', fmt: o => '<span class="mono">' + esc(o.host) + '</span>' }, { k: 'port', label: 'Port', num: true }, { k: 'svc', label: 'Service', sort: o => RW.svc(o.port), fmt: o => '<span class="muted">' + esc(RW.svc(o.port)) + '</span>' }, { k: 'ms', label: 'RTT', num: true, fmt: o => o.ms + ' ms' }, { k: 'banner', label: 'Banner', cls: 'mono wrap' }], r.open, { sortK: 'port', sortD: 1 }) + '</div>');
    if (tool === 'tls') return card('Certificate chain', RW.kv([['Protocol', esc(r.protocol)], ['Cipher', esc(r.cipher ? r.cipher.name : '')], ['ALPN', esc(r.alpn || '–')], ['Trusted', r.authorized ? '<span class="chip good"><i></i>yes</span>' : '<span class="chip crit"><i></i>' + esc(r.authError) + '</span>'], ['Hostname', r.sni ? (r.hostnameOk ? '<span class="chip good"><i></i>matches</span>' : '<span class="chip crit"><i></i>' + esc(r.hostnameError) + '</span>') : '']]) +
      r.chain.map((c, i) => '<h3>' + (i === 0 ? 'Leaf' : 'Issuer ' + i) + ': ' + esc(c.subject) + '</h3>' + RW.kv([['Issued by', esc(c.issuer)], ['Valid', esc(c.validFrom + ' → ' + c.validTo)], ['Expires in', '<span class="chip ' + (c.daysLeft < 14 ? 'crit' : c.daysLeft < 45 ? 'warn' : 'good') + '"><i></i>' + c.daysLeft + ' days</span>'], ['Key', esc(c.key)], ['SAN', '<span class="mono">' + esc(String(c.san).slice(0, 400)) + '</span>'], ['SHA-256', '<span class="mono" style="font-size:11px">' + esc(c.fingerprint256) + '</span>']])).join(''));
    if (tool === 'http') {
      const last = r.hops[r.hops.length - 1], t = last.timing, tot = Math.max(1, t.total);
      const seg = [['DNS', t.dns, '--s4'], ['TCP', t.tcp, '--s3'], ['TLS', t.tls || 0, '--s7'], ['Server', t.ttfb, '--s1'], ['Download', Math.max(0, t.total - t.dns - t.tcp - (t.tls || 0) - t.ttfb), '--s2']];
      return card('Response', RW.kv([['Final URL', esc(last.url)], ['Status', '<b>' + last.status + '</b> · HTTP/' + esc(last.httpVersion)], ['Title', esc(last.title || '')], ['Size', F.b(last.size)], ['Redirects', String(r.hops.length - 1)]]) +
        '<h3>Timing (' + t.total + ' ms)</h3><div class="stack" style="height:16px">' + seg.map(s => '<i title="' + s[0] + ' ' + s[1] + ' ms" style="width:' + (100 * s[1] / tot) + '%;background:var(' + s[2] + ')"></i>').join('') + '</div><div class="legend" style="margin-top:6px">' + seg.map(s => '<span><i style="background:var(' + s[2] + ')"></i>' + s[0] + ' <b>' + s[1] + ' ms</b></span>').join('') + '</div>' +
        (/^https/.test(last.url) ? '<h3>Security headers</h3>' + r.checks.map(c => '<div class="brow"><span class="bl">' + (c.ok ? '<span class="chip good"><i></i>present</span>' : '<span class="chip warn"><i></i>missing</span>') + ' ' + esc(c.name) + '</span><span class="bv muted">' + esc(c.why) + '</span></div>').join('') : '') +
        '<h3>Headers</h3><div class="cmd">' + esc(Object.entries(last.headers).map(([k, v]) => k + ': ' + v).join('\n')) + '</div>');
    }
    if (tool === 'lan') return card('Devices (' + r.devices.length + ')', '<div class="tw">' + RW.table('lanr', [
      { k: 'ip', label: 'IP', sort: d => d.ip.split('.').map(x => x.padStart(3, '0')).join('.'), fmt: d => '<span class="mono">' + esc(d.ip) + '</span>' + (d.self ? '<span class="tag dev">this PC</span>' : '') + (d.gateway ? '<span class="tag">gateway</span>' : '') },
      { k: 'name', label: 'Name', fmt: d => esc(d.name || '') }, { k: 'mac', label: 'MAC', fmt: d => '<span class="mono">' + esc(d.mac || '') + '</span>' + (d.randomMac ? ' <span class="tag">random</span>' : '') },
      { k: 'ports', label: 'Open ports', sort: d => d.ports.length, fmt: d => '<span class="mono">' + esc(d.ports.join(', ')) + '</span>' }, { k: 'ms', label: 'RTT', num: true, fmt: d => (d.ms != null ? d.ms + ' ms' : 'arp') },
      { k: 'x', label: '', nosort: true, fmt: d => (d.self ? '' : '<button class="btn sm" data-scanhost="' + esc(d.ip) + '">scan</button>' + (d.mac ? ' <button class="btn sm" data-wake="' + esc(d.mac) + '">wake</button>' : '')) },
    ], r.devices, { sortK: 'ip', sortD: 1 }) + '</div>');
    if (tool === 'dnsbench') { const mx = Math.max(...r.resolvers.map(x => x.avg || 0), 1); return card('Resolvers (lower is better)', r.resolvers.map(x => RW.brow(esc(x.label) + ' <span class="muted mono">' + esc(x.ip) + '</span>', x.avg == null ? 'failed' : x.avg + ' ms avg · ' + x.min + '–' + x.max, x.avg ? 100 * x.avg / mx : 0, '--s1')).join('')); }
    if (tool === 'dns') return card('Answers for ' + esc(r.name), r.answers.map(a => '<div class="brow"><span class="bl"><b>' + a.type + '</b> ' + (a.error ? '<span class="muted">' + esc(a.error) + '</span>' : '<span class="mono">' + esc(a.records.join('  ·  ')) + '</span>') + '</span><span class="bv">' + (a.ms != null ? a.ms + ' ms' : '') + '</span></div>').join(''));
    if (tool === 'publicip') return card('Public address', RW.kv([['IPv4', '<span class="mono">' + esc(r.v4 || 'unavailable') + '</span>'], ['IPv6', '<span class="mono">' + esc(r.v6 || 'none') + '</span>']]));
    return '';
  },
  update() {},
};
})();
