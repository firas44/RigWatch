'use strict';
/* Boot: nav, routing, global clicks, keyboard shortcuts, command palette, SSE. */
(() => {
const { $, esc, icon } = RW;
// only show pages that are implemented
RW.NAV = RW.NAV.map(([g, items]) => [g, items.filter(([id]) => RW.pages[id])]).filter(([, items]) => items.length);

document.documentElement.setAttribute('data-theme', RW.prefs.theme);
RW.applyAppearance();
if (RW.prefs.side === 'closed') $('#app').classList.add('collapsed');
$('#sideToggle').innerHTML = icon('menu');
$('#drawerClose').innerHTML = icon('x');
$('#paletteBtn .ico').innerHTML = icon('search');
RW.renderNav();

$('#sideToggle').onclick = () => {
  if (innerWidth <= 820) { $('#app').classList.toggle('mobile-open'); return; }
  const c = $('#app').classList.toggle('collapsed'); RW.prefs.side = c ? 'closed' : 'open'; RW.savePrefs(); setTimeout(RW.drawCharts, 50);
};
$('#drawerClose').onclick = () => RW.drawer.close();
$('#paletteBtn').onclick = () => palette();

function togglePause() { RW.paused = !RW.paused; RW.renderTopActions(); if (!RW.paused) RW.renderAll(); else if (RW.snap) RW.renderStatus(RW.snap); }
function cmd(c) {
  if (c === 'pause') return togglePause();
  if (c === 'theme') return RW.applyTheme(RW.prefs.theme === 'dark' ? 'light' : 'dark');
  if (c === 'elevate') return RW.elevate();
  if (c === 'pawnio') return RW.pawnio();
  if (RW.dashCmd) RW.dashCmd(c);
}

document.addEventListener('click', async e => {
  const el = e.target.closest('[data-go],[data-pid],[data-q],[data-sort],[data-cmd],[data-range],[data-killport]');
  if (!el || (e.target.closest('a[href]') && !el.matches('[data-go],[data-pid]'))) return;
  if (el.dataset.go) { e.preventDefault(); return RW.go(el.dataset.go); }
  if (el.dataset.range) return RW.setRange(el.dataset.range);
  if (el.dataset.cmd) return cmd(el.dataset.cmd);
  if (el.dataset.sort) { const st = RW.sorts[el.dataset.sort] || (RW.sorts[el.dataset.sort] = { k: null, d: -1 }); if (st.k === el.dataset.k) st.d = -st.d; else { st.k = el.dataset.k; st.d = el.dataset.k === 'name' || el.dataset.k === 'port' ? 1 : -1; } return RW.renderAll(); }
  if (el.dataset.killport) {
    e.stopPropagation();
    const port = +el.dataset.killport;
    if (await RW.confirm('Free port ' + port + '?', 'Ends the process listening on ' + el.dataset.proto + ' ' + port + ' and its children.', { danger: true, ok: 'Kill' })) RW.action({ type: 'port.kill', port, proto: el.dataset.proto });
    return;
  }
  if (el.dataset.pid) { if (String(window.getSelection())) return; return RW.openProc(+el.dataset.pid); }
  if (el.dataset.q) { RW.prefs.procView = 'table'; RW.savePrefs(); return RW.go('processes', { q: el.dataset.q }); }
});

// table <-> chart switch (works for every RW.table)
document.addEventListener('click', e => {
  const b = e.target.closest('[data-tview]'); if (!b) return;
  e.stopPropagation();
  const i = b.dataset.tview.lastIndexOf(':');
  RW.prefs.views[b.dataset.tview.slice(0, i)] = b.dataset.tview.slice(i + 1); RW.savePrefs();
  RW.emit('tableview'); RW.renderAll();
}, true);
document.addEventListener('change', e => {
  const s = e.target.closest('[data-tmetric]'); if (!s) return;
  RW.prefs.chartBy[s.dataset.tmetric] = s.value; RW.savePrefs();
  RW.emit('tableview'); RW.renderAll();
});

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); return palette(); }
  if (e.key === 'Escape' && !$('#drawer').hidden && !$('#modalRoot').children.length) return RW.drawer.close();
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName);
  if (typing || e.ctrlKey || e.metaKey || e.altKey || $('#modalRoot').children.length) return;
  const pages = RW.NAV.flatMap(([, items]) => items.map(i => i[0]));
  if (/^[1-9]$/.test(e.key) && pages[+e.key - 1]) return RW.go(pages[+e.key - 1]);
  if (e.key === '/') { e.preventDefault(); RW.go('processes'); setTimeout(() => { const i = $('#pq'); if (i) i.focus(); }, 60); return; }
  if (e.key === 'p' || e.key === 'P') return togglePause();
  if (e.key === 't' || e.key === 'T') return cmd('theme');
  if ((e.key === 'e' || e.key === 'E') && RW.page === 'dashboard') return cmd('editdash');
  if (e.key === '[') return $('#sideToggle').click();
});

// ---------- command palette ----------
function palette() {
  if ($('#modalRoot .palette')) return;
  const items = q => {
    const out = [], s = RW.snap, ql = q.toLowerCase().trim();
    const add = (group, label, ic, hint, run) => { if (!ql || (label + ' ' + (hint || '')).toLowerCase().includes(ql)) out.push({ group, label, ic, hint, run }); };
    for (const [, list] of RW.NAV) for (const [id, label, ic] of list) add('Pages', label, ic, 'go', () => RW.go(id));
    add('Actions', 'Toggle theme', 'sun', 'T', () => cmd('theme'));
    add('Actions', RW.paused ? 'Resume live updates' : 'Pause live updates', 'pause', 'P', () => togglePause());
    add('Actions', 'Customize dashboard', 'edit', 'E', () => { RW.go('dashboard'); setTimeout(() => cmd('editdash'), 50); });
    add('Actions', 'Export processes (CSV)', 'download', '', () => { location.href = '/api/export?what=processes&format=csv'; });
    add('Actions', 'Export metric history 24h (CSV)', 'download', '', () => { location.href = '/api/history?range=24h&format=csv'; });
    const m = ql.match(/^:?(\d{1,5})$/);
    if (s && m) {
      const port = +m[1];
      for (const l of s.ports.listen.filter(x => x.port === port)) out.unshift({ group: 'Port ' + port, label: RW.pname(s, l.pid) + ' (' + l.pid + ') on ' + l.proto + ' ' + port, ic: 'unlock', hint: 'open details', run: () => RW.openProc(l.pid) });
      const pp = RW.pidMap(s).get(port); if (pp) out.unshift({ group: 'PID', label: pp.name + ' (' + pp.pid + ')', ic: 'list', hint: 'open', run: () => RW.openProc(pp.pid) });
    }
    if (s && ql.length >= 2 && !m) for (const p of s.procs.filter(p => (p.name + ' ' + (p.label || '')).toLowerCase().includes(ql)).sort((a, b) => b.cpu - a.cpu).slice(0, 8)) out.push({ group: 'Processes', label: p.name + (p.label && p.label !== p.name ? ' · ' + p.label : ''), ic: 'list', hint: 'PID ' + p.pid, run: () => RW.openProc(p.pid) });
    return out.slice(0, 40);
  };
  let sel = 0, cur = [];
  const md = RW.modal({ cls: 'palette', body: '<input type="text" id="palq" placeholder="Jump to a page, a process, a port (:3000) or a PID" autocomplete="off"><div class="pl" id="pall"></div>' });
  md.el.querySelector('.mb').style.padding = '0';
  const render = () => {
    cur = items($('#palq').value); sel = Math.min(sel, Math.max(0, cur.length - 1));
    let g = '';
    $('#pall').innerHTML = cur.map((it, i) => (it.group !== g ? '<div class="pg">' + esc(g = it.group) + '</div>' : '') + '<div class="pi' + (i === sel ? ' on' : '') + '" data-i="' + i + '">' + icon(it.ic) + '<span>' + esc(it.label) + '</span><span class="ph">' + esc(it.hint || '') + '</span></div>').join('') || '<div class="empty">No match</div>';
  };
  const run = i => { const it = cur[i]; if (it) { md.close(); it.run(); } };
  $('#palq').addEventListener('input', () => { sel = 0; render(); });
  $('#palq').addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { sel = Math.min(cur.length - 1, sel + 1); render(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); render(); e.preventDefault(); }
    if (e.key === 'Enter') run(sel);
  });
  $('#pall').addEventListener('click', e => { const it = e.target.closest('[data-i]'); if (it) run(+it.dataset.i); });
  render(); setTimeout(() => $('#palq').focus(), 20);
}

document.addEventListener('visibilitychange', () => { if (!document.hidden && !RW.paused) RW.renderAll(); });
window.addEventListener('hashchange', RW.route);
RW.on('hello', () => RW.renderTopActions());
RW.route();
RW.connect();
})();
