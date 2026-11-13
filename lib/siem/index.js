'use strict';
// RigWatch SIEM: ties the event store, collectors, correlation, IP intelligence, active response,
// configuration assessment and file integrity together, and serves /api/siem/*.
const os = require('os');
const path = require('path');
const U = require('../util');
const R = require('./rules');
const { EventStore, dayKey, DAY } = require('./store');
const { IpTracker, Programs, Feeds } = require('./ips');
const { Blocks } = require('./blocks');
const collect = require('./collect');
const { Sca } = require('./sca');
const { Fim } = require('./fim');

const RANGES = { '1h': 3600e3, '24h': DAY, '7d': 7 * DAY, '30d': 30 * DAY, '90d': 90 * DAY, '365d': 365 * DAY, '1y': 365 * DAY };
/** Wazuh-style modules: which rule groups feed which dashboard */
const MODULES = {
  auth: ['authentication_success', 'authentication_failed', 'authentication_failures', 'logoff', 'session', 'rdp', 'sshd', 'sudo', 'new_source', 'remote_access'],
  network: ['network', 'firewall_drop', 'port_scan', 'threat_intel', 'inbound', 'new_host', 'lan'],
  malware: ['malware', 'defender', 'suspicious', 'new_program', 'threat_intel', 'defense_evasion'],
  fim: ['syscheck'],
  sca: ['sca'],
  audit: ['account_changed', 'service_installed', 'scheduled_task', 'log_cleared', 'policy_changed', 'audit', 'system', 'firewall', 'rigwatch'],
  response: ['active_response'],
};
function modulesOf(ev) {
  const g = ev.rule.groups, out = ['events'];
  for (const [m, gs] of Object.entries(MODULES)) if (g.some(x => gs.includes(x))) out.push(m);
  if ((ev.rule.mitre || []).length) out.push('mitre');
  return out;
}
const AR_GROUPS = ['brute_force', 'port_scan', 'threat_intel', 'authentication_failures'];
const LOGON_TYPES_NAMES = R.LOGON_TYPES;

function create(engine, broadcast, CFG, store, save) {
  const plat = engine.plat;
  const dir = path.join(CFG.home, 'siem');
  const retention = U.clamp(U.int(process.env.RETENTION_DAYS, 365), 1, 3650);
  const S = store.siem;
  const st = new EventStore(dir, { persist: CFG.persist, retentionDays: retention, maxMB: U.clamp(U.int(process.env.SIEM_MAX_MB, 256), 16, 10240), modulesOf });
  const ips = new IpTracker(path.join(dir, 'ips.json'), CFG.persist, retention, d => st.noteUniq(d));
  const programs = new Programs(path.join(dir, 'programs.json'), CFG.persist, retention);
  const feeds = new Feeds(path.join(dir, 'feeds'), CFG.persist);
  const protectedIps = () => {
    const out = (S.trusted || []).map(ip => ({ ip, why: 'it is on your trusted list' }));
    const n = engine.security.net || {};
    for (const r of n.routes || []) if (/^(0\.0\.0\.0\/0|::\/0)$/.test(r.dest) && r.gw && !/^(0\.0\.0\.0|::)$/.test(r.gw)) out.push({ ip: r.gw, why: 'it is your default gateway' });
    for (const d of n.dns || []) for (const s of d.servers || []) out.push({ ip: s, why: 'it is one of your DNS servers' });
    return out;
  };
  const blocks = new Blocks(path.join(dir, 'blocks.json'), CFG.persist, plat, protectedIps);
  const cor = new R.Correlator();
  const live = [];
  let refreshPending = false, arCount = [];
  const notified = new Map();
  const daily = new Map(); // dedupe keys per day (inbound per ip+port, feed hits)

  // ---------------------------------------------------------------- emit
  function emit(ev) {
    st.add(ev);
    const fresh = Date.now() - ev.ts < 15 * 60e3;
    if (ev.ip && !R.isLocalIp(ev.ip)) {
      ips.noteEvent(ev.ip, ev.rule.level, ev.ts);
      const g = ev.rule.groups;
      if (g.includes('authentication_failed')) ips.noteAuth(ev.ip, false, ev.ts);
      if ([2002, 2003, 2016, 2020].includes(ev.rule.id)) {
        if (!ips.hasLoggedIn(ev.ip)) emit(R.mk(2012, ev.ts, { ip: ev.ip, user: ev.user, location: ev.location, msg: 'First logon from ' + ev.ip + ' (' + ev.user + ')' }));
        if (U.ipKind(ev.ip) === 'public') emit(R.mk(2013, ev.ts, { ip: ev.ip, user: ev.user, location: ev.location, msg: ev.user + ' signed in from the internet address ' + ev.ip }));
        ips.noteAuth(ev.ip, true, ev.ts);
      }
    }
    for (const x of cor.feed(ev)) emit(x);
    if (fresh) {
      live.push(ev);
      notify(ev);
      respond(ev).catch(e => U.log('active response failed:', e.message));
    } else refreshPending = true;
  }
  function emitAll(list) { for (const ev of list.sort((a, b) => a.ts - b.ts)) emit(ev); }

  function notify(ev) {
    if (ev.rule.level < (S.notifyLevel || 12)) return;
    const key = ev.rule.id + '|' + (ev.ip || ev.user || '');
    if (Date.now() - (notified.get(key) || 0) < 120e3) return;
    notified.set(key, Date.now());
    if (notified.size > 500) notified.clear();
    const msg = 'Security level ' + ev.rule.level + ': ' + ev.msg;
    broadcast('alert', JSON.stringify([{ id: 'siem-' + ev.rule.id, msg }]));
    engine.alerts.webhook(msg).catch(() => {});
  }
  async function respond(ev) {
    if (!S.autoBlock || !ev.ip || ev.rule.level < (S.autoLevel || 10)) return;
    if (!ev.rule.groups.some(g => AR_GROUPS.includes(g))) return;
    const kind = U.ipKind(ev.ip);
    if (!(kind === 'public' || (S.allowPrivate && (kind === 'private' || kind === 'cgnat')))) return;
    if (blocks.isBlocked(ev.ip) || blocks.protectedReason(ev.ip)) return;
    arCount = arCount.filter(t => Date.now() - t < 3600e3);
    if (arCount.length >= 30) return;
    arCount.push(Date.now());
    const minutes = U.int(S.autoMinutes, 1440);
    await blocks.block(ev.ip, { minutes, reason: ev.rule.description + ' (rule ' + ev.rule.id + ')', by: 'auto', ruleId: ev.rule.id });
    emit(R.mk(6012, Date.now(), { ip: ev.ip, location: 'rigwatch/active-response', msg: 'Blocked ' + ev.ip + (minutes ? ' for ' + fmtMin(minutes) : ' permanently') + ' after: ' + ev.msg, data: { trigger: ev.rule.id, minutes } }));
  }
  const fmtMin = m => (m >= 1440 ? Math.round(m / 1440) + ' day(s)' : m >= 60 ? Math.round(m / 60) + ' hour(s)' : m + ' min');
  const onceToday = key => { const d = dayKey(Date.now()); if (daily.get(key) === d) return false; daily.set(key, d); if (daily.size > 20000) daily.clear(); return true; };

  // ---------------------------------------------------------------- firewall drops -> 6007 / 6008
  const drops = new Map(), scanCool = new Map();
  function onDrops(list) {
    const own = new Set(Object.values(os.networkInterfaces()).flat().map(a => a && a.address));
    for (const d of list) {
      const k = U.ipKind(d.src), dk = U.ipKind(d.dst);
      if (!d.src || k === 'loopback' || k === 'any' || k === 'multicast' || own.has(d.src)) continue;
      if (dk === 'multicast' || /\.255$/.test(d.dst) || d.dst === '255.255.255.255') continue;
      let a = drops.get(d.src);
      if (!a) { a = { n: 0, ports: new Set(), first: d.ts, last: d.ts, recent: [], emitAt: 0 }; drops.set(d.src, a); }
      a.n++; a.ports.add(d.port); a.last = Math.max(a.last, d.ts);
      a.recent.push([d.ts, d.port]);
      a.recent = a.recent.filter(x => d.ts - x[0] <= 60e3);
      const distinct = new Set(a.recent.map(x => x[1])).size;
      if (distinct >= 15 && Date.now() - (scanCool.get(d.src) || 0) > 3600e3) {
        scanCool.set(d.src, Date.now());
        emit(R.mk(6008, d.ts, { ip: d.src, location: 'firewall/pfirewall.log', msg: d.src + ' probed ' + distinct + ' ports in 60 seconds', data: { ports: [...new Set(a.recent.map(x => x[1]))].slice(0, 30).join(','), proto: d.proto } }));
      }
    }
    flushDrops(false);
  }
  function flushDrops(force) {
    const now = Date.now();
    for (const [ip, a] of drops) {
      if (!a.n) { if (now - a.last > 3600e3) drops.delete(ip); continue; }
      if (!force && now - a.emitAt < 600e3 && a.emitAt) continue;
      const ports = [...a.ports].sort((x, y) => x - y);
      emit(R.mk(6007, a.last, { ip, level: U.ipKind(ip) === 'public' ? 3 : 2, location: 'firewall/pfirewall.log', msg: 'Firewall dropped ' + a.n + ' inbound packet' + (a.n > 1 ? 's' : '') + ' from ' + ip + ' (port' + (ports.length > 1 ? 's ' : ' ') + ports.slice(0, 8).join(', ') + (ports.length > 8 ? ' …' : '') + ')', data: { packets: a.n, ports: ports.slice(0, 40).join(',') } }));
      ips.noteDrop(ip, a.n, ports.slice(0, 5), a.last);
      a.n = 0; a.ports = new Set(); a.emitAt = now;
    }
  }

  // ---------------------------------------------------------------- collectors, SCA, FIM
  const col = collect.create({ plat, dir, persist: CFG.persist, onEvents: evs => emitAll(evs), onDrops });
  const sca = new Sca(path.join(dir, 'sca.json'), CFG.persist, plat, (meta, x) => {
    emit(R.mk(x.result === 'failed' ? 9001 : 9002, Date.now(), { location: 'sca/' + meta.id, msg: (x.result === 'failed' ? 'Check failed: ' : 'Check passed: ') + meta.title + (x.detail ? ' (' + x.detail + ')' : ''), data: { check: meta.id, category: meta.cat, result: x.result } }));
  });
  const fim = new Fim(path.join(dir, 'fim.json'), CFG.persist, plat, c => {
    if (c.type.startsWith('reg-')) {
      const rule = c.type === 'reg-deleted' ? 9105 : 9104;
      emit(R.mk(rule, Date.now(), { location: 'registry', msg: 'Autostart ' + (c.type === 'reg-added' ? 'added' : c.type === 'reg-modified' ? 'changed' : 'removed') + ': ' + c.name + ' in ' + c.key, data: { key: c.key, name: c.name, value: U.trunc(c.value || '', 300), before: U.trunc(c.before || '', 300) } }));
      return;
    }
    const rule = c.type === 'added' ? 9101 : c.type === 'modified' ? 9102 : 9103;
    const lv = c.entry.level || 5;
    emit(R.mk(rule, Date.now(), { level: c.type === 'deleted' ? Math.max(4, lv - 2) : lv, location: 'fim/' + (c.entry.tag || 'file'), msg: 'File ' + c.type + ': ' + c.path, data: { path: c.path, tag: c.entry.tag, size: c.size, sha256: c.hash, sizeBefore: c.before ? c.before.size : undefined, sha256Before: c.before ? c.before.hash : undefined } }));
  });
  fim.setCustom(S.fimPaths);
  const scaCtx = () => { const s = engine.lastSnap(); return { listen: s && s.ports ? s.ports.listen : [], secureBoot: (plat.inventory() || {}).secureBoot }; };

  // ---------------------------------------------------------------- live observation (sockets / processes)
  let lastProgs = 0;
  function observe(procs, sock) {
    const names = new Map(procs.map(p => [p.pid, p.name]));
    const nameOf = pid => names.get(pid) || (sock.names && sock.names.get ? sock.names.get(pid) : '') || '';
    const r = ips.observe(sock, nameOf);
    for (const x of r.inbound) if (onceToday('in|' + x.ip + '|' + x.port)) emit(R.mk(6005, Date.now(), { ip: x.ip, process: x.process, location: 'rigwatch/connections', msg: 'Inbound connection from ' + x.ip + ' to port ' + x.port + (x.process ? ' (' + x.process + ')' : ''), data: { port: x.port, pid: x.pid } }));
    if (S.feed) for (const ip of r.fresh) checkFeed(ip);
    if (Date.now() - lastProgs > 5000) {
      lastProgs = Date.now();
      for (const p of programs.observe(procs)) emit(R.mk(7001, Date.now(), { process: p.name, location: 'rigwatch/processes', msg: p.name + ' ran for the first time', data: { exe: p.exe, pid: p.pid, cmd: U.trunc(U.redact(p.cmd || ''), 300), signed: p.sig ? p.sig.status : undefined } }));
    }
  }
  function checkFeed(ip) {
    const hit = feeds.match(ip);
    if (!hit) return;
    const e = ips.get(ip); if (e) e.bad = hit;
    if (onceToday('feed|' + ip)) emit(R.mk(6006, Date.now(), { ip, location: 'threat-intel', msg: ip + ' is listed in ' + hit + (e && e.procs.length ? ' (talked to ' + e.procs.slice(-3).join(', ') + ')' : ''), data: { feed: hit, process: e ? e.procs.join(',') : '' } }));
  }
  async function refreshFeeds() {
    if (!S.feed) return;
    await feeds.refresh();
    for (const e of ips.list(Date.now() - 7 * DAY)) if (e.kind === 'public') checkFeed(e.ip);
  }

  // ---------------------------------------------------------------- timers
  const timers = [];
  function start() {
    col.start();
    if (S.feed) { feeds.load(); if (Date.now() - feeds.at > DAY) refreshFeeds().catch(() => {}); }
    timers.push(setInterval(() => {
      if (live.length) broadcast('siem', JSON.stringify({ events: live.splice(0, live.length).slice(-200) }));
      else if (refreshPending) { refreshPending = false; broadcast('siem', JSON.stringify({ refresh: true })); }
    }, 2000));
    timers.push(setInterval(() => flushDrops(true), 600e3));
    timers.push(setInterval(() => { blocks.expire().then(done => { for (const ip of done) emit(R.mk(6011, Date.now(), { ip, location: 'rigwatch/active-response', msg: 'Block on ' + ip + ' expired', data: { by: 'expiry' } })); }).catch(() => {}); }, 60e3));
    timers.push(setInterval(() => sca.run(scaCtx()).catch(() => {}), 30 * 60e3));
    timers.push(setInterval(() => fim.scan().catch(() => {}), 10 * 60e3));
    timers.push(setInterval(() => refreshFeeds().catch(() => {}), DAY));
    timers.push(setInterval(() => blocks.sync().catch(() => {}), 15 * 60e3));
    for (const t of timers) t.unref();
    setTimeout(() => sca.run(scaCtx()).catch(() => {}), 45e3).unref();
    setTimeout(() => fim.scan().then(() => fim.watch()).catch(() => {}), 30e3).unref();
    setTimeout(() => blocks.sync().catch(() => {}), 40e3).unref();
  }
  function stop() { for (const t of timers) clearInterval(t); col.stop(); flushDrops(true); st.stop(); ips.save(true); programs.save(true); }

  function status() {
    const c = col.status(), out = [];
    if (c.kind === 'windows') {
      const sec = c.logs['sec'] || c.logs['sec-logon'];
      out.push({ name: 'SIEM: Windows event logs', ok: !!(c.logs.poll && c.logs.poll.ok) && !!sec && sec.ok, detail: !c.logs.poll ? 'starting' : sec && !sec.ok ? 'Security log: ' + sec.err : 'reading ' + Object.values(c.logs).filter(x => x.ok).length + ' sources', err: c.logs.poll && !c.logs.poll.ok ? c.logs.poll.err : '' });
    } else if (c.kind === 'linux') out.push({ name: 'SIEM: auth logs', ok: c.auth.ok, detail: c.auth.source || 'starting', err: c.auth.err });
    return out;
  }

  // ---------------------------------------------------------------- queries
  function rangeOf(q) {
    const to = q.to ? U.int(q.to, Date.now()) : Date.now();
    const from = q.from ? U.int(q.from, to - DAY) : to - (RANGES[q.range] || RANGES['24h']);
    return { from: Math.max(from, Date.now() - retention * DAY), to };
  }
  function filterFor(q) {
    const f = R.parseQuery(q.q || '');
    const m = q.module;
    if (m && MODULES[m] && !f.group) f.group = MODULES[m].join(',');
    if (q.min) f.min = Math.max(f.min || 0, U.int(q.min, 0));
    const extra = m === 'mitre' ? ev => (ev.rule.mitre || []).length > 0 : m === 'compliance' && q.fw ? ev => (R.complianceOf(ev.rule)[q.fw] || []).length > 0 : null;
    return { f, match: (ff, ev) => R.matchEvent(ff, ev) && (!extra || extra(ev)), pre: R.lineMayMatch };
  }
  const facetCache = new Map();
  async function facets(q) {
    const { from, to } = rangeOf(q);
    const key = JSON.stringify([q.range, q.q, q.module, q.fw, q.min, Math.floor(to / 15000)]);
    const c = facetCache.get(key); if (c) return c;
    const span = to - from;
    const step = span <= 2 * DAY ? 3600e3 : span <= 8 * DAY ? 6 * 3600e3 : span <= 100 * DAY ? DAY : 7 * DAY;
    const nb = Math.ceil(span / step);
    const hist = Array.from({ length: nb }, (_, i) => ({ t: from + i * step, b: [0, 0, 0, 0, 0] }));
    const cnt = {}; const bump = (k, v) => { if (v == null || v === '') return; const m = cnt[k] || (cnt[k] = new Map()); v = String(v); m.set(v, (m.get(v) || 0) + 1); };
    const week = Array.from({ length: 7 }, () => new Array(24).fill(0));
    const latest = []; let total = 0; const lv = new Array(16).fill(0);
    const { f, match, pre } = filterFor(q);
    const fw = q.fw || null;
    const res = await st.scan({ from, to, f, match, pre, max: 150000 }, ev => {
      total++;
      if (latest.length < 40) latest.push(ev);
      const i = Math.min(nb - 1, Math.floor((ev.ts - from) / step)); if (i >= 0) hist[i].b[R.bandOf(ev.rule.level)]++;
      lv[Math.max(0, Math.min(15, ev.rule.level))]++;
      const d = new Date(ev.ts); week[d.getDay()][d.getHours()]++;
      bump('rule', ev.rule.id); bump('ip', ev.ip); bump('user', ev.user); bump('process', ev.process); bump('location', (ev.location || '').replace(/\/\d+$/, ''));
      for (const g of ev.rule.groups) bump('group', g);
      for (const m of ev.rule.mitre || []) { bump('mitre', m); for (const t of R.TECH_TACTICS[m] || []) bump('tactic', t); }
      if (ev.data) {
        if (ev.data.logonType != null) bump('logonType', LOGON_TYPES_NAMES[ev.data.logonType] || 'type ' + ev.data.logonType);
        bump('reason', ev.data.reason); bump('threat', ev.data.threat); bump('tag', ev.data.tag); bump('category', ev.data.category); bump('port', ev.data.port);
        if (ev.data.path) bump('path', ev.data.path);
      }
      if (ev.data && ev.data.admin) bump('admin', 'admin');
      if (fw) for (const r of R.complianceOf(ev.rule)[fw] || []) bump('req', r);
      if (ev.ip) bump('scope', U.ipKind(ev.ip));
    });
    const top = (m, n = 15) => (m ? [...m].sort((a, b) => b[1] - a[1]).slice(0, n) : []);
    const out = { from, to, step, total, capped: res.capped, hist, levels: lv, week, latest, facets: {} };
    for (const k of Object.keys(cnt)) out.facets[k] = top(cnt[k], k === 'req' ? 40 : 15);
    out.facets.rule = (out.facets.rule || []).map(([id, n]) => [id, n, (R.RULES[id] || {}).description || '', (R.RULES[id] || {}).level]);
    facetCache.set(key, out);
    if (facetCache.size > 40) facetCache.delete(facetCache.keys().next().value);
    return out;
  }
  async function sessionHistory(days = 30) {
    const from = Date.now() - days * DAY, open = new Map(), out = [];
    const evs = [];
    await st.scan({ from, f: R.parseQuery('rule:2001,2002,2007,2032,2033'), match: R.matchEvent, max: 20000 }, ev => evs.push(ev));
    evs.sort((a, b) => a.ts - b.ts);
    for (const ev of evs) {
      const id = ev.data && (ev.data.logonId || ev.data.session);
      if (ev.rule.id === 2007 || ev.rule.id === 2033) {
        const s = id && open.get(id);
        if (s) { s.end = ev.ts; open.delete(id); }
        continue;
      }
      if (ev.rule.id === 2001 && ev.data && ![2, 11].includes(ev.data.logonType)) continue;
      const s = { user: ev.user || '', type: ev.rule.id === 2002 ? 'remote desktop' : ev.rule.id === 2032 ? 'session' : 'interactive', ip: ev.ip || '', start: ev.ts, end: null, admin: !!(ev.data && ev.data.admin) };
      if (id) open.set(id, s);
      out.push(s);
    }
    return out.slice(-400);
  }

  // ---------------------------------------------------------------- API
  const summarizeRules = list => list.map(([id, n]) => [id, n, (R.RULES[id] || {}).description || '', (R.RULES[id] || {}).level]);
  async function api(method, sub, q, body, acc) {
    const key = method + ' ' + sub;
    switch (key) {
      case 'GET overview': {
        const { from, to } = rangeOf(q);
        const sum = st.summary(from, to);
        sum.top.rules = summarizeRules(sum.top.rules);
        const tracked = ips.list(from);
        const ifs = Object.values(os.networkInterfaces()).flat().filter(a => a && !a.internal && (a.family === 'IPv4' || a.family === 4));
        return {
          agent: { name: os.hostname(), os: plat.label + ' ' + os.release(), ip: ifs[0] ? ifs[0].address : '', version: CFG.version, since: engine.startedAt, elevated: plat.isAdmin(), platform: process.platform },
          range: { from, to }, summary: sum, modules: st.modules(from, to), stats: st.stats(),
          sca: Object.assign(sca.score(), { at: sca.state.at }), fim: { files: Object.keys(fim.base.files).length, registry: Object.keys(fim.base.reg).length, at: fim.base.at },
          ips: { tracked: tracked.length, public: tracked.filter(e => e.kind === 'public').length, inbound: tracked.filter(e => e.inb > 0 && e.kind === 'public').length, flagged: tracked.filter(e => e.fail || e.drops || e.bad).length, bad: tracked.filter(e => e.bad).length },
          blocks: blocks.all().length, collectors: col.status(), settings: S,
          recent: st.recent.filter(e => e.rule.level >= 7 && e.ts >= from).slice(-10).reverse(),
        };
      }
      case 'GET facets': return facets(q);
      case 'GET events': {
        const { from, to } = rangeOf(q), { f, match, pre } = filterFor(q);
        return st.query({ from, to, before: q.before ? U.int(q.before, null) : null, limit: U.clamp(U.int(q.limit, 100), 1, 1000), f, match, pre });
      }
      case 'GET ips': {
        const { from } = rangeOf(q);
        const list = ips.list(from).map(e => Object.assign({}, e, { blocked: blocks.isBlocked(e.ip) }));
        list.sort((a, b) => (b.maxLevel - a.maxLevel) || (b.events - a.events) || (b.conns - a.conns));
        return { total: list.length, list: list.slice(0, U.clamp(U.int(q.limit, 600), 1, 5000)), feed: feeds.status(), feedOn: !!S.feed };
      }
      case 'GET ip': {
        const ip = String(q.ip || '');
        const f = R.parseQuery('ip:' + ip);
        const ev = await st.query({ from: Date.now() - retention * DAY, limit: 150, f, match: (ff, e) => e.ip === ip, pre: R.lineMayMatch });
        return { ip, kind: U.ipKind(ip), entry: ips.get(ip), blocked: blocks.all().find(b => b.ip === ip) || null, feed: feeds.match(ip), events: ev.events };
      }
      case 'GET sessions': {
        let cur; try { cur = await require('./sessions').create(plat).list(); } catch (e) { cur = { sessions: [], logons: [], smb: [], users: [], errors: [e.message] }; }
        cur.history = await sessionHistory(U.clamp(U.int(q.days, 30), 1, 365));
        return cur;
      }
      case 'POST session': {
        const msg = await require('./sessions').create(plat).act(body || {});
        engine.timeline.add('action', 'info', 'session ' + body.action + ' ' + (body.id || body.pid || ''), { detail: String(msg), who: acc.local ? 'local' : 'token', nosiem: true });
        emit(R.mk(8003, Date.now(), { location: 'rigwatch/audit', user: acc.local ? 'local' : 'token', msg: 'Session ' + body.action + ' (' + (body.label || body.id || body.pid) + ')', data: { result: String(msg) } }));
        return { ok: true, msg: String(msg || 'done') };
      }
      case 'GET blocks': return { list: blocks.all(), err: blocks.err, missing: blocks.missing || [], supported: blocks.supported(), admin: plat.isAdmin(), settings: S, feed: feeds.status(), firewallLog: (col.status().firewallLog || null), protected: protectedIps() };
      case 'POST block': {
        const minutes = U.clamp(U.int(body.minutes, 0), 0, 525600);
        const r = await blocks.block(body.ip, { minutes, reason: String(body.reason || 'blocked manually'), by: 'manual' });
        emit(R.mk(6010, Date.now(), { ip: r.ip, location: 'rigwatch/active-response', user: acc.local ? 'local' : 'token', msg: 'Blocked ' + r.ip + (minutes ? ' for ' + fmtMin(minutes) : ' permanently') + (body.reason ? ': ' + U.trunc(body.reason, 120) : ''), data: { minutes } }));
        return { ok: true, msg: 'Blocked ' + r.ip + (minutes ? ' for ' + fmtMin(minutes) : '') };
      }
      case 'POST unblock': {
        const ip = await blocks.unblock(body.ip);
        emit(R.mk(6011, Date.now(), { ip, location: 'rigwatch/active-response', user: acc.local ? 'local' : 'token', msg: 'Unblocked ' + ip }));
        return { ok: true, msg: 'Unblocked ' + ip };
      }
      case 'PUT settings': {
        const b = body || {};
        for (const k of ['autoBlock', 'allowPrivate', 'feed']) if (typeof b[k] === 'boolean') S[k] = b[k];
        if (b.autoLevel != null) S.autoLevel = U.clamp(U.int(b.autoLevel, 10), 3, 15);
        if (b.autoMinutes != null) S.autoMinutes = U.clamp(U.int(b.autoMinutes, 1440), 0, 525600);
        if (b.notifyLevel != null) S.notifyLevel = U.clamp(U.int(b.notifyLevel, 12), 1, 16);
        if (Array.isArray(b.trusted)) S.trusted = b.trusted.map(String).map(s => s.trim()).filter(s => require('net').isIP(s)).slice(0, 200);
        if (Array.isArray(b.fimPaths)) { S.fimPaths = b.fimPaths.map(String).map(s => s.trim()).filter(Boolean).slice(0, 20); fim.setCustom(S.fimPaths); fim.watch(); setTimeout(() => fim.scan().catch(() => {}), 500); }
        save();
        if (b.feed === true) { feeds.load(); refreshFeeds().catch(() => {}); }
        return { ok: true, settings: S };
      }
      case 'POST fwlog': {
        const fw = await col.setFwLog(!!body.on);
        engine.timeline.add('action', 'info', 'firewall drop logging ' + (body.on ? 'on' : 'off'), { who: acc.local ? 'local' : 'token' });
        return { ok: true, msg: 'Firewall drop logging ' + (fw.enabled ? 'on' : 'off'), firewallLog: fw };
      }
      case 'POST feeds/refresh': { if (!S.feed) throw new Error('Turn the threat feed on first.'); await refreshFeeds(); return { ok: true, msg: feeds.status().entries + ' ranges loaded', feed: feeds.status() }; }
      case 'GET rules': {
        const { from } = rangeOf(Object.assign({ range: '30d' }, q));
        const hits = st.ruleHits(from);
        return { rules: Object.values(R.RULES).map(r => Object.assign({}, r, { hits: hits[r.id] || 0, compliance: R.complianceOf(r) })), mitre: R.MITRE, tactics: R.TACTICS, techTactics: R.TECH_TACTICS, compliance: R.COMPLIANCE, modules: MODULES };
      }
      case 'GET sca': return sca.view();
      case 'POST sca/run': { await sca.run(scaCtx()); return Object.assign({ ok: true, msg: 'Assessment finished' }, sca.view()); }
      case 'GET fim': return fim.view();
      case 'POST fim/scan': { await fim.scan(); return Object.assign({ ok: true, msg: 'Integrity scan finished' }, fim.view()); }
      case 'GET programs': {
        const { from } = rangeOf(q);
        return programs.list().filter(p => p.first >= from).sort((a, b) => b.first - a.first).slice(0, 500);
      }
      case 'POST poll': { await col.pollNow(); return { ok: true, msg: 'Logs read' }; }
      case 'GET export': {
        const { from, to } = rangeOf(q), { f, match, pre } = filterFor(q);
        const rows = [];
        await st.scan({ from, to, f, match, pre, max: 200000 }, ev => rows.push(ev));
        if (q.format === 'csv') {
          const esc = v => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
          const lines = ['time,level,rule,description,ip,user,process,location,mitre,message'];
          for (const e of rows) lines.push([new Date(e.ts).toISOString(), e.rule.level, e.rule.id, e.rule.description, e.ip, e.user, e.process, e.location, (e.rule.mitre || []).join(' '), e.msg].map(esc).join(','));
          return { download: 'rigwatch-events.csv', type: 'text/csv; charset=utf-8', body: lines.join('\n') };
        }
        return { download: 'rigwatch-events.json', type: 'application/json', body: rows.map(e => JSON.stringify(e)).join('\n') + '\n' };
      }
    }
    throw new Error('unknown SIEM endpoint ' + key);
  }

  return {
    api, start, stop, status, observe, emit,
    fromTimeline: e => { try { for (const ev of R.fromTimeline(e)) emit(ev); } catch (err) { U.log('siem:', err.message); } },
    stats: () => st.stats(),
  };
}

module.exports = { create, MODULES, RANGES };
