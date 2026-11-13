'use strict';
// File integrity monitoring (like Wazuh syscheck), kept small on purpose: a handful of high-value
// locations (hosts file, startup folders, scheduled tasks, SSH keys, /etc on Linux, LaunchAgents on macOS)
// plus Windows autostart registry keys. Baseline in ~/.rigwatch/siem/fim.json; changes become events.
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const U = require('../util');

const MAX_FILES = 20000, MAX_HASH = 64 << 20;

function defaults() {
  const home = os.homedir();
  if (U.IS_WIN) {
    const win = process.env.SystemRoot || 'C:\\Windows', pd = process.env.ProgramData || 'C:\\ProgramData', ad = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    return [
      { path: path.join(win, 'System32', 'drivers', 'etc'), tag: 'hosts file', level: 8, depth: 0 },
      { path: path.join(pd, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'StartUp'), tag: 'startup folder (all users)', level: 9, depth: 1 },
      { path: path.join(ad, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup'), tag: 'startup folder', level: 9, depth: 1 },
      { path: path.join(win, 'System32', 'Tasks'), tag: 'scheduled tasks', level: 7, depth: 4 },
      { path: path.join(home, '.ssh'), tag: 'SSH keys', level: 8, depth: 1 },
    ];
  }
  const list = [
    { path: '/etc/hosts', tag: 'hosts file', level: 7 },
    { path: path.join(home, '.ssh'), tag: 'SSH keys', level: 8, depth: 1 },
  ];
  if (process.platform === 'darwin') {
    list.push({ path: '/etc/sudoers', tag: 'sudoers', level: 9 }, { path: '/Library/LaunchAgents', tag: 'launch agents', level: 8, depth: 1 }, { path: '/Library/LaunchDaemons', tag: 'launch daemons', level: 9, depth: 1 }, { path: path.join(home, 'Library', 'LaunchAgents'), tag: 'launch agents', level: 8, depth: 1 });
  } else {
    list.push(
      { path: '/etc/passwd', tag: 'accounts', level: 8 }, { path: '/etc/shadow', tag: 'accounts', level: 9 }, { path: '/etc/group', tag: 'accounts', level: 7 },
      { path: '/etc/sudoers', tag: 'sudoers', level: 9 }, { path: '/etc/sudoers.d', tag: 'sudoers', level: 9, depth: 1 },
      { path: '/etc/ssh/sshd_config', tag: 'sshd config', level: 8 }, { path: '/etc/ld.so.preload', tag: 'library preload', level: 12 },
      { path: '/etc/crontab', tag: 'cron', level: 7 }, { path: '/etc/cron.d', tag: 'cron', level: 7, depth: 1 },
      { path: '/etc/systemd/system', tag: 'systemd units', level: 7, depth: 2 },
    );
    if (typeof process.getuid === 'function' && process.getuid() === 0) list.push({ path: '/root/.ssh', tag: 'SSH keys (root)', level: 9, depth: 1 });
  }
  return list;
}

function sha256(file) {
  return new Promise(resolve => {
    const h = crypto.createHash('sha256');
    fs.createReadStream(file).on('data', d => h.update(d)).on('error', () => resolve(null)).on('end', () => resolve(h.digest('hex')));
  });
}

class Fim {
  constructor(file, persist, plat, onChange) {
    this.file = file; this.persist = persist; this.plat = plat; this.onChange = onChange || (() => {});
    this.base = { files: {}, reg: {}, at: 0, regAt: 0 }; this.status = {}; this.busy = false; this.watchers = []; this.custom = [];
    if (persist) { try { const b = JSON.parse(fs.readFileSync(file, 'utf8')); if (b && b.files) this.base = Object.assign(this.base, b); } catch { /* first run */ } }
  }
  entries() { return defaults().concat(this.custom.map(p => ({ path: p, tag: 'custom', level: 6, depth: 3, custom: true }))); }
  setCustom(list) { this.custom = U.arr(list).map(String).filter(p => p && path.isAbsolute(p)).slice(0, 20); }

  async walk(entry, out) {
    let st; try { st = fs.lstatSync(entry.path); } catch (e) { this.status[entry.path] = { tag: entry.tag, ok: false, err: e.code === 'ENOENT' ? 'not present' : e.code === 'EPERM' || e.code === 'EACCES' ? 'needs admin' : e.code, files: 0 }; return; }
    let n = 0;
    const visit = (p, s, depth) => {
      if (out.size >= MAX_FILES) return;
      if (s.isFile()) { out.set(p, { s, entry }); n++; return; }
      if (!s.isDirectory() || depth < 0) return;
      let names = []; try { names = fs.readdirSync(p); } catch { return; }
      for (const nm of names) { let cs; const cp = path.join(p, nm); try { cs = fs.lstatSync(cp); } catch { continue; } visit(cp, cs, depth - 1); }
    };
    visit(entry.path, st, entry.depth != null ? entry.depth : 0);
    this.status[entry.path] = { tag: entry.tag, ok: true, err: '', files: n };
  }

  async scan() {
    if (this.busy) return; this.busy = true;
    try {
      const seen = new Map();
      for (const e of this.entries()) await this.walk(e, seen);
      const first = !this.base.at, old = this.base.files, next = {}, changes = [];
      for (const [p, { s, entry }] of seen) {
        const prev = old[p];
        let hash = prev ? prev[2] : null;
        if (!prev || prev[0] !== s.size || prev[1] !== Math.round(s.mtimeMs)) hash = s.size <= MAX_HASH ? await sha256(p) : null;
        next[p] = [s.size, Math.round(s.mtimeMs), hash, entry.level, entry.tag];
        if (first) continue;
        if (!prev) changes.push({ type: 'added', path: p, entry, size: s.size, hash });
        else if (prev[2] !== hash || (hash == null && (prev[0] !== s.size || prev[1] !== Math.round(s.mtimeMs)))) changes.push({ type: 'modified', path: p, entry, size: s.size, hash, before: { size: prev[0], hash: prev[2], mtime: prev[1] } });
      }
      for (const [p, v] of Object.entries(old)) {
        if (next[p]) continue;
        const owner = this.entries().find(e => p === e.path || p.startsWith(e.path + path.sep));
        if (!owner) continue;
        // a location we cannot read right now (e.g. "needs admin" after a restart) keeps its baseline
        if ((this.status[owner.path] || {}).err && (this.status[owner.path] || {}).err !== 'not present') { next[p] = v; continue; }
        if (!first) changes.push({ type: 'deleted', path: p, entry: { level: v[3] || 5, tag: v[4] || '' }, before: { size: v[0], hash: v[2] } });
      }
      // a location that was unreadable before (no admin) and readable now is a fresh baseline, not N "added" files
      const wasOk = this.base.ok || {}, nowOk = {};
      for (const e of this.entries()) { const st = this.status[e.path] || {}; if (st.ok || st.err === 'not present') nowOk[e.path] = true; }
      for (const c of changes) if (c.type === 'added' && !wasOk[c.entry.path]) c.silent = true;
      this.base.ok = nowOk;
      this.base.files = next; this.base.at = Date.now();
      if (U.IS_WIN) await this.scanRegistry().catch(e => { this.status.registry = { tag: 'autostart registry keys', ok: false, err: e.message, files: 0 }; });
      for (const c of changes.filter(x => !x.silent).slice(0, 200)) this.onChange(c);
      this.save();
    } finally { this.busy = false; }
  }
  async scanRegistry() {
    const list = U.arr(await this.plat.ctl.request('runkeys', {}, 60000, true));
    const cur = {};
    for (const x of list) cur[x.key + '|' + x.name] = String(x.value || '');
    const first = !this.base.regAt;
    if (!first) {
      for (const [k, v] of Object.entries(cur)) { const [key, name] = k.split('|'); if (!(k in this.base.reg)) this.onChange({ type: 'reg-added', key, name, value: v }); else if (this.base.reg[k] !== v) this.onChange({ type: 'reg-modified', key, name, value: v, before: this.base.reg[k] }); }
      for (const [k, v] of Object.entries(this.base.reg)) if (!(k in cur)) { const [key, name] = k.split('|'); this.onChange({ type: 'reg-deleted', key, name, before: v }); }
    }
    this.base.reg = cur; this.base.regAt = Date.now();
    this.status.registry = { tag: 'autostart registry keys', ok: true, err: '', files: Object.keys(cur).length };
  }
  save() { if (!this.persist) return; try { fs.mkdirSync(path.dirname(this.file), { recursive: true }); fs.writeFileSync(this.file + '.tmp', JSON.stringify(this.base)); fs.renameSync(this.file + '.tmp', this.file); } catch { /* ignore */ } }
  watch() {
    for (const w of this.watchers) { try { w.close(); } catch { /* closed */ } }
    this.watchers = [];
    let t = null;
    const kick = () => { clearTimeout(t); t = setTimeout(() => this.scan().catch(() => {}), 4000); t.unref(); };
    for (const e of this.entries()) {
      try { const w = fs.watch(e.path, { persistent: false, recursive: !!e.depth && process.platform !== 'linux' }, kick); w.on('error', () => {}); this.watchers.push(w); } catch { /* missing or no access: the periodic scan covers it */ }
    }
  }
  view() {
    const files = Object.entries(this.base.files);
    return {
      at: this.base.at, regAt: this.base.regAt, busy: this.busy, files: files.length, registry: Object.keys(this.base.reg).length,
      locations: this.entries().map(e => Object.assign({ path: e.path, tag: e.tag, level: e.level, custom: !!e.custom }, this.status[e.path] || { ok: null, files: 0, err: 'not scanned yet' })),
      registryStatus: this.status.registry || null,
      autostart: Object.entries(this.base.reg).map(([k, v]) => { const [key, name] = k.split('|'); return { key, name, value: v }; }).slice(0, 300),
    };
  }
}

module.exports = { Fim, defaults };
