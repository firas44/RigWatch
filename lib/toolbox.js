'use strict';
// System toolbox: quick actions, event logs, installed apps, tasks, devices, drivers, updates,
// hosts file, environment/PATH, power plans, temp cleanup, firewall blocks, loaded modules.
// Windows gets the full set (via the PowerShell control worker); Linux/macOS get what maps.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const U = require('./util');

const WIN = U.IS_WIN;
const HOSTS = WIN ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'drivers', 'etc', 'hosts') : '/etc/hosts';
const SECRET_KEY = /key|token|secret|passw|pwd|credential|auth/i;
const OPEN_TOOLS = WIN ? {
  taskmgr: 'taskmgr', devmgmt: 'devmgmt.msc', eventvwr: 'eventvwr.msc', services: 'services.msc', resmon: 'resmon', perfmon: 'perfmon', firewall: 'wf.msc',
  network: 'ncpa.cpl', programs: 'appwiz.cpl', sysprops: 'sysdm.cpl', diskmgmt: 'diskmgmt.msc', compmgmt: 'compmgmt.msc', regedit: 'regedit', msinfo: 'msinfo32', power: 'powercfg.cpl', sound: 'mmsys.cpl', tasksched: 'taskschd.msc', gpedit: 'gpedit.msc', cmd: 'cmd', powershell: 'powershell',
} : {};

async function dirSize(dir, budget) {
  let bytes = 0, files = 0;
  const walk = async d => {
    if (Date.now() > budget.until || files > 300000) return;
    let ents; try { ents = await fs.promises.readdir(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else { try { const s = await fs.promises.lstat(p); bytes += s.size; files++; } catch { /* locked */ } }
    }
  };
  await walk(dir);
  return { bytes, files };
}
const tempDirs = () => [os.tmpdir()].concat(WIN && process.env.SystemRoot ? [path.join(process.env.SystemRoot, 'Temp')] : []).filter((d, i, a) => a.indexOf(d) === i);

function parseHosts(text) {
  return String(text || '').split(/\r?\n/).map((raw, i) => {
    const line = raw.trim();
    const off = /^#\s*\d/.test(line);
    const body = line.replace(/^#\s*/, '').replace(/\s+#.*$/, '');
    const f = body.split(/\s+/);
    if (!line || (line.startsWith('#') && !off) || f.length < 2 || !/^[\d.:a-f]+$/i.test(f[0])) return null;
    return { line: i, ip: f[0], hosts: f.slice(1), enabled: !off };
  }).filter(Boolean);
}

function create(engine) {
  const plat = engine.plat;
  const ctl = (op, args, t) => plat.ctl.request(op, args || {}, t || 60000);
  const tb = {};

  tb.get = async (what, q) => {
    switch (what) {
      case 'events': {
        const hours = U.clamp(U.int(q.hours, 24), 1, 24 * 30), max = U.clamp(U.int(q.max, 300), 10, 2000);
        if (WIN) return ctl('events', { log: q.log || 'System', levels: q.level === 'all' ? null : q.level === 'error' ? [1, 2] : [1, 2, 3], hours, max });
        if (U.which(['journalctl'])) {
          const r = await U.run('journalctl', ['-p', q.level === 'all' ? '6' : q.level === 'error' ? '3' : '4', '-n', String(max), '--since', '-' + hours + 'h', '-o', 'json', '--no-pager'], { timeout: 30000 });
          return r.stdout.split('\n').filter(Boolean).map(l => { try { const j = JSON.parse(l); return { t: Math.round(+j.__REALTIME_TIMESTAMP / 1000), id: +j.PRIORITY, level: +j.PRIORITY <= 3 ? 2 : 3, provider: j.SYSLOG_IDENTIFIER || j._COMM || '', log: 'journal', msg: String(j.MESSAGE || '').slice(0, 600) }; } catch { return null; } }).filter(Boolean).reverse();
        }
        throw new Error('event logs are not available on this OS');
      }
      case 'secevents': if (!WIN) throw new Error('Windows only'); return ctl('secevents', { hours: U.clamp(U.int(q.hours, 72), 1, 24 * 30) }, 90000);
      case 'apps': {
        if (WIN) return ctl('apps');
        if (U.which(['dpkg-query'])) { const r = await U.run('dpkg-query', ['-W', '-f=${Package}\t${Version}\t${Installed-Size}\t${Maintainer}\n'], { timeout: 30000 }); return r.stdout.split('\n').filter(Boolean).map(l => { const f = l.split('\t'); return { name: f[0], version: f[1], sizeKb: +f[2] || 0, publisher: f[3] || '', scope: 'machine' }; }); }
        if (U.which(['rpm'])) { const r = await U.run('rpm', ['-qa', '--qf', '%{NAME}\t%{VERSION}-%{RELEASE}\t%{SIZE}\t%{VENDOR}\n'], { timeout: 30000 }); return r.stdout.split('\n').filter(Boolean).map(l => { const f = l.split('\t'); return { name: f[0], version: f[1], sizeKb: Math.round(+f[2] / 1024) || 0, publisher: f[3] || '', scope: 'machine' }; }); }
        if (process.platform === 'darwin') { let a = []; try { a = fs.readdirSync('/Applications').filter(x => x.endsWith('.app')); } catch { /* none */ } return a.map(x => ({ name: x.replace(/\.app$/, ''), version: '', publisher: '', scope: 'machine', location: '/Applications/' + x })); }
        return [];
      }
      case 'tasks': {
        if (WIN) return ctl('tasks', { all: q.all === '1' }, 90000);
        const out = [];
        if (U.which(['systemctl'])) { const r = await U.run('systemctl', ['list-timers', '--all', '--no-legend', '--no-pager'], { timeout: 15000 }); for (const l of r.stdout.split('\n')) { const m = l.trim().match(/(\S+\.timer)\s+(\S+\.service)\s*$/); if (m) out.push({ name: m[1], path: 'systemd', state: 'Ready', actions: m[2], triggers: 'timer', last: 0, next: 0, result: null, user: '' }); } }
        const c = await U.run('crontab', ['-l'], { timeout: 5000 });
        for (const l of c.stdout.split('\n')) if (l.trim() && !l.trim().startsWith('#')) out.push({ name: l.trim().split(/\s+/).slice(0, 5).join(' '), path: 'crontab', state: 'Ready', actions: l.trim().split(/\s+/).slice(5).join(' '), triggers: 'cron', last: 0, next: 0, result: null, user: os.userInfo().username });
        return out;
      }
      case 'devices': if (!WIN) return []; return ctl('devices');
      case 'drivers': if (!WIN) return []; return ctl('drivers', {}, 90000);
      case 'updates': if (!WIN) return { hotfixes: [], reboot: [] }; return ctl('updates', {}, 60000);
      case 'modules': {
        const pid = U.int(q.pid, -1);
        if (WIN) return ctl('modules', { pid });
        if (process.platform === 'linux') { const t = await U.readTextAsync('/proc/' + pid + '/maps'); if (!t) throw new Error('no access (needs the same user or root)'); const seen = new Set(); return t.split('\n').map(l => l.trim().split(/\s+/)[5]).filter(p => p && p.startsWith('/') && !seen.has(p) && seen.add(p)).map(p => ({ name: path.basename(p), path: p, size: 0, company: '', version: '' })); }
        throw new Error('not supported on this OS');
      }
      case 'fwlist': if (!WIN) return []; return ctl('fwlist');
      case 'env': {
        let vars;
        if (WIN) vars = await ctl('env');
        else vars = { user: Object.entries(process.env).map(([k, v]) => ({ k, v })), machine: [] };
        const mask = list => U.arr(list).map(x => ({ k: x.k, v: SECRET_KEY.test(x.k) ? '\u2022\u2022\u2022\u2022 (hidden)' : x.v })).sort((a, b) => a.k.localeCompare(b.k));
        const pathVar = list => (U.arr(list).find(x => /^path$/i.test(x.k)) || {}).v || '';
        const entries = [];
        const seen = new Map();
        for (const [scope, val] of [['machine', pathVar(vars.machine)], ['user', pathVar(vars.user)]]) {
          for (const raw of String(val).split(path.delimiter)) {
            if (!raw.trim()) continue;
            const expanded = raw.replace(/%([^%]+)%/g, (m, k) => process.env[k] || m);
            const key = expanded.toLowerCase().replace(/[\\/]+$/, '');
            let exists = false; try { exists = fs.statSync(expanded).isDirectory(); } catch { /* missing */ }
            entries.push({ scope, dir: raw, exists, dup: seen.has(key) });
            seen.set(key, true);
          }
        }
        return { user: mask(vars.user), machine: mask(vars.machine), path: entries };
      }
      case 'hosts': {
        const text = (await U.readTextAsync(HOSTS)) || '';
        let writable = false; try { fs.accessSync(HOSTS, fs.constants.W_OK); writable = true; } catch { /* needs admin */ }
        return { file: HOSTS, entries: parseHosts(text), writable, raw: text.slice(0, 20000) };
      }
      case 'powerplans': {
        if (WIN) {
          const r = await U.run(U.sys32('powercfg.exe'), ['/list'], { timeout: 10000 });
          return { plans: r.stdout.split(/\r?\n/).map(l => l.match(/([0-9a-f]{8}-[0-9a-f-]{27})\s+\((.+?)\)(\s*\*)?/i)).filter(Boolean).map(m => ({ guid: m[1], name: m[2], active: !!m[3] })) };
        }
        if (U.which(['powerprofilesctl'])) { const r = await U.run('powerprofilesctl', ['list'], { timeout: 5000 }); return { plans: (r.stdout.match(/^[ *] *([\w-]+):/gm) || []).map(s => ({ guid: s.replace(/[ *:]/g, ''), name: s.replace(/[ *:]/g, ''), active: s.trim().startsWith('*') })) }; }
        return { plans: [] };
      }
      case 'temp': {
        const budget = { until: Date.now() + 8000 };
        const dirs = [];
        for (const d of tempDirs()) dirs.push(Object.assign({ dir: d }, await dirSize(d, budget)));
        let recycle = null; if (WIN) { try { recycle = await ctl('recycle', { empty: false }, 30000); } catch { recycle = null; } }
        return { dirs, recycle, partial: Date.now() > budget.until };
      }
      case 'overview': {
        const [plans, updates] = await Promise.all([tb.get('powerplans', {}).catch(() => ({ plans: [] })), WIN ? ctl('updates', {}, 60000).catch(() => null) : null]);
        return { plans: plans.plans, reboot: updates ? updates.reboot : [], tools: Object.keys(OPEN_TOOLS), admin: plat.isAdmin() };
      }
    }
    throw new Error('unknown toolbox view ' + what);
  };

  tb.act = async (a) => {
    const op = String(a.op || '');
    const run = async (cmd, args, label) => { const r = await U.run(cmd, args, { timeout: 60000 }); if (!r.ok) throw new Error((r.stderr || r.stdout).trim().split('\n').slice(-2).join(' ') || label + ' failed'); return (r.stdout.trim().split('\n').slice(-1)[0] || label + ' done').slice(0, 300); };
    switch (op) {
      case 'flushdns': return WIN ? run(U.sys32('ipconfig.exe'), ['/flushdns'], 'flush DNS') : process.platform === 'darwin' ? run('dscacheutil', ['-flushcache'], 'flush DNS') : run('resolvectl', ['flush-caches'], 'flush DNS');
      case 'renewip': if (!WIN) throw new Error('Windows only'); await run(U.sys32('ipconfig.exe'), ['/release'], 'release'); return run(U.sys32('ipconfig.exe'), ['/renew'], 'renew');
      case 'lock': return WIN ? run(U.sys32('rundll32.exe'), ['user32.dll,LockWorkStation'], 'lock') : process.platform === 'darwin' ? run('pmset', ['displaysleepnow'], 'lock') : run('loginctl', ['lock-session'], 'lock');
      case 'restartexplorer': {
        if (!WIN) throw new Error('Windows only');
        await U.run(U.sys32('taskkill.exe'), ['/F', '/IM', 'explorer.exe'], { timeout: 15000 });
        await U.sleep(800);
        spawn('explorer.exe', [], { detached: true, stdio: 'ignore' }).unref();
        return 'Explorer restarted';
      }
      case 'shutdown': case 'restart': {
        const mins = U.clamp(U.int(a.minutes, 1), 0, 1440);
        if (WIN) return run(U.sys32('shutdown.exe'), [op === 'restart' ? '/r' : '/s', '/t', String(mins * 60), '/c', 'Scheduled from RigWatch'], op);
        return run('shutdown', [op === 'restart' ? '-r' : '-h', '+' + mins], op);
      }
      case 'abortshutdown': return WIN ? run(U.sys32('shutdown.exe'), ['/a'], 'abort') : run('shutdown', ['-c'], 'abort');
      case 'opentool': {
        const t = OPEN_TOOLS[a.name]; if (!t) throw new Error('unknown tool');
        spawn('cmd.exe', ['/c', 'start', '', t], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
        return 'opened ' + t;
      }
      case 'setplan': {
        const g = String(a.guid || '');
        if (WIN) { if (!/^[0-9a-f-]{36}$/i.test(g)) throw new Error('bad plan'); return run(U.sys32('powercfg.exe'), ['/setactive', g], 'set power plan'); }
        if (!/^[\w-]+$/.test(g)) throw new Error('bad profile'); return run('powerprofilesctl', ['set', g], 'set power profile');
      }
      case 'ultimateplan': if (!WIN) throw new Error('Windows only'); return run(U.sys32('powercfg.exe'), ['-duplicatescheme', 'e9a42b02-d5df-448d-aa00-03f14749eb61'], 'add Ultimate Performance');
      case 'cleantemp': {
        const cutoff = Date.now() - U.clamp(U.int(a.hours, 24), 0, 24 * 365) * 3600e3;
        let freed = 0, removed = 0, skipped = 0;
        const sweep = async d => {
          let ents; try { ents = await fs.promises.readdir(d, { withFileTypes: true }); } catch { return; }
          for (const e of ents) {
            const p = path.join(d, e.name);
            try {
              if (e.isDirectory()) { await sweep(p); const left = await fs.promises.readdir(p); if (!left.length) await fs.promises.rmdir(p); continue; }
              const s = await fs.promises.lstat(p);
              if (s.mtimeMs > cutoff) { skipped++; continue; }
              await fs.promises.unlink(p); freed += s.size; removed++;
            } catch { skipped++; }
          }
        };
        for (const d of tempDirs()) await sweep(d);
        return 'removed ' + removed + ' files, freed ' + (freed / 1048576).toFixed(1) + ' MB (' + skipped + ' recent or in use, kept)';
      }
      case 'emptyrecycle': if (!WIN) throw new Error('Windows only'); await ctl('recycle', { empty: true }, 120000); return 'Recycle Bin emptied';
      case 'task': if (!WIN) throw new Error('Windows only'); return ctl('task', { path: String(a.path || '\\'), name: String(a.name || ''), action: String(a.action || '') });
      case 'uninstall': if (!WIN) throw new Error('Windows only'); return ctl('uninstall', { key: String(a.key || '') });
      case 'startup': if (!WIN) throw new Error('Windows only'); return ctl('startuptoggle', { name: String(a.name || ''), location: String(a.location || ''), enable: !!a.enable });
      case 'fwblock': {
        if (!WIN) throw new Error('Windows only');
        const p = engine.lastProcs().find(x => x.pid === U.int(a.pid, -1));
        const exe = a.path || (p && p.exe);
        if (!exe) throw new Error('executable path unknown');
        return ctl('fwblock', { path: exe, label: (p && p.name) || path.basename(exe), on: a.on !== false });
      }
      case 'hosts': {
        const text = (await U.readTextAsync(HOSTS)) || '';
        const lines = text.split(/\r?\n/);
        if (a.action === 'add') {
          const ip = String(a.ip || '').trim(), host = String(a.host || '').trim();
          if (!/^[\d.:a-f]+$/i.test(ip) || !/^[A-Za-z0-9.-]{1,253}$/.test(host)) throw new Error('invalid IP or host name');
          lines.push(ip + '\t' + host + '\t# added by RigWatch');
        } else {
          const i = U.int(a.line, -1);
          if (!parseHosts(text).some(e => e.line === i)) throw new Error('no such entry');
          if (a.action === 'remove') lines.splice(i, 1);
          else if (a.action === 'toggle') lines[i] = /^\s*#/.test(lines[i]) ? lines[i].replace(/^\s*#\s*/, '') : '# ' + lines[i];
          else throw new Error('bad action');
        }
        try { fs.copyFileSync(HOSTS, HOSTS + '.rigwatch.bak'); fs.writeFileSync(HOSTS, lines.join(WIN ? '\r\n' : '\n')); }
        catch (e) { throw new Error(e.code === 'EPERM' || e.code === 'EACCES' ? 'Editing the hosts file needs admin rights.' : e.message); }
        if (WIN) U.run(U.sys32('ipconfig.exe'), ['/flushdns']);
        return 'hosts file updated (backup: hosts.rigwatch.bak)';
      }
    }
    throw new Error('unknown toolbox action ' + op);
  };

  // disk usage analyzer as a streaming job
  tb.du = (dir, api) => (async () => {
    dir = path.resolve(String(dir || (WIN ? (process.env.SystemDrive || 'C:') + '\\' : os.homedir())));
    let st; try { st = fs.statSync(dir); } catch { throw new Error('folder not found'); }
    if (!st.isDirectory()) throw new Error('not a folder');
    api.line('scanning ' + dir + ' (30 s budget)', 'cmd');
    const until = Date.now() + 30000;
    const top = new Map(), big = [];
    let files = 0, total = 0, denied = 0, last = 0;
    const walk = async (d, bucket, depth) => {
      if (Date.now() > until || api.cancelled) return;
      let ents; try { ents = await fs.promises.readdir(d, { withFileTypes: true }); } catch { denied++; return; }
      for (const e of ents) {
        if (e.isSymbolicLink()) continue;
        const p = path.join(d, e.name);
        const b = bucket || p;
        if (e.isDirectory()) { if (!bucket) top.set(p, top.get(p) || { path: p, bytes: 0, files: 0, dir: true }); await walk(p, b, depth + 1); continue; }
        let s; try { s = await fs.promises.lstat(p); } catch { denied++; continue; }
        files++; total += s.size;
        const t = top.get(b) || { path: b, bytes: 0, files: 0, dir: !!bucket }; t.bytes += s.size; t.files++; top.set(b, t);
        if (s.size > 50 * 1048576) { big.push({ path: p, bytes: s.size }); if (big.length > 200) { big.sort((x, y) => y.bytes - x.bytes); big.length = 100; } }
        if (Date.now() - last > 1000) { last = Date.now(); api.line(files.toLocaleString() + ' files, ' + (total / 1073741824).toFixed(2) + ' GB so far\u2026', 'dim'); }
      }
    };
    await walk(dir, null, 0);
    const list = [...top.values()].sort((a, b) => b.bytes - a.bytes).slice(0, 40);
    big.sort((x, y) => y.bytes - x.bytes);
    api.line('done: ' + files.toLocaleString() + ' files, ' + (total / 1073741824).toFixed(2) + ' GB' + (Date.now() > until ? ' (time budget hit, partial)' : '') + (denied ? ', ' + denied + ' unreadable' : ''), 'cmd');
    return { dir, total, files, denied, partial: Date.now() > until, top: list, biggest: big.slice(0, 30) };
  })();

  return tb;
}

module.exports = { create, parseHosts, OPEN_TOOLS };
