'use strict';
// Event timeline: processes starting/exiting, ports opening/closing, first contact with a remote
// host, alerts, security findings, user actions (audit log). Persisted to ~/.rigwatch/timeline.ndjson.
const fs = require('fs');
const path = require('path');
const U = require('./util');

class Timeline {
  constructor(dir, persist) {
    this.dir = dir; this.persist = persist;
    this.file = path.join(dir, 'timeline.ndjson');
    this.events = []; this.max = 5000; this.seq = 0; this.pending = []; this.toWrite = [];
    this.procs = null; this.ports = null; this.hosts = new Set();
    this.load();
    this.timer = setInterval(() => this.flush(), 5000); this.timer.unref();
  }
  load() {
    if (!this.persist) return;
    const text = U.readText(this.file);
    if (!text) return;
    const lines = text.split('\n').filter(Boolean).slice(-this.max);
    for (const l of lines) { try { const e = JSON.parse(l); this.events.push(e); this.seq = Math.max(this.seq, e.id || 0); } catch { /* skip */ } }
  }
  add(type, sev, title, data = {}) {
    const e = Object.assign({ id: ++this.seq, t: Date.now(), type, sev, title }, data);
    this.events.push(e);
    if (this.events.length > this.max) this.events.splice(0, this.events.length - this.max);
    this.pending.push(e); this.toWrite.push(e);
    if (this.onAdd) this.onAdd(e);
    return e;
  }
  drain() { const p = this.pending; this.pending = []; return p; }
  flush() {
    if (!this.persist || !this.toWrite.length) { this.toWrite = []; return; }
    try {
      fs.mkdirSync(this.dir, { recursive: true });
      try { if (fs.statSync(this.file).size > 10 << 20) fs.renameSync(this.file, this.file + '.1'); } catch { /* new file */ }
      fs.appendFileSync(this.file, this.toWrite.map(e => JSON.stringify(e)).join('\n') + '\n');
    } catch { /* ignore */ }
    this.toWrite = [];
  }
  query({ since = 0, types = null, q = '', limit = 500, sev = null } = {}) {
    const needle = String(q || '').toLowerCase();
    const out = [];
    for (let i = this.events.length - 1; i >= 0 && out.length < limit; i--) {
      const e = this.events[i];
      if (e.id <= since) break;
      if (types && !types.includes(e.type.split('.')[0]) && !types.includes(e.type)) continue;
      if (sev && e.sev !== sev) continue;
      if (needle && !(e.title + ' ' + (e.detail || '') + ' ' + (e.name || '')).toLowerCase().includes(needle)) continue;
      out.push(e);
    }
    return out;
  }

  /** Diff processes / listening ports / remote hosts against the previous observation. */
  observe(procs, sock, settings) {
    const byPid = new Map(procs.map(p => [p.pid, p]));
    if (this.procs && settings.procEvents) {
      for (const p of procs) {
        if (this.procs.has(p.pid) || p.kind === 'rigwatch') continue;
        const parent = byPid.get(p.ppid) || this.procs.get(p.ppid);
        this.add('proc.start', p.flags && p.flags.length ? 'warn' : 'info', (p.label || p.name) + ' started', { pid: p.pid, name: p.name, detail: U.trunc(p.cmd || p.exe || '', 220), parent: parent ? parent.name : '', kind: p.kind, flags: p.flags || undefined });
      }
      for (const [pid, p] of this.procs) if (!byPid.has(pid) && p.kind !== 'rigwatch') this.add('proc.exit', 'info', (p.label || p.name) + ' exited', { pid, name: p.name, detail: 'ran ' + Math.round(p.age || 0) + ' s', kind: p.kind });
    }
    this.procs = new Map(procs.map(p => [p.pid, { name: p.name, label: p.label, age: p.age, kind: p.kind }]));
    if (!sock || !sock.at) return;
    const keys = new Map(sock.listen.map(l => [l.proto + ':' + l.port + ':' + l.pid, l]));
    if (this.ports) {
      for (const [k, l] of keys) if (!this.ports.has(k)) { const p = byPid.get(l.pid); this.add('port.open', l.scope === 'all' ? 'warn' : 'info', l.proto + ' ' + l.port + ' opened by ' + (p ? (p.label || p.name) : 'pid ' + l.pid), { pid: l.pid, name: p ? p.name : '', port: l.port, proto: l.proto, detail: 'bound to ' + l.addrs.join(', ') + (l.scope === 'all' ? ' (all interfaces: reachable from the network)' : '') }); }
      for (const [k, l] of this.ports) if (!keys.has(k)) this.add('port.close', 'info', l.proto + ' ' + l.port + ' closed', { pid: l.pid, port: l.port, proto: l.proto, name: l.name || '' });
    }
    this.ports = new Map([...keys].map(([k, l]) => { const p = byPid.get(l.pid); return [k, Object.assign({ name: p ? p.name : '' }, l)]; }));
    // first contact with a remote host, per app
    const fresh = new Map();
    for (const c of sock.conns) {
      const kind = U.ipKind(c.rh);
      if (kind === 'loopback' || kind === 'any' || kind === 'multicast') continue;
      const p = byPid.get(c.pid); const name = p ? p.name : (sock.names.get(c.pid) || 'pid ' + c.pid);
      const key = name.toLowerCase() + '|' + c.rh;
      if (this.hosts.has(key)) continue;
      this.hosts.add(key);
      if (!this.hostsSeeded || !settings.hostEvents) continue;
      if (!fresh.has(name)) fresh.set(name, []);
      fresh.get(name).push({ ip: c.rh, port: c.rp, pid: c.pid, kind });
    }
    for (const [name, list] of fresh) {
      if (list.length > 5) this.add('net.newhost', 'info', name + ' contacted ' + list.length + ' new hosts', { name, pid: list[0].pid, detail: list.slice(0, 12).map(h => h.ip + ':' + h.port).join(', ') + (list.length > 12 ? ' …' : '') });
      else for (const h of list) this.add('net.newhost', 'info', name + ' → ' + h.ip + ':' + h.port, { name, pid: h.pid, ip: h.ip, port: h.port, detail: h.kind + ' address' });
    }
    this.hostsSeeded = true;
    if (this.hosts.size > 50000) this.hosts.clear();
  }
}

module.exports = { Timeline };
