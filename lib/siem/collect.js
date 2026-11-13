'use strict';
// Log collectors.
//   Windows: Security / System / Defender / Firewall / RDP / OpenSSH event logs, read incrementally with
//            EventRecordID bookmarks through the control worker; the Windows Firewall drop log (pfirewall.log).
//   Linux:   journald (sshd, sudo, systemd-logind, su) with a cursor, or /var/log/auth.log | secure.
// The first run backfills the last 30 days so the history page is useful right away.
const fs = require('fs');
const path = require('path');
const U = require('../util');
const rules = require('./rules');

const BACKFILL_DAYS = 30;

function loadJson(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')) || {}; } catch { return {}; } }
function saveJson(file, obj) { try { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file + '.tmp', JSON.stringify(obj)); fs.renameSync(file + '.tmp', file); } catch { /* ignore */ } }

/** pairs of 4624 events from UAC split tokens -> one event (keeps the admin flag) */
function dedupeLogons(evs) {
  const out = [], seen = new Map();
  for (const ev of evs) {
    if ([2001, 2002, 2003, 2008].includes(ev.rule.id)) {
      const key = ev.rule.id + '|' + ev.user + '|' + (ev.ip || '');
      const prev = seen.get(key);
      if (prev && Math.abs(prev.ts - ev.ts) < 3000) {
        if (ev.data && ev.data.admin && prev.data && !prev.data.admin) { prev.data.admin = true; prev.msg += ' with admin rights'; }
        continue;
      }
      seen.set(key, ev);
    }
    out.push(ev);
  }
  return out;
}

const FW_FIELDS = 'date time action protocol src-ip dst-ip src-port dst-port size tcpflags tcpsyn tcpack tcpwin icmptype icmpcode info path pid'.split(' ');
/** pfirewall.log text -> inbound drops [{ ts, src, dst, port, proto }] */
function parseFwLog(text, fields = FW_FIELDS) {
  const out = [];
  let F = fields;
  for (const raw of String(text).split('\n')) {
    const line = raw.trim(); if (!line) continue;
    if (line[0] === '#') { if (/^#Fields:/i.test(line)) F = line.slice(8).trim().split(/\s+/); continue; }
    const p = line.split(/\s+/), g = k => p[F.indexOf(k)];
    if (g('action') !== 'DROP') continue;
    const dir = g('path'); if (dir && dir !== 'RECEIVE') continue;
    const ts = new Date(g('date') + 'T' + g('time')).getTime();
    if (!Number.isFinite(ts)) continue;
    out.push({ ts, src: g('src-ip'), dst: g('dst-ip'), port: +g('dst-port') || 0, proto: g('protocol') });
  }
  return out;
}

function createWin({ plat, dir, persist, onEvents, onDrops }) {
  const markFile = path.join(dir, 'marks.json');
  const marks = persist ? loadJson(markFile) : {};
  const state = {}; const admins = new Map(); const fwSeen = new Map();
  // installers re-add the same firewall rules over and over: one event per rule and action per 6 hours
  const fwRepeat = ev => {
    if (ev.rule.id !== 5005 && ev.rule.id !== 5006) return false;
    const k = ev.rule.id + '|' + (ev.data && ev.data.rule) + '|' + ev.process, last = fwSeen.get(k);
    if (last != null && Math.abs(ev.ts - last) < 6 * 3600e3) return true;
    fwSeen.set(k, ev.ts); if (fwSeen.size > 5000) fwSeen.clear();
    return false;
  };
  // some vendor tools re-register the same driver at every boot: report a service once per 7 days
  const svcRepeat = ev => {
    if (ev.rule.id !== 4004 || !ev.data) return false;
    const seen = marks.svc || (marks.svc = {});
    const k = String(ev.data.service || '') + '|' + String(ev.data.image || '').toLowerCase(), last = seen[k];
    if (last != null && Math.abs(ev.ts - last) < 7 * 86400e3) return true;
    seen[k] = ev.ts;
    const keys = Object.keys(seen); if (keys.length > 2000) for (const x of keys.slice(0, 500)) delete seen[x];
    return false;
  };
  const fw = { enabled: false, file: '', profiles: [], err: '', at: 0 };
  let timer = null, fwTimer = null, busy = false, stopped = false;

  async function poll() {
    if (busy || stopped) return;
    busy = true; let next = 20000;
    try {
      const r = await plat.ctl.request('siempoll', { marks: Object.fromEntries(Object.entries(marks).filter(([k, v]) => typeof v === 'number' && !k.startsWith('fw'))), backHours: BACKFILL_DAYS * 24, max: 400 }, 120000, true);
      const raw = U.arr(r.events).sort((a, b) => a.t - b.t || a.rid - b.rid);
      for (const x of raw) if (x.k === 'sec-priv' && x.p) admins.set(x.p[3], x.t);
      if (admins.size > 3000) for (const k of [...admins.keys()].slice(0, 1000)) admins.delete(k);
      const ctx = { admins: new Set(admins.keys()) };
      let evs = [];
      for (const x of raw) if (x.k !== 'sec-priv') { try { evs.push(...rules.fromWin(x, ctx)); } catch { /* malformed */ } }
      evs = dedupeLogons(evs).filter(ev => !fwRepeat(ev) && !svcRepeat(ev));
      for (const [k, st] of Object.entries(r.state || {})) {
        state[k] = { ok: !!st.ok, err: st.err || '', n: st.n || 0, at: Date.now() };
        if (st.mark != null && +st.mark >= 0) marks[k] = +st.mark;
        if (st.full) next = 2500;
      }
      state.poll = { ok: true, err: '', at: Date.now() };
      if (evs.length) onEvents(evs);
      if (persist) saveJson(markFile, marks);
    } catch (e) {
      state.poll = { ok: false, err: e.message, at: Date.now() };
      next = 60000;
    } finally {
      busy = false;
      if (!stopped) { timer = setTimeout(poll, next); timer.unref(); }
    }
  }

  async function fwRefresh(mode = 'status') {
    const list = U.arr(await plat.ctl.request('fwlog', { mode }, 30000, mode === 'status'));
    fw.profiles = list.map(p => ({ name: p.name, on: String(p.blocked) === 'True' || String(p.blocked) === '1', file: p.file }));
    const on = fw.profiles.find(p => p.on);
    fw.enabled = !!on; fw.file = on ? on.file : (fw.profiles[0] || {}).file || '';
    fw.err = ''; fw.at = Date.now();
    return fw;
  }
  async function fwPoll() {
    if (!fw.enabled || !fw.file || !plat.isAdmin()) return;
    let st; try { st = fs.statSync(fw.file); } catch (e) { fw.err = e.code === 'ENOENT' ? 'log file not created yet (no drops so far)' : e.message; return; }
    let off = marks.fwOffset || 0;
    if (marks.fwFile !== fw.file || st.size < off) off = Math.max(0, st.size - (1 << 20));
    if (st.size <= off) return;
    const len = Math.min(st.size - off, 4 << 20);
    const buf = Buffer.alloc(len);
    let fd; try { fd = fs.openSync(fw.file, 'r'); fs.readSync(fd, buf, 0, len, off); } catch (e) { fw.err = e.message; return; } finally { if (fd != null) fs.closeSync(fd); }
    const text = buf.toString('latin1');
    const cut = text.lastIndexOf('\n');
    if (cut < 0) return;
    marks.fwOffset = off + cut + 1; marks.fwFile = fw.file;
    const drops = parseFwLog(text.slice(0, cut));
    fw.err = '';
    if (drops.length) onDrops(drops);
  }

  return {
    start() {
      setTimeout(poll, 8000).unref();
      setTimeout(() => fwRefresh().catch(e => { fw.err = e.message; }), 15000).unref();
      fwTimer = setInterval(() => { fwPoll(); if (Date.now() - fw.at > 600e3) fwRefresh().catch(() => {}); }, 15000); fwTimer.unref();
    },
    stop() { stopped = true; clearTimeout(timer); clearInterval(fwTimer); if (persist) saveJson(markFile, marks); },
    pollNow() { clearTimeout(timer); return poll(); },
    status() { return { kind: 'windows', logs: state, firewallLog: fw, admin: plat.isAdmin() }; },
    async setFwLog(on) { await fwRefresh(on ? 'on' : 'off'); if (on) { marks.fwOffset = 0; marks.fwFile = ''; } return fw; },
  };
}

function createLinux({ dir, persist, onEvents }) {
  const markFile = path.join(dir, 'marks.json');
  const marks = persist ? loadJson(markFile) : {};
  const state = { source: '', ok: false, err: '', n: 0, at: 0, root: typeof process.getuid === 'function' && process.getuid() === 0 };
  let timer = null, stopped = false;
  const journal = U.which('journalctl', ['/usr/bin', '/bin']);
  const authFile = ['/var/log/auth.log', '/var/log/secure'].find(f => { try { fs.accessSync(f, fs.constants.R_OK); return true; } catch { return false; } });

  async function pollJournal() {
    const args = ['-o', 'json', '--no-pager', '-q', '-n', '5000', '_COMM=sshd', '_COMM=sshd-session', '_COMM=sudo', '_COMM=systemd-logind', '_COMM=su'];
    if (marks.cursor) args.push('--after-cursor=' + marks.cursor); else args.push('--since=-' + BACKFILL_DAYS + 'd');
    const r = await U.run(journal, args, { timeout: 60000, maxBuffer: 128 << 20 });
    if (!r.ok && !r.stdout) throw new Error(U.trunc(r.stderr, 200) || 'journalctl failed');
    const evs = [];
    for (const line of r.stdout.split('\n')) {
      if (!line) continue;
      let j; try { j = JSON.parse(line); } catch { continue; }
      if (j.__CURSOR) marks.cursor = j.__CURSOR;
      if (typeof j.MESSAGE !== 'string') continue;
      const ts = Math.floor(+j.__REALTIME_TIMESTAMP / 1000) || Date.now();
      const ident = j.SYSLOG_IDENTIFIER || j._COMM || '';
      evs.push(...rules.fromAuthLine(/^sshd/.test(ident) ? 'sshd' : ident, j.MESSAGE, ts, 'journal/' + ident));
    }
    state.source = 'journald'; state.n = evs.length;
    return evs;
  }
  async function pollFile() {
    let st; try { st = fs.statSync(authFile); } catch (e) { throw new Error(e.message); }
    let off = marks.authOffset || 0;
    if (marks.authFile !== authFile || st.size < off) off = Math.max(0, st.size - (8 << 20));
    if (st.size <= off) return [];
    const len = Math.min(st.size - off, 16 << 20), buf = Buffer.alloc(len);
    const fd = fs.openSync(authFile, 'r'); try { fs.readSync(fd, buf, 0, len, off); } finally { fs.closeSync(fd); }
    const text = buf.toString('utf8'), cut = text.lastIndexOf('\n');
    if (cut < 0) return [];
    marks.authOffset = off + cut + 1; marks.authFile = authFile;
    const evs = [];
    for (const line of text.slice(0, cut).split('\n')) {
      const s = rules.parseSyslog(line); if (!s) continue;
      evs.push(...rules.fromAuthLine(/^sshd/.test(s.ident) ? 'sshd' : s.ident, s.msg, s.ts, authFile + '/' + s.ident));
    }
    state.source = authFile; state.n = evs.length;
    return evs;
  }
  async function poll() {
    if (stopped) return;
    try {
      const evs = journal ? await pollJournal().catch(e => { if (authFile) return pollFile(); throw e; }) : authFile ? await pollFile() : null;
      if (evs === null) { state.ok = false; state.err = 'no journald and no readable /var/log/auth.log'; }
      else { state.ok = true; state.err = state.root ? '' : 'not running as root: sshd and sudo entries of other users may be hidden'; if (evs.length) onEvents(evs); }
      if (persist) saveJson(markFile, marks);
    } catch (e) { state.ok = false; state.err = e.message; }
    state.at = Date.now();
    if (!stopped) { timer = setTimeout(poll, 20000); timer.unref(); }
  }
  return {
    start() { setTimeout(poll, 8000).unref(); },
    stop() { stopped = true; clearTimeout(timer); if (persist) saveJson(markFile, marks); },
    pollNow() { clearTimeout(timer); return poll(); },
    status() { return { kind: 'linux', auth: state }; },
    async setFwLog() { throw new Error('Firewall drop logging is a Windows feature.'); },
  };
}

function create(opts) {
  if (U.IS_WIN) return createWin(opts);
  if (process.platform === 'linux') return createLinux(opts);
  return { start() {}, stop() {}, pollNow() { return Promise.resolve(); }, status() { return { kind: process.platform, note: 'Log collection is available on Windows and Linux. Network, port, program and RigWatch events are still recorded.' }; }, async setFwLog() { throw new Error('Firewall drop logging is a Windows feature.'); } };
}

module.exports = { create, parseFwLog, dedupeLogons, BACKFILL_DAYS };
