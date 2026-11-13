'use strict';
// Reads bundled assets (UI files, PowerShell scripts). In the single-file build they are
// embedded in global.__RIGWATCH_ASSETS; from source they are read from disk.
const fs = require('fs');
const path = require('path');

const ROOT = global.__RIGWATCH_ROOT || path.join(__dirname, '..');
const cache = new Map();

function read(rel) {
  const A = global.__RIGWATCH_ASSETS;
  if (A && A[rel] != null) return A[rel];
  if (cache.has(rel) && !process.env.RIGWATCH_DEV) return cache.get(rel);
  const v = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  cache.set(rel, v);
  return v;
}
function exists(rel) {
  const A = global.__RIGWATCH_ASSETS;
  if (A) return A[rel] != null;
  try { fs.accessSync(path.join(ROOT, rel)); return true; } catch { return false; }
}

module.exports = { read, exists, ROOT };
