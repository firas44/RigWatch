'use strict';
// Turns raw socket rows from any platform into { listen, conns, byPid, connsByPid }.
const { isAnyAddr, isLoopback } = require('./util');

const STATE = {
  LISTENING: 'LISTEN', LISTEN: 'LISTEN', ESTABLISHED: 'ESTABLISHED', ESTAB: 'ESTABLISHED',
  SYN_SENT: 'SYN_SENT', SYN_RECEIVED: 'SYN_RECV', SYN_RECV: 'SYN_RECV',
  FIN_WAIT_1: 'FIN_WAIT1', FIN_WAIT1: 'FIN_WAIT1', FIN_WAIT_2: 'FIN_WAIT2', FIN_WAIT2: 'FIN_WAIT2',
  TIME_WAIT: 'TIME_WAIT', CLOSE_WAIT: 'CLOSE_WAIT', LAST_ACK: 'LAST_ACK', CLOSING: 'CLOSING',
  CLOSED: 'CLOSED', CLOSE: 'CLOSED', DELETE_TCB: 'CLOSED', UNCONN: 'UNCONN', BOUND: 'BOUND', IDLE: 'BOUND',
  // Get-NetTCPConnection enum names
  TIMEWAIT: 'TIME_WAIT', CLOSEWAIT: 'CLOSE_WAIT', SYNSENT: 'SYN_SENT', SYNRECEIVED: 'SYN_RECV', LASTACK: 'LAST_ACK', DELETETCB: 'CLOSED',
};
function normState(s) {
  const k = String(s || '').toUpperCase().replace(/-/g, '_');
  return STATE[k] || k;
}

/**
 * rows: [{ proto: 'TCP'|'UDP', lh, lp, rh, rp, state, pid, name? }]
 */
function build(rows) {
  const listen = new Map();
  const conns = [];
  const names = new Map();
  for (const r of rows) {
    const state = normState(r.state);
    if (r.name && r.pid) names.set(r.pid, r.name);
    if (r.proto === 'TCP' && state === 'BOUND') continue; // bound but neither listening nor connected
    const remoteAny = !r.rh || isAnyAddr(r.rh) || r.rp === 0;
    const isListen = r.proto === 'TCP' ? state === 'LISTEN' || (remoteAny && !state)
      : (state === 'UNCONN' || state === '' || state === 'BOUND' || remoteAny);
    if (isListen) {
      if (!r.lp) continue;
      const key = r.proto + ':' + r.lp + ':' + r.pid;
      let e = listen.get(key);
      if (!e) { e = { proto: r.proto, port: r.lp, pid: r.pid, addrs: [] }; listen.set(key, e); }
      if (!e.addrs.includes(r.lh)) e.addrs.push(r.lh);
    } else {
      conns.push({ proto: r.proto, lh: r.lh, lp: r.lp, rh: r.rh, rp: r.rp, state: state || 'ESTABLISHED', pid: r.pid });
    }
  }
  const L = [...listen.values()].map(e => {
    e.scope = e.addrs.some(isAnyAddr) ? 'all' : e.addrs.every(isLoopback) ? 'local' : 'iface';
    return e;
  }).sort((a, b) => a.port - b.port || (a.proto < b.proto ? -1 : 1));
  const byPid = new Map(), connsByPid = new Map();
  for (const e of L) {
    if (e.proto !== 'TCP') continue;
    if (!byPid.has(e.pid)) byPid.set(e.pid, []);
    const list = byPid.get(e.pid);
    if (!list.includes(e.port)) list.push(e.port);
  }
  for (const c of conns) connsByPid.set(c.pid, (connsByPid.get(c.pid) || 0) + 1);
  return { listen: L, conns, byPid, connsByPid, names, at: Date.now(), ok: true, err: '' };
}

const empty = () => ({ listen: [], conns: [], byPid: new Map(), connsByPid: new Map(), names: new Map(), at: 0, ok: false, err: '' });

/** Split "1.2.3.4:80", "[::1]:80", "*:*", "fe80::1%13:80" into [host, port]. */
function splitHostPort(s) {
  if (!s || s === '*:*' || s === '*') return ['*', 0];
  const i = s.lastIndexOf(':');
  if (i < 0) return [s, 0];
  let h = s.slice(0, i); const p = s.slice(i + 1);
  if (h.startsWith('[')) h = h.slice(1, -1);
  return [h.replace(/%.*$/, ''), p === '*' ? 0 : +p || 0];
}

module.exports = { build, empty, normState, splitHostPort };
