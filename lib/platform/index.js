'use strict';
/**
 * Platform contract (every module returns this shape):
 *   id, label, caps{...}
 *   start(), stop()
 *   sample()     -> { t, cpu, mem, gpus, gpuProc:Map, disks, fs, net:{ifaces,tcp}, procs, sensors, sensorSource, battery } | null
 *   sockets()    -> { listen, conns, byPid, connsByPid, names, at, ok, err }   (see lib/sockets.js)
 *   inventory(), status() -> [{name, ok, detail, err}], selfPids(), isAdmin()
 *   async: netInfo(), services(), serviceAction(), startup(), procInfo(), kill(), suspend(), resume(),
 *          priority(), affinity(), reveal(), [dnsCache(), signatures(), wsl(), wslAction(), cwd()]
 */
const os = require('os');

function generic(ctx) {
  let prev = null, timer = null;
  function sample() {
    const cur = os.cpus().map(c => { const t = c.times; return { total: t.user + t.nice + t.sys + t.idle + t.irq, idle: t.idle }; });
    let ti = 0, tt = 0;
    const per = cur.map((c, i) => { const p = prev && prev[i]; if (!p) return 0; const dt = c.total - p.total, di = c.idle - p.idle; ti += di; tt += dt; return dt > 0 ? Math.round(1000 * (1 - di / dt)) / 10 : 0; });
    prev = cur;
    const total = os.totalmem(), free = os.freemem();
    return { t: Date.now(), cpu: { util: tt > 0 ? Math.round(1000 * (1 - ti / tt)) / 10 : 0, cores: per.map(u => ({ u, mhz: 0 })), mhz: (os.cpus()[0] || {}).speed || 0, load: os.loadavg() }, mem: { total, avail: free, used: total - free, free }, gpus: [], gpuProc: new Map(), disks: [], fs: [], net: { ifaces: [], tcp: null }, procs: [], sensors: [], sensorSource: null, battery: [] };
  }
  const unsupported = () => Promise.reject(new Error('not supported on ' + process.platform));
  return {
    id: process.platform, label: process.platform, caps: {},
    start() { timer = setInterval(() => ctx.onTick && ctx.onTick(), ctx.cfg.interval); },
    stop() { clearInterval(timer); },
    sample, sockets: () => require('../sockets').empty(), selfPids: () => [], isAdmin: () => false,
    inventory: () => ({ platform: process.platform, os: { caption: os.type() + ' ' + os.release(), kernel: os.release() }, cpu: { name: (os.cpus()[0] || {}).model, threads: os.cpus().length }, ram: [], video: [], gpus: [] }),
    status: () => [{ name: 'os module (basic)', ok: true, detail: 'only CPU and memory on this platform', err: '' }],
    netInfo: unsupported, services: unsupported, serviceAction: unsupported, startup: unsupported, procInfo: unsupported,
    kill: async (pid, o = {}) => { process.kill(pid, o.force ? 'SIGKILL' : 'SIGTERM'); return 'signal sent'; },
    suspend: unsupported, resume: unsupported, priority: unsupported, affinity: unsupported, reveal: unsupported,
  };
}

function create(ctx) {
  switch (process.platform) {
    case 'win32': return require('./win').create(ctx);
    case 'linux': return require('./linux').create(ctx);
    case 'darwin': return require('./darwin').create(ctx);
    default: return generic(ctx);
  }
}

module.exports = { create };
