'use strict';
// Who is signed in right now: Windows sessions (WTS), logon sessions, SMB clients and local accounts;
// `who -u` on Linux and macOS. Plus sign-out / disconnect actions.
const U = require('../util');

/** `who -u` output -> sessions */
function parseWho(text) {
  const out = [];
  for (const line of String(text).split('\n')) {
    const m = line.match(/^(\S+)\s+(\S+)\s+(\d{4}-\d\d-\d\d \d\d:\d\d|\w{3}\s+\d+\s+\d\d:\d\d)\s+(\S+)\s+(\d+)(?:\s+\((.*)\))?/);
    if (!m) continue;
    let start = Date.parse(m[3].replace(' ', 'T'));
    if (!Number.isFinite(start)) { const d = new Date(m[3] + ' ' + new Date().getFullYear()); start = isNaN(d) ? null : d.getTime(); }
    const from = (m[6] || '').trim();
    out.push({ user: m[1], station: m[2], logon: start, idle: m[4], pid: +m[5], addr: require('net').isIP(from) ? from : '', client: from, state: 'active' });
  }
  return out;
}

function create(plat) {
  async function list() {
    if (U.IS_WIN) {
      const r = await plat.ctl.request('sessions', {}, 60000);
      const wts = U.arr(r.wts).filter(s => s.user || s.state === 'active').map(s => ({
        id: s.id, user: s.user ? (s.domain ? s.domain + '\\' + s.user : s.user) : '', station: s.station, state: s.state, client: s.client, addr: s.addr,
        logon: s.logon || null, idleSec: s.lastInput && s.now ? Math.max(0, Math.round((s.now - s.lastInput) / 1000)) : null, connect: s.connect || null,
        self: s.id === r.self,
      }));
      const logons = U.arr(r.logons).filter(l => l.user && !/\\(SYSTEM|LOCAL SERVICE|NETWORK SERVICE)$|\\(DWM|UMFD)-\d+$|\$$/i.test(l.user));
      return { platform: 'win32', sessions: wts, logons, smb: U.arr(r.smb), users: U.arr(r.users), errors: U.arr(r.errors), admin: plat.isAdmin() };
    }
    const who = U.which('who', ['/usr/bin', '/bin']);
    const r = who ? await U.run(who, ['-u']) : { stdout: '' };
    return { platform: process.platform, sessions: parseWho(r.stdout), logons: [], smb: [], users: [], errors: who ? [] : ['who not found'], admin: typeof process.getuid === 'function' && process.getuid() === 0 };
  }
  async function act(a) {
    const action = String(a.action || '');
    if (U.IS_WIN) {
      if (action === 'logoff' || action === 'disconnect') {
        const id = U.int(a.id, -1);
        if (id <= 0) throw new Error('Refusing to touch session 0 (services).');
        return plat.ctl.request('session', { sid: id, action }, 30000);
      }
      if (action === 'smbclose') {
        const id = String(a.id || ''); if (!/^\d{1,20}$/.test(id)) throw new Error('bad SMB session id');
        return plat.ctl.request('smbclose', { smbId: id }, 30000);
      }
      throw new Error('unknown session action');
    }
    if (action === 'logoff') {
      const pid = U.int(a.pid, 0);
      if (pid <= 1) throw new Error('bad session leader pid');
      if (pid === process.pid || pid === process.ppid) throw new Error('Refusing: that is RigWatch or its terminal.');
      process.kill(pid, 'SIGHUP');
      return 'sent hang-up to session leader ' + pid;
    }
    throw new Error('Only sign-out is supported on this OS.');
  }
  return { list, act };
}

module.exports = { create, parseWho };
