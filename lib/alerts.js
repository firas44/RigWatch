'use strict';
// Threshold alert rules. Fire after a condition holds for `forSec`, clear when it stops.
// Delivered to the page (toast + browser notification) and optionally to a webhook.
const U = require('./util');

const maxOf = a => { const v = a.filter(x => x != null); return v.length ? Math.max(...v) : null; };
const byName = (s, t) => { const n = String(t || '').toLowerCase(); return n ? s.procs.filter(p => p.name.toLowerCase() === n || (p.label || '').toLowerCase().startsWith(n)) : []; };

const METRICS = {
  cpu: { label: 'CPU usage', unit: '%', get: s => s.cpu.util },
  gpu: { label: 'GPU usage', unit: '%', get: s => (s.gpus[0] ? s.gpus[0].util : null) },
  mem: { label: 'Memory used', unit: '%', get: s => (s.mem.total ? 100 * s.mem.used / s.mem.total : null) },
  vram: { label: 'VRAM used', unit: '%', get: s => { const g = s.gpus[0]; return g && g.vramTotal ? 100 * g.vramUsed / g.vramTotal : null; } },
  swap: { label: 'Swap used', unit: '%', get: s => (s.mem.swapTotal ? 100 * s.mem.swapUsed / s.mem.swapTotal : null) },
  cpuTemp: { label: 'CPU temperature', unit: '°C', get: s => s.cpu.temp },
  gpuTemp: { label: 'GPU temperature', unit: '°C', get: s => maxOf(s.gpus.map(g => g.temp)) },
  gpuHotspot: { label: 'GPU hotspot', unit: '°C', get: s => maxOf(s.gpus.map(g => g.hotspot)) },
  diskTemp: { label: 'Disk temperature', unit: '°C', get: s => maxOf(s.disks.map(d => d.temp)) },
  diskFree: { label: 'Lowest free disk space', unit: '%', get: s => { const l = s.fs.filter(f => f.size > 1e9 && f.kind !== 'network'); return l.length ? Math.min(...l.map(f => 100 * f.free / f.size)) : null; } },
  diskBusy: { label: 'Disk busy', unit: '%', get: s => maxOf(s.disks.map(d => d.active)) },
  netRx: { label: 'Download', unit: 'Mb/s', get: s => s.net.rx * 8 / 1e6 },
  netTx: { label: 'Upload', unit: 'Mb/s', get: s => s.net.tx * 8 / 1e6 },
  ping: { label: 'Ping', unit: 'ms', get: s => (s.net.ping ? (s.net.ping.ms == null ? 2000 : s.net.ping.ms) : null) },
  loss: { label: 'Packet loss', unit: '%', get: s => (s.net.ping ? s.net.ping.loss : null) },
  retrans: { label: 'TCP retransmits', unit: '%', get: s => (s.net.tcp ? s.net.tcp.retransPct : null) },
  fps: { label: 'Game FPS', unit: 'fps', get: s => (s.fps.main ? s.fps.main.fps : null) },
  conns: { label: 'Open connections', unit: '', get: s => s.ports.total },
  battery: { label: 'Battery', unit: '%', get: s => (s.battery[0] ? s.battery[0].pct : null) },
  findings: { label: 'High/critical security findings', unit: '', get: s => s.security.counts.critical + s.security.counts.high },
  procCpu: { label: 'App CPU (by name)', unit: '%', target: 'process name', get: (s, t) => { const l = byName(s, t); return l.length ? l.reduce((a, p) => a + p.cpu, 0) : 0; } },
  procMem: { label: 'App memory (by name)', unit: 'GB', target: 'process name', get: (s, t) => byName(s, t).reduce((a, p) => a + p.mem, 0) / 1073741824 },
  procRunning: { label: 'App running (1 = yes)', unit: '', target: 'process name', get: (s, t) => (byName(s, t).length ? 1 : 0) },
  portOpen: { label: 'Port listening (1 = yes)', unit: '', target: 'port number', get: (s, t) => (s.ports.listen.some(l => l.port === +t) ? 1 : 0) },
};

const DEFAULT_RULES = [
  { id: 'cpu-temp', name: 'CPU running hot', metric: 'cpuTemp', op: '>', value: 90, forSec: 10, enabled: true },
  { id: 'gpu-temp', name: 'GPU running hot', metric: 'gpuTemp', op: '>', value: 88, forSec: 10, enabled: true },
  { id: 'disk-free', name: 'Disk almost full', metric: 'diskFree', op: '<', value: 10, forSec: 0, enabled: true },
  { id: 'mem-high', name: 'Memory pressure', metric: 'mem', op: '>', value: 92, forSec: 30, enabled: true },
  { id: 'net-loss', name: 'Packet loss', metric: 'loss', op: '>', value: 10, forSec: 20, enabled: true },
  { id: 'sec-high', name: 'High-risk exposure detected', metric: 'findings', op: '>', value: 0, forSec: 0, enabled: true },
  { id: 'cpu-pegged', name: 'CPU pegged', metric: 'cpu', op: '>', value: 95, forSec: 60, enabled: false },
  { id: 'fps-drop', name: 'FPS dropped', metric: 'fps', op: '<', value: 50, forSec: 5, enabled: false },
];

class Alerts {
  constructor(store, save, timeline) {
    this.store = store; this.save = save; this.timeline = timeline;
    this.rules = this.sanitize(store.alerts || DEFAULT_RULES);
    this.state = new Map(); this.outbox = [];
  }
  sanitize(rules) {
    return U.arr(rules).filter(r => r && METRICS[r.metric] && (r.op === '>' || r.op === '<')).slice(0, 100).map((r, i) => ({
      id: String(r.id || 'rule-' + Date.now() + '-' + i).slice(0, 40), name: String(r.name || METRICS[r.metric].label).slice(0, 80), metric: r.metric, target: r.target != null ? String(r.target).slice(0, 80) : '',
      op: r.op, value: U.num(r.value), forSec: U.clamp(U.int(r.forSec, 0), 0, 86400), cooldownSec: U.clamp(U.int(r.cooldownSec, 300), 0, 86400), enabled: r.enabled !== false, webhook: !!r.webhook,
    }));
  }
  setRules(rules) { this.rules = this.sanitize(rules); this.store.alerts = this.rules; this.save(); this.state.clear(); return this.list(); }
  list() { return this.rules.map(r => Object.assign({}, r, { state: this.state.get(r.id) || null, metricLabel: METRICS[r.metric].label, unit: METRICS[r.metric].unit })); }
  firing() { return this.rules.filter(r => (this.state.get(r.id) || {}).firing).map(r => { const s = this.state.get(r.id); return { id: r.id, name: r.name, value: s.value, since: s.since }; }); }
  evaluate(snap) {
    const now = Date.now();
    for (const r of this.rules) {
      if (!r.enabled) { this.state.delete(r.id); continue; }
      let v = null;
      try { v = METRICS[r.metric].get(snap, r.target); } catch { v = null; }
      const s = this.state.get(r.id) || { firing: false, over: null, since: null, value: null, lastFired: 0 };
      s.value = v == null ? null : U.r1(v);
      const cond = v != null && (r.op === '>' ? v > r.value : v < r.value);
      if (cond) {
        if (s.over == null) s.over = now;
        if (!s.firing && now - s.over >= r.forSec * 1000) {
          s.firing = true; s.since = now;
          if (now - s.lastFired >= r.cooldownSec * 1000 || !s.lastFired) {
            s.lastFired = now;
            const unit = METRICS[r.metric].unit;
            const msg = r.name + ': ' + METRICS[r.metric].label + (r.target ? ' (' + r.target + ')' : '') + ' is ' + s.value + unit + ' (' + r.op + ' ' + r.value + unit + ')';
            const e = this.timeline.add('alert.fire', 'warn', msg, { rule: r.id });
            this.outbox.push({ rule: r, event: e, msg });
          }
        }
      } else {
        s.over = null;
        if (s.firing) { s.firing = false; this.timeline.add('alert.clear', 'info', r.name + ' cleared', { rule: r.id }); }
      }
      this.state.set(r.id, s);
    }
    const out = this.outbox; this.outbox = [];
    for (const o of out) if (o.rule.webhook) this.webhook(o.msg).catch(() => {});
    return out.map(o => ({ id: o.rule.id, name: o.rule.name, msg: o.msg, t: o.event.t }));
  }
  async webhook(text) {
    const w = this.store.webhook || {};
    if (!w.enabled || !/^https?:\/\//i.test(w.url || '') || typeof fetch !== 'function') return false;
    const body = w.format === 'slack' ? { text: '[RigWatch] ' + text } : w.format === 'json' ? { source: 'rigwatch', text, t: new Date().toISOString() } : { content: '**RigWatch** · ' + text };
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 6000);
    try { const r = await fetch(w.url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ctl.signal }); return r.ok; } finally { clearTimeout(t); }
  }
}

module.exports = { Alerts, METRICS, DEFAULT_RULES };
