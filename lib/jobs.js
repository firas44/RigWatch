'use strict';
// Long-running tool jobs (ping, scans, logs...) whose output streams to the browser over SSE.

class Jobs {
  constructor(broadcast) { this.broadcast = broadcast; this.jobs = new Map(); this.seq = 0; this.buf = new Map(); this.timer = null; }
  start(tool, title, params, runner) {
    const id = ++this.seq;
    const job = { id, tool, title, params, status: 'running', started: Date.now(), ended: 0, lines: [], result: null, error: '', progress: null, cancelFns: [] };
    this.jobs.set(id, job);
    const api = {
      line: (text, cls) => { const l = { t: Date.now(), text: String(text).slice(0, 2000), cls: cls || '' }; job.lines.push(l); if (job.lines.length > 5000) job.lines.splice(0, 1000); this.queue(id, 'line', l); },
      result: r => { job.result = r; this.queue(id, 'result', r); },
      progress: p => { job.progress = p; this.queue(id, 'progress', p); },
      onCancel: fn => job.cancelFns.push(fn),
      get cancelled() { return job.status === 'cancelled'; },
    };
    this.emit(id, 'start', this.summary(job));
    Promise.resolve().then(() => runner(api)).then(r => { if (r !== undefined) api.result(r); this.finish(job, job.status === 'cancelled' ? 'cancelled' : 'done'); })
      .catch(e => { job.error = e.message; api.line('error: ' + e.message, 'err'); this.finish(job, 'error'); });
    if (this.jobs.size > 60) { const old = [...this.jobs.values()].filter(j => j.status !== 'running').slice(0, this.jobs.size - 60); for (const j of old) this.jobs.delete(j.id); }
    return this.summary(job);
  }
  finish(job, status) {
    if (job.ended) return;
    job.status = job.status === 'cancelled' ? 'cancelled' : status; job.ended = Date.now();
    this.flush();
    this.emit(job.id, 'done', this.summary(job));
  }
  cancel(id) {
    const j = this.jobs.get(id);
    if (!j || j.status !== 'running') return false;
    j.status = 'cancelled';
    for (const fn of j.cancelFns) { try { fn(); } catch { /* ignore */ } }
    this.finish(j, 'cancelled');
    return true;
  }
  queue(id, type, data) {
    if (!this.buf.has(id)) this.buf.set(id, []);
    this.buf.get(id).push({ type, data });
    if (!this.timer) this.timer = setTimeout(() => this.flush(), 150);
  }
  flush() {
    clearTimeout(this.timer); this.timer = null;
    for (const [id, items] of this.buf) this.broadcast('job', JSON.stringify({ id, items }));
    this.buf.clear();
  }
  emit(id, type, data) { this.broadcast('job', JSON.stringify({ id, items: [{ type, data }] })); }
  summary(j) { return { id: j.id, tool: j.tool, title: j.title, status: j.status, started: j.started, ended: j.ended, error: j.error, lines: j.lines.length, progress: j.progress }; }
  get(id) { const j = this.jobs.get(id); return j ? Object.assign(this.summary(j), { params: j.params, lineList: j.lines, result: j.result }) : null; }
  list() { return [...this.jobs.values()].reverse().map(j => this.summary(j)); }
}

module.exports = { Jobs };
