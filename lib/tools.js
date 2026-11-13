'use strict';
// Optional Windows helpers, fetched automatically on first run from their official GitHub
// releases. Versions are pinned and every download is SHA-256 verified before use.
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const U = require('./util');
const { ROOT } = require('./assets');
const { CFG } = require('./config');

const TOOLS = {
  lhm: {
    label: 'LibreHardwareMonitor 0.9.6 (sensor library)', zip: true, dir: 'LibreHardwareMonitor', check: 'LibreHardwareMonitor/LibreHardwareMonitorLib.dll',
    url: 'https://github.com/LibreHardwareMonitor/LibreHardwareMonitor/releases/download/v0.9.6/LibreHardwareMonitor.zip',
    sha256: '086d9f1b5a99e643edc2cfaaac16051685b551e4c5ac0b32a57c58c0e529c001',
  },
  presentmon: {
    label: 'Intel PresentMon 2.6.0 (frame capture)', file: 'PresentMon-2.6.0-x64.exe', check: 'PresentMon-2.6.0-x64.exe',
    url: 'https://github.com/GameTechDev/PresentMon/releases/download/v2.6.0/PresentMon-2.6.0-x64.exe',
    sha256: 'b2a706bc6ad475749e3b7e3409263aa1e6906d45bdcf993f6dbc0f660188f1af',
  },
  pawnio: {
    label: 'PawnIO 2.2.0 driver installer (CPU/board sensors)', file: 'PawnIO_setup.exe', check: 'PawnIO_setup.exe', onDemand: true,
    url: 'https://github.com/namazso/PawnIO.Setup/releases/download/2.2.0/PawnIO_setup.exe',
    sha256: '1f519a22e47187f70a1379a48ca604981c4fcf694f4e65b734aaa74a9fba3032',
  },
};
const state = {};
for (const k of Object.keys(TOOLS)) state[k] = { state: 'missing', path: null, err: '' };

function dirs() {
  return [process.env.RIGWATCH_TOOLS, path.join(ROOT, 'tools'), path.join(ROOT, 'bin'), path.join(CFG.home, 'tools')].filter(Boolean);
}
function writableDir() {
  for (const d of [process.env.RIGWATCH_TOOLS, path.join(ROOT, 'tools'), path.join(CFG.home, 'tools')].filter(Boolean)) {
    try { fs.mkdirSync(d, { recursive: true }); fs.accessSync(d, fs.constants.W_OK); return d; } catch { /* next */ }
  }
  return null;
}
/** Path of an installed tool, or null. LHM also counts if any LibreHardwareMonitorLib.dll is present. */
function find(name) {
  const t = TOOLS[name];
  for (const d of dirs()) {
    const p = path.join(d, t.check);
    if (fs.existsSync(p)) return t.zip ? path.dirname(p) : p;
  }
  if (name === 'presentmon') { const p = U.findFile(/^presentmon.*\.exe$/i, dirs()); if (p) return p; }
  if (name === 'lhm') for (const d of dirs()) { try { for (const sub of fs.readdirSync(d)) { const p = path.join(d, sub, 'LibreHardwareMonitorLib.dll'); if (fs.existsSync(p)) return path.dirname(p); } } catch { /* skip */ } }
  return null;
}

function get(url, dest, sha, hops = 0) {
  return new Promise((resolve, reject) => {
    if (hops > 6) return reject(new Error('too many redirects'));
    const req = https.get(url, { headers: { 'user-agent': 'RigWatch' }, timeout: 30000 }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) { res.resume(); return resolve(get(new URL(res.headers.location, url).href, dest, sha, hops + 1)); }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      const tmp = dest + '.part', out = fs.createWriteStream(tmp), h = crypto.createHash('sha256');
      res.on('data', d => h.update(d));
      res.pipe(out);
      out.on('finish', () => {
        const got = h.digest('hex');
        if (got !== sha) { fs.rmSync(tmp, { force: true }); return reject(new Error('checksum mismatch (got ' + got.slice(0, 12) + '…)')); }
        fs.renameSync(tmp, dest); resolve(dest);
      });
      out.on('error', reject); res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

async function extract(zip, dest) {
  fs.mkdirSync(dest, { recursive: true });
  let r = await U.run(U.sys32('tar.exe'), ['-xf', zip, '-C', dest], { timeout: 120000 });
  if (!r.ok) r = await U.run(U.psExe(), ['-NoProfile', '-NonInteractive', '-Command', 'Expand-Archive -LiteralPath $env:RW_ZIP -DestinationPath $env:RW_DEST -Force'], { timeout: 120000, env: Object.assign({}, process.env, { RW_ZIP: zip, RW_DEST: dest }) });
  if (!r.ok) throw new Error('could not unzip: ' + r.stderr.trim().slice(0, 200));
}

const inflight = {};
/** Make sure a tool is present; downloads it if allowed. Resolves to its path or null. */
function ensure(name, force) {
  const found = find(name);
  if (found) { state[name] = { state: 'ready', path: found, err: '' }; return Promise.resolve(found); }
  if (!U.IS_WIN || (process.env.NO_DOWNLOAD === '1' && !force)) return Promise.resolve(null);
  if (TOOLS[name].onDemand && !force) return Promise.resolve(null);
  if (inflight[name]) return inflight[name];
  const t = TOOLS[name];
  const dir = writableDir();
  if (!dir) { state[name] = { state: 'error', path: null, err: 'no writable tools folder' }; return Promise.resolve(null); }
  state[name] = { state: 'downloading', path: null, err: '' };
  U.log('downloading ' + t.label + ' …');
  inflight[name] = (async () => {
    try {
      if (t.zip) {
        const zip = path.join(dir, path.basename(new URL(t.url).pathname));
        await get(t.url, zip, t.sha256);
        await extract(zip, path.join(dir, t.dir));
        fs.rmSync(zip, { force: true });
      } else await get(t.url, path.join(dir, t.file), t.sha256);
      const p = find(name);
      state[name] = { state: p ? 'ready' : 'error', path: p, err: p ? '' : 'installed but not found' };
      U.log(t.label + ' ready');
      return p;
    } catch (e) {
      state[name] = { state: 'error', path: null, err: e.message };
      U.log(t.label + ' download failed: ' + e.message);
      return null;
    } finally { delete inflight[name]; }
  })();
  return inflight[name];
}

module.exports = { TOOLS, ensure, find, state };
