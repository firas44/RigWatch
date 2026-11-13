'use strict';
// Docker / Podman via the Engine API on the local socket or named pipe (no CLI needed).
const http = require('http');
const os = require('os');
const U = require('./util');

function candidates(dockerHost) {
  const out = [];
  if (dockerHost) {
    if (dockerHost.startsWith('unix://')) out.push({ socketPath: dockerHost.slice(7) });
    else if (dockerHost.startsWith('npipe://')) out.push({ socketPath: dockerHost.slice(8).replace(/\//g, '\\') });
    else if (/^tcp:\/\//.test(dockerHost)) { try { const u = new URL(dockerHost.replace(/^tcp/, 'http')); out.push({ host: u.hostname, port: +u.port || 2375 }); } catch { /* bad */ } }
  }
  if (U.IS_WIN) out.push({ socketPath: '\\\\.\\pipe\\docker_engine' }, { socketPath: '\\\\.\\pipe\\dockerDesktopLinuxEngine' }, { socketPath: '\\\\.\\pipe\\podman-machine-default' });
  else {
    const h = os.homedir(), uid = process.getuid ? process.getuid() : null;
    for (const p of ['/var/run/docker.sock', h + '/.docker/run/docker.sock', h + '/.colima/default/docker.sock', h + '/.orbstack/run/docker.sock', h + '/.rd/docker.sock', uid != null ? '/run/user/' + uid + '/docker.sock' : null, uid != null ? '/run/user/' + uid + '/podman/podman.sock' : null, '/run/podman/podman.sock']) if (p) out.push({ socketPath: p });
  }
  return out;
}

function request(target, method, path, { timeout = 5000, raw = false } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(Object.assign({}, target, { method, path, headers: { host: 'docker', 'content-type': 'application/json' }, timeout }), res => {
      if (raw) return resolve(res);
      let body = '';
      res.setEncoding('utf8');
      res.on('data', d => { body += d; });
      res.on('end', () => {
        if (res.statusCode >= 400) { let m = body; try { m = JSON.parse(body).message || body; } catch { /* text */ } return reject(new Error(m || 'HTTP ' + res.statusCode)); }
        if (!body) return resolve(null);
        try { resolve(JSON.parse(body)); } catch { resolve(body); }
      });
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    req.end();
  });
}

const ID_RX = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/;

function create(cfg) {
  const d = { available: false, target: null, info: null, containers: [], prev: new Map(), err: '', lastCheck: 0, polling: false };
  let timer = null, stopped = false;

  async function detect() {
    d.lastCheck = Date.now();
    for (const c of candidates(cfg.dockerHost)) {
      try { const r = await request(c, 'GET', '/_ping', { timeout: 1500 }); if (String(r).trim() === 'OK') { d.target = c; d.available = true; d.err = ''; return true; } } catch (e) { d.err = e.message; }
    }
    d.available = false; d.target = null;
    return false;
  }

  function cpuPct(id, s) {
    const cu = s.cpu_stats || {}, total = cu.cpu_usage ? cu.cpu_usage.total_usage : 0;
    const p = d.prev.get(id);
    const now = { total, sys: cu.system_cpu_usage || 0, read: Date.parse(s.read) || Date.now(), rx: 0, tx: 0, br: 0, bw: 0 };
    for (const n of Object.values(s.networks || {})) { now.rx += n.rx_bytes || 0; now.tx += n.tx_bytes || 0; }
    for (const b of ((s.blkio_stats || {}).io_service_bytes_recursive || [])) { if (/read/i.test(b.op)) now.br += b.value; if (/write/i.test(b.op)) now.bw += b.value; }
    d.prev.set(id, now);
    if (!p) return { cpu: 0, rx: 0, tx: 0, br: 0, bw: 0 };
    const dt = Math.max(0.001, (now.read - p.read) / 1000);
    const ncpu = cu.online_cpus || (cu.cpu_usage && cu.cpu_usage.percpu_usage ? cu.cpu_usage.percpu_usage.length : 0) || os.cpus().length;
    // CPU as a share of the whole host (100% = every core busy), same scale as the process table
    const cpu = now.sys && p.sys && now.sys > p.sys
      ? 100 * (now.total - p.total) / (now.sys - p.sys)
      : 100 * ((now.total - p.total) / 1e7) / dt / ncpu; // Windows containers: 100 ns units, no system counter
    const r = (a, b) => Math.max(0, (a - b) / dt);
    return { cpu: U.r1(U.clamp(cpu, 0, 100)), rx: Math.round(r(now.rx, p.rx)), tx: Math.round(r(now.tx, p.tx)), br: Math.round(r(now.br, p.br)), bw: Math.round(r(now.bw, p.bw)) };
  }

  async function poll() {
    if (stopped) return;
    if (!d.available && Date.now() - d.lastCheck > 30000) await detect();
    if (d.available) {
      try {
        const list = await request(d.target, 'GET', '/containers/json?all=1', { timeout: 5000 });
        if (!d.info || Date.now() - d.info.at > 60000) { const i = await request(d.target, 'GET', '/info', { timeout: 5000 }).catch(() => null); if (i) d.info = { at: Date.now(), version: i.ServerVersion, os: i.OperatingSystem, osType: i.OSType, arch: i.Architecture, ncpu: i.NCPU, mem: i.MemTotal, containers: i.Containers, running: i.ContainersRunning, images: i.Images, driver: i.Driver, name: i.Name }; }
        const running = list.filter(c => c.State === 'running');
        const stats = new Map();
        let i = 0;
        await Promise.all(Array.from({ length: Math.min(6, running.length) }, async () => {
          while (i < running.length) {
            const c = running[i++];
            try { const s = await request(d.target, 'GET', '/containers/' + c.Id + '/stats?stream=false&one-shot=true', { timeout: 4000 }); const m = s.memory_stats || {}; const st = m.stats || {}; stats.set(c.Id, Object.assign(cpuPct(c.Id, s), { mem: Math.max(0, (m.usage || 0) - (st.inactive_file || st.total_inactive_file || st.cache || 0)), memLimit: m.limit || 0, pids: (s.pids_stats || {}).current || 0 })); } catch { /* skip */ }
          }
        }));
        d.containers = list.map(c => {
          const s = stats.get(c.Id) || {};
          return { id: c.Id.slice(0, 12), fullId: c.Id, name: (c.Names && c.Names[0] || '').replace(/^\//, ''), image: c.Image, state: c.State, status: c.Status, created: c.Created * 1000, ports: (c.Ports || []).map(p => ({ ip: p.IP || '', priv: p.PrivatePort, pub: p.PublicPort || null, type: p.Type })), compose: (c.Labels || {})['com.docker.compose.project'] || null, service: (c.Labels || {})['com.docker.compose.service'] || null, cpu: s.cpu || 0, mem: s.mem || 0, memLimit: s.memLimit || 0, rx: s.rx || 0, tx: s.tx || 0, br: s.br || 0, bw: s.bw || 0, pids: s.pids || 0 };
        });
        for (const id of d.prev.keys()) if (!list.some(c => c.Id === id)) d.prev.delete(id);
        d.err = '';
      } catch (e) { d.err = e.message; d.available = false; d.containers = []; }
    }
    timer = setTimeout(poll, 3000); timer.unref();
  }

  d.start = () => { detect().then(poll); };
  d.stop = () => { stopped = true; clearTimeout(timer); };
  d.summary = () => ({ available: d.available, info: d.info, containers: d.containers, err: d.available ? '' : d.err });
  d.action = async (id, action) => {
    if (!d.available) throw new Error('Docker is not reachable');
    if (!ID_RX.test(id) || !['start', 'stop', 'restart', 'pause', 'unpause', 'kill'].includes(action)) throw new Error('bad request');
    await request(d.target, 'POST', '/containers/' + encodeURIComponent(id) + '/' + action, { timeout: 30000 });
    return action + ' ok';
  };
  d.inspect = async id => {
    if (!d.available) throw new Error('Docker is not reachable');
    if (!ID_RX.test(id)) throw new Error('bad id');
    const j = await request(d.target, 'GET', '/containers/' + encodeURIComponent(id) + '/json', { timeout: 8000 });
    const cfgC = j.Config || {};
    return {
      id: j.Id, name: (j.Name || '').replace(/^\//, ''), image: cfgC.Image, created: j.Created, state: j.State, restart: (j.HostConfig || {}).RestartPolicy,
      cmd: [].concat(cfgC.Entrypoint || [], cfgC.Cmd || []).join(' '), workdir: cfgC.WorkingDir, user: cfgC.User || 'root (default)', privileged: !!(j.HostConfig || {}).Privileged,
      env: (cfgC.Env || []).map(e => e.split('=')[0] + '=•••'), mounts: (j.Mounts || []).map(m => ({ type: m.Type, src: m.Source, dst: m.Destination, rw: m.RW })),
      networks: Object.entries((j.NetworkSettings || {}).Networks || {}).map(([n, v]) => ({ name: n, ip: v.IPAddress, gw: v.Gateway })),
      ports: (j.NetworkSettings || {}).Ports || {}, capAdd: (j.HostConfig || {}).CapAdd || [], networkMode: (j.HostConfig || {}).NetworkMode,
    };
  };
  /** Streams logs into a job (api from lib/jobs.js). */
  d.logs = (id, api, tail = 200) => new Promise((resolve, reject) => {
    if (!d.available) return reject(new Error('Docker is not reachable'));
    if (!ID_RX.test(id)) return reject(new Error('bad id'));
    const req = http.request(Object.assign({}, d.target, { method: 'GET', path: '/containers/' + encodeURIComponent(id) + '/logs?stdout=1&stderr=1&follow=1&timestamps=1&tail=' + U.clamp(U.int(tail, 200), 1, 5000), headers: { host: 'docker' } }), res => {
      if (res.statusCode >= 400) { reject(new Error('HTTP ' + res.statusCode)); res.resume(); return; }
      let buf = Buffer.alloc(0), mux = null, text = '';
      const emitText = (s, cls) => { text += s; const parts = text.split('\n'); text = parts.pop(); for (const l of parts) api.line(l.replace(/\r$/, ''), cls); };
      res.on('data', chunk => {
        buf = Buffer.concat([buf, chunk]);
        if (mux === null && buf.length >= 8) mux = (buf[0] === 1 || buf[0] === 2) && buf[1] === 0 && buf[2] === 0 && buf[3] === 0;
        if (mux === false) { emitText(buf.toString('utf8')); buf = Buffer.alloc(0); return; }
        while (mux && buf.length >= 8) {
          const len = buf.readUInt32BE(4);
          if (buf.length < 8 + len) break;
          emitText(buf.slice(8, 8 + len).toString('utf8'), buf[0] === 2 ? 'err' : '');
          buf = buf.slice(8 + len);
        }
      });
      res.on('end', () => { if (text) api.line(text); resolve(); });
    });
    api.onCancel(() => req.destroy());
    req.on('error', e => (api.cancelled ? resolve() : reject(e)));
    req.end();
  });
  return d;
}

module.exports = { create };
