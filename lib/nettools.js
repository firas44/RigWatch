'use strict';
// Network lab tools. Every tool validates its input and runs as a cancellable job.
// Only point the scanners at hosts and networks you own or are authorised to test.
const net = require('net');
const tls = require('tls');
const dns = require('dns');
const dgram = require('dgram');
const http = require('http');
const https = require('https');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');
const U = require('./util');

const TOP_PORTS = [21, 22, 23, 25, 53, 80, 81, 88, 110, 111, 135, 139, 143, 161, 389, 443, 445, 465, 514, 515, 548, 554, 587, 631, 636, 873, 993, 995, 1080, 1194, 1433, 1521, 1723, 1883, 1900, 2049, 2082, 2083, 2181, 2375, 2376, 3000, 3001, 3128, 3268, 3306, 3389, 3690, 4000, 4200, 4443, 4444, 4567, 5000, 5001, 5060, 5173, 5222, 5432, 5555, 5601, 5672, 5900, 5984, 6000, 6379, 6443, 6667, 7000, 7001, 7070, 8000, 8008, 8009, 8080, 8081, 8086, 8088, 8443, 8888, 9000, 9001, 9042, 9090, 9092, 9100, 9200, 9222, 9229, 9300, 10000, 10250, 11211, 11434, 15672, 25565, 27015, 27017, 32400, 49152, 62078];
const HTTPISH = new Set([80, 81, 3000, 3001, 4000, 4200, 5000, 5173, 7000, 8000, 8008, 8080, 8081, 8086, 8088, 8888, 9000, 9090, 9200, 10000, 11434, 32400]);
const DISCOVERY_PORTS = [80, 443, 22, 445, 139, 135, 3389, 8080, 8443, 62078, 7000, 5000, 554, 1883, 9100, 515, 8008, 8009, 53, 3000];

function parsePorts(spec) {
  spec = String(spec || 'top').trim().toLowerCase();
  if (spec === 'top' || spec === 'common') return TOP_PORTS.slice();
  if (spec === 'all') spec = '1-65535';
  const out = new Set();
  for (const part of spec.split(/[\s,]+/)) {
    if (!part) continue;
    const m = part.match(/^(\d+)(?:-(\d+))?$/);
    if (!m) throw new Error('bad port spec: ' + part);
    const a = +m[1], b = m[2] ? +m[2] : a;
    if (a < 1 || b > 65535 || b < a) throw new Error('port out of range: ' + part);
    for (let p = a; p <= b; p++) out.add(p);
  }
  return [...out];
}
function ipToInt(ip) { return ip.split('.').reduce((a, o) => (a << 8) + (+o), 0) >>> 0; }
function intToIp(n) { return [24, 16, 8, 0].map(s => (n >>> s) & 255).join('.'); }
function expandTarget(t, max = 1024) {
  t = String(t || '').trim();
  const m = t.match(/^(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,2})$/);
  if (m) {
    const bits = +m[2]; if (bits < 16 || bits > 32) throw new Error('use a /16 to /32 network');
    const base = ipToInt(m[1]) & (bits === 32 ? 0xffffffff : (~0 << (32 - bits)) >>> 0);
    const size = 2 ** (32 - bits);
    if (size > max + 2) throw new Error('network too large (max ' + max + ' hosts)');
    const out = [];
    for (let i = size > 2 ? 1 : 0; i < (size > 2 ? size - 1 : size); i++) out.push(intToIp((base + i) >>> 0));
    return out;
  }
  const r = t.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.)(\d{1,3})-(\d{1,3})$/);
  if (r) { const out = []; for (let i = +r[2]; i <= Math.min(+r[3], 255); i++) out.push(r[1] + i); return out; }
  if (!U.safeHost(t)) throw new Error('invalid host');
  return [t];
}

/** TCP connect probe -> { state: 'open'|'closed'|'filtered', ms, banner } */
function probe(host, port, timeout, banner) {
  return new Promise(resolve => {
    const t0 = Date.now();
    let done = false, data = '';
    const s = net.connect({ host, port });
    const fin = (state, err) => { if (done) return; done = true; s.destroy(); resolve({ state, ms: Date.now() - t0, banner: data.split(/\r?\n/)[0].replace(/[^\x20-\x7e]/g, '').slice(0, 140), err }); };
    s.setTimeout(timeout);
    s.on('timeout', () => (s.connecting ? fin('filtered') : fin('open')));
    s.on('error', e => fin(e.code === 'ECONNREFUSED' ? 'closed' : 'filtered', e.code));
    s.on('connect', () => {
      if (!banner) return fin('open');
      s.setTimeout(700);
      setTimeout(() => { if (!done && !data && HTTPISH.has(port)) s.write('HEAD / HTTP/1.0\r\nHost: ' + host + '\r\n\r\n'); }, 350);
      s.on('data', d => { data += d.toString('latin1'); if (data.includes('\n')) fin('open'); });
      s.on('end', () => fin('open'));
    });
  });
}
async function pool(items, n, fn, isCancelled) {
  let i = 0;
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length && !isCancelled()) { const it = items[i++]; await fn(it); } });
  await Promise.all(workers);
}

function streamCmd(api, cmd, args) {
  return new Promise(resolve => {
    api.line('$ ' + [cmd, ...args].join(' '), 'cmd');
    let p;
    try { p = spawn(cmd, args, { windowsHide: true }); } catch (e) { api.line(e.message, 'err'); return resolve(-1); }
    api.onCancel(() => { try { p.kill(); } catch { /* gone */ } });
    U.onLines(p.stdout, l => api.line(l));
    U.onLines(p.stderr, l => api.line(l, 'err'));
    p.on('error', e => { api.line(e.code === 'ENOENT' ? cmd + ' is not installed' : e.message, 'err'); resolve(-1); });
    p.on('close', code => resolve(code));
  });
}

const TOOLS = {
  ping: {
    title: p => 'ping ' + p.host,
    async run(p, api) {
      const host = U.safeHost(p.host); if (!host) throw new Error('invalid host');
      const count = U.clamp(U.int(p.count, 10), 1, 500);
      const args = U.IS_WIN ? ['-n', String(count)] : ['-c', String(count)];
      if (p.v6) args.push('-6');
      args.push(host);
      await streamCmd(api, U.IS_WIN ? 'ping.exe' : 'ping', args);
    },
  },
  trace: {
    title: p => 'traceroute ' + p.host,
    async run(p, api) {
      const host = U.safeHost(p.host); if (!host) throw new Error('invalid host');
      const hops = String(U.clamp(U.int(p.hops, 30), 1, 64));
      if (U.IS_WIN) return streamCmd(api, 'tracert.exe', ['-d', '-w', '1000', '-h', hops, host]);
      if (U.which(['traceroute'], ['/usr/sbin', '/usr/bin'])) return streamCmd(api, U.which(['traceroute'], ['/usr/sbin', '/usr/bin']), ['-n', '-w', '1', '-q', '1', '-m', hops, host]);
      return streamCmd(api, 'tracepath', ['-n', '-m', hops, host]);
    },
  },
  dns: {
    title: p => 'dns ' + (p.type || 'A') + ' ' + p.name,
    async run(p, api) {
      const name = String(p.name || '').trim();
      if (!/^[A-Za-z0-9._:-]{1,253}$/.test(name)) throw new Error('invalid name');
      const types = String(p.type || 'A').toUpperCase() === 'ALL' ? ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA', 'CAA'] : [String(p.type || 'A').toUpperCase()];
      const r = new dns.promises.Resolver({ timeout: 3000, tries: 2 });
      if (p.server) { const s = U.safeHost(p.server); if (!s) throw new Error('invalid server'); r.setServers([s]); }
      api.line('resolver: ' + r.getServers().join(', '), 'cmd');
      const out = [];
      for (const type of types) {
        const t0 = Date.now();
        try {
          let res;
          if (type === 'PTR') res = await r.reverse(name);
          else if (type === 'A' || type === 'AAAA') res = await r.resolve(name, type === 'A' ? 'A' : 'AAAA').then(a => a);
          else res = await r.resolve(name, type);
          const ms = Date.now() - t0;
          const fmt = x => {
            if (typeof x === 'string') return x;
            if (Array.isArray(x)) return x.join('');
            if (x.exchange) return x.priority + ' ' + x.exchange;
            if (x.nsname) return x.nsname + ' ' + x.hostmaster + ' serial ' + x.serial + ' refresh ' + x.refresh + ' retry ' + x.retry + ' expire ' + x.expire + ' min ' + x.minttl;
            if (x.port && x.name) return x.priority + ' ' + x.weight + ' ' + x.port + ' ' + x.name;
            if (x.issue || x.issuewild || x.iodef) return (x.critical || 0) + ' ' + Object.keys(x).filter(k => k !== 'critical')[0] + ' "' + (x.issue || x.issuewild || x.iodef) + '"';
            return JSON.stringify(x);
          };
          const rows = (Array.isArray(res) ? res : [res]).map(fmt);
          for (const row of rows) api.line(type.padEnd(6) + row);
          out.push({ type, ms, records: rows });
          api.line('  (' + rows.length + ' record' + (rows.length === 1 ? '' : 's') + ', ' + ms + ' ms)', 'dim');
        } catch (e) { api.line(type.padEnd(6) + (e.code || e.message), 'err'); out.push({ type, error: e.code || e.message }); }
      }
      return { name, answers: out };
    },
  },
  dnsbench: {
    title: p => 'DNS resolver benchmark (' + (p.name || 'example.com') + ')',
    async run(p, api) {
      const name = /^[A-Za-z0-9.-]{1,253}$/.test(p.name || '') ? p.name : 'example.com';
      const sys = dns.getServers()[0];
      const list = [['System (' + sys + ')', sys], ['Cloudflare', '1.1.1.1'], ['Google', '8.8.8.8'], ['Quad9', '9.9.9.9'], ['OpenDNS', '208.67.222.222'], ['AdGuard', '94.140.14.14']];
      const res = [];
      for (const [label, ip] of list) {
        if (api.cancelled) break;
        const r = new dns.promises.Resolver({ timeout: 2000, tries: 1 }); r.setServers([ip]);
        const times = [];
        for (let i = 0; i < 5; i++) { const t0 = process.hrtime.bigint(); try { await r.resolve4(name); times.push(Number(process.hrtime.bigint() - t0) / 1e6); } catch { times.push(null); } }
        const ok = times.filter(x => x != null);
        const row = { label, ip, min: ok.length ? U.r1(Math.min(...ok)) : null, avg: ok.length ? U.r1(ok.reduce((a, b) => a + b, 0) / ok.length) : null, max: ok.length ? U.r1(Math.max(...ok)) : null, fail: times.length - ok.length };
        res.push(row);
        api.line(label.padEnd(26) + (row.avg == null ? 'failed' : 'avg ' + row.avg + ' ms  (min ' + row.min + ', max ' + row.max + ')') + (row.fail ? '  ' + row.fail + ' failed' : ''));
      }
      res.sort((a, b) => (a.avg == null) - (b.avg == null) || a.avg - b.avg);
      if (res[0] && res[0].avg != null) api.line('fastest: ' + res[0].label, 'ok');
      return { name, resolvers: res };
    },
  },
  scan: {
    title: p => 'port scan ' + p.target,
    async run(p, api) {
      const hosts = expandTarget(p.target, 1024);
      const ports = parsePorts(p.ports);
      if (hosts.length * ports.length > 70000) throw new Error('too many probes (' + hosts.length * ports.length + '), max 70000');
      const timeout = U.clamp(U.int(p.timeout, 800), 100, 5000);
      const conc = U.clamp(U.int(p.concurrency, 300), 1, 1000);
      const banner = p.banner !== false;
      const resolved = [];
      for (const h of hosts) {
        if (net.isIP(h)) { resolved.push(h); continue; }
        try { const a = await dns.promises.lookup(h); resolved.push(a.address); api.line(h + ' → ' + a.address, 'dim'); } catch { throw new Error('cannot resolve ' + h); }
      }
      api.line('scanning ' + resolved.length + ' host(s) × ' + ports.length + ' port(s), timeout ' + timeout + ' ms, ' + conc + ' parallel', 'cmd');
      const tasks = []; for (const h of resolved) for (const port of ports) tasks.push([h, port]);
      const open = []; let done = 0; const total = tasks.length; const t0 = Date.now(); let lastP = 0;
      await pool(tasks, conc, async ([h, port]) => {
        const r = await probe(h, port, timeout, banner);
        done++;
        if (r.state === 'open') { open.push({ host: h, port, ms: r.ms, banner: r.banner }); api.line(h + ':' + port + '  open  ' + r.ms + ' ms' + (r.banner ? '  ' + r.banner : ''), 'ok'); }
        if (Date.now() - lastP > 400) { lastP = Date.now(); api.progress(Math.round(100 * done / total)); }
      }, () => api.cancelled);
      api.progress(100);
      api.line('done: ' + open.length + ' open of ' + done + ' probed in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s', 'cmd');
      return { open: open.sort((a, b) => (a.host < b.host ? -1 : a.host > b.host ? 1 : a.port - b.port)), probed: done };
    },
  },
  tls: {
    title: p => 'tls ' + p.host + ':' + (p.port || 443),
    run(p, api) {
      const host = U.safeHost(p.host); if (!host) throw new Error('invalid host');
      const port = U.clamp(U.int(p.port, 443), 1, 65535);
      const sni = p.sni ? U.safeHost(p.sni) : (net.isIP(host) ? undefined : host);
      return new Promise((resolve, reject) => {
        const t0 = Date.now();
        const s = tls.connect({ host, port, servername: sni, rejectUnauthorized: false, ALPNProtocols: ['h2', 'http/1.1'], timeout: 8000 });
        api.onCancel(() => s.destroy());
        s.on('timeout', () => { s.destroy(); reject(new Error('timeout')); });
        s.on('error', e => reject(e));
        s.on('secureConnect', () => {
          const ms = Date.now() - t0;
          const chain = []; let c = s.getPeerCertificate(true); const seen = new Set();
          while (c && c.raw && !seen.has(c.fingerprint256)) {
            seen.add(c.fingerprint256);
            let keyType = '';
            try { const x = new crypto.X509Certificate(c.raw); keyType = x.publicKey.asymmetricKeyType + (c.bits ? ' ' + c.bits : '') + (c.asn1Curve ? ' ' + c.asn1Curve : ''); } catch { /* old node */ }
            const days = Math.floor((new Date(c.valid_to) - Date.now()) / 86400000);
            chain.push({ subject: c.subject ? (c.subject.CN || c.subject.O || '') : '', subjectO: c.subject ? c.subject.O : '', issuer: c.issuer ? (c.issuer.CN || c.issuer.O || '') : '', validFrom: c.valid_from, validTo: c.valid_to, daysLeft: days, san: c.subjectaltname || '', fingerprint256: c.fingerprint256, serial: c.serialNumber, key: keyType });
            c = c.issuerCertificate;
          }
          const leaf = s.getPeerCertificate();
          const idErr = sni ? tls.checkServerIdentity(sni, leaf) : null;
          const res = { host, port, sni: sni || null, ms, protocol: s.getProtocol(), cipher: s.getCipher(), alpn: s.alpnProtocol || null, authorized: s.authorized, authError: s.authorizationError ? String(s.authorizationError) : null, hostnameOk: !idErr, hostnameError: idErr ? idErr.message : null, chain };
          s.end();
          api.line(res.protocol + '  ' + (res.cipher && res.cipher.name) + '  ALPN ' + (res.alpn || '-') + '  handshake ' + ms + ' ms', 'cmd');
          api.line(res.authorized ? 'chain trusted by Node’s CA store' : 'NOT trusted: ' + res.authError, res.authorized ? 'ok' : 'err');
          if (sni) api.line(res.hostnameOk ? 'hostname matches certificate' : 'hostname mismatch: ' + res.hostnameError, res.hostnameOk ? 'ok' : 'err');
          chain.forEach((x, i) => api.line((i === 0 ? 'leaf ' : 'ca' + i + '  ') + x.subject + '  ← ' + x.issuer + '  expires in ' + x.daysLeft + ' d', x.daysLeft < 14 ? 'err' : ''));
          resolve(res);
        });
      });
    },
  },
  http: {
    title: p => 'http ' + p.url,
    async run(p, api) {
      let url = String(p.url || '').trim();
      if (!/^https?:\/\//i.test(url)) url = 'http://' + url;
      const hops = [];
      for (let i = 0; i < 6; i++) {
        const r = await httpOnce(url, String(p.method || 'GET').toUpperCase() === 'HEAD' ? 'HEAD' : 'GET', api);
        hops.push(r);
        api.line(r.status + ' ' + url + '  (' + r.timing.total + ' ms: dns ' + r.timing.dns + ', tcp ' + r.timing.tcp + (r.timing.tls != null ? ', tls ' + r.timing.tls : '') + ', ttfb ' + r.timing.ttfb + ')', r.status < 400 ? 'ok' : 'err');
        if (r.status >= 300 && r.status < 400 && r.headers.location && p.follow !== false) { url = new URL(r.headers.location, url).href; continue; }
        break;
      }
      const last = hops[hops.length - 1];
      const H = last.headers;
      const checks = [
        ['Strict-Transport-Security', !!H['strict-transport-security'], 'forces HTTPS'],
        ['Content-Security-Policy', !!H['content-security-policy'], 'limits script/style sources'],
        ['X-Content-Type-Options', /nosniff/i.test(H['x-content-type-options'] || ''), 'blocks MIME sniffing'],
        ['X-Frame-Options / frame-ancestors', !!H['x-frame-options'] || /frame-ancestors/i.test(H['content-security-policy'] || ''), 'clickjacking protection'],
        ['Referrer-Policy', !!H['referrer-policy'], 'controls referrer leakage'],
        ['Permissions-Policy', !!H['permissions-policy'], 'restricts browser features'],
      ];
      if (/^https:/.test(url)) for (const c of checks) api.line((c[1] ? '✓ ' : '✗ ') + c[0], c[1] ? 'ok' : 'dim');
      if (H.server || H['x-powered-by']) api.line('discloses: ' + [H.server, H['x-powered-by']].filter(Boolean).join(', '), 'dim');
      return { hops, checks: checks.map(c => ({ name: c[0], ok: c[1], why: c[2] })), title: last.title };
    },
  },
  lan: {
    title: () => 'LAN discovery',
    async run(p, api, ctx) {
      const nets = [];
      for (const [name, list] of Object.entries(os.networkInterfaces())) for (const a of list || []) {
        if (a.family !== 'IPv4' && a.family !== 4) continue;
        if (a.internal || a.address.startsWith('169.254.')) continue;
        let bits = a.cidr ? +a.cidr.split('/')[1] : 24; if (bits < 22) bits = 24;
        if (/vethernet|docker|veth|br-|virbr|vmnet|vbox|tailscale|zt|utun|wsl/i.test(name)) continue;
        nets.push({ name, ip: a.address, bits, cidr: intToIp(ipToInt(a.address) & ((~0 << (32 - bits)) >>> 0)) + '/' + bits });
      }
      if (!nets.length) throw new Error('no LAN interface found');
      const found = new Map();
      for (const n of nets) {
        api.line('scanning ' + n.cidr + ' on ' + n.name + ' (' + n.ip + ')', 'cmd');
        const hosts = expandTarget(n.cidr, 1024);
        let done = 0;
        await pool(hosts, 32, async h => {
          if (h === n.ip) { found.set(h, { ip: h, self: true, ports: [], ms: 0 }); done++; return; }
          // all discovery ports at once: an open port or a RST (closed) both prove the host is up
          const rs = await Promise.all(DISCOVERY_PORTS.map(port => probe(h, port, 600, false).then(r => Object.assign(r, { port }))));
          const alive = rs.filter(r => r.state !== 'filtered');
          if (alive.length) {
            const e = { ip: h, ports: alive.filter(r => r.state === 'open').map(r => r.port), ms: Math.min(...alive.map(r => r.ms)) };
            found.set(h, e);
            api.line(h.padEnd(16) + 'up  ' + e.ms + ' ms' + (e.ports.length ? '  open ' + e.ports.join(',') : ''), 'ok');
          }
          done++;
          if (done % 8 === 0) api.progress(Math.round(100 * done / hosts.length));
        }, () => api.cancelled);
      }
      api.progress(100);
      // ARP fills in devices that ignored every probe, and gives MACs
      try {
        const info = await ctx.netInfo(true);
        const ifIps = nets.map(n => ({ base: ipToInt(n.ip) & ((~0 << (32 - n.bits)) >>> 0), mask: (~0 << (32 - n.bits)) >>> 0 }));
        for (const a of info.arp || []) {
          if (!/^\d+\.\d+\.\d+\.\d+$/.test(a.ip) || !ifIps.some(x => ((ipToInt(a.ip) & x.mask) >>> 0) === x.base)) continue;
          if (/^(01-00-5E|33-33|FF-FF)/i.test(a.mac)) continue;
          const e = found.get(a.ip) || { ip: a.ip, ports: [], ms: null, arpOnly: true };
          e.mac = a.mac; found.set(a.ip, e);
        }
        const gws = new Set((info.routes || []).filter(r => /^0\.0\.0\.0\/0$/.test(r.dest)).map(r => r.gw));
        for (const e of found.values()) if (gws.has(e.ip)) e.gateway = true;
      } catch { /* no arp access */ }
      for (const n of nets) { const e = found.get(n.ip); if (e) { const m = (os.networkInterfaces()[n.name] || []).find(a => a.address === n.ip); if (m) e.mac = m.mac.toUpperCase().replace(/:/g, '-'); } }
      const r = new dns.promises.Resolver({ timeout: 1200, tries: 1 });
      await pool([...found.values()], 24, async e => { try { e.name = (await r.reverse(e.ip))[0] || ''; } catch { e.name = ''; } }, () => api.cancelled);
      const devices = [...found.values()].sort((a, b) => ipToInt(a.ip) - ipToInt(b.ip)).map(e => Object.assign(e, { randomMac: e.mac ? /^.[26AE]/i.test(e.mac) : false }));
      api.line(devices.length + ' devices found', 'cmd');
      if (ctx.onDevices) ctx.onDevices(devices);
      return { nets, devices };
    },
  },
  wol: {
    title: p => 'wake ' + p.mac,
    async run(p, api) {
      const mac = String(p.mac || '').trim();
      if (!/^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i.test(mac)) throw new Error('invalid MAC');
      const bytes = Buffer.from(mac.replace(/[:-]/g, ''), 'hex');
      const pkt = Buffer.concat([Buffer.alloc(6, 0xff), ...Array(16).fill(bytes)]);
      const targets = new Set(['255.255.255.255']);
      for (const list of Object.values(os.networkInterfaces())) for (const a of list || []) if ((a.family === 'IPv4' || a.family === 4) && !a.internal) targets.add(intToIp((ipToInt(a.address) | (~ipToInt(a.netmask) >>> 0)) >>> 0));
      const sock = dgram.createSocket('udp4');
      await new Promise(r => sock.bind(() => { sock.setBroadcast(true); r(); }));
      for (const t of targets) { await new Promise(r => sock.send(pkt, 9, t, () => r())); api.line('magic packet → ' + t + ':9', 'ok'); }
      sock.close();
      return { sent: [...targets] };
    },
  },
  publicip: {
    title: () => 'public IP',
    async run(p, api) {
      const get = async u => { const c = new AbortController(); const t = setTimeout(() => c.abort(), 5000); try { const r = await fetch(u, { signal: c.signal }); return (await r.json()).ip; } catch { return null; } finally { clearTimeout(t); } };
      api.line('asking api.ipify.org (only on demand)', 'dim');
      const [v4, v6] = await Promise.all([get('https://api.ipify.org?format=json'), get('https://api64.ipify.org?format=json')]);
      api.line('IPv4  ' + (v4 || 'unavailable'), v4 ? 'ok' : 'err');
      api.line('IPv6  ' + (v6 && v6.includes(':') ? v6 : 'none'), v6 && v6.includes(':') ? 'ok' : 'dim');
      return { v4, v6: v6 && v6.includes(':') ? v6 : null };
    },
  },
};

function httpOnce(url, method, api) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const t = { start: Date.now() };
    const req = lib.request(u, { method, timeout: 10000, rejectUnauthorized: false, headers: { 'user-agent': 'RigWatch/2 (+local probe)', accept: '*/*' } }, res => {
      t.ttfb = Date.now();
      let body = '', size = 0;
      res.on('data', d => { size += d.length; if (body.length < 262144) body += d.toString('utf8'); });
      res.on('end', () => {
        const end = Date.now();
        const title = ((body.match(/<title[^>]*>([^<]{0,200})/i) || [])[1] || '').trim();
        resolve({ url, status: res.statusCode, httpVersion: res.httpVersion, headers: res.headers, size, title, timing: { dns: (t.lookup || t.start) - t.start, tcp: (t.connect || t.lookup || t.start) - (t.lookup || t.start), tls: t.secure ? t.secure - t.connect : null, ttfb: t.ttfb - (t.secure || t.connect || t.start), total: end - t.start } });
      });
    });
    api.onCancel(() => req.destroy(new Error('cancelled')));
    req.on('socket', s => { s.on('lookup', () => { t.lookup = Date.now(); }); s.on('connect', () => { t.connect = Date.now(); }); s.on('secureConnect', () => { t.secure = Date.now(); }); });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    req.end();
  });
}

module.exports = { TOOLS, parsePorts, expandTarget, TOP_PORTS };
