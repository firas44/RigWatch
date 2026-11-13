#!/usr/bin/env node
'use strict';
// Bundles server.js + lib/**/*.js + public/** + lib/**/*.ps1 into dist/rigwatch.js:
// one file, zero dependencies, runnable with `node rigwatch.js`.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const walk = (dir, out = []) => {
  for (const f of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = dir + '/' + f.name;
    if (f.isDirectory()) walk(rel, out); else out.push(rel);
  }
  return out;
};
const modules = ['server.js', ...walk('lib').filter(f => f.endsWith('.js'))];
const assetFiles = [...walk('public'), ...walk('lib').filter(f => f.endsWith('.ps1'))];
const assets = {};
for (const a of assetFiles) assets[a] = fs.readFileSync(path.join(ROOT, a), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

const parts = [];
parts.push('#!/usr/bin/env node');
parts.push('/*! RigWatch ' + pkg.version + ' single-file build (' + new Date().toISOString().slice(0, 10) + '). MIT License. Source: https://github.com/ (server.js, lib/, public/) */');
parts.push("'use strict';");
parts.push('global.__RIGWATCH_ROOT = __dirname;');
parts.push('global.__RIGWATCH_ASSETS = ' + JSON.stringify(assets) + ';');
parts.push('const __M = Object.create(null), __C = Object.create(null), __P = require(\'path\').posix;');
for (const m of modules) {
  const src = fs.readFileSync(path.join(ROOT, m), 'utf8').replace(/^#!.*\r?\n/, '');
  parts.push('__M[' + JSON.stringify(m) + '] = function (module, exports, require) {\n' + src + '\n};');
}
parts.push([
  'function __req(from) {',
  '  return function (name) {',
  "    if (!name.startsWith('.')) return require(name);",
  '    let p = __P.normalize(__P.join(__P.dirname(from), name));',
  "    if (!__M[p]) p = __M[p + '.js'] ? p + '.js' : p + '/index.js';",
  "    if (!__M[p]) throw new Error('module not bundled: ' + name + ' (from ' + from + ')');",
  '    if (__C[p]) return __C[p].exports;',
  '    const module = { exports: {} };',
  '    __C[p] = module;',
  '    __M[p](module, module.exports, __req(p));',
  '    return module.exports;',
  '  };',
  '}',
  "__req('index.js')('./server.js');",
].join('\n'));

fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
const out = path.join(ROOT, 'dist', 'rigwatch.js');
fs.writeFileSync(out, parts.join('\n') + '\n');
console.log('built ' + path.relative(ROOT, out) + ' (' + (fs.statSync(out).size / 1024).toFixed(0) + ' KB, ' + modules.length + ' modules, ' + assetFiles.length + ' assets)');
