'use strict';
// Guarded control actions. Every action is validated, checked against protected processes,
// and written to the timeline as an audit entry.
const fs = require('fs');
const crypto = require('crypto');
const U = require('./util');
const { PROTECTED } = require('./classify');

function create(engine) {
  const { plat, timeline } = engine;
  const protectedNames = PROTECTED[process.platform] || new Set();

  function procs() { return engine.lastProcs(); }
  function findProc(pid) {
    pid = U.int(pid, -1);
    if (pid <= 0) throw new Error('pid required');
    const p = procs().find(x => x.pid === pid);
    if (!p) throw new Error('No such process (it may have exited).');
    return p;
  }
  function ancestors(pid) {
    const by = new Map(procs().map(p => [p.pid, p]));
    const out = new Set(); let cur = by.get(pid);
    for (let i = 0; cur && i < 64 && !out.has(cur.pid); i++) { out.add(cur.pid); cur = by.get(cur.ppid); }
    return out;
  }
  function guard(p, what) {
    if (p.pid <= (U.IS_WIN ? 4 : 1)) throw new Error('Refusing to ' + what + ' a core OS process.');
    if (p.kind === 'rigwatch' || ancestors(process.pid).has(p.pid) || plat.selfPids().includes(p.pid)) throw new Error('Refusing: that would hit RigWatch itself or the terminal running it.');
    if (protectedNames.has(p.name.toLowerCase())) throw new Error(p.name + ' is a protected system process.');
  }
  function descendants(pid) {
    const kids = new Map();
    for (const p of procs()) { if (!kids.has(p.ppid)) kids.set(p.ppid, []); kids.get(p.ppid).push(p.pid); }
    const out = []; const walk = id => { for (const k of kids.get(id) || []) { if (out.includes(k) || k === id) continue; walk(k); out.push(k); } };
    walk(pid);
    return out; // deepest first
  }
  function need(fn, label) { if (typeof plat[fn] !== 'function') throw new Error(label + ' is not supported on ' + plat.label); }

  async function hashFile(file) {
    return new Promise((resolve, reject) => {
      const h = crypto.createHash('sha256'); let size = 0;
      fs.createReadStream(file).on('data', d => { size += d.length; h.update(d); }).on('error', reject).on('end', () => resolve({ sha256: h.digest('hex'), size }));
    });
  }

  async function killOne(p, o) {
    guard(p, 'kill');
    if (o.tree && !U.IS_WIN) {
      for (const k of descendants(p.pid)) { try { await plat.kill(k, { force: o.force }); } catch { /* already gone */ } }
    }
    return plat.kill(p.pid, { tree: o.tree, force: o.force !== false });
  }

  async function run(a, who) {
    const type = String(a.type || '');
    let msg = '', target = '';
    switch (type) {
      case 'proc.kill': { const p = findProc(a.pid); target = p.name + ' (' + p.pid + ')'; msg = await killOne(p, { tree: !!a.tree, force: a.force !== false }); break; }
      case 'proc.suspend': case 'proc.resume': {
        const p = findProc(a.pid); guard(p, type === 'proc.suspend' ? 'suspend' : 'resume'); need(type.slice(5), 'Suspend/resume');
        target = p.name + ' (' + p.pid + ')';
        msg = await (type === 'proc.suspend' ? plat.suspend(p.pid) : plat.resume(p.pid));
        break;
      }
      case 'proc.priority': {
        const p = findProc(a.pid); guard(p, 'change priority of'); need('priority', 'Priority');
        if (!['idle', 'below', 'normal', 'above', 'high'].includes(a.level)) throw new Error('level must be idle|below|normal|above|high');
        target = p.name + ' (' + p.pid + ') → ' + a.level; msg = await plat.priority(p.pid, a.level); break;
      }
      case 'proc.affinity': {
        const p = findProc(a.pid); guard(p, 'change affinity of'); need('affinity', 'CPU affinity');
        const n = require('os').cpus().length;
        const cores = U.arr(a.cores).map(Number).filter(c => Number.isInteger(c) && c >= 0 && c < n);
        if (!cores.length) throw new Error('pick at least one core');
        const mask = cores.reduce((m, c) => m | (1n << BigInt(c)), 0n);
        target = p.name + ' (' + p.pid + ') → cores ' + cores.join(','); msg = await plat.affinity(p.pid, mask.toString()); break;
      }
      case 'proc.reveal': { const p = findProc(a.pid); if (!p.exe) throw new Error('executable path unknown'); need('reveal', 'Open location'); target = p.exe; msg = await plat.reveal(p.exe); break; }
      case 'proc.hash': {
        const p = findProc(a.pid); if (!p.exe) throw new Error('executable path unknown (try running elevated)');
        const r = await hashFile(p.exe.replace(/ \(deleted\)$/, ''));
        return { ok: true, msg: 'sha256 ' + r.sha256, data: Object.assign(r, { path: p.exe, virustotal: 'https://www.virustotal.com/gui/file/' + r.sha256 }) };
      }
      case 'proc.info': { const p = findProc(a.pid); need('procInfo', 'Process info'); return { ok: true, data: await plat.procInfo(p.pid) }; }
      case 'port.kill': {
        const port = U.int(a.port, 0); if (port < 1 || port > 65535) throw new Error('bad port');
        const owners = [...new Set(plat.sockets().listen.filter(l => l.port === port && (!a.proto || l.proto === a.proto)).map(l => l.pid))];
        if (!owners.length) throw new Error('Nothing is listening on port ' + port + '.');
        const done = [];
        for (const pid of owners) { const p = findProc(pid); await killOne(p, { tree: true, force: true }); done.push(p.name + ' (' + pid + ')'); }
        target = 'port ' + port; msg = 'ended ' + done.join(', '); break;
      }
      case 'service': {
        need('serviceAction', 'Service control');
        if (!['start', 'stop', 'restart'].includes(a.action)) throw new Error('bad action');
        const name = String(a.name || ''); if (!/^[\w@.:\- ]{1,200}$/.test(name)) throw new Error('bad service name');
        target = name + ' → ' + a.action; msg = String(await plat.serviceAction(name, a.action)); break;
      }
      case 'docker': { target = a.id + ' → ' + a.action; msg = await engine.docker.action(String(a.id || ''), String(a.action || '')); break; }
      case 'wsl': { need('wslAction', 'WSL control'); target = (a.name || 'all') + ' → ' + a.action; msg = await plat.wslAction(String(a.name || ''), String(a.action || '')); break; }
      default: throw new Error('unknown action ' + type);
    }
    timeline.add('action', 'info', type + ' ' + target, { detail: U.trunc(msg, 300), who });
    return { ok: true, msg: msg || 'done' };
  }

  return { run };
}

module.exports = { create };
