'use strict';
// Continuous latency probe: TCP connect round-trip (no admin / raw sockets needed).
const net = require('net');
const U = require('./util');

function create(target) {
  const p = { target: '', host: '', port: 443, last: null, samples: [], timer: null };
  const t = String(target || '').trim();
  if (t && t !== 'off' && t !== '0') {
    const m = t.match(/^\[?([^\]]+?)\]?(?::(\d+))?$/);
    if (m) { p.host = m[1]; p.port = U.int(m[2], 443); p.target = p.host + ':' + p.port; }
  }
  function once() {
    const t0 = process.hrtime.bigint();
    let done = false;
    const s = net.connect({ host: p.host, port: p.port });
    s.setTimeout(2000);
    const fin = ok => {
      if (done) return; done = true; s.destroy();
      p.last = ok ? Number(process.hrtime.bigint() - t0) / 1e6 : null;
      p.samples.push(p.last); if (p.samples.length > 60) p.samples.shift();
    };
    s.once('connect', () => fin(true));
    s.once('timeout', () => fin(false));
    s.once('error', () => fin(false));
  }
  p.start = () => { if (!p.target) return; setTimeout(() => { once(); p.timer = setInterval(once, 2000); p.timer.unref(); }, 3000).unref(); };
  p.stop = () => clearInterval(p.timer);
  p.stats = () => {
    if (!p.target) return null;
    const recent = p.samples.slice(-30), ok = recent.filter(v => v != null);
    let jitter = 0;
    for (let i = 1; i < ok.length; i++) jitter += Math.abs(ok[i] - ok[i - 1]);
    return {
      target: p.target, ms: p.last == null ? null : U.r1(p.last),
      avg: ok.length ? U.r1(ok.reduce((a, b) => a + b, 0) / ok.length) : null,
      min: ok.length ? U.r1(Math.min(...ok)) : null, max: ok.length ? U.r1(Math.max(...ok)) : null,
      jitter: ok.length > 1 ? U.r1(jitter / (ok.length - 1)) : 0, loss: recent.length ? U.r1(100 * (recent.length - ok.length) / recent.length) : 0,
    };
  };
  return p;
}

module.exports = { create };
