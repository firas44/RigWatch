'use strict';
// Exposure audit: risky listening ports, debug endpoints, binaries in odd places, masquerading
// system binaries, unsigned network-facing binaries (Windows), firewall / AV state.
const U = require('./util');

const PORTS = {
  21: ['high', 'FTP (plaintext credentials)'], 23: ['critical', 'Telnet (plaintext shell)'], 69: ['medium', 'TFTP'], 135: ['low', 'Windows RPC'], 137: ['low', 'NetBIOS'], 139: ['medium', 'NetBIOS session (SMB1-era)'],
  161: ['medium', 'SNMP'], 445: ['medium', 'SMB file sharing'], 512: ['high', 'rexec'], 513: ['high', 'rlogin'], 514: ['high', 'rsh'], 1433: ['high', 'SQL Server'], 1521: ['high', 'Oracle DB'],
  2375: ['critical', 'Docker API without TLS (remote root)'], 2376: ['medium', 'Docker API (TLS)'], 3306: ['high', 'MySQL'], 3389: ['high', 'Remote Desktop'], 4444: ['high', 'port commonly used by backdoors / Metasploit'],
  5432: ['high', 'PostgreSQL'], 5555: ['critical', 'Android Debug Bridge'], 5672: ['medium', 'RabbitMQ'], 5900: ['high', 'VNC'], 5901: ['high', 'VNC'], 5984: ['high', 'CouchDB'], 6379: ['high', 'Redis'],
  6443: ['high', 'Kubernetes API'], 8086: ['medium', 'InfluxDB'], 8888: ['medium', 'Jupyter'], 9200: ['high', 'Elasticsearch'], 9222: ['critical', 'Chrome DevTools remote debugging'], 9229: ['critical', 'Node.js inspector (remote code execution)'],
  10250: ['high', 'Kubelet'], 11211: ['high', 'Memcached'], 11434: ['medium', 'Ollama API'], 15672: ['medium', 'RabbitMQ admin'], 27017: ['high', 'MongoDB'], 31337: ['high', 'port commonly used by backdoors'],
};
const BAD_REMOTE = new Set([4444, 1337, 31337, 6666, 6667, 6697, 12345, 5555, 9001]);
const WEIGHT = { critical: 25, high: 12, medium: 5, low: 2, info: 0 };
const SYS_BINS = new Set(['svchost', 'lsass', 'csrss', 'smss', 'wininit', 'winlogon', 'services', 'spoolsv', 'taskhostw', 'dllhost', 'conhost', 'rundll32', 'explorer', 'dwm', 'ctfmon', 'sihost', 'runtimebroker']);
const SUSP_DIR = process.platform === 'win32'
  ? /\\(AppData\\Local\\Temp|Windows\\Temp|Downloads|Users\\Public|\$Recycle\.Bin|ProgramData\\[^\\]+\.exe$)/i
  : /^(\/tmp\/|\/var\/tmp\/|\/dev\/shm\/|\/private\/tmp\/|\/Users\/[^/]+\/Downloads\/|\/home\/[^/]+\/Downloads\/)/;

class Security {
  constructor(plat, timeline) {
    this.plat = plat; this.timeline = timeline;
    this.sig = new Map(); this.sigQueue = []; this.sigBusy = false;
    this.findings = []; this.keys = null; this.net = null; this.netAt = 0;
    this.procFlags = new Map();
  }
  setNetInfo(n) { this.net = n; this.netAt = Date.now(); }
  signature(p) { return p ? this.sig.get(p.toLowerCase()) || null : null; }

  /** queue Authenticode checks for network-facing or oddly-located binaries (Windows only) */
  queueSignatures(procs, sock) {
    if (!this.plat.caps.signatures) return;
    const net = new Set([...sock.byPid.keys(), ...sock.connsByPid.keys()]);
    for (const p of procs) {
      if (!p.exe || this.sig.has(p.exe.toLowerCase()) || this.sigQueue.includes(p.exe)) continue;
      if (net.has(p.pid) || SUSP_DIR.test(p.exe) || p.kind === 'app') this.sigQueue.push(p.exe);
    }
    if (this.sigBusy || !this.sigQueue.length) return;
    this.sigBusy = true;
    const batch = this.sigQueue.splice(0, 8);
    this.plat.signatures(batch).then(res => {
      for (const [k, v] of Object.entries(res || {})) this.sig.set(k.toLowerCase(), { status: v.status, signer: v.signer, os: !!v.os });
    }).catch(() => { for (const b of batch) this.sig.set(b.toLowerCase(), { status: 'Unknown', signer: '' }); }).finally(() => { this.sigBusy = false; });
  }

  analyze(procs, sock, ctx) {
    const F = [];
    const add = (sev, cat, key, title, detail, fix, extra) => F.push(Object.assign({ key, sev, cat, title, detail, fix }, extra || {}));
    const byPid = new Map(procs.map(p => [p.pid, p]));
    const pname = pid => { const p = byPid.get(pid); return p ? (p.label || p.name) : (sock.names.get(pid) || (pid <= 4 ? 'System' : 'pid ' + pid)); };
    this.procFlags = new Map();
    const flag = (pid, f) => { if (!this.procFlags.has(pid)) this.procFlags.set(pid, []); this.procFlags.get(pid).push(f); };

    // listening ports
    for (const l of sock.listen) {
      const risk = PORTS[l.port];
      const p = byPid.get(l.pid);
      if (l.scope === 'all' || l.scope === 'iface') {
        if (risk) {
          add(risk[0], 'exposure', 'port:' + l.proto + ':' + l.port, risk[1] + ' reachable from the network (' + l.proto + ' ' + l.port + ')', pname(l.pid) + ' (PID ' + l.pid + ') listens on ' + l.addrs.join(', ') + '.', l.port === 9229 || l.port === 9222 ? 'Bind the debugger to 127.0.0.1 (e.g. --inspect=127.0.0.1:9229) or stop it.' : 'Bind it to 127.0.0.1, stop the service, or block the port in your firewall.', { pid: l.pid, port: l.port });
          flag(l.pid, 'exposed:' + l.port);
        } else if (p && ['runtime', 'server', 'ai', 'db'].includes(p.kind) && l.proto === 'TCP') {
          add('low', 'exposure', 'dev:' + l.port, 'Dev server on all interfaces (TCP ' + l.port + ')', pname(l.pid) + ' accepts connections from your whole network.', 'Use --host 127.0.0.1 (vite/next/uvicorn) unless you are testing from another device.', { pid: l.pid, port: l.port });
        }
      } else if (risk && (l.port === 9229 || l.port === 9222)) {
        add('low', 'exposure', 'dbg:' + l.port, risk[1].replace(/ \(.*\)/, '') + ' open on localhost (TCP ' + l.port + ')', pname(l.pid) + ' exposes a debugger. Any local program can attach to it.', 'Fine while debugging; close it when you are done.', { pid: l.pid, port: l.port });
      }
      if (l.pid > 4 && !byPid.has(l.pid) && !sock.names.get(l.pid) && this.plat.id === 'win32') add('low', 'exposure', 'orphan:' + l.port, 'Port ' + l.port + ' owned by an invisible process (PID ' + l.pid + ')', 'The owning process is not visible to RigWatch.', 'Run RigWatch elevated to see it.', { port: l.port, pid: l.pid });
    }

    // processes
    const sysRoot = (process.env.SystemRoot || 'C:\\Windows').toLowerCase();
    for (const p of procs) {
      if (!p.exe || p.kind === 'rigwatch') continue;
      const exe = p.exe.toLowerCase();
      if (this.plat.id === 'win32' && SYS_BINS.has(p.name.toLowerCase()) && !exe.startsWith(sysRoot)) {
        add('critical', 'process', 'masq:' + p.pid, p.name + '.exe running outside ' + sysRoot, 'PID ' + p.pid + ' runs from ' + p.exe + '. Malware often uses system process names.', 'Check the file (hash it, scan it). If you did not install it, end it and investigate.', { pid: p.pid });
        flag(p.pid, 'masquerade');
      }
      const netActive = sock.byPid.has(p.pid) || sock.connsByPid.has(p.pid);
      if (SUSP_DIR.test(p.exe)) {
        add(netActive ? 'high' : 'medium', 'process', 'tmp:' + p.pid, p.name + ' runs from a temp/download folder', p.exe + (netActive ? ' and it has network activity.' : '.'), 'Legit installers do this briefly. Anything long-running there deserves a look.', { pid: p.pid });
        flag(p.pid, 'odd-location');
      }
      if (/ \(deleted\)$/.test(p.exe)) { add('high', 'process', 'del:' + p.pid, p.name + ' runs from a deleted binary', p.exe, 'Normal after a package upgrade (restart it); suspicious otherwise.', { pid: p.pid }); flag(p.pid, 'deleted-binary'); }
      const sig = this.signature(p.exe);
      if (sig && netActive && (sig.status === 'HashMismatch' || sig.status === 'NotTrusted')) { add('high', 'process', 'sigbad:' + exe, p.name + ': signature ' + sig.status, p.exe, 'The file was modified after signing or the certificate is not trusted.', { pid: p.pid }); flag(p.pid, 'bad-signature'); }
      else if (sig && netActive && sig.status === 'NotSigned') { add('low', 'process', 'unsigned:' + exe, 'Unsigned binary on the network: ' + p.name, p.exe, 'Common for dev tools and open-source apps. Make sure you recognise it.', { pid: p.pid }); flag(p.pid, 'unsigned'); }
    }

    // connections
    const syn = new Map(), bad = new Map();
    for (const c of sock.conns) {
      if (c.state === 'SYN_SENT') syn.set(c.pid, (syn.get(c.pid) || 0) + 1);
      if (BAD_REMOTE.has(c.rp) && U.ipKind(c.rh) === 'public') bad.set(c.pid, c);
    }
    for (const [pid, n] of syn) if (n >= 40) { add('medium', 'network', 'syn:' + pid, pname(pid) + ' has ' + n + ' pending outbound connections', 'Lots of SYN_SENT means it is failing to reach hosts, scanning, or retrying hard.', 'Look at the remote addresses in Network \u2192 Connections.', { pid }); flag(pid, 'syn-storm'); }
    for (const [pid, c] of bad) { add('medium', 'network', 'badport:' + pid, pname(pid) + ' talks to remote port ' + c.rp, c.rh + ':' + c.rp + ' is a port often used by backdoors, IRC bots or ADB.', 'Verify you expect this connection.', { pid }); flag(pid, 'odd-remote-port'); }
    const eph = sock.conns.filter(c => c.lp >= 49152).length;
    if (eph > 12000) add('medium', 'network', 'ephemeral', 'Ephemeral ports nearly exhausted (' + eph + ' in use)', 'New outbound connections may start failing.', 'Find the app with thousands of TIME_WAIT/ESTABLISHED sockets in Network \u2192 Connections.');

    // host posture
    const n = this.net;
    if (n) {
      for (const f of n.firewall || []) if (f.enabled === false) add('high', 'posture', 'fw:' + f.name, 'Firewall disabled: ' + f.name + ' profile', 'Inbound connections are not filtered on this profile.', 'Turn the firewall back on unless something else protects this machine.');
      const av = n.av || [];
      const thirdParty = av.filter(a => a.enabled && !/defender/i.test(a.name));
      if (n.defender && n.defender.realtime === false) {
        if (thirdParty.length) add('info', 'posture', 'av:third', thirdParty.map(a => a.name).join(', ') + ' is your active antivirus', 'Microsoft Defender runs in passive mode next to it, which is expected.', '');
        else add('high', 'posture', 'av:rtp', 'Microsoft Defender real-time protection is off', 'No other active antivirus is registered with Windows Security Center.', 'Re-enable real-time protection or install another antivirus.');
      } else if (n.defender && n.defender.sigAgeDays > 7) add('medium', 'posture', 'av:sig', 'Defender signatures are ' + n.defender.sigAgeDays + ' days old', '', 'Run Windows Update to refresh definitions.');
      for (const a of thirdParty) if (a.upToDate === false) add('medium', 'posture', 'av:old:' + a.name, a.name + ' reports out-of-date definitions', '', 'Update it.');
      for (const pr of n.profiles || []) if (/public/i.test(pr.category) && sock.listen.some(l => l.scope === 'all' && PORTS[l.port])) { add('info', 'posture', 'pub:' + pr.name, 'On a public network (' + pr.name + ') with services listening', 'Windows applies stricter firewall rules on Public networks, which helps.', ''); break; }
    }
    if (ctx.inv && ctx.inv.secureBoot === false) add('low', 'posture', 'secureboot', 'Secure Boot is off', 'Boot-level malware protection is disabled.', 'Enable Secure Boot in firmware settings if your OS supports it.');
    if (ctx.exposed) add('medium', 'posture', 'rigwatch-lan', 'RigWatch itself is reachable on your network', 'HOST=' + ctx.host + ' makes this dashboard readable (not controllable) from other devices.', 'Use HOST=127.0.0.1 unless you need LAN access. Control actions still require the token.');

    F.sort((a, b) => WEIGHT[b.sev] - WEIGHT[a.sev] || a.title.localeCompare(b.title));
    // dedupe by key
    const seen = new Set();
    this.findings = F.filter(f => (seen.has(f.key) ? false : seen.add(f.key)));
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const f of this.findings) counts[f.sev]++;
    const score = Math.max(0, 100 - this.findings.reduce((a, f) => a + WEIGHT[f.sev], 0));
    // timeline diff
    const keys = new Set(this.findings.map(f => f.key));
    if (this.keys) {
      for (const f of this.findings) if (!this.keys.has(f.key) && f.sev !== 'info') this.timeline.add('finding.new', f.sev === 'critical' || f.sev === 'high' ? 'alert' : 'warn', f.title, { detail: f.detail, pid: f.pid, port: f.port, sevLevel: f.sev });
      for (const k of this.keys) if (!keys.has(k)) this.timeline.add('finding.clear', 'info', 'Resolved: ' + (this.lastTitles.get(k) || k), {});
    }
    this.keys = keys; this.lastTitles = new Map(this.findings.map(f => [f.key, f.title]));
    this.summary = { score, counts, top: this.findings.slice(0, 5) };
    return this.summary;
  }
  flags(pid) { return this.procFlags.get(pid) || null; }
}

module.exports = { Security, PORTS };
