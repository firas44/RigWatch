'use strict';
// Windows: "node server.js" asks for admin once (UAC), runs the server elevated in the
// background, and keeps this terminal as its console (logs stream here, Ctrl+C stops it).
// Decline the prompt, or set ELEVATE=off / --no-elevate, to run without admin.
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync, spawn } = require('child_process');

const IS_WIN = process.platform === 'win32';
const arg = name => { const a = process.argv.find(x => x.startsWith('--' + name + '=')); return a ? a.slice(name.length + 3) : null; };
const isChild = () => process.argv.includes('--elevated-child');

let adminCache = null;
function isAdmin() {
  if (adminCache !== null) return adminCache;
  if (!IS_WIN) return (adminCache = process.getuid ? process.getuid() === 0 : false);
  try { execFileSync(require('./util').sys32('net.exe'), ['session'], { stdio: 'ignore', windowsHide: true, timeout: 5000 }); adminCache = true; } catch { adminCache = false; }
  return adminCache;
}
/** true while the process exists. A non-elevated process gets EPERM for an elevated one: still alive. */
function alive(pid) {
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
}

/** In the elevated child: restore the parent's environment, log to the shared file, die with the parent. */
function childBootstrap() {
  if (!isChild()) return;
  const envFile = arg('envfile');
  if (envFile) {
    try { Object.assign(process.env, JSON.parse(fs.readFileSync(envFile, 'utf8'))); fs.rmSync(envFile, { force: true }); } catch { /* defaults */ }
  }
  const logFile = arg('log');
  if (logFile) {
    const out = fs.createWriteStream(logFile, { flags: 'a' });
    const wrap = orig => function (chunk, enc, cb) { try { out.write(chunk); } catch { /* ignore */ } return orig.call(this, chunk, enc, cb); };
    process.stdout.write = wrap(process.stdout.write);
    process.stderr.write = wrap(process.stderr.write);
  }
  const parent = parseInt(arg('parent'), 10);
  if (parent > 0) setInterval(() => { if (!alive(parent)) process.exit(0); }, 1500).unref();
}

function shouldElevate() {
  if (!IS_WIN || isChild()) return false;
  if (process.argv.includes('--no-elevate') || /^(off|0|no|false)$/i.test(process.env.ELEVATE || '')) return false;
  return !isAdmin();
}

function quote(a) { return '"' + String(a).replace(/"/g, '\\"') + '"'; }

/** Starts an elevated copy of this script. extra: { detached } (detached = visible window, no parent link). */
function startElevated(extra = {}) {
  const id = crypto.randomBytes(6).toString('hex');
  const logFile = path.join(os.tmpdir(), 'rigwatch-' + id + '.log');
  const envFile = path.join(os.tmpdir(), 'rigwatch-' + id + '.json');
  const keep = {};
  for (const [k, v] of Object.entries(process.env)) if (/^(PORT|HOST|INTERVAL_MS|PING_TARGET|LHM_URL|PRESENTMON_|ALLOW_|ALLOWED_HOSTS|LOCAL_TOKEN|LAN_READ|RIGWATCH_|NO_PERSIST|NO_DOWNLOAD|DOCKER_HOST)/.test(k)) keep[k] = v;
  if (extra.port) keep.PORT = String(extra.port); // UI restart: keep the same URL
  fs.writeFileSync(envFile, JSON.stringify(keep), { mode: 0o600 });
  fs.writeFileSync(logFile, '');
  const args = [process.argv[1], '--elevated-child', '--log=' + logFile, '--envfile=' + envFile];
  if (extra.detached) args.push('--wait-port'); else args.push('--parent=' + process.pid);
  const ps = '$p = Start-Process -FilePath $env:RW_NODE -ArgumentList $env:RW_ARGS -Verb RunAs -WorkingDirectory $env:RW_CWD -WindowStyle ' + (extra.detached ? 'Minimized' : 'Hidden') + ' -PassThru; $p.Id';
  return new Promise(resolve => {
    const p = spawn(require('./util').psExe(), ['-NoProfile', '-NonInteractive', '-Command', ps], {
      windowsHide: true,
      env: Object.assign({}, process.env, { RW_NODE: process.execPath, RW_ARGS: args.map(quote).join(' '), RW_CWD: process.cwd() }),
    });
    let out = '', err = '';
    p.stdout.on('data', d => { out += d; });
    p.stderr.on('data', d => { err += d; });
    p.on('exit', code => {
      const pid = parseInt(out.trim(), 10);
      if (code === 0 && pid > 0) resolve({ ok: true, pid, logFile });
      else { try { fs.rmSync(envFile, { force: true }); fs.rmSync(logFile, { force: true }); } catch { /* ignore */ } resolve({ ok: false, err: /cancel/i.test(err) ? 'UAC prompt declined' : err.trim().split('\n')[0] || 'failed' }); }
    });
  });
}

/** Parent side: elevate, then mirror the child's log until Ctrl+C. Returns false to run here instead. */
async function launch() {
  console.log('[rigwatch] asking Windows for admin rights (UAC) for temps, FPS, services and full process control…');
  const r = await startElevated();
  if (!r.ok) { console.log('[rigwatch] continuing without admin (' + r.err + '). Some sensors and actions will be limited.'); return false; }
  console.log('[rigwatch] running elevated in the background (PID ' + r.pid + '). Ctrl+C here stops it.');
  let pos = 0;
  const pump = () => {
    try {
      const st = fs.statSync(r.logFile);
      if (st.size > pos) { const fd = fs.openSync(r.logFile, 'r'); const buf = Buffer.alloc(st.size - pos); fs.readSync(fd, buf, 0, buf.length, pos); fs.closeSync(fd); pos = st.size; process.stdout.write(buf); }
    } catch { /* not yet */ }
  };
  const t = setInterval(pump, 300);
  const watch = setInterval(() => { if (alive(r.pid)) return; pump(); clearInterval(t); clearInterval(watch); console.log('[rigwatch] elevated server exited'); process.exit(0); }, 2000);
  const stop = () => { clearInterval(t); try { fs.rmSync(r.logFile, { force: true }); } catch { /* in use */ } process.exit(0); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
  if (process.argv.includes('--open') || process.env.OPEN === '1') {
    // open the browser from this (non-admin) process once the elevated server prints its URL
    const tryOpen = n => {
      let port = null;
      try { const m = fs.readFileSync(r.logFile, 'utf8').match(/http:\/\/localhost:(\d+)/); if (m) port = m[1]; } catch { /* not yet */ }
      if (!port) { if (n > 0) setTimeout(() => tryOpen(n - 1), 500); return; }
      require('http').get('http://127.0.0.1:' + port + '/api/health', res => { res.resume(); spawn('cmd', ['/c', 'start', '', 'http://localhost:' + port], { detached: true, stdio: 'ignore', windowsHide: true }).unref(); }).on('error', () => { if (n > 0) setTimeout(() => tryOpen(n - 1), 500); });
    };
    tryOpen(60);
  }
  return true;
}

module.exports = { isAdmin, alive, childBootstrap, shouldElevate, launch, startElevated, isChild };
