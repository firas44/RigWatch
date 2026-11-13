'use strict';
/* Canvas charts: line/area with crosshair tooltip, sparklines, core heatmap; SVG gauge. */
(() => {
const { esc, f: F } = RW;
const COL = {};
function loadColors() {
  const cs = getComputedStyle(document.documentElement);
  for (const k of ['--s1', '--s2', '--s3', '--s4', '--s5', '--s6', '--s7', '--s8', '--line', '--axis', '--muted', '--panel', '--panel3', '--ink', '--ink2', '--accent']) COL[k] = cs.getPropertyValue(k).trim();
}
RW.on('theme', () => { loadColors(); RW.drawCharts(); });
loadColors();
const niceMax = v => { if (!(v > 0)) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; };
const charts = new Set();

/**
 * opts: { series:[{k, c:'--s1', l:'CPU'}], max, min, fmt, spark, points, range (bool: follow range selector), src(): {t:[], s:[[...]], n?, label?} }
 */
class Chart {
  constructor(cv, o) {
    this.cv = cv; this.o = o; this.hx = null;
    charts.add(this);
    if (!o.spark) {
      cv.addEventListener('mousemove', e => { const r = cv.getBoundingClientRect(); this.hx = e.clientX - r.left; this.draw(); });
      cv.addEventListener('mouseleave', () => { this.hx = null; RW.tip(null); this.draw(); });
      if (o.series.length > 1 && o.legend !== false) {
        const lg = document.createElement('div'); lg.className = 'legend';
        lg.innerHTML = o.series.map(s => '<span><i style="background:var(' + s.c + ')"></i>' + esc(s.l) + ' <b data-k="' + s.k + '"></b></span>').join('');
        cv.parentNode.insertBefore(lg, cv); this.lg = lg;
      }
    }
  }
  data() {
    if (this.o.src) return this.o.src();
    const H = this.o.range ? RW.histFor(RW.prefs.range) : RW.hist;
    const n = this.o.range ? H.t.length : (this.o.points || 300);
    const sl = a => (this.o.range ? a : a.slice(-n));
    return { n: Math.max(this.o.range ? H.t.length : n, 2), t: sl(H.t), s: this.o.series.map(s => sl(H[s.k] || [])) };
  }
  draw() {
    const cv = this.cv;
    if (!cv.isConnected) { charts.delete(this); return; }
    if (!cv.offsetParent) return;
    const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
    const dpr = window.devicePixelRatio || 1, W = Math.round(w * dpr), HH = Math.round(h * dpr);
    if (cv.width !== W || cv.height !== HH) { cv.width = W; cv.height = HH; }
    const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);
    const o = this.o, d = this.data(), n = d.n, sp = o.spark;
    const padR = sp ? 0 : 52, padT = sp ? 3 : 8, padB = sp ? 2 : (o.xAxis && d.t ? 16 : 4), pw = w - padR, ph = h - padT - padB;
    let max = o.max;
    if (!max) { let m = 0; for (const a of d.s) for (const v of a) if (v != null && v > m) m = v; max = niceMax(Math.max(m * 1.1, o.min || 1)); }
    if (!sp) {
      x.lineWidth = 1; x.font = '10px system-ui,-apple-system,"Segoe UI",sans-serif'; x.textBaseline = 'middle';
      for (const fr of [0, 0.5, 1]) {
        const y = Math.round(padT + ph * (1 - fr)) + 0.5;
        x.strokeStyle = fr === 0 ? COL['--axis'] : COL['--line']; x.beginPath(); x.moveTo(0, y); x.lineTo(pw, y); x.stroke();
        x.fillStyle = COL['--muted']; x.fillText(o.fmt(max * fr), pw + 6, y);
      }
      if (o.xAxis && d.t && d.t.length > 1) {
        x.textBaseline = 'alphabetic'; x.fillStyle = COL['--muted'];
        const t0 = d.t[0], t1 = d.t[d.t.length - 1], span = t1 - t0;
        const fmt = ts => (span > 2 * 86400e3 ? new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' }) : new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        x.textAlign = 'left'; x.fillText(fmt(t0), 0, h - 2); x.textAlign = 'right'; x.fillText(fmt(t1), pw, h - 2); x.textAlign = 'left';
      }
    }
    const len = d.s[0] ? d.s[0].length : 0, off = n - len;
    const X = i => (n > 1 ? (off + i) / (n - 1) * pw : 0);
    const Y = v => padT + ph * (1 - Math.min(Math.max(v, 0), max) / max);
    d.s.forEach((a, si) => {
      const col = COL[o.series[si].c] || '#888', segs = []; let seg = null;
      for (let i = 0; i < a.length; i++) { const v = a[i]; if (v == null || isNaN(v)) { seg = null; continue; } if (!seg) { seg = []; segs.push(seg); } seg.push([X(i), Y(v)]); }
      if (d.s.length === 1 && o.area !== false) {
        const g = x.createLinearGradient(0, padT, 0, padT + ph); g.addColorStop(0, col + (sp ? '30' : '33')); g.addColorStop(1, col + '05');
        x.fillStyle = g;
        for (const sg of segs) { x.beginPath(); x.moveTo(sg[0][0], padT + ph); for (const p of sg) x.lineTo(p[0], p[1]); x.lineTo(sg[sg.length - 1][0], padT + ph); x.closePath(); x.fill(); }
      }
      x.strokeStyle = col; x.lineWidth = sp ? 1.5 : 2; x.lineJoin = 'round'; x.lineCap = 'round';
      for (const sg of segs) { x.beginPath(); sg.forEach((p, j) => (j ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); if (sg.length === 1) x.lineTo(sg[0][0] + 0.1, sg[0][1]); x.stroke(); }
    });
    if (this.lg) o.series.forEach((s, si) => { const a = d.s[si], v = a && a.length ? a[a.length - 1] : null; const b = this.lg.querySelector('b[data-k="' + s.k + '"]'); if (b) b.textContent = v == null ? '' : o.fmt(v); });
    if (this.hx != null && !sp && len) {
      const idx = Math.round(this.hx / pw * (n - 1)) - off;
      if (idx < 0 || idx >= len || this.hx > pw) { RW.tip(null); return; }
      const px = X(idx);
      x.strokeStyle = COL['--axis']; x.lineWidth = 1; x.beginPath(); x.moveTo(Math.round(px) + 0.5, padT); x.lineTo(Math.round(px) + 0.5, padT + ph); x.stroke();
      const rows = [];
      d.s.forEach((a, si) => {
        const v = a[idx], s = o.series[si];
        if (v != null && !isNaN(v)) { x.fillStyle = COL['--panel']; x.beginPath(); x.arc(px, Y(v), 5.5, 0, 7); x.fill(); x.fillStyle = COL[s.c]; x.beginPath(); x.arc(px, Y(v), 3.5, 0, 7); x.fill(); }
        rows.push('<div class="tr"><span><i style="background:var(' + s.c + ')"></i>' + esc(s.l) + '</span><b>' + (v == null ? '–' : esc(o.fmt(v))) + '</b></div>');
      });
      const tt = d.label ? d.label(idx) : d.t && d.t[idx] ? (Date.now() - d.t[idx] < 3600e3 ? F.ago(d.t[idx]) : F.date(d.t[idx])) : '';
      const r = this.cv.getBoundingClientRect();
      RW.tip('<div class="tt">' + esc(tt) + '</div>' + rows.join(''), r.left + px, r.top + padT);
    }
  }
}
RW.Chart = Chart;
RW.chart = (cv, o) => new Chart(typeof cv === 'string' ? document.getElementById(cv) : cv, o);
RW.drawCharts = () => { for (const c of charts) c.draw(); };
RW.on('rendered', () => RW.drawCharts());
RW.on('range', () => RW.drawCharts());
window.addEventListener('resize', () => RW.drawCharts());

// common series presets
RW.SER = {
  cpu: { series: [{ k: 'cpu', c: '--s1', l: 'CPU' }], max: 100, fmt: v => F.pct(v) },
  gpu: { series: [{ k: 'gpu', c: '--s7', l: 'GPU' }], max: 100, fmt: v => F.pct(v) },
  mem: { series: [{ k: 'mem', c: '--s3', l: 'Memory' }], max: 100, fmt: v => F.pct(v) },
  vram: { series: [{ k: 'vram', c: '--s7', l: 'VRAM' }], max: 100, fmt: v => F.pct(v) },
  net: { series: [{ k: 'rx', c: '--s1', l: 'Download' }, { k: 'tx', c: '--s2', l: 'Upload' }], fmt: F.bits, min: 12500 },
  rx: { series: [{ k: 'rx', c: '--s1', l: 'Download' }], fmt: F.bits, min: 12500 },
  pkts: { series: [{ k: 'rxp', c: '--s1', l: 'In' }, { k: 'txp', c: '--s2', l: 'Out' }], fmt: v => F.num(v) + '/s', min: 10 },
  disk: { series: [{ k: 'dr', c: '--s1', l: 'Read' }, { k: 'dw', c: '--s2', l: 'Write' }], fmt: F.rate, min: 1048576 },
  temp: { series: [{ k: 'ct', c: '--s2', l: 'CPU' }, { k: 'gt', c: '--s7', l: 'GPU' }], fmt: F.temp, min: 60 },
  fps: { series: [{ k: 'fps', c: '--s6', l: 'FPS' }], fmt: v => Math.round(v) + ' fps', min: 30 },
  ping: { series: [{ k: 'ping', c: '--s5', l: 'Ping' }], fmt: F.ms, min: 20 },
  loss: { series: [{ k: 'loss', c: '--s8', l: 'Packet loss' }], max: 100, fmt: v => F.pct(v) },
  conns: { series: [{ k: 'conns', c: '--s4', l: 'Connections' }], fmt: F.num, min: 50 },
  swap: { series: [{ k: 'swap', c: '--s4', l: 'Swap' }], max: 100, fmt: v => F.pct(v) },
};
RW.preset = (name, extra) => Object.assign({}, RW.SER[name], extra || {});

// ---------- per-core heatmap (last 120 s) ----------
RW.coreHist = [];
RW.on('rendered', s => {
  const cores = (s.cpu && s.cpu.cores) || [];
  cores.forEach((c, i) => { const a = RW.coreHist[i] || (RW.coreHist[i] = []); a.push(c.u); if (a.length > 120) a.shift(); });
});
class Heat {
  constructor(cv) {
    this.cv = cv; charts.add(this);
    cv.addEventListener('mousemove', e => {
      const r = cv.getBoundingClientRect(), rows = RW.coreHist.length; if (!rows) return;
      const row = Math.floor((e.clientY - r.top) / (r.height / rows)), a = RW.coreHist[row]; if (!a) return;
      const col = Math.floor((e.clientX - r.left) / (r.width / 120)) - (120 - a.length); const v = a[col];
      RW.tip('<div class="tt">thread ' + row + ' · ' + (120 - col - (120 - a.length)) + ' s ago</div><div class="tr"><span>load</span><b>' + (v == null ? '–' : F.pct(v, 1)) + '</b></div>', e.clientX, e.clientY);
    });
    cv.addEventListener('mouseleave', () => RW.tip(null));
  }
  draw() {
    const cv = this.cv;
    if (!cv.isConnected) { charts.delete(this); return; }
    if (!cv.offsetParent) return;
    const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
    const dpr = window.devicePixelRatio || 1;
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);
    const rows = RW.coreHist.length; if (!rows) return;
    const rh = h / rows, cw = w / 120;
    const base = COL['--s1'];
    for (let r = 0; r < rows; r++) {
      const a = RW.coreHist[r], off = 120 - a.length;
      for (let i = 0; i < a.length; i++) {
        const v = Math.max(0, Math.min(100, a[i] || 0)) / 100;
        x.globalAlpha = 0.06 + v * 0.94; x.fillStyle = v < 0.02 ? COL['--panel3'] : base;
        x.fillRect((off + i) * cw, r * rh, Math.ceil(cw) + 0.5, Math.max(1, rh - 1));
      }
    }
    x.globalAlpha = 1;
  }
}
RW.heat = cv => new Heat(cv);

// ---------- gauge (SVG) ----------
RW.gauge = (v, max, col, big, sub) => {
  const p = Math.max(0, Math.min(1, (v || 0) / max)), r = 54, c = Math.PI * r;
  return '<div class="gauge"><svg viewBox="0 0 140 84" role="img" aria-label="' + esc(big) + '"><path d="M16 74a54 54 0 0 1 108 0" fill="none" stroke="var(--panel3)" stroke-width="12" stroke-linecap="round"/>' +
    '<path d="M16 74a54 54 0 0 1 108 0" fill="none" stroke="var(' + col + ')" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + (c * p).toFixed(1) + ' ' + c.toFixed(1) + '"/></svg>' +
    '<div class="gv"><div class="big">' + esc(big) + '</div>' + (sub ? '<div class="muted" style="font-size:12px">' + esc(sub) + '</div>' : '') + '</div></div>';
};
RW.scoreColor = s => (s >= 85 ? '--good' : s >= 65 ? '--warn' : s >= 40 ? '--serious' : '--crit');
})();
