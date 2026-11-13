'use strict';
// NVIDIA GPUs via nvidia-smi (Windows + Linux). Streams one line per GPU per interval.
const { spawn } = require('child_process');
const U = require('./util');

function create(interval) {
  const nv = { ok: false, exe: null, gpus: [], procs: new Map(), err: '', children: new Set() };
  const extra = U.IS_WIN ? ['C:\\Windows\\System32', 'C:\\Program Files\\NVIDIA Corporation\\NVSMI'] : ['/usr/bin', '/usr/local/bin', '/usr/lib/wsl/lib'];
  nv.exe = U.which(['nvidia-smi'], extra);
  const q = 'index,name,utilization.gpu,utilization.memory,memory.used,memory.total,temperature.gpu,power.draw,power.limit,clocks.gr,clocks.mem,fan.speed,pstate,utilization.encoder,utilization.decoder,pci.bus_id';
  let stopped = false;

  function launch() {
    if (stopped || !nv.exe) return;
    const p = spawn(nv.exe, ['--query-gpu=' + q, '--format=csv,noheader,nounits', '-lms', String(Math.max(500, interval))], { windowsHide: true });
    nv.children.add(p);
    const cur = new Map();
    U.onLines(p.stdout, line => {
      const f = line.split(',').map(s => s.trim());
      if (f.length < 12) return;
      const mib = v => (U.opt(v) == null ? null : U.opt(v) * 1048576);
      cur.set(U.num(f[0]), { index: U.num(f[0]), name: f[1], util: U.opt(f[2]), memUtil: U.opt(f[3]), vramUsed: mib(f[4]), vramTotal: mib(f[5]), temp: U.opt(f[6]), power: U.opt(f[7]), powerLimit: U.opt(f[8]), clock: U.opt(f[9]), memClock: U.opt(f[10]), fanPct: U.opt(f[11]), pstate: f[12], enc: U.opt(f[13]), dec: U.opt(f[14]), bus: f[15], at: Date.now() });
      nv.gpus = [...cur.values()]; nv.ok = true;
    });
    p.stderr.on('data', d => { nv.err = String(d).slice(-400); });
    p.on('error', e => { nv.err = e.message; });
    p.on('exit', () => { nv.children.delete(p); nv.ok = false; if (!stopped) setTimeout(launch, 10000).unref(); });
  }

  // per-process VRAM (compute + graphics apps) every 5 s
  async function pollProcs() {
    if (stopped || !nv.exe) return;
    const r = await U.run(nv.exe, ['--query-compute-apps=pid,used_memory', '--format=csv,noheader,nounits'], { timeout: 5000 });
    const m = new Map();
    if (r.ok) for (const line of r.stdout.split(/\r?\n/)) { const f = line.split(',').map(s => s.trim()); if (f.length >= 2 && U.num(f[0])) m.set(U.num(f[0]), (U.opt(f[1]) || 0) * 1048576); }
    nv.procs = m;
    setTimeout(pollProcs, 5000).unref();
  }

  nv.start = () => { if (nv.exe) { launch(); pollProcs(); } };
  nv.stop = () => { stopped = true; for (const c of nv.children) { try { c.kill(); } catch { /* gone */ } } };
  return nv;
}

module.exports = { create };
