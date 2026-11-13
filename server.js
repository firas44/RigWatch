#!/usr/bin/env node
/*!
 * RigWatch 2 - your whole machine on one page. Zero dependencies, Windows / Linux / macOS.
 *   node server.js                 -> http://localhost:3000 (Windows asks for admin once via UAC)
 *   node server.js --no-elevate    -> run without admin
 *   HOST=0.0.0.0 node server.js    -> also on your LAN (read-only unless the token URL is used)
 * MIT License
 */
'use strict';
const major = +process.versions.node.split('.')[0];
if (major < 18) {
  console.error('RigWatch needs Node.js 18 or newer (this is ' + process.version + '). Get the LTS version from https://nodejs.org');
  process.exit(1);
}
const elevate = require('./lib/elevate');

elevate.childBootstrap();
if (elevate.shouldElevate()) {
  elevate.launch().then(elevated => { if (!elevated) require('./lib/server'); });
} else {
  require('./lib/server');
}
