'use strict';
// Detection rules in the spirit of Wazuh: every event gets a rule id, a level (0-15), groups and
// MITRE ATT&CK technique ids. This file is pure logic (no I/O) so it is unit-tested.
const U = require('../util');

const RULES = {};
function R(id, level, description, groups, mitre) { RULES[id] = { id, level, description, groups, mitre: mitre || [] }; }

// 1xxx system
R(1001, 2, 'RigWatch started', ['rigwatch']);
R(1002, 3, 'System boot', ['system']);
R(1003, 3, 'System shutdown or restart requested', ['system']);
R(1004, 6, 'Unexpected shutdown (crash or power loss)', ['system']);
// 2xxx authentication
R(2001, 3, 'Successful logon', ['authentication_success'], ['T1078']);
R(2002, 6, 'Remote Desktop logon', ['authentication_success', 'rdp'], ['T1021.001']);
R(2003, 5, 'Network logon from another computer', ['authentication_success'], ['T1078']);
R(2004, 5, 'Logon failure', ['authentication_failed'], ['T1110']);
R(2005, 9, 'Account locked out', ['authentication_failures'], ['T1110']);
R(2006, 4, 'Logon with explicit credentials', ['authentication_success'], ['T1078']);
R(2007, 2, 'Logoff', ['logoff']);
R(2008, 2, 'Workstation unlocked', ['authentication_success']);
R(2009, 2, 'Workstation locked', ['session']);
R(2010, 10, 'Multiple logon failures from the same source (brute force)', ['authentication_failures', 'brute_force'], ['T1110']);
R(2011, 12, 'Successful logon after multiple failures', ['authentication_success', 'brute_force'], ['T1110']);
R(2012, 7, 'First logon from a new source address', ['authentication_success', 'new_source'], ['T1078']);
R(2013, 10, 'Logon from a public internet address', ['authentication_success', 'remote_access'], ['T1133']);
R(2014, 3, 'Remote Desktop session reconnected', ['rdp', 'session'], ['T1021.001']);
R(2015, 2, 'Remote Desktop session disconnected', ['rdp', 'session']);
R(2016, 5, 'Remote Desktop authentication succeeded', ['rdp', 'authentication_success'], ['T1021.001']);
R(2020, 5, 'SSH login accepted', ['sshd', 'authentication_success'], ['T1021.004']);
R(2021, 5, 'SSH authentication failed', ['sshd', 'authentication_failed'], ['T1110']);
R(2022, 5, 'SSH login attempt for a user that does not exist', ['sshd', 'authentication_failed', 'invalid_login'], ['T1110']);
R(2030, 3, 'Command run with sudo', ['sudo'], ['T1548.003']);
R(2031, 5, 'sudo authentication failure', ['sudo', 'authentication_failed'], ['T1548.003']);
R(2032, 3, 'User session opened', ['authentication_success', 'session']);
R(2033, 2, 'User session closed', ['session', 'logoff']);
// 3xxx accounts
R(3001, 8, 'User account created', ['account_changed', 'adduser'], ['T1136.001']);
R(3002, 8, 'User account deleted', ['account_changed'], ['T1531']);
R(3003, 5, 'User account enabled', ['account_changed'], ['T1098']);
R(3004, 5, 'User account disabled', ['account_changed'], ['T1531']);
R(3005, 6, 'Password reset by another account', ['account_changed'], ['T1098']);
R(3006, 8, 'Account added to a security group', ['account_changed', 'group_changed'], ['T1098']);
R(3007, 12, 'Account added to the Administrators group', ['account_changed', 'group_changed', 'privilege_escalation'], ['T1098']);
// 4xxx system integrity
R(4001, 12, 'Security audit log cleared', ['log_cleared'], ['T1070.001']);
R(4002, 10, 'Event log cleared', ['log_cleared'], ['T1070.001']);
R(4003, 9, 'Audit policy changed', ['policy_changed'], ['T1562.002']);
R(4004, 8, 'New service installed', ['service_installed'], ['T1543.003']);
R(4005, 7, 'Scheduled task created', ['scheduled_task'], ['T1053.005']);
// 5xxx defenses
R(5001, 12, 'Malware detected by Microsoft Defender', ['malware', 'defender']);
R(5002, 8, 'Microsoft Defender acted on malware', ['malware', 'defender']);
R(5003, 12, 'Defender protection turned off', ['defender', 'defense_evasion'], ['T1562.001']);
R(5004, 6, 'Defender configuration changed', ['defender'], ['T1562.001']);
R(5005, 4, 'Firewall rule added or changed', ['firewall'], ['T1562.004']);
R(5006, 4, 'Firewall rule deleted', ['firewall'], ['T1562.004']);
R(5007, 7, 'Firewall setting changed', ['firewall'], ['T1562.004']);
// 6xxx network
R(6001, 3, 'New listening port', ['network', 'port_open']);
R(6002, 6, 'Port open on all network interfaces', ['network', 'port_open'], ['T1133']);
R(6003, 1, 'Listening port closed', ['network']);
R(6004, 2, 'First contact with a remote host', ['network', 'new_host']);
R(6005, 6, 'Inbound connection from the internet', ['network', 'inbound'], ['T1133']);
R(6006, 12, 'Traffic with a known-malicious address (threat feed)', ['network', 'threat_intel'], ['T1071']);
R(6007, 3, 'Inbound packets dropped by the firewall', ['network', 'firewall_drop']);
R(6008, 10, 'Port scan detected', ['network', 'port_scan', 'recon'], ['T1046']);
R(6009, 5, 'New device on the local network', ['network', 'lan']);
R(6010, 3, 'Address blocked', ['active_response', 'firewall']);
R(6011, 3, 'Address unblocked', ['active_response', 'firewall']);
R(6012, 8, 'Address blocked automatically (active response)', ['active_response', 'firewall']);
// 7xxx processes
R(7001, 3, 'Program ran for the first time', ['process', 'new_program'], ['T1204']);
R(7002, 8, 'Suspicious process started', ['process', 'suspicious'], ['T1036']);
// 8xxx RigWatch
R(8001, 7, 'Monitoring alert fired', ['rigwatch', 'alert']);
R(8002, 7, 'Security finding', ['rigwatch', 'finding']);
R(8003, 3, 'Action taken in RigWatch', ['rigwatch', 'audit']);
// 9xxx configuration assessment + file integrity
R(9001, 7, 'Configuration check failed', ['sca'], []);
R(9002, 3, 'Configuration check passed', ['sca'], []);
R(9101, 5, 'File added to a monitored location', ['syscheck', 'syscheck_entry_added']);
R(9102, 7, 'Monitored file modified', ['syscheck', 'syscheck_entry_modified'], ['T1565.001']);
R(9103, 5, 'Monitored file deleted', ['syscheck', 'syscheck_entry_deleted'], ['T1070.004']);
R(9104, 8, 'Autostart entry added or changed', ['syscheck', 'registry', 'persistence'], ['T1547.001']);
R(9105, 5, 'Autostart entry removed', ['syscheck', 'registry']);

const TACTICS = ['Initial Access', 'Execution', 'Persistence', 'Privilege Escalation', 'Defense Evasion', 'Credential Access', 'Discovery', 'Lateral Movement', 'Collection', 'Command and Control', 'Exfiltration', 'Impact'];
const TECH_TACTICS = {
  T1078: ['Initial Access', 'Persistence', 'Privilege Escalation', 'Defense Evasion'], T1110: ['Credential Access'], 'T1021.001': ['Lateral Movement'], 'T1021.004': ['Lateral Movement'],
  T1133: ['Initial Access', 'Persistence'], 'T1136.001': ['Persistence'], T1531: ['Impact'], T1098: ['Persistence', 'Privilege Escalation'], 'T1070.001': ['Defense Evasion'], 'T1070.004': ['Defense Evasion'],
  'T1562.002': ['Defense Evasion'], 'T1543.003': ['Persistence', 'Privilege Escalation'], 'T1053.005': ['Execution', 'Persistence', 'Privilege Escalation'], 'T1562.001': ['Defense Evasion'],
  'T1562.004': ['Defense Evasion'], T1071: ['Command and Control'], T1046: ['Discovery'], T1204: ['Execution'], T1036: ['Defense Evasion'], 'T1548.003': ['Privilege Escalation', 'Defense Evasion'],
  'T1565.001': ['Impact'], 'T1547.001': ['Persistence', 'Privilege Escalation'],
};

// Compliance tags per rule group, in the style of the Wazuh ruleset (orientation, not certification).
const COMPLIANCE = {
  pci_dss: { name: 'PCI DSS', reqs: { '1.1.1': 'Approve and test network connections', '1.3': 'Prohibit direct public access', '2.2': 'Configuration standards', '5.1': 'Deploy anti-virus software', '5.2': 'Anti-virus current and logging', '8.1.2': 'Control user IDs and credentials', '10.2.2': 'Log actions by privileged users', '10.2.4': 'Log invalid access attempts', '10.2.5': 'Log use of identification and authentication', '10.2.7': 'Log creation and deletion of system objects', '10.5.2': 'Protect audit trails from modification', '10.6': 'Review logs and security events', '11.4': 'Intrusion detection', '11.5': 'Change detection (file integrity)' } },
  gdpr: { name: 'GDPR', reqs: { 'II_5.1.f': 'Integrity and confidentiality of personal data', 'IV_32.2': 'Assess risk of processing (access, alteration)', 'IV_35.7.d': 'Measures to address risks, safeguards', 'IV_33': 'Notification of a personal data breach' } },
  nist_800_53: { name: 'NIST 800-53', reqs: { 'AC.2': 'Account management', 'AC.6': 'Least privilege', 'AC.7': 'Unsuccessful logon attempts', 'AU.6': 'Audit review, analysis and reporting', 'AU.9': 'Protection of audit information', 'AU.12': 'Audit generation', 'AU.14': 'Session audit', 'CM.6': 'Configuration settings', 'IA.4': 'Identifier management', 'SC.7': 'Boundary protection', 'SI.3': 'Malicious code protection', 'SI.4': 'System monitoring', 'SI.5': 'Security alerts and advisories', 'SI.7': 'Software and information integrity' } },
  hipaa: { name: 'HIPAA', reqs: { '164.312.a.1': 'Access control', '164.312.b': 'Audit controls', '164.312.c.1': 'Integrity', '164.312.d': 'Person or entity authentication', '164.308.a.5.ii.C': 'Log-in monitoring', '164.308.a.1.ii.D': 'Information system activity review' } },
};
const GROUP_COMPLIANCE = {
  authentication_success: { pci_dss: ['10.2.5'], gdpr: ['IV_32.2'], nist_800_53: ['AC.7', 'AU.14'], hipaa: ['164.312.b', '164.312.d'] },
  authentication_failed: { pci_dss: ['10.2.4', '10.2.5'], gdpr: ['IV_35.7.d', 'IV_32.2'], nist_800_53: ['AU.14', 'AC.7'], hipaa: ['164.312.b', '164.308.a.5.ii.C'] },
  authentication_failures: { pci_dss: ['10.2.4', '10.2.5', '11.4'], gdpr: ['IV_35.7.d', 'IV_32.2'], nist_800_53: ['AU.14', 'AC.7', 'SI.4'], hipaa: ['164.312.b', '164.308.a.5.ii.C'] },
  account_changed: { pci_dss: ['8.1.2', '10.2.5'], gdpr: ['IV_35.7.d', 'IV_32.2'], nist_800_53: ['AC.2', 'IA.4', 'AU.12'], hipaa: ['164.312.a.1', '164.312.b'] },
  privilege_escalation: { pci_dss: ['10.2.2', '10.2.5'], nist_800_53: ['AC.6', 'AC.2'], gdpr: ['IV_32.2'], hipaa: ['164.312.a.1'] },
  sudo: { pci_dss: ['10.2.2', '10.2.5'], nist_800_53: ['AC.6', 'AU.14'], hipaa: ['164.312.b'] },
  log_cleared: { pci_dss: ['10.5.2'], gdpr: ['II_5.1.f'], nist_800_53: ['AU.9'], hipaa: ['164.312.b'] },
  policy_changed: { pci_dss: ['10.6'], gdpr: ['IV_35.7.d'], nist_800_53: ['AU.6', 'CM.6'], hipaa: ['164.312.b'] },
  service_installed: { pci_dss: ['10.2.7'], nist_800_53: ['AU.12', 'SI.4'], gdpr: ['IV_35.7.d'] },
  scheduled_task: { pci_dss: ['10.2.7'], nist_800_53: ['AU.12', 'SI.4'] },
  malware: { pci_dss: ['5.1', '5.2', '11.4'], gdpr: ['IV_35.7.d', 'IV_33'], nist_800_53: ['SI.3', 'SI.4'], hipaa: ['164.312.b', '164.308.a.1.ii.D'] },
  defense_evasion: { pci_dss: ['5.2', '10.6'], nist_800_53: ['SI.3', 'SI.4'], gdpr: ['IV_35.7.d'] },
  firewall: { pci_dss: ['1.1.1', '1.3'], nist_800_53: ['SC.7'], gdpr: ['IV_35.7.d'] },
  inbound: { pci_dss: ['1.3', '11.4'], nist_800_53: ['SC.7', 'SI.4'], gdpr: ['IV_35.7.d'] },
  port_open: { pci_dss: ['1.3'], nist_800_53: ['SC.7'] },
  port_scan: { pci_dss: ['11.4'], nist_800_53: ['SI.4'], gdpr: ['IV_35.7.d'], hipaa: ['164.312.b'] },
  firewall_drop: { pci_dss: ['1.3', '11.4'], nist_800_53: ['SC.7', 'SI.4'] },
  threat_intel: { pci_dss: ['11.4'], nist_800_53: ['SI.4', 'SI.5'], gdpr: ['IV_35.7.d'], hipaa: ['164.308.a.1.ii.D'] },
  active_response: { pci_dss: ['11.4'], nist_800_53: ['SI.4', 'SC.7'] },
  syscheck: { pci_dss: ['11.5'], gdpr: ['II_5.1.f'], nist_800_53: ['SI.7'], hipaa: ['164.312.c.1'] },
  sca: { pci_dss: ['2.2'], nist_800_53: ['CM.6'], gdpr: ['IV_35.7.d'], hipaa: ['164.312.b'] },
  suspicious: { pci_dss: ['11.4'], nist_800_53: ['SI.4'], gdpr: ['IV_35.7.d'] },
  new_program: { pci_dss: ['11.5'], nist_800_53: ['SI.7', 'CM.6'] },
  audit: { pci_dss: ['10.2.2'], nist_800_53: ['AU.12'], hipaa: ['164.312.b'] },
  rdp: { pci_dss: ['10.2.5', '8.1.2'], nist_800_53: ['AC.7', 'AU.14'], hipaa: ['164.312.d'] },
};
/** { pci_dss: [...], gdpr: [...], ... } for a rule */
function complianceOf(rule) {
  const out = {};
  for (const g of rule.groups || []) for (const [fw, reqs] of Object.entries(GROUP_COMPLIANCE[g] || {})) { out[fw] = out[fw] || []; for (const r of reqs) if (!out[fw].includes(r)) out[fw].push(r); }
  return out;
}

const MITRE = {
  T1078: 'Valid Accounts', T1110: 'Brute Force', 'T1021.001': 'Remote Desktop Protocol', 'T1021.004': 'SSH', T1133: 'External Remote Services',
  'T1136.001': 'Create Local Account', T1531: 'Account Access Removal', T1098: 'Account Manipulation', 'T1070.001': 'Clear Windows Event Logs',
  'T1562.002': 'Disable Windows Event Logging', 'T1543.003': 'Windows Service', 'T1053.005': 'Scheduled Task', 'T1562.001': 'Disable or Modify Tools',
  'T1562.004': 'Disable or Modify System Firewall', T1071: 'Application Layer Protocol', T1046: 'Network Service Discovery', T1204: 'User Execution',
  T1036: 'Masquerading', 'T1548.003': 'Sudo and Sudo Caching', 'T1565.001': 'Stored Data Manipulation', 'T1070.004': 'File Deletion', 'T1547.001': 'Registry Run Keys / Startup Folder',
};

const SEVS = ['info', 'low', 'medium', 'high', 'critical'];
/** level -> band index 0..4 (info, low, medium, high, critical) */
const bandOf = lv => (lv >= 12 ? 4 : lv >= 10 ? 3 : lv >= 7 ? 2 : lv >= 4 ? 1 : 0);
const sevOf = lv => SEVS[bandOf(lv)];

/** Build an event. f: { ip, user, process, msg, location, data, level } */
function mk(ruleId, ts, f = {}) {
  const r = RULES[ruleId];
  const ev = { ts: Math.round(ts), rule: { id: r.id, level: f.level != null ? f.level : r.level, description: r.description, groups: r.groups } };
  if (r.mitre.length) ev.rule.mitre = r.mitre;
  if (f.ip) ev.ip = f.ip;
  if (f.user) ev.user = f.user;
  if (f.process) ev.process = f.process;
  ev.msg = f.msg || r.description;
  if (f.location) ev.location = f.location;
  if (f.data) { const d = {}; for (const [k, v] of Object.entries(f.data)) if (v !== '' && v != null) d[k] = v; if (Object.keys(d).length) ev.data = d; }
  return ev;
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const SYS_SID = /^S-1-5-(18|19|20)$/;
const SVC_USER = /^(DWM-\d+|UMFD-\d+|ANONYMOUS LOGON|LOCAL SERVICE|NETWORK SERVICE|SYSTEM)$|\$$/i;
const cleanIp = v => { v = String(v || '').trim().replace(/^::ffff:/i, ''); return !v || v === '-' || v === 'LOCAL' ? '' : v; };
const isLocalIp = ip => !ip || ['loopback', 'any'].includes(U.ipKind(ip));
const base = p => String(p || '').split(/[\\/]/).pop();
const acct = (dom, user) => { user = String(user || '').trim(); dom = String(dom || '').trim(); return !user || user === '-' ? '' : dom && dom !== '-' && !/^(NT AUTHORITY|Window Manager|Font Driver Host)$/i.test(dom) ? dom + '\\' + user : user; };
const hex = v => { v = String(v || ''); return /^\d+$/.test(v) ? '0x' + (+v).toString(16).padStart(8, '0') : v.toLowerCase(); };
const LOGON_TYPES = { 2: 'interactive', 3: 'network', 4: 'batch', 5: 'service', 7: 'unlock', 8: 'network (cleartext)', 9: 'new credentials', 10: 'remote desktop', 11: 'cached interactive', 12: 'cached remote desktop', 13: 'cached unlock' };
const FAIL_REASONS = {
  '0xc0000064': 'user does not exist', '0xc000006a': 'wrong password', '0xc0000234': 'account locked', '0xc0000072': 'account disabled',
  '0xc000006f': 'outside allowed hours', '0xc0000070': 'workstation not allowed', '0xc0000193': 'account expired', '0xc0000071': 'password expired',
  '0xc0000133': 'clock out of sync', '0xc0000224': 'password must change', '0xc000015b': 'logon type not granted', '0xc000006d': 'bad user name or password',
  '0xc000006e': 'account restriction', '0xc0000413': 'authentication firewall',
};
const NOISY_EXPLICIT = /^(svchost|lsass|services|consent|winlogon|taskhostw|wininit|smss)\.exe$/i;

// ---------------------------------------------------------------------------
// Windows event log -> events.  raw = { k, id, rid, t, p:[string...], m? }
// ctx = { admins: Set(logonId) } (filled from 4672 in the same batch)
// ---------------------------------------------------------------------------
function fromWin(raw, ctx = {}) {
  const p = raw.p || [], t = raw.t || Date.now(), id = raw.id;
  const loc = (raw.k && raw.k.startsWith('sec') ? 'Security' : { sys: 'System', def: 'Defender', fw: 'Firewall', rdp: 'RemoteDesktop', ssh: 'OpenSSH' }[raw.k] || raw.k) + '/' + id;
  const msg = raw.m || '';
  switch (loc.split('/')[0] + ':' + id) {
    case 'Security:4624': {
      const type = +p[8], sid = p[4], user = p[5], ip = cleanIp(p[18]);
      if (SYS_SID.test(sid) || sid === 'S-1-5-7' || SVC_USER.test(user || '') || [0, 4, 5].includes(type)) return [];
      if ((type === 3 || type === 8) && isLocalIp(ip)) return [];
      const rule = type === 10 || type === 12 ? 2002 : type === 3 || type === 8 ? 2003 : type === 7 || type === 13 ? 2008 : 2001;
      const admin = (ctx.admins && ctx.admins.has(p[7])) || p[26] === '%%1842';
      const who = acct(p[6], user);
      return [mk(rule, t, { user: who, ip, process: base(p[17]), location: loc, msg: who + ' signed in (' + (LOGON_TYPES[type] || 'type ' + type) + (ip ? ' from ' + ip : '') + ')' + (admin ? ' with admin rights' : ''), data: { logonType: type, logonId: p[7], admin: admin || undefined, workstation: p[11] !== '-' ? p[11] : '', auth: p[10] } })];
    }
    case 'Security:4625': {
      const type = +p[10], ip = cleanIp(p[19]), who = acct(p[6], p[5]), sub = hex(p[9]), st = hex(p[7]);
      const reason = FAIL_REASONS[sub] || FAIL_REASONS[st] || sub || st;
      return [mk(2004, t, { user: who, ip, process: base(p[18]), location: loc, msg: 'Failed logon for ' + (who || '(unknown)') + (ip ? ' from ' + ip : '') + ': ' + reason, data: { logonType: type, reason, status: st, subStatus: sub, workstation: p[13] !== '-' ? p[13] : '' } })];
    }
    case 'Security:4634': case 'Security:4647': {
      const sid = p[0], user = p[1];
      if (SYS_SID.test(sid) || SVC_USER.test(user || '')) return [];
      const who = acct(p[2], user);
      return [mk(2007, t, { user: who, location: loc, msg: who + ' signed out', data: { logonId: p[3], logonType: id === 4634 ? +p[4] : undefined } })];
    }
    case 'Security:4648': {
      const proc = base(p[11]), target = acct(p[6], p[5]);
      if (SYS_SID.test(p[0]) || NOISY_EXPLICIT.test(proc) || /\$$/.test(p[5] || '') || !p[5] || p[5] === '-') return [];
      const ip = cleanIp(p[12]);
      return [mk(2006, t, { user: target, ip, process: proc, location: loc, msg: acct(p[2], p[1]) + ' used the credentials of ' + target + (p[8] && p[8] !== 'localhost' ? ' for ' + p[8] : '') + (proc ? ' (' + proc + ')' : ''), data: { subject: acct(p[2], p[1]), server: p[8] } })];
    }
    case 'Security:4720': return [mk(3001, t, { user: acct(p[1], p[0]), location: loc, msg: 'Account ' + acct(p[1], p[0]) + ' created by ' + acct(p[5], p[4]), data: { by: acct(p[5], p[4]) } })];
    case 'Security:4726': return [mk(3002, t, { user: acct(p[1], p[0]), location: loc, msg: 'Account ' + acct(p[1], p[0]) + ' deleted by ' + acct(p[5], p[4]), data: { by: acct(p[5], p[4]) } })];
    case 'Security:4722': return [mk(3003, t, { user: acct(p[1], p[0]), location: loc, msg: 'Account ' + acct(p[1], p[0]) + ' enabled by ' + acct(p[5], p[4]), data: { by: acct(p[5], p[4]) } })];
    case 'Security:4725': return [mk(3004, t, { user: acct(p[1], p[0]), location: loc, msg: 'Account ' + acct(p[1], p[0]) + ' disabled by ' + acct(p[5], p[4]), data: { by: acct(p[5], p[4]) } })];
    case 'Security:4724': {
      if (p[0] === p[4]) return [];
      return [mk(3005, t, { user: acct(p[1], p[0]), location: loc, msg: 'Password of ' + acct(p[1], p[0]) + ' reset by ' + acct(p[5], p[4]), data: { by: acct(p[5], p[4]) } })];
    }
    case 'Security:4728': case 'Security:4732': case 'Security:4756': {
      const member = p[0] && p[0] !== '-' ? p[0] : p[1], group = acct(p[3], p[2]), admins = p[4] === 'S-1-5-32-544';
      return [mk(admins ? 3007 : 3006, t, { user: member, location: loc, msg: member + ' added to ' + group + ' by ' + acct(p[7], p[6]), data: { group, by: acct(p[7], p[6]) } })];
    }
    case 'Security:4740': return [mk(2005, t, { user: p[0], location: loc, msg: 'Account ' + p[0] + ' locked out' + (p[1] ? ' (caller ' + p[1] + ')' : ''), data: { caller: p[1] } })];
    case 'Security:4719': return [mk(4003, t, { user: acct(p[2], p[1]), location: loc, msg: 'Audit policy changed by ' + acct(p[2], p[1]) })];
    case 'Security:1102': return [mk(4001, t, { user: acct(p[2], p[1]), location: loc, msg: 'Security log cleared by ' + (acct(p[2], p[1]) || 'unknown') })];
    case 'Security:4697': return [mk(4004, t, { user: acct(p[2], p[1]), location: loc, msg: 'Service "' + p[4] + '" installed by ' + acct(p[2], p[1]), data: { service: p[4], image: p[5] } })];
    case 'Security:4698': return [mk(4005, t, { user: acct(p[2], p[1]), location: loc, msg: 'Scheduled task ' + p[4] + ' created by ' + acct(p[2], p[1]), data: { task: p[4] } })];
    case 'Security:4778': case 'Security:4779': {
      const ip = cleanIp(p[5]);
      return [mk(id === 4778 ? 2014 : 2015, t, { user: acct(p[1], p[0]), ip, location: loc, msg: acct(p[1], p[0]) + (id === 4778 ? ' reconnected' : ' disconnected') + ' (' + p[3] + (p[4] && p[4] !== 'Unknown' ? ' from ' + p[4] : '') + (ip ? ' ' + ip : '') + ')', data: { session: p[3], client: p[4] } })];
    }
    case 'Security:4800': case 'Security:4801': return [mk(id === 4800 ? 2009 : 2008, t, { user: acct(p[2], p[1]), location: loc, msg: acct(p[2], p[1]) + (id === 4800 ? ' locked the workstation' : ' unlocked the workstation') })];
    case 'System:7045': {
      if (/^(Windows Defender|Microsoft Defender)/i.test(p[0] || '')) return [];
      return [mk(4004, t, { location: loc, user: p[4], msg: 'Service "' + p[0] + '" installed (' + (p[3] || '') + ')', data: { service: p[0], image: p[1], account: p[4] } })];
    }
    case 'System:104': return [mk(4002, t, { location: loc, user: p[0], msg: 'Event log cleared' + (p[2] ? ': ' + p[2] : '') + (p[0] ? ' by ' + acct(p[1], p[0]) : ''), data: { text: msg ? U.trunc(msg, 200) : '' } })];
    case 'System:1074': return [mk(1003, t, { location: loc, user: p[6], process: base(p[0]), msg: (p[4] || 'Shutdown') + ' requested by ' + (base(p[0]) || 'unknown') + (p[6] ? ' for ' + p[6] : '') + (p[2] ? ': ' + p[2] : ''), data: { reason: p[2], comment: p[5] } })];
    case 'System:6005': return [mk(1002, t, { location: loc, msg: 'System started' })];
    case 'System:41': return [mk(1004, t, { location: loc, msg: 'The system restarted without shutting down cleanly' })];
    case 'Defender:1116': return [mk(5001, t, { location: loc, user: p[19], process: base(p[18]), msg: 'Defender detected ' + (p[7] || 'malware') + (p[21] ? ' in ' + U.trunc(p[21], 160) : ''), data: { threat: p[7], severity: p[9], path: p[21], text: msg ? U.trunc(msg, 300) : '' } })];
    case 'Defender:1117': return [mk(5002, t, { location: loc, user: p[19], msg: 'Defender acted on ' + (p[7] || 'a threat') + (p[30] ? ': ' + p[30] : ''), data: { threat: p[7], path: p[21], action: p[30], text: msg ? U.trunc(msg, 300) : '' } })];
    case 'Defender:5001': return [mk(5003, t, { location: loc, msg: 'Defender real-time protection was turned off' })];
    case 'Defender:5010': return [mk(5003, t, { location: loc, msg: 'Defender scanning for malware was turned off' })];
    case 'Defender:5012': return [mk(5003, t, { location: loc, msg: 'Defender scanning for viruses was turned off' })];
    case 'Defender:5007': {
      // routine setting churn is noise; exclusions and switched-off protections are what attackers do
      const nv = String(p[3] || ''), ov = String(p[2] || ''), txt = nv || ov;
      if (/\\Exclusions\\/i.test(txt)) return [mk(5004, t, { location: loc, level: 10, msg: 'Defender exclusion ' + (nv ? 'added or changed' : 'removed') + ': ' + U.trunc(txt.replace(/^.*\\Exclusions\\/i, ''), 200), data: { old: U.trunc(ov, 300), new: U.trunc(nv, 300) } })];
      if (/Disable(RealtimeMonitoring|AntiSpyware|BehaviorMonitoring|IOAVProtection|ScriptScanning|OnAccessProtection)\s*=\s*0x1\b/i.test(nv)) return [mk(5003, t, { location: loc, msg: 'Defender protection switched off: ' + U.trunc(nv.replace(/^.*\\/, ''), 160), data: { new: U.trunc(nv, 300) } })];
      return [];
    }
    case 'Firewall:2003': return [mk(5007, t, { location: loc, msg: 'A Windows Firewall setting changed', data: { setting: p[1], value: p[3] } })];
    case 'Firewall:2004': case 'Firewall:2005': case 'Firewall:2097': case 'Firewall:2099': {
      const by = base(p[22]);
      if (/^svchost\.exe$/i.test(by) || /^RigWatch/.test(p[1] || '')) return [];
      return [mk(5005, t, { location: loc, process: by, msg: 'Firewall rule "' + p[1] + '" ' + (id === 2004 || id === 2097 ? 'added' : 'changed') + (by ? ' by ' + by : ''), data: { rule: p[1], app: p[3], direction: p[5] === '1' ? 'in' : p[5] === '2' ? 'out' : p[5] } })];
    }
    case 'Firewall:2006': case 'Firewall:2052': {
      const by = base(p[3]);
      if (/^svchost\.exe$/i.test(by) || /^RigWatch/.test(p[1] || '')) return [];
      return [mk(5006, t, { location: loc, process: by, msg: 'Firewall rule "' + p[1] + '" deleted' + (by ? ' by ' + by : ''), data: { rule: p[1] } })];
    }
    case 'RemoteDesktop:1149': {
      const ip = cleanIp(p[2]), who = acct(p[1], p[0]);
      return [mk(2016, t, { user: who, ip, location: loc, msg: 'Remote Desktop authentication for ' + who + (ip ? ' from ' + ip : '') })];
    }
    case 'OpenSSH:4': return fromAuthLine('sshd', msg, t, loc);
  }
  return [];
}

// ---------------------------------------------------------------------------
// Linux / OpenSSH auth lines (journal MESSAGE or syslog text)
// ---------------------------------------------------------------------------
function fromAuthLine(ident, msg, ts, location) {
  msg = String(msg || '').trim(); ident = String(ident || '');
  const loc = location || ident;
  let m;
  if (/^sshd/.test(ident)) {
    if ((m = msg.match(/^Accepted (\S+) for (\S+) from (\S+) port (\d+)/))) return [mk(2020, ts, { user: m[2], ip: cleanIp(m[3]), location: loc, msg: 'SSH login for ' + m[2] + ' from ' + m[3] + ' (' + m[1] + ')', data: { method: m[1], port: +m[4] } })];
    if ((m = msg.match(/^Failed (\S+) for (invalid user )?(\S*) from (\S+) port (\d+)/))) {
      if (m[2]) return []; // counted by the "Invalid user" line
      return [mk(2021, ts, { user: m[3], ip: cleanIp(m[4]), location: loc, msg: 'SSH ' + m[1] + ' failed for ' + m[3] + ' from ' + m[4], data: { method: m[1], port: +m[5] } })];
    }
    if ((m = msg.match(/^Invalid user (\S*) from (\S+)(?: port (\d+))?/))) return [mk(2022, ts, { user: m[1], ip: cleanIp(m[2]), location: loc, msg: 'SSH login attempt for unknown user ' + (m[1] || '(empty)') + ' from ' + m[2], data: { port: m[3] ? +m[3] : undefined } })];
    return [];
  }
  if (ident === 'sudo') {
    if ((m = msg.match(/^\s*(\S+) : (?:(\d+) incorrect password attempts? ; )?TTY=(\S+) ; PWD=(.+?) ; USER=(\S+) ; (?:.*?; )?COMMAND=(.*)$/))) {
      const bad = m[2] ? +m[2] : 0;
      return [mk(bad ? 2031 : 2030, ts, { user: m[1], location: loc, msg: m[1] + (bad ? ' failed sudo ' + bad + 'x for ' : ' ran as ' + m[5] + ': ') + U.trunc(m[6], 200), data: { runAs: m[5], tty: m[3], cwd: m[4], command: U.trunc(m[6], 300), attempts: bad || undefined } })];
    }
    if ((m = msg.match(/pam_unix\(sudo:auth\): authentication failure;.*\buser=(\S+)/))) return [mk(2031, ts, { user: m[1], location: loc, msg: 'sudo password failure for ' + m[1] })];
    return [];
  }
  if (ident === 'systemd-logind') {
    if ((m = msg.match(/^New session (\S+) of user (\S+?)\.?$/))) return [mk(2032, ts, { user: m[2], location: loc, msg: m[2] + ' opened session ' + m[1], data: { session: m[1] } })];
    if ((m = msg.match(/^Removed session (\S+?)\.?$/))) return [mk(2033, ts, { location: loc, msg: 'Session ' + m[1] + ' closed', data: { session: m[1] } })];
    return [];
  }
  if (ident === 'su' && (m = msg.match(/session opened for user (\S+?)(?:\(uid=\d+\))? by (\S+?)(?:\(uid=\d+\))?$/))) return [mk(2032, ts, { user: m[1], location: loc, msg: m[2] + ' switched to ' + m[1] + ' with su', data: { by: m[2], via: 'su' } })];
  return [];
}

const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
/** "Nov 13 10:00:01 host sshd[123]: msg" or ISO-timestamped rsyslog lines -> { ts, ident, msg } */
function parseSyslog(line, now = Date.now()) {
  const m = String(line).match(/^(?:(\w{3})\s+(\d{1,2}) (\d\d):(\d\d):(\d\d)|(\d{4}-\d\d-\d\dT[\d:.]+(?:Z|[+-]\d\d:?\d\d)?))\s+\S+\s+([\w.@/-]+?)(?:\[\d+\])?:\s?(.*)$/);
  if (!m) return null;
  let ts;
  if (m[6]) ts = Date.parse(m[6]);
  else {
    const d = new Date(now); d.setMonth(MONTHS[m[1]] != null ? MONTHS[m[1]] : 0, +m[2]); d.setHours(+m[3], +m[4], +m[5], 0);
    if (d.getTime() > now + 86400e3) d.setFullYear(d.getFullYear() - 1);
    ts = d.getTime();
  }
  return Number.isFinite(ts) ? { ts, ident: m[7], msg: m[8] } : null;
}

// ---------------------------------------------------------------------------
// RigWatch timeline events -> SIEM events
// ---------------------------------------------------------------------------
const RISKY = new Set([21, 23, 135, 139, 445, 1433, 1521, 2375, 2376, 3306, 3389, 5432, 5900, 5985, 5986, 6379, 9200, 9229, 11211, 27017]);
function fromTimeline(e) {
  if (!e || e.nosiem) return [];
  const t = e.t || Date.now();
  switch (e.type) {
    case 'system': return /started/i.test(e.title) ? [mk(1001, t, { location: 'rigwatch', msg: e.title + (e.detail ? ' (' + e.detail + ')' : '') })] : [];
    case 'port.open': {
      const all = /all interfaces/.test(e.detail || '');
      return [mk(all ? 6002 : 6001, t, { process: e.name, location: 'rigwatch/ports', level: all && RISKY.has(e.port) ? 9 : undefined, msg: e.title + (all ? ' on all interfaces' : ''), data: { port: e.port, proto: e.proto, pid: e.pid, bound: e.detail } })];
    }
    case 'port.close': return [mk(6003, t, { process: e.name, location: 'rigwatch/ports', msg: e.title, data: { port: e.port, proto: e.proto } })];
    case 'net.newhost': return [mk(6004, t, { ip: e.ip, process: e.name, location: 'rigwatch/connections', msg: e.title, data: { port: e.port, pid: e.pid, hosts: e.ip ? undefined : e.detail } })];
    case 'lan.device': return [mk(6009, t, { ip: e.ip, location: 'rigwatch/lan', msg: e.title, data: { detail: e.detail } })];
    case 'alert.fire': return [mk(8001, t, { location: 'rigwatch/alerts', msg: e.title, data: { alert: e.rule } })];
    case 'finding.new': return [mk(8002, t, { location: 'rigwatch/security', level: { critical: 12, high: 10, medium: 7, low: 4 }[e.sevLevel] || 5, msg: e.title, data: { detail: e.detail, port: e.port, pid: e.pid } })];
    case 'action': return [mk(8003, t, { location: 'rigwatch/audit', user: e.who, msg: e.title, data: { result: e.detail } })];
    case 'proc.start': {
      // only real red flags (fake system names, temp/download folders, tampered or deleted binaries)
      const sus = (e.flags || []).filter(f => /^(masquerade|odd-location|deleted-binary|bad-signature|odd-remote-port)/.test(f));
      return sus.length ? [mk(7002, t, { process: e.name, location: 'rigwatch/processes', level: sus.some(f => /masquerade|bad-signature/.test(f)) ? 12 : 8, msg: e.title + ' (' + sus.join(', ') + ')', data: { pid: e.pid, cmd: e.detail, parent: e.parent, flags: sus.join(',') } })] : [];
    }
  }
  return [];
}

// ---------------------------------------------------------------------------
// correlation: brute force, success after failures
// ---------------------------------------------------------------------------
class Correlator {
  constructor() { this.fails = new Map(); this.fired = new Map(); }
  cool(key, now, ms) { const t = this.fired.get(key); if (t != null && Math.abs(now - t) < ms) return true; this.fired.set(key, now); return false; }
  feed(ev) {
    const out = [], g = ev.rule.groups, now = ev.ts;
    if (g.includes('authentication_failed')) {
      const key = ev.ip && !isLocalIp(ev.ip) ? 'ip:' + ev.ip : ev.user ? 'user:' + String(ev.user).toLowerCase() : null;
      if (key) {
        const a = (this.fails.get(key) || []).filter(x => now - x <= 600e3 && x <= now);
        a.push(now); this.fails.set(key, a);
        const recent = a.filter(x => now - x <= 120e3).length;
        if (recent >= 5 && !this.cool(key + '#bf', now, 600e3)) out.push(mk(2010, now, { ip: ev.ip, user: ev.user, location: ev.location, msg: recent + ' failed logons within 2 minutes ' + (ev.ip && !isLocalIp(ev.ip) ? 'from ' + ev.ip : 'for ' + ev.user), data: { count: recent } }));
      }
    } else if (g.includes('authentication_success') && ev.ip && !isLocalIp(ev.ip)) {
      const a = (this.fails.get('ip:' + ev.ip) || []).filter(x => now - x <= 600e3 && x <= now);
      if (a.length >= 3 && !this.cool(ev.ip + '#ok', now, 600e3)) out.push(mk(2011, now, { ip: ev.ip, user: ev.user, location: ev.location, msg: ev.user + ' signed in from ' + ev.ip + ' after ' + a.length + ' failed attempts', data: { failures: a.length } }));
    }
    if (this.fails.size > 5000) for (const [k, a] of this.fails) if (!a.length || now - a[a.length - 1] > 600e3) this.fails.delete(k);
    if (this.fired.size > 5000) for (const [k, t] of this.fired) if (now - t > 3600e3) this.fired.delete(k);
    return out;
  }
}

// ---------------------------------------------------------------------------
// query language: free text plus key:value filters
//   ip:1.2.3.4  user:admin  rule:2004  group:brute_force  mitre:T1110  loc:security  proc:sshd  level>=7
// ---------------------------------------------------------------------------
function parseQuery(q) {
  const f = { text: [], not: [] };
  for (const tok of String(q || '').match(/[^\s"]+(?:"[^"]*")?|"[^"]*"/g) || []) {
    const t = tok.replace(/"/g, '');
    let m;
    if ((m = t.match(/^level\s*(>=|<=|>|<|=|:)\s*(\d+)$/i))) { const n = +m[2]; if (m[1] === '>=' ) f.min = n; else if (m[1] === '>') f.min = n + 1; else if (m[1] === '<=') f.max = n; else if (m[1] === '<') f.max = n - 1; else { f.min = n; f.max = n; } continue; }
    if ((m = t.match(/^(ip|user|rule|group|mitre|loc|location|proc|process):(.+)$/i))) { const k = { location: 'loc', process: 'proc' }[m[1].toLowerCase()] || m[1].toLowerCase(); f[k] = m[2].toLowerCase(); continue; }
    if (t.startsWith('-') && t.length > 1) f.not.push(t.slice(1).toLowerCase()); else if (t) f.text.push(t.toLowerCase());
  }
  return f;
}
const jesc = s => JSON.stringify(String(s)).slice(1, -1);
/** quick pre-check on the raw JSON line (avoids JSON.parse for most misses) */
function lineMayMatch(f, lineLower) {
  for (const t of f.text) if (!lineLower.includes(jesc(t))) return false;
  if (f.ip && !lineLower.includes(f.ip)) return false;
  if (f.user && !lineLower.includes(jesc(f.user))) return false;
  if (f.group && !f.group.split(',').some(g => lineLower.includes('"' + g + '"'))) return false;
  return true;
}
function matchEvent(f, ev) {
  const lv = ev.rule.level;
  if (f.min != null && lv < f.min) return false;
  if (f.max != null && lv > f.max) return false;
  if (f.rule && !f.rule.includes(',') && String(ev.rule.id) !== f.rule) return false;
  if (f.ip && !String(ev.ip || '').toLowerCase().startsWith(f.ip)) return false;
  if (f.user && !String(ev.user || '').toLowerCase().includes(f.user)) return false;
  if (f.group) { const want = f.group.split(','); if (!ev.rule.groups.some(g => want.includes(g.toLowerCase()))) return false; }
  if (f.rule && f.rule.includes(',')) { if (!f.rule.split(',').includes(String(ev.rule.id))) return false; }
  if (f.mitre && !(ev.rule.mitre || []).some(m => m.toLowerCase().startsWith(f.mitre))) return false;
  if (f.loc && !String(ev.location || '').toLowerCase().includes(f.loc)) return false;
  if (f.proc && !String(ev.process || '').toLowerCase().includes(f.proc)) return false;
  if (f.text.length || f.not.length) {
    const hay = JSON.stringify(ev).toLowerCase();
    for (const t of f.text) if (!hay.includes(jesc(t))) return false;
    for (const t of f.not) if (hay.includes(jesc(t))) return false;
  }
  return true;
}

module.exports = { RULES, MITRE, TACTICS, TECH_TACTICS, COMPLIANCE, GROUP_COMPLIANCE, complianceOf, SEVS, bandOf, sevOf, mk, fromWin, fromAuthLine, parseSyslog, fromTimeline, Correlator, parseQuery, lineMayMatch, matchEvent, cleanIp, isLocalIp, LOGON_TYPES };
