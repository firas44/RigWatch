'use strict';
// Unit tests for the pure parsers (run on any OS: `npm test`).
process.env.NO_PERSIST = '1';
const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../lib/platform/linux');
const M = require('../lib/platform/darwin');
const sockets = require('../lib/sockets');
const U = require('../lib/util');
const { describe: describeProc, kindOf } = require('../lib/classify');
const { parsePorts, expandTarget } = require('../lib/nettools');
const { parseLhmTree, parseLocaleNum } = require('../lib/sensors');

test('linux /proc/stat', () => {
  const r = L.parseProcStat('cpu  100 0 50 800 50 0 10 0 0 0\ncpu0 50 0 25 400 25 0 5 0 0 0\ncpu1 50 0 25 400 25 0 5 0 0 0\nintr 12345 0 0\nctxt 99999\nprocesses 4321\nprocs_running 3\n');
  assert.equal(r.cpus.length, 2);
  assert.equal(r.total.idle, 850);
  assert.equal(r.total.busy, 160);
  assert.equal(r.ctxt, 99999);
  assert.equal(r.running, 3);
});

test('linux /proc/meminfo', () => {
  const m = L.parseMeminfo('MemTotal:       32768000 kB\nMemAvailable:   16000000 kB\nHugePages_Total:       0\n');
  assert.equal(m.MemTotal, 32768000 * 1024);
  assert.equal(m.HugePages_Total, 0);
});

test('linux /proc/<pid>/stat with spaces and parens in comm', () => {
  const s = L.parsePidStat('1234 (my (weird) proc) S 1 1234 1234 0 -1 4194560 100 0 2 0 150 50 0 0 20 0 8 0 5000 123456789 2500 18446744073709551615');
  assert.equal(s.pid, 1234);
  assert.equal(s.comm, 'my (weird) proc');
  assert.equal(s.ppid, 1);
  assert.equal(s.utime, 150);
  assert.equal(s.stime, 50);
  assert.equal(s.threads, 8);
  assert.equal(s.starttime, 5000);
  assert.equal(s.rss, 2500);
});

test('linux /proc/net/dev, snmp, diskstats', () => {
  const d = L.parseNetDev('Inter-|   Receive |  Transmit\n face |bytes packets errs drop fifo frame compressed multicast|bytes packets errs drop fifo colls carrier compressed\n    lo:  1000 10 0 0 0 0 0 0 1000 10 0 0 0 0 0 0\n  eth0: 5000000 4000 1 2 0 0 0 10 2000000 3000 0 0 0 0 0 0\n');
  assert.deepEqual(d[1], { name: 'eth0', rxBytes: 5000000, rxPackets: 4000, rxErrs: 1, rxDrop: 2, txBytes: 2000000, txPackets: 3000, txErrs: 0, txDrop: 0 });
  const s = L.parseSnmp('Ip: Forwarding\nIp: 1\nTcp: RtoAlgorithm RtoMin RtoMax MaxConn ActiveOpens PassiveOpens AttemptFails EstabResets CurrEstab InSegs OutSegs RetransSegs\nTcp: 1 200 120000 -1 100 50 3 4 12 10000 9000 45\n');
  assert.equal(s.CurrEstab, 12);
  assert.equal(s.RetransSegs, 45);
  const k = L.parseDiskstats('   8       0 sda 1000 10 80000 500 2000 20 160000 900 0 1200 1400 0 0 0 0\n');
  assert.equal(k[0].name, 'sda');
  assert.equal(k[0].readSectors, 80000);
  assert.equal(k[0].writeSectors, 160000);
  assert.equal(k[0].ioMs, 1200);
});

test('linux /proc/net/tcp(6) hex addresses', () => {
  assert.equal(L.hexIp('0100007F'), '127.0.0.1');
  assert.equal(L.hexIp('00000000000000000000000001000000'), '::1');
  assert.equal(L.hexIp('00000000000000000000000000000000'), '::');
  assert.equal(L.hexIp('0000000000000000FFFF00000100007F'), '::ffff:127.0.0.1');
  const rows = L.parseProcNet('  sl  local_address rem_address   st tx_queue rx_queue tr tm->when retrnsmt   uid  timeout inode\n   0: 0100007F:0CEA 00000000:0000 0A 00000000:00000000 00:00000000 00000000  1000        0 31337 1\n   1: 0F02000A:0016 0202000A:D1C3 01 00000000:00000000 02:000A8D6C 00000000     0        0 23456 4\n', 'TCP');
  assert.deepEqual([rows[0].lh, rows[0].lp, rows[0].state, rows[0].inode], ['127.0.0.1', 3306, 'LISTEN', 31337]);
  assert.deepEqual([rows[1].lh, rows[1].lp, rows[1].rh, rows[1].rp, rows[1].state], ['10.0.2.15', 22, '10.0.2.2', 53699, 'ESTABLISHED']);
});

test('linux ss -tunap', () => {
  const rows = L.parseSs('Netid State  Recv-Q Send-Q  Local Address:Port   Peer Address:Port Process\ntcp   LISTEN 0      511           0.0.0.0:3000        0.0.0.0:*     users:(("node",pid=4242,fd=21))\ntcp   ESTAB  0      0          10.0.0.5:22          10.0.0.9:52011 users:(("sshd",pid=900,fd=4),("sshd",pid=880,fd=4))\nudp   UNCONN 0      0       127.0.0.53%lo:53          0.0.0.0:*     users:(("systemd-resolve",pid=600,fd=13))\ntcp   LISTEN 0      4096             [::]:22             [::]:*\n');
  assert.equal(rows.length, 4);
  assert.deepEqual([rows[0].lp, rows[0].pid, rows[0].name], [3000, 4242, 'node']);
  assert.equal(rows[2].lh, '127.0.0.53');
  const b = sockets.build(rows);
  assert.equal(b.listen.length, 3);
  assert.equal(b.conns.length, 1);
  assert.equal(b.listen.find(l => l.port === 3000).scope, 'all');
  assert.equal(b.listen.find(l => l.port === 53).scope, 'local');
  assert.deepEqual(b.byPid.get(4242), [3000]);
});

test('linux arp + route + resolv', () => {
  const a = L.parseArp('IP address       HW type     Flags       HW address            Mask     Device\n192.168.2.1      0x1         0x2         aa:bb:cc:dd:ee:ff     *        eth0\n192.168.2.9      0x1         0x0         00:00:00:00:00:00     *        eth0\n');
  assert.deepEqual(a, [{ ip: '192.168.2.1', mac: 'AA-BB-CC-DD-EE-FF', state: 'Reachable', iface: 'eth0' }]);
  const r = L.parseRoute('Iface\tDestination\tGateway \tFlags\tRefCnt\tUse\tMetric\tMask\t\tMTU\tWindow\tIRTT\neth0\t00000000\t0102A8C0\t0003\t0\t0\t100\t00000000\t0\t0\t0\neth0\t0002A8C0\t00000000\t0001\t0\t0\t100\t00FFFFFF\t0\t0\t0\n');
  assert.equal(r[0].dest, '0.0.0.0/0');
  assert.equal(r[0].gw, '192.168.2.1');
  assert.equal(r[1].dest, '192.168.2.0/24');
  assert.deepEqual(L.parseResolv('# x\nnameserver 1.1.1.1\nnameserver 9.9.9.9\nsearch lan\n'), ['1.1.1.1', '9.9.9.9']);
});

test('macOS vm_stat / swap / ps', () => {
  const v = M.parseVmStat('Mach Virtual Memory Statistics: (page size of 16384 bytes)\nPages free:                                3264.\nPages wired down:                         95045.\n"Translation faults":                 1234567.\nAnonymous pages:                         200000.\n');
  assert.equal(v.page, 16384);
  assert.equal(v.v['Pages free'], 3264 * 16384);
  assert.equal(v.v['Translation faults'], 1234567 * 16384);
  assert.deepEqual(M.parseSwap('total = 2048.00M  used = 1024.50M  free = 1023.50M  (encrypted)'), { total: 2048 * 1048576, used: 1024.5 * 1048576 });
  const p = M.parsePsMain('  123     1 root     Ss     0  10240   0:01.50  1-02:03:04 /usr/sbin/syslogd\n  777   123 me       S      5  20480   1:02.25     05:00 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome\n');
  assert.equal(p.length, 2);
  assert.deepEqual([p[0].pid, p[0].ppid, p[0].user, p[0].rss, p[0].cpuSec, p[0].age], [123, 1, 'root', 10240 * 1024, 1.5, 93784]);
  assert.equal(p[1].comm, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
  assert.equal(p[1].cpuSec, 62.25);
});

test('macOS iostat / df / netstat -ibn', () => {
  const io = M.parseIostat('              disk0               disk4 \n    KB/t  xfrs   MB     KB/t  xfrs   MB \n   21.69 4459858 94459.61    64.00   2201   137.56 \n');
  assert.deepEqual(io, [{ name: 'disk0', xfrs: 4459858, mb: 94459.61 }, { name: 'disk4', xfrs: 2201, mb: 137.56 }]);
  const df = M.parseDf('Filesystem     1024-blocks      Used Available Capacity  Mounted on\n/dev/disk3s1s1   482797652  10204220 236456760     5%    /\ndevfs                  200       200         0   100%    /dev\n/dev/disk5s1     976000000 100000000 876000000    11%    /Volumes/My Drive\n');
  assert.equal(df.length, 2);
  assert.equal(df[1].mount, '/Volumes/My Drive');
  const ni = M.parseNetstatIb('Name       Mtu   Network       Address            Ipkts Ierrs     Ibytes    Opkts Oerrs     Obytes  Coll\nlo0        16384 <Link#1>                         12345     0    6789012    12345     0    6789012     0\nen0        1500  <Link#4>      a4:83:e7:12:34:56 987654     0  123456789   543210     0   98765432     0\nen0        1500  192.168.1     192.168.1.20       987654     -  123456789   543210     -   98765432     -\n');
  assert.equal(ni.length, 2);
  assert.deepEqual([ni[1].name, ni[1].mac, ni[1].rxBytes, ni[1].txPackets], ['en0', 'A4-83-E7-12-34-56', 123456789, 543210]);
  assert.equal(ni[0].rxBytes, 6789012);
});

test('macOS lsof -F', () => {
  const rows = M.parseLsof('p1234\ncnode\nf21\nPTCP\nn*:3000\nTST=LISTEN\nTQR=0\nf22\nPTCP\nn127.0.0.1:3000->127.0.0.1:52000\nTST=ESTABLISHED\np555\ncmDNSResponder\nf5\nPUDP\nn*:5353\n');
  assert.equal(rows.length, 3);
  assert.deepEqual([rows[0].pid, rows[0].lp, rows[0].state], [1234, 3000, 'LISTEN']);
  assert.deepEqual([rows[1].rh, rows[1].rp], ['127.0.0.1', 52000]);
  assert.deepEqual([rows[2].proto, rows[2].state, rows[2].name], ['UDP', 'UNCONN', 'mDNSResponder']);
  const b = sockets.build(rows);
  assert.equal(b.listen.length, 2);
  assert.equal(b.conns.length, 1);
});

test('macOS ioreg / pmset / arp / routes / scutil / launchctl', () => {
  assert.deepEqual(M.parseIoregGpu('| "PerformanceStatistics" = {"In use system memory"=123456789,"Device Utilization %"=12,"Renderer Utilization %"=10,"Tiler Utilization %"=8}')[0], { util: 12, renderer: 10, tiler: 8, memUsed: 123456789, memAlloc: null });
  assert.deepEqual(M.parsePmset("Now drawing from 'Battery Power'\n -InternalBattery-0 (id=4653155)\t85%; discharging; 4:12 remaining present: true\n")[0], { name: 'InternalBattery-0', pct: 85, plugged: false, charging: false, minutes: 252 });
  assert.equal(M.parseArpMac('? (192.168.1.1) at a4:2b:b0:1:2:3 on en0 ifscope [ethernet]\n')[0].mac, 'A4-2B-B0-01-02-03');
  const r = M.parseNetstatRoutes('Routing tables\n\nInternet:\nDestination        Gateway            Flags               Netif Expire\ndefault            192.168.1.1        UGScg                 en0       \n127                127.0.0.1          UCS                   lo0       \n');
  assert.deepEqual([r[0].dest, r[0].gw, r[0].iface], ['0.0.0.0/0', '192.168.1.1', 'en0']);
  assert.deepEqual(M.parseScutilDns('resolver #1\n  nameserver[0] : 192.168.1.1\n  nameserver[1] : 1.1.1.1\nresolver #2\n  nameserver[0] : 192.168.1.1\n'), ['192.168.1.1', '1.1.1.1']);
  const l = M.parseLaunchctl('PID\tStatus\tLabel\n-\t0\tcom.apple.SafariHistoryServiceAgent\n412\t0\tcom.apple.Finder\n');
  assert.deepEqual([l[1].name, l[1].pid, l[1].state], ['com.apple.Finder', 412, 'Running']);
});

test('sockets: Windows netstat-style states and IPv6', () => {
  assert.deepEqual(sockets.splitHostPort('[fe80::1%13]:52000'), ['fe80::1', 52000]);
  assert.deepEqual(sockets.splitHostPort('*:*'), ['*', 0]);
  assert.equal(sockets.normState('LISTENING'), 'LISTEN');
  assert.equal(sockets.normState('FIN_WAIT_2'), 'FIN_WAIT2');
  assert.equal(sockets.normState('time-wait'), 'TIME_WAIT');
});

test('util: redact, splitArgs, durations, ip kinds, safeHost', () => {
  assert.equal(U.redact('app --token=abc123 --port 80'), 'app --token=\u2022\u2022\u2022\u2022 --port 80');
  assert.equal(U.redact('psql postgres://user:hunter2@db/x'), 'psql postgres://user:\u2022\u2022\u2022\u2022@db/x');
  assert.equal(U.redact('node --author me'), 'node --author me');
  assert.deepEqual(U.splitArgs('"C:\\Program Files\\node.exe" "my app.js" --x 1'), ['C:\\Program Files\\node.exe', 'my app.js', '--x', '1']);
  assert.equal(U.parseDuration('1-02:03:04'), 93784);
  assert.equal(U.parseDuration('05:00'), 300);
  assert.equal(U.ipKind('192.168.1.5'), 'private');
  assert.equal(U.ipKind('::1'), 'loopback');
  assert.equal(U.ipKind('8.8.8.8'), 'public');
  assert.equal(U.ipKind('100.64.1.1'), 'cgnat');
  assert.equal(U.safeHost('-oProxyCommand=x'), null);
  assert.equal(U.safeHost('github.com'), 'github.com');
});

test('classify: dev labels', () => {
  assert.equal(describeProc('node', '"C:\\Program Files\\nodejs\\node.exe" C:\\x\\myapp\\node_modules\\next\\dist\\bin\\next dev').label, 'next dev');
  assert.equal(describeProc('node', 'node /usr/lib/node_modules/npm/bin/npm-cli.js run dev').label, 'npm run dev');
  assert.equal(describeProc('python3', 'python3 -m uvicorn main:app --reload').label, 'uvicorn main:app --reload');
  assert.equal(describeProc('python', 'python manage.py runserver').label, 'manage.py runserver');
  assert.equal(describeProc('java', 'java -Xmx1g -jar /srv/app/server.jar').label, 'server.jar');
  assert.equal(describeProc('node', 'node -e "console.log(1)"').label, 'node -e \u2026');
  assert.equal(kindOf('Code.exe'), 'editor');
  assert.equal(kindOf('python3.12'), 'runtime');
  assert.equal(kindOf('kworker/0:1'), 'system');
});

test('nettools: port specs and targets', () => {
  assert.deepEqual(parsePorts('22,80,8000-8002'), [22, 80, 8000, 8001, 8002]);
  assert.equal(parsePorts('all').length, 65535);
  assert.throws(() => parsePorts('70000'));
  assert.equal(expandTarget('192.168.1.0/24').length, 254);
  assert.deepEqual(expandTarget('10.0.0.5-7'), ['10.0.0.5', '10.0.0.6', '10.0.0.7']);
  assert.throws(() => expandTarget('10.0.0.0/8'));
  assert.throws(() => expandTarget('-x'));
});

test('toolbox: hosts file parsing', () => {
  const { parseHosts } = require('../lib/toolbox');
  const e = parseHosts('# Copyright\n#\n127.0.0.1 localhost\n# 10.0.0.5 nas.lan nas\n::1\tlocalhost ip6-localhost # loopback\n# just a comment here\n');
  assert.equal(e.length, 3);
  assert.deepEqual(e[0], { line: 2, ip: '127.0.0.1', hosts: ['localhost'], enabled: true });
  assert.deepEqual(e[1], { line: 3, ip: '10.0.0.5', hosts: ['nas.lan', 'nas'], enabled: false });
  assert.deepEqual(e[2].hosts, ['localhost', 'ip6-localhost']);
});

test('elevate: liveness treats access-denied as alive', () => {
  const { alive } = require('../lib/elevate');
  assert.equal(alive(process.pid), true);
  assert.equal(alive(2147483000), false);
  const orig = process.kill;
  process.kill = () => { const e = new Error('denied'); e.code = 'EPERM'; throw e; };
  try { assert.equal(alive(1234), true); } finally { process.kill = orig; }
});

test('tools: pinned downloads are https and have SHA-256 hashes', () => {
  const { TOOLS } = require('../lib/tools');
  for (const [k, t] of Object.entries(TOOLS)) {
    assert.match(t.url, /^https:\/\/github\.com\//, k);
    assert.match(t.sha256, /^[0-9a-f]{64}$/, k);
  }
});

test('sensors: LibreHardwareMonitor tree and locale numbers', () => {
  assert.equal(parseLocaleNum('1,234.5 RPM'), 1234.5);
  assert.equal(parseLocaleNum('45,3 \u00b0C'), 45.3);
  assert.equal(parseLocaleNum('1.234,5 MHz'), 1234.5);
  const tree = { Text: 'Sensor', Children: [{ Text: 'PC', ImageURL: 'images_icon/computer.png', Children: [{ Text: 'AMD Ryzen 7', ImageURL: 'images_icon/cpu.png', Children: [{ Text: 'Temperatures', ImageURL: 'images_icon/temperature.png', Children: [{ Text: 'Core (Tctl/Tdie)', Value: '61.5 \u00b0C', Min: '40.0 \u00b0C', Max: '80.1 \u00b0C', Children: [] }] }] }] }] };
  const s = parseLhmTree(tree);
  assert.equal(s.length, 1);
  assert.deepEqual([s[0].hw, s[0].hwType, s[0].type, s[0].value], ['AMD Ryzen 7', 'Cpu', 'Temperature', 61.5]);
});
