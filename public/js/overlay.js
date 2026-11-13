'use strict';
/* Compact live overlay: /overlay?items=fps,cpu,gpu,ram&bg=clear&layout=row&scale=1.2 */
(() => {
  const q = new URLSearchParams(location.search);
  const items = (q.get('items') || 'fps,cpu,gpu,ram,vram,ping').split(',').map(s => s.trim()).filter(Boolean);
  const bg = q.get('bg') || 'glass';
  if (bg === 'dark') document.body.classList.add('dark');
  if (bg === 'clear') document.body.classList.add('clear');
  if (q.get('layout') === 'col') document.body.classList.add('col');
  const scale = Math.min(4, Math.max(0.5, parseFloat(q.get('scale')) || 1));
  const o = document.getElementById('o');
  o.style.transform = 'scale(' + scale + ')';
  if (!q.toString()) document.getElementById('help').hidden = false;
  const esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const pct = v => (v == null ? '–' : Math.round(v) + '%');
  const t = c => (c == null ? '' : ' <span class="' + (c >= 90 ? 'crit' : c >= 80 ? 'hot' : '') + '">' + Math.round(c) + '°</span>');
  const gb = b => (b == null ? '–' : (b / 1073741824).toFixed(1) + 'G');
  const bits = B => { let b = B * 8, i = 0; const u = ['b', 'K', 'M', 'G']; while (b >= 1000 && i < 3) { b /= 1000; i++; } return (i ? b.toFixed(b >= 100 ? 0 : 1) : Math.round(b)) + u[i]; };
  const R = {
    fps: s => (s.fps.main ? '<b>FPS</b>' + Math.round(s.fps.main.fps) + (s.fps.main.low1 ? '<small>1% ' + Math.round(s.fps.main.low1) + '</small>' : '') : '<b>FPS</b>–'),
    cpu: s => '<b>CPU</b>' + pct(s.cpu.util) + t(s.cpu.temp),
    gpu: s => (s.gpus[0] ? '<b>GPU</b>' + pct(s.gpus[0].util) + t(s.gpus[0].temp) : ''),
    ram: s => '<b>RAM</b>' + gb(s.mem.used) + '<small>/' + gb(s.mem.total) + '</small>',
    vram: s => (s.gpus[0] && s.gpus[0].vramTotal ? '<b>VRAM</b>' + gb(s.gpus[0].vramUsed) + '<small>/' + gb(s.gpus[0].vramTotal) + '</small>' : ''),
    temp: s => (s.temps.length ? '<b>TEMP</b>' + s.temps.slice(0, 3).map(x => Math.round(x.value) + '°').join(' ') : ''),
    net: s => '<b>NET</b>↓' + bits(s.net.rx) + ' ↑' + bits(s.net.tx),
    ping: s => (s.net.ping ? '<b>PING</b>' + (s.net.ping.ms == null ? 'timeout' : Math.round(s.net.ping.ms) + 'ms') + (s.net.ping.loss ? '<small>' + s.net.ping.loss + '% loss</small>' : '') : ''),
    disk: s => { const r = s.disks.reduce((a, d) => a + (d.read || d.total || 0) + (d.write || 0), 0); return '<b>DISK</b>' + (r / 1048576).toFixed(1) + 'MB/s'; },
  };
  const es = new EventSource('/api/stream');
  es.addEventListener('snap', e => {
    const s = JSON.parse(e.data);
    o.innerHTML = items.map(k => (R[k] ? R[k](s) : '')).filter(Boolean).map(h => '<span class="i">' + h + '</span>').join('');
  });
  es.onerror = () => { o.textContent = 'RigWatch offline…'; };
  void esc;
})();
