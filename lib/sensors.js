'use strict';
// Hardware sensor helpers: LibreHardwareMonitor (web + WMI shapes) and picking well-known values.
const { arr } = require('./util');

const UNITS = { Temperature: '°C', Fan: 'RPM', Voltage: 'V', Clock: 'MHz', Load: '%', Power: 'W', Data: 'GB', SmallData: 'MB', Throughput: 'B/s', Control: '%', Level: '%', Frequency: 'Hz', Current: 'A', Energy: 'mWh', Noise: 'dBA', TimeSpan: 's', Factor: '' };
const GROUP_TYPE = { temperatures: 'Temperature', fans: 'Fan', voltages: 'Voltage', clocks: 'Clock', load: 'Load', powers: 'Power', data: 'Data', throughput: 'Throughput', controls: 'Control', levels: 'Level', factors: 'Factor', currents: 'Current', energy: 'Energy', noise: 'Noise', timing: 'TimeSpan' };

function parseLocaleNum(s) {
  const m = String(s == null ? '' : s).match(/-?[\d.,]+/);
  if (!m) return null;
  let v = m[0];
  if (v.includes('.') && v.includes(',')) v = v.lastIndexOf(',') > v.lastIndexOf('.') ? v.replace(/\./g, '').replace(',', '.') : v.replace(/,/g, '');
  else if (v.includes(',')) v = /,\d{1,2}$/.test(v) ? v.replace(',', '.') : v.replace(/,/g, '');
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function hwTypeFromImg(img) {
  img = String(img || '').toLowerCase();
  if (img.includes('cpu')) return 'Cpu';
  if (img.includes('nvidia')) return 'GpuNvidia';
  if (img.includes('ati') || img.includes('amd')) return 'GpuAmd';
  if (img.includes('intel')) return 'GpuIntel';
  if (img.includes('ram')) return 'Memory';
  if (img.includes('mainboard')) return 'Motherboard';
  if (img.includes('chip')) return 'SuperIO';
  if (img.includes('hdd') || img.includes('nvme') || img.includes('ssd')) return 'Storage';
  if (img.includes('nic') || img.includes('ethernet') || img.includes('wifi')) return 'Network';
  if (img.includes('battery')) return 'Battery';
  if (img.includes('fan') || img.includes('cooler')) return 'Cooler';
  if (img.includes('psu')) return 'Psu';
  return 'Other';
}

/** LibreHardwareMonitor /data.json tree -> flat sensor list. */
function parseLhmTree(root) {
  const out = [];
  const walk = (node, hw, group) => {
    const kids = node.Children || [];
    if (!kids.length) {
      if (hw && group && node.Value !== undefined && node.Value !== '') {
        const type = node.Type || GROUP_TYPE[String(group).toLowerCase()] || group;
        out.push({ id: node.SensorId || (hw.name + '/' + group + '/' + node.Text), hw: hw.name, hwType: hw.type, type, name: node.Text, value: parseLocaleNum(node.Value), min: parseLocaleNum(node.Min), max: parseLocaleNum(node.Max), unit: UNITS[type] || '' });
      }
      return;
    }
    const isGroup = kids.every(k => !(k.Children && k.Children.length));
    if (isGroup && hw) { for (const k of kids) walk(k, hw, node.Text); return; }
    const img = node.ImageURL || '';
    const nextHw = img && !/transparent|computer/i.test(img) ? { name: node.Text, type: hwTypeFromImg(img) } : hw;
    for (const k of kids) walk(k, nextHw, null);
  };
  if (root) walk(root, null, null);
  return out;
}

/** LHM/OHM WMI payload { hw:[], sensors:[] } -> flat sensor list. */
function fromLhmWmi(lhm) {
  const hw = new Map(arr(lhm && lhm.hw).map(h => [h.id, h]));
  return arr(lhm && lhm.sensors).map(s => {
    const h = hw.get(s.parent) || {};
    return { id: s.id, hw: h.name || s.parent, hwType: h.type || '', type: s.type, name: s.name, value: s.value, min: s.min, max: s.max, unit: UNITS[s.type] || '' };
  });
}

const EXCLUDE = /distance|tjmax|limit|warning|critical|crit|alarm|threshold/i;
/** First sensor value whose hwType matches hwRx, of this type, matching the first name regex that hits. */
function pick(list, hwRx, type, nameRxs) {
  const c = list.filter(s => hwRx.test(s.hwType || '') && s.type === type && s.value != null && !EXCLUDE.test(s.name));
  for (const rx of nameRxs) { const m = c.find(s => rx.test(s.name)); if (m) return m.value; }
  return null;
}

/** Polls LibreHardwareMonitor's optional web server. */
class LhmHttp {
  constructor(url) { this.url = url; this.list = []; this.at = 0; this.fail = 0; this.timer = null; }
  start() { this.poll(); }
  stop() { clearTimeout(this.timer); }
  async poll() {
    if (typeof fetch === 'function') {
      try {
        const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 1200);
        const r = await fetch(this.url, { signal: ctl.signal }); clearTimeout(t);
        if (r.ok) { this.list = parseLhmTree(await r.json()); this.at = Date.now(); this.fail = 0; } else this.fail++;
      } catch { this.fail++; }
    }
    this.timer = setTimeout(() => this.poll(), this.fail > 3 ? 15000 : 2000);
    if (this.timer.unref) this.timer.unref();
  }
  fresh() { return this.list.length && Date.now() - this.at < 10000 ? this.list : null; }
}

module.exports = { UNITS, parseLhmTree, fromLhmWmi, pick, parseLocaleNum, LhmHttp };
