'use strict';
// Small shared helpers. No dependencies.
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const IS_WIN = process.platform === 'win32';
const int = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const num = v => { const n = +v; return Number.isFinite(n) ? n : 0; };
const opt = v => { if (v === null || v === undefined || v === '') return null; const n = parseFloat(v); return Number.isFinite(n) ? n : null; };
const r1 = v => Math.round(v * 10) / 10;
const r2 = v => Math.round(v * 100) / 100;
const arr = x => Array.isArray(x) ? x : x && Array.isArray(x.value) ? x.value : x ? [x] : [];
const trunc = (s, n) => { s = s == null ? '' : String(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log('[rigwatch]', ...a);

/** execFile wrapper that never rejects. */
function run(cmd, args = [], o = {}) {
  return new Promise(resolve => {
    const t0 = Date.now();
    try {
      execFile(cmd, args, {
        windowsHide: true, timeout: o.timeout || 15000, maxBuffer: o.maxBuffer || 64 << 20,
        encoding: o.encoding || 'utf8', env: o.env || process.env, cwd: o.cwd,
      }, (err, stdout, stderr) => {
        resolve({ ok: !err, code: err ? (typeof err.code === 'number' ? err.code : -1) : 0, stdout: stdout || '', stderr: String(stderr || (err ? err.message : '')), ms: Date.now() - t0 });
      });
    } catch (e) { resolve({ ok: false, code: -1, stdout: '', stderr: e.message, ms: 0 }); }
  });
}

const whichCache = new Map();
/** Find an executable on PATH (+ extra dirs). Cached. */
function which(names, extra = []) {
  names = [].concat(names);
  const key = names.join('|') + '#' + extra.join('|');
  if (whichCache.has(key)) return whichCache.get(key);
  const exts = IS_WIN ? ['.exe', '.cmd', '.bat', ''] : [''];
  const dirs = [...extra, ...(process.env.PATH || '').split(path.delimiter)].filter(Boolean);
  let found = null;
  outer: for (const n of names) {
    for (const d of dirs) {
      for (const e of exts) {
        const p = path.join(d, n + e);
        try { if (fs.statSync(p).isFile()) { found = p; break outer; } } catch { /* next */ }
      }
    }
  }
  whichCache.set(key, found);
  return found;
}

/** First file in dirs whose name matches rx. */
function findFile(rx, dirs) {
  for (const d of dirs) {
    if (!d) continue;
    try { for (const f of fs.readdirSync(d)) if (rx.test(f)) return path.join(d, f); } catch { /* skip */ }
  }
  return null;
}

/** Calls onLine for every complete line on a readable stream. */
function onLines(stream, onLine) {
  let buf = '';
  stream.setEncoding('utf8');
  stream.on('data', d => {
    buf += d;
    const parts = buf.split('\n');
    buf = parts.pop();
    for (let l of parts) { if (l.endsWith('\r')) l = l.slice(0, -1); if (l) onLine(l); }
  });
  stream.on('end', () => { if (buf) onLine(buf); buf = ''; });
}

function readText(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }
async function readTextAsync(p) { try { return await fs.promises.readFile(p, 'utf8'); } catch { return null; } }

/** Classify an IP address. */
function ipKind(ip) {
  if (!ip || ip === '*') return 'any';
  ip = String(ip).replace(/^::ffff:/i, '').replace(/%.*$/, '');
  if (ip === '0.0.0.0' || ip === '::') return 'any';
  if (ip === '::1' || ip.startsWith('127.')) return 'loopback';
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip) || /^f[cd][0-9a-f]{2}:/i.test(ip)) return 'private';
  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(ip)) return 'cgnat';
  if (ip.startsWith('169.254.') || /^fe[89ab][0-9a-f]:/i.test(ip)) return 'linklocal';
  if (/^(22[4-9]|23\d)\./.test(ip) || /^ff[0-9a-f]{2}:/i.test(ip) || ip === '255.255.255.255') return 'multicast';
  return 'public';
}
const isLoopback = h => ipKind(h) === 'loopback' || h === 'localhost';
const isAnyAddr = h => h === '0.0.0.0' || h === '::' || h === '*' || h === '[::]';

const SECRET_RX = /((?:^|[\s"'])-{0,2}(?:password|passwd|pwd|token|secret|api[-_]?key|access[-_]?key|client[-_]?secret|private[-_]?key|auth[-_]?token|bearer)["']?\s*[=:\s]\s*["']?)([^\s"'&]+)/gi;
/** Masks obvious secrets in command lines before they leave the server. */
function redact(cmd) {
  if (!cmd) return '';
  return String(cmd)
    .replace(SECRET_RX, '$1••••')
    .replace(/(\w+:\/\/[^:\s/@]+:)([^@\s]+)@/g, '$1••••@');
}

/** Split a command line respecting double quotes (Windows-ish, good enough for unix too). */
function splitArgs(cmd) {
  const out = []; let cur = '', q = false, has = false;
  for (const ch of String(cmd || '')) {
    if (ch === '"') { q = !q; has = true; continue; }
    if (!q && (ch === ' ' || ch === '\t')) { if (cur || has) out.push(cur); cur = ''; has = false; continue; }
    cur += ch;
  }
  if (cur || has) out.push(cur);
  return out;
}

/** Parse "1:02:03", "02:03", "1-02:03:04" (ps etime) or "12:34.56" (ps time) to seconds. */
function parseDuration(s) {
  if (!s) return 0;
  s = String(s).trim();
  let days = 0;
  const dash = s.indexOf('-');
  if (dash > 0) { days = num(s.slice(0, dash)); s = s.slice(dash + 1); }
  const p = s.split(':').map(Number);
  let sec = 0;
  for (const v of p) sec = sec * 60 + (Number.isFinite(v) ? v : 0);
  return days * 86400 + sec;
}

/** Simple per-key rate calculator: rate(key, value, now) -> units per second (null first time). */
class Rates {
  constructor() { this.m = new Map(); }
  rate(key, value, now = Date.now()) {
    const p = this.m.get(key);
    this.m.set(key, { v: value, t: now, seen: now });
    if (!p || now <= p.t || value < p.v) return null;
    return (value - p.v) / ((now - p.t) / 1000);
  }
  prune(maxAgeMs = 60000, now = Date.now()) { for (const [k, v] of this.m) if (now - v.seen > maxAgeMs) this.m.delete(k); }
}

/** Atomic-ish JSON write. */
function writeJson(file, obj) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
    fs.renameSync(tmp, file);
    return true;
  } catch { return false; }
}

/** Windows PowerShell 5.1 by absolute path (works even with a broken PATH). */
function psExe() {
  if (!IS_WIN) return 'pwsh';
  const p = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  try { fs.accessSync(p); return p; } catch { return 'powershell.exe'; }
}
function sys32(exe) {
  if (!IS_WIN) return exe;
  const p = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', exe);
  try { fs.accessSync(p); return p; } catch { return exe; }
}

const SAFE_HOST =/^[A-Za-z0-9._:%\-[\]]{1,253}$/;
/** Validates a host/IP passed to external tools (prevents option injection). */
function safeHost(h) { h = String(h || '').trim(); return SAFE_HOST.test(h) && !h.startsWith('-') ? h : null; }

module.exports = {
  IS_WIN, int, clamp, num, opt, r1, r2, arr, trunc, sleep, log, run, which, findFile, onLines, readText, readTextAsync,
  ipKind, isLoopback, isAnyAddr, redact, splitArgs, parseDuration, Rates, writeJson, safeHost, psExe, sys32,
};
