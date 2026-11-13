'use strict';
// Local event history, light on disk:
//   ~/.rigwatch/siem/events/2026-11-13.jsonl      one JSON event per line, one file per day
//   older days are gzipped (2026-11-01.jsonl.gz), days past the retention (365 by default) are deleted,
//   and a total size cap (SIEM_MAX_MB, 256 MB) deletes the oldest days first.
//   ~/.rigwatch/siem/rollups.json                  small per-day counters that power the charts
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');
const { bandOf } = require('./rules');

const gunzip = promisify(zlib.gunzip), gzip = promisify(zlib.gzip);
const DAY = 86400e3;
const pad = n => String(n).padStart(2, '0');
const dayKey = t => { const d = new Date(t); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
const dayStart = key => new Date(key + 'T00:00:00').getTime();
const FILE_RX = /^(\d{4}-\d\d-\d\d)\.jsonl(\.gz)?$/;
const LOGON_OK = new Set([2001, 2002, 2003, 2020, 2032]); // real sign-ins (not unlocks or derived alerts)

function writeAtomic(file, text) {
  try { fs.mkdirSync(path.dirname(file), { recursive: true }); const tmp = file + '.tmp'; fs.writeFileSync(tmp, text); fs.renameSync(tmp, file); return true; } catch { return false; }
}
const newDay = () => ({ n: 0, lv: new Array(16).fill(0), h: Array.from({ length: 24 }, () => [0, 0, 0, 0, 0]), ok: new Array(24).fill(0), fail: new Array(24).fill(0), rules: {}, ips: {}, users: {}, mitre: {}, uniq: 0 });
const topN = (o, n) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n));
const inc = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };

class EventStore {
  constructor(dir, opts = {}) {
    this.dir = dir; this.evDir = path.join(dir, 'events');
    this.persist = opts.persist !== false;
    this.retention = opts.retentionDays || 365;
    this.modulesOf = opts.modulesOf || (() => []);
    this.maxBytes = (opts.maxMB || 256) * 1048576;
    this.recent = []; this.pending = []; this.cache = new Map();
    this.rollFile = path.join(dir, 'rollups.json');
    this.rollups = {}; this.rollDirty = false;
    this.info = { days: 0, bytes: 0, oldest: null, files: [] };
    if (this.persist) { try { const r = JSON.parse(fs.readFileSync(this.rollFile, 'utf8')); if (r && typeof r === 'object') this.rollups = r; } catch { /* first run */ } this.heal(); }
    this.flushTimer = setInterval(() => this.flush(), 5000); this.flushTimer.unref();
    this.rollTimer = setInterval(() => this.saveRollups(), 60000); this.rollTimer.unref();
    this.maintTimer = setInterval(() => this.maintain().catch(() => {}), 3600e3); this.maintTimer.unref();
    setTimeout(() => this.maintain().catch(() => {}), 4000).unref();
  }

  /** after a crash or kill the counters can lag the day files: recount days written after rollups.json */
  heal() {
    let rollAt = 0;
    try { rollAt = fs.statSync(this.rollFile).mtimeMs; } catch { rollAt = 0; }
    let names = [];
    try { names = fs.readdirSync(this.evDir); } catch { return; }
    const days = new Set();
    for (const n of names) { const m = n.match(FILE_RX); if (!m) continue; try { if (fs.statSync(path.join(this.evDir, n)).mtimeMs > rollAt - 5000) days.add(m[1]); } catch { /* raced */ } }
    for (const k of [...days].sort().slice(-40)) {
      let text = '';
      try { text += zlib.gunzipSync(fs.readFileSync(path.join(this.evDir, k + '.jsonl.gz'))).toString('utf8'); } catch { /* none */ }
      try { text += fs.readFileSync(path.join(this.evDir, k + '.jsonl'), 'utf8'); } catch { /* none */ }
      const uniq = this.rollups[k] ? this.rollups[k].uniq : 0;
      delete this.rollups[k];
      for (const line of text.split('\n')) { if (!line) continue; try { this.roll(JSON.parse(line)); } catch { /* skip */ } }
      if (this.rollups[k]) this.rollups[k].uniq = uniq;
    }
    if (days.size) this.rollDirty = true;
  }

  add(ev) {
    this.recent.push(ev);
    if (this.recent.length > 3000) this.recent.splice(0, this.recent.length - 3000);
    this.pending.push(ev);
    this.roll(ev);
  }
  roll(ev) {
    const k = dayKey(ev.ts), d = this.rollups[k] || (this.rollups[k] = newDay());
    const lv = Math.max(0, Math.min(15, ev.rule.level | 0)), h = new Date(ev.ts).getHours();
    d.n++; d.lv[lv]++; d.h[h][bandOf(lv)]++;
    inc(d.rules, ev.rule.id);
    if (ev.ip) inc(d.ips, ev.ip);
    if (ev.user) inc(d.users, ev.user);
    for (const m of ev.rule.mitre || []) inc(d.mitre, m);
    const band = bandOf(lv);
    d.mod = d.mod || {};
    for (const m of this.modulesOf(ev)) { const a = d.mod[m] || (d.mod[m] = [0, 0, 0, 0, 0]); a[band]++; }
    if (LOGON_OK.has(ev.rule.id)) d.ok[h]++;
    if (ev.rule.groups.includes('authentication_failed')) d.fail[h]++;
    this.rollDirty = true;
  }
  noteUniq(day) { const d = this.rollups[day] || (this.rollups[day] = newDay()); d.uniq++; this.rollDirty = true; }

  flush() {
    if (!this.pending.length) return;
    const batch = this.pending; this.pending = [];
    if (!this.persist) return;
    const byDay = new Map();
    for (const ev of batch) { const k = dayKey(ev.ts); if (!byDay.has(k)) byDay.set(k, []); byDay.get(k).push(JSON.stringify(ev)); }
    try { fs.mkdirSync(this.evDir, { recursive: true }); } catch { return; }
    for (const [k, lines] of byDay) {
      const text = lines.join('\n') + '\n';
      try {
        const gz = path.join(this.evDir, k + '.jsonl.gz');
        // a late event for a day that is already compressed: gzip allows appending another member
        if (k < dayKey(Date.now() - DAY) && fs.existsSync(gz)) fs.appendFileSync(gz, zlib.gzipSync(text));
        else fs.appendFileSync(path.join(this.evDir, k + '.jsonl'), text);
      } catch { /* disk full / read-only: drop */ }
      this.cache.delete(k);
    }
  }
  saveRollups(force) {
    if (!this.persist || (!this.rollDirty && !force)) return;
    const cut = dayKey(Date.now() - this.retention * DAY);
    const out = {};
    for (const [k, d] of Object.entries(this.rollups)) {
      if (k < cut) { delete this.rollups[k]; continue; }
      // keep the file small: only the top entries per day
      d.ips = topN(d.ips, 200); d.users = topN(d.users, 50); d.rules = topN(d.rules, 120);
      out[k] = d;
    }
    writeAtomic(this.rollFile, JSON.stringify(out));
    this.rollDirty = false;
  }

  /** compress closed days, drop days past retention, enforce the size cap */
  async maintain() {
    if (!this.persist) return;
    let names = [];
    try { names = fs.readdirSync(this.evDir); } catch { return; }
    const yesterday = dayKey(Date.now() - DAY), cut = dayKey(Date.now() - this.retention * DAY);
    for (const n of names) {
      const m = n.match(/^(\d{4}-\d\d-\d\d)\.jsonl$/);
      if (!m || m[1] >= yesterday) continue;
      const plain = path.join(this.evDir, n), tmp = plain + '.gzing', gz = plain + '.gz';
      try {
        fs.renameSync(plain, tmp); // new events for that day start a fresh plain file
        const data = await gzip(fs.readFileSync(tmp));
        fs.appendFileSync(gz, data);
        fs.rmSync(tmp, { force: true });
        this.cache.delete(m[1]);
      } catch { try { if (fs.existsSync(tmp) && !fs.existsSync(plain)) fs.renameSync(tmp, plain); } catch { /* leave it */ } }
    }
    // leftovers from an interrupted run
    for (const n of names) if (n.endsWith('.gzing')) { try { const p = path.join(this.evDir, n); fs.appendFileSync(p.replace(/\.gzing$/, '.gz'), await gzip(fs.readFileSync(p))); fs.rmSync(p, { force: true }); } catch { /* skip */ } }
    let files = [];
    for (const n of fs.readdirSync(this.evDir)) {
      const m = n.match(FILE_RX); if (!m) continue;
      const p = path.join(this.evDir, n);
      if (m[1] < cut) { try { fs.rmSync(p, { force: true }); } catch { /* skip */ } continue; }
      try { files.push({ day: m[1], file: p, size: fs.statSync(p).size }); } catch { /* raced */ }
    }
    files.sort((a, b) => (a.day < b.day ? -1 : 1));
    let total = files.reduce((a, f) => a + f.size, 0);
    const today = dayKey(Date.now());
    while (total > this.maxBytes && files.length > 1 && files[0].day < today) {
      const f = files.shift(); total -= f.size;
      try { fs.rmSync(f.file, { force: true }); } catch { /* skip */ }
    }
    const days = [...new Set(files.map(f => f.day))];
    this.info = { days: days.length, bytes: total, oldest: days[0] || null, newest: days[days.length - 1] || null };
    this.saveRollups(true);
  }

  async readDay(k) {
    const today = dayKey(Date.now());
    if (k !== today && this.cache.has(k)) { const c = this.cache.get(k); this.cache.delete(k); this.cache.set(k, c); return c; }
    let text = '';
    if (this.persist) {
      try { text += (await gunzip(await fs.promises.readFile(path.join(this.evDir, k + '.jsonl.gz')))).toString('utf8'); } catch { /* none */ }
      try { text += await fs.promises.readFile(path.join(this.evDir, k + '.jsonl'), 'utf8'); } catch { /* none */ }
    }
    let lines = text ? text.split('\n').filter(Boolean) : [];
    const extra = this.pending.filter(e => dayKey(e.ts) === k).map(e => JSON.stringify(e));
    if (!this.persist) lines = this.recent.filter(e => dayKey(e.ts) === k).map(e => JSON.stringify(e));
    else if (extra.length) lines = lines.concat(extra);
    if (k !== today) { this.cache.set(k, lines); while (this.cache.size > 8) this.cache.delete(this.cache.keys().next().value); }
    return lines;
  }

  /**
   * Newest-first search. f = parsed query (rules.parseQuery), match(f, ev), pre(f, lineLower).
   * Returns { events, more, cursor } where cursor is the ts to pass as `before` for the next page.
   */
  async query({ from, to, before, limit = 200, f, match, pre }) {
    const upper = Math.min(to || Date.now(), before != null ? before - 1 : Infinity);
    const out = [];
    let k = dayKey(upper);
    const lowKey = dayKey(from);
    let scannedDays = 0;
    while (k >= lowKey && out.length < limit && scannedDays < 400) {
      const lines = await this.readDay(k);
      const rows = [];
      for (const line of lines) {
        if (pre && !pre(f, line.toLowerCase())) continue;
        let ev; try { ev = JSON.parse(line); } catch { continue; }
        if (ev.ts > upper || ev.ts < from) continue;
        if (match && !match(f, ev)) continue;
        rows.push(ev);
      }
      rows.sort((a, b) => b.ts - a.ts);
      for (const ev of rows) { out.push(ev); if (out.length >= limit) break; }
      scannedDays++;
      k = dayKey(dayStart(k) - DAY / 2);
    }
    const more = out.length >= limit;
    return { events: out, more, cursor: out.length ? out[out.length - 1].ts : null };
  }

  /** visit every matching event in [from, to], newest day first; stops after `max` matches */
  async scan({ from, to = Date.now(), f, match, pre, max = 100000 }, cb) {
    let k = dayKey(to), n = 0, days = 0;
    const lowKey = dayKey(from);
    while (k >= lowKey && n < max && days < 400) {
      const lines = await this.readDay(k);
      for (let i = lines.length - 1; i >= 0 && n < max; i--) {
        const line = lines[i];
        if (pre && !pre(f, line.toLowerCase())) continue;
        let ev; try { ev = JSON.parse(line); } catch { continue; }
        if (ev.ts > to || ev.ts < from) continue;
        if (match && !match(f, ev)) continue;
        n++; cb(ev);
      }
      days++;
      k = dayKey(dayStart(k) - DAY / 2);
      if (days % 7 === 0) await new Promise(r => setImmediate(r)); // stay responsive on big ranges
    }
    return { scanned: n, capped: n >= max };
  }

  /** charts: buckets (hourly up to 2 days, daily beyond) + top lists, from the rollups */
  summary(fromMs, toMs = Date.now()) {
    const span = toMs - fromMs, hourly = span <= 2 * DAY + 1;
    const buckets = [];
    const tot = { n: 0, bands: [0, 0, 0, 0, 0], ok: 0, fail: 0, uniq: 0 };
    const top = { rules: {}, ips: {}, users: {}, mitre: {} };
    const lv = new Array(16).fill(0);
    if (hourly) {
      const step = 3600e3, start = Math.floor(fromMs / step) * step;
      for (let t = start; t <= toMs; t += step) {
        const d = this.rollups[dayKey(t)], h = new Date(t).getHours();
        const b = d ? d.h[h].slice() : [0, 0, 0, 0, 0];
        buckets.push({ t, bands: b, ok: d ? d.ok[h] : 0, fail: d ? d.fail[h] : 0, n: b.reduce((a, x) => a + x, 0) });
      }
    } else {
      for (let t = dayStart(dayKey(fromMs)); t <= toMs; t += DAY) {
        const k = dayKey(t + 3600e3), d = this.rollups[k];
        const b = [0, 0, 0, 0, 0]; let ok = 0, fail = 0;
        if (d) { for (const row of d.h) row.forEach((x, i) => { b[i] += x; }); ok = d.ok.reduce((a, x) => a + x, 0); fail = d.fail.reduce((a, x) => a + x, 0); }
        buckets.push({ t: dayStart(k), bands: b, ok, fail, n: b.reduce((a, x) => a + x, 0), uniq: d ? d.uniq : 0 });
      }
    }
    // totals and top lists come from whole days in range (good enough for charts)
    for (let t = dayStart(dayKey(fromMs)); t <= toMs; t += DAY) {
      const d = this.rollups[dayKey(t + 3600e3)]; if (!d) continue;
      for (const [k, v] of Object.entries(d.rules)) inc(top.rules, k, v);
      for (const [k, v] of Object.entries(d.ips)) inc(top.ips, k, v);
      for (const [k, v] of Object.entries(d.users)) inc(top.users, k, v);
      for (const [k, v] of Object.entries(d.mitre)) inc(top.mitre, k, v);
      d.lv.forEach((x, i) => { lv[i] += x; });
      tot.uniq = Math.max(tot.uniq, d.uniq);
    }
    for (const b of buckets) { tot.n += b.n; b.bands.forEach((x, i) => { tot.bands[i] += x; }); tot.ok += b.ok; tot.fail += b.fail; }
    const list = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);
    return { step: hourly ? 3600e3 : DAY, buckets, totals: tot, levels: lv, top: { rules: list(top.rules, 12), ips: list(top.ips, 12), users: list(top.users, 10), mitre: list(top.mitre, 12) } };
  }
  /** per-module severity counts { module: [info, low, medium, high, critical] } and daily series */
  modules(fromMs, toMs = Date.now()) {
    const out = {}, days = [];
    for (let t = dayStart(dayKey(fromMs)); t <= toMs; t += DAY) {
      const k = dayKey(t + 3600e3), d = this.rollups[k], row = {};
      if (d && d.mod) for (const [m, a] of Object.entries(d.mod)) { const o = out[m] || (out[m] = [0, 0, 0, 0, 0]); a.forEach((x, i) => { o[i] += x; }); row[m] = a.reduce((s, x) => s + x, 0); }
      days.push({ t: dayStart(k), m: row });
    }
    return { totals: out, days };
  }
  ruleHits(fromMs) {
    const out = {};
    for (const [k, d] of Object.entries(this.rollups)) if (dayStart(k) + DAY > fromMs) for (const [id, n] of Object.entries(d.rules)) inc(out, id, n);
    return out;
  }
  stats() { return Object.assign({ retentionDays: this.retention, maxMB: Math.round(this.maxBytes / 1048576), dir: this.evDir, persist: this.persist, today: (this.rollups[dayKey(Date.now())] || { n: 0 }).n }, this.info); }
  stop() { this.flush(); this.saveRollups(true); }
}

module.exports = { EventStore, dayKey, dayStart, DAY };
