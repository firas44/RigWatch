'use strict';
// Security configuration assessment (like Wazuh SCA): a hardening benchmark for this machine.
// Windows facts come from the control worker ('scafacts'); Linux and macOS read files and built-in tools.
// Runs at start-up and every 30 minutes; a check that flips raises an event (9001 failed / 9002 passed).
const fs = require('fs');
const os = require('os');
const path = require('path');
const U = require('../util');

const RISKY_PORTS = { 21: 'FTP', 23: 'Telnet', 135: 'RPC', 139: 'NetBIOS', 445: 'SMB', 1433: 'SQL Server', 1521: 'Oracle', 2375: 'Docker API', 3306: 'MySQL', 3389: 'RDP', 5432: 'PostgreSQL', 5900: 'VNC', 5985: 'WinRM', 5986: 'WinRM', 6379: 'Redis', 9200: 'Elasticsearch', 9229: 'Node inspector', 11211: 'Memcached', 27017: 'MongoDB' };
const C = (pci, nist, extra) => Object.assign({ pci_dss: pci, nist_800_53: nist }, extra || {});
const P = 'passed', F = 'failed', NA = 'not applicable';
const r = (res, detail) => ({ result: res, detail: detail || '' });

function exposedCheck() {
  return {
    id: 'net.exposed', cat: 'Network', title: 'No remote-admin or database ports open to the network',
    rationale: 'Services such as RDP, SMB, databases or the Docker API listening on every interface can be reached by anything on your network (or the internet when port-forwarded).',
    remediation: 'Bind dev databases and tools to 127.0.0.1, stop services you do not use, or restrict them with a firewall rule.',
    compliance: C(['1.3', '2.2'], ['SC.7', 'CM.6']),
    eval: (f, ctx) => {
      // 135/139/445 listen on every Windows PC by design; SMB hardening is covered by its own checks
      const bad = (ctx.listen || []).filter(l => l.scope === 'all' && RISKY_PORTS[l.port] && ![135, 139, 445].includes(l.port));
      return bad.length ? r(F, bad.map(l => RISKY_PORTS[l.port] + ' (' + l.proto + ' ' + l.port + ')').filter((v, i, a) => a.indexOf(v) === i).join(', ')) : r(P, 'none found');
    },
  };
}

const WIN = [
  { id: 'win.fw.on', cat: 'Network', title: 'Windows Firewall is on for every network profile', rationale: 'A profile with the firewall off accepts any inbound connection on that kind of network.', remediation: 'Settings > Privacy & security > Windows Security > Firewall & network protection: turn on Domain, Private and Public.', compliance: C(['1.1.1', '1.3'], ['SC.7']),
    eval: f => !f.fw ? r(NA, f.fwErr) : f.fw.every(p => p.on === 'True' || p.on === '1') ? r(P, f.fw.map(p => p.name).join(', ')) : r(F, 'off for ' + f.fw.filter(p => !(p.on === 'True' || p.on === '1')).map(p => p.name).join(', ')) },
  { id: 'win.fw.inbound', cat: 'Network', title: 'Firewall blocks unsolicited inbound connections by default', rationale: 'Default-allow inbound exposes every listening program.', remediation: 'Set the default inbound action to Block (Windows Defender Firewall > Advanced settings > Properties).', compliance: C(['1.3'], ['SC.7']),
    eval: f => !f.fw ? r(NA) : f.fw.some(p => p.inbound === 'Allow') ? r(F, 'Allow on ' + f.fw.filter(p => p.inbound === 'Allow').map(p => p.name).join(', ')) : r(P) },
  { id: 'win.av.on', cat: 'Malware', title: 'Antivirus real-time protection is active', rationale: 'Without real-time scanning, malware runs before anything looks at it.', remediation: 'Turn on Real-time protection in Windows Security, or make sure your third-party antivirus is enabled.', compliance: C(['5.1', '5.2'], ['SI.3']),
    eval: f => { const third = (f.av || []).filter(a => !/defender/i.test(a.name) && ((a.state >> 12) & 1)); if (third.length) return r(P, third.map(a => a.name).join(', ')); if (!f.def) return r(NA, f.defErr); return f.def.rtp ? r(P, 'Microsoft Defender') : r(F, 'Defender real-time protection is off'); } },
  { id: 'win.av.sigs', cat: 'Malware', title: 'Antivirus signatures updated in the last 7 days', rationale: 'Old signatures miss current malware.', remediation: 'Run Windows Update or "Check for updates" in Windows Security > Virus & threat protection.', compliance: C(['5.2'], ['SI.3']),
    eval: f => !f.def || !f.def.av ? r(NA, 'Defender is not the active antivirus') : f.def.sigAge <= 7 ? r(P, f.def.sigAge + ' day(s) old') : r(F, f.def.sigAge + ' days old') },
  { id: 'win.av.tamper', cat: 'Malware', title: 'Defender tamper protection is on', rationale: 'Malware commonly disables Defender first; tamper protection blocks that.', remediation: 'Windows Security > Virus & threat protection settings > Tamper Protection: On.', compliance: C(['5.2'], ['SI.3']),
    eval: f => !f.def || !f.def.av ? r(NA) : f.def.tamper ? r(P) : r(F) },
  { id: 'win.uac', cat: 'Access control', title: 'User Account Control is enabled', rationale: 'With UAC off every program runs with full admin rights.', remediation: 'Control Panel > User Accounts > Change User Account Control settings: do not choose "Never notify".', compliance: C(['2.2'], ['AC.6']),
    eval: f => f.uac === 0 ? r(F, 'EnableLUA = 0') : f.uacPrompt === 0 ? r(F, 'admins are never prompted') : r(P) },
  { id: 'win.rdp', cat: 'Remote access', title: 'Remote Desktop is off or requires Network Level Authentication', rationale: 'RDP without NLA lets anyone reach the logon screen and exploit pre-auth bugs.', remediation: 'Settings > System > Remote Desktop: turn it off, or keep "Require devices to use Network Level Authentication" checked.', compliance: C(['2.2', '8.1.2'], ['AC.7', 'SC.7']),
    eval: f => f.rdpDeny == null ? r(NA) : f.rdpDeny === 1 ? r(P, 'Remote Desktop is off') : f.rdpNla === 1 ? r(P, 'on, NLA required') : r(F, 'on without NLA') },
  { id: 'win.smb1', cat: 'Network', title: 'SMBv1 server is disabled', rationale: 'SMBv1 is the protocol abused by WannaCry and NotPetya.', remediation: 'Run as admin: Set-SmbServerConfiguration -EnableSMB1Protocol $false', compliance: C(['2.2'], ['CM.6']),
    eval: f => f.smb1Server === true || f.smb1 === 1 ? r(F) : f.smb1Server === false || f.smb1 === 0 ? r(P) : r(NA, 'needs admin to check') },
  { id: 'win.smb.sign', cat: 'Network', title: 'SMB server signing is required', rationale: 'Unsigned SMB allows relay and man-in-the-middle attacks.', remediation: 'Run as admin: Set-SmbServerConfiguration -RequireSecuritySignature $true', compliance: C(['2.2'], ['SC.7']),
    eval: f => f.smbSigning === 1 ? r(P) : f.smbSigning === 0 ? r(F) : r(NA) },
  { id: 'win.guest', cat: 'Accounts', title: 'Guest account is disabled', rationale: 'An enabled Guest account allows sign-in without a password.', remediation: 'Run as admin: Disable-LocalUser -Name Guest', compliance: C(['2.2', '8.1.2'], ['AC.2']),
    eval: f => { const g = (f.users || []).find(u => /-501$/.test(u.sid)); return !g ? r(NA) : g.enabled ? r(F, g.name + ' is enabled') : r(P); } },
  { id: 'win.admin500', cat: 'Accounts', title: 'Built-in Administrator account is disabled', rationale: 'The built-in Administrator is a well-known target and is exempt from lockout.', remediation: 'Run as admin: Disable-LocalUser -SID (Get-LocalUser | ? SID -like "*-500").SID', compliance: C(['2.2', '8.1.2'], ['AC.2', 'AC.6']),
    eval: f => { const a = (f.users || []).find(u => /-500$/.test(u.sid)); return !a ? r(NA) : a.enabled ? r(F, a.name + ' is enabled') : r(P); } },
  { id: 'win.pwdreq', cat: 'Accounts', title: 'Every enabled local account requires a password', rationale: 'Accounts that allow a blank password can be used remotely in some configurations.', remediation: 'Set a password for each listed account or disable it.', compliance: C(['8.1.2'], ['IA.4', 'AC.2']),
    eval: f => { if (!f.users) return r(NA); const bad = f.users.filter(u => u.enabled && !u.pwdRequired); return bad.length ? r(F, bad.map(u => u.name).join(', ')) : r(P); } },
  { id: 'win.pwdlen', cat: 'Accounts', title: 'Minimum password length is at least 8', rationale: 'Short passwords fall to guessing in minutes.', remediation: 'Run as admin: net accounts /minpwlen:12', compliance: C(['8.1.2'], ['IA.4']),
    eval: f => f.sec_MinimumPasswordLength == null ? r(NA, 'needs admin') : f.sec_MinimumPasswordLength >= 8 ? r(P, f.sec_MinimumPasswordLength + ' characters') : r(F, f.sec_MinimumPasswordLength + ' characters') },
  { id: 'win.lockout', cat: 'Accounts', title: 'Accounts lock after repeated failed logons', rationale: 'Without a lockout threshold, passwords can be guessed forever.', remediation: 'Run as admin: net accounts /lockoutthreshold:10', compliance: C(['8.1.2', '10.2.4'], ['AC.7']),
    eval: f => f.sec_LockoutBadCount == null ? r(NA, 'needs admin') : f.sec_LockoutBadCount > 0 && f.sec_LockoutBadCount <= 10 ? r(P, 'after ' + f.sec_LockoutBadCount + ' attempts') : r(F, f.sec_LockoutBadCount === 0 ? 'never' : 'after ' + f.sec_LockoutBadCount + ' attempts') },
  { id: 'win.bitlocker', cat: 'Data protection', title: 'System drive is encrypted (BitLocker / device encryption)', rationale: 'A stolen unencrypted disk gives full access to your files and saved credentials.', remediation: 'Settings > Privacy & security > Device encryption (or BitLocker drive encryption).', compliance: C(['3.4'], ['SC.28'], { gdpr: ['IV_32.2'], hipaa: ['164.312.a.1'] }),
    eval: f => f.bitlocker == null ? r(NA, 'needs admin') : f.bitlocker === 1 ? r(P) : r(F) },
  { id: 'win.secureboot', cat: 'Boot', title: 'Secure Boot is on', rationale: 'Secure Boot stops bootkits from loading before Windows.', remediation: 'Enable Secure Boot in your UEFI/BIOS setup.', compliance: C(['2.2'], ['SI.7']),
    eval: (f, ctx) => ctx.secureBoot == null ? r(NA) : ctx.secureBoot ? r(P) : r(F) },
  { id: 'win.updates', cat: 'Patching', title: 'Windows updates installed in the last 45 days', rationale: 'Most attacks use vulnerabilities that already have a patch.', remediation: 'Settings > Windows Update > Check for updates.', compliance: C(['6.2'], ['SI.2']),
    eval: f => f.wuStart === 'Disabled' ? r(F, 'Windows Update service is disabled') : !f.lastPatch ? r(NA) : Date.now() - f.lastPatch < 45 * 86400e3 ? r(P, 'last update ' + new Date(f.lastPatch).toLocaleDateString()) : r(F, 'last update ' + new Date(f.lastPatch).toLocaleDateString()) },
  { id: 'win.remotereg', cat: 'Remote access', title: 'Remote Registry service does not start automatically', rationale: 'Remote Registry lets other machines read and change your registry.', remediation: 'services.msc > Remote Registry > Startup type: Disabled.', compliance: C(['2.2'], ['CM.7']),
    eval: f => !f.remoteReg ? r(NA) : /^Automatic/.test(f.remoteReg) ? r(F, f.remoteReg) : r(P, f.remoteReg) },
  { id: 'win.llmnr', cat: 'Network', title: 'LLMNR name resolution is turned off', rationale: 'LLMNR answers can be spoofed on the local network to capture password hashes.', remediation: 'Group Policy: Computer Configuration > Administrative Templates > Network > DNS Client > Turn off multicast name resolution: Enabled.', compliance: C(['2.2'], ['SC.7']),
    eval: f => f.llmnr === 0 ? r(P) : r(F, 'not disabled by policy') },
  { id: 'win.autorun', cat: 'Malware', title: 'AutoRun is disabled for all drives', rationale: 'AutoRun starts programs from inserted media automatically.', remediation: 'Settings > Bluetooth & devices > AutoPlay: off, or set NoDriveTypeAutoRun = 255.', compliance: C(['5.1'], ['SI.3']),
    eval: f => f.autorun === 255 || f.autorunUser === 255 ? r(P) : r(F, 'NoDriveTypeAutoRun is ' + (f.autorun != null ? f.autorun : 'not set')) },
  { id: 'win.wdigest', cat: 'Credentials', title: 'WDigest does not keep plain-text passwords in memory', rationale: 'With UseLogonCredential = 1, credential dumpers read clear-text passwords.', remediation: 'Set HKLM\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\WDigest UseLogonCredential = 0.', compliance: C(['8.2.1'], ['IA.5']),
    eval: f => f.wdigest === 1 ? r(F) : r(P) },
  { id: 'win.lsappl', cat: 'Credentials', title: 'LSA protection (RunAsPPL) is enabled', rationale: 'Protects the process that holds credentials from being read by other programs.', remediation: 'Windows Security > Device security > Core isolation > Local Security Authority protection: On.', compliance: C(['8.2.1'], ['AC.6']),
    eval: f => f.lsaPpl === 1 || f.lsaPpl === 2 ? r(P) : r(F) },
  { id: 'win.ntlm', cat: 'Credentials', title: 'Only NTLMv2 is sent (LAN Manager level 3 or higher)', rationale: 'LM and NTLMv1 hashes are cracked almost instantly.', remediation: 'Set HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa LmCompatibilityLevel = 5.', compliance: C(['8.2.1'], ['IA.2']),
    eval: f => f.ntlmLevel == null || f.ntlmLevel >= 3 ? r(P, f.ntlmLevel == null ? 'Windows default (3)' : 'level ' + f.ntlmLevel) : r(F, 'level ' + f.ntlmLevel) },
  { id: 'win.psv2', cat: 'Logging', title: 'PowerShell 2.0 engine is removed', rationale: 'PowerShell 2.0 bypasses script logging and AMSI; attackers downgrade to it.', remediation: 'Run as admin: Disable-WindowsOptionalFeature -Online -FeatureName MicrosoftWindowsPowerShellV2Root', compliance: C(['2.2'], ['CM.7']),
    eval: f => f.psv2 ? r(F, 'engine ' + f.psv2 + ' present') : r(P) },
  { id: 'win.pslog', cat: 'Logging', title: 'PowerShell script block logging is on', rationale: 'Records what PowerShell scripts actually run, including decoded malicious scripts.', remediation: 'Group Policy: Administrative Templates > Windows Components > Windows PowerShell > Turn on PowerShell Script Block Logging.', compliance: C(['10.2.2'], ['AU.12']),
    eval: f => f.scriptBlockLog === 1 ? r(P) : r(F, 'not enabled') },
  exposedCheck(),
];

function readSshd() {
  const t = U.readText('/etc/ssh/sshd_config'); if (t == null) return null;
  const o = {};
  for (const line of t.split('\n')) { const m = line.trim().match(/^(\w+)\s+(.+)$/); if (m && !line.trim().startsWith('#') && !(m[1].toLowerCase() in o)) o[m[1].toLowerCase()] = m[2].trim().toLowerCase(); }
  return o;
}
const procVal = p => { const t = U.readText(p); return t == null ? null : t.trim(); };
const LINUX = [
  { id: 'lnx.aslr', cat: 'Kernel', title: 'Address space layout randomization is fully on', rationale: 'ASLR makes memory-corruption exploits much harder.', remediation: 'sysctl -w kernel.randomize_va_space=2 (and persist it in /etc/sysctl.d).', compliance: C(['2.2'], ['SI.16']), eval: () => { const v = procVal('/proc/sys/kernel/randomize_va_space'); return v == null ? r(NA) : v === '2' ? r(P) : r(F, 'value ' + v); } },
  { id: 'lnx.fwd', cat: 'Network', title: 'IP forwarding is off (unless this is a router or container host)', rationale: 'Forwarding turns the machine into a router between networks.', remediation: 'sysctl -w net.ipv4.ip_forward=0 (Docker hosts need it on: ignore there).', compliance: C(['1.3'], ['SC.7']), eval: () => { const v = procVal('/proc/sys/net/ipv4/ip_forward'); return v == null ? r(NA) : v === '0' ? r(P) : r(F, 'on (normal with Docker/VMs)'); } },
  { id: 'lnx.dmesg', cat: 'Kernel', title: 'Kernel log is restricted to root', rationale: 'Kernel messages leak addresses that help exploits.', remediation: 'sysctl -w kernel.dmesg_restrict=1', compliance: C(['2.2'], ['SI.11']), eval: () => { const v = procVal('/proc/sys/kernel/dmesg_restrict'); return v == null ? r(NA) : v === '1' ? r(P) : r(F); } },
  { id: 'lnx.suid', cat: 'Kernel', title: 'Core dumps of setuid programs are disabled', rationale: 'Core dumps of privileged programs can expose secrets.', remediation: 'sysctl -w fs.suid_dumpable=0', compliance: C(['2.2'], ['SI.11']), eval: () => { const v = procVal('/proc/sys/fs/suid_dumpable'); return v == null ? r(NA) : v === '0' ? r(P) : r(F, 'value ' + v); } },
  { id: 'lnx.ssh.root', cat: 'Remote access', title: 'SSH does not allow root to log in with a password', rationale: 'root is the first account every bot tries.', remediation: 'In /etc/ssh/sshd_config set PermitRootLogin no (or prohibit-password) and reload sshd.', compliance: C(['2.2', '8.1.2'], ['AC.6']), eval: () => { const s = readSshd(); if (!s) return r(NA, 'sshd not installed'); const v = s.permitrootlogin || 'prohibit-password'; return v === 'yes' ? r(F, 'PermitRootLogin yes') : r(P, 'PermitRootLogin ' + v); } },
  { id: 'lnx.ssh.pwd', cat: 'Remote access', title: 'SSH uses keys instead of passwords', rationale: 'Password logins are brute-forced around the clock on internet-facing hosts.', remediation: 'Set PasswordAuthentication no in /etc/ssh/sshd_config after installing your key.', compliance: C(['8.2.1'], ['IA.2']), eval: () => { const s = readSshd(); if (!s) return r(NA, 'sshd not installed'); return s.passwordauthentication === 'no' ? r(P) : r(F, 'PasswordAuthentication ' + (s.passwordauthentication || 'yes (default)')); } },
  { id: 'lnx.ssh.empty', cat: 'Remote access', title: 'SSH refuses empty passwords', rationale: 'Accounts without a password must never be reachable over SSH.', remediation: 'Set PermitEmptyPasswords no.', compliance: C(['8.2.1'], ['IA.5']), eval: () => { const s = readSshd(); if (!s) return r(NA); return s.permitemptypasswords === 'yes' ? r(F) : r(P); } },
  { id: 'lnx.shadow', cat: 'Accounts', title: '/etc/shadow is not readable by other users', rationale: 'It holds the password hashes.', remediation: 'chmod 640 /etc/shadow (or 600).', compliance: C(['8.2.1'], ['AC.3']), eval: () => { try { const m = fs.statSync('/etc/shadow').mode; return m & 0o004 ? r(F, 'mode ' + (m & 0o777).toString(8)) : r(P, 'mode ' + (m & 0o777).toString(8)); } catch { return r(NA); } } },
  { id: 'lnx.passwd', cat: 'Accounts', title: '/etc/passwd is not writable by other users', rationale: 'A writable passwd file lets anyone add a root account.', remediation: 'chmod 644 /etc/passwd', compliance: C(['2.2'], ['AC.3']), eval: () => { try { const m = fs.statSync('/etc/passwd').mode; return m & 0o022 ? r(F, 'mode ' + (m & 0o777).toString(8)) : r(P); } catch { return r(NA); } } },
  { id: 'lnx.preload', cat: 'Malware', title: 'No global library preload (/etc/ld.so.preload)', rationale: 'Rootkits use ld.so.preload to inject into every program.', remediation: 'Inspect /etc/ld.so.preload and remove entries you did not add.', compliance: C(['11.5'], ['SI.7']), eval: () => { const t = U.readText('/etc/ld.so.preload'); return t == null || !t.trim() ? r(P) : r(F, t.trim().split('\n').slice(0, 3).join(', ')); } },
  { id: 'lnx.updates', cat: 'Patching', title: 'Automatic security updates are configured', rationale: 'Unpatched packages are the most common way in.', remediation: 'Debian/Ubuntu: apt install unattended-upgrades. Fedora/RHEL: dnf install dnf-automatic && systemctl enable --now dnf-automatic.timer', compliance: C(['6.2'], ['SI.2']), eval: () => { const a = U.readText('/etc/apt/apt.conf.d/20auto-upgrades'); if (a != null) return /Unattended-Upgrade\s+"1"/.test(a) ? r(P) : r(F); if (fs.existsSync('/etc/dnf/automatic.conf')) return fs.existsSync('/etc/systemd/system/timers.target.wants/dnf-automatic.timer') || fs.existsSync('/etc/systemd/system/timers.target.wants/dnf-automatic-install.timer') ? r(P) : r(F, 'dnf-automatic timer not enabled'); return r(NA); } },
  exposedCheck(),
];
const MAC = [
  { id: 'mac.fw', cat: 'Network', title: 'macOS application firewall is on', rationale: 'Blocks unwanted incoming connections.', remediation: 'System Settings > Network > Firewall: On.', compliance: C(['1.1.1'], ['SC.7']), run: async () => { const x = await U.run('/usr/libexec/ApplicationFirewall/socketfilterfw', ['--getglobalstate']); return !x.ok ? r(NA) : /enabled/i.test(x.stdout) ? r(P) : r(F); } },
  { id: 'mac.filevault', cat: 'Data protection', title: 'FileVault disk encryption is on', rationale: 'Protects your data if the Mac is lost or stolen.', remediation: 'System Settings > Privacy & Security > FileVault: Turn On.', compliance: C(['3.4'], ['SC.28']), run: async () => { const x = await U.run('fdesetup', ['status']); return !x.ok ? r(NA) : /FileVault is On/i.test(x.stdout) ? r(P) : r(F); } },
  { id: 'mac.sip', cat: 'Boot', title: 'System Integrity Protection is enabled', rationale: 'SIP stops malware from modifying system files.', remediation: 'Boot to Recovery and run csrutil enable.', compliance: C(['2.2'], ['SI.7']), run: async () => { const x = await U.run('csrutil', ['status']); return !x.ok && !x.stdout ? r(NA) : /enabled/i.test(x.stdout) ? r(P) : r(F); } },
  { id: 'mac.gatekeeper', cat: 'Malware', title: 'Gatekeeper is enabled', rationale: 'Gatekeeper blocks unsigned and unnotarised apps.', remediation: 'sudo spctl --master-enable', compliance: C(['5.1'], ['SI.3']), run: async () => { const x = await U.run('spctl', ['--status']); return /assessments enabled/i.test(x.stdout + x.stderr) ? r(P) : /disabled/i.test(x.stdout + x.stderr) ? r(F) : r(NA); } },
  exposedCheck(),
];

class Sca {
  constructor(file, persist, plat, onChange) {
    this.file = file; this.persist = persist; this.plat = plat; this.onChange = onChange || (() => {});
    this.state = { at: 0, results: [], history: [], err: '' };
    if (persist) { try { const s = JSON.parse(fs.readFileSync(file, 'utf8')); if (s && Array.isArray(s.results)) this.state = Object.assign(this.state, s); } catch { /* first run */ } }
    this.busy = false;
  }
  checks() { return U.IS_WIN ? WIN : process.platform === 'linux' ? LINUX : process.platform === 'darwin' ? MAC : [exposedCheck()]; }
  async run(ctx) {
    if (this.busy) return this.state; this.busy = true;
    try {
      let facts = {};
      if (U.IS_WIN) { try { facts = await this.plat.ctl.request('scafacts', {}, 120000, true) || {}; } catch (e) { this.state.err = e.message; } }
      const prev = new Map(this.state.results.map(x => [x.id, x.result]));
      const out = [];
      for (const c of this.checks()) {
        let res;
        try { res = c.run ? await c.run(facts, ctx) : c.eval(facts, ctx); } catch (e) { res = r(NA, e.message); }
        out.push({ id: c.id, result: res.result, detail: U.trunc(res.detail || '', 300) });
      }
      const first = !this.state.at;
      this.state.results = out; this.state.at = Date.now();
      const s = this.score();
      const today = new Date().toDateString();
      const h = this.state.history.filter(x => new Date(x.at).toDateString() !== today);
      h.push({ at: Date.now(), score: s.score, passed: s.passed, failed: s.failed });
      this.state.history = h.slice(-365);
      if (!first) for (const x of out) { const p = prev.get(x.id); if (p && p !== x.result && x.result !== NA && p !== NA) this.onChange(this.meta(x.id), x); }
      if (this.persist) { try { fs.mkdirSync(path.dirname(this.file), { recursive: true }); fs.writeFileSync(this.file, JSON.stringify(this.state)); } catch { /* ignore */ } }
    } finally { this.busy = false; }
    return this.state;
  }
  meta(id) { const c = this.checks().find(x => x.id === id); return c ? { id: c.id, cat: c.cat, title: c.title, rationale: c.rationale, remediation: c.remediation, compliance: c.compliance } : { id }; }
  score() {
    const passed = this.state.results.filter(x => x.result === P).length, failed = this.state.results.filter(x => x.result === F).length;
    return { score: passed + failed ? Math.round(100 * passed / (passed + failed)) : null, passed, failed, na: this.state.results.length - passed - failed };
  }
  view() {
    return Object.assign({ at: this.state.at, err: this.state.err, history: this.state.history, busy: this.busy, policy: U.IS_WIN ? 'RigWatch Windows baseline (CIS-inspired)' : process.platform === 'linux' ? 'RigWatch Linux baseline (CIS-inspired)' : 'RigWatch macOS baseline', host: os.hostname() },
      this.score(), { checks: this.state.results.map(x => Object.assign(this.meta(x.id), x)) });
  }
}

module.exports = { Sca, RISKY_PORTS };
