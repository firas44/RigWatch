'use strict';
// Blocking addresses: Windows Firewall rules in the "RigWatch IP" group (inbound + outbound),
// iptables/ip6tables rules tagged "rigwatch" on Linux. The list lives in ~/.rigwatch/siem/blocks.json
// with optional expiry. Never blocks this machine, loopback, the gateway, DNS servers or trusted IPs.
const fs = require('fs');
const os = require('os');
const net = require('net');
const path = require('path');
const U = require('../util');
const { ip4 } = require('./ips');

function writeAtomic(file, text) {
  try { fs.mkdirSync(path.dirname(file), { recursive: true }); const tmp = file + '.tmp'; fs.writeFileSync(tmp, text); fs.renameSync(tmp, file); return true; } catch { return false; }
}

/** "1.2.3.4", "1.2.3.0/24", "2001:db8::1", "2001:db8::/48" -> normalized string, or throws */
function normalizeTarget(s) {
  s = String(s || '').trim().replace(/^::ffff:/i, '');
  const m = s.match(/^([0-9a-fA-F:.]+)(?:\/(\d{1,3}))?$/);
  if (!m) throw new Error('Enter an IP address or a CIDR range such as 203.0.113.0/24.');
  const fam = net.isIP(m[1]);
  if (!fam) throw new Error('Not a valid IP address: ' + m[1]);
  let ip = m[1];
  if (fam === 6) ip = ip.toLowerCase();
  if (m[2] != null) {
    const bits = +m[2], max = fam === 4 ? 32 : 128, min = fam === 4 ? 8 : 32;
    if (bits > max) throw new Error('Prefix too long');
    if (bits < min) throw new Error('Refusing to block a range that large (/' + bits + ').');
    if (fam === 4 && bits < 32) { const n = ip4(ip), size = 2 ** (32 - bits), base = Math.floor(n / size) * size; ip = [base >>> 24 & 255, base >>> 16 & 255, base >>> 8 & 255, base & 255].join('.'); }
    if (bits !== max) return ip + '/' + bits;
  }
  const k = U.ipKind(ip);
  if (k === 'loopback' || k === 'any') throw new Error('Refusing to block ' + ip + ' (this machine).');
  return ip;
}
function contains(target, ip) {
  if (!target.includes('/')) return target === ip;
  const [base, bits] = target.split('/');
  const a = ip4(base), b = ip4(ip);
  if (a == null || b == null) return false;
  const size = 2 ** (32 - +bits);
  return Math.floor(a / size) === Math.floor(b / size);
}

class Blocks {
  constructor(file, persist, plat, getProtected) {
    this.file = file; this.persist = persist; this.plat = plat; this.getProtected = getProtected || (() => []);
    this.list = []; this.err = ''; this.external = [];
    if (persist) { try { const l = JSON.parse(fs.readFileSync(file, 'utf8')); if (Array.isArray(l)) this.list = l.filter(b => b && b.ip); } catch { /* none */ } }
  }
  supported() { return U.IS_WIN || process.platform === 'linux'; }
  save() { if (this.persist) writeAtomic(this.file, JSON.stringify(this.list, null, 1)); }
  isBlocked(ip) { return this.list.some(b => contains(b.ip, ip)); }
  /** reason string if this address must never be blocked, else '' */
  protectedReason(target) {
    const ip = target.split('/')[0];
    for (const list of Object.values(os.networkInterfaces())) for (const a of list || []) if (a.address === ip || (target.includes('/') && contains(target, a.address))) return 'that is this machine';
    for (const p of this.getProtected()) if (p.ip && (p.ip === ip || (target.includes('/') && contains(target, p.ip)))) return p.why;
    return '';
  }
  async apply(target, on, note) {
    if (U.IS_WIN) {
      if (!this.plat.isAdmin()) throw new Error('Blocking needs admin: use "Restart as admin" first.');
      return this.plat.ctl.request('ipblock', { ip: target, on, note: String(note || '').slice(0, 200) }, 30000);
    }
    if (process.platform === 'linux') {
      if (typeof process.getuid === 'function' && process.getuid() !== 0) throw new Error('Blocking needs root: run RigWatch with sudo.');
      const v6 = target.includes(':');
      const bin = U.which(v6 ? 'ip6tables' : 'iptables', ['/usr/sbin', '/sbin']);
      if (!bin) throw new Error((v6 ? 'ip6tables' : 'iptables') + ' not found');
      const specs = [['INPUT', '-s'], ['OUTPUT', '-d']];
      for (const [chain, dir] of specs) {
        const rule = [chain, dir, target, '-j', 'DROP', '-m', 'comment', '--comment', 'rigwatch'];
        const exists = (await U.run(bin, ['-C', ...rule])).ok;
        if (on && !exists) { const r = await U.run(bin, ['-I', ...rule]); if (!r.ok) throw new Error(U.trunc(r.stderr, 200)); }
        if (!on && exists) { const r = await U.run(bin, ['-D', ...rule]); if (!r.ok) throw new Error(U.trunc(r.stderr, 200)); }
      }
      return on ? 'blocked' : 'unblocked';
    }
    throw new Error('Blocking addresses is supported on Windows and Linux.');
  }
  async block(input, { minutes = 0, reason = '', by = 'manual', ruleId = null } = {}) {
    const ip = normalizeTarget(input);
    const why = this.protectedReason(ip);
    if (why) throw new Error('Refusing to block ' + ip + ': ' + why + '.');
    await this.apply(ip, true, 'ip=' + ip + '; ' + reason);
    const now = Date.now();
    this.list = this.list.filter(b => b.ip !== ip);
    this.list.push({ ip, reason: U.trunc(reason, 200), by, at: now, until: minutes > 0 ? now + minutes * 60e3 : null, ruleId });
    this.save();
    return { ip, until: minutes > 0 ? now + minutes * 60e3 : null };
  }
  async unblock(input) {
    const ip = normalizeTarget(input);
    await this.apply(ip, false);
    const had = this.list.length;
    this.list = this.list.filter(b => b.ip !== ip);
    this.external = this.external.filter(b => b.ip !== ip);
    if (this.list.length !== had) this.save();
    return ip;
  }
  /** unblock expired entries; returns the list of addresses released */
  async expire() {
    const now = Date.now(), done = [];
    for (const b of this.list.filter(x => x.until && x.until <= now)) {
      try { await this.apply(b.ip, false); done.push(b.ip); } catch (e) { this.err = e.message; if (/needs (admin|root)/.test(e.message)) break; }
    }
    if (done.length) { this.list = this.list.filter(b => !done.includes(b.ip)); this.save(); }
    return done;
  }
  /** rules present in the firewall but not in our list (e.g. after deleting ~/.rigwatch) */
  async sync() {
    try {
      if (U.IS_WIN && this.plat.isAdmin()) {
        const rules = U.arr(await this.plat.ctl.request('iplist', {}, 60000, true));
        const seen = new Map();
        for (const r of rules) { const m = String(r.desc || '').match(/ip=([^;\s]+)/); const ip = m ? m[1] : String(r.ip || '').split(',')[0]; if (ip && !seen.has(ip)) seen.set(ip, r); }
        this.external = [...seen.keys()].filter(ip => !this.list.some(b => b.ip === ip)).map(ip => ({ ip, reason: 'found in Windows Firewall (group "RigWatch IP")', by: 'firewall', at: null, until: null }));
        this.missing = this.list.filter(b => !seen.has(b.ip)).map(b => b.ip);
      } else if (process.platform === 'linux' && typeof process.getuid === 'function' && process.getuid() === 0) {
        const found = new Set();
        for (const bin of ['iptables', 'ip6tables']) {
          const exe = U.which(bin, ['/usr/sbin', '/sbin']); if (!exe) continue;
          const r = await U.run(exe, ['-S', 'INPUT']);
          for (const line of r.stdout.split('\n')) { const m = line.match(/-s (\S+?)(?:\/(?:32|128))? .*rigwatch/); if (m) found.add(m[1]); }
        }
        this.external = [...found].filter(ip => !this.list.some(b => b.ip === ip)).map(ip => ({ ip, reason: 'found in iptables (comment rigwatch)', by: 'firewall', at: null, until: null }));
      }
      this.err = '';
    } catch (e) { this.err = e.message; }
  }
  all() { return this.list.concat(this.external); }
}

module.exports = { Blocks, normalizeTarget, contains };
