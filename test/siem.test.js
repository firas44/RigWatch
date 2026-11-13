'use strict';
// SIEM unit tests: rule mapping, correlation, query language, event store, parsers, block validation.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const R = require('../lib/siem/rules');
const { EventStore, dayKey } = require('../lib/siem/store');
const { parseFwLog, dedupeLogons } = require('../lib/siem/collect');
const { Feeds, parseList } = require('../lib/siem/ips');
const { normalizeTarget, contains } = require('../lib/siem/blocks');
const { parseWho } = require('../lib/siem/sessions');

// a 4625 event as the control worker sends it (Properties as strings)
const p4625 = ['S-1-0-0', '-', '-', '0x0', 'S-1-0-0', 'admin', 'WORKGROUP', '3221225581', '%%2313', '3221225572', '3', 'NtLmSsp', 'NTLM', 'KALI', '-', '-', '0', '0x0', '-', '203.0.113.9', '51234'];
const p4624 = (type, sid, user, ip) => ['S-1-5-18', 'PC$', 'WORKGROUP', '0x3e7', sid, user, 'PC', '0x1234', String(type), 'User32', 'Negotiate', 'PC', '{0}', '-', '-', '0', '0x2b0', 'C:\\Windows\\System32\\svchost.exe', ip, '0', '%%1833', '-', '-', '-', '%%1843', '0x0', '%%1842'];

test('siem: Windows 4625 becomes a logon failure with reason and source', () => {
  const [e] = R.fromWin({ k: 'sec', id: 4625, rid: 1, t: 1000, p: p4625 });
  assert.equal(e.rule.id, 2004);
  assert.equal(e.ip, '203.0.113.9');
  assert.equal(e.user, 'WORKGROUP\\admin');
  assert.equal(e.data.reason, 'user does not exist');
  assert.deepEqual(e.rule.mitre, ['T1110']);
});

test('siem: 4624 keeps people, drops services and local network noise', () => {
  assert.equal(R.fromWin({ k: 'sec-logon', id: 4624, t: 1, p: p4624(5, 'S-1-5-21-1-2-3-1001', 'bob', '-') }).length, 0, 'service logon');
  assert.equal(R.fromWin({ k: 'sec-logon', id: 4624, t: 1, p: p4624(2, 'S-1-5-18', 'SYSTEM', '-') }).length, 0, 'SYSTEM');
  assert.equal(R.fromWin({ k: 'sec-logon', id: 4624, t: 1, p: p4624(3, 'S-1-5-21-1-2-3-1001', 'bob', '127.0.0.1') }).length, 0, 'local network logon');
  const [rdp] = R.fromWin({ k: 'sec-logon', id: 4624, t: 1, p: p4624(10, 'S-1-5-21-1-2-3-1001', 'bob', '198.51.100.4') });
  assert.equal(rdp.rule.id, 2002);
  assert.equal(rdp.ip, '198.51.100.4');
  assert.equal(rdp.data.admin, true, 'ElevatedToken %%1842');
  const [i] = R.fromWin({ k: 'sec-logon', id: 4624, t: 1, p: p4624(2, 'S-1-5-21-1-2-3-1001', 'bob', '-') });
  assert.equal(i.rule.id, 2001);
});

test('siem: added to Administrators is critical; firewall churn by svchost is ignored', () => {
  const [g] = R.fromWin({ k: 'sec', id: 4732, t: 1, p: ['-', 'S-1-5-21-9', 'Administrators', 'Builtin', 'S-1-5-32-544', 'S-1-5-21-1', 'eve', 'PC'] });
  assert.equal(g.rule.id, 3007);
  assert.equal(g.rule.level, 12);
  const fw = n => { const p = new Array(28).fill(''); p[1] = 'Some rule'; p[22] = n; return p; };
  assert.equal(R.fromWin({ k: 'fw', id: 2097, t: 1, p: fw('C:\\Windows\\System32\\svchost.exe') }).length, 0);
  assert.equal(R.fromWin({ k: 'fw', id: 2097, t: 1, p: fw('C:\\Temp\\setup.exe') })[0].rule.id, 5005);
});

test('siem: Defender 5007 only reports exclusions and switched-off protection', () => {
  assert.equal(R.fromWin({ k: 'def', id: 5007, t: 1, p: ['Defender', '4.18', 'HKLM\\SOFTWARE\\Microsoft\\Windows Defender\\Signature Updates\\X = 0x1', 'HKLM\\SOFTWARE\\Microsoft\\Windows Defender\\Signature Updates\\X = 0x2'] }).length, 0);
  const [ex] = R.fromWin({ k: 'def', id: 5007, t: 1, p: ['Defender', '4.18', '', 'HKLM\\SOFTWARE\\Microsoft\\Windows Defender\\Exclusions\\Paths\\C:\\evil = 0x0'] });
  assert.equal(ex.rule.id, 5004);
  assert.equal(ex.rule.level, 10);
  const [off] = R.fromWin({ k: 'def', id: 5007, t: 1, p: ['Defender', '4.18', '', 'HKLM\\SOFTWARE\\Microsoft\\Windows Defender\\Real-Time Protection\\DisableRealtimeMonitoring = 0x1'] });
  assert.equal(off.rule.id, 5003);
});

test('siem: sshd and sudo lines', () => {
  assert.equal(R.fromAuthLine('sshd', 'Accepted publickey for alice from 192.0.2.7 port 50122 ssh2: ED25519 SHA256:x', 1)[0].rule.id, 2020);
  const f = R.fromAuthLine('sshd', 'Failed password for root from 192.0.2.8 port 4242 ssh2', 1)[0];
  assert.equal(f.rule.id, 2021); assert.equal(f.ip, '192.0.2.8'); assert.equal(f.user, 'root');
  assert.equal(R.fromAuthLine('sshd', 'Failed password for invalid user oracle from 192.0.2.8 port 4242 ssh2', 1).length, 0, 'counted by the Invalid user line');
  assert.equal(R.fromAuthLine('sshd', 'Invalid user oracle from 192.0.2.8 port 4242', 1)[0].rule.id, 2022);
  const s = R.fromAuthLine('sudo', 'alice : TTY=pts/0 ; PWD=/home/alice ; USER=root ; COMMAND=/usr/bin/apt update', 1)[0];
  assert.equal(s.rule.id, 2030); assert.equal(s.data.command, '/usr/bin/apt update');
  assert.equal(R.fromAuthLine('sudo', 'alice : 3 incorrect password attempts ; TTY=pts/0 ; PWD=/home/alice ; USER=root ; COMMAND=/bin/sh', 1)[0].rule.id, 2031);
  assert.equal(R.fromAuthLine('systemd-logind', 'New session 42 of user alice.', 1)[0].rule.id, 2032);
});

test('siem: syslog timestamps (classic and ISO)', () => {
  const now = new Date('2026-11-13T12:00:00').getTime();
  const a = R.parseSyslog('Nov 13 10:00:01 host sshd[123]: Failed password for root from 1.2.3.4 port 1 ssh2', now);
  assert.equal(a.ident, 'sshd'); assert.equal(new Date(a.ts).getHours(), 10);
  const b = R.parseSyslog('Dec 31 23:59:00 host sudo: x', now);
  assert.equal(new Date(b.ts).getFullYear(), 2025, 'a future date belongs to last year');
  const c = R.parseSyslog('2026-11-13T10:00:01.123+00:00 host sshd-session[9]: Invalid user x from 1.2.3.4', now);
  assert.equal(c.ident, 'sshd-session'); assert.equal(c.ts, Date.parse('2026-11-13T10:00:01.123+00:00'));
});

test('siem: brute force and success-after-failures correlation', () => {
  const c = new R.Correlator(), t0 = 1e12;
  let out = [];
  for (let i = 0; i < 5; i++) out = out.concat(c.feed(R.mk(2004, t0 + i * 1000, { ip: '203.0.113.9', user: 'admin' })));
  assert.equal(out.length, 1); assert.equal(out[0].rule.id, 2010); assert.equal(out[0].data.count, 5);
  assert.equal(c.feed(R.mk(2004, t0 + 6000, { ip: '203.0.113.9' })).length, 0, 'cool-down');
  const ok = c.feed(R.mk(2002, t0 + 9000, { ip: '203.0.113.9', user: 'admin' }));
  assert.equal(ok[0].rule.id, 2011);
});

test('siem: query language', () => {
  const ev = R.mk(2004, 1, { ip: '203.0.113.9', user: 'PC\\admin', process: 'sshd', location: 'Security/4625', msg: 'Failed logon for admin' });
  const m = q => R.matchEvent(R.parseQuery(q), ev);
  assert.ok(m('ip:203.0.113 level>=5'));
  assert.ok(!m('level>=7'));
  assert.ok(m('group:sshd,authentication_failed'));
  assert.ok(m('rule:2001,2004'));
  assert.ok(!m('rule:2001'));
  assert.ok(m('user:admin mitre:t1110 "failed logon"'));
  assert.ok(!m('-admin'));
  assert.ok(R.lineMayMatch(R.parseQuery('user:pc\\admin'), JSON.stringify(ev).toLowerCase()));
});

test('siem: compliance and MITRE tactic mapping', () => {
  const c = R.complianceOf(R.RULES[2010]);
  assert.ok(c.pci_dss.includes('10.2.4') && c.pci_dss.includes('11.4'));
  assert.ok(c.nist_800_53.includes('AC.7'));
  for (const t of Object.keys(R.MITRE)) assert.ok(R.TECH_TACTICS[t] && R.TECH_TACTICS[t].every(x => R.TACTICS.includes(x)), t);
  for (const r of Object.values(R.RULES)) for (const t of r.mitre) assert.ok(R.MITRE[t], 'rule ' + r.id + ' uses unknown technique ' + t);
});

test('siem: event store writes daily files, compresses old days, enforces retention, heals counters', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rw-siem-'));
  const evDir = path.join(dir, 'events');
  fs.mkdirSync(evDir, { recursive: true });
  const old = Date.now() - 400 * 86400e3, mid = Date.now() - 3 * 86400e3;
  fs.writeFileSync(path.join(evDir, dayKey(old) + '.jsonl'), JSON.stringify(R.mk(1001, old)) + '\n');
  fs.writeFileSync(path.join(evDir, dayKey(mid) + '.jsonl'), JSON.stringify(R.mk(2004, mid, { ip: '203.0.113.9' })) + '\n');
  const st = new EventStore(dir, { retentionDays: 365, modulesOf: () => ['events'] });
  try {
    assert.equal(st.rollups[dayKey(mid)].n, 1, 'heal() counted the existing day file');
    st.add(R.mk(2020, Date.now(), { ip: '198.51.100.1', user: 'alice' }));
    st.flush();
    await st.maintain();
    const names = fs.readdirSync(evDir).sort();
    assert.ok(!names.some(n => n.startsWith(dayKey(old))), 'past retention deleted');
    assert.ok(names.includes(dayKey(mid) + '.jsonl.gz'), 'old day gzipped');
    assert.ok(names.includes(dayKey(Date.now()) + '.jsonl'), 'today stays plain');
    // a late event for a compressed day is appended as another gzip member
    st.add(R.mk(2021, mid + 1000, { ip: '203.0.113.9' })); st.flush();
    assert.equal(zlib.gunzipSync(fs.readFileSync(path.join(evDir, dayKey(mid) + '.jsonl.gz'))).toString().trim().split('\n').length, 2);
    const q = await st.query({ from: Date.now() - 30 * 86400e3, limit: 10, f: R.parseQuery('ip:203.0.113.9'), match: R.matchEvent, pre: R.lineMayMatch });
    assert.equal(q.events.length, 2);
    assert.ok(q.events[0].ts > q.events[1].ts, 'newest first');
    const s = st.summary(Date.now() - 7 * 86400e3);
    assert.equal(s.totals.n, 3);
    assert.equal(s.totals.fail, 2);
    assert.equal(s.totals.ok, 1);
  } finally { clearInterval(st.flushTimer); clearInterval(st.rollTimer); clearInterval(st.maintTimer); fs.rmSync(dir, { recursive: true, force: true }); }
});

test('siem: Windows Firewall log parser keeps inbound drops only', () => {
  const text = '#Version: 1.5\n#Fields: date time action protocol src-ip dst-ip src-port dst-port size tcpflags tcpsyn tcpack tcpwin icmptype icmpcode info path pid\n' +
    '2026-11-13 10:00:01 DROP TCP 203.0.113.9 192.168.1.10 51515 3389 52 S 1 0 64240 - - - RECEIVE 0\n' +
    '2026-11-13 10:00:02 ALLOW TCP 192.168.1.10 1.1.1.1 50000 443 0 - - - - - - - SEND 1234\n' +
    '2026-11-13 10:00:03 DROP UDP 192.168.1.1 192.168.1.10 137 137 78 - - - - - - - RECEIVE 0\n';
  const d = parseFwLog(text);
  assert.equal(d.length, 2);
  assert.deepEqual([d[0].src, d[0].port, d[0].proto], ['203.0.113.9', 3389, 'TCP']);
});

test('siem: UAC split-token logons collapse into one', () => {
  const a = R.mk(2001, 1000, { user: 'PC\\bob', data: { admin: undefined } }), b = R.mk(2001, 1500, { user: 'PC\\bob', data: { admin: true } });
  a.data = { logonType: 2 }; b.data = { logonType: 2, admin: true };
  const out = dedupeLogons([a, b]);
  assert.equal(out.length, 1); assert.equal(out[0].data.admin, true);
});

test('siem: threat feed ranges', () => {
  const f = new Feeds(os.tmpdir(), false);
  f.build(parseList('# comment\n10.0.0.0/8\n198.51.100.0/24\n203.0.113.9\n', 0));
  assert.equal(f.match('198.51.100.77'), 'FireHOL level 1');
  assert.equal(f.match('203.0.113.9'), 'FireHOL level 1');
  assert.equal(f.match('203.0.113.10'), null);
  assert.equal(f.match('10.1.2.3'), null, 'private addresses are never matched');
});

test('siem: block targets are validated and normalized', () => {
  assert.equal(normalizeTarget('203.0.113.9'), '203.0.113.9');
  assert.equal(normalizeTarget('203.0.113.77/24'), '203.0.113.0/24');
  assert.equal(normalizeTarget('203.0.113.9/32'), '203.0.113.9');
  assert.equal(normalizeTarget('2001:DB8::1'), '2001:db8::1');
  assert.throws(() => normalizeTarget('10.0.0.0/4'), /large/);
  assert.throws(() => normalizeTarget('127.0.0.1'), /this machine/);
  assert.throws(() => normalizeTarget('1.2.3.4; rm -rf /'), /IP address/);
  assert.ok(contains('203.0.113.0/24', '203.0.113.200'));
  assert.ok(!contains('203.0.113.0/24', '203.0.114.1'));
});

test('siem: who -u parser', () => {
  const s = parseWho('alice    pts/0        2026-11-13 09:12   .          4242 (192.0.2.10)\nbob      tty2         2026-11-12 18:00 00:31        1337 (:0)\n');
  assert.equal(s.length, 2);
  assert.deepEqual([s[0].user, s[0].station, s[0].pid, s[0].addr], ['alice', 'pts/0', 4242, '192.0.2.10']);
  assert.equal(s[1].addr, '');
});
