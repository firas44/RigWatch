'use strict';
// FPS / frame times via Intel PresentMon (Windows). Drop PresentMon*.exe next to server.js,
// into tools/ or bin/, or set PRESENTMON_PATH. Needs an elevated terminal (ETW).
const path = require('path');
const { spawn } = require('child_process');
const U = require('./util');
const { ROOT } = require('./assets');

function create(cfg, kindOf) {
  const fps = { status: U.IS_WIN ? 'missing' : 'unsupported', msg: '', exe: null, style: 2, apps: new Map(), err: '', proc: null, tries: 0, stopped: false };

  function launch() {
    if (fps.stopped) return;
    const args = cfg.presentMonArgs ? U.splitArgs(cfg.presentMonArgs)
      : fps.style === 1 ? ['-output_stdout', '-stop_existing_session', '-session_name', 'RigWatch', '-no_top']
        : ['--output_stdout', '--stop_existing_session', '--session_name', 'RigWatch', '--no_console_stats'];
    fps.status = 'starting'; fps.err = ''; fps.tries++;
    const started = Date.now();
    let gotData = false, cols = null;
    const p = spawn(fps.exe, args, { windowsHide: true });
    fps.proc = p;
    U.onLines(p.stdout, raw => {
      const line = raw.trim();
      const f = line.split(',');
      if (!cols) {
        if (!/^Application,/i.test(line)) return;
        const idx = n => f.findIndex(c => c.trim().toLowerCase() === n.toLowerCase());
        const ft = ['msBetweenPresents', 'FrameTime', 'MsBetweenPresents', 'msBetweenAppStart'].map(idx).find(i => i >= 0);
        if (ft == null) { fps.err = 'Unrecognised PresentMon columns'; return; }
        cols = { app: idx('Application'), pid: idx('ProcessID'), ft };
        fps.status = 'running';
        return;
      }
      const ft = parseFloat(f[cols.ft]);
      if (!(ft > 0 && ft < 5000)) return;
      gotData = true; fps.status = 'running';
      const pid = U.num(f[cols.pid]);
      let a = fps.apps.get(pid);
      if (!a) { a = { pid, name: (f[cols.app] || '').replace(/\.exe$/i, ''), ft: [], last: 0 }; fps.apps.set(pid, a); }
      a.ft.push(ft);
      if (a.ft.length > 4000) a.ft.splice(0, a.ft.length - 3000);
      a.last = Date.now();
    });
    p.stderr.setEncoding('utf8');
    p.stderr.on('data', d => { fps.err = (fps.err + d).slice(-800); });
    p.on('error', e => { fps.err = e.message; });
    p.on('exit', code => {
      fps.proc = null;
      if (fps.stopped) return;
      const quick = Date.now() - started < 6000 && !gotData;
      const denied = /access denied|administrative privileges|performance log users/i.test(fps.err) || code === 5;
      if (!denied && quick && fps.tries === 1 && !cfg.presentMonArgs) { fps.style = fps.style === 1 ? 2 : 1; return launch(); }
      fps.status = denied ? 'needs-admin' : 'error';
      fps.msg = denied ? 'PresentMon needs an elevated terminal (or the "Performance Log Users" group).' : 'PresentMon exited (code ' + code + ').';
      if (denied) fps.err = 'failed to start trace session: access denied';
      setTimeout(() => { fps.tries = 0; launch(); }, denied ? 300000 : 60000).unref();
    });
  }

  function stats(a, now) {
    const ft = a.ft; let sum = 0, n = 0;
    for (let i = ft.length - 1; i >= 0 && sum < 1000; i--) { sum += ft[i]; n++; }
    let s10 = 0; const win = [];
    for (let i = ft.length - 1; i >= 0 && s10 < 10000; i--) { s10 += ft[i]; win.push(ft[i]); }
    win.sort((x, y) => y - x);
    const p99 = win.length ? win[Math.floor(win.length * 0.01)] : 0;
    const p999 = win.length ? win[Math.floor(win.length * 0.001)] : 0;
    const stale = now - a.last > 1500;
    return { pid: a.pid, name: a.name, fps: stale ? 0 : U.r1(sum > 0 ? 1000 * n / sum : 0), low1: p99 ? U.r1(1000 / p99) : null, low01: p999 ? U.r1(1000 / p999) : null, ft: n ? U.r1(sum / n) : null, frames: stale ? 0 : n };
  }

  fps.start = exePath => {
    if (!U.IS_WIN || fps.proc) return;
    fps.exe = cfg.presentMon || exePath || U.findFile(/^presentmon.*\.exe$/i, [ROOT, path.join(ROOT, 'tools'), path.join(ROOT, 'bin'), process.cwd(), ...(process.env.PATH || '').split(path.delimiter)]);
    if (!fps.exe) { fps.status = 'missing'; return; }
    fps.style = /presentmon-?1\./i.test(path.basename(fps.exe)) ? 1 : 2;
    launch();
  };
  fps.stop = () => { fps.stopped = true; if (fps.proc) { try { fps.proc.kill(); } catch { /* gone */ } } };
  fps.pid = () => (fps.proc ? fps.proc.pid : 0);
  fps.payload = () => {
    const now = Date.now();
    for (const [pid, a] of fps.apps) if (now - a.last > 8000) fps.apps.delete(pid);
    const apps = [...fps.apps.values()].map(a => stats(a, now)).filter(a => a.fps > 0).sort((a, b) => b.fps - a.fps);
    const rank = a => { const k = kindOf(a.name); return k === 'app' || k === 'launcher' ? 2 : k === 'browser' || k === 'comms' || k === 'editor' ? 1 : 0; };
    const main = apps.filter(a => !/^(dwm|explorer)$/i.test(a.name)).sort((a, b) => rank(b) - rank(a) || b.frames - a.frames)[0] || null;
    const frametimes = main ? fps.apps.get(main.pid).ft.slice(-240).map(U.r1) : [];
    return { status: fps.status, msg: fps.msg, err: fps.status === 'running' ? '' : U.trunc(fps.err.trim(), 300), exe: fps.exe ? path.basename(fps.exe) : null, main: main ? Object.assign({ frametimes }, main) : null, apps: apps.slice(0, 12) };
  };
  return fps;
}

module.exports = { create };
