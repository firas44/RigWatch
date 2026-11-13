'use strict';
// Multi-resolution metric history: 1 s for 15 min (memory), 10 s for 24 h and 1 min for 7 days
// (both appended to ~/.rigwatch/*.ndjson so charts survive restarts).
const fs = require('fs');
const path = require('path');
const U = require('./util');

const KEYS = ['cpu', 'gpu', 'mem', 'vram', 'rx', 'tx', 'rxp', 'txp', 'dr', 'dw', 'ct', 'gt', 'fps', 'ping', 'loss', 'conns', 'swap'];
const RANGES = { '5m': 300e3, '15m': 900e3, '1h': 3600e3, '6h': 6 * 3600e3, '24h': 86400e3, '7d': 7 * 86400e3 };

class History {
  constructor(dir, persist) {
    this.dir = dir; this.persist = persist;
    this.tiers = [
      { name: '1s', step: 0, span: 15 * 60e3, rows: [] },
      { name: '10s', step: 10e3, span: 86400e3, rows: [], acc: null, file: 'history-10s.ndjson', pending: [] },
      { name: '1m', step: 60e3, span: 7 * 86400e3, rows: [], acc: null, file: 'history-1m.ndjson', pending: [] },
    ];
    this.load();
    this.timer = setInterval(() => this.flush(), 60000); this.timer.unref();
  }
  push(point) {
    const row = [point.t, ...KEYS.map(k => (point[k] == null || Number.isNaN(point[k]) ? null : point[k]))];
    const t0 = this.tiers[0];
    t0.rows.push(row);
    while (t0.rows.length && t0.rows[0][0] < point.t - t0.span) t0.rows.shift();
    for (const tier of this.tiers.slice(1)) {
      const b = Math.floor(point.t / tier.step) * tier.step;
      if (tier.acc && tier.acc.b !== b) this.emit(tier);
      if (!tier.acc) tier.acc = { b, sum: new Array(KEYS.length).fill(0), n: new Array(KEYS.length).fill(0) };
      row.slice(1).forEach((v, i) => { if (v != null) { tier.acc.sum[i] += v; tier.acc.n[i]++; } });
    }
  }
  emit(tier) {
    const a = tier.acc; tier.acc = null;
    const row = [a.b, ...a.sum.map((s, i) => (a.n[i] ? U.r1(s / a.n[i]) : null))];
    tier.rows.push(row); tier.pending.push(row);
    while (tier.rows.length && tier.rows[0][0] < row[0] - tier.span) tier.rows.shift();
  }
  /** columns for a range: { range, step, t:[], cpu:[], ... } */
  query(range) {
    const ms = RANGES[range] || U.int(range, 0) || RANGES['15m'];
    const tier = ms <= this.tiers[0].span ? this.tiers[0] : ms <= this.tiers[1].span ? this.tiers[1] : this.tiers[2];
    const from = Date.now() - ms;
    const rows = tier.rows.filter(r => r[0] >= from);
    const out = { range, step: tier.step || 1000, t: rows.map(r => r[0]) };
    KEYS.forEach((k, i) => { out[k] = rows.map(r => r[i + 1]); });
    return out;
  }
  csv(range) {
    const q = this.query(range);
    const lines = ['time,' + KEYS.join(',')];
    q.t.forEach((t, i) => lines.push(new Date(t).toISOString() + ',' + KEYS.map(k => (q[k][i] == null ? '' : q[k][i])).join(',')));
    return lines.join('\n');
  }
  load() {
    if (!this.persist) return;
    for (const tier of this.tiers.slice(1)) {
      const file = path.join(this.dir, tier.file);
      const text = U.readText(file);
      if (!text) continue;
      const from = Date.now() - tier.span;
      let lines = 0;
      for (const line of text.split('\n')) {
        if (!line) continue; lines++;
        try { const r = JSON.parse(line); if (Array.isArray(r) && r[0] >= from && r.length === KEYS.length + 1) tier.rows.push(r); } catch { /* skip */ }
      }
      if (lines > tier.rows.length * 1.5 + 100) { try { fs.writeFileSync(file, tier.rows.map(r => JSON.stringify(r)).join('\n') + '\n'); } catch { /* ignore */ } }
    }
  }
  flush() {
    if (!this.persist) { for (const t of this.tiers) if (t.pending) t.pending = []; return; }
    try { fs.mkdirSync(this.dir, { recursive: true }); } catch { /* ignore */ }
    for (const tier of this.tiers.slice(1)) {
      if (!tier.pending.length) continue;
      try { fs.appendFileSync(path.join(this.dir, tier.file), tier.pending.map(r => JSON.stringify(r)).join('\n') + '\n'); } catch { /* ignore */ }
      tier.pending = [];
    }
  }
}

module.exports = { History, KEYS, RANGES };
