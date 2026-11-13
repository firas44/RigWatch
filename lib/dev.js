'use strict';
// Developer helpers: dev-server health checks, project detection (+ git branch), toolchain
// versions, WSL distros.
const http = require('http');
const https = require('https');
const path = require('path');
const U = require('./util');
const { describe, findProject, DEV_KINDS } = require('./classify');

const TOOLCHAIN = [
  ['node', ['--version']], ['npm', ['--version']], ['pnpm', ['--version']], ['yarn', ['--version']], ['bun', ['--version']], ['deno', ['--version']],
  ['python3', ['--version']], ['python', ['--version']], ['pip', ['--version']], ['uv', ['--version']], ['go', ['version']], ['rustc', ['--version']], ['cargo', ['--version']],
  ['java', ['-version']], ['dotnet', ['--version']], ['ruby', ['--version']], ['php', ['--version']], ['git', ['--version']], ['docker', ['--version']],
  ['kubectl', ['version', '--client']], ['gh', ['--version']], ['terraform', ['--version']], ['ollama', ['--version']],
];

function probeHttp(port) {
  const get = (lib, proto) => new Promise(resolve => {
    const t0 = Date.now();
    const req = lib.request({ host: '127.0.0.1', port, path: '/', method: 'GET', timeout: 1500, rejectUnauthorized: false, headers: { 'user-agent': 'RigWatch-health', accept: 'text/html,*/*' } }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', d => { if (body.length < 65536) body += d; });
      res.on('end', () => resolve({ ok: res.statusCode < 500, status: res.statusCode, ms: Date.now() - t0, proto, title: ((body.match(/<title[^>]*>([^<]{0,120})/i) || [])[1] || '').trim(), server: res.headers.server || res.headers['x-powered-by'] || '' }));
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', e => resolve({ ok: false, status: 0, ms: Date.now() - t0, proto, err: e.code || e.message }));
    req.end();
  });
  return get(http, 'http').then(r => (r.status || /TIMEOUT/i.test(r.err || '') ? r : get(https, 'https').then(r2 => (r2.status ? r2 : Object.assign(r, { kind: 'tcp' })))));
}

function create(plat, settings) {
  const dev = { health: new Map(), projects: new Map(), toolchain: null, wsl: null, timer: null };

  dev.projectFor = p => {
    const c = dev.projects.get(p.pid);
    if (c && c.start === p.start && Date.now() - c.at < 60000) return c.v;
    const d = describe(p.name, p.cmd);
    const v = d.script && path.isAbsolute(d.script) ? findProject(d.script) : null;
    dev.projects.set(p.pid, { v, start: p.start, at: Date.now() });
    // relative script ("node server.js"): resolve against the process cwd where the OS exposes it
    if (!v && plat.cwd) {
      plat.cwd(p.pid).then(cwd => { if (cwd) { const pv = findProject(d.script ? path.resolve(cwd, d.script) : cwd); dev.projects.set(p.pid, { v: pv, start: p.start, at: Date.now() }); } }).catch(() => {});
    }
    return v;
  };

  dev.check = async (procs, sock) => {
    if (!settings.healthChecks) return;
    const want = new Map();
    for (const p of procs) {
      if (!['runtime', 'server', 'ai'].includes(p.kind)) continue;
      for (const port of sock.byPid.get(p.pid) || []) if (want.size < 30) want.set(port, p.pid);
    }
    await Promise.all([...want.keys()].map(async port => { dev.health.set(port, Object.assign({ at: Date.now(), pid: want.get(port) }, await probeHttp(port))); }));
    for (const port of dev.health.keys()) if (!want.has(port)) dev.health.delete(port);
  };

  dev.loadToolchain = async () => {
    const out = [];
    for (const [name, args] of TOOLCHAIN) {
      if (name === 'node') { out.push({ name, version: process.version.replace(/^v/, ''), path: process.execPath }); continue; }
      const exe = U.which([name]);
      if (!exe || /WindowsApps/i.test(exe)) continue;
      const isCmd = /\.(cmd|bat)$/i.test(exe);
      const r = isCmd ? await U.run(process.env.ComSpec || 'cmd.exe', ['/d', '/c', name, ...args], { timeout: 6000 }) : await U.run(exe, args, { timeout: 6000 });
      const text = (r.stdout + ' ' + r.stderr).trim();
      const m = text.match(/(\d+\.\d+(?:\.\d+)?(?:[-+._][\w.]+)?)/);
      if (m) out.push({ name, version: m[1], path: exe });
    }
    dev.toolchain = out;
  };

  dev.pollWsl = async () => { if (plat.wsl) { try { dev.wsl = await plat.wsl(); } catch { dev.wsl = { installed: false, distros: [] }; } } };

  dev.annotate = p => {
    if (!DEV_KINDS.has(p.kind)) return;
    p.label = describe(p.name, p.cmd).label;
    const pr = dev.projectFor(p);
    if (pr) p.project = { name: pr.name, dir: pr.dir, branch: pr.branch, type: pr.type, version: pr.version };
  };
  dev.healthList = () => Object.fromEntries(dev.health);
  return dev;
}

module.exports = { create };
