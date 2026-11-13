'use strict';
// Runtime config (env vars) + persisted settings in ~/.rigwatch/config.json
const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { int, clamp, readText } = require('./util');

const env = process.env;
const VERSION = '2.1.0';
const HOME = env.RIGWATCH_HOME || path.join(os.homedir(), '.rigwatch');

const CFG = {
  version: VERSION,
  home: HOME,
  port: int(env.PORT, 3000),
  portExplicit: env.PORT !== undefined && env.PORT !== '',
  host: env.HOST || '127.0.0.1',
  interval: clamp(int(env.INTERVAL_MS, 1000), 250, 10000),
  pingTarget: env.PING_TARGET === undefined ? '1.1.1.1:443' : env.PING_TARGET,
  lhmUrl: env.LHM_URL || 'http://127.0.0.1:8085/data.json',
  presentMon: env.PRESENTMON_PATH || '',
  presentMonArgs: env.PRESENTMON_ARGS || '',
  allowControl: env.ALLOW_CONTROL !== '0' && env.ALLOW_KILL !== '0',
  allowTools: env.ALLOW_TOOLS !== '0',
  allowedHosts: (env.ALLOWED_HOSTS || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean),
  localNeedsToken: env.LOCAL_TOKEN === '1',
  lanReadNeedsToken: env.LAN_READ === 'token',
  persist: env.NO_PERSIST !== '1',
  open: process.argv.includes('--open') || env.OPEN === '1',
  dockerHost: env.DOCKER_HOST || '',
};

const FILE = path.join(HOME, 'config.json');
const DEFAULT_SETTINGS = { resolveHostnames: true, procEvents: true, hostEvents: true, healthChecks: true };

function load() {
  let d = {};
  try { const raw = readText(FILE); d = raw ? JSON.parse(raw) : {}; } catch { d = {}; }
  if (env.RIGWATCH_TOKEN) d.token = env.RIGWATCH_TOKEN;
  if (!d.token || typeof d.token !== 'string' || d.token.length < 16) d.token = crypto.randomBytes(18).toString('base64url');
  d.settings = Object.assign({}, DEFAULT_SETTINGS, d.settings || {});
  d.webhook = Object.assign({ enabled: false, url: '', format: 'discord' }, d.webhook || {});
  if (!Array.isArray(d.alerts)) d.alerts = null; // null -> defaults from alerts.js
  if (!Array.isArray(d.knownDevices)) d.knownDevices = [];
  d.siem = Object.assign({ autoBlock: false, autoLevel: 10, autoMinutes: 1440, allowPrivate: false, feed: false, notifyLevel: 12, trusted: [], fimPaths: [] }, d.siem || {});
  return d;
}

const store = load();
let saveTimer = null;
function save(now) {
  if (!CFG.persist) return;
  const write = () => {
    saveTimer = null;
    try {
      fs.mkdirSync(HOME, { recursive: true });
      const tmp = FILE + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(store, null, 2), { mode: 0o600 });
      fs.renameSync(tmp, FILE);
    } catch { /* read-only home: ignore */ }
  };
  if (now) return write();
  if (!saveTimer) saveTimer = setTimeout(write, 500);
}
save();

module.exports = { CFG, store, save, VERSION };
