'use strict';
// Every remote address this machine talked to in the last year (ips.json), the programs that ran on it
// (programs.json), and an optional threat-intel feed matcher (FireHOL level 1 + abuse.ch Feodo, opt-in).
const fs = require('fs');
const path = require('path');
const https = require('https');
const U = require('../util');
const { dayKey, DAY } = require('./store');

function writeAtomic(file, text) {
  try { fs.mkdirSync(path.dirname(file), { recursive: true }); const tmp = file + '.tmp'; fs.writeFileSync(tmp, text); fs.renameSync(tmp, file); return true; } catch { return false; }
}
const pushCap = (a, v, n) => { if (v == null || v === '' || a.includes(v)) return; a.push(v); if (a.length > n) a.shift(); };
const SKIP_KINDS = new Set(['loopback', 'any', 'multicast']);

class IpTracker {
  constructor(file, persist, retentionDays, onNewDay) {
    this.file = file; this.persist = persist; this.retention = retentionDays; this.onNewDay = onNewDay || (() => {});
    this.map = new Map(); this.conns = new Set(); this.dirty = false; this.seeded = false;
    if (persist) {
      try { for (const e of JSON.parse(fs.readFileSync(file, 'utf8'))) if (e && e.ip) this.map.set(e.ip, e); this.seeded = this.map.size > 0; } catch { /* first run */ }
    }
    this.prune();
    this.timer = setInterval(() => this.save(), 60000); this.timer.unref();
  }
  entry(ip, now) {
    let e = this.map.get(ip);
    if (!e) { e = { ip, kind: U.ipKind(ip), first: now, last: now, conns: 0, inb: 0, outb: 0, procs: [], rports: [], lports: [], ok: 0, fail: 0, drops: 0, events: 0, maxLevel: 0 }; this.map.set(ip, e); this.dirty = true; e.isNew = true; }
    if (now > e.last) e.last = now;
    if (now < e.first) e.first = now;
    const d = dayKey(now);
    if (e.day !== d && now > Date.now() - DAY) { e.day = d; this.onNewDay(d, ip); }
    return e;
  }
  /** called on every fresh socket table. Returns { inbound: [{ip, port, process}], fresh: [ip] } */
  observe(sock, nameOf, now = Date.now()) {
    const listen = new Set(sock.listen.filter(l => l.proto === 'TCP').map(l => l.port));
    const cur = new Set(), inbound = [], fresh = [];
    for (const c of sock.conns) {
      if (!c.rh || SKIP_KINDS.has(U.ipKind(c.rh))) continue;
      const key = c.proto + '|' + c.lp + '|' + c.rh + '|' + c.rp;
      cur.add(key);
      const known = this.map.has(c.rh);
      const e = this.entry(c.rh, now);
      if (!known) fresh.push(c.rh);
      if (this.conns.has(key)) continue;
      e.conns++; this.dirty = true;
      const isIn = c.proto === 'TCP' && listen.has(c.lp) && c.rp > 0;
      const proc = nameOf(c.pid);
      pushCap(e.procs, proc, 8);
      if (isIn) { e.inb++; pushCap(e.lports, c.lp, 12); if (e.kind === 'public' || e.kind === 'cgnat') inbound.push({ ip: c.rh, port: c.lp, process: proc, pid: c.pid }); }
      else { e.outb++; pushCap(e.rports, c.rp, 12); }
    }
    this.conns = cur;
    this.seeded = true;
    return { inbound, fresh };
  }
  noteAuth(ip, ok, ts) { const e = this.entry(ip, ts); if (ok) { e.ok++; e.lastOk = ts; } else { e.fail++; e.lastFail = ts; } this.dirty = true; }
  noteDrop(ip, n, ports, ts) { const e = this.entry(ip, ts); e.drops += n; for (const p of ports) pushCap(e.lports, p, 12); this.dirty = true; }
  noteEvent(ip, level, ts) { const e = this.entry(ip, ts); e.events++; if (level > e.maxLevel) e.maxLevel = level; this.dirty = true; }
  hasLoggedIn(ip) { const e = this.map.get(ip); return !!(e && e.ok > 0); }
  get(ip) { return this.map.get(ip) || null; }
  list(fromMs) { const out = []; for (const e of this.map.values()) if (e.last >= fromMs) out.push(e); return out; }
  prune() {
    const cut = Date.now() - this.retention * DAY;
    for (const [k, e] of this.map) if (e.last < cut) this.map.delete(k);
    if (this.map.size > 20000) {
      const keep = [...this.map.values()].sort((a, b) => (b.maxLevel - a.maxLevel) || (b.last - a.last)).slice(0, 15000);
      this.map = new Map(keep.map(e => [e.ip, e]));
    }
  }
  save(force) {
    if (!this.persist || (!this.dirty && !force)) return;
    this.prune();
    writeAtomic(this.file, JSON.stringify([...this.map.values()].map(e => { const o = Object.assign({}, e); delete o.isNew; return o; })));
    this.dirty = false;
  }
}

/** executables seen running (for "program ran for the first time") */
class Programs {
  constructor(file, persist, retentionDays) {
    this.file = file; this.persist = persist; this.retention = retentionDays; this.map = new Map(); this.dirty = false; this.seeded = false;
    this.started = Date.now(); this.warmUntil = Date.now() + 180e3; // process paths arrive gradually at start-up
    if (persist) { try { for (const e of JSON.parse(fs.readFileSync(file, 'utf8'))) this.map.set(e.k, e); this.seeded = this.map.size > 0; } catch { /* first run */ } }
    this.timer = setInterval(() => this.save(), 120000); this.timer.unref();
  }
  /** returns the processes whose executable was never seen before (empty on the very first scan) */
  observe(procs, now = Date.now()) {
    const fresh = [];
    // never seed the baseline from an empty or partial list (collectors still starting)
    if (!this.seeded && procs.filter(p => p.exe).length < 10) return fresh;
    for (const p of procs) {
      if (!p.exe || p.kind === 'rigwatch') continue;
      const k = p.exe.toLowerCase();
      const e = this.map.get(k);
      if (e) { if (now - e.last > 60000) { e.last = now; this.dirty = true; } continue; }
      this.map.set(k, { k, exe: p.exe, name: p.name, first: now, last: now });
      this.dirty = true;
      // "ran for the first time" only for processes that started after RigWatch did
      const startedBefore = p.age != null && p.age > (now - this.started) / 1000 + 20;
      if (this.seeded && now > this.warmUntil && !startedBefore) fresh.push(p);
    }
    this.seeded = true;
    // a burst (e.g. after restarting elevated, when paths of system processes become visible) is a baseline refresh
    return fresh.length > 25 ? [] : fresh;
  }
  list() { return [...this.map.values()]; }
  save(force) {
    if (!this.persist || (!this.dirty && !force)) return;
    const cut = Date.now() - this.retention * DAY;
    for (const [k, e] of this.map) if (e.last < cut) this.map.delete(k);
    if (this.map.size > 30000) this.map = new Map([...this.map].sort((a, b) => b[1].last - a[1].last).slice(0, 25000));
    writeAtomic(this.file, JSON.stringify([...this.map.values()]));
    this.dirty = false;
  }
}

// ---------------------------------------------------------------------------
// threat-intel feeds (IPv4 lists; only fetched when the user turns the feed on)
// ---------------------------------------------------------------------------
const FEEDS = [
  { name: 'FireHOL level 1', id: 'firehol1', url: 'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/firehol_level1.netset' },
  { name: 'abuse.ch Feodo Tracker', id: 'feodo', url: 'https://feodotracker.abuse.ch/downloads/ipblocklist.txt' },
];
const ip4 = s => { const p = String(s).split('.'); if (p.length !== 4) return null; let n = 0; for (const x of p) { const v = +x; if (!/^\d{1,3}$/.test(x) || v > 255) return null; n = n * 256 + v; } return n; };
/** parse a netset / ip list into sorted, merged [start, end, feedIndex] ranges */
function parseList(text, fi) {
  const out = [];
  for (const raw of String(text).split('\n')) {
    const line = raw.trim(); if (!line || line[0] === '#' || line[0] === ';') continue;
    const m = line.match(/^(\d+\.\d+\.\d+\.\d+)(?:\/(\d{1,2}))?/); if (!m) continue;
    const a = ip4(m[1]); if (a == null) continue;
    const bits = m[2] != null ? +m[2] : 32; if (bits < 8 || bits > 32) continue;
    const size = 2 ** (32 - bits), start = Math.floor(a / size) * size;
    out.push([start, start + size - 1, fi]);
  }
  return out;
}
function fetchText(url, max = 8 << 20, hops = 3) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'user-agent': 'RigWatch' }, timeout: 20000 }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && hops > 0) { res.resume(); return resolve(fetchText(new URL(res.headers.location, url).toString(), max, hops - 1)); }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      let size = 0; const chunks = [];
      res.on('data', d => { size += d.length; if (size > max) { req.destroy(new Error('feed too large')); return; } chunks.push(d); });
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}
class Feeds {
  constructor(dir, persist) { this.dir = dir; this.persist = persist; this.ranges = []; this.meta = {}; this.at = 0; this.err = ''; this.busy = false; }
  load() {
    const all = [];
    FEEDS.forEach((f, i) => { const text = U.readText(path.join(this.dir, f.id + '.txt')); if (text) { const r = parseList(text, i); all.push(...r); this.meta[f.id] = Object.assign(this.meta[f.id] || {}, { name: f.name, entries: r.length }); } });
    this.build(all);
    try { this.at = fs.statSync(path.join(this.dir, FEEDS[0].id + '.txt')).mtimeMs; } catch { this.at = 0; }
  }
  build(list) { list.sort((a, b) => a[0] - b[0]); this.ranges = list; }
  async refresh() {
    if (this.busy) return; this.busy = true; this.err = '';
    const all = [];
    try {
      for (let i = 0; i < FEEDS.length; i++) {
        const f = FEEDS[i];
        try {
          const text = await fetchText(f.url);
          const r = parseList(text, i);
          if (r.length) { all.push(...r); this.meta[f.id] = { name: f.name, entries: r.length, at: Date.now() }; if (this.persist) writeAtomic(path.join(this.dir, f.id + '.txt'), text); }
        } catch (e) { this.err = f.name + ': ' + e.message; const old = U.readText(path.join(this.dir, f.id + '.txt')); if (old) all.push(...parseList(old, i)); }
      }
      if (all.length) { this.build(all); this.at = Date.now(); }
    } finally { this.busy = false; }
  }
  /** feed name for a public IPv4 address, or null */
  match(ip) {
    if (!this.ranges.length || U.ipKind(ip) !== 'public') return null;
    const n = ip4(ip); if (n == null) return null;
    let lo = 0, hi = this.ranges.length - 1, hit = null;
    while (lo <= hi) { const mid = (lo + hi) >> 1, r = this.ranges[mid]; if (r[0] <= n) { if (r[1] >= n) { hit = r; break; } lo = mid + 1; } else hi = mid - 1; }
    // overlapping ranges: scan back a little from the insertion point
    if (!hit) for (let i = Math.min(hi, this.ranges.length - 1); i >= 0 && i > hi - 64; i--) { const r = this.ranges[i]; if (r[0] <= n && r[1] >= n) { hit = r; break; } }
    return hit ? FEEDS[hit[2]].name : null;
  }
  status() { return { entries: this.ranges.length, at: this.at, err: this.err, busy: this.busy, feeds: FEEDS.map(f => Object.assign({ name: f.name, url: f.url }, this.meta[f.id] || {})) }; }
}

module.exports = { IpTracker, Programs, Feeds, parseList, ip4, FEEDS };
