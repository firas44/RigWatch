#!/usr/bin/env node
/*! RigWatch 2.1.0 single-file build (2026-11-13). MIT License. Source: https://github.com/ (server.js, lib/, public/) */
'use strict';
global.__RIGWATCH_ROOT = __dirname;
global.__RIGWATCH_ASSETS = {"public/app.css":"/* RigWatch 2 — design tokens */\n:root, :root[data-theme=\"dark\"] {\n  color-scheme: dark;\n  --bg: #0a0b0d; --bg2: #0e0f12; --panel: #131418; --panel2: #191a1f; --panel3: #202128; --hover: rgba(255,255,255,.035);\n  --line: #23252c; --line2: #2e3038; --axis: #3a3c45; --ring: rgba(255,255,255,.08);\n  --ink: #eeece6; --ink2: #b9b7ae; --muted: #85837c; --faint: #5b5a55;\n  --s1: #3987e5; --s2: #d95926; --s3: #199e70; --s4: #c98500; --s5: #d55181; --s6: #0ca30c; --s7: #9085e9; --s8: #e66767;\n  --good: #0ca30c; --warn: #fab219; --serious: #ec835a; --crit: #d03b3b;\n  --accent: #3987e5; --accent-ink: #fff;\n  --shadow: 0 10px 40px rgba(0,0,0,.45);\n  --r: 12px; --r2: 8px;\n  --mono: ui-monospace, \"Cascadia Code\", \"JetBrains Mono\", \"SF Mono\", Consolas, monospace;\n}\n:root[data-theme=\"light\"] {\n  color-scheme: light;\n  --bg: #f4f4f1; --bg2: #efefeb; --panel: #fcfcfb; --panel2: #f3f2ee; --panel3: #e9e8e2; --hover: rgba(0,0,0,.035);\n  --line: #e1e0d9; --line2: #d4d3cb; --axis: #c3c2b7; --ring: rgba(11,11,11,.08);\n  --ink: #0b0b0b; --ink2: #52514e; --muted: #807e78; --faint: #a9a8a1;\n  --s1: #2a78d6; --s2: #eb6834; --s3: #1baf7a; --s4: #eda100; --s5: #e87ba4; --s6: #008300; --s7: #6250d6; --s8: #e34948;\n  --accent: #2a78d6; --shadow: 0 10px 40px rgba(0,0,0,.12);\n}\n* { box-sizing: border-box; }\nhtml, body { margin: 0; height: 100%; background: var(--bg); color: var(--ink); font: 14px/1.45 system-ui, -apple-system, \"Segoe UI\", Roboto, sans-serif; }\nbody { overflow: hidden; }\nbutton, input, select, textarea { font: inherit; color: inherit; }\na { color: var(--accent); text-decoration: none; }\na:hover { text-decoration: underline; }\ncode, .mono { font-family: var(--mono); font-size: 12.5px; }\n.muted { color: var(--muted); } .ink2 { color: var(--ink2); } .faint { color: var(--faint); }\n.num { font-variant-numeric: tabular-nums; }\n.hidden { display: none !important; }\nsvg[aria-hidden=\"true\"] { width: 15px; height: 15px; flex: none; vertical-align: -2px; }\ntable.t .plinks { flex-wrap: nowrap; }\n.finding .ff svg { color: var(--good); }\n::selection { background: color-mix(in srgb, var(--accent) 35%, transparent); }\n::-webkit-scrollbar { width: 10px; height: 10px; }\n::-webkit-scrollbar-thumb { background: var(--line2); border-radius: 10px; border: 2px solid var(--bg); }\n::-webkit-scrollbar-track { background: transparent; }\n:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }\n\n/* ---------- shell ---------- */\n.app { display: grid; grid-template-columns: 228px minmax(0, 1fr); height: 100vh; }\n.app.collapsed { grid-template-columns: 64px minmax(0, 1fr); }\n.side { background: var(--bg2); border-right: 1px solid var(--line); display: flex; flex-direction: column; min-height: 0; }\n.brand { display: flex; align-items: center; gap: 10px; padding: 16px 18px 14px; font-weight: 700; font-size: 16px; letter-spacing: .2px; white-space: nowrap; }\n.brand svg { width: 26px; height: 26px; flex: none; }\n.brand small { font-weight: 500; color: var(--muted); font-size: 11px; margin-left: -4px; }\n.nav { flex: 1; overflow-y: auto; padding: 4px 10px 12px; }\n.nav h6 { margin: 14px 10px 6px; font-size: 10.5px; letter-spacing: .8px; text-transform: uppercase; color: var(--faint); font-weight: 650; white-space: nowrap; }\n.nav a { display: flex; align-items: center; gap: 11px; padding: 7px 10px; border-radius: 8px; color: var(--ink2); position: relative; white-space: nowrap; text-decoration: none; }\n.nav a svg { width: 18px; height: 18px; flex: none; opacity: .85; }\n.nav a:hover { background: var(--hover); color: var(--ink); }\n.nav a.on { background: var(--panel2); color: var(--ink); font-weight: 600; }\n.nav a.on::before { content: \"\"; position: absolute; left: -10px; top: 8px; bottom: 8px; width: 3px; border-radius: 3px; background: var(--accent); }\n.nav .badge { margin-left: auto; font-size: 11px; padding: 0 7px; border-radius: 10px; background: var(--panel3); color: var(--ink2); font-variant-numeric: tabular-nums; }\n.nav .badge.crit { background: color-mix(in srgb, var(--crit) 25%, var(--panel)); color: var(--ink); }\n.nav .badge.warn { background: color-mix(in srgb, var(--warn) 22%, var(--panel)); color: var(--ink); }\n.app.collapsed .nav h6, .app.collapsed .nav a span, .app.collapsed .nav .badge, .app.collapsed .brand span, .app.collapsed .brand small, .app.collapsed .side-foot .txt { display: none; }\n.app.collapsed .nav a { justify-content: center; }\n.side-foot { padding: 10px 14px 14px; border-top: 1px solid var(--line); font-size: 12px; color: var(--muted); display: flex; flex-direction: column; gap: 6px; }\n.main { display: flex; flex-direction: column; min-width: 0; min-height: 0; }\n.top { display: flex; align-items: center; gap: 12px; padding: 10px 20px; border-bottom: 1px solid var(--line); background: color-mix(in srgb, var(--bg) 85%, transparent); backdrop-filter: blur(10px); min-height: 56px; }\n.top h1 { font-size: 17px; margin: 0; font-weight: 650; white-space: nowrap; }\n.crumb { display: flex; align-items: baseline; gap: 10px; min-width: 0; }\n.crumb .muted { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 13px; }\n.spacer { flex: 1; }\n.search-btn { display: flex; align-items: center; gap: 10px; background: var(--panel); border: 1px solid var(--line); border-radius: 9px; padding: 6px 10px; color: var(--muted); cursor: pointer; min-width: 240px; }\n.search-btn:hover { border-color: var(--line2); color: var(--ink2); }\n.search-btn svg { width: 15px; height: 15px; }\nkbd { font: 11px var(--mono); padding: 1px 6px; border-radius: 5px; border: 1px solid var(--line2); background: var(--panel2); color: var(--muted); margin-left: auto; }\n.top-actions { display: flex; gap: 6px; align-items: center; }\n.page { flex: 1; overflow-y: auto; padding: 18px 20px 28px; min-height: 0; }\n.status { display: flex; align-items: center; gap: 16px; padding: 0 16px; height: 28px; border-top: 1px solid var(--line); background: var(--bg2); font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; font-variant-numeric: tabular-nums; }\n.status b { color: var(--ink2); font-weight: 600; }\n.status .sep { width: 1px; height: 12px; background: var(--line2); }\n.status a { color: inherit; cursor: pointer; }\n.dot { width: 7px; height: 7px; border-radius: 50%; background: var(--muted); display: inline-block; flex: none; }\n.dot.live { background: var(--good); box-shadow: 0 0 0 0 rgba(12,163,12,.6); animation: pulse 2s infinite; }\n.dot.off { background: var(--crit); }\n@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(12,163,12,.5); } 70% { box-shadow: 0 0 0 6px rgba(12,163,12,0); } 100% { box-shadow: 0 0 0 0 rgba(12,163,12,0); } }\n.banner { margin: 12px 20px 0; padding: 9px 12px; border-radius: 9px; border: 1px solid color-mix(in srgb, var(--warn) 45%, var(--line)); background: color-mix(in srgb, var(--warn) 8%, var(--panel)); font-size: 13px; display: flex; gap: 10px; align-items: center; }\n\n/* ---------- controls ---------- */\n.btn { display: inline-flex; align-items: center; gap: 7px; background: var(--panel); border: 1px solid var(--line); border-radius: var(--r2); padding: 6px 12px; cursor: pointer; white-space: nowrap; color: var(--ink); line-height: 1.3; }\n.btn:hover { background: var(--panel2); border-color: var(--line2); }\n.btn:disabled { opacity: .45; cursor: not-allowed; }\n.btn svg { width: 15px; height: 15px; }\n.btn.primary { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }\n.btn.primary:hover { filter: brightness(1.08); }\n.btn.danger { border-color: color-mix(in srgb, var(--crit) 55%, var(--line)); }\n.btn.danger:hover { background: color-mix(in srgb, var(--crit) 16%, var(--panel)); }\n.btn.ghost { background: transparent; border-color: transparent; color: var(--ink2); }\n.btn.ghost:hover { background: var(--hover); color: var(--ink); }\n.btn.sm { padding: 3px 9px; font-size: 12.5px; border-radius: 7px; }\n.btn.on { border-color: var(--accent); color: var(--ink); background: color-mix(in srgb, var(--accent) 12%, var(--panel)); }\n.icon-btn { display: inline-grid; place-items: center; width: 32px; height: 32px; border-radius: 8px; border: 1px solid transparent; background: transparent; cursor: pointer; color: var(--ink2); }\n.icon-btn:hover { background: var(--hover); color: var(--ink); }\n.icon-btn svg { width: 18px; height: 18px; }\n.icon-btn.on { color: var(--accent); }\n.seg { display: inline-flex; background: var(--panel); border: 1px solid var(--line); border-radius: 9px; padding: 2px; gap: 2px; }\n.seg button { background: transparent; border: 0; padding: 4px 10px; border-radius: 7px; cursor: pointer; color: var(--ink2); white-space: nowrap; font-size: 13px; }\n.seg button:hover { color: var(--ink); }\n.seg button.on { background: var(--panel3); color: var(--ink); font-weight: 600; }\ninput[type=text], input[type=search], input[type=number], input[type=url], select, textarea { background: var(--panel); border: 1px solid var(--line); border-radius: var(--r2); padding: 6px 10px; color: var(--ink); min-width: 0; }\ninput:focus, select:focus, textarea:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent); }\nlabel.field { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--muted); }\nlabel.check { display: inline-flex; align-items: center; gap: 7px; cursor: pointer; user-select: none; }\ninput[type=checkbox] { accent-color: var(--accent); width: 15px; height: 15px; }\n.toolbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 12px; }\n.toolbar input[type=search] { min-width: 260px; }\n.toolbar .grow { flex: 1; }\n\n/* ---------- cards / grids ---------- */\n.card { background: var(--panel); border: 1px solid var(--line); border-radius: var(--r); padding: 14px 16px; min-width: 0; position: relative; }\n.card > header, .w > header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; min-height: 22px; }\n.card h2, .w h2 { font-size: 13px; margin: 0; font-weight: 650; letter-spacing: .2px; white-space: nowrap; }\n.card h3 { font-size: 11px; margin: 14px 0 6px; color: var(--muted); text-transform: uppercase; letter-spacing: .6px; font-weight: 650; }\n.card .right, .w .right { margin-left: auto; display: flex; align-items: center; gap: 8px; }\n.grid { display: grid; gap: 14px; margin-bottom: 14px; }\n.g2 { grid-template-columns: repeat(2, minmax(0, 1fr)); } .g3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } .g4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }\n.g12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }\n.span2 { grid-column: span 2; } .span3 { grid-column: span 3; }\n.big { font-size: 22px; font-weight: 650; font-variant-numeric: tabular-nums; }\n.huge { font-size: 40px; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }\n.stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px 16px; margin: 10px 0 0; }\n.stats div { min-width: 0; }\n.stats dt { font-size: 10.5px; color: var(--muted); text-transform: uppercase; letter-spacing: .4px; white-space: nowrap; }\n.stats dd { margin: 1px 0 0; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.kv { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 6px 16px; font-size: 13px; margin: 0; }\n.kv dt { color: var(--muted); } .kv dd { margin: 0; overflow-wrap: anywhere; }\n.empty { color: var(--muted); padding: 22px 8px; text-align: center; font-size: 13px; }\n.note { border: 1px dashed var(--axis); border-radius: 10px; padding: 12px 14px; color: var(--ink2); font-size: 13px; }\n.note b { color: var(--ink); } .note ol { margin: 6px 0 0; padding-left: 20px; } .note li { margin: 3px 0; }\n\n/* ---------- KPI tiles ---------- */\n.kpis { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 12px; height: 100%; }\n.kpi { background: var(--panel); border: 1px solid var(--line); border-radius: var(--r); padding: 10px 12px 6px; min-width: 0; display: flex; flex-direction: column; cursor: pointer; overflow: hidden; }\n.kpi:hover { border-color: var(--line2); }\n.kpi .kl { display: flex; align-items: center; justify-content: space-between; gap: 6px; font-size: 11px; color: var(--muted); font-weight: 650; letter-spacing: .5px; text-transform: uppercase; min-height: 20px; }\n.kpi .kv2 { font-size: 25px; font-weight: 680; line-height: 1.15; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }\n.kpi .kv2 small { font-size: 13px; font-weight: 500; color: var(--ink2); margin-left: 3px; }\n.kpi .ks { font-size: 12px; color: var(--ink2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.kpi canvas { display: block; width: 100%; height: 26px; margin-top: auto; }\n\n/* ---------- dashboard grid ---------- */\n.dash { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); grid-auto-rows: 84px; gap: 12px; grid-auto-flow: row dense; }\n.w { background: var(--panel); border: 1px solid var(--line); border-radius: var(--r); padding: 12px 14px; min-width: 0; min-height: 0; display: flex; flex-direction: column; overflow: hidden; position: relative; }\n.w.bare { background: transparent; border: 0; padding: 0; }\n.w .wb { flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; }\n.w .wb.noscroll { overflow: hidden; }\n.dash.editing .w { outline: 1px dashed var(--axis); outline-offset: 2px; cursor: grab; }\n.dash.editing .w.dragging { opacity: .4; }\n.dash.editing .w.over { outline: 2px solid var(--accent); }\n.wtools { display: none; position: absolute; top: 6px; right: 6px; z-index: 3; gap: 2px; background: var(--panel3); border-radius: 8px; padding: 2px; box-shadow: var(--shadow); }\n.dash.editing .wtools { display: flex; }\n.wtools button { width: 26px; height: 24px; border: 0; background: transparent; border-radius: 6px; cursor: pointer; color: var(--ink2); display: grid; place-items: center; }\n.wtools button:hover { background: var(--hover); color: var(--ink); }\n.wtools svg { width: 14px; height: 14px; }\ncanvas.chart { display: block; width: 100%; height: 100%; min-height: 60px; }\n.chartbox { flex: 1; min-height: 70px; position: relative; display: flex; flex-direction: column; }\n.chartbox canvas { flex: 1; }\n\n/* ---------- data viz bits ---------- */\n.legend { display: flex; gap: 14px; flex-wrap: wrap; font-size: 12px; color: var(--ink2); margin-bottom: 6px; }\n.legend span { display: inline-flex; align-items: center; gap: 6px; }\n.legend i { width: 10px; height: 3px; border-radius: 2px; display: inline-block; }\n.legend b { color: var(--ink); font-weight: 600; font-variant-numeric: tabular-nums; }\n.bar { height: 6px; background: var(--panel3); border-radius: 4px; overflow: hidden; min-width: 30px; }\n.bar i { display: block; height: 100%; border-radius: 4px; transition: width .35s ease; }\n.brow { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 3px 10px; align-items: center; margin: 7px 0; }\n.brow .bl { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 13px; }\n.brow .bv { font-size: 12.5px; font-variant-numeric: tabular-nums; color: var(--ink2); text-align: right; white-space: nowrap; }\n.brow .bar { grid-column: 1 / -1; }\n.brow.click { cursor: pointer; border-radius: 6px; }\n.brow.click:hover .bl { color: var(--accent); }\n.stack { display: flex; gap: 2px; height: 12px; border-radius: 4px; overflow: hidden; background: var(--panel3); }\n.stack i { display: block; height: 100%; }\n.cores { display: grid; gap: 4px; margin-top: 10px; }\n.core { display: flex; flex-direction: column; align-items: center; font-size: 10.5px; font-variant-numeric: tabular-nums; color: var(--ink2); min-width: 0; }\n.ctrack { width: 100%; height: 36px; background: var(--panel3); border-radius: 4px; display: flex; align-items: flex-end; overflow: hidden; }\n.ctrack i { display: block; width: 100%; background: var(--s1); border-radius: 3px 3px 0 0; transition: height .35s ease; }\n.core b { color: var(--ink); font-weight: 600; margin-top: 2px; }\n.gauge { position: relative; display: grid; place-items: center; }\n.gauge svg { width: 100%; height: auto; display: block; }\n.gauge .gv { position: absolute; bottom: 4px; left: 0; right: 0; text-align: center; }\n\n/* ---------- chips / tags ---------- */\n.chip { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; padding: 1px 8px; border-radius: 999px; border: 1px solid var(--line); background: var(--panel2); color: var(--ink); white-space: nowrap; font-weight: 500; line-height: 1.5; }\n.chip i { width: 7px; height: 7px; border-radius: 50%; background: var(--muted); display: inline-block; flex: none; }\n.chip.good i { background: var(--good); } .chip.warn i { background: var(--warn); } .chip.serious i { background: var(--serious); } .chip.crit i { background: var(--crit); } .chip.info i { background: var(--s1); }\n.chip.link { cursor: pointer; } .chip.link:hover { border-color: var(--line2); }\n.sev { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 650; text-transform: uppercase; letter-spacing: .4px; padding: 1px 7px; border-radius: 5px; white-space: nowrap; }\n.sev svg { width: 12px; height: 12px; }\n.sev.critical { background: color-mix(in srgb, var(--crit) 22%, var(--panel)); }\n.sev.high { background: color-mix(in srgb, var(--serious) 22%, var(--panel)); }\n.sev.medium { background: color-mix(in srgb, var(--warn) 18%, var(--panel)); }\n.sev.low { background: var(--panel3); }\n.sev.info { background: color-mix(in srgb, var(--s1) 14%, var(--panel)); }\n.tag { display: inline-block; font-size: 10.5px; padding: 0 6px; border-radius: 4px; background: var(--panel3); color: var(--ink2); margin-left: 6px; vertical-align: 1px; text-transform: lowercase; white-space: nowrap; font-weight: 500; }\n.tag.flag { background: color-mix(in srgb, var(--serious) 20%, var(--panel)); color: var(--ink); }\n.tag.game { background: color-mix(in srgb, var(--s6) 22%, var(--panel)); color: var(--ink); }\n.tag.dev { background: color-mix(in srgb, var(--s1) 18%, var(--panel)); color: var(--ink); }\n.plink { font: 12px var(--mono); padding: 1px 7px; border-radius: 6px; border: 1px solid var(--line); background: var(--panel2); color: var(--ink); white-space: nowrap; display: inline-block; }\n.plink:hover { border-color: var(--accent); text-decoration: none; }\n.plinks { display: inline-flex; gap: 5px; flex-wrap: wrap; }\n\n/* ---------- tables ---------- */\n.tw { overflow: auto; max-width: 100%; }\ntable.t { width: 100%; border-collapse: collapse; font-size: 13px; }\ntable.t th { position: sticky; top: 0; z-index: 1; background: var(--panel); text-align: left; font-weight: 600; color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: .4px; padding: 7px 8px; border-bottom: 1px solid var(--line); white-space: nowrap; user-select: none; }\ntable.t th.s { cursor: pointer; } table.t th.s:hover, table.t th.on { color: var(--ink); }\ntable.t td { padding: 6px 8px; border-bottom: 1px solid var(--line); white-space: nowrap; vertical-align: middle; }\ntable.t td.n, table.t th.n { text-align: right; font-variant-numeric: tabular-nums; }\ntable.t td.wrap { white-space: normal; overflow-wrap: anywhere; }\ntable.t tr.click { cursor: pointer; } table.t tr.click:hover td { background: var(--hover); }\ntable.t tr.sel td { background: color-mix(in srgb, var(--accent) 10%, transparent); }\ntable.t .pn { font-weight: 600; max-width: 280px; overflow: hidden; text-overflow: ellipsis; display: inline-block; vertical-align: bottom; }\ntable.t .sub { color: var(--muted); font-size: 12px; max-width: 360px; overflow: hidden; text-overflow: ellipsis; display: inline-block; vertical-align: bottom; margin-left: 6px; }\n.cb { display: flex; align-items: center; gap: 8px; justify-content: flex-end; }\n.cb .bar { width: 44px; min-width: 44px; height: 4px; }\n.tree-i { display: inline-block; color: var(--faint); font-family: var(--mono); }\n\n/* ---------- drawer / modal / palette / toasts ---------- */\n.drawer { position: fixed; top: 0; right: 0; bottom: 0; width: min(620px, 100vw); z-index: 40; background: var(--panel); border-left: 1px solid var(--line2); box-shadow: var(--shadow); display: flex; flex-direction: column; transform: translateX(0); transition: transform .2s ease; }\n.drawer[hidden] { display: flex; transform: translateX(105%); pointer-events: none; }\n.drawer > header { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid var(--line); }\n.drawer > header h2 { margin: 0; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.drawer .db { flex: 1; overflow-y: auto; padding: 14px 16px 24px; }\n.actions { display: flex; gap: 6px; flex-wrap: wrap; margin: 2px 0 12px; }\n.backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 50; display: grid; place-items: start center; padding-top: 10vh; }\n.modal { background: var(--panel); border: 1px solid var(--line2); border-radius: 14px; box-shadow: var(--shadow); width: min(520px, calc(100vw - 32px)); max-height: 80vh; display: flex; flex-direction: column; }\n.modal.wide { width: min(860px, calc(100vw - 32px)); }\n.modal > header { padding: 14px 18px 0; font-weight: 650; font-size: 15px; }\n.modal .mb { padding: 12px 18px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }\n.modal > footer { padding: 12px 18px 16px; display: flex; gap: 8px; justify-content: flex-end; }\n.palette { width: min(640px, calc(100vw - 32px)); }\n.palette input { border: 0; border-bottom: 1px solid var(--line); border-radius: 14px 14px 0 0; padding: 14px 16px; font-size: 15px; background: transparent; width: 100%; }\n.palette input:focus { box-shadow: none; }\n.pl { max-height: 52vh; overflow-y: auto; padding: 6px; }\n.pi { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px; cursor: pointer; }\n.pi svg { width: 16px; height: 16px; color: var(--muted); flex: none; }\n.pi .ph { margin-left: auto; color: var(--muted); font-size: 12px; white-space: nowrap; }\n.pi.on { background: var(--panel3); }\n.pg { font-size: 10.5px; color: var(--faint); text-transform: uppercase; letter-spacing: .7px; padding: 8px 10px 4px; font-weight: 650; }\n.toasts { position: fixed; right: 16px; bottom: 40px; z-index: 60; display: flex; flex-direction: column; gap: 8px; align-items: flex-end; }\n.toast { background: var(--panel2); border: 1px solid var(--line2); border-left: 3px solid var(--s1); border-radius: 10px; padding: 9px 13px; max-width: 440px; box-shadow: var(--shadow); font-size: 13px; animation: tin .18s ease; overflow-wrap: anywhere; }\n.toast.ok { border-left-color: var(--good); } .toast.err { border-left-color: var(--crit); } .toast.warn { border-left-color: var(--warn); }\n@keyframes tin { from { transform: translateY(8px); opacity: 0; } }\n.tip { position: fixed; z-index: 70; pointer-events: none; background: var(--panel2); border: 1px solid var(--line2); border-radius: 9px; padding: 7px 10px; font-size: 12px; box-shadow: var(--shadow); min-width: 120px; }\n.tip .tt { color: var(--muted); margin-bottom: 3px; }\n.tip .tr { display: flex; align-items: center; gap: 10px; justify-content: space-between; }\n.tip .tr span { display: inline-flex; align-items: center; gap: 6px; color: var(--ink2); }\n.tip .tr i { width: 8px; height: 8px; border-radius: 50%; }\n.tip .tr b { font-variant-numeric: tabular-nums; font-weight: 600; }\n\n/* ---------- terminal / lab ---------- */\n.term { background: #07080a; color: #d7d5cc; font: 12.5px/1.55 var(--mono); border-radius: 10px; border: 1px solid var(--line); padding: 10px 12px; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; min-height: 160px; }\n:root[data-theme=\"light\"] .term { background: #15161a; }\n.term .cmd { color: #7fb4ff; } .term .ok { color: #6fd36f; } .term .err { color: #ff8a80; } .term .dim { color: #8a887f; }\n.lab { display: grid; grid-template-columns: 220px minmax(0, 1fr) 260px; gap: 14px; align-items: start; }\n.toollist a { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px; color: var(--ink2); cursor: pointer; text-decoration: none; }\n.toollist a:hover { background: var(--hover); color: var(--ink); }\n.toollist a.on { background: var(--panel2); color: var(--ink); font-weight: 600; }\n.toollist a small { display: block; color: var(--muted); font-weight: 400; font-size: 11.5px; }\n.toollist svg { width: 16px; height: 16px; flex: none; }\n.form { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end; margin-bottom: 12px; }\n.form .field input, .form .field select { min-width: 140px; }\n.progress { height: 4px; border-radius: 3px; background: var(--panel3); overflow: hidden; margin: 6px 0 10px; }\n.progress i { display: block; height: 100%; background: var(--accent); transition: width .3s; }\n.joblist { display: flex; flex-direction: column; gap: 4px; }\n.joblist a { display: block; padding: 7px 9px; border-radius: 8px; color: var(--ink2); cursor: pointer; font-size: 12.5px; text-decoration: none; }\n.joblist a:hover { background: var(--hover); } .joblist a.on { background: var(--panel2); color: var(--ink); }\n.joblist small { color: var(--muted); display: block; }\n\n/* ---------- misc pages ---------- */\n.devgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)); gap: 12px; }\n.devc { background: var(--panel); border: 1px solid var(--line); border-radius: var(--r); padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; min-width: 0; }\n.devc .dl { font-weight: 650; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.devc .dm { font-size: 12px; color: var(--ink2); display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }\n.rt { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 650; text-transform: uppercase; letter-spacing: .5px; color: var(--ink2); }\n.rt i { width: 8px; height: 8px; border-radius: 2px; display: inline-block; }\n.finding { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 4px 12px; padding: 12px 0; border-bottom: 1px solid var(--line); align-items: start; }\n.finding:last-child { border-bottom: 0; }\n.finding .ft { font-weight: 600; }\n.finding .fd { color: var(--ink2); font-size: 13px; grid-column: 2; }\n.finding .ff { color: var(--muted); font-size: 12.5px; grid-column: 2; }\n.ev { display: grid; grid-template-columns: 62px 22px minmax(0, 1fr); gap: 2px 8px; padding: 6px 0; border-bottom: 1px solid var(--line); font-size: 13px; align-items: start; }\n.ev:last-child { border-bottom: 0; }\n.ev time { color: var(--muted); font-size: 12px; font-variant-numeric: tabular-nums; padding-top: 1px; }\n.ev svg { width: 15px; height: 15px; margin-top: 2px; }\n.ev .et { overflow-wrap: anywhere; }\n.ev .ed { grid-column: 3; color: var(--muted); font-size: 12px; overflow-wrap: anywhere; }\n.ev.warn svg { color: var(--warn); } .ev.alert svg { color: var(--crit); } .ev.info svg { color: var(--muted); }\n.cmd { font: 12px var(--mono); color: var(--ink2); overflow-wrap: anywhere; white-space: pre-wrap; background: var(--panel2); border-radius: 8px; padding: 8px 10px; }\n.sensor-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 14px; }\n.heat { display: grid; gap: 1px; }\n\n/* table <-> chart */\n.tv { display: flex; gap: 8px; align-items: center; margin: 0 0 8px; flex-wrap: wrap; }\n.tv .seg button { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; font-size: 12px; }\n.tv .seg svg { width: 13px; height: 13px; }\n.tv select { padding: 3px 8px; font-size: 12.5px; }\n.hbars { display: flex; flex-direction: column; gap: 3px; }\n.hb { display: grid; grid-template-columns: minmax(110px, 28%) minmax(0, 1fr) minmax(70px, auto); gap: 10px; align-items: center; padding: 3px 6px; border-radius: 6px; font-size: 13px; }\n.hb.click { cursor: pointer; } .hb.click:hover { background: var(--hover); }\n.hbl { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.hbt { height: 10px; background: var(--panel3); border-radius: 5px; overflow: hidden; }\n.hbt i { display: block; height: 100%; border-radius: 5px; background: var(--accent); transition: width .35s ease; }\n.hbv { text-align: right; font-variant-numeric: tabular-nums; color: var(--ink2); white-space: nowrap; font-size: 12.5px; }\n.histo { display: flex; align-items: flex-end; gap: 2px; height: 150px; padding: 4px 0; border-bottom: 1px solid var(--axis); }\n.histo i { flex: 1; background: var(--accent); border-radius: 3px 3px 0 0; min-width: 2px; opacity: .9; }\n.histo i:hover { opacity: 1; filter: brightness(1.2); }\n.histo-ax { display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); margin-top: 4px; }\n/* sensors */\n.sgrp { margin-top: 10px; }\n.sgrp h3 { display: flex; align-items: center; gap: 8px; }\n.kchips { display: flex; flex-wrap: wrap; gap: 6px; }\n.kchip { display: inline-flex; gap: 6px; align-items: baseline; padding: 3px 9px; border-radius: 8px; background: var(--panel2); border: 1px solid var(--line); font-size: 12.5px; cursor: pointer; }\n.kchip:hover { border-color: var(--line2); }\n.kchip b { font-variant-numeric: tabular-nums; }\ncanvas.spark-row { width: 110px; height: 22px; display: block; }\n.srow { display: grid; grid-template-columns: minmax(0, 1fr) 110px 92px 120px; gap: 10px; align-items: center; padding: 4px 4px; border-bottom: 1px solid var(--line); font-size: 13px; cursor: pointer; }\n.srow:hover { background: var(--hover); }\n.srow .sn { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.srow .sv { text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; }\n.srow .sm { text-align: right; color: var(--muted); font-size: 12px; font-variant-numeric: tabular-nums; }\n\n/* compact density */\n.compact .card, .compact .w { padding: 10px 12px; }\n.compact .page { padding: 12px 14px 20px; }\n.compact table.t td { padding: 4px 8px; }\n.compact .dash { gap: 8px; grid-auto-rows: 76px; }\n.compact .grid { gap: 10px; margin-bottom: 10px; }\n.swatches { display: flex; gap: 8px; flex-wrap: wrap; }\n.swatches button { width: 26px; height: 26px; border-radius: 50%; border: 2px solid var(--panel); cursor: pointer; box-shadow: 0 0 0 1px var(--line2); }\n.swatches button.on { box-shadow: 0 0 0 2px var(--ink); }\n\n/* ======================= SIEM ======================= */\n.g21 { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); }\n.g311 { grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr); }\n.mbar { display: flex; gap: 4px; overflow-x: auto; padding-bottom: 6px; margin: -4px 0 12px; scrollbar-width: thin; }\n.mbar a { display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px; border-radius: 999px; border: 1px solid var(--line); background: var(--panel); color: var(--ink2); white-space: nowrap; font-size: 12.5px; cursor: pointer; }\n.mbar a:hover { color: var(--ink); border-color: var(--line2); }\n.mbar a.on { background: color-mix(in srgb, var(--accent) 16%, var(--panel)); border-color: color-mix(in srgb, var(--accent) 55%, var(--line)); color: var(--ink); font-weight: 600; }\n.mbar svg { width: 14px; height: 14px; }\n.mhead { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }\n.mhead h2 { margin: 0; font-size: 18px; font-weight: 700; letter-spacing: .1px; }\n.mhead .grow { flex: 1; }\n.newpill { border-color: color-mix(in srgb, var(--accent) 60%, var(--line)); background: color-mix(in srgb, var(--accent) 14%, var(--panel)); animation: rwpulse 2s ease-in-out 2; }\n@keyframes rwpulse { 50% { box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 20%, transparent); } }\n.mico { width: 40px; height: 40px; border-radius: 11px; display: grid; place-items: center; background: color-mix(in srgb, var(--accent) 16%, var(--panel)); color: var(--accent); flex: none; }\n.mico svg { width: 22px; height: 22px; }\n.srange { display: flex; align-items: center; gap: 4px; }\n.agent { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 12.5px; color: var(--ink2); background: var(--panel); border: 1px solid var(--line); border-radius: 999px; padding: 4px 12px; }\n.agent > span { display: inline-flex; align-items: center; gap: 5px; }\n.agent svg { width: 14px; height: 14px; }\n.skpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(128px, 1fr)); gap: 10px; margin-bottom: 14px; }\n.skpi { min-height: 92px; }\n.skpi .kl svg { width: 16px; height: 16px; }\n.skpi[data-f]:hover, .skpi[data-mod]:hover, .skpi[data-stab]:hover { border-color: color-mix(in srgb, var(--accent) 50%, var(--line)); }\n.snote { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 14px; border-style: solid; background: color-mix(in srgb, var(--warn) 8%, var(--panel)); border-color: color-mix(in srgb, var(--warn) 40%, var(--line)); }\n.snote svg { width: 18px; height: 18px; color: var(--warn); flex: none; margin-top: 2px; }\n.snote .btn { margin-left: 8px; }\n/* charts */\n.schart { position: relative; }\n.schart svg { width: 100%; display: block; overflow: visible; }\n.schart .gl { stroke: var(--line); stroke-width: 1; vector-effect: non-scaling-stroke; }\n.schart .hit, .gantt [data-tipk] { fill: transparent; cursor: crosshair; }\n.schart .hit:hover { fill: color-mix(in srgb, var(--ink) 6%, transparent); }\n.schart .ymax { position: absolute; top: -2px; left: 0; font-size: 10.5px; color: var(--muted); background: var(--panel); padding-right: 4px; z-index: 1; }\n.xax { display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); margin-top: 5px; border-top: 1px solid var(--axis); padding-top: 4px; }\n.slegend { display: flex; flex-wrap: wrap; gap: 4px 14px; margin-top: 8px; font-size: 12px; color: var(--ink2); }\n.slegend span { display: inline-flex; align-items: center; gap: 6px; }\n.slegend i, .dleg i, .tiprows i { width: 10px; height: 10px; border-radius: 3px; display: inline-block; flex: none; }\n.tiprows { margin-top: 4px; display: grid; gap: 2px; min-width: 150px; }\n.tiprows div { display: flex; align-items: center; gap: 7px; }\n.tiprows b { margin-left: auto; padding-left: 12px; font-variant-numeric: tabular-nums; }\n.tiprows .tt { border-top: 1px solid var(--line); padding-top: 3px; margin-top: 2px; }\n.donut { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }\n.dsvg { position: relative; width: 150px; height: 150px; flex: none; }\n.dsvg svg { width: 100%; height: 100%; }\n.dsvg circle { transition: stroke-width .15s; }\n.dsvg circle:hover { stroke-width: 17; }\n.dc { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; pointer-events: none; }\n.dc b { font-size: 22px; font-variant-numeric: tabular-nums; line-height: 1.1; }\n.dc span { font-size: 11px; color: var(--muted); }\n.dleg { flex: 1; min-width: 150px; display: grid; gap: 3px; font-size: 12.5px; }\n.dleg div { display: grid; grid-template-columns: 10px minmax(0, 1fr) auto 38px; gap: 8px; align-items: center; padding: 2px 4px; border-radius: 6px; }\n.dleg .dl { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.dleg b { font-variant-numeric: tabular-nums; font-weight: 600; }\n.dleg em { font-style: normal; color: var(--muted); text-align: right; font-variant-numeric: tabular-nums; }\n.clk { cursor: pointer; } .dleg .clk:hover { background: var(--hover); }\n.wheat { display: grid; grid-template-columns: 34px repeat(24, minmax(0, 1fr)); gap: 3px; align-items: center; }\n.wheat i { aspect-ratio: 1.3; border-radius: 3px; min-height: 9px; }\n.wheat .wd { font-size: 11px; color: var(--muted); }\n.wheat .wh { font-size: 10px; color: var(--muted); }\n.spk { width: 100%; height: 26px; display: block; margin-top: 6px; }\n.sstrip { display: flex; height: 6px; border-radius: 3px; overflow: hidden; gap: 2px; margin-top: 10px; background: var(--panel3); }\n.sstrip i { display: block; min-width: 3px; }\n.lvb { display: inline-grid; place-items: center; min-width: 26px; height: 22px; padding: 0 5px; border-radius: 6px; font-weight: 700; font-size: 12px; font-variant-numeric: tabular-nums; background: color-mix(in srgb, var(--c) 24%, var(--panel)); color: var(--ink); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 60%, transparent); }\n/* module catalogue */\n.scat { font-size: 11px; margin: 18px 0 8px; color: var(--muted); text-transform: uppercase; letter-spacing: .7px; font-weight: 650; }\n.mgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 12px; margin-bottom: 4px; }\n.mcard { background: var(--panel); border: 1px solid var(--line); border-radius: var(--r); padding: 14px 16px 12px; cursor: pointer; transition: border-color .15s, transform .15s; min-width: 0; }\n.mcard:hover { border-color: color-mix(in srgb, var(--accent) 55%, var(--line)); transform: translateY(-1px); }\n.mct { display: flex; align-items: center; gap: 8px; font-size: 14px; }\n.mct svg { width: 18px; height: 18px; color: var(--accent); }\n.mcd { color: var(--muted); font-size: 12.5px; margin: 6px 0 8px; line-height: 1.4; min-height: 34px; }\n.mcn { display: flex; align-items: baseline; gap: 8px; }\n.mcn .big { font-size: 24px; font-weight: 700; font-variant-numeric: tabular-nums; }\n.mcn .muted { font-size: 12px; }\n.srcs { display: flex; flex-wrap: wrap; gap: 6px; }\n.sb .hb { grid-template-columns: minmax(0, 1.6fr) minmax(48px, 1fr) minmax(34px, auto); }\n/* event feed */\n.sfeed { display: flex; flex-direction: column; }\n.sev-ev { border-left: 3px solid var(--c); padding: 8px 10px 8px 12px; border-bottom: 1px solid var(--line); background: linear-gradient(90deg, color-mix(in srgb, var(--c) 7%, transparent), transparent 40%); }\n.sev-ev:last-child { border-bottom: 0; }\n.evh { display: flex; gap: 10px; align-items: flex-start; cursor: pointer; }\n.evm { min-width: 0; flex: 1; }\n.evt { display: flex; gap: 10px; align-items: baseline; }\n.evt b { font-weight: 600; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.evt time { margin-left: auto; font-size: 12px; color: var(--muted); white-space: nowrap; font-variant-numeric: tabular-nums; }\n.evd { color: var(--ink2); font-size: 13px; margin-top: 2px; overflow-wrap: anywhere; }\n.evc { display: flex; flex-wrap: wrap; gap: 5px; margin: 6px 0 0 36px; }\n.echip { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; padding: 1px 8px; border-radius: 999px; background: var(--panel2); border: 1px solid var(--line); color: var(--ink2); cursor: pointer; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.echip:hover { color: var(--ink); border-color: var(--line2); }\n.echip svg { width: 12px; height: 12px; flex: none; }\n.echip.mitre { background: color-mix(in srgb, var(--s5) 14%, var(--panel)); }\n.echip.faint { color: var(--muted); }\n.evx { margin: 10px 0 4px 36px; }\n.evkv { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 3px 12px; margin: 0 0 10px; font-size: 12.5px; }\n.evkv dt { color: var(--muted); } .evkv dd { margin: 0; overflow-wrap: anywhere; }\n.evacts { display: flex; flex-wrap: wrap; gap: 6px; }\n.evjson { margin: 10px 0 0; background: var(--bg2); border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; font-size: 11.5px; max-height: 260px; overflow: auto; white-space: pre; }\n/* hunting */\n.hbar { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; flex-wrap: wrap; }\n.hsearch { flex: 1; min-width: 260px; display: flex; align-items: center; gap: 8px; background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 0 12px; }\n.hsearch:focus-within { border-color: var(--accent); }\n.hsearch svg { width: 16px; height: 16px; color: var(--muted); }\n.hsearch input { flex: 1; border: 0; background: transparent; padding: 9px 0; outline: none; min-width: 0; font-family: var(--mono, ui-monospace, monospace); font-size: 13px; }\n.qchips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }\n.hgrid { display: grid; grid-template-columns: 250px minmax(0, 1fr); gap: 14px; align-items: start; }\n.hgrid > div > .card { margin-bottom: 14px; }\n.facets { position: sticky; top: 0; max-height: calc(100vh - 140px); overflow: auto; padding: 10px 12px; }\n.fset h4 { margin: 10px 0 4px; font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .6px; }\n.fset:first-child h4 { margin-top: 0; }\n.fset a { display: flex; justify-content: space-between; gap: 8px; padding: 3px 6px; border-radius: 6px; font-size: 12.5px; cursor: pointer; }\n.fset a:hover { background: var(--hover); }\n.fset a span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.fset a b { color: var(--ink2); font-weight: 500; font-variant-numeric: tabular-nums; }\n/* MITRE matrix */\n.mtx { display: grid; grid-template-columns: repeat(12, minmax(118px, 1fr)); gap: 6px; overflow-x: auto; padding-bottom: 4px; }\n.mcol { display: flex; flex-direction: column; gap: 5px; min-width: 0; }\n.mth { background: var(--panel3); border-radius: 8px; padding: 7px 8px; font-size: 12px; display: flex; flex-direction: column; gap: 2px; min-height: 52px; }\n.mth span { color: var(--muted); font-variant-numeric: tabular-nums; }\n.mtile, .ctile, .fset a, .mbar a, .mcard, .ipcard { color: var(--ink); text-decoration: none; }\n.mtile { display: block; padding: 7px 8px; border-radius: 8px; border: 1px solid var(--line); background: var(--panel2); font-size: 12px; cursor: pointer; line-height: 1.3; }\n.mtile em { display: block; font-style: normal; font-size: 11px; color: var(--ink2); margin-top: 2px; }\n.mtile.zero { opacity: .45; } .mtile.zero:hover { opacity: .8; }\n.mtile:hover { border-color: var(--line2); } .mtile.sel { box-shadow: 0 0 0 2px var(--accent); }\n.mnone { font-size: 11.5px; color: var(--faint); padding: 6px 8px; }\n/* people */\n.ugrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 10px; }\n.ucard, .acard, .pcard, .lcard, .bcard { display: flex; gap: 12px; align-items: flex-start; background: var(--panel2); border: 1px solid var(--line); border-radius: 10px; padding: 12px; min-width: 0; }\n.ucard .ub, .acard > div:nth-child(2), .lcard > div:nth-child(2), .bcard > div:nth-child(2) { flex: 1; min-width: 0; }\n.uav { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; background: color-mix(in srgb, var(--accent) 20%, var(--panel)); color: var(--ink); font-weight: 700; font-size: 13px; flex: none; }\n.uav.sm { width: 32px; height: 32px; border-radius: 9px; font-size: 12px; }\n.uav svg { width: 16px; height: 16px; }\n.ufoot { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 6px; font-size: 12px; }\n.uacts { display: flex; flex-direction: column; gap: 6px; }\n.agrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 8px; }\n.acard.off { opacity: .55; }\n.acard .muted, .pcard .muted, .lcard .muted, .bcard .muted { font-size: 12px; }\n.gantt { display: grid; gap: 6px; }\n.glane { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 10px; align-items: center; }\n.gl-u { font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.gl-t { position: relative; height: 18px; background: var(--panel2); border-radius: 5px; }\n.gl-t i { position: absolute; top: 2px; bottom: 2px; border-radius: 4px; min-width: 3px; cursor: crosshair; }\n.gax .xax { margin-top: 0; }\n/* IP intelligence */\n.ipgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px; }\n.ipcard { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 11px 12px; cursor: pointer; min-width: 0; transition: border-color .15s; }\n.ipcard:hover { border-color: color-mix(in srgb, var(--accent) 55%, var(--line)); }\n.ipcard.hot { border-color: color-mix(in srgb, var(--crit) 55%, var(--line)); }\n.ipt { display: flex; align-items: center; gap: 6px; } .ipt .mono { font-weight: 600; font-size: 13.5px; margin-right: auto; overflow: hidden; text-overflow: ellipsis; }\n.ipn { font-size: 12px; margin: 3px 0 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.ipbar { height: 5px; background: var(--panel3); border-radius: 3px; overflow: hidden; }\n.ipbar i { display: block; height: 100%; background: var(--s1); border-radius: 3px; }\n.ipm { display: flex; justify-content: space-between; font-size: 11.5px; color: var(--ink2); margin-top: 6px; gap: 6px; }\n.ipf { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }\n.ipf .chip { font-size: 11px; }\n.iph { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 8px; }\n.iph .big { font-size: 20px; font-weight: 700; }\n.ipstats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-bottom: 12px; }\n.ipstats div { background: var(--panel2); border-radius: 8px; padding: 8px 10px; }\n.ipstats b { display: block; font-size: 17px; font-variant-numeric: tabular-nums; }\n.ipstats span { font-size: 11.5px; color: var(--muted); }\n.pgrid, .lgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; }\n.lgrid { margin-bottom: 14px; }\n.ell { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }\n.rlist { display: grid; gap: 2px; max-height: 420px; overflow: auto; }\n.rrow { display: grid; grid-template-columns: minmax(120px, .8fr) minmax(0, 2fr) minmax(0, 1.2fr); gap: 12px; padding: 6px 4px; border-bottom: 1px solid var(--line); font-size: 12.5px; align-items: center; }\n/* configuration assessment */\n.scac { display: flex; justify-content: center; flex-wrap: wrap; gap: 6px; margin-top: 10px; }\n.sclist { display: grid; gap: 6px; }\n.scrow { background: var(--panel2); border: 1px solid var(--line); border-radius: 9px; padding: 0 12px; }\n.scrow.failed { border-left: 3px solid var(--crit); } .scrow.passed { border-left: 3px solid var(--good); } .scrow.notapplicable { border-left: 3px solid var(--axis); }\n.scrow summary { display: grid; grid-template-columns: 92px minmax(0, auto) minmax(0, 1fr); gap: 12px; align-items: center; padding: 9px 0; cursor: pointer; list-style: none; }\n.scrow summary::-webkit-details-marker { display: none; }\n.scrow summary .muted { font-size: 12.5px; text-align: right; }\n.scd { padding: 0 0 12px; font-size: 13px; color: var(--ink2); }\n.scd p { margin: 4px 0 8px; } .scd .mono { color: var(--ink); overflow-wrap: anywhere; }\n/* response */\n.bform { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 8px; margin-bottom: 12px; }\n.bform #bip { grid-column: 1 / -1; }\n.blist { display: grid; gap: 8px; }\n.tgl { display: flex; align-items: center; gap: 9px; cursor: pointer; font-weight: 600; }\n.tgl input { width: 34px; height: 19px; appearance: none; -webkit-appearance: none; background: var(--panel3); border-radius: 999px; position: relative; cursor: pointer; flex: none; border: 1px solid var(--line2); transition: background .15s; }\n.tgl input::after { content: ''; position: absolute; top: 2px; left: 2px; width: 13px; height: 13px; border-radius: 50%; background: var(--ink2); transition: transform .15s, background .15s; }\n.tgl input:checked { background: var(--accent); border-color: var(--accent); }\n.tgl input:checked::after { transform: translateX(15px); background: #fff; }\n.tgl input:disabled { opacity: .5; cursor: not-allowed; }\n.kvs { display: grid; gap: 4px; font-size: 12.5px; } .kvs div { display: flex; justify-content: space-between; gap: 10px; }\n#trusted { width: 100%; resize: vertical; margin-bottom: 6px; font-family: var(--mono, ui-monospace, monospace); font-size: 12.5px; }\n/* compliance */\n.cgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 8px; }\n.ctile { display: flex; flex-direction: column; gap: 3px; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--line); background: var(--panel2); cursor: pointer; min-height: 86px; }\n.ctile:hover { border-color: var(--line2); }\n.ctile b { font-size: 14px; } .ctile span { font-size: 12px; color: var(--ink2); line-height: 1.35; } .ctile em { font-style: normal; font-size: 11.5px; color: var(--muted); margin-top: auto; }\n.ctile.zero { opacity: .55; }\n@media (max-width: 1100px) { .g21, .g311 { grid-template-columns: minmax(0, 1fr); } .hgrid { grid-template-columns: minmax(0, 1fr); } .facets { position: static; max-height: none; } }\n@media (max-width: 820px) { .bform { grid-template-columns: minmax(0, 1fr); } .scrow summary { grid-template-columns: 80px minmax(0, 1fr); } .scrow summary .muted { display: none; } .rrow { grid-template-columns: minmax(0, 1fr); gap: 2px; } .evc, .evx { margin-left: 0; } .glane { grid-template-columns: 80px minmax(0, 1fr); } .agent { border-radius: 10px; } }\n\n@media (max-width: 1400px) { .kpis { grid-template-columns: repeat(4, minmax(0, 1fr)); } .lab { grid-template-columns: 200px minmax(0, 1fr); } .lab .jobs { display: none; } }\n@media (max-width: 1100px) { .g4 { grid-template-columns: repeat(2, minmax(0, 1fr)); } .g3 { grid-template-columns: repeat(2, minmax(0, 1fr)); } .dash { grid-template-columns: repeat(6, minmax(0, 1fr)); } .dash .w { grid-column: span 6 !important; } }\n@media (max-width: 820px) {\n  .app, .app.collapsed { grid-template-columns: 1fr; }\n  .side { position: fixed; z-index: 45; left: 0; top: 0; bottom: 0; width: 240px; transform: translateX(-100%); transition: transform .2s; }\n  .app.mobile-open .side { transform: none; box-shadow: var(--shadow); }\n  .top { padding: 8px 12px; gap: 8px; } .search-btn { min-width: 0; } .search-btn .txt, .search-btn kbd, .crumb .muted { display: none; }\n  .page { padding: 12px 16px 24px; }\n  .g2, .g3, .g4 { grid-template-columns: minmax(0, 1fr); } .span2, .span3 { grid-column: auto; }\n  .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n  .dash { grid-template-columns: minmax(0, 1fr); grid-auto-rows: auto; } .dash .w { grid-column: auto !important; grid-row: auto !important; min-height: 220px; }\n  .dash .w.kpiw { min-height: 0; }\n  .lab { grid-template-columns: minmax(0, 1fr); }\n  .toolbar input[type=search] { min-width: 0; flex: 1; }\n  .status .hide-m { display: none; }\n  .top-actions #rangeSeg { max-width: 44vw; overflow-x: auto; scrollbar-width: none; }\n  .mhead .grow { display: none; }\n}\n","public/favicon.svg":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 32\"><rect width=\"32\" height=\"32\" rx=\"8\" fill=\"#1a1b20\"/><path d=\"M4 18h6l3-8 5 14 3-6h7\" fill=\"none\" stroke=\"#3987e5\" stroke-width=\"2.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>\n","public/index.html":"<!doctype html>\n<html lang=\"en\" data-theme=\"dark\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<meta name=\"color-scheme\" content=\"dark light\">\n<title>RigWatch</title>\n<link rel=\"icon\" href=\"/favicon.svg\" type=\"image/svg+xml\">\n<link rel=\"stylesheet\" href=\"/assets/app.css\">\n</head>\n<body>\n<div class=\"app\" id=\"app\">\n  <aside class=\"side\" id=\"side\">\n    <div class=\"brand\">\n      <svg viewBox=\"0 0 32 32\" aria-hidden=\"true\"><rect width=\"32\" height=\"32\" rx=\"8\" fill=\"var(--panel3)\"/><path d=\"M4 18h6l3-8 5 14 3-6h7\" fill=\"none\" stroke=\"var(--accent)\" stroke-width=\"2.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>\n      <span>RigWatch</span><small id=\"ver\"></small>\n    </div>\n    <nav class=\"nav\" id=\"nav\" aria-label=\"Pages\"></nav>\n    <div class=\"side-foot\" id=\"sideFoot\"></div>\n  </aside>\n  <div class=\"main\">\n    <header class=\"top\">\n      <button class=\"icon-btn\" id=\"sideToggle\" title=\"Toggle sidebar ([)\" aria-label=\"Toggle sidebar\"></button>\n      <div class=\"crumb\"><h1 id=\"pageTitle\">RigWatch</h1><span class=\"muted\" id=\"pageSub\"></span></div>\n      <div class=\"spacer\"></div>\n      <button class=\"search-btn\" id=\"paletteBtn\" title=\"Command palette\"><span class=\"ico\"></span><span class=\"txt\">Search, jump, or run a command</span><kbd>Ctrl K</kbd></button>\n      <div class=\"top-actions\" id=\"topActions\"></div>\n    </header>\n    <div id=\"banner\"></div>\n    <main class=\"page\" id=\"page\"></main>\n    <footer class=\"status\" id=\"status\"></footer>\n  </div>\n</div>\n<aside class=\"drawer\" id=\"drawer\" hidden aria-label=\"Details\">\n  <header><h2 id=\"drawerTitle\"></h2><span class=\"spacer\"></span><button class=\"icon-btn\" id=\"drawerClose\" title=\"Close (Esc)\" aria-label=\"Close\"></button></header>\n  <div class=\"db\" id=\"drawerBody\"></div>\n</aside>\n<div id=\"modalRoot\"></div>\n<div class=\"toasts\" id=\"toasts\" aria-live=\"polite\"></div>\n<div class=\"tip hidden\" id=\"tip\"></div>\n<script src=\"/assets/js/core.js\"></script>\n<script src=\"/assets/js/charts.js\"></script>\n<script src=\"/assets/js/widgets.js\"></script>\n<script src=\"/assets/js/pages-system.js\"></script>\n<script src=\"/assets/js/pages-net.js\"></script>\n<script src=\"/assets/js/pages-dev.js\"></script>\n<script src=\"/assets/js/pages-tools.js\"></script>\n<script src=\"/assets/js/pages-siem.js\"></script>\n<script src=\"/assets/js/boot.js\"></script>\n</body>\n</html>\n","public/js/boot.js":"'use strict';\n/* Boot: nav, routing, global clicks, keyboard shortcuts, command palette, SSE. */\n(() => {\nconst { $, esc, icon } = RW;\n// only show pages that are implemented\nRW.NAV = RW.NAV.map(([g, items]) => [g, items.filter(([id]) => RW.pages[id])]).filter(([, items]) => items.length);\n\ndocument.documentElement.setAttribute('data-theme', RW.prefs.theme);\nRW.applyAppearance();\nif (RW.prefs.side === 'closed') $('#app').classList.add('collapsed');\n$('#sideToggle').innerHTML = icon('menu');\n$('#drawerClose').innerHTML = icon('x');\n$('#paletteBtn .ico').innerHTML = icon('search');\nRW.renderNav();\n\n$('#sideToggle').onclick = () => {\n  if (innerWidth <= 820) { $('#app').classList.toggle('mobile-open'); return; }\n  const c = $('#app').classList.toggle('collapsed'); RW.prefs.side = c ? 'closed' : 'open'; RW.savePrefs(); setTimeout(RW.drawCharts, 50);\n};\n$('#drawerClose').onclick = () => RW.drawer.close();\n$('#paletteBtn').onclick = () => palette();\n\nfunction togglePause() { RW.paused = !RW.paused; RW.renderTopActions(); if (!RW.paused) RW.renderAll(); else if (RW.snap) RW.renderStatus(RW.snap); }\nfunction cmd(c) {\n  if (c === 'pause') return togglePause();\n  if (c === 'theme') return RW.applyTheme(RW.prefs.theme === 'dark' ? 'light' : 'dark');\n  if (c === 'elevate') return RW.elevate();\n  if (c === 'pawnio') return RW.pawnio();\n  if (RW.dashCmd) RW.dashCmd(c);\n}\n\ndocument.addEventListener('click', async e => {\n  const el = e.target.closest('[data-go],[data-pid],[data-q],[data-sort],[data-cmd],[data-range],[data-killport]');\n  if (!el || (e.target.closest('a[href]') && !el.matches('[data-go],[data-pid]'))) return;\n  if (el.dataset.go) { e.preventDefault(); return RW.go(el.dataset.go); }\n  if (el.dataset.range) return RW.setRange(el.dataset.range);\n  if (el.dataset.cmd) return cmd(el.dataset.cmd);\n  if (el.dataset.sort) { const st = RW.sorts[el.dataset.sort] || (RW.sorts[el.dataset.sort] = { k: null, d: -1 }); if (st.k === el.dataset.k) st.d = -st.d; else { st.k = el.dataset.k; st.d = el.dataset.k === 'name' || el.dataset.k === 'port' ? 1 : -1; } return RW.renderAll(); }\n  if (el.dataset.killport) {\n    e.stopPropagation();\n    const port = +el.dataset.killport;\n    if (await RW.confirm('Free port ' + port + '?', 'Ends the process listening on ' + el.dataset.proto + ' ' + port + ' and its children.', { danger: true, ok: 'Kill' })) RW.action({ type: 'port.kill', port, proto: el.dataset.proto });\n    return;\n  }\n  if (el.dataset.pid) { if (String(window.getSelection())) return; return RW.openProc(+el.dataset.pid); }\n  if (el.dataset.q) { RW.prefs.procView = 'table'; RW.savePrefs(); return RW.go('processes', { q: el.dataset.q }); }\n});\n\n// table <-> chart switch (works for every RW.table)\ndocument.addEventListener('click', e => {\n  const b = e.target.closest('[data-tview]'); if (!b) return;\n  e.stopPropagation();\n  const i = b.dataset.tview.lastIndexOf(':');\n  RW.prefs.views[b.dataset.tview.slice(0, i)] = b.dataset.tview.slice(i + 1); RW.savePrefs();\n  RW.emit('tableview'); RW.renderAll();\n}, true);\ndocument.addEventListener('change', e => {\n  const s = e.target.closest('[data-tmetric]'); if (!s) return;\n  RW.prefs.chartBy[s.dataset.tmetric] = s.value; RW.savePrefs();\n  RW.emit('tableview'); RW.renderAll();\n});\n\ndocument.addEventListener('keydown', e => {\n  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); return palette(); }\n  if (e.key === 'Escape' && !$('#drawer').hidden && !$('#modalRoot').children.length) return RW.drawer.close();\n  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName);\n  if (typing || e.ctrlKey || e.metaKey || e.altKey || $('#modalRoot').children.length) return;\n  const pages = RW.NAV.flatMap(([, items]) => items.map(i => i[0]));\n  if (/^[1-9]$/.test(e.key) && pages[+e.key - 1]) return RW.go(pages[+e.key - 1]);\n  if (e.key === '/') { e.preventDefault(); RW.go('processes'); setTimeout(() => { const i = $('#pq'); if (i) i.focus(); }, 60); return; }\n  if (e.key === 'p' || e.key === 'P') return togglePause();\n  if (e.key === 't' || e.key === 'T') return cmd('theme');\n  if ((e.key === 'e' || e.key === 'E') && RW.page === 'dashboard') return cmd('editdash');\n  if (e.key === '[') return $('#sideToggle').click();\n});\n\n// ---------- command palette ----------\nfunction palette() {\n  if ($('#modalRoot .palette')) return;\n  const items = q => {\n    const out = [], s = RW.snap, ql = q.toLowerCase().trim();\n    const add = (group, label, ic, hint, run) => { if (!ql || (label + ' ' + (hint || '')).toLowerCase().includes(ql)) out.push({ group, label, ic, hint, run }); };\n    for (const [, list] of RW.NAV) for (const [id, label, ic] of list) add('Pages', label, ic, 'go', () => RW.go(id));\n    add('Actions', 'Toggle theme', 'sun', 'T', () => cmd('theme'));\n    add('Actions', RW.paused ? 'Resume live updates' : 'Pause live updates', 'pause', 'P', () => togglePause());\n    add('Actions', 'Customize dashboard', 'edit', 'E', () => { RW.go('dashboard'); setTimeout(() => cmd('editdash'), 50); });\n    add('Actions', 'Export processes (CSV)', 'download', '', () => { location.href = '/api/export?what=processes&format=csv'; });\n    add('Actions', 'Export metric history 24h (CSV)', 'download', '', () => { location.href = '/api/history?range=24h&format=csv'; });\n    const m = ql.match(/^:?(\\d{1,5})$/);\n    if (s && m) {\n      const port = +m[1];\n      for (const l of s.ports.listen.filter(x => x.port === port)) out.unshift({ group: 'Port ' + port, label: RW.pname(s, l.pid) + ' (' + l.pid + ') on ' + l.proto + ' ' + port, ic: 'unlock', hint: 'open details', run: () => RW.openProc(l.pid) });\n      const pp = RW.pidMap(s).get(port); if (pp) out.unshift({ group: 'PID', label: pp.name + ' (' + pp.pid + ')', ic: 'list', hint: 'open', run: () => RW.openProc(pp.pid) });\n    }\n    if (s && ql.length >= 2 && !m) for (const p of s.procs.filter(p => (p.name + ' ' + (p.label || '')).toLowerCase().includes(ql)).sort((a, b) => b.cpu - a.cpu).slice(0, 8)) out.push({ group: 'Processes', label: p.name + (p.label && p.label !== p.name ? ' · ' + p.label : ''), ic: 'list', hint: 'PID ' + p.pid, run: () => RW.openProc(p.pid) });\n    return out.slice(0, 40);\n  };\n  let sel = 0, cur = [];\n  const md = RW.modal({ cls: 'palette', body: '<input type=\"text\" id=\"palq\" placeholder=\"Jump to a page, a process, a port (:3000) or a PID\" autocomplete=\"off\"><div class=\"pl\" id=\"pall\"></div>' });\n  md.el.querySelector('.mb').style.padding = '0';\n  const render = () => {\n    cur = items($('#palq').value); sel = Math.min(sel, Math.max(0, cur.length - 1));\n    let g = '';\n    $('#pall').innerHTML = cur.map((it, i) => (it.group !== g ? '<div class=\"pg\">' + esc(g = it.group) + '</div>' : '') + '<div class=\"pi' + (i === sel ? ' on' : '') + '\" data-i=\"' + i + '\">' + icon(it.ic) + '<span>' + esc(it.label) + '</span><span class=\"ph\">' + esc(it.hint || '') + '</span></div>').join('') || '<div class=\"empty\">No match</div>';\n  };\n  const run = i => { const it = cur[i]; if (it) { md.close(); it.run(); } };\n  $('#palq').addEventListener('input', () => { sel = 0; render(); });\n  $('#palq').addEventListener('keydown', e => {\n    if (e.key === 'ArrowDown') { sel = Math.min(cur.length - 1, sel + 1); render(); e.preventDefault(); }\n    if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); render(); e.preventDefault(); }\n    if (e.key === 'Enter') run(sel);\n  });\n  $('#pall').addEventListener('click', e => { const it = e.target.closest('[data-i]'); if (it) run(+it.dataset.i); });\n  render(); setTimeout(() => $('#palq').focus(), 20);\n}\n\ndocument.addEventListener('visibilitychange', () => { if (!document.hidden && !RW.paused) RW.renderAll(); });\nwindow.addEventListener('hashchange', RW.route);\nRW.on('hello', () => RW.renderTopActions());\nRW.route();\nRW.connect();\n})();\n","public/js/charts.js":"'use strict';\n/* Canvas charts: line/area with crosshair tooltip, sparklines, core heatmap; SVG gauge. */\n(() => {\nconst { esc, f: F } = RW;\nconst COL = {};\nfunction loadColors() {\n  const cs = getComputedStyle(document.documentElement);\n  for (const k of ['--s1', '--s2', '--s3', '--s4', '--s5', '--s6', '--s7', '--s8', '--line', '--axis', '--muted', '--panel', '--panel3', '--ink', '--ink2', '--accent']) COL[k] = cs.getPropertyValue(k).trim();\n}\nRW.on('theme', () => { loadColors(); RW.drawCharts(); });\nloadColors();\nconst niceMax = v => { if (!(v > 0)) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; };\nconst charts = new Set();\n\n/**\n * opts: { series:[{k, c:'--s1', l:'CPU'}], max, min, fmt, spark, points, range (bool: follow range selector), src(): {t:[], s:[[...]], n?, label?} }\n */\nclass Chart {\n  constructor(cv, o) {\n    this.cv = cv; this.o = o; this.hx = null;\n    charts.add(this);\n    if (!o.spark) {\n      cv.addEventListener('mousemove', e => { const r = cv.getBoundingClientRect(); this.hx = e.clientX - r.left; this.draw(); });\n      cv.addEventListener('mouseleave', () => { this.hx = null; RW.tip(null); this.draw(); });\n      if (o.series.length > 1 && o.legend !== false) {\n        const lg = document.createElement('div'); lg.className = 'legend';\n        lg.innerHTML = o.series.map(s => '<span><i style=\"background:var(' + s.c + ')\"></i>' + esc(s.l) + ' <b data-k=\"' + s.k + '\"></b></span>').join('');\n        cv.parentNode.insertBefore(lg, cv); this.lg = lg;\n      }\n    }\n  }\n  data() {\n    if (this.o.src) return this.o.src();\n    const H = this.o.range ? RW.histFor(RW.prefs.range) : RW.hist;\n    const n = this.o.range ? H.t.length : (this.o.points || 300);\n    const sl = a => (this.o.range ? a : a.slice(-n));\n    return { n: Math.max(this.o.range ? H.t.length : n, 2), t: sl(H.t), s: this.o.series.map(s => sl(H[s.k] || [])) };\n  }\n  draw() {\n    const cv = this.cv;\n    if (!cv.isConnected) { charts.delete(this); return; }\n    if (!cv.offsetParent) return;\n    const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;\n    const dpr = window.devicePixelRatio || 1, W = Math.round(w * dpr), HH = Math.round(h * dpr);\n    if (cv.width !== W || cv.height !== HH) { cv.width = W; cv.height = HH; }\n    const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);\n    const o = this.o, d = this.data(), n = d.n, sp = o.spark;\n    const padR = sp ? 0 : 52, padT = sp ? 3 : 8, padB = sp ? 2 : (o.xAxis && d.t ? 16 : 4), pw = w - padR, ph = h - padT - padB;\n    let max = o.max;\n    if (!max) { let m = 0; for (const a of d.s) for (const v of a) if (v != null && v > m) m = v; max = niceMax(Math.max(m * 1.1, o.min || 1)); }\n    if (!sp) {\n      x.lineWidth = 1; x.font = '10px system-ui,-apple-system,\"Segoe UI\",sans-serif'; x.textBaseline = 'middle';\n      for (const fr of [0, 0.5, 1]) {\n        const y = Math.round(padT + ph * (1 - fr)) + 0.5;\n        x.strokeStyle = fr === 0 ? COL['--axis'] : COL['--line']; x.beginPath(); x.moveTo(0, y); x.lineTo(pw, y); x.stroke();\n        x.fillStyle = COL['--muted']; x.fillText(o.fmt(max * fr), pw + 6, y);\n      }\n      if (o.xAxis && d.t && d.t.length > 1) {\n        x.textBaseline = 'alphabetic'; x.fillStyle = COL['--muted'];\n        const t0 = d.t[0], t1 = d.t[d.t.length - 1], span = t1 - t0;\n        const fmt = ts => (span > 2 * 86400e3 ? new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' }) : new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));\n        x.textAlign = 'left'; x.fillText(fmt(t0), 0, h - 2); x.textAlign = 'right'; x.fillText(fmt(t1), pw, h - 2); x.textAlign = 'left';\n      }\n    }\n    const len = d.s[0] ? d.s[0].length : 0, off = n - len;\n    const X = i => (n > 1 ? (off + i) / (n - 1) * pw : 0);\n    const Y = v => padT + ph * (1 - Math.min(Math.max(v, 0), max) / max);\n    d.s.forEach((a, si) => {\n      const col = COL[o.series[si].c] || '#888', segs = []; let seg = null;\n      for (let i = 0; i < a.length; i++) { const v = a[i]; if (v == null || isNaN(v)) { seg = null; continue; } if (!seg) { seg = []; segs.push(seg); } seg.push([X(i), Y(v)]); }\n      if (d.s.length === 1 && o.area !== false) {\n        const g = x.createLinearGradient(0, padT, 0, padT + ph); g.addColorStop(0, col + (sp ? '30' : '33')); g.addColorStop(1, col + '05');\n        x.fillStyle = g;\n        for (const sg of segs) { x.beginPath(); x.moveTo(sg[0][0], padT + ph); for (const p of sg) x.lineTo(p[0], p[1]); x.lineTo(sg[sg.length - 1][0], padT + ph); x.closePath(); x.fill(); }\n      }\n      x.strokeStyle = col; x.lineWidth = sp ? 1.5 : 2; x.lineJoin = 'round'; x.lineCap = 'round';\n      for (const sg of segs) { x.beginPath(); sg.forEach((p, j) => (j ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); if (sg.length === 1) x.lineTo(sg[0][0] + 0.1, sg[0][1]); x.stroke(); }\n    });\n    if (this.lg) o.series.forEach((s, si) => { const a = d.s[si], v = a && a.length ? a[a.length - 1] : null; const b = this.lg.querySelector('b[data-k=\"' + s.k + '\"]'); if (b) b.textContent = v == null ? '' : o.fmt(v); });\n    if (this.hx != null && !sp && len) {\n      const idx = Math.round(this.hx / pw * (n - 1)) - off;\n      if (idx < 0 || idx >= len || this.hx > pw) { RW.tip(null); return; }\n      const px = X(idx);\n      x.strokeStyle = COL['--axis']; x.lineWidth = 1; x.beginPath(); x.moveTo(Math.round(px) + 0.5, padT); x.lineTo(Math.round(px) + 0.5, padT + ph); x.stroke();\n      const rows = [];\n      d.s.forEach((a, si) => {\n        const v = a[idx], s = o.series[si];\n        if (v != null && !isNaN(v)) { x.fillStyle = COL['--panel']; x.beginPath(); x.arc(px, Y(v), 5.5, 0, 7); x.fill(); x.fillStyle = COL[s.c]; x.beginPath(); x.arc(px, Y(v), 3.5, 0, 7); x.fill(); }\n        rows.push('<div class=\"tr\"><span><i style=\"background:var(' + s.c + ')\"></i>' + esc(s.l) + '</span><b>' + (v == null ? '–' : esc(o.fmt(v))) + '</b></div>');\n      });\n      const tt = d.label ? d.label(idx) : d.t && d.t[idx] ? (Date.now() - d.t[idx] < 3600e3 ? F.ago(d.t[idx]) : F.date(d.t[idx])) : '';\n      const r = this.cv.getBoundingClientRect();\n      RW.tip('<div class=\"tt\">' + esc(tt) + '</div>' + rows.join(''), r.left + px, r.top + padT);\n    }\n  }\n}\nRW.Chart = Chart;\nRW.chart = (cv, o) => new Chart(typeof cv === 'string' ? document.getElementById(cv) : cv, o);\nRW.drawCharts = () => { for (const c of charts) c.draw(); };\nRW.on('rendered', () => RW.drawCharts());\nRW.on('range', () => RW.drawCharts());\nwindow.addEventListener('resize', () => RW.drawCharts());\n\n// common series presets\nRW.SER = {\n  cpu: { series: [{ k: 'cpu', c: '--s1', l: 'CPU' }], max: 100, fmt: v => F.pct(v) },\n  gpu: { series: [{ k: 'gpu', c: '--s7', l: 'GPU' }], max: 100, fmt: v => F.pct(v) },\n  mem: { series: [{ k: 'mem', c: '--s3', l: 'Memory' }], max: 100, fmt: v => F.pct(v) },\n  vram: { series: [{ k: 'vram', c: '--s7', l: 'VRAM' }], max: 100, fmt: v => F.pct(v) },\n  net: { series: [{ k: 'rx', c: '--s1', l: 'Download' }, { k: 'tx', c: '--s2', l: 'Upload' }], fmt: F.bits, min: 12500 },\n  rx: { series: [{ k: 'rx', c: '--s1', l: 'Download' }], fmt: F.bits, min: 12500 },\n  pkts: { series: [{ k: 'rxp', c: '--s1', l: 'In' }, { k: 'txp', c: '--s2', l: 'Out' }], fmt: v => F.num(v) + '/s', min: 10 },\n  disk: { series: [{ k: 'dr', c: '--s1', l: 'Read' }, { k: 'dw', c: '--s2', l: 'Write' }], fmt: F.rate, min: 1048576 },\n  temp: { series: [{ k: 'ct', c: '--s2', l: 'CPU' }, { k: 'gt', c: '--s7', l: 'GPU' }], fmt: F.temp, min: 60 },\n  fps: { series: [{ k: 'fps', c: '--s6', l: 'FPS' }], fmt: v => Math.round(v) + ' fps', min: 30 },\n  ping: { series: [{ k: 'ping', c: '--s5', l: 'Ping' }], fmt: F.ms, min: 20 },\n  loss: { series: [{ k: 'loss', c: '--s8', l: 'Packet loss' }], max: 100, fmt: v => F.pct(v) },\n  conns: { series: [{ k: 'conns', c: '--s4', l: 'Connections' }], fmt: F.num, min: 50 },\n  swap: { series: [{ k: 'swap', c: '--s4', l: 'Swap' }], max: 100, fmt: v => F.pct(v) },\n};\nRW.preset = (name, extra) => Object.assign({}, RW.SER[name], extra || {});\n\n// ---------- per-core heatmap (last 120 s) ----------\nRW.coreHist = [];\nRW.on('rendered', s => {\n  const cores = (s.cpu && s.cpu.cores) || [];\n  cores.forEach((c, i) => { const a = RW.coreHist[i] || (RW.coreHist[i] = []); a.push(c.u); if (a.length > 120) a.shift(); });\n});\nclass Heat {\n  constructor(cv) {\n    this.cv = cv; charts.add(this);\n    cv.addEventListener('mousemove', e => {\n      const r = cv.getBoundingClientRect(), rows = RW.coreHist.length; if (!rows) return;\n      const row = Math.floor((e.clientY - r.top) / (r.height / rows)), a = RW.coreHist[row]; if (!a) return;\n      const col = Math.floor((e.clientX - r.left) / (r.width / 120)) - (120 - a.length); const v = a[col];\n      RW.tip('<div class=\"tt\">thread ' + row + ' · ' + (120 - col - (120 - a.length)) + ' s ago</div><div class=\"tr\"><span>load</span><b>' + (v == null ? '–' : F.pct(v, 1)) + '</b></div>', e.clientX, e.clientY);\n    });\n    cv.addEventListener('mouseleave', () => RW.tip(null));\n  }\n  draw() {\n    const cv = this.cv;\n    if (!cv.isConnected) { charts.delete(this); return; }\n    if (!cv.offsetParent) return;\n    const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;\n    const dpr = window.devicePixelRatio || 1;\n    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }\n    const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);\n    const rows = RW.coreHist.length; if (!rows) return;\n    const rh = h / rows, cw = w / 120;\n    const base = COL['--s1'];\n    for (let r = 0; r < rows; r++) {\n      const a = RW.coreHist[r], off = 120 - a.length;\n      for (let i = 0; i < a.length; i++) {\n        const v = Math.max(0, Math.min(100, a[i] || 0)) / 100;\n        x.globalAlpha = 0.06 + v * 0.94; x.fillStyle = v < 0.02 ? COL['--panel3'] : base;\n        x.fillRect((off + i) * cw, r * rh, Math.ceil(cw) + 0.5, Math.max(1, rh - 1));\n      }\n    }\n    x.globalAlpha = 1;\n  }\n}\nRW.heat = cv => new Heat(cv);\n\n// ---------- gauge (SVG) ----------\nRW.gauge = (v, max, col, big, sub) => {\n  const p = Math.max(0, Math.min(1, (v || 0) / max)), r = 54, c = Math.PI * r;\n  return '<div class=\"gauge\"><svg viewBox=\"0 0 140 84\" role=\"img\" aria-label=\"' + esc(big) + '\"><path d=\"M16 74a54 54 0 0 1 108 0\" fill=\"none\" stroke=\"var(--panel3)\" stroke-width=\"12\" stroke-linecap=\"round\"/>' +\n    '<path d=\"M16 74a54 54 0 0 1 108 0\" fill=\"none\" stroke=\"var(' + col + ')\" stroke-width=\"12\" stroke-linecap=\"round\" stroke-dasharray=\"' + (c * p).toFixed(1) + ' ' + c.toFixed(1) + '\"/></svg>' +\n    '<div class=\"gv\"><div class=\"big\">' + esc(big) + '</div>' + (sub ? '<div class=\"muted\" style=\"font-size:12px\">' + esc(sub) + '</div>' : '') + '</div></div>';\n};\nRW.scoreColor = s => (s >= 85 ? '--good' : s >= 65 ? '--warn' : s >= 40 ? '--serious' : '--crit');\n})();\n","public/js/core.js":"'use strict';\n/* RigWatch UI core: state, formatting, icons, API, SSE, router, drawer, modal, palette, tables. */\n(() => {\nconst HKEYS = ['t', 'cpu', 'gpu', 'mem', 'vram', 'rx', 'tx', 'rxp', 'txp', 'dr', 'dw', 'ct', 'gt', 'fps', 'ping', 'loss', 'conns', 'swap'];\nconst load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : Object.assign(Array.isArray(d) ? [] : {}, d, v); } catch { return d; } };\nconst store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };\n\nconst RW = window.RW = {\n  HKEYS, HMAX: 900, hist: {}, st: null, auth: {}, settings: {}, webhook: {}, snap: null, prev: null,\n  events: [], jobs: new Map(), pages: {}, page: null, params: {}, paused: false, connected: false, sorts: {},\n  prefs: load('rw.prefs', { theme: 'dark', side: 'open', range: '15m', notify: false, procView: 'table', procFilter: 'all' }),\n  load, store, listeners: {},\n};\nHKEYS.forEach(k => { RW.hist[k] = []; });\nRW.savePrefs = () => store('rw.prefs', RW.prefs);\nRW.on = (ev, fn) => { (RW.listeners[ev] = RW.listeners[ev] || []).push(fn); };\nRW.emit = (ev, d) => { for (const fn of RW.listeners[ev] || []) { try { fn(d); } catch (e) { console.error(e); } } };\n\n// ---------- DOM ----------\nconst $ = RW.$ = (s, r) => (r || document).querySelector(s);\nRW.$$ = (s, r) => [...(r || document).querySelectorAll(s)];\nconst ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', \"'\": '&#39;' };\nconst esc = RW.esc = v => String(v == null ? '' : v).replace(/[&<>\"']/g, c => ESC[c]);\nRW.setH = (el, html) => { if (typeof el === 'string') el = document.getElementById(el); if (el && el.__h !== html) { el.innerHTML = html; el.__h = html; } return el; };\nRW.cl = v => { v = +v || 0; return v < 0 ? 0 : v > 100 ? 100 : v; };\n\n// ---------- formatting ----------\nconst D = '–';\nconst F = RW.f = {\n  b(b, d) { if (b == null || isNaN(b)) return D; const u = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']; let i = 0; b = +b; while (Math.abs(b) >= 1024 && i < u.length - 1) { b /= 1024; i++; } return (i === 0 ? Math.round(b) : b.toFixed(d != null ? d : b >= 100 ? 0 : b >= 10 ? 1 : 2)) + ' ' + u[i]; },\n  rate(b) { return b == null || isNaN(b) ? D : F.b(b) + '/s'; },\n  bits(B) { if (B == null || isNaN(B)) return D; if (RW.prefs.netBytes) return F.rate(B); let b = B * 8, i = 0; const u = ['b/s', 'Kb/s', 'Mb/s', 'Gb/s', 'Tb/s']; while (b >= 1000 && i < u.length - 1) { b /= 1000; i++; } return (i === 0 ? Math.round(b) : b.toFixed(b >= 100 ? 0 : b >= 10 ? 1 : 2)) + ' ' + u[i]; },\n  link(bits) { if (!bits) return D; return bits >= 1e9 ? (bits / 1e9).toFixed(bits % 1e9 ? 1 : 0) + ' Gb/s' : Math.round(bits / 1e6) + ' Mb/s'; },\n  pct(v, d) { return v == null || isNaN(v) ? D : (+v).toFixed(d == null ? 0 : d) + '%'; },\n  num(n) { if (n == null || isNaN(n)) return D; n = +n; const a = Math.abs(n); if (a >= 1e9) return (n / 1e9).toFixed(1) + 'B'; if (a >= 1e6) return (n / 1e6).toFixed(1) + 'M'; if (a >= 1e4) return (n / 1e3).toFixed(1) + 'k'; return Math.round(n).toLocaleString(); },\n  ghz(m) { return m ? (m / 1000).toFixed(2) + ' GHz' : D; },\n  age(s) { s = Math.max(0, Math.floor(s || 0)); const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); if (d) return d + 'd ' + h + 'h'; if (h) return h + 'h ' + m + 'm'; if (m) return m + 'm ' + (s % 60) + 's'; return s + 's'; },\n  temp(c) { return c == null || isNaN(c) ? D : Math.round(c) + '°C'; },\n  ms(v) { return v == null || isNaN(v) ? D : (v < 10 ? (+v).toFixed(1) : Math.round(v)) + ' ms'; },\n  date(ms) { if (!ms) return D; const d = new Date(ms); return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); },\n  time(ms) { return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); },\n  ago(t) { const s = Math.round((Date.now() - t) / 1000); if (s < 2) return 'now'; if (s < 60) return s + 's ago'; if (s < 3600) return Math.floor(s / 60) + 'm ago'; if (s < 86400) return Math.floor(s / 3600) + 'h ago'; return Math.floor(s / 86400) + 'd ago'; },\n  hp(h, p) { return (String(h).includes(':') ? '[' + h + ']' : h) + ':' + p; },\n};\nRW.vu = (str, extra) => { const i = String(str).lastIndexOf(' '); return i < 0 ? esc(str) : esc(str.slice(0, i)) + '<small>' + esc(str.slice(i + 1)) + (extra || '') + '</small>'; };\n\n// ---------- icons (24x24 stroke) ----------\nconst P = {\n  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', activity: 'M3 12h4l3-8 4 16 3-8h4', list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',\n  thermo: 'M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0z', globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z',\n  shield: 'M12 3l7 3v6c0 4.4-3 8-7 9-4-1-7-4.6-7-9V6z', flask: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3', code: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',\n  cog: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',\n  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0', clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2', info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 16v-4M12 8h.01',\n  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3', pause: 'M7 5h3v14H7zM14 5h3v14h-3z', play: 'M7 4l13 8-13 8z', sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',\n  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z', x: 'M6 6l12 12M18 6L6 18', plus: 'M12 5v14M5 12h14', minus: 'M5 12h14', edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',\n  download: 'M12 4v11M7 10l5 5 5-5M5 20h14', ext: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5', trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',\n  copy: 'M9 9h11v11H9zM5 15H4V4h11v1', folder: 'M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z', hash: 'M5 9h14M5 15h14M10 4L8 20M16 4l-2 16',\n  menu: 'M4 6h16M4 12h16M4 18h16', alert: 'M12 3l10 18H2zM12 10v4M12 17h.01', check: 'M5 12l5 5 9-10', lock: 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3', unlock: 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 7.5-2',\n  stop: 'M6 6h12v12H6z', zap: 'M13 2L4 14h7l-1 8 9-12h-7z', cpu: 'M7 7h10v10H7zM9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4', gpu: 'M2 7h20v10H2zM6 17v3M10 17v3M7 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0M15 12h3',\n  disk: 'M4 5h16v14H4zM4 13h16M16 16h.01', box: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9', terminal: 'M4 5h16v14H4zM7 9l3 3-3 3M12 15h5', wifi: 'M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01',\n  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5', eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7', drag: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',\n  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0', target: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM12 11.2a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6z', file: 'M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6',\n  clipboard: 'M9 3h6v3H9zM8 4.5H5V21h14V4.5h-3M9 13l2 2 4-4', book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h7',\n  radar: 'M12 3a9 9 0 1 0 9 9M12 7a5 5 0 1 0 5 5M12 12l7-7', wrench: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z', ban: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM5.6 5.6l12.8 12.8', key: 'M15 7a4 4 0 1 1-3.9 5H4v3h3v3h3v-3h1.1A4 4 0 0 1 15 7z', power: 'M12 3v9M6.3 6.3a8 8 0 1 0 11.4 0', fire: 'M12 21c4 0 7-3 7-7 0-4-3-6-4-10-2 3-3 4-5 4 0-2-1-3-2-4-1 3-3 5-3 10 0 4 3 7 7 7z',\n};\nRW.icon = (n, cls) => '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"' + (cls ? ' class=\"' + cls + '\"' : '') + ' aria-hidden=\"true\"><path d=\"' + (P[n] || P.info) + '\"/></svg>';\n\n// ---------- status helpers ----------\nRW.tstat = (c, lim) => { if (c == null) return null; lim = lim || [70, 80, 90]; if (c < lim[0]) return ['good', 'cool']; if (c < lim[1]) return ['warn', 'warm']; if (c < lim[2]) return ['serious', 'hot']; return ['crit', 'critical']; };\nRW.tchip = (c, lim) => { const s = RW.tstat(c, lim); return s ? '<span class=\"chip ' + s[0] + '\" title=\"' + s[1] + '\"><i></i>' + F.temp(c) + ' ' + s[1] + '</span>' : ''; };\nconst SEV_ICON = { critical: 'alert', high: 'alert', medium: 'alert', low: 'info', info: 'info' };\nRW.sev = s => '<span class=\"sev ' + esc(s) + '\">' + RW.icon(SEV_ICON[s] || 'info') + esc(s) + '</span>';\nRW.bar = (p, col, title) => '<div class=\"bar\"' + (title ? ' title=\"' + esc(title) + '\"' : '') + '><i style=\"width:' + RW.cl(p).toFixed(1) + '%;background:var(' + (col || '--s1') + ')\"></i></div>';\nRW.brow = (label, value, p, col, attrs) => '<div class=\"brow' + (attrs ? ' click\" ' + attrs : '\"') + '><span class=\"bl\">' + label + '</span><span class=\"bv\">' + value + '</span>' + RW.bar(p, col) + '</div>';\nRW.stats = rows => '<dl class=\"stats\">' + rows.filter(r => r && r[1] != null && r[1] !== '' && r[1] !== D).map(r => '<div><dt>' + esc(r[0]) + '</dt><dd' + (r[2] ? ' title=\"' + esc(r[2]) + '\"' : '') + '>' + r[1] + '</dd></div>').join('') + '</dl>';\nRW.kv = rows => '<dl class=\"kv\">' + rows.filter(r => r && r[1] != null && r[1] !== '').map(r => '<dt>' + esc(r[0]) + '</dt><dd>' + r[1] + '</dd>').join('') + '</dl>';\nRW.portLinks = (ports, max = 8) => '<span class=\"plinks\">' + (ports || []).slice(0, max).map(p => '<a class=\"plink\" href=\"http://localhost:' + p + '\" target=\"_blank\" rel=\"noopener noreferrer\" title=\"Open http://localhost:' + p + '\">:' + p + '</a>').join('') + ((ports || []).length > max ? ' <span class=\"muted\">+' + (ports.length - max) + '</span>' : '') + '</span>';\nconst SVC = { 20: 'ftp-data', 21: 'ftp', 22: 'ssh', 23: 'telnet', 25: 'smtp', 53: 'dns', 67: 'dhcp', 68: 'dhcp', 80: 'http', 88: 'kerberos', 110: 'pop3', 123: 'ntp', 135: 'rpc', 137: 'netbios-ns', 138: 'netbios-dgm', 139: 'netbios', 143: 'imap', 161: 'snmp', 389: 'ldap', 443: 'https', 445: 'smb', 465: 'smtps', 500: 'ipsec', 514: 'syslog', 587: 'smtp', 631: 'ipp', 993: 'imaps', 995: 'pop3s', 1194: 'openvpn', 1433: 'sql server', 1900: 'ssdp/upnp', 1883: 'mqtt', 2375: 'docker', 2376: 'docker tls', 3000: 'dev server', 3001: 'dev server', 3306: 'mysql', 3389: 'rdp', 3478: 'stun', 4000: 'dev server', 4200: 'angular', 4500: 'ipsec nat-t', 5000: 'dev server', 5037: 'adb', 5040: 'cdp', 5173: 'vite', 5174: 'vite', 5353: 'mdns', 5355: 'llmnr', 5432: 'postgres', 5500: 'live server', 5555: 'adb', 5672: 'amqp', 5900: 'vnc', 6379: 'redis', 6443: 'k8s api', 6463: 'discord rpc', 7680: 'delivery opt.', 8000: 'dev server', 8080: 'http-alt', 8081: 'http-alt', 8085: 'librehw', 8443: 'https-alt', 8888: 'jupyter', 9000: 'dev server', 9090: 'prometheus', 9200: 'elasticsearch', 9222: 'chrome devtools', 9229: 'node inspector', 11211: 'memcached', 11434: 'ollama', 15672: 'rabbitmq ui', 25565: 'minecraft', 27015: 'steam/source', 27017: 'mongodb', 27036: 'steam', 32400: 'plex', 51820: 'wireguard' };\nRW.svc = (port, proc) => { const s = SVC[port] || ''; return s === 'dev server' && proc && (proc.kind === 'system' || proc.pid <= 4) ? '' : s; };\nRW.pidMap = s => { if (s.__pm) return s.__pm; const m = new Map(); for (const p of s.procs || []) m.set(p.pid, p); s.__pm = m; return m; };\nRW.pname = (s, pid) => { const p = RW.pidMap(s).get(pid); return p ? (p.label || p.name) : (s.ports && s.ports.names && s.ports.names[pid]) || (pid === 0 ? 'System Idle' : pid === 4 ? 'System' : 'pid ' + pid); };\nRW.isDev = p => ['runtime', 'db', 'server', 'container', 'ai', 'tool'].includes(p.kind);\nRW.kindTag = p => { if (!p.kind || p.kind === 'app') return ''; const c = p.kind === 'game' ? ' game' : RW.isDev(p) ? ' dev' : ''; return '<span class=\"tag' + c + '\">' + esc(p.kind) + '</span>'; };\nRW.flagTags = p => (p.flags || []).map(f => '<span class=\"tag flag\" title=\"security flag\">' + esc(f.split(':')[0]) + '</span>').join('') + (p.state === 'suspended' ? '<span class=\"tag flag\">suspended</span>' : '');\n\n// ---------- API ----------\nRW.api = async (path, opts = {}) => {\n  const r = await fetch(path, { method: opts.method || 'GET', headers: { 'content-type': 'application/json', 'x-rigwatch': '1' }, body: opts.body ? JSON.stringify(opts.body) : undefined, credentials: 'same-origin' });\n  let j = null; try { j = await r.json(); } catch { j = null; }\n  if (!r.ok || (j && j.ok === false)) throw new Error((j && j.error) || 'HTTP ' + r.status);\n  return j;\n};\nRW.action = async (a, quiet) => {\n  try { const r = await RW.api('/api/action', { method: 'POST', body: a }); if (!quiet) RW.toast(r.msg || 'Done', 'ok'); return r; }\n  catch (e) { RW.toast(e.message, 'err', 7000); throw e; }\n};\nRW.tool = async (tool, params) => { const r = await RW.api('/api/jobs', { method: 'POST', body: { tool, params } }); RW.jobs.set(r.job.id, { s: r.job, lines: [], result: null }); return r.job; };\nRW.canControl = () => !!(RW.auth && RW.auth.control);\n\n// ---------- toasts / modal / confirm / prompt ----------\nRW.toast = (msg, kind, ms) => {\n  const t = document.createElement('div'); t.className = 'toast ' + (kind || ''); t.textContent = msg;\n  $('#toasts').appendChild(t); setTimeout(() => t.remove(), ms || 4200);\n};\nRW.modal = ({ title, body, actions = [], wide, onMount, cls }) => {\n  const bd = document.createElement('div'); bd.className = 'backdrop';\n  bd.innerHTML = '<div class=\"modal' + (wide ? ' wide' : '') + (cls ? ' ' + cls : '') + '\" role=\"dialog\" aria-modal=\"true\">' + (title ? '<header>' + esc(title) + '</header>' : '') + '<div class=\"mb\">' + (body || '') + '</div>' + (actions.length ? '<footer></footer>' : '') + '</div>';\n  const close = () => { bd.remove(); document.removeEventListener('keydown', onKey, true); };\n  const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };\n  document.addEventListener('keydown', onKey, true);\n  bd.addEventListener('mousedown', e => { if (e.target === bd) close(); });\n  const foot = bd.querySelector('footer');\n  for (const a of actions) {\n    const b = document.createElement('button'); b.className = 'btn' + (a.primary ? ' primary' : '') + (a.danger ? ' danger' : ''); b.textContent = a.label;\n    b.onclick = async () => { const keep = a.onClick ? await a.onClick(bd) : false; if (keep !== true) close(); };\n    foot.appendChild(b);\n  }\n  $('#modalRoot').appendChild(bd);\n  if (onMount) onMount(bd, close);\n  const f = bd.querySelector('input,select,textarea,button.primary'); if (f) setTimeout(() => f.focus(), 30);\n  return { el: bd, close };\n};\nRW.confirm = (title, msg, o = {}) => new Promise(res => {\n  RW.modal({ title, body: '<div class=\"ink2\">' + msg + '</div>', actions: [{ label: 'Cancel', onClick: () => res(false) }, { label: o.ok || 'Confirm', primary: !o.danger, danger: !!o.danger, onClick: () => res(true) }] });\n});\nRW.prompt = (title, fields, okLabel) => new Promise(res => {\n  const body = fields.map(f => '<label class=\"field\">' + esc(f.label) + (f.options ? '<select name=\"' + f.name + '\">' + f.options.map(o => '<option value=\"' + esc(o[0]) + '\"' + (o[0] === f.value ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select>' : '<input type=\"' + (f.type || 'text') + '\" name=\"' + f.name + '\" value=\"' + esc(f.value || '') + '\" placeholder=\"' + esc(f.placeholder || '') + '\">') + '</label>').join('');\n  let done = false;\n  const m = RW.modal({ title, body, actions: [{ label: 'Cancel', onClick: () => { done = true; res(null); } }, { label: okLabel || 'OK', primary: true, onClick: bd => { done = true; const v = {}; RW.$$('[name]', bd).forEach(i => { v[i.name] = i.value; }); res(v); } }] });\n  m.el.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { m.el.querySelector('button.primary').click(); } });\n  const obs = new MutationObserver(() => { if (!document.body.contains(m.el)) { obs.disconnect(); if (!done) res(null); } });\n  obs.observe($('#modalRoot'), { childList: true });\n});\n\n// ---------- drawer ----------\nRW.drawer = {\n  cur: null,\n  open(title, o) {\n    this.cur = o; $('#drawerTitle').textContent = title; const b = $('#drawerBody'); b.innerHTML = ''; b.__h = null;\n    $('#drawer').hidden = false;\n    if (o.mount) o.mount(b);\n    if (RW.snap && o.update) o.update(b, RW.snap);\n  },\n  close() { if (this.cur && this.cur.onClose) this.cur.onClose(); this.cur = null; $('#drawer').hidden = true; },\n  update(s) { if (this.cur && this.cur.update) this.cur.update($('#drawerBody'), s); },\n};\n\n// ---------- tables (every table can also be shown as a chart) ----------\nRW.prefs.views = RW.prefs.views || {};\nRW.prefs.chartBy = RW.prefs.chartBy || {};\nconst rawOf = (c, r) => (c.sort ? c.sort(r) : r[c.k]);\nconst plain = h => String(h == null ? '' : h).replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim();\nconst NO_NUM = /^(pid|ppid|port|lp|rp|id|line|i|index|code|x)$/;\n/** chart options a table supports: numeric bars, count-by-category, histogram over time */\nfunction chartOpts(cols, rows) {\n  const out = [], sample = rows.slice(0, 300);\n  cols.forEach((c, ci) => {\n    if (c.nosort || c.chart === false) return;\n    const vals = sample.map(r => rawOf(c, r)).filter(v => v != null && v !== '');\n    if (!vals.length) return;\n    const nums = vals.filter(v => typeof v === 'number' && isFinite(v));\n    if (nums.length >= vals.length * 0.8) {\n      if (nums.filter(v => v > 1e12 && v < 4e12).length >= nums.length * 0.8) out.push({ key: 'time:' + c.k, label: 'over time (' + c.label + ')' });\n      else if (ci > 0 && !NO_NUM.test(c.k) && nums.some(v => v > 0)) out.push({ key: 'num:' + c.k, label: c.label });\n      return;\n    }\n    if (ci === 0 || vals.some(v => typeof v === 'object')) return;\n    const distinct = new Set(vals.map(v => String(v)));\n    if (distinct.size >= 2 && distinct.size <= 30) out.push({ key: 'cnt:' + c.k, label: 'count by ' + c.label });\n  });\n  return out;\n}\nfunction autoChart(id, cols, rows, o, sel) {\n  const [kind, k] = sel.split(':');\n  const c = cols.find(x => x.k === k) || cols[0];\n  const lab = cols[0];\n  const labelOf = r => {\n    if (o.label) return plain(o.label(r));\n    const v = lab.sort ? lab.sort(r) : r[lab.k];\n    let s = typeof v === 'string' || typeof v === 'number' ? String(v) : plain(lab.fmt ? lab.fmt(r) : v);\n    if (typeof r.label === 'string' && r.label && r.label !== s) s += ' · ' + r.label;\n    return s;\n  };\n  if (kind === 'time') {\n    const ts = rows.map(r => rawOf(c, r)).filter(v => typeof v === 'number' && v > 1e12);\n    if (!ts.length) return '<div class=\"empty\">No dates to chart.</div>';\n    const lo = Math.min(...ts), hi = Math.max(...ts), N = 36, span = Math.max(1, hi - lo), b = new Array(N).fill(0);\n    for (const t of ts) b[Math.min(N - 1, Math.floor((t - lo) / span * N))]++;\n    const mx = Math.max(...b), fmt = t => (span > 3 * 86400e3 ? new Date(t).toLocaleDateString() : new Date(t).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));\n    return '<div class=\"histo\">' + b.map((n, i) => '<i title=\"' + esc(fmt(lo + span * i / N) + ' – ' + fmt(lo + span * (i + 1) / N) + ': ' + n) + '\" style=\"height:' + (n ? Math.max(3, 100 * n / mx) : 0) + '%\"></i>').join('') + '</div><div class=\"histo-ax\"><span>' + esc(fmt(lo)) + '</span><span class=\"muted\">' + ts.length + ' items</span><span>' + esc(fmt(hi)) + '</span></div>';\n  }\n  if (kind === 'cnt') {\n    const m = new Map();\n    for (const r of rows) { let v = rawOf(c, r); v = v === true ? 'yes' : v === false ? 'no' : v == null || v === '' ? '(none)' : plain(c.fmt && typeof v !== 'string' ? c.fmt(r) : v); m.set(v, (m.get(v) || 0) + 1); }\n    const list = [...m].sort((a, b) => b[1] - a[1]), mx = list[0] ? list[0][1] : 1;\n    return '<div class=\"hbars\">' + list.map(([v, n], i) => '<div class=\"hb\"><span class=\"hbl\" title=\"' + esc(v) + '\">' + esc(v) + '</span><span class=\"hbt\"><i style=\"width:' + (100 * n / mx) + '%;background:var(--s' + ((i % 8) + 1) + ')\"></i></span><span class=\"hbv\">' + n + '</span></div>').join('') + '</div>';\n  }\n  const list = rows.map(r => ({ r, v: +rawOf(c, r) || 0 })).filter(x => x.v > 0).sort((a, b) => b.v - a.v);\n  const top = list.slice(0, o.chartMax || 40), mx = top[0] ? top[0].v : 1;\n  if (!top.length) return '<div class=\"empty\">Nothing above zero to chart.</div>';\n  return '<div class=\"hbars\">' + top.map(x => '<div class=\"hb' + (o.row ? ' click\"' + o.row(x.r).replace(/^class=\"click\"\\s*/, ' ') : '\"') + '><span class=\"hbl\" title=\"' + esc(labelOf(x.r)) + '\">' + esc(labelOf(x.r)) + '</span><span class=\"hbt\"><i style=\"width:' + Math.max(0.5, 100 * x.v / mx).toFixed(1) + '%\"></i></span><span class=\"hbv\">' + esc(plain(c.fmt ? c.fmt(x.r) : x.v)) + '</span></div>').join('') + '</div>' + (list.length > top.length ? '<div class=\"muted\" style=\"font-size:12px;padding:6px 0\">top ' + top.length + ' of ' + list.length + '</div>' : '');\n}\nRW.table = (id, cols, rows, o = {}) => {\n  const opts = o.noChart ? [] : chartOpts(cols, rows);\n  if (!opts.length) return tableHTML(id, cols, rows, o);\n  const view = RW.prefs.views[id] || o.view || 'table';\n  let sel = RW.prefs.chartBy[id];\n  if (!opts.some(x => x.key === sel)) sel = (o.chartBy && opts.find(x => x.key.endsWith(':' + o.chartBy)) || (RW.sorts[id] && RW.sorts[id].k && opts.find(x => x.key.endsWith(':' + RW.sorts[id].k))) || opts[0]).key;\n  const bar = '<div class=\"tv\"><div class=\"seg\">' + [['table', 'list', 'Table'], ['chart', 'activity', 'Chart'], ['both', 'layers', 'Both']].map(([v, ic, l]) => '<button data-tview=\"' + id + ':' + v + '\" class=\"' + (view === v ? 'on' : '') + '\" title=\"' + l + ' view\">' + RW.icon(ic) + l + '</button>').join('') + '</div>' +\n    (view !== 'table' ? (opts.length > 1 ? '<select data-tmetric=\"' + id + '\">' + opts.map(x => '<option value=\"' + x.key + '\"' + (x.key === sel ? ' selected' : '') + '>' + esc(x.label) + '</option>').join('') + '</select>' : '<span class=\"muted\" style=\"font-size:12px\">' + esc(opts[0].label) + '</span>') : '') + '</div>';\n  if (view === 'chart') return bar + autoChart(id, cols, rows, o, sel);\n  if (view === 'both') return bar + autoChart(id, cols, rows, o, sel) + '<div style=\"height:12px\"></div>' + tableHTML(id, cols, rows, o);\n  return bar + tableHTML(id, cols, rows, o);\n};\n/** cols: [{k,label,num,fmt(row),sort(row),cls,title}] -> html. Sorting state lives in RW.sorts[id]. */\nconst tableHTML = (id, cols, rows, o = {}) => {\n  const st = RW.sorts[id] || (RW.sorts[id] = { k: o.sortK || null, d: o.sortD || -1 });\n  if (st.k) {\n    const c = cols.find(x => x.k === st.k);\n    if (c) { const g = c.sort || (r => r[c.k]); rows = rows.slice().sort((a, b) => { const x = g(a), y = g(b); if (typeof x === 'string' || typeof y === 'string') return st.d * String(x || '').localeCompare(String(y || '')); return st.d * ((x || 0) - (y || 0)); }); }\n  }\n  const max = o.max || 1000;\n  const head = '<tr>' + cols.map(c => '<th class=\"' + (c.num ? 'n ' : '') + (c.nosort ? '' : 's ') + (st.k === c.k ? 'on' : '') + '\"' + (c.nosort ? '' : ' data-sort=\"' + id + '\" data-k=\"' + c.k + '\"') + (c.title ? ' title=\"' + esc(c.title) + '\"' : '') + '>' + esc(c.label) + (st.k === c.k ? (st.d < 0 ? ' ↓' : ' ↑') : '') + '</th>').join('') + '</tr>';\n  const body = rows.slice(0, max).map(r => '<tr' + (o.row ? ' ' + o.row(r) : '') + '>' + cols.map(c => '<td class=\"' + (c.num ? 'n ' : '') + (c.cls || '') + '\">' + (c.fmt ? c.fmt(r) : esc(r[c.k])) + '</td>').join('') + '</tr>').join('');\n  return '<table class=\"t\"><thead>' + head + '</thead><tbody>' + (body || '<tr><td colspan=\"' + cols.length + '\" class=\"empty\">' + esc(o.empty || 'Nothing here.') + '</td></tr>') + '</tbody></table>' + (rows.length > max ? '<div class=\"muted\" style=\"padding:8px\">showing ' + max + ' of ' + rows.length + '</div>' : '');\n};\n\n// ---------- router ----------\nRW.NAV = [\n  ['Monitor', [['dashboard', 'Dashboard', 'grid'], ['performance', 'Performance', 'activity'], ['processes', 'Processes', 'list'], ['sensors', 'Sensors', 'thermo']]],\n  ['Network', [['network', 'Network', 'globe'], ['security', 'Security', 'shield'], ['lab', 'Net Lab', 'flask']]],\n  ['SIEM', [['siem', 'Security center', 'target'], ['siem-hunt', 'Threat hunting', 'search'], ['siem-mitre', 'MITRE ATT&CK', 'layers'], ['siem-auth', 'Authentication', 'user'], ['siem-network', 'Network & IPs', 'radar'], ['siem-fim', 'Integrity', 'file'], ['siem-sca', 'Configuration', 'clipboard'], ['siem-compliance', 'Compliance', 'book']]],\n  ['Build', [['dev', 'Dev & Containers', 'code'], ['services', 'Services & Startup', 'cog']]],\n  ['Ops', [['toolbox', 'Toolbox', 'wrench'], ['alerts', 'Alerts', 'bell'], ['timeline', 'Timeline', 'clock'], ['system', 'System', 'info']]],\n];\nRW.go = (page, params) => { const q = params ? '?' + new URLSearchParams(params).toString() : ''; if (location.hash === '#/' + page + q) RW.route(); else location.hash = '#/' + page + q; };\nRW.route = () => {\n  const m = location.hash.match(/^#\\/([\\w-]+)(?:\\?(.*))?$/);\n  const page = m && RW.pages[m[1]] ? m[1] : 'dashboard';\n  const params = Object.fromEntries(new URLSearchParams((m && m[2]) || ''));\n  const P = RW.pages[page];\n  if (RW.page && RW.page !== page && RW.pages[RW.page].unmount) RW.pages[RW.page].unmount();\n  const same = RW.page === page;\n  RW.page = page; RW.params = params;\n  $('#pageTitle').textContent = P.title;\n  $('#pageSub').textContent = P.sub || '';\n  document.title = P.title + ' · RigWatch';\n  RW.$$('#nav a').forEach(a => a.classList.toggle('on', a.dataset.page === page));\n  const root = $('#page');\n  if (!same || !P.keepOnParams) { root.innerHTML = ''; root.__h = null; root.scrollTop = 0; P.mount(root, params); }\n  else if (P.onParams) P.onParams(params);\n  RW.renderTopActions();\n  document.getElementById('app').classList.remove('mobile-open');\n  if (RW.snap && P.update) P.update(RW.snap);\n};\nRW.renderNav = () => {\n  RW.setH('nav', RW.NAV.map(([g, items]) => '<h6>' + g + '</h6>' + items.map(([id, label, ic]) => '<a href=\"#/' + id + '\" data-page=\"' + id + '\" title=\"' + label + '\">' + RW.icon(ic) + '<span>' + label + '</span><em class=\"badge hidden\" id=\"nb-' + id + '\"></em></a>').join('')).join(''));\n};\nRW.renderTopActions = () => {\n  const P = RW.pages[RW.page] || {};\n  let h = '';\n  if (P.ranges) h += '<div class=\"seg\" id=\"rangeSeg\">' + ['15m', '1h', '6h', '24h', '7d', '30d', '90d', '1y'].map(r => '<button data-range=\"' + r + '\" class=\"' + (RW.prefs.range === r ? 'on' : '') + '\">' + r + '</button>').join('') + '</div>';\n  if (P.topExtra) h += P.topExtra();\n  h += '<button class=\"icon-btn' + (RW.paused ? ' on' : '') + '\" data-cmd=\"pause\" title=\"' + (RW.paused ? 'Resume' : 'Pause') + ' live updates (P)\">' + RW.icon(RW.paused ? 'play' : 'pause') + '</button>';\n  h += '<button class=\"icon-btn\" data-cmd=\"theme\" title=\"Toggle theme (T)\">' + RW.icon(RW.prefs.theme === 'dark' ? 'sun' : 'moon') + '</button>';\n  h += '<span class=\"icon-btn\" title=\"' + (RW.canControl() ? 'Control unlocked on this device' : 'Read-only: open the token URL from the RigWatch console to unlock control') + '\" style=\"cursor:default\">' + RW.icon(RW.canControl() ? 'unlock' : 'lock') + '</span>';\n  RW.setH('topActions', h);\n};\nRW.setRange = r => { RW.prefs.range = r; RW.savePrefs(); RW.renderTopActions(); RW.emit('range', r); };\n\n// ---------- live data ----------\nRW.histFor = range => (range === '15m' || !RW.remoteHist || RW.remoteHist.range !== range ? RW.hist : RW.remoteHist);\nRW.loadRange = async range => {\n  if (range === '15m') { RW.remoteHist = null; return RW.hist; }\n  const h = await RW.api('/api/history?range=' + range);\n  RW.remoteHist = h; return h;\n};\nfunction pushHist(hp) {\n  if (!hp) return;\n  const H = RW.hist;\n  if (H.t.length && H.t[H.t.length - 1] >= hp.t) return;\n  for (const k of HKEYS) { const a = H[k]; a.push(hp[k] == null ? null : hp[k]); if (a.length > RW.HMAX) a.shift(); }\n}\nRW.renderAll = () => {\n  const s = RW.snap; if (!s) return;\n  try { RW.renderStatus(s); RW.renderBadges(s); } catch (e) { console.error(e); }\n  const P = RW.pages[RW.page];\n  try { if (P && P.update) P.update(s); } catch (e) { console.error(e); }\n  try { RW.drawer.update(s); } catch (e) { console.error(e); }\n  RW.emit('rendered', s);\n};\nRW.renderBadges = s => {\n  const set = (id, n, cls) => { const el = document.getElementById('nb-' + id); if (!el) return; el.textContent = n || ''; el.className = 'badge ' + (cls || '') + (n ? '' : ' hidden'); };\n  const sc = s.security.counts; set('security', sc.critical + sc.high || sc.medium || 0, sc.critical + sc.high ? 'crit' : sc.medium ? 'warn' : '');\n  set('alerts', s.alerts.firing.length, 'crit');\n  set('dev', (s.procs || []).filter(p => RW.isDev(p) && p.ports && p.ports.length).length + (s.docker && s.docker.containers ? s.docker.containers.filter(c => c.state === 'running').length : 0));\n  set('lab', [...RW.jobs.values()].filter(j => j.s.status === 'running').length);\n};\nRW.renderStatus = s => {\n  const g = s.gpus[0], n = s.net;\n  const parts = [\n    '<span class=\"dot ' + (RW.connected ? 'live' : 'off') + '\"></span><span>' + (RW.paused ? 'paused' : RW.connected ? 'live' : 'reconnecting…') + '</span>',\n    '<span class=\"sep\"></span><span>CPU <b>' + F.pct(s.cpu.util) + '</b>' + (s.cpu.temp != null ? ' ' + F.temp(s.cpu.temp) : '') + '</span>',\n    g ? '<span>GPU <b>' + F.pct(g.util) + '</b>' + (g.temp != null ? ' ' + F.temp(g.temp) : '') + '</span>' : '',\n    '<span>RAM <b>' + F.pct(100 * s.mem.used / s.mem.total) + '</b></span>',\n    '<span class=\"hide-m\">↓ <b>' + F.bits(n.rx) + '</b> ↑ <b>' + F.bits(n.tx) + '</b></span>',\n    n.ping ? '<span class=\"hide-m\">ping <b>' + F.ms(n.ping.ms) + '</b></span>' : '',\n    s.fps.main ? '<span>FPS <b>' + Math.round(s.fps.main.fps) + '</b></span>' : '',\n    '<span class=\"spacer\"></span>',\n    s.alerts.firing.length ? '<a data-go=\"alerts\" class=\"chip crit\"><i></i>' + s.alerts.firing.length + ' alert' + (s.alerts.firing.length > 1 ? 's' : '') + ' firing</a>' : '',\n    '<a data-go=\"security\" class=\"hide-m\">security <b>' + s.security.score + '</b>/100</a>',\n    '<span class=\"hide-m\">' + esc(RW.st ? RW.st.hostname : '') + ' · up ' + F.age(s.uptime) + '</span>',\n  ];\n  RW.setH('status', parts.join(''));\n  const warn = [];\n  if (s.fallback) warn.push('Detailed collectors are starting or unavailable; showing basic CPU and memory only.');\n  RW.setH('banner', warn.length ? '<div class=\"banner\">' + RW.icon('alert') + esc(warn.join(' ')) + '</div>' : '');\n};\n\n// ---------- SSE ----------\nRW.connect = () => {\n  const es = new EventSource('/api/stream');\n  es.addEventListener('hello', e => {\n    const h = JSON.parse(e.data);\n    RW.st = h.static; RW.auth = h.auth; RW.settings = h.settings; RW.webhook = h.webhook;\n    $('#ver').textContent = 'v' + RW.st.version;\n    RW.setH('sideFoot', '<span class=\"txt\">' + esc(RW.st.hostname) + '</span><span class=\"txt faint\">' + esc(RW.st.platformLabel) + ' · Node ' + esc(RW.st.node) + '</span>');\n    RW.renderTopActions(); RW.emit('hello', h);\n  });\n  es.addEventListener('static', e => { RW.st = JSON.parse(e.data); RW.emit('static'); });\n  es.addEventListener('history', e => { const h = JSON.parse(e.data); HKEYS.forEach(k => { RW.hist[k] = (h[k] || []).slice(-RW.HMAX); }); });\n  es.addEventListener('snap', e => {\n    const s = JSON.parse(e.data);\n    RW.prev = RW.snap; RW.snap = s; pushHist(s.hp);\n    RW.emit('snap', s);\n    if (!RW.connected) { RW.connected = true; }\n    if (!RW.paused && !document.hidden) RW.renderAll();\n  });\n  es.addEventListener('events', e => {\n    const list = JSON.parse(e.data);\n    const known = new Set(RW.events.slice(-500).map(x => x.id));\n    for (const ev of list) if (!known.has(ev.id)) RW.events.push(ev);\n    if (RW.events.length > 3000) RW.events.splice(0, RW.events.length - 3000);\n    RW.emit('events', list);\n  });\n  es.addEventListener('job', e => {\n    const m = JSON.parse(e.data);\n    let j = RW.jobs.get(m.id); if (!j) { j = { s: { id: m.id, status: 'running' }, lines: [], result: null }; RW.jobs.set(m.id, j); }\n    for (const it of m.items) {\n      if (it.type === 'line') j.lines.push(it.data);\n      else if (it.type === 'result') j.result = it.data;\n      else if (it.type === 'progress') j.s.progress = it.data;\n      else if (it.type === 'start' || it.type === 'done') Object.assign(j.s, it.data);\n    }\n    if (j.lines.length > 5000) j.lines.splice(0, 1000);\n    RW.emit('job', m.id);\n  });\n  es.addEventListener('siem', e => { try { RW.emit('siem', JSON.parse(e.data)); } catch { /* ignore */ } });\n  es.addEventListener('alert', e => {\n    for (const a of JSON.parse(e.data)) {\n      RW.toast(a.msg, 'warn', 9000);\n      if (RW.prefs.notify && 'Notification' in window && Notification.permission === 'granted') { try { new Notification('RigWatch', { body: a.msg, tag: a.id }); } catch { /* ignore */ } }\n    }\n  });\n  es.onerror = () => { RW.connected = false; if (RW.snap) RW.renderStatus(RW.snap); };\n};\n\n// ---------- tooltip ----------\nRW.tip = (html, x, y) => {\n  const el = $('#tip');\n  if (!html) { el.classList.add('hidden'); return; }\n  el.innerHTML = html; el.classList.remove('hidden');\n  const w = el.offsetWidth, h = el.offsetHeight;\n  let left = x + 14; if (left + w > innerWidth - 8) left = x - w - 14;\n  let top = y; if (top + h > innerHeight - 8) top = innerHeight - h - 8;\n  el.style.left = Math.max(8, left) + 'px'; el.style.top = Math.max(8, top) + 'px';\n};\n\n// ---------- theme & appearance ----------\nRW.ACCENTS = { blue: ['#3987e5', '#2a78d6'], violet: ['#9085e9', '#6250d6'], aqua: ['#199e70', '#1baf7a'], orange: ['#d95926', '#eb6834'], pink: ['#d55181', '#e87ba4'], amber: ['#c98500', '#b37500'] };\nRW.applyAppearance = () => {\n  const a = RW.ACCENTS[RW.prefs.accent] || RW.ACCENTS.blue;\n  document.documentElement.style.setProperty('--accent', RW.prefs.theme === 'light' ? a[1] : a[0]);\n  document.body.classList.toggle('compact', !!RW.prefs.compact);\n};\nRW.applyTheme = t => { RW.prefs.theme = t; RW.savePrefs(); document.documentElement.setAttribute('data-theme', t); RW.applyAppearance(); RW.emit('theme', t); RW.renderTopActions(); };\n})();\n","public/js/overlay.js":"'use strict';\n/* Compact live overlay: /overlay?items=fps,cpu,gpu,ram&bg=clear&layout=row&scale=1.2 */\n(() => {\n  const q = new URLSearchParams(location.search);\n  const items = (q.get('items') || 'fps,cpu,gpu,ram,vram,ping').split(',').map(s => s.trim()).filter(Boolean);\n  const bg = q.get('bg') || 'glass';\n  if (bg === 'dark') document.body.classList.add('dark');\n  if (bg === 'clear') document.body.classList.add('clear');\n  if (q.get('layout') === 'col') document.body.classList.add('col');\n  const scale = Math.min(4, Math.max(0.5, parseFloat(q.get('scale')) || 1));\n  const o = document.getElementById('o');\n  o.style.transform = 'scale(' + scale + ')';\n  if (!q.toString()) document.getElementById('help').hidden = false;\n  const esc = v => String(v == null ? '' : v).replace(/[&<>\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' })[c]);\n  const pct = v => (v == null ? '–' : Math.round(v) + '%');\n  const t = c => (c == null ? '' : ' <span class=\"' + (c >= 90 ? 'crit' : c >= 80 ? 'hot' : '') + '\">' + Math.round(c) + '°</span>');\n  const gb = b => (b == null ? '–' : (b / 1073741824).toFixed(1) + 'G');\n  const bits = B => { let b = B * 8, i = 0; const u = ['b', 'K', 'M', 'G']; while (b >= 1000 && i < 3) { b /= 1000; i++; } return (i ? b.toFixed(b >= 100 ? 0 : 1) : Math.round(b)) + u[i]; };\n  const R = {\n    fps: s => (s.fps.main ? '<b>FPS</b>' + Math.round(s.fps.main.fps) + (s.fps.main.low1 ? '<small>1% ' + Math.round(s.fps.main.low1) + '</small>' : '') : '<b>FPS</b>–'),\n    cpu: s => '<b>CPU</b>' + pct(s.cpu.util) + t(s.cpu.temp),\n    gpu: s => (s.gpus[0] ? '<b>GPU</b>' + pct(s.gpus[0].util) + t(s.gpus[0].temp) : ''),\n    ram: s => '<b>RAM</b>' + gb(s.mem.used) + '<small>/' + gb(s.mem.total) + '</small>',\n    vram: s => (s.gpus[0] && s.gpus[0].vramTotal ? '<b>VRAM</b>' + gb(s.gpus[0].vramUsed) + '<small>/' + gb(s.gpus[0].vramTotal) + '</small>' : ''),\n    temp: s => (s.temps.length ? '<b>TEMP</b>' + s.temps.slice(0, 3).map(x => Math.round(x.value) + '°').join(' ') : ''),\n    net: s => '<b>NET</b>↓' + bits(s.net.rx) + ' ↑' + bits(s.net.tx),\n    ping: s => (s.net.ping ? '<b>PING</b>' + (s.net.ping.ms == null ? 'timeout' : Math.round(s.net.ping.ms) + 'ms') + (s.net.ping.loss ? '<small>' + s.net.ping.loss + '% loss</small>' : '') : ''),\n    disk: s => { const r = s.disks.reduce((a, d) => a + (d.read || d.total || 0) + (d.write || 0), 0); return '<b>DISK</b>' + (r / 1048576).toFixed(1) + 'MB/s'; },\n  };\n  const es = new EventSource('/api/stream');\n  es.addEventListener('snap', e => {\n    const s = JSON.parse(e.data);\n    o.innerHTML = items.map(k => (R[k] ? R[k](s) : '')).filter(Boolean).map(h => '<span class=\"i\">' + h + '</span>').join('');\n  });\n  es.onerror = () => { o.textContent = 'RigWatch offline…'; };\n  void esc;\n})();\n","public/js/pages-dev.js":"'use strict';\n/* Pages: Dev & Containers, Services & Startup, Alerts, Timeline. */\n(() => {\nconst { esc, f: F, icon, setH } = RW;\nconst RT_COL = { node: '--s6', python: '--s4', java: '--s2', dotnet: '--s7', ruby: '--s8', php: '--s7', go: '--s3', bun: '--s5', deno: '--s3', db: '--s1', server: '--s3', container: '--s1', ai: '--s5', tool: '--s4' };\nconst rtOf = p => { const n = p.name.toLowerCase(); if (p.kind !== 'runtime') return p.kind; if (/^(node|nodejs)$/.test(n)) return 'node'; if (/^py|python/.test(n)) return 'python'; if (/^java/.test(n)) return 'java'; return n.replace(/w$/, ''); };\n\n// logs viewer for docker containers (streams a job into a modal)\nRW.showLogs = async (id, name) => {\n  let job;\n  try { job = await RW.tool('dockerlogs', { id, name, tail: 300 }); } catch (e) { return RW.toast(e.message, 'err'); }\n  const m = RW.modal({ title: 'Logs: ' + name, wide: true, body: '<div class=\"term\" id=\"logterm\" style=\"height:60vh\"></div>', actions: [{ label: 'Close' }] });\n  const draw = jid => { if (jid !== job.id) return; const j = RW.jobs.get(job.id), t = document.getElementById('logterm'); if (!j || !t) return; const atB = t.scrollHeight - t.scrollTop - t.clientHeight < 40; t.innerHTML = j.lines.slice(-3000).map(l => '<span class=\"' + esc(l.cls) + '\">' + esc(l.text) + '</span>').join('\\n'); if (atB) t.scrollTop = t.scrollHeight; };\n  RW.on('job', draw);\n  const obs = new MutationObserver(() => { if (!document.body.contains(m.el)) { obs.disconnect(); RW.api('/api/jobs/' + job.id + '/cancel', { method: 'POST' }).catch(() => {}); } });\n  obs.observe(document.getElementById('modalRoot'), { childList: true });\n};\nRW.inspectContainer = async (id, name) => {\n  try {\n    const j = await RW.api('/api/docker/inspect?id=' + encodeURIComponent(id));\n    RW.drawer.open(name, { mount(b) {\n      b.innerHTML = RW.kv([['Image', esc(j.image)], ['Command', '<span class=\"mono\">' + esc(j.cmd) + '</span>'], ['Status', esc(j.state ? j.state.Status + (j.state.StartedAt ? ' since ' + new Date(j.state.StartedAt).toLocaleString() : '') : '')], ['Restart policy', esc(j.restart ? j.restart.Name : '')], ['User', esc(j.user)], ['Privileged', j.privileged ? '<span class=\"chip crit\"><i></i>yes</span>' : 'no'], ['Capabilities added', esc((j.capAdd || []).join(', '))], ['Network mode', esc(j.networkMode)], ['Workdir', esc(j.workdir)]]) +\n        '<h3>Networks</h3>' + RW.kv(j.networks.map(n => [n.name, '<span class=\"mono\">' + esc(n.ip + ' via ' + n.gw) + '</span>'])) +\n        '<h3>Ports</h3><div class=\"cmd\">' + esc(Object.entries(j.ports || {}).map(([k, v]) => k + ' → ' + (v ? v.map(x => x.HostIp + ':' + x.HostPort).join(', ') : 'not published')).join('\\n') || 'none') + '</div>' +\n        '<h3>Mounts</h3><div class=\"cmd\">' + esc(j.mounts.map(x => x.type + '  ' + x.src + ' → ' + x.dst + (x.rw ? '' : ' (ro)')).join('\\n') || 'none') + '</div>' +\n        '<h3>Environment</h3><div class=\"muted\" style=\"font-size:12px;margin-bottom:4px\">values are hidden</div><div class=\"cmd\">' + esc(j.env.join('\\n') || 'none') + '</div>';\n    } });\n  } catch (e) { RW.toast(e.message, 'err'); }\n};\n\n// ======================= Dev & Containers =======================\nlet devData = null, devTimer = null;\nRW.pages.dev = {\n  title: 'Dev & Containers', sub: 'dev servers, runtimes, Docker, WSL and your toolchain',\n  mount(root) {\n    root.innerHTML = '<div class=\"grid g4\" id=\"dv-sum\"></div><article class=\"card\" style=\"margin-bottom:14px\"><header><h2>Dev servers & runtimes</h2><span class=\"right muted\">health-checked every 10 s · click a card for details</span></header><div class=\"devgrid\" id=\"dv-grid\"></div></article>' +\n      '<article class=\"card\" style=\"margin-bottom:14px\"><header><h2>Containers</h2><span class=\"right muted\" id=\"dv-dk\"></span></header><div class=\"tw\" id=\"dv-c\"></div></article>' +\n      '<div class=\"grid g3\"><article class=\"card\"><header><h2>WSL</h2></header><div id=\"dv-wsl\"></div></article><article class=\"card\"><header><h2>Toolchain</h2></header><div id=\"dv-tc\"></div></article><article class=\"card\"><header><h2>Editors & shells</h2></header><div id=\"dv-ed\"></div></article></div>';\n    const load = () => RW.api('/api/dev').then(d => { devData = d; RW.renderAll(); }).catch(() => {});\n    load(); clearInterval(devTimer); devTimer = setInterval(() => { if (RW.page === 'dev') load(); }, 15000);\n    root.addEventListener('click', async e => {\n      const d = e.target.closest('[data-dk]');\n      if (d) {\n        e.stopPropagation();\n        const { dk: act, id, name } = d.dataset;\n        if (act === 'logs') return RW.showLogs(id, name);\n        if (act === 'inspect') return RW.inspectContainer(id, name);\n        if ((act === 'stop' || act === 'kill') && !(await RW.confirm(act + ' ' + name + '?', 'The container will be ' + (act === 'kill' ? 'killed immediately.' : 'stopped gracefully.'), { danger: true, ok: act }))) return;\n        d.disabled = true; RW.action({ type: 'docker', id, action: act }).finally(() => { d.disabled = false; });\n      }\n      const w = e.target.closest('[data-wsl]');\n      if (w && await RW.confirm(w.dataset.wsl === 'shutdown' ? 'Shut down WSL?' : 'Terminate ' + w.dataset.name + '?', 'Running Linux processes in ' + (w.dataset.wsl === 'shutdown' ? 'every distro' : 'it') + ' will stop.', { danger: true, ok: 'Do it' })) RW.action({ type: 'wsl', name: w.dataset.name, action: w.dataset.wsl }).then(() => RW.api('/api/dev').then(x => { devData = x; }));\n      const k = e.target.closest('[data-killdev]');\n      if (k) { e.stopPropagation(); if (await RW.confirm('Stop ' + k.dataset.name + '?', 'Ends PID ' + k.dataset.killdev + ' and its children.', { danger: true, ok: 'Stop' })) RW.action({ type: 'proc.kill', pid: +k.dataset.killdev, tree: true }); }\n    });\n  },\n  unmount() { clearInterval(devTimer); },\n  update(s) {\n    const dev = s.procs.filter(RW.isDev), H = (s.dev && s.dev.health) || {};\n    const by = new Map(); for (const p of dev) { const r = rtOf(p); const e = by.get(r) || { n: 0, mem: 0, cpu: 0 }; e.n++; e.mem += p.mem; e.cpu += p.cpu; by.set(r, e); }\n    setH('dv-sum', [...by].sort((a, b) => b[1].mem - a[1].mem).slice(0, 4).map(([r, e]) => '<div class=\"kpi\" style=\"cursor:default\"><div class=\"kl\"><span class=\"rt\"><i style=\"background:var(' + (RT_COL[r] || '--s1') + ')\"></i>' + esc(r) + '</span></div><div class=\"kv2\">' + e.n + '<small>' + (e.n === 1 ? 'process' : 'processes') + '</small></div><div class=\"ks\">' + F.b(e.mem, 1) + ' · ' + F.pct(e.cpu, 1) + ' CPU</div></div>').join('') || '<div class=\"kpi\" style=\"grid-column:1/-1;cursor:default\"><div class=\"ks\">No node, python, java, dotnet, databases or containers running right now.</div></div>');\n    dev.sort((a, b) => (b.ports.length ? 1 : 0) - (a.ports.length ? 1 : 0) || b.mem - a.mem);\n    setH('dv-grid', dev.length ? dev.slice(0, 60).map(p => { const r = rtOf(p); return '<div class=\"devc click\" data-pid=\"' + p.pid + '\" style=\"cursor:pointer\"><div style=\"display:flex;justify-content:space-between;align-items:center;gap:8px\"><span class=\"rt\"><i style=\"background:var(' + (RT_COL[r] || '--s1') + ')\"></i>' + esc(r) + '</span><span class=\"muted\" style=\"font-size:12px\">PID ' + p.pid + ' · up ' + F.age(p.age) + '</span></div>' +\n      '<div class=\"dl\" title=\"' + esc(p.cmd) + '\">' + esc(p.label || p.name) + '</div>' + (p.project ? '<div class=\"dm\">' + icon('folder') + '<b>' + esc(p.project.name) + '</b>' + (p.project.branch ? '<span class=\"chip info\"><i></i>' + esc(p.project.branch) + '</span>' : '') + (p.project.version ? '<span class=\"muted\">v' + esc(p.project.version) + '</span>' : '') + '</div>' : '') +\n      '<div class=\"dm\"><span>CPU <b>' + F.pct(p.cpu, 1) + '</b></span><span>RAM <b>' + F.b(p.mem, 1) + '</b></span>' + (p.io > 0 ? '<span>I/O <b>' + F.rate(p.io) + '</b></span>' : '') + (p.conns ? '<span>' + p.conns + ' conns</span>' : '') + '</div>' + RW.bar(p.cpu * 4, '--s1') +\n      '<div style=\"display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap\">' + (p.ports.length ? '<span class=\"plinks\">' + p.ports.slice(0, 4).map(pt => '<a class=\"plink\" href=\"http://localhost:' + pt + '\" target=\"_blank\" rel=\"noopener noreferrer\">:' + pt + '</a>' + RW.healthChip(H[pt])).join(' ') + '</span>' : '<span class=\"muted\" style=\"font-size:12px\">no listening port</span>') + (RW.canControl() ? '<button class=\"btn sm danger\" data-killdev=\"' + p.pid + '\" data-name=\"' + esc(p.label || p.name) + '\">Stop</button>' : '') + '</div></div>'; }).join('') : '<div class=\"empty\">Nothing dev-ish running. Start <code>npm run dev</code>, a Python server or a database and it appears here.</div>');\n    const d = s.docker;\n    setH('dv-dk', d.available && d.info ? esc('Docker ' + d.info.version + ' · ' + d.info.os + ' · ' + d.info.images + ' images') : '');\n    const ctl = RW.canControl();\n    setH('dv-c', !d.available ? '<div class=\"empty\">Docker / Podman is not running (or not reachable on its default socket / DOCKER_HOST).</div>' : RW.table('dockerc', [\n      { k: 'name', label: 'Container', fmt: c => '<span class=\"pn\">' + esc(c.name) + '</span><span class=\"sub\">' + esc(c.image) + '</span>' + (c.compose ? '<span class=\"tag\">' + esc(c.compose) + '</span>' : '') },\n      { k: 'state', label: 'State', fmt: c => '<span class=\"chip ' + (c.state === 'running' ? 'good' : c.state === 'paused' ? 'warn' : c.state === 'exited' ? '' : 'crit') + '\"><i></i>' + esc(c.state) + '</span><div class=\"muted\" style=\"font-size:11px\">' + esc(c.status) + '</div>' },\n      { k: 'cpu', label: 'CPU', num: true, fmt: c => (c.state === 'running' ? F.pct(c.cpu, 1) : '') },\n      { k: 'mem', label: 'Memory', num: true, fmt: c => (c.state === 'running' ? F.b(c.mem, 0) + (c.memLimit ? '<div class=\"muted\" style=\"font-size:11px\">of ' + F.b(c.memLimit, 0) + '</div>' : '') : '') },\n      { k: 'rx', label: 'Net ↓/↑', num: true, fmt: c => (c.state === 'running' ? F.rate(c.rx) + ' / ' + F.rate(c.tx) : '') },\n      { k: 'pids', label: 'PIDs', num: true, fmt: c => (c.pids || '') },\n      { k: 'ports', label: 'Ports', nosort: true, fmt: c => RW.portLinks([...new Set(c.ports.filter(p => p.pub).map(p => p.pub))], 4) },\n      { k: 'x', label: '', nosort: true, fmt: c => '<span style=\"display:inline-flex;gap:4px\">' + (ctl ? (c.state === 'running' ? '<button class=\"btn sm\" data-dk=\"restart\" data-id=\"' + c.id + '\" data-name=\"' + esc(c.name) + '\">restart</button><button class=\"btn sm\" data-dk=\"pause\" data-id=\"' + c.id + '\" data-name=\"' + esc(c.name) + '\">pause</button><button class=\"btn sm danger\" data-dk=\"stop\" data-id=\"' + c.id + '\" data-name=\"' + esc(c.name) + '\">stop</button>' : c.state === 'paused' ? '<button class=\"btn sm\" data-dk=\"unpause\" data-id=\"' + c.id + '\" data-name=\"' + esc(c.name) + '\">unpause</button>' : '<button class=\"btn sm\" data-dk=\"start\" data-id=\"' + c.id + '\" data-name=\"' + esc(c.name) + '\">start</button>') : '') + '<button class=\"btn sm\" data-dk=\"logs\" data-id=\"' + c.id + '\" data-name=\"' + esc(c.name) + '\">logs</button><button class=\"btn sm ghost\" data-dk=\"inspect\" data-id=\"' + c.id + '\" data-name=\"' + esc(c.name) + '\">inspect</button></span>' },\n    ], d.containers, { sortK: 'state', sortD: -1 }));\n    const wsl = (devData && devData.wsl) || (s.dev && s.dev.wsl);\n    setH('dv-wsl', !RW.st || RW.st.platform !== 'win32' ? '<div class=\"empty\">WSL is Windows-only.</div>' : !wsl ? '<div class=\"empty\">checking…</div>' : !wsl.installed ? '<div class=\"empty\">WSL is not installed.</div>' : (wsl.distros.map(x => '<div class=\"brow\"><span class=\"bl\"><b>' + esc(x.name) + '</b>' + (x.default ? ' <span class=\"tag\">default</span>' : '') + ' <span class=\"muted\">WSL ' + x.version + '</span></span><span class=\"bv\"><span class=\"chip ' + (x.state === 'Running' ? 'good' : '') + '\"><i></i>' + esc(x.state) + '</span>' + (ctl && x.state === 'Running' ? ' <button class=\"btn sm\" data-wsl=\"terminate\" data-name=\"' + esc(x.name) + '\">terminate</button>' : '') + '</span></div>').join('') || '<div class=\"empty\">No distros.</div>') + (ctl && wsl.distros.some(x => x.state === 'Running') ? '<div style=\"margin-top:10px\"><button class=\"btn sm danger\" data-wsl=\"shutdown\" data-name=\"\">Shut down WSL (frees vmmem)</button></div>' : ''));\n    setH('dv-tc', devData && devData.toolchain ? devData.toolchain.map(t => '<div class=\"brow\"><span class=\"bl\"><b>' + esc(t.name) + '</b></span><span class=\"bv mono\" title=\"' + esc(t.path) + '\">' + esc(t.version) + '</span></div>').join('') : '<div class=\"empty\">detecting…</div>');\n    const ed = RW.groupApps(s.procs.filter(p => p.kind === 'editor' || p.kind === 'shell')).sort((a, b) => b.mem - a.mem);\n    setH('dv-ed', ed.length ? ed.map(a => RW.brow(esc(a.name) + ' <span class=\"muted\">×' + a.n + '</span>', F.b(a.mem, 1) + ' · ' + F.pct(a.cpu, 1), 100 * a.mem / ed[0].mem, '--s3', 'data-q=\"' + esc(a.name) + '\"')).join('') : '<div class=\"empty\">No editors or terminals detected.</div>');\n  },\n};\n\n// ======================= Services & Startup =======================\nlet svc = [], startup = null, svcTab = 'services', svcQ = '', svcState = 'all', svcTimer = null;\nconst loadSvc = fresh => RW.api('/api/services' + (fresh ? '?fresh=1' : '')).then(l => { svc = l; RW.renderAll(); }).catch(e => { svc = []; RW.toast(e.message, 'err'); });\nRW.pages.services = {\n  title: 'Services & Startup', sub: 'start, stop and restart services; see what launches at boot',\n  mount(root) {\n    root.innerHTML = '<article class=\"card\"><div class=\"toolbar\"><div class=\"seg\" id=\"svtab\"><button data-svtab=\"services\" class=\"' + (svcTab === 'services' ? 'on' : '') + '\">Services</button><button data-svtab=\"startup\" class=\"' + (svcTab === 'startup' ? 'on' : '') + '\">Startup items</button></div><input type=\"search\" id=\"svq\" placeholder=\"Filter\" value=\"' + esc(svcQ) + '\"><div class=\"seg\" id=\"svst\">' + [['all', 'All'], ['running', 'Running'], ['stopped', 'Stopped'], ['auto', 'Auto-start'], ['failed', 'Failed']].map(([k, l]) => '<button data-svst=\"' + k + '\" class=\"' + (svcState === k ? 'on' : '') + '\">' + l + '</button>').join('') + '</div><span class=\"grow\"></span><span class=\"muted\" id=\"svc-n\"></span></div><div class=\"tw\" id=\"svbody\" style=\"max-height:calc(100vh - 210px)\"><div class=\"empty\">loading…</div></div></article>';\n    loadSvc(); clearInterval(svcTimer); svcTimer = setInterval(() => { if (RW.page === 'services' && svcTab === 'services') loadSvc(); }, 10000);\n    root.addEventListener('input', e => { if (e.target.id === 'svq') { svcQ = e.target.value.trim().toLowerCase(); this.draw(); } });\n    root.addEventListener('click', async e => {\n      const t = e.target.closest('[data-svtab]'); if (t) { svcTab = t.dataset.svtab; RW.$$('#svtab button').forEach(b => b.classList.toggle('on', b === t)); document.getElementById('svst').style.display = svcTab === 'services' ? '' : 'none'; if (svcTab === 'startup' && !startup) RW.api('/api/startup').then(l => { startup = l; this.draw(); }).catch(er => RW.toast(er.message, 'err')); this.draw(); }\n      const st = e.target.closest('[data-svst]'); if (st) { svcState = st.dataset.svst; RW.$$('#svst button').forEach(b => b.classList.toggle('on', b === st)); this.draw(); }\n      const a = e.target.closest('[data-svc]');\n      if (a) {\n        e.stopPropagation();\n        const name = a.dataset.name, act = a.dataset.svc;\n        if (act !== 'start' && !(await RW.confirm(act + ' ' + name + '?', 'Changing services usually needs an elevated RigWatch. Stopping system services can break things until reboot.', { danger: true, ok: act }))) return;\n        a.disabled = true;\n        RW.action({ type: 'service', name, action: act }).then(() => loadSvc(true)).catch(() => {}).finally(() => { a.disabled = false; });\n      }\n    });\n  },\n  unmount() { clearInterval(svcTimer); },\n  draw() {\n    if (svcTab === 'startup') {\n      const l = (startup || []).filter(x => !svcQ || (x.name + ' ' + x.cmd + ' ' + x.location).toLowerCase().includes(svcQ));\n      setH('svc-n', l.length + ' items');\n      setH('svbody', startup ? RW.table('startup', [{ k: 'name', label: 'Name', fmt: x => '<b>' + esc(x.name) + '</b>' }, { k: 'kind', label: 'Type', fmt: x => '<span class=\"tag\">' + esc(x.kind) + '</span>' }, { k: 'cmd', label: 'Command', cls: 'wrap mono', fmt: x => esc(x.cmd) }, { k: 'location', label: 'Location', cls: 'wrap', fmt: x => '<span class=\"muted\">' + esc(x.location) + '</span>' }, { k: 'user', label: 'User' }], l, { sortK: 'name', sortD: 1 }) : '<div class=\"empty\">loading…</div>');\n      return;\n    }\n    const ctl = RW.canControl();\n    const l = svc.filter(x => {\n      const st = String(x.state).toLowerCase();\n      if (svcState === 'running' && st !== 'running') return false;\n      if (svcState === 'stopped' && st === 'running') return false;\n      if (svcState === 'auto' && !/auto|enabled/i.test(x.start)) return false;\n      if (svcState === 'failed' && !/fail/i.test(x.state + x.sub)) return false;\n      return !svcQ || (x.name + ' ' + x.display + ' ' + (x.desc || '')).toLowerCase().includes(svcQ);\n    });\n    setH('svc-n', l.length + ' of ' + svc.length + ' · ' + svc.filter(x => /running/i.test(x.state)).length + ' running');\n    setH('svbody', RW.table('svcs', [\n      { k: 'display', label: 'Service', fmt: x => '<b>' + esc(x.display) + '</b>' + (x.display !== x.name ? '<span class=\"sub mono\">' + esc(x.name) + '</span>' : '') + (x.desc && x.desc !== x.display ? '<div class=\"muted\" style=\"font-size:12px;white-space:normal;max-width:620px\">' + esc(x.desc) + '</div>' : '') },\n      { k: 'state', label: 'State', fmt: x => '<span class=\"chip ' + (/running/i.test(x.state) ? 'good' : /fail/i.test(x.state) ? 'crit' : '') + '\"><i></i>' + esc(x.state) + '</span>' },\n      { k: 'start', label: 'Start', fmt: x => '<span class=\"muted\">' + esc(x.start || '') + '</span>' },\n      { k: 'pid', label: 'PID', num: true, fmt: x => (x.pid ? '<a data-pid=\"' + x.pid + '\">' + x.pid + '</a>' : '') },\n      { k: 'user', label: 'Account', fmt: x => '<span class=\"muted\">' + esc(x.user || '') + '</span>' },\n      { k: 'x', label: '', nosort: true, fmt: x => (ctl ? (/running/i.test(x.state) ? '<button class=\"btn sm\" data-svc=\"restart\" data-name=\"' + esc(x.name) + '\">restart</button> <button class=\"btn sm danger\" data-svc=\"stop\" data-name=\"' + esc(x.name) + '\">stop</button>' : '<button class=\"btn sm\" data-svc=\"start\" data-name=\"' + esc(x.name) + '\">start</button>') : '') },\n    ], l, { sortK: 'display', sortD: 1, max: 1500 }));\n  },\n  update() { this.draw(); },\n};\n\n// ======================= Alerts =======================\nlet rules = null, metrics = {}, dirty = false;\nconst loadRules = () => RW.api('/api/alerts').then(r => { rules = r.rules; metrics = r.metrics; dirty = false; RW.pages.alerts.draw(); }).catch(e => RW.toast(e.message, 'err'));\nRW.pages.alerts = {\n  title: 'Alerts', sub: 'threshold rules, browser notifications and webhooks',\n  mount(root) {\n    const ctl = RW.canControl(), w = RW.webhook || {};\n    root.innerHTML = '<article class=\"card\" style=\"margin-bottom:14px\"><header><h2>Rules</h2><span class=\"right\"><button class=\"btn sm\" id=\"ar-add\"' + (ctl ? '' : ' disabled') + '>' + icon('plus') + 'Add rule</button><button class=\"btn sm primary\" id=\"ar-save\"' + (ctl ? '' : ' disabled') + '>Save</button></span></header><div class=\"tw\" id=\"ar-t\"><div class=\"empty\">loading…</div></div></article>' +\n      '<div class=\"grid g2\"><article class=\"card\"><header><h2>Delivery</h2></header>' +\n      '<label class=\"check\" style=\"display:flex;margin:4px 0 12px\"><input type=\"checkbox\" id=\"ar-notify\"' + (RW.prefs.notify ? ' checked' : '') + '>Browser notifications on this device</label>' +\n      '<h3>Webhook (Discord, Slack or JSON)</h3><div class=\"form\"><label class=\"field\" style=\"flex:3\">URL<input type=\"url\" id=\"wh-url\" placeholder=\"https://discord.com/api/webhooks/…\" value=\"' + esc(w.url || '') + '\"' + (ctl ? '' : ' disabled') + '></label><label class=\"field\">Format<select id=\"wh-fmt\"' + (ctl ? '' : ' disabled') + '>' + ['discord', 'slack', 'json'].map(f => '<option' + (w.format === f ? ' selected' : '') + '>' + f + '</option>').join('') + '</select></label></div>' +\n      '<div style=\"display:flex;gap:8px;align-items:center\"><label class=\"check\"><input type=\"checkbox\" id=\"wh-on\"' + (w.enabled ? ' checked' : '') + (ctl ? '' : ' disabled') + '>enabled</label><span class=\"grow\" style=\"flex:1\"></span><button class=\"btn sm\" id=\"wh-test\"' + (ctl ? '' : ' disabled') + '>Send test</button><button class=\"btn sm primary\" id=\"wh-save\"' + (ctl ? '' : ' disabled') + '>Save webhook</button></div><div class=\"muted\" style=\"font-size:12px;margin-top:8px\">A rule only uses the webhook when its \"webhook\" box is ticked. Nothing leaves this machine otherwise.</div></article>' +\n      '<article class=\"card\"><header><h2>Alert history</h2></header><div id=\"ar-h\" style=\"max-height:360px;overflow:auto\"></div></article></div>';\n    loadRules();\n    const $ = s => root.querySelector(s);\n    $('#ar-add').onclick = () => { rules.push({ id: 'rule-' + Date.now(), name: 'New rule', metric: 'cpu', target: '', op: '>', value: 90, forSec: 10, cooldownSec: 300, enabled: true, webhook: false }); dirty = true; this.draw(); };\n    $('#ar-save').onclick = () => { this.collect(); RW.api('/api/alerts', { method: 'PUT', body: { rules } }).then(r => { rules = r.rules; dirty = false; this.draw(); RW.toast('Rules saved', 'ok'); }).catch(e => RW.toast(e.message, 'err')); };\n    $('#ar-notify').onchange = async e => {\n      if (e.target.checked && 'Notification' in window && Notification.permission !== 'granted') { const p = await Notification.requestPermission(); if (p !== 'granted') { e.target.checked = false; RW.toast('Notifications were blocked by the browser', 'err'); return; } }\n      RW.prefs.notify = e.target.checked; RW.savePrefs();\n    };\n    $('#wh-save').onclick = () => RW.api('/api/webhook', { method: 'PUT', body: { url: $('#wh-url').value.trim(), format: $('#wh-fmt').value, enabled: $('#wh-on').checked } }).then(() => { RW.webhook = { url: $('#wh-url').value.trim(), format: $('#wh-fmt').value, enabled: $('#wh-on').checked }; RW.toast('Webhook saved', 'ok'); }).catch(e => RW.toast(e.message, 'err'));\n    $('#wh-test').onclick = () => RW.api('/api/webhook/test', { method: 'POST' }).then(r => RW.toast(r.msg || 'sent', 'ok')).catch(e => RW.toast(e.message, 'err'));\n    root.addEventListener('click', e => { const d = e.target.closest('[data-rmrule]'); if (d) { this.collect(); rules.splice(+d.dataset.rmrule, 1); dirty = true; this.draw(); } });\n    root.addEventListener('input', e => { if (e.target.closest('#ar-t')) dirty = true; });\n    root.addEventListener('change', e => { if (e.target.closest('#ar-t')) { dirty = true; if (e.target.name === 'metric') { this.collect(); this.draw(); } } });\n  },\n  collect() {\n    RW.$$('#ar-t tr[data-i]').forEach(tr => {\n      const r = rules[+tr.dataset.i]; if (!r) return;\n      const v = n => tr.querySelector('[name=\"' + n + '\"]');\n      r.enabled = v('enabled').checked; r.name = v('name').value; r.metric = v('metric').value; r.target = v('target') ? v('target').value : ''; r.op = v('op').value; r.value = +v('value').value; r.forSec = +v('forSec').value; r.webhook = v('webhook').checked;\n    });\n  },\n  draw() {\n    if (!rules) return;\n    const ctl = RW.canControl() ? '' : ' disabled';\n    setH('ar-t', '<table class=\"t\"><thead><tr><th>On</th><th>Name</th><th>Metric</th><th>Target</th><th>Condition</th><th>For (s)</th><th>Now</th><th>Webhook</th><th></th></tr></thead><tbody>' + rules.map((r, i) => {\n      const m = metrics[r.metric] || {};\n      return '<tr data-i=\"' + i + '\"><td><input type=\"checkbox\" name=\"enabled\"' + (r.enabled ? ' checked' : '') + ctl + '></td><td><input type=\"text\" name=\"name\" value=\"' + esc(r.name) + '\" style=\"width:190px\"' + ctl + '></td>' +\n        '<td><select name=\"metric\"' + ctl + '>' + Object.entries(metrics).map(([k, x]) => '<option value=\"' + k + '\"' + (k === r.metric ? ' selected' : '') + '>' + esc(x.label) + '</option>').join('') + '</select></td>' +\n        '<td>' + (m.target ? '<input type=\"text\" name=\"target\" value=\"' + esc(r.target || '') + '\" placeholder=\"' + esc(m.target) + '\" style=\"width:130px\"' + ctl + '>' : '<span class=\"faint\">–</span>') + '</td>' +\n        '<td style=\"white-space:nowrap\"><select name=\"op\"' + ctl + '><option' + (r.op === '>' ? ' selected' : '') + '>&gt;</option><option' + (r.op === '<' ? ' selected' : '') + '>&lt;</option></select> <input type=\"number\" name=\"value\" value=\"' + r.value + '\" style=\"width:80px\"' + ctl + '> <span class=\"muted\">' + esc(m.unit || '') + '</span></td>' +\n        '<td><input type=\"number\" name=\"forSec\" value=\"' + r.forSec + '\" style=\"width:70px\"' + ctl + '></td>' +\n        '<td class=\"num\">' + (r.state ? (r.state.firing ? '<span class=\"chip crit\"><i></i>' + esc(r.state.value) + '</span>' : '<span class=\"muted\">' + esc(r.state.value == null ? '–' : r.state.value) + '</span>') : '') + '</td>' +\n        '<td><input type=\"checkbox\" name=\"webhook\"' + (r.webhook ? ' checked' : '') + ctl + '></td><td>' + (RW.canControl() ? '<button class=\"icon-btn\" data-rmrule=\"' + i + '\" title=\"Delete\">' + icon('trash') + '</button>' : '') + '</td></tr>';\n    }).join('') + '</tbody></table>' + (dirty ? '<div class=\"muted\" style=\"padding:8px\">Unsaved changes.</div>' : ''));\n  },\n  update(s) {\n    if (!dirty && rules && s.seq % 5 === 0) RW.api('/api/alerts').then(r => { if (!dirty) { rules = r.rules; this.draw(); } }).catch(() => {});\n    const h = RW.events.filter(e => e.type.startsWith('alert')).slice(-60).reverse();\n    setH('ar-h', h.length ? h.map(RW.evRow).join('') : '<div class=\"empty\">No alerts have fired yet.</div>');\n  },\n};\n\n// ======================= Timeline =======================\nconst TTYPES = [['proc', 'Processes'], ['port', 'Ports'], ['net', 'New hosts'], ['finding', 'Security'], ['alert', 'Alerts'], ['action', 'Actions'], ['lan', 'LAN'], ['system', 'System']];\nlet tlTypes = new Set(TTYPES.map(t => t[0])), tlQ = '', tlSev = 'all', tlLoaded = false;\nRW.pages.timeline = {\n  title: 'Timeline', sub: 'everything that changed, newest first (kept on disk)',\n  topExtra: () => '<a class=\"btn sm ghost\" href=\"/api/timeline?limit=5000&format=csv\" download>' + icon('download') + 'CSV</a>',\n  mount(root) {\n    root.innerHTML = '<article class=\"card\"><div class=\"toolbar\"><input type=\"search\" id=\"tlq\" placeholder=\"Search events\" value=\"' + esc(tlQ) + '\"><div class=\"seg\" id=\"tlt\">' + TTYPES.map(([k, l]) => '<button data-tlt=\"' + k + '\" class=\"' + (tlTypes.has(k) ? 'on' : '') + '\">' + l + '</button>').join('') + '</div><div class=\"seg\" id=\"tls\">' + [['all', 'All'], ['warn', 'Warnings'], ['alert', 'Critical']].map(([k, l]) => '<button data-tls=\"' + k + '\" class=\"' + (tlSev === k ? 'on' : '') + '\">' + l + '</button>').join('') + '</div><span class=\"grow\"></span><span class=\"muted\" id=\"tln\"></span></div><div id=\"tlb\"></div></article>';\n    if (!tlLoaded) RW.api('/api/timeline?limit=3000').then(list => { const ids = new Set(RW.events.map(e => e.id)); RW.events = list.reverse().filter(e => !ids.has(e.id)).concat(RW.events).sort((a, b) => a.id - b.id); tlLoaded = true; this.draw(); }).catch(() => {});\n    root.addEventListener('input', e => { if (e.target.id === 'tlq') { tlQ = e.target.value.trim().toLowerCase(); this.draw(); } });\n    root.addEventListener('click', e => {\n      const t = e.target.closest('[data-tlt]'); if (t) { const k = t.dataset.tlt; if (e.shiftKey || e.ctrlKey) { tlTypes = new Set([k]); } else if (tlTypes.has(k)) tlTypes.delete(k); else tlTypes.add(k); RW.$$('#tlt button').forEach(b => b.classList.toggle('on', tlTypes.has(b.dataset.tlt))); this.draw(); }\n      const s = e.target.closest('[data-tls]'); if (s) { tlSev = s.dataset.tls; RW.$$('#tls button').forEach(b => b.classList.toggle('on', b === s)); this.draw(); }\n    });\n    if (!this.bound) { RW.on('events', () => { if (RW.page === 'timeline') this.draw(); }); this.bound = true; }\n    this.draw();\n  },\n  draw() {\n    const l = RW.events.filter(e => tlTypes.has(e.type.split('.')[0]) && (tlSev === 'all' || (tlSev === 'warn' ? e.sev !== 'info' : e.sev === 'alert')) && (!tlQ || (e.title + ' ' + (e.detail || '') + ' ' + (e.name || '')).toLowerCase().includes(tlQ)));\n    setH('tln', l.length + ' events');\n    let day = '';\n    setH('tlb', l.slice(-600).reverse().map(e => { const d = new Date(e.t).toDateString(); const sep = d !== day ? '<h3>' + esc((day = d) === new Date().toDateString() ? 'Today' : d) + '</h3>' : ''; return sep + RW.evRow(e); }).join('') || '<div class=\"empty\">No events match.</div>');\n  },\n  update() {},\n};\n})();\n","public/js/pages-net.js":"'use strict';\n/* Pages: Network, Security, Net Lab. */\n(() => {\nconst { esc, f: F, icon, setH } = RW;\nconst rdns = RW.rdns = new Map();\nlet rdnsBusy = false;\nfunction resolveIps(ips) {\n  if (rdnsBusy || !RW.settings.resolveHostnames) return;\n  const want = [...new Set(ips)].filter(ip => !rdns.has(ip) && /^(\\d+\\.){3}\\d+$|:/.test(ip)).slice(0, 50);\n  if (!want.length) return;\n  rdnsBusy = true; want.forEach(ip => rdns.set(ip, ''));\n  RW.api('/api/rdns?ips=' + want.join(',')).then(r => { for (const [ip, n] of Object.entries(r)) rdns.set(ip, n); }).catch(() => {}).finally(() => { rdnsBusy = false; });\n}\nconst ipKind = ip => {\n  ip = String(ip || '').replace(/^::ffff:/i, '');\n  if (ip === '::1' || ip.startsWith('127.')) return 'loopback';\n  if (/^(10\\.|192\\.168\\.|172\\.(1[6-9]|2\\d|3[01])\\.)/.test(ip) || /^f[cd]/i.test(ip)) return 'private';\n  if (ip.startsWith('169.254.') || /^fe[89ab]/i.test(ip)) return 'link-local';\n  if (/^(22[4-9]|23\\d)\\./.test(ip) || /^ff/i.test(ip)) return 'multicast';\n  if (ip === '0.0.0.0' || ip === '::' || ip === '*') return 'any';\n  return 'public';\n};\nRW.ipKind = ipKind;\nconst kindChip = k => '<span class=\"chip ' + (k === 'public' ? 'info' : k === 'private' ? 'good' : '') + '\"><i></i>' + k + '</span>';\n\n// ======================= Network =======================\nconst NTABS = [['overview', 'Overview'], ['connections', 'Connections'], ['listening', 'Listening ports'], ['lan', 'LAN & neighbors'], ['routing', 'Routes & DNS'], ['wifi', 'Wi-Fi & firewall']];\nlet net = null, netTimer = null, nTab = 'overview';\nconst cf = { q: '', state: 'all', hideLoop: true, group: 'none' };\nlet knownDevs = [];\nfunction loadNet(fresh) {\n  RW.api('/api/dev').then(d => { knownDevs = d.devices || []; }).catch(() => {});\n  return RW.api('/api/netinfo' + (fresh ? '?fresh=1' : '')).then(n => { net = n; RW.renderAll(); }).catch(e => { net = { error: e.message }; RW.renderAll(); });\n}\nRW.pages.network = {\n  title: 'Network', sub: 'adapters, packets, connections, ports, neighbors, routes', keepOnParams: true,\n  topExtra: () => '<a class=\"btn sm ghost\" href=\"/api/export?what=connections&format=csv\" download>' + icon('download') + 'Connections CSV</a>',\n  mount(root, params) {\n    nTab = params.tab || nTab;\n    root.innerHTML = '<div class=\"toolbar\"><div class=\"seg\" id=\"ntabs\">' + NTABS.map(([k, l]) => '<button data-ntab=\"' + k + '\" class=\"' + (nTab === k ? 'on' : '') + '\">' + l + '</button>').join('') + '</div></div><div id=\"nbody\"></div>';\n    this.build(); loadNet();\n    clearInterval(netTimer); netTimer = setInterval(() => { if (RW.page === 'network' && ['lan', 'routing', 'wifi'].includes(nTab)) loadNet(); }, 15000);\n    root.addEventListener('click', e => {\n      const t = e.target.closest('[data-ntab]'); if (t) { nTab = t.dataset.ntab; RW.$$('#ntabs button').forEach(b => b.classList.toggle('on', b === t)); this.build(); RW.renderAll(); }\n      const cs = e.target.closest('[data-cstate]'); if (cs) { cf.state = cs.dataset.cstate; RW.$$('#cstate button').forEach(b => b.classList.toggle('on', b === cs)); RW.renderAll(); }\n      const cg = e.target.closest('[data-cgroup]'); if (cg) { cf.group = cg.dataset.cgroup; RW.$$('#cgroup button').forEach(b => b.classList.toggle('on', b === cg)); RW.renderAll(); }\n      if (e.target.closest('#cloop')) { cf.hideLoop = !cf.hideLoop; e.target.closest('#cloop').classList.toggle('on', cf.hideLoop); RW.renderAll(); }\n      if (e.target.closest('#nrefresh')) loadNet(true);\n      if (e.target.closest('#ldisc')) { RW.go('lab', { tool: 'lan' }); }\n      const wk = e.target.closest('[data-wake]'); if (wk) { RW.tool('wol', { mac: wk.dataset.wake }).then(() => RW.toast('Magic packet sent to ' + wk.dataset.wake, 'ok')).catch(er => RW.toast(er.message, 'err')); }\n      const sc = e.target.closest('[data-scanhost]'); if (sc) RW.go('lab', { tool: 'scan', target: sc.dataset.scanhost });\n    });\n    root.addEventListener('input', e => { if (e.target.id === 'cq') { cf.q = e.target.value.trim().toLowerCase(); RW.renderAll(); } });\n  },\n  onParams(p) { if (p.tab && p.tab !== nTab) { nTab = p.tab; RW.$$('#ntabs button').forEach(b => b.classList.toggle('on', b.dataset.ntab === nTab)); this.build(); } },\n  unmount() { clearInterval(netTimer); },\n  build() {\n    const b = document.getElementById('nbody'); b.__h = null;\n    if (nTab === 'overview') {\n      b.innerHTML = '<div class=\"grid g3\"><article class=\"card\"><header><h2>Throughput</h2></header><div class=\"chartbox\" style=\"min-height:150px\"><canvas class=\"chart\" id=\"n-net\"></canvas></div></article><article class=\"card\"><header><h2>Packets</h2></header><div class=\"chartbox\" style=\"min-height:150px\"><canvas class=\"chart\" id=\"n-pk\"></canvas></div></article><article class=\"card\"><header><h2>Latency</h2><span class=\"right muted\" id=\"n-pt\"></span></header><div class=\"chartbox\" style=\"min-height:150px\"><canvas class=\"chart\" id=\"n-ping\"></canvas></div></article></div>' +\n        '<div class=\"grid g4\" id=\"n-tiles\"></div><article class=\"card\"><header><h2>Adapters</h2></header><div class=\"tw\" id=\"n-if\"></div></article>';\n      RW.chart('n-net', RW.preset('net')); RW.chart('n-pk', RW.preset('pkts')); RW.chart('n-ping', RW.preset('ping'));\n    } else if (nTab === 'connections') {\n      b.innerHTML = '<article class=\"card\"><div class=\"toolbar\"><input type=\"search\" id=\"cq\" placeholder=\"Filter by process, IP, host name, port or state\" value=\"' + esc(cf.q) + '\"><div class=\"seg\" id=\"cstate\">' + [['all', 'All'], ['ESTABLISHED', 'Established'], ['TIME_WAIT', 'Time wait'], ['CLOSE_WAIT', 'Close wait'], ['SYN_SENT', 'SYN sent'], ['other', 'Other']].map(([k, l]) => '<button data-cstate=\"' + k + '\" class=\"' + (cf.state === k ? 'on' : '') + '\">' + l + '</button>').join('') + '</div><div class=\"seg\" id=\"cgroup\">' + [['none', 'List'], ['app', 'By app'], ['host', 'By remote host']].map(([k, l]) => '<button data-cgroup=\"' + k + '\" class=\"' + (cf.group === k ? 'on' : '') + '\">' + l + '</button>').join('') + '</div><button class=\"btn sm' + (cf.hideLoop ? ' on' : '') + '\" id=\"cloop\">Hide loopback</button><span class=\"grow\"></span><span class=\"muted\" id=\"ccount\"></span></div><div class=\"tw\" id=\"cbody\" style=\"max-height:calc(100vh - 230px)\"></div></article>';\n    } else if (nTab === 'listening') {\n      b.innerHTML = '<article class=\"card\"><header><h2>Listening ports</h2><span class=\"right muted\" id=\"lsum\"></span></header><div class=\"tw\" id=\"lbody\"></div></article>';\n    } else if (nTab === 'lan') {\n      b.innerHTML = '<div class=\"toolbar\"><button class=\"btn primary\" id=\"ldisc\">' + icon('radar') + 'Discover devices (Net Lab)</button><button class=\"btn\" id=\"nrefresh\">' + icon('refresh') + 'Refresh</button><span class=\"muted\">ARP table updates as your PC talks to devices. Discovery probes your subnet actively.</span></div><div class=\"grid g2\"><article class=\"card\"><header><h2>ARP / neighbor table</h2><span class=\"right muted\" id=\"arpc\"></span></header><div class=\"tw\" id=\"arp\"></div></article><article class=\"card\"><header><h2>Known devices</h2><span class=\"right muted\">from LAN discovery runs</span></header><div class=\"tw\" id=\"known\"></div></article></div>';\n    } else if (nTab === 'routing') {\n      b.innerHTML = '<div class=\"toolbar\"><button class=\"btn\" id=\"nrefresh\">' + icon('refresh') + 'Refresh</button></div><div class=\"grid g2\"><article class=\"card\"><header><h2>DNS servers</h2></header><div id=\"dnss\"></div><h3>Default gateway</h3><div id=\"gw\"></div></article><article class=\"card\"><header><h2>DNS cache</h2><span class=\"right\"><button class=\"btn sm\" id=\"dcl\">' + icon('refresh') + 'Load</button></span></header><div class=\"tw\" id=\"dcache\" style=\"max-height:420px\"><div class=\"empty\">Load to see recently resolved names.</div></div></article></div><article class=\"card\"><header><h2>Routing table</h2><span class=\"right muted\" id=\"rtc\"></span></header><div class=\"tw\" id=\"routes\"></div></article>';\n      b.querySelector('#dcl').onclick = () => RW.api('/api/dnscache').then(list => { setH('dcache', list.length ? RW.table('dnsc', [{ k: 'name', label: 'Name' }, { k: 'type', label: 'Type', fmt: r => ({ 1: 'A', 28: 'AAAA', 5: 'CNAME', 12: 'PTR', 15: 'MX', 16: 'TXT', 33: 'SRV', 65: 'HTTPS' })[r.type] || r.type }, { k: 'data', label: 'Data', cls: 'mono' }, { k: 'ttl', label: 'TTL', num: true }], list, { sortK: 'name', sortD: 1 }) : '<div class=\"empty\">The DNS client cache is empty or not readable for this account (Windows only; some builds need an elevated terminal).</div>'); }).catch(e => RW.toast(e.message, 'err'));\n    } else if (nTab === 'wifi') {\n      b.innerHTML = '<div class=\"toolbar\"><button class=\"btn\" id=\"nrefresh\">' + icon('refresh') + 'Refresh</button></div><div class=\"grid g2\"><article class=\"card\"><header><h2>Wi-Fi</h2></header><div id=\"wifi\"></div></article><article class=\"card\"><header><h2>Firewall & antivirus</h2></header><div id=\"fw\"></div><h3>Network profiles</h3><div id=\"prof\"></div></article></div>';\n    }\n  },\n  update(s) {\n    const n = s.net;\n    if (nTab === 'overview') {\n      setH('n-pt', esc(n.ping ? n.ping.target : 'off'));\n      const t = n.tcp || {};\n      setH('n-tiles', [['Download', F.bits(n.rx), F.num(n.rxp) + ' pkt/s'], ['Upload', F.bits(n.tx), F.num(n.txp) + ' pkt/s'], ['TCP', F.num(t.est) + ' est.', 'retransmits ' + F.pct(t.retransPct, 2) + ' · ' + F.num(t.segs) + ' seg/s'], ['Sockets', F.num(s.ports.total) + ' conns', s.ports.listen.length + ' listening · ephemeral ' + F.num(n.ephemeral)]].map(x => '<div class=\"kpi\" style=\"cursor:default\"><div class=\"kl\">' + x[0] + '</div><div class=\"kv2\">' + RW.vu(x[1]) + '</div><div class=\"ks\">' + esc(x[2]) + '</div></div>').join(''));\n      setH('n-if', RW.table('ifs', [\n        { k: 'name', label: 'Adapter', fmt: i => '<b>' + esc(i.name) + '</b>' + (i.virtual ? '<span class=\"tag\">virtual</span>' : '') + (i.wireless ? '<span class=\"tag\">wireless</span>' : '') + (i.desc && i.desc !== i.name ? '<div class=\"muted\" style=\"font-size:12px\">' + esc(i.desc) + '</div>' : '') },\n        { k: 'ipv4', label: 'Address', sort: i => i.ipv4[0] || '', fmt: i => '<span class=\"mono\">' + esc(i.ipv4.join(', ')) + '</span><div class=\"muted mono\" style=\"font-size:11px\">' + esc((i.ipv6 || []).slice(0, 1).join('')) + '</div>' },\n        { k: 'mac', label: 'MAC / MTU', fmt: i => '<span class=\"mono\">' + esc(i.mac || '') + '</span><div class=\"muted\" style=\"font-size:12px\">' + (i.mtu ? 'MTU ' + i.mtu : '') + '</div>' },\n        { k: 'speed', label: 'Link', num: true, fmt: i => F.link(i.speed) },\n        { k: 'rx', label: '↓', num: true, fmt: i => F.bits(i.rx) }, { k: 'tx', label: '↑', num: true, fmt: i => F.bits(i.tx) },\n        { k: 'rxp', label: 'Pkts in/s', num: true, fmt: i => F.num(i.rxp) }, { k: 'txp', label: 'Pkts out/s', num: true, fmt: i => F.num(i.txp) },\n        { k: 'rxTot', label: 'Total ↓', num: true, fmt: i => F.b(i.rxTot, 1) }, { k: 'txTot', label: 'Total ↑', num: true, fmt: i => F.b(i.txTot, 1) },\n        { k: 'errors', label: 'Err / drop', num: true, fmt: i => F.num(i.errors) + ' / ' + F.num(i.drops) },\n      ], n.ifaces, { sortK: 'rxTot' }));\n    } else if (nTab === 'connections') {\n      let C = s.ports.conns.filter(c => {\n        if (cf.hideLoop && ipKind(c.rh) === 'loopback') return false;\n        if (cf.state !== 'all') { if (cf.state === 'other') { if (/^(ESTABLISHED|TIME_WAIT|CLOSE_WAIT|SYN_SENT)$/.test(c.state)) return false; } else if (c.state !== cf.state) return false; }\n        if (cf.q && !(RW.pname(s, c.pid) + ' ' + c.lh + ':' + c.lp + ' ' + c.rh + ':' + c.rp + ' ' + (rdns.get(c.rh) || '') + ' ' + c.state + ' ' + c.pid + ' ' + RW.svc(c.rp)).toLowerCase().includes(cf.q)) return false;\n        return true;\n      });\n      const counts = {}; for (const c of s.ports.conns) counts[c.state] = (counts[c.state] || 0) + 1;\n      setH('ccount', C.length + ' shown · ' + Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => k.toLowerCase().replace('_', ' ') + ' ' + v).join(' · '));\n      resolveIps(C.slice(0, 200).filter(c => ipKind(c.rh) === 'public').map(c => c.rh));\n      if (cf.group === 'app' || cf.group === 'host') {\n        const g = new Map();\n        for (const c of C) { const k = cf.group === 'app' ? RW.pname(s, c.pid) : c.rh; let e = g.get(k); if (!e) { e = { key: k, n: 0, est: 0, other: new Set(), pid: c.pid, ports: new Set() }; g.set(k, e); } e.n++; if (c.state === 'ESTABLISHED') e.est++; e.other.add(cf.group === 'app' ? c.rh : RW.pname(s, c.pid)); e.ports.add(c.rp); }\n        setH('cbody', RW.table('cg-' + cf.group, [\n          { k: 'key', label: cf.group === 'app' ? 'App' : 'Remote host', fmt: e => '<b class=\"mono\">' + esc(e.key) + '</b>' + (cf.group === 'host' ? ' <span class=\"muted\">' + esc(rdns.get(e.key) || '') + '</span> ' + kindChip(ipKind(e.key)) : '') },\n          { k: 'n', label: 'Connections', num: true }, { k: 'est', label: 'Established', num: true },\n          { k: 'other', label: cf.group === 'app' ? 'Remote hosts' : 'Apps', sort: e => e.other.size, fmt: e => '<span class=\"muted\">' + e.other.size + '</span> ' + esc([...e.other].slice(0, 4).join(', ')) },\n          { k: 'ports', label: 'Remote ports', nosort: true, fmt: e => '<span class=\"mono muted\">' + esc([...e.ports].slice(0, 6).join(', ')) + '</span>' },\n        ], [...g.values()], { sortK: 'n', row: e => (cf.group === 'app' ? 'class=\"click\" data-pid=\"' + e.pid + '\"' : '') }));\n        return;\n      }\n      setH('cbody', RW.table('conns', [\n        { k: 'pid', label: 'Process', sort: c => RW.pname(s, c.pid), fmt: c => '<span class=\"pn\">' + esc(RW.pname(s, c.pid)) + '</span><span class=\"sub\">' + c.pid + '</span>' },\n        { k: 'proto', label: 'Proto' },\n        { k: 'lp', label: 'Local', fmt: c => '<span class=\"mono\">' + esc(F.hp(c.lh, c.lp)) + '</span>' },\n        { k: 'rh', label: 'Remote', fmt: c => '<span class=\"mono\">' + esc(F.hp(c.rh, c.rp)) + '</span>' + (RW.svc(c.rp) ? ' <span class=\"muted\">' + esc(RW.svc(c.rp)) + '</span>' : '') + (rdns.get(c.rh) ? '<div class=\"muted\" style=\"font-size:12px\">' + esc(rdns.get(c.rh)) + '</div>' : '') },\n        { k: 'kind', label: 'Scope', sort: c => ipKind(c.rh), fmt: c => kindChip(ipKind(c.rh)) },\n        { k: 'state', label: 'State', fmt: c => esc(c.state.toLowerCase().replace(/_/g, ' ')) },\n      ], C, { max: 600, row: c => 'class=\"click\" data-pid=\"' + c.pid + '\"' }));\n    } else if (nTab === 'listening') {\n      const L = s.ports.listen;\n      setH('lsum', L.filter(l => l.proto === 'TCP').length + ' TCP · ' + L.filter(l => l.proto === 'UDP').length + ' UDP · ' + L.filter(l => l.scope === 'all').length + ' on all interfaces');\n      setH('lbody', RW.listenRows(s, L, false));\n    } else if (nTab === 'lan') {\n      const arp = (net && net.arp) || [];\n      setH('arpc', arp.length + ' entries');\n      setH('arp', net && net.error ? '<div class=\"empty\">' + esc(net.error) + '</div>' : RW.table('arp', [{ k: 'ip', label: 'IP', fmt: a => '<span class=\"mono\">' + esc(a.ip) + '</span>' }, { k: 'mac', label: 'MAC', fmt: a => '<span class=\"mono\">' + esc(a.mac) + '</span>' + (/^.[26AE]/i.test(a.mac) ? ' <span class=\"tag\" title=\"locally administered / randomized\">random</span>' : '') }, { k: 'state', label: 'State', fmt: a => '<span class=\"muted\">' + esc(a.state) + '</span>' }, { k: 'iface', label: 'Interface' }, { k: 'x', label: '', nosort: true, fmt: a => (RW.canControl() ? '<button class=\"btn sm\" data-scanhost=\"' + esc(a.ip) + '\">scan</button> <button class=\"btn sm\" data-wake=\"' + esc(a.mac) + '\">wake</button>' : '') }], arp.filter(a => !/^(ff|224\\.|239\\.|255\\.)/i.test(a.ip) && !/^(01-00-5E|33-33)/i.test(a.mac)), { sortK: 'ip', sortD: 1 }));\n      setH('known', knownDevs.length ? RW.table('known', [{ k: 'ip', label: 'IP', fmt: x => '<span class=\"mono\">' + esc(x.ip) + '</span>' }, { k: 'name', label: 'Name', fmt: x => esc(x.name || '') }, { k: 'mac', label: 'MAC', fmt: x => '<span class=\"mono\">' + esc(x.mac) + '</span>' }, { k: 'firstSeen', label: 'First seen', fmt: x => F.date(x.firstSeen) }, { k: 'lastSeen', label: 'Last seen', fmt: x => F.ago(x.lastSeen) }], knownDevs, { sortK: 'lastSeen' }) : '<div class=\"empty\">Run a discovery to build your device inventory. New devices show up in the timeline.</div>');\n    } else if (nTab === 'routing') {\n      if (!net) return;\n      setH('dnss', (net.dns || []).filter(d => d.servers.length).map(d => '<div class=\"brow\"><span class=\"bl\">' + esc(d.iface) + ' <span class=\"muted\">' + esc(d.family || '') + '</span></span><span class=\"bv mono\">' + esc(d.servers.join(', ')) + '</span></div>').join('') || '<div class=\"empty\">none</div>');\n      const gws = (net.routes || []).filter(r => /^(0\\.0\\.0\\.0\\/0|::\\/0)$/.test(r.dest));\n      setH('gw', gws.map(r => '<div class=\"brow\"><span class=\"bl mono\">' + esc(r.gw) + '</span><span class=\"bv\">' + esc(r.iface) + ' · metric ' + r.metric + '</span></div>').join('') || '<div class=\"empty\">none</div>');\n      setH('rtc', (net.routes || []).length + ' routes');\n      setH('routes', RW.table('routes', [{ k: 'dest', label: 'Destination', fmt: r => '<span class=\"mono\">' + esc(r.dest) + '</span>' }, { k: 'gw', label: 'Gateway', fmt: r => '<span class=\"mono\">' + esc(r.gw) + '</span>' }, { k: 'iface', label: 'Interface' }, { k: 'metric', label: 'Metric', num: true }, { k: 'family', label: 'Family' }], net.routes || [], { sortK: 'metric', sortD: 1 }));\n    } else if (nTab === 'wifi') {\n      if (!net) return;\n      const w = (net.wifi || []).filter(x => x.ssid || x.signal);\n      setH('wifi', w.length ? w.map(x => RW.kv([['Interface', esc(x.name)], ['State', esc(x.state || '')], ['SSID', esc(x.ssid || '')], ['BSSID', '<span class=\"mono\">' + esc(x.bssid || '') + '</span>'], ['Signal', esc(x.signal || '') + (x.quality ? ' (quality ' + esc(x.quality) + ')' : '')], ['Radio', esc((x.radio || '') + (x.band ? ' · ' + x.band : '') + (x.channel ? ' · ch ' + x.channel : ''))], ['Rate', x.rx ? esc(x.rx + ' / ' + x.tx + ' Mbps') : ''], ['Security', esc((x.auth || '') + (x.cipher ? ' · ' + x.cipher : ''))]])).join('<hr style=\"border:0;border-top:1px solid var(--line)\">') : '<div class=\"empty\">No connected Wi-Fi interface (or the OS hides Wi-Fi details from this account).</div>');\n      setH('fw', ((net.firewall || []).map(f => '<div class=\"brow\"><span class=\"bl\">' + esc(f.name) + '</span><span class=\"bv\">' + (f.enabled ? '<span class=\"chip good\"><i></i>on</span>' : '<span class=\"chip crit\"><i></i>off</span>') + (f.inbound ? ' <span class=\"muted\">in: ' + esc(f.inbound) + '</span>' : '') + '</span></div>').join('') || '<div class=\"muted\">Firewall state not readable on this OS.</div>') +\n        (net.av || []).map(a => '<div class=\"brow\"><span class=\"bl\">' + esc(a.name) + '</span><span class=\"bv\">' + (a.enabled ? '<span class=\"chip good\"><i></i>active</span>' : '<span class=\"chip\"><i></i>passive</span>') + '</span></div>').join(''));\n      setH('prof', (net.profiles || []).map(p => '<div class=\"brow\"><span class=\"bl\">' + esc(p.name) + ' <span class=\"muted\">' + esc(p.iface) + '</span></span><span class=\"bv\">' + esc(p.category) + ' · ' + esc(p.ipv4 || '') + '</span></div>').join('') || '<div class=\"muted\">n/a</div>');\n    }\n  },\n};\n\n// ======================= Security =======================\nlet secData = null, secTimer = null;\nconst loadSec = () => RW.api('/api/security').then(d => { secData = d; RW.renderAll(); }).catch(() => {});\nRW.pages.security = {\n  title: 'Security', sub: 'exposure audit, posture and suspicious activity',\n  topExtra: () => '<a class=\"btn sm ghost\" href=\"/api/export?what=findings&format=csv\" download>' + icon('download') + 'Findings CSV</a>',\n  mount(root) {\n    root.innerHTML = '<div class=\"grid g3\"><article class=\"card\"><header><h2>Exposure score</h2></header><div id=\"sc-g\"></div></article><article class=\"card\"><header><h2>Posture</h2></header><div id=\"sc-p\"></div></article><article class=\"card\"><header><h2>Signatures</h2><span class=\"right muted\">Windows Authenticode</span></header><div id=\"sc-sig\"></div></article></div>' +\n      '<article class=\"card\" style=\"margin-bottom:14px\"><header><h2>Findings</h2><span class=\"right muted\" id=\"sc-fc\"></span></header><div id=\"sc-f\"></div></article>' +\n      '<div class=\"grid g2\"><article class=\"card\"><header><h2>New remote hosts</h2><span class=\"right muted\">first contact per app</span></header><div id=\"sc-h\" style=\"max-height:420px;overflow:auto\"></div></article><article class=\"card\"><header><h2>Security events</h2></header><div id=\"sc-e\" style=\"max-height:420px;overflow:auto\"></div></article></div>';\n    loadSec(); clearInterval(secTimer); secTimer = setInterval(() => { if (RW.page === 'security') loadSec(); }, 5000);\n    root.addEventListener('click', async e => {\n      const b = e.target.closest('[data-fixport]');\n      if (b && await RW.confirm('Free port ' + b.dataset.fixport + '?', 'Ends the process that listens on it.', { danger: true, ok: 'Kill' })) RW.action({ type: 'port.kill', port: +b.dataset.fixport });\n    });\n  },\n  unmount() { clearInterval(secTimer); },\n  update(s) {\n    const sec = s.security, inv = (RW.st && RW.st.inventory) || {};\n    setH('sc-g', '<div style=\"max-width:240px;margin:0 auto\">' + RW.gauge(sec.score, 100, RW.scoreColor(sec.score), sec.score + '/100', 'higher is better') + '</div><div style=\"display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:8px\">' + ['critical', 'high', 'medium', 'low'].map(k => RW.sev(k) + '<b class=\"num\">' + sec.counts[k] + '</b>').join(' ') + '</div>');\n    const n = secData && secData.net;\n    setH('sc-p', RW.kv([\n      ['Firewall', n && n.firewall && n.firewall.length ? n.firewall.map(f => esc(f.name) + ' ' + (f.enabled ? '<span class=\"chip good\"><i></i>on</span>' : '<span class=\"chip crit\"><i></i>off</span>')).join(' ') : '<span class=\"muted\">checking…</span>'],\n      ['Antivirus', n && n.defender ? (n.defender.realtime ? '<span class=\"chip good\"><i></i>Defender real-time on</span>' : '<span class=\"muted\">Defender passive</span>') : '<span class=\"muted\">n/a</span>'],\n      ['Network', n && n.profiles ? esc(n.profiles.map(p => p.name + ' (' + p.category + ')').join(', ')) : ''],\n      ['Secure Boot', inv.secureBoot == null ? '' : inv.secureBoot ? '<span class=\"chip good\"><i></i>on</span>' : '<span class=\"chip warn\"><i></i>off</span>'],\n      ['RigWatch', esc(RW.st ? RW.st.bind : '') + (RW.auth.local ? '' : ' (remote view)')],\n      ['Elevated', inv.isAdmin ? 'yes' : 'no (some processes are hidden)'],\n    ]));\n    const sigs = s.procs.filter(p => p.sig && p.sig.status !== 'Valid');\n    setH('sc-sig', RW.st && RW.st.caps && RW.st.caps.signatures ? (sigs.length ? RW.table('sigs', [{ k: 'name', label: 'Process', fmt: p => '<span class=\"pn\">' + esc(p.name) + '</span>' }, { k: 'sig', label: 'Status', sort: p => p.sig.status, fmt: p => '<span class=\"chip ' + (p.sig.status === 'NotSigned' ? 'warn' : 'crit') + '\"><i></i>' + esc(p.sig.status) + '</span>' }, { k: 'conns', label: 'Conns', num: true }], sigs, { row: p => 'class=\"click\" data-pid=\"' + p.pid + '\"', sortK: 'conns' }) : '<div class=\"empty\">Every checked network-facing binary has a valid signature (' + s.procs.filter(p => p.sig).length + ' checked).</div>') : '<div class=\"empty\">Signature checks are Windows-only.</div>');\n    const F2 = secData ? secData.findings : sec.top;\n    setH('sc-fc', F2.length + ' findings');\n    setH('sc-f', F2.length ? F2.map(x => '<div class=\"finding\">' + RW.sev(x.sev) + '<div class=\"ft\">' + esc(x.title) + '</div><div>' + (x.pid ? '<button class=\"btn sm\" data-pid=\"' + x.pid + '\">Process</button> ' : '') + (x.port && RW.canControl() && x.sev !== 'info' ? '<button class=\"btn sm danger\" data-fixport=\"' + x.port + '\">Free port</button>' : '') + '</div>' + (x.detail ? '<div class=\"fd\">' + esc(x.detail) + '</div>' : '') + (x.fix ? '<div class=\"ff\">' + icon('check') + ' ' + esc(x.fix) + '</div>' : '') + '</div>').join('') : '<div class=\"empty\">Nothing risky found. Nice.</div>');\n    const hosts = RW.events.filter(e => e.type === 'net.newhost').slice(-80).reverse();\n    setH('sc-h', hosts.length ? hosts.map(RW.evRow).join('') : '<div class=\"empty\">New remote hosts per app are recorded here as they appear.</div>');\n    const sev = RW.events.filter(e => /^(finding|alert|lan|port\\.open)/.test(e.type) || (e.type === 'proc.start' && e.sev !== 'info')).slice(-80).reverse();\n    setH('sc-e', sev.length ? sev.map(RW.evRow).join('') : '<div class=\"empty\">No security events yet.</div>');\n  },\n};\n\n// ======================= Net Lab =======================\nconst TOOLS = [\n  ['ping', 'Ping', 'activity', 'ICMP echo via the system ping', [['host', 'Host or IP', 'text', '1.1.1.1'], ['count', 'Count', 'number', '10'], ['v6', 'IPv6', 'check', false]]],\n  ['trace', 'Traceroute', 'layers', 'every hop to a host', [['host', 'Host or IP', 'text', 'github.com'], ['hops', 'Max hops', 'number', '30']]],\n  ['dns', 'DNS lookup', 'search', 'A, AAAA, MX, TXT, NS, SOA, CAA, PTR', [['name', 'Name (or IP for PTR)', 'text', 'github.com'], ['type', 'Type', 'select', ['ALL', 'A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA', 'CAA', 'SRV', 'PTR']], ['server', 'Resolver (optional)', 'text', '']]],\n  ['dnsbench', 'DNS benchmark', 'zap', 'which resolver is fastest for you', [['name', 'Domain', 'text', 'example.com']]],\n  ['scan', 'Port scanner', 'radar', 'TCP connect scan with banners', [['target', 'Host, IP, CIDR (/24) or range 10.0.0.1-50', 'text', '127.0.0.1'], ['ports', 'Ports: top, all, 1-1024, 22,80,443', 'text', 'top'], ['timeout', 'Timeout ms', 'number', '800'], ['concurrency', 'Parallel', 'number', '300'], ['banner', 'Grab banners', 'check', true]]],\n  ['tls', 'TLS inspector', 'lock', 'certificate chain, expiry, cipher', [['host', 'Host', 'text', 'github.com'], ['port', 'Port', 'number', '443'], ['sni', 'SNI (optional)', 'text', '']]],\n  ['http', 'HTTP probe', 'globe', 'timings, redirects, security headers', [['url', 'URL', 'text', 'https://github.com'], ['method', 'Method', 'select', ['GET', 'HEAD']]]],\n  ['lan', 'LAN discovery', 'wifi', 'find every device on your subnet', []],\n  ['wol', 'Wake-on-LAN', 'power', 'send a magic packet', [['mac', 'MAC address', 'text', '']]],\n  ['publicip', 'Public IP', 'eye', 'what the internet sees (asks ipify)', []],\n];\nlet labTool = 'ping', labJob = null, labPre = {};\nRW.pages.lab = {\n  title: 'Net Lab', sub: 'network tools that stream live. Only test hosts and networks you own or are allowed to test.', keepOnParams: true,\n  mount(root, params) {\n    labTool = params.tool && TOOLS.some(t => t[0] === params.tool) ? params.tool : labTool; labPre = params;\n    root.innerHTML = '<div class=\"lab\"><article class=\"card toollist\" style=\"padding:8px\">' + TOOLS.map(t => '<a data-tool=\"' + t[0] + '\" class=\"' + (labTool === t[0] ? 'on' : '') + '\">' + icon(t[2]) + '<span>' + t[1] + '<small>' + t[3] + '</small></span></a>').join('') + '</article>' +\n      '<div><article class=\"card\" style=\"margin-bottom:14px\"><div id=\"lab-form\"></div><div class=\"progress hidden\" id=\"lab-prog\"><i></i></div><div class=\"term\" id=\"lab-term\"></div></article><div id=\"lab-res\"></div></div>' +\n      '<article class=\"card jobs\"><header><h2>Runs</h2></header><div class=\"joblist\" id=\"lab-jobs\"></div></article></div>';\n    this.form();\n    root.addEventListener('click', e => {\n      const t = e.target.closest('[data-tool]'); if (t) { labTool = t.dataset.tool; labPre = {}; RW.$$('.toollist a').forEach(a => a.classList.toggle('on', a === t)); this.form(); }\n      const j = e.target.closest('[data-job]'); if (j) { labJob = +j.dataset.job; const jj = RW.jobs.get(labJob); if (jj && !jj.lines.length) RW.api('/api/jobs/' + labJob).then(d => { jj.lines = d.lineList || []; jj.result = d.result; this.renderJob(); }); this.renderJob(); }\n      if (e.target.closest('#lab-run')) this.run();\n      if (e.target.closest('#lab-stop') && labJob) RW.api('/api/jobs/' + labJob + '/cancel', { method: 'POST' }).catch(er => RW.toast(er.message, 'err'));\n      const sh = e.target.closest('[data-scanhost]'); if (sh) { labTool = 'scan'; labPre = { target: sh.dataset.scanhost }; RW.$$('.toollist a').forEach(a => a.classList.toggle('on', a.dataset.tool === 'scan')); this.form(); }\n      const wk = e.target.closest('[data-wake]'); if (wk) RW.tool('wol', { mac: wk.dataset.wake }).then(() => RW.toast('Magic packet sent', 'ok')).catch(er => RW.toast(er.message, 'err'));\n    });\n    root.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.closest('#lab-form input')) this.run(); });\n    this.onJob = id => { if (RW.page !== 'lab') return; if (id === labJob) this.renderJob(); this.renderJobs(); };\n    if (!this.bound) { RW.on('job', id => this.onJob && this.onJob(id)); RW.on('tableview', () => { if (RW.page === 'lab') this.renderJob(); }); this.bound = true; }\n    RW.api('/api/jobs').then(list => { for (const s of list) if (!RW.jobs.has(s.id)) RW.jobs.set(s.id, { s, lines: [], result: null }); this.renderJobs(); });\n    if (params.run === '1') setTimeout(() => this.run(), 50);\n  },\n  onParams(p) { if (p.tool) { labTool = p.tool; labPre = p; RW.$$('.toollist a').forEach(a => a.classList.toggle('on', a.dataset.tool === labTool)); this.form(); } },\n  form() {\n    const T = TOOLS.find(t => t[0] === labTool);\n    document.getElementById('lab-form').innerHTML = '<header style=\"display:flex;align-items:center;gap:10px;margin-bottom:10px\"><h2 style=\"margin:0;font-size:15px\">' + T[1] + '</h2><span class=\"muted\">' + esc(T[3]) + '</span></header><div class=\"form\">' +\n      T[4].map(([k, l, type, def]) => type === 'check' ? '<label class=\"check\"><input type=\"checkbox\" name=\"' + k + '\"' + ((labPre[k] != null ? labPre[k] === 'true' : def) ? ' checked' : '') + '>' + esc(l) + '</label>'\n        : type === 'select' ? '<label class=\"field\">' + esc(l) + '<select name=\"' + k + '\">' + def.map(o => '<option' + (labPre[k] === o ? ' selected' : '') + '>' + o + '</option>').join('') + '</select></label>'\n          : '<label class=\"field\" style=\"flex:' + (k === 'target' || k === 'url' || k === 'ports' ? 2 : 1) + '\">' + esc(l) + '<input type=\"' + type + '\" name=\"' + k + '\" value=\"' + esc(labPre[k] != null ? labPre[k] : def) + '\"></label>').join('') +\n      '<button class=\"btn primary\" id=\"lab-run\"' + (RW.canControl() ? '' : ' disabled title=\"Read-only on this device\"') + '>' + icon('play') + 'Run</button><button class=\"btn\" id=\"lab-stop\">' + icon('stop') + 'Stop</button></div>' + (labTool === 'scan' || labTool === 'lan' ? '<div class=\"muted\" style=\"font-size:12px;margin-top:-4px\">Scanning networks you do not own or have permission to test may be illegal.</div>' : '');\n  },\n  async run() {\n    if (!RW.canControl()) return RW.toast('Read-only on this device', 'err');\n    const T = TOOLS.find(t => t[0] === labTool), params = {};\n    for (const [k, , type] of T[4]) { const el = document.querySelector('#lab-form [name=\"' + k + '\"]'); params[k] = type === 'check' ? el.checked : type === 'number' ? +el.value : el.value.trim(); }\n    try { const j = await RW.tool(labTool, params); labJob = j.id; this.renderJob(); this.renderJobs(); } catch (e) { RW.toast(e.message, 'err', 7000); }\n  },\n  renderJobs() { setH('lab-jobs', [...RW.jobs.values()].sort((a, b) => b.s.id - a.s.id).slice(0, 30).map(j => '<a data-job=\"' + j.s.id + '\" class=\"' + (j.s.id === labJob ? 'on' : '') + '\">' + esc(j.s.title || j.s.tool) + '<small>' + esc(j.s.status) + (j.s.started ? ' · ' + F.ago(j.s.started) : '') + '</small></a>').join('') || '<div class=\"empty\">No runs yet.</div>'); },\n  renderJob() {\n    const j = RW.jobs.get(labJob), term = document.getElementById('lab-term');\n    if (!term) return;\n    if (!j) { term.innerHTML = '<span class=\"dim\">Output streams here.</span>'; return; }\n    const atBottom = term.scrollHeight - term.scrollTop - term.clientHeight < 40;\n    term.innerHTML = j.lines.slice(-2500).map(l => '<span class=\"' + esc(l.cls) + '\">' + esc(l.text) + '</span>').join('\\n') + (j.s.status === 'running' ? '\\n<span class=\"dim\">…</span>' : '\\n<span class=\"dim\">[' + esc(j.s.status) + ']</span>');\n    if (atBottom) term.scrollTop = term.scrollHeight;\n    const pr = document.getElementById('lab-prog');\n    pr.classList.toggle('hidden', j.s.progress == null || j.s.status !== 'running'); pr.firstChild.style.width = (j.s.progress || 0) + '%';\n    setH('lab-res', j.result ? this.result(j.s.tool, j.result) : '');\n  },\n  result(tool, r) {\n    const card = (t, b) => '<article class=\"card\" style=\"margin-bottom:14px\"><header><h2>' + t + '</h2></header>' + b + '</article>';\n    if (tool === 'scan') return card('Open ports (' + r.open.length + ' of ' + r.probed + ' probed)', '<div class=\"tw\">' + RW.table('scanr', [{ k: 'host', label: 'Host', fmt: o => '<span class=\"mono\">' + esc(o.host) + '</span>' }, { k: 'port', label: 'Port', num: true }, { k: 'svc', label: 'Service', sort: o => RW.svc(o.port), fmt: o => '<span class=\"muted\">' + esc(RW.svc(o.port)) + '</span>' }, { k: 'ms', label: 'RTT', num: true, fmt: o => o.ms + ' ms' }, { k: 'banner', label: 'Banner', cls: 'mono wrap' }], r.open, { sortK: 'port', sortD: 1 }) + '</div>');\n    if (tool === 'tls') return card('Certificate chain', RW.kv([['Protocol', esc(r.protocol)], ['Cipher', esc(r.cipher ? r.cipher.name : '')], ['ALPN', esc(r.alpn || '–')], ['Trusted', r.authorized ? '<span class=\"chip good\"><i></i>yes</span>' : '<span class=\"chip crit\"><i></i>' + esc(r.authError) + '</span>'], ['Hostname', r.sni ? (r.hostnameOk ? '<span class=\"chip good\"><i></i>matches</span>' : '<span class=\"chip crit\"><i></i>' + esc(r.hostnameError) + '</span>') : '']]) +\n      r.chain.map((c, i) => '<h3>' + (i === 0 ? 'Leaf' : 'Issuer ' + i) + ': ' + esc(c.subject) + '</h3>' + RW.kv([['Issued by', esc(c.issuer)], ['Valid', esc(c.validFrom + ' → ' + c.validTo)], ['Expires in', '<span class=\"chip ' + (c.daysLeft < 14 ? 'crit' : c.daysLeft < 45 ? 'warn' : 'good') + '\"><i></i>' + c.daysLeft + ' days</span>'], ['Key', esc(c.key)], ['SAN', '<span class=\"mono\">' + esc(String(c.san).slice(0, 400)) + '</span>'], ['SHA-256', '<span class=\"mono\" style=\"font-size:11px\">' + esc(c.fingerprint256) + '</span>']])).join(''));\n    if (tool === 'http') {\n      const last = r.hops[r.hops.length - 1], t = last.timing, tot = Math.max(1, t.total);\n      const seg = [['DNS', t.dns, '--s4'], ['TCP', t.tcp, '--s3'], ['TLS', t.tls || 0, '--s7'], ['Server', t.ttfb, '--s1'], ['Download', Math.max(0, t.total - t.dns - t.tcp - (t.tls || 0) - t.ttfb), '--s2']];\n      return card('Response', RW.kv([['Final URL', esc(last.url)], ['Status', '<b>' + last.status + '</b> · HTTP/' + esc(last.httpVersion)], ['Title', esc(last.title || '')], ['Size', F.b(last.size)], ['Redirects', String(r.hops.length - 1)]]) +\n        '<h3>Timing (' + t.total + ' ms)</h3><div class=\"stack\" style=\"height:16px\">' + seg.map(s => '<i title=\"' + s[0] + ' ' + s[1] + ' ms\" style=\"width:' + (100 * s[1] / tot) + '%;background:var(' + s[2] + ')\"></i>').join('') + '</div><div class=\"legend\" style=\"margin-top:6px\">' + seg.map(s => '<span><i style=\"background:var(' + s[2] + ')\"></i>' + s[0] + ' <b>' + s[1] + ' ms</b></span>').join('') + '</div>' +\n        (/^https/.test(last.url) ? '<h3>Security headers</h3>' + r.checks.map(c => '<div class=\"brow\"><span class=\"bl\">' + (c.ok ? '<span class=\"chip good\"><i></i>present</span>' : '<span class=\"chip warn\"><i></i>missing</span>') + ' ' + esc(c.name) + '</span><span class=\"bv muted\">' + esc(c.why) + '</span></div>').join('') : '') +\n        '<h3>Headers</h3><div class=\"cmd\">' + esc(Object.entries(last.headers).map(([k, v]) => k + ': ' + v).join('\\n')) + '</div>');\n    }\n    if (tool === 'lan') return card('Devices (' + r.devices.length + ')', '<div class=\"tw\">' + RW.table('lanr', [\n      { k: 'ip', label: 'IP', sort: d => d.ip.split('.').map(x => x.padStart(3, '0')).join('.'), fmt: d => '<span class=\"mono\">' + esc(d.ip) + '</span>' + (d.self ? '<span class=\"tag dev\">this PC</span>' : '') + (d.gateway ? '<span class=\"tag\">gateway</span>' : '') },\n      { k: 'name', label: 'Name', fmt: d => esc(d.name || '') }, { k: 'mac', label: 'MAC', fmt: d => '<span class=\"mono\">' + esc(d.mac || '') + '</span>' + (d.randomMac ? ' <span class=\"tag\">random</span>' : '') },\n      { k: 'ports', label: 'Open ports', sort: d => d.ports.length, fmt: d => '<span class=\"mono\">' + esc(d.ports.join(', ')) + '</span>' }, { k: 'ms', label: 'RTT', num: true, fmt: d => (d.ms != null ? d.ms + ' ms' : 'arp') },\n      { k: 'x', label: '', nosort: true, fmt: d => (d.self ? '' : '<button class=\"btn sm\" data-scanhost=\"' + esc(d.ip) + '\">scan</button>' + (d.mac ? ' <button class=\"btn sm\" data-wake=\"' + esc(d.mac) + '\">wake</button>' : '')) },\n    ], r.devices, { sortK: 'ip', sortD: 1 }) + '</div>');\n    if (tool === 'dnsbench') { const mx = Math.max(...r.resolvers.map(x => x.avg || 0), 1); return card('Resolvers (lower is better)', r.resolvers.map(x => RW.brow(esc(x.label) + ' <span class=\"muted mono\">' + esc(x.ip) + '</span>', x.avg == null ? 'failed' : x.avg + ' ms avg · ' + x.min + '–' + x.max, x.avg ? 100 * x.avg / mx : 0, '--s1')).join('')); }\n    if (tool === 'dns') return card('Answers for ' + esc(r.name), r.answers.map(a => '<div class=\"brow\"><span class=\"bl\"><b>' + a.type + '</b> ' + (a.error ? '<span class=\"muted\">' + esc(a.error) + '</span>' : '<span class=\"mono\">' + esc(a.records.join('  ·  ')) + '</span>') + '</span><span class=\"bv\">' + (a.ms != null ? a.ms + ' ms' : '') + '</span></div>').join(''));\n    if (tool === 'publicip') return card('Public address', RW.kv([['IPv4', '<span class=\"mono\">' + esc(r.v4 || 'unavailable') + '</span>'], ['IPv6', '<span class=\"mono\">' + esc(r.v6 || 'none') + '</span>']]));\n    return '';\n  },\n  update() {},\n};\n})();\n","public/js/pages-siem.js":"'use strict';\n/* SIEM: a Wazuh-style security center. Modules grouped in categories, every view is charts and cards. */\n(() => {\nconst { esc, f: F, icon, setH } = RW;\n\n// ------------------------------------------------------------------ constants\nconst SEVC = ['var(--faint)', 'var(--s1)', 'var(--warn)', 'var(--serious)', 'var(--crit)'];\nconst SEVN = ['Info', 'Low', 'Medium', 'High', 'Critical'];\nconst SEVR = ['level 0–3', 'level 4–6', 'level 7–9', 'level 10–11', 'level 12–15'];\nconst band = lv => (lv >= 12 ? 4 : lv >= 10 ? 3 : lv >= 7 ? 2 : lv >= 4 ? 1 : 0);\nconst CAT = i => 'var(--s' + ((i % 8) + 1) + ')';\nconst RANGES = [['24h', '24 h'], ['7d', '7 days'], ['30d', '30 days'], ['90d', '90 days'], ['365d', '1 year']];\nRW.prefs.siemRange = RW.prefs.siemRange || '7d';\nconst range = () => RW.prefs.siemRange;\nconst rangeLabel = () => (RANGES.find(r => r[0] === range()) || RANGES[1])[1];\n\nconst MODS = {\n  overview: { name: 'Security center', icon: 'shield', desc: 'every security module of this machine at a glance' },\n  hunt: { cat: 'sim', name: 'Threat hunting', icon: 'search', desc: 'search, slice and drill into every security event' },\n  fim: { cat: 'sim', name: 'Integrity monitoring', icon: 'file', desc: 'hosts file, startup folders, tasks, SSH keys and autostart registry', api: 'fim' },\n  mitre: { cat: 'detect', name: 'MITRE ATT&CK', icon: 'target', desc: 'tactics and techniques detected on this machine', api: 'mitre' },\n  malware: { cat: 'detect', name: 'Malware detection', icon: 'fire', desc: 'Defender detections, suspicious and first-run programs, threat-feed hits', api: 'malware' },\n  network: { cat: 'detect', name: 'Network & IPs', icon: 'globe', desc: 'every remote address, inbound attempts, scans and drops', api: 'network' },\n  response: { cat: 'detect', name: 'Active response', icon: 'ban', desc: 'block addresses by hand or automatically', api: 'response' },\n  auth: { cat: 'audit', name: 'Authentication', icon: 'user', desc: 'sign-ins, failures, brute force, sessions and accounts', api: 'auth' },\n  sca: { cat: 'audit', name: 'Configuration assessment', icon: 'clipboard', desc: 'hardening benchmark for this machine, with a score', api: 'sca' },\n  audit: { cat: 'audit', name: 'System auditing', icon: 'list', desc: 'accounts, services, tasks, policies, cleared logs, firewall rules', api: 'audit' },\n  compliance: { cat: 'comp', name: 'Regulatory compliance', icon: 'book', desc: 'PCI DSS, GDPR, NIST 800-53 and HIPAA views of your events' },\n};\nconst CATS = [['sim', 'Security information management'], ['detect', 'Threat detection and response'], ['audit', 'Auditing and policy monitoring'], ['comp', 'Regulatory compliance']];\nconst FWS = [['pci_dss', 'PCI DSS'], ['gdpr', 'GDPR'], ['nist_800_53', 'NIST 800-53'], ['hipaa', 'HIPAA']];\nconst QUICK = [['Failed logons', 'group:authentication_failed'], ['Brute force', 'group:brute_force'], ['Level 10+', 'level>=10'], ['Inbound from internet', 'rule:6005'], ['New programs', 'rule:7001'], ['Firewall rule changes', 'group:firewall'], ['File changes', 'group:syscheck'], ['Account changes', 'group:account_changed']];\n\n// ------------------------------------------------------------------ data\nconst cache = new Map();\nasync function get(url, ttl = 8000) {\n  const c = cache.get(url);\n  if (c && Date.now() - c.at < ttl) return c.data;\n  const data = await RW.api(url);\n  cache.set(url, { at: Date.now(), data });\n  return data;\n}\nconst qs = o => Object.entries(o).filter(([, v]) => v != null && v !== '').map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');\nconst facets = (o = {}) => get('/api/siem/facets?' + qs(Object.assign({ range: range() }, o)));\nconst overview = () => get('/api/siem/overview?range=' + range());\nlet rulesMeta = null;\nconst meta = async () => rulesMeta || (rulesMeta = await RW.api('/api/siem/rules?range=' + range()));\n\n// ------------------------------------------------------------------ chart kit (SVG, theme tokens)\nconst TIPS = {};\nlet tipSeq = 0;\nconst nid = p => (p || 'c') + (++tipSeq);\nconst fmtT = (t, step) => { const d = new Date(t); return step >= 86400e3 ? d.toLocaleDateString([], { month: 'short', day: 'numeric' }) : d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); };\nconst pct = (v, t) => (t ? Math.round(100 * v / t) : 0) + '%';\nconst nf = n => F.num(n);\n\nfunction legend(items) { return '<div class=\"slegend\">' + items.map(([c, l]) => '<span><i style=\"background:' + c + '\"></i>' + esc(l) + '</span>').join('') + '</div>'; }\n/** stacked severity columns over time */\nfunction stackBars(hist, step, o = {}) {\n  if (!hist || !hist.length) return '<div class=\"empty\">No data.</div>';\n  const id = nid('sb'), n = hist.length, H = o.h || 150, W = 1000, bw = W / n, gap = n > 80 ? 0.6 : n > 40 ? 1.5 : 3;\n  const tot = hist.map(h => h.b.reduce((a, x) => a + x, 0)), mx = Math.max(1, ...tot);\n  let s = '';\n  for (let g = 1; g <= 3; g++) s += '<line x1=\"0\" x2=\"' + W + '\" y1=\"' + (H - g * H / 4) + '\" y2=\"' + (H - g * H / 4) + '\" class=\"gl\"/>';\n  hist.forEach((h, i) => {\n    let y = H;\n    for (let k = 0; k < 5; k++) { const v = h.b[k]; if (!v) continue; const hh = Math.max(1.5, v / mx * (H - 6)); y -= hh; s += '<rect x=\"' + (i * bw + gap / 2).toFixed(2) + '\" y=\"' + y.toFixed(2) + '\" width=\"' + Math.max(0.5, bw - gap).toFixed(2) + '\" height=\"' + hh.toFixed(2) + '\" fill=\"' + SEVC[k] + '\"/>'; }\n    s += '<rect class=\"hit\" data-tipk=\"' + id + ':' + i + '\" x=\"' + (i * bw).toFixed(2) + '\" y=\"0\" width=\"' + bw.toFixed(2) + '\" height=\"' + H + '\"/>';\n  });\n  TIPS[id] = i => '<b>' + esc(fmtT(hist[i].t, step)) + '</b>' + (step >= 86400e3 ? '' : '') + '<div class=\"tiprows\">' + [4, 3, 2, 1, 0].filter(k => hist[i].b[k]).map(k => '<div><i style=\"background:' + SEVC[k] + '\"></i>' + SEVN[k] + '<b>' + nf(hist[i].b[k]) + '</b></div>').join('') + '<div class=\"tt\">Total<b>' + nf(tot[i]) + '</b></div></div>';\n  const ax = [0, Math.floor(n / 2), n - 1].map(i => '<span>' + esc(fmtT(hist[i].t, step)) + '</span>').join('');\n  return '<div class=\"schart\"><span class=\"ymax\">' + nf(mx) + '</span><svg viewBox=\"0 0 ' + W + ' ' + H + '\" preserveAspectRatio=\"none\" style=\"height:' + H + 'px\">' + s + '</svg><div class=\"xax\">' + ax + '</div></div>' + (o.noLegend ? '' : legend(SEVN.map((l, k) => [SEVC[k], l]).reverse()));\n}\n/** line chart for a few series sharing x */\nfunction lines(t, series, step, o = {}) {\n  const n = t.length; if (!n) return '<div class=\"empty\">No data.</div>';\n  const id = nid('ln'), H = o.h || 150, W = 1000, mx = Math.max(1, ...series.flatMap(s => s.v));\n  const x = i => (n === 1 ? W / 2 : i * W / (n - 1)), y = v => H - 4 - (v / mx) * (H - 10);\n  let s = '';\n  for (let g = 1; g <= 3; g++) s += '<line x1=\"0\" x2=\"' + W + '\" y1=\"' + (H - g * H / 4) + '\" y2=\"' + (H - g * H / 4) + '\" class=\"gl\"/>';\n  for (const se of series) {\n    const pts = se.v.map((v, i) => x(i).toFixed(1) + ',' + y(v).toFixed(1));\n    s += '<path d=\"M' + x(0).toFixed(1) + ',' + H + ' L' + pts.join(' L') + ' L' + x(n - 1).toFixed(1) + ',' + H + ' Z\" fill=\"' + se.c + '\" opacity=\".10\"/>';\n    s += '<polyline points=\"' + pts.join(' ') + '\" fill=\"none\" stroke=\"' + se.c + '\" stroke-width=\"2\" vector-effect=\"non-scaling-stroke\" stroke-linejoin=\"round\"/>';\n  }\n  const bw = W / n;\n  for (let i = 0; i < n; i++) s += '<rect class=\"hit\" data-tipk=\"' + id + ':' + i + '\" x=\"' + (x(i) - bw / 2).toFixed(1) + '\" y=\"0\" width=\"' + bw.toFixed(1) + '\" height=\"' + H + '\"/>';\n  TIPS[id] = i => '<b>' + esc(fmtT(t[i], step)) + '</b><div class=\"tiprows\">' + series.map(se => '<div><i style=\"background:' + se.c + '\"></i>' + esc(se.l) + '<b>' + nf(se.v[i]) + '</b></div>').join('') + '</div>';\n  const ax = [0, Math.floor(n / 2), n - 1].map(i => '<span>' + esc(fmtT(t[i], step)) + '</span>').join('');\n  return '<div class=\"schart\"><span class=\"ymax\">' + nf(mx) + '</span><svg viewBox=\"0 0 ' + W + ' ' + H + '\" preserveAspectRatio=\"none\" style=\"height:' + H + 'px\">' + s + '</svg><div class=\"xax\">' + ax + '</div></div>' + legend(series.map(se => [se.c, se.l]));\n}\n/** donut with legend; items [{l, v, c, f}] (f = hunt filter on click) */\nfunction donut(items, center, o = {}) {\n  items = items.filter(x => x.v > 0);\n  const tot = items.reduce((a, x) => a + x.v, 0);\n  if (!tot) return '<div class=\"empty\">' + esc(o.empty || 'Nothing in this period.') + '</div>';\n  const id = nid('dn'), r = 40, C = 2 * Math.PI * r;\n  let off = 0, s = '';\n  items.forEach((x, i) => {\n    const len = x.v / tot * C, g = items.length > 1 ? Math.min(1.6, len / 3) : 0;\n    s += '<circle r=\"' + r + '\" cx=\"50\" cy=\"50\" fill=\"none\" stroke=\"' + x.c + '\" stroke-width=\"14\" stroke-dasharray=\"' + Math.max(0.01, len - g).toFixed(2) + ' ' + (C - len + g).toFixed(2) + '\" stroke-dashoffset=\"' + (-off).toFixed(2) + '\" data-tipk=\"' + id + ':' + i + '\"' + (x.f ? ' data-f=\"' + esc(x.f) + '\" class=\"clk\"' : '') + '/>';\n    off += len;\n  });\n  TIPS[id] = i => '<b>' + esc(items[i].l) + '</b><div class=\"tiprows\"><div>' + nf(items[i].v) + ' events<b>' + pct(items[i].v, tot) + '</b></div></div>';\n  return '<div class=\"donut\"><div class=\"dsvg\"><svg viewBox=\"0 0 100 100\" role=\"img\" aria-label=\"' + esc(o.label || 'distribution') + '\"><g transform=\"rotate(-90 50 50)\">' + s + '</g></svg><div class=\"dc\"><b>' + nf(tot) + '</b><span>' + esc(center || 'events') + '</span></div></div>' +\n    '<div class=\"dleg\">' + items.map(x => '<div class=\"' + (x.f ? 'clk' : '') + '\"' + (x.f ? ' data-f=\"' + esc(x.f) + '\"' : '') + '><i style=\"background:' + x.c + '\"></i><span class=\"dl\" title=\"' + esc(x.l) + '\">' + esc(x.l) + '</span><b>' + nf(x.v) + '</b><em>' + pct(x.v, tot) + '</em></div>').join('') + '</div></div>';\n}\n/** ranked bars; rows [{l, v, sub, attrs, c}] */\nfunction bars(rows, o = {}) {\n  rows = rows.filter(r => r.v > 0);\n  if (!rows.length) return '<div class=\"empty\">' + esc(o.empty || 'Nothing in this period.') + '</div>';\n  const mx = Math.max(...rows.map(r => r.v));\n  return '<div class=\"hbars sb\">' + rows.slice(0, o.max || 12).map((r, i) => '<div class=\"hb' + (r.attrs ? ' click\" ' + r.attrs : '\"') + '><span class=\"hbl\" title=\"' + esc(r.title || r.l) + '\">' + (r.html || esc(r.l)) + (r.sub ? ' <span class=\"muted\">' + esc(r.sub) + '</span>' : '') + '</span><span class=\"hbt\"><i style=\"width:' + Math.max(1, 100 * r.v / mx).toFixed(1) + '%;background:' + (r.c || o.c || 'var(--s1)') + '\"></i></span><span class=\"hbv\">' + nf(r.v) + '</span></div>').join('') + '</div>';\n}\n/** day-of-week x hour heatmap */\nfunction weekHeat(week) {\n  const mx = Math.max(1, ...week.flat()), days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];\n  return '<div class=\"wheat\">' + week.map((row, d) => '<span class=\"wd\">' + days[d] + '</span>' + row.map((v, h) => '<i title=\"' + days[d] + ' ' + String(h).padStart(2, '0') + ':00 · ' + v + ' events\" style=\"background:' + (v ? 'color-mix(in srgb, var(--s1) ' + Math.round(15 + 85 * v / mx) + '%, var(--panel2))' : 'var(--panel2)') + '\"></i>').join('')).join('') +\n    '<span></span>' + Array.from({ length: 24 }, (_, h) => '<span class=\"wh\">' + (h % 6 === 0 ? h : '') + '</span>').join('') + '</div>';\n}\nfunction spark(vals, c) {\n  if (!vals || vals.length < 2) return '';\n  const mx = Math.max(1, ...vals), W = 100, H = 24;\n  const pts = vals.map((v, i) => (i * W / (vals.length - 1)).toFixed(1) + ',' + (H - 2 - v / mx * (H - 4)).toFixed(1)).join(' ');\n  return '<svg class=\"spk\" viewBox=\"0 0 ' + W + ' ' + H + '\" preserveAspectRatio=\"none\"><polyline points=\"' + pts + '\" fill=\"none\" stroke=\"' + (c || 'var(--accent)') + '\" stroke-width=\"1.6\" vector-effect=\"non-scaling-stroke\"/></svg>';\n}\nfunction sevStrip(b) { const t = b.reduce((a, x) => a + x, 0); return t ? '<div class=\"sstrip\">' + [4, 3, 2, 1, 0].filter(k => b[k]).map(k => '<i style=\"flex:' + b[k] + ';background:' + SEVC[k] + '\" title=\"' + SEVN[k] + ': ' + b[k] + '\"></i>').join('') + '</div>' : '<div class=\"sstrip\"><i style=\"flex:1;background:var(--panel3)\"></i></div>'; }\nconst kpi = (label, value, sub, color, attrs, ic) => '<div class=\"kpi skpi\"' + (attrs ? ' ' + attrs : ' style=\"cursor:default\"') + '><div class=\"kl\"><span>' + esc(label) + '</span>' + (ic ? '<span style=\"color:' + (color || 'var(--muted)') + '\">' + icon(ic) + '</span>' : '') + '</div><div class=\"kv2\"' + (color ? ' style=\"color:' + color + '\"' : '') + '>' + esc(value) + '</div><div class=\"ks\">' + esc(sub || '') + '</div></div>';\nconst card = (title, body, o = {}) => '<article class=\"card' + (o.cls ? ' ' + o.cls : '') + '\"' + (o.style ? ' style=\"' + o.style + '\"' : '') + '><header><h2>' + esc(title) + '</h2>' + (o.right ? '<span class=\"right\">' + o.right + '</span>' : o.sub ? '<span class=\"right muted\" style=\"font-size:12px\">' + esc(o.sub) + '</span>' : '') + '</header>' + body + '</article>';\nconst facetRows = (list, key, o = {}) => (list || []).map(([v, n]) => ({ l: o.label ? o.label(v) : v, v: n, attrs: key ? 'data-f=\"' + esc(key + ':' + (/\\s/.test(v) ? '\"' + v + '\"' : v)) + '\"' : '', title: v }));\nconst histTotals = h => { const b = [0, 0, 0, 0, 0]; for (const x of h || []) x.b.forEach((v, i) => { b[i] += v; }); return b; };\nconst levelBadge = lv => '<span class=\"lvb\" style=\"--c:' + SEVC[band(lv)] + '\">' + lv + '</span>';\n\n// ------------------------------------------------------------------ event feed\nconst expanded = new Set();\nconst evKey = e => e.ts + ':' + e.rule.id + ':' + (e.ip || '') + ':' + (e.user || '') + ':' + String(e.msg).length;\nfunction evItem(e) {\n  const k = evKey(e), open = expanded.has(k), mitre = (e.rule.mitre || []);\n  const chips = [];\n  if (e.ip) chips.push('<a class=\"echip\" data-ipd=\"' + esc(e.ip) + '\">' + icon('globe') + esc(e.ip) + '</a>');\n  if (e.user) chips.push('<a class=\"echip\" data-f=\"user:' + esc(e.user) + '\">' + icon('user') + esc(e.user) + '</a>');\n  if (e.process) chips.push('<a class=\"echip\" data-f=\"proc:' + esc(e.process) + '\">' + icon('box') + esc(e.process) + '</a>');\n  for (const m of mitre) chips.push('<a class=\"echip mitre\" data-f=\"mitre:' + esc(m) + '\" title=\"' + esc((rulesMeta && rulesMeta.mitre[m]) || '') + '\">' + esc(m) + '</a>');\n  chips.push('<a class=\"echip faint\" data-f=\"rule:' + e.rule.id + '\">rule ' + e.rule.id + '</a>');\n  return '<div class=\"sev-ev' + (open ? ' open' : '') + '\" style=\"--c:' + SEVC[band(e.rule.level)] + '\">' +\n    '<div class=\"evh\" data-evx=\"' + esc(k) + '\">' + levelBadge(e.rule.level) + '<div class=\"evm\"><div class=\"evt\"><b>' + esc(e.rule.description) + '</b><time title=\"' + esc(new Date(e.ts).toLocaleString()) + '\">' + esc(F.date(e.ts)) + '</time></div><div class=\"evd\">' + esc(e.msg) + '</div></div></div>' +\n    '<div class=\"evc\">' + chips.join('') + '</div>' +\n    (open ? evDetail(e) : '') + '</div>';\n}\nfunction evDetail(e) {\n  const rows = [['Time', new Date(e.ts).toLocaleString()], ['Rule', e.rule.id + ' · level ' + e.rule.level + ' (' + SEVN[band(e.rule.level)].toLowerCase() + ')'], ['Groups', e.rule.groups.join(', ')], ['MITRE', (e.rule.mitre || []).map(m => m + ' ' + ((rulesMeta && rulesMeta.mitre[m]) || '')).join(', ')], ['Source', e.location], ['Address', e.ip], ['User', e.user], ['Process', e.process]];\n  for (const [k, v] of Object.entries(e.data || {})) rows.push(['data.' + k, typeof v === 'object' ? JSON.stringify(v) : String(v)]);\n  const acts = [];\n  if (e.ip && RW.canControl() && RW.ipKind(e.ip) !== 'loopback') acts.push('<button class=\"btn sm danger\" data-block=\"' + esc(e.ip) + '\">' + icon('ban') + 'Block ' + esc(e.ip) + '</button>');\n  if (e.ip) acts.push('<button class=\"btn sm\" data-ipd=\"' + esc(e.ip) + '\">' + icon('globe') + 'IP details</button>');\n  acts.push('<button class=\"btn sm\" data-f=\"rule:' + e.rule.id + '\">' + icon('search') + 'Same rule</button>');\n  acts.push('<button class=\"btn sm\" data-copyev=\"' + esc(JSON.stringify(e)) + '\">' + icon('copy') + 'Copy JSON</button>');\n  return '<div class=\"evx\"><dl class=\"evkv\">' + rows.filter(r => r[1] != null && r[1] !== '').map(r => '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>').join('') + '</dl><div class=\"evacts\">' + acts.join('') + '</div><pre class=\"evjson\">' + esc(JSON.stringify(e, null, 2)) + '</pre></div>';\n}\nconst feed = (list, empty) => (list && list.length ? '<div class=\"sfeed\">' + list.map(evItem).join('') + '</div>' : '<div class=\"empty\">' + esc(empty || 'No events in this period.') + '</div>');\n\n// ------------------------------------------------------------------ IP drawer\nlet drawerEvents = [];\nRW.openIp = ip => {\n  RW.drawer.open(ip, {\n    mount(b) {\n      b.innerHTML = '<div class=\"empty\">Loading…</div>';\n      RW.api('/api/siem/ip?ip=' + encodeURIComponent(ip)).then(d => {\n        drawerEvents = d.events || [];\n        const e = d.entry || {}, pub = d.kind === 'public', name = RW.rdns && RW.rdns.get(ip);\n        b.innerHTML = '<div class=\"iph\"><span class=\"mono big\">' + esc(ip) + '</span>' + kindChip(d.kind) + (d.feed ? '<span class=\"chip crit\"><i></i>' + esc(d.feed) + '</span>' : '') + (d.blocked ? '<span class=\"chip crit\"><i></i>blocked</span>' : '') + '</div>' + (name ? '<div class=\"muted\" style=\"margin:-4px 0 10px\">' + esc(name) + '</div>' : '') +\n          '<div class=\"ipstats\">' + [['Events', e.events || 0], ['Connections', e.conns || 0], ['Inbound', e.inb || 0], ['Outbound', e.outb || 0], ['Failed logons', e.fail || 0], ['Dropped pkts', e.drops || 0]].map(x => '<div><b>' + nf(x[1]) + '</b><span>' + x[0] + '</span></div>').join('') + '</div>' +\n          RW.kv([['First seen', e.first ? F.date(e.first) : '–'], ['Last seen', e.last ? F.ago(e.last) : '–'], ['Apps', esc((e.procs || []).join(', '))], ['Remote ports', esc((e.rports || []).join(', '))], ['Local ports hit', esc((e.lports || []).join(', '))], ['Highest level', e.maxLevel ? levelBadge(e.maxLevel) : '']]) +\n          '<div class=\"evacts\" style=\"margin:12px 0\">' + (RW.canControl() ? (d.blocked ? '<button class=\"btn sm\" data-unblock=\"' + esc(ip) + '\">' + icon('check') + 'Unblock</button>' : '<button class=\"btn sm danger\" data-block=\"' + esc(ip) + '\">' + icon('ban') + 'Block</button>') : '') +\n          '<button class=\"btn sm\" data-f=\"ip:' + esc(ip) + '\">' + icon('search') + 'Hunt this IP</button>' + (pub ? '<a class=\"btn sm\" href=\"https://www.abuseipdb.com/check/' + encodeURIComponent(ip) + '\" target=\"_blank\" rel=\"noopener noreferrer\">' + icon('ext') + 'AbuseIPDB</a><a class=\"btn sm\" href=\"https://www.virustotal.com/gui/ip-address/' + encodeURIComponent(ip) + '\" target=\"_blank\" rel=\"noopener noreferrer\">' + icon('ext') + 'VirusTotal</a>' : '<button class=\"btn sm\" data-go=\"lab\">' + icon('radar') + 'Net Lab</button>') + '</div>' +\n          '<h3 style=\"margin:14px 0 8px;font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.6px\">History</h3>' + feed(d.events, 'No security events for this address yet.');\n      }).catch(er => { b.innerHTML = '<div class=\"empty\">' + esc(er.message) + '</div>'; });\n    },\n  });\n};\nconst kindChip = k => '<span class=\"chip ' + (k === 'public' ? 'info' : k === 'private' ? 'good' : '') + '\"><i></i>' + esc(k === 'private' ? 'LAN' : k) + '</span>';\n\n// ------------------------------------------------------------------ page shell\nlet cur = null, renderTimer = null, renderSeq = 0;\nfunction shell(id) {\n  const m = MODS[id];\n  const pills = '<div class=\"mbar\">' + ['overview'].concat(Object.keys(MODS).filter(k => k !== 'overview')).map(k => '<a data-mod=\"' + k + '\" class=\"' + (k === id ? 'on' : '') + '\">' + icon(MODS[k].icon) + '<span>' + esc(MODS[k].name) + '</span></a>').join('') + '</div>';\n  return pills + '<div class=\"mhead\"><span class=\"mico\">' + icon(m.icon) + '</span><div><h2>' + esc(m.name) + '</h2><div class=\"muted\">' + esc(m.desc) + '</div></div><span class=\"grow\"></span><span id=\"sm-new\"></span><div id=\"sm-agent\" class=\"agent\"></div><div class=\"srange\"><div class=\"seg\">' + RANGES.map(([k, l]) => '<button data-srange=\"' + k + '\" class=\"' + (range() === k ? 'on' : '') + '\" title=\"Last ' + l + '\">' + l.replace(' days', 'd').replace(' year', 'y').replace(' h', 'h') + '</button>').join('') + '</div><button class=\"icon-btn\" data-srefresh=\"1\" title=\"Refresh\">' + icon('refresh') + '</button></div></div><div id=\"sm-tabs\"></div><div id=\"sm-body\"><div class=\"empty\">Loading…</div></div>';\n}\nfunction tabs(list, curTab) { return '<div class=\"toolbar\"><div class=\"seg\" id=\"smtabs\">' + list.map(([k, l]) => '<button data-stab=\"' + k + '\" class=\"' + (curTab === k ? 'on' : '') + '\">' + esc(l) + '</button>').join('') + '</div></div>'; }\nasync function agentStrip() {\n  try {\n    const o = await overview();\n    const a = o.agent, st = o.stats;\n    setH('sm-agent', '<span class=\"chip good\"><i></i>active</span><span title=\"' + esc(a.os) + '\">' + icon('cpu') + esc(a.name) + '</span>' + (a.ip ? '<span class=\"mono\">' + esc(a.ip) + '</span>' : '') + (a.elevated ? '<span class=\"chip good\"><i></i>admin</span>' : '<a class=\"chip warn link\" data-cmd=\"elevate\" title=\"Security log, sessions of other users and blocking need admin\"><i></i>not admin</a>') + '<span class=\"muted\" title=\"Kept on disk: ' + esc(st.dir || '') + '\">' + (st.days || 0) + ' of ' + st.retentionDays + ' days · ' + F.b(st.bytes || 0) + '</span>');\n    return o;\n  } catch { return null; }\n}\nconst huntGo = q => RW.go('siem-hunt', { q });\nfunction addFilter(f) {\n  if (RW.page === 'siem-hunt') {\n    const inp = document.getElementById('hq');\n    const parts = (inp.value.trim() ? inp.value.trim().split(/\\s+(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/) : []).filter(x => x.split(':')[0] !== f.split(':')[0] || /^level/.test(f));\n    parts.push(f); inp.value = parts.join(' '); hunt.q = inp.value; hunt.events = null; render();\n  } else huntGo(f);\n}\n\nfunction schedule(ms) { if (renderTimer) return; renderTimer = setTimeout(() => { renderTimer = null; render(); }, ms || 0); }\nasync function render() {\n  if (!cur || RW.page !== 'siem' + (cur.id === 'overview' ? '' : '-' + cur.id)) return;\n  const seq = ++renderSeq;\n  fresh = 0; pill();\n  agentStrip();\n  try {\n    const html = await RENDER[cur.id](cur);\n    if (seq !== renderSeq || !cur) return;\n    if (html != null) { const b = document.getElementById('sm-body'); if (b) { b.innerHTML = html; b.__h = null; } }\n    if (RENDER[cur.id].after) RENDER[cur.id].after(cur);\n  } catch (e) { const b = document.getElementById('sm-body'); if (b) b.innerHTML = '<div class=\"empty\">' + esc(e.message) + '</div>'; }\n}\n// live events: count them in a \"new events\" pill instead of re-rendering under the user's cursor;\n// the overview refreshes itself at most every 30 s\nlet fresh = 0, lastAuto = 0;\nfunction pill() {\n  const el = document.getElementById('sm-new'); if (!el) return;\n  el.innerHTML = fresh ? '<button class=\"btn sm newpill\" data-srefresh=\"1\">' + icon('refresh') + nf(fresh) + ' new event' + (fresh > 1 ? 's' : '') + '</button>' : '';\n}\nRW.on('siem', d => {\n  if (d && d.events) {\n    const n = d.events.filter(e => e.rule.level >= 3).length;\n    const hi = d.events.filter(e => e.rule.level >= 10).length;\n    if (hi) { RW.siemNew = (RW.siemNew || 0) + hi; const el = document.getElementById('nb-siem'); if (el && RW.page !== 'siem') { el.textContent = RW.siemNew; el.className = 'badge crit'; } }\n    if (!n) return;\n    fresh += n;\n  }\n  if (!cur || !RW.page || !RW.page.startsWith('siem')) return;\n  if (cur.id === 'overview' && Date.now() - lastAuto > 30000) { lastAuto = Date.now(); cache.clear(); schedule(500); return; }\n  if (!d || !d.events) { fresh = Math.max(fresh, 1); }\n  pill();\n});\n\n// ------------------------------------------------------------------ module renderers\nconst RENDER = {};\nconst huntLink = (q, label) => '<a class=\"muted\" style=\"font-size:12px\" data-f=\"' + esc(q) + '\">' + esc(label || 'hunt →') + '</a>';\n\n// ===== Security center (overview)\nRENDER.overview = async () => {\n  const o = await overview();\n  const s = o.summary, t = s.totals, b = t.bands, mods = o.modules.totals || {};\n  const daysOf = id => o.modules.days.map(d => d.m[id] || 0);\n  const kpis = '<div class=\"skpis\">' +\n    kpi('Total events', nf(t.n), rangeLabel(), null, 'data-mod=\"hunt\"', 'activity') +\n    kpi('Critical', nf(b[4]), 'level 12 or above', b[4] ? 'var(--crit)' : null, 'data-f=\"level>=12\"', 'alert') +\n    kpi('High', nf(b[3]), 'level 10–11', b[3] ? 'var(--serious)' : null, 'data-f=\"level>=10 level<=11\"', 'alert') +\n    kpi('Failed logons', nf(t.fail), 'authentication failures', t.fail ? 'var(--warn)' : null, 'data-f=\"group:authentication_failed\"', 'lock') +\n    kpi('Successful logons', nf(t.ok), 'sign-ins', null, 'data-mod=\"auth\"', 'unlock') +\n    kpi('Remote IPs', nf(o.ips.tracked), o.ips.public + ' public · ' + o.ips.inbound + ' inbound', null, 'data-mod=\"network\"', 'globe') +\n    kpi('Config score', o.sca.score == null ? '–' : o.sca.score + '%', o.sca.failed + ' checks failing', o.sca.score == null ? null : 'var(' + RW.scoreColor(o.sca.score) + ')', 'data-mod=\"sca\"', 'clipboard') +\n    kpi('Blocked IPs', nf(o.blocks), 'active response', null, 'data-mod=\"response\"', 'ban') + '</div>';\n  const evo = card('Alert level evolution', stackBars(s.buckets.map(x => ({ t: x.t, b: x.bands })), s.step, { h: 170 }), { right: '<a class=\"muted\" style=\"font-size:12px\" data-mod=\"hunt\">open in threat hunting →</a>' });\n  const sev = card('Alerts by severity', donut([4, 3, 2, 1, 0].map(k => ({ l: SEVN[k] + ' · ' + SEVR[k].replace('level ', ''), v: b[k], c: SEVC[k], f: k === 4 ? 'level>=12' : k === 3 ? 'level>=10 level<=11' : k === 2 ? 'level>=7 level<=9' : k === 1 ? 'level>=4 level<=6' : 'level<=3' })), 'alerts'));\n  const catHtml = CATS.map(([c, title]) => {\n    const ids = Object.keys(MODS).filter(k => MODS[k].cat === c);\n    let cards = ids.map(id => {\n      const m = MODS[id], api = m.api, sv = api && mods[api] ? mods[api] : null, n = sv ? sv.reduce((a, x) => a + x, 0) : null;\n      const extra = id === 'sca' ? (o.sca.score == null ? 'not run yet' : o.sca.score + '% · ' + o.sca.failed + ' failing') : id === 'fim' ? nf(o.fim.files) + ' files · ' + nf(o.fim.registry) + ' autostart entries' : id === 'response' ? o.blocks + ' blocked' : id === 'network' ? nf(o.ips.tracked) + ' addresses' : id === 'hunt' ? nf(t.n) + ' events' : '';\n      return '<div class=\"mcard\" data-mod=\"' + id + '\"><div class=\"mct\">' + icon(m.icon) + '<b>' + esc(m.name) + '</b></div><div class=\"mcd\">' + esc(m.desc) + '</div><div class=\"mcn\"><span class=\"big\">' + (n == null ? '' : nf(n)) + '</span><span class=\"muted\">' + esc(extra || (n == null ? '' : 'events')) + '</span></div>' + (sv ? sevStrip(sv) + spark(daysOf(api), 'var(--accent)') : '') + '</div>';\n    }).join('');\n    if (c === 'comp') cards = FWS.map(([fw, name]) => '<div class=\"mcard\" data-mod=\"compliance\" data-fwp=\"' + fw + '\"><div class=\"mct\">' + icon('book') + '<b>' + esc(name) + '</b></div><div class=\"mcd\">' + esc({ pci_dss: 'Payment Card Industry Data Security Standard', gdpr: 'EU General Data Protection Regulation', nist_800_53: 'NIST security and privacy controls', hipaa: 'US health data security rule' }[fw]) + '</div></div>').join('');\n    return '<h3 class=\"scat\">' + esc(title) + '</h3><div class=\"mgrid\">' + cards + '</div>';\n  }).join('');\n  const top = '<div class=\"grid g3\">' +\n    card('Top rules', bars(s.top.rules.map(([id, n, d, lv]) => ({ l: d || 'rule ' + id, sub: '#' + id, v: n, c: SEVC[band(lv || 0)], attrs: 'data-f=\"rule:' + id + '\"' })))) +\n    card('Top remote addresses', bars(s.top.ips.map(([ip, n]) => ({ l: ip, v: n, html: '<span class=\"mono\">' + esc(ip) + '</span>', attrs: 'data-ipd=\"' + esc(ip) + '\"' })), { c: 'var(--s7)', empty: 'No address-related events.' })) +\n    card('MITRE ATT&CK techniques', bars(s.top.mitre.map(([m, n]) => ({ l: m + ' ' + ((rulesMeta && rulesMeta.mitre[m]) || ''), v: n, attrs: 'data-f=\"mitre:' + esc(m) + '\"' })), { c: 'var(--s5)' }), { right: '<a class=\"muted\" style=\"font-size:12px\" data-mod=\"mitre\">matrix →</a>' }) + '</div>';\n  const coll = o.collectors, src = [];\n  if (coll.kind === 'windows') {\n    const names = { 'sec': 'Security log', 'sec-logon': 'Logons', 'sys': 'System log', 'def': 'Defender', 'fw': 'Firewall rules', 'rdp': 'Remote Desktop', 'ssh': 'OpenSSH' };\n    for (const [k, v] of Object.entries(coll.logs || {})) if (names[k]) src.push('<span class=\"chip ' + (v.ok ? 'good' : v.err === 'not present' ? '' : 'warn') + '\" title=\"' + esc(v.err || 'reading') + '\"><i></i>' + esc(names[k]) + (v.ok ? '' : ': ' + esc(v.err)) + '</span>');\n    src.push('<span class=\"chip ' + (coll.firewallLog && coll.firewallLog.enabled ? 'good' : '') + '\"><i></i>Firewall drop log' + (coll.firewallLog && coll.firewallLog.enabled ? '' : ': off') + '</span>');\n  } else if (coll.kind === 'linux') src.push('<span class=\"chip ' + (coll.auth.ok ? 'good' : 'warn') + '\" title=\"' + esc(coll.auth.err || '') + '\"><i></i>' + esc(coll.auth.source || 'auth logs') + '</span>');\n  else src.push('<span class=\"muted\">' + esc(coll.note || '') + '</span>');\n  src.push('<span class=\"chip good\"><i></i>Connections & ports</span><span class=\"chip good\"><i></i>Programs</span><span class=\"chip ' + (o.fim.at ? 'good' : '') + '\"><i></i>File integrity</span><span class=\"chip ' + (o.sca.at ? 'good' : '') + '\"><i></i>Configuration</span>');\n  const needAdmin = coll.kind === 'windows' && !o.agent.elevated ? '<div class=\"note snote\">' + icon('shield') + '<div><b>Running without admin.</b> Windows only lets administrators read the Security log (sign-ins, failures, account changes), see other users\\' sessions and add firewall blocks. <button class=\"btn sm primary\" data-cmd=\"elevate\">' + icon('shield') + 'Restart as admin</button></div></div>' : '';\n  return needAdmin + kpis + '<div class=\"grid g21\">' + evo + sev + '</div>' + catHtml + top +\n    '<div class=\"grid g2\">' + card('Latest high-severity alerts', feed(o.recent, 'Nothing at level 7 or above in this period. Calm seas.'), { right: '<a class=\"muted\" style=\"font-size:12px\" data-f=\"level>=7\">all →</a>' }) + card('Data sources', '<div class=\"srcs\">' + src.join('') + '</div><div class=\"muted\" style=\"font-size:12px;margin-top:10px\">History is kept for ' + o.stats.retentionDays + ' days in daily JSON files (older days compressed) under ' + esc(o.stats.dir || '~/.rigwatch/siem') + '. Change with RETENTION_DAYS.</div>') + '</div>';\n};\nRENDER.overview.after = () => { meta().then(() => {}).catch(() => {}); };\n\n// ===== Threat hunting (Discover)\nconst hunt = { q: '', events: null, more: false, cursor: null, min: '' };\nRENDER.hunt = async c => {\n  if (c.params.q != null && c.params.q !== hunt.q && !c.used) { hunt.q = c.params.q; hunt.events = null; }\n  c.used = true;\n  await meta().catch(() => {});\n  const fc = await facets({ q: hunt.q, min: hunt.min });\n  if (!hunt.events) { hunt.events = fc.latest; hunt.more = fc.total > fc.latest.length; hunt.cursor = fc.latest.length ? fc.latest[fc.latest.length - 1].ts : null; }\n  const side = [['rule', 'Rules', 'rule', v => { const r = (fc.facets.rule || []).find(x => x[0] === v); return r ? r[2] : v; }], ['group', 'Groups', 'group'], ['ip', 'Addresses', 'ip'], ['user', 'Users', 'user'], ['process', 'Processes', 'proc'], ['location', 'Sources', 'loc'], ['tactic', 'MITRE tactics', null]]\n    .filter(([k]) => (fc.facets[k] || []).length).map(([k, title, key, lab]) => '<div class=\"fset\"><h4>' + esc(title) + '</h4>' + (fc.facets[k] || []).slice(0, 8).map(([v, n]) => '<a ' + (key ? 'data-f=\"' + esc(key + ':' + (/\\s/.test(v) ? '\"' + v + '\"' : v)) + '\"' : '') + ' title=\"' + esc(v) + '\"><span>' + esc(lab ? lab(v) : v) + '</span><b>' + nf(n) + '</b></a>').join('') + '</div>').join('');\n  return '<div class=\"hbar\"><div class=\"hsearch\">' + icon('search') + '<input id=\"hq\" type=\"search\" placeholder=\"Search events: text, ip:1.2.3.4  user:admin  rule:2004  group:brute_force  mitre:T1110  proc:sshd  level>=7\" value=\"' + esc(hunt.q) + '\"></div>' +\n    '<select id=\"hmin\"><option value=\"\">all levels</option>' + [[3, '3+'], [7, '7+ medium'], [10, '10+ high'], [12, '12+ critical']].map(([v, l]) => '<option value=\"' + v + '\"' + (String(hunt.min) === String(v) ? ' selected' : '') + '>level ' + l + '</option>').join('') + '</select>' +\n    '<a class=\"btn sm\" href=\"/api/siem/export?' + qs({ range: range(), q: hunt.q, min: hunt.min, format: 'csv' }) + '\" download>' + icon('download') + 'CSV</a><a class=\"btn sm\" href=\"/api/siem/export?' + qs({ range: range(), q: hunt.q, min: hunt.min, format: 'json' }) + '\" download>' + icon('download') + 'JSON</a></div>' +\n    '<div class=\"qchips\">' + QUICK.map(([l, q]) => '<a class=\"echip\" data-hq=\"' + esc(q) + '\">' + esc(l) + '</a>').join('') + (hunt.q ? '<a class=\"echip faint\" data-hq=\"\">' + icon('x') + 'clear</a>' : '') + '</div>' +\n    '<div class=\"hgrid\"><aside class=\"card facets\">' + (side || '<div class=\"empty\">No fields.</div>') + '</aside><div>' +\n    card(nf(fc.total) + ' hits' + (fc.capped ? ' (first ' + nf(fc.total) + ')' : ''), stackBars(fc.hist, fc.step, { h: 120 }), { sub: rangeLabel() }) +\n    '<article class=\"card\"><div id=\"hfeed\">' + feed(hunt.events, hunt.q ? 'No events match this search.' : 'No events in this period yet.') + '</div>' + (hunt.more ? '<div style=\"text-align:center;margin-top:10px\"><button class=\"btn\" data-more=\"1\">' + icon('plus') + 'Load older events</button></div>' : '') + '</article></div></div>';\n};\nasync function huntMore() {\n  if (!hunt.cursor) return;\n  const r = await RW.api('/api/siem/events?' + qs({ range: range(), q: hunt.q, min: hunt.min, before: hunt.cursor, limit: 100 }));\n  hunt.events = hunt.events.concat(r.events); hunt.more = r.more; hunt.cursor = r.cursor;\n  render();\n}\n\n// ===== MITRE ATT&CK\nlet mitreSel = null;\nRENDER.mitre = async () => {\n  const [m, fc] = await Promise.all([meta(), facets({ module: 'mitre' })]);\n  const tech = new Map(fc.facets.mitre || []), tac = new Map(fc.facets.tactic || []);\n  const all = Object.keys(m.mitre);\n  const mx = Math.max(1, ...tech.values());\n  const matrix = '<div class=\"mtx\">' + m.tactics.map(t => {\n    const list = all.filter(x => (m.techTactics[x] || []).includes(t)).sort((a, b) => (tech.get(b) || 0) - (tech.get(a) || 0));\n    return '<div class=\"mcol\"><div class=\"mth\"><b>' + esc(t) + '</b><span>' + nf(tac.get(t) || 0) + '</span></div>' + (list.length ? list.map(x => { const n = tech.get(x) || 0; return '<a class=\"mtile' + (n ? '' : ' zero') + (mitreSel === x ? ' sel' : '') + '\" data-tech=\"' + esc(x) + '\" style=\"' + (n ? 'background:color-mix(in srgb, var(--crit) ' + Math.round(14 + 60 * n / mx) + '%, var(--panel2))' : '') + '\" title=\"' + esc(x + ' ' + m.mitre[x] + ': ' + n + ' events') + '\"><span>' + esc(m.mitre[x]) + '</span><em>' + esc(x) + (n ? ' · ' + nf(n) : '') + '</em></a>'; }).join('') : '<div class=\"mnone\">not monitored</div>') + '</div>';\n  }).join('') + '</div>';\n  const kp = '<div class=\"skpis\">' + kpi('Events with ATT&CK', nf(fc.total), rangeLabel(), null, null, 'target') + kpi('Techniques seen', nf(tech.size), 'of ' + all.length + ' monitored', null, null, 'layers') + kpi('Tactics hit', nf(tac.size), 'of ' + m.tactics.length, null, null, 'activity') + kpi('Top technique', (fc.facets.mitre || [])[0] ? fc.facets.mitre[0][0] : '–', (fc.facets.mitre || [])[0] ? m.mitre[fc.facets.mitre[0][0]] : '', null, null, 'fire') + '</div>';\n  let sel = '';\n  if (mitreSel) {\n    const ev = await get('/api/siem/events?' + qs({ range: range(), q: 'mitre:' + mitreSel, limit: 50 }));\n    sel = card(mitreSel + ' · ' + (m.mitre[mitreSel] || ''), '<div class=\"muted\" style=\"margin-bottom:10px\">Tactics: ' + esc((m.techTactics[mitreSel] || []).join(', ')) + ' · <a href=\"https://attack.mitre.org/techniques/' + esc(mitreSel.replace('.', '/')) + '/\" target=\"_blank\" rel=\"noopener noreferrer\">attack.mitre.org ' + icon('ext') + '</a></div>' + feed(ev.events, 'No events for this technique in this period.'), { right: '<button class=\"btn sm ghost\" data-tech=\"\">' + icon('x') + 'close</button>' });\n  }\n  return kp + card('ATT&CK matrix', matrix, { sub: 'click a technique' }) + sel + '<div class=\"grid g2\">' +\n    card('Tactics', bars((fc.facets.tactic || []).map(([t, n]) => ({ l: t, v: n })), { c: 'var(--s5)' })) +\n    card('Techniques over time', stackBars(fc.hist, fc.step)) + '</div>';\n};\n\n// ===== Authentication\nlet authTab = 'dash';\nRENDER.auth = async () => {\n  setH('sm-tabs', tabs([['dash', 'Dashboard'], ['sessions', 'Sessions & accounts'], ['events', 'Events']], authTab));\n  if (authTab === 'events') return moduleEvents('auth');\n  if (authTab === 'sessions') return authSessions();\n  const [o, fc] = await Promise.all([overview(), facets({ module: 'auth' })]);\n  const s = o.summary, f = fc.facets;\n  const rules = new Map((f.rule || []).map(r => [r[0], r[1]]));\n  const sum = ids => ids.reduce((a, id) => a + (rules.get(String(id)) || 0), 0);\n  const secOff = o.collectors.kind === 'windows' && o.collectors.logs && o.collectors.logs.sec && !o.collectors.logs.sec.ok;\n  const kp = '<div class=\"skpis\">' + kpi('Successful', nf(s.totals.ok), 'sign-ins', null, 'data-f=\"rule:2001,2002,2003,2020,2032\"', 'unlock') + kpi('Failed', nf(s.totals.fail), 'wrong password, unknown user…', s.totals.fail ? 'var(--warn)' : null, 'data-f=\"group:authentication_failed\"', 'lock') +\n    kpi('Brute force', nf(sum([2010, 2011])), 'bursts of failures', sum([2010, 2011]) ? 'var(--crit)' : null, 'data-f=\"group:brute_force\"', 'alert') + kpi('Lockouts', nf(sum([2005])), 'accounts locked', null, 'data-f=\"rule:2005\"', 'ban') +\n    kpi('Remote', nf(sum([2002, 2003, 2016, 2020])), 'RDP, SSH, network', null, 'data-f=\"rule:2002,2003,2016,2020\"', 'globe') + kpi('Users', nf((f.user || []).length), 'distinct accounts', null, null, 'user') + '</div>';\n  const t = s.buckets.map(b => b.t);\n  return (secOff ? '<div class=\"note snote\">' + icon('shield') + '<div><b>The Windows Security log needs admin.</b> Sign-ins and failures come from it. <button class=\"btn sm primary\" data-cmd=\"elevate\">' + icon('shield') + 'Restart as admin</button></div></div>' : '') + kp +\n    '<div class=\"grid g21\">' + card('Sign-ins over time', lines(t, [{ l: 'Successful', c: 'var(--good)', v: s.buckets.map(b => b.ok) }, { l: 'Failed', c: 'var(--crit)', v: s.buckets.map(b => b.fail) }], s.step, { h: 170 })) +\n    card('Logon types', donut((f.logonType || []).map(([l, n], i) => ({ l, v: n, c: CAT(i) })), 'logons', { empty: 'No logon events yet.' })) + '</div>' +\n    '<div class=\"grid g3\">' + card('Failure reasons', donut((f.reason || []).map(([l, n], i) => ({ l, v: n, c: CAT(i + 1) })), 'failures', { empty: 'No failed sign-ins. ' })) +\n    card('Top users', bars(facetRows(f.user, 'user'), { c: 'var(--s3)' })) + card('Sign-in sources', bars((f.ip || []).map(([ip, n]) => ({ l: ip, v: n, html: '<span class=\"mono\">' + esc(ip) + '</span>', attrs: 'data-ipd=\"' + esc(ip) + '\"' })), { c: 'var(--s7)', empty: 'Only local sign-ins.' })) + '</div>' +\n    '<div class=\"grid g2\">' + card('When it happens', weekHeat(fc.week), { sub: 'day of week × hour' }) + card('Latest', feed(fc.latest.slice(0, 8)), { right: '<a class=\"muted\" style=\"font-size:12px\" data-stab=\"events\">all →</a>' }) + '</div>';\n};\nasync function authSessions() {\n  const d = await get('/api/siem/sessions?days=' + ({ '24h': 7, '7d': 7, '30d': 30 }[range()] || 90), 15000);\n  const now = Date.now();\n  const sess = (d.sessions || []).filter(x => x.user || x.state === 'active');\n  const scards = sess.map(x => '<div class=\"ucard\"><div class=\"uav\">' + esc((x.user || '?').replace(/^.*\\\\/, '').slice(0, 2).toUpperCase()) + '</div><div class=\"ub\"><b>' + esc(x.user || '(no user)') + '</b>' + (x.self ? '<span class=\"tag\">this RigWatch</span>' : '') + '<div class=\"muted\">' + esc(x.station || '') + ' · session ' + x.id + (x.addr ? ' · from ' + esc(x.addr) : x.client ? ' · ' + esc(x.client) : '') + '</div><div class=\"ufoot\"><span class=\"chip ' + (x.state === 'active' ? 'good' : x.state === 'disconnected' ? 'warn' : '') + '\"><i></i>' + esc(x.state) + '</span>' + (x.logon ? '<span class=\"muted\">since ' + esc(F.date(x.logon)) + '</span>' : '') + (x.idleSec != null && x.idleSec > 60 && !/^console$/i.test(x.station || '') ? '<span class=\"muted\">idle ' + F.age(x.idleSec) + '</span>' : '') + '</div></div>' +\n    (RW.canControl() && x.id > 0 && d.platform === 'win32' ? '<div class=\"uacts\"><button class=\"btn sm\" data-sess=\"disconnect\" data-sid=\"' + x.id + '\" data-label=\"' + esc(x.user) + '\">Disconnect</button><button class=\"btn sm danger\" data-sess=\"logoff\" data-sid=\"' + x.id + '\" data-label=\"' + esc(x.user) + '\"' + (x.self ? ' data-self=\"1\"' : '') + '>Sign out</button></div>' : RW.canControl() && x.pid && d.platform !== 'win32' ? '<div class=\"uacts\"><button class=\"btn sm danger\" data-sess=\"logoff\" data-pid=\"' + x.pid + '\" data-label=\"' + esc(x.user) + '\">Sign out</button></div>' : '') + '</div>').join('');\n  const users = (d.users || []).map(u => '<div class=\"acard' + (u.enabled ? '' : ' off') + '\"><div class=\"uav sm\">' + esc(u.name.slice(0, 2).toUpperCase()) + '</div><div><b>' + esc(u.name) + '</b>' + (u.admin ? '<span class=\"tag flag\">admin</span>' : '') + (!u.enabled ? '<span class=\"tag\">disabled</span>' : '') + (u.source && u.source !== 'Local' ? '<span class=\"tag\">' + esc(u.source) + '</span>' : '') + '<div class=\"muted\">' + (u.last ? 'last sign-in ' + esc(F.ago(u.last)) : 'never signed in') + (u.desc ? ' · ' + esc(u.desc) : '') + '</div></div></div>').join('');\n  const smb = (d.smb || []).map(x => '<div class=\"acard\"><div class=\"uav sm\">' + icon('folder') + '</div><div><b class=\"mono\">' + esc(x.client) + '</b> <span class=\"muted\">' + esc(x.user) + '</span><div class=\"muted\">' + x.opens + ' open files · connected ' + F.age(x.secs) + ' · SMB ' + esc(x.dialect) + '</div></div>' + (RW.canControl() ? '<button class=\"btn sm danger\" data-sess=\"smbclose\" data-sid=\"' + esc(x.id) + '\" data-label=\"' + esc(x.client) + '\">Close</button>' : '') + '</div>').join('');\n  const lg = (d.logons || []).slice(0, 30).map(l => '<span class=\"chip\" title=\"' + esc(l.auth) + ' · logon id ' + esc(l.id) + '\"><i></i>' + esc(l.user) + ' · ' + esc(RW.LT[l.type] || 'type ' + l.type) + (l.start ? ' · ' + esc(F.ago(l.start)) : '') + '</span>').join('');\n  // who was signed in when (gantt)\n  const H = d.history || [], from = Math.min(now - 7 * 864e5, ...H.map(x => x.start)), span = now - from;\n  const lanes = [...new Set(H.map(x => x.user))].slice(0, 12);\n  const TC = { interactive: 'var(--s1)', 'remote desktop': 'var(--s2)', session: 'var(--s3)' };\n  const gid = nid('gt');\n  TIPS[gid] = i => { const x = H[i]; return '<b>' + esc(x.user) + '</b><div class=\"tiprows\"><div>' + esc(x.type) + (x.admin ? ' · admin' : '') + '</div><div>' + esc(F.date(x.start)) + ' → ' + (x.end ? esc(F.date(x.end)) : 'still signed in or unknown') + '</div>' + (x.ip ? '<div>from ' + esc(x.ip) + '</div>' : '') + '</div>'; };\n  const gantt = lanes.length ? '<div class=\"gantt\">' + lanes.map(u => '<div class=\"glane\"><span class=\"gl-u\" title=\"' + esc(u) + '\">' + esc(u.replace(/^.*\\\\/, '')) + '</span><div class=\"gl-t\">' + H.map((x, i) => x.user !== u ? '' : '<i data-tipk=\"' + gid + ':' + i + '\" style=\"left:' + (100 * (x.start - from) / span).toFixed(2) + '%;width:' + Math.max(0.4, 100 * ((x.end || now) - x.start) / span).toFixed(2) + '%;background:' + (TC[x.type] || 'var(--s4)') + (x.admin ? ';box-shadow:inset 0 0 0 2px var(--serious)' : '') + (x.end ? '' : ';opacity:.6') + '\"></i>').join('') + '</div></div>').join('') + '<div class=\"glane gax\"><span></span><div class=\"xax\"><span>' + esc(F.date(from)) + '</span><span>' + esc(F.date(from + span / 2)) + '</span><span>now</span></div></div></div>' + legend([['var(--s1)', 'interactive'], ['var(--s2)', 'remote desktop'], ['var(--s3)', 'session (Linux)'], ['var(--serious)', 'outline: admin']]) : '<div class=\"empty\">No sign-in history yet' + (d.platform === 'win32' && !d.admin ? ' (the Security log needs admin)' : '') + '.</div>';\n  return card('Signed in now', sess.length ? '<div class=\"ugrid\">' + scards + '</div>' : '<div class=\"empty\">No interactive sessions.</div>', { sub: (d.errors || []).join(' · ') }) +\n    card('Who was signed in when', gantt, { sub: 'last ' + Math.round(span / 864e5) + ' days' }) +\n    '<div class=\"grid g2\">' + card('Local accounts', users ? '<div class=\"agrid\">' + users + '</div>' : '<div class=\"empty\">Not available on this OS.</div>') + card('Logon sessions & file-sharing clients', (lg ? '<div class=\"srcs\">' + lg + '</div>' : '<div class=\"muted\">No other logon sessions visible' + (d.admin ? '' : ' (admin sees all)') + '.</div>') + '<h3>SMB clients</h3>' + (smb ? '<div class=\"agrid\">' + smb + '</div>' : '<div class=\"muted\">Nobody is connected to your shared folders.</div>')) + '</div>';\n}\nRW.LT = { 2: 'interactive', 3: 'network', 4: 'batch', 7: 'unlock', 8: 'network cleartext', 9: 'new credentials', 10: 'remote desktop', 11: 'cached', 12: 'cached remote', 13: 'cached unlock' };\n\n// ===== Network & IPs\nlet netTab = 'dash', ipFilter = 'all', ipQ = '', ipShow = 60;\nRENDER.network = async () => {\n  setH('sm-tabs', tabs([['dash', 'Dashboard'], ['ips', 'IP intelligence'], ['events', 'Events']], netTab));\n  if (netTab === 'events') return moduleEvents('network');\n  const [o, ips] = await Promise.all([overview(), get('/api/siem/ips?range=' + range())]);\n  if (netTab === 'ips') return ipCards(ips);\n  const fc = await facets({ module: 'network' }), f = fc.facets, L = ips.list;\n  const rules = new Map((f.rule || []).map(r => [r[0], r[1]]));\n  const scope = {}; for (const e of L) scope[e.kind] = (scope[e.kind] || 0) + 1;\n  const apps = {}; for (const e of L) for (const p of e.procs || []) apps[p] = (apps[p] || 0) + 1;\n  const kp = '<div class=\"skpis\">' + kpi('Remote addresses', nf(L.length), rangeLabel(), null, 'data-stab=\"ips\"', 'globe') + kpi('Public', nf(scope.public || 0), 'internet addresses', null, null, 'globe') +\n    kpi('Inbound from internet', nf(L.filter(e => e.inb && e.kind === 'public').length), 'addresses that connected in', L.some(e => e.inb && e.kind === 'public') ? 'var(--warn)' : null, 'data-f=\"rule:6005\"', 'alert') +\n    kpi('Port scans', nf(rules.get('6008') || 0), 'from the firewall log', rules.get('6008') ? 'var(--crit)' : null, 'data-f=\"rule:6008\"', 'radar') + kpi('Threat-feed hits', nf(L.filter(e => e.bad).length), ips.feedOn ? 'feed on' : 'feed off', L.some(e => e.bad) ? 'var(--crit)' : null, 'data-mod=\"response\"', 'fire') + kpi('Blocked', nf(o.blocks), 'addresses', null, 'data-mod=\"response\"', 'ban') + '</div>';\n  return kp + '<div class=\"grid g21\">' + card('Network events over time', stackBars(fc.hist, fc.step, { h: 160 })) + card('Address scope', donut(Object.entries(scope).sort((a, b) => b[1] - a[1]).map(([k, n], i) => ({ l: k === 'private' ? 'LAN' : k, v: n, c: CAT(i) })), 'addresses')) + '</div>' +\n    '<div class=\"grid g3\">' + card('Most active addresses', bars(L.slice().sort((a, b) => b.conns - a.conns).slice(0, 12).map(e => ({ l: e.ip, v: e.conns, sub: (e.procs || []).slice(-1)[0] || '', html: '<span class=\"mono\">' + esc(e.ip) + '</span>', attrs: 'data-ipd=\"' + esc(e.ip) + '\"' })), { c: 'var(--s1)' }), { sub: 'connections' }) +\n    card('Apps by remote addresses', bars(Object.entries(apps).sort((a, b) => b[1] - a[1]).map(([p, n]) => ({ l: p, v: n, attrs: 'data-f=\"proc:' + esc(p) + '\"' })), { c: 'var(--s3)' })) +\n    card('Event types', bars((f.rule || []).map(([id, n, d, lv]) => ({ l: d, v: n, c: SEVC[band(lv || 0)], attrs: 'data-f=\"rule:' + id + '\"' })))) + '</div>' +\n    '<div class=\"grid g2\">' + card('Inbound ports targeted', bars(facetRows(f.port, null).map(r => Object.assign(r, { l: 'port ' + r.l })), { c: 'var(--s2)', empty: 'No inbound attempts recorded.' })) + card('Latest', feed(fc.latest.slice(0, 8)), { right: '<a class=\"muted\" style=\"font-size:12px\" data-stab=\"events\">all →</a>' }) + '</div>';\n};\nfunction ipCards(ips) {\n  let L = ips.list;\n  if (ipFilter === 'public') L = L.filter(e => e.kind === 'public');\n  else if (ipFilter === 'lan') L = L.filter(e => e.kind === 'private' || e.kind === 'linklocal');\n  else if (ipFilter === 'inbound') L = L.filter(e => e.inb);\n  else if (ipFilter === 'flagged') L = L.filter(e => e.fail || e.drops || e.bad || e.maxLevel >= 7);\n  else if (ipFilter === 'blocked') L = L.filter(e => e.blocked);\n  if (ipQ) L = L.filter(e => (e.ip + ' ' + (e.procs || []).join(' ') + ' ' + ((RW.rdns && RW.rdns.get(e.ip)) || '')).toLowerCase().includes(ipQ));\n  resolve(L.slice(0, ipShow).map(e => e.ip));\n  const mxc = Math.max(1, ...L.map(e => e.conns));\n  const cards = L.slice(0, ipShow).map(e => {\n    const name = RW.rdns && RW.rdns.get(e.ip);\n    const flags = [e.bad ? '<span class=\"chip crit\"><i></i>' + esc(e.bad) + '</span>' : '', e.blocked ? '<span class=\"chip crit\"><i></i>blocked</span>' : '', e.inb ? '<span class=\"chip warn\"><i></i>inbound</span>' : '', e.fail ? '<span class=\"chip serious\"><i></i>' + e.fail + ' failed logons</span>' : '', e.drops ? '<span class=\"chip\"><i></i>' + nf(e.drops) + ' dropped</span>' : ''].join('');\n    return '<div class=\"ipcard' + (e.maxLevel >= 10 ? ' hot' : '') + '\" data-ipd=\"' + esc(e.ip) + '\"><div class=\"ipt\"><span class=\"mono\">' + esc(e.ip) + '</span>' + kindChip(e.kind) + (e.maxLevel ? levelBadge(e.maxLevel) : '') + '</div><div class=\"muted ipn\">' + esc(name || (e.procs || []).join(', ') || '—') + '</div>' +\n      '<div class=\"ipbar\"><i style=\"width:' + Math.max(2, 100 * e.conns / mxc).toFixed(1) + '%\"></i></div><div class=\"ipm\"><span><b>' + nf(e.conns) + '</b> conns</span><span>↓ ' + nf(e.inb) + ' ↑ ' + nf(e.outb) + '</span><span>' + esc(F.ago(e.last)) + '</span></div>' + (flags ? '<div class=\"ipf\">' + flags + '</div>' : '') + '</div>';\n  }).join('');\n  return '<div class=\"toolbar\"><input type=\"search\" id=\"ipq\" placeholder=\"Filter by address, app or host name\" value=\"' + esc(ipQ) + '\"><div class=\"seg\">' + [['all', 'All'], ['public', 'Public'], ['lan', 'LAN'], ['inbound', 'Inbound'], ['flagged', 'Flagged'], ['blocked', 'Blocked']].map(([k, l]) => '<button data-ipf=\"' + k + '\" class=\"' + (ipFilter === k ? 'on' : '') + '\">' + l + '</button>').join('') + '</div><span class=\"grow\"></span><span class=\"muted\">' + nf(L.length) + ' addresses · last ' + rangeLabel() + '</span></div>' +\n    (L.length ? '<div class=\"ipgrid\">' + cards + '</div>' + (L.length > ipShow ? '<div style=\"text-align:center;margin-top:12px\"><button class=\"btn\" data-ipmore=\"1\">Show more</button></div>' : '') : '<div class=\"empty\">No addresses match.</div>');\n}\nlet rdnsBusy = false;\nfunction resolve(list) {\n  if (rdnsBusy || !RW.rdns || !RW.settings.resolveHostnames) return;\n  const want = list.filter(ip => !RW.rdns.has(ip) && RW.ipKind(ip) === 'public').slice(0, 50);\n  if (!want.length) return;\n  rdnsBusy = true; want.forEach(ip => RW.rdns.set(ip, ''));\n  RW.api('/api/rdns?ips=' + want.join(',')).then(r => { let any = false; for (const [ip, n] of Object.entries(r)) { RW.rdns.set(ip, n); if (n) any = true; } if (any && cur && cur.id === 'network' && netTab === 'ips') schedule(50); }).catch(() => {}).finally(() => { rdnsBusy = false; });\n}\n\n// ===== Malware detection\nRENDER.malware = async () => {\n  const [fc, progs, sc] = await Promise.all([facets({ module: 'malware' }), get('/api/siem/programs?range=' + range()), get('/api/siem/sca', 30000).catch(() => null)]);\n  const f = fc.facets, rules = new Map((f.rule || []).map(r => [r[0], r[1]]));\n  const av = sc && sc.checks ? sc.checks.find(c => c.id === 'win.av.on') : null;\n  const kp = '<div class=\"skpis\">' + kpi('Detections', nf((rules.get('5001') || 0) + (rules.get('5002') || 0)), 'antivirus', rules.get('5001') ? 'var(--crit)' : null, 'data-f=\"group:malware\"', 'fire') +\n    kpi('Suspicious processes', nf(rules.get('7002') || 0), 'fake names, temp folders, tampered binaries', rules.get('7002') ? 'var(--serious)' : null, 'data-f=\"rule:7002\"', 'alert') +\n    kpi('First-run programs', nf(progs.length), rangeLabel(), null, 'data-f=\"rule:7001\"', 'box') + kpi('Threat-feed hits', nf(rules.get('6006') || 0), 'known-bad addresses', rules.get('6006') ? 'var(--crit)' : null, 'data-f=\"rule:6006\"', 'globe') +\n    kpi('Protection changes', nf((rules.get('5003') || 0) + (rules.get('5004') || 0)), 'turned off, exclusions', (rules.get('5003') || rules.get('5004')) ? 'var(--serious)' : null, 'data-f=\"group:defender\"', 'shield') +\n    kpi('Antivirus', av ? (av.result === 'passed' ? 'active' : av.result === 'failed' ? 'off' : 'unknown') : '–', av ? av.detail : '', av && av.result === 'failed' ? 'var(--crit)' : av && av.result === 'passed' ? 'var(--good)' : null, 'data-mod=\"sca\"', 'shield') + '</div>';\n  const pc = progs.slice(0, 24).map(p => '<div class=\"pcard\"><div class=\"uav sm\">' + icon('box') + '</div><div style=\"min-width:0\"><b>' + esc(p.name) + '</b><div class=\"muted mono ell\" title=\"' + esc(p.exe) + '\">' + esc(p.exe) + '</div><div class=\"muted\">first ran ' + esc(F.date(p.first)) + '</div></div></div>').join('');\n  return kp + '<div class=\"grid g21\">' + card('Malware-related events over time', stackBars(fc.hist, fc.step, { h: 160 })) + card('By type', donut((f.rule || []).map(([id, n, d], i) => ({ l: d, v: n, c: CAT(i), f: 'rule:' + id })), 'events')) + '</div>' +\n    '<div class=\"grid g2\">' + card('Threats', bars(facetRows(f.threat, null), { c: 'var(--crit)', empty: 'No threats detected. ' })) + card('Latest', feed(fc.latest.slice(0, 6))) + '</div>' +\n    card('Programs that ran for the first time', pc ? '<div class=\"pgrid\">' + pc + '</div>' + (progs.length > 24 ? '<div class=\"muted\" style=\"margin-top:8px\">+ ' + (progs.length - 24) + ' more · ' + huntLink('rule:7001', 'see all') + '</div>' : '') : '<div class=\"empty\">No new programs in this period. RigWatch learns what normally runs here and reports newcomers.</div>');\n};\n\n// ===== Integrity monitoring\nlet fimTab = 'dash';\nRENDER.fim = async () => {\n  setH('sm-tabs', tabs([['dash', 'Dashboard'], ['monitored', 'Monitored locations'], ['events', 'Events']], fimTab));\n  if (fimTab === 'events') return moduleEvents('fim');\n  const v = await get('/api/siem/fim', 10000);\n  if (fimTab === 'monitored') {\n    const o = await overview();\n    const loc = v.locations.map(l => '<div class=\"lcard\"><div class=\"uav sm\">' + icon(l.custom ? 'folder' : 'file') + '</div><div style=\"min-width:0\"><b>' + esc(l.tag) + '</b>' + (l.custom ? '<span class=\"tag\">custom</span>' : '') + '<div class=\"mono muted ell\" title=\"' + esc(l.path) + '\">' + esc(l.path) + '</div><div class=\"ufoot\"><span class=\"chip ' + (l.ok ? 'good' : l.err === 'not present' ? '' : 'warn') + '\"><i></i>' + (l.ok ? nf(l.files) + ' files' : esc(l.err || 'pending')) + '</span><span class=\"muted\">level ' + l.level + '</span></div></div>' + (l.custom && RW.canControl() ? '<button class=\"btn sm ghost\" data-fimdel=\"' + esc(l.path) + '\">' + icon('x') + '</button>' : '') + '</div>').join('');\n    const reg = (v.autostart || []).map(x => '<div class=\"rrow\"><b>' + esc(x.name) + '</b><span class=\"mono muted ell\" title=\"' + esc(x.value) + '\">' + esc(x.value) + '</span><span class=\"muted ell\" title=\"' + esc(x.key) + '\">' + esc(x.key.replace(/^HK(LM|CU)\\\\SOFTWARE\\\\/, 'HK$1\\\\…\\\\')) + '</span></div>').join('');\n    return '<div class=\"toolbar\"><button class=\"btn primary\" data-fimscan=\"1\"' + (RW.canControl() ? '' : ' disabled') + '>' + icon('refresh') + 'Scan now</button>' + (RW.canControl() ? '<button class=\"btn\" data-fimadd=\"1\">' + icon('plus') + 'Watch a folder</button>' : '') + '<span class=\"muted\">Last scan ' + (v.at ? esc(F.ago(v.at)) : 'pending') + ' · every 10 minutes and on change · ' + nf(v.files) + ' files</span></div>' +\n      '<div class=\"lgrid\">' + loc + '</div>' + (v.registryStatus || (o.agent.platform === 'win32') ? card('Autostart registry entries', reg ? '<div class=\"rlist\">' + reg + '</div>' : '<div class=\"empty\">' + esc((v.registryStatus && v.registryStatus.err) || 'Not scanned yet.') + '</div>', { sub: nf(v.registry) + ' entries: Run / RunOnce, Winlogon, debugger hijacks' }) : '');\n  }\n  const fc = await facets({ module: 'fim' }), f = fc.facets, rules = new Map((f.rule || []).map(r => [r[0], r[1]]));\n  const kp = '<div class=\"skpis\">' + kpi('Files monitored', nf(v.files), v.locations.filter(l => l.ok).length + ' locations', null, 'data-stab=\"monitored\"', 'file') + kpi('Autostart entries', nf(v.registry), 'registry', null, 'data-stab=\"monitored\"', 'key') +\n    kpi('Changes', nf(fc.total), rangeLabel(), null, null, 'activity') + kpi('Added', nf(rules.get('9101') || 0), 'files', null, 'data-f=\"rule:9101\"', 'plus') + kpi('Modified', nf(rules.get('9102') || 0), 'files', rules.get('9102') ? 'var(--warn)' : null, 'data-f=\"rule:9102\"', 'edit') + kpi('Deleted', nf(rules.get('9103') || 0), 'files', null, 'data-f=\"rule:9103\"', 'trash') + '</div>';\n  return kp + '<div class=\"grid g21\">' + card('Changes over time', stackBars(fc.hist, fc.step, { h: 150 })) + card('Actions', donut((f.rule || []).map(([id, n, d], i) => ({ l: d.replace(/ (to|from) a monitored location|Monitored file /g, '').replace(/^File /, ''), v: n, c: CAT(i), f: 'rule:' + id })), 'changes', { empty: 'No changes yet. A baseline is taken on the first scan.' })) + '</div>' +\n    '<div class=\"grid g2\">' + card('Most changed files', bars((f.path || []).map(([p, n]) => ({ l: p.split(/[\\\\/]/).pop(), sub: p.split(/[\\\\/]/).slice(-2, -1)[0] || '', title: p, v: n, attrs: 'data-f=\"' + esc('\"' + p + '\"') + '\"' })), { c: 'var(--s4)', empty: 'Nothing changed.' })) + card('By location', donut((f.tag || []).map(([t, n], i) => ({ l: t, v: n, c: CAT(i + 2) })), 'changes')) + '</div>' +\n    card('Latest changes', feed(fc.latest.slice(0, 10), 'No file or autostart changes in this period.'));\n};\n\n// ===== Configuration assessment\nlet scaFilter = 'all';\nRENDER.sca = async () => {\n  const v = await get('/api/siem/sca', 10000);\n  const hist = v.history || [];\n  const cats = [...new Set(v.checks.map(c => c.cat))];\n  const list = v.checks.filter(c => scaFilter === 'all' || (scaFilter === 'failed' ? c.result === 'failed' : scaFilter === 'passed' ? c.result === 'passed' : c.result === 'not applicable'));\n  const res = r => (r === 'passed' ? '<span class=\"chip good\"><i></i>Passed</span>' : r === 'failed' ? '<span class=\"chip crit\"><i></i>Failed</span>' : '<span class=\"chip\"><i></i>N/A</span>');\n  const byCat = cats.map(c => { const xs = v.checks.filter(x => x.cat === c), p = xs.filter(x => x.result === 'passed').length, fl = xs.filter(x => x.result === 'failed').length; return { c, p, fl, s: p + fl ? Math.round(100 * p / (p + fl)) : null }; });\n  const head = '<div class=\"grid g3\">' +\n    card('Score', '<div style=\"max-width:230px;margin:0 auto\">' + RW.gauge(v.score || 0, 100, RW.scoreColor(v.score || 0), v.score == null ? '–' : v.score + '%', 'checks passed') + '</div><div class=\"scac\"><span class=\"chip good\"><i></i>' + v.passed + ' passed</span><span class=\"chip crit\"><i></i>' + v.failed + ' failed</span><span class=\"chip\"><i></i>' + v.na + ' not applicable</span></div><div class=\"muted\" style=\"text-align:center;font-size:12px;margin-top:8px\">' + esc(v.policy) + '</div>', { right: '<button class=\"btn sm\" data-scarun=\"1\"' + (RW.canControl() ? '' : ' disabled') + '>' + icon('refresh') + 'Run now</button>' }) +\n    card('Score by category', bars(byCat.filter(x => x.s != null).map(x => ({ l: x.c, v: Math.max(1, x.s), sub: x.p + '/' + (x.p + x.fl), c: 'var(' + RW.scoreColor(x.s) + ')' })), { max: 20 })) +\n    card('Score history', hist.length > 1 ? lines(hist.map(h => h.at), [{ l: 'Score %', c: 'var(--good)', v: hist.map(h => h.score || 0) }, { l: 'Failed checks', c: 'var(--crit)', v: hist.map(h => h.failed) }], 864e5, { h: 140 }) : '<div class=\"empty\">One point per day. Come back tomorrow for a trend.</div>', { sub: v.at ? 'last run ' + F.ago(v.at) : '' }) + '</div>';\n  const checks = '<div class=\"toolbar\"><div class=\"seg\">' + [['all', 'All ' + v.checks.length], ['failed', 'Failed ' + v.failed], ['passed', 'Passed ' + v.passed], ['na', 'N/A ' + v.na]].map(([k, l]) => '<button data-scaf=\"' + k + '\" class=\"' + (scaFilter === k ? 'on' : '') + '\">' + l + '</button>').join('') + '</div></div>' +\n    cats.map(c => { const xs = list.filter(x => x.cat === c); if (!xs.length) return ''; return '<h3 class=\"scat\">' + esc(c) + '</h3><div class=\"sclist\">' + xs.map(x => '<details class=\"scrow ' + x.result.replace(/ /g, '') + '\"><summary>' + res(x.result) + '<b>' + esc(x.title) + '</b><span class=\"muted ell\">' + esc(x.detail || '') + '</span></summary><div class=\"scd\"><p><b>Why:</b> ' + esc(x.rationale || '') + '</p><p><b>Fix:</b> <span class=\"mono\">' + esc(x.remediation || '') + '</span></p><div class=\"srcs\">' + Object.entries(x.compliance || {}).map(([fw, reqs]) => (reqs || []).map(r => '<span class=\"chip\"><i></i>' + esc((FWS.find(z => z[0] === fw) || [0, fw])[1]) + ' ' + esc(r) + '</span>').join('')).join('') + '<span class=\"chip\"><i></i>' + esc(x.id) + '</span></div></div></details>').join('') + '</div>'; }).join('');\n  return head + card('Checks', checks, { sub: v.err ? 'note: ' + v.err : 'click a check for the reason and the fix' });\n};\n\n// ===== System auditing\nRENDER.audit = async () => {\n  const fc = await facets({ module: 'audit' }), f = fc.facets, rules = new Map((f.rule || []).map(r => [r[0], r[1]]));\n  const sum = ids => ids.reduce((a, id) => a + (rules.get(String(id)) || 0), 0);\n  const kp = '<div class=\"skpis\">' + kpi('Account changes', nf(sum([3001, 3002, 3003, 3004, 3005, 3006, 3007])), 'created, deleted, groups', sum([3007]) ? 'var(--crit)' : null, 'data-f=\"group:account_changed\"', 'user') +\n    kpi('New services', nf(sum([4004])), 'installed', sum([4004]) ? 'var(--warn)' : null, 'data-f=\"rule:4004\"', 'cog') + kpi('Scheduled tasks', nf(sum([4005])), 'created', null, 'data-f=\"rule:4005\"', 'clock') +\n    kpi('Logs cleared', nf(sum([4001, 4002])), 'anti-forensics', sum([4001, 4002]) ? 'var(--crit)' : null, 'data-f=\"group:log_cleared\"', 'trash') + kpi('Firewall rule changes', nf(sum([5005, 5006, 5007])), 'by programs', null, 'data-f=\"group:firewall\"', 'shield') +\n    kpi('Restarts', nf(sum([1002, 1003, 1004])), sum([1004]) + ' unexpected', sum([1004]) ? 'var(--warn)' : null, 'data-f=\"group:system\"', 'power') + '</div>';\n  return kp + '<div class=\"grid g21\">' + card('Audit events over time', stackBars(fc.hist, fc.step, { h: 160 })) + card('Categories', donut((f.group || []).filter(([g]) => ['account_changed', 'service_installed', 'scheduled_task', 'log_cleared', 'policy_changed', 'audit', 'system', 'firewall', 'defender'].includes(g)).map(([g, n], i) => ({ l: g.replace(/_/g, ' '), v: n, c: CAT(i), f: 'group:' + g })), 'events')) + '</div>' +\n    '<div class=\"grid g2\">' + card('What happened', bars((f.rule || []).map(([id, n, d, lv]) => ({ l: d, v: n, c: SEVC[band(lv || 0)], attrs: 'data-f=\"rule:' + id + '\"' })))) + card('Changed by', bars(facetRows(f.process, 'proc'), { c: 'var(--s4)', empty: 'No program information.' })) + '</div>' +\n    card('Latest', feed(fc.latest.slice(0, 12)));\n};\n\n// ===== Active response\nRENDER.response = async () => {\n  const [b, fc] = await Promise.all([get('/api/siem/blocks', 5000), facets({ module: 'response' })]);\n  const S = b.settings, can = RW.canControl();\n  const now = Date.now();\n  const bl = b.list.map(x => '<div class=\"bcard\"><div class=\"uav sm\" style=\"color:var(--crit)\">' + icon('ban') + '</div><div style=\"min-width:0\"><b class=\"mono clk\" data-ipd=\"' + esc(x.ip.split('/')[0]) + '\">' + esc(x.ip) + '</b><span class=\"tag' + (x.by === 'auto' ? ' flag' : '') + '\">' + esc(x.by) + '</span><div class=\"muted ell\" title=\"' + esc(x.reason) + '\">' + esc(x.reason || '') + '</div><div class=\"muted\">' + (x.at ? 'since ' + esc(F.date(x.at)) : 'found in firewall') + ' · ' + (x.until ? 'expires in ' + F.age((x.until - now) / 1000) : 'permanent') + '</div></div>' + (can ? '<button class=\"btn sm\" data-unblock=\"' + esc(x.ip) + '\">Unblock</button>' : '') + '</div>').join('');\n  const lvOpt = (v, list) => list.map(([k, l]) => '<option value=\"' + k + '\"' + (String(v) === String(k) ? ' selected' : '') + '>' + l + '</option>').join('');\n  const durs = [[60, '1 hour'], [360, '6 hours'], [1440, '24 hours'], [10080, '7 days'], [43200, '30 days'], [0, 'permanent']];\n  const fwl = b.firewallLog;\n  return (!b.supported ? '<div class=\"note snote\">' + icon('info') + '<div>Blocking addresses is available on Windows and Linux.</div></div>' : !b.admin ? '<div class=\"note snote\">' + icon('shield') + '<div><b>Blocking needs admin</b> (Windows Firewall rules). <button class=\"btn sm primary\" data-cmd=\"elevate\">' + icon('shield') + 'Restart as admin</button></div></div>' : '') +\n    '<div class=\"grid g3 g311\">' +\n    card('Blocked addresses', (can ? '<div class=\"bform\"><input id=\"bip\" placeholder=\"IP or range, e.g. 203.0.113.7 or 203.0.113.0/24\"><select id=\"bdur\">' + lvOpt(1440, durs) + '</select><input id=\"breason\" placeholder=\"Reason (optional)\"><button class=\"btn danger\" data-blockform=\"1\">' + icon('ban') + 'Block</button></div>' : '') + (bl ? '<div class=\"blist\">' + bl + '</div>' : '<div class=\"empty\">Nothing blocked. Block from any event, IP card, or here.</div>') + (b.err ? '<div class=\"muted\" style=\"margin-top:8px\">' + esc(b.err) + '</div>' : ''), { sub: b.list.length + ' active' }) +\n    card('Automatic blocking', '<label class=\"tgl\"><input type=\"checkbox\" data-sset=\"autoBlock\"' + (S.autoBlock ? ' checked' : '') + (can ? '' : ' disabled') + '><span>Block attackers automatically</span></label><div class=\"muted\" style=\"font-size:12.5px;margin:6px 0 12px\">When a brute-force, port-scan or threat-feed alert fires for a public address, RigWatch adds a Windows Firewall / iptables block. Never blocks this machine, your gateway, DNS servers or trusted addresses.</div>' +\n      '<label class=\"field\">Minimum level<select data-sset=\"autoLevel\"' + (can ? '' : ' disabled') + '>' + lvOpt(S.autoLevel, [[8, '8+'], [10, '10+ (high)'], [12, '12+ (critical)']]) + '</select></label><label class=\"field\">Block for<select data-sset=\"autoMinutes\"' + (can ? '' : ' disabled') + '>' + lvOpt(S.autoMinutes, durs) + '</select></label>' +\n      '<label class=\"tgl\"><input type=\"checkbox\" data-sset=\"allowPrivate\"' + (S.allowPrivate ? ' checked' : '') + (can ? '' : ' disabled') + '><span>Also block LAN addresses</span></label>' +\n      '<h3>Notifications</h3><label class=\"field\">Pop-up and webhook from level<select data-sset=\"notifyLevel\"' + (can ? '' : ' disabled') + '>' + lvOpt(S.notifyLevel, [[7, '7+'], [10, '10+'], [12, '12+'], [16, 'never']]) + '</select></label>') +\n    card('Threat intelligence', '<label class=\"tgl\"><input type=\"checkbox\" data-sset=\"feed\"' + (S.feed ? ' checked' : '') + (can ? '' : ' disabled') + '><span>Check addresses against threat feeds</span></label><div class=\"muted\" style=\"font-size:12.5px;margin:6px 0 10px\">Downloads FireHOL level 1 and the abuse.ch Feodo list once a day (no data is sent). Matches raise level-12 alerts.</div>' +\n      (S.feed ? '<div class=\"kvs\">' + b.feed.feeds.map(x => '<div><span>' + esc(x.name) + '</span><b>' + (x.entries ? nf(x.entries) + ' ranges' : '–') + '</b></div>').join('') + '</div><div class=\"muted\" style=\"font-size:12px;margin-top:6px\">' + (b.feed.at ? 'updated ' + esc(F.ago(b.feed.at)) : 'not downloaded yet') + (b.feed.err ? ' · ' + esc(b.feed.err) : '') + '</div>' + (can ? '<button class=\"btn sm\" style=\"margin-top:8px\" data-feedref=\"1\">' + icon('refresh') + 'Update now</button>' : '') : '') +\n      (fwl ? '<h3>Firewall drop log</h3><label class=\"tgl\"><input type=\"checkbox\" data-fwlog=\"1\"' + (fwl.enabled ? ' checked' : '') + (can && b.admin ? '' : ' disabled') + '><span>Log dropped packets (detects port scans)</span></label><div class=\"muted mono ell\" style=\"font-size:11.5px;margin-top:4px\" title=\"' + esc(fwl.file) + '\">' + esc(fwl.file || '') + '</div>' + (fwl.err ? '<div class=\"muted\" style=\"font-size:12px\">' + esc(fwl.err) + '</div>' : '') : '') +\n      '<h3>Trusted addresses</h3><textarea id=\"trusted\" rows=\"3\" placeholder=\"one IP per line: never blocked\"' + (can ? '' : ' disabled') + '>' + esc((S.trusted || []).join('\\n')) + '</textarea>' + (can ? '<button class=\"btn sm\" data-trustsave=\"1\">Save</button>' : '')) + '</div>' +\n    '<div class=\"grid g2\">' + card('Responses over time', stackBars(fc.hist, fc.step, { h: 140 })) + card('History', feed(fc.latest.slice(0, 10), 'No blocks yet.')) + '</div>';\n};\n\n// ===== Compliance\nlet fwSel = 'pci_dss';\nRENDER.compliance = async c => {\n  if (c.params.fw && !c.fwUsed) { fwSel = c.params.fw; c.fwUsed = true; }\n  setH('sm-tabs', '<div class=\"toolbar\"><div class=\"seg\">' + FWS.map(([k, l]) => '<button data-fwsel=\"' + k + '\" class=\"' + (fwSel === k ? 'on' : '') + '\">' + l + '</button>').join('') + '</div><span class=\"muted\" style=\"font-size:12px\">Requirement tags follow the style of the Wazuh ruleset: a guide for audits, not a certification.</span></div>');\n  const [m, fc] = await Promise.all([meta(), facets({ module: 'compliance', fw: fwSel })]);\n  const fw = m.compliance[fwSel], reqs = Object.keys(fw.reqs), cnt = new Map(fc.facets.req || []), mx = Math.max(1, ...cnt.values());\n  const rulesFor = r => m.rules.filter(x => (x.compliance[fwSel] || []).includes(r)).map(x => x.id).join(',');\n  const tiles = reqs.map(r => { const n = cnt.get(r) || 0, ids = rulesFor(r); return '<a class=\"ctile' + (n ? '' : ' zero') + '\"' + (ids ? ' data-f=\"rule:' + ids + '\"' : '') + ' style=\"' + (n ? 'background:color-mix(in srgb, var(--s1) ' + Math.round(12 + 55 * n / mx) + '%, var(--panel2))' : '') + '\"><b>' + esc(r) + '</b><span>' + esc(fw.reqs[r]) + '</span><em>' + (n ? nf(n) + ' events' : 'no events') + '</em></a>'; }).join('');\n  const kp = '<div class=\"skpis\">' + kpi('Events mapped', nf(fc.total), fw.name + ' · ' + rangeLabel(), null, null, 'book') + kpi('Requirements with events', cnt.size + ' / ' + reqs.length, 'covered by RigWatch rules', null, null, 'clipboard') + kpi('Top requirement', (fc.facets.req || [])[0] ? fc.facets.req[0][0] : '–', (fc.facets.req || [])[0] ? fw.reqs[fc.facets.req[0][0]] || '' : '', null, null, 'target') + kpi('High or critical', nf(histTotals(fc.hist)[3] + histTotals(fc.hist)[4]), 'level 10+', null, null, 'alert') + '</div>';\n  return kp + card('Requirements', '<div class=\"cgrid\">' + tiles + '</div>', { sub: 'click to see the events' }) +\n    '<div class=\"grid g2\">' + card('Events per requirement', bars((fc.facets.req || []).map(([r, n]) => ({ l: r + ' · ' + (fw.reqs[r] || ''), v: n, attrs: 'data-f=\"rule:' + rulesFor(r) + '\"' })), { c: 'var(--s1)', max: 14 })) + card(fw.name + ' events over time', stackBars(fc.hist, fc.step, { h: 160 })) + '</div>';\n};\n\n// ===== shared \"Events\" tab of a module\nasync function moduleEvents(mod) {\n  const fc = await facets({ module: mod });\n  return card(nf(fc.total) + ' events', stackBars(fc.hist, fc.step, { h: 110 }), { sub: rangeLabel() }) + '<article class=\"card\">' + feed(fc.latest, 'No events in this period.') + (fc.total > fc.latest.length ? '<div style=\"text-align:center;margin-top:10px\"><button class=\"btn\" data-f=\"' + esc('group:' + ({ auth: 'authentication_success,authentication_failed,authentication_failures,logoff,session,rdp,sshd,sudo', network: 'network', fim: 'syscheck' }[mod] || mod)) + '\">' + icon('search') + 'All in threat hunting</button></div>' : '') + '</article>';\n}\n\n// ------------------------------------------------------------------ pages + interaction\nfunction makePage(id) {\n  const m = MODS[id];\n  RW.pages[id === 'overview' ? 'siem' : 'siem-' + id] = {\n    title: m.name, sub: 'SIEM · ' + m.desc, keepOnParams: true,\n    mount(root, params) {\n      cur = { id, params, root };\n      if (id === 'overview') { RW.siemNew = 0; const el = document.getElementById('nb-siem'); if (el) el.className = 'badge hidden'; }\n      root.innerHTML = shell(id);\n      render();\n    },\n    onParams(p) { cur = { id, params: p, root: cur && cur.root }; if (id === 'hunt' && p.q != null) { hunt.q = p.q; hunt.events = null; } if (id === 'compliance' && p.fw) fwSel = p.fw; render(); },\n    unmount() { cur = null; clearTimeout(renderTimer); renderTimer = null; },\n    update() {},\n  };\n}\nObject.keys(MODS).forEach(makePage);\n\ndocument.addEventListener('click', async e => {\n  if (!RW.page || (!RW.page.startsWith('siem') && !e.target.closest('#drawer'))) return;\n  const t = e.target;\n  const el = s => t.closest(s);\n  let x;\n  if ((x = el('[data-mod]'))) { e.preventDefault(); const id = x.dataset.mod; return RW.go(id === 'overview' ? 'siem' : 'siem-' + id, x.dataset.fwp ? { fw: x.dataset.fwp } : undefined); }\n  if ((x = el('[data-srange]'))) { RW.prefs.siemRange = x.dataset.srange; RW.savePrefs(); RW.$$('[data-srange]').forEach(b => b.classList.toggle('on', b === x)); cache.clear(); rulesMeta = null; hunt.events = null; return render(); }\n  if (el('[data-srefresh]')) { cache.clear(); hunt.events = null; return render(); }\n  if ((x = el('[data-stab]'))) { const k = x.dataset.stab; if (cur.id === 'auth') authTab = k; else if (cur.id === 'network') netTab = k; else if (cur.id === 'fim') fimTab = k; return render(); }\n  if ((x = el('[data-copyev]'))) { e.stopPropagation(); try { await navigator.clipboard.writeText(JSON.stringify(JSON.parse(x.dataset.copyev), null, 2)); RW.toast('Event copied', 'ok'); } catch { RW.toast('Copy failed', 'err'); } return; }\n  if ((x = el('[data-block]'))) {\n    e.stopPropagation();\n    const ip = x.dataset.block;\n    const v = await RW.prompt('Block ' + ip + '?', [{ name: 'minutes', label: 'For how long', options: [['60', '1 hour'], ['1440', '24 hours'], ['10080', '7 days'], ['43200', '30 days'], ['0', 'permanently']], value: '1440' }, { name: 'reason', label: 'Reason (optional)', placeholder: 'e.g. brute force on RDP' }], 'Block');\n    if (!v) return;\n    try { const r = await RW.api('/api/siem/block', { method: 'POST', body: { ip, minutes: +v.minutes, reason: v.reason } }); RW.toast(r.msg, 'ok'); cache.clear(); render(); if (RW.drawer.cur) RW.openIp(ip); } catch (er) { RW.toast(er.message, 'err', 8000); }\n    return;\n  }\n  if ((x = el('[data-unblock]'))) { e.stopPropagation(); try { const r = await RW.api('/api/siem/unblock', { method: 'POST', body: { ip: x.dataset.unblock } }); RW.toast(r.msg, 'ok'); cache.clear(); render(); } catch (er) { RW.toast(er.message, 'err', 8000); } return; }\n  if ((x = el('[data-ipd]'))) { e.preventDefault(); e.stopPropagation(); return RW.openIp(x.dataset.ipd); }\n  if ((x = el('[data-evx]'))) { if (String(window.getSelection())) return; const k = x.dataset.evx; if (expanded.has(k)) expanded.delete(k); else expanded.add(k); const item = x.closest('.sev-ev'); const ev = findEv(k); if (item && ev) item.outerHTML = evItem(ev); return; }\n  if ((x = el('[data-f]'))) { e.preventDefault(); if (RW.drawer.cur) RW.drawer.close(); return addFilter(x.dataset.f); }\n  if (!cur) return;\n  if ((x = el('[data-hq]'))) { hunt.q = x.dataset.hq; hunt.events = null; const i = document.getElementById('hq'); if (i) i.value = hunt.q; return render(); }\n  if (el('[data-more]')) return huntMore();\n  if ((x = el('[data-tech]'))) { mitreSel = x.dataset.tech || null; return render(); }\n  if ((x = el('[data-ipf]'))) { ipFilter = x.dataset.ipf; ipShow = 60; return render(); }\n  if (el('[data-ipmore]')) { ipShow += 90; return render(); }\n  if ((x = el('[data-scaf]'))) { scaFilter = x.dataset.scaf; return render(); }\n  if (el('[data-scarun]')) { x = el('[data-scarun]'); x.disabled = true; x.textContent = 'Running…'; try { await RW.api('/api/siem/sca/run', { method: 'POST' }); cache.clear(); } catch (er) { RW.toast(er.message, 'err'); } return render(); }\n  if (el('[data-fimscan]')) { x = el('[data-fimscan]'); x.disabled = true; try { const r = await RW.api('/api/siem/fim/scan', { method: 'POST' }); RW.toast(r.msg, 'ok'); cache.clear(); } catch (er) { RW.toast(er.message, 'err'); } return render(); }\n  if (el('[data-fimadd]')) { const v = await RW.prompt('Watch a folder', [{ name: 'p', label: 'Absolute path (up to 3 levels deep, 20 folders max)', placeholder: 'C:\\\\Users\\\\you\\\\projects\\\\api\\\\config' }], 'Watch'); if (!v || !v.p) return; const list = (await overview()).settings.fimPaths || []; return saveSettings({ fimPaths: list.concat([v.p.trim()]) }, 'Watching ' + v.p); }\n  if ((x = el('[data-fimdel]'))) { const list = ((await overview()).settings.fimPaths || []).filter(p => p !== x.dataset.fimdel); return saveSettings({ fimPaths: list }, 'Removed'); }\n  if ((x = el('[data-fwsel]'))) { fwSel = x.dataset.fwsel; return render(); }\n  if (el('[data-blockform]')) {\n    const ip = document.getElementById('bip').value.trim(); if (!ip) return RW.toast('Enter an address', 'err');\n    try { const r = await RW.api('/api/siem/block', { method: 'POST', body: { ip, minutes: +document.getElementById('bdur').value, reason: document.getElementById('breason').value } }); RW.toast(r.msg, 'ok'); cache.clear(); render(); } catch (er) { RW.toast(er.message, 'err', 8000); }\n    return;\n  }\n  if (el('[data-trustsave]')) return saveSettings({ trusted: document.getElementById('trusted').value.split(/\\s+/).filter(Boolean) }, 'Trusted addresses saved');\n  if (el('[data-feedref]')) { try { const r = await RW.api('/api/siem/feeds/refresh', { method: 'POST' }); RW.toast(r.msg, 'ok'); cache.clear(); render(); } catch (er) { RW.toast(er.message, 'err'); } return; }\n  if ((x = el('[data-sess]'))) {\n    const a = x.dataset.sess, label = x.dataset.label || '';\n    const msg = a === 'logoff' ? (x.dataset.self ? 'This is the session RigWatch runs in: signing it out stops RigWatch and closes every app in it.' : 'Closes every app of ' + label + ' without saving.') : a === 'disconnect' ? 'Disconnects ' + label + ' (apps keep running).' : 'Closes the file-sharing connection from ' + label + '.';\n    if (!(await RW.confirm({ logoff: 'Sign out ' + label + '?', disconnect: 'Disconnect ' + label + '?', smbclose: 'Close SMB session?' }[a], esc(msg), { danger: a !== 'disconnect', ok: { logoff: 'Sign out', disconnect: 'Disconnect', smbclose: 'Close' }[a] }))) return;\n    try { const r = await RW.api('/api/siem/session', { method: 'POST', body: { action: a === 'smbclose' ? 'smbclose' : a, id: x.dataset.sid, pid: x.dataset.pid, label } }); RW.toast(r.msg, 'ok'); cache.clear(); render(); } catch (er) { RW.toast(er.message, 'err', 8000); }\n  }\n});\ndocument.addEventListener('change', e => {\n  if (!RW.page || !RW.page.startsWith('siem')) return;\n  const t = e.target;\n  if (t.id === 'hmin') { hunt.min = t.value; hunt.events = null; return render(); }\n  if (t.dataset.sset) { const k = t.dataset.sset; return saveSettings({ [k]: t.type === 'checkbox' ? t.checked : +t.value }, 'Saved'); }\n  if (t.dataset.fwlog) { RW.api('/api/siem/fwlog', { method: 'POST', body: { on: t.checked } }).then(r => { RW.toast(r.msg, 'ok'); cache.clear(); render(); }).catch(er => { RW.toast(er.message, 'err', 8000); t.checked = !t.checked; }); }\n});\ndocument.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'hq') { hunt.q = e.target.value.trim(); hunt.events = null; render(); } });\ndocument.addEventListener('input', e => { if (e.target.id === 'ipq') { ipQ = e.target.value.trim().toLowerCase(); clearTimeout(ipCards.t); ipCards.t = setTimeout(() => { render().then(() => { const i = document.getElementById('ipq'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }); }, 250); } });\nasync function saveSettings(body, msg) { try { await RW.api('/api/siem/settings', { method: 'PUT', body }); RW.toast(msg || 'Saved', 'ok'); cache.clear(); render(); } catch (er) { RW.toast(er.message, 'err', 8000); } }\nfunction findEv(k) {\n  const pools = [hunt.events || [], drawerEvents];\n  for (const v of cache.values()) { const d = v.data; if (d && d.latest) pools.push(d.latest); if (d && d.events) pools.push(d.events); if (d && d.recent) pools.push(d.recent); }\n  for (const p of pools) for (const ev of p) if (evKey(ev) === k) return ev;\n  return null;\n}\n// tooltips for every SIEM chart\ndocument.addEventListener('mousemove', e => {\n  const h = e.target.closest && e.target.closest('[data-tipk]');\n  if (!h) { if (RW.__stip) { RW.tip(null); RW.__stip = false; } return; }\n  const [id, i] = h.dataset.tipk.split(':');\n  if (TIPS[id]) { RW.tip(TIPS[id](+i), e.clientX, e.clientY); RW.__stip = true; }\n});\n})();\n","public/js/pages-system.js":"'use strict';\n/* Pages: Performance, Processes (+ process drawer), Sensors, System. */\n(() => {\nconst { esc, f: F, icon, setH } = RW;\n\n// ======================= Performance =======================\nconst PERF = [\n  ['CPU', 'cpu'], ['GPU', 'gpu'], ['Memory', 'mem'], ['VRAM', 'vram'], ['Network throughput', 'net'], ['Packets', 'pkts'],\n  ['Disk I/O', 'disk'], ['Temperatures', 'temp'], ['Game FPS', 'fps'], ['Ping', 'ping'], ['Packet loss', 'loss'], ['Open connections', 'conns'],\n];\nlet perfTimer = null;\nRW.pages.performance = {\n  title: 'Performance', sub: 'history for every headline metric', ranges: true,\n  topExtra: () => '<a class=\"btn sm ghost\" href=\"/api/history?range=' + RW.prefs.range + '&format=csv\" download>' + icon('download') + 'CSV</a>',\n  mount(root) {\n    root.innerHTML = '<div class=\"grid g2\">' + PERF.map(([t, k]) => '<article class=\"card\"><header><h2>' + esc(t) + '</h2><span class=\"right muted\" id=\"pf-v-' + k + '\"></span></header><div class=\"chartbox\" style=\"min-height:170px\"><canvas class=\"chart\" id=\"pf-' + k + '\"></canvas></div></article>').join('') +\n      '<article class=\"card\" style=\"grid-column:1/-1\"><header><h2>Per-thread load</h2><span class=\"right muted\">last 2 minutes, live</span></header><div class=\"chartbox\" style=\"min-height:' + Math.max(120, (RW.coreHist.length || 8) * 9) + 'px\"><canvas class=\"chart\" id=\"pf-heat\"></canvas></div></article></div>';\n    for (const [, k] of PERF) RW.chart('pf-' + k, RW.preset(k, { range: true, xAxis: true }));\n    RW.heat(document.getElementById('pf-heat'));\n    const refresh = () => RW.loadRange(RW.prefs.range).then(() => RW.drawCharts()).catch(e => RW.toast(e.message, 'err'));\n    this.onRange = () => { refresh(); RW.renderTopActions(); };\n    RW.on('range', r => { if (RW.page === 'performance') this.onRange(r); });\n    refresh();\n    clearInterval(perfTimer); perfTimer = setInterval(() => { if (RW.page === 'performance' && RW.prefs.range !== '15m') refresh(); }, 30000);\n  },\n  unmount() { clearInterval(perfTimer); RW.remoteHist = null; },\n  update(s) {\n    const g = s.gpus[0], n = s.net;\n    const v = { cpu: F.pct(s.cpu.util), gpu: g ? F.pct(g.util) : '', mem: F.b(s.mem.used, 1), vram: g ? F.b(g.vramUsed, 1) : '', net: '↓ ' + F.bits(n.rx) + ' ↑ ' + F.bits(n.tx), pkts: F.num(n.rxp + n.txp) + ' pkt/s', disk: '', temp: s.cpu.temp != null ? 'CPU ' + F.temp(s.cpu.temp) : 'no sensors', fps: s.fps.main ? Math.round(s.fps.main.fps) + ' fps' : '', ping: n.ping ? F.ms(n.ping.ms) : 'off', loss: n.ping ? F.pct(n.ping.loss) : '', conns: F.num(s.ports.total) };\n    for (const k in v) setH('pf-v-' + k, esc(v[k]));\n  },\n};\n\n// ======================= Processes =======================\nconst PCOLS = [\n  { k: 'name', label: 'Name', fmt: p => '<span class=\"pn\" title=\"' + esc(p.cmd || p.name) + '\">' + (p._d ? '<span class=\"tree-i\">' + '│ '.repeat(Math.max(0, p._d - 1)) + '├ ' + '</span>' : '') + esc(p.name) + '</span>' + RW.kindTag(p) + RW.flagTags(p) + (p.label && p.label !== p.name ? '<span class=\"sub\">' + esc(p.label) + '</span>' : '') },\n  { k: 'pid', label: 'PID', num: true },\n  { k: 'user', label: 'User', fmt: p => '<span class=\"muted\">' + esc(p.user || '') + '</span>', unix: true },\n  { k: 'cpu', label: 'CPU', num: true, fmt: p => '<div class=\"cb\">' + F.pct(p.cpu, 1) + RW.bar(p.cpu * (RW.st ? Math.min(4, RW.st.cores / 4) : 1), '--s1') + '</div>' },\n  { k: 'mem', label: 'Memory', num: true, fmt: p => '<div class=\"cb\">' + F.b(p.mem, 1) + RW.bar(400 * p.mem / ((RW.snap && RW.snap.mem.total) || 1), '--s3') + '</div>' },\n  { k: 'gpu', label: 'GPU', num: true, fmt: p => (p.gpu > 0 ? F.pct(p.gpu, 1) : '<span class=\"faint\">–</span>') },\n  { k: 'vram', label: 'VRAM', num: true, fmt: p => (p.vram > 0 ? F.b(p.vram, 0) : '<span class=\"faint\">–</span>') },\n  { k: 'io', label: 'I/O', num: true, fmt: p => (p.io > 0 ? F.rate(p.io) : '<span class=\"faint\">–</span>') },\n  { k: 'thr', label: 'Threads', num: true, fmt: p => (p.thr ? F.num(p.thr) : '') },\n  { k: 'prio', label: 'Priority', fmt: p => '<span class=\"muted\">' + esc(p.prio || '') + '</span>' },\n  { k: 'age', label: 'Uptime', num: true, fmt: p => F.age(p.age) },\n  { k: 'ports', label: 'Ports', sort: p => (p.ports || []).length, fmt: p => (p.ports && p.ports.length ? RW.portLinks(p.ports, 3) : '') },\n  { k: 'conns', label: 'Conns', num: true, fmt: p => (p.conns ? p.conns : '<span class=\"faint\">–</span>') },\n  { k: 'sig', label: 'Signature', sort: p => (p.sig ? p.sig.status : ''), fmt: p => (p.sig ? (p.sig.status === 'Valid' ? '<span class=\"muted\" title=\"' + esc(p.sig.signer) + '\">' + esc(p.sig.signer.slice(0, 26)) + '</span>' : '<span class=\"chip ' + (p.sig.status === 'NotSigned' ? 'warn' : 'crit') + '\"><i></i>' + esc(p.sig.status) + '</span>') : ''), win: true },\n];\nconst FILTERS = [['all', 'All'], ['apps', 'Apps'], ['dev', 'Dev'], ['game', 'Games'], ['gpu', 'GPU'], ['net', 'Network'], ['flagged', 'Flagged'], ['system', 'System']];\nlet pq = '';\nfunction procMatch(p, f, q) {\n  if (f === 'apps' && (p.kind === 'system' || p.kind === 'rigwatch' || p.kernel)) return false;\n  if (f === 'dev' && !(RW.isDev(p) || p.kind === 'editor' || p.kind === 'shell')) return false;\n  if (f === 'game' && !(p.kind === 'game' || p.kind === 'launcher' || p.fps > 0)) return false;\n  if (f === 'gpu' && !(p.gpu > 0 || p.vram > 0)) return false;\n  if (f === 'net' && !((p.ports && p.ports.length) || p.conns)) return false;\n  if (f === 'flagged' && !((p.flags && p.flags.length) || p.state === 'suspended' || (p.sig && p.sig.status !== 'Valid'))) return false;\n  if (f === 'system' && p.kind !== 'system') return false;\n  if (!q) return true;\n  for (const term of q.toLowerCase().split(/\\s+/).filter(Boolean)) {\n    let m;\n    if ((m = term.match(/^(?:port:|:)(\\d+)$/))) { if (!(p.ports || []).includes(+m[1])) return false; continue; }\n    if ((m = term.match(/^pid:(\\d+)$/))) { if (p.pid !== +m[1] && p.ppid !== +m[1]) return false; continue; }\n    if ((m = term.match(/^kind:(\\w+)$/))) { if (!(p.kind === m[1] || (m[1] === 'dev' && RW.isDev(p)))) return false; continue; }\n    if ((m = term.match(/^user:(.+)$/))) { if (!String(p.user || '').toLowerCase().includes(m[1])) return false; continue; }\n    if (!(p.name + ' ' + p.pid + ' ' + (p.label || '') + ' ' + (p.cmd || '') + ' ' + (p.project ? p.project.name : '')).toLowerCase().includes(term)) return false;\n  }\n  return true;\n}\nfunction treeOrder(list, all) {\n  const byPid = new Map(all.map(p => [p.pid, p])), keep = new Set(list.map(p => p.pid));\n  for (const p of list) { let c = byPid.get(p.ppid), i = 0; while (c && i++ < 64 && !keep.has(c.pid)) { keep.add(c.pid); c = byPid.get(c.ppid); } }\n  const kids = new Map();\n  for (const p of all) if (keep.has(p.pid)) { const parent = keep.has(p.ppid) && p.ppid !== p.pid ? p.ppid : 0; if (!kids.has(parent)) kids.set(parent, []); kids.get(parent).push(p); }\n  const out = [], seen = new Set();\n  const walk = (pid, d) => { for (const c of (kids.get(pid) || []).sort((a, b) => b.cpu - a.cpu || b.mem - a.mem)) { if (seen.has(c.pid)) continue; seen.add(c.pid); out.push(Object.assign({}, c, { _d: d })); walk(c.pid, d + 1); } };\n  walk(0, 0);\n  return out;\n}\nRW.pages.processes = {\n  title: 'Processes', sub: 'every process with its CPU, memory, GPU, I/O and ports',\n  keepOnParams: true,\n  topExtra: () => '<a class=\"btn sm ghost\" href=\"/api/export?what=processes&format=csv\" download>' + icon('download') + 'CSV</a>',\n  mount(root, params) {\n    pq = params.q || '';\n    root.innerHTML = '<article class=\"card\"><div class=\"toolbar\"><input type=\"search\" id=\"pq\" placeholder=\"Filter: name, pid, cmd · port:3000 · kind:dev · user:root\" value=\"' + esc(pq) + '\">' +\n      '<div class=\"seg\" id=\"pf\">' + FILTERS.map(([k, l]) => '<button data-pf=\"' + k + '\" class=\"' + (RW.prefs.procFilter === k ? 'on' : '') + '\">' + l + '</button>').join('') + '</div>' +\n      '<div class=\"seg\" id=\"pv\">' + [['table', 'Table'], ['tree', 'Tree'], ['apps', 'By app']].map(([k, l]) => '<button data-pv=\"' + k + '\" class=\"' + (RW.prefs.procView === k ? 'on' : '') + '\">' + l + '</button>').join('') + '</div><span class=\"grow\"></span><span class=\"muted\" id=\"pcount\"></span></div><div class=\"tw\" id=\"ptab\"></div></article>';\n    document.getElementById('pq').addEventListener('input', e => { pq = e.target.value.trim(); RW.renderAll(); });\n    root.addEventListener('click', async e => {\n      const ka = e.target.closest('[data-killapp]');\n      if (ka) {\n        e.stopPropagation();\n        const name = ka.dataset.killapp, pids = (RW.snap.procs || []).filter(p => p.name === name && p.kind !== 'rigwatch').map(p => p.pid);\n        if (!(await RW.confirm('End all ' + esc(name) + '?', pids.length + ' processes will be terminated.', { danger: true, ok: 'End all' }))) return;\n        let ok = 0, fail = 0;\n        for (const pid of pids) { try { await RW.action({ type: 'proc.kill', pid }, true); ok++; } catch { fail++; } }\n        RW.toast('Ended ' + ok + ' of ' + pids.length + ' ' + name + ' processes' + (fail ? ' (' + fail + ' refused or already gone)' : ''), fail ? 'warn' : 'ok');\n        return;\n      }\n      const f = e.target.closest('[data-pf]'); if (f) { RW.prefs.procFilter = f.dataset.pf; RW.savePrefs(); RW.$$('#pf button').forEach(b => b.classList.toggle('on', b === f)); RW.renderAll(); }\n      const v = e.target.closest('[data-pv]'); if (v) { RW.prefs.procView = v.dataset.pv; RW.savePrefs(); RW.$$('#pv button').forEach(b => b.classList.toggle('on', b === v)); RW.renderAll(); }\n    });\n    if (params.pid) setTimeout(() => RW.openProc(+params.pid), 50);\n  },\n  onParams(params) { if (params.q != null) { pq = params.q; const i = document.getElementById('pq'); if (i) i.value = pq; } if (params.pid) RW.openProc(+params.pid); },\n  update(s) {\n    const win = RW.st && RW.st.platform === 'win32';\n    const cols = PCOLS.filter(c => !(c.unix && win) && !(c.win && !win));\n    const list = s.procs.filter(p => procMatch(p, RW.prefs.procFilter, pq));\n    if (RW.prefs.procView === 'apps') {\n      const g = RW.groupApps(list);\n      setH('pcount', g.length + ' apps · ' + list.length + ' processes');\n      setH('ptab', RW.table('papps', [\n        { k: 'name', label: 'App', fmt: a => '<span class=\"pn\">' + esc(a.name) + '</span>' + RW.kindTag(a) },\n        { k: 'n', label: 'Processes', num: true },\n        { k: 'cpu', label: 'CPU', num: true, fmt: a => '<div class=\"cb\">' + F.pct(a.cpu, 1) + RW.bar(a.cpu * 2, '--s1') + '</div>' },\n        { k: 'mem', label: 'Memory', num: true, fmt: a => '<div class=\"cb\">' + F.b(a.mem, 1) + RW.bar(400 * a.mem / s.mem.total, '--s3') + '</div>' },\n        { k: 'gpu', label: 'GPU', num: true, fmt: a => (a.gpu > 0 ? F.pct(a.gpu, 1) : '') },\n        { k: 'vram', label: 'VRAM', num: true, fmt: a => (a.vram > 0 ? F.b(a.vram, 0) : '') },\n        { k: 'io', label: 'I/O', num: true, fmt: a => (a.io > 0 ? F.rate(a.io) : '') },\n        { k: 'conns', label: 'Conns', num: true },\n        { k: 'ports', label: 'Ports', sort: a => a.ports.length, fmt: a => RW.portLinks(a.ports, 4) },\n        { k: 'x', label: '', nosort: true, fmt: a => (RW.canControl() && a.kind !== 'system' ? '<button class=\"btn sm danger\" data-killapp=\"' + esc(a.name) + '\" title=\"End every ' + esc(a.name) + ' process\">End all</button>' : '') },\n      ], g, { sortK: 'cpu', row: a => 'class=\"click\" data-q=\"' + esc(a.name) + '\"' }));\n      return;\n    }\n    setH('pcount', list.length + ' of ' + s.procs.length + ' processes');\n    if (RW.prefs.procView === 'tree') {\n      RW.sorts.ptree = { k: null, d: -1 };\n      setH('ptab', RW.table('ptree', cols.map(c => Object.assign({}, c, { nosort: true })), treeOrder(list, s.procs), { row: p => 'class=\"click\" data-pid=\"' + p.pid + '\"', max: 3000 }));\n    } else setH('ptab', RW.table('procs', cols, list, { sortK: 'cpu', row: p => 'class=\"click\" data-pid=\"' + p.pid + '\"', max: 2000 }));\n  },\n};\n\n// ======================= Process drawer =======================\nRW.openProc = pid => {\n  pid = +pid;\n  const H = { t: [], cpu: [], mem: [] };\n  let detail = null, info = null, hash = null;\n  const ctl = RW.canControl();\n  RW.drawer.open('PID ' + pid, {\n    mount(b) {\n      b.innerHTML = '<div id=\"pd-head\" style=\"margin-bottom:8px\"></div><div class=\"actions\" id=\"pd-act\"></div>' +\n        '<div class=\"grid g2\" style=\"margin-bottom:12px\"><div class=\"card\" style=\"padding:10px 12px\"><h3 style=\"margin:0 0 4px\">CPU</h3><div class=\"chartbox\" style=\"min-height:90px\"><canvas class=\"chart\" id=\"pd-cpu\"></canvas></div></div><div class=\"card\" style=\"padding:10px 12px\"><h3 style=\"margin:0 0 4px\">Memory</h3><div class=\"chartbox\" style=\"min-height:90px\"><canvas class=\"chart\" id=\"pd-mem\"></canvas></div></div></div><div id=\"pd-body\"></div>';\n      const src = k => () => ({ n: 180, t: H.t, s: [H[k]] });\n      RW.chart('pd-cpu', { series: [{ k: 'cpu', c: '--s1', l: 'CPU' }], fmt: v => F.pct(v, 1), min: 5, src: src('cpu') });\n      RW.chart('pd-mem', { series: [{ k: 'mem', c: '--s3', l: 'Memory' }], fmt: v => F.b(v, 0), min: 1048576, src: src('mem') });\n      RW.api('/api/process?pid=' + pid).then(d => { detail = d; if (d.history) { H.t = d.history.t.slice(); H.cpu = d.history.cpu.slice(); H.mem = d.history.mem.slice(); } RW.drawer.update(RW.snap); }).catch(e => { detail = { error: e.message }; });\n      RW.api('/api/procinfo?pid=' + pid).then(d => { info = d; }).catch(() => { info = {}; });\n      b.addEventListener('click', async e => {\n        const a = e.target.closest('[data-pa]'); if (!a) return;\n        const p = RW.pidMap(RW.snap).get(pid) || {}, t = a.dataset.pa;\n        if (t === 'kill' || t === 'tree') { if (await RW.confirm('End ' + p.name + '?', 'PID ' + pid + (t === 'tree' ? ' and all of its child processes' : '') + ' will be terminated. Unsaved work in it is lost.', { danger: true, ok: 'End process' })) RW.action({ type: 'proc.kill', pid, tree: t === 'tree' }); }\n        if (t === 'suspend' || t === 'resume') RW.action({ type: 'proc.' + t, pid });\n        if (t === 'reveal') RW.action({ type: 'proc.reveal', pid });\n        if (t === 'hash') { a.disabled = true; try { const r = await RW.action({ type: 'proc.hash', pid }, true); hash = r.data; RW.drawer.update(RW.snap); } finally { a.disabled = false; } }\n        if (t === 'fwblock') {\n          if (await RW.confirm('Block ' + esc(p.name) + ' from the network?', 'Adds Windows Firewall rules (group \"RigWatch\") that block <b>' + esc(p.exe) + '</b> inbound and outbound. Undo it any time in Toolbox → Firewall blocks. Needs admin.', { danger: true, ok: 'Block' })) RW.tbAct({ op: 'fwblock', pid, on: true }).catch(() => {});\n        }\n        if (t === 'modules') {\n          RW.api('/api/tb?what=modules&pid=' + pid).then(list => {\n            RW.modal({ title: 'Loaded modules: ' + p.name + ' (' + list.length + ')', wide: true, body: '<div class=\"tw\" style=\"max-height:60vh\">' + RW.table('mods', [{ k: 'name', label: 'Module', fmt: m => '<b>' + esc(m.name) + '</b>' }, { k: 'company', label: 'Company', fmt: m => (m.company ? esc(m.company) : '<span class=\"chip warn\"><i></i>no company</span>') }, { k: 'version', label: 'Version', fmt: m => '<span class=\"mono muted\">' + esc(m.version || '') + '</span>' }, { k: 'path', label: 'Path', cls: 'wrap', fmt: m => '<span class=\"mono\" style=\"font-size:11.5px\">' + esc(m.path) + '</span>' }], list, { sortK: 'company', sortD: 1, max: 3000 }) + '</div>', actions: [{ label: 'Close' }] });\n          }).catch(er => RW.toast(er.message, 'err', 7000));\n        }\n        if (t === 'copy') { navigator.clipboard && navigator.clipboard.writeText((detail && detail.cmd) || p.cmd || '').then(() => RW.toast('Command line copied')); }\n        if (t === 'affinity') {\n          const n = (RW.st && RW.st.cores) || 8;\n          const cur = info && info.affinity ? BigInt(info.affinity) : (1n << BigInt(n)) - 1n;\n          const m = RW.modal({ title: 'CPU affinity for ' + p.name, body: '<div class=\"muted\">Pick the logical CPUs this process may run on.</div><div style=\"display:grid;grid-template-columns:repeat(8,1fr);gap:6px\">' + Array.from({ length: n }, (_, i) => '<label class=\"check\"><input type=\"checkbox\" value=\"' + i + '\"' + ((cur >> BigInt(i)) & 1n ? ' checked' : '') + '>' + i + '</label>').join('') + '</div>', actions: [{ label: 'Cancel' }, { label: 'Apply', primary: true, onClick: bd => { const cores = RW.$$('input:checked', bd).map(i => +i.value); RW.action({ type: 'proc.affinity', pid, cores }).then(() => RW.api('/api/procinfo?pid=' + pid).then(d => { info = d; })); } }] });\n          void m;\n        }\n        if (t === 'killport') { const port = +a.dataset.port; if (await RW.confirm('Free port ' + port + '?', 'Ends ' + esc(p.name) + ' (and its children) which listens on ' + port + '.', { danger: true, ok: 'Kill' })) RW.action({ type: 'port.kill', port }); }\n      });\n      b.addEventListener('change', e => { if (e.target.id === 'pd-prio' && e.target.value) RW.action({ type: 'proc.priority', pid, level: e.target.value }).then(() => RW.api('/api/procinfo?pid=' + pid).then(d => { info = d; })); });\n    },\n    update(b, s) {\n      const p = RW.pidMap(s).get(pid);\n      if (!p) { setH('pd-head', '<div class=\"note\"><b>This process has exited.</b></div>'); setH('pd-act', ''); return; }\n      if (!H.t.length || H.t[H.t.length - 1] < s.t) { H.t.push(s.t); H.cpu.push(p.cpu); H.mem.push(p.mem); if (H.t.length > 180) { H.t.shift(); H.cpu.shift(); H.mem.shift(); } }\n      document.getElementById('drawerTitle').textContent = p.name + ' · ' + pid;\n      setH('pd-head', '<div style=\"display:flex;gap:8px;align-items:center;flex-wrap:wrap\">' + RW.kindTag(p) + RW.flagTags(p) + (p.label && p.label !== p.name ? '<b>' + esc(p.label) + '</b>' : '') + (p.project ? '<span class=\"chip info\"><i></i>' + esc(p.project.name) + (p.project.branch ? ' · ' + esc(p.project.branch) : '') + '</span>' : '') + '</div>' +\n        RW.stats([['CPU', F.pct(p.cpu, 1)], ['Memory', F.b(p.mem, 1)], ['GPU', p.gpu ? F.pct(p.gpu, 1) : null], ['VRAM', p.vram ? F.b(p.vram, 0) : null], ['I/O', F.rate(p.io)], ['Threads', p.thr ? F.num(p.thr) : null], ['Handles', p.hnd ? F.num(p.hnd) : null], ['Uptime', F.age(p.age)], ['Priority', esc(p.prio || '')], ['FPS', p.fps ? Math.round(p.fps) : null]]));\n      const caps = (RW.st && RW.st.caps) || {};\n      setH('pd-act', ctl ? '<button class=\"btn sm danger\" data-pa=\"kill\">' + icon('x') + 'End</button><button class=\"btn sm danger\" data-pa=\"tree\">End tree</button>' +\n        (caps.suspend ? (p.state === 'suspended' ? '<button class=\"btn sm\" data-pa=\"resume\">' + icon('play') + 'Resume</button>' : '<button class=\"btn sm\" data-pa=\"suspend\">' + icon('pause') + 'Suspend</button>') : '') +\n        (caps.priority ? '<select id=\"pd-prio\" class=\"btn sm\" title=\"Priority\"><option value=\"\">Priority…</option>' + ['idle', 'below', 'normal', 'above', 'high'].map(l => '<option value=\"' + l + '\">' + l + (p.prio === l ? ' ✓' : '') + '</option>').join('') + '</select>' : '') +\n        (caps.affinity ? '<button class=\"btn sm\" data-pa=\"affinity\">' + icon('cpu') + 'Affinity</button>' : '') +\n        (p.exe ? '<button class=\"btn sm\" data-pa=\"reveal\">' + icon('folder') + 'Open location</button><button class=\"btn sm\" data-pa=\"hash\">' + icon('hash') + 'SHA-256</button>' : '') +\n        (caps.signatures && p.exe ? '<button class=\"btn sm\" data-pa=\"fwblock\">' + icon('ban') + 'Block network</button>' : '') +\n        '<button class=\"btn sm\" data-pa=\"modules\">' + icon('layers') + 'DLLs / libs</button>' +\n        '<a class=\"btn sm ghost\" href=\"https://www.google.com/search?q=' + encodeURIComponent('\"' + p.name + (/\\.exe$/i.test(p.exe || '') ? '.exe' : '') + '\" process') + '\" target=\"_blank\" rel=\"noopener noreferrer\">' + icon('search') + 'Search web</a>' +\n        '<button class=\"btn sm\" data-pa=\"copy\">' + icon('copy') + 'Copy cmd</button>' + (p.ports || []).slice(0, 3).map(pt => '<button class=\"btn sm\" data-pa=\"killport\" data-port=\"' + pt + '\">Free :' + pt + '</button>').join('')\n        : '<span class=\"muted\">Read-only on this device.</span>');\n      const d = detail || {}, i = info || {};\n      const conns = (s.ports.conns || []).filter(c => c.pid === pid);\n      setH('pd-body', '<h3>Command</h3><div class=\"cmd\">' + esc(d.cmd || p.cmd || '(hidden: system process, or run RigWatch elevated)') + '</div>' +\n        '<h3>Details</h3>' + RW.kv([\n          ['Executable', esc(p.exe || '')], ['Parent', d.parent ? '<a data-pid=\"' + p.ppid + '\">' + esc(d.parent) + ' (' + p.ppid + ')</a>' : String(p.ppid)],\n          ['Children', d.children && d.children.length ? d.children.slice(0, 20).map(c => '<a data-pid=\"' + c.pid + '\">' + esc(c.name) + '</a>').join(', ') + (d.children.length > 20 ? ' …' : '') : ''],\n          ['User', esc(i.user || p.user || '')], ['Company', esc(i.company || '')], ['Description', esc(i.description || '')], ['Version', esc(i.version || '')], ['Working dir', esc(i.cwd || '')],\n          ['Open files', i.fds != null ? String(i.fds) : ''], ['Container', esc(i.container || '')], ['Modules', i.modules ? String(i.modules) : ''], ['Affinity', i.affinity ? 'mask 0x' + BigInt(i.affinity).toString(16) : ''],\n          ['Signature', p.sig ? esc(p.sig.status + (p.sig.signer ? ' · ' + p.sig.signer : '')) : ''], ['Project', p.project ? esc(p.project.dir) : ''],\n          ['SHA-256', hash ? '<code>' + esc(hash.sha256) + '</code><br><a href=\"' + esc(hash.virustotal) + '\" target=\"_blank\" rel=\"noopener noreferrer\">look up on VirusTotal ' + icon('ext') + '</a> <span class=\"muted\">(opens the hash page; the file is not uploaded)</span>' : ''],\n        ]) +\n        ((p.ports && p.ports.length) || conns.length ? '<h3>Network</h3>' + (p.ports.length ? '<div style=\"margin-bottom:8px\">Listening: ' + RW.portLinks(p.ports, 20) + '</div>' : '') +\n          (conns.length ? '<div class=\"tw\">' + RW.table('pd-conns', [{ k: 'rh', label: 'Remote', fmt: c => '<span class=\"mono\">' + esc(F.hp(c.rh, c.rp)) + '</span> <span class=\"muted\">' + esc(RW.svc(c.rp) || '') + '</span>' }, { k: 'lp', label: 'Local port', num: true }, { k: 'state', label: 'State', fmt: c => esc(c.state.toLowerCase().replace(/_/g, ' ')) }], conns, { max: 200 }) + '</div>' : '') : ''));\n    },\n  });\n};\n\n// ======================= Sensors =======================\nconst SORDER = ['Temperature', 'Fan', 'Power', 'Clock', 'Load', 'Voltage', 'Control', 'Current', 'Data', 'SmallData', 'Throughput', 'Level', 'Factor', 'Frequency', 'Energy', 'Noise', 'TimeSpan'];\nconst fsv = (v, u) => { if (v == null || isNaN(v)) return '–'; if (u === 'B/s') return F.rate(v); const d = u === 'V' ? 3 : u === 'RPM' || u === 'MHz' ? 0 : Math.abs(v) < 10 ? 2 : 1; return (+v).toFixed(d) + (u ? ' ' + u : ''); };\n// live history per sensor (kept in the browser, ~10 min)\nconst SH = RW.sensHist = new Map();\nRW.on('snap', s => {\n  for (const x of (s.sensors && s.sensors.list) || []) {\n    let h = SH.get(x.id); if (!h) { h = { t: [], v: [] }; SH.set(x.id, h); }\n    if (h.t.length && h.t[h.t.length - 1] >= s.t) continue;\n    h.t.push(s.t); h.v.push(x.value == null ? null : x.value);\n    if (h.t.length > 600) { h.t.shift(); h.v.shift(); }\n  }\n});\nconst STATIC_TYPES = new Set(['Timing', 'Data', 'SmallData', 'Factor', 'Level', 'TimeSpan', 'Energy']);\nconst PCT_TYPES = new Set(['Load', 'Control', 'Level']);\nconst LIMITS = /limit|resolution|warning|critical|threshold/i;\nconst histSrc = ids => () => {\n  const hs = ids.map(id => SH.get(id) || { t: [], v: [] });\n  const L = Math.max(2, ...hs.map(h => h.v.length));\n  const longest = hs.reduce((a, h) => (h.t.length > a.length ? h.t : a), []);\n  return { n: L, t: longest, s: hs.map(h => new Array(L - h.v.length).fill(null).concat(h.v)) };\n};\nconst orderSeries = (type, items) => {\n  let l = items.filter(x => !LIMITS.test(x.name));\n  if (type === 'Fan') l = l.filter(x => x.value > 0).concat(l.filter(x => !(x.value > 0)));\n  else if (type !== 'Temperature' && type !== 'Voltage') l = l.slice().sort((a, b) => (b.value || 0) - (a.value || 0));\n  return l.concat(items.filter(x => LIMITS.test(x.name)));\n};\nconst sval = x => (x.type === 'Temperature' ? RW.tchip(x.value) : esc(fsv(x.value, x.unit)));\nlet sview = RW.prefs.sensorView || 'graphs', sq = '', ssig = '';\nconst sidx = new Map();\n\nRW.openSensor = id => {\n  const find = s => ((s && s.sensors.list) || []).find(x => x.id === id);\n  const x0 = find(RW.snap); if (!x0) return;\n  RW.drawer.open(x0.hw + ' · ' + x0.name, {\n    mount(b) {\n      b.innerHTML = '<div id=\"sd-head\" style=\"margin-bottom:10px\"></div><div class=\"chartbox\" style=\"min-height:280px\"><canvas class=\"chart\" id=\"sd-chart\"></canvas></div><div id=\"sd-stats\"></div>';\n      RW.chart('sd-chart', { series: [{ k: id, c: '--s1', l: x0.name }], fmt: v => fsv(v, x0.unit), max: PCT_TYPES.has(x0.type) ? 100 : undefined, xAxis: true, src: histSrc([id]) });\n    },\n    update(b, s) {\n      const x = find(s); if (!x) return;\n      const v = ((SH.get(id) || {}).v || []).filter(n => n != null);\n      const avg = v.length ? v.reduce((a, n) => a + n, 0) / v.length : null;\n      setH('sd-head', '<div style=\"display:flex;gap:12px;align-items:baseline;flex-wrap:wrap\"><span class=\"huge\">' + sval(x) + '</span><span class=\"tag\">' + esc(x.type) + '</span><span class=\"muted\">' + esc(x.hw) + '</span></div>');\n      setH('sd-stats', RW.stats([['Now', esc(fsv(x.value, x.unit))], ['Min (this view)', v.length ? esc(fsv(Math.min(...v), x.unit)) : ''], ['Max (this view)', v.length ? esc(fsv(Math.max(...v), x.unit)) : ''], ['Average', avg != null ? esc(fsv(avg, x.unit)) : ''], ['Min / max since start', esc(fsv(x.min, x.unit) + ' / ' + fsv(x.max, x.unit))], ['Samples', String(v.length)]]) + '<div class=\"muted mono\" style=\"font-size:11px;margin-top:10px\">' + esc(x.id) + '</div>');\n    },\n  });\n};\n\nRW.pages.sensors = {\n  title: 'Sensors', sub: 'live graphs for every temperature, fan, power rail, clock and voltage',\n  mount(root) {\n    ssig = '';\n    root.innerHTML = '<div class=\"toolbar\"><div class=\"seg\" id=\"sview\">' + [['graphs', 'activity', 'Graphs'], ['table', 'list', 'Table']].map(([k, ic, l]) => '<button data-sv=\"' + k + '\" class=\"' + (sview === k ? 'on' : '') + '\" style=\"display:inline-flex;gap:6px;align-items:center\">' + icon(ic) + l + '</button>').join('') + '</div><input type=\"search\" id=\"sq\" placeholder=\"Filter sensors: cpu, fan, vrm, hotspot…\" value=\"' + esc(sq) + '\"><span class=\"grow\"></span><span class=\"muted\" id=\"ssrc\"></span></div><div id=\"sfix\"></div><div id=\"sbody\"></div><div id=\"sbat\"></div>';\n    root.addEventListener('click', e => {\n      const v = e.target.closest('[data-sv]');\n      if (v) { sview = v.dataset.sv; RW.prefs.sensorView = sview; RW.savePrefs(); RW.$$('#sview button').forEach(b => b.classList.toggle('on', b === v)); ssig = ''; RW.renderAll(); return; }\n      const x = e.target.closest('[data-sensor]'); if (x) RW.openSensor(x.dataset.sensor);\n    });\n    root.addEventListener('input', e => { if (e.target.id === 'sq') { sq = e.target.value.trim().toLowerCase(); RW.renderAll(); } });\n  },\n  update(s) {\n    const all = s.sensors.list || [];\n    const list = sq ? all.filter(x => (x.hw + ' ' + x.name + ' ' + x.type).toLowerCase().includes(sq)) : all;\n    const plat = RW.st ? RW.st.platform : '', lhm = s.status && s.status.tools && s.status.tools.lhm;\n    setH('ssrc', esc((s.sensors.source || '') + (all.length ? ' · ' + all.length + ' sensors' : '')));\n    let fix = '';\n    if (!all.filter(x => x.hwType !== 'Acpi').length) {\n      fix = plat === 'win32' ? '<div class=\"empty\">' + (lhm && lhm.state === 'downloading' ? 'Downloading the sensor library (one time)…' : lhm && lhm.state === 'error' ? 'Sensor library download failed: ' + esc(lhm.err) : 'Starting the built-in sensor library…') + '</div>'\n        : '<div class=\"note\" style=\"margin-bottom:14px\">' + (plat === 'linux' ? '<b>No hwmon sensors found.</b> Install <code>lm-sensors</code> and run <code>sudo sensors-detect</code> to load the right kernel modules (k10temp, coretemp, nct6775, it87...).' : '<b>macOS does not expose CPU/GPU temperatures without sudo.</b> GPU load, memory and battery temperature are shown where available.') + '</div>';\n    } else if (plat === 'win32' && s.cpu.temp == null && RW.fixButtons('cpu')) {\n      fix = '<div class=\"banner\" style=\"margin:0 0 14px\">' + icon('thermo') + '<span>' + (RW.st.canElevate ? 'CPU and motherboard sensors need admin rights.' : 'CPU and motherboard sensors need the PawnIO driver (one-time install).') + '</span><span class=\"spacer\"></span>' + RW.fixButtons('cpu') + '</div>';\n    }\n    setH('sfix', fix);\n    const sig = sview + '|' + list.map(x => x.id).join(',');\n    if (sig !== ssig) { ssig = sig; this.build(list); }\n    for (const x of list) {\n      const i = sidx.get(x.id);\n      const el = document.getElementById('sv' + i); if (el) { const h = sval(x); if (el.__h !== h) { el.innerHTML = h; el.__h = h; } }\n      const mm = document.getElementById('sm' + i); if (mm) { const t = fsv(x.min, x.unit) + ' / ' + fsv(x.max, x.unit); if (mm.textContent !== t) mm.textContent = t; }\n    }\n    setH('sbat', (s.battery || []).length ? '<article class=\"card\" style=\"margin-top:14px\"><header><h2>Battery</h2></header>' + s.battery.map(x => RW.brow(esc(x.name), x.pct + '%' + (x.charging ? ' · charging' : '') + (x.minutes ? ' · ' + F.age(x.minutes * 60) + ' left' : ''), x.pct, '--s3')).join('') + '</article>' : '');\n  },\n  build(list) {\n    sidx.clear(); list.forEach((x, i) => sidx.set(x.id, i));\n    const hw = new Map(); for (const x of list) { if (!hw.has(x.hw)) hw.set(x.hw, []); hw.get(x.hw).push(x); }\n    const charts = [];\n    let g = 0, h = '<div class=\"sensor-grid\" style=\"grid-template-columns:repeat(auto-fill,minmax(' + (sview === 'graphs' ? 460 : 380) + 'px,1fr))\">';\n    for (const [name, items] of hw) {\n      const types = new Map(); for (const x of items) { if (!types.has(x.type)) types.set(x.type, []); types.get(x.type).push(x); }\n      h += '<article class=\"card\"><header><h2>' + esc(name) + '</h2><span class=\"right muted\">' + esc(items[0].hwType || '') + '</span></header>';\n      for (const [t, xs] of [...types].sort((a, b) => SORDER.indexOf(a[0]) - SORDER.indexOf(b[0]))) {\n        h += '<div class=\"sgrp\"><h3>' + esc(t) + ' <span class=\"faint\" style=\"text-transform:none;letter-spacing:0\">' + xs.length + '</span></h3>';\n        if (sview === 'table') {\n          h += xs.map(x => { const i = sidx.get(x.id); charts.push(['sp' + i, { spark: true, series: [{ k: x.id, c: '--s1', l: x.name }], fmt: v => fsv(v, x.unit), max: PCT_TYPES.has(x.type) ? 100 : undefined, src: histSrc([x.id]) }]); return '<div class=\"srow\" data-sensor=\"' + esc(x.id) + '\"><span class=\"sn\" title=\"' + esc(x.name) + '\">' + esc(x.name) + '</span><canvas class=\"spark-row\" id=\"sp' + i + '\"></canvas><span class=\"sv\" id=\"sv' + i + '\"></span><span class=\"sm\" id=\"sm' + i + '\" title=\"min / max\"></span></div>'; }).join('');\n        } else if (STATIC_TYPES.has(t)) {\n          h += '<div class=\"kchips\">' + xs.map(x => '<span class=\"kchip\" data-sensor=\"' + esc(x.id) + '\">' + esc(x.name) + ' <b id=\"sv' + sidx.get(x.id) + '\"></b></span>').join('') + '</div>';\n        } else {\n          const ord = orderSeries(t, xs), series = ord.filter(x => !LIMITS.test(x.name)).slice(0, 8);\n          const cid = 'sc' + (g++);\n          charts.push([cid, { series: series.map((x, j) => ({ k: x.id, c: '--s' + (j + 1), l: x.name })), legend: false, fmt: v => fsv(v, xs[0].unit), max: PCT_TYPES.has(t) ? 100 : undefined, min: t === 'Temperature' ? 50 : t === 'Fan' ? 500 : undefined, src: histSrc(series.map(x => x.id)) }]);\n          h += '<div class=\"chartbox\" style=\"min-height:' + (xs.length > 4 ? 150 : 120) + 'px\"><canvas class=\"chart\" id=\"' + cid + '\"></canvas></div><div class=\"kchips\" style=\"margin-top:6px\">' +\n            ord.map(x => { const j = series.indexOf(x); return '<span class=\"kchip\" data-sensor=\"' + esc(x.id) + '\" title=\"click to zoom\">' + (j >= 0 ? '<i style=\"width:10px;height:3px;border-radius:2px;display:inline-block;background:var(--s' + (j + 1) + ');align-self:center\"></i>' : '') + esc(x.name) + ' <b id=\"sv' + sidx.get(x.id) + '\"></b></span>'; }).join('') + '</div>';\n        }\n        h += '</div>';\n      }\n      h += '</article>';\n    }\n    h += '</div>';\n    const body = document.getElementById('sbody');\n    body.innerHTML = list.length ? h : ''; body.__h = null;\n    for (const [id, o] of charts) RW.chart(id, o);\n    RW.drawCharts();\n  },\n};\n\n// ======================= System =======================\nRW.pages.system = {\n  title: 'System', sub: 'hardware, collectors, settings, access and API',\n  mount(root) {\n    root.innerHTML = '<div class=\"grid g2\"><article class=\"card\"><header><h2>Hardware</h2></header><div id=\"sy-hw\"></div></article><article class=\"card\"><header><h2>Operating system & RigWatch</h2></header><div id=\"sy-os\"></div></article>' +\n      '<article class=\"card\"><header><h2>Collectors</h2><span class=\"right\"><button class=\"btn sm\" id=\"sy-diag\" title=\"Copies versions and collector status (no host name, user name or paths) for a bug report\">' + icon('copy') + 'Copy diagnostics</button></span></header><div id=\"sy-col\"></div></article><article class=\"card\"><header><h2>Settings</h2></header><div id=\"sy-set\"></div></article>' +\n      '<article class=\"card\"><header><h2>Access</h2></header><div id=\"sy-acc\"></div></article><article class=\"card\"><header><h2>Admin & helpers</h2></header><div id=\"sy-setup\"></div></article>' +\n      '<article class=\"card\"><header><h2>Keyboard</h2></header><div id=\"sy-keys\"></div></article><article class=\"card\"><header><h2>API</h2><span class=\"right muted\">build your own overlays & bots</span></header><div id=\"sy-api\"></div></article></div>';\n    root.querySelector('.grid').insertAdjacentHTML('afterbegin', '<article class=\"card\" style=\"grid-column:1/-1\"><header><h2>Appearance & units</h2><span class=\"right muted\">saved in this browser</span></header><div style=\"display:flex;gap:28px;flex-wrap:wrap;align-items:center\">' +\n      '<div><div class=\"muted\" style=\"font-size:12px;margin-bottom:6px\">Theme</div><div class=\"seg\"><button data-ap=\"theme:dark\" class=\"' + (RW.prefs.theme === 'dark' ? 'on' : '') + '\">Dark</button><button data-ap=\"theme:light\" class=\"' + (RW.prefs.theme === 'light' ? 'on' : '') + '\">Light</button></div></div>' +\n      '<div><div class=\"muted\" style=\"font-size:12px;margin-bottom:6px\">Accent</div><div class=\"swatches\">' + Object.entries(RW.ACCENTS).map(([k, v]) => '<button data-ap=\"accent:' + k + '\" title=\"' + k + '\" class=\"' + ((RW.prefs.accent || 'blue') === k ? 'on' : '') + '\" style=\"background:' + v[0] + '\"></button>').join('') + '</div></div>' +\n      '<div><div class=\"muted\" style=\"font-size:12px;margin-bottom:6px\">Network speed</div><div class=\"seg\"><button data-ap=\"net:bits\" class=\"' + (!RW.prefs.netBytes ? 'on' : '') + '\">Mb/s (bits)</button><button data-ap=\"net:bytes\" class=\"' + (RW.prefs.netBytes ? 'on' : '') + '\">MB/s (bytes)</button></div></div>' +\n      '<div><div class=\"muted\" style=\"font-size:12px;margin-bottom:6px\">Density</div><div class=\"seg\"><button data-ap=\"density:comfy\" class=\"' + (!RW.prefs.compact ? 'on' : '') + '\">Comfortable</button><button data-ap=\"density:compact\" class=\"' + (RW.prefs.compact ? 'on' : '') + '\">Compact</button></div></div>' +\n      '<div><div class=\"muted\" style=\"font-size:12px;margin-bottom:6px\">Overlay for OBS / 2nd screen</div><a class=\"btn sm\" href=\"/overlay\" target=\"_blank\" rel=\"noopener\">' + icon('ext') + 'Open /overlay</a></div></div></article>');\n    root.addEventListener('click', e => {\n      if (e.target.closest('#sy-diag')) {\n        fetch('/api/diagnostics').then(r => r.text()).then(t => (navigator.clipboard ? navigator.clipboard.writeText('```json\\n' + t + '\\n```') : Promise.reject(new Error('clipboard unavailable')))).then(() => RW.toast('Diagnostics copied. Paste them into your GitHub issue.', 'ok', 6000)).catch(er => RW.toast(er.message, 'err'));\n        return;\n      }\n      const b = e.target.closest('[data-ap]'); if (!b) return;\n      const [k, v] = b.dataset.ap.split(':');\n      if (k === 'theme') RW.applyTheme(v);\n      if (k === 'accent') { RW.prefs.accent = v; RW.savePrefs(); RW.applyAppearance(); RW.emit('theme'); }\n      if (k === 'net') { RW.prefs.netBytes = v === 'bytes'; RW.savePrefs(); RW.renderAll(); }\n      if (k === 'density') { RW.prefs.compact = v === 'compact'; RW.savePrefs(); RW.applyAppearance(); setTimeout(RW.drawCharts, 30); }\n      RW.$$('[data-ap^=\"' + k + ':\"]', root).forEach(x => x.classList.toggle('on', x === b));\n    });\n    root.addEventListener('change', async e => {\n      const k = e.target.dataset.setting; if (!k) return;\n      try { const r = await RW.api('/api/settings', { method: 'PUT', body: { [k]: e.target.checked } }); RW.settings = r.settings; RW.toast('Saved', 'ok'); } catch (er) { RW.toast(er.message, 'err'); e.target.checked = !e.target.checked; }\n    });\n  },\n  update(s) {\n    const st = RW.st || {}, inv = st.inventory || {}, o = inv.os || {};\n    setH('sy-hw', RW.kv([['CPU', esc(inv.cpu ? inv.cpu.name : '')], ['Cores / threads', inv.cpu ? (inv.cpu.cores || '?') + ' / ' + (inv.cpu.threads || '?') : ''], ['Max clock', inv.cpu && inv.cpu.maxMhz ? F.ghz(inv.cpu.maxMhz) : ''], ['Cache', inv.cpu && inv.cpu.l3Kb ? 'L2 ' + F.b(inv.cpu.l2Kb * 1024, 0) + ' · L3 ' + F.b(inv.cpu.l3Kb * 1024, 0) : ''], ['Virtualization', inv.cpu && inv.cpu.virt != null ? (inv.cpu.virt ? 'enabled' : 'disabled in firmware') : ''], ['Memory', F.b(st.totalMem, 1)]]\n      .concat((inv.ram || []).map(r => ['  ' + r.slot, esc(F.b(r.bytes, 0) + ' ' + r.maker + ' ' + r.part + ' @ ' + r.mhz + ' MT/s')]))\n      .concat((inv.gpus || []).map(g => ['GPU', esc(g.name + (g.vram ? ' · ' + F.b(g.vram, 0) : ''))]))\n      .concat((inv.video || []).filter(v => v.hz).map(v => ['Display', esc(v.w + '×' + v.h + ' @ ' + v.hz + ' Hz (' + v.name + ', driver ' + v.driver + ')')]))\n      .concat([['Board', inv.board ? esc(inv.board.manufacturer + ' ' + inv.board.product) : ''], ['BIOS', inv.bios ? esc(inv.bios.version + (inv.bios.dateMs ? ' (' + new Date(inv.bios.dateMs).toLocaleDateString() + ')' : '')) : ''], ['System', inv.system ? esc((inv.system.manufacturer || '') + ' ' + (inv.system.model || '')) : ''], ['Secure Boot', inv.secureBoot == null ? '' : inv.secureBoot ? 'on' : 'off']])));\n    setH('sy-os', RW.kv([['OS', esc((o.caption || '') + (o.display ? ' ' + o.display : ''))], ['Build', esc(o.build ? o.build + (o.ubr ? '.' + o.ubr : '') : o.version || '')], ['Kernel', esc(o.kernel || '')], ['Booted', F.date(o.bootMs)], ['Uptime', F.age(s.uptime)], ['Hostname', esc(st.hostname)], ['Elevated', inv.isAdmin ? 'yes' : 'no'], ['RigWatch', esc('v' + st.version + ' · PID ' + st.pid + ' · ' + st.bind + ' · every ' + st.interval + ' ms')], ['Node.js', esc(st.node)], ['Data dir', '<code>' + esc(st.home) + '</code>' + (st.persist ? '' : ' (persistence off)')]]));\n    setH('sy-col', '<table class=\"t\"><tbody>' + s.status.collectors.map(c => '<tr><td>' + esc(c.name) + (c.err ? '<div class=\"muted\" style=\"font-size:12px;white-space:normal\">' + esc(c.err) + '</div>' : '') + '</td><td class=\"n\"><span class=\"chip ' + (c.ok ? 'good' : c.optional ? '' : 'warn') + '\"><i></i>' + esc(c.detail || (c.ok ? 'ok' : 'off')) + '</span></td></tr>').join('') + '</tbody></table>');\n    const ss = RW.settings || {};\n    setH('sy-set', [['resolveHostnames', 'Reverse-resolve remote IPs in the connections table'], ['procEvents', 'Record process start/exit in the timeline'], ['hostEvents', 'Record first contact with new remote hosts'], ['healthChecks', 'HTTP health-check dev servers every 10 s']].map(([k, l]) => '<label class=\"check\" style=\"display:flex;margin:8px 0\"><input type=\"checkbox\" data-setting=\"' + k + '\"' + (ss[k] ? ' checked' : '') + (RW.canControl() ? '' : ' disabled') + '>' + esc(l) + '</label>').join(''));\n    const a = RW.auth || {};\n    setH('sy-acc', RW.kv([['This device', a.control ? 'full control' : 'read-only'], ['Listening on', '<code>' + esc(st.bind) + '</code>']]) + (a.local ? (a.lanUrl && a.lanUrl.length ? '<h3>Control from your phone / another PC</h3><div class=\"muted\" style=\"margin-bottom:6px\">Open once on that device; it remembers a cookie. Treat it like a password.</div>' + a.lanUrl.map(u => '<div class=\"cmd\" style=\"margin-bottom:6px\">' + esc(u) + '</div>').join('') : '<div class=\"note\" style=\"margin-top:10px\">Only this machine can reach the dashboard. Start with <code>HOST=0.0.0.0</code> to open it to your LAN: other devices get read-only, and the token URL shown here unlocks control.</div>') : ''));\n    if (st.platform === 'win32') {\n      const T = s.status.tools || {};\n      setH('sy-setup', RW.kv([\n        ['Administrator', inv.isAdmin ? '<span class=\"chip good\"><i></i>yes: everything unlocked</span>' : '<span class=\"chip warn\"><i></i>no</span> ' + RW.fixButtons('admin')],\n        ['Sensor library', T.lhm ? '<span class=\"chip ' + (T.lhm.state === 'ready' ? 'good' : T.lhm.state === 'error' ? 'crit' : '') + '\"><i></i>' + esc(T.lhm.state) + '</span> <span class=\"muted\">LibreHardwareMonitor 0.9.6, built in</span>' : ''],\n        ['CPU / board driver', s.status.pawnio ? '<span class=\"chip good\"><i></i>PawnIO installed</span>' : s.status.pawnio === false ? '<span class=\"chip warn\"><i></i>not installed</span> ' + RW.fixButtons('cpu') : '<span class=\"muted\">checking…</span>'],\n        ['Frame capture', T.presentmon ? '<span class=\"chip ' + (s.fps.status === 'running' ? 'good' : 'warn') + '\"><i></i>' + esc(s.fps.status) + '</span> <span class=\"muted\">PresentMon 2.6.0</span>' : ''],\n      ]) + '<div class=\"muted\" style=\"font-size:12px;margin-top:10px\">Helpers are downloaded automatically on first run from their official releases and verified by SHA-256. Set <code>NO_DOWNLOAD=1</code> to disable, <code>--no-elevate</code> to skip the admin prompt.</div>');\n    } else setH('sy-setup', '<div class=\"note\"><ol>' + (st.platform === 'linux' ? '<li><b>Temps</b>: <code>sudo sensors-detect</code> (lm-sensors).</li><li><b>All sockets with owners</b>: run as root (otherwise only your own processes show a PID).</li><li><b>Docker</b>: add yourself to the <code>docker</code> group.</li>' : '<li><b>Sockets of all users</b>: run with sudo.</li><li>Temperatures need SMC access, which RigWatch does not use.</li>') + '<li><b>NVIDIA</b>: anything with <code>nvidia-smi</code> on PATH is picked up automatically.</li><li><b>Docker / Podman</b>: detected on the default socket or <code>DOCKER_HOST</code>.</li></ol></div>');\n    setH('sy-keys', RW.kv([['Ctrl K', 'command palette'], ['1 – 9', 'jump to a page'], ['/', 'filter processes'], ['P', 'pause / resume'], ['T', 'toggle theme'], ['E', 'customize dashboard'], ['[', 'collapse sidebar'], ['Esc', 'close drawer / dialog']]));\n    const API = [['GET /api/stream', 'SSE: hello, history, snap, events, job, alert, siem'], ['GET /api/snapshot', 'everything, as JSON'], ['GET /api/history?range=24h', 'metric history (&format=csv)'], ['GET /api/timeline', 'events (&format=csv)'], ['GET /api/process?pid=', 'one process in depth'], ['GET /api/netinfo', 'ARP, routes, DNS, firewall, Wi-Fi'], ['GET /api/security', 'findings + posture'], ['POST /api/action', 'kill, suspend, priority, services, docker'], ['POST /api/jobs', 'run a Net Lab tool'], ['GET /api/siem/overview?range=7d', 'SIEM summary: severities, modules, top rules'], ['GET /api/siem/events?q=level>=10', 'security events (q: ip: user: rule: group: mitre: level>=)'], ['GET /api/siem/facets?module=auth', 'counts per field + histogram for a module'], ['GET /api/siem/export?format=csv', 'export events (csv or json)'], ['POST /api/siem/block', 'block an IP or range ({ip, minutes, reason})'], ['GET /overlay', 'compact page for OBS or a second screen']];\n    setH('sy-api', RW.kv(API.map(([k, v]) => [k, esc(v)])));\n  },\n};\n})();\n","public/js/pages-tools.js":"'use strict';\n/* Toolbox page (Windows power tools) + elevation / driver helpers used across the UI. */\n(() => {\nconst { esc, f: F, icon, setH } = RW;\nconst WIN = () => RW.st && RW.st.platform === 'win32';\nconst tb = (what, q) => RW.api('/api/tb?what=' + what + (q ? '&' + new URLSearchParams(q) : ''));\nconst tbAct = async (body, quiet) => { try { const r = await RW.api('/api/tb', { method: 'POST', body }); if (!quiet) RW.toast(r.msg, 'ok', 6000); return r; } catch (e) { RW.toast(e.message, 'err', 8000); throw e; } };\nRW.tbAct = tbAct;\n\n// ---------- elevation / PawnIO one-click helpers ----------\nRW.fixButtons = need => {\n  if (!WIN() || !RW.auth || !RW.auth.local) return '';\n  const s = RW.snap && RW.snap.status;\n  const b = [];\n  if ((need === 'admin' || need === 'cpu') && RW.st.canElevate) b.push('<button class=\"btn sm primary\" data-cmd=\"elevate\">' + icon('shield') + 'Restart as admin</button>');\n  if (need === 'cpu' && !RW.st.canElevate && s && s.pawnio === false) b.push('<button class=\"btn sm primary\" data-cmd=\"pawnio\">' + icon('zap') + 'Enable CPU & board sensors</button>');\n  return b.join(' ');\n};\nRW.elevate = async () => {\n  if (!(await RW.confirm('Restart RigWatch as administrator?', 'Windows will show a UAC prompt. RigWatch restarts in a minimized window with full sensors, FPS capture, service control and firewall tools. This page reconnects by itself.', { ok: 'Restart as admin' }))) return;\n  try { const r = await RW.api('/api/elevate', { method: 'POST' }); RW.toast(r.msg + ' Approve the Windows prompt.', 'ok', 9000); } catch (e) { RW.toast(e.message, 'err', 8000); }\n};\nRW.pawnio = async () => {\n  if (!(await RW.confirm('Enable CPU and motherboard sensors?', 'CPU temperatures, CPU power and Super I/O fans need the <b>PawnIO</b> driver (signed by its author, the driver LibreHardwareMonitor uses). RigWatch downloads the official 2.2.0 installer (SHA-256 verified) and opens it. Click Install, and sensors restart automatically.', { ok: 'Download & open installer' }))) return;\n  try { const r = await RW.api('/api/pawnio', { method: 'POST' }); RW.toast(r.msg, 'ok', 10000); } catch (e) { RW.toast(e.message, 'err', 8000); }\n};\n\n// ---------- toolbox page ----------\nconst TABS = [['quick', 'Quick actions'], ['events', 'Event logs'], ['apps', 'Installed apps'], ['startup', 'Startup & tasks'], ['devices', 'Devices & drivers'], ['updates', 'Updates'], ['hosts', 'Hosts file'], ['env', 'Environment & PATH'], ['du', 'Disk usage'], ['firewall', 'Firewall blocks']];\nconst TOOL_NAMES = { taskmgr: 'Task Manager', devmgmt: 'Device Manager', eventvwr: 'Event Viewer', services: 'Services', resmon: 'Resource Monitor', perfmon: 'Performance Monitor', firewall: 'Firewall (advanced)', network: 'Network adapters', programs: 'Programs & Features', sysprops: 'System properties', diskmgmt: 'Disk Management', compmgmt: 'Computer Management', regedit: 'Registry Editor', msinfo: 'System Information', power: 'Power options', sound: 'Sound', tasksched: 'Task Scheduler', gpedit: 'Group Policy', cmd: 'Command Prompt', powershell: 'PowerShell' };\nconst SEC_IDS = { 4625: 'Failed sign-in', 4740: 'Account locked out', 4720: 'User account created', 4726: 'User account deleted', 4732: 'Added to a local group', 4728: 'Added to a global group', 4756: 'Added to a universal group', 1102: 'Security log cleared', 4697: 'Service installed', 4719: 'Audit policy changed', 4648: 'Sign-in with explicit credentials', 7045: 'New service installed', 104: 'Event log cleared', 6008: 'Unexpected shutdown', 41: 'Kernel power loss (crash/hard reset)', 1116: 'Defender: malware detected', 1117: 'Defender: action taken', 5001: 'Defender: real-time protection disabled', 5010: 'Defender: scanning disabled', 5012: 'Defender: virus scanning disabled', 1006: 'Defender: malware found', 1015: 'Defender: suspicious behavior', 1149: 'RDP sign-in accepted', 4104: 'Suspicious PowerShell script block' };\nconst DEV_CODES = { 1: 'not configured correctly', 3: 'driver may be corrupted', 10: 'cannot start', 12: 'not enough free resources', 14: 'needs a restart', 18: 'reinstall the drivers', 19: 'registry problem', 21: 'being removed', 22: 'disabled', 24: 'not present / not working', 28: 'drivers not installed', 31: 'not working properly', 37: 'driver failed to initialize', 39: 'driver missing or corrupted', 43: 'stopped: reported problems', 45: 'not connected', 47: 'safely removed', 48: 'driver blocked', 52: 'driver signature not verified' };\nlet tab = 'quick', data = {}, loading = {}, evq = { log: 'System', level: 'warn', hours: '24' }, appQ = '', tasksAll = false, duJob = null, duDir = '';\nconst load = (key, fn) => { if (loading[key]) return; loading[key] = true; fn().then(d => { data[key] = d; }).catch(e => { data[key] = { error: e.message }; }).finally(() => { loading[key] = false; RW.pages.toolbox.draw(); }); };\nconst errBox = d => (d && d.error ? '<div class=\"note\">' + esc(d.error) + (/admin|denied|privilege/i.test(d.error) ? ' ' + RW.fixButtons('admin') : '') + '</div>' : '');\nconst ctl = () => RW.canControl();\n\nRW.pages.toolbox = {\n  title: 'Toolbox', sub: 'Windows power tools: quick fixes, logs, apps, startup, drivers, hosts, PATH, disk usage, firewall', keepOnParams: true,\n  mount(root, params) {\n    tab = params.tab || tab;\n    root.innerHTML = '<div class=\"toolbar\"><div class=\"seg\" id=\"tbtabs\" style=\"flex-wrap:wrap\">' + TABS.map(([k, l]) => '<button data-tbt=\"' + k + '\" class=\"' + (tab === k ? 'on' : '') + '\">' + l + '</button>').join('') + '</div></div><div id=\"tbb\"></div>';\n    this.open(tab);\n    root.addEventListener('click', e => this.click(e));\n    root.addEventListener('change', e => this.change(e));\n    root.addEventListener('input', e => { if (e.target.id === 'appq') { appQ = e.target.value.trim().toLowerCase(); this.draw(); } });\n    if (!this.bound) { RW.on('job', id => { if (RW.page === 'toolbox' && id === duJob) this.draw(); }); this.bound = true; }\n  },\n  onParams(p) { if (p.tab) this.open(p.tab); },\n  open(t) {\n    tab = t; RW.$$('#tbtabs button').forEach(b => b.classList.toggle('on', b.dataset.tbt === t));\n    if (t === 'quick') { load('overview', () => tb('overview')); load('temp', () => tb('temp')); }\n    if (t === 'events') load('events', () => (evq.log === 'Security' ? tb('secevents', { hours: evq.hours }) : tb('events', evq)));\n    if (t === 'apps') load('apps', () => tb('apps'));\n    if (t === 'startup') { load('startup', () => RW.api('/api/startup')); load('tasks', () => tb('tasks', { all: tasksAll ? '1' : '0' })); }\n    if (t === 'devices') { load('devices', () => tb('devices')); load('drivers', () => tb('drivers')); }\n    if (t === 'updates') load('updates', () => tb('updates'));\n    if (t === 'hosts') load('hosts', () => tb('hosts'));\n    if (t === 'env') load('env', () => tb('env'));\n    if (t === 'firewall') load('fw', () => tb('fwlist'));\n    this.draw();\n  },\n  refresh(key) { delete data[key]; this.open(tab); },\n  async click(e) {\n    const t = e.target.closest('[data-tbt]'); if (t) return this.open(t.dataset.tbt);\n    const q = e.target.closest('[data-quick]');\n    if (q) {\n      const op = q.dataset.quick;\n      const danger = { restartexplorer: 'Explorer (taskbar, desktop) restarts. Open File Explorer windows close.', renewip: 'Your network drops for a few seconds while Windows gets a new address.', cleantemp: 'Deletes temp files older than 24 hours from ' + esc((data.temp && data.temp.dirs || []).map(d => d.dir).join(' and ')) + '. Files in use are skipped. This cannot be undone.', emptyrecycle: 'Permanently deletes everything in the Recycle Bin. This cannot be undone.', shutdown: 'The PC shuts down in 1 minute. You can cancel it here.', restart: 'The PC restarts in 1 minute. You can cancel it here.' }[op];\n      if (danger && !(await RW.confirm(q.textContent.trim() + '?', danger, { danger: op !== 'shutdown' && op !== 'restart' ? true : false, ok: q.textContent.trim() }))) return;\n      q.disabled = true;\n      try { await tbAct({ op, minutes: 1 }); if (op === 'cleantemp' || op === 'emptyrecycle') this.refresh('temp'); } catch { /* toasted */ } finally { q.disabled = false; }\n      return;\n    }\n    const ot = e.target.closest('[data-open]'); if (ot) return tbAct({ op: 'opentool', name: ot.dataset.open }, true).catch(() => {});\n    const pl = e.target.closest('[data-plan]'); if (pl) { await tbAct({ op: 'setplan', guid: pl.dataset.plan }).catch(() => {}); return this.refresh('overview'); }\n    if (e.target.closest('#ultimate')) { await tbAct({ op: 'ultimateplan' }).catch(() => {}); return this.refresh('overview'); }\n    const un = e.target.closest('[data-uninstall]');\n    if (un && await RW.confirm('Uninstall ' + esc(un.dataset.name) + '?', 'Starts the app\\u2019s own uninstaller. Follow its prompts.', { danger: true, ok: 'Start uninstaller' })) return tbAct({ op: 'uninstall', key: un.dataset.uninstall }).catch(() => {});\n    const st = e.target.closest('[data-startup]');\n    if (st) { await tbAct({ op: 'startup', name: st.dataset.startup, location: st.dataset.loc, enable: st.dataset.en === '1' }).catch(() => {}); return this.refresh('startup'); }\n    const tk = e.target.closest('[data-task]');\n    if (tk) { if (tk.dataset.act === 'disable' && !(await RW.confirm('Disable ' + esc(tk.dataset.task) + '?', 'The task will not run until you enable it again.', { ok: 'Disable' }))) return; await tbAct({ op: 'task', path: tk.dataset.path, name: tk.dataset.task, action: tk.dataset.act }).catch(() => {}); return this.refresh('tasks'); }\n    const hs = e.target.closest('[data-hosts]');\n    if (hs) { if (hs.dataset.hosts === 'remove' && !(await RW.confirm('Remove this hosts entry?', 'A backup is saved as hosts.rigwatch.bak.', { danger: true, ok: 'Remove' }))) return; await tbAct({ op: 'hosts', action: hs.dataset.hosts, line: +hs.dataset.line }).catch(() => {}); return this.refresh('hosts'); }\n    if (e.target.closest('#hostadd')) { const v = await RW.prompt('Add hosts entry', [{ name: 'ip', label: 'IP address', value: '127.0.0.1' }, { name: 'host', label: 'Host name', placeholder: 'myapp.test' }], 'Add'); if (v) { await tbAct({ op: 'hosts', action: 'add', ip: v.ip, host: v.host }).catch(() => {}); this.refresh('hosts'); } return; }\n    const ub = e.target.closest('[data-unblock]'); if (ub) { await tbAct({ op: 'fwblock', path: ub.dataset.unblock, on: false }).catch(() => {}); return this.refresh('fw'); }\n    if (e.target.closest('#durun') || e.target.closest('[data-du]')) {\n      const el = e.target.closest('[data-du]'); duDir = el ? el.dataset.du : (document.getElementById('dudir') || {}).value || '';\n      try { const j = await RW.tool('du', { dir: duDir }); duJob = j.id; this.draw(); } catch (er) { RW.toast(er.message, 'err'); }\n      return;\n    }\n    if (e.target.closest('#tbrefresh')) return this.refresh({ quick: 'overview', events: 'events', apps: 'apps', startup: 'startup', devices: 'devices', updates: 'updates', hosts: 'hosts', env: 'env', firewall: 'fw' }[tab]);\n  },\n  change(e) {\n    const t = e.target;\n    if (t.dataset.evq) { evq[t.dataset.evq] = t.value; delete data.events; this.open('events'); }\n    if (t.id === 'tasksall') { tasksAll = t.checked; delete data.tasks; this.open('startup'); }\n  },\n  update() { this.draw(); },\n  draw() {\n    const d = data, c = ctl() ? '' : ' disabled';\n    const refresh = '<button class=\"btn sm ghost\" id=\"tbrefresh\">' + icon('refresh') + 'Refresh</button>';\n    let h = '';\n    if (tab === 'quick') {\n      const ov = d.overview || {}, tmp = d.temp || {};\n      const tmpBytes = (tmp.dirs || []).reduce((a, x) => a + x.bytes, 0);\n      const q = (op, ic, label, sub, dz) => '<button class=\"btn' + (dz ? ' danger' : '') + '\" data-quick=\"' + op + '\" style=\"flex-direction:column;align-items:flex-start;gap:2px;min-width:180px\"' + c + '><span style=\"display:flex;gap:7px;align-items:center\">' + icon(ic) + '<b>' + label + '</b></span><span class=\"muted\" style=\"font-size:12px\">' + sub + '</span></button>';\n      h += '<div class=\"grid g3\"><article class=\"card span2\"><header><h2>Quick actions</h2><span class=\"right\">' + refresh + '</span></header><div style=\"display:flex;gap:10px;flex-wrap:wrap\">' +\n        q('flushdns', 'refresh', 'Flush DNS', 'clear cached lookups') + (WIN() ? q('renewip', 'wifi', 'Renew IP', 'release + renew DHCP') + q('restartexplorer', 'grid', 'Restart Explorer', 'fix a stuck taskbar') : '') + q('lock', 'lock', 'Lock PC', 'lock this session') +\n        q('cleantemp', 'trash', 'Clean temp files', tmp.dirs ? F.b(tmpBytes, 1) + ' in temp' + (tmp.partial ? '+' : '') : 'measuring\\u2026', true) + (WIN() ? q('emptyrecycle', 'trash', 'Empty Recycle Bin', tmp.recycle ? tmp.recycle.items + ' items \\u00b7 ' + F.b(tmp.recycle.bytes, 1) : '\\u2026', true) : '') +\n        q('restart', 'refresh', 'Restart in 1 min', 'scheduled, cancelable') + q('shutdown', 'power', 'Shut down in 1 min', 'scheduled, cancelable') + q('abortshutdown', 'x', 'Cancel shutdown', 'abort a scheduled one') + '</div>' +\n        (ov.reboot && ov.reboot.length ? '<div class=\"note\" style=\"margin-top:12px\">' + icon('alert') + ' <b>Restart pending</b> (' + esc(ov.reboot.join(', ')) + ').</div>' : '') + '</article>' +\n        '<article class=\"card\"><header><h2>Privileges & drivers</h2></header>' + RW.kv([['Running as admin', RW.st.elevated ? '<span class=\"chip good\"><i></i>yes</span>' : '<span class=\"chip warn\"><i></i>no</span>'], ['Sensor driver', RW.snap && RW.snap.status.pawnio ? '<span class=\"chip good\"><i></i>PawnIO installed</span>' : RW.snap && RW.snap.status.pawnio === false ? '<span class=\"chip warn\"><i></i>PawnIO not installed</span>' : '<span class=\"muted\">checking\\u2026</span>'], ['Helpers', Object.entries((RW.snap && RW.snap.status.tools) || {}).map(([k, v]) => esc(k) + ' <span class=\"muted\">' + esc(v.state) + '</span>').join(' \\u00b7 ')]]) + '<div style=\"margin-top:10px;display:flex;gap:8px;flex-wrap:wrap\">' + RW.fixButtons('cpu') + '</div></article></div>';\n      h += '<div class=\"grid g2\"><article class=\"card\"><header><h2>Power plan</h2></header>' + ((ov.plans || []).map(p => '<div class=\"brow\"><span class=\"bl\">' + (p.active ? '<span class=\"chip good\"><i></i>active</span> ' : '') + '<b>' + esc(p.name) + '</b></span><span class=\"bv\">' + (p.active ? '' : '<button class=\"btn sm\" data-plan=\"' + esc(p.guid) + '\"' + c + '>Activate</button>') + '</span></div>').join('') || '<div class=\"empty\">No power plans exposed on this OS.</div>') + (WIN() && ov.plans && !ov.plans.some(p => /ultimate/i.test(p.name)) ? '<button class=\"btn sm\" id=\"ultimate\" style=\"margin-top:8px\"' + c + '>' + icon('zap') + 'Add Ultimate Performance plan</button>' : '') + '</article>' +\n        (WIN() ? '<article class=\"card\"><header><h2>Open Windows tools</h2></header><div style=\"display:flex;gap:6px;flex-wrap:wrap\">' + Object.entries(TOOL_NAMES).map(([k, l]) => '<button class=\"btn sm\" data-open=\"' + k + '\"' + c + '>' + esc(l) + '</button>').join('') + '</div></article>' : '') + '</div>';\n    } else if (tab === 'events') {\n      const ev = d.events;\n      const list = ev && !ev.error ? (Array.isArray(ev) ? ev : ev.events || []) : [];\n      h += '<article class=\"card\"><div class=\"toolbar\"><select data-evq=\"log\">' + ['System', 'Application', WIN() ? 'Security' : null].filter(Boolean).map(l => '<option value=\"' + l + '\"' + (evq.log === l ? ' selected' : '') + '>' + (l === 'Security' ? 'Security highlights' : l) + '</option>').join('') + '</select>' +\n        (evq.log !== 'Security' ? '<select data-evq=\"level\"><option value=\"error\"' + (evq.level === 'error' ? ' selected' : '') + '>Errors</option><option value=\"warn\"' + (evq.level === 'warn' ? ' selected' : '') + '>Errors + warnings</option><option value=\"all\"' + (evq.level === 'all' ? ' selected' : '') + '>Everything</option></select>' : '') +\n        '<select data-evq=\"hours\">' + [['1', 'last hour'], ['24', 'last 24 h'], ['72', 'last 3 days'], ['168', 'last 7 days'], ['720', 'last 30 days']].map(([v, l]) => '<option value=\"' + v + '\"' + (evq.hours === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select><span class=\"grow\"></span><span class=\"muted\">' + (loading.events ? 'loading\\u2026' : list.length + ' events') + '</span>' + refresh + '</div>' +\n        errBox(ev) + (ev && ev.errors && ev.errors.length ? '<div class=\"muted\" style=\"font-size:12px;margin-bottom:8px\">' + esc(ev.errors.join(' \\u00b7 ')) + (RW.st.elevated ? '' : ' ' + RW.fixButtons('admin')) + '</div>' : '') +\n        '<div class=\"tw\" style=\"max-height:calc(100vh - 250px)\">' + RW.table('tbev', [\n          { k: 't', label: 'Time', fmt: x => '<span class=\"muted\">' + F.date(x.t) + '</span>' },\n          { k: 'level', label: 'Level', fmt: x => (x.level <= 2 ? '<span class=\"chip crit\"><i></i>error</span>' : x.level === 3 ? '<span class=\"chip warn\"><i></i>warning</span>' : '<span class=\"chip\"><i></i>info</span>') },\n          { k: 'id', label: 'Event', fmt: x => '<b>' + x.id + '</b>' + (SEC_IDS[x.id] && evq.log === 'Security' ? ' ' + esc(SEC_IDS[x.id]) : '') + '<div class=\"muted\" style=\"font-size:11.5px\">' + esc(x.provider) + '</div>' },\n          { k: 'msg', label: 'Details', cls: 'wrap', fmt: x => (x.user ? '<b>user</b> ' + esc(x.user) + (x.ip && x.ip !== '-' ? ' from <span class=\"mono\">' + esc(x.ip) + '</span>' : '') + (x.logonType ? ' (logon type ' + x.logonType + ')' : '') + '<br>' : '') + (x.service ? '<b>' + esc(x.service) + '</b> <span class=\"mono\">' + esc(x.image) + '</span><br>' : '') + '<span class=\"ink2\" style=\"font-size:12.5px\">' + esc(String(x.msg || '').slice(0, 300)) + '</span>' },\n        ], list, { sortK: 't', max: 800 }) + '</div></article>';\n    } else if (tab === 'apps') {\n      const a = Array.isArray(d.apps) ? d.apps.filter(x => !appQ || (x.name + ' ' + x.publisher).toLowerCase().includes(appQ)) : [];\n      h += '<article class=\"card\"><div class=\"toolbar\"><input type=\"search\" id=\"appq\" placeholder=\"Filter apps\" value=\"' + esc(appQ) + '\"><span class=\"grow\"></span><span class=\"muted\">' + (loading.apps ? 'loading\\u2026' : a.length + ' apps \\u00b7 ' + F.b(a.reduce((s, x) => s + (x.sizeKb || 0) * 1024, 0), 1)) + '</span>' + refresh + '</div>' + errBox(d.apps) +\n        '<div class=\"tw\" style=\"max-height:calc(100vh - 230px)\">' + RW.table('tbapps', [\n          { k: 'name', label: 'App', fmt: x => '<b>' + esc(x.name) + '</b>' + (x.arch === 'x86' ? '<span class=\"tag\">32-bit</span>' : '') + (x.scope === 'user' ? '<span class=\"tag\">per-user</span>' : '') },\n          { k: 'version', label: 'Version', fmt: x => '<span class=\"mono muted\">' + esc(x.version) + '</span>' },\n          { k: 'publisher', label: 'Publisher', fmt: x => esc(x.publisher) },\n          { k: 'date', label: 'Installed', fmt: x => esc(/^\\d{8}$/.test(x.date || '') ? x.date.slice(0, 4) + '-' + x.date.slice(4, 6) + '-' + x.date.slice(6) : x.date || '') },\n          { k: 'sizeKb', label: 'Size', num: true, fmt: x => (x.sizeKb ? F.b(x.sizeKb * 1024, 0) : '') },\n          { k: 'x', label: '', nosort: true, fmt: x => (x.key && x.hasUninstall && ctl() ? '<button class=\"btn sm danger\" data-uninstall=\"' + esc(x.key) + '\" data-name=\"' + esc(x.name) + '\">Uninstall</button>' : '') },\n        ], a, { sortK: 'name', sortD: 1 }) + '</div></article>';\n    } else if (tab === 'startup') {\n      const su = Array.isArray(d.startup) ? d.startup : [], tk = Array.isArray(d.tasks) ? d.tasks : [];\n      h += '<article class=\"card\" style=\"margin-bottom:14px\"><header><h2>Startup apps</h2><span class=\"right muted\">' + su.length + ' items</span>' + refresh + '</header>' + errBox(d.startup) + RW.table('tbsu', [\n        { k: 'name', label: 'Name', fmt: x => '<b>' + esc(x.name) + '</b>' },\n        { k: 'enabled', label: 'State', sort: x => (x.enabled === false ? 0 : 1), fmt: x => (x.enabled === false ? '<span class=\"chip\"><i></i>disabled</span>' : '<span class=\"chip good\"><i></i>enabled</span>') },\n        { k: 'kind', label: 'Type', fmt: x => '<span class=\"tag\">' + esc(x.kind) + '</span>' },\n        { k: 'cmd', label: 'Command', cls: 'wrap', fmt: x => '<span class=\"mono\" style=\"font-size:12px\">' + esc(x.cmd) + '</span>' },\n        { k: 'x', label: '', nosort: true, fmt: x => (x.toggle && ctl() ? '<button class=\"btn sm' + (x.enabled === false ? '' : ' danger') + '\" data-startup=\"' + esc(x.name) + '\" data-loc=\"' + esc(x.location) + '\" data-en=\"' + (x.enabled === false ? '1' : '0') + '\">' + (x.enabled === false ? 'Enable' : 'Disable') + '</button>' : '') },\n      ], su, { sortK: 'name', sortD: 1 }) + '</article>' +\n        '<article class=\"card\"><header><h2>Scheduled tasks</h2><span class=\"right\"><label class=\"check\"><input type=\"checkbox\" id=\"tasksall\"' + (tasksAll ? ' checked' : '') + '>include Microsoft tasks</label></span></header>' + errBox(d.tasks) + '<div class=\"tw\" style=\"max-height:520px\">' + RW.table('tbtasks', [\n          { k: 'name', label: 'Task', fmt: x => '<b>' + esc(x.name) + '</b><div class=\"muted mono\" style=\"font-size:11px\">' + esc(x.path) + '</div>' },\n          { k: 'state', label: 'State', fmt: x => '<span class=\"chip ' + (x.state === 'Running' ? 'good' : x.state === 'Disabled' ? '' : 'info') + '\"><i></i>' + esc(x.state) + '</span>' },\n          { k: 'triggers', label: 'Triggers', fmt: x => esc(x.triggers) },\n          { k: 'actions', label: 'Runs', cls: 'wrap', fmt: x => '<span class=\"mono\" style=\"font-size:12px\">' + esc(x.actions) + '</span>' },\n          { k: 'last', label: 'Last run', fmt: x => (x.last > 86400000 ? F.date(x.last) + (x.result ? ' <span class=\"chip warn\" title=\"last result\"><i></i>0x' + Number(x.result).toString(16) + '</span>' : '') : '<span class=\"muted\">never</span>') },\n          { k: 'next', label: 'Next', fmt: x => (x.next > 86400000 ? F.date(x.next) : '') },\n          { k: 'x', label: '', nosort: true, fmt: x => (ctl() && WIN() ? '<span style=\"display:inline-flex;gap:4px\"><button class=\"btn sm\" data-task=\"' + esc(x.name) + '\" data-path=\"' + esc(x.path) + '\" data-act=\"run\">Run</button>' + (x.state === 'Disabled' ? '<button class=\"btn sm\" data-task=\"' + esc(x.name) + '\" data-path=\"' + esc(x.path) + '\" data-act=\"enable\">Enable</button>' : '<button class=\"btn sm danger\" data-task=\"' + esc(x.name) + '\" data-path=\"' + esc(x.path) + '\" data-act=\"disable\">Disable</button>') + '</span>' : '') },\n        ], tk, { sortK: 'name', sortD: 1 }) + '</div></article>';\n    } else if (tab === 'devices') {\n      const dv = Array.isArray(d.devices) ? d.devices : [], dr = Array.isArray(d.drivers) ? d.drivers : [];\n      h += '<article class=\"card\" style=\"margin-bottom:14px\"><header><h2>Devices with problems</h2><span class=\"right\">' + refresh + '</span></header>' + errBox(d.devices) + (dv.length ? RW.table('tbdev', [{ k: 'name', label: 'Device', fmt: x => '<b>' + esc(x.name || x.id) + '</b><div class=\"muted mono\" style=\"font-size:11px\">' + esc(x.id) + '</div>' }, { k: 'cls', label: 'Class' }, { k: 'code', label: 'Problem', fmt: x => '<span class=\"chip warn\"><i></i>code ' + x.code + '</span> ' + esc(DEV_CODES[x.code] || '') }, { k: 'mfr', label: 'Maker' }], dv, { sortK: 'name', sortD: 1 }) : '<div class=\"empty\">' + (loading.devices ? 'checking\\u2026' : 'Every device is working.') + '</div>') + '</article>' +\n        '<article class=\"card\"><header><h2>Drivers</h2><span class=\"right muted\">' + (loading.drivers ? 'loading (a few seconds)\\u2026' : dr.length + ' drivers') + '</span></header><div class=\"tw\" style=\"max-height:560px\">' + RW.table('tbdrv', [{ k: 'name', label: 'Device', fmt: x => '<b>' + esc(x.name) + '</b>' }, { k: 'cls', label: 'Class', fmt: x => '<span class=\"tag\">' + esc(String(x.cls).toLowerCase()) + '</span>' }, { k: 'version', label: 'Version', fmt: x => '<span class=\"mono\">' + esc(x.version) + '</span>' }, { k: 'date', label: 'Date', fmt: x => (x.date ? new Date(x.date).toLocaleDateString() : '') }, { k: 'provider', label: 'Provider' }, { k: 'signed', label: 'Signed', fmt: x => (x.signed ? '<span class=\"chip good\"><i></i>' + esc(x.signer || 'yes') + '</span>' : '<span class=\"chip crit\"><i></i>unsigned</span>') }], dr, { sortK: 'cls', sortD: 1 }) + '</div></article>';\n    } else if (tab === 'updates') {\n      const u = d.updates || {};\n      h += '<article class=\"card\"><header><h2>Updates</h2><span class=\"right\">' + refresh + '</span></header>' + errBox(u) + (u.reboot && u.reboot.length ? '<div class=\"note\" style=\"margin-bottom:10px\">' + icon('alert') + ' <b>A restart is pending</b>: ' + esc(u.reboot.join(', ')) + '</div>' : u.hotfixes ? '<div class=\"muted\" style=\"margin-bottom:10px\">' + icon('check') + ' No restart pending.' + (u.lastBoot ? ' Last boot ' + F.date(u.lastBoot) + '.' : '') + '</div>' : '') +\n        RW.table('tbhf', [{ k: 'id', label: 'Update', fmt: x => '<b class=\"mono\">' + esc(x.id) + '</b>' }, { k: 'desc', label: 'Type' }, { k: 'date', label: 'Installed', fmt: x => (x.date ? new Date(x.date).toLocaleDateString() : '') }, { k: 'by', label: 'By', fmt: x => '<span class=\"muted\">' + esc(x.by) + '</span>' }], u.hotfixes || [], { sortK: 'date' }) + '</article>';\n    } else if (tab === 'hosts') {\n      const hs = d.hosts || {};\n      h += '<article class=\"card\"><header><h2>Hosts file</h2><span class=\"muted\">' + esc(hs.file || '') + '</span><span class=\"right\">' + (hs.writable === false ? '<span class=\"chip warn\"><i></i>read-only without admin</span> ' + RW.fixButtons('admin') : '') + '<button class=\"btn sm\" id=\"hostadd\"' + (ctl() && hs.writable ? '' : ' disabled') + '>' + icon('plus') + 'Add entry</button>' + refresh + '</span></header>' + errBox(hs) +\n        RW.table('tbhosts', [{ k: 'ip', label: 'IP', fmt: x => '<span class=\"mono\">' + esc(x.ip) + '</span>' }, { k: 'hosts', label: 'Host names', sort: x => x.hosts.join(' '), fmt: x => '<span class=\"mono\">' + esc(x.hosts.join(' ')) + '</span>' }, { k: 'enabled', label: 'State', fmt: x => (x.enabled ? '<span class=\"chip good\"><i></i>active</span>' : '<span class=\"chip\"><i></i>commented out</span>') }, { k: 'x', label: '', nosort: true, fmt: x => (ctl() && hs.writable ? '<button class=\"btn sm\" data-hosts=\"toggle\" data-line=\"' + x.line + '\">' + (x.enabled ? 'Disable' : 'Enable') + '</button> <button class=\"btn sm danger\" data-hosts=\"remove\" data-line=\"' + x.line + '\">Remove</button>' : '') }], hs.entries || [], { empty: 'No active entries: the hosts file only has comments.' }) + '</article>';\n    } else if (tab === 'env') {\n      const ev = d.env || {};\n      const bad = (ev.path || []).filter(p => !p.exists || p.dup).length;\n      h += '<div class=\"grid g2\"><article class=\"card span2\" style=\"grid-column:1/-1\"><header><h2>PATH</h2><span class=\"right muted\">' + (ev.path ? ev.path.length + ' entries' + (bad ? ' \\u00b7 ' + bad + ' broken or duplicate' : ' \\u00b7 all good') : '') + '</span>' + refresh + '</header>' + errBox(ev) + RW.table('tbpath', [{ k: 'i', label: '#', num: true, nosort: true, fmt: x => String((ev.path || []).indexOf(x) + 1) }, { k: 'scope', label: 'Scope', fmt: x => '<span class=\"tag\">' + esc(x.scope) + '</span>' }, { k: 'dir', label: 'Directory', fmt: x => '<span class=\"mono\">' + esc(x.dir) + '</span>' }, { k: 'exists', label: 'Status', fmt: x => (!x.exists ? '<span class=\"chip crit\"><i></i>missing</span>' : x.dup ? '<span class=\"chip warn\"><i></i>duplicate</span>' : '<span class=\"chip good\"><i></i>ok</span>') }], ev.path || []) + '</article>' +\n        ['user', 'machine'].map(sc => '<article class=\"card\"><header><h2>' + (sc === 'user' ? 'User variables' : 'System variables') + '</h2><span class=\"right muted\">secrets hidden</span></header><div class=\"tw\" style=\"max-height:420px\">' + RW.table('tbenv' + sc, [{ k: 'k', label: 'Name', fmt: x => '<b class=\"mono\">' + esc(x.k) + '</b>' }, { k: 'v', label: 'Value', cls: 'wrap', fmt: x => '<span class=\"mono\" style=\"font-size:12px\">' + esc(String(x.v).slice(0, 500)) + '</span>' }], (ev[sc] || []).filter(x => !/^path$/i.test(x.k)), { sortK: 'k', sortD: 1 }) + '</div></article>').join('') + '</div>';\n    } else if (tab === 'du') {\n      const j = duJob && RW.jobs.get(duJob);\n      const r = j && j.result;\n      h += '<article class=\"card\" style=\"margin-bottom:14px\"><div class=\"form\"><label class=\"field\" style=\"flex:1\">Folder<input type=\"text\" id=\"dudir\" value=\"' + esc(duDir || (WIN() ? 'C:\\\\' : '/')) + '\"></label><button class=\"btn primary\" id=\"durun\"' + c + '>' + icon('disk') + 'Analyze</button></div>' + (j ? '<div class=\"term\" style=\"min-height:60px;max-height:140px\">' + j.lines.slice(-6).map(l => '<span class=\"' + esc(l.cls) + '\">' + esc(l.text) + '</span>').join('\\n') + '</div>' : '<div class=\"muted\">Finds what is eating your disk. Click a folder in the result to drill down.</div>') + '</article>';\n      if (r) {\n        const mx = r.top[0] ? r.top[0].bytes : 1;\n        h += '<div class=\"grid g2\"><article class=\"card\"><header><h2>' + esc(r.dir) + '</h2><span class=\"right muted\">' + F.b(r.total, 1) + ' \\u00b7 ' + F.num(r.files) + ' files' + (r.partial ? ' (partial)' : '') + '</span></header>' + r.top.map(t => RW.brow((t.dir ? '<a data-du=\"' + esc(t.path) + '\" title=\"drill down\">' + icon('folder') + ' ' + esc(t.path.split(/[\\\\/]/).pop()) + '</a>' : esc(t.path.split(/[\\\\/]/).pop())) + ' <span class=\"muted\">' + F.num(t.files) + ' files</span>', F.b(t.bytes, 1), 100 * t.bytes / mx, '--s4')).join('') + '</article>' +\n          '<article class=\"card\"><header><h2>Biggest files</h2></header>' + (r.biggest.length ? r.biggest.map(b => '<div class=\"brow\"><span class=\"bl mono\" style=\"font-size:12px\" title=\"' + esc(b.path) + '\">' + esc(b.path) + '</span><span class=\"bv\">' + F.b(b.bytes, 1) + '</span></div>').join('') : '<div class=\"empty\">No files over 50 MB.</div>') + '</article></div>';\n      }\n    } else if (tab === 'firewall') {\n      const fw = Array.isArray(d.fw) ? d.fw : [];\n      h += '<article class=\"card\"><header><h2>Apps blocked by RigWatch</h2><span class=\"right muted\">block or unblock any app from its process drawer</span>' + refresh + '</header>' + errBox(d.fw) + (fw.length ? RW.table('tbfw', [{ k: 'name', label: 'Rule', fmt: x => '<b>' + esc(x.name) + '</b>' }, { k: 'dir', label: 'Direction' }, { k: 'program', label: 'Program', fmt: x => '<span class=\"mono\" style=\"font-size:12px\">' + esc(x.program) + '</span>' }, { k: 'x', label: '', nosort: true, fmt: x => (ctl() && /outbound/i.test(x.dir) ? '<button class=\"btn sm\" data-unblock=\"' + esc(x.program) + '\">Unblock</button>' : '') }], fw) : '<div class=\"empty\">No apps blocked. Open a process and choose <b>Block network</b> to cut it off from the internet with a Windows Firewall rule.</div>') + '</article>';\n    }\n    const box = document.getElementById('tbb'); if (box) setH(box, h);\n  },\n};\n})();\n","public/js/widgets.js":"'use strict';\n/* Dashboard: widget registry, drag/resize grid editor, and shared renderers used across pages. */\n(() => {\nconst { esc, f: F, icon, setH } = RW;\n\n// ---------- shared renderers ----------\nRW.groupApps = procs => {\n  const g = new Map();\n  for (const p of procs || []) {\n    if (p.kind === 'rigwatch') continue;\n    const k = p.name.toLowerCase();\n    let e = g.get(k);\n    if (!e) { e = { name: p.name, kind: p.kind, n: 0, cpu: 0, mem: 0, gpu: 0, vram: 0, io: 0, conns: 0, ports: [], pids: [] }; g.set(k, e); }\n    e.n++; e.cpu += p.cpu || 0; e.mem += p.mem || 0; e.gpu += p.gpu || 0; e.vram += p.vram || 0; e.io += p.io || 0; e.conns += p.conns || 0; e.pids.push(p.pid);\n    for (const x of p.ports || []) if (!e.ports.includes(x)) e.ports.push(x);\n  }\n  return [...g.values()].map(e => Object.assign(e, { gpu: Math.min(100, e.gpu) }));\n};\nRW.topList = (apps, key, fmt, col, n) => {\n  const a = apps.filter(x => x[key] > 0).sort((x, y) => y[key] - x[key]).slice(0, n || 6);\n  if (!a.length) return '<div class=\"empty\">nothing yet</div>';\n  const mx = a[0][key] || 1;\n  return a.map(x => RW.brow(esc(x.name) + (x.n > 1 ? ' <span class=\"muted\">×' + x.n + '</span>' : ''), fmt(x[key]), 100 * x[key] / mx, col, 'data-q=\"' + esc(x.name) + '\"')).join('');\n};\nconst EV_ICON = { 'proc.start': 'play', 'proc.exit': 'stop', 'port.open': 'unlock', 'port.close': 'lock', 'net.newhost': 'globe', 'alert.fire': 'bell', 'alert.clear': 'check', 'finding.new': 'shield', 'finding.clear': 'check', action: 'zap', 'lan.device': 'wifi', system: 'info' };\nRW.evRow = e => '<div class=\"ev ' + esc(e.sev) + '\"><time title=\"' + esc(new Date(e.t).toLocaleString()) + '\">' + F.time(e.t) + '</time>' + icon(EV_ICON[e.type] || 'info') + '<div class=\"et\">' + esc(e.title) + '</div>' + (e.detail ? '<div class=\"ed\">' + esc(e.detail) + '</div>' : '') + '</div>';\nRW.healthChip = h => {\n  if (!h) return '';\n  if (h.kind === 'tcp' || (!h.status && h.err && !/ECONNREFUSED|timeout/i.test(h.err))) return '<span class=\"chip info\" title=\"TCP port, not HTTP\"><i></i>tcp</span>';\n  if (!h.status) return '<span class=\"chip crit\" title=\"' + esc(h.err || 'no response') + '\"><i></i>down</span>';\n  return '<span class=\"chip ' + (h.status < 400 ? 'good' : h.status < 500 ? 'warn' : 'crit') + '\" title=\"' + esc((h.title || '') + (h.server ? ' · ' + h.server : '')) + '\"><i></i>' + h.status + ' · ' + h.ms + ' ms</span>';\n};\nRW.devServers = s => {\n  const devs = (s.procs || []).filter(p => RW.isDev(p) && p.ports && p.ports.length).sort((a, b) => a.ports[0] - b.ports[0]);\n  if (!devs.length) return '<div class=\"empty\">No dev server listening. Run <code>npm run dev</code> and it shows up within 3 s.</div>';\n  const H = (s.dev && s.dev.health) || {};\n  return '<div class=\"tw\">' + RW.table('w-dev', [\n    { k: 'label', label: 'Process', fmt: p => '<span class=\"pn\" title=\"' + esc(p.cmd) + '\">' + esc(p.label || p.name) + '</span>' + (p.project ? '<span class=\"sub\">' + esc(p.project.name) + (p.project.branch ? ' · ' + esc(p.project.branch) : '') + '</span>' : '') },\n    { k: 'ports', label: 'Ports', nosort: true, fmt: p => p.ports.slice(0, 3).map(pt => '<a class=\"plink\" href=\"http://localhost:' + pt + '\" target=\"_blank\" rel=\"noopener noreferrer\">:' + pt + '</a> ' + RW.healthChip(H[pt])).join(' ') },\n    { k: 'cpu', label: 'CPU', num: true, fmt: p => F.pct(p.cpu, 1) },\n    { k: 'mem', label: 'Mem', num: true, fmt: p => F.b(p.mem, 0) },\n  ], devs, { row: p => 'class=\"click\" data-pid=\"' + p.pid + '\"' }) + '</div>';\n};\nRW.listenRows = (s, list, compact) => RW.table(compact ? 'w-listen' : 'listen', [\n  { k: 'port', label: 'Port', num: true, fmt: l => '<b>' + l.port + '</b>' },\n  { k: 'proto', label: 'Proto' },\n  { k: 'svc', label: 'Service', sort: l => RW.svc(l.port, RW.pidMap(s).get(l.pid)), fmt: l => '<span class=\"muted\">' + esc(RW.st && l.pid === RW.st.pid ? 'RigWatch (this page)' : RW.svc(l.port, RW.pidMap(s).get(l.pid) || { pid: l.pid })) + '</span>' },\n  { k: 'scope', label: 'Bound to', fmt: l => (l.scope === 'all' ? '<span class=\"chip warn\" title=\"All interfaces: reachable from your network if the firewall allows it\"><i></i>all interfaces</span>' : l.scope === 'local' ? '<span class=\"chip good\" title=\"Only reachable from this machine\"><i></i>local only</span>' : '<span class=\"chip\" title=\"' + esc(l.addrs.join(', ')) + '\"><i></i>' + esc(l.addrs[0]) + '</span>') },\n  { k: 'pid', label: 'Process', sort: l => RW.pname(s, l.pid), fmt: l => { const p = RW.pidMap(s).get(l.pid); return '<span class=\"pn\">' + esc(RW.pname(s, l.pid)) + '</span>' + (p ? RW.kindTag(p) : '') + '<span class=\"sub\">' + l.pid + '</span>'; } },\n  { k: 'open', label: '', nosort: true, fmt: l => (l.proto === 'TCP' && l.scope !== 'iface' ? '<a class=\"plink\" href=\"http://localhost:' + l.port + '\" target=\"_blank\" rel=\"noopener noreferrer\">open</a>' : '') + (compact || !RW.canControl() ? '' : ' <button class=\"btn sm danger\" data-killport=\"' + l.port + '\" data-proto=\"' + l.proto + '\" title=\"End the process that owns this port\">kill</button>') },\n], list, { row: l => 'class=\"click\" data-pid=\"' + l.pid + '\"', sortK: 'port', sortD: 1, max: compact ? 40 : 2000 });\n\n// ---------- widget registry ----------\nconst W = RW.widgets = {};\nconst def = (id, o) => { W[id] = Object.assign({ id }, o); };\nconst chartbox = (id, h) => '<div class=\"chartbox\" style=\"min-height:' + (h || 90) + 'px\"><canvas class=\"chart\" id=\"' + id + '\"></canvas></div>';\n\ndef('kpis', {\n  title: 'Key metrics', w: 12, h: 2, bare: true,\n  mount(b) {\n    const T = [['cpu', 'CPU', 'performance', 'cpu'], ['gpu', 'GPU', 'performance', 'gpu'], ['mem', 'Memory', 'processes', 'mem'], ['vram', 'VRAM', 'performance', 'vram'], ['fps', 'FPS', 'performance', 'fps'], ['net', 'Network', 'network', 'rx'], ['disk', 'Disk', 'performance', 'disk'], ['ping', 'Ping', 'network', 'ping']];\n    b.innerHTML = '<div class=\"kpis\">' + T.map(t => '<div class=\"kpi\" data-go=\"' + t[2] + '\"><div class=\"kl\"><span>' + t[1] + '</span><span id=\"kc-' + t[0] + '\"></span></div><div class=\"kv2\" id=\"kv-' + t[0] + '\">–</div><div class=\"ks\" id=\"ks-' + t[0] + '\">&nbsp;</div><canvas id=\"kspark-' + t[0] + '\"></canvas></div>').join('') + '</div>';\n    for (const t of T) RW.chart('kspark-' + t[0], RW.preset(t[3] === 'disk' ? 'disk' : t[3], { spark: true, points: 120, series: t[3] === 'disk' ? [{ k: 'dr', c: '--s1', l: 'Read' }] : RW.SER[t[3]].series.slice(0, 1) }));\n  },\n  update(b, s) {\n    const c = s.cpu, g = s.gpus[0], m = s.mem, n = s.net, f = s.fps, d = s.disks;\n    setH('kv-cpu', F.pct(c.util)); setH('ks-cpu', esc((c.mhz ? F.ghz(c.mhz) : '') + (c.power != null ? ' · ' + Math.round(c.power) + ' W' : '') + (c.load ? ' · load ' + c.load[0] : '') + (c.temp == null && !c.load ? ' · no temp' : ''))); setH('kc-cpu', RW.tchip(c.temp));\n    if (g) { setH('kv-gpu', F.pct(g.util)); setH('ks-gpu', esc(g.name)); setH('kc-gpu', RW.tchip(g.temp, [75, 85, 95])); setH('kv-vram', RW.vu(F.b(g.vramUsed, 1))); setH('ks-vram', esc(g.vramTotal ? 'of ' + F.b(g.vramTotal, 0) + ' · ' + F.b(Math.max(0, g.vramTotal - g.vramUsed), 1) + ' free' : 'in use')); }\n    else { setH('kv-gpu', '–'); setH('ks-gpu', 'no GPU data'); setH('kv-vram', '–'); setH('ks-vram', ''); }\n    setH('kv-mem', F.pct(100 * m.used / m.total) + '<small>' + F.b(m.used, 1) + '</small>'); setH('ks-mem', esc(F.b(m.avail, 1) + ' free of ' + F.b(m.total, 0)));\n    if (f.main) { setH('kv-fps', Math.round(f.main.fps) + '<small>fps</small>'); setH('ks-fps', esc(f.main.name + (f.main.low1 ? ' · 1% low ' + Math.round(f.main.low1) : ''))); }\n    else { setH('kv-fps', '–'); setH('ks-fps', esc(f.status === 'running' ? 'waiting for a game' : f.status === 'needs-admin' ? 'needs admin terminal' : f.status === 'unsupported' ? 'Windows only' : 'add PresentMon')); }\n    setH('kv-net', RW.vu(F.bits(n.rx), ' ↓')); setH('ks-net', esc('↑ ' + F.bits(n.tx) + ' · ' + F.num(n.rxp + n.txp) + ' pkt/s'));\n    const rd = d.reduce((a, x) => a + (x.read != null ? x.read : x.total || 0), 0), wr = d.reduce((a, x) => a + (x.write || 0), 0), act = d.reduce((a, x) => Math.max(a, x.active || 0), 0);\n    setH('kv-disk', RW.vu(F.rate(rd + wr))); setH('ks-disk', esc('R ' + F.rate(rd) + ' · W ' + F.rate(wr) + ' · ' + F.pct(act) + ' busy'));\n    if (n.ping) { setH('kv-ping', n.ping.ms == null ? 'timeout' : RW.vu(F.ms(n.ping.ms))); setH('ks-ping', esc('jitter ' + F.ms(n.ping.jitter) + ' · loss ' + F.pct(n.ping.loss))); } else { setH('kv-ping', 'off'); setH('ks-ping', 'PING_TARGET=off'); }\n  },\n});\ndef('cpu', {\n  title: 'CPU', w: 6, h: 4,\n  mount(b) { b.innerHTML = chartbox('wc-cpu', 110) + '<div class=\"cores\" id=\"wc-cores\"></div><div id=\"wc-cstats\"></div>'; RW.chart('wc-cpu', RW.preset('cpu')); },\n  update(b, s, hd) {\n    const c = s.cpu, inv = RW.st && RW.st.inventory;\n    setH(hd, '<span class=\"muted\" style=\"font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px\">' + esc(inv && inv.cpu ? inv.cpu.name : '') + '</span><span class=\"big\">' + F.pct(c.util) + '</span>' + RW.tchip(c.temp));\n    const n = c.cores.length || 1, el = document.getElementById('wc-cores');\n    if (el) el.style.gridTemplateColumns = 'repeat(' + (n <= 16 ? n : Math.ceil(n / Math.ceil(n / 16))) + ',minmax(0,1fr))';\n    setH('wc-cores', c.cores.map((k, i) => '<div class=\"core\" title=\"thread ' + i + ': ' + F.pct(k.u, 1) + (k.mhz ? ' @ ' + F.ghz(k.mhz) : '') + '\"><div class=\"ctrack\"><i style=\"height:' + RW.cl(k.u).toFixed(0) + '%\"></i></div><b>' + Math.round(k.u) + '</b></div>').join(''));\n    setH('wc-cstats', RW.stats([['Clock', F.ghz(c.mhz)], ['Processes', F.num(c.procs || s.procs.length)], ['Threads', F.num(c.threads)], c.load ? ['Load 1/5/15', c.load.join(' / ')] : ['Context sw/s', F.num(c.ctx)], ['Power', c.power != null ? c.power.toFixed(1) + ' W' : null], ['Run queue', c.queue != null ? String(c.queue) : null]]));\n  },\n});\ndef('gpu', {\n  title: 'GPU', w: 6, h: 4,\n  mount(b) { b.innerHTML = chartbox('wc-gpu', 100) + '<div id=\"wc-gpub\"></div>'; RW.chart('wc-gpu', RW.preset('gpu')); },\n  update(b, s, hd) {\n    const g = s.gpus[0];\n    if (!g) { setH(hd, ''); setH('wc-gpub', '<div class=\"empty\">No GPU counters on this system.</div>'); return; }\n    setH(hd, '<span class=\"muted\" style=\"font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px\">' + esc(g.name) + '</span><span class=\"big\">' + F.pct(g.util) + '</span>' + RW.tchip(g.temp, [75, 85, 95]));\n    const e = g.engines || {}, order = ['3d', 'compute', 'copy', 'video decode', 'video encode', 'video codec', 'renderer', 'tiler'];\n    const keys = order.filter(k => k in e).slice(0, 4);\n    setH('wc-gpub', '<div class=\"grid g2\" style=\"gap:0 16px;margin:6px 0 0\">' + keys.map(k => RW.brow(esc(k), F.pct(e[k], 1), e[k], '--s7')).join('') + (g.vramTotal ? RW.brow('VRAM', F.b(g.vramUsed, 1) + ' / ' + F.b(g.vramTotal, 0), 100 * g.vramUsed / g.vramTotal, '--s7') : '') + '</div>' +\n      RW.stats([['Hotspot', g.hotspot != null ? F.temp(g.hotspot) : null], ['Power', g.power != null ? Math.round(g.power) + ' W' : null], ['Core clock', g.clock ? Math.round(g.clock) + ' MHz' : null], ['Fan', g.fan != null ? Math.round(g.fan) + ' RPM' : g.fanPct != null ? F.pct(g.fanPct) : null], ['Shared', g.sharedTotal ? F.b(g.sharedUsed, 1) : null]]));\n  },\n});\ndef('memory', {\n  title: 'Memory', w: 4, h: 3,\n  mount(b) { b.innerHTML = '<div id=\"wc-memstack\"></div>' + chartbox('wc-mem', 70) + '<div id=\"wc-mems\"></div>'; RW.chart('wc-mem', RW.preset('mem')); },\n  update(b, s, hd) {\n    const m = s.mem;\n    setH(hd, '<span class=\"big\">' + F.b(m.used, 1) + '</span><span class=\"muted\">/ ' + F.b(m.total, 0) + '</span>');\n    const cols = ['--s3', '--s2', '--s1', '--s4', null];\n    setH('wc-memstack', m.breakdown ? '<div class=\"stack\">' + m.breakdown.map((x, i) => '<i title=\"' + esc(x[0] + ': ' + F.b(x[1], 1)) + '\" style=\"width:' + (100 * x[1] / m.total).toFixed(2) + '%;background:' + (i === m.breakdown.length - 1 ? 'transparent' : 'var(' + cols[i] + ')') + '\"></i>').join('') + '</div><div class=\"legend\" style=\"margin:6px 0 0\">' + m.breakdown.map((x, i) => '<span><i style=\"background:' + (i === m.breakdown.length - 1 ? 'var(--panel3)' : 'var(' + cols[i] + ')') + '\"></i>' + esc(x[0]) + ' <b>' + F.b(x[1], 1) + '</b></span>').join('') + '</div>' : RW.bar(100 * m.used / m.total, '--s3'));\n    setH('wc-mems', RW.stats([['Committed', m.committed ? F.b(m.committed, 1) + ' / ' + F.b(m.commitLimit, 0) : null], ['Swap', m.swapTotal ? F.b(m.swapUsed, 1) + ' / ' + F.b(m.swapTotal, 0) : null], ['Hard faults/s', m.hardFaults != null ? F.num(m.hardFaults) : null]]));\n  },\n});\ndef('network', {\n  title: 'Network', w: 4, h: 3,\n  mount(b) { b.innerHTML = chartbox('wc-net', 80) + '<div id=\"wc-nets\"></div>'; RW.chart('wc-net', RW.preset('net')); },\n  update(b, s, hd) {\n    const n = s.net, a = n.ifaces.filter(i => !i.virtual && i.up)[0] || n.ifaces[0];\n    setH(hd, '<span class=\"muted\" style=\"font-size:12px\">' + esc(a ? a.name + (a.ipv4[0] ? ' · ' + a.ipv4[0] : '') + (a.speed ? ' · ' + F.link(a.speed) : '') : '') + '</span>');\n    setH('wc-nets', RW.stats([['Packets in', F.num(n.rxp) + '/s'], ['Packets out', F.num(n.txp) + '/s'], ['TCP est.', n.tcp ? F.num(n.tcp.est) : null], ['Retransmits', n.tcp ? F.pct(n.tcp.retransPct, 2) : null], ['Session ↓', F.b(n.session.rx, 1)], ['Session ↑', F.b(n.session.tx, 1)]]));\n  },\n});\ndef('disk', {\n  title: 'Disk', w: 4, h: 3,\n  mount(b) { b.innerHTML = chartbox('wc-disk', 70) + '<div id=\"wc-disks\"></div>'; RW.chart('wc-disk', RW.preset('disk')); },\n  update(b, s) {\n    setH('wc-disks', s.disks.map(d => RW.brow(esc(d.name) + ' <span class=\"muted\">' + esc(d.letters || '') + '</span>' + (d.temp ? ' ' + RW.tchip(d.temp, [55, 65, 75]) : ''), d.active != null ? F.pct(d.active) + ' busy' + (d.latMs ? ' · ' + F.ms(d.latMs) : '') : F.rate(d.total), d.active || 0, '--s1')).join('') || '<div class=\"empty\">no disk counters</div>');\n  },\n});\ndef('storage', {\n  title: 'Storage', w: 6, h: 3,\n  update(b, s) { setH(b, (s.fs || []).map(v => { const used = v.size - v.free; return RW.brow(esc(v.mount) + (v.label && v.label !== v.mount ? ' <span class=\"muted\">' + esc(v.label) + '</span>' : '') + ' <span class=\"faint\">' + esc(v.fs) + '</span>', F.b(v.free, 1) + ' free of ' + F.b(v.size, 0), 100 * used / v.size, used / v.size > 0.9 ? '--s8' : '--s3'); }).join('') || '<div class=\"empty\">no volumes</div>'); },\n});\ndef('topapps', {\n  title: 'Most consuming apps', w: 8, h: 4,\n  update(b, s, hd) {\n    setH(hd, '<span class=\"muted\" style=\"font-size:12px\">grouped by app</span>');\n    const apps = RW.groupApps(s.procs);\n    setH(b, '<div class=\"grid g4\" style=\"margin:0;gap:18px\">' + [['CPU', 'cpu', v => F.pct(v, 1), '--s1'], ['Memory', 'mem', v => F.b(v, 1), '--s3'], ['GPU', 'gpu', v => F.pct(v, 1), '--s7'], ['I/O', 'io', F.rate, '--s2']].map(c => '<div><h3 style=\"margin:0 0 4px\" class=\"muted\">' + c[0] + '</h3>' + RW.topList(apps, c[1], c[2], c[3], 6) + '</div>').join('') + '</div>');\n  },\n});\ndef('security', {\n  title: 'Security', w: 4, h: 4,\n  update(b, s, hd) {\n    const sec = s.security, c = sec.counts;\n    setH(hd, '<a data-go=\"security\" class=\"muted\" style=\"font-size:12px\">details →</a>');\n    setH(b, '<div style=\"display:grid;grid-template-columns:150px 1fr;gap:12px;align-items:center\">' + RW.gauge(sec.score, 100, RW.scoreColor(sec.score), sec.score + '/100', 'exposure score') +\n      '<div>' + ['critical', 'high', 'medium', 'low'].map(k => '<div class=\"brow\" style=\"margin:4px 0\"><span class=\"bl\">' + RW.sev(k) + '</span><span class=\"bv\">' + c[k] + '</span></div>').join('') + '</div></div>' +\n      (sec.top.filter(x => x.sev !== 'info').slice(0, 3).map(x => '<div class=\"ev ' + (x.sev === 'critical' || x.sev === 'high' ? 'alert' : 'warn') + '\" style=\"grid-template-columns:22px 1fr\"><span>' + icon('alert') + '</span><div class=\"et\">' + esc(x.title) + '</div></div>').join('') || '<div class=\"empty\" style=\"padding:10px\">No risky exposure found.</div>'));\n  },\n});\ndef('fps', {\n  title: 'FPS', w: 4, h: 3,\n  mount(b) { b.innerHTML = '<div id=\"wc-fpsn\"></div>' + chartbox('wc-ft', 70); RW.chart('wc-ft', { series: [{ k: 'ft', c: '--s6', l: 'Frame time' }], fmt: F.ms, min: 20, src: () => { const m = RW.snap && RW.snap.fps.main; const a = m ? m.frametimes : []; return { n: Math.max(a.length, 2), s: [a], label: i => 'frame ' + (i + 1) + ' of ' + a.length }; } }); },\n  update(b, s, hd) {\n    const f = s.fps;\n    const box = b.querySelector('.chartbox'); if (box) box.style.display = f.main ? '' : 'none';\n    if (f.main) { setH(hd, '<span class=\"muted\" style=\"font-size:12px\">' + esc(f.main.name) + '</span>'); setH('wc-fpsn', '<div style=\"display:flex;gap:16px;align-items:baseline;flex-wrap:wrap\"><span class=\"huge\">' + Math.round(f.main.fps) + '</span><span class=\"muted\">fps</span><span>1% <b class=\"num\">' + (f.main.low1 ? Math.round(f.main.low1) : '–') + '</b></span><span>0.1% <b class=\"num\">' + (f.main.low01 ? Math.round(f.main.low01) : '–') + '</b></span><span class=\"muted\">' + F.ms(f.main.ft) + '</span></div>'); return; }\n    setH(hd, '');\n    const pm = s.status.tools && s.status.tools.presentmon;\n    setH('wc-fpsn', f.status === 'unsupported' ? '<div class=\"empty\">FPS capture is Windows-only.</div>' : f.status === 'running' || f.status === 'starting' ? '<div class=\"empty\">Ready. Start a game and its FPS shows up here.</div>' : f.status === 'needs-admin' ? '<div class=\"empty\">Frame capture needs admin rights.<div style=\"margin-top:8px\">' + RW.fixButtons('admin') + '</div></div>' : pm && pm.state === 'downloading' ? '<div class=\"empty\">Downloading PresentMon (one time)…</div>' : '<div class=\"empty\">' + esc(f.msg || 'Frame capture unavailable') + '</div>');\n  },\n});\ndef('temps', {\n  title: 'Temperatures', w: 4, h: 3,\n  update(b, s, hd) {\n    setH(hd, '<span class=\"muted\" style=\"font-size:12px\">' + esc(s.sensors.source || '') + '</span>');\n    const win = RW.st && RW.st.platform === 'win32';\n    if (!s.temps.length) { setH(b, '<div class=\"empty\">' + (win ? 'Starting sensors…' : RW.st && RW.st.platform === 'darwin' ? 'macOS hides CPU/GPU temps without sudo.' : 'No hwmon sensors: install lm-sensors.') + '</div>'); return; }\n    const fix = win && s.cpu.temp == null ? RW.fixButtons('cpu') : '';\n    setH(b, (fix ? '<div class=\"brow\"><span class=\"bl muted\">CPU temperature</span><span class=\"bv\">' + fix + '</span></div>' : '') + s.temps.slice(0, 10).map(t => { const lim = t.src === 'disk' ? [55, 65, 75] : t.hot ? [85, 95, 105] : [70, 80, 90]; const st = RW.tstat(t.value, lim); return RW.brow(esc(t.label), RW.tchip(t.value, lim), t.value, st && st[0] === 'good' ? '--s3' : st && st[0] === 'warn' ? '--s4' : '--s8'); }).join(''));\n  },\n});\ndef('latency', {\n  title: 'Latency', w: 4, h: 3,\n  mount(b) { b.innerHTML = chartbox('wc-ping', 80) + '<div id=\"wc-pings\"></div>'; RW.chart('wc-ping', RW.preset('ping')); },\n  update(b, s, hd) {\n    const p = s.net.ping;\n    setH(hd, '<span class=\"muted\" style=\"font-size:12px\">' + esc(p ? 'TCP → ' + p.target : 'off') + '</span>');\n    setH('wc-pings', p ? RW.stats([['Now', F.ms(p.ms)], ['Avg', F.ms(p.avg)], ['Jitter', F.ms(p.jitter)], ['Loss', F.pct(p.loss)]]) : '');\n  },\n});\ndef('devservers', { title: 'Dev servers', w: 6, h: 3, update(b, s, hd) { setH(hd, '<a data-go=\"dev\" class=\"muted\" style=\"font-size:12px\">dev tab →</a>'); setH(b, RW.devServers(s)); } });\ndef('ports', {\n  title: 'Open ports', w: 6, h: 3,\n  update(b, s, hd) {\n    const P = s.ports, pm = RW.pidMap(s);\n    const list = P.listen.filter(l => { const p = pm.get(l.pid); return l.proto === 'TCP' && l.pid > 4 && (!p || p.kind !== 'system'); });\n    setH(hd, '<span class=\"muted\" style=\"font-size:12px\">' + P.listen.length + ' listening · ' + P.listen.filter(l => l.scope === 'all').length + ' exposed</span>');\n    setH(b, '<div class=\"tw\">' + RW.listenRows(s, list, true) + '</div>');\n  },\n});\ndef('timeline', {\n  title: 'Live timeline', w: 6, h: 4,\n  update(b, s, hd) {\n    setH(hd, '<a data-go=\"timeline\" class=\"muted\" style=\"font-size:12px\">all events →</a>');\n    const ev = RW.events.filter(e => e.type !== 'proc.exit').slice(-40).reverse();\n    setH(b, ev.length ? ev.map(RW.evRow).join('') : '<div class=\"empty\">Events show up here: processes, ports, new hosts, alerts.</div>');\n  },\n});\ndef('heatmap', {\n  title: 'Per-thread load (last 2 min)', w: 6, h: 4,\n  mount(b) { b.innerHTML = '<div class=\"chartbox\"><canvas class=\"chart\" id=\"wc-heat\"></canvas></div><div class=\"muted\" style=\"font-size:11px;margin-top:4px\">each row is a hardware thread · darker = busier</div>'; RW.heat(document.getElementById('wc-heat')); },\n  update() {},\n});\ndef('docker', {\n  title: 'Containers', w: 6, h: 3,\n  update(b, s, hd) {\n    const d = s.docker;\n    setH(hd, d.available && d.info ? '<span class=\"muted\" style=\"font-size:12px\">Docker ' + esc(d.info.version) + ' · ' + d.containers.filter(c => c.state === 'running').length + '/' + d.containers.length + ' running</span>' : '');\n    if (!d.available) { setH(b, '<div class=\"empty\">Docker / Podman not running.</div>'); return; }\n    setH(b, '<div class=\"tw\">' + RW.table('w-docker', [\n      { k: 'name', label: 'Container', fmt: c => '<span class=\"pn\">' + esc(c.name) + '</span><span class=\"sub\">' + esc(c.image) + '</span>' },\n      { k: 'state', label: 'State', fmt: c => '<span class=\"chip ' + (c.state === 'running' ? 'good' : c.state === 'paused' ? 'warn' : '') + '\"><i></i>' + esc(c.state) + '</span>' },\n      { k: 'cpu', label: 'CPU', num: true, fmt: c => (c.state === 'running' ? F.pct(c.cpu, 1) : '') },\n      { k: 'mem', label: 'Mem', num: true, fmt: c => (c.state === 'running' ? F.b(c.mem, 0) : '') },\n      { k: 'ports', label: 'Ports', nosort: true, fmt: c => RW.portLinks([...new Set(c.ports.filter(p => p.pub).map(p => p.pub))], 3) },\n    ], d.containers, { sortK: 'state', sortD: -1 }) + '</div>');\n  },\n});\ndef('connections', {\n  title: 'Who is talking to the network', w: 6, h: 3,\n  update(b, s) {\n    const by = new Map();\n    for (const c of s.ports.conns) { if (/^(127\\.|::1$)/.test(c.rh)) continue; const n = RW.pname(s, c.pid); const e = by.get(n) || { name: n, n: 0, hosts: new Set() }; e.n++; e.hosts.add(c.rh); by.set(n, e); }\n    const a = [...by.values()].sort((x, y) => y.n - x.n).slice(0, 8); const mx = a[0] ? a[0].n : 1;\n    setH(b, a.map(e => RW.brow(esc(e.name) + ' <span class=\"muted\">' + e.hosts.size + ' hosts</span>', e.n + ' conns', 100 * e.n / mx, '--s1', 'data-go=\"network\"')).join('') || '<div class=\"empty\">no remote connections</div>');\n  },\n});\ndef('alerts', {\n  title: 'Alerts', w: 4, h: 2,\n  update(b, s, hd) {\n    setH(hd, '<a data-go=\"alerts\" class=\"muted\" style=\"font-size:12px\">rules →</a>');\n    setH(b, s.alerts.firing.length ? s.alerts.firing.map(a => '<div class=\"brow\"><span class=\"bl\"><span class=\"chip crit\"><i></i>firing</span> ' + esc(a.name) + '</span><span class=\"bv\">' + esc(a.value) + '</span></div>').join('') : '<div class=\"empty\" style=\"padding:10px\">All quiet. No alert is firing.</div>');\n  },\n});\ndef('battery', { title: 'Battery', w: 3, h: 2, update(b, s) { setH(b, (s.battery || []).map(x => RW.brow(esc(x.name), x.pct + '%' + (x.charging ? ' · charging' : x.plugged ? ' · plugged in' : '') + (x.minutes ? ' · ' + F.age(x.minutes * 60) + ' left' : ''), x.pct, x.pct < 20 ? '--s8' : '--s3')).join('') || '<div class=\"empty\">No battery.</div>'); } });\ndef('sysinfo', {\n  title: 'This machine', w: 4, h: 3,\n  update(b, s) {\n    const inv = (RW.st && RW.st.inventory) || {};\n    setH(b, RW.kv([['Host', esc(RW.st ? RW.st.hostname : '')], ['OS', esc(inv.os ? inv.os.caption + (inv.os.display ? ' ' + inv.os.display : '') : '')], ['CPU', esc(inv.cpu ? inv.cpu.name : '')], ['GPU', esc((inv.gpus || []).map(g => g.name).join(', '))], ['Memory', F.b(s.mem.total, 0)], ['Uptime', F.age(s.uptime)], ['Elevated', inv.isAdmin ? 'yes' : 'no']]));\n  },\n});\n\n// ---------- grid ----------\nconst DEFAULT = [['kpis', 12, 2], ['cpu', 6, 4], ['gpu', 6, 4], ['memory', 4, 3], ['network', 4, 3], ['disk', 4, 3], ['topapps', 8, 4], ['security', 4, 4], ['fps', 4, 3], ['temps', 4, 3], ['latency', 4, 3], ['devservers', 6, 3], ['ports', 6, 3], ['timeline', 6, 4], ['heatmap', 6, 4], ['docker', 6, 3], ['connections', 6, 3]].map(([id, w, h]) => ({ id, w, h }));\nconst WIDTHS = [3, 4, 6, 8, 12];\nlet layout = RW.load('rw.layout', null);\nif (!Array.isArray(layout) || !layout.length) layout = DEFAULT.map(x => Object.assign({}, x));\nlayout = layout.filter(x => W[x.id]);\nconst saveLayout = () => RW.store('rw.layout', layout);\nlet editing = false, dragId = null;\n\nfunction buildDash(root) {\n  root.innerHTML = '<div class=\"dash' + (editing ? ' editing' : '') + '\" id=\"dash\">' + layout.map(L => {\n    const d = W[L.id];\n    return '<section class=\"w' + (d.bare ? ' bare' : '') + (L.id === 'kpis' ? ' kpiw' : '') + '\" data-wid=\"' + L.id + '\" style=\"grid-column:span ' + L.w + ';grid-row:span ' + L.h + '\"' + (editing ? ' draggable=\"true\"' : '') + '>' +\n      '<div class=\"wtools\"><button data-wt=\"w-\" title=\"Narrower\">' + icon('minus') + '</button><button data-wt=\"w+\" title=\"Wider\">' + icon('plus') + '</button><button data-wt=\"h-\" title=\"Shorter\">↕</button><button data-wt=\"h+\" title=\"Taller\">⇳</button><button data-wt=\"rm\" title=\"Remove\">' + icon('x') + '</button></div>' +\n      (d.bare ? '' : '<header><h2>' + esc(d.title) + '</h2><div class=\"right\" id=\"wh-' + L.id + '\"></div></header>') + '<div class=\"wb\" id=\"wb-' + L.id + '\"></div></section>';\n  }).join('') + '</div>';\n  for (const L of layout) { const d = W[L.id]; if (d.mount) d.mount(document.getElementById('wb-' + L.id)); }\n  const dash = document.getElementById('dash');\n  dash.addEventListener('dragstart', e => { const w = e.target.closest('.w'); if (!w || !editing) return; dragId = w.dataset.wid; w.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });\n  dash.addEventListener('dragend', e => { const w = e.target.closest('.w'); if (w) w.classList.remove('dragging'); RW.$$('.w.over', dash).forEach(x => x.classList.remove('over')); });\n  dash.addEventListener('dragover', e => { if (!editing || !dragId) return; e.preventDefault(); const w = e.target.closest('.w'); RW.$$('.w.over', dash).forEach(x => x !== w && x.classList.remove('over')); if (w && w.dataset.wid !== dragId) w.classList.add('over'); });\n  dash.addEventListener('drop', e => {\n    e.preventDefault(); const w = e.target.closest('.w'); if (!w || !dragId || w.dataset.wid === dragId) return;\n    const from = layout.findIndex(x => x.id === dragId), to = layout.findIndex(x => x.id === w.dataset.wid);\n    const [it] = layout.splice(from, 1); layout.splice(to, 0, it); dragId = null; saveLayout(); buildDash(root); if (RW.snap) updateDash(RW.snap);\n  });\n  dash.addEventListener('click', e => {\n    const b = e.target.closest('[data-wt]'); if (!b) return;\n    const id = b.closest('.w').dataset.wid, L = layout.find(x => x.id === id), t = b.dataset.wt;\n    if (t === 'rm') layout = layout.filter(x => x.id !== id);\n    else if (t === 'w+' || t === 'w-') { const i = WIDTHS.indexOf(L.w); L.w = WIDTHS[Math.max(0, Math.min(WIDTHS.length - 1, (i < 0 ? 2 : i) + (t === 'w+' ? 1 : -1)))]; }\n    else if (t === 'h+') L.h = Math.min(8, L.h + 1); else if (t === 'h-') L.h = Math.max(1, L.h - 1);\n    saveLayout(); buildDash(root); if (RW.snap) updateDash(RW.snap);\n  });\n}\nfunction updateDash(s) {\n  for (const L of layout) {\n    const d = W[L.id], b = document.getElementById('wb-' + L.id);\n    if (!b) continue;\n    try { d.update(b, s, document.getElementById('wh-' + L.id)); } catch (e) { console.error(L.id, e); }\n  }\n}\nRW.pages.dashboard = {\n  title: 'Dashboard', sub: 'everything at a glance',\n  topExtra: () => (editing ? '<button class=\"btn sm\" data-cmd=\"addwidget\">' + icon('plus') + 'Add widget</button><button class=\"btn sm\" data-cmd=\"resetlayout\">Reset</button><button class=\"btn sm primary\" data-cmd=\"editdash\">Done</button>' : '<button class=\"btn sm ghost\" data-cmd=\"editdash\" title=\"Rearrange, resize, add or remove widgets (E)\">' + icon('edit') + 'Customize</button>'),\n  mount(root) { buildDash(root); },\n  update(s) { updateDash(s); },\n};\nRW.dashCmd = cmd => {\n  const root = document.getElementById('page');\n  if (cmd === 'editdash') { editing = !editing; buildDash(root); if (RW.snap) updateDash(RW.snap); RW.renderTopActions(); }\n  if (cmd === 'resetlayout') { layout = DEFAULT.map(x => Object.assign({}, x)); saveLayout(); buildDash(root); if (RW.snap) updateDash(RW.snap); }\n  if (cmd === 'addwidget') {\n    const avail = Object.values(W).filter(d => !layout.some(x => x.id === d.id));\n    if (!avail.length) return RW.toast('Every widget is already on the dashboard.');\n    const m = RW.modal({ title: 'Add widget', body: '<div class=\"pl\">' + avail.map(d => '<div class=\"pi\" data-add=\"' + d.id + '\">' + icon('plus') + '<span>' + esc(d.title) + '</span><span class=\"ph\">' + d.w + '×' + d.h + '</span></div>').join('') + '</div>' });\n    m.el.addEventListener('click', e => { const it = e.target.closest('[data-add]'); if (!it) return; const d = W[it.dataset.add]; layout.push({ id: d.id, w: d.w, h: d.h }); saveLayout(); m.close(); buildDash(root); if (RW.snap) updateDash(RW.snap); });\n  }\n};\n})();\n","public/overlay.html":"<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<title>RigWatch overlay</title>\n<link rel=\"icon\" href=\"/favicon.svg\" type=\"image/svg+xml\">\n<style>\n  html, body { margin: 0; background: transparent; color: #f0efec; font: 600 15px/1.3 system-ui, -apple-system, \"Segoe UI\", sans-serif; }\n  body.dark { background: #0a0b0d; }\n  #o { display: inline-flex; gap: 4px 14px; padding: 8px 12px; border-radius: 12px; background: rgba(10, 11, 13, .62); flex-wrap: wrap; transform-origin: top left; }\n  body.col #o { flex-direction: column; }\n  body.clear #o { background: transparent; text-shadow: 0 1px 3px #000, 0 0 2px #000; }\n  .i { display: inline-flex; gap: 6px; align-items: baseline; white-space: nowrap; font-variant-numeric: tabular-nums; }\n  .i b { color: #8db4ef; font-size: 11px; letter-spacing: .6px; font-weight: 700; }\n  .i small { color: #b9b7ae; font-weight: 500; font-size: 12px; }\n  .hot { color: #ff9b7a; } .crit { color: #ff6b6b; }\n  #help { position: fixed; bottom: 8px; left: 8px; font: 12px/1.5 system-ui; color: #b9b7ae; background: rgba(0,0,0,.6); padding: 8px 10px; border-radius: 8px; max-width: 560px; }\n</style>\n</head>\n<body>\n<div id=\"o\">connecting&hellip;</div>\n<div id=\"help\" hidden>Overlay options: <code>?items=fps,cpu,gpu,ram,vram,temp,net,ping,disk</code> &middot; <code>&amp;bg=clear|dark|glass</code> &middot; <code>&amp;layout=row|col</code> &middot; <code>&amp;scale=1.5</code>. Add this URL as an OBS Browser Source.</div>\n<script src=\"/assets/js/overlay.js\"></script>\n</body>\n</html>\n","lib/platform/ps/control.ps1":"# RigWatch control worker: reads one JSON command per line on stdin, answers \"R<TAB>{json}\".\n# Started lazily on first use by lib/platform/win.js. Everything here is on-demand.\n$ErrorActionPreference = 'Stop'\n[Console]::OutputEncoding = New-Object Text.UTF8Encoding($false)\n$TAB = [string][char]9\n$NL = [string][char]10\n$out = [Console]::Out\n\n$ctlSrc = @'\nusing System;\nusing System.Runtime.InteropServices;\npublic static class RigCtl {\n  [DllImport(\"ntdll.dll\")] static extern int NtSuspendProcess(IntPtr h);\n  [DllImport(\"ntdll.dll\")] static extern int NtResumeProcess(IntPtr h);\n  [DllImport(\"kernel32.dll\", SetLastError = true)] static extern IntPtr OpenProcess(uint access, bool inherit, int pid);\n  [DllImport(\"kernel32.dll\")] static extern bool CloseHandle(IntPtr h);\n  public static string SuspendResume(int pid, bool resume) {\n    IntPtr h = OpenProcess(0x0800, false, pid);\n    if (h == IntPtr.Zero) return \"OpenProcess failed (Win32 error \" + Marshal.GetLastWin32Error() + \"): access denied or process gone. Try an elevated terminal.\";\n    int r = resume ? NtResumeProcess(h) : NtSuspendProcess(h);\n    CloseHandle(h);\n    return r == 0 ? \"\" : (\"NTSTATUS 0x\" + r.ToString(\"X8\"));\n  }\n}\n'@\ntry { if (-not ('RigCtl' -as [type])) { Add-Type -TypeDefinition $ctlSrc -Language CSharp } } catch {}\n\nfunction Clean($s) { if ($null -eq $s) { return '' }; return ([string]$s -replace '[\\t\\r\\n]+', ' ').Trim() }\nfunction Reply($id, [bool]$ok, $data, $err) {\n  $o = @{ id = $id; ok = $ok; data = $data; error = $err }\n  $j = ConvertTo-Json -InputObject $o -Compress -Depth 7\n  try { $out.Write('R' + $TAB + $j + $NL); $out.Flush() } catch { exit 0 }\n}\n\nfunction Op-NetInfo {\n  $r = @{}\n  $r.arp = @(Get-NetNeighbor -ErrorAction SilentlyContinue | Where-Object { [string]$_.State -ne 'Unreachable' -and $_.LinkLayerAddress -and $_.LinkLayerAddress -notmatch '^(00-){5}00$|^(FF-){5}FF$' } | ForEach-Object { @{ ip = [string]$_.IPAddress; mac = [string]$_.LinkLayerAddress; state = [string]$_.State; iface = [string]$_.InterfaceAlias } })\n  $r.routes = @(Get-NetRoute -ErrorAction SilentlyContinue | ForEach-Object { @{ dest = [string]$_.DestinationPrefix; gw = [string]$_.NextHop; iface = [string]$_.InterfaceAlias; metric = ([int]$_.RouteMetric + [int]$_.InterfaceMetric); family = [string]$_.AddressFamily } })\n  $r.dns = @(Get-DnsClientServerAddress -ErrorAction SilentlyContinue | Where-Object { $_.ServerAddresses } | ForEach-Object { @{ iface = [string]$_.InterfaceAlias; family = [string]$_.AddressFamily; servers = @($_.ServerAddresses) } })\n  $r.profiles = @(Get-NetConnectionProfile -ErrorAction SilentlyContinue | ForEach-Object { @{ name = [string]$_.Name; iface = [string]$_.InterfaceAlias; category = [string]$_.NetworkCategory; ipv4 = [string]$_.IPv4Connectivity; ipv6 = [string]$_.IPv6Connectivity } })\n  $r.firewall = @(Get-NetFirewallProfile -ErrorAction SilentlyContinue | ForEach-Object { @{ name = [string]$_.Name; enabled = [string]$_.Enabled; inbound = [string]$_.DefaultInboundAction; outbound = [string]$_.DefaultOutboundAction } })\n  try { $r.av = @(Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct -ErrorAction Stop | ForEach-Object { $s = [int]$_.productState; @{ name = [string]$_.displayName; enabled = ((($s -shr 12) -band 0xF) -eq 1); upToDate = ((($s -shr 4) -band 0xF) -eq 0) } }) } catch { $r.av = @() }\n  try { $m = Get-MpComputerStatus -ErrorAction Stop; $r.defender = @{ realtime = [bool]$m.RealTimeProtectionEnabled; antivirus = [bool]$m.AntivirusEnabled; tamper = [bool]$m.IsTamperProtected; sigAgeDays = [int]$m.AntivirusSignatureAge; quickScanAgeDays = [int]$m.QuickScanAge } } catch { $r.defender = $null }\n  $wifi = @(); $cur = $null\n  try {\n    foreach ($line in @(netsh.exe wlan show interfaces 2>$null)) {\n      if ($line -match '^\\s*([^:]+?)\\s*:\\s(.*)$') {\n        $k = $matches[1].Trim(); $v = $matches[2].Trim()\n        if ($k -eq 'Name') { if ($null -ne $cur) { $wifi += $cur }; $cur = @{} }\n        if ($null -ne $cur) { $cur[$k] = $v }\n      }\n    }\n    if ($null -ne $cur) { $wifi += $cur }\n  } catch {}\n  $r.wifi = $wifi\n  return $r\n}\n\nfunction Op-DnsCache {\n  return @(Get-DnsClientCache -ErrorAction SilentlyContinue | Select-Object -First 3000 | ForEach-Object { @{ name = [string]$_.Entry; rname = [string]$_.Name; type = [int]$_.Type; data = [string]$_.Data; ttl = [int]$_.TimeToLive; section = [int]$_.Section } })\n}\n\nfunction Op-Services {\n  return @(Get-CimInstance Win32_Service -Property Name,DisplayName,State,StartMode,ProcessId,StartName,PathName,Description | ForEach-Object {\n    $d = Clean $_.Description; if ($d.Length -gt 220) { $d = $d.Substring(0, 219) + '...' }\n    @{ name = [string]$_.Name; display = [string]$_.DisplayName; state = [string]$_.State; start = [string]$_.StartMode; pid = [int]$_.ProcessId; user = [string]$_.StartName; path = Clean $_.PathName; desc = $d }\n  })\n}\n\nfunction Op-Service([string]$name, [string]$action) {\n  $svc = Get-Service -Name $name -ErrorAction Stop\n  switch ($action) {\n    'start' { Start-Service -InputObject $svc -ErrorAction Stop }\n    'stop' { Stop-Service -InputObject $svc -Force -ErrorAction Stop }\n    'restart' { Restart-Service -InputObject $svc -Force -ErrorAction Stop }\n    default { throw \"unknown service action $action\" }\n  }\n  return (Get-Service -Name $name).Status.ToString()\n}\n\nfunction Op-Startup {\n  $items = @(Get-CimInstance Win32_StartupCommand | ForEach-Object {\n    $k = Approved-Key ([string]$_.Location); $en = $true\n    if ($k) { $an = Approved-Name $_; try { $v = (Get-ItemProperty -Path $k -Name $an -ErrorAction Stop).$an; if ($v -and ($v[0] -band 1)) { $en = $false } } catch {} }\n    @{ name = [string]$_.Name; cmd = Clean $_.Command; location = [string]$_.Location; user = Clean $_.User; kind = $(if ([string]$_.Location -like '*Startup') { 'startup folder' } else { 'run key' }); enabled = $en; toggle = [bool]$k }\n  })\n  try {\n    $items += @(Get-ScheduledTask -ErrorAction Stop | Where-Object { [string]$_.State -ne 'Disabled' -and (@($_.Triggers) | Where-Object { $_ -and $_.CimClass.CimClassName -match 'Logon|Boot' }) } | ForEach-Object {\n      @{ name = [string]$_.TaskName; cmd = Clean ((@($_.Actions) | ForEach-Object { ([string]$_.Execute + ' ' + [string]$_.Arguments).Trim() }) -join '; '); location = [string]$_.TaskPath; user = [string]$_.Principal.UserId; kind = 'scheduled task' }\n    })\n  } catch {}\n  return $items\n}\n\nfunction Op-Signatures($paths) {\n  $res = @{}\n  foreach ($p in @($paths)) {\n    try {\n      $s = Get-AuthenticodeSignature -FilePath ([string]$p) -ErrorAction Stop\n      $subj = ''\n      if ($s.SignerCertificate) { $subj = [string]$s.SignerCertificate.Subject; if ($subj -match 'CN=(\"?)([^,\"]+)') { $subj = $matches[2] } }\n      $res[[string]$p] = @{ status = [string]$s.Status; signer = $subj; os = [bool]$s.IsOSBinary }\n    } catch { $res[[string]$p] = @{ status = 'Error'; signer = ''; os = $false } }\n  }\n  return $res\n}\n\nfunction Op-ProcInfo([int]$procId) {\n  $p = Get-Process -Id $procId -ErrorAction Stop\n  $r = @{ pid = $p.Id }\n  try { $r.priority = $p.PriorityClass.ToString() } catch {}\n  try { $r.affinity = [string]$p.ProcessorAffinity.ToInt64() } catch {}\n  try { $r.startMs = [long](($p.StartTime.ToUniversalTime() - (New-Object DateTime(1970,1,1,0,0,0,[DateTimeKind]::Utc))).TotalMilliseconds) } catch {}\n  try { $r.threads = $p.Threads.Count } catch {}\n  try { $r.modules = $p.Modules.Count } catch {}\n  try { $v = $p.MainModule.FileVersionInfo; $r.company = Clean $v.CompanyName; $r.description = Clean $v.FileDescription; $r.product = Clean $v.ProductName; $r.version = Clean $v.FileVersion } catch {}\n  try { $w = Get-CimInstance Win32_Process -Filter (\"ProcessId=\" + $procId); $own = Invoke-CimMethod -InputObject $w -MethodName GetOwner; if ($own.User) { $r.user = [string]$own.Domain + '\\' + [string]$own.User } } catch {}\n  return $r\n}\n\n$epoch = New-Object DateTime(1970, 1, 1, 0, 0, 0, [DateTimeKind]::Utc)\nfunction EpochMs($d) { if ($null -eq $d) { return 0 }; try { return [long](([DateTime]$d).ToUniversalTime() - $epoch).TotalMilliseconds } catch { return 0 } }\nfunction Short([string]$s, [int]$n) { $s = Clean $s; if ($s.Length -gt $n) { return $s.Substring(0, $n - 1) + '...' }; return $s }\n\nfunction Ev($e) { return @{ t = (EpochMs $e.TimeCreated); id = [int]$e.Id; level = [int]$e.Level; provider = [string]$e.ProviderName; log = [string]$e.LogName; msg = (Short $e.Message 600) } }\nfunction Op-Events([string]$log, $levels, [int]$hours, [int]$max) {\n  $f = @{ LogName = $log; StartTime = (Get-Date).AddHours(-$hours) }\n  if ($levels) { $f.Level = @($levels | ForEach-Object { [int]$_ }) }\n  try { return @(Get-WinEvent -FilterHashtable $f -MaxEvents $max -ErrorAction Stop | ForEach-Object { Ev $_ }) }\n  catch { if ($_.Exception.Message -match 'No events') { return @() }; throw }\n}\nfunction Op-SecEvents([int]$hours) {\n  $since = (Get-Date).AddHours(-$hours); $res = @(); $errs = @()\n  $qs = @(\n    @{ LogName = 'Security'; Id = @(4625, 4740, 4720, 4726, 4732, 4728, 4756, 1102, 4697, 4719, 4648); StartTime = $since },\n    @{ LogName = 'System'; Id = @(7045, 104, 6008, 41); StartTime = $since },\n    @{ LogName = 'Microsoft-Windows-Windows Defender/Operational'; Id = @(1116, 1117, 5001, 5010, 5012, 1006, 1015); StartTime = $since },\n    @{ LogName = 'Microsoft-Windows-TerminalServices-RemoteConnectionManager/Operational'; Id = @(1149); StartTime = $since },\n    @{ LogName = 'Microsoft-Windows-PowerShell/Operational'; Id = @(4104); Level = @(3); StartTime = $since }\n  )\n  foreach ($f in $qs) {\n    try {\n      $res += @(Get-WinEvent -FilterHashtable $f -MaxEvents 300 -ErrorAction Stop | ForEach-Object {\n        $o = Ev $_\n        if ($_.Id -eq 4625) { try { $o.user = [string]$_.Properties[5].Value; $o.ip = [string]$_.Properties[19].Value; $o.logonType = [int]$_.Properties[10].Value } catch {} }\n        if ($_.Id -eq 7045) { try { $o.service = [string]$_.Properties[0].Value; $o.image = [string]$_.Properties[1].Value } catch {} }\n        $o\n      })\n    } catch { if ($_.Exception.Message -notmatch 'No events') { $errs += ([string]$f.LogName + ': ' + (Short $_.Exception.Message 160)) } }\n  }\n  return @{ events = $res; errors = $errs }\n}\n$uninstRoots = @('HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall', 'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall', 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall')\nfunction Op-Apps {\n  $out = @()\n  foreach ($root in $uninstRoots) {\n    foreach ($k in @(Get-ChildItem $root -ErrorAction SilentlyContinue)) {\n      $p = Get-ItemProperty $k.PSPath -ErrorAction SilentlyContinue\n      if (-not $p.DisplayName -or $p.SystemComponent -eq 1 -or $p.ParentKeyName) { continue }\n      $out += @{ name = (Clean $p.DisplayName); version = (Clean $p.DisplayVersion); publisher = (Clean $p.Publisher); date = [string]$p.InstallDate; sizeKb = [long]$p.EstimatedSize; location = (Clean $p.InstallLocation); hasUninstall = [bool]$p.UninstallString; key = ($root + '\\' + $k.PSChildName); scope = $(if ($root -like 'HKCU*') { 'user' } else { 'machine' }); arch = $(if ($root -like '*WOW6432*') { 'x86' } else { 'x64' }) }\n    }\n  }\n  return $out\n}\nfunction Op-Uninstall([string]$key) {\n  if (-not ($uninstRoots | Where-Object { $key.StartsWith($_ + '\\') })) { throw 'not an uninstall key' }\n  $p = Get-ItemProperty $key -ErrorAction Stop\n  $u = [string]$p.UninstallString\n  if (-not $u) { throw 'this app has no uninstaller registered' }\n  $psi = New-Object Diagnostics.ProcessStartInfo('cmd.exe', '/c \"' + $u + '\"')\n  $psi.UseShellExecute = $true; $psi.WindowStyle = 'Hidden'\n  [void][Diagnostics.Process]::Start($psi)\n  return ('uninstaller for ' + [string]$p.DisplayName + ' started')\n}\nfunction Op-Tasks([bool]$all) {\n  return @(Get-ScheduledTask -ErrorAction Stop | Where-Object { $all -or $_.TaskPath -notlike '\\Microsoft\\*' } | ForEach-Object {\n    $i = $null; try { $i = Get-ScheduledTaskInfo -InputObject $_ -ErrorAction Stop } catch {}\n    @{ name = [string]$_.TaskName; path = [string]$_.TaskPath; state = [string]$_.State; author = (Clean $_.Author); desc = (Short $_.Description 200)\n       actions = (Short ((@($_.Actions) | ForEach-Object { ([string]$_.Execute + ' ' + [string]$_.Arguments).Trim() }) -join '; ') 300)\n       triggers = (Clean ((@($_.Triggers) | Where-Object { $_ } | ForEach-Object { $_.CimClass.CimClassName -replace '^MSFT_Task', '' -replace 'Trigger$', '' }) -join ', '))\n       last = $(if ($i) { EpochMs $i.LastRunTime } else { 0 }); next = $(if ($i) { EpochMs $i.NextRunTime } else { 0 }); result = $(if ($i) { [long]$i.LastTaskResult } else { $null }); user = [string]$_.Principal.UserId }\n  })\n}\nfunction Op-Task([string]$path, [string]$name, [string]$action) {\n  switch ($action) {\n    'enable' { [void](Enable-ScheduledTask -TaskPath $path -TaskName $name -ErrorAction Stop) }\n    'disable' { [void](Disable-ScheduledTask -TaskPath $path -TaskName $name -ErrorAction Stop) }\n    'run' { Start-ScheduledTask -TaskPath $path -TaskName $name -ErrorAction Stop }\n    'stop' { Stop-ScheduledTask -TaskPath $path -TaskName $name -ErrorAction Stop }\n    default { throw 'bad action' }\n  }\n  return ([string](Get-ScheduledTask -TaskPath $path -TaskName $name).State)\n}\nfunction Approved-Key([string]$location) {\n  if ($location -match '^HKU\\\\[^\\\\]+\\\\SOFTWARE\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run$' -or $location -match '^HKCU') { return 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run' }\n  if ($location -match '^HKLM\\\\SOFTWARE\\\\(WOW6432Node\\\\)?Microsoft\\\\Windows\\\\CurrentVersion\\\\Run$') { if ($matches[1]) { return 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run32' }; return 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run' }\n  if ($location -eq 'Startup') { return 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\StartupFolder' }\n  if ($location -eq 'Common Startup') { return 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\StartupFolder' }\n  return $null\n}\nfunction Approved-Name($item) { if ($item.Location -like '*Startup') { return [IO.Path]::GetFileName([string]$item.Command) }; return [string]$item.Name }\nfunction Op-StartupToggle([string]$name, [string]$location, [bool]$enable) {\n  $item = Get-CimInstance Win32_StartupCommand | Where-Object { [string]$_.Name -eq $name -and [string]$_.Location -eq $location } | Select-Object -First 1\n  if (-not $item) { throw 'startup item not found' }\n  $k = Approved-Key $location\n  if (-not $k) { throw 'this startup location cannot be toggled' }\n  if (-not (Test-Path $k)) { [void](New-Item -Path $k -Force) }\n  $b = [byte[]](0,0,0,0,0,0,0,0,0,0,0,0)\n  if ($enable) { $b[0] = 2 } else { $b[0] = 3; $ft = [BitConverter]::GetBytes([DateTime]::UtcNow.ToFileTimeUtc()); [Array]::Copy($ft, 0, $b, 4, 8) }\n  Set-ItemProperty -Path $k -Name (Approved-Name $item) -Value $b -Type Binary -ErrorAction Stop\n  return $(if ($enable) { 'enabled' } else { 'disabled' })\n}\nfunction Op-Devices {\n  return @(Get-CimInstance Win32_PnPEntity -Filter 'ConfigManagerErrorCode <> 0' -ErrorAction SilentlyContinue | ForEach-Object { @{ name = (Clean $_.Name); cls = [string]$_.PNPClass; code = [int]$_.ConfigManagerErrorCode; status = [string]$_.Status; id = [string]$_.PNPDeviceID; mfr = (Clean $_.Manufacturer) } })\n}\nfunction Op-Drivers {\n  $keep = @('DISPLAY', 'NET', 'MEDIA', 'SCSIADAPTER', 'HDC', 'BLUETOOTH', 'USB', 'AUDIOENDPOINT', 'MONITOR', 'HIDCLASS', 'DISKDRIVE', 'SYSTEM', 'CAMERA', 'IMAGE')\n  return @(Get-CimInstance Win32_PnPSignedDriver -ErrorAction SilentlyContinue | Where-Object { $_.DeviceName -and ($keep -contains [string]$_.DeviceClass) } | ForEach-Object { @{ name = (Clean $_.DeviceName); cls = [string]$_.DeviceClass; version = [string]$_.DriverVersion; date = (EpochMs $_.DriverDate); provider = (Clean $_.DriverProviderName); signer = (Clean $_.Signer); signed = [bool]$_.IsSigned; inf = [string]$_.InfName } })\n}\nfunction Op-Updates {\n  $hf = @(Get-HotFix -ErrorAction SilentlyContinue | ForEach-Object { @{ id = [string]$_.HotFixID; desc = [string]$_.Description; date = (EpochMs $_.InstalledOn); by = [string]$_.InstalledBy } })\n  $reboot = @()\n  if (Test-Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Component Based Servicing\\RebootPending') { $reboot += 'Component servicing' }\n  if (Test-Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\WindowsUpdate\\Auto Update\\RebootRequired') { $reboot += 'Windows Update' }\n  try { if ((Get-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager' -Name PendingFileRenameOperations -ErrorAction Stop).PendingFileRenameOperations) { $reboot += 'Pending file renames' } } catch {}\n  $lastBoot = 0; try { $lastBoot = EpochMs (Get-CimInstance Win32_OperatingSystem).LastBootUpTime } catch {}\n  return @{ hotfixes = $hf; reboot = $reboot; lastBoot = $lastBoot }\n}\nfunction Op-Modules([int]$procId) {\n  $p = Get-Process -Id $procId -ErrorAction Stop\n  return @($p.Modules | ForEach-Object { $v = $_.FileVersionInfo; @{ name = [string]$_.ModuleName; path = [string]$_.FileName; size = [long]$_.ModuleMemorySize; company = (Clean $v.CompanyName); version = (Clean $v.FileVersion); desc = (Clean $v.FileDescription) } })\n}\nfunction Op-FwBlock([string]$path, [string]$label, [bool]$on) {\n  if (-not (Test-Path -LiteralPath $path)) { throw 'executable not found' }\n  if ($on) {\n    $n = 'RigWatch block: ' + $label\n    [void](New-NetFirewallRule -DisplayName $n -Group 'RigWatch' -Direction Outbound -Program $path -Action Block -Profile Any -ErrorAction Stop)\n    [void](New-NetFirewallRule -DisplayName ($n + ' (inbound)') -Group 'RigWatch' -Direction Inbound -Program $path -Action Block -Profile Any -ErrorAction Stop)\n    return 'blocked'\n  }\n  $rules = @(Get-NetFirewallRule -Group 'RigWatch' -ErrorAction SilentlyContinue | Where-Object { (Get-NetFirewallApplicationFilter -AssociatedNetFirewallRule $_).Program -eq $path })\n  if (-not $rules.Count) { throw 'no RigWatch rule for this program' }\n  $rules | Remove-NetFirewallRule -ErrorAction Stop\n  return 'unblocked'\n}\nfunction Op-FwList {\n  return @(Get-NetFirewallRule -Group 'RigWatch' -ErrorAction SilentlyContinue | ForEach-Object { $f = Get-NetFirewallApplicationFilter -AssociatedNetFirewallRule $_; @{ name = [string]$_.DisplayName; program = [string]$f.Program; dir = [string]$_.Direction; enabled = [string]$_.Enabled } })\n}\nfunction Op-Env {\n  $u = [Environment]::GetEnvironmentVariables('User'); $m = [Environment]::GetEnvironmentVariables('Machine')\n  return @{ user = @($u.Keys | ForEach-Object { @{ k = [string]$_; v = [string]$u[$_] } }); machine = @($m.Keys | ForEach-Object { @{ k = [string]$_; v = [string]$m[$_] } }) }\n}\nfunction Op-Sockets {\n  $t = @(Get-NetTCPConnection -ErrorAction SilentlyContinue | ForEach-Object { [string]$_.LocalAddress + '|' + [string]$_.LocalPort + '|' + [string]$_.RemoteAddress + '|' + [string]$_.RemotePort + '|' + [string]$_.State + '|' + [string]$_.OwningProcess })\n  $u = @(Get-NetUDPEndpoint -ErrorAction SilentlyContinue | ForEach-Object { [string]$_.LocalAddress + '|' + [string]$_.LocalPort + '|' + [string]$_.OwningProcess })\n  return @{ tcp = $t; udp = $u }\n}\nfunction Op-Recycle([bool]$empty) {\n  if ($empty) { Clear-RecycleBin -Force -ErrorAction Stop; return @{ emptied = $true } }\n  $sh = New-Object -ComObject Shell.Application; $rb = $sh.Namespace(10); $n = 0; [double]$sz = 0\n  foreach ($i in $rb.Items()) { $n++; try { $sz += [double]$i.Size } catch {} }\n  return @{ items = $n; bytes = $sz }\n}\n\n# ---------------------------------------------------------------- SIEM\n# Event logs read incrementally: each query keeps its own EventRecordID bookmark (\"mark\").\n$siemQ = @(\n  @{ k = 'sec-logon'; log = 'Security'; ids = @(4624); extra = \" and *[EventData[Data[@Name='LogonType']!='5' and Data[@Name='LogonType']!='4' and Data[@Name='LogonType']!='0' and Data[@Name='TargetUserSid']!='S-1-5-18' and Data[@Name='TargetUserSid']!='S-1-5-19' and Data[@Name='TargetUserSid']!='S-1-5-20']]\" },\n  @{ k = 'sec-priv'; log = 'Security'; ids = @(4672); extra = \" and *[EventData[Data[@Name='SubjectUserSid']!='S-1-5-18' and Data[@Name='SubjectUserSid']!='S-1-5-19' and Data[@Name='SubjectUserSid']!='S-1-5-20']]\" },\n  @{ k = 'sec-logoff'; log = 'Security'; ids = @(4634); extra = \" and *[EventData[Data[@Name='LogonType']='2' or Data[@Name='LogonType']='10' or Data[@Name='LogonType']='11' or Data[@Name='LogonType']='12']]\" },\n  @{ k = 'sec'; log = 'Security'; ids = @(4625, 4647, 4648, 4720, 4722, 4724, 4725, 4726, 4728, 4732, 4756, 4740, 4719, 1102, 4697, 4698, 4778, 4779, 4800, 4801) },\n  @{ k = 'sys'; log = 'System'; ids = @(7045, 104, 1074, 6005, 41); msg = @(104) },\n  @{ k = 'def'; log = 'Microsoft-Windows-Windows Defender/Operational'; ids = @(1116, 1117, 5001, 5007, 5010, 5012); msg = @(1116, 1117, 5007) },\n  @{ k = 'fw'; log = 'Microsoft-Windows-Windows Firewall With Advanced Security/Firewall'; ids = @(2003, 2004, 2005, 2006, 2052, 2097, 2099) },\n  @{ k = 'rdp'; log = 'Microsoft-Windows-TerminalServices-RemoteConnectionManager/Operational'; ids = @(1149) },\n  @{ k = 'ssh'; log = 'OpenSSH/Operational'; ids = @(4); msg = @(4) }\n)\nfunction Op-SiemPoll($marks, [int]$backHours, [int]$max) {\n  $events = New-Object System.Collections.ArrayList; $state = @{}\n  foreach ($q in $siemQ) {\n    $last = [long]0\n    if ($marks -and $marks.PSObject.Properties[$q.k]) { $last = [long]$marks.($q.k) }\n    $ids = '(' + (($q.ids | ForEach-Object { 'EventID=' + $_ }) -join ' or ') + ')'\n    if ($last -gt 0) { $win = 'EventRecordID > ' + $last } else { $win = 'TimeCreated[timediff(@SystemTime) <= ' + ([long]$backHours * 3600000) + ']' }\n    $xp = '*[System[' + $ids + ' and ' + $win + ']]' + [string]$q.extra\n    $st = @{ ok = $true; n = 0; err = ''; mark = $last; full = $false }\n    try {\n      $list = @(Get-WinEvent -LogName $q.log -FilterXPath $xp -Oldest -MaxEvents $max -ErrorAction Stop)\n      foreach ($e in $list) {\n        $o = @{ k = $q.k; id = [int]$e.Id; rid = [long]$e.RecordId; t = (EpochMs $e.TimeCreated); p = @($e.Properties | ForEach-Object { [string]$_.Value }) }\n        if ($q.msg -and ($q.msg -contains [int]$e.Id)) { try { $o.m = (Short $e.Message 700) } catch {} }\n        [void]$events.Add($o)\n        if ($o.rid -gt $st.mark) { $st.mark = $o.rid }\n      }\n      $st.n = $list.Count; $st.full = ($list.Count -ge $max)\n    } catch {\n      $fq = [string]$_.FullyQualifiedErrorId\n      if ($fq -match 'NoMatchingEventsFound') { }\n      elseif ($_.Exception -is [System.UnauthorizedAccessException] -or $fq -match 'UnauthorizedAccess') { $st.ok = $false; $st.err = 'needs admin' }\n      elseif ($fq -match 'NoMatchingLogsFound') { $st.ok = $false; $st.err = 'not present' }\n      else { $st.ok = $false; $st.err = (Short $_.Exception.Message 200) }\n    }\n    if ($st.ok -and $st.n -eq 0) {\n      try {\n        $nw = @(Get-WinEvent -LogName $q.log -MaxEvents 1 -ErrorAction Stop)\n        if ($nw.Count) {\n          $top = [long]$nw[0].RecordId\n          if ($last -eq 0) { $st.mark = $top }                     # empty backfill window: start from now\n          elseif ($top -lt $last) { $st.mark = $top; $st.reset = $true }  # log was cleared\n        }\n      } catch {}\n    }\n    $state[$q.k] = $st\n  }\n  return @{ events = $events; state = $state }\n}\nfunction Op-FwLog([string]$mode) {\n  if ($mode -eq 'on') { Set-NetFirewallProfile -All -LogBlocked True -LogMaxSizeKilobytes 16384 -ErrorAction Stop }\n  elseif ($mode -eq 'off') { Set-NetFirewallProfile -All -LogBlocked False -ErrorAction Stop }\n  return @(Get-NetFirewallProfile -ErrorAction Stop | ForEach-Object { @{ name = [string]$_.Name; blocked = [string]$_.LogBlocked; file = [Environment]::ExpandEnvironmentVariables([string]$_.LogFileName) } })\n}\nfunction IpRuleKey([string]$ip) { return 'RigWatchIP_' + ($ip -replace '[^0-9A-Za-z]', '_') }\nfunction Op-IpBlock([string]$ip, [bool]$on, [string]$note) {\n  $k = IpRuleKey $ip\n  Remove-NetFirewallRule -Name ($k + '_in'), ($k + '_out') -ErrorAction SilentlyContinue\n  if ($on) {\n    [void](New-NetFirewallRule -Name ($k + '_in') -DisplayName ('RigWatch block ' + $ip + ' (inbound)') -Description $note -Group 'RigWatch IP' -Direction Inbound -RemoteAddress $ip -Action Block -Profile Any -ErrorAction Stop)\n    [void](New-NetFirewallRule -Name ($k + '_out') -DisplayName ('RigWatch block ' + $ip) -Description $note -Group 'RigWatch IP' -Direction Outbound -RemoteAddress $ip -Action Block -Profile Any -ErrorAction Stop)\n    return 'blocked'\n  }\n  return 'unblocked'\n}\nfunction Op-IpList {\n  return @(Get-NetFirewallRule -Group 'RigWatch IP' -ErrorAction SilentlyContinue | ForEach-Object { $a = Get-NetFirewallAddressFilter -AssociatedNetFirewallRule $_; @{ name = [string]$_.Name; dir = [string]$_.Direction; ip = (@($a.RemoteAddress) -join ','); enabled = [string]$_.Enabled; desc = [string]$_.Description } })\n}\n$wtsSrc = @'\nusing System;\nusing System.Collections.Generic;\nusing System.Runtime.InteropServices;\npublic static class RigWts {\n  [DllImport(\"wtsapi32.dll\", SetLastError = true)] static extern bool WTSEnumerateSessionsW(IntPtr server, int reserved, int version, out IntPtr info, out int count);\n  [DllImport(\"wtsapi32.dll\", SetLastError = true)] static extern bool WTSQuerySessionInformationW(IntPtr server, int sessionId, int infoClass, out IntPtr buffer, out int bytes);\n  [DllImport(\"wtsapi32.dll\")] static extern void WTSFreeMemory(IntPtr memory);\n  [DllImport(\"wtsapi32.dll\", SetLastError = true)] static extern bool WTSLogoffSession(IntPtr server, int sessionId, bool wait);\n  [DllImport(\"wtsapi32.dll\", SetLastError = true)] static extern bool WTSDisconnectSession(IntPtr server, int sessionId, bool wait);\n  [StructLayout(LayoutKind.Sequential)] struct SI { public int Id; public IntPtr Station; public int State; }\n  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)] struct INFO {\n    public int State; public int SessionId; public int InB, OutB, InF, OutF, InCB, OutCB;\n    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)] public string Station;\n    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 17)] public string Domain;\n    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 21)] public string User;\n    public long Connect, Disconnect, LastInput, Logon, Current;\n  }\n  static readonly string[] States = { \"active\", \"connected\", \"connectquery\", \"shadow\", \"disconnected\", \"idle\", \"listen\", \"reset\", \"down\", \"init\" };\n  static string Str(int id, int cls) { IntPtr b; int n; if (!WTSQuerySessionInformationW(IntPtr.Zero, id, cls, out b, out n) || b == IntPtr.Zero) return \"\"; try { return Marshal.PtrToStringUni(b) ?? \"\"; } finally { WTSFreeMemory(b); } }\n  static string Addr(int id) {\n    IntPtr b; int n; if (!WTSQuerySessionInformationW(IntPtr.Zero, id, 14, out b, out n) || b == IntPtr.Zero) return \"\";\n    try { int fam = Marshal.ReadInt32(b); byte[] a = new byte[20]; Marshal.Copy(IntPtr.Add(b, 4), a, 0, 20); if (fam == 2) return a[2] + \".\" + a[3] + \".\" + a[4] + \".\" + a[5]; return \"\"; } finally { WTSFreeMemory(b); }\n  }\n  static long Ms(long ft) { return ft > 0 ? (ft - 116444736000000000L) / 10000L : 0; }\n  public static List<Dictionary<string, object>> List() {\n    var res = new List<Dictionary<string, object>>(); IntPtr p; int c;\n    if (!WTSEnumerateSessionsW(IntPtr.Zero, 0, 1, out p, out c)) return res;\n    try {\n      int sz = Marshal.SizeOf(typeof(SI));\n      for (int i = 0; i < c; i++) {\n        SI s = (SI)Marshal.PtrToStructure(IntPtr.Add(p, i * sz), typeof(SI));\n        var d = new Dictionary<string, object>();\n        d[\"id\"] = s.Id; d[\"station\"] = Marshal.PtrToStringUni(s.Station) ?? \"\"; d[\"state\"] = s.State >= 0 && s.State < States.Length ? States[s.State] : s.State.ToString();\n        d[\"user\"] = Str(s.Id, 5); d[\"domain\"] = Str(s.Id, 7); d[\"client\"] = Str(s.Id, 10); d[\"addr\"] = Addr(s.Id);\n        IntPtr b; int n;\n        if (WTSQuerySessionInformationW(IntPtr.Zero, s.Id, 24, out b, out n) && b != IntPtr.Zero) {\n          try { INFO inf = (INFO)Marshal.PtrToStructure(b, typeof(INFO)); d[\"logon\"] = Ms(inf.Logon); d[\"connect\"] = Ms(inf.Connect); d[\"lastInput\"] = Ms(inf.LastInput); d[\"now\"] = Ms(inf.Current); } finally { WTSFreeMemory(b); }\n        }\n        res.Add(d);\n      }\n    } finally { WTSFreeMemory(p); }\n    return res;\n  }\n  public static string Logoff(int id) { return WTSLogoffSession(IntPtr.Zero, id, false) ? \"\" : (\"sign-out failed (Win32 error \" + Marshal.GetLastWin32Error() + \"): needs admin for other users\"); }\n  public static string Disconnect(int id) { return WTSDisconnectSession(IntPtr.Zero, id, false) ? \"\" : (\"disconnect failed (Win32 error \" + Marshal.GetLastWin32Error() + \")\"); }\n}\n'@\nfunction EnsureWts { if (-not ('RigWts' -as [type])) { Add-Type -TypeDefinition $wtsSrc -Language CSharp } }\nfunction Op-Sessions {\n  $res = @{ wts = @(); logons = @(); smb = @(); users = @(); errors = @(); self = [Diagnostics.Process]::GetCurrentProcess().SessionId }\n  try { EnsureWts; $res.wts = @([RigWts]::List()) } catch { $res.errors += ('sessions: ' + (Short $_.Exception.Message 160)) }\n  try {\n    $map = @{}\n    foreach ($l in @(Get-CimInstance Win32_LoggedOnUser -ErrorAction Stop)) { $map[[string]$l.Dependent.LogonId] = ([string]$l.Antecedent.Domain + '\\' + [string]$l.Antecedent.Name) }\n    $res.logons = @(Get-CimInstance Win32_LogonSession -ErrorAction Stop | Where-Object { $_.LogonType -ne 5 -and $_.LogonType -ne 0 } | ForEach-Object { @{ id = [string]$_.LogonId; type = [int]$_.LogonType; auth = [string]$_.AuthenticationPackage; start = (EpochMs $_.StartTime); user = [string]$map[[string]$_.LogonId] } })\n  } catch { $res.errors += ('logon sessions: ' + (Short $_.Exception.Message 160)) }\n  try { $res.smb = @(Get-SmbSession -ErrorAction Stop | ForEach-Object { @{ id = [string]$_.SessionId; client = [string]$_.ClientComputerName; user = [string]$_.ClientUserName; opens = [int]$_.NumOpens; secs = [long]$_.SecondsExists; idle = [long]$_.SecondsIdle; dialect = [string]$_.Dialect } }) } catch { $res.errors += ('file sharing (SMB): ' + (Short $_.Exception.Message 120)) }\n  try {\n    $adm = @{}; try { foreach ($m in @(Get-LocalGroupMember -SID 'S-1-5-32-544' -ErrorAction Stop)) { $adm[[string]$m.SID] = $true } } catch {}\n    $res.users = @(Get-LocalUser -ErrorAction Stop | ForEach-Object { @{ name = [string]$_.Name; enabled = [bool]$_.Enabled; last = (EpochMs $_.LastLogon); pwdSet = (EpochMs $_.PasswordLastSet); desc = (Clean $_.Description); admin = [bool]$adm[[string]$_.SID]; sid = [string]$_.SID; source = [string]$_.PrincipalSource } })\n  } catch { $res.errors += ('local accounts: ' + (Short $_.Exception.Message 120)) }\n  return $res\n}\nfunction Op-Session([int]$sid, [string]$action) {\n  EnsureWts\n  if ($action -eq 'logoff') { $e = [RigWts]::Logoff($sid) } else { $e = [RigWts]::Disconnect($sid) }\n  if ($e) { throw $e }\n  if ($action -eq 'logoff') { return 'signed out session ' + $sid }; return 'disconnected session ' + $sid\n}\nfunction RegVal([string]$path, [string]$name) { try { return (Get-ItemProperty -LiteralPath $path -Name $name -ErrorAction Stop).$name } catch { return $null } }\nfunction Op-ScaFacts {\n  $f = @{}\n  $f.admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)\n  try { $f.fw = @(Get-NetFirewallProfile -ErrorAction Stop | ForEach-Object { @{ name = [string]$_.Name; on = [string]$_.Enabled; inbound = [string]$_.DefaultInboundAction } }) } catch { $f.fwErr = (Short $_.Exception.Message 120) }\n  try { $m = Get-MpComputerStatus -ErrorAction Stop; $f.def = @{ rtp = [bool]$m.RealTimeProtectionEnabled; av = [bool]$m.AntivirusEnabled; sigAge = [int]$m.AntivirusSignatureAge; tamper = [bool]$m.IsTamperProtected } } catch { $f.defErr = (Short $_.Exception.Message 120) }\n  try { $f.av = @(Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct -ErrorAction Stop | ForEach-Object { @{ name = [string]$_.displayName; state = [long]$_.productState } }) } catch {}\n  $sys = 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System'\n  $f.uac = RegVal $sys 'EnableLUA'; $f.uacPrompt = RegVal $sys 'ConsentPromptBehaviorAdmin'\n  $ts = 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server'\n  $f.rdpDeny = RegVal $ts 'fDenyTSConnections'; $f.rdpNla = RegVal ($ts + '\\WinStations\\RDP-Tcp') 'UserAuthentication'\n  $lan = 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\LanmanServer\\Parameters'\n  $f.smb1 = RegVal $lan 'SMB1'; $f.smbSigning = RegVal $lan 'RequireSecuritySignature'\n  try { $sc = Get-SmbServerConfiguration -ErrorAction Stop; $f.smb1Server = [bool]$sc.EnableSMB1Protocol; $f.smbSigning = [int][bool]$sc.RequireSecuritySignature } catch {}\n  try { $f.users = @(Get-LocalUser -ErrorAction Stop | ForEach-Object { @{ sid = [string]$_.SID; name = [string]$_.Name; enabled = [bool]$_.Enabled; pwdRequired = [bool]$_.PasswordRequired } }) } catch {}\n  $f.llmnr = RegVal 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\DNSClient' 'EnableMulticast'\n  $f.autorun = RegVal 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer' 'NoDriveTypeAutoRun'\n  $f.autorunUser = RegVal 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer' 'NoDriveTypeAutoRun'\n  $f.wdigest = RegVal 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\WDigest' 'UseLogonCredential'\n  $f.lsaPpl = RegVal 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Lsa' 'RunAsPPL'\n  $f.ntlmLevel = RegVal 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Lsa' 'LmCompatibilityLevel'\n  $f.psv2 = RegVal 'HKLM:\\SOFTWARE\\Microsoft\\PowerShell\\1\\PowerShellEngine' 'PowerShellVersion'\n  $f.scriptBlockLog = RegVal 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell\\ScriptBlockLogging' 'EnableScriptBlockLogging'\n  try { $f.remoteReg = [string](Get-Service RemoteRegistry -ErrorAction Stop).StartType } catch { $f.remoteReg = '' }\n  try { $f.wuStart = [string](Get-Service wuauserv -ErrorAction Stop).StartType } catch { $f.wuStart = '' }\n  try { $h = @(Get-HotFix -ErrorAction Stop | Where-Object { $_.InstalledOn } | Sort-Object InstalledOn -Descending); if ($h.Count) { $f.lastPatch = EpochMs $h[0].InstalledOn } } catch {}\n  try { $bl = Get-CimInstance -Namespace 'root/cimv2/security/microsoftvolumeencryption' -ClassName Win32_EncryptableVolume -Filter (\"DriveLetter='\" + $env:SystemDrive + \"'\") -ErrorAction Stop; if ($bl) { $f.bitlocker = [int]$bl.ProtectionStatus } } catch {}\n  if ($f.admin) {\n    try {\n      $tmp = [IO.Path]::GetTempFileName()\n      [void](& (Join-Path $env:SystemRoot 'System32\\secedit.exe') /export /cfg $tmp /areas SECURITYPOLICY /quiet)\n      $txt = [IO.File]::ReadAllText($tmp); Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue\n      foreach ($k in 'MinimumPasswordLength', 'PasswordComplexity', 'LockoutBadCount', 'MaximumPasswordAge') { if ($txt -match ('(?m)^' + $k + '\\s*=\\s*(-?\\d+)')) { $f['sec_' + $k] = [int]$Matches[1] } }\n    } catch {}\n  }\n  return $f\n}\nfunction Op-RunKeys {\n  $out = New-Object System.Collections.ArrayList\n  $skip = @('PSPath', 'PSParentPath', 'PSChildName', 'PSDrive', 'PSProvider')\n  $keys = @('HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run', 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunOnce', 'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run', 'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\RunOnce', 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run', 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunOnce', 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer\\Run', 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer\\Run')\n  foreach ($k in $keys) {\n    $p = $null; try { $p = Get-ItemProperty -LiteralPath $k -ErrorAction Stop } catch { continue }\n    foreach ($n in $p.PSObject.Properties) { if ($skip -contains $n.Name) { continue }; [void]$out.Add(@{ key = ($k -replace ':', ''); name = [string]$n.Name; value = (Clean ([string]$n.Value)) }) }\n  }\n  $wl = 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon'\n  foreach ($n in 'Shell', 'Userinit') { $v = RegVal $wl $n; if ($null -ne $v) { [void]$out.Add(@{ key = ($wl -replace ':', ''); name = $n; value = (Clean ([string]$v)) }) } }\n  $ifeo = 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options'\n  foreach ($s in @(Get-ChildItem -LiteralPath $ifeo -ErrorAction SilentlyContinue)) { $d = $s.GetValue('Debugger'); if ($d) { [void]$out.Add(@{ key = (($ifeo -replace ':', '') + '\\' + $s.PSChildName); name = 'Debugger'; value = (Clean ([string]$d)) }) } }\n  return $out\n}\n\nwhile ($true) {\n  $line = [Console]::In.ReadLine()\n  if ($null -eq $line) { break }\n  if (-not $line.Trim()) { continue }\n  $cmd = $null\n  try { $cmd = ConvertFrom-Json $line } catch { continue }\n  try {\n    switch ([string]$cmd.op) {\n      'ping' { Reply $cmd.id $true 'pong' $null }\n      'suspend' { $e = [RigCtl]::SuspendResume([int]$cmd.pid, $false); if ($e) { throw $e }; Reply $cmd.id $true 'suspended' $null }\n      'resume' { $e = [RigCtl]::SuspendResume([int]$cmd.pid, $true); if ($e) { throw $e }; Reply $cmd.id $true 'resumed' $null }\n      'priority' { $p = Get-Process -Id ([int]$cmd.pid); $p.PriorityClass = [Diagnostics.ProcessPriorityClass]([string]$cmd.level); Reply $cmd.id $true $p.PriorityClass.ToString() $null }\n      'affinity' { $p = Get-Process -Id ([int]$cmd.pid); $p.ProcessorAffinity = [IntPtr]([long]$cmd.mask); Reply $cmd.id $true ([string]$p.ProcessorAffinity.ToInt64()) $null }\n      'procinfo' { Reply $cmd.id $true (Op-ProcInfo ([int]$cmd.pid)) $null }\n      'netinfo' { Reply $cmd.id $true (Op-NetInfo) $null }\n      'dnscache' { Reply $cmd.id $true (Op-DnsCache) $null }\n      'services' { Reply $cmd.id $true (Op-Services) $null }\n      'service' { Reply $cmd.id $true (Op-Service ([string]$cmd.name) ([string]$cmd.action)) $null }\n      'startup' { Reply $cmd.id $true (Op-Startup) $null }\n      'signatures' { Reply $cmd.id $true (Op-Signatures $cmd.paths) $null }\n      'events' { Reply $cmd.id $true (Op-Events ([string]$cmd.log) $cmd.levels ([int]$cmd.hours) ([int]$cmd.max)) $null }\n      'secevents' { Reply $cmd.id $true (Op-SecEvents ([int]$cmd.hours)) $null }\n      'apps' { Reply $cmd.id $true (Op-Apps) $null }\n      'uninstall' { Reply $cmd.id $true (Op-Uninstall ([string]$cmd.key)) $null }\n      'tasks' { Reply $cmd.id $true (Op-Tasks ([bool]$cmd.all)) $null }\n      'task' { Reply $cmd.id $true (Op-Task ([string]$cmd.path) ([string]$cmd.name) ([string]$cmd.action)) $null }\n      'startuptoggle' { Reply $cmd.id $true (Op-StartupToggle ([string]$cmd.name) ([string]$cmd.location) ([bool]$cmd.enable)) $null }\n      'devices' { Reply $cmd.id $true (Op-Devices) $null }\n      'drivers' { Reply $cmd.id $true (Op-Drivers) $null }\n      'updates' { Reply $cmd.id $true (Op-Updates) $null }\n      'modules' { Reply $cmd.id $true (Op-Modules ([int]$cmd.pid)) $null }\n      'fwblock' { Reply $cmd.id $true (Op-FwBlock ([string]$cmd.path) ([string]$cmd.label) ([bool]$cmd.on)) $null }\n      'fwlist' { Reply $cmd.id $true (Op-FwList) $null }\n      'env' { Reply $cmd.id $true (Op-Env) $null }\n      'recycle' { Reply $cmd.id $true (Op-Recycle ([bool]$cmd.empty)) $null }\n      'sockets' { Reply $cmd.id $true (Op-Sockets) $null }\n      'siempoll' { Reply $cmd.id $true (Op-SiemPoll $cmd.marks ([int]$cmd.backHours) ([int]$cmd.max)) $null }\n      'fwlog' { Reply $cmd.id $true (Op-FwLog ([string]$cmd.mode)) $null }\n      'ipblock' { Reply $cmd.id $true (Op-IpBlock ([string]$cmd.ip) ([bool]$cmd.on) ([string]$cmd.note)) $null }\n      'iplist' { Reply $cmd.id $true (Op-IpList) $null }\n      'sessions' { Reply $cmd.id $true (Op-Sessions) $null }\n      'session' { Reply $cmd.id $true (Op-Session ([int]$cmd.sid) ([string]$cmd.action)) $null }\n      'smbclose' { Close-SmbSession -SessionId ([uint64]$cmd.smbId) -Force -ErrorAction Stop; Reply $cmd.id $true ('closed SMB session ' + $cmd.smbId) $null }\n      'scafacts' { Reply $cmd.id $true (Op-ScaFacts) $null }\n      'runkeys' { Reply $cmd.id $true (Op-RunKeys) $null }\n      default { Reply $cmd.id $false $null ('unknown op ' + [string]$cmd.op) }\n    }\n  } catch { Reply $cmd.id $false $null ([string]$_.Exception.Message) }\n}\n","lib/platform/ps/fast.ps1":"# RigWatch fast collector: reads whole perf-counter categories once per interval and\n# streams tab-separated lines to stdout. Started and fed by lib/platform/win.js.\n$ErrorActionPreference = 'SilentlyContinue'\n[Console]::OutputEncoding = New-Object Text.UTF8Encoding($false)\n$parentPid = [int]$env:RIG_PARENT_PID\n$interval = [int]$env:RIG_INTERVAL_MS\nif ($interval -lt 250) { $interval = 1000 }\n$TAB = [string][char]9\n$NL = [string][char]10\n$ncpu = [Environment]::ProcessorCount\n$out = [Console]::Out\n\n$cats = @{}\nforeach ($n in @('Processor Information','Process','GPU Engine','GPU Adapter Memory','GPU Process Memory','Network Interface','PhysicalDisk','Thermal Zone Information','Memory','TCPv4','TCPv6','System')) {\n  try { $c = New-Object Diagnostics.PerformanceCounterCategory($n); [void]$c.ReadCategory(); $cats[$n] = $c } catch {}\n}\n$prev = @{}\n$gpuParse = @{}\n$rxGpu = [regex]'^pid_(\\d+)_luid_(0x[0-9a-f]+_0x[0-9a-f]+)_phys_(\\d+)_eng_(\\d+)_engtype_(.*)$'\n$rxGpm = [regex]'^pid_(\\d+)_luid_(0x[0-9a-f]+_0x[0-9a-f]+)_phys_(\\d+)$'\n\nfunction Read-Cat([string]$name) {\n  $c = $cats[$name]\n  if ($null -eq $c) { return $null }\n  try { return $c.ReadCategory() } catch { return $null }\n}\nfunction RateOf($pc, $cc, [string]$inst) {\n  if ($null -eq $pc -or $null -eq $cc) { return 0.0 }\n  $a = $pc[$inst]; $b = $cc[$inst]\n  if ($null -eq $a -or $null -eq $b) { return 0.0 }\n  try { return [double][Diagnostics.CounterSample]::Calculate($a.Sample, $b.Sample) } catch { return 0.0 }\n}\nfunction RawOf($cc, [string]$inst) {\n  if ($null -eq $cc) { return 0 }\n  $b = $cc[$inst]\n  if ($null -eq $b) { return 0 }\n  return $b.RawValue\n}\nfunction R2([double]$v) { return [Math]::Round($v, 2) }\n\n$loop = 0\nwhile ($true) {\n  $sw = [Diagnostics.Stopwatch]::StartNew()\n  $loop++\n  if ($parentPid -gt 0 -and ($loop % 5) -eq 0) {\n    try { [void][Diagnostics.Process]::GetProcessById($parentPid) } catch { exit 0 }\n  }\n  $sb = New-Object Text.StringBuilder\n  $cur = @{}\n  foreach ($k in @($cats.Keys)) { $cur[$k] = Read-Cat $k }\n\n  $pi = $cur['Processor Information']; $pp = $prev['Processor Information']\n  if ($pi -and $pp) {\n    $u = $pi['% processor utility']; $up = $pp['% processor utility']\n    $f = $pi['% processor performance']; $fp = $pp['% processor performance']\n    $tm = $pi['% processor time']; $tmp = $pp['% processor time']\n    $mhz = $pi['processor frequency']\n    $dpc = $pi['% dpc time']; $dpcp = $pp['% dpc time']\n    $irq = $pi['interrupts/sec']; $irqp = $pp['interrupts/sec']\n    [void]$sb.Append('CPU' + $TAB + (R2 (RateOf $up $u '_total')) + $TAB + (R2 (RateOf $fp $f '_total')) + $TAB + (R2 (RateOf $tmp $tm '_total')) + $TAB + (RawOf $mhz '_total') + $TAB + (R2 (RateOf $dpcp $dpc '_total')) + $TAB + (R2 (RateOf $irqp $irq '_total')) + $NL)\n    foreach ($inst in $u.Keys) {\n      if ($inst -match '^(\\d+),(\\d+)$') {\n        [void]$sb.Append('CORE' + $TAB + $matches[1] + $TAB + $matches[2] + $TAB + (R2 (RateOf $up $u $inst)) + $TAB + (R2 (RateOf $fp $f $inst)) + $TAB + (R2 (RateOf $tmp $tm $inst)) + $NL)\n      }\n    }\n  }\n\n  $sy = $cur['System']; $syp = $prev['System']\n  if ($sy -and $syp) {\n    [void]$sb.Append('SYS' + $TAB + (RawOf $sy['processes'] '') + $TAB + (RawOf $sy['threads'] '') + $TAB + (R2 (RateOf $syp['context switches/sec'] $sy['context switches/sec'] '')) + $TAB + (R2 (RateOf $syp['system calls/sec'] $sy['system calls/sec'] '')) + $TAB + (RawOf $sy['processor queue length'] '') + $NL)\n  }\n\n  $me = $cur['Memory']; $mep = $prev['Memory']\n  if ($me -and $mep) {\n    $standby = [double](RawOf $me['standby cache normal priority bytes'] '') + [double](RawOf $me['standby cache reserve bytes'] '') + [double](RawOf $me['standby cache core bytes'] '')\n    [void]$sb.Append('MEM' + $TAB + (RawOf $me['available bytes'] '') + $TAB + (RawOf $me['committed bytes'] '') + $TAB + (RawOf $me['commit limit'] '') + $TAB + $standby + $TAB + (RawOf $me['modified page list bytes'] '') + $TAB + (RawOf $me['pool paged bytes'] '') + $TAB + (RawOf $me['pool nonpaged bytes'] '') + $TAB + (R2 (RateOf $mep['pages/sec'] $me['pages/sec'] '')) + $TAB + (R2 (RateOf $mep['page faults/sec'] $me['page faults/sec'] '')) + $TAB + (RawOf $me['cache bytes'] '') + $TAB + (RawOf $me['free & zero page list bytes'] '') + $NL)\n  }\n\n  $pr = $cur['Process']; $prp = $prev['Process']\n  if ($pr) {\n    $cpuC = $pr['% processor time']; $cpuP = $null; if ($prp) { $cpuP = $prp['% processor time'] }\n    $idC = $pr['id process']; $idP = $null; if ($prp) { $idP = $prp['id process'] }\n    $ioC = $pr['io data bytes/sec']; $ioP = $null; if ($prp) { $ioP = $prp['io data bytes/sec'] }\n    $irC = $pr['io read bytes/sec']; $irP = $null; if ($prp) { $irP = $prp['io read bytes/sec'] }\n    $iwC = $pr['io write bytes/sec']; $iwP = $null; if ($prp) { $iwP = $prp['io write bytes/sec'] }\n    $pws = $pr['working set - private']; $ws = $pr['working set']; $pb = $pr['private bytes']\n    $thr = $pr['thread count']; $hnd = $pr['handle count']; $ppid = $pr['creating process id']; $el = $pr['elapsed time']; $prio = $pr['priority base']\n    foreach ($inst in $idC.Keys) {\n      if ($inst -eq '_total' -or $inst -eq 'idle') { continue }\n      $procId = $idC[$inst].RawValue\n      $c = 0.0; $io = 0.0; $ir = 0.0; $iw = 0.0\n      if ($idP) {\n        $o = $idP[$inst]\n        if ($o -and $o.RawValue -eq $procId) {\n          $c = (RateOf $cpuP $cpuC $inst) / $ncpu\n          $io = RateOf $ioP $ioC $inst; $ir = RateOf $irP $irC $inst; $iw = RateOf $iwP $iwC $inst\n        }\n      }\n      $age = 0.0\n      $e = $el[$inst]; if ($e) { $es = $e.Sample; if ($es.CounterFrequency -gt 0 -and $es.RawValue -gt 0) { $age = ($es.CounterTimeStamp - $es.RawValue) / $es.CounterFrequency } }\n      $nm = $inst; $hash = $nm.IndexOf('#'); if ($hash -gt 0) { $nm = $nm.Substring(0, $hash) }\n      [void]$sb.Append('P' + $TAB + $procId + $TAB + (RawOf $ppid $inst) + $TAB + $nm + $TAB + (R2 $c) + $TAB + (RawOf $pws $inst) + $TAB + (RawOf $ws $inst) + $TAB + (RawOf $pb $inst) + $TAB + [Math]::Round($io) + $TAB + [Math]::Round($ir) + $TAB + [Math]::Round($iw) + $TAB + (RawOf $thr $inst) + $TAB + (RawOf $hnd $inst) + $TAB + [Math]::Round($age) + $TAB + (RawOf $prio $inst) + $NL)\n    }\n  }\n\n  $ge = $cur['GPU Engine']; $gep = $prev['GPU Engine']\n  if ($ge -and $gep) {\n    $uc = $ge['utilization percentage']; $upv = $gep['utilization percentage']\n    $eng = @{}; $proc = @{}\n    foreach ($inst in $uc.Keys) {\n      $p = $gpuParse[$inst]\n      if ($null -eq $p) {\n        $m = $rxGpu.Match($inst)\n        if (-not $m.Success) { continue }\n        $p = @($m.Groups[1].Value, $m.Groups[2].Value, $m.Groups[3].Value, $m.Groups[4].Value, $m.Groups[5].Value)\n        $gpuParse[$inst] = $p\n      }\n      $v = RateOf $upv $uc $inst\n      $ek = $p[1] + '|' + $p[2] + '|' + $p[3] + '|' + $p[4]\n      if ($eng.ContainsKey($ek)) { $eng[$ek] += $v } else { $eng[$ek] = $v }\n      if ($v -gt 0.01) {\n        $pk = $p[0] + '|' + $p[1]\n        $pe = $proc[$pk]\n        if ($null -eq $pe) { $proc[$pk] = @{ ($p[3] + '|' + $p[4]) = $v } }\n        else { $kk = $p[3] + '|' + $p[4]; if ($pe.ContainsKey($kk)) { $pe[$kk] += $v } else { $pe[$kk] = $v } }\n      }\n    }\n    foreach ($ek in $eng.Keys) {\n      $parts = $ek.Split('|')\n      [void]$sb.Append('GE' + $TAB + $parts[0] + $TAB + $parts[1] + $TAB + $parts[2] + $TAB + $parts[3] + $TAB + (R2 $eng[$ek]) + $NL)\n    }\n    foreach ($pk in $proc.Keys) {\n      $best = 0.0; $bestType = ''\n      foreach ($kk in $proc[$pk].Keys) { if ($proc[$pk][$kk] -gt $best) { $best = $proc[$pk][$kk]; $bestType = $kk.Split('|')[1] } }\n      $parts = $pk.Split('|')\n      [void]$sb.Append('GP' + $TAB + $parts[0] + $TAB + $parts[1] + $TAB + (R2 $best) + $TAB + $bestType + $NL)\n    }\n    if ($gpuParse.Count -gt 20000) { $gpuParse = @{} }\n  }\n\n  $gm = $cur['GPU Adapter Memory']\n  if ($gm) {\n    $d = $gm['dedicated usage']; $s = $gm['shared usage']; $tc = $gm['total committed']\n    foreach ($inst in $d.Keys) {\n      if ($inst -match '^luid_(0x[0-9a-f]+_0x[0-9a-f]+)_phys_(\\d+)$') {\n        [void]$sb.Append('GM' + $TAB + $matches[1] + $TAB + $matches[2] + $TAB + (RawOf $d $inst) + $TAB + (RawOf $s $inst) + $TAB + (RawOf $tc $inst) + $NL)\n      }\n    }\n  }\n  $gpm = $cur['GPU Process Memory']\n  if ($gpm) {\n    $d = $gpm['dedicated usage']; $s = $gpm['shared usage']\n    foreach ($inst in $d.Keys) {\n      $dv = RawOf $d $inst\n      if ($dv -lt 1048576) { continue }\n      $m = $rxGpm.Match($inst)\n      if ($m.Success) { [void]$sb.Append('GPM' + $TAB + $m.Groups[1].Value + $TAB + $m.Groups[2].Value + $TAB + $dv + $TAB + (RawOf $s $inst) + $NL) }\n    }\n  }\n\n  $ni = $cur['Network Interface']; $nip = $prev['Network Interface']\n  if ($ni -and $nip) {\n    $rb = $ni['bytes received/sec']; $tb = $ni['bytes sent/sec']; $rp = $ni['packets received/sec']; $tp = $ni['packets sent/sec']\n    $rbp = $nip['bytes received/sec']; $tbp = $nip['bytes sent/sec']; $rpp = $nip['packets received/sec']; $tpp = $nip['packets sent/sec']\n    foreach ($inst in $rb.Keys) {\n      [void]$sb.Append('NET' + $TAB + $inst + $TAB + [Math]::Round((RateOf $rbp $rb $inst)) + $TAB + [Math]::Round((RateOf $tbp $tb $inst)) + $TAB + (R2 (RateOf $rpp $rp $inst)) + $TAB + (R2 (RateOf $tpp $tp $inst)) + $TAB + (RawOf $ni['current bandwidth'] $inst) + $TAB + (RawOf $rb $inst) + $TAB + (RawOf $tb $inst) + $TAB + (RawOf $rp $inst) + $TAB + (RawOf $tp $inst) + $TAB + (RawOf $ni['packets received errors'] $inst) + $TAB + (RawOf $ni['packets received discarded'] $inst) + $TAB + (RawOf $ni['packets outbound errors'] $inst) + $TAB + (RawOf $ni['packets outbound discarded'] $inst) + $NL)\n    }\n  }\n\n  $t4 = $cur['TCPv4']; $t4p = $prev['TCPv4']; $t6 = $cur['TCPv6']; $t6p = $prev['TCPv6']\n  if ($t4 -and $t4p) {\n    $retr = (RateOf $t4p['segments retransmitted/sec'] $t4['segments retransmitted/sec'] '') + (RateOf $t6p['segments retransmitted/sec'] $t6['segments retransmitted/sec'] '')\n    $segs = (RateOf $t4p['segments sent/sec'] $t4['segments sent/sec'] '') + (RateOf $t6p['segments sent/sec'] $t6['segments sent/sec'] '')\n    [void]$sb.Append('TCP' + $TAB + (RawOf $t4['connections established'] '') + $TAB + (RawOf $t6['connections established'] '') + $TAB + (R2 $retr) + $TAB + (R2 $segs) + $TAB + ([double](RawOf $t4['connection failures'] '') + [double](RawOf $t6['connection failures'] '')) + $TAB + ([double](RawOf $t4['connections reset'] '') + [double](RawOf $t6['connections reset'] '')) + $NL)\n  }\n\n  $pd = $cur['PhysicalDisk']; $pdp = $prev['PhysicalDisk']\n  if ($pd -and $pdp) {\n    $names = @('disk read bytes/sec','disk write bytes/sec','disk reads/sec','disk writes/sec','% idle time','avg. disk sec/transfer')\n    foreach ($inst in $pd['disk read bytes/sec'].Keys) {\n      if ($inst -eq '_total') { continue }\n      $line = 'DISK' + $TAB + $inst\n      foreach ($cn in $names) { $line += $TAB + [Math]::Round((RateOf $pdp[$cn] $pd[$cn] $inst), 6) }\n      $line += $TAB + (RawOf $pd['current disk queue length'] $inst)\n      [void]$sb.Append($line + $NL)\n    }\n  }\n\n  $tz = $cur['Thermal Zone Information']\n  if ($tz) {\n    $hp = $tz['high precision temperature']; $tt = $tz['temperature']\n    foreach ($inst in $tt.Keys) {\n      $kv = [double](RawOf $hp $inst)\n      if ($kv -gt 0) { $cC = $kv / 10.0 - 273.15 } else { $cC = [double](RawOf $tt $inst) - 273.15 }\n      [void]$sb.Append('TZ' + $TAB + $inst + $TAB + (R2 $cC) + $NL)\n    }\n  }\n\n  $prev = $cur\n  [void]$sb.Append('END' + $TAB + $loop + $TAB + $sw.ElapsedMilliseconds + $NL)\n  try { $out.Write($sb.ToString()); $out.Flush() } catch { exit 0 }\n  $left = $interval - $sw.ElapsedMilliseconds\n  if ($left -gt 10) { Start-Sleep -Milliseconds $left }\n}\n","lib/platform/ps/sensors.ps1":"# RigWatch sensor worker: hosts LibreHardwareMonitorLib.dll directly (no GUI, no tray app).\n# Without admin it still reads GPU sensors (vendor APIs); with admin + the PawnIO driver it\n# also reads CPU, motherboard (Super I/O) and storage sensors.\n$ErrorActionPreference = 'SilentlyContinue'\n[Console]::OutputEncoding = New-Object Text.UTF8Encoding($false)\n$parentPid = [int]$env:RIG_PARENT_PID\n$dir = $env:RIG_LHM_DIR\n$TAB = [string][char]9\n$NL = [string][char]10\n$out = [Console]::Out\nfunction Clean($s) { if ($null -eq $s) { return '' }; return ([string]$s -replace '[\\t\\r\\n]+', ' ').Trim() }\nfunction Send([string]$kind, $obj) {\n  $json = ConvertTo-Json -InputObject $obj -Compress -Depth 5\n  try { $out.Write($kind + $TAB + $json + $NL); $out.Flush() } catch { exit 0 }\n}\n\ntry { Add-Type -Path (Join-Path $dir 'LibreHardwareMonitorLib.dll') -ErrorAction Stop }\ncatch { Send 'ERR' @{ error = (Clean $_.Exception.Message) }; exit 1 }\n\n$admin = $false\ntry { $admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator) } catch {}\n$pawn = Test-Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\PawnIO'\n\n$c = New-Object LibreHardwareMonitor.Hardware.Computer\n$c.IsCpuEnabled = $true; $c.IsGpuEnabled = $true; $c.IsMotherboardEnabled = $true; $c.IsMemoryEnabled = $true\n$c.IsControllerEnabled = $true; $c.IsStorageEnabled = $true; $c.IsBatteryEnabled = $true; $c.IsPsuEnabled = $true; $c.IsNetworkEnabled = $false\n$sw0 = [Diagnostics.Stopwatch]::StartNew()\ntry { $c.Open() } catch { Send 'ERR' @{ error = (Clean $_.Exception.Message) }; exit 1 }\nSend 'INFO' @{ admin = [bool]$admin; pawnio = [bool]$pawn; openMs = $sw0.ElapsedMilliseconds; hardware = @($c.Hardware | ForEach-Object { [string]$_.HardwareType + ': ' + (Clean $_.Name) }) }\n\n# Without the driver some CPU/board sensors exist but always read 0: hide those\n$lowLevel = @('Cpu', 'Motherboard', 'SuperIO')\n$loop = 0\nwhile ($true) {\n  $sw = [Diagnostics.Stopwatch]::StartNew()\n  $loop++\n  if ($parentPid -gt 0 -and ($loop % 3) -eq 0) {\n    try { [void][Diagnostics.Process]::GetProcessById($parentPid) } catch { try { $c.Close() } catch {}; exit 0 }\n  }\n  $hw = New-Object Collections.ArrayList\n  $se = New-Object Collections.ArrayList\n  $queue = New-Object Collections.Queue\n  foreach ($h in $c.Hardware) { $queue.Enqueue(@($h, '')) }\n  while ($queue.Count -gt 0) {\n    $item = $queue.Dequeue(); $h = $item[0]; $parent = $item[1]\n    try { $h.Update() } catch {}\n    [void]$hw.Add(@{ id = [string]$h.Identifier; name = (Clean $h.Name); type = [string]$h.HardwareType; parent = $parent })\n    foreach ($s in $h.Sensors) {\n      if ($null -eq $s.Value) { continue }\n      $v = [double]$s.Value\n      $t = [string]$s.SensorType\n      if ($v -eq 0 -and ($lowLevel -contains [string]$h.HardwareType) -and $t -ne 'Load' -and $t -ne 'Fan' -and $t -ne 'Control') { continue }\n      $mn = $null; $mx = $null\n      if ($null -ne $s.Min) { $mn = [Math]::Round([double]$s.Min, 2) }\n      if ($null -ne $s.Max) { $mx = [Math]::Round([double]$s.Max, 2) }\n      [void]$se.Add(@{ id = [string]$s.Identifier; name = (Clean $s.Name); type = $t; value = [Math]::Round($v, 3); min = $mn; max = $mx; parent = [string]$h.Identifier })\n    }\n    foreach ($sub in $h.SubHardware) { $queue.Enqueue(@($sub, [string]$h.Identifier)) }\n  }\n  Send 'LHM' @{ ns = 'embedded'; hw = $hw; sensors = $se; ms = $sw.ElapsedMilliseconds }\n  $left = 2000 - $sw.ElapsedMilliseconds\n  if ($left -gt 10) { Start-Sleep -Milliseconds $left }\n}\n","lib/platform/ps/slow.ps1":"# RigWatch slow collector: hardware inventory once, then WMI-backed data on staggered timers.\n$ErrorActionPreference = 'SilentlyContinue'\n[Console]::OutputEncoding = New-Object Text.UTF8Encoding($false)\n$parentPid = [int]$env:RIG_PARENT_PID\n$TAB = [string][char]9\n$NL = [string][char]10\n$out = [Console]::Out\n$epoch = New-Object DateTime(1970, 1, 1, 0, 0, 0, [DateTimeKind]::Utc)\n\nfunction Send([string]$kind, $obj) {\n  $json = ConvertTo-Json -InputObject $obj -Compress -Depth 6\n  try { $out.Write($kind + $TAB + $json + $NL); $out.Flush() } catch { exit 0 }\n}\nfunction Clean($s) { if ($null -eq $s) { return '' }; return ([string]$s -replace '[\\t\\r\\n]+', ' ').Trim() }\nfunction EpochMs($d) { if ($null -eq $d) { return 0 }; return [long](($d.ToUniversalTime() - $epoch).TotalMilliseconds) }\n\n$st = @{}\ntry {\n  $st.isAdmin = [bool](([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator))\n} catch { $st.isAdmin = $false }\n$c = Get-CimInstance Win32_Processor | Select-Object -First 1\nif ($c) { $st.cpu = @{ name = Clean $c.Name; cores = [int]$c.NumberOfCores; threads = [int]$c.NumberOfLogicalProcessors; maxMhz = [int]$c.MaxClockSpeed; l2Kb = [int]$c.L2CacheSize; l3Kb = [int]$c.L3CacheSize; socket = Clean $c.SocketDesignation; vendor = Clean $c.Manufacturer; virt = [bool]$c.VirtualizationFirmwareEnabled } }\n$o = Get-CimInstance Win32_OperatingSystem\nif ($o) { $st.os = @{ caption = Clean $o.Caption; version = Clean $o.Version; build = Clean $o.BuildNumber; arch = Clean $o.OSArchitecture; bootMs = (EpochMs $o.LastBootUpTime); installMs = (EpochMs $o.InstallDate) } }\ntry { $dv = Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion'; $st.os.display = Clean $dv.DisplayVersion; $st.os.ubr = [int]$dv.UBR } catch {}\n$cs = Get-CimInstance Win32_ComputerSystem\nif ($cs) { $st.system = @{ manufacturer = Clean $cs.Manufacturer; model = Clean $cs.Model; ramBytes = [double]$cs.TotalPhysicalMemory; domain = Clean $cs.Domain; partOfDomain = [bool]$cs.PartOfDomain } }\n$bb = Get-CimInstance Win32_BaseBoard | Select-Object -First 1\nif ($bb) { $st.board = @{ manufacturer = Clean $bb.Manufacturer; product = Clean $bb.Product } }\n$bi = Get-CimInstance Win32_BIOS | Select-Object -First 1\nif ($bi) { $st.bios = @{ version = Clean $bi.SMBIOSBIOSVersion; vendor = Clean $bi.Manufacturer; dateMs = (EpochMs $bi.ReleaseDate) } }\n$st.ram = @(Get-CimInstance Win32_PhysicalMemory | ForEach-Object { @{ slot = Clean $_.DeviceLocator; bytes = [double]$_.Capacity; mhz = [int]$_.ConfiguredClockSpeed; maxMhz = [int]$_.Speed; maker = Clean $_.Manufacturer; part = Clean $_.PartNumber } })\n$st.video = @(Get-CimInstance Win32_VideoController | ForEach-Object { @{ name = Clean $_.Name; driver = Clean $_.DriverVersion; driverDateMs = (EpochMs $_.DriverDate); hz = [int]$_.CurrentRefreshRate; w = [int]$_.CurrentHorizontalResolution; h = [int]$_.CurrentVerticalResolution; vendor = Clean $_.AdapterCompatibility } })\ntry { $st.secureBoot = [bool](Confirm-SecureBootUEFI -ErrorAction Stop) } catch { $st.secureBoot = $null }\n\n$dxgiSrc = @'\nusing System;\nusing System.Collections.Generic;\nusing System.Runtime.InteropServices;\npublic static class RigDxgi {\n  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]\n  public struct DESC1 {\n    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 128)] public string Description;\n    public uint VendorId; public uint DeviceId; public uint SubSysId; public uint Revision;\n    public UIntPtr DedicatedVideoMemory; public UIntPtr DedicatedSystemMemory; public UIntPtr SharedSystemMemory;\n    public uint LuidLow; public int LuidHigh; public uint Flags;\n  }\n  [ComImport, Guid(\"29038f61-3839-4626-91fd-086879011a05\"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]\n  interface IAdapter1 {\n    void SetPrivateData(); void SetPrivateDataInterface(); void GetPrivateData(); void GetParent();\n    void EnumOutputs(); void GetDesc(); void CheckInterfaceSupport();\n    [PreserveSig] int GetDesc1(out DESC1 desc);\n  }\n  [ComImport, Guid(\"770aae78-f26f-4dba-a829-253c83d1b387\"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]\n  interface IFactory1 {\n    void SetPrivateData(); void SetPrivateDataInterface(); void GetPrivateData(); void GetParent();\n    void EnumAdapters(); void MakeWindowAssociation(); void GetWindowAssociation(); void CreateSwapChain(); void CreateSoftwareAdapter();\n    [PreserveSig] int EnumAdapters1(uint index, out IAdapter1 adapter);\n  }\n  [DllImport(\"dxgi.dll\")] static extern int CreateDXGIFactory1(ref Guid riid, [MarshalAs(UnmanagedType.Interface)] out IFactory1 factory);\n  public static string[] List() {\n    var res = new List<string>();\n    Guid g = new Guid(\"770aae78-f26f-4dba-a829-253c83d1b387\");\n    IFactory1 f;\n    if (CreateDXGIFactory1(ref g, out f) != 0 || f == null) return res.ToArray();\n    for (uint i = 0; i < 16; i++) {\n      IAdapter1 a;\n      if (f.EnumAdapters1(i, out a) != 0 || a == null) break;\n      DESC1 d;\n      if (a.GetDesc1(out d) == 0) {\n        res.Add(string.Format(\"0x{0:x8}_0x{1:x8}|{2}|{3}|{4}|{5}|{6}\", d.LuidHigh, d.LuidLow, d.Description, d.VendorId, d.DedicatedVideoMemory.ToUInt64(), d.SharedSystemMemory.ToUInt64(), d.Flags));\n      }\n      Marshal.ReleaseComObject(a);\n    }\n    Marshal.ReleaseComObject(f);\n    return res.ToArray();\n  }\n}\n'@\ntry {\n  if (-not ('RigDxgi' -as [type])) { Add-Type -TypeDefinition $dxgiSrc -Language CSharp -ErrorAction Stop }\n  $st.dxgi = @([RigDxgi]::List() | ForEach-Object { $p = $_.Split('|'); @{ luid = $p[0]; name = Clean $p[1]; vendorId = [int]$p[2]; vram = [double]$p[3]; shared = [double]$p[4]; software = (([int]$p[5] -band 2) -ne 0) } })\n} catch { $st.dxgi = @(); $st.dxgiError = Clean $_.Exception.Message }\nSend 'STATIC' $st\n\n$seen = @{}\n$lhmNs = $null\n$diskTempsOk = $st.isAdmin\n$tick = 0\nwhile ($true) {\n  $sw = [Diagnostics.Stopwatch]::StartNew()\n  if ($parentPid -gt 0 -and ($tick % 5) -eq 4) {\n    try { [void][Diagnostics.Process]::GetProcessById($parentPid) } catch { exit 0 }\n  }\n\n  if (($tick % 3) -eq 0) {\n    $now = @{}\n    $lines = New-Object Text.StringBuilder\n    foreach ($p in (Get-CimInstance Win32_Process -Property ProcessId,ParentProcessId,Name,CommandLine,ExecutablePath,CreationDate)) {\n      $k = [string]$p.ProcessId + '|' + [string](EpochMs $p.CreationDate)\n      $now[$k] = 1\n      if (-not $seen.ContainsKey($k)) {\n        [void]$lines.Append('PX' + $TAB + $p.ProcessId + $TAB + $p.ParentProcessId + $TAB + (EpochMs $p.CreationDate) + $TAB + (Clean $p.Name) + $TAB + (Clean $p.ExecutablePath) + $TAB + (Clean $p.CommandLine) + $NL)\n      }\n    }\n    $seen = $now\n    [void]$lines.Append('PXEND' + $TAB + $sw.ElapsedMilliseconds + $NL)\n    try { $out.Write($lines.ToString()); $out.Flush() } catch { exit 0 }\n  }\n\n  if ($null -eq $lhmNs -and ($tick % 15) -eq 0) {\n    foreach ($ns in @('root/LibreHardwareMonitor', 'root/OpenHardwareMonitor')) {\n      try { [void](Get-CimInstance -Namespace $ns -ClassName Hardware -ErrorAction Stop | Select-Object -First 1); $lhmNs = $ns; break } catch {}\n    }\n  }\n  if ($lhmNs -and ($tick % 2) -eq 0) {\n    try {\n      $hw = @(Get-CimInstance -Namespace $lhmNs -ClassName Hardware -ErrorAction Stop | ForEach-Object { @{ id = [string]$_.Identifier; name = Clean $_.Name; type = [string]$_.HardwareType; parent = [string]$_.Parent } })\n      $se = @(Get-CimInstance -Namespace $lhmNs -ClassName Sensor -ErrorAction Stop | ForEach-Object { @{ id = [string]$_.Identifier; name = Clean $_.Name; type = [string]$_.SensorType; value = [double]$_.Value; min = [double]$_.Min; max = [double]$_.Max; parent = [string]$_.Parent } })\n      Send 'LHM' @{ ns = $lhmNs; hw = $hw; sensors = $se }\n    } catch { $lhmNs = $null; Send 'LHM' @{ ns = $null; hw = @(); sensors = @() } }\n  }\n\n  if (($tick % 10) -eq 0) {\n    $dr = @(Get-CimInstance Win32_LogicalDisk | Where-Object { $_.Size -gt 0 } | ForEach-Object { @{ id = Clean $_.DeviceID; label = Clean $_.VolumeName; fs = Clean $_.FileSystem; size = [double]$_.Size; free = [double]$_.FreeSpace; type = [int]$_.DriveType } })\n    Send 'DRIVES' $dr\n    $bt = @(Get-CimInstance Win32_Battery | ForEach-Object { @{ name = Clean $_.Name; pct = [int]$_.EstimatedChargeRemaining; status = [int]$_.BatteryStatus; minutes = [int]$_.EstimatedRunTime } })\n    Send 'BATTERY' $bt\n  }\n\n  if (($tick % 30) -eq 0) {\n    $na = @(Get-NetAdapter | ForEach-Object { @{ name = Clean $_.Name; desc = Clean $_.InterfaceDescription; status = Clean $_.Status; speed = [double]$_.ReceiveLinkSpeed; virtual = [bool]$_.Virtual; media = Clean $_.PhysicalMediaType; mac = Clean $_.MacAddress; mtu = [int]$_.MtuSize; index = [int]$_.ifIndex } })\n    Send 'NICS' $na\n  }\n  if (($tick % 60) -eq 0) {\n    $pdk = @(Get-CimInstance -Namespace root/Microsoft/Windows/Storage -ClassName MSFT_PhysicalDisk | ForEach-Object {\n      $d = @{ id = [string]$_.DeviceId; name = Clean $_.FriendlyName; media = [int]$_.MediaType; bus = [int]$_.BusType; size = [double]$_.Size; health = [int]$_.HealthStatus; temp = $null; wear = $null }\n      if ($diskTempsOk) {\n        try { $r = Get-CimAssociatedInstance -InputObject $_ -ResultClassName MSFT_StorageReliabilityCounter -ErrorAction Stop; if ($r) { $d.temp = [int]$r.Temperature; $d.wear = [int]$r.Wear } } catch { $diskTempsOk = $false }\n      }\n      $d\n    })\n    Send 'PDISKS' $pdk\n  }\n\n  $tick++\n  $left = 1000 - $sw.ElapsedMilliseconds\n  if ($left -gt 10) { Start-Sleep -Milliseconds $left }\n}\n"};
const __M = Object.create(null), __C = Object.create(null), __P = require('path').posix;
__M["server.js"] = function (module, exports, require) {
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

};
__M["lib/alerts.js"] = function (module, exports, require) {
'use strict';
// Threshold alert rules. Fire after a condition holds for `forSec`, clear when it stops.
// Delivered to the page (toast + browser notification) and optionally to a webhook.
const U = require('./util');

const maxOf = a => { const v = a.filter(x => x != null); return v.length ? Math.max(...v) : null; };
const byName = (s, t) => { const n = String(t || '').toLowerCase(); return n ? s.procs.filter(p => p.name.toLowerCase() === n || (p.label || '').toLowerCase().startsWith(n)) : []; };

const METRICS = {
  cpu: { label: 'CPU usage', unit: '%', get: s => s.cpu.util },
  gpu: { label: 'GPU usage', unit: '%', get: s => (s.gpus[0] ? s.gpus[0].util : null) },
  mem: { label: 'Memory used', unit: '%', get: s => (s.mem.total ? 100 * s.mem.used / s.mem.total : null) },
  vram: { label: 'VRAM used', unit: '%', get: s => { const g = s.gpus[0]; return g && g.vramTotal ? 100 * g.vramUsed / g.vramTotal : null; } },
  swap: { label: 'Swap used', unit: '%', get: s => (s.mem.swapTotal ? 100 * s.mem.swapUsed / s.mem.swapTotal : null) },
  cpuTemp: { label: 'CPU temperature', unit: '°C', get: s => s.cpu.temp },
  gpuTemp: { label: 'GPU temperature', unit: '°C', get: s => maxOf(s.gpus.map(g => g.temp)) },
  gpuHotspot: { label: 'GPU hotspot', unit: '°C', get: s => maxOf(s.gpus.map(g => g.hotspot)) },
  diskTemp: { label: 'Disk temperature', unit: '°C', get: s => maxOf(s.disks.map(d => d.temp)) },
  diskFree: { label: 'Lowest free disk space', unit: '%', get: s => { const l = s.fs.filter(f => f.size > 1e9 && f.kind !== 'network'); return l.length ? Math.min(...l.map(f => 100 * f.free / f.size)) : null; } },
  diskBusy: { label: 'Disk busy', unit: '%', get: s => maxOf(s.disks.map(d => d.active)) },
  netRx: { label: 'Download', unit: 'Mb/s', get: s => s.net.rx * 8 / 1e6 },
  netTx: { label: 'Upload', unit: 'Mb/s', get: s => s.net.tx * 8 / 1e6 },
  ping: { label: 'Ping', unit: 'ms', get: s => (s.net.ping ? (s.net.ping.ms == null ? 2000 : s.net.ping.ms) : null) },
  loss: { label: 'Packet loss', unit: '%', get: s => (s.net.ping ? s.net.ping.loss : null) },
  retrans: { label: 'TCP retransmits', unit: '%', get: s => (s.net.tcp ? s.net.tcp.retransPct : null) },
  fps: { label: 'Game FPS', unit: 'fps', get: s => (s.fps.main ? s.fps.main.fps : null) },
  conns: { label: 'Open connections', unit: '', get: s => s.ports.total },
  battery: { label: 'Battery', unit: '%', get: s => (s.battery[0] ? s.battery[0].pct : null) },
  findings: { label: 'High/critical security findings', unit: '', get: s => s.security.counts.critical + s.security.counts.high },
  procCpu: { label: 'App CPU (by name)', unit: '%', target: 'process name', get: (s, t) => { const l = byName(s, t); return l.length ? l.reduce((a, p) => a + p.cpu, 0) : 0; } },
  procMem: { label: 'App memory (by name)', unit: 'GB', target: 'process name', get: (s, t) => byName(s, t).reduce((a, p) => a + p.mem, 0) / 1073741824 },
  procRunning: { label: 'App running (1 = yes)', unit: '', target: 'process name', get: (s, t) => (byName(s, t).length ? 1 : 0) },
  portOpen: { label: 'Port listening (1 = yes)', unit: '', target: 'port number', get: (s, t) => (s.ports.listen.some(l => l.port === +t) ? 1 : 0) },
};

const DEFAULT_RULES = [
  { id: 'cpu-temp', name: 'CPU running hot', metric: 'cpuTemp', op: '>', value: 90, forSec: 10, enabled: true },
  { id: 'gpu-temp', name: 'GPU running hot', metric: 'gpuTemp', op: '>', value: 88, forSec: 10, enabled: true },
  { id: 'disk-free', name: 'Disk almost full', metric: 'diskFree', op: '<', value: 10, forSec: 0, enabled: true },
  { id: 'mem-high', name: 'Memory pressure', metric: 'mem', op: '>', value: 92, forSec: 30, enabled: true },
  { id: 'net-loss', name: 'Packet loss', metric: 'loss', op: '>', value: 10, forSec: 20, enabled: true },
  { id: 'sec-high', name: 'High-risk exposure detected', metric: 'findings', op: '>', value: 0, forSec: 0, enabled: true },
  { id: 'cpu-pegged', name: 'CPU pegged', metric: 'cpu', op: '>', value: 95, forSec: 60, enabled: false },
  { id: 'fps-drop', name: 'FPS dropped', metric: 'fps', op: '<', value: 50, forSec: 5, enabled: false },
];

class Alerts {
  constructor(store, save, timeline) {
    this.store = store; this.save = save; this.timeline = timeline;
    this.rules = this.sanitize(store.alerts || DEFAULT_RULES);
    this.state = new Map(); this.outbox = [];
  }
  sanitize(rules) {
    return U.arr(rules).filter(r => r && METRICS[r.metric] && (r.op === '>' || r.op === '<')).slice(0, 100).map((r, i) => ({
      id: String(r.id || 'rule-' + Date.now() + '-' + i).slice(0, 40), name: String(r.name || METRICS[r.metric].label).slice(0, 80), metric: r.metric, target: r.target != null ? String(r.target).slice(0, 80) : '',
      op: r.op, value: U.num(r.value), forSec: U.clamp(U.int(r.forSec, 0), 0, 86400), cooldownSec: U.clamp(U.int(r.cooldownSec, 300), 0, 86400), enabled: r.enabled !== false, webhook: !!r.webhook,
    }));
  }
  setRules(rules) { this.rules = this.sanitize(rules); this.store.alerts = this.rules; this.save(); this.state.clear(); return this.list(); }
  list() { return this.rules.map(r => Object.assign({}, r, { state: this.state.get(r.id) || null, metricLabel: METRICS[r.metric].label, unit: METRICS[r.metric].unit })); }
  firing() { return this.rules.filter(r => (this.state.get(r.id) || {}).firing).map(r => { const s = this.state.get(r.id); return { id: r.id, name: r.name, value: s.value, since: s.since }; }); }
  evaluate(snap) {
    const now = Date.now();
    for (const r of this.rules) {
      if (!r.enabled) { this.state.delete(r.id); continue; }
      let v = null;
      try { v = METRICS[r.metric].get(snap, r.target); } catch { v = null; }
      const s = this.state.get(r.id) || { firing: false, over: null, since: null, value: null, lastFired: 0 };
      s.value = v == null ? null : U.r1(v);
      const cond = v != null && (r.op === '>' ? v > r.value : v < r.value);
      if (cond) {
        if (s.over == null) s.over = now;
        if (!s.firing && now - s.over >= r.forSec * 1000) {
          s.firing = true; s.since = now;
          if (now - s.lastFired >= r.cooldownSec * 1000 || !s.lastFired) {
            s.lastFired = now;
            const unit = METRICS[r.metric].unit;
            const msg = r.name + ': ' + METRICS[r.metric].label + (r.target ? ' (' + r.target + ')' : '') + ' is ' + s.value + unit + ' (' + r.op + ' ' + r.value + unit + ')';
            const e = this.timeline.add('alert.fire', 'warn', msg, { rule: r.id });
            this.outbox.push({ rule: r, event: e, msg });
          }
        }
      } else {
        s.over = null;
        if (s.firing) { s.firing = false; this.timeline.add('alert.clear', 'info', r.name + ' cleared', { rule: r.id }); }
      }
      this.state.set(r.id, s);
    }
    const out = this.outbox; this.outbox = [];
    for (const o of out) if (o.rule.webhook) this.webhook(o.msg).catch(() => {});
    return out.map(o => ({ id: o.rule.id, name: o.rule.name, msg: o.msg, t: o.event.t }));
  }
  async webhook(text) {
    const w = this.store.webhook || {};
    if (!w.enabled || !/^https?:\/\//i.test(w.url || '') || typeof fetch !== 'function') return false;
    const body = w.format === 'slack' ? { text: '[RigWatch] ' + text } : w.format === 'json' ? { source: 'rigwatch', text, t: new Date().toISOString() } : { content: '**RigWatch** · ' + text };
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 6000);
    try { const r = await fetch(w.url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ctl.signal }); return r.ok; } finally { clearTimeout(t); }
  }
}

module.exports = { Alerts, METRICS, DEFAULT_RULES };

};
__M["lib/assets.js"] = function (module, exports, require) {
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

};
__M["lib/classify.js"] = function (module, exports, require) {
'use strict';
// Process classification: kind tags, human labels for dev processes, project detection.
const fs = require('fs');
const path = require('path');
const { splitArgs, trunc } = require('./util');

const KIND = new Map();
function addKind(kind, list) { for (const n of list.split(',')) KIND.set(n.trim().toLowerCase(), kind); }
addKind('runtime', 'node,nodejs,bun,deno,python,pythonw,python3,python3.10,python3.11,python3.12,python3.13,python3.14,py,java,javaw,dotnet,ruby,rubyw,php,php-cgi,go,perl,erl,werl,beam.smp,elixir,julia,rscript,uvicorn,gunicorn,flask,celery,jupyter-lab,jupyter-notebook,tsx,ts-node');
addKind('db', 'postgres,pg_ctl,mysqld,mariadbd,mongod,mongos,redis-server,valkey-server,memurai,sqlservr,clickhouse-server,influxd,neo4j,etcd,rabbitmq-server,erlsrv,elasticsearch,opensearch,meilisearch,qdrant,cockroach,nats-server,kafka');
addKind('server', 'nginx,httpd,caddy,apache,apache2,traefik,envoy,ngrok,cloudflared,php-fpm,iisexpress,w3wp,haproxy,tailscaled,tailscale-ipn,wireguard,openvpn,sshd');
addKind('container', 'docker,dockerd,containerd,containerd-shim,com.docker.backend,com.docker.build,com.docker.service,docker desktop,vmmem,vmmemwsl,vmcompute,vmwp,wsl,wslhost,wslservice,wslrelay,podman,qemu-system-x86_64,qemu-system-aarch64,virtualboxvm,vboxheadless,vmware-vmx,kubectl,minikube,kind,colima,limactl,orbstack');
addKind('ai', 'ollama,ollama app,ollama_llama_server,llama-server,lm studio,lms,koboldcpp,llamafile,vllm,text-generation-launcher');
addKind('tool', 'git,git-remote-https,ssh,ssh-agent,esbuild,tsc,turbo,make,cmake,msbuild,cl,link,gradle,mvn,gopls,rust-analyzer,cargo,rustc,clangd,ninja,watchman,biome,ruff,pyright,adb,gh,terraform,vault,aws,az,gcloud,npm,npx,pnpm,yarn');
addKind('editor', 'code,code - insiders,code-insiders,cursor,windsurf,devenv,idea64,idea,pycharm64,pycharm,webstorm64,webstorm,rider64,goland64,clion64,phpstorm64,datagrip64,rustrover64,studio64,sublime_text,zed,notepad++,nvim,vim,emacs,fleet,xcode');
addKind('shell', 'powershell,pwsh,cmd,bash,zsh,fish,sh,dash,windowsterminal,openconsole,mintty,alacritty,wezterm-gui,warp,tabby,hyper,iterm2,terminal,gnome-terminal-server,konsole,kitty,tmux,screen');
addKind('browser', 'chrome,google chrome,google chrome helper,msedge,microsoft edge,firefox,brave,brave browser,opera,opera_gx,vivaldi,arc,msedgewebview2,iexplore,librewolf,thorium,zen,safari,chromium');
addKind('launcher', 'steam,steamwebhelper,steamservice,epicgameslauncher,epicwebhelper,battle.net,riotclientservices,riotclientux,eadesktop,eabackgroundservice,galaxyclient,ubisoftconnect,upc,origin,xboxpcapp,gamingservices,playnite.desktopapp,overwolf,medal,heroic,lutris');
addKind('comms', 'discord,slack,teams,ms-teams,zoom,zoom.us,telegram,whatsapp,signal,element,skype');
addKind('system', [
  // windows
  'system,registry,smss,csrss,wininit,winlogon,services,lsass,lsaiso,svchost,fontdrvhost,dwm,memory compression,memcompression,spoolsv,searchindexer,searchhost,searchprotocolhost,searchfilterhost,runtimebroker,sihost,taskhostw,ctfmon,conhost,dllhost,audiodg,wmiprvse,msmpeng,nissrv,mpdefendercoreservice,securityhealthservice,securityhealthsystray,wudfhost,smartscreen,startmenuexperiencehost,shellexperiencehost,textinputhost,widgets,widgetservice,explorer,lockapp,applicationframehost,systemsettings,phoneexperiencehost,crossdeviceservice,secure system,unsecapp,wlanext,dashost,sgrmbroker,msdtc,vssvc,trustedinstaller,tiworker,mousocoreworker,usocoreworker,compattelrunner,backgroundtaskhost,gamebar,gamebarftserver,gameinputsvc,nvcontainer,nvdisplay.container,amdrsserv,amdow,atieclxx,atiesrxx,amdfendrsr,rtkauduservice64,igfxem,lsm,wmiapsrv,searchapp,useroobebroker,aggregatorhost,ngciso,openwith,mpcmdrun',
  // linux
  'systemd,init,kthreadd,ksoftirqd,kworker,rcu_sched,rcu_preempt,migration,watchdog,systemd-journald,systemd-udevd,systemd-logind,systemd-resolved,systemd-networkd,systemd-timesyncd,dbus-daemon,dbus-broker,polkitd,udisksd,upowerd,networkmanager,wpa_supplicant,avahi-daemon,cron,crond,rsyslogd,irqbalance,accounts-daemon,gdm,gdm3,sddm,lightdm,xorg,xwayland,gnome-shell,plasmashell,kwin_wayland,pipewire,pipewire-pulse,wireplumber,pulseaudio,snapd,thermald,agetty,login,chronyd,auditd,modemmanager,bluetoothd,cupsd,packagekitd,fwupd',
  // macos
  'kernel_task,launchd,windowserver,mds,mds_stores,mdworker,mdworker_shared,coreaudiod,cfprefsd,distnoted,logd,opendirectoryd,securityd,trustd,syspolicyd,fseventsd,configd,powerd,bluetoothd,airportd,usbd,notifyd,diskarbitrationd,coreservicesd,loginwindow,dock,finder,systemuiserver,controlcenter,spotlight,corespotlightd,nsurlsessiond,cloudd,bird,rapportd,sharingd,locationd,hidd,watchdogd,kextd,apsd,symptomsd,mediaremoted,runningboardd,launchservicesd,containermanagerd,xprotect,endpointsecurityd',
].join(','));

const DEV_KINDS = new Set(['runtime', 'db', 'server', 'container', 'ai', 'tool']);

const PROTECTED = {
  win32: new Set(['system', 'registry', 'smss', 'csrss', 'wininit', 'winlogon', 'services', 'lsass', 'lsaiso', 'svchost', 'fontdrvhost', 'dwm', 'memory compression', 'memcompression', 'secure system', 'msmpeng', 'sihost', 'idle', 'wudfhost', 'mpdefendercoreservice']),
  linux: new Set(['systemd', 'init', 'kthreadd', 'systemd-journald', 'systemd-logind', 'dbus-daemon', 'dbus-broker', 'xorg', 'gnome-shell', 'plasmashell', 'kwin_wayland', 'sddm', 'gdm', 'gdm3', 'lightdm', 'polkitd']),
  darwin: new Set(['kernel_task', 'launchd', 'windowserver', 'loginwindow', 'opendirectoryd', 'securityd', 'logd', 'configd', 'trustd', 'syspolicyd']),
};

function kindOf(name) {
  const n = String(name || '').toLowerCase().replace(/\.exe$/, '');
  if (KIND.has(n)) return KIND.get(n);
  if (/^kworker|^ksoftirqd|^migration\/|^rcu_|^cpuhp|^irq\//.test(n)) return 'system';
  if (/^python3(\.\d+)?$/.test(n)) return 'runtime';
  if (/^(google chrome|brave browser|microsoft edge) helper/.test(n)) return 'browser';
  return 'app';
}

const base = p => String(p || '').replace(/\\/g, '/').replace(/\/+$/, '').split('/').pop();
const parentDir = p => { const s = String(p || '').replace(/\\/g, '/').split('/'); s.pop(); return s.pop() || ''; };
const GLOBAL_DIR = /AppData[\\/]Roaming[\\/]npm|[\\/]nodejs[\\/]node_modules|[\\/]usr[\\/](local[\\/])?lib[\\/]node_modules|[\\/]\.nvm[\\/]|[\\/]\.volta[\\/]|[\\/]\.bun[\\/]install[\\/]global|[\\/]pnpm[\\/]global|Program Files/i;

/**
 * Human label for a dev process from its command line, e.g.
 *   node C:\x\myapp\node_modules\next\dist\bin\next dev  ->  { label: "next dev", script: "C:\x\myapp\node_modules\next\..." }
 */
function describe(name, cmd) {
  const n = String(name || '').toLowerCase().replace(/\.exe$/, '');
  const a = splitArgs(cmd || ''); a.shift();
  const takesValue = /^(-r|--require|--import|--loader|--experimental-loader|-W|-X|-cp|-classpath|--inspect-port|--env-file|--max-old-space-size)$/;
  let label = '', script = '';
  if (/^(node|nodejs|bun|deno|tsx|ts-node)$/.test(n)) {
    let i = 0, inline = false;
    while (i < a.length && a[i].startsWith('-')) {
      if (/^(-e|--eval|-p|--print)$/.test(a[i])) { inline = true; break; }
      if (takesValue.test(a[i])) i++;
      i++;
    }
    if (inline) return { label: n + ' ' + a[i] + ' \u2026', script: '' };
    if ((n === 'deno' || n === 'bun') && /^(run|x|serve|test|task)$/.test(a[i] || '')) i++;
    script = a[i] || '';
    const rest = a.slice(i + 1).join(' ');
    const norm = script.replace(/\\/g, '/');
    const m = norm.match(/^(.*?)\/node_modules\/((?:@[^/]+\/)?[^/]+)\/(.*)$/);
    if (m) {
      const pkg = m[2];
      label = ({ '@angular/cli': 'ng', typescript: /tsserver/.test(m[3]) ? 'tsserver' : 'tsc' })[pkg] || pkg.replace(/^@[^/]+\//, '');
    } else if (script) label = base(script);
    else label = n + ' (repl)';
    if (rest) label += ' ' + rest;
  } else if (/^(python|pythonw|python3(\.\d+)?|py)$/.test(n)) {
    let i = 0;
    while (i < a.length && a[i].startsWith('-') && a[i] !== '-m' && a[i] !== '-c') { if (takesValue.test(a[i])) i++; i++; }
    if (a[i] === '-m') label = a.slice(i + 1).join(' ');
    else if (a[i] === '-c') label = n + ' -c \u2026';
    else if (a[i]) { script = a[i]; label = base(a[i]) + (a.length > i + 1 ? ' ' + a.slice(i + 1).join(' ') : ''); }
    else label = n + ' (repl)';
  } else if (/^(java|javaw)$/.test(n)) {
    const j = a.indexOf('-jar');
    if (j >= 0) { script = a[j + 1] || ''; label = base(script); }
    else { let i = 0; while (i < a.length && a[i].startsWith('-')) { if (takesValue.test(a[i])) i++; i++; } label = (a[i] || 'java').split('.').pop(); }
  } else if (n === 'dotnet') {
    label = a.length ? a.slice(0, 3).map(base).join(' ') : 'dotnet';
    if (a[0] && /\.dll$/i.test(a[0])) script = a[0];
  } else {
    label = [n].concat(a.slice(0, 4).map(x => (x.length > 40 ? base(x) : x))).join(' ');
  }
  return { label: trunc(label.trim(), 90), script };
}

// ---- project detection (package.json / .git / pyproject / go.mod / Cargo.toml) ----
const projCache = new Map();
const MARKERS = [['package.json', 'node'], ['pyproject.toml', 'python'], ['requirements.txt', 'python'], ['manage.py', 'django'], ['go.mod', 'go'], ['Cargo.toml', 'rust'], ['pom.xml', 'java'], ['build.gradle', 'java'], ['composer.json', 'php'], ['Gemfile', 'ruby'], ['deno.json', 'deno']];
function exists(p) { try { fs.accessSync(p); return true; } catch { return false; } }
function gitBranch(dir) {
  try {
    let g = path.join(dir, '.git');
    const st = fs.statSync(g);
    if (st.isFile()) { const m = fs.readFileSync(g, 'utf8').match(/gitdir:\s*(.+)/); if (m) g = path.resolve(dir, m[1].trim()); }
    const head = fs.readFileSync(path.join(g, 'HEAD'), 'utf8').trim();
    const m = head.match(/^ref:\s*refs\/heads\/(.+)$/);
    return m ? m[1] : head.slice(0, 8);
  } catch { return null; }
}
/** Walks up from a file/dir to find the project root. Cached for 30 s. */
function findProject(hint) {
  if (!hint || GLOBAL_DIR.test(hint)) return null;
  let dir = String(hint);
  try { if (!path.isAbsolute(dir)) return null; if (fs.statSync(dir).isFile()) dir = path.dirname(dir); } catch { dir = path.dirname(dir); }
  const parts = dir.split(/[\\/]/);
  const nm = parts.indexOf('node_modules');
  if (nm > 0) dir = parts.slice(0, nm).join(path.sep) || path.sep;
  const c = projCache.get(dir);
  if (c && Date.now() - c.at < 30000) return c.v;
  let v = null, d = dir;
  for (let i = 0; i < 6 && d; i++) {
    const mk = MARKERS.find(([f]) => exists(path.join(d, f)));
    const git = exists(path.join(d, '.git'));
    if (mk || git) {
      let name = path.basename(d), version = null, scripts = null;
      if (mk && mk[0] === 'package.json') {
        try { const pj = JSON.parse(fs.readFileSync(path.join(d, 'package.json'), 'utf8')); name = pj.name || name; version = pj.version || null; scripts = pj.scripts ? Object.keys(pj.scripts).slice(0, 12) : null; } catch { /* bad json */ }
      }
      v = { dir: d, name, version, type: mk ? mk[1] : 'git', branch: git ? gitBranch(d) : null, scripts };
      break;
    }
    const up = path.dirname(d);
    if (up === d) break;
    d = up;
  }
  projCache.set(dir, { v, at: Date.now() });
  if (projCache.size > 500) projCache.clear();
  return v;
}

module.exports = { kindOf, describe, findProject, DEV_KINDS, PROTECTED, base };

};
__M["lib/config.js"] = function (module, exports, require) {
'use strict';
// Runtime config (env vars) + persisted settings in ~/.rigwatch/config.json
const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { int, clamp, readText } = require('./util');

const env = process.env;
const VERSION = '2.1.0';
const HOME = env.RIGWATCH_HOME || path.join(os.homedir(), '.rigwatch');

const CFG = {
  version: VERSION,
  home: HOME,
  port: int(env.PORT, 3000),
  portExplicit: env.PORT !== undefined && env.PORT !== '',
  host: env.HOST || '127.0.0.1',
  interval: clamp(int(env.INTERVAL_MS, 1000), 250, 10000),
  pingTarget: env.PING_TARGET === undefined ? '1.1.1.1:443' : env.PING_TARGET,
  lhmUrl: env.LHM_URL || 'http://127.0.0.1:8085/data.json',
  presentMon: env.PRESENTMON_PATH || '',
  presentMonArgs: env.PRESENTMON_ARGS || '',
  allowControl: env.ALLOW_CONTROL !== '0' && env.ALLOW_KILL !== '0',
  allowTools: env.ALLOW_TOOLS !== '0',
  allowedHosts: (env.ALLOWED_HOSTS || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean),
  localNeedsToken: env.LOCAL_TOKEN === '1',
  lanReadNeedsToken: env.LAN_READ === 'token',
  persist: env.NO_PERSIST !== '1',
  open: process.argv.includes('--open') || env.OPEN === '1',
  dockerHost: env.DOCKER_HOST || '',
};

const FILE = path.join(HOME, 'config.json');
const DEFAULT_SETTINGS = { resolveHostnames: true, procEvents: true, hostEvents: true, healthChecks: true };

function load() {
  let d = {};
  try { const raw = readText(FILE); d = raw ? JSON.parse(raw) : {}; } catch { d = {}; }
  if (env.RIGWATCH_TOKEN) d.token = env.RIGWATCH_TOKEN;
  if (!d.token || typeof d.token !== 'string' || d.token.length < 16) d.token = crypto.randomBytes(18).toString('base64url');
  d.settings = Object.assign({}, DEFAULT_SETTINGS, d.settings || {});
  d.webhook = Object.assign({ enabled: false, url: '', format: 'discord' }, d.webhook || {});
  if (!Array.isArray(d.alerts)) d.alerts = null; // null -> defaults from alerts.js
  if (!Array.isArray(d.knownDevices)) d.knownDevices = [];
  d.siem = Object.assign({ autoBlock: false, autoLevel: 10, autoMinutes: 1440, allowPrivate: false, feed: false, notifyLevel: 12, trusted: [], fimPaths: [] }, d.siem || {});
  return d;
}

const store = load();
let saveTimer = null;
function save(now) {
  if (!CFG.persist) return;
  const write = () => {
    saveTimer = null;
    try {
      fs.mkdirSync(HOME, { recursive: true });
      const tmp = FILE + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(store, null, 2), { mode: 0o600 });
      fs.renameSync(tmp, FILE);
    } catch { /* read-only home: ignore */ }
  };
  if (now) return write();
  if (!saveTimer) saveTimer = setTimeout(write, 500);
}
save();

module.exports = { CFG, store, save, VERSION };

};
__M["lib/control.js"] = function (module, exports, require) {
'use strict';
// Guarded control actions. Every action is validated, checked against protected processes,
// and written to the timeline as an audit entry.
const fs = require('fs');
const crypto = require('crypto');
const U = require('./util');
const { PROTECTED } = require('./classify');

function create(engine) {
  const { plat, timeline } = engine;
  const protectedNames = PROTECTED[process.platform] || new Set();

  function procs() { return engine.lastProcs(); }
  function findProc(pid) {
    pid = U.int(pid, -1);
    if (pid <= 0) throw new Error('pid required');
    const p = procs().find(x => x.pid === pid);
    if (!p) throw new Error('No such process (it may have exited).');
    return p;
  }
  function ancestors(pid) {
    const by = new Map(procs().map(p => [p.pid, p]));
    const out = new Set(); let cur = by.get(pid);
    for (let i = 0; cur && i < 64 && !out.has(cur.pid); i++) { out.add(cur.pid); cur = by.get(cur.ppid); }
    return out;
  }
  function guard(p, what) {
    if (p.pid <= (U.IS_WIN ? 4 : 1)) throw new Error('Refusing to ' + what + ' a core OS process.');
    if (p.kind === 'rigwatch' || ancestors(process.pid).has(p.pid) || plat.selfPids().includes(p.pid)) throw new Error('Refusing: that would hit RigWatch itself or the terminal running it.');
    if (protectedNames.has(p.name.toLowerCase())) throw new Error(p.name + ' is a protected system process.');
  }
  function descendants(pid) {
    const kids = new Map();
    for (const p of procs()) { if (!kids.has(p.ppid)) kids.set(p.ppid, []); kids.get(p.ppid).push(p.pid); }
    const out = []; const walk = id => { for (const k of kids.get(id) || []) { if (out.includes(k) || k === id) continue; walk(k); out.push(k); } };
    walk(pid);
    return out; // deepest first
  }
  function need(fn, label) { if (typeof plat[fn] !== 'function') throw new Error(label + ' is not supported on ' + plat.label); }

  async function hashFile(file) {
    return new Promise((resolve, reject) => {
      const h = crypto.createHash('sha256'); let size = 0;
      fs.createReadStream(file).on('data', d => { size += d.length; h.update(d); }).on('error', reject).on('end', () => resolve({ sha256: h.digest('hex'), size }));
    });
  }

  async function killOne(p, o) {
    guard(p, 'kill');
    if (o.tree && !U.IS_WIN) {
      for (const k of descendants(p.pid)) { try { await plat.kill(k, { force: o.force }); } catch { /* already gone */ } }
    }
    return plat.kill(p.pid, { tree: o.tree, force: o.force !== false });
  }

  async function run(a, who) {
    const type = String(a.type || '');
    let msg = '', target = '';
    switch (type) {
      case 'proc.kill': { const p = findProc(a.pid); target = p.name + ' (' + p.pid + ')'; msg = await killOne(p, { tree: !!a.tree, force: a.force !== false }); break; }
      case 'proc.suspend': case 'proc.resume': {
        const p = findProc(a.pid); guard(p, type === 'proc.suspend' ? 'suspend' : 'resume'); need(type.slice(5), 'Suspend/resume');
        target = p.name + ' (' + p.pid + ')';
        msg = await (type === 'proc.suspend' ? plat.suspend(p.pid) : plat.resume(p.pid));
        break;
      }
      case 'proc.priority': {
        const p = findProc(a.pid); guard(p, 'change priority of'); need('priority', 'Priority');
        if (!['idle', 'below', 'normal', 'above', 'high'].includes(a.level)) throw new Error('level must be idle|below|normal|above|high');
        target = p.name + ' (' + p.pid + ') → ' + a.level; msg = await plat.priority(p.pid, a.level); break;
      }
      case 'proc.affinity': {
        const p = findProc(a.pid); guard(p, 'change affinity of'); need('affinity', 'CPU affinity');
        const n = require('os').cpus().length;
        const cores = U.arr(a.cores).map(Number).filter(c => Number.isInteger(c) && c >= 0 && c < n);
        if (!cores.length) throw new Error('pick at least one core');
        const mask = cores.reduce((m, c) => m | (1n << BigInt(c)), 0n);
        target = p.name + ' (' + p.pid + ') → cores ' + cores.join(','); msg = await plat.affinity(p.pid, mask.toString()); break;
      }
      case 'proc.reveal': { const p = findProc(a.pid); if (!p.exe) throw new Error('executable path unknown'); need('reveal', 'Open location'); target = p.exe; msg = await plat.reveal(p.exe); break; }
      case 'proc.hash': {
        const p = findProc(a.pid); if (!p.exe) throw new Error('executable path unknown (try running elevated)');
        const r = await hashFile(p.exe.replace(/ \(deleted\)$/, ''));
        return { ok: true, msg: 'sha256 ' + r.sha256, data: Object.assign(r, { path: p.exe, virustotal: 'https://www.virustotal.com/gui/file/' + r.sha256 }) };
      }
      case 'proc.info': { const p = findProc(a.pid); need('procInfo', 'Process info'); return { ok: true, data: await plat.procInfo(p.pid) }; }
      case 'port.kill': {
        const port = U.int(a.port, 0); if (port < 1 || port > 65535) throw new Error('bad port');
        const owners = [...new Set(plat.sockets().listen.filter(l => l.port === port && (!a.proto || l.proto === a.proto)).map(l => l.pid))];
        if (!owners.length) throw new Error('Nothing is listening on port ' + port + '.');
        const done = [];
        for (const pid of owners) { const p = findProc(pid); await killOne(p, { tree: true, force: true }); done.push(p.name + ' (' + pid + ')'); }
        target = 'port ' + port; msg = 'ended ' + done.join(', '); break;
      }
      case 'service': {
        need('serviceAction', 'Service control');
        if (!['start', 'stop', 'restart'].includes(a.action)) throw new Error('bad action');
        const name = String(a.name || ''); if (!/^[\w@.:\- ]{1,200}$/.test(name)) throw new Error('bad service name');
        target = name + ' → ' + a.action; msg = String(await plat.serviceAction(name, a.action)); break;
      }
      case 'docker': { target = a.id + ' → ' + a.action; msg = await engine.docker.action(String(a.id || ''), String(a.action || '')); break; }
      case 'wsl': { need('wslAction', 'WSL control'); target = (a.name || 'all') + ' → ' + a.action; msg = await plat.wslAction(String(a.name || ''), String(a.action || '')); break; }
      default: throw new Error('unknown action ' + type);
    }
    timeline.add('action', 'info', type + ' ' + target, { detail: U.trunc(msg, 300), who });
    return { ok: true, msg: msg || 'done' };
  }

  return { run };
}

module.exports = { create };

};
__M["lib/dev.js"] = function (module, exports, require) {
'use strict';
// Developer helpers: dev-server health checks, project detection (+ git branch), toolchain
// versions, WSL distros.
const http = require('http');
const https = require('https');
const path = require('path');
const U = require('./util');
const { describe, findProject, DEV_KINDS } = require('./classify');

const TOOLCHAIN = [
  ['node', ['--version']], ['npm', ['--version']], ['pnpm', ['--version']], ['yarn', ['--version']], ['bun', ['--version']], ['deno', ['--version']],
  ['python3', ['--version']], ['python', ['--version']], ['pip', ['--version']], ['uv', ['--version']], ['go', ['version']], ['rustc', ['--version']], ['cargo', ['--version']],
  ['java', ['-version']], ['dotnet', ['--version']], ['ruby', ['--version']], ['php', ['--version']], ['git', ['--version']], ['docker', ['--version']],
  ['kubectl', ['version', '--client']], ['gh', ['--version']], ['terraform', ['--version']], ['ollama', ['--version']],
];

function probeHttp(port) {
  const get = (lib, proto) => new Promise(resolve => {
    const t0 = Date.now();
    const req = lib.request({ host: '127.0.0.1', port, path: '/', method: 'GET', timeout: 1500, rejectUnauthorized: false, headers: { 'user-agent': 'RigWatch-health', accept: 'text/html,*/*' } }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', d => { if (body.length < 65536) body += d; });
      res.on('end', () => resolve({ ok: res.statusCode < 500, status: res.statusCode, ms: Date.now() - t0, proto, title: ((body.match(/<title[^>]*>([^<]{0,120})/i) || [])[1] || '').trim(), server: res.headers.server || res.headers['x-powered-by'] || '' }));
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', e => resolve({ ok: false, status: 0, ms: Date.now() - t0, proto, err: e.code || e.message }));
    req.end();
  });
  return get(http, 'http').then(r => (r.status || /TIMEOUT/i.test(r.err || '') ? r : get(https, 'https').then(r2 => (r2.status ? r2 : Object.assign(r, { kind: 'tcp' })))));
}

function create(plat, settings) {
  const dev = { health: new Map(), projects: new Map(), toolchain: null, wsl: null, timer: null };

  dev.projectFor = p => {
    const c = dev.projects.get(p.pid);
    if (c && c.start === p.start && Date.now() - c.at < 60000) return c.v;
    const d = describe(p.name, p.cmd);
    const v = d.script && path.isAbsolute(d.script) ? findProject(d.script) : null;
    dev.projects.set(p.pid, { v, start: p.start, at: Date.now() });
    // relative script ("node server.js"): resolve against the process cwd where the OS exposes it
    if (!v && plat.cwd) {
      plat.cwd(p.pid).then(cwd => { if (cwd) { const pv = findProject(d.script ? path.resolve(cwd, d.script) : cwd); dev.projects.set(p.pid, { v: pv, start: p.start, at: Date.now() }); } }).catch(() => {});
    }
    return v;
  };

  dev.check = async (procs, sock) => {
    if (!settings.healthChecks) return;
    const want = new Map();
    for (const p of procs) {
      if (!['runtime', 'server', 'ai'].includes(p.kind)) continue;
      for (const port of sock.byPid.get(p.pid) || []) if (want.size < 30) want.set(port, p.pid);
    }
    await Promise.all([...want.keys()].map(async port => { dev.health.set(port, Object.assign({ at: Date.now(), pid: want.get(port) }, await probeHttp(port))); }));
    for (const port of dev.health.keys()) if (!want.has(port)) dev.health.delete(port);
  };

  dev.loadToolchain = async () => {
    const out = [];
    for (const [name, args] of TOOLCHAIN) {
      if (name === 'node') { out.push({ name, version: process.version.replace(/^v/, ''), path: process.execPath }); continue; }
      const exe = U.which([name]);
      if (!exe || /WindowsApps/i.test(exe)) continue;
      const isCmd = /\.(cmd|bat)$/i.test(exe);
      const r = isCmd ? await U.run(process.env.ComSpec || 'cmd.exe', ['/d', '/c', name, ...args], { timeout: 6000 }) : await U.run(exe, args, { timeout: 6000 });
      const text = (r.stdout + ' ' + r.stderr).trim();
      const m = text.match(/(\d+\.\d+(?:\.\d+)?(?:[-+._][\w.]+)?)/);
      if (m) out.push({ name, version: m[1], path: exe });
    }
    dev.toolchain = out;
  };

  dev.pollWsl = async () => { if (plat.wsl) { try { dev.wsl = await plat.wsl(); } catch { dev.wsl = { installed: false, distros: [] }; } } };

  dev.annotate = p => {
    if (!DEV_KINDS.has(p.kind)) return;
    p.label = describe(p.name, p.cmd).label;
    const pr = dev.projectFor(p);
    if (pr) p.project = { name: pr.name, dir: pr.dir, branch: pr.branch, type: pr.type, version: pr.version };
  };
  dev.healthList = () => Object.fromEntries(dev.health);
  return dev;
}

module.exports = { create };

};
__M["lib/docker.js"] = function (module, exports, require) {
'use strict';
// Docker / Podman via the Engine API on the local socket or named pipe (no CLI needed).
const http = require('http');
const os = require('os');
const U = require('./util');

function candidates(dockerHost) {
  const out = [];
  if (dockerHost) {
    if (dockerHost.startsWith('unix://')) out.push({ socketPath: dockerHost.slice(7) });
    else if (dockerHost.startsWith('npipe://')) out.push({ socketPath: dockerHost.slice(8).replace(/\//g, '\\') });
    else if (/^tcp:\/\//.test(dockerHost)) { try { const u = new URL(dockerHost.replace(/^tcp/, 'http')); out.push({ host: u.hostname, port: +u.port || 2375 }); } catch { /* bad */ } }
  }
  if (U.IS_WIN) out.push({ socketPath: '\\\\.\\pipe\\docker_engine' }, { socketPath: '\\\\.\\pipe\\dockerDesktopLinuxEngine' }, { socketPath: '\\\\.\\pipe\\podman-machine-default' });
  else {
    const h = os.homedir(), uid = process.getuid ? process.getuid() : null;
    for (const p of ['/var/run/docker.sock', h + '/.docker/run/docker.sock', h + '/.colima/default/docker.sock', h + '/.orbstack/run/docker.sock', h + '/.rd/docker.sock', uid != null ? '/run/user/' + uid + '/docker.sock' : null, uid != null ? '/run/user/' + uid + '/podman/podman.sock' : null, '/run/podman/podman.sock']) if (p) out.push({ socketPath: p });
  }
  return out;
}

function request(target, method, path, { timeout = 5000, raw = false } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(Object.assign({}, target, { method, path, headers: { host: 'docker', 'content-type': 'application/json' }, timeout }), res => {
      if (raw) return resolve(res);
      let body = '';
      res.setEncoding('utf8');
      res.on('data', d => { body += d; });
      res.on('end', () => {
        if (res.statusCode >= 400) { let m = body; try { m = JSON.parse(body).message || body; } catch { /* text */ } return reject(new Error(m || 'HTTP ' + res.statusCode)); }
        if (!body) return resolve(null);
        try { resolve(JSON.parse(body)); } catch { resolve(body); }
      });
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    req.end();
  });
}

const ID_RX = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/;

function create(cfg) {
  const d = { available: false, target: null, info: null, containers: [], prev: new Map(), err: '', lastCheck: 0, polling: false };
  let timer = null, stopped = false;

  async function detect() {
    d.lastCheck = Date.now();
    for (const c of candidates(cfg.dockerHost)) {
      try { const r = await request(c, 'GET', '/_ping', { timeout: 1500 }); if (String(r).trim() === 'OK') { d.target = c; d.available = true; d.err = ''; return true; } } catch (e) { d.err = e.message; }
    }
    d.available = false; d.target = null;
    return false;
  }

  function cpuPct(id, s) {
    const cu = s.cpu_stats || {}, total = cu.cpu_usage ? cu.cpu_usage.total_usage : 0;
    const p = d.prev.get(id);
    const now = { total, sys: cu.system_cpu_usage || 0, read: Date.parse(s.read) || Date.now(), rx: 0, tx: 0, br: 0, bw: 0 };
    for (const n of Object.values(s.networks || {})) { now.rx += n.rx_bytes || 0; now.tx += n.tx_bytes || 0; }
    for (const b of ((s.blkio_stats || {}).io_service_bytes_recursive || [])) { if (/read/i.test(b.op)) now.br += b.value; if (/write/i.test(b.op)) now.bw += b.value; }
    d.prev.set(id, now);
    if (!p) return { cpu: 0, rx: 0, tx: 0, br: 0, bw: 0 };
    const dt = Math.max(0.001, (now.read - p.read) / 1000);
    const ncpu = cu.online_cpus || (cu.cpu_usage && cu.cpu_usage.percpu_usage ? cu.cpu_usage.percpu_usage.length : 0) || os.cpus().length;
    // CPU as a share of the whole host (100% = every core busy), same scale as the process table
    const cpu = now.sys && p.sys && now.sys > p.sys
      ? 100 * (now.total - p.total) / (now.sys - p.sys)
      : 100 * ((now.total - p.total) / 1e7) / dt / ncpu; // Windows containers: 100 ns units, no system counter
    const r = (a, b) => Math.max(0, (a - b) / dt);
    return { cpu: U.r1(U.clamp(cpu, 0, 100)), rx: Math.round(r(now.rx, p.rx)), tx: Math.round(r(now.tx, p.tx)), br: Math.round(r(now.br, p.br)), bw: Math.round(r(now.bw, p.bw)) };
  }

  async function poll() {
    if (stopped) return;
    if (!d.available && Date.now() - d.lastCheck > 30000) await detect();
    if (d.available) {
      try {
        const list = await request(d.target, 'GET', '/containers/json?all=1', { timeout: 5000 });
        if (!d.info || Date.now() - d.info.at > 60000) { const i = await request(d.target, 'GET', '/info', { timeout: 5000 }).catch(() => null); if (i) d.info = { at: Date.now(), version: i.ServerVersion, os: i.OperatingSystem, osType: i.OSType, arch: i.Architecture, ncpu: i.NCPU, mem: i.MemTotal, containers: i.Containers, running: i.ContainersRunning, images: i.Images, driver: i.Driver, name: i.Name }; }
        const running = list.filter(c => c.State === 'running');
        const stats = new Map();
        let i = 0;
        await Promise.all(Array.from({ length: Math.min(6, running.length) }, async () => {
          while (i < running.length) {
            const c = running[i++];
            try { const s = await request(d.target, 'GET', '/containers/' + c.Id + '/stats?stream=false&one-shot=true', { timeout: 4000 }); const m = s.memory_stats || {}; const st = m.stats || {}; stats.set(c.Id, Object.assign(cpuPct(c.Id, s), { mem: Math.max(0, (m.usage || 0) - (st.inactive_file || st.total_inactive_file || st.cache || 0)), memLimit: m.limit || 0, pids: (s.pids_stats || {}).current || 0 })); } catch { /* skip */ }
          }
        }));
        d.containers = list.map(c => {
          const s = stats.get(c.Id) || {};
          return { id: c.Id.slice(0, 12), fullId: c.Id, name: (c.Names && c.Names[0] || '').replace(/^\//, ''), image: c.Image, state: c.State, status: c.Status, created: c.Created * 1000, ports: (c.Ports || []).map(p => ({ ip: p.IP || '', priv: p.PrivatePort, pub: p.PublicPort || null, type: p.Type })), compose: (c.Labels || {})['com.docker.compose.project'] || null, service: (c.Labels || {})['com.docker.compose.service'] || null, cpu: s.cpu || 0, mem: s.mem || 0, memLimit: s.memLimit || 0, rx: s.rx || 0, tx: s.tx || 0, br: s.br || 0, bw: s.bw || 0, pids: s.pids || 0 };
        });
        for (const id of d.prev.keys()) if (!list.some(c => c.Id === id)) d.prev.delete(id);
        d.err = '';
      } catch (e) { d.err = e.message; d.available = false; d.containers = []; }
    }
    timer = setTimeout(poll, 3000); timer.unref();
  }

  d.start = () => { detect().then(poll); };
  d.stop = () => { stopped = true; clearTimeout(timer); };
  d.summary = () => ({ available: d.available, info: d.info, containers: d.containers, err: d.available ? '' : d.err });
  d.action = async (id, action) => {
    if (!d.available) throw new Error('Docker is not reachable');
    if (!ID_RX.test(id) || !['start', 'stop', 'restart', 'pause', 'unpause', 'kill'].includes(action)) throw new Error('bad request');
    await request(d.target, 'POST', '/containers/' + encodeURIComponent(id) + '/' + action, { timeout: 30000 });
    return action + ' ok';
  };
  d.inspect = async id => {
    if (!d.available) throw new Error('Docker is not reachable');
    if (!ID_RX.test(id)) throw new Error('bad id');
    const j = await request(d.target, 'GET', '/containers/' + encodeURIComponent(id) + '/json', { timeout: 8000 });
    const cfgC = j.Config || {};
    return {
      id: j.Id, name: (j.Name || '').replace(/^\//, ''), image: cfgC.Image, created: j.Created, state: j.State, restart: (j.HostConfig || {}).RestartPolicy,
      cmd: [].concat(cfgC.Entrypoint || [], cfgC.Cmd || []).join(' '), workdir: cfgC.WorkingDir, user: cfgC.User || 'root (default)', privileged: !!(j.HostConfig || {}).Privileged,
      env: (cfgC.Env || []).map(e => e.split('=')[0] + '=•••'), mounts: (j.Mounts || []).map(m => ({ type: m.Type, src: m.Source, dst: m.Destination, rw: m.RW })),
      networks: Object.entries((j.NetworkSettings || {}).Networks || {}).map(([n, v]) => ({ name: n, ip: v.IPAddress, gw: v.Gateway })),
      ports: (j.NetworkSettings || {}).Ports || {}, capAdd: (j.HostConfig || {}).CapAdd || [], networkMode: (j.HostConfig || {}).NetworkMode,
    };
  };
  /** Streams logs into a job (api from lib/jobs.js). */
  d.logs = (id, api, tail = 200) => new Promise((resolve, reject) => {
    if (!d.available) return reject(new Error('Docker is not reachable'));
    if (!ID_RX.test(id)) return reject(new Error('bad id'));
    const req = http.request(Object.assign({}, d.target, { method: 'GET', path: '/containers/' + encodeURIComponent(id) + '/logs?stdout=1&stderr=1&follow=1&timestamps=1&tail=' + U.clamp(U.int(tail, 200), 1, 5000), headers: { host: 'docker' } }), res => {
      if (res.statusCode >= 400) { reject(new Error('HTTP ' + res.statusCode)); res.resume(); return; }
      let buf = Buffer.alloc(0), mux = null, text = '';
      const emitText = (s, cls) => { text += s; const parts = text.split('\n'); text = parts.pop(); for (const l of parts) api.line(l.replace(/\r$/, ''), cls); };
      res.on('data', chunk => {
        buf = Buffer.concat([buf, chunk]);
        if (mux === null && buf.length >= 8) mux = (buf[0] === 1 || buf[0] === 2) && buf[1] === 0 && buf[2] === 0 && buf[3] === 0;
        if (mux === false) { emitText(buf.toString('utf8')); buf = Buffer.alloc(0); return; }
        while (mux && buf.length >= 8) {
          const len = buf.readUInt32BE(4);
          if (buf.length < 8 + len) break;
          emitText(buf.slice(8, 8 + len).toString('utf8'), buf[0] === 2 ? 'err' : '');
          buf = buf.slice(8 + len);
        }
      });
      res.on('end', () => { if (text) api.line(text); resolve(); });
    });
    api.onCancel(() => req.destroy());
    req.on('error', e => (api.cancelled ? resolve() : reject(e)));
    req.end();
  });
  return d;
}

module.exports = { create };

};
__M["lib/elevate.js"] = function (module, exports, require) {
'use strict';
// Windows: "node server.js" asks for admin once (UAC), runs the server elevated in the
// background, and keeps this terminal as its console (logs stream here, Ctrl+C stops it).
// Decline the prompt, or set ELEVATE=off / --no-elevate, to run without admin.
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync, spawn } = require('child_process');

const IS_WIN = process.platform === 'win32';
const arg = name => { const a = process.argv.find(x => x.startsWith('--' + name + '=')); return a ? a.slice(name.length + 3) : null; };
const isChild = () => process.argv.includes('--elevated-child');

let adminCache = null;
function isAdmin() {
  if (adminCache !== null) return adminCache;
  if (!IS_WIN) return (adminCache = process.getuid ? process.getuid() === 0 : false);
  try { execFileSync(require('./util').sys32('net.exe'), ['session'], { stdio: 'ignore', windowsHide: true, timeout: 5000 }); adminCache = true; } catch { adminCache = false; }
  return adminCache;
}
/** true while the process exists. A non-elevated process gets EPERM for an elevated one: still alive. */
function alive(pid) {
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
}

/** In the elevated child: restore the parent's environment, log to the shared file, die with the parent. */
function childBootstrap() {
  if (!isChild()) return;
  const envFile = arg('envfile');
  if (envFile) {
    try { Object.assign(process.env, JSON.parse(fs.readFileSync(envFile, 'utf8'))); fs.rmSync(envFile, { force: true }); } catch { /* defaults */ }
  }
  const logFile = arg('log');
  if (logFile) {
    const out = fs.createWriteStream(logFile, { flags: 'a' });
    const wrap = orig => function (chunk, enc, cb) { try { out.write(chunk); } catch { /* ignore */ } return orig.call(this, chunk, enc, cb); };
    process.stdout.write = wrap(process.stdout.write);
    process.stderr.write = wrap(process.stderr.write);
  }
  const parent = parseInt(arg('parent'), 10);
  if (parent > 0) setInterval(() => { if (!alive(parent)) process.exit(0); }, 1500).unref();
}

function shouldElevate() {
  if (!IS_WIN || isChild()) return false;
  if (process.argv.includes('--no-elevate') || /^(off|0|no|false)$/i.test(process.env.ELEVATE || '')) return false;
  return !isAdmin();
}

function quote(a) { return '"' + String(a).replace(/"/g, '\\"') + '"'; }

/** Starts an elevated copy of this script. extra: { detached } (detached = visible window, no parent link). */
function startElevated(extra = {}) {
  const id = crypto.randomBytes(6).toString('hex');
  const logFile = path.join(os.tmpdir(), 'rigwatch-' + id + '.log');
  const envFile = path.join(os.tmpdir(), 'rigwatch-' + id + '.json');
  const keep = {};
  for (const [k, v] of Object.entries(process.env)) if (/^(PORT|HOST|INTERVAL_MS|PING_TARGET|LHM_URL|PRESENTMON_|ALLOW_|ALLOWED_HOSTS|LOCAL_TOKEN|LAN_READ|RIGWATCH_|NO_PERSIST|NO_DOWNLOAD|DOCKER_HOST)/.test(k)) keep[k] = v;
  if (extra.port) keep.PORT = String(extra.port); // UI restart: keep the same URL
  fs.writeFileSync(envFile, JSON.stringify(keep), { mode: 0o600 });
  fs.writeFileSync(logFile, '');
  const args = [process.argv[1], '--elevated-child', '--log=' + logFile, '--envfile=' + envFile];
  if (extra.detached) args.push('--wait-port'); else args.push('--parent=' + process.pid);
  const ps = '$p = Start-Process -FilePath $env:RW_NODE -ArgumentList $env:RW_ARGS -Verb RunAs -WorkingDirectory $env:RW_CWD -WindowStyle ' + (extra.detached ? 'Minimized' : 'Hidden') + ' -PassThru; $p.Id';
  return new Promise(resolve => {
    const p = spawn(require('./util').psExe(), ['-NoProfile', '-NonInteractive', '-Command', ps], {
      windowsHide: true,
      env: Object.assign({}, process.env, { RW_NODE: process.execPath, RW_ARGS: args.map(quote).join(' '), RW_CWD: process.cwd() }),
    });
    let out = '', err = '';
    p.stdout.on('data', d => { out += d; });
    p.stderr.on('data', d => { err += d; });
    p.on('exit', code => {
      const pid = parseInt(out.trim(), 10);
      if (code === 0 && pid > 0) resolve({ ok: true, pid, logFile });
      else { try { fs.rmSync(envFile, { force: true }); fs.rmSync(logFile, { force: true }); } catch { /* ignore */ } resolve({ ok: false, err: /cancel/i.test(err) ? 'UAC prompt declined' : err.trim().split('\n')[0] || 'failed' }); }
    });
  });
}

/** Parent side: elevate, then mirror the child's log until Ctrl+C. Returns false to run here instead. */
async function launch() {
  console.log('[rigwatch] asking Windows for admin rights (UAC) for temps, FPS, services and full process control…');
  const r = await startElevated();
  if (!r.ok) { console.log('[rigwatch] continuing without admin (' + r.err + '). Some sensors and actions will be limited.'); return false; }
  console.log('[rigwatch] running elevated in the background (PID ' + r.pid + '). Ctrl+C here stops it.');
  let pos = 0;
  const pump = () => {
    try {
      const st = fs.statSync(r.logFile);
      if (st.size > pos) { const fd = fs.openSync(r.logFile, 'r'); const buf = Buffer.alloc(st.size - pos); fs.readSync(fd, buf, 0, buf.length, pos); fs.closeSync(fd); pos = st.size; process.stdout.write(buf); }
    } catch { /* not yet */ }
  };
  const t = setInterval(pump, 300);
  const watch = setInterval(() => { if (alive(r.pid)) return; pump(); clearInterval(t); clearInterval(watch); console.log('[rigwatch] elevated server exited'); process.exit(0); }, 2000);
  const stop = () => { clearInterval(t); try { fs.rmSync(r.logFile, { force: true }); } catch { /* in use */ } process.exit(0); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
  if (process.argv.includes('--open') || process.env.OPEN === '1') {
    // open the browser from this (non-admin) process once the elevated server prints its URL
    const tryOpen = n => {
      let port = null;
      try { const m = fs.readFileSync(r.logFile, 'utf8').match(/http:\/\/localhost:(\d+)/); if (m) port = m[1]; } catch { /* not yet */ }
      if (!port) { if (n > 0) setTimeout(() => tryOpen(n - 1), 500); return; }
      require('http').get('http://127.0.0.1:' + port + '/api/health', res => { res.resume(); spawn('cmd', ['/c', 'start', '', 'http://localhost:' + port], { detached: true, stdio: 'ignore', windowsHide: true }).unref(); }).on('error', () => { if (n > 0) setTimeout(() => tryOpen(n - 1), 500); });
    };
    tryOpen(60);
  }
  return true;
}

module.exports = { isAdmin, alive, childBootstrap, shouldElevate, launch, startElevated, isChild };

};
__M["lib/engine.js"] = function (module, exports, require) {
'use strict';
// The engine owns every collector and builds one snapshot per interval for the UI.
const os = require('os');
const U = require('./util');
const { CFG, store, save, VERSION } = require('./config');
const platform = require('./platform');
const S = require('./sensors');
const { kindOf } = require('./classify');
const { History } = require('./history');
const { Timeline } = require('./timeline');
const { Alerts, METRICS } = require('./alerts');
const { Security } = require('./security');
const { Jobs } = require('./jobs');
const { TOOLS } = require('./nettools');
const tools = require('./tools');

const normName = s => String(s || '').toLowerCase().replace(/\(tm\)|\(r\)|graphics|amd|nvidia|intel|radeon|geforce|corporation|apple|\s+/g, '');
function sameName(a, b) {
  const x = normName(a), y = normName(b);
  if (x && y) return x.includes(y) || y.includes(x);
  return String(a || '').toLowerCase().trim() === String(b || '').toLowerCase().trim();
}

function createEngine(broadcast) {
  const e = { startedAt: Date.now() };
  const timeline = new Timeline(CFG.home, CFG.persist);
  const history = new History(CFG.home, CFG.persist);
  const nv = require('./nvidia').create(CFG.interval);
  const plat = platform.create({ cfg: CFG, onTick: () => tick(), onInventory: () => broadcast('static', JSON.stringify(e.staticPayload())), hasNvidia: () => !!nv.exe });
  const fps = require('./fps').create(CFG, kindOf);
  const ping = require('./ping').create(CFG.pingTarget);
  const alerts = new Alerts(store, save, timeline);
  const security = new Security(plat, timeline);
  const docker = require('./docker').create(CFG);
  const dev = require('./dev').create(plat, store.settings);
  const jobs = new Jobs(broadcast);
  Object.assign(e, { plat, timeline, history, alerts, security, docker, dev, jobs, nv, fps, ping });
  e.control = require('./control').create(e);
  e.toolbox = require('./toolbox').create(e);
  e.siem = require('./siem').create(e, broadcast, CFG, store, save);
  timeline.onAdd = ev => e.siem.fromTimeline(ev);

  let lastProcs = [], lastSnap = null, lastSnapJson = '', lastBuild = 0, seq = 0, building = false;
  let lastSockAt = -1, lastHealth = 0, secSummary = { score: 100, counts: { critical: 0, high: 0, medium: 0, low: 0, info: 0 }, top: [] };
  const session = { rx: 0, tx: 0, since: Date.now() };
  const procHist = new Map();
  let lastHistPrune = 0;
  e.lastProcs = () => lastProcs;
  e.lastSnap = () => lastSnap;
  e.lastSnapJson = () => lastSnapJson;
  e.procHistory = pid => procHist.get(pid) || null;

  // ---- cached network info (ARP, routes, DNS, firewall, AV, Wi-Fi) ----
  let netCache = null, netAt = 0, netPending = null;
  e.netInfo = force => {
    if (!plat.netInfo) return Promise.reject(new Error('not supported'));
    if (!force && netCache && Date.now() - netAt < 15000) return Promise.resolve(netCache);
    if (netPending) return netPending;
    netPending = plat.netInfo().then(n => { netCache = n; netAt = Date.now(); security.setNetInfo(n); return n; }).finally(() => { netPending = null; });
    return netPending;
  };

  // ---- fallback when the platform collector has nothing yet ----
  let prevCpu = null;
  function fallback() {
    const cur = os.cpus().map(c => { const t = c.times; return { total: t.user + t.nice + t.sys + t.idle + t.irq, idle: t.idle }; });
    let ti = 0, tt = 0;
    const per = cur.map((c, i) => { const p = prevCpu && prevCpu[i]; if (!p) return 0; const d = c.total - p.total, di = c.idle - p.idle; ti += di; tt += d; return d > 0 ? U.r1(100 * (1 - di / d)) : 0; });
    prevCpu = cur;
    const total = os.totalmem(), free = os.freemem();
    return { t: Date.now(), cpu: { util: tt > 0 ? U.r1(100 * (1 - ti / tt)) : 0, cores: per.map(u => ({ u, mhz: 0 })), mhz: (os.cpus()[0] || {}).speed || 0 }, mem: { total, avail: free, used: total - free }, gpus: [], gpuProc: new Map(), disks: [], fs: [], net: { ifaces: [], tcp: null }, procs: [], sensors: [], sensorSource: null, battery: [], fallback: true };
  }

  function build() {
    const now = Date.now();
    const dt = lastBuild ? U.clamp((now - lastBuild) / 1000, 0.05, 30) : CFG.interval / 1000;
    lastBuild = now;
    // broken perf counters / locked-down PowerShell: fill CPU and memory from Node itself
    let fbs = null; const fb = () => fbs || (fbs = fallback());
    const s = plat.sample() || fb();
    if (!s.cpu || s.cpu.util == null) s.cpu = fb().cpu;
    if (!s.mem || !s.mem.total) s.mem = fb().mem;
    const sock = plat.sockets();
    const SL = s.sensors || [];
    const inv = plat.inventory();

    // ---- CPU ----
    const cpu = Object.assign({ cores: [] }, s.cpu);
    cpu.temp = S.pick(SL, /^cpu$/i, 'Temperature', [/package|tctl|tdie/i, /core max/i, /average/i, /ccd/i, /core/i, /./]);
    cpu.tempSrc = cpu.temp != null ? 'sensor' : null;
    if (cpu.temp == null) { const z = SL.filter(x => x.hwType === 'Acpi' && x.type === 'Temperature' && x.value > 0).map(x => x.value); if (z.length) { cpu.temp = U.r1(Math.max(...z)); cpu.tempSrc = 'acpi'; } }
    cpu.power = S.pick(SL, /^cpu$/i, 'Power', [/package|cpu/i, /core/i]);
    cpu.voltage = S.pick(SL, /^cpu$/i, 'Voltage', [/core|vid|vcore|svi/i]);
    if (!cpu.baseMhz) cpu.baseMhz = (inv.cpu && inv.cpu.maxMhz) || 0;
    const mem = Object.assign({}, s.mem);

    // ---- GPUs: platform + sensors + nvidia-smi ----
    const gpuHws = [...new Set(SL.filter(x => /^gpu/i.test(x.hwType)).map(x => x.hw))];
    const gpus = (s.gpus || []).map(g => Object.assign({ temp: null, hotspot: null, memTemp: null, power: null, clock: null, memClock: null, fan: null, fanPct: null, engines: {} }, g));
    for (const g of gpus) {
      const hw = gpuHws.find(h => sameName(h, g.name)) || (gpuHws.length === 1 && gpus.length === 1 ? gpuHws[0] : null);
      if (!hw) continue;
      const L = SL.filter(x => x.hw === hw);
      const p = (type, rxs) => S.pick(L, /./, type, rxs);
      g.temp = p('Temperature', [/^gpu core$/i, /core|edge/i, /^gpu$/i, /./]);
      g.hotspot = p('Temperature', [/hot ?spot|junction/i]);
      g.memTemp = p('Temperature', [/mem/i]);
      g.power = p('Power', [/package|total|board|ppt|gpu power|ppt|average/i, /core/i, /./]);
      g.clock = p('Clock', [/core|shader|graphics|sclk/i]) || g.clock;
      g.memClock = p('Clock', [/memory|mclk/i]) || g.memClock;
      g.fan = p('Fan', [/./]);
      g.fanPct = p('Control', [/fan/i, /./]);
      if (g.util == null) g.util = p('Load', [/^gpu core$/i, /core/i]);
      g.source = (g.source || '') + ' + sensors';
    }
    if (nv.ok) {
      const nvList = gpus.filter(g => g.vendorId === 4318 || /nvidia|geforce|rtx|gtx|quadro|tesla/i.test(g.name));
      nv.gpus.forEach((n, i) => {
        let g = nvList.find(x => sameName(x.name, n.name)) || nvList[i];
        if (!g) { g = { id: 'nv' + n.index, name: n.name, util: 0, engines: {}, vramUsed: 0, vramTotal: 0 }; gpus.push(g); }
        if (n.util != null) g.util = Math.max(g.util || 0, n.util);
        if (n.vramUsed != null) g.vramUsed = n.vramUsed;
        if (n.vramTotal) g.vramTotal = n.vramTotal;
        if (n.enc != null) g.engines['video encode'] = n.enc;
        if (n.dec != null) g.engines['video decode'] = n.dec;
        Object.assign(g, { temp: n.temp, power: n.power, powerLimit: n.powerLimit, clock: n.clock, memClock: n.memClock, fanPct: n.fanPct, pstate: n.pstate, source: 'nvidia-smi' });
      });
    }
    gpus.sort((a, b) => (b.vramTotal || 0) - (a.vramTotal || 0));
    const gpuProc = s.gpuProc || new Map();

    // ---- processes ----
    const fpsInfo = fps.payload();
    const fpsBy = new Map(fpsInfo.apps.map(a => [a.pid, a.fps]));
    const self = new Set([process.pid, ...plat.selfPids(), fps.pid()].filter(Boolean));
    const procs = (s.procs || []).map(p => {
      const o = Object.assign({}, p);
      o.kind = self.has(p.pid) ? 'rigwatch' : kindOf(p.name);
      if (fpsBy.get(p.pid) > 0 && !['browser', 'system', 'comms', 'editor', 'shell'].includes(o.kind) && !/^dwm$/i.test(p.name)) o.kind = 'game';
      const g = gpuProc.get(p.pid);
      o.gpu = g ? U.r1(U.clamp(g.util, 0, 100)) : 0;
      o.vram = (g && g.vram) || nv.procs.get(p.pid) || 0;
      o.ports = sock.byPid.get(p.pid) || [];
      o.conns = sock.connsByPid.get(p.pid) || 0;
      o.fps = fpsBy.get(p.pid) || 0;
      if (o.kind === 'rigwatch') o.label = p.pid === process.pid ? 'RigWatch server' : 'RigWatch collector';
      else dev.annotate(o);
      const sig = security.signature(p.exe); if (sig) o.sig = sig;
      const fl = security.flags(p.pid); if (fl) o.flags = fl;
      return o;
    });
    lastProcs = procs;
    for (const p of procs) {
      let h = procHist.get(p.pid);
      if (!h || h.name !== p.name) { h = { name: p.name, t: [], cpu: [], mem: [] }; procHist.set(p.pid, h); }
      h.t.push(now); h.cpu.push(p.cpu); h.mem.push(p.mem);
      if (h.cpu.length > 180) { h.t.shift(); h.cpu.shift(); h.mem.shift(); }
    }
    if (now - lastHistPrune > 30000) { lastHistPrune = now; const alive = new Set(procs.map(p => p.pid)); for (const pid of procHist.keys()) if (!alive.has(pid)) procHist.delete(pid); }

    // ---- network ----
    const ifaces = s.net.ifaces || [];
    const counted = ifaces.some(i => !i.virtual) ? ifaces.filter(i => !i.virtual) : ifaces;
    const nt = { rx: 0, tx: 0, rxp: 0, txp: 0 };
    for (const i of counted) { nt.rx += i.rx || 0; nt.tx += i.tx || 0; nt.rxp += i.rxp || 0; nt.txp += i.txp || 0; }
    session.rx += nt.rx * dt; session.tx += nt.tx * dt;
    const pst = ping.stats();

    // ---- disks: storage sensors -> temps ----
    const disks = (s.disks || []).map(d => {
      if (d.temp == null) { const L = SL.filter(x => x.hwType === 'Storage' && x.type === 'Temperature' && (sameName(x.hw, d.name) || x.hw === d.id)); if (L.length) d.temp = L[0].value; }
      return d;
    });

    // ---- temps summary ----
    const temps = [];
    if (cpu.temp != null) temps.push({ label: 'CPU', value: cpu.temp, src: cpu.tempSrc });
    for (const g of gpus) { if (g.temp != null) temps.push({ label: g.name, value: g.temp, src: 'gpu' }); if (g.hotspot != null) temps.push({ label: g.name + ' hotspot', value: g.hotspot, src: 'gpu', hot: true }); }
    for (const d of disks) if (d.temp) temps.push({ label: d.name, value: d.temp, src: 'disk' });
    for (const x of SL) if (x.type === 'Temperature' && /motherboard|superio/i.test(x.hwType) && x.value > 5 && x.value < 120) temps.push({ label: x.name, value: x.value, src: 'board' });
    if (!temps.length) for (const x of SL) if (x.type === 'Temperature' && x.hwType === 'Acpi') temps.push({ label: x.hw + ' ' + x.name, value: x.value, src: 'acpi' });

    // ---- security + timeline (on every fresh socket table) ----
    if (sock.at !== lastSockAt) {
      lastSockAt = sock.at;
      security.queueSignatures(procs, sock);
      secSummary = security.analyze(procs, sock, { inv, exposed: !['127.0.0.1', 'localhost', '::1'].includes(CFG.host), host: CFG.host });
      try { e.siem.observe(procs, sock); } catch (err) { U.log('siem observe:', err.message); }
    }
    timeline.observe(procs, sock, store.settings);
    if (now - lastHealth > 10000) { lastHealth = now; dev.check(procs, sock).catch(() => {}); }

    const primary = gpus[0] || null;
    const hp = {
      t: now, cpu: cpu.util, gpu: primary ? primary.util : null, mem: mem.total ? U.r1(100 * mem.used / mem.total) : null,
      vram: primary && primary.vramTotal ? U.r1(100 * primary.vramUsed / primary.vramTotal) : null,
      rx: Math.round(nt.rx), tx: Math.round(nt.tx), rxp: Math.round(nt.rxp), txp: Math.round(nt.txp),
      dr: disks.reduce((a, d) => a + (d.read != null ? d.read : d.total || 0), 0), dw: disks.reduce((a, d) => a + (d.write || 0), 0),
      ct: cpu.temp, gt: primary ? primary.temp : null, fps: fpsInfo.main ? fpsInfo.main.fps : null,
      ping: pst ? pst.ms : null, loss: pst ? pst.loss : null, conns: sock.conns.length, swap: mem.swapTotal ? U.r1(100 * mem.swapUsed / mem.swapTotal) : null,
    };
    history.push(hp);

    const outProcs = procs.map(p => Object.assign({}, p, { cmd: U.trunc(U.redact(p.cmd), 300) }));
    const snap = {
      seq: ++seq, t: now, interval: CFG.interval, uptime: Math.round(os.uptime()), fallback: !!s.fallback,
      cpu, mem, gpus, disks, fs: s.fs || [],
      net: { ifaces, rx: Math.round(nt.rx), tx: Math.round(nt.tx), rxp: Math.round(nt.rxp), txp: Math.round(nt.txp), session: { rx: Math.round(session.rx), tx: Math.round(session.tx), since: session.since }, tcp: s.net.tcp || null, ping: pst, ephemeral: sock.conns.filter(c => c.lp >= 49152).length },
      procs: outProcs,
      ports: { listen: sock.listen, conns: sock.conns.slice(0, 3000), total: sock.conns.length, at: sock.at, names: Object.fromEntries(sock.names) },
      temps, sensors: { source: s.sensorSource || null, list: SL },
      fps: fpsInfo, battery: s.battery || [],
      docker: docker.summary(),
      dev: { health: dev.healthList(), wsl: dev.wsl },
      security: secSummary,
      status: e.status(),
      hp,
    };
    snap.alerts = { fired: alerts.evaluate(Object.assign({}, snap, { procs })), firing: alerts.firing() };
    return snap;
  }

  function tick() {
    if (building) return;
    if (Date.now() - lastBuild < CFG.interval * 0.4) return;
    building = true;
    try {
      lastSnap = build();
      lastSnapJson = JSON.stringify(lastSnap);
      broadcast('snap', lastSnapJson);
      const ev = timeline.drain();
      if (ev.length) broadcast('events', JSON.stringify(ev));
      if (lastSnap.alerts.fired.length) broadcast('alert', JSON.stringify(lastSnap.alerts.fired));
    } catch (err) { U.log('snapshot error:', err.stack || err.message); }
    building = false;
  }
  e.tick = tick;

  e.status = () => {
    const list = plat.status();
    list.push({ name: 'Hardware sensors', ok: !!(lastSnap && lastSnap.sensors.source), detail: lastSnap && lastSnap.sensors.source ? lastSnap.sensors.source + ' · ' + lastSnap.sensors.list.length + ' sensors' : (plat.caps.temps === 'LibreHardwareMonitor' ? 'waiting for the sensor library' : plat.caps.temps === 'none' ? 'not available on this OS without sudo' : 'none found'), err: '' });
    list.push({ name: 'NVIDIA (nvidia-smi)', ok: nv.ok, detail: nv.ok ? nv.gpus.length + ' GPU(s)' : nv.exe ? 'starting' : 'not found', err: nv.ok ? '' : U.trunc(nv.err, 200), optional: !nv.exe });
    if (plat.caps.fps) list.push({ name: 'FPS (PresentMon)', ok: fps.status === 'running', detail: fps.status, err: fps.status === 'running' ? '' : U.trunc(fps.err || fps.msg, 200), optional: fps.status === 'missing' });
    list.push({ name: 'Docker / Podman', ok: docker.available, detail: docker.available ? (docker.info ? 'v' + docker.info.version + ' · ' + docker.containers.length + ' containers' : 'connected') : 'not running', err: '', optional: true });
    list.push({ name: 'Ping', ok: !!ping.target, detail: ping.target || 'off', err: '' });
    try { list.push(...e.siem.status()); } catch { /* starting */ }
    const si = plat.sensorInfo ? plat.sensorInfo() : null;
    return { admin: plat.isAdmin(), collectors: list, fallback: !plat.sample(), tools: tools.state, pawnio: si ? si.pawnio : null, sensorAdmin: si ? si.admin : null };
  };

  e.staticPayload = () => ({
    version: VERSION, hostname: os.hostname(), platform: process.platform, platformLabel: plat.label, release: os.release(), arch: os.arch(), node: process.version,
    pid: process.pid, interval: CFG.interval, bind: CFG.host + ':' + CFG.port, startedAt: e.startedAt, home: CFG.home, persist: CFG.persist, lhmUrl: CFG.lhmUrl,
    caps: Object.assign({}, plat.caps, { nvidia: !!nv.exe, docker: true, tools: CFG.allowTools, control: CFG.allowControl }),
    inventory: plat.inventory(), totalMem: os.totalmem(), cores: os.cpus().length,
    elevated: plat.isAdmin(), canElevate: U.IS_WIN && !plat.isAdmin(), tools: tools.state, sensorInfo: plat.sensorInfo ? plat.sensorInfo() : null,
    metrics: Object.fromEntries(Object.entries(METRICS).map(([k, m]) => [k, { label: m.label, unit: m.unit, target: m.target || null }])),
  });

  // ---- tools (jobs) ----
  e.startTool = (tool, params = {}) => {
    if (tool === 'dockerlogs') return jobs.start('dockerlogs', 'logs ' + params.name, params, api => docker.logs(String(params.id || ''), api, params.tail));
    if (tool === 'du') return jobs.start('du', 'disk usage ' + (params.dir || ''), params, api => e.toolbox.du(params.dir, api));
    const T = TOOLS[tool];
    if (!T) throw new Error('unknown tool ' + tool);
    const title = T.title(params);
    timeline.add('action', 'info', 'tool: ' + title, {});
    return jobs.start(tool, title, params, api => T.run(params, api, { netInfo: e.netInfo, onDevices: trackDevices }));
  };
  function trackDevices(devices) {
    const known = new Map((store.knownDevices || []).map(d => [d.key, d]));
    const first = known.size === 0;
    for (const d of devices) {
      if (d.self) continue;
      const key = d.mac || d.ip;
      const k = known.get(key);
      if (!k && !first) timeline.add('lan.device', 'warn', 'New device on your network: ' + d.ip + (d.name ? ' (' + d.name + ')' : ''), { ip: d.ip, detail: (d.mac ? 'MAC ' + d.mac + (d.randomMac ? ' (randomised)' : '') : 'no MAC') + (d.ports.length ? ' · open ' + d.ports.join(', ') : '') });
      d.firstSeen = k ? k.firstSeen : Date.now(); d.known = !!k || first;
      known.set(key, { key, ip: d.ip, mac: d.mac || '', name: d.name || (k && k.name) || '', firstSeen: d.firstSeen, lastSeen: Date.now(), label: k ? k.label || '' : '' });
    }
    store.knownDevices = [...known.values()].sort((a, b) => b.lastSeen - a.lastSeen).slice(0, 500);
    save();
  }

  e.start = async () => {
    nv.start();
    await plat.start();
    ping.start(); docker.start();
    if (U.IS_WIN) {
      // fetch helpers on first run (pinned + SHA-256 verified), then start them
      tools.ensure('lhm').then(dir => { if (dir && plat.startSensors) plat.startSensors(dir); });
      tools.ensure('presentmon').then(p => fps.start(p));
    } else fps.start();
    dev.loadToolchain().catch(() => {}); dev.pollWsl();
    setInterval(() => dev.pollWsl(), 30000).unref();
    setInterval(() => { if (Date.now() - lastBuild > CFG.interval * 2.5) tick(); }, CFG.interval).unref();
    if (plat.netInfo) { setTimeout(() => e.netInfo(true).catch(() => {}), 15000).unref(); setInterval(() => e.netInfo(true).catch(() => {}), 120000).unref(); }
    timeline.add('system', 'info', 'RigWatch started', { detail: 'v' + VERSION + ' on ' + plat.label + ', Node ' + process.version });
    e.siem.start();
  };
  e.stop = () => { try { e.siem.stop(); } catch { /* exiting */ } try { plat.stop(); nv.stop(); fps.stop(); ping.stop(); docker.stop(); history.flush(); timeline.flush(); } catch { /* exiting */ } };
  return e;
}

module.exports = { createEngine };

};
__M["lib/fps.js"] = function (module, exports, require) {
'use strict';
// FPS / frame times via Intel PresentMon (Windows). Drop PresentMon*.exe next to server.js,
// into tools/ or bin/, or set PRESENTMON_PATH. Needs an elevated terminal (ETW).
const path = require('path');
const { spawn } = require('child_process');
const U = require('./util');
const { ROOT } = require('./assets');

function create(cfg, kindOf) {
  const fps = { status: U.IS_WIN ? 'missing' : 'unsupported', msg: '', exe: null, style: 2, apps: new Map(), err: '', proc: null, tries: 0, stopped: false };

  function launch() {
    if (fps.stopped) return;
    const args = cfg.presentMonArgs ? U.splitArgs(cfg.presentMonArgs)
      : fps.style === 1 ? ['-output_stdout', '-stop_existing_session', '-session_name', 'RigWatch', '-no_top']
        : ['--output_stdout', '--stop_existing_session', '--session_name', 'RigWatch', '--no_console_stats'];
    fps.status = 'starting'; fps.err = ''; fps.tries++;
    const started = Date.now();
    let gotData = false, cols = null;
    const p = spawn(fps.exe, args, { windowsHide: true });
    fps.proc = p;
    U.onLines(p.stdout, raw => {
      const line = raw.trim();
      const f = line.split(',');
      if (!cols) {
        if (!/^Application,/i.test(line)) return;
        const idx = n => f.findIndex(c => c.trim().toLowerCase() === n.toLowerCase());
        const ft = ['msBetweenPresents', 'FrameTime', 'MsBetweenPresents', 'msBetweenAppStart'].map(idx).find(i => i >= 0);
        if (ft == null) { fps.err = 'Unrecognised PresentMon columns'; return; }
        cols = { app: idx('Application'), pid: idx('ProcessID'), ft };
        fps.status = 'running';
        return;
      }
      const ft = parseFloat(f[cols.ft]);
      if (!(ft > 0 && ft < 5000)) return;
      gotData = true; fps.status = 'running';
      const pid = U.num(f[cols.pid]);
      let a = fps.apps.get(pid);
      if (!a) { a = { pid, name: (f[cols.app] || '').replace(/\.exe$/i, ''), ft: [], last: 0 }; fps.apps.set(pid, a); }
      a.ft.push(ft);
      if (a.ft.length > 4000) a.ft.splice(0, a.ft.length - 3000);
      a.last = Date.now();
    });
    p.stderr.setEncoding('utf8');
    p.stderr.on('data', d => { fps.err = (fps.err + d).slice(-800); });
    p.on('error', e => { fps.err = e.message; });
    p.on('exit', code => {
      fps.proc = null;
      if (fps.stopped) return;
      const quick = Date.now() - started < 6000 && !gotData;
      const denied = /access denied|administrative privileges|performance log users/i.test(fps.err) || code === 5;
      if (!denied && quick && fps.tries === 1 && !cfg.presentMonArgs) { fps.style = fps.style === 1 ? 2 : 1; return launch(); }
      fps.status = denied ? 'needs-admin' : 'error';
      fps.msg = denied ? 'PresentMon needs an elevated terminal (or the "Performance Log Users" group).' : 'PresentMon exited (code ' + code + ').';
      if (denied) fps.err = 'failed to start trace session: access denied';
      setTimeout(() => { fps.tries = 0; launch(); }, denied ? 300000 : 60000).unref();
    });
  }

  function stats(a, now) {
    const ft = a.ft; let sum = 0, n = 0;
    for (let i = ft.length - 1; i >= 0 && sum < 1000; i--) { sum += ft[i]; n++; }
    let s10 = 0; const win = [];
    for (let i = ft.length - 1; i >= 0 && s10 < 10000; i--) { s10 += ft[i]; win.push(ft[i]); }
    win.sort((x, y) => y - x);
    const p99 = win.length ? win[Math.floor(win.length * 0.01)] : 0;
    const p999 = win.length ? win[Math.floor(win.length * 0.001)] : 0;
    const stale = now - a.last > 1500;
    return { pid: a.pid, name: a.name, fps: stale ? 0 : U.r1(sum > 0 ? 1000 * n / sum : 0), low1: p99 ? U.r1(1000 / p99) : null, low01: p999 ? U.r1(1000 / p999) : null, ft: n ? U.r1(sum / n) : null, frames: stale ? 0 : n };
  }

  fps.start = exePath => {
    if (!U.IS_WIN || fps.proc) return;
    fps.exe = cfg.presentMon || exePath || U.findFile(/^presentmon.*\.exe$/i, [ROOT, path.join(ROOT, 'tools'), path.join(ROOT, 'bin'), process.cwd(), ...(process.env.PATH || '').split(path.delimiter)]);
    if (!fps.exe) { fps.status = 'missing'; return; }
    fps.style = /presentmon-?1\./i.test(path.basename(fps.exe)) ? 1 : 2;
    launch();
  };
  fps.stop = () => { fps.stopped = true; if (fps.proc) { try { fps.proc.kill(); } catch { /* gone */ } } };
  fps.pid = () => (fps.proc ? fps.proc.pid : 0);
  fps.payload = () => {
    const now = Date.now();
    for (const [pid, a] of fps.apps) if (now - a.last > 8000) fps.apps.delete(pid);
    const apps = [...fps.apps.values()].map(a => stats(a, now)).filter(a => a.fps > 0).sort((a, b) => b.fps - a.fps);
    const rank = a => { const k = kindOf(a.name); return k === 'app' || k === 'launcher' ? 2 : k === 'browser' || k === 'comms' || k === 'editor' ? 1 : 0; };
    const main = apps.filter(a => !/^(dwm|explorer)$/i.test(a.name)).sort((a, b) => rank(b) - rank(a) || b.frames - a.frames)[0] || null;
    const frametimes = main ? fps.apps.get(main.pid).ft.slice(-240).map(U.r1) : [];
    return { status: fps.status, msg: fps.msg, err: fps.status === 'running' ? '' : U.trunc(fps.err.trim(), 300), exe: fps.exe ? path.basename(fps.exe) : null, main: main ? Object.assign({ frametimes }, main) : null, apps: apps.slice(0, 12) };
  };
  return fps;
}

module.exports = { create };

};
__M["lib/history.js"] = function (module, exports, require) {
'use strict';
// Multi-resolution metric history: 1 s for 15 min (memory), 10 s for 24 h and 1 min for 7 days
// (both appended to ~/.rigwatch/*.ndjson so charts survive restarts).
const fs = require('fs');
const path = require('path');
const U = require('./util');

const KEYS = ['cpu', 'gpu', 'mem', 'vram', 'rx', 'tx', 'rxp', 'txp', 'dr', 'dw', 'ct', 'gt', 'fps', 'ping', 'loss', 'conns', 'swap'];
const RANGES = { '5m': 300e3, '15m': 900e3, '1h': 3600e3, '6h': 6 * 3600e3, '24h': 86400e3, '7d': 7 * 86400e3, '30d': 30 * 86400e3, '90d': 90 * 86400e3, '1y': 365 * 86400e3 };

class History {
  constructor(dir, persist) {
    this.dir = dir; this.persist = persist;
    this.tiers = [
      { name: '1s', step: 0, span: 15 * 60e3, rows: [] },
      { name: '10s', step: 10e3, span: 86400e3, rows: [], acc: null, file: 'history-10s.ndjson', pending: [] },
      { name: '1m', step: 60e3, span: 7 * 86400e3, rows: [], acc: null, file: 'history-1m.ndjson', pending: [] },
      { name: '1h', step: 3600e3, span: 365 * 86400e3, rows: [], acc: null, file: 'history-1h.ndjson', pending: [] },
    ];
    this.load();
    this.timer = setInterval(() => this.flush(), 60000); this.timer.unref();
  }
  push(point) {
    const row = [point.t, ...KEYS.map(k => (point[k] == null || Number.isNaN(point[k]) ? null : point[k]))];
    const t0 = this.tiers[0];
    t0.rows.push(row);
    while (t0.rows.length && t0.rows[0][0] < point.t - t0.span) t0.rows.shift();
    for (const tier of this.tiers.slice(1)) {
      const b = Math.floor(point.t / tier.step) * tier.step;
      if (tier.acc && tier.acc.b !== b) this.emit(tier);
      if (!tier.acc) tier.acc = { b, sum: new Array(KEYS.length).fill(0), n: new Array(KEYS.length).fill(0) };
      row.slice(1).forEach((v, i) => { if (v != null) { tier.acc.sum[i] += v; tier.acc.n[i]++; } });
    }
  }
  emit(tier) {
    const a = tier.acc; tier.acc = null;
    const row = [a.b, ...a.sum.map((s, i) => (a.n[i] ? U.r1(s / a.n[i]) : null))];
    tier.rows.push(row); tier.pending.push(row);
    while (tier.rows.length && tier.rows[0][0] < row[0] - tier.span) tier.rows.shift();
  }
  /** columns for a range: { range, step, t:[], cpu:[], ... } */
  query(range) {
    const ms = RANGES[range] || U.int(range, 0) || RANGES['15m'];
    const tier = ms <= this.tiers[0].span ? this.tiers[0] : ms <= this.tiers[1].span ? this.tiers[1] : ms <= this.tiers[2].span ? this.tiers[2] : this.tiers[3];
    const from = Date.now() - ms;
    const rows = tier.rows.filter(r => r[0] >= from);
    const out = { range, step: tier.step || 1000, t: rows.map(r => r[0]) };
    KEYS.forEach((k, i) => { out[k] = rows.map(r => r[i + 1]); });
    return out;
  }
  csv(range) {
    const q = this.query(range);
    const lines = ['time,' + KEYS.join(',')];
    q.t.forEach((t, i) => lines.push(new Date(t).toISOString() + ',' + KEYS.map(k => (q[k][i] == null ? '' : q[k][i])).join(',')));
    return lines.join('\n');
  }
  load() {
    if (!this.persist) return;
    for (const tier of this.tiers.slice(1)) {
      const file = path.join(this.dir, tier.file);
      const text = U.readText(file);
      if (!text) continue;
      const from = Date.now() - tier.span;
      let lines = 0;
      for (const line of text.split('\n')) {
        if (!line) continue; lines++;
        try { const r = JSON.parse(line); if (Array.isArray(r) && r[0] >= from && r.length === KEYS.length + 1) tier.rows.push(r); } catch { /* skip */ }
      }
      if (lines > tier.rows.length * 1.5 + 100) { try { fs.writeFileSync(file, tier.rows.map(r => JSON.stringify(r)).join('\n') + '\n'); } catch { /* ignore */ } }
    }
  }
  flush() {
    if (!this.persist) { for (const t of this.tiers) if (t.pending) t.pending = []; return; }
    try { fs.mkdirSync(this.dir, { recursive: true }); } catch { /* ignore */ }
    for (const tier of this.tiers.slice(1)) {
      if (!tier.pending.length) continue;
      try { fs.appendFileSync(path.join(this.dir, tier.file), tier.pending.map(r => JSON.stringify(r)).join('\n') + '\n'); } catch { /* ignore */ }
      tier.pending = [];
    }
  }
}

module.exports = { History, KEYS, RANGES };

};
__M["lib/jobs.js"] = function (module, exports, require) {
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

};
__M["lib/nettools.js"] = function (module, exports, require) {
'use strict';
// Network lab tools. Every tool validates its input and runs as a cancellable job.
// Only point the scanners at hosts and networks you own or are authorised to test.
const net = require('net');
const tls = require('tls');
const dns = require('dns');
const dgram = require('dgram');
const http = require('http');
const https = require('https');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');
const U = require('./util');

const TOP_PORTS = [21, 22, 23, 25, 53, 80, 81, 88, 110, 111, 135, 139, 143, 161, 389, 443, 445, 465, 514, 515, 548, 554, 587, 631, 636, 873, 993, 995, 1080, 1194, 1433, 1521, 1723, 1883, 1900, 2049, 2082, 2083, 2181, 2375, 2376, 3000, 3001, 3128, 3268, 3306, 3389, 3690, 4000, 4200, 4443, 4444, 4567, 5000, 5001, 5060, 5173, 5222, 5432, 5555, 5601, 5672, 5900, 5984, 6000, 6379, 6443, 6667, 7000, 7001, 7070, 8000, 8008, 8009, 8080, 8081, 8086, 8088, 8443, 8888, 9000, 9001, 9042, 9090, 9092, 9100, 9200, 9222, 9229, 9300, 10000, 10250, 11211, 11434, 15672, 25565, 27015, 27017, 32400, 49152, 62078];
const HTTPISH = new Set([80, 81, 3000, 3001, 4000, 4200, 5000, 5173, 7000, 8000, 8008, 8080, 8081, 8086, 8088, 8888, 9000, 9090, 9200, 10000, 11434, 32400]);
const DISCOVERY_PORTS = [80, 443, 22, 445, 139, 135, 3389, 8080, 8443, 62078, 7000, 5000, 554, 1883, 9100, 515, 8008, 8009, 53, 3000];

function parsePorts(spec) {
  spec = String(spec || 'top').trim().toLowerCase();
  if (spec === 'top' || spec === 'common') return TOP_PORTS.slice();
  if (spec === 'all') spec = '1-65535';
  const out = new Set();
  for (const part of spec.split(/[\s,]+/)) {
    if (!part) continue;
    const m = part.match(/^(\d+)(?:-(\d+))?$/);
    if (!m) throw new Error('bad port spec: ' + part);
    const a = +m[1], b = m[2] ? +m[2] : a;
    if (a < 1 || b > 65535 || b < a) throw new Error('port out of range: ' + part);
    for (let p = a; p <= b; p++) out.add(p);
  }
  return [...out];
}
function ipToInt(ip) { return ip.split('.').reduce((a, o) => (a << 8) + (+o), 0) >>> 0; }
function intToIp(n) { return [24, 16, 8, 0].map(s => (n >>> s) & 255).join('.'); }
function expandTarget(t, max = 1024) {
  t = String(t || '').trim();
  const m = t.match(/^(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,2})$/);
  if (m) {
    const bits = +m[2]; if (bits < 16 || bits > 32) throw new Error('use a /16 to /32 network');
    const base = ipToInt(m[1]) & (bits === 32 ? 0xffffffff : (~0 << (32 - bits)) >>> 0);
    const size = 2 ** (32 - bits);
    if (size > max + 2) throw new Error('network too large (max ' + max + ' hosts)');
    const out = [];
    for (let i = size > 2 ? 1 : 0; i < (size > 2 ? size - 1 : size); i++) out.push(intToIp((base + i) >>> 0));
    return out;
  }
  const r = t.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.)(\d{1,3})-(\d{1,3})$/);
  if (r) { const out = []; for (let i = +r[2]; i <= Math.min(+r[3], 255); i++) out.push(r[1] + i); return out; }
  if (!U.safeHost(t)) throw new Error('invalid host');
  return [t];
}

/** TCP connect probe -> { state: 'open'|'closed'|'filtered', ms, banner } */
function probe(host, port, timeout, banner) {
  return new Promise(resolve => {
    const t0 = Date.now();
    let done = false, data = '';
    const s = net.connect({ host, port });
    const fin = (state, err) => { if (done) return; done = true; s.destroy(); resolve({ state, ms: Date.now() - t0, banner: data.split(/\r?\n/)[0].replace(/[^\x20-\x7e]/g, '').slice(0, 140), err }); };
    s.setTimeout(timeout);
    s.on('timeout', () => (s.connecting ? fin('filtered') : fin('open')));
    s.on('error', e => fin(e.code === 'ECONNREFUSED' ? 'closed' : 'filtered', e.code));
    s.on('connect', () => {
      if (!banner) return fin('open');
      s.setTimeout(700);
      setTimeout(() => { if (!done && !data && HTTPISH.has(port)) s.write('HEAD / HTTP/1.0\r\nHost: ' + host + '\r\n\r\n'); }, 350);
      s.on('data', d => { data += d.toString('latin1'); if (data.includes('\n')) fin('open'); });
      s.on('end', () => fin('open'));
    });
  });
}
async function pool(items, n, fn, isCancelled) {
  let i = 0;
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length && !isCancelled()) { const it = items[i++]; await fn(it); } });
  await Promise.all(workers);
}

function streamCmd(api, cmd, args) {
  return new Promise(resolve => {
    api.line('$ ' + [cmd, ...args].join(' '), 'cmd');
    let p;
    try { p = spawn(cmd, args, { windowsHide: true }); } catch (e) { api.line(e.message, 'err'); return resolve(-1); }
    api.onCancel(() => { try { p.kill(); } catch { /* gone */ } });
    U.onLines(p.stdout, l => api.line(l));
    U.onLines(p.stderr, l => api.line(l, 'err'));
    p.on('error', e => { api.line(e.code === 'ENOENT' ? cmd + ' is not installed' : e.message, 'err'); resolve(-1); });
    p.on('close', code => resolve(code));
  });
}

const TOOLS = {
  ping: {
    title: p => 'ping ' + p.host,
    async run(p, api) {
      const host = U.safeHost(p.host); if (!host) throw new Error('invalid host');
      const count = U.clamp(U.int(p.count, 10), 1, 500);
      const args = U.IS_WIN ? ['-n', String(count)] : ['-c', String(count)];
      if (p.v6) args.push('-6');
      args.push(host);
      await streamCmd(api, U.IS_WIN ? 'ping.exe' : 'ping', args);
    },
  },
  trace: {
    title: p => 'traceroute ' + p.host,
    async run(p, api) {
      const host = U.safeHost(p.host); if (!host) throw new Error('invalid host');
      const hops = String(U.clamp(U.int(p.hops, 30), 1, 64));
      if (U.IS_WIN) return streamCmd(api, 'tracert.exe', ['-d', '-w', '1000', '-h', hops, host]);
      if (U.which(['traceroute'], ['/usr/sbin', '/usr/bin'])) return streamCmd(api, U.which(['traceroute'], ['/usr/sbin', '/usr/bin']), ['-n', '-w', '1', '-q', '1', '-m', hops, host]);
      return streamCmd(api, 'tracepath', ['-n', '-m', hops, host]);
    },
  },
  dns: {
    title: p => 'dns ' + (p.type || 'A') + ' ' + p.name,
    async run(p, api) {
      const name = String(p.name || '').trim();
      if (!/^[A-Za-z0-9._:-]{1,253}$/.test(name)) throw new Error('invalid name');
      const types = String(p.type || 'A').toUpperCase() === 'ALL' ? ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA', 'CAA'] : [String(p.type || 'A').toUpperCase()];
      const r = new dns.promises.Resolver({ timeout: 3000, tries: 2 });
      if (p.server) { const s = U.safeHost(p.server); if (!s) throw new Error('invalid server'); r.setServers([s]); }
      api.line('resolver: ' + r.getServers().join(', '), 'cmd');
      const out = [];
      for (const type of types) {
        const t0 = Date.now();
        try {
          let res;
          if (type === 'PTR') res = await r.reverse(name);
          else if (type === 'A' || type === 'AAAA') res = await r.resolve(name, type === 'A' ? 'A' : 'AAAA').then(a => a);
          else res = await r.resolve(name, type);
          const ms = Date.now() - t0;
          const fmt = x => {
            if (typeof x === 'string') return x;
            if (Array.isArray(x)) return x.join('');
            if (x.exchange) return x.priority + ' ' + x.exchange;
            if (x.nsname) return x.nsname + ' ' + x.hostmaster + ' serial ' + x.serial + ' refresh ' + x.refresh + ' retry ' + x.retry + ' expire ' + x.expire + ' min ' + x.minttl;
            if (x.port && x.name) return x.priority + ' ' + x.weight + ' ' + x.port + ' ' + x.name;
            if (x.issue || x.issuewild || x.iodef) return (x.critical || 0) + ' ' + Object.keys(x).filter(k => k !== 'critical')[0] + ' "' + (x.issue || x.issuewild || x.iodef) + '"';
            return JSON.stringify(x);
          };
          const rows = (Array.isArray(res) ? res : [res]).map(fmt);
          for (const row of rows) api.line(type.padEnd(6) + row);
          out.push({ type, ms, records: rows });
          api.line('  (' + rows.length + ' record' + (rows.length === 1 ? '' : 's') + ', ' + ms + ' ms)', 'dim');
        } catch (e) { api.line(type.padEnd(6) + (e.code || e.message), 'err'); out.push({ type, error: e.code || e.message }); }
      }
      return { name, answers: out };
    },
  },
  dnsbench: {
    title: p => 'DNS resolver benchmark (' + (p.name || 'example.com') + ')',
    async run(p, api) {
      const name = /^[A-Za-z0-9.-]{1,253}$/.test(p.name || '') ? p.name : 'example.com';
      const sys = dns.getServers()[0];
      const list = [['System (' + sys + ')', sys], ['Cloudflare', '1.1.1.1'], ['Google', '8.8.8.8'], ['Quad9', '9.9.9.9'], ['OpenDNS', '208.67.222.222'], ['AdGuard', '94.140.14.14']];
      const res = [];
      for (const [label, ip] of list) {
        if (api.cancelled) break;
        const r = new dns.promises.Resolver({ timeout: 2000, tries: 1 }); r.setServers([ip]);
        const times = [];
        for (let i = 0; i < 5; i++) { const t0 = process.hrtime.bigint(); try { await r.resolve4(name); times.push(Number(process.hrtime.bigint() - t0) / 1e6); } catch { times.push(null); } }
        const ok = times.filter(x => x != null);
        const row = { label, ip, min: ok.length ? U.r1(Math.min(...ok)) : null, avg: ok.length ? U.r1(ok.reduce((a, b) => a + b, 0) / ok.length) : null, max: ok.length ? U.r1(Math.max(...ok)) : null, fail: times.length - ok.length };
        res.push(row);
        api.line(label.padEnd(26) + (row.avg == null ? 'failed' : 'avg ' + row.avg + ' ms  (min ' + row.min + ', max ' + row.max + ')') + (row.fail ? '  ' + row.fail + ' failed' : ''));
      }
      res.sort((a, b) => (a.avg == null) - (b.avg == null) || a.avg - b.avg);
      if (res[0] && res[0].avg != null) api.line('fastest: ' + res[0].label, 'ok');
      return { name, resolvers: res };
    },
  },
  scan: {
    title: p => 'port scan ' + p.target,
    async run(p, api) {
      const hosts = expandTarget(p.target, 1024);
      const ports = parsePorts(p.ports);
      if (hosts.length * ports.length > 70000) throw new Error('too many probes (' + hosts.length * ports.length + '), max 70000');
      const timeout = U.clamp(U.int(p.timeout, 800), 100, 5000);
      const conc = U.clamp(U.int(p.concurrency, 300), 1, 1000);
      const banner = p.banner !== false;
      const resolved = [];
      for (const h of hosts) {
        if (net.isIP(h)) { resolved.push(h); continue; }
        try { const a = await dns.promises.lookup(h); resolved.push(a.address); api.line(h + ' → ' + a.address, 'dim'); } catch { throw new Error('cannot resolve ' + h); }
      }
      api.line('scanning ' + resolved.length + ' host(s) × ' + ports.length + ' port(s), timeout ' + timeout + ' ms, ' + conc + ' parallel', 'cmd');
      const tasks = []; for (const h of resolved) for (const port of ports) tasks.push([h, port]);
      const open = []; let done = 0; const total = tasks.length; const t0 = Date.now(); let lastP = 0;
      await pool(tasks, conc, async ([h, port]) => {
        const r = await probe(h, port, timeout, banner);
        done++;
        if (r.state === 'open') { open.push({ host: h, port, ms: r.ms, banner: r.banner }); api.line(h + ':' + port + '  open  ' + r.ms + ' ms' + (r.banner ? '  ' + r.banner : ''), 'ok'); }
        if (Date.now() - lastP > 400) { lastP = Date.now(); api.progress(Math.round(100 * done / total)); }
      }, () => api.cancelled);
      api.progress(100);
      api.line('done: ' + open.length + ' open of ' + done + ' probed in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s', 'cmd');
      return { open: open.sort((a, b) => (a.host < b.host ? -1 : a.host > b.host ? 1 : a.port - b.port)), probed: done };
    },
  },
  tls: {
    title: p => 'tls ' + p.host + ':' + (p.port || 443),
    run(p, api) {
      const host = U.safeHost(p.host); if (!host) throw new Error('invalid host');
      const port = U.clamp(U.int(p.port, 443), 1, 65535);
      const sni = p.sni ? U.safeHost(p.sni) : (net.isIP(host) ? undefined : host);
      return new Promise((resolve, reject) => {
        const t0 = Date.now();
        const s = tls.connect({ host, port, servername: sni, rejectUnauthorized: false, ALPNProtocols: ['h2', 'http/1.1'], timeout: 8000 });
        api.onCancel(() => s.destroy());
        s.on('timeout', () => { s.destroy(); reject(new Error('timeout')); });
        s.on('error', e => reject(e));
        s.on('secureConnect', () => {
          const ms = Date.now() - t0;
          const chain = []; let c = s.getPeerCertificate(true); const seen = new Set();
          while (c && c.raw && !seen.has(c.fingerprint256)) {
            seen.add(c.fingerprint256);
            let keyType = '';
            try { const x = new crypto.X509Certificate(c.raw); keyType = x.publicKey.asymmetricKeyType + (c.bits ? ' ' + c.bits : '') + (c.asn1Curve ? ' ' + c.asn1Curve : ''); } catch { /* old node */ }
            const days = Math.floor((new Date(c.valid_to) - Date.now()) / 86400000);
            chain.push({ subject: c.subject ? (c.subject.CN || c.subject.O || '') : '', subjectO: c.subject ? c.subject.O : '', issuer: c.issuer ? (c.issuer.CN || c.issuer.O || '') : '', validFrom: c.valid_from, validTo: c.valid_to, daysLeft: days, san: c.subjectaltname || '', fingerprint256: c.fingerprint256, serial: c.serialNumber, key: keyType });
            c = c.issuerCertificate;
          }
          const leaf = s.getPeerCertificate();
          const idErr = sni ? tls.checkServerIdentity(sni, leaf) : null;
          const res = { host, port, sni: sni || null, ms, protocol: s.getProtocol(), cipher: s.getCipher(), alpn: s.alpnProtocol || null, authorized: s.authorized, authError: s.authorizationError ? String(s.authorizationError) : null, hostnameOk: !idErr, hostnameError: idErr ? idErr.message : null, chain };
          s.end();
          api.line(res.protocol + '  ' + (res.cipher && res.cipher.name) + '  ALPN ' + (res.alpn || '-') + '  handshake ' + ms + ' ms', 'cmd');
          api.line(res.authorized ? 'chain trusted by Node’s CA store' : 'NOT trusted: ' + res.authError, res.authorized ? 'ok' : 'err');
          if (sni) api.line(res.hostnameOk ? 'hostname matches certificate' : 'hostname mismatch: ' + res.hostnameError, res.hostnameOk ? 'ok' : 'err');
          chain.forEach((x, i) => api.line((i === 0 ? 'leaf ' : 'ca' + i + '  ') + x.subject + '  ← ' + x.issuer + '  expires in ' + x.daysLeft + ' d', x.daysLeft < 14 ? 'err' : ''));
          resolve(res);
        });
      });
    },
  },
  http: {
    title: p => 'http ' + p.url,
    async run(p, api) {
      let url = String(p.url || '').trim();
      if (!/^https?:\/\//i.test(url)) url = 'http://' + url;
      const hops = [];
      for (let i = 0; i < 6; i++) {
        const r = await httpOnce(url, String(p.method || 'GET').toUpperCase() === 'HEAD' ? 'HEAD' : 'GET', api);
        hops.push(r);
        api.line(r.status + ' ' + url + '  (' + r.timing.total + ' ms: dns ' + r.timing.dns + ', tcp ' + r.timing.tcp + (r.timing.tls != null ? ', tls ' + r.timing.tls : '') + ', ttfb ' + r.timing.ttfb + ')', r.status < 400 ? 'ok' : 'err');
        if (r.status >= 300 && r.status < 400 && r.headers.location && p.follow !== false) { url = new URL(r.headers.location, url).href; continue; }
        break;
      }
      const last = hops[hops.length - 1];
      const H = last.headers;
      const checks = [
        ['Strict-Transport-Security', !!H['strict-transport-security'], 'forces HTTPS'],
        ['Content-Security-Policy', !!H['content-security-policy'], 'limits script/style sources'],
        ['X-Content-Type-Options', /nosniff/i.test(H['x-content-type-options'] || ''), 'blocks MIME sniffing'],
        ['X-Frame-Options / frame-ancestors', !!H['x-frame-options'] || /frame-ancestors/i.test(H['content-security-policy'] || ''), 'clickjacking protection'],
        ['Referrer-Policy', !!H['referrer-policy'], 'controls referrer leakage'],
        ['Permissions-Policy', !!H['permissions-policy'], 'restricts browser features'],
      ];
      if (/^https:/.test(url)) for (const c of checks) api.line((c[1] ? '✓ ' : '✗ ') + c[0], c[1] ? 'ok' : 'dim');
      if (H.server || H['x-powered-by']) api.line('discloses: ' + [H.server, H['x-powered-by']].filter(Boolean).join(', '), 'dim');
      return { hops, checks: checks.map(c => ({ name: c[0], ok: c[1], why: c[2] })), title: last.title };
    },
  },
  lan: {
    title: () => 'LAN discovery',
    async run(p, api, ctx) {
      const nets = [];
      for (const [name, list] of Object.entries(os.networkInterfaces())) for (const a of list || []) {
        if (a.family !== 'IPv4' && a.family !== 4) continue;
        if (a.internal || a.address.startsWith('169.254.')) continue;
        let bits = a.cidr ? +a.cidr.split('/')[1] : 24; if (bits < 22) bits = 24;
        if (/vethernet|docker|veth|br-|virbr|vmnet|vbox|tailscale|zt|utun|wsl/i.test(name)) continue;
        nets.push({ name, ip: a.address, bits, cidr: intToIp(ipToInt(a.address) & ((~0 << (32 - bits)) >>> 0)) + '/' + bits });
      }
      if (!nets.length) throw new Error('no LAN interface found');
      const found = new Map();
      for (const n of nets) {
        api.line('scanning ' + n.cidr + ' on ' + n.name + ' (' + n.ip + ')', 'cmd');
        const hosts = expandTarget(n.cidr, 1024);
        let done = 0;
        await pool(hosts, 32, async h => {
          if (h === n.ip) { found.set(h, { ip: h, self: true, ports: [], ms: 0 }); done++; return; }
          // all discovery ports at once: an open port or a RST (closed) both prove the host is up
          const rs = await Promise.all(DISCOVERY_PORTS.map(port => probe(h, port, 600, false).then(r => Object.assign(r, { port }))));
          const alive = rs.filter(r => r.state !== 'filtered');
          if (alive.length) {
            const e = { ip: h, ports: alive.filter(r => r.state === 'open').map(r => r.port), ms: Math.min(...alive.map(r => r.ms)) };
            found.set(h, e);
            api.line(h.padEnd(16) + 'up  ' + e.ms + ' ms' + (e.ports.length ? '  open ' + e.ports.join(',') : ''), 'ok');
          }
          done++;
          if (done % 8 === 0) api.progress(Math.round(100 * done / hosts.length));
        }, () => api.cancelled);
      }
      api.progress(100);
      // ARP fills in devices that ignored every probe, and gives MACs
      try {
        const info = await ctx.netInfo(true);
        const ifIps = nets.map(n => ({ base: ipToInt(n.ip) & ((~0 << (32 - n.bits)) >>> 0), mask: (~0 << (32 - n.bits)) >>> 0 }));
        for (const a of info.arp || []) {
          if (!/^\d+\.\d+\.\d+\.\d+$/.test(a.ip) || !ifIps.some(x => ((ipToInt(a.ip) & x.mask) >>> 0) === x.base)) continue;
          if (/^(01-00-5E|33-33|FF-FF)/i.test(a.mac)) continue;
          const e = found.get(a.ip) || { ip: a.ip, ports: [], ms: null, arpOnly: true };
          e.mac = a.mac; found.set(a.ip, e);
        }
        const gws = new Set((info.routes || []).filter(r => /^0\.0\.0\.0\/0$/.test(r.dest)).map(r => r.gw));
        for (const e of found.values()) if (gws.has(e.ip)) e.gateway = true;
      } catch { /* no arp access */ }
      for (const n of nets) { const e = found.get(n.ip); if (e) { const m = (os.networkInterfaces()[n.name] || []).find(a => a.address === n.ip); if (m) e.mac = m.mac.toUpperCase().replace(/:/g, '-'); } }
      const r = new dns.promises.Resolver({ timeout: 1200, tries: 1 });
      await pool([...found.values()], 24, async e => { try { e.name = (await r.reverse(e.ip))[0] || ''; } catch { e.name = ''; } }, () => api.cancelled);
      const devices = [...found.values()].sort((a, b) => ipToInt(a.ip) - ipToInt(b.ip)).map(e => Object.assign(e, { randomMac: e.mac ? /^.[26AE]/i.test(e.mac) : false }));
      api.line(devices.length + ' devices found', 'cmd');
      if (ctx.onDevices) ctx.onDevices(devices);
      return { nets, devices };
    },
  },
  wol: {
    title: p => 'wake ' + p.mac,
    async run(p, api) {
      const mac = String(p.mac || '').trim();
      if (!/^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i.test(mac)) throw new Error('invalid MAC');
      const bytes = Buffer.from(mac.replace(/[:-]/g, ''), 'hex');
      const pkt = Buffer.concat([Buffer.alloc(6, 0xff), ...Array(16).fill(bytes)]);
      const targets = new Set(['255.255.255.255']);
      for (const list of Object.values(os.networkInterfaces())) for (const a of list || []) if ((a.family === 'IPv4' || a.family === 4) && !a.internal) targets.add(intToIp((ipToInt(a.address) | (~ipToInt(a.netmask) >>> 0)) >>> 0));
      const sock = dgram.createSocket('udp4');
      await new Promise(r => sock.bind(() => { sock.setBroadcast(true); r(); }));
      for (const t of targets) { await new Promise(r => sock.send(pkt, 9, t, () => r())); api.line('magic packet → ' + t + ':9', 'ok'); }
      sock.close();
      return { sent: [...targets] };
    },
  },
  publicip: {
    title: () => 'public IP',
    async run(p, api) {
      const get = async u => { const c = new AbortController(); const t = setTimeout(() => c.abort(), 5000); try { const r = await fetch(u, { signal: c.signal }); return (await r.json()).ip; } catch { return null; } finally { clearTimeout(t); } };
      api.line('asking api.ipify.org (only on demand)', 'dim');
      const [v4, v6] = await Promise.all([get('https://api.ipify.org?format=json'), get('https://api64.ipify.org?format=json')]);
      api.line('IPv4  ' + (v4 || 'unavailable'), v4 ? 'ok' : 'err');
      api.line('IPv6  ' + (v6 && v6.includes(':') ? v6 : 'none'), v6 && v6.includes(':') ? 'ok' : 'dim');
      return { v4, v6: v6 && v6.includes(':') ? v6 : null };
    },
  },
};

function httpOnce(url, method, api) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const t = { start: Date.now() };
    const req = lib.request(u, { method, timeout: 10000, rejectUnauthorized: false, headers: { 'user-agent': 'RigWatch/2 (+local probe)', accept: '*/*' } }, res => {
      t.ttfb = Date.now();
      let body = '', size = 0;
      res.on('data', d => { size += d.length; if (body.length < 262144) body += d.toString('utf8'); });
      res.on('end', () => {
        const end = Date.now();
        const title = ((body.match(/<title[^>]*>([^<]{0,200})/i) || [])[1] || '').trim();
        resolve({ url, status: res.statusCode, httpVersion: res.httpVersion, headers: res.headers, size, title, timing: { dns: (t.lookup || t.start) - t.start, tcp: (t.connect || t.lookup || t.start) - (t.lookup || t.start), tls: t.secure ? t.secure - t.connect : null, ttfb: t.ttfb - (t.secure || t.connect || t.start), total: end - t.start } });
      });
    });
    api.onCancel(() => req.destroy(new Error('cancelled')));
    req.on('socket', s => { s.on('lookup', () => { t.lookup = Date.now(); }); s.on('connect', () => { t.connect = Date.now(); }); s.on('secureConnect', () => { t.secure = Date.now(); }); });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    req.end();
  });
}

module.exports = { TOOLS, parsePorts, expandTarget, TOP_PORTS };

};
__M["lib/nvidia.js"] = function (module, exports, require) {
'use strict';
// NVIDIA GPUs via nvidia-smi (Windows + Linux). Streams one line per GPU per interval.
const { spawn } = require('child_process');
const U = require('./util');

function create(interval) {
  const nv = { ok: false, exe: null, gpus: [], procs: new Map(), err: '', children: new Set() };
  const extra = U.IS_WIN ? ['C:\\Windows\\System32', 'C:\\Program Files\\NVIDIA Corporation\\NVSMI'] : ['/usr/bin', '/usr/local/bin', '/usr/lib/wsl/lib'];
  nv.exe = U.which(['nvidia-smi'], extra);
  const q = 'index,name,utilization.gpu,utilization.memory,memory.used,memory.total,temperature.gpu,power.draw,power.limit,clocks.gr,clocks.mem,fan.speed,pstate,utilization.encoder,utilization.decoder,pci.bus_id';
  let stopped = false;

  function launch() {
    if (stopped || !nv.exe) return;
    const p = spawn(nv.exe, ['--query-gpu=' + q, '--format=csv,noheader,nounits', '-lms', String(Math.max(500, interval))], { windowsHide: true });
    nv.children.add(p);
    const cur = new Map();
    U.onLines(p.stdout, line => {
      const f = line.split(',').map(s => s.trim());
      if (f.length < 12) return;
      const mib = v => (U.opt(v) == null ? null : U.opt(v) * 1048576);
      cur.set(U.num(f[0]), { index: U.num(f[0]), name: f[1], util: U.opt(f[2]), memUtil: U.opt(f[3]), vramUsed: mib(f[4]), vramTotal: mib(f[5]), temp: U.opt(f[6]), power: U.opt(f[7]), powerLimit: U.opt(f[8]), clock: U.opt(f[9]), memClock: U.opt(f[10]), fanPct: U.opt(f[11]), pstate: f[12], enc: U.opt(f[13]), dec: U.opt(f[14]), bus: f[15], at: Date.now() });
      nv.gpus = [...cur.values()]; nv.ok = true;
    });
    p.stderr.on('data', d => { nv.err = String(d).slice(-400); });
    p.on('error', e => { nv.err = e.message; });
    p.on('exit', () => { nv.children.delete(p); nv.ok = false; if (!stopped) setTimeout(launch, 10000).unref(); });
  }

  // per-process VRAM (compute + graphics apps) every 5 s
  async function pollProcs() {
    if (stopped || !nv.exe) return;
    const r = await U.run(nv.exe, ['--query-compute-apps=pid,used_memory', '--format=csv,noheader,nounits'], { timeout: 5000 });
    const m = new Map();
    if (r.ok) for (const line of r.stdout.split(/\r?\n/)) { const f = line.split(',').map(s => s.trim()); if (f.length >= 2 && U.num(f[0])) m.set(U.num(f[0]), (U.opt(f[1]) || 0) * 1048576); }
    nv.procs = m;
    setTimeout(pollProcs, 5000).unref();
  }

  nv.start = () => { if (nv.exe) { launch(); pollProcs(); } };
  nv.stop = () => { stopped = true; for (const c of nv.children) { try { c.kill(); } catch { /* gone */ } } };
  return nv;
}

module.exports = { create };

};
__M["lib/ping.js"] = function (module, exports, require) {
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

};
__M["lib/platform/darwin.js"] = function (module, exports, require) {
'use strict';
// macOS platform: built-in command line tools only (no sudo needed).
const os = require('os');
const path = require('path');
const fs = require('fs');
const U = require('../util');
const sockets = require('../sockets');

// ---------------------------------------------------------------------------
// pure parsers (exported for tests)
// ---------------------------------------------------------------------------
function parseVmStat(text) {
  const page = +((String(text).match(/page size of (\d+) bytes/) || [])[1] || 4096);
  const v = {};
  for (const line of String(text).split('\n')) { const m = line.match(/^"?([^":]+)"?:\s+(\d+)\.?$/); if (m) v[m[1].trim()] = +m[2] * page; }
  return { page, v };
}
function parseSwap(text) {
  const g = k => { const m = String(text).match(new RegExp(k + '\\s*=\\s*([\\d.]+)([KMGT])')); return m ? +m[1] * ({ K: 1024, M: 1048576, G: 1073741824, T: 1099511627776 })[m[2]] : 0; };
  return { total: g('total'), used: g('used') };
}
/** ps -axww -o pid=,ppid=,user=,state=,nice=,rss=,time=,etime=,comm= */
function parsePsMain(text) {
  const out = [];
  for (const line of String(text).split('\n')) {
    const m = line.trim().match(/^(\d+)\s+(\d+)\s+(\S+)\s+(\S+)\s+(-?\d+|-)\s+(\d+)\s+(\S+)\s+(\S+)\s+(.+)$/);
    if (!m) continue;
    out.push({ pid: +m[1], ppid: +m[2], user: m[3], state: m[4], nice: m[5] === '-' ? 0 : +m[5], rss: +m[6] * 1024, cpuSec: U.parseDuration(m[7]), age: U.parseDuration(m[8]), comm: m[9] });
  }
  return out;
}
function parsePsArgs(text) {
  const m = new Map();
  for (const line of String(text).split('\n')) { const x = line.match(/^\s*(\d+)\s+(.*)$/); if (x) m.set(+x[1], x[2]); }
  return m;
}
/** iostat -Id: header with disk names, label row, one value row (KB/t xfrs MB per disk). */
function parseIostat(text) {
  const lines = String(text).split('\n').filter(l => l.trim());
  if (lines.length < 3) return [];
  const names = lines[0].trim().split(/\s+/);
  const vals = lines[lines.length - 1].trim().split(/\s+/).map(Number);
  return names.map((n, i) => ({ name: n, xfrs: vals[i * 3 + 1] || 0, mb: vals[i * 3 + 2] || 0 }));
}
function parseDf(text) {
  const out = [];
  for (const line of String(text).split('\n').slice(1)) {
    const m = line.match(/^(\S+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)%\s+(.+)$/);
    if (!m || !/^\/dev\//.test(m[1])) continue;
    if (/^\/System\/Volumes\/(VM|Preboot|Update|xarts|iSCPreboot|Hardware)/.test(m[6])) continue;
    out.push({ mount: m[6], label: path.basename(m[6]) || '/', fs: 'apfs', size: +m[2] * 1024, free: +m[4] * 1024, kind: 'local' });
  }
  return out;
}
/** netstat -ibn: only <Link#> rows carry the per-interface counters. */
function parseNetstatIb(text) {
  const out = [];
  for (const line of String(text).split('\n').slice(1)) {
    const f = line.trim().split(/\s+/);
    if (f.length < 10 || !/^<Link#\d+>$/.test(f[2])) continue;
    const c = f.slice(-7).map(x => (x === '-' ? 0 : +x));
    out.push({ name: f[0].replace(/\*$/, ''), mtu: +f[1], mac: f.length >= 11 ? f[3].toUpperCase().replace(/:/g, '-') : '', rxPackets: c[0], rxErrs: c[1], rxBytes: c[2], txPackets: c[3], txErrs: c[4], txBytes: c[5] });
  }
  return out;
}
/** lsof -nP -iTCP -iUDP -F pcPnT */
function parseLsof(text) {
  const rows = []; let pid = 0, name = '', cur = null;
  const flush = () => {
    if (!cur || !cur.n) return;
    const [l, r] = cur.n.split('->');
    const [lh, lp] = sockets.splitHostPort(l);
    const [rh, rp] = r ? sockets.splitHostPort(r) : ['*', 0];
    rows.push({ proto: cur.P === 'UDP' ? 'UDP' : 'TCP', lh, lp, rh, rp, state: cur.T || (cur.P === 'UDP' ? (r ? 'ESTABLISHED' : 'UNCONN') : ''), pid, name });
  };
  for (const line of String(text).split('\n')) {
    if (!line) continue;
    const k = line[0], v = line.slice(1);
    if (k === 'p') { flush(); cur = null; pid = +v; name = ''; }
    else if (k === 'c') name = v;
    else if (k === 'f') { flush(); cur = {}; }
    else if (cur && k === 'P') cur.P = v;
    else if (cur && k === 'n') cur.n = v;
    else if (cur && k === 'T' && v.startsWith('ST=')) cur.T = v.slice(3);
  }
  flush();
  return rows;
}
function parseIoregGpu(text) {
  const out = [];
  const re = /"PerformanceStatistics"\s*=\s*\{([^}]*)\}/g; let m;
  while ((m = re.exec(String(text)))) {
    const body = m[1];
    const g = k => { const x = body.match(new RegExp('"' + k.replace(/[%]/g, '\\$&') + '"\\s*=\\s*(\\d+)')); return x ? +x[1] : null; };
    out.push({ util: g('Device Utilization %') ?? g('GPU Activity(%)'), renderer: g('Renderer Utilization %'), tiler: g('Tiler Utilization %'), memUsed: g('In use system memory') ?? g('vramUsedBytes'), memAlloc: g('Alloc system memory') });
  }
  return out;
}
function parsePmset(text) {
  const out = [];
  for (const line of String(text).split('\n')) {
    const m = line.match(/-(\S+).*?\t(\d+)%;\s*([^;]+);\s*(\d+:\d+|\(no estimate\))?/);
    if (m) { const st = m[3].trim(); const t = (m[4] || '').match(/(\d+):(\d+)/); out.push({ name: m[1], pct: +m[2], plugged: !/discharging/.test(st), charging: /^charging/.test(st), minutes: t && /discharging/.test(st) ? +t[1] * 60 + +t[2] : null }); }
  }
  return out;
}
function parseArpMac(text) {
  const out = [];
  for (const line of String(text).split('\n')) {
    const m = line.match(/\(([\d.]+)\) at ([0-9a-f:]+) on (\S+)/i);
    if (m) out.push({ ip: m[1], mac: m[2].split(':').map(x => x.padStart(2, '0')).join('-').toUpperCase(), state: /permanent/.test(line) ? 'Permanent' : 'Reachable', iface: m[3] });
  }
  return out;
}
function parseNetstatRoutes(text) {
  const out = []; let started = false;
  for (const line of String(text).split('\n')) {
    if (/^Destination\s+Gateway/.test(line)) { started = true; continue; }
    if (!started) continue;
    const f = line.trim().split(/\s+/);
    if (f.length < 4) continue;
    out.push({ dest: f[0] === 'default' ? '0.0.0.0/0' : f[0], gw: f[1], iface: f[3], metric: 0, family: f[0].includes(':') ? 'IPv6' : 'IPv4' });
  }
  return out;
}
function parseScutilDns(text) { return [...new Set((String(text).match(/nameserver\[\d+\]\s*:\s*(\S+)/g) || []).map(s => s.split(':').slice(1).join(':').trim()))]; }
function parseLaunchctl(text) {
  const out = [];
  for (const line of String(text).split('\n').slice(1)) {
    const f = line.trim().split(/\t|\s{1,}/);
    if (f.length < 3) continue;
    out.push({ name: f[2], display: f[2], state: f[0] !== '-' ? 'Running' : 'Stopped', start: '', pid: f[0] === '-' ? 0 : +f[0], user: '', path: '', desc: f[1] !== '0' && f[1] !== '-' ? 'last exit ' + f[1] : '' });
  }
  return out;
}

// ---------------------------------------------------------------------------
function create(ctx) {
  const cfg = ctx.cfg;
  const NCPU = os.cpus().length || 1;
  const st = { data: null, prevCpu: null, prevProc: new Map(), prevNet: new Map(), prevDisk: new Map(), prevTcp: null, args: new Map(), at: 0, tick: 0, fsList: [], gpus: [], battery: [], sensors: [], inv: null, gpuNames: [], wifiDevs: new Set(), tcp: null, errs: {} };
  let sock = sockets.empty(), sockMs = 0, timer = null, sockTimer = null, stopped = false;

  function osCpu() {
    const cur = os.cpus().map(c => { const t = c.times; return { total: t.user + t.nice + t.sys + t.idle + t.irq, idle: t.idle }; });
    const p = st.prevCpu; st.prevCpu = cur;
    let ti = 0, tt = 0;
    const per = cur.map((c, i) => { const q = p && p[i]; if (!q) return 0; const dt = c.total - q.total, di = c.idle - q.idle; ti += di; tt += dt; return dt > 0 ? U.r1(U.clamp(100 * (1 - di / dt), 0, 100)) : 0; });
    return { util: tt > 0 ? U.r1(U.clamp(100 * (1 - ti / tt), 0, 100)) : 0, per };
  }

  async function slowBits() {
    const [df, pm, io] = await Promise.all([U.run('df', ['-kP'], { timeout: 5000 }), U.run('pmset', ['-g', 'batt'], { timeout: 5000 }), U.run('ioreg', ['-r', '-n', 'AppleSmartBattery'], { timeout: 5000 })]);
    if (df.ok) st.fsList = parseDf(df.stdout);
    if (pm.ok) st.battery = parsePmset(pm.stdout);
    const t = io.ok ? io.stdout.match(/"Temperature"\s*=\s*(\d+)/) : null;
    st.sensors = t ? [{ id: 'battery/temp', hw: 'Battery', hwType: 'Battery', type: 'Temperature', name: 'Battery', value: U.r1(+t[1] / 100), min: null, max: null, unit: '°C' }] : [];
  }

  async function collect() {
    const now = Date.now();
    const dt = st.at ? (now - st.at) / 1000 : cfg.interval / 1000;
    st.tick++;
    try {
      const [vm, ps, ni, ios, ior, args, tcpS] = await Promise.all([
        U.run('vm_stat', [], { timeout: 5000 }),
        U.run('ps', ['-axww', '-o', 'pid=,ppid=,user=,state=,nice=,rss=,time=,etime=,comm='], { timeout: 8000 }),
        U.run('netstat', ['-ibn'], { timeout: 5000 }),
        U.run('iostat', ['-Id'], { timeout: 5000 }),
        U.run('ioreg', ['-r', '-d', '1', '-w', '0', '-c', 'IOAccelerator'], { timeout: 5000 }),
        st.tick % 3 === 1 ? U.run('ps', ['-axww', '-o', 'pid=,args='], { timeout: 8000 }) : Promise.resolve(null),
        st.tick % 2 === 1 ? U.run('netstat', ['-s', '-p', 'tcp'], { timeout: 5000 }) : Promise.resolve(null),
      ]);
      if (args && args.ok) st.args = parsePsArgs(args.stdout);
      if (st.tick % 10 === 1) await slowBits();

      const c = osCpu();
      const cpu = { util: c.util, cores: c.per.map(u => ({ u, mhz: 0 })), mhz: (os.cpus()[0] || {}).speed || 0, load: os.loadavg().map(U.r2) };

      const total = os.totalmem();
      const { v } = parseVmStat(vm.stdout || '');
      const swap = parseSwap((await U.run('sysctl', ['-n', 'vm.swapusage'], { timeout: 3000 })).stdout);
      const wired = v['Pages wired down'] || 0, comp = v['Pages occupied by compressor'] || 0;
      const anon = v['Anonymous pages'] != null ? v['Anonymous pages'] - (v['Pages purgeable'] || 0) : (v['Pages active'] || 0);
      const cached = (v['File-backed pages'] || 0) + (v['Pages purgeable'] || 0);
      const used = Math.min(total, anon + wired + comp);
      const mem = { total, used, avail: Math.max(0, total - used), free: (v['Pages free'] || 0) + (v['Pages speculative'] || 0), cached, wired, compressed: comp, swapTotal: swap.total, swapUsed: swap.used };
      mem.breakdown = [['App', anon], ['Wired', wired], ['Compressed', comp], ['Cached', cached], ['Free', mem.free]];

      const procs = [];
      const alive = new Set();
      for (const p of parsePsMain(ps.stdout || '')) {
        alive.add(p.pid);
        const prev = st.prevProc.get(p.pid);
        const cpuPct = prev && prev.age <= p.age && dt > 0 ? U.clamp(100 * (p.cpuSec - prev.cpuSec) / dt / NCPU, 0, 100) : 0;
        st.prevProc.set(p.pid, { cpuSec: p.cpuSec, age: p.age });
        const cmd = st.args.get(p.pid) || p.comm;
        procs.push({ pid: p.pid, ppid: p.ppid, name: path.basename(p.comm), user: p.user, cpu: U.r1(cpuPct), mem: p.rss, ws: p.rss, priv: null, io: 0, ior: 0, iow: 0, thr: null, hnd: null, age: Math.round(p.age), prio: p.nice >= 15 ? 'idle' : p.nice > 0 ? 'below' : p.nice <= -10 ? 'high' : p.nice < 0 ? 'above' : 'normal', nice: p.nice, exe: p.comm.startsWith('/') ? p.comm : '', cmd, start: 0, state: /T/.test(p.state) ? 'suspended' : /Z/.test(p.state) ? 'zombie' : '' });
      }
      for (const pid of st.prevProc.keys()) if (!alive.has(pid)) st.prevProc.delete(pid);
      cpu.procs = procs.length;

      const osIfs = os.networkInterfaces();
      const ifaces = parseNetstatIb(ni.stdout || '').filter(n => n.name !== 'lo0').map(n => {
        const p = st.prevNet.get(n.name); st.prevNet.set(n.name, n);
        const rate = (a, b) => (p && a >= b ? (a - b) / dt : 0);
        const addrs = (osIfs[n.name] || []).filter(a => !a.internal).map(a => a.address);
        return { name: n.name, desc: n.name, mac: n.mac, mtu: n.mtu, status: addrs.length ? 'Up' : 'Down', up: addrs.length > 0, virtual: /^(utun|awdl|llw|bridge|gif|stf|anpi|ap\d|vmenet|vnic)/.test(n.name), wireless: st.wifiDevs.has(n.name), ipv4: addrs.filter(a => !a.includes(':')), ipv6: addrs.filter(a => a.includes(':')).slice(0, 3), rx: Math.round(rate(n.rxBytes, p && p.rxBytes)), tx: Math.round(rate(n.txBytes, p && p.txBytes)), rxp: U.r1(rate(n.rxPackets, p && p.rxPackets)), txp: U.r1(rate(n.txPackets, p && p.txPackets)), speed: 0, rxTot: n.rxBytes, txTot: n.txBytes, rxpTot: n.rxPackets, txpTot: n.txPackets, errors: n.rxErrs + n.txErrs, drops: 0 };
      }).filter(i => i.up || i.rxTot > 0);

      if (tcpS && tcpS.ok) {
        const sent = +((tcpS.stdout.match(/(\d+) packets sent/) || [])[1] || 0);
        const retr = +((tcpS.stdout.match(/(\d+) data packets? \([\d]+ bytes\) retransmitted/) || [])[1] || 0);
        const p = st.prevTcp; st.prevTcp = { sent, retr, t: now };
        if (p) { const d = (now - p.t) / 1000; const segs = Math.max(0, (sent - p.sent) / d), rt = Math.max(0, (retr - p.retr) / d); st.tcp = { est: 0, segs: Math.round(segs), retrans: U.r1(rt), retransPct: segs + rt > 0 ? U.r2(100 * rt / (segs + rt)) : 0 }; }
      }
      const tcp = st.tcp ? Object.assign({}, st.tcp, { est: sock.conns.filter(x => x.proto === 'TCP' && x.state === 'ESTABLISHED').length }) : null;

      const disks = parseIostat(ios.stdout || '').map(d => {
        const p = st.prevDisk.get(d.name); st.prevDisk.set(d.name, d);
        return { id: d.name, name: d.name, letters: '/dev/' + d.name, media: 'SSD', size: null, temp: null, read: null, write: null, total: p ? Math.round(Math.max(0, d.mb - p.mb) * 1048576 / dt) : 0, rIops: null, wIops: null, iops: p ? Math.round(Math.max(0, d.xfrs - p.xfrs) / dt) : 0, active: null, latMs: null };
      });

      const gs = parseIoregGpu(ior.stdout || '');
      const gpus = gs.map((g, i) => ({ id: 'gpu' + i, name: st.gpuNames[i] || 'GPU ' + i, util: g.util, engines: g.renderer != null ? { renderer: g.renderer, tiler: g.tiler } : {}, vramUsed: g.memUsed || 0, vramTotal: 0, source: 'IOAccelerator' }));

      st.data = { t: now, cpu, mem, gpus, gpuProc: new Map(), disks, fs: st.fsList, net: { ifaces, tcp }, procs, sensors: st.sensors, sensorSource: st.sensors.length ? 'IOKit' : null, battery: st.battery };
      st.at = now; st.errs.collect = '';
    } catch (e) { st.errs.collect = e.message; }
    if (ctx.onTick) ctx.onTick();
    if (!stopped) timer = setTimeout(collect, Math.max(100, cfg.interval - (Date.now() - now)));
  }

  async function pollSockets() {
    const t0 = Date.now();
    const r = await U.run('lsof', ['-nP', '-iTCP', '-iUDP', '-F', 'pcPnT'], { timeout: 15000 });
    if (r.ok || r.stdout) { sock = sockets.build(parseLsof(r.stdout)); sockMs = Date.now() - t0; } else { sock.ok = false; sock.err = r.stderr; }
    if (!stopped) sockTimer = setTimeout(pollSockets, 5000);
  }

  async function init() {
    const q = async k => (await U.run('sysctl', ['-n', k], { timeout: 3000 })).stdout.trim();
    const [brand, model, phys, logical, prodName, prodVer, build] = await Promise.all([q('machdep.cpu.brand_string'), q('hw.model'), q('hw.physicalcpu'), q('hw.logicalcpu'), U.run('sw_vers', ['-productName']), U.run('sw_vers', ['-productVersion']), U.run('sw_vers', ['-buildVersion'])]);
    let video = [];
    const sp = await U.run('system_profiler', ['SPDisplaysDataType', '-json'], { timeout: 20000 });
    try { video = (JSON.parse(sp.stdout).SPDisplaysDataType || []).map(d => ({ name: d.sppci_model || d._name, cores: d.sppci_cores || null, vendor: d.spdisplays_vendor || '', vram: d.spdisplays_vram || d.spdisplays_vram_shared || '' })); } catch { /* old macOS */ }
    st.gpuNames = video.map(v => v.name);
    const hp = await U.run('networksetup', ['-listallhardwareports'], { timeout: 8000 });
    for (const m of hp.stdout.matchAll(/Hardware Port:\s*(Wi-?Fi|AirPort)[^\n]*\nDevice:\s*(\S+)/gi)) st.wifiDevs.add(m[2]);
    st.inv = {
      platform: 'darwin',
      os: { caption: (prodName.stdout.trim() || 'macOS') + ' ' + prodVer.stdout.trim(), version: prodVer.stdout.trim(), build: build.stdout.trim(), kernel: os.release(), arch: os.arch(), bootMs: Date.now() - os.uptime() * 1000 },
      cpu: { name: brand || (os.cpus()[0] || {}).model, cores: +phys || null, threads: +logical || NCPU, maxMhz: null },
      system: { manufacturer: 'Apple', model }, board: null, bios: null, ram: [], video: video.map(v => ({ name: v.name, driver: '', hz: 0 })), gpus: video.map(v => ({ name: v.name, vram: 0 })),
      isAdmin: process.getuid ? process.getuid() === 0 : false, secureBoot: null,
    };
  }

  return {
    id: 'darwin', label: 'macOS',
    caps: { temps: 'none', fps: false, gpuProc: false, services: true, startup: true, suspend: true, priority: true, affinity: false, signatures: false, dnsCache: false, wifi: false, firewall: true, wsl: false, procInfo: true },
    async start() { init().catch(() => {}); collect(); pollSockets(); },
    stop() { stopped = true; clearTimeout(timer); clearTimeout(sockTimer); },
    sample: () => st.data,
    inventory: () => st.inv || { platform: 'darwin', os: { caption: 'macOS', kernel: os.release() }, cpu: { name: (os.cpus()[0] || {}).model, threads: NCPU }, ram: [], video: [], gpus: [] },
    sockets: () => sock,
    selfPids: () => [],
    isAdmin: () => (process.getuid ? process.getuid() === 0 : false),
    status: () => [
      { name: 'ps / vm_stat / netstat / iostat', ok: !!st.data && !st.errs.collect, detail: st.data ? st.data.procs.length + ' processes' : '', err: st.errs.collect || '' },
      { name: 'Sockets (lsof)', ok: sock.ok, detail: sockMs ? sockMs + ' ms' : '', err: sock.err || 'Without sudo, only your own processes’ sockets are visible.' },
    ],
    async netInfo() {
      const [arp, rt, dns, fw] = await Promise.all([U.run('arp', ['-an'], { timeout: 8000 }), U.run('netstat', ['-rn', '-f', 'inet'], { timeout: 8000 }), U.run('scutil', ['--dns'], { timeout: 8000 }), U.run('/usr/libexec/ApplicationFirewall/socketfilterfw', ['--getglobalstate'], { timeout: 5000 })]);
      return { arp: parseArpMac(arp.stdout), routes: parseNetstatRoutes(rt.stdout), dns: [{ iface: 'scutil', family: 'any', servers: parseScutilDns(dns.stdout) }], profiles: [], firewall: fw.ok ? [{ name: 'Application Firewall', enabled: /enabled/i.test(fw.stdout), inbound: '', outbound: '' }] : [], defender: null, wifi: [] };
    },
    async services() { const r = await U.run('launchctl', ['list'], { timeout: 10000 }); if (!r.ok) throw new Error(r.stderr || 'launchctl failed'); return parseLaunchctl(r.stdout); },
    async serviceAction(name, action) {
      if (!/^[\w.@-]+$/.test(name)) throw new Error('bad name');
      const uid = process.getuid ? process.getuid() : 501;
      const args = action === 'restart' ? ['kickstart', '-k', 'gui/' + uid + '/' + name] : action === 'stop' ? ['stop', name] : action === 'start' ? ['start', name] : null;
      if (!args) throw new Error('bad action');
      const r = await U.run('launchctl', args, { timeout: 15000 });
      if (!r.ok) throw new Error(r.stderr.trim() || 'launchctl failed');
      return 'ok';
    },
    async startup() {
      const out = [];
      for (const dir of [path.join(os.homedir(), 'Library/LaunchAgents'), '/Library/LaunchAgents', '/Library/LaunchDaemons']) {
        let files = []; try { files = fs.readdirSync(dir); } catch { /* none */ }
        for (const f of files) if (f.endsWith('.plist')) out.push({ name: f.replace(/\.plist$/, ''), cmd: '', location: dir, user: dir.startsWith('/Library/LaunchDaemons') ? 'root' : dir.startsWith('/Library') ? 'all users' : os.userInfo().username, kind: dir.includes('Daemons') ? 'launch daemon' : 'launch agent' });
      }
      return out;
    },
    async procInfo(pid) { const r = await U.run('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn'], { timeout: 5000 }); const cwd = (r.stdout.match(/^n(.+)$/m) || [])[1] || null; return { pid, cwd }; },
    async cwd(pid) { const r = await U.run('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn'], { timeout: 5000 }); return (r.stdout.match(/^n(.+)$/m) || [])[1] || null; },
    async kill(pid, o = {}) { process.kill(pid, o.force ? 'SIGKILL' : 'SIGTERM'); return 'sent ' + (o.force ? 'SIGKILL' : 'SIGTERM'); },
    async suspend(pid) { process.kill(pid, 'SIGSTOP'); return 'stopped (SIGSTOP)'; },
    async resume(pid) { process.kill(pid, 'SIGCONT'); return 'continued (SIGCONT)'; },
    async priority(pid, level) { const nice = { idle: 19, below: 10, normal: 0, above: -5, high: -10 }[level]; if (nice == null) throw new Error('bad level'); os.setPriority(pid, nice); return 'nice ' + nice; },
    async reveal(file) { const r = await U.run('open', ['-R', file], { timeout: 5000 }); if (!r.ok) throw new Error('open -R failed'); return 'opened'; },
  };
}

module.exports = { create, parseVmStat, parseSwap, parsePsMain, parsePsArgs, parseIostat, parseDf, parseNetstatIb, parseLsof, parseIoregGpu, parsePmset, parseArpMac, parseNetstatRoutes, parseScutilDns, parseLaunchctl };

};
__M["lib/platform/index.js"] = function (module, exports, require) {
'use strict';
/**
 * Platform contract (every module returns this shape):
 *   id, label, caps{...}
 *   start(), stop()
 *   sample()     -> { t, cpu, mem, gpus, gpuProc:Map, disks, fs, net:{ifaces,tcp}, procs, sensors, sensorSource, battery } | null
 *   sockets()    -> { listen, conns, byPid, connsByPid, names, at, ok, err }   (see lib/sockets.js)
 *   inventory(), status() -> [{name, ok, detail, err}], selfPids(), isAdmin()
 *   async: netInfo(), services(), serviceAction(), startup(), procInfo(), kill(), suspend(), resume(),
 *          priority(), affinity(), reveal(), [dnsCache(), signatures(), wsl(), wslAction(), cwd()]
 */
const os = require('os');

function generic(ctx) {
  let prev = null, timer = null;
  function sample() {
    const cur = os.cpus().map(c => { const t = c.times; return { total: t.user + t.nice + t.sys + t.idle + t.irq, idle: t.idle }; });
    let ti = 0, tt = 0;
    const per = cur.map((c, i) => { const p = prev && prev[i]; if (!p) return 0; const dt = c.total - p.total, di = c.idle - p.idle; ti += di; tt += dt; return dt > 0 ? Math.round(1000 * (1 - di / dt)) / 10 : 0; });
    prev = cur;
    const total = os.totalmem(), free = os.freemem();
    return { t: Date.now(), cpu: { util: tt > 0 ? Math.round(1000 * (1 - ti / tt)) / 10 : 0, cores: per.map(u => ({ u, mhz: 0 })), mhz: (os.cpus()[0] || {}).speed || 0, load: os.loadavg() }, mem: { total, avail: free, used: total - free, free }, gpus: [], gpuProc: new Map(), disks: [], fs: [], net: { ifaces: [], tcp: null }, procs: [], sensors: [], sensorSource: null, battery: [] };
  }
  const unsupported = () => Promise.reject(new Error('not supported on ' + process.platform));
  return {
    id: process.platform, label: process.platform, caps: {},
    start() { timer = setInterval(() => ctx.onTick && ctx.onTick(), ctx.cfg.interval); },
    stop() { clearInterval(timer); },
    sample, sockets: () => require('../sockets').empty(), selfPids: () => [], isAdmin: () => false,
    inventory: () => ({ platform: process.platform, os: { caption: os.type() + ' ' + os.release(), kernel: os.release() }, cpu: { name: (os.cpus()[0] || {}).model, threads: os.cpus().length }, ram: [], video: [], gpus: [] }),
    status: () => [{ name: 'os module (basic)', ok: true, detail: 'only CPU and memory on this platform', err: '' }],
    netInfo: unsupported, services: unsupported, serviceAction: unsupported, startup: unsupported, procInfo: unsupported,
    kill: async (pid, o = {}) => { process.kill(pid, o.force ? 'SIGKILL' : 'SIGTERM'); return 'signal sent'; },
    suspend: unsupported, resume: unsupported, priority: unsupported, affinity: unsupported, reveal: unsupported,
  };
}

function create(ctx) {
  switch (process.platform) {
    case 'win32': return require('./win').create(ctx);
    case 'linux': return require('./linux').create(ctx);
    case 'darwin': return require('./darwin').create(ctx);
    default: return generic(ctx);
  }
}

module.exports = { create };

};
__M["lib/platform/linux.js"] = function (module, exports, require) {
'use strict';
// Linux platform: /proc and /sys only (plus `ss`, `systemctl`, `taskset` when present).
const fs = require('fs');
const fsp = fs.promises;
const os = require('os');
const path = require('path');
const U = require('../util');
const sockets = require('../sockets');

// ---------------------------------------------------------------------------
// pure parsers (exported for tests)
// ---------------------------------------------------------------------------
function parseProcStat(text) {
  const cpus = []; let total = null; const r = {};
  for (const line of String(text).split('\n')) {
    const f = line.trim().split(/\s+/);
    if (/^cpu\d*$/.test(f[0])) {
      const v = f.slice(1).map(Number);
      const [user = 0, nice = 0, sys = 0, idle = 0, iowait = 0, irq = 0, softirq = 0, steal = 0] = v;
      const o = { idle: idle + iowait, busy: user + nice + sys + irq + softirq + steal, iowait, irq: irq + softirq };
      o.total = o.idle + o.busy;
      if (f[0] === 'cpu') total = o; else cpus[+f[0].slice(3)] = o;
    } else if (f[0] === 'ctxt') r.ctxt = +f[1];
    else if (f[0] === 'intr') r.intr = +f[1];
    else if (f[0] === 'procs_running') r.running = +f[1];
    else if (f[0] === 'procs_blocked') r.blocked = +f[1];
    else if (f[0] === 'processes') r.forks = +f[1];
  }
  return Object.assign(r, { total, cpus: cpus.filter(Boolean) });
}

function parseMeminfo(text) {
  const m = {};
  for (const line of String(text).split('\n')) {
    const x = line.match(/^([\w()]+):\s+(\d+)(\s+kB)?/);
    if (x) m[x[1]] = +x[2] * (x[3] ? 1024 : 1);
  }
  return m;
}

function parsePidStat(text) {
  const a = text.indexOf('('), b = text.lastIndexOf(')');
  if (a < 0 || b < 0) return null;
  const f = text.slice(b + 2).trim().split(/\s+/);
  return { pid: +text.slice(0, a).trim(), comm: text.slice(a + 1, b), state: f[0], ppid: +f[1], majflt: +f[9], utime: +f[11], stime: +f[12], priority: +f[15], nice: +f[16], threads: +f[17], starttime: +f[19], vsize: +f[20], rss: +f[21] };
}

function parseNetDev(text) {
  const out = [];
  for (const line of String(text).split('\n').slice(2)) {
    const i = line.indexOf(':'); if (i < 0) continue;
    const f = line.slice(i + 1).trim().split(/\s+/).map(Number);
    out.push({ name: line.slice(0, i).trim(), rxBytes: f[0], rxPackets: f[1], rxErrs: f[2], rxDrop: f[3], txBytes: f[8], txPackets: f[9], txErrs: f[10], txDrop: f[11] });
  }
  return out;
}

function parseSnmp(text) {
  const lines = String(text).split('\n'); const out = {};
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].startsWith('Tcp:') && lines[i + 1].startsWith('Tcp:')) {
      const k = lines[i].trim().split(/\s+/).slice(1), v = lines[i + 1].trim().split(/\s+/).slice(1).map(Number);
      k.forEach((kk, j) => { out[kk] = v[j]; });
      break;
    }
  }
  return out;
}

function parseDiskstats(text) {
  const out = [];
  for (const line of String(text).split('\n')) {
    const f = line.trim().split(/\s+/);
    if (f.length < 14) continue;
    out.push({ name: f[2], reads: +f[3], readSectors: +f[5], readMs: +f[6], writes: +f[7], writeSectors: +f[9], writeMs: +f[10], inFlight: +f[11], ioMs: +f[12] });
  }
  return out;
}

function compress6(s) {
  const g = s.split(':'); let best = -1, bl = 0;
  for (let i = 0; i < g.length;) {
    if (g[i] === '0') { let j = i; while (j < g.length && g[j] === '0') j++; if (j - i > bl) { best = i; bl = j - i; } i = j; } else i++;
  }
  if (bl < 2) return g.join(':');
  return g.slice(0, best).join(':') + '::' + g.slice(best + bl).join(':');
}
/** /proc/net hex address -> printable IP (little-endian 32-bit words). */
function hexIp(h) {
  if (h.length === 8) return [3, 2, 1, 0].map(i => parseInt(h.substr(i * 2, 2), 16)).join('.');
  let full = '';
  for (let w = 0; w < 4; w++) { const g = h.substr(w * 8, 8); full += g.substr(6, 2) + g.substr(4, 2) + g.substr(2, 2) + g.substr(0, 2); }
  full = full.toLowerCase();
  if (full.startsWith('00000000000000000000ffff')) { const v4 = full.substr(24); return '::ffff:' + [0, 2, 4, 6].map(i => parseInt(v4.substr(i, 2), 16)).join('.'); }
  const groups = [];
  for (let i = 0; i < 32; i += 4) groups.push(full.substr(i, 4).replace(/^0+(?=.)/, ''));
  return compress6(groups.join(':'));
}
const TCP_ST = { '01': 'ESTABLISHED', '02': 'SYN_SENT', '03': 'SYN_RECV', '04': 'FIN_WAIT1', '05': 'FIN_WAIT2', '06': 'TIME_WAIT', '07': 'CLOSED', '08': 'CLOSE_WAIT', '09': 'LAST_ACK', '0A': 'LISTEN', '0B': 'CLOSING' };
function parseProcNet(text, proto) {
  const rows = [];
  for (const line of String(text).split('\n').slice(1)) {
    const f = line.trim().split(/\s+/);
    if (f.length < 10) continue;
    const [la, lpx] = f[1].split(':'), [ra, rpx] = f[2].split(':');
    const st = f[3].toUpperCase();
    const state = proto === 'UDP' ? (st === '07' ? 'UNCONN' : 'ESTABLISHED') : (TCP_ST[st] || st);
    rows.push({ proto, lh: hexIp(la), lp: parseInt(lpx, 16), rh: hexIp(ra), rp: parseInt(rpx, 16), state, uid: +f[7], inode: +f[9], pid: 0 });
  }
  return rows;
}

/** `ss -tunap` output -> socket rows with pid/name when visible. */
function parseSs(text) {
  const rows = [];
  for (const line of String(text).split('\n')) {
    const f = line.trim().split(/\s+/);
    if (f.length < 6) continue;
    const proto = f[0] === 'tcp' ? 'TCP' : f[0] === 'udp' ? 'UDP' : null;
    if (!proto) continue;
    const [lh, lp] = sockets.splitHostPort(f[4]);
    const [rh, rp] = sockets.splitHostPort(f[5]);
    const m = line.match(/users:\(\("([^"]*)",pid=(\d+)/);
    rows.push({ proto, lh, lp, rh, rp, state: f[1], pid: m ? +m[2] : 0, name: m ? m[1] : '' });
  }
  return rows;
}

function parseArp(text) {
  const out = [];
  for (const line of String(text).split('\n').slice(1)) {
    const f = line.trim().split(/\s+/);
    if (f.length < 6 || f[2] === '0x0') continue;
    out.push({ ip: f[0], mac: f[3].toUpperCase().replace(/:/g, '-'), state: f[2] === '0x6' ? 'Permanent' : 'Reachable', iface: f[5] });
  }
  return out;
}

function parseRoute(text) {
  const out = [];
  const ip = h => [3, 2, 1, 0].map(i => parseInt(h.substr(i * 2, 2), 16)).join('.');
  const bits = h => parseInt(h, 16).toString(2).split('').filter(c => c === '1').length;
  for (const line of String(text).split('\n').slice(1)) {
    const f = line.trim().split(/\s+/);
    if (f.length < 8) continue;
    out.push({ dest: ip(f[1]) + '/' + bits(f[7]), gw: ip(f[2]), iface: f[0], metric: +f[6], family: 'IPv4' });
  }
  return out;
}

function parseResolv(text) {
  return String(text || '').split('\n').map(l => l.trim().match(/^nameserver\s+(\S+)/)).filter(Boolean).map(m => m[1]);
}

function parseSystemctl(text) {
  const out = [];
  for (const line of String(text).split('\n')) {
    const f = line.trim().replace(/^●\s*/, '').split(/\s+/);
    if (f.length < 4 || !/\.service$/.test(f[0])) continue;
    out.push({ name: f[0], display: f.slice(4).join(' ') || f[0], load: f[1], state: f[2] === 'active' ? (f[3] === 'running' ? 'Running' : f[3]) : f[2] === 'failed' ? 'Failed' : 'Stopped', sub: f[3] });
  }
  return out;
}

const HW_TYPES = [[/k10temp|coretemp|zenpower|cpu_thermal|cpu-thermal|soc_thermal|x86_pkg|cpu/i, 'Cpu'], [/amdgpu|radeon/i, 'GpuAmd'], [/nouveau/i, 'GpuNvidia'], [/i915|^xe$/i, 'GpuIntel'], [/nvme|drivetemp|sata/i, 'Storage'], [/acpitz|pch_|nct|it87|asus|dell_smm|thinkpad|f71|w83|gigabyte|msi/i, 'Motherboard'], [/iwlwifi|ath|mt7|wifi|r8169/i, 'Network'], [/bat|battery/i, 'Battery']];
const hwType = name => (HW_TYPES.find(([rx]) => rx.test(name)) || [null, 'Other'])[1];

// ---------------------------------------------------------------------------
async function ls(dir) { try { return await fsp.readdir(dir); } catch { return []; } }
async function rd(p) { return U.readTextAsync(p); }
async function link(p) { try { return await fsp.readlink(p); } catch { return null; } }

function create(ctx) {
  const cfg = ctx.cfg;
  const NCPU = os.cpus().length || 1;
  let CLK = 100, PAGE = 4096;
  const st = { data: null, prevCpu: null, prevProc: new Map(), prevNet: new Map(), prevDisk: new Map(), prevSnmp: null, prevCtx: null, prevIntr: null, prevMaj: null, at: 0, tick: 0, ifInfo: new Map(), fsList: [], users: new Map(), sensors: [], gpus: [], battery: [], procMeta: new Map(), cwd: new Map(), errs: {} };
  let sock = sockets.empty(), sockMs = 0, sockMode = '';
  let timer = null, sockTimer = null, stopped = false;
  const ssExe = U.which(['ss'], ['/usr/sbin', '/usr/bin', '/sbin', '/bin']);

  async function init() {
    const a = await U.run('getconf', ['CLK_TCK'], { timeout: 3000 }); if (a.ok && +a.stdout > 0) CLK = +a.stdout;
    const b = await U.run('getconf', ['PAGESIZE'], { timeout: 3000 }); if (b.ok && +b.stdout > 0) PAGE = +b.stdout;
  }
  async function loadUsers() {
    const t = await rd('/etc/passwd');
    if (t) for (const line of t.split('\n')) { const f = line.split(':'); if (f.length > 3) st.users.set(+f[2], f[0]); }
  }

  async function readIfInfo() {
    for (const name of await ls('/sys/class/net')) {
      const d = '/sys/class/net/' + name;
      const [speed, mtu, mac, oper, dev, wl] = await Promise.all([rd(d + '/speed'), rd(d + '/mtu'), rd(d + '/address'), rd(d + '/operstate'), link(d + '/device'), ls(d + '/wireless')]);
      st.ifInfo.set(name, { speed: speed && +speed > 0 ? +speed * 1e6 : 0, mtu: mtu ? +mtu : null, mac: mac ? mac.trim().toUpperCase().replace(/:/g, '-') : '', up: (oper || '').trim() === 'up', virtual: !dev || /^(lo|docker|veth|br-|virbr|tun|tap|wg|zt|tailscale|vmnet|cni|flannel|kube)/.test(name), wireless: wl.length > 0 || /^wl/.test(name) });
    }
  }
  async function readFs() {
    const t = await rd('/proc/mounts'); const out = [];
    const keep = /^(ext[234]|xfs|btrfs|vfat|exfat|ntfs3?|fuseblk|zfs|f2fs|jfs|reiserfs|hfsplus|apfs|9p|nfs4?|cifs|smb3|overlay)$/;
    const seen = new Set();
    if (t) for (const line of t.split('\n')) {
      const f = line.split(' ');
      if (f.length < 3 || !keep.test(f[2]) || seen.has(f[0])) continue;
      if (/^\/(snap|var\/lib\/docker|run\/user\/\d+\/doc)/.test(f[1]) || (f[2] === 'overlay' && f[1] !== '/')) continue;
      seen.add(f[0]);
      try { const s = await fsp.statfs(f[1].replace(/\\040/g, ' ')); out.push({ mount: f[1].replace(/\\040/g, ' '), label: path.basename(f[0]), fs: f[2], size: s.blocks * s.bsize, free: s.bavail * s.bsize, kind: /nfs|cifs|smb|9p/.test(f[2]) ? 'network' : 'local' }); } catch { /* no access */ }
    }
    st.fsList = out;
  }
  async function readSensors() {
    const out = [];
    for (const d of await ls('/sys/class/hwmon')) {
      const dir = '/sys/class/hwmon/' + d;
      const name = ((await rd(dir + '/name')) || d).trim();
      const files = await ls(dir);
      for (const f of files) {
        const m = f.match(/^(temp|fan|in|power|curr|freq)(\d+)_(input|average)$/);
        if (!m) continue;
        const raw = +(await rd(dir + '/' + f));
        if (!Number.isFinite(raw)) continue;
        const label = ((await rd(dir + '/' + m[1] + m[2] + '_label')) || (m[1] + m[2])).trim();
        const conv = { temp: [1000, 'Temperature', '°C'], fan: [1, 'Fan', 'RPM'], in: [1000, 'Voltage', 'V'], power: [1e6, 'Power', 'W'], curr: [1000, 'Current', 'A'], freq: [1e6, 'Clock', 'MHz'] }[m[1]];
        out.push({ id: name + '/' + d + '/' + f, hw: name, hwType: hwType(name), type: conv[1], name: label, value: U.r2(raw / conv[0]), min: null, max: null, unit: conv[2] });
      }
    }
    if (!out.some(s => s.type === 'Temperature')) {
      for (const z of await ls('/sys/class/thermal')) {
        if (!z.startsWith('thermal_zone')) continue;
        const [type, temp] = await Promise.all([rd('/sys/class/thermal/' + z + '/type'), rd('/sys/class/thermal/' + z + '/temp')]);
        if (temp && Number.isFinite(+temp)) out.push({ id: 'thermal/' + z, hw: (type || z).trim(), hwType: /x86_pkg|cpu|soc/i.test(type || '') ? 'Cpu' : 'Acpi', type: 'Temperature', name: (type || z).trim(), value: U.r1(+temp / 1000), min: null, max: null, unit: '°C' });
      }
    }
    st.sensors = out;
  }
  async function readGpus() {
    const out = [];
    for (const c of await ls('/sys/class/drm')) {
      if (!/^card\d+$/.test(c)) continue;
      const d = '/sys/class/drm/' + c + '/device';
      const vendor = ((await rd(d + '/vendor')) || '').trim();
      if (!vendor || (vendor === '0x10de' && ctx.hasNvidia && ctx.hasNvidia())) continue;
      const [busy, used, total, product] = await Promise.all([rd(d + '/gpu_busy_percent'), rd(d + '/mem_info_vram_used'), rd(d + '/mem_info_vram_total'), rd(d + '/product_name')]);
      const vname = { '0x1002': 'AMD', '0x10de': 'NVIDIA', '0x8086': 'Intel' }[vendor] || vendor;
      out.push({ id: c, name: (product && product.trim()) || (vname + ' GPU (' + c + ')'), vendor: vname, util: busy != null ? +busy : null, engines: {}, vramUsed: used ? +used : 0, vramTotal: total ? +total : 0, source: 'sysfs' });
    }
    st.gpus = out;
  }
  async function readBattery() {
    const out = [];
    for (const b of await ls('/sys/class/power_supply')) {
      const d = '/sys/class/power_supply/' + b;
      if (((await rd(d + '/type')) || '').trim() !== 'Battery') continue;
      const [cap, status, en, pw] = await Promise.all([rd(d + '/capacity'), rd(d + '/status'), rd(d + '/energy_now'), rd(d + '/power_now')]);
      const s = (status || '').trim();
      out.push({ name: b, pct: +cap || 0, plugged: s !== 'Discharging', charging: s === 'Charging', minutes: s === 'Discharging' && +pw > 0 ? Math.round(60 * (+en) / (+pw)) : null });
    }
    st.battery = out;
  }

  async function readProcs(now, dt) {
    const out = [];
    const ents = (await ls('/proc')).filter(n => /^\d+$/.test(n));
    const uptime = os.uptime();
    const alive = new Set();
    await Promise.all(ents.map(async e => {
      const pid = +e;
      const statT = await rd('/proc/' + e + '/stat');
      if (!statT) return;
      const s = parsePidStat(statT);
      if (!s) return;
      alive.add(pid);
      let meta = st.procMeta.get(pid);
      if (!meta || meta.start !== s.starttime) {
        const [cmd, status, exe] = await Promise.all([rd('/proc/' + e + '/cmdline'), rd('/proc/' + e + '/status'), link('/proc/' + e + '/exe')]);
        const uid = status ? +((status.match(/^Uid:\s+(\d+)/m) || [])[1]) : -1;
        meta = { start: s.starttime, cmd: cmd ? cmd.replace(/\0+$/, '').replace(/\0/g, ' ') : '', exe: exe || '', user: st.users.get(uid) || (uid >= 0 ? String(uid) : ''), uid };
        st.procMeta.set(pid, meta);
      }
      const ticks = s.utime + s.stime;
      const io = await rd('/proc/' + e + '/io');
      let rb = null, wb = null;
      if (io) { rb = +((io.match(/^rchar:\s+(\d+)/m) || [])[1] || 0); wb = +((io.match(/^wchar:\s+(\d+)/m) || [])[1] || 0); }
      const p = st.prevProc.get(pid);
      const same = p && p.start === s.starttime;
      const cpu = same && dt > 0 ? U.clamp(100 * ((ticks - p.ticks) / CLK) / dt / NCPU, 0, 100) : 0;
      const ior = same && rb != null && p.rb != null ? Math.max(0, (rb - p.rb) / dt) : 0;
      const iow = same && wb != null && p.wb != null ? Math.max(0, (wb - p.wb) / dt) : 0;
      st.prevProc.set(pid, { ticks, start: s.starttime, rb, wb });
      const name = s.comm || path.basename(meta.exe || '');
      out.push({
        pid, ppid: s.ppid, name, user: meta.user, cpu: U.r1(cpu), mem: s.rss * PAGE, ws: s.rss * PAGE, priv: null, io: Math.round(ior + iow), ior: Math.round(ior), iow: Math.round(iow),
        thr: s.threads, hnd: null, age: Math.max(0, Math.round(uptime - s.starttime / CLK)), prio: s.nice >= 15 ? 'idle' : s.nice > 0 ? 'below' : s.nice <= -10 ? 'high' : s.nice < 0 ? 'above' : 'normal', nice: s.nice,
        exe: meta.exe, cmd: meta.cmd || '[' + name + ']', start: 0, state: s.state === 'T' || s.state === 't' ? 'suspended' : s.state === 'Z' ? 'zombie' : s.state === 'D' ? 'disk wait' : '', kernel: !meta.cmd,
      });
    }));
    for (const pid of st.prevProc.keys()) if (!alive.has(pid)) { st.prevProc.delete(pid); st.procMeta.delete(pid); }
    return out;
  }

  async function collect() {
    const now = Date.now();
    const dt = st.at ? (now - st.at) / 1000 : cfg.interval / 1000;
    st.tick++;
    try {
      const [statT, memT, loadT, netT, snmpT, diskT, vmT] = await Promise.all(['/proc/stat', '/proc/meminfo', '/proc/loadavg', '/proc/net/dev', '/proc/net/snmp', '/proc/diskstats', '/proc/vmstat'].map(rd));
      if (st.tick % 10 === 1) { await Promise.all([readIfInfo(), readFs(), readBattery()]); if (st.tick % 60 === 1) await loadUsers(); }
      if (st.tick % 2 === 1) await Promise.all([readSensors(), readGpus()]);

      // CPU
      const ps = parseProcStat(statT || '');
      const freqs = await Promise.all(ps.cpus.map((_, i) => rd('/sys/devices/system/cpu/cpu' + i + '/cpufreq/scaling_cur_freq')));
      const pc = st.prevCpu;
      const util = (c, p) => (p && c.total > p.total ? U.r1(U.clamp(100 * (c.busy - p.busy) / (c.total - p.total), 0, 100)) : 0);
      const cpu = {
        util: ps.total ? util(ps.total, pc && pc.total) : 0,
        cores: ps.cpus.map((c, i) => ({ u: util(c, pc && pc.cpus[i]), mhz: freqs[i] ? Math.round(+freqs[i] / 1000) : 0 })),
        load: os.loadavg().map(U.r2), procs: 0, threads: 0,
        ctx: st.prevCtx != null && ps.ctxt >= st.prevCtx ? Math.round((ps.ctxt - st.prevCtx) / dt) : null,
        irq: st.prevIntr != null && ps.intr >= st.prevIntr ? Math.round((ps.intr - st.prevIntr) / dt) : null,
        iowait: ps.total && pc && pc.total ? U.r1(100 * (ps.total.iowait - pc.total.iowait) / Math.max(1, ps.total.total - pc.total.total)) : null,
        queue: ps.running != null ? Math.max(0, ps.running - 1) : null,
      };
      const mhzList = cpu.cores.map(c => c.mhz).filter(Boolean);
      cpu.mhz = mhzList.length ? Math.round(mhzList.reduce((a, b) => a + b, 0) / mhzList.length) : (os.cpus()[0] || {}).speed || 0;
      st.prevCpu = ps; st.prevCtx = ps.ctxt; st.prevIntr = ps.intr;

      // memory
      const mi = parseMeminfo(memT || '');
      const total = mi.MemTotal || os.totalmem(), avail = mi.MemAvailable != null ? mi.MemAvailable : os.freemem();
      const cached = (mi.Cached || 0) + (mi.SReclaimable || 0) - (mi.Shmem || 0);
      const mem = { total, avail, used: Math.max(0, total - avail), free: mi.MemFree || 0, cached, buffers: mi.Buffers || 0, swapTotal: mi.SwapTotal || 0, swapUsed: Math.max(0, (mi.SwapTotal || 0) - (mi.SwapFree || 0)), committed: mi.Committed_AS || null, commitLimit: mi.CommitLimit || null, dirty: mi.Dirty || 0, shmem: mi.Shmem || 0 };
      mem.breakdown = [['Used', Math.max(0, total - (mi.MemFree || 0) - cached - (mi.Buffers || 0))], ['Buffers', mi.Buffers || 0], ['Cache', Math.max(0, cached)], ['Free', mi.MemFree || 0]];
      const maj = vmT ? +((vmT.match(/^pgmajfault\s+(\d+)/m) || [])[1] || 0) : null;
      if (maj != null && st.prevMaj != null) mem.hardFaults = Math.round(Math.max(0, maj - st.prevMaj) / dt);
      st.prevMaj = maj;

      // processes
      const procs = await readProcs(now, dt);
      cpu.procs = procs.length; cpu.threads = procs.reduce((a, p) => a + (p.thr || 0), 0);

      // network
      const osIfs = os.networkInterfaces();
      const ifaces = parseNetDev(netT || '').filter(n => n.name !== 'lo').map(n => {
        const p = st.prevNet.get(n.name); st.prevNet.set(n.name, n);
        const rate = (a, b) => (p && a >= b ? (a - b) / dt : 0);
        const info = st.ifInfo.get(n.name) || {};
        const addrs = (osIfs[n.name] || []).filter(a => !a.internal).map(a => a.address);
        return { name: n.name, desc: n.name, mac: info.mac || '', mtu: info.mtu, status: info.up ? 'Up' : 'Down', up: !!info.up, virtual: info.virtual != null ? info.virtual : /^(docker|veth|br-|virbr|tun|tap|wg)/.test(n.name), wireless: !!info.wireless, ipv4: addrs.filter(a => !a.includes(':')), ipv6: addrs.filter(a => a.includes(':')).slice(0, 3), rx: Math.round(rate(n.rxBytes, p && p.rxBytes)), tx: Math.round(rate(n.txBytes, p && p.txBytes)), rxp: U.r1(rate(n.rxPackets, p && p.rxPackets)), txp: U.r1(rate(n.txPackets, p && p.txPackets)), speed: info.speed || 0, rxTot: n.rxBytes, txTot: n.txBytes, rxpTot: n.rxPackets, txpTot: n.txPackets, errors: n.rxErrs + n.txErrs, drops: n.rxDrop + n.txDrop };
      }).filter(i => i.up || i.rxTot > 0);
      const sn = parseSnmp(snmpT || ''); const psn = st.prevSnmp; st.prevSnmp = sn;
      let tcp = null;
      if (sn.CurrEstab != null) {
        const segs = psn ? Math.max(0, (sn.OutSegs - psn.OutSegs) / dt) : 0, retr = psn ? Math.max(0, (sn.RetransSegs - psn.RetransSegs) / dt) : 0;
        tcp = { est: sn.CurrEstab, segs: Math.round(segs), retrans: U.r1(retr), retransPct: segs + retr > 0 ? U.r2(100 * retr / (segs + retr)) : 0, failures: sn.AttemptFails, resets: sn.EstabResets };
      }

      // disks (whole devices only)
      const blocks = new Set((await ls('/sys/block')).filter(n => !/^(loop|ram|zram|fd|sr|md\d+p)/.test(n)));
      const disks = [];
      for (const d of parseDiskstats(diskT || '')) {
        if (!blocks.has(d.name)) continue;
        const p = st.prevDisk.get(d.name); st.prevDisk.set(d.name, d);
        let meta = st.ifInfo.get('disk:' + d.name);
        if (!meta) {
          const [model, rot, size] = await Promise.all([rd('/sys/block/' + d.name + '/device/model'), rd('/sys/block/' + d.name + '/queue/rotational'), rd('/sys/block/' + d.name + '/size')]);
          meta = { model: (model || '').trim(), rot: (rot || '').trim() === '1', size: (+size || 0) * 512 };
          st.ifInfo.set('disk:' + d.name, meta);
        }
        const dio = p ? (d.reads - p.reads) + (d.writes - p.writes) : 0;
        disks.push({ id: d.name, name: meta.model || d.name, letters: '/dev/' + d.name, media: /^nvme/.test(d.name) ? 'NVMe' : meta.rot ? 'HDD' : 'SSD', size: meta.size, temp: null, read: p ? Math.round(Math.max(0, d.readSectors - p.readSectors) * 512 / dt) : 0, write: p ? Math.round(Math.max(0, d.writeSectors - p.writeSectors) * 512 / dt) : 0, rIops: p ? Math.round((d.reads - p.reads) / dt) : 0, wIops: p ? Math.round((d.writes - p.writes) / dt) : 0, active: p ? U.r1(U.clamp(100 * (d.ioMs - p.ioMs) / (dt * 1000), 0, 100)) : 0, latMs: p && dio > 0 ? U.r2(((d.readMs - p.readMs) + (d.writeMs - p.writeMs)) / dio) : 0, queue: d.inFlight });
      }

      st.data = { t: now, cpu, mem, gpus: st.gpus, gpuProc: new Map(), disks, fs: st.fsList, net: { ifaces, tcp }, procs, sensors: st.sensors, sensorSource: st.sensors.length ? 'Linux hwmon' : null, battery: st.battery };
      st.at = now;
      st.errs.collect = '';
    } catch (e) { st.errs.collect = e.message; }
    if (ctx.onTick) ctx.onTick();
    if (!stopped) timer = setTimeout(collect, Math.max(100, cfg.interval - (Date.now() - now)));
  }

  async function pollSockets() {
    const t0 = Date.now();
    try {
      let rows = null;
      if (ssExe) {
        const r = await U.run(ssExe, ['-tunap'], { timeout: 8000 });
        if (r.ok) { rows = parseSs(r.stdout); sockMode = 'ss'; }
      }
      if (!rows) {
        rows = [];
        for (const [f, proto] of [['tcp', 'TCP'], ['tcp6', 'TCP'], ['udp', 'UDP'], ['udp6', 'UDP']]) rows.push(...parseProcNet((await rd('/proc/net/' + f)) || '', proto));
        // inode -> pid map (only visible for our own processes unless root)
        const inodes = new Map(); let budget = 30000;
        for (const pid of (await ls('/proc')).filter(n => /^\d+$/.test(n))) {
          const fds = await ls('/proc/' + pid + '/fd');
          for (const fd of fds) {
            if (--budget < 0) break;
            const l = await link('/proc/' + pid + '/fd/' + fd);
            const m = l && l.match(/^socket:\[(\d+)\]$/);
            if (m) inodes.set(+m[1], +pid);
          }
        }
        for (const r of rows) r.pid = inodes.get(r.inode) || 0;
        sockMode = '/proc/net';
      }
      sock = sockets.build(rows); sockMs = Date.now() - t0;
    } catch (e) { sock.ok = false; sock.err = e.message; }
    if (!stopped) sockTimer = setTimeout(pollSockets, 3000);
  }

  function inventory() {
    const cpuinfo = U.readText('/proc/cpuinfo') || '';
    const model = (cpuinfo.match(/^model name\s*:\s*(.+)$/m) || cpuinfo.match(/^Model\s*:\s*(.+)$/m) || cpuinfo.match(/^Hardware\s*:\s*(.+)$/m) || [])[1] || (os.cpus()[0] || {}).model;
    const cores = new Set(cpuinfo.split(/\n\s*\n/).map(b => ((b.match(/^physical id\s*:\s*(\d+)/m) || [])[1] || '0') + ':' + ((b.match(/^core id\s*:\s*(\d+)/m) || [])[1] || '')).filter(k => !k.endsWith(':'))).size;
    const maxKhz = +(U.readText('/sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_max_freq') || 0);
    const osr = U.readText('/etc/os-release') || '';
    const dmi = k => (U.readText('/sys/class/dmi/id/' + k) || '').trim() || null;
    return {
      platform: 'linux',
      os: { caption: ((osr.match(/^PRETTY_NAME="?([^"\n]+)"?/m) || [])[1]) || 'Linux', version: os.release(), kernel: os.release(), arch: os.arch(), bootMs: Date.now() - os.uptime() * 1000 },
      cpu: { name: String(model || '').trim(), cores: cores || null, threads: NCPU, maxMhz: maxKhz ? Math.round(maxKhz / 1000) : null, vendor: ((cpuinfo.match(/^vendor_id\s*:\s*(.+)$/m) || [])[1] || '').trim() },
      system: { manufacturer: dmi('sys_vendor'), model: dmi('product_name') },
      board: dmi('board_name') ? { manufacturer: dmi('board_vendor'), product: dmi('board_name') } : null,
      bios: dmi('bios_version') ? { version: dmi('bios_version'), vendor: dmi('bios_vendor') } : null,
      ram: [], video: [], gpus: st.gpus.map(g => ({ name: g.name, vram: g.vramTotal })), isAdmin: process.getuid ? process.getuid() === 0 : false,
      secureBoot: null,
    };
  }

  async function systemctl(args) { const r = await U.run('systemctl', args, { timeout: 30000 }); if (!r.ok) throw new Error((r.stderr || 'systemctl failed').trim()); return r.stdout; }

  return {
    id: 'linux', label: 'Linux',
    caps: { temps: 'hwmon', fps: false, gpuProc: false, services: !!U.which(['systemctl']), startup: true, suspend: true, priority: true, affinity: !!U.which(['taskset']), signatures: false, dnsCache: false, wifi: true, firewall: false, wsl: false, procInfo: true },
    async start() { await init(); await loadUsers(); collect(); pollSockets(); },
    stop() { stopped = true; clearTimeout(timer); clearTimeout(sockTimer); },
    sample: () => st.data, inventory,
    sockets: () => sock,
    selfPids: () => [],
    isAdmin: () => (process.getuid ? process.getuid() === 0 : false),
    status: () => [
      { name: 'procfs / sysfs collector', ok: !!st.data && !st.errs.collect, detail: st.data ? st.data.procs.length + ' processes' : '', err: st.errs.collect || '' },
      { name: 'Sockets (' + (sockMode || 'ss / procfs') + ')', ok: sock.ok, detail: sockMs ? sockMs + ' ms' : '', err: sock.err || (process.getuid && process.getuid() !== 0 ? 'Not root: sockets of other users show without a process.' : '') },
      { name: 'Sensors (hwmon)', ok: st.sensors.length > 0, detail: st.sensors.length + ' sensors', err: '' },
    ],
    async netInfo() {
      const [arpT, routeT, resolv, wl] = await Promise.all([rd('/proc/net/arp'), rd('/proc/net/route'), rd('/etc/resolv.conf'), rd('/proc/net/wireless')]);
      const wifi = [];
      if (wl) for (const line of wl.split('\n').slice(2)) { const f = line.trim().split(/\s+/); if (f.length > 3) wifi.push({ name: f[0].replace(':', ''), state: 'connected', signal: f[3].replace(/\.$/, '') + ' dBm', quality: f[2].replace(/\.$/, '') }); }
      if (wifi.length && U.which(['iwgetid'])) { const r = await U.run('iwgetid', ['-r'], { timeout: 3000 }); if (r.ok) wifi[0].ssid = r.stdout.trim(); }
      let firewall = [];
      if (U.which(['ufw'])) { const r = await U.run('ufw', ['status'], { timeout: 5000 }); if (r.ok) firewall = [{ name: 'ufw', enabled: /Status:\s*active/i.test(r.stdout), inbound: '', outbound: '' }]; }
      return { arp: parseArp(arpT || ''), routes: parseRoute(routeT || ''), dns: [{ iface: 'resolv.conf', family: 'any', servers: parseResolv(resolv) }], profiles: [], firewall, defender: null, wifi };
    },
    async services() {
      const [units, files] = await Promise.all([systemctl(['list-units', '--type=service', '--all', '--no-legend', '--no-pager', '--plain']), systemctl(['list-unit-files', '--type=service', '--no-legend', '--no-pager']).catch(() => '')]);
      const startMode = new Map(files.split('\n').map(l => l.trim().split(/\s+/)).filter(f => f.length >= 2).map(f => [f[0], f[1]]));
      return parseSystemctl(units).map(s => Object.assign(s, { start: startMode.get(s.name) || '', pid: 0, user: '', path: '', desc: s.display }));
    },
    async serviceAction(name, action) {
      if (!/^[\w@.:-]+$/.test(name) || !['start', 'stop', 'restart'].includes(action)) throw new Error('bad request');
      await systemctl([action, name]);
      return (await systemctl(['is-active', name]).catch(e => e.message)).trim();
    },
    async startup() {
      const out = [];
      try { for (const l of (await systemctl(['list-unit-files', '--type=service', '--state=enabled', '--no-legend', '--no-pager'])).split('\n')) { const f = l.trim().split(/\s+/); if (f[0]) out.push({ name: f[0], cmd: '', location: 'systemd', user: 'system', kind: 'systemd unit' }); } } catch { /* no systemd */ }
      for (const dir of [path.join(os.homedir(), '.config/autostart'), '/etc/xdg/autostart']) {
        for (const f of await ls(dir)) { if (!f.endsWith('.desktop')) continue; const t = (await rd(path.join(dir, f))) || ''; out.push({ name: ((t.match(/^Name=(.*)$/m) || [])[1]) || f, cmd: ((t.match(/^Exec=(.*)$/m) || [])[1]) || '', location: dir, user: dir.startsWith('/etc') ? 'all users' : os.userInfo().username, kind: 'autostart' }); }
      }
      const cr = await U.run('crontab', ['-l'], { timeout: 3000 });
      if (cr.ok) for (const l of cr.stdout.split('\n')) if (/^@reboot\s+/.test(l.trim())) out.push({ name: '@reboot', cmd: l.trim().replace(/^@reboot\s+/, ''), location: 'crontab', user: os.userInfo().username, kind: 'cron' });
      return out;
    },
    async procInfo(pid) {
      const [status, cwd, fds, cgroup] = await Promise.all([rd('/proc/' + pid + '/status'), link('/proc/' + pid + '/cwd'), ls('/proc/' + pid + '/fd'), rd('/proc/' + pid + '/cgroup')]);
      if (!status) throw new Error('process not found');
      const g = k => ((status.match(new RegExp('^' + k + ':\\s+(.+)$', 'm')) || [])[1] || '').trim();
      const cg = (cgroup || '').trim();
      return { pid, cwd: cwd || null, fds: fds.length || null, vmPeak: g('VmPeak'), vmSwap: g('VmSwap'), ctxVoluntary: g('voluntary_ctxt_switches'), ctxInvoluntary: g('nonvoluntary_ctxt_switches'), cgroup: cg, container: /docker|containerd|kubepods|libpod/.test(cg) ? (cg.match(/([0-9a-f]{12,64})/) || [])[1] || 'yes' : null, seccomp: g('Seccomp'), capEff: g('CapEff') };
    },
    async cwd(pid) { return link('/proc/' + pid + '/cwd'); },
    async kill(pid, o = {}) { process.kill(pid, o.force ? 'SIGKILL' : 'SIGTERM'); return 'sent ' + (o.force ? 'SIGKILL' : 'SIGTERM'); },
    async suspend(pid) { process.kill(pid, 'SIGSTOP'); return 'stopped (SIGSTOP)'; },
    async resume(pid) { process.kill(pid, 'SIGCONT'); return 'continued (SIGCONT)'; },
    async priority(pid, level) { const nice = { idle: 19, below: 10, normal: 0, above: -5, high: -10 }[level]; if (nice == null) throw new Error('bad level'); os.setPriority(pid, nice); return 'nice ' + nice; },
    async affinity(pid, mask) { const r = await U.run('taskset', ['-p', BigInt(mask).toString(16), String(pid)], { timeout: 5000 }); if (!r.ok) throw new Error(r.stderr.trim() || 'taskset failed'); return r.stdout.trim(); },
    async reveal(file) { const r = await U.run('xdg-open', [path.dirname(file)], { timeout: 5000 }); if (!r.ok) throw new Error('xdg-open failed'); return 'opened'; },
  };
}

module.exports = { create, parseProcStat, parseMeminfo, parsePidStat, parseNetDev, parseSnmp, parseDiskstats, hexIp, parseProcNet, parseSs, parseArp, parseRoute, parseResolv, parseSystemctl };

};
__M["lib/platform/win.js"] = function (module, exports, require) {
'use strict';
// Windows platform: two long-lived PowerShell collectors (perf counters + WMI), a lazy
// control worker for on-demand queries/actions, netstat for sockets, LHM for sensors.
const os = require('os');
const { spawn } = require('child_process');
const U = require('../util');
const assets = require('../assets');
const sockets = require('../sockets');
const S = require('../sensors');

const BOOT = "$s = New-Object Text.StringBuilder; while ($true) { $l = [Console]::In.ReadLine(); if ($null -eq $l -or $l -eq '#__RIGWATCH_END__') { break }; [void]$s.AppendLine($l) }; Invoke-Expression $s.ToString()";
const PRIO = { 4: 'idle', 6: 'below', 8: 'normal', 10: 'above', 13: 'high', 24: 'realtime' };
const PRIO_CLASS = { idle: 'Idle', below: 'BelowNormal', normal: 'Normal', above: 'AboveNormal', high: 'High' };

class PsWorker {
  constructor(name, file, onLine, opts = {}) {
    Object.assign(this, { name, file, onLine, opts, proc: null, ok: false, starts: 0, startedAt: 0, lastLine: 0, err: '', stopped: false, interval: opts.interval || 1000 });
  }
  start() {
    if (this.stopped || this.proc) return;
    this.starts++; this.startedAt = Date.now();
    let p;
    try {
      p = spawn(U.psExe(), ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', BOOT], {
        windowsHide: true,
        env: Object.assign({}, process.env, { RIG_PARENT_PID: String(process.pid), RIG_INTERVAL_MS: String(this.interval) }, this.opts.env || {}),
      });
    } catch (e) { this.err = e.message; return this.retry(); }
    this.proc = p;
    p.on('error', e => { this.err = e.message; });
    p.stdin.on('error', () => {});
    p.stdin.write(assets.read(this.file) + '\n#__RIGWATCH_END__\n');
    if (!this.opts.keepStdin) p.stdin.end();
    U.onLines(p.stdout, line => {
      this.lastLine = Date.now(); this.ok = true;
      try { this.onLine(line); } catch (e) { this.err = 'parse: ' + e.message; }
    });
    p.stderr.setEncoding('utf8');
    p.stderr.on('data', d => { this.err = (this.err + d).slice(-1500); });
    p.on('exit', code => {
      this.proc = null; this.ok = false;
      if (this.opts.onExit) this.opts.onExit(code);
      if (this.stopped || this.opts.noRestart) return;
      if (Date.now() - this.startedAt > 60000) this.starts = 0;
      if (this.starts <= 3) U.log(this.name + ' collector exited (' + code + ')' + (this.starts === 3 ? ', will keep retrying quietly' : ', restarting') + (this.err ? ': ' + U.trunc(this.err.trim().split('\n').pop(), 160) : ''));
      this.retry();
    });
  }
  retry() { setTimeout(() => this.start(), Math.min(30000, 1000 * 2 ** Math.min(this.starts, 5))).unref(); }
  stop() { this.stopped = true; try { if (this.proc) this.proc.kill(); } catch { /* gone */ } }
  get pid() { return this.proc ? this.proc.pid : 0; }
}

/**
 * Sends one JSON command at a time to control.ps1. Interactive requests jump ahead of
 * background ones (signature checks), and a hung request restarts the worker.
 */
class ControlWorker extends PsWorker {
  constructor() {
    super('control', 'lib/platform/ps/control.ps1', line => this.reply(line), { keepStdin: true, noRestart: true, onExit: () => this.failAll('control worker exited') });
    this.queue = []; this.current = null; this.seq = 0;
  }
  reply(line) {
    if (!line.startsWith('R\t')) return;
    let m; try { m = JSON.parse(line.slice(2)); } catch { return; }
    const c = this.current;
    if (!c || c.id !== m.id) return;
    clearTimeout(c.timer); this.current = null;
    if (m.ok) c.resolve(m.data); else c.reject(new Error(m.error || 'failed'));
    this.pump();
  }
  failAll(msg) {
    const all = (this.current ? [this.current] : []).concat(this.queue);
    this.current = null; this.queue = [];
    for (const c of all) { clearTimeout(c.timer); c.reject(new Error(msg)); }
  }
  pump() {
    if (this.current || !this.queue.length) return;
    if (!this.proc) this.start();
    if (!this.proc) return this.failAll('could not start PowerShell');
    const c = this.current = this.queue.shift();
    c.timer = setTimeout(() => { this.failAll(c.op + ' timed out'); try { this.proc.kill(); } catch { /* gone */ } }, c.timeout);
    this.proc.stdin.write(JSON.stringify(Object.assign({ id: c.id, op: c.op }, c.args)) + '\n');
  }
  request(op, args = {}, timeout = 30000, low = false) {
    return new Promise((resolve, reject) => {
      const c = { id: ++this.seq, op, args, timeout, low, resolve, reject };
      if (low) this.queue.push(c);
      else { const i = this.queue.findIndex(x => x.low); if (i < 0) this.queue.push(c); else this.queue.splice(i, 0, c); }
      this.pump();
    });
  }
}

const newFrame = () => ({ cpu: null, cores: [], sys: null, mem: null, procs: [], engines: [], gpuProc: [], gpuMem: [], gpuProcMem: [], net: [], tcp: null, disks: [], tz: [] });
const normEng = t => { const s = String(t || '').replace(/\s*\d+$/, '').trim(); return /^video codec/.test(s) ? 'video codec' : s; };
const normDesc = s => String(s || '').toLowerCase().replace(/\(/g, '[').replace(/\)/g, ']').replace(/#/g, '_').replace(/[\\/]/g, '_').trim();
/** "\??\C:\x", "\\?\C:\x", "\SystemRoot\x" -> normal Win32 paths */
const ntPath = p => String(p || '').replace(/^\\\?\?\\/, '').replace(/^\\\\\?\\/, '').replace(/^\\SystemRoot\\/i, (process.env.SystemRoot || 'C:\\Windows') + '\\');

function create(ctx) {
  const cfg = ctx.cfg;
  const st = { fast: null, fastAt: 0, fastMs: 0, frame: newFrame(), static: null, px: new Map(), pxMs: 0, lhm: null, lhmAt: 0, drives: [], battery: [], nics: [], pdisks: [] };
  let sock = sockets.empty();
  const lhmHttp = new S.LhmHttp(cfg.lhmUrl);
  const suspended = new Set();
  let lastPrune = 0;

  function onFast(line) {
    const f = line.split('\t'), F = st.frame, n = U.num;
    switch (f[0]) {
      case 'CPU': F.cpu = { util: n(f[1]), perf: n(f[2]), time: n(f[3]), baseMhz: n(f[4]), dpc: n(f[5]), irq: n(f[6]) }; break;
      case 'CORE': F.cores.push({ g: n(f[1]), i: n(f[2]), util: n(f[3]), perf: n(f[4]) }); break;
      case 'SYS': F.sys = { procs: n(f[1]), threads: n(f[2]), ctx: n(f[3]), syscalls: n(f[4]), queue: n(f[5]) }; break;
      case 'MEM': F.mem = { avail: n(f[1]), committed: n(f[2]), commitLimit: n(f[3]), standby: n(f[4]), modified: n(f[5]), paged: n(f[6]), nonpaged: n(f[7]), hardFaults: n(f[8]), faults: n(f[9]), cache: n(f[10]), free: n(f[11]) }; break;
      case 'P': F.procs.push({ pid: n(f[1]), ppid: n(f[2]), name: f[3], cpu: n(f[4]), pws: n(f[5]), ws: n(f[6]), pb: n(f[7]), io: n(f[8]), ior: n(f[9]), iow: n(f[10]), thr: n(f[11]), hnd: n(f[12]), age: n(f[13]), prio: n(f[14]) }); break;
      case 'GE': F.engines.push({ luid: f[1], eng: n(f[3]), type: f[4], util: n(f[5]) }); break;
      case 'GP': F.gpuProc.push({ pid: n(f[1]), luid: f[2], util: n(f[3]) }); break;
      case 'GM': F.gpuMem.push({ luid: f[1], ded: n(f[3]), shared: n(f[4]) }); break;
      case 'GPM': F.gpuProcMem.push({ pid: n(f[1]), ded: n(f[3]) }); break;
      case 'NET': F.net.push({ inst: f[1], rx: n(f[2]), tx: n(f[3]), rxp: n(f[4]), txp: n(f[5]), bw: n(f[6]), rxTot: n(f[7]), txTot: n(f[8]), rxpTot: n(f[9]), txpTot: n(f[10]), errors: n(f[11]) + n(f[13]), drops: n(f[12]) + n(f[14]) }); break;
      case 'TCP': F.tcp = { est: n(f[1]) + n(f[2]), retrans: n(f[3]), segs: n(f[4]), failures: n(f[5]), resets: n(f[6]) }; break;
      case 'DISK': F.disks.push({ inst: f[1], read: n(f[2]), write: n(f[3]), rIops: n(f[4]), wIops: n(f[5]), idle: n(f[6]), lat: n(f[7]), queue: n(f[8]) }); break;
      case 'TZ': F.tz.push({ name: f[1], c: n(f[2]) }); break;
      case 'END':
        st.fast = F; st.fastAt = Date.now(); st.fastMs = n(f[2]); st.frame = newFrame();
        if (ctx.onTick) ctx.onTick();
        break;
    }
  }
  function onSlow(line) {
    const tab = line.indexOf('\t');
    const kind = tab < 0 ? line : line.slice(0, tab), rest = tab < 0 ? '' : line.slice(tab + 1);
    switch (kind) {
      case 'STATIC': st.static = JSON.parse(rest); if (ctx.onInventory) ctx.onInventory(); break;
      case 'PX': { const f = rest.split('\t'); st.px.set(U.num(f[0]), { ppid: U.num(f[1]), start: U.num(f[2]), name: f[3] || '', exe: ntPath(f[4] || ''), cmd: f[5] || '' }); break; }
      case 'PXEND': st.pxMs = U.num(rest); break;
      case 'LHM': st.lhm = JSON.parse(rest); st.lhmAt = Date.now(); break;
      case 'DRIVES': st.drives = U.arr(JSON.parse(rest)); break;
      case 'BATTERY': st.battery = U.arr(JSON.parse(rest)); break;
      case 'NICS': st.nics = U.arr(JSON.parse(rest)); break;
      case 'PDISKS': st.pdisks = U.arr(JSON.parse(rest)); break;
    }
  }

  const fast = new PsWorker('perf-counter', 'lib/platform/ps/fast.ps1', onFast, { interval: cfg.interval });
  const slow = new PsWorker('wmi', 'lib/platform/ps/slow.ps1', onSlow);
  const ctl = new ControlWorker();

  // ---- sockets via netstat -ano ----
  let netstatTimer = null, netstatMs = 0;
  // netstat is fast but prints localised state words on non-English Windows; when we see one,
  // switch to Get-NetTCPConnection (enum states are always English) via the control worker.
  const EN_STATE = /^(LISTENING|LISTEN|ESTABLISHED|TIME_WAIT|CLOSE_WAIT|SYN_SENT|SYN_RECEIVED|FIN_WAIT_1|FIN_WAIT_2|LAST_ACK|CLOSING|CLOSED|DELETE_TCB|BOUND)$/;
  let sockMode = process.env.RIGWATCH_SOCKETS === 'ps' ? 'ps' : 'netstat';
  async function pollNetstat() {
    const t0 = Date.now();
    if (sockMode === 'ps') {
      try {
        const d = await ctl.request('sockets', {}, 30000, true);
        const rows = [];
        for (const l of U.arr(d.tcp)) { const f = String(l).split('|'); rows.push({ proto: 'TCP', lh: f[0], lp: U.num(f[1]), rh: f[2], rp: U.num(f[3]), state: f[4], pid: U.num(f[5]) }); }
        for (const l of U.arr(d.udp)) { const f = String(l).split('|'); rows.push({ proto: 'UDP', lh: f[0], lp: U.num(f[1]), rh: '*', rp: 0, state: '', pid: U.num(f[2]) }); }
        sock = sockets.build(rows); netstatMs = Date.now() - t0;
      } catch (e) { sock.ok = false; sock.err = e.message; }
      netstatTimer = setTimeout(pollNetstat, 4000);
      return;
    }
    const r = await U.run(U.sys32('netstat.exe'), ['-ano'], { timeout: 15000 });
    if (!r.ok) { sock.ok = false; sock.err = r.stderr; }
    else {
      const rows = [];
      let foreign = 0;
      for (const raw of r.stdout.split(/\r?\n/)) {
        const f = raw.trim().split(/\s+/);
        if (f[0] !== 'TCP' && f[0] !== 'UDP') continue;
        const [lh, lp] = sockets.splitHostPort(f[1]);
        const [rh, rp] = sockets.splitHostPort(f[2]);
        const tcp = f[0] === 'TCP';
        let state = tcp ? f[3] : '';
        if (tcp && state && !EN_STATE.test(state)) foreign++;
        if (tcp && rp === 0 && U.isAnyAddr(rh)) state = 'LISTEN';
        rows.push({ proto: f[0], lh, lp, rh, rp, state, pid: U.num(tcp ? f[4] : f[3]) });
      }
      sock = sockets.build(rows);
      netstatMs = r.ms;
      if (foreign > 0) { sockMode = 'ps'; U.log('localised netstat detected, using Get-NetTCPConnection for socket states'); }
    }
    netstatTimer = setTimeout(pollNetstat, 3000);
  }

  // ---- embedded LibreHardwareMonitor library (started once tools/ has it) ----
  let sensorWorker = null;
  const emb = { data: null, at: 0, info: null, err: '' };
  function startSensors(dir) {
    if (sensorWorker || !dir) return;
    sensorWorker = new PsWorker('sensors', 'lib/platform/ps/sensors.ps1', line => {
      const tab = line.indexOf('\t'), kind = line.slice(0, tab), rest = line.slice(tab + 1);
      if (kind === 'LHM') { emb.data = JSON.parse(rest); emb.at = Date.now(); }
      else if (kind === 'INFO') emb.info = JSON.parse(rest);
      else if (kind === 'ERR') emb.err = JSON.parse(rest).error;
    }, { env: { RIG_LHM_DIR: dir } });
    sensorWorker.start();
  }

  function sensors() {
    const now = Date.now();
    let list = [];
    if (emb.data && now - emb.at < 10000 && U.arr(emb.data.sensors).length) list = S.fromLhmWmi(emb.data);
    else if (st.lhm && now - st.lhmAt < 10000 && U.arr(st.lhm.sensors).length) list = S.fromLhmWmi(st.lhm);
    else { const h = lhmHttp.fresh(); if (h) list = h; }
    const F = st.fast;
    if (F) for (const z of F.tz) if (z.c > -50 && z.c < 150) list.push({ id: 'acpi/' + z.name, hw: 'ACPI thermal zone', hwType: 'Acpi', type: 'Temperature', name: z.name, value: U.r1(z.c), min: null, max: null, unit: '\u00b0C' });
    return list;
  }
  function sensorSource() {
    if (emb.data && Date.now() - emb.at < 10000 && U.arr(emb.data.sensors).length) return 'LibreHardwareMonitor (built in)';
    if (st.lhm && Date.now() - st.lhmAt < 10000 && U.arr(st.lhm.sensors).length) return /open/i.test(st.lhm.ns || '') ? 'OpenHardwareMonitor (WMI)' : 'LibreHardwareMonitor (WMI)';
    if (lhmHttp.fresh()) return 'LibreHardwareMonitor (web)';
    return null;
  }

  function sample() {
    const now = Date.now();
    const F = st.fast && now - st.fastAt < cfg.interval * 5 ? st.fast : null;
    if (!F) return null;
    const S0 = st.static || {};
    const c0 = os.cpus()[0] || {};
    const baseMhz = (S0.cpu && S0.cpu.maxMhz) || (F.cpu && F.cpu.baseMhz) || c0.speed || 0;
    const cpu = F.cpu ? {
      util: U.r1(U.clamp(F.cpu.util, 0, 100)), mhz: Math.round(baseMhz * F.cpu.perf / 100), baseMhz,
      cores: F.cores.slice().sort((a, b) => a.g - b.g || a.i - b.i).map(c => ({ u: U.r1(U.clamp(c.util, 0, 100)), mhz: Math.round(baseMhz * c.perf / 100) })),
      dpc: U.r1(F.cpu.dpc), irq: Math.round(F.cpu.irq),
    } : null;
    if (cpu && F.sys) Object.assign(cpu, { procs: F.sys.procs, threads: F.sys.threads, ctx: Math.round(F.sys.ctx), syscalls: Math.round(F.sys.syscalls), queue: F.sys.queue });

    const total = os.totalmem();
    let mem = null;
    if (F.mem) {
      const m = F.mem, avail = m.avail;
      mem = { total, avail, used: Math.max(0, total - avail), free: m.free, standby: m.standby, modified: m.modified, cached: m.standby + m.modified, committed: m.committed, commitLimit: m.commitLimit, paged: m.paged, nonpaged: m.nonpaged, hardFaults: Math.round(m.hardFaults), faults: Math.round(m.faults) };
      mem.breakdown = [['In use', Math.max(0, total - avail - m.modified)], ['Modified', m.modified], ['Standby', m.standby], ['Free', Math.max(0, avail - m.standby)]];
    }

    // GPUs (DXGI adapters matched to perf-counter LUIDs)
    let adapters = U.arr(S0.dxgi).filter(a => !a.software && a.luid);
    if (!adapters.length) adapters = [...new Set(F.gpuMem.map(g => g.luid))].map((l, i) => ({ luid: l, name: 'GPU ' + i, vram: 0 }));
    const gpus = adapters.map(a => {
      const luid = String(a.luid).toLowerCase();
      const engines = {}; let util = 0;
      for (const e of F.engines) if (e.luid === luid) { const t = normEng(e.type); engines[t] = Math.max(engines[t] || 0, e.util); util = Math.max(util, e.util); }
      for (const k in engines) engines[k] = U.r1(U.clamp(engines[k], 0, 100));
      const gm = F.gpuMem.filter(m => m.luid === luid);
      return { id: luid, name: a.name, vendorId: a.vendorId, util: U.r1(U.clamp(util, 0, 100)), engines, vramUsed: gm.reduce((s, m) => s + m.ded, 0), vramTotal: a.vram || 0, sharedUsed: gm.reduce((s, m) => s + m.shared, 0), sharedTotal: a.shared || 0, source: 'perf counters' };
    });
    const gpuProc = new Map();
    for (const g of F.gpuProc) { const e = gpuProc.get(g.pid) || { util: 0, vram: 0 }; e.util = Math.max(e.util, g.util); gpuProc.set(g.pid, e); }
    for (const g of F.gpuProcMem) { const e = gpuProc.get(g.pid) || { util: 0, vram: 0 }; e.vram += g.ded; gpuProc.set(g.pid, e); }

    // processes
    const procs = F.procs.map(p => {
      const x = st.px.get(p.pid);
      return {
        pid: p.pid, ppid: p.ppid, name: x && x.name ? x.name.replace(/\.exe$/i, '') : p.name, cpu: U.r1(p.cpu), mem: p.pws, ws: p.ws, priv: p.pb,
        io: Math.round(p.io), ior: Math.round(p.ior), iow: Math.round(p.iow), thr: p.thr, hnd: p.hnd, age: p.age, prio: PRIO[p.prio] || String(p.prio || ''),
        exe: x ? x.exe : '', cmd: x ? x.cmd : '', start: x ? x.start : 0, state: suspended.has(p.pid) ? 'suspended' : '',
      };
    });
    if (now - lastPrune > 30000) { lastPrune = now; const alive = new Set(F.procs.map(p => p.pid)); for (const pid of st.px.keys()) if (!alive.has(pid)) st.px.delete(pid); for (const pid of suspended) if (!alive.has(pid)) suspended.delete(pid); }

    // network
    const nicByDesc = new Map(st.nics.map(nn => [normDesc(nn.desc), nn]));
    const osIfs = os.networkInterfaces();
    const ifaces = F.net.map(nn => {
      const nic = nicByDesc.get(nn.inst) || null;
      const addrs = nic && osIfs[nic.name] ? osIfs[nic.name].filter(a => !a.internal).map(a => a.address) : [];
      const desc = nic ? nic.desc : nn.inst;
      return {
        name: nic ? nic.name : nn.inst, desc, mac: nic ? nic.mac : '', mtu: nic ? nic.mtu : null, status: nic ? nic.status : '', up: nic ? /^up$/i.test(nic.status) : nn.rx + nn.tx > 0,
        virtual: nic ? !!nic.virtual : /virtual|hyper-v|vethernet|wsl|loopback|vpn|tap|wan miniport/i.test(nn.inst),
        wireless: /802\.11|wi-?fi|wireless|wlan/i.test((nic && nic.media) + ' ' + desc),
        ipv4: addrs.filter(a => !a.includes(':')), ipv6: addrs.filter(a => a.includes(':')).slice(0, 3),
        rx: nn.rx, tx: nn.tx, rxp: U.r1(nn.rxp), txp: U.r1(nn.txp), speed: nn.bw, rxTot: nn.rxTot, txTot: nn.txTot, rxpTot: nn.rxpTot, txpTot: nn.txpTot, errors: nn.errors, drops: nn.drops,
      };
    }).filter(i => i.rxTot > 0 || i.txTot > 0 || i.up);
    const tcp = F.tcp ? { est: F.tcp.est, retrans: U.r1(F.tcp.retrans), segs: Math.round(F.tcp.segs), retransPct: F.tcp.segs + F.tcp.retrans > 0 ? U.r2(100 * F.tcp.retrans / (F.tcp.segs + F.tcp.retrans)) : 0, failures: F.tcp.failures, resets: F.tcp.resets } : null;

    // disks
    const pdById = new Map(st.pdisks.map(d => [String(d.id), d]));
    const disks = F.disks.map(d => {
      const id = d.inst.split(' ')[0], pd = pdById.get(id) || {};
      return { id, name: pd.name || ('Disk ' + id), letters: d.inst.split(' ').slice(1).map(s => s.toUpperCase()).join(' '), media: ({ 3: 'HDD', 4: 'SSD', 5: 'SCM' })[pd.media] || '', size: pd.size || null, health: pd.health, temp: pd.temp || null, wear: pd.wear == null ? null : pd.wear, read: Math.round(d.read), write: Math.round(d.write), rIops: Math.round(d.rIops), wIops: Math.round(d.wIops), active: U.r1(U.clamp(100 - d.idle, 0, 100)), latMs: Math.round(d.lat * 100000) / 100, queue: d.queue };
    });
    const fs = st.drives.map(v => ({ mount: v.id, label: v.label, fs: v.fs, size: v.size, free: v.free, kind: ({ 2: 'removable', 3: 'local', 4: 'network', 5: 'optical', 6: 'ram' })[v.type] || '' }));
    const battery = st.battery.map(b => ({ name: b.name, pct: b.pct, plugged: [2, 6, 7, 8, 9, 11].includes(b.status), charging: [6, 7, 8, 9].includes(b.status), minutes: b.minutes && b.minutes < 71582 ? b.minutes : null }));

    return { t: now, cpu, mem, gpus, gpuProc, disks, fs, net: { ifaces, tcp }, procs, sensors: sensors(), sensorSource: sensorSource(), battery };
  }

  function inventory() {
    const s = st.static || {};
    return { platform: 'win32', os: Object.assign({ kernel: os.release() }, s.os || {}), cpu: s.cpu || null, system: s.system || null, board: s.board || null, bios: s.bios || null, ram: U.arr(s.ram), video: U.arr(s.video), gpus: U.arr(s.dxgi).filter(d => !d.software), isAdmin: !!s.isAdmin, secureBoot: s.secureBoot == null ? null : !!s.secureBoot };
  }

  function status() {
    const lhm = require('../tools').state.lhm || {};
    const lhmWait = lhm.state === 'downloading' ? 'downloading…' : lhm.state === 'error' ? 'download failed' : process.env.NO_DOWNLOAD === '1' ? 'not in tools/ (NO_DOWNLOAD=1)' : 'waiting for download';
    return [
      { name: 'Perf counters (CPU, GPU, RAM, disk, net, processes)', ok: !!st.fast && Date.now() - st.fastAt < cfg.interval * 5, detail: st.fastMs ? st.fastMs + ' ms/sample' : '', err: fast.ok ? '' : U.trunc(fast.err, 300) },
      { name: 'WMI (inventory, command lines, drives, adapters)', ok: !!st.static, detail: st.pxMs ? 'process scan ' + st.pxMs + ' ms' : '', err: st.static ? '' : U.trunc(slow.err, 300) },
      { name: sockMode === 'ps' ? 'Sockets (Get-NetTCPConnection)' : 'Sockets (netstat -ano)', ok: sock.ok, detail: netstatMs ? netstatMs + ' ms' : '', err: sock.err },
      { name: 'Control worker (actions, services, net info)', ok: !!ctl.proc, detail: ctl.proc ? 'running' : 'starts on first use', err: U.trunc(ctl.err, 200) },
      { name: 'Sensor library (LibreHardwareMonitor, built in)', ok: !!emb.data && Date.now() - emb.at < 10000, detail: !sensorWorker ? lhmWait : emb.info ? (emb.data ? U.arr(emb.data.sensors).length + ' sensors' : 'starting') + (emb.info.admin ? '' : ' · no admin') + (emb.info.pawnio ? '' : ' · no PawnIO driver') : 'starting', err: U.trunc(sensorWorker ? emb.err : lhm.err, 200), optional: !sensorWorker && lhm.state !== 'downloading' },
    ];
  }

  async function wsl() {
    const exe = U.which(['wsl'], ['C:\\Windows\\System32']);
    if (!exe) return { installed: false, distros: [] };
    const r = await U.run(exe, ['-l', '-v'], { timeout: 8000, encoding: 'buffer' });
    const text = Buffer.isBuffer(r.stdout) ? r.stdout.toString(r.stdout.includes(0) ? 'utf16le' : 'utf8').replace(/\0/g, '').replace(/^\uFEFF/, '') : String(r.stdout);
    const errText = Buffer.isBuffer(r.stderr) ? r.stderr.toString('utf16le').replace(/\0/g, '') : String(r.stderr);
    if (/not installed|wsl(\.exe)? --install|0x8007019e|0x80070490/i.test(text + errText)) return { installed: false, distros: [] };
    const distros = [];
    for (const line of text.split(/\r?\n/).slice(1)) {
      const m = line.match(/^\s*(\*)?\s*(\S.*?)\s{2,}(\S+)\s+(\d+)\s*$/);
      if (m) distros.push({ name: m[2].trim(), state: m[3], version: +m[4], default: !!m[1] });
    }
    return { installed: true, distros };
  }

  return {
    id: 'win32', label: 'Windows',
    caps: { temps: 'LibreHardwareMonitor', fps: true, gpuProc: true, services: true, startup: true, suspend: true, priority: true, affinity: true, signatures: true, dnsCache: true, wifi: true, firewall: true, wsl: true, procInfo: true },
    start() { fast.start(); slow.start(); pollNetstat(); lhmHttp.start(); },
    stop() { fast.stop(); slow.stop(); ctl.stop(); if (sensorWorker) sensorWorker.stop(); clearTimeout(netstatTimer); lhmHttp.stop(); },
    sample, inventory, status, wsl, startSensors,
    restartSensors() { const dir = sensorWorker && sensorWorker.opts.env.RIG_LHM_DIR; if (!dir) return; sensorWorker.stop(); sensorWorker = null; emb.data = null; emb.info = null; setTimeout(() => startSensors(dir), 1500); },
    sensorInfo: () => emb.info,
    ctl,
    sockets: () => sock,
    selfPids: () => [fast.pid, slow.pid, ctl.pid, sensorWorker && sensorWorker.pid].filter(Boolean),
    isAdmin: () => (st.static ? !!st.static.isAdmin : require('../elevate').isAdmin()),
    netInfo: () => ctl.request('netinfo', {}, 30000).then(d => ({
      arp: U.arr(d.arp), routes: U.arr(d.routes), dns: U.arr(d.dns).map(x => ({ iface: x.iface, family: x.family, servers: U.arr(x.servers) })),
      av: U.arr(d.av), profiles: U.arr(d.profiles), firewall: U.arr(d.firewall).map(f => ({ name: f.name, enabled: /true/i.test(f.enabled), inbound: f.inbound, outbound: f.outbound })), defender: d.defender || null,
      wifi: U.arr(d.wifi).map(w => ({ name: w.Name, ssid: w.SSID, bssid: w['AP BSSID'] || w.BSSID, state: w.State, signal: w.Signal, radio: w['Radio type'], band: w.Band, channel: w.Channel, rx: w['Receive rate (Mbps)'], tx: w['Transmit rate (Mbps)'], auth: w.Authentication, cipher: w.Cipher, raw: w })),
    })),
    dnsCache: () => ctl.request('dnscache', {}, 30000).then(U.arr),
    services: () => ctl.request('services', {}, 30000).then(U.arr),
    serviceAction: (name, action) => ctl.request('service', { name, action }, 60000),
    startup: () => ctl.request('startup', {}, 60000).then(U.arr),
    signatures: paths => ctl.request('signatures', { paths }, 60000, true),
    procInfo: pid => ctl.request('procinfo', { pid }, 15000),
    async kill(pid, o = {}) {
      const args = ['/PID', String(pid)];
      if (o.tree) args.push('/T');
      args.push('/F');
      const r = await U.run(U.sys32('taskkill.exe'), args, { timeout: 15000 });
      if (!r.ok) throw new Error((r.stderr || r.stdout).trim() || 'taskkill failed (try an elevated terminal)');
      return r.stdout.trim();
    },
    async suspend(pid) { const r = await ctl.request('suspend', { pid }); suspended.add(pid); return r; },
    async resume(pid) { const r = await ctl.request('resume', { pid }); suspended.delete(pid); return r; },
    priority: (pid, level) => { if (!PRIO_CLASS[level]) return Promise.reject(new Error('bad priority level')); return ctl.request('priority', { pid, level: PRIO_CLASS[level] }); },
    affinity: (pid, mask) => ctl.request('affinity', { pid, mask: String(mask) }),
    async reveal(file) { spawn('explorer.exe', ['/select,', file], { detached: true, stdio: 'ignore' }).unref(); return 'opened'; },
    async wslAction(name, action) {
      const exe = U.which(['wsl'], ['C:\\Windows\\System32']);
      if (!exe) throw new Error('WSL is not installed');
      const args = action === 'shutdown' ? ['--shutdown'] : action === 'terminate' ? ['--terminate', name] : null;
      if (!args) throw new Error('bad action');
      const r = await U.run(exe, args, { timeout: 30000 });
      if (!r.ok) throw new Error('wsl ' + args.join(' ') + ' failed');
      return 'ok';
    },
  };
}

module.exports = { create };

};
__M["lib/security.js"] = function (module, exports, require) {
'use strict';
// Exposure audit: risky listening ports, debug endpoints, binaries in odd places, masquerading
// system binaries, unsigned network-facing binaries (Windows), firewall / AV state.
const U = require('./util');

const PORTS = {
  21: ['high', 'FTP (plaintext credentials)'], 23: ['critical', 'Telnet (plaintext shell)'], 69: ['medium', 'TFTP'], 135: ['low', 'Windows RPC'], 137: ['low', 'NetBIOS'], 139: ['medium', 'NetBIOS session (SMB1-era)'],
  161: ['medium', 'SNMP'], 445: ['medium', 'SMB file sharing'], 512: ['high', 'rexec'], 513: ['high', 'rlogin'], 514: ['high', 'rsh'], 1433: ['high', 'SQL Server'], 1521: ['high', 'Oracle DB'],
  2375: ['critical', 'Docker API without TLS (remote root)'], 2376: ['medium', 'Docker API (TLS)'], 3306: ['high', 'MySQL'], 3389: ['high', 'Remote Desktop'], 4444: ['high', 'port commonly used by backdoors / Metasploit'],
  5432: ['high', 'PostgreSQL'], 5555: ['critical', 'Android Debug Bridge'], 5672: ['medium', 'RabbitMQ'], 5900: ['high', 'VNC'], 5901: ['high', 'VNC'], 5984: ['high', 'CouchDB'], 6379: ['high', 'Redis'],
  6443: ['high', 'Kubernetes API'], 8086: ['medium', 'InfluxDB'], 8888: ['medium', 'Jupyter'], 9200: ['high', 'Elasticsearch'], 9222: ['critical', 'Chrome DevTools remote debugging'], 9229: ['critical', 'Node.js inspector (remote code execution)'],
  10250: ['high', 'Kubelet'], 11211: ['high', 'Memcached'], 11434: ['medium', 'Ollama API'], 15672: ['medium', 'RabbitMQ admin'], 27017: ['high', 'MongoDB'], 31337: ['high', 'port commonly used by backdoors'],
};
const BAD_REMOTE = new Set([4444, 1337, 31337, 6666, 6667, 6697, 12345, 5555, 9001]);
const WEIGHT = { critical: 25, high: 12, medium: 5, low: 2, info: 0 };
const SYS_BINS = new Set(['svchost', 'lsass', 'csrss', 'smss', 'wininit', 'winlogon', 'services', 'spoolsv', 'taskhostw', 'dllhost', 'conhost', 'rundll32', 'explorer', 'dwm', 'ctfmon', 'sihost', 'runtimebroker']);
const SUSP_DIR = process.platform === 'win32'
  ? /\\(AppData\\Local\\Temp|Windows\\Temp|Downloads|Users\\Public|\$Recycle\.Bin|ProgramData\\[^\\]+\.exe$)/i
  : /^(\/tmp\/|\/var\/tmp\/|\/dev\/shm\/|\/private\/tmp\/|\/Users\/[^/]+\/Downloads\/|\/home\/[^/]+\/Downloads\/)/;

class Security {
  constructor(plat, timeline) {
    this.plat = plat; this.timeline = timeline;
    this.sig = new Map(); this.sigQueue = []; this.sigBusy = false;
    this.findings = []; this.keys = null; this.net = null; this.netAt = 0;
    this.procFlags = new Map();
  }
  setNetInfo(n) { this.net = n; this.netAt = Date.now(); }
  signature(p) { return p ? this.sig.get(p.toLowerCase()) || null : null; }

  /** queue Authenticode checks for network-facing or oddly-located binaries (Windows only) */
  queueSignatures(procs, sock) {
    if (!this.plat.caps.signatures) return;
    const net = new Set([...sock.byPid.keys(), ...sock.connsByPid.keys()]);
    for (const p of procs) {
      if (!p.exe || this.sig.has(p.exe.toLowerCase()) || this.sigQueue.includes(p.exe)) continue;
      if (net.has(p.pid) || SUSP_DIR.test(p.exe) || p.kind === 'app') this.sigQueue.push(p.exe);
    }
    if (this.sigBusy || !this.sigQueue.length) return;
    this.sigBusy = true;
    const batch = this.sigQueue.splice(0, 8);
    this.plat.signatures(batch).then(res => {
      for (const [k, v] of Object.entries(res || {})) this.sig.set(k.toLowerCase(), { status: v.status, signer: v.signer, os: !!v.os });
    }).catch(() => { for (const b of batch) this.sig.set(b.toLowerCase(), { status: 'Unknown', signer: '' }); }).finally(() => { this.sigBusy = false; });
  }

  analyze(procs, sock, ctx) {
    const F = [];
    const add = (sev, cat, key, title, detail, fix, extra) => F.push(Object.assign({ key, sev, cat, title, detail, fix }, extra || {}));
    const byPid = new Map(procs.map(p => [p.pid, p]));
    const pname = pid => { const p = byPid.get(pid); return p ? (p.label || p.name) : (sock.names.get(pid) || (pid <= 4 ? 'System' : 'pid ' + pid)); };
    this.procFlags = new Map();
    const flag = (pid, f) => { if (!this.procFlags.has(pid)) this.procFlags.set(pid, []); this.procFlags.get(pid).push(f); };

    // listening ports
    for (const l of sock.listen) {
      const risk = PORTS[l.port];
      const p = byPid.get(l.pid);
      if (l.scope === 'all' || l.scope === 'iface') {
        if (risk) {
          add(risk[0], 'exposure', 'port:' + l.proto + ':' + l.port, risk[1] + ' reachable from the network (' + l.proto + ' ' + l.port + ')', pname(l.pid) + ' (PID ' + l.pid + ') listens on ' + l.addrs.join(', ') + '.', l.port === 9229 || l.port === 9222 ? 'Bind the debugger to 127.0.0.1 (e.g. --inspect=127.0.0.1:9229) or stop it.' : 'Bind it to 127.0.0.1, stop the service, or block the port in your firewall.', { pid: l.pid, port: l.port });
          flag(l.pid, 'exposed:' + l.port);
        } else if (p && ['runtime', 'server', 'ai', 'db'].includes(p.kind) && l.proto === 'TCP') {
          add('low', 'exposure', 'dev:' + l.port, 'Dev server on all interfaces (TCP ' + l.port + ')', pname(l.pid) + ' accepts connections from your whole network.', 'Use --host 127.0.0.1 (vite/next/uvicorn) unless you are testing from another device.', { pid: l.pid, port: l.port });
        }
      } else if (risk && (l.port === 9229 || l.port === 9222)) {
        add('low', 'exposure', 'dbg:' + l.port, risk[1].replace(/ \(.*\)/, '') + ' open on localhost (TCP ' + l.port + ')', pname(l.pid) + ' exposes a debugger. Any local program can attach to it.', 'Fine while debugging; close it when you are done.', { pid: l.pid, port: l.port });
      }
      if (l.pid > 4 && !byPid.has(l.pid) && !sock.names.get(l.pid) && this.plat.id === 'win32') add('low', 'exposure', 'orphan:' + l.port, 'Port ' + l.port + ' owned by an invisible process (PID ' + l.pid + ')', 'The owning process is not visible to RigWatch.', 'Run RigWatch elevated to see it.', { port: l.port, pid: l.pid });
    }

    // processes
    const sysRoot = (process.env.SystemRoot || 'C:\\Windows').toLowerCase();
    for (const p of procs) {
      if (!p.exe || p.kind === 'rigwatch') continue;
      const exe = p.exe.toLowerCase();
      if (this.plat.id === 'win32' && SYS_BINS.has(p.name.toLowerCase()) && !exe.startsWith(sysRoot)) {
        add('critical', 'process', 'masq:' + p.pid, p.name + '.exe running outside ' + sysRoot, 'PID ' + p.pid + ' runs from ' + p.exe + '. Malware often uses system process names.', 'Check the file (hash it, scan it). If you did not install it, end it and investigate.', { pid: p.pid });
        flag(p.pid, 'masquerade');
      }
      const netActive = sock.byPid.has(p.pid) || sock.connsByPid.has(p.pid);
      if (SUSP_DIR.test(p.exe)) {
        add(netActive ? 'high' : 'medium', 'process', 'tmp:' + p.pid, p.name + ' runs from a temp/download folder', p.exe + (netActive ? ' and it has network activity.' : '.'), 'Legit installers do this briefly. Anything long-running there deserves a look.', { pid: p.pid });
        flag(p.pid, 'odd-location');
      }
      if (/ \(deleted\)$/.test(p.exe)) { add('high', 'process', 'del:' + p.pid, p.name + ' runs from a deleted binary', p.exe, 'Normal after a package upgrade (restart it); suspicious otherwise.', { pid: p.pid }); flag(p.pid, 'deleted-binary'); }
      const sig = this.signature(p.exe);
      if (sig && netActive && (sig.status === 'HashMismatch' || sig.status === 'NotTrusted')) { add('high', 'process', 'sigbad:' + exe, p.name + ': signature ' + sig.status, p.exe, 'The file was modified after signing or the certificate is not trusted.', { pid: p.pid }); flag(p.pid, 'bad-signature'); }
      else if (sig && netActive && sig.status === 'NotSigned') { add('low', 'process', 'unsigned:' + exe, 'Unsigned binary on the network: ' + p.name, p.exe, 'Common for dev tools and open-source apps. Make sure you recognise it.', { pid: p.pid }); flag(p.pid, 'unsigned'); }
    }

    // connections
    const syn = new Map(), bad = new Map();
    for (const c of sock.conns) {
      if (c.state === 'SYN_SENT') syn.set(c.pid, (syn.get(c.pid) || 0) + 1);
      if (BAD_REMOTE.has(c.rp) && U.ipKind(c.rh) === 'public') bad.set(c.pid, c);
    }
    for (const [pid, n] of syn) if (n >= 40) { add('medium', 'network', 'syn:' + pid, pname(pid) + ' has ' + n + ' pending outbound connections', 'Lots of SYN_SENT means it is failing to reach hosts, scanning, or retrying hard.', 'Look at the remote addresses in Network \u2192 Connections.', { pid }); flag(pid, 'syn-storm'); }
    for (const [pid, c] of bad) { add('medium', 'network', 'badport:' + pid, pname(pid) + ' talks to remote port ' + c.rp, c.rh + ':' + c.rp + ' is a port often used by backdoors, IRC bots or ADB.', 'Verify you expect this connection.', { pid }); flag(pid, 'odd-remote-port'); }
    const eph = sock.conns.filter(c => c.lp >= 49152).length;
    if (eph > 12000) add('medium', 'network', 'ephemeral', 'Ephemeral ports nearly exhausted (' + eph + ' in use)', 'New outbound connections may start failing.', 'Find the app with thousands of TIME_WAIT/ESTABLISHED sockets in Network \u2192 Connections.');

    // host posture
    const n = this.net;
    if (n) {
      for (const f of n.firewall || []) if (f.enabled === false) add('high', 'posture', 'fw:' + f.name, 'Firewall disabled: ' + f.name + ' profile', 'Inbound connections are not filtered on this profile.', 'Turn the firewall back on unless something else protects this machine.');
      const av = n.av || [];
      const thirdParty = av.filter(a => a.enabled && !/defender/i.test(a.name));
      if (n.defender && n.defender.realtime === false) {
        if (thirdParty.length) add('info', 'posture', 'av:third', thirdParty.map(a => a.name).join(', ') + ' is your active antivirus', 'Microsoft Defender runs in passive mode next to it, which is expected.', '');
        else add('high', 'posture', 'av:rtp', 'Microsoft Defender real-time protection is off', 'No other active antivirus is registered with Windows Security Center.', 'Re-enable real-time protection or install another antivirus.');
      } else if (n.defender && n.defender.sigAgeDays > 7) add('medium', 'posture', 'av:sig', 'Defender signatures are ' + n.defender.sigAgeDays + ' days old', '', 'Run Windows Update to refresh definitions.');
      for (const a of thirdParty) if (a.upToDate === false) add('medium', 'posture', 'av:old:' + a.name, a.name + ' reports out-of-date definitions', '', 'Update it.');
      for (const pr of n.profiles || []) if (/public/i.test(pr.category) && sock.listen.some(l => l.scope === 'all' && PORTS[l.port])) { add('info', 'posture', 'pub:' + pr.name, 'On a public network (' + pr.name + ') with services listening', 'Windows applies stricter firewall rules on Public networks, which helps.', ''); break; }
    }
    if (ctx.inv && ctx.inv.secureBoot === false) add('low', 'posture', 'secureboot', 'Secure Boot is off', 'Boot-level malware protection is disabled.', 'Enable Secure Boot in firmware settings if your OS supports it.');
    if (ctx.exposed) add('medium', 'posture', 'rigwatch-lan', 'RigWatch itself is reachable on your network', 'HOST=' + ctx.host + ' makes this dashboard readable (not controllable) from other devices.', 'Use HOST=127.0.0.1 unless you need LAN access. Control actions still require the token.');

    F.sort((a, b) => WEIGHT[b.sev] - WEIGHT[a.sev] || a.title.localeCompare(b.title));
    // dedupe by key
    const seen = new Set();
    this.findings = F.filter(f => (seen.has(f.key) ? false : seen.add(f.key)));
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const f of this.findings) counts[f.sev]++;
    const score = Math.max(0, 100 - this.findings.reduce((a, f) => a + WEIGHT[f.sev], 0));
    // timeline diff
    const keys = new Set(this.findings.map(f => f.key));
    if (this.keys) {
      for (const f of this.findings) if (!this.keys.has(f.key) && f.sev !== 'info') this.timeline.add('finding.new', f.sev === 'critical' || f.sev === 'high' ? 'alert' : 'warn', f.title, { detail: f.detail, pid: f.pid, port: f.port, sevLevel: f.sev });
      for (const k of this.keys) if (!keys.has(k)) this.timeline.add('finding.clear', 'info', 'Resolved: ' + (this.lastTitles.get(k) || k), {});
    }
    this.keys = keys; this.lastTitles = new Map(this.findings.map(f => [f.key, f.title]));
    this.summary = { score, counts, top: this.findings.slice(0, 5) };
    return this.summary;
  }
  flags(pid) { return this.procFlags.get(pid) || null; }
}

module.exports = { Security, PORTS };

};
__M["lib/sensors.js"] = function (module, exports, require) {
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

};
__M["lib/server.js"] = function (module, exports, require) {
/*!
 * RigWatch 2 - your whole machine on one page. Zero dependencies, Windows / Linux / macOS.
 *   node server.js                 -> http://localhost:3000
 *   HOST=0.0.0.0 node server.js    -> also on your LAN (read-only unless the token URL is used)
 * MIT License
 */
'use strict';

const http = require('http');
const os = require('os');
const net = require('net');
const dns = require('dns');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { CFG, store, save, VERSION } = require('./config');
const U = require('./util');
const assets = require('./assets');
const { createEngine } = require('./engine');
const { METRICS } = require('./alerts');
const tools = require('./tools');

// ---------------------------------------------------------------------------
// Server-Sent Events
// ---------------------------------------------------------------------------
const clients = new Set();
function broadcast(event, data) {
  if (!clients.size) return;
  const msg = 'event: ' + event + '\ndata: ' + data + '\n\n';
  for (const c of clients) {
    if (c.res.writableLength > 8 << 20) { c.res.destroy(); clients.delete(c); continue; }
    c.res.write(msg);
  }
}
setInterval(() => { for (const c of clients) c.res.write(': ka\n\n'); }, 20000).unref();

const engine = createEngine(broadcast);

// ---------------------------------------------------------------------------
// access control
// ---------------------------------------------------------------------------
function parseCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) { const i = part.indexOf('='); if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); }
  return out;
}
function tokenOk(t) {
  if (!t) return false;
  const a = Buffer.from(String(t)), b = Buffer.from(store.token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function access(req) {
  const addr = String(req.socket.remoteAddress || '').replace(/^::ffff:/, '');
  const local = addr === '::1' || addr.startsWith('127.');
  const hasTok = tokenOk(req.headers['x-rigwatch-token'] || parseCookies(req).rw_token);
  return { local, hasTok, read: local || hasTok || !CFG.lanReadNeedsToken, control: CFG.allowControl && (hasTok || (local && !CFG.localNeedsToken)) };
}
/** Blocks DNS rebinding: only IP literals, localhost, this machine's name or ALLOWED_HOSTS. */
function hostAllowed(req) {
  let h = String(req.headers.host || '').toLowerCase();
  if (!h) return false;
  h = h.replace(/:\d+$/, '').replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h.endsWith('.localhost') || net.isIP(h)) return true;
  const hn = os.hostname().toLowerCase();
  if ([hn, hn + '.local', hn + '.lan', hn + '.home'].includes(h)) return true;
  return CFG.allowedHosts.includes(h);
}
/** Mutations need our custom header (forces a CORS preflight) and a same-origin Origin. */
function csrfOk(req) {
  if (req.headers['x-rigwatch'] !== '1') return false;
  const o = req.headers.origin;
  return !o || o === 'http://' + req.headers.host;
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const SEC_HEADERS = { 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'x-frame-options': 'DENY', 'cross-origin-opener-policy': 'same-origin' };
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";
function send(res, code, type, body, extra) {
  res.writeHead(code, Object.assign({ 'content-type': type, 'cache-control': 'no-store' }, SEC_HEADERS, extra || {}));
  res.end(body);
}
const json = (res, code, obj) => send(res, code, 'application/json; charset=utf-8', JSON.stringify(obj));
const fail = (res, code, msg) => json(res, code, { ok: false, error: msg });
function readBody(req, limit = 65536) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', d => { body += d; if (body.length > limit) { reject(new Error('body too large')); req.destroy(); } });
    req.on('end', () => { if (!body) return resolve({}); try { resolve(JSON.parse(body)); } catch { reject(new Error('invalid JSON')); } });
    req.on('error', reject);
  });
}
const TYPES = { '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
function serveAsset(res, rel) {
  if (!/^[\w.-]+(\/[\w.-]+)*$/.test(rel) || rel.includes('..')) return send(res, 404, 'text/plain', 'not found');
  const ext = (rel.match(/\.[a-z]+$/) || [''])[0];
  if (!TYPES[ext]) return send(res, 404, 'text/plain', 'not found');
  let body;
  try { body = assets.read('public/' + rel); } catch { return send(res, 404, 'text/plain', 'not found'); }
  send(res, 200, TYPES[ext], body, ext === '.html' ? { 'content-security-policy': CSP } : { 'cache-control': 'no-cache' });
}
function hello(req, acc) {
  return {
    static: engine.staticPayload(),
    auth: { local: acc.local, control: acc.control, hasToken: acc.hasTok, tools: acc.control && CFG.allowTools, lanUrl: acc.local ? lanUrls().map(u => u + '/?token=' + encodeURIComponent(store.token)) : [] },
    settings: store.settings,
    webhook: acc.control ? store.webhook : { enabled: store.webhook.enabled, format: store.webhook.format, url: store.webhook.url ? '•••' : '' },
  };
}
function lanUrls() {
  if (['127.0.0.1', 'localhost', '::1'].includes(CFG.host)) return [];
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) for (const a of list || []) if ((a.family === 'IPv4' || a.family === 4) && !a.internal) out.push('http://' + a.address + ':' + CFG.port);
  return out;
}
const rdnsCache = new Map();
async function rdns(ip) {
  const c = rdnsCache.get(ip);
  if (c && Date.now() - c.at < 600000) return c.name;
  let name = '';
  try { name = (await Promise.race([dns.promises.reverse(ip), U.sleep(1500).then(() => [])]))[0] || ''; } catch { name = ''; }
  rdnsCache.set(ip, { name, at: Date.now() });
  if (rdnsCache.size > 5000) rdnsCache.clear();
  return name;
}
function csv(rows, cols) {
  const q = v => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  return [cols.join(',')].concat(rows.map(r => cols.map(c => q(r[c])).join(','))).join('\n');
}
let svcCache = null, svcAt = 0;

// ---------------------------------------------------------------------------
// routes
// ---------------------------------------------------------------------------
async function handle(req, res) {
  if (!hostAllowed(req)) return send(res, 421, 'text/plain', 'Host not allowed. Use an IP address, localhost, or add it with ALLOWED_HOSTS.');
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  const acc = access(req);
  const q = k => url.searchParams.get(k);

  // token login: /?token=... sets an HttpOnly cookie and strips it from the URL
  if (req.method === 'GET' && q('token')) {
    if (!tokenOk(q('token'))) return send(res, 403, 'text/plain', 'Invalid token.');
    return send(res, 302, 'text/plain', 'ok', { location: p, 'set-cookie': 'rw_token=' + encodeURIComponent(store.token) + '; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000' });
  }
  if (req.method === 'GET' && (p === '/' || p === '/index.html')) return serveAsset(res, 'index.html');
  if (req.method === 'GET' && p === '/overlay') return serveAsset(res, 'overlay.html');
  if (req.method === 'GET' && (p === '/favicon.svg' || p === '/favicon.ico')) return serveAsset(res, 'favicon.svg');
  if (req.method === 'GET' && p.startsWith('/assets/')) return serveAsset(res, p.slice(8));
  if (!p.startsWith('/api/')) return send(res, 404, 'text/plain', 'not found');

  if (!acc.read) return fail(res, 401, 'This dashboard needs the access token (LAN_READ=token). Open the token URL printed in the RigWatch console.');
  const mutating = req.method !== 'GET';
  if (mutating) {
    if (!csrfOk(req)) return fail(res, 403, 'Bad origin or missing x-rigwatch header.');
    if (!acc.control) return fail(res, 403, acc.local ? 'Control is disabled (ALLOW_CONTROL=0) or needs the token (LOCAL_TOKEN=1).' : 'Read-only from other devices. Open the token URL printed in the RigWatch console on this device to unlock control.');
  }
  const plat = engine.plat;
  try {
    if (p.startsWith('/api/siem/')) {
      const body = mutating ? await readBody(req) : null;
      const r = await engine.siem.api(req.method, p.slice(10), Object.fromEntries(url.searchParams), body || {}, acc);
      if (r && r.download) return send(res, 200, r.type, r.body, { 'content-disposition': 'attachment; filename="' + r.download + '"' });
      return json(res, 200, r);
    }
    switch (req.method + ' ' + p) {
      case 'GET /api/hello': return json(res, 200, hello(req, acc));
      case 'GET /api/stream': {
        res.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache, no-transform', connection: 'keep-alive', 'x-accel-buffering': 'no' });
        res.write('retry: 2000\n\n');
        res.write('event: hello\ndata: ' + JSON.stringify(hello(req, acc)) + '\n\n');
        res.write('event: history\ndata: ' + JSON.stringify(engine.history.query('15m')) + '\n\n');
        res.write('event: events\ndata: ' + JSON.stringify(engine.timeline.query({ limit: 300 }).reverse()) + '\n\n');
        if (engine.lastSnapJson()) res.write('event: snap\ndata: ' + engine.lastSnapJson() + '\n\n');
        const c = { res, acc };
        clients.add(c);
        req.on('close', () => clients.delete(c));
        return;
      }
      case 'GET /api/snapshot': return send(res, 200, 'application/json; charset=utf-8', engine.lastSnapJson() || '{}');
      case 'GET /api/static': return json(res, 200, engine.staticPayload());
      case 'GET /api/history': {
        const range = q('range') || '15m';
        if (q('format') === 'csv') return send(res, 200, 'text/csv; charset=utf-8', engine.history.csv(range), { 'content-disposition': 'attachment; filename="rigwatch-history-' + range + '.csv"' });
        return json(res, 200, engine.history.query(range));
      }
      case 'GET /api/timeline': {
        const list = engine.timeline.query({ since: U.int(q('since'), 0), types: q('types') ? q('types').split(',') : null, q: q('q') || '', limit: U.clamp(U.int(q('limit'), 500), 1, 5000), sev: q('sev') || null });
        if (q('format') === 'csv') return send(res, 200, 'text/csv; charset=utf-8', csv(list.map(e => Object.assign({}, e, { time: new Date(e.t).toISOString() })), ['time', 'type', 'sev', 'title', 'detail', 'name', 'pid', 'port', 'ip']), { 'content-disposition': 'attachment; filename="rigwatch-timeline.csv"' });
        return json(res, 200, list);
      }
      case 'GET /api/process': {
        const pid = U.int(q('pid'), -1);
        const all = engine.lastProcs();
        const pr = all.find(x => x.pid === pid);
        if (!pr) return fail(res, 404, 'not found');
        const sock = plat.sockets();
        return json(res, 200, Object.assign({}, pr, {
          cmd: U.redact(pr.cmd), parent: (all.find(x => x.pid === pr.ppid) || {}).name || null,
          children: all.filter(c => c.ppid === pid).map(c => ({ pid: c.pid, name: c.name, cpu: c.cpu, mem: c.mem })),
          listen: sock.listen.filter(l => l.pid === pid), connList: sock.conns.filter(c => c.pid === pid).slice(0, 500), history: engine.procHistory(pid),
        }));
      }
      case 'GET /api/procinfo': return json(res, 200, plat.procInfo ? await plat.procInfo(U.int(q('pid'), -1)) : {});
      case 'GET /api/netinfo': return json(res, 200, await engine.netInfo(q('fresh') === '1'));
      case 'GET /api/dnscache': return json(res, 200, plat.dnsCache ? await plat.dnsCache() : []);
      case 'GET /api/services': {
        if (!plat.services) return json(res, 200, []);
        if (!svcCache || Date.now() - svcAt > 4000 || q('fresh') === '1') { svcCache = await plat.services(); svcAt = Date.now(); }
        return json(res, 200, svcCache);
      }
      case 'GET /api/startup': return json(res, 200, plat.startup ? await plat.startup() : []);
      case 'GET /api/security': return json(res, 200, { summary: engine.security.summary || null, findings: engine.security.findings, net: engine.security.net ? { firewall: engine.security.net.firewall, defender: engine.security.net.defender, profiles: engine.security.net.profiles } : null });
      case 'GET /api/docker': return json(res, 200, engine.docker.summary());
      case 'GET /api/docker/inspect': return json(res, 200, await engine.docker.inspect(String(q('id') || '')));
      case 'GET /api/dev': return json(res, 200, { health: engine.dev.healthList(), toolchain: engine.dev.toolchain, wsl: engine.dev.wsl, devices: store.knownDevices });
      case 'GET /api/alerts': return json(res, 200, { rules: engine.alerts.list(), metrics: Object.fromEntries(Object.entries(METRICS).map(([k, m]) => [k, { label: m.label, unit: m.unit, target: m.target || null }])) });
      case 'PUT /api/alerts': { const b = await readBody(req); return json(res, 200, { ok: true, rules: engine.alerts.setRules(b.rules) }); }
      case 'PUT /api/webhook': {
        const b = await readBody(req);
        if (b.url && !/^https?:\/\/[^\s]+$/i.test(b.url)) return fail(res, 400, 'URL must start with http:// or https://');
        store.webhook = { enabled: !!b.enabled, url: String(b.url || '').slice(0, 500), format: ['discord', 'slack', 'json'].includes(b.format) ? b.format : 'discord' };
        save(); return json(res, 200, { ok: true });
      }
      case 'POST /api/webhook/test': { const ok = await engine.alerts.webhook('Test message from RigWatch on ' + os.hostname()); return json(res, ok ? 200 : 400, ok ? { ok: true, msg: 'sent' } : { ok: false, error: 'Webhook disabled, invalid, or the endpoint rejected it.' }); }
      case 'PUT /api/settings': { const b = await readBody(req); for (const k of Object.keys(store.settings)) if (typeof b[k] === 'boolean') store.settings[k] = b[k]; save(); return json(res, 200, { ok: true, settings: store.settings }); }
      case 'GET /api/jobs': return json(res, 200, engine.jobs.list());
      case 'POST /api/jobs': {
        if (!CFG.allowTools) return fail(res, 403, 'Tools are disabled (ALLOW_TOOLS=0).');
        const b = await readBody(req);
        return json(res, 200, { ok: true, job: engine.startTool(String(b.tool || ''), b.params || {}) });
      }
      case 'POST /api/action': { const b = await readBody(req); return json(res, 200, await engine.control.run(b, acc.local ? 'local' : 'token')); }
      case 'GET /api/rdns': {
        if (!store.settings.resolveHostnames) return json(res, 200, {});
        const ips = String(q('ips') || '').split(',').filter(ip => net.isIP(ip)).slice(0, 60);
        const out = {};
        await Promise.all(ips.map(async ip => { out[ip] = await rdns(ip); }));
        return json(res, 200, out);
      }
      case 'GET /api/export': {
        const what = q('what'), fmt = q('format') === 'csv' ? 'csv' : 'json';
        const s = engine.lastSnap() || {};
        const data = what === 'processes' ? (s.procs || []).map(x => Object.assign({}, x, { ports: (x.ports || []).join(' '), flags: (x.flags || []).join(' '), project: x.project ? x.project.name : '', sig: x.sig ? x.sig.status : '' }))
          : what === 'connections' ? (s.ports ? s.ports.conns : []) : what === 'listening' ? (s.ports ? s.ports.listen.map(l => Object.assign({}, l, { addrs: l.addrs.join(' ') })) : []) : what === 'findings' ? engine.security.findings : null;
        if (!data) return fail(res, 400, 'what=processes|connections|listening|findings');
        const cols = data.length ? Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object' || data[0][k] === null) : [];
        const name = 'rigwatch-' + what + '.' + fmt;
        return send(res, 200, fmt === 'csv' ? 'text/csv; charset=utf-8' : 'application/json', fmt === 'csv' ? csv(data, cols) : JSON.stringify(data, null, 2), { 'content-disposition': 'attachment; filename="' + name + '"' });
      }
      case 'GET /api/health': return json(res, 200, { ok: true, version: VERSION, clients: clients.size, uptime: Math.round(process.uptime()) });
      case 'GET /api/tb': {
        const q2 = Object.fromEntries(url.searchParams);
        return json(res, 200, await engine.toolbox.get(String(q2.what || ''), q2));
      }
      case 'POST /api/tb': {
        const b = await readBody(req);
        const msg = await engine.toolbox.act(b);
        engine.timeline.add('action', 'info', 'toolbox: ' + String(b.op) + (b.name ? ' ' + b.name : '') + (b.action ? ' ' + b.action : ''), { detail: U.trunc(String(msg), 300), who: acc.local ? 'local' : 'token' });
        return json(res, 200, { ok: true, msg: String(msg) });
      }
      case 'GET /api/diagnostics': {
        // safe to paste into a public bug report: no host name, user name or home path
        const s = engine.lastSnap() || {}, inv = plat.inventory();
        const d = {
          rigwatch: VERSION, node: process.version, platform: process.platform, release: os.release(), arch: os.arch(), locale: Intl.DateTimeFormat().resolvedOptions().locale,
          os: inv.os ? [inv.os.caption, inv.os.display, inv.os.build].filter(Boolean).join(' ') : '', cpu: inv.cpu ? inv.cpu.name : '', gpus: U.arr(inv.gpus).map(g => g.name), ramGB: Math.round(os.totalmem() / 1073741824),
          elevated: plat.isAdmin(), interval: CFG.interval, uptimeSec: Math.round(process.uptime()), fallback: !!s.fallback,
          collectors: s.status ? s.status.collectors : null, tools: tools.state, sensorInfo: plat.sensorInfo ? plat.sensorInfo() : null,
          sensors: s.sensors ? { source: s.sensors.source, count: s.sensors.list.length } : null, fps: s.fps ? { status: s.fps.status, err: s.fps.err } : null, docker: s.docker ? s.docker.available : null,
          counts: s.procs ? { processes: s.procs.length, listening: s.ports.listen.length, connections: s.ports.total, gpus: s.gpus.length, disks: s.disks.length, adapters: s.net.ifaces.length } : null,
        };
        let text = JSON.stringify(d, null, 2);
        const esc2 = v => String(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        for (const [needle, rep] of [[os.homedir().replace(/\\/g, '\\\\'), '~'], [os.homedir(), '~'], [os.hostname(), '<host>'], [os.userInfo().username, '<user>']]) if (needle && needle.length > 2) text = text.replace(new RegExp(esc2(needle), 'gi'), rep);
        return send(res, 200, 'application/json; charset=utf-8', text);
      }
      case 'GET /api/tools': return json(res, 200, { tools: tools.state, elevated: plat.isAdmin(), sensorInfo: plat.sensorInfo ? plat.sensorInfo() : null });
      case 'POST /api/elevate': {
        if (!acc.local) return fail(res, 403, 'Only from this machine.');
        if (!U.IS_WIN) return fail(res, 400, 'Run RigWatch with sudo on this OS.');
        if (plat.isAdmin()) return fail(res, 400, 'Already running as administrator.');
        const r = await require('./elevate').startElevated({ detached: true, port: CFG.port });
        if (!r.ok) return fail(res, 400, r.err);
        engine.timeline.add('action', 'info', 'Restarted RigWatch as administrator', {});
        json(res, 200, { ok: true, msg: 'Restarting as administrator…' });
        setTimeout(() => process.exit(0), 700);
        return;
      }
      case 'POST /api/pawnio': {
        if (!acc.local) return fail(res, 403, 'Only from this machine.');
        if (!U.IS_WIN) return fail(res, 400, 'Windows only.');
        const exe = await tools.ensure('pawnio', true);
        if (!exe) return fail(res, 500, 'Could not download the PawnIO installer: ' + (tools.state.pawnio.err || 'unknown error'));
        const ps = spawn(U.psExe(), ['-NoProfile', '-NonInteractive', '-Command', '$p = Start-Process -FilePath $env:RW_EXE -Verb RunAs -Wait -PassThru; exit $p.ExitCode'], { windowsHide: true, env: Object.assign({}, process.env, { RW_EXE: exe }) });
        ps.on('exit', code => {
          engine.timeline.add('action', 'info', 'PawnIO installer finished (exit ' + code + ')', {});
          if (plat.restartSensors) plat.restartSensors();
        });
        return json(res, 200, { ok: true, msg: 'PawnIO installer opened. Approve it, click Install, and sensors restart automatically.' });
      }
    }
    const jm = p.match(/^\/api\/jobs\/(\d+)(\/cancel)?$/);
    if (jm && req.method === 'GET' && !jm[2]) { const j = engine.jobs.get(+jm[1]); return j ? json(res, 200, j) : fail(res, 404, 'no such job'); }
    if (jm && req.method === 'POST' && jm[2]) return json(res, 200, { ok: engine.jobs.cancel(+jm[1]) });
    return fail(res, 404, 'unknown endpoint');
  } catch (e) {
    return fail(res, 400, e.message || String(e));
  }
}

// ---------------------------------------------------------------------------
// boot
// ---------------------------------------------------------------------------
function shutdown() { engine.stop(); }
process.on('exit', shutdown);
process.on('SIGINT', () => { shutdown(); process.exit(0); });
process.on('SIGTERM', () => { shutdown(); process.exit(0); });
process.on('uncaughtException', e => U.log('error:', e.stack || e.message));
process.on('unhandledRejection', e => U.log('unhandled:', e && (e.stack || e.message)));

const server = http.createServer((req, res) => { handle(req, res).catch(e => { try { fail(res, 500, e.message); } catch { /* closed */ } }); });
let listenTries = 0, autoTries = 0;
server.on('error', e => {
  if (e.code === 'EADDRINUSE' && process.argv.includes('--wait-port') && listenTries++ < 40) { setTimeout(() => server.listen(CFG.port, CFG.host), 500); return; }
  if (e.code === 'EADDRINUSE' && !CFG.portExplicit && autoTries++ < 20) { U.log('port ' + CFG.port + ' is busy, trying ' + (CFG.port + 1)); CFG.port++; setTimeout(() => server.listen(CFG.port, CFG.host), 30); return; }
  if (e.code === 'EADDRINUSE') U.log('Port ' + CFG.port + ' is already in use. Try: ' + (U.IS_WIN ? '$env:PORT=3001; node server.js' : 'PORT=3001 node server.js'));
  else U.log('server error:', e.message);
  process.exit(1);
});
server.listen(CFG.port, CFG.host);
server.once('listening', async () => {
  if (CFG.host === '127.0.0.1') { const s6 = http.createServer((q, r) => handle(q, r).catch(() => {})); s6.on('error', () => {}); s6.listen(CFG.port, '::1'); }
  const local = 'http://localhost:' + CFG.port;
  console.log('\n  ◆ RigWatch ' + VERSION + ' on ' + engine.plat.label + ' · Node ' + process.version);
  console.log('    ' + local + '   (full control from this machine)');
  for (const u of lanUrls()) {
    console.log('    ' + u + '   (LAN, read-only)');
    console.log('    ' + u + '/?token=' + encodeURIComponent(store.token) + '   (LAN with control: keep this secret)');
  }
  console.log('    data dir: ' + CFG.home + (CFG.persist ? '' : ' (persistence off)') + '\n');
  if (U.IS_WIN) console.log('    ' + (require('./elevate').isAdmin() ? 'running elevated: full sensors, FPS, services and process control' : 'running without admin: start without --no-elevate (or use "Restart as admin" in the UI) for CPU temps, FPS and services') + '\n');
  await engine.start();
  if (CFG.open && !require('./elevate').isChild()) {
    if (U.IS_WIN) spawn('cmd', ['/c', 'start', '', local], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
    else spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [local], { detached: true, stdio: 'ignore' }).unref();
  }
});

};
__M["lib/siem/blocks.js"] = function (module, exports, require) {
'use strict';
// Blocking addresses: Windows Firewall rules in the "RigWatch IP" group (inbound + outbound),
// iptables/ip6tables rules tagged "rigwatch" on Linux. The list lives in ~/.rigwatch/siem/blocks.json
// with optional expiry. Never blocks this machine, loopback, the gateway, DNS servers or trusted IPs.
const fs = require('fs');
const os = require('os');
const net = require('net');
const path = require('path');
const U = require('../util');
const { ip4 } = require('./ips');

function writeAtomic(file, text) {
  try { fs.mkdirSync(path.dirname(file), { recursive: true }); const tmp = file + '.tmp'; fs.writeFileSync(tmp, text); fs.renameSync(tmp, file); return true; } catch { return false; }
}

/** "1.2.3.4", "1.2.3.0/24", "2001:db8::1", "2001:db8::/48" -> normalized string, or throws */
function normalizeTarget(s) {
  s = String(s || '').trim().replace(/^::ffff:/i, '');
  const m = s.match(/^([0-9a-fA-F:.]+)(?:\/(\d{1,3}))?$/);
  if (!m) throw new Error('Enter an IP address or a CIDR range such as 203.0.113.0/24.');
  const fam = net.isIP(m[1]);
  if (!fam) throw new Error('Not a valid IP address: ' + m[1]);
  let ip = m[1];
  if (fam === 6) ip = ip.toLowerCase();
  if (m[2] != null) {
    const bits = +m[2], max = fam === 4 ? 32 : 128, min = fam === 4 ? 8 : 32;
    if (bits > max) throw new Error('Prefix too long');
    if (bits < min) throw new Error('Refusing to block a range that large (/' + bits + ').');
    if (fam === 4 && bits < 32) { const n = ip4(ip), size = 2 ** (32 - bits), base = Math.floor(n / size) * size; ip = [base >>> 24 & 255, base >>> 16 & 255, base >>> 8 & 255, base & 255].join('.'); }
    if (bits !== max) return ip + '/' + bits;
  }
  const k = U.ipKind(ip);
  if (k === 'loopback' || k === 'any') throw new Error('Refusing to block ' + ip + ' (this machine).');
  return ip;
}
function contains(target, ip) {
  if (!target.includes('/')) return target === ip;
  const [base, bits] = target.split('/');
  const a = ip4(base), b = ip4(ip);
  if (a == null || b == null) return false;
  const size = 2 ** (32 - +bits);
  return Math.floor(a / size) === Math.floor(b / size);
}

class Blocks {
  constructor(file, persist, plat, getProtected) {
    this.file = file; this.persist = persist; this.plat = plat; this.getProtected = getProtected || (() => []);
    this.list = []; this.err = ''; this.external = [];
    if (persist) { try { const l = JSON.parse(fs.readFileSync(file, 'utf8')); if (Array.isArray(l)) this.list = l.filter(b => b && b.ip); } catch { /* none */ } }
  }
  supported() { return U.IS_WIN || process.platform === 'linux'; }
  save() { if (this.persist) writeAtomic(this.file, JSON.stringify(this.list, null, 1)); }
  isBlocked(ip) { return this.list.some(b => contains(b.ip, ip)); }
  /** reason string if this address must never be blocked, else '' */
  protectedReason(target) {
    const ip = target.split('/')[0];
    for (const list of Object.values(os.networkInterfaces())) for (const a of list || []) if (a.address === ip || (target.includes('/') && contains(target, a.address))) return 'that is this machine';
    for (const p of this.getProtected()) if (p.ip && (p.ip === ip || (target.includes('/') && contains(target, p.ip)))) return p.why;
    return '';
  }
  async apply(target, on, note) {
    if (U.IS_WIN) {
      if (!this.plat.isAdmin()) throw new Error('Blocking needs admin: use "Restart as admin" first.');
      return this.plat.ctl.request('ipblock', { ip: target, on, note: String(note || '').slice(0, 200) }, 30000);
    }
    if (process.platform === 'linux') {
      if (typeof process.getuid === 'function' && process.getuid() !== 0) throw new Error('Blocking needs root: run RigWatch with sudo.');
      const v6 = target.includes(':');
      const bin = U.which(v6 ? 'ip6tables' : 'iptables', ['/usr/sbin', '/sbin']);
      if (!bin) throw new Error((v6 ? 'ip6tables' : 'iptables') + ' not found');
      const specs = [['INPUT', '-s'], ['OUTPUT', '-d']];
      for (const [chain, dir] of specs) {
        const rule = [chain, dir, target, '-j', 'DROP', '-m', 'comment', '--comment', 'rigwatch'];
        const exists = (await U.run(bin, ['-C', ...rule])).ok;
        if (on && !exists) { const r = await U.run(bin, ['-I', ...rule]); if (!r.ok) throw new Error(U.trunc(r.stderr, 200)); }
        if (!on && exists) { const r = await U.run(bin, ['-D', ...rule]); if (!r.ok) throw new Error(U.trunc(r.stderr, 200)); }
      }
      return on ? 'blocked' : 'unblocked';
    }
    throw new Error('Blocking addresses is supported on Windows and Linux.');
  }
  async block(input, { minutes = 0, reason = '', by = 'manual', ruleId = null } = {}) {
    const ip = normalizeTarget(input);
    const why = this.protectedReason(ip);
    if (why) throw new Error('Refusing to block ' + ip + ': ' + why + '.');
    await this.apply(ip, true, 'ip=' + ip + '; ' + reason);
    const now = Date.now();
    this.list = this.list.filter(b => b.ip !== ip);
    this.list.push({ ip, reason: U.trunc(reason, 200), by, at: now, until: minutes > 0 ? now + minutes * 60e3 : null, ruleId });
    this.save();
    return { ip, until: minutes > 0 ? now + minutes * 60e3 : null };
  }
  async unblock(input) {
    const ip = normalizeTarget(input);
    await this.apply(ip, false);
    const had = this.list.length;
    this.list = this.list.filter(b => b.ip !== ip);
    this.external = this.external.filter(b => b.ip !== ip);
    if (this.list.length !== had) this.save();
    return ip;
  }
  /** unblock expired entries; returns the list of addresses released */
  async expire() {
    const now = Date.now(), done = [];
    for (const b of this.list.filter(x => x.until && x.until <= now)) {
      try { await this.apply(b.ip, false); done.push(b.ip); } catch (e) { this.err = e.message; if (/needs (admin|root)/.test(e.message)) break; }
    }
    if (done.length) { this.list = this.list.filter(b => !done.includes(b.ip)); this.save(); }
    return done;
  }
  /** rules present in the firewall but not in our list (e.g. after deleting ~/.rigwatch) */
  async sync() {
    try {
      if (U.IS_WIN && this.plat.isAdmin()) {
        const rules = U.arr(await this.plat.ctl.request('iplist', {}, 60000, true));
        const seen = new Map();
        for (const r of rules) { const m = String(r.desc || '').match(/ip=([^;\s]+)/); const ip = m ? m[1] : String(r.ip || '').split(',')[0]; if (ip && !seen.has(ip)) seen.set(ip, r); }
        this.external = [...seen.keys()].filter(ip => !this.list.some(b => b.ip === ip)).map(ip => ({ ip, reason: 'found in Windows Firewall (group "RigWatch IP")', by: 'firewall', at: null, until: null }));
        this.missing = this.list.filter(b => !seen.has(b.ip)).map(b => b.ip);
      } else if (process.platform === 'linux' && typeof process.getuid === 'function' && process.getuid() === 0) {
        const found = new Set();
        for (const bin of ['iptables', 'ip6tables']) {
          const exe = U.which(bin, ['/usr/sbin', '/sbin']); if (!exe) continue;
          const r = await U.run(exe, ['-S', 'INPUT']);
          for (const line of r.stdout.split('\n')) { const m = line.match(/-s (\S+?)(?:\/(?:32|128))? .*rigwatch/); if (m) found.add(m[1]); }
        }
        this.external = [...found].filter(ip => !this.list.some(b => b.ip === ip)).map(ip => ({ ip, reason: 'found in iptables (comment rigwatch)', by: 'firewall', at: null, until: null }));
      }
      this.err = '';
    } catch (e) { this.err = e.message; }
  }
  all() { return this.list.concat(this.external); }
}

module.exports = { Blocks, normalizeTarget, contains };

};
__M["lib/siem/collect.js"] = function (module, exports, require) {
'use strict';
// Log collectors.
//   Windows: Security / System / Defender / Firewall / RDP / OpenSSH event logs, read incrementally with
//            EventRecordID bookmarks through the control worker; the Windows Firewall drop log (pfirewall.log).
//   Linux:   journald (sshd, sudo, systemd-logind, su) with a cursor, or /var/log/auth.log | secure.
// The first run backfills the last 30 days so the history page is useful right away.
const fs = require('fs');
const path = require('path');
const U = require('../util');
const rules = require('./rules');

const BACKFILL_DAYS = 30;

function loadJson(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')) || {}; } catch { return {}; } }
function saveJson(file, obj) { try { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file + '.tmp', JSON.stringify(obj)); fs.renameSync(file + '.tmp', file); } catch { /* ignore */ } }

/** pairs of 4624 events from UAC split tokens -> one event (keeps the admin flag) */
function dedupeLogons(evs) {
  const out = [], seen = new Map();
  for (const ev of evs) {
    if ([2001, 2002, 2003, 2008].includes(ev.rule.id)) {
      const key = ev.rule.id + '|' + ev.user + '|' + (ev.ip || '');
      const prev = seen.get(key);
      if (prev && Math.abs(prev.ts - ev.ts) < 3000) {
        if (ev.data && ev.data.admin && prev.data && !prev.data.admin) { prev.data.admin = true; prev.msg += ' with admin rights'; }
        continue;
      }
      seen.set(key, ev);
    }
    out.push(ev);
  }
  return out;
}

const FW_FIELDS = 'date time action protocol src-ip dst-ip src-port dst-port size tcpflags tcpsyn tcpack tcpwin icmptype icmpcode info path pid'.split(' ');
/** pfirewall.log text -> inbound drops [{ ts, src, dst, port, proto }] */
function parseFwLog(text, fields = FW_FIELDS) {
  const out = [];
  let F = fields;
  for (const raw of String(text).split('\n')) {
    const line = raw.trim(); if (!line) continue;
    if (line[0] === '#') { if (/^#Fields:/i.test(line)) F = line.slice(8).trim().split(/\s+/); continue; }
    const p = line.split(/\s+/), g = k => p[F.indexOf(k)];
    if (g('action') !== 'DROP') continue;
    const dir = g('path'); if (dir && dir !== 'RECEIVE') continue;
    const ts = new Date(g('date') + 'T' + g('time')).getTime();
    if (!Number.isFinite(ts)) continue;
    out.push({ ts, src: g('src-ip'), dst: g('dst-ip'), port: +g('dst-port') || 0, proto: g('protocol') });
  }
  return out;
}

function createWin({ plat, dir, persist, onEvents, onDrops }) {
  const markFile = path.join(dir, 'marks.json');
  const marks = persist ? loadJson(markFile) : {};
  const state = {}; const admins = new Map(); const fwSeen = new Map();
  // installers re-add the same firewall rules over and over: one event per rule and action per 6 hours
  const fwRepeat = ev => {
    if (ev.rule.id !== 5005 && ev.rule.id !== 5006) return false;
    const k = ev.rule.id + '|' + (ev.data && ev.data.rule) + '|' + ev.process, last = fwSeen.get(k);
    if (last != null && Math.abs(ev.ts - last) < 6 * 3600e3) return true;
    fwSeen.set(k, ev.ts); if (fwSeen.size > 5000) fwSeen.clear();
    return false;
  };
  // some vendor tools re-register the same driver at every boot: report a service once per 7 days
  const svcRepeat = ev => {
    if (ev.rule.id !== 4004 || !ev.data) return false;
    const seen = marks.svc || (marks.svc = {});
    const k = String(ev.data.service || '') + '|' + String(ev.data.image || '').toLowerCase(), last = seen[k];
    if (last != null && Math.abs(ev.ts - last) < 7 * 86400e3) return true;
    seen[k] = ev.ts;
    const keys = Object.keys(seen); if (keys.length > 2000) for (const x of keys.slice(0, 500)) delete seen[x];
    return false;
  };
  const fw = { enabled: false, file: '', profiles: [], err: '', at: 0 };
  let timer = null, fwTimer = null, busy = false, stopped = false;

  async function poll() {
    if (busy || stopped) return;
    busy = true; let next = 20000;
    try {
      const r = await plat.ctl.request('siempoll', { marks: Object.fromEntries(Object.entries(marks).filter(([k, v]) => typeof v === 'number' && !k.startsWith('fw'))), backHours: BACKFILL_DAYS * 24, max: 400 }, 120000, true);
      const raw = U.arr(r.events).sort((a, b) => a.t - b.t || a.rid - b.rid);
      for (const x of raw) if (x.k === 'sec-priv' && x.p) admins.set(x.p[3], x.t);
      if (admins.size > 3000) for (const k of [...admins.keys()].slice(0, 1000)) admins.delete(k);
      const ctx = { admins: new Set(admins.keys()) };
      let evs = [];
      for (const x of raw) if (x.k !== 'sec-priv') { try { evs.push(...rules.fromWin(x, ctx)); } catch { /* malformed */ } }
      evs = dedupeLogons(evs).filter(ev => !fwRepeat(ev) && !svcRepeat(ev));
      for (const [k, st] of Object.entries(r.state || {})) {
        state[k] = { ok: !!st.ok, err: st.err || '', n: st.n || 0, at: Date.now() };
        if (st.mark != null && +st.mark >= 0) marks[k] = +st.mark;
        if (st.full) next = 2500;
      }
      state.poll = { ok: true, err: '', at: Date.now() };
      if (evs.length) onEvents(evs);
      if (persist) saveJson(markFile, marks);
    } catch (e) {
      state.poll = { ok: false, err: e.message, at: Date.now() };
      next = 60000;
    } finally {
      busy = false;
      if (!stopped) { timer = setTimeout(poll, next); timer.unref(); }
    }
  }

  async function fwRefresh(mode = 'status') {
    const list = U.arr(await plat.ctl.request('fwlog', { mode }, 30000, mode === 'status'));
    fw.profiles = list.map(p => ({ name: p.name, on: String(p.blocked) === 'True' || String(p.blocked) === '1', file: p.file }));
    const on = fw.profiles.find(p => p.on);
    fw.enabled = !!on; fw.file = on ? on.file : (fw.profiles[0] || {}).file || '';
    fw.err = ''; fw.at = Date.now();
    return fw;
  }
  async function fwPoll() {
    if (!fw.enabled || !fw.file || !plat.isAdmin()) return;
    let st; try { st = fs.statSync(fw.file); } catch (e) { fw.err = e.code === 'ENOENT' ? 'log file not created yet (no drops so far)' : e.message; return; }
    let off = marks.fwOffset || 0;
    if (marks.fwFile !== fw.file || st.size < off) off = Math.max(0, st.size - (1 << 20));
    if (st.size <= off) return;
    const len = Math.min(st.size - off, 4 << 20);
    const buf = Buffer.alloc(len);
    let fd; try { fd = fs.openSync(fw.file, 'r'); fs.readSync(fd, buf, 0, len, off); } catch (e) { fw.err = e.message; return; } finally { if (fd != null) fs.closeSync(fd); }
    const text = buf.toString('latin1');
    const cut = text.lastIndexOf('\n');
    if (cut < 0) return;
    marks.fwOffset = off + cut + 1; marks.fwFile = fw.file;
    const drops = parseFwLog(text.slice(0, cut));
    fw.err = '';
    if (drops.length) onDrops(drops);
  }

  return {
    start() {
      setTimeout(poll, 8000).unref();
      setTimeout(() => fwRefresh().catch(e => { fw.err = e.message; }), 15000).unref();
      fwTimer = setInterval(() => { fwPoll(); if (Date.now() - fw.at > 600e3) fwRefresh().catch(() => {}); }, 15000); fwTimer.unref();
    },
    stop() { stopped = true; clearTimeout(timer); clearInterval(fwTimer); if (persist) saveJson(markFile, marks); },
    pollNow() { clearTimeout(timer); return poll(); },
    status() { return { kind: 'windows', logs: state, firewallLog: fw, admin: plat.isAdmin() }; },
    async setFwLog(on) { await fwRefresh(on ? 'on' : 'off'); if (on) { marks.fwOffset = 0; marks.fwFile = ''; } return fw; },
  };
}

function createLinux({ dir, persist, onEvents }) {
  const markFile = path.join(dir, 'marks.json');
  const marks = persist ? loadJson(markFile) : {};
  const state = { source: '', ok: false, err: '', n: 0, at: 0, root: typeof process.getuid === 'function' && process.getuid() === 0 };
  let timer = null, stopped = false;
  const journal = U.which('journalctl', ['/usr/bin', '/bin']);
  const authFile = ['/var/log/auth.log', '/var/log/secure'].find(f => { try { fs.accessSync(f, fs.constants.R_OK); return true; } catch { return false; } });

  async function pollJournal() {
    const args = ['-o', 'json', '--no-pager', '-q', '-n', '5000', '_COMM=sshd', '_COMM=sshd-session', '_COMM=sudo', '_COMM=systemd-logind', '_COMM=su'];
    if (marks.cursor) args.push('--after-cursor=' + marks.cursor); else args.push('--since=-' + BACKFILL_DAYS + 'd');
    const r = await U.run(journal, args, { timeout: 60000, maxBuffer: 128 << 20 });
    if (!r.ok && !r.stdout) throw new Error(U.trunc(r.stderr, 200) || 'journalctl failed');
    const evs = [];
    for (const line of r.stdout.split('\n')) {
      if (!line) continue;
      let j; try { j = JSON.parse(line); } catch { continue; }
      if (j.__CURSOR) marks.cursor = j.__CURSOR;
      if (typeof j.MESSAGE !== 'string') continue;
      const ts = Math.floor(+j.__REALTIME_TIMESTAMP / 1000) || Date.now();
      const ident = j.SYSLOG_IDENTIFIER || j._COMM || '';
      evs.push(...rules.fromAuthLine(/^sshd/.test(ident) ? 'sshd' : ident, j.MESSAGE, ts, 'journal/' + ident));
    }
    state.source = 'journald'; state.n = evs.length;
    return evs;
  }
  async function pollFile() {
    let st; try { st = fs.statSync(authFile); } catch (e) { throw new Error(e.message); }
    let off = marks.authOffset || 0;
    if (marks.authFile !== authFile || st.size < off) off = Math.max(0, st.size - (8 << 20));
    if (st.size <= off) return [];
    const len = Math.min(st.size - off, 16 << 20), buf = Buffer.alloc(len);
    const fd = fs.openSync(authFile, 'r'); try { fs.readSync(fd, buf, 0, len, off); } finally { fs.closeSync(fd); }
    const text = buf.toString('utf8'), cut = text.lastIndexOf('\n');
    if (cut < 0) return [];
    marks.authOffset = off + cut + 1; marks.authFile = authFile;
    const evs = [];
    for (const line of text.slice(0, cut).split('\n')) {
      const s = rules.parseSyslog(line); if (!s) continue;
      evs.push(...rules.fromAuthLine(/^sshd/.test(s.ident) ? 'sshd' : s.ident, s.msg, s.ts, authFile + '/' + s.ident));
    }
    state.source = authFile; state.n = evs.length;
    return evs;
  }
  async function poll() {
    if (stopped) return;
    try {
      const evs = journal ? await pollJournal().catch(e => { if (authFile) return pollFile(); throw e; }) : authFile ? await pollFile() : null;
      if (evs === null) { state.ok = false; state.err = 'no journald and no readable /var/log/auth.log'; }
      else { state.ok = true; state.err = state.root ? '' : 'not running as root: sshd and sudo entries of other users may be hidden'; if (evs.length) onEvents(evs); }
      if (persist) saveJson(markFile, marks);
    } catch (e) { state.ok = false; state.err = e.message; }
    state.at = Date.now();
    if (!stopped) { timer = setTimeout(poll, 20000); timer.unref(); }
  }
  return {
    start() { setTimeout(poll, 8000).unref(); },
    stop() { stopped = true; clearTimeout(timer); if (persist) saveJson(markFile, marks); },
    pollNow() { clearTimeout(timer); return poll(); },
    status() { return { kind: 'linux', auth: state }; },
    async setFwLog() { throw new Error('Firewall drop logging is a Windows feature.'); },
  };
}

function create(opts) {
  if (U.IS_WIN) return createWin(opts);
  if (process.platform === 'linux') return createLinux(opts);
  return { start() {}, stop() {}, pollNow() { return Promise.resolve(); }, status() { return { kind: process.platform, note: 'Log collection is available on Windows and Linux. Network, port, program and RigWatch events are still recorded.' }; }, async setFwLog() { throw new Error('Firewall drop logging is a Windows feature.'); } };
}

module.exports = { create, parseFwLog, dedupeLogons, BACKFILL_DAYS };

};
__M["lib/siem/fim.js"] = function (module, exports, require) {
'use strict';
// File integrity monitoring (like Wazuh syscheck), kept small on purpose: a handful of high-value
// locations (hosts file, startup folders, scheduled tasks, SSH keys, /etc on Linux, LaunchAgents on macOS)
// plus Windows autostart registry keys. Baseline in ~/.rigwatch/siem/fim.json; changes become events.
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const U = require('../util');

const MAX_FILES = 20000, MAX_HASH = 64 << 20;

function defaults() {
  const home = os.homedir();
  if (U.IS_WIN) {
    const win = process.env.SystemRoot || 'C:\\Windows', pd = process.env.ProgramData || 'C:\\ProgramData', ad = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    return [
      { path: path.join(win, 'System32', 'drivers', 'etc'), tag: 'hosts file', level: 8, depth: 0 },
      { path: path.join(pd, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'StartUp'), tag: 'startup folder (all users)', level: 9, depth: 1 },
      { path: path.join(ad, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup'), tag: 'startup folder', level: 9, depth: 1 },
      { path: path.join(win, 'System32', 'Tasks'), tag: 'scheduled tasks', level: 7, depth: 4 },
      { path: path.join(home, '.ssh'), tag: 'SSH keys', level: 8, depth: 1 },
    ];
  }
  const list = [
    { path: '/etc/hosts', tag: 'hosts file', level: 7 },
    { path: path.join(home, '.ssh'), tag: 'SSH keys', level: 8, depth: 1 },
  ];
  if (process.platform === 'darwin') {
    list.push({ path: '/etc/sudoers', tag: 'sudoers', level: 9 }, { path: '/Library/LaunchAgents', tag: 'launch agents', level: 8, depth: 1 }, { path: '/Library/LaunchDaemons', tag: 'launch daemons', level: 9, depth: 1 }, { path: path.join(home, 'Library', 'LaunchAgents'), tag: 'launch agents', level: 8, depth: 1 });
  } else {
    list.push(
      { path: '/etc/passwd', tag: 'accounts', level: 8 }, { path: '/etc/shadow', tag: 'accounts', level: 9 }, { path: '/etc/group', tag: 'accounts', level: 7 },
      { path: '/etc/sudoers', tag: 'sudoers', level: 9 }, { path: '/etc/sudoers.d', tag: 'sudoers', level: 9, depth: 1 },
      { path: '/etc/ssh/sshd_config', tag: 'sshd config', level: 8 }, { path: '/etc/ld.so.preload', tag: 'library preload', level: 12 },
      { path: '/etc/crontab', tag: 'cron', level: 7 }, { path: '/etc/cron.d', tag: 'cron', level: 7, depth: 1 },
      { path: '/etc/systemd/system', tag: 'systemd units', level: 7, depth: 2 },
    );
    if (typeof process.getuid === 'function' && process.getuid() === 0) list.push({ path: '/root/.ssh', tag: 'SSH keys (root)', level: 9, depth: 1 });
  }
  return list;
}

function sha256(file) {
  return new Promise(resolve => {
    const h = crypto.createHash('sha256');
    fs.createReadStream(file).on('data', d => h.update(d)).on('error', () => resolve(null)).on('end', () => resolve(h.digest('hex')));
  });
}

class Fim {
  constructor(file, persist, plat, onChange) {
    this.file = file; this.persist = persist; this.plat = plat; this.onChange = onChange || (() => {});
    this.base = { files: {}, reg: {}, at: 0, regAt: 0 }; this.status = {}; this.busy = false; this.watchers = []; this.custom = [];
    if (persist) { try { const b = JSON.parse(fs.readFileSync(file, 'utf8')); if (b && b.files) this.base = Object.assign(this.base, b); } catch { /* first run */ } }
  }
  entries() { return defaults().concat(this.custom.map(p => ({ path: p, tag: 'custom', level: 6, depth: 3, custom: true }))); }
  setCustom(list) { this.custom = U.arr(list).map(String).filter(p => p && path.isAbsolute(p)).slice(0, 20); }

  async walk(entry, out) {
    let st; try { st = fs.lstatSync(entry.path); } catch (e) { this.status[entry.path] = { tag: entry.tag, ok: false, err: e.code === 'ENOENT' ? 'not present' : e.code === 'EPERM' || e.code === 'EACCES' ? 'needs admin' : e.code, files: 0 }; return; }
    let n = 0;
    const visit = (p, s, depth) => {
      if (out.size >= MAX_FILES) return;
      if (s.isFile()) { out.set(p, { s, entry }); n++; return; }
      if (!s.isDirectory() || depth < 0) return;
      let names = []; try { names = fs.readdirSync(p); } catch { return; }
      for (const nm of names) { let cs; const cp = path.join(p, nm); try { cs = fs.lstatSync(cp); } catch { continue; } visit(cp, cs, depth - 1); }
    };
    visit(entry.path, st, entry.depth != null ? entry.depth : 0);
    this.status[entry.path] = { tag: entry.tag, ok: true, err: '', files: n };
  }

  async scan() {
    if (this.busy) return; this.busy = true;
    try {
      const seen = new Map();
      for (const e of this.entries()) await this.walk(e, seen);
      const first = !this.base.at, old = this.base.files, next = {}, changes = [];
      for (const [p, { s, entry }] of seen) {
        const prev = old[p];
        let hash = prev ? prev[2] : null;
        if (!prev || prev[0] !== s.size || prev[1] !== Math.round(s.mtimeMs)) hash = s.size <= MAX_HASH ? await sha256(p) : null;
        next[p] = [s.size, Math.round(s.mtimeMs), hash, entry.level, entry.tag];
        if (first) continue;
        if (!prev) changes.push({ type: 'added', path: p, entry, size: s.size, hash });
        else if (prev[2] !== hash || (hash == null && (prev[0] !== s.size || prev[1] !== Math.round(s.mtimeMs)))) changes.push({ type: 'modified', path: p, entry, size: s.size, hash, before: { size: prev[0], hash: prev[2], mtime: prev[1] } });
      }
      for (const [p, v] of Object.entries(old)) {
        if (next[p]) continue;
        const owner = this.entries().find(e => p === e.path || p.startsWith(e.path + path.sep));
        if (!owner) continue;
        // a location we cannot read right now (e.g. "needs admin" after a restart) keeps its baseline
        if ((this.status[owner.path] || {}).err && (this.status[owner.path] || {}).err !== 'not present') { next[p] = v; continue; }
        if (!first) changes.push({ type: 'deleted', path: p, entry: { level: v[3] || 5, tag: v[4] || '' }, before: { size: v[0], hash: v[2] } });
      }
      // a location that was unreadable before (no admin) and readable now is a fresh baseline, not N "added" files
      const wasOk = this.base.ok || {}, nowOk = {};
      for (const e of this.entries()) { const st = this.status[e.path] || {}; if (st.ok || st.err === 'not present') nowOk[e.path] = true; }
      for (const c of changes) if (c.type === 'added' && !wasOk[c.entry.path]) c.silent = true;
      this.base.ok = nowOk;
      this.base.files = next; this.base.at = Date.now();
      if (U.IS_WIN) await this.scanRegistry().catch(e => { this.status.registry = { tag: 'autostart registry keys', ok: false, err: e.message, files: 0 }; });
      for (const c of changes.filter(x => !x.silent).slice(0, 200)) this.onChange(c);
      this.save();
    } finally { this.busy = false; }
  }
  async scanRegistry() {
    const list = U.arr(await this.plat.ctl.request('runkeys', {}, 60000, true));
    const cur = {};
    for (const x of list) cur[x.key + '|' + x.name] = String(x.value || '');
    const first = !this.base.regAt;
    if (!first) {
      for (const [k, v] of Object.entries(cur)) { const [key, name] = k.split('|'); if (!(k in this.base.reg)) this.onChange({ type: 'reg-added', key, name, value: v }); else if (this.base.reg[k] !== v) this.onChange({ type: 'reg-modified', key, name, value: v, before: this.base.reg[k] }); }
      for (const [k, v] of Object.entries(this.base.reg)) if (!(k in cur)) { const [key, name] = k.split('|'); this.onChange({ type: 'reg-deleted', key, name, before: v }); }
    }
    this.base.reg = cur; this.base.regAt = Date.now();
    this.status.registry = { tag: 'autostart registry keys', ok: true, err: '', files: Object.keys(cur).length };
  }
  save() { if (!this.persist) return; try { fs.mkdirSync(path.dirname(this.file), { recursive: true }); fs.writeFileSync(this.file + '.tmp', JSON.stringify(this.base)); fs.renameSync(this.file + '.tmp', this.file); } catch { /* ignore */ } }
  watch() {
    for (const w of this.watchers) { try { w.close(); } catch { /* closed */ } }
    this.watchers = [];
    let t = null;
    const kick = () => { clearTimeout(t); t = setTimeout(() => this.scan().catch(() => {}), 4000); t.unref(); };
    for (const e of this.entries()) {
      try { const w = fs.watch(e.path, { persistent: false, recursive: !!e.depth && process.platform !== 'linux' }, kick); w.on('error', () => {}); this.watchers.push(w); } catch { /* missing or no access: the periodic scan covers it */ }
    }
  }
  view() {
    const files = Object.entries(this.base.files);
    return {
      at: this.base.at, regAt: this.base.regAt, busy: this.busy, files: files.length, registry: Object.keys(this.base.reg).length,
      locations: this.entries().map(e => Object.assign({ path: e.path, tag: e.tag, level: e.level, custom: !!e.custom }, this.status[e.path] || { ok: null, files: 0, err: 'not scanned yet' })),
      registryStatus: this.status.registry || null,
      autostart: Object.entries(this.base.reg).map(([k, v]) => { const [key, name] = k.split('|'); return { key, name, value: v }; }).slice(0, 300),
    };
  }
}

module.exports = { Fim, defaults };

};
__M["lib/siem/index.js"] = function (module, exports, require) {
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

};
__M["lib/siem/ips.js"] = function (module, exports, require) {
'use strict';
// Every remote address this machine talked to in the last year (ips.json), the programs that ran on it
// (programs.json), and an optional threat-intel feed matcher (FireHOL level 1 + abuse.ch Feodo, opt-in).
const fs = require('fs');
const path = require('path');
const https = require('https');
const U = require('../util');
const { dayKey, DAY } = require('./store');

function writeAtomic(file, text) {
  try { fs.mkdirSync(path.dirname(file), { recursive: true }); const tmp = file + '.tmp'; fs.writeFileSync(tmp, text); fs.renameSync(tmp, file); return true; } catch { return false; }
}
const pushCap = (a, v, n) => { if (v == null || v === '' || a.includes(v)) return; a.push(v); if (a.length > n) a.shift(); };
const SKIP_KINDS = new Set(['loopback', 'any', 'multicast']);

class IpTracker {
  constructor(file, persist, retentionDays, onNewDay) {
    this.file = file; this.persist = persist; this.retention = retentionDays; this.onNewDay = onNewDay || (() => {});
    this.map = new Map(); this.conns = new Set(); this.dirty = false; this.seeded = false;
    if (persist) {
      try { for (const e of JSON.parse(fs.readFileSync(file, 'utf8'))) if (e && e.ip) this.map.set(e.ip, e); this.seeded = this.map.size > 0; } catch { /* first run */ }
    }
    this.prune();
    this.timer = setInterval(() => this.save(), 60000); this.timer.unref();
  }
  entry(ip, now) {
    let e = this.map.get(ip);
    if (!e) { e = { ip, kind: U.ipKind(ip), first: now, last: now, conns: 0, inb: 0, outb: 0, procs: [], rports: [], lports: [], ok: 0, fail: 0, drops: 0, events: 0, maxLevel: 0 }; this.map.set(ip, e); this.dirty = true; e.isNew = true; }
    if (now > e.last) e.last = now;
    if (now < e.first) e.first = now;
    const d = dayKey(now);
    if (e.day !== d && now > Date.now() - DAY) { e.day = d; this.onNewDay(d, ip); }
    return e;
  }
  /** called on every fresh socket table. Returns { inbound: [{ip, port, process}], fresh: [ip] } */
  observe(sock, nameOf, now = Date.now()) {
    const listen = new Set(sock.listen.filter(l => l.proto === 'TCP').map(l => l.port));
    const cur = new Set(), inbound = [], fresh = [];
    for (const c of sock.conns) {
      if (!c.rh || SKIP_KINDS.has(U.ipKind(c.rh))) continue;
      const key = c.proto + '|' + c.lp + '|' + c.rh + '|' + c.rp;
      cur.add(key);
      const known = this.map.has(c.rh);
      const e = this.entry(c.rh, now);
      if (!known) fresh.push(c.rh);
      if (this.conns.has(key)) continue;
      e.conns++; this.dirty = true;
      const isIn = c.proto === 'TCP' && listen.has(c.lp) && c.rp > 0;
      const proc = nameOf(c.pid);
      pushCap(e.procs, proc, 8);
      if (isIn) { e.inb++; pushCap(e.lports, c.lp, 12); if (e.kind === 'public' || e.kind === 'cgnat') inbound.push({ ip: c.rh, port: c.lp, process: proc, pid: c.pid }); }
      else { e.outb++; pushCap(e.rports, c.rp, 12); }
    }
    this.conns = cur;
    this.seeded = true;
    return { inbound, fresh };
  }
  noteAuth(ip, ok, ts) { const e = this.entry(ip, ts); if (ok) { e.ok++; e.lastOk = ts; } else { e.fail++; e.lastFail = ts; } this.dirty = true; }
  noteDrop(ip, n, ports, ts) { const e = this.entry(ip, ts); e.drops += n; for (const p of ports) pushCap(e.lports, p, 12); this.dirty = true; }
  noteEvent(ip, level, ts) { const e = this.entry(ip, ts); e.events++; if (level > e.maxLevel) e.maxLevel = level; this.dirty = true; }
  hasLoggedIn(ip) { const e = this.map.get(ip); return !!(e && e.ok > 0); }
  get(ip) { return this.map.get(ip) || null; }
  list(fromMs) { const out = []; for (const e of this.map.values()) if (e.last >= fromMs) out.push(e); return out; }
  prune() {
    const cut = Date.now() - this.retention * DAY;
    for (const [k, e] of this.map) if (e.last < cut) this.map.delete(k);
    if (this.map.size > 20000) {
      const keep = [...this.map.values()].sort((a, b) => (b.maxLevel - a.maxLevel) || (b.last - a.last)).slice(0, 15000);
      this.map = new Map(keep.map(e => [e.ip, e]));
    }
  }
  save(force) {
    if (!this.persist || (!this.dirty && !force)) return;
    this.prune();
    writeAtomic(this.file, JSON.stringify([...this.map.values()].map(e => { const o = Object.assign({}, e); delete o.isNew; return o; })));
    this.dirty = false;
  }
}

/** executables seen running (for "program ran for the first time") */
class Programs {
  constructor(file, persist, retentionDays) {
    this.file = file; this.persist = persist; this.retention = retentionDays; this.map = new Map(); this.dirty = false; this.seeded = false;
    this.started = Date.now(); this.warmUntil = Date.now() + 180e3; // process paths arrive gradually at start-up
    if (persist) { try { for (const e of JSON.parse(fs.readFileSync(file, 'utf8'))) this.map.set(e.k, e); this.seeded = this.map.size > 0; } catch { /* first run */ } }
    this.timer = setInterval(() => this.save(), 120000); this.timer.unref();
  }
  /** returns the processes whose executable was never seen before (empty on the very first scan) */
  observe(procs, now = Date.now()) {
    const fresh = [];
    // never seed the baseline from an empty or partial list (collectors still starting)
    if (!this.seeded && procs.filter(p => p.exe).length < 10) return fresh;
    for (const p of procs) {
      if (!p.exe || p.kind === 'rigwatch') continue;
      const k = p.exe.toLowerCase();
      const e = this.map.get(k);
      if (e) { if (now - e.last > 60000) { e.last = now; this.dirty = true; } continue; }
      this.map.set(k, { k, exe: p.exe, name: p.name, first: now, last: now });
      this.dirty = true;
      // "ran for the first time" only for processes that started after RigWatch did
      const startedBefore = p.age != null && p.age > (now - this.started) / 1000 + 20;
      if (this.seeded && now > this.warmUntil && !startedBefore) fresh.push(p);
    }
    this.seeded = true;
    // a burst (e.g. after restarting elevated, when paths of system processes become visible) is a baseline refresh
    return fresh.length > 25 ? [] : fresh;
  }
  list() { return [...this.map.values()]; }
  save(force) {
    if (!this.persist || (!this.dirty && !force)) return;
    const cut = Date.now() - this.retention * DAY;
    for (const [k, e] of this.map) if (e.last < cut) this.map.delete(k);
    if (this.map.size > 30000) this.map = new Map([...this.map].sort((a, b) => b[1].last - a[1].last).slice(0, 25000));
    writeAtomic(this.file, JSON.stringify([...this.map.values()]));
    this.dirty = false;
  }
}

// ---------------------------------------------------------------------------
// threat-intel feeds (IPv4 lists; only fetched when the user turns the feed on)
// ---------------------------------------------------------------------------
const FEEDS = [
  { name: 'FireHOL level 1', id: 'firehol1', url: 'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/firehol_level1.netset' },
  { name: 'abuse.ch Feodo Tracker', id: 'feodo', url: 'https://feodotracker.abuse.ch/downloads/ipblocklist.txt' },
];
const ip4 = s => { const p = String(s).split('.'); if (p.length !== 4) return null; let n = 0; for (const x of p) { const v = +x; if (!/^\d{1,3}$/.test(x) || v > 255) return null; n = n * 256 + v; } return n; };
/** parse a netset / ip list into sorted, merged [start, end, feedIndex] ranges */
function parseList(text, fi) {
  const out = [];
  for (const raw of String(text).split('\n')) {
    const line = raw.trim(); if (!line || line[0] === '#' || line[0] === ';') continue;
    const m = line.match(/^(\d+\.\d+\.\d+\.\d+)(?:\/(\d{1,2}))?/); if (!m) continue;
    const a = ip4(m[1]); if (a == null) continue;
    const bits = m[2] != null ? +m[2] : 32; if (bits < 8 || bits > 32) continue;
    const size = 2 ** (32 - bits), start = Math.floor(a / size) * size;
    out.push([start, start + size - 1, fi]);
  }
  return out;
}
function fetchText(url, max = 8 << 20, hops = 3) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'user-agent': 'RigWatch' }, timeout: 20000 }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && hops > 0) { res.resume(); return resolve(fetchText(new URL(res.headers.location, url).toString(), max, hops - 1)); }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      let size = 0; const chunks = [];
      res.on('data', d => { size += d.length; if (size > max) { req.destroy(new Error('feed too large')); return; } chunks.push(d); });
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}
class Feeds {
  constructor(dir, persist) { this.dir = dir; this.persist = persist; this.ranges = []; this.meta = {}; this.at = 0; this.err = ''; this.busy = false; }
  load() {
    const all = [];
    FEEDS.forEach((f, i) => { const text = U.readText(path.join(this.dir, f.id + '.txt')); if (text) { const r = parseList(text, i); all.push(...r); this.meta[f.id] = Object.assign(this.meta[f.id] || {}, { name: f.name, entries: r.length }); } });
    this.build(all);
    try { this.at = fs.statSync(path.join(this.dir, FEEDS[0].id + '.txt')).mtimeMs; } catch { this.at = 0; }
  }
  build(list) { list.sort((a, b) => a[0] - b[0]); this.ranges = list; }
  async refresh() {
    if (this.busy) return; this.busy = true; this.err = '';
    const all = [];
    try {
      for (let i = 0; i < FEEDS.length; i++) {
        const f = FEEDS[i];
        try {
          const text = await fetchText(f.url);
          const r = parseList(text, i);
          if (r.length) { all.push(...r); this.meta[f.id] = { name: f.name, entries: r.length, at: Date.now() }; if (this.persist) writeAtomic(path.join(this.dir, f.id + '.txt'), text); }
        } catch (e) { this.err = f.name + ': ' + e.message; const old = U.readText(path.join(this.dir, f.id + '.txt')); if (old) all.push(...parseList(old, i)); }
      }
      if (all.length) { this.build(all); this.at = Date.now(); }
    } finally { this.busy = false; }
  }
  /** feed name for a public IPv4 address, or null */
  match(ip) {
    if (!this.ranges.length || U.ipKind(ip) !== 'public') return null;
    const n = ip4(ip); if (n == null) return null;
    let lo = 0, hi = this.ranges.length - 1, hit = null;
    while (lo <= hi) { const mid = (lo + hi) >> 1, r = this.ranges[mid]; if (r[0] <= n) { if (r[1] >= n) { hit = r; break; } lo = mid + 1; } else hi = mid - 1; }
    // overlapping ranges: scan back a little from the insertion point
    if (!hit) for (let i = Math.min(hi, this.ranges.length - 1); i >= 0 && i > hi - 64; i--) { const r = this.ranges[i]; if (r[0] <= n && r[1] >= n) { hit = r; break; } }
    return hit ? FEEDS[hit[2]].name : null;
  }
  status() { return { entries: this.ranges.length, at: this.at, err: this.err, busy: this.busy, feeds: FEEDS.map(f => Object.assign({ name: f.name, url: f.url }, this.meta[f.id] || {})) }; }
}

module.exports = { IpTracker, Programs, Feeds, parseList, ip4, FEEDS };

};
__M["lib/siem/rules.js"] = function (module, exports, require) {
'use strict';
// Detection rules in the spirit of Wazuh: every event gets a rule id, a level (0-15), groups and
// MITRE ATT&CK technique ids. This file is pure logic (no I/O) so it is unit-tested.
const U = require('../util');

const RULES = {};
function R(id, level, description, groups, mitre) { RULES[id] = { id, level, description, groups, mitre: mitre || [] }; }

// 1xxx system
R(1001, 2, 'RigWatch started', ['rigwatch']);
R(1002, 3, 'System boot', ['system']);
R(1003, 3, 'System shutdown or restart requested', ['system']);
R(1004, 6, 'Unexpected shutdown (crash or power loss)', ['system']);
// 2xxx authentication
R(2001, 3, 'Successful logon', ['authentication_success'], ['T1078']);
R(2002, 6, 'Remote Desktop logon', ['authentication_success', 'rdp'], ['T1021.001']);
R(2003, 5, 'Network logon from another computer', ['authentication_success'], ['T1078']);
R(2004, 5, 'Logon failure', ['authentication_failed'], ['T1110']);
R(2005, 9, 'Account locked out', ['authentication_failures'], ['T1110']);
R(2006, 4, 'Logon with explicit credentials', ['authentication_success'], ['T1078']);
R(2007, 2, 'Logoff', ['logoff']);
R(2008, 2, 'Workstation unlocked', ['authentication_success']);
R(2009, 2, 'Workstation locked', ['session']);
R(2010, 10, 'Multiple logon failures from the same source (brute force)', ['authentication_failures', 'brute_force'], ['T1110']);
R(2011, 12, 'Successful logon after multiple failures', ['authentication_success', 'brute_force'], ['T1110']);
R(2012, 7, 'First logon from a new source address', ['authentication_success', 'new_source'], ['T1078']);
R(2013, 10, 'Logon from a public internet address', ['authentication_success', 'remote_access'], ['T1133']);
R(2014, 3, 'Remote Desktop session reconnected', ['rdp', 'session'], ['T1021.001']);
R(2015, 2, 'Remote Desktop session disconnected', ['rdp', 'session']);
R(2016, 5, 'Remote Desktop authentication succeeded', ['rdp', 'authentication_success'], ['T1021.001']);
R(2020, 5, 'SSH login accepted', ['sshd', 'authentication_success'], ['T1021.004']);
R(2021, 5, 'SSH authentication failed', ['sshd', 'authentication_failed'], ['T1110']);
R(2022, 5, 'SSH login attempt for a user that does not exist', ['sshd', 'authentication_failed', 'invalid_login'], ['T1110']);
R(2030, 3, 'Command run with sudo', ['sudo'], ['T1548.003']);
R(2031, 5, 'sudo authentication failure', ['sudo', 'authentication_failed'], ['T1548.003']);
R(2032, 3, 'User session opened', ['authentication_success', 'session']);
R(2033, 2, 'User session closed', ['session', 'logoff']);
// 3xxx accounts
R(3001, 8, 'User account created', ['account_changed', 'adduser'], ['T1136.001']);
R(3002, 8, 'User account deleted', ['account_changed'], ['T1531']);
R(3003, 5, 'User account enabled', ['account_changed'], ['T1098']);
R(3004, 5, 'User account disabled', ['account_changed'], ['T1531']);
R(3005, 6, 'Password reset by another account', ['account_changed'], ['T1098']);
R(3006, 8, 'Account added to a security group', ['account_changed', 'group_changed'], ['T1098']);
R(3007, 12, 'Account added to the Administrators group', ['account_changed', 'group_changed', 'privilege_escalation'], ['T1098']);
// 4xxx system integrity
R(4001, 12, 'Security audit log cleared', ['log_cleared'], ['T1070.001']);
R(4002, 10, 'Event log cleared', ['log_cleared'], ['T1070.001']);
R(4003, 9, 'Audit policy changed', ['policy_changed'], ['T1562.002']);
R(4004, 8, 'New service installed', ['service_installed'], ['T1543.003']);
R(4005, 7, 'Scheduled task created', ['scheduled_task'], ['T1053.005']);
// 5xxx defenses
R(5001, 12, 'Malware detected by Microsoft Defender', ['malware', 'defender']);
R(5002, 8, 'Microsoft Defender acted on malware', ['malware', 'defender']);
R(5003, 12, 'Defender protection turned off', ['defender', 'defense_evasion'], ['T1562.001']);
R(5004, 6, 'Defender configuration changed', ['defender'], ['T1562.001']);
R(5005, 4, 'Firewall rule added or changed', ['firewall'], ['T1562.004']);
R(5006, 4, 'Firewall rule deleted', ['firewall'], ['T1562.004']);
R(5007, 7, 'Firewall setting changed', ['firewall'], ['T1562.004']);
// 6xxx network
R(6001, 3, 'New listening port', ['network', 'port_open']);
R(6002, 6, 'Port open on all network interfaces', ['network', 'port_open'], ['T1133']);
R(6003, 1, 'Listening port closed', ['network']);
R(6004, 2, 'First contact with a remote host', ['network', 'new_host']);
R(6005, 6, 'Inbound connection from the internet', ['network', 'inbound'], ['T1133']);
R(6006, 12, 'Traffic with a known-malicious address (threat feed)', ['network', 'threat_intel'], ['T1071']);
R(6007, 3, 'Inbound packets dropped by the firewall', ['network', 'firewall_drop']);
R(6008, 10, 'Port scan detected', ['network', 'port_scan', 'recon'], ['T1046']);
R(6009, 5, 'New device on the local network', ['network', 'lan']);
R(6010, 3, 'Address blocked', ['active_response', 'firewall']);
R(6011, 3, 'Address unblocked', ['active_response', 'firewall']);
R(6012, 8, 'Address blocked automatically (active response)', ['active_response', 'firewall']);
// 7xxx processes
R(7001, 3, 'Program ran for the first time', ['process', 'new_program'], ['T1204']);
R(7002, 8, 'Suspicious process started', ['process', 'suspicious'], ['T1036']);
// 8xxx RigWatch
R(8001, 7, 'Monitoring alert fired', ['rigwatch', 'alert']);
R(8002, 7, 'Security finding', ['rigwatch', 'finding']);
R(8003, 3, 'Action taken in RigWatch', ['rigwatch', 'audit']);
// 9xxx configuration assessment + file integrity
R(9001, 7, 'Configuration check failed', ['sca'], []);
R(9002, 3, 'Configuration check passed', ['sca'], []);
R(9101, 5, 'File added to a monitored location', ['syscheck', 'syscheck_entry_added']);
R(9102, 7, 'Monitored file modified', ['syscheck', 'syscheck_entry_modified'], ['T1565.001']);
R(9103, 5, 'Monitored file deleted', ['syscheck', 'syscheck_entry_deleted'], ['T1070.004']);
R(9104, 8, 'Autostart entry added or changed', ['syscheck', 'registry', 'persistence'], ['T1547.001']);
R(9105, 5, 'Autostart entry removed', ['syscheck', 'registry']);

const TACTICS = ['Initial Access', 'Execution', 'Persistence', 'Privilege Escalation', 'Defense Evasion', 'Credential Access', 'Discovery', 'Lateral Movement', 'Collection', 'Command and Control', 'Exfiltration', 'Impact'];
const TECH_TACTICS = {
  T1078: ['Initial Access', 'Persistence', 'Privilege Escalation', 'Defense Evasion'], T1110: ['Credential Access'], 'T1021.001': ['Lateral Movement'], 'T1021.004': ['Lateral Movement'],
  T1133: ['Initial Access', 'Persistence'], 'T1136.001': ['Persistence'], T1531: ['Impact'], T1098: ['Persistence', 'Privilege Escalation'], 'T1070.001': ['Defense Evasion'], 'T1070.004': ['Defense Evasion'],
  'T1562.002': ['Defense Evasion'], 'T1543.003': ['Persistence', 'Privilege Escalation'], 'T1053.005': ['Execution', 'Persistence', 'Privilege Escalation'], 'T1562.001': ['Defense Evasion'],
  'T1562.004': ['Defense Evasion'], T1071: ['Command and Control'], T1046: ['Discovery'], T1204: ['Execution'], T1036: ['Defense Evasion'], 'T1548.003': ['Privilege Escalation', 'Defense Evasion'],
  'T1565.001': ['Impact'], 'T1547.001': ['Persistence', 'Privilege Escalation'],
};

// Compliance tags per rule group, in the style of the Wazuh ruleset (orientation, not certification).
const COMPLIANCE = {
  pci_dss: { name: 'PCI DSS', reqs: { '1.1.1': 'Approve and test network connections', '1.3': 'Prohibit direct public access', '2.2': 'Configuration standards', '5.1': 'Deploy anti-virus software', '5.2': 'Anti-virus current and logging', '8.1.2': 'Control user IDs and credentials', '10.2.2': 'Log actions by privileged users', '10.2.4': 'Log invalid access attempts', '10.2.5': 'Log use of identification and authentication', '10.2.7': 'Log creation and deletion of system objects', '10.5.2': 'Protect audit trails from modification', '10.6': 'Review logs and security events', '11.4': 'Intrusion detection', '11.5': 'Change detection (file integrity)' } },
  gdpr: { name: 'GDPR', reqs: { 'II_5.1.f': 'Integrity and confidentiality of personal data', 'IV_32.2': 'Assess risk of processing (access, alteration)', 'IV_35.7.d': 'Measures to address risks, safeguards', 'IV_33': 'Notification of a personal data breach' } },
  nist_800_53: { name: 'NIST 800-53', reqs: { 'AC.2': 'Account management', 'AC.6': 'Least privilege', 'AC.7': 'Unsuccessful logon attempts', 'AU.6': 'Audit review, analysis and reporting', 'AU.9': 'Protection of audit information', 'AU.12': 'Audit generation', 'AU.14': 'Session audit', 'CM.6': 'Configuration settings', 'IA.4': 'Identifier management', 'SC.7': 'Boundary protection', 'SI.3': 'Malicious code protection', 'SI.4': 'System monitoring', 'SI.5': 'Security alerts and advisories', 'SI.7': 'Software and information integrity' } },
  hipaa: { name: 'HIPAA', reqs: { '164.312.a.1': 'Access control', '164.312.b': 'Audit controls', '164.312.c.1': 'Integrity', '164.312.d': 'Person or entity authentication', '164.308.a.5.ii.C': 'Log-in monitoring', '164.308.a.1.ii.D': 'Information system activity review' } },
};
const GROUP_COMPLIANCE = {
  authentication_success: { pci_dss: ['10.2.5'], gdpr: ['IV_32.2'], nist_800_53: ['AC.7', 'AU.14'], hipaa: ['164.312.b', '164.312.d'] },
  authentication_failed: { pci_dss: ['10.2.4', '10.2.5'], gdpr: ['IV_35.7.d', 'IV_32.2'], nist_800_53: ['AU.14', 'AC.7'], hipaa: ['164.312.b', '164.308.a.5.ii.C'] },
  authentication_failures: { pci_dss: ['10.2.4', '10.2.5', '11.4'], gdpr: ['IV_35.7.d', 'IV_32.2'], nist_800_53: ['AU.14', 'AC.7', 'SI.4'], hipaa: ['164.312.b', '164.308.a.5.ii.C'] },
  account_changed: { pci_dss: ['8.1.2', '10.2.5'], gdpr: ['IV_35.7.d', 'IV_32.2'], nist_800_53: ['AC.2', 'IA.4', 'AU.12'], hipaa: ['164.312.a.1', '164.312.b'] },
  privilege_escalation: { pci_dss: ['10.2.2', '10.2.5'], nist_800_53: ['AC.6', 'AC.2'], gdpr: ['IV_32.2'], hipaa: ['164.312.a.1'] },
  sudo: { pci_dss: ['10.2.2', '10.2.5'], nist_800_53: ['AC.6', 'AU.14'], hipaa: ['164.312.b'] },
  log_cleared: { pci_dss: ['10.5.2'], gdpr: ['II_5.1.f'], nist_800_53: ['AU.9'], hipaa: ['164.312.b'] },
  policy_changed: { pci_dss: ['10.6'], gdpr: ['IV_35.7.d'], nist_800_53: ['AU.6', 'CM.6'], hipaa: ['164.312.b'] },
  service_installed: { pci_dss: ['10.2.7'], nist_800_53: ['AU.12', 'SI.4'], gdpr: ['IV_35.7.d'] },
  scheduled_task: { pci_dss: ['10.2.7'], nist_800_53: ['AU.12', 'SI.4'] },
  malware: { pci_dss: ['5.1', '5.2', '11.4'], gdpr: ['IV_35.7.d', 'IV_33'], nist_800_53: ['SI.3', 'SI.4'], hipaa: ['164.312.b', '164.308.a.1.ii.D'] },
  defense_evasion: { pci_dss: ['5.2', '10.6'], nist_800_53: ['SI.3', 'SI.4'], gdpr: ['IV_35.7.d'] },
  firewall: { pci_dss: ['1.1.1', '1.3'], nist_800_53: ['SC.7'], gdpr: ['IV_35.7.d'] },
  inbound: { pci_dss: ['1.3', '11.4'], nist_800_53: ['SC.7', 'SI.4'], gdpr: ['IV_35.7.d'] },
  port_open: { pci_dss: ['1.3'], nist_800_53: ['SC.7'] },
  port_scan: { pci_dss: ['11.4'], nist_800_53: ['SI.4'], gdpr: ['IV_35.7.d'], hipaa: ['164.312.b'] },
  firewall_drop: { pci_dss: ['1.3', '11.4'], nist_800_53: ['SC.7', 'SI.4'] },
  threat_intel: { pci_dss: ['11.4'], nist_800_53: ['SI.4', 'SI.5'], gdpr: ['IV_35.7.d'], hipaa: ['164.308.a.1.ii.D'] },
  active_response: { pci_dss: ['11.4'], nist_800_53: ['SI.4', 'SC.7'] },
  syscheck: { pci_dss: ['11.5'], gdpr: ['II_5.1.f'], nist_800_53: ['SI.7'], hipaa: ['164.312.c.1'] },
  sca: { pci_dss: ['2.2'], nist_800_53: ['CM.6'], gdpr: ['IV_35.7.d'], hipaa: ['164.312.b'] },
  suspicious: { pci_dss: ['11.4'], nist_800_53: ['SI.4'], gdpr: ['IV_35.7.d'] },
  new_program: { pci_dss: ['11.5'], nist_800_53: ['SI.7', 'CM.6'] },
  audit: { pci_dss: ['10.2.2'], nist_800_53: ['AU.12'], hipaa: ['164.312.b'] },
  rdp: { pci_dss: ['10.2.5', '8.1.2'], nist_800_53: ['AC.7', 'AU.14'], hipaa: ['164.312.d'] },
};
/** { pci_dss: [...], gdpr: [...], ... } for a rule */
function complianceOf(rule) {
  const out = {};
  for (const g of rule.groups || []) for (const [fw, reqs] of Object.entries(GROUP_COMPLIANCE[g] || {})) { out[fw] = out[fw] || []; for (const r of reqs) if (!out[fw].includes(r)) out[fw].push(r); }
  return out;
}

const MITRE = {
  T1078: 'Valid Accounts', T1110: 'Brute Force', 'T1021.001': 'Remote Desktop Protocol', 'T1021.004': 'SSH', T1133: 'External Remote Services',
  'T1136.001': 'Create Local Account', T1531: 'Account Access Removal', T1098: 'Account Manipulation', 'T1070.001': 'Clear Windows Event Logs',
  'T1562.002': 'Disable Windows Event Logging', 'T1543.003': 'Windows Service', 'T1053.005': 'Scheduled Task', 'T1562.001': 'Disable or Modify Tools',
  'T1562.004': 'Disable or Modify System Firewall', T1071: 'Application Layer Protocol', T1046: 'Network Service Discovery', T1204: 'User Execution',
  T1036: 'Masquerading', 'T1548.003': 'Sudo and Sudo Caching', 'T1565.001': 'Stored Data Manipulation', 'T1070.004': 'File Deletion', 'T1547.001': 'Registry Run Keys / Startup Folder',
};

const SEVS = ['info', 'low', 'medium', 'high', 'critical'];
/** level -> band index 0..4 (info, low, medium, high, critical) */
const bandOf = lv => (lv >= 12 ? 4 : lv >= 10 ? 3 : lv >= 7 ? 2 : lv >= 4 ? 1 : 0);
const sevOf = lv => SEVS[bandOf(lv)];

/** Build an event. f: { ip, user, process, msg, location, data, level } */
function mk(ruleId, ts, f = {}) {
  const r = RULES[ruleId];
  const ev = { ts: Math.round(ts), rule: { id: r.id, level: f.level != null ? f.level : r.level, description: r.description, groups: r.groups } };
  if (r.mitre.length) ev.rule.mitre = r.mitre;
  if (f.ip) ev.ip = f.ip;
  if (f.user) ev.user = f.user;
  if (f.process) ev.process = f.process;
  ev.msg = f.msg || r.description;
  if (f.location) ev.location = f.location;
  if (f.data) { const d = {}; for (const [k, v] of Object.entries(f.data)) if (v !== '' && v != null) d[k] = v; if (Object.keys(d).length) ev.data = d; }
  return ev;
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const SYS_SID = /^S-1-5-(18|19|20)$/;
const SVC_USER = /^(DWM-\d+|UMFD-\d+|ANONYMOUS LOGON|LOCAL SERVICE|NETWORK SERVICE|SYSTEM)$|\$$/i;
const cleanIp = v => { v = String(v || '').trim().replace(/^::ffff:/i, ''); return !v || v === '-' || v === 'LOCAL' ? '' : v; };
const isLocalIp = ip => !ip || ['loopback', 'any'].includes(U.ipKind(ip));
const base = p => String(p || '').split(/[\\/]/).pop();
const acct = (dom, user) => { user = String(user || '').trim(); dom = String(dom || '').trim(); return !user || user === '-' ? '' : dom && dom !== '-' && !/^(NT AUTHORITY|Window Manager|Font Driver Host)$/i.test(dom) ? dom + '\\' + user : user; };
const hex = v => { v = String(v || ''); return /^\d+$/.test(v) ? '0x' + (+v).toString(16).padStart(8, '0') : v.toLowerCase(); };
const LOGON_TYPES = { 2: 'interactive', 3: 'network', 4: 'batch', 5: 'service', 7: 'unlock', 8: 'network (cleartext)', 9: 'new credentials', 10: 'remote desktop', 11: 'cached interactive', 12: 'cached remote desktop', 13: 'cached unlock' };
const FAIL_REASONS = {
  '0xc0000064': 'user does not exist', '0xc000006a': 'wrong password', '0xc0000234': 'account locked', '0xc0000072': 'account disabled',
  '0xc000006f': 'outside allowed hours', '0xc0000070': 'workstation not allowed', '0xc0000193': 'account expired', '0xc0000071': 'password expired',
  '0xc0000133': 'clock out of sync', '0xc0000224': 'password must change', '0xc000015b': 'logon type not granted', '0xc000006d': 'bad user name or password',
  '0xc000006e': 'account restriction', '0xc0000413': 'authentication firewall',
};
const NOISY_EXPLICIT = /^(svchost|lsass|services|consent|winlogon|taskhostw|wininit|smss)\.exe$/i;

// ---------------------------------------------------------------------------
// Windows event log -> events.  raw = { k, id, rid, t, p:[string...], m? }
// ctx = { admins: Set(logonId) } (filled from 4672 in the same batch)
// ---------------------------------------------------------------------------
function fromWin(raw, ctx = {}) {
  const p = raw.p || [], t = raw.t || Date.now(), id = raw.id;
  const loc = (raw.k && raw.k.startsWith('sec') ? 'Security' : { sys: 'System', def: 'Defender', fw: 'Firewall', rdp: 'RemoteDesktop', ssh: 'OpenSSH' }[raw.k] || raw.k) + '/' + id;
  const msg = raw.m || '';
  switch (loc.split('/')[0] + ':' + id) {
    case 'Security:4624': {
      const type = +p[8], sid = p[4], user = p[5], ip = cleanIp(p[18]);
      if (SYS_SID.test(sid) || sid === 'S-1-5-7' || SVC_USER.test(user || '') || [0, 4, 5].includes(type)) return [];
      if ((type === 3 || type === 8) && isLocalIp(ip)) return [];
      const rule = type === 10 || type === 12 ? 2002 : type === 3 || type === 8 ? 2003 : type === 7 || type === 13 ? 2008 : 2001;
      const admin = (ctx.admins && ctx.admins.has(p[7])) || p[26] === '%%1842';
      const who = acct(p[6], user);
      return [mk(rule, t, { user: who, ip, process: base(p[17]), location: loc, msg: who + ' signed in (' + (LOGON_TYPES[type] || 'type ' + type) + (ip ? ' from ' + ip : '') + ')' + (admin ? ' with admin rights' : ''), data: { logonType: type, logonId: p[7], admin: admin || undefined, workstation: p[11] !== '-' ? p[11] : '', auth: p[10] } })];
    }
    case 'Security:4625': {
      const type = +p[10], ip = cleanIp(p[19]), who = acct(p[6], p[5]), sub = hex(p[9]), st = hex(p[7]);
      const reason = FAIL_REASONS[sub] || FAIL_REASONS[st] || sub || st;
      return [mk(2004, t, { user: who, ip, process: base(p[18]), location: loc, msg: 'Failed logon for ' + (who || '(unknown)') + (ip ? ' from ' + ip : '') + ': ' + reason, data: { logonType: type, reason, status: st, subStatus: sub, workstation: p[13] !== '-' ? p[13] : '' } })];
    }
    case 'Security:4634': case 'Security:4647': {
      const sid = p[0], user = p[1];
      if (SYS_SID.test(sid) || SVC_USER.test(user || '')) return [];
      const who = acct(p[2], user);
      return [mk(2007, t, { user: who, location: loc, msg: who + ' signed out', data: { logonId: p[3], logonType: id === 4634 ? +p[4] : undefined } })];
    }
    case 'Security:4648': {
      const proc = base(p[11]), target = acct(p[6], p[5]);
      if (SYS_SID.test(p[0]) || NOISY_EXPLICIT.test(proc) || /\$$/.test(p[5] || '') || !p[5] || p[5] === '-') return [];
      const ip = cleanIp(p[12]);
      return [mk(2006, t, { user: target, ip, process: proc, location: loc, msg: acct(p[2], p[1]) + ' used the credentials of ' + target + (p[8] && p[8] !== 'localhost' ? ' for ' + p[8] : '') + (proc ? ' (' + proc + ')' : ''), data: { subject: acct(p[2], p[1]), server: p[8] } })];
    }
    case 'Security:4720': return [mk(3001, t, { user: acct(p[1], p[0]), location: loc, msg: 'Account ' + acct(p[1], p[0]) + ' created by ' + acct(p[5], p[4]), data: { by: acct(p[5], p[4]) } })];
    case 'Security:4726': return [mk(3002, t, { user: acct(p[1], p[0]), location: loc, msg: 'Account ' + acct(p[1], p[0]) + ' deleted by ' + acct(p[5], p[4]), data: { by: acct(p[5], p[4]) } })];
    case 'Security:4722': return [mk(3003, t, { user: acct(p[1], p[0]), location: loc, msg: 'Account ' + acct(p[1], p[0]) + ' enabled by ' + acct(p[5], p[4]), data: { by: acct(p[5], p[4]) } })];
    case 'Security:4725': return [mk(3004, t, { user: acct(p[1], p[0]), location: loc, msg: 'Account ' + acct(p[1], p[0]) + ' disabled by ' + acct(p[5], p[4]), data: { by: acct(p[5], p[4]) } })];
    case 'Security:4724': {
      if (p[0] === p[4]) return [];
      return [mk(3005, t, { user: acct(p[1], p[0]), location: loc, msg: 'Password of ' + acct(p[1], p[0]) + ' reset by ' + acct(p[5], p[4]), data: { by: acct(p[5], p[4]) } })];
    }
    case 'Security:4728': case 'Security:4732': case 'Security:4756': {
      const member = p[0] && p[0] !== '-' ? p[0] : p[1], group = acct(p[3], p[2]), admins = p[4] === 'S-1-5-32-544';
      return [mk(admins ? 3007 : 3006, t, { user: member, location: loc, msg: member + ' added to ' + group + ' by ' + acct(p[7], p[6]), data: { group, by: acct(p[7], p[6]) } })];
    }
    case 'Security:4740': return [mk(2005, t, { user: p[0], location: loc, msg: 'Account ' + p[0] + ' locked out' + (p[1] ? ' (caller ' + p[1] + ')' : ''), data: { caller: p[1] } })];
    case 'Security:4719': return [mk(4003, t, { user: acct(p[2], p[1]), location: loc, msg: 'Audit policy changed by ' + acct(p[2], p[1]) })];
    case 'Security:1102': return [mk(4001, t, { user: acct(p[2], p[1]), location: loc, msg: 'Security log cleared by ' + (acct(p[2], p[1]) || 'unknown') })];
    case 'Security:4697': return [mk(4004, t, { user: acct(p[2], p[1]), location: loc, msg: 'Service "' + p[4] + '" installed by ' + acct(p[2], p[1]), data: { service: p[4], image: p[5] } })];
    case 'Security:4698': return [mk(4005, t, { user: acct(p[2], p[1]), location: loc, msg: 'Scheduled task ' + p[4] + ' created by ' + acct(p[2], p[1]), data: { task: p[4] } })];
    case 'Security:4778': case 'Security:4779': {
      const ip = cleanIp(p[5]);
      return [mk(id === 4778 ? 2014 : 2015, t, { user: acct(p[1], p[0]), ip, location: loc, msg: acct(p[1], p[0]) + (id === 4778 ? ' reconnected' : ' disconnected') + ' (' + p[3] + (p[4] && p[4] !== 'Unknown' ? ' from ' + p[4] : '') + (ip ? ' ' + ip : '') + ')', data: { session: p[3], client: p[4] } })];
    }
    case 'Security:4800': case 'Security:4801': return [mk(id === 4800 ? 2009 : 2008, t, { user: acct(p[2], p[1]), location: loc, msg: acct(p[2], p[1]) + (id === 4800 ? ' locked the workstation' : ' unlocked the workstation') })];
    case 'System:7045': {
      if (/^(Windows Defender|Microsoft Defender)/i.test(p[0] || '')) return [];
      return [mk(4004, t, { location: loc, user: p[4], msg: 'Service "' + p[0] + '" installed (' + (p[3] || '') + ')', data: { service: p[0], image: p[1], account: p[4] } })];
    }
    case 'System:104': return [mk(4002, t, { location: loc, user: p[0], msg: 'Event log cleared' + (p[2] ? ': ' + p[2] : '') + (p[0] ? ' by ' + acct(p[1], p[0]) : ''), data: { text: msg ? U.trunc(msg, 200) : '' } })];
    case 'System:1074': return [mk(1003, t, { location: loc, user: p[6], process: base(p[0]), msg: (p[4] || 'Shutdown') + ' requested by ' + (base(p[0]) || 'unknown') + (p[6] ? ' for ' + p[6] : '') + (p[2] ? ': ' + p[2] : ''), data: { reason: p[2], comment: p[5] } })];
    case 'System:6005': return [mk(1002, t, { location: loc, msg: 'System started' })];
    case 'System:41': return [mk(1004, t, { location: loc, msg: 'The system restarted without shutting down cleanly' })];
    case 'Defender:1116': return [mk(5001, t, { location: loc, user: p[19], process: base(p[18]), msg: 'Defender detected ' + (p[7] || 'malware') + (p[21] ? ' in ' + U.trunc(p[21], 160) : ''), data: { threat: p[7], severity: p[9], path: p[21], text: msg ? U.trunc(msg, 300) : '' } })];
    case 'Defender:1117': return [mk(5002, t, { location: loc, user: p[19], msg: 'Defender acted on ' + (p[7] || 'a threat') + (p[30] ? ': ' + p[30] : ''), data: { threat: p[7], path: p[21], action: p[30], text: msg ? U.trunc(msg, 300) : '' } })];
    case 'Defender:5001': return [mk(5003, t, { location: loc, msg: 'Defender real-time protection was turned off' })];
    case 'Defender:5010': return [mk(5003, t, { location: loc, msg: 'Defender scanning for malware was turned off' })];
    case 'Defender:5012': return [mk(5003, t, { location: loc, msg: 'Defender scanning for viruses was turned off' })];
    case 'Defender:5007': {
      // routine setting churn is noise; exclusions and switched-off protections are what attackers do
      const nv = String(p[3] || ''), ov = String(p[2] || ''), txt = nv || ov;
      if (/\\Exclusions\\/i.test(txt)) return [mk(5004, t, { location: loc, level: 10, msg: 'Defender exclusion ' + (nv ? 'added or changed' : 'removed') + ': ' + U.trunc(txt.replace(/^.*\\Exclusions\\/i, ''), 200), data: { old: U.trunc(ov, 300), new: U.trunc(nv, 300) } })];
      if (/Disable(RealtimeMonitoring|AntiSpyware|BehaviorMonitoring|IOAVProtection|ScriptScanning|OnAccessProtection)\s*=\s*0x1\b/i.test(nv)) return [mk(5003, t, { location: loc, msg: 'Defender protection switched off: ' + U.trunc(nv.replace(/^.*\\/, ''), 160), data: { new: U.trunc(nv, 300) } })];
      return [];
    }
    case 'Firewall:2003': return [mk(5007, t, { location: loc, msg: 'A Windows Firewall setting changed', data: { setting: p[1], value: p[3] } })];
    case 'Firewall:2004': case 'Firewall:2005': case 'Firewall:2097': case 'Firewall:2099': {
      const by = base(p[22]);
      if (/^svchost\.exe$/i.test(by) || /^RigWatch/.test(p[1] || '')) return [];
      return [mk(5005, t, { location: loc, process: by, msg: 'Firewall rule "' + p[1] + '" ' + (id === 2004 || id === 2097 ? 'added' : 'changed') + (by ? ' by ' + by : ''), data: { rule: p[1], app: p[3], direction: p[5] === '1' ? 'in' : p[5] === '2' ? 'out' : p[5] } })];
    }
    case 'Firewall:2006': case 'Firewall:2052': {
      const by = base(p[3]);
      if (/^svchost\.exe$/i.test(by) || /^RigWatch/.test(p[1] || '')) return [];
      return [mk(5006, t, { location: loc, process: by, msg: 'Firewall rule "' + p[1] + '" deleted' + (by ? ' by ' + by : ''), data: { rule: p[1] } })];
    }
    case 'RemoteDesktop:1149': {
      const ip = cleanIp(p[2]), who = acct(p[1], p[0]);
      return [mk(2016, t, { user: who, ip, location: loc, msg: 'Remote Desktop authentication for ' + who + (ip ? ' from ' + ip : '') })];
    }
    case 'OpenSSH:4': return fromAuthLine('sshd', msg, t, loc);
  }
  return [];
}

// ---------------------------------------------------------------------------
// Linux / OpenSSH auth lines (journal MESSAGE or syslog text)
// ---------------------------------------------------------------------------
function fromAuthLine(ident, msg, ts, location) {
  msg = String(msg || '').trim(); ident = String(ident || '');
  const loc = location || ident;
  let m;
  if (/^sshd/.test(ident)) {
    if ((m = msg.match(/^Accepted (\S+) for (\S+) from (\S+) port (\d+)/))) return [mk(2020, ts, { user: m[2], ip: cleanIp(m[3]), location: loc, msg: 'SSH login for ' + m[2] + ' from ' + m[3] + ' (' + m[1] + ')', data: { method: m[1], port: +m[4] } })];
    if ((m = msg.match(/^Failed (\S+) for (invalid user )?(\S*) from (\S+) port (\d+)/))) {
      if (m[2]) return []; // counted by the "Invalid user" line
      return [mk(2021, ts, { user: m[3], ip: cleanIp(m[4]), location: loc, msg: 'SSH ' + m[1] + ' failed for ' + m[3] + ' from ' + m[4], data: { method: m[1], port: +m[5] } })];
    }
    if ((m = msg.match(/^Invalid user (\S*) from (\S+)(?: port (\d+))?/))) return [mk(2022, ts, { user: m[1], ip: cleanIp(m[2]), location: loc, msg: 'SSH login attempt for unknown user ' + (m[1] || '(empty)') + ' from ' + m[2], data: { port: m[3] ? +m[3] : undefined } })];
    return [];
  }
  if (ident === 'sudo') {
    if ((m = msg.match(/^\s*(\S+) : (?:(\d+) incorrect password attempts? ; )?TTY=(\S+) ; PWD=(.+?) ; USER=(\S+) ; (?:.*?; )?COMMAND=(.*)$/))) {
      const bad = m[2] ? +m[2] : 0;
      return [mk(bad ? 2031 : 2030, ts, { user: m[1], location: loc, msg: m[1] + (bad ? ' failed sudo ' + bad + 'x for ' : ' ran as ' + m[5] + ': ') + U.trunc(m[6], 200), data: { runAs: m[5], tty: m[3], cwd: m[4], command: U.trunc(m[6], 300), attempts: bad || undefined } })];
    }
    if ((m = msg.match(/pam_unix\(sudo:auth\): authentication failure;.*\buser=(\S+)/))) return [mk(2031, ts, { user: m[1], location: loc, msg: 'sudo password failure for ' + m[1] })];
    return [];
  }
  if (ident === 'systemd-logind') {
    if ((m = msg.match(/^New session (\S+) of user (\S+?)\.?$/))) return [mk(2032, ts, { user: m[2], location: loc, msg: m[2] + ' opened session ' + m[1], data: { session: m[1] } })];
    if ((m = msg.match(/^Removed session (\S+?)\.?$/))) return [mk(2033, ts, { location: loc, msg: 'Session ' + m[1] + ' closed', data: { session: m[1] } })];
    return [];
  }
  if (ident === 'su' && (m = msg.match(/session opened for user (\S+?)(?:\(uid=\d+\))? by (\S+?)(?:\(uid=\d+\))?$/))) return [mk(2032, ts, { user: m[1], location: loc, msg: m[2] + ' switched to ' + m[1] + ' with su', data: { by: m[2], via: 'su' } })];
  return [];
}

const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
/** "Nov 13 10:00:01 host sshd[123]: msg" or ISO-timestamped rsyslog lines -> { ts, ident, msg } */
function parseSyslog(line, now = Date.now()) {
  const m = String(line).match(/^(?:(\w{3})\s+(\d{1,2}) (\d\d):(\d\d):(\d\d)|(\d{4}-\d\d-\d\dT[\d:.]+(?:Z|[+-]\d\d:?\d\d)?))\s+\S+\s+([\w.@/-]+?)(?:\[\d+\])?:\s?(.*)$/);
  if (!m) return null;
  let ts;
  if (m[6]) ts = Date.parse(m[6]);
  else {
    const d = new Date(now); d.setMonth(MONTHS[m[1]] != null ? MONTHS[m[1]] : 0, +m[2]); d.setHours(+m[3], +m[4], +m[5], 0);
    if (d.getTime() > now + 86400e3) d.setFullYear(d.getFullYear() - 1);
    ts = d.getTime();
  }
  return Number.isFinite(ts) ? { ts, ident: m[7], msg: m[8] } : null;
}

// ---------------------------------------------------------------------------
// RigWatch timeline events -> SIEM events
// ---------------------------------------------------------------------------
const RISKY = new Set([21, 23, 135, 139, 445, 1433, 1521, 2375, 2376, 3306, 3389, 5432, 5900, 5985, 5986, 6379, 9200, 9229, 11211, 27017]);
function fromTimeline(e) {
  if (!e || e.nosiem) return [];
  const t = e.t || Date.now();
  switch (e.type) {
    case 'system': return /started/i.test(e.title) ? [mk(1001, t, { location: 'rigwatch', msg: e.title + (e.detail ? ' (' + e.detail + ')' : '') })] : [];
    case 'port.open': {
      const all = /all interfaces/.test(e.detail || '');
      return [mk(all ? 6002 : 6001, t, { process: e.name, location: 'rigwatch/ports', level: all && RISKY.has(e.port) ? 9 : undefined, msg: e.title + (all ? ' on all interfaces' : ''), data: { port: e.port, proto: e.proto, pid: e.pid, bound: e.detail } })];
    }
    case 'port.close': return [mk(6003, t, { process: e.name, location: 'rigwatch/ports', msg: e.title, data: { port: e.port, proto: e.proto } })];
    case 'net.newhost': return [mk(6004, t, { ip: e.ip, process: e.name, location: 'rigwatch/connections', msg: e.title, data: { port: e.port, pid: e.pid, hosts: e.ip ? undefined : e.detail } })];
    case 'lan.device': return [mk(6009, t, { ip: e.ip, location: 'rigwatch/lan', msg: e.title, data: { detail: e.detail } })];
    case 'alert.fire': return [mk(8001, t, { location: 'rigwatch/alerts', msg: e.title, data: { alert: e.rule } })];
    case 'finding.new': return [mk(8002, t, { location: 'rigwatch/security', level: { critical: 12, high: 10, medium: 7, low: 4 }[e.sevLevel] || 5, msg: e.title, data: { detail: e.detail, port: e.port, pid: e.pid } })];
    case 'action': return [mk(8003, t, { location: 'rigwatch/audit', user: e.who, msg: e.title, data: { result: e.detail } })];
    case 'proc.start': {
      // only real red flags (fake system names, temp/download folders, tampered or deleted binaries)
      const sus = (e.flags || []).filter(f => /^(masquerade|odd-location|deleted-binary|bad-signature|odd-remote-port)/.test(f));
      return sus.length ? [mk(7002, t, { process: e.name, location: 'rigwatch/processes', level: sus.some(f => /masquerade|bad-signature/.test(f)) ? 12 : 8, msg: e.title + ' (' + sus.join(', ') + ')', data: { pid: e.pid, cmd: e.detail, parent: e.parent, flags: sus.join(',') } })] : [];
    }
  }
  return [];
}

// ---------------------------------------------------------------------------
// correlation: brute force, success after failures
// ---------------------------------------------------------------------------
class Correlator {
  constructor() { this.fails = new Map(); this.fired = new Map(); }
  cool(key, now, ms) { const t = this.fired.get(key); if (t != null && Math.abs(now - t) < ms) return true; this.fired.set(key, now); return false; }
  feed(ev) {
    const out = [], g = ev.rule.groups, now = ev.ts;
    if (g.includes('authentication_failed')) {
      const key = ev.ip && !isLocalIp(ev.ip) ? 'ip:' + ev.ip : ev.user ? 'user:' + String(ev.user).toLowerCase() : null;
      if (key) {
        const a = (this.fails.get(key) || []).filter(x => now - x <= 600e3 && x <= now);
        a.push(now); this.fails.set(key, a);
        const recent = a.filter(x => now - x <= 120e3).length;
        if (recent >= 5 && !this.cool(key + '#bf', now, 600e3)) out.push(mk(2010, now, { ip: ev.ip, user: ev.user, location: ev.location, msg: recent + ' failed logons within 2 minutes ' + (ev.ip && !isLocalIp(ev.ip) ? 'from ' + ev.ip : 'for ' + ev.user), data: { count: recent } }));
      }
    } else if (g.includes('authentication_success') && ev.ip && !isLocalIp(ev.ip)) {
      const a = (this.fails.get('ip:' + ev.ip) || []).filter(x => now - x <= 600e3 && x <= now);
      if (a.length >= 3 && !this.cool(ev.ip + '#ok', now, 600e3)) out.push(mk(2011, now, { ip: ev.ip, user: ev.user, location: ev.location, msg: ev.user + ' signed in from ' + ev.ip + ' after ' + a.length + ' failed attempts', data: { failures: a.length } }));
    }
    if (this.fails.size > 5000) for (const [k, a] of this.fails) if (!a.length || now - a[a.length - 1] > 600e3) this.fails.delete(k);
    if (this.fired.size > 5000) for (const [k, t] of this.fired) if (now - t > 3600e3) this.fired.delete(k);
    return out;
  }
}

// ---------------------------------------------------------------------------
// query language: free text plus key:value filters
//   ip:1.2.3.4  user:admin  rule:2004  group:brute_force  mitre:T1110  loc:security  proc:sshd  level>=7
// ---------------------------------------------------------------------------
function parseQuery(q) {
  const f = { text: [], not: [] };
  for (const tok of String(q || '').match(/[^\s"]+(?:"[^"]*")?|"[^"]*"/g) || []) {
    const t = tok.replace(/"/g, '');
    let m;
    if ((m = t.match(/^level\s*(>=|<=|>|<|=|:)\s*(\d+)$/i))) { const n = +m[2]; if (m[1] === '>=' ) f.min = n; else if (m[1] === '>') f.min = n + 1; else if (m[1] === '<=') f.max = n; else if (m[1] === '<') f.max = n - 1; else { f.min = n; f.max = n; } continue; }
    if ((m = t.match(/^(ip|user|rule|group|mitre|loc|location|proc|process):(.+)$/i))) { const k = { location: 'loc', process: 'proc' }[m[1].toLowerCase()] || m[1].toLowerCase(); f[k] = m[2].toLowerCase(); continue; }
    if (t.startsWith('-') && t.length > 1) f.not.push(t.slice(1).toLowerCase()); else if (t) f.text.push(t.toLowerCase());
  }
  return f;
}
const jesc = s => JSON.stringify(String(s)).slice(1, -1);
/** quick pre-check on the raw JSON line (avoids JSON.parse for most misses) */
function lineMayMatch(f, lineLower) {
  for (const t of f.text) if (!lineLower.includes(jesc(t))) return false;
  if (f.ip && !lineLower.includes(f.ip)) return false;
  if (f.user && !lineLower.includes(jesc(f.user))) return false;
  if (f.group && !f.group.split(',').some(g => lineLower.includes('"' + g + '"'))) return false;
  return true;
}
function matchEvent(f, ev) {
  const lv = ev.rule.level;
  if (f.min != null && lv < f.min) return false;
  if (f.max != null && lv > f.max) return false;
  if (f.rule && !f.rule.includes(',') && String(ev.rule.id) !== f.rule) return false;
  if (f.ip && !String(ev.ip || '').toLowerCase().startsWith(f.ip)) return false;
  if (f.user && !String(ev.user || '').toLowerCase().includes(f.user)) return false;
  if (f.group) { const want = f.group.split(','); if (!ev.rule.groups.some(g => want.includes(g.toLowerCase()))) return false; }
  if (f.rule && f.rule.includes(',')) { if (!f.rule.split(',').includes(String(ev.rule.id))) return false; }
  if (f.mitre && !(ev.rule.mitre || []).some(m => m.toLowerCase().startsWith(f.mitre))) return false;
  if (f.loc && !String(ev.location || '').toLowerCase().includes(f.loc)) return false;
  if (f.proc && !String(ev.process || '').toLowerCase().includes(f.proc)) return false;
  if (f.text.length || f.not.length) {
    const hay = JSON.stringify(ev).toLowerCase();
    for (const t of f.text) if (!hay.includes(jesc(t))) return false;
    for (const t of f.not) if (hay.includes(jesc(t))) return false;
  }
  return true;
}

module.exports = { RULES, MITRE, TACTICS, TECH_TACTICS, COMPLIANCE, GROUP_COMPLIANCE, complianceOf, SEVS, bandOf, sevOf, mk, fromWin, fromAuthLine, parseSyslog, fromTimeline, Correlator, parseQuery, lineMayMatch, matchEvent, cleanIp, isLocalIp, LOGON_TYPES };

};
__M["lib/siem/sca.js"] = function (module, exports, require) {
'use strict';
// Security configuration assessment (like Wazuh SCA): a hardening benchmark for this machine.
// Windows facts come from the control worker ('scafacts'); Linux and macOS read files and built-in tools.
// Runs at start-up and every 30 minutes; a check that flips raises an event (9001 failed / 9002 passed).
const fs = require('fs');
const os = require('os');
const path = require('path');
const U = require('../util');

const RISKY_PORTS = { 21: 'FTP', 23: 'Telnet', 135: 'RPC', 139: 'NetBIOS', 445: 'SMB', 1433: 'SQL Server', 1521: 'Oracle', 2375: 'Docker API', 3306: 'MySQL', 3389: 'RDP', 5432: 'PostgreSQL', 5900: 'VNC', 5985: 'WinRM', 5986: 'WinRM', 6379: 'Redis', 9200: 'Elasticsearch', 9229: 'Node inspector', 11211: 'Memcached', 27017: 'MongoDB' };
const C = (pci, nist, extra) => Object.assign({ pci_dss: pci, nist_800_53: nist }, extra || {});
const P = 'passed', F = 'failed', NA = 'not applicable';
const r = (res, detail) => ({ result: res, detail: detail || '' });

function exposedCheck() {
  return {
    id: 'net.exposed', cat: 'Network', title: 'No remote-admin or database ports open to the network',
    rationale: 'Services such as RDP, SMB, databases or the Docker API listening on every interface can be reached by anything on your network (or the internet when port-forwarded).',
    remediation: 'Bind dev databases and tools to 127.0.0.1, stop services you do not use, or restrict them with a firewall rule.',
    compliance: C(['1.3', '2.2'], ['SC.7', 'CM.6']),
    eval: (f, ctx) => {
      // 135/139/445 listen on every Windows PC by design; SMB hardening is covered by its own checks
      const bad = (ctx.listen || []).filter(l => l.scope === 'all' && RISKY_PORTS[l.port] && ![135, 139, 445].includes(l.port));
      return bad.length ? r(F, bad.map(l => RISKY_PORTS[l.port] + ' (' + l.proto + ' ' + l.port + ')').filter((v, i, a) => a.indexOf(v) === i).join(', ')) : r(P, 'none found');
    },
  };
}

const WIN = [
  { id: 'win.fw.on', cat: 'Network', title: 'Windows Firewall is on for every network profile', rationale: 'A profile with the firewall off accepts any inbound connection on that kind of network.', remediation: 'Settings > Privacy & security > Windows Security > Firewall & network protection: turn on Domain, Private and Public.', compliance: C(['1.1.1', '1.3'], ['SC.7']),
    eval: f => !f.fw ? r(NA, f.fwErr) : f.fw.every(p => p.on === 'True' || p.on === '1') ? r(P, f.fw.map(p => p.name).join(', ')) : r(F, 'off for ' + f.fw.filter(p => !(p.on === 'True' || p.on === '1')).map(p => p.name).join(', ')) },
  { id: 'win.fw.inbound', cat: 'Network', title: 'Firewall blocks unsolicited inbound connections by default', rationale: 'Default-allow inbound exposes every listening program.', remediation: 'Set the default inbound action to Block (Windows Defender Firewall > Advanced settings > Properties).', compliance: C(['1.3'], ['SC.7']),
    eval: f => !f.fw ? r(NA) : f.fw.some(p => p.inbound === 'Allow') ? r(F, 'Allow on ' + f.fw.filter(p => p.inbound === 'Allow').map(p => p.name).join(', ')) : r(P) },
  { id: 'win.av.on', cat: 'Malware', title: 'Antivirus real-time protection is active', rationale: 'Without real-time scanning, malware runs before anything looks at it.', remediation: 'Turn on Real-time protection in Windows Security, or make sure your third-party antivirus is enabled.', compliance: C(['5.1', '5.2'], ['SI.3']),
    eval: f => { const third = (f.av || []).filter(a => !/defender/i.test(a.name) && ((a.state >> 12) & 1)); if (third.length) return r(P, third.map(a => a.name).join(', ')); if (!f.def) return r(NA, f.defErr); return f.def.rtp ? r(P, 'Microsoft Defender') : r(F, 'Defender real-time protection is off'); } },
  { id: 'win.av.sigs', cat: 'Malware', title: 'Antivirus signatures updated in the last 7 days', rationale: 'Old signatures miss current malware.', remediation: 'Run Windows Update or "Check for updates" in Windows Security > Virus & threat protection.', compliance: C(['5.2'], ['SI.3']),
    eval: f => !f.def || !f.def.av ? r(NA, 'Defender is not the active antivirus') : f.def.sigAge <= 7 ? r(P, f.def.sigAge + ' day(s) old') : r(F, f.def.sigAge + ' days old') },
  { id: 'win.av.tamper', cat: 'Malware', title: 'Defender tamper protection is on', rationale: 'Malware commonly disables Defender first; tamper protection blocks that.', remediation: 'Windows Security > Virus & threat protection settings > Tamper Protection: On.', compliance: C(['5.2'], ['SI.3']),
    eval: f => !f.def || !f.def.av ? r(NA) : f.def.tamper ? r(P) : r(F) },
  { id: 'win.uac', cat: 'Access control', title: 'User Account Control is enabled', rationale: 'With UAC off every program runs with full admin rights.', remediation: 'Control Panel > User Accounts > Change User Account Control settings: do not choose "Never notify".', compliance: C(['2.2'], ['AC.6']),
    eval: f => f.uac === 0 ? r(F, 'EnableLUA = 0') : f.uacPrompt === 0 ? r(F, 'admins are never prompted') : r(P) },
  { id: 'win.rdp', cat: 'Remote access', title: 'Remote Desktop is off or requires Network Level Authentication', rationale: 'RDP without NLA lets anyone reach the logon screen and exploit pre-auth bugs.', remediation: 'Settings > System > Remote Desktop: turn it off, or keep "Require devices to use Network Level Authentication" checked.', compliance: C(['2.2', '8.1.2'], ['AC.7', 'SC.7']),
    eval: f => f.rdpDeny == null ? r(NA) : f.rdpDeny === 1 ? r(P, 'Remote Desktop is off') : f.rdpNla === 1 ? r(P, 'on, NLA required') : r(F, 'on without NLA') },
  { id: 'win.smb1', cat: 'Network', title: 'SMBv1 server is disabled', rationale: 'SMBv1 is the protocol abused by WannaCry and NotPetya.', remediation: 'Run as admin: Set-SmbServerConfiguration -EnableSMB1Protocol $false', compliance: C(['2.2'], ['CM.6']),
    eval: f => f.smb1Server === true || f.smb1 === 1 ? r(F) : f.smb1Server === false || f.smb1 === 0 ? r(P) : r(NA, 'needs admin to check') },
  { id: 'win.smb.sign', cat: 'Network', title: 'SMB server signing is required', rationale: 'Unsigned SMB allows relay and man-in-the-middle attacks.', remediation: 'Run as admin: Set-SmbServerConfiguration -RequireSecuritySignature $true', compliance: C(['2.2'], ['SC.7']),
    eval: f => f.smbSigning === 1 ? r(P) : f.smbSigning === 0 ? r(F) : r(NA) },
  { id: 'win.guest', cat: 'Accounts', title: 'Guest account is disabled', rationale: 'An enabled Guest account allows sign-in without a password.', remediation: 'Run as admin: Disable-LocalUser -Name Guest', compliance: C(['2.2', '8.1.2'], ['AC.2']),
    eval: f => { const g = (f.users || []).find(u => /-501$/.test(u.sid)); return !g ? r(NA) : g.enabled ? r(F, g.name + ' is enabled') : r(P); } },
  { id: 'win.admin500', cat: 'Accounts', title: 'Built-in Administrator account is disabled', rationale: 'The built-in Administrator is a well-known target and is exempt from lockout.', remediation: 'Run as admin: Disable-LocalUser -SID (Get-LocalUser | ? SID -like "*-500").SID', compliance: C(['2.2', '8.1.2'], ['AC.2', 'AC.6']),
    eval: f => { const a = (f.users || []).find(u => /-500$/.test(u.sid)); return !a ? r(NA) : a.enabled ? r(F, a.name + ' is enabled') : r(P); } },
  { id: 'win.pwdreq', cat: 'Accounts', title: 'Every enabled local account requires a password', rationale: 'Accounts that allow a blank password can be used remotely in some configurations.', remediation: 'Set a password for each listed account or disable it.', compliance: C(['8.1.2'], ['IA.4', 'AC.2']),
    eval: f => { if (!f.users) return r(NA); const bad = f.users.filter(u => u.enabled && !u.pwdRequired); return bad.length ? r(F, bad.map(u => u.name).join(', ')) : r(P); } },
  { id: 'win.pwdlen', cat: 'Accounts', title: 'Minimum password length is at least 8', rationale: 'Short passwords fall to guessing in minutes.', remediation: 'Run as admin: net accounts /minpwlen:12', compliance: C(['8.1.2'], ['IA.4']),
    eval: f => f.sec_MinimumPasswordLength == null ? r(NA, 'needs admin') : f.sec_MinimumPasswordLength >= 8 ? r(P, f.sec_MinimumPasswordLength + ' characters') : r(F, f.sec_MinimumPasswordLength + ' characters') },
  { id: 'win.lockout', cat: 'Accounts', title: 'Accounts lock after repeated failed logons', rationale: 'Without a lockout threshold, passwords can be guessed forever.', remediation: 'Run as admin: net accounts /lockoutthreshold:10', compliance: C(['8.1.2', '10.2.4'], ['AC.7']),
    eval: f => f.sec_LockoutBadCount == null ? r(NA, 'needs admin') : f.sec_LockoutBadCount > 0 && f.sec_LockoutBadCount <= 10 ? r(P, 'after ' + f.sec_LockoutBadCount + ' attempts') : r(F, f.sec_LockoutBadCount === 0 ? 'never' : 'after ' + f.sec_LockoutBadCount + ' attempts') },
  { id: 'win.bitlocker', cat: 'Data protection', title: 'System drive is encrypted (BitLocker / device encryption)', rationale: 'A stolen unencrypted disk gives full access to your files and saved credentials.', remediation: 'Settings > Privacy & security > Device encryption (or BitLocker drive encryption).', compliance: C(['3.4'], ['SC.28'], { gdpr: ['IV_32.2'], hipaa: ['164.312.a.1'] }),
    eval: f => f.bitlocker == null ? r(NA, 'needs admin') : f.bitlocker === 1 ? r(P) : r(F) },
  { id: 'win.secureboot', cat: 'Boot', title: 'Secure Boot is on', rationale: 'Secure Boot stops bootkits from loading before Windows.', remediation: 'Enable Secure Boot in your UEFI/BIOS setup.', compliance: C(['2.2'], ['SI.7']),
    eval: (f, ctx) => ctx.secureBoot == null ? r(NA) : ctx.secureBoot ? r(P) : r(F) },
  { id: 'win.updates', cat: 'Patching', title: 'Windows updates installed in the last 45 days', rationale: 'Most attacks use vulnerabilities that already have a patch.', remediation: 'Settings > Windows Update > Check for updates.', compliance: C(['6.2'], ['SI.2']),
    eval: f => f.wuStart === 'Disabled' ? r(F, 'Windows Update service is disabled') : !f.lastPatch ? r(NA) : Date.now() - f.lastPatch < 45 * 86400e3 ? r(P, 'last update ' + new Date(f.lastPatch).toLocaleDateString()) : r(F, 'last update ' + new Date(f.lastPatch).toLocaleDateString()) },
  { id: 'win.remotereg', cat: 'Remote access', title: 'Remote Registry service does not start automatically', rationale: 'Remote Registry lets other machines read and change your registry.', remediation: 'services.msc > Remote Registry > Startup type: Disabled.', compliance: C(['2.2'], ['CM.7']),
    eval: f => !f.remoteReg ? r(NA) : /^Automatic/.test(f.remoteReg) ? r(F, f.remoteReg) : r(P, f.remoteReg) },
  { id: 'win.llmnr', cat: 'Network', title: 'LLMNR name resolution is turned off', rationale: 'LLMNR answers can be spoofed on the local network to capture password hashes.', remediation: 'Group Policy: Computer Configuration > Administrative Templates > Network > DNS Client > Turn off multicast name resolution: Enabled.', compliance: C(['2.2'], ['SC.7']),
    eval: f => f.llmnr === 0 ? r(P) : r(F, 'not disabled by policy') },
  { id: 'win.autorun', cat: 'Malware', title: 'AutoRun is disabled for all drives', rationale: 'AutoRun starts programs from inserted media automatically.', remediation: 'Settings > Bluetooth & devices > AutoPlay: off, or set NoDriveTypeAutoRun = 255.', compliance: C(['5.1'], ['SI.3']),
    eval: f => f.autorun === 255 || f.autorunUser === 255 ? r(P) : r(F, 'NoDriveTypeAutoRun is ' + (f.autorun != null ? f.autorun : 'not set')) },
  { id: 'win.wdigest', cat: 'Credentials', title: 'WDigest does not keep plain-text passwords in memory', rationale: 'With UseLogonCredential = 1, credential dumpers read clear-text passwords.', remediation: 'Set HKLM\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\WDigest UseLogonCredential = 0.', compliance: C(['8.2.1'], ['IA.5']),
    eval: f => f.wdigest === 1 ? r(F) : r(P) },
  { id: 'win.lsappl', cat: 'Credentials', title: 'LSA protection (RunAsPPL) is enabled', rationale: 'Protects the process that holds credentials from being read by other programs.', remediation: 'Windows Security > Device security > Core isolation > Local Security Authority protection: On.', compliance: C(['8.2.1'], ['AC.6']),
    eval: f => f.lsaPpl === 1 || f.lsaPpl === 2 ? r(P) : r(F) },
  { id: 'win.ntlm', cat: 'Credentials', title: 'Only NTLMv2 is sent (LAN Manager level 3 or higher)', rationale: 'LM and NTLMv1 hashes are cracked almost instantly.', remediation: 'Set HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa LmCompatibilityLevel = 5.', compliance: C(['8.2.1'], ['IA.2']),
    eval: f => f.ntlmLevel == null || f.ntlmLevel >= 3 ? r(P, f.ntlmLevel == null ? 'Windows default (3)' : 'level ' + f.ntlmLevel) : r(F, 'level ' + f.ntlmLevel) },
  { id: 'win.psv2', cat: 'Logging', title: 'PowerShell 2.0 engine is removed', rationale: 'PowerShell 2.0 bypasses script logging and AMSI; attackers downgrade to it.', remediation: 'Run as admin: Disable-WindowsOptionalFeature -Online -FeatureName MicrosoftWindowsPowerShellV2Root', compliance: C(['2.2'], ['CM.7']),
    eval: f => f.psv2 ? r(F, 'engine ' + f.psv2 + ' present') : r(P) },
  { id: 'win.pslog', cat: 'Logging', title: 'PowerShell script block logging is on', rationale: 'Records what PowerShell scripts actually run, including decoded malicious scripts.', remediation: 'Group Policy: Administrative Templates > Windows Components > Windows PowerShell > Turn on PowerShell Script Block Logging.', compliance: C(['10.2.2'], ['AU.12']),
    eval: f => f.scriptBlockLog === 1 ? r(P) : r(F, 'not enabled') },
  exposedCheck(),
];

function readSshd() {
  const t = U.readText('/etc/ssh/sshd_config'); if (t == null) return null;
  const o = {};
  for (const line of t.split('\n')) { const m = line.trim().match(/^(\w+)\s+(.+)$/); if (m && !line.trim().startsWith('#') && !(m[1].toLowerCase() in o)) o[m[1].toLowerCase()] = m[2].trim().toLowerCase(); }
  return o;
}
const procVal = p => { const t = U.readText(p); return t == null ? null : t.trim(); };
const LINUX = [
  { id: 'lnx.aslr', cat: 'Kernel', title: 'Address space layout randomization is fully on', rationale: 'ASLR makes memory-corruption exploits much harder.', remediation: 'sysctl -w kernel.randomize_va_space=2 (and persist it in /etc/sysctl.d).', compliance: C(['2.2'], ['SI.16']), eval: () => { const v = procVal('/proc/sys/kernel/randomize_va_space'); return v == null ? r(NA) : v === '2' ? r(P) : r(F, 'value ' + v); } },
  { id: 'lnx.fwd', cat: 'Network', title: 'IP forwarding is off (unless this is a router or container host)', rationale: 'Forwarding turns the machine into a router between networks.', remediation: 'sysctl -w net.ipv4.ip_forward=0 (Docker hosts need it on: ignore there).', compliance: C(['1.3'], ['SC.7']), eval: () => { const v = procVal('/proc/sys/net/ipv4/ip_forward'); return v == null ? r(NA) : v === '0' ? r(P) : r(F, 'on (normal with Docker/VMs)'); } },
  { id: 'lnx.dmesg', cat: 'Kernel', title: 'Kernel log is restricted to root', rationale: 'Kernel messages leak addresses that help exploits.', remediation: 'sysctl -w kernel.dmesg_restrict=1', compliance: C(['2.2'], ['SI.11']), eval: () => { const v = procVal('/proc/sys/kernel/dmesg_restrict'); return v == null ? r(NA) : v === '1' ? r(P) : r(F); } },
  { id: 'lnx.suid', cat: 'Kernel', title: 'Core dumps of setuid programs are disabled', rationale: 'Core dumps of privileged programs can expose secrets.', remediation: 'sysctl -w fs.suid_dumpable=0', compliance: C(['2.2'], ['SI.11']), eval: () => { const v = procVal('/proc/sys/fs/suid_dumpable'); return v == null ? r(NA) : v === '0' ? r(P) : r(F, 'value ' + v); } },
  { id: 'lnx.ssh.root', cat: 'Remote access', title: 'SSH does not allow root to log in with a password', rationale: 'root is the first account every bot tries.', remediation: 'In /etc/ssh/sshd_config set PermitRootLogin no (or prohibit-password) and reload sshd.', compliance: C(['2.2', '8.1.2'], ['AC.6']), eval: () => { const s = readSshd(); if (!s) return r(NA, 'sshd not installed'); const v = s.permitrootlogin || 'prohibit-password'; return v === 'yes' ? r(F, 'PermitRootLogin yes') : r(P, 'PermitRootLogin ' + v); } },
  { id: 'lnx.ssh.pwd', cat: 'Remote access', title: 'SSH uses keys instead of passwords', rationale: 'Password logins are brute-forced around the clock on internet-facing hosts.', remediation: 'Set PasswordAuthentication no in /etc/ssh/sshd_config after installing your key.', compliance: C(['8.2.1'], ['IA.2']), eval: () => { const s = readSshd(); if (!s) return r(NA, 'sshd not installed'); return s.passwordauthentication === 'no' ? r(P) : r(F, 'PasswordAuthentication ' + (s.passwordauthentication || 'yes (default)')); } },
  { id: 'lnx.ssh.empty', cat: 'Remote access', title: 'SSH refuses empty passwords', rationale: 'Accounts without a password must never be reachable over SSH.', remediation: 'Set PermitEmptyPasswords no.', compliance: C(['8.2.1'], ['IA.5']), eval: () => { const s = readSshd(); if (!s) return r(NA); return s.permitemptypasswords === 'yes' ? r(F) : r(P); } },
  { id: 'lnx.shadow', cat: 'Accounts', title: '/etc/shadow is not readable by other users', rationale: 'It holds the password hashes.', remediation: 'chmod 640 /etc/shadow (or 600).', compliance: C(['8.2.1'], ['AC.3']), eval: () => { try { const m = fs.statSync('/etc/shadow').mode; return m & 0o004 ? r(F, 'mode ' + (m & 0o777).toString(8)) : r(P, 'mode ' + (m & 0o777).toString(8)); } catch { return r(NA); } } },
  { id: 'lnx.passwd', cat: 'Accounts', title: '/etc/passwd is not writable by other users', rationale: 'A writable passwd file lets anyone add a root account.', remediation: 'chmod 644 /etc/passwd', compliance: C(['2.2'], ['AC.3']), eval: () => { try { const m = fs.statSync('/etc/passwd').mode; return m & 0o022 ? r(F, 'mode ' + (m & 0o777).toString(8)) : r(P); } catch { return r(NA); } } },
  { id: 'lnx.preload', cat: 'Malware', title: 'No global library preload (/etc/ld.so.preload)', rationale: 'Rootkits use ld.so.preload to inject into every program.', remediation: 'Inspect /etc/ld.so.preload and remove entries you did not add.', compliance: C(['11.5'], ['SI.7']), eval: () => { const t = U.readText('/etc/ld.so.preload'); return t == null || !t.trim() ? r(P) : r(F, t.trim().split('\n').slice(0, 3).join(', ')); } },
  { id: 'lnx.updates', cat: 'Patching', title: 'Automatic security updates are configured', rationale: 'Unpatched packages are the most common way in.', remediation: 'Debian/Ubuntu: apt install unattended-upgrades. Fedora/RHEL: dnf install dnf-automatic && systemctl enable --now dnf-automatic.timer', compliance: C(['6.2'], ['SI.2']), eval: () => { const a = U.readText('/etc/apt/apt.conf.d/20auto-upgrades'); if (a != null) return /Unattended-Upgrade\s+"1"/.test(a) ? r(P) : r(F); if (fs.existsSync('/etc/dnf/automatic.conf')) return fs.existsSync('/etc/systemd/system/timers.target.wants/dnf-automatic.timer') || fs.existsSync('/etc/systemd/system/timers.target.wants/dnf-automatic-install.timer') ? r(P) : r(F, 'dnf-automatic timer not enabled'); return r(NA); } },
  exposedCheck(),
];
const MAC = [
  { id: 'mac.fw', cat: 'Network', title: 'macOS application firewall is on', rationale: 'Blocks unwanted incoming connections.', remediation: 'System Settings > Network > Firewall: On.', compliance: C(['1.1.1'], ['SC.7']), run: async () => { const x = await U.run('/usr/libexec/ApplicationFirewall/socketfilterfw', ['--getglobalstate']); return !x.ok ? r(NA) : /enabled/i.test(x.stdout) ? r(P) : r(F); } },
  { id: 'mac.filevault', cat: 'Data protection', title: 'FileVault disk encryption is on', rationale: 'Protects your data if the Mac is lost or stolen.', remediation: 'System Settings > Privacy & Security > FileVault: Turn On.', compliance: C(['3.4'], ['SC.28']), run: async () => { const x = await U.run('fdesetup', ['status']); return !x.ok ? r(NA) : /FileVault is On/i.test(x.stdout) ? r(P) : r(F); } },
  { id: 'mac.sip', cat: 'Boot', title: 'System Integrity Protection is enabled', rationale: 'SIP stops malware from modifying system files.', remediation: 'Boot to Recovery and run csrutil enable.', compliance: C(['2.2'], ['SI.7']), run: async () => { const x = await U.run('csrutil', ['status']); return !x.ok && !x.stdout ? r(NA) : /enabled/i.test(x.stdout) ? r(P) : r(F); } },
  { id: 'mac.gatekeeper', cat: 'Malware', title: 'Gatekeeper is enabled', rationale: 'Gatekeeper blocks unsigned and unnotarised apps.', remediation: 'sudo spctl --master-enable', compliance: C(['5.1'], ['SI.3']), run: async () => { const x = await U.run('spctl', ['--status']); return /assessments enabled/i.test(x.stdout + x.stderr) ? r(P) : /disabled/i.test(x.stdout + x.stderr) ? r(F) : r(NA); } },
  exposedCheck(),
];

class Sca {
  constructor(file, persist, plat, onChange) {
    this.file = file; this.persist = persist; this.plat = plat; this.onChange = onChange || (() => {});
    this.state = { at: 0, results: [], history: [], err: '' };
    if (persist) { try { const s = JSON.parse(fs.readFileSync(file, 'utf8')); if (s && Array.isArray(s.results)) this.state = Object.assign(this.state, s); } catch { /* first run */ } }
    this.busy = false;
  }
  checks() { return U.IS_WIN ? WIN : process.platform === 'linux' ? LINUX : process.platform === 'darwin' ? MAC : [exposedCheck()]; }
  async run(ctx) {
    if (this.busy) return this.state; this.busy = true;
    try {
      let facts = {};
      if (U.IS_WIN) { try { facts = await this.plat.ctl.request('scafacts', {}, 120000, true) || {}; } catch (e) { this.state.err = e.message; } }
      const prev = new Map(this.state.results.map(x => [x.id, x.result]));
      const out = [];
      for (const c of this.checks()) {
        let res;
        try { res = c.run ? await c.run(facts, ctx) : c.eval(facts, ctx); } catch (e) { res = r(NA, e.message); }
        out.push({ id: c.id, result: res.result, detail: U.trunc(res.detail || '', 300) });
      }
      const first = !this.state.at;
      this.state.results = out; this.state.at = Date.now();
      const s = this.score();
      const today = new Date().toDateString();
      const h = this.state.history.filter(x => new Date(x.at).toDateString() !== today);
      h.push({ at: Date.now(), score: s.score, passed: s.passed, failed: s.failed });
      this.state.history = h.slice(-365);
      if (!first) for (const x of out) { const p = prev.get(x.id); if (p && p !== x.result && x.result !== NA && p !== NA) this.onChange(this.meta(x.id), x); }
      if (this.persist) { try { fs.mkdirSync(path.dirname(this.file), { recursive: true }); fs.writeFileSync(this.file, JSON.stringify(this.state)); } catch { /* ignore */ } }
    } finally { this.busy = false; }
    return this.state;
  }
  meta(id) { const c = this.checks().find(x => x.id === id); return c ? { id: c.id, cat: c.cat, title: c.title, rationale: c.rationale, remediation: c.remediation, compliance: c.compliance } : { id }; }
  score() {
    const passed = this.state.results.filter(x => x.result === P).length, failed = this.state.results.filter(x => x.result === F).length;
    return { score: passed + failed ? Math.round(100 * passed / (passed + failed)) : null, passed, failed, na: this.state.results.length - passed - failed };
  }
  view() {
    return Object.assign({ at: this.state.at, err: this.state.err, history: this.state.history, busy: this.busy, policy: U.IS_WIN ? 'RigWatch Windows baseline (CIS-inspired)' : process.platform === 'linux' ? 'RigWatch Linux baseline (CIS-inspired)' : 'RigWatch macOS baseline', host: os.hostname() },
      this.score(), { checks: this.state.results.map(x => Object.assign(this.meta(x.id), x)) });
  }
}

module.exports = { Sca, RISKY_PORTS };

};
__M["lib/siem/sessions.js"] = function (module, exports, require) {
'use strict';
// Who is signed in right now: Windows sessions (WTS), logon sessions, SMB clients and local accounts;
// `who -u` on Linux and macOS. Plus sign-out / disconnect actions.
const U = require('../util');

/** `who -u` output -> sessions */
function parseWho(text) {
  const out = [];
  for (const line of String(text).split('\n')) {
    const m = line.match(/^(\S+)\s+(\S+)\s+(\d{4}-\d\d-\d\d \d\d:\d\d|\w{3}\s+\d+\s+\d\d:\d\d)\s+(\S+)\s+(\d+)(?:\s+\((.*)\))?/);
    if (!m) continue;
    let start = Date.parse(m[3].replace(' ', 'T'));
    if (!Number.isFinite(start)) { const d = new Date(m[3] + ' ' + new Date().getFullYear()); start = isNaN(d) ? null : d.getTime(); }
    const from = (m[6] || '').trim();
    out.push({ user: m[1], station: m[2], logon: start, idle: m[4], pid: +m[5], addr: require('net').isIP(from) ? from : '', client: from, state: 'active' });
  }
  return out;
}

function create(plat) {
  async function list() {
    if (U.IS_WIN) {
      const r = await plat.ctl.request('sessions', {}, 60000);
      const wts = U.arr(r.wts).filter(s => s.user || s.state === 'active').map(s => ({
        id: s.id, user: s.user ? (s.domain ? s.domain + '\\' + s.user : s.user) : '', station: s.station, state: s.state, client: s.client, addr: s.addr,
        logon: s.logon || null, idleSec: s.lastInput && s.now ? Math.max(0, Math.round((s.now - s.lastInput) / 1000)) : null, connect: s.connect || null,
        self: s.id === r.self,
      }));
      const logons = U.arr(r.logons).filter(l => l.user && !/\\(SYSTEM|LOCAL SERVICE|NETWORK SERVICE)$|\\(DWM|UMFD)-\d+$|\$$/i.test(l.user));
      return { platform: 'win32', sessions: wts, logons, smb: U.arr(r.smb), users: U.arr(r.users), errors: U.arr(r.errors), admin: plat.isAdmin() };
    }
    const who = U.which('who', ['/usr/bin', '/bin']);
    const r = who ? await U.run(who, ['-u']) : { stdout: '' };
    return { platform: process.platform, sessions: parseWho(r.stdout), logons: [], smb: [], users: [], errors: who ? [] : ['who not found'], admin: typeof process.getuid === 'function' && process.getuid() === 0 };
  }
  async function act(a) {
    const action = String(a.action || '');
    if (U.IS_WIN) {
      if (action === 'logoff' || action === 'disconnect') {
        const id = U.int(a.id, -1);
        if (id <= 0) throw new Error('Refusing to touch session 0 (services).');
        return plat.ctl.request('session', { sid: id, action }, 30000);
      }
      if (action === 'smbclose') {
        const id = String(a.id || ''); if (!/^\d{1,20}$/.test(id)) throw new Error('bad SMB session id');
        return plat.ctl.request('smbclose', { smbId: id }, 30000);
      }
      throw new Error('unknown session action');
    }
    if (action === 'logoff') {
      const pid = U.int(a.pid, 0);
      if (pid <= 1) throw new Error('bad session leader pid');
      if (pid === process.pid || pid === process.ppid) throw new Error('Refusing: that is RigWatch or its terminal.');
      process.kill(pid, 'SIGHUP');
      return 'sent hang-up to session leader ' + pid;
    }
    throw new Error('Only sign-out is supported on this OS.');
  }
  return { list, act };
}

module.exports = { create, parseWho };

};
__M["lib/siem/store.js"] = function (module, exports, require) {
'use strict';
// Local event history, light on disk:
//   ~/.rigwatch/siem/events/2026-11-13.jsonl      one JSON event per line, one file per day
//   older days are gzipped (2026-11-01.jsonl.gz), days past the retention (365 by default) are deleted,
//   and a total size cap (SIEM_MAX_MB, 256 MB) deletes the oldest days first.
//   ~/.rigwatch/siem/rollups.json                  small per-day counters that power the charts
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');
const { bandOf } = require('./rules');

const gunzip = promisify(zlib.gunzip), gzip = promisify(zlib.gzip);
const DAY = 86400e3;
const pad = n => String(n).padStart(2, '0');
const dayKey = t => { const d = new Date(t); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
const dayStart = key => new Date(key + 'T00:00:00').getTime();
const FILE_RX = /^(\d{4}-\d\d-\d\d)\.jsonl(\.gz)?$/;
const LOGON_OK = new Set([2001, 2002, 2003, 2020, 2032]); // real sign-ins (not unlocks or derived alerts)

function writeAtomic(file, text) {
  try { fs.mkdirSync(path.dirname(file), { recursive: true }); const tmp = file + '.tmp'; fs.writeFileSync(tmp, text); fs.renameSync(tmp, file); return true; } catch { return false; }
}
const newDay = () => ({ n: 0, lv: new Array(16).fill(0), h: Array.from({ length: 24 }, () => [0, 0, 0, 0, 0]), ok: new Array(24).fill(0), fail: new Array(24).fill(0), rules: {}, ips: {}, users: {}, mitre: {}, uniq: 0 });
const topN = (o, n) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n));
const inc = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };

class EventStore {
  constructor(dir, opts = {}) {
    this.dir = dir; this.evDir = path.join(dir, 'events');
    this.persist = opts.persist !== false;
    this.retention = opts.retentionDays || 365;
    this.modulesOf = opts.modulesOf || (() => []);
    this.maxBytes = (opts.maxMB || 256) * 1048576;
    this.recent = []; this.pending = []; this.cache = new Map();
    this.rollFile = path.join(dir, 'rollups.json');
    this.rollups = {}; this.rollDirty = false;
    this.info = { days: 0, bytes: 0, oldest: null, files: [] };
    if (this.persist) { try { const r = JSON.parse(fs.readFileSync(this.rollFile, 'utf8')); if (r && typeof r === 'object') this.rollups = r; } catch { /* first run */ } this.heal(); }
    this.flushTimer = setInterval(() => this.flush(), 5000); this.flushTimer.unref();
    this.rollTimer = setInterval(() => this.saveRollups(), 60000); this.rollTimer.unref();
    this.maintTimer = setInterval(() => this.maintain().catch(() => {}), 3600e3); this.maintTimer.unref();
    setTimeout(() => this.maintain().catch(() => {}), 4000).unref();
  }

  /** after a crash or kill the counters can lag the day files: recount days written after rollups.json */
  heal() {
    let rollAt = 0;
    try { rollAt = fs.statSync(this.rollFile).mtimeMs; } catch { rollAt = 0; }
    let names = [];
    try { names = fs.readdirSync(this.evDir); } catch { return; }
    const days = new Set();
    for (const n of names) { const m = n.match(FILE_RX); if (!m) continue; try { if (fs.statSync(path.join(this.evDir, n)).mtimeMs > rollAt - 5000) days.add(m[1]); } catch { /* raced */ } }
    for (const k of [...days].sort().slice(-40)) {
      let text = '';
      try { text += zlib.gunzipSync(fs.readFileSync(path.join(this.evDir, k + '.jsonl.gz'))).toString('utf8'); } catch { /* none */ }
      try { text += fs.readFileSync(path.join(this.evDir, k + '.jsonl'), 'utf8'); } catch { /* none */ }
      const uniq = this.rollups[k] ? this.rollups[k].uniq : 0;
      delete this.rollups[k];
      for (const line of text.split('\n')) { if (!line) continue; try { this.roll(JSON.parse(line)); } catch { /* skip */ } }
      if (this.rollups[k]) this.rollups[k].uniq = uniq;
    }
    if (days.size) this.rollDirty = true;
  }

  add(ev) {
    this.recent.push(ev);
    if (this.recent.length > 3000) this.recent.splice(0, this.recent.length - 3000);
    this.pending.push(ev);
    this.roll(ev);
  }
  roll(ev) {
    const k = dayKey(ev.ts), d = this.rollups[k] || (this.rollups[k] = newDay());
    const lv = Math.max(0, Math.min(15, ev.rule.level | 0)), h = new Date(ev.ts).getHours();
    d.n++; d.lv[lv]++; d.h[h][bandOf(lv)]++;
    inc(d.rules, ev.rule.id);
    if (ev.ip) inc(d.ips, ev.ip);
    if (ev.user) inc(d.users, ev.user);
    for (const m of ev.rule.mitre || []) inc(d.mitre, m);
    const band = bandOf(lv);
    d.mod = d.mod || {};
    for (const m of this.modulesOf(ev)) { const a = d.mod[m] || (d.mod[m] = [0, 0, 0, 0, 0]); a[band]++; }
    if (LOGON_OK.has(ev.rule.id)) d.ok[h]++;
    if (ev.rule.groups.includes('authentication_failed')) d.fail[h]++;
    this.rollDirty = true;
  }
  noteUniq(day) { const d = this.rollups[day] || (this.rollups[day] = newDay()); d.uniq++; this.rollDirty = true; }

  flush() {
    if (!this.pending.length) return;
    const batch = this.pending; this.pending = [];
    if (!this.persist) return;
    const byDay = new Map();
    for (const ev of batch) { const k = dayKey(ev.ts); if (!byDay.has(k)) byDay.set(k, []); byDay.get(k).push(JSON.stringify(ev)); }
    try { fs.mkdirSync(this.evDir, { recursive: true }); } catch { return; }
    for (const [k, lines] of byDay) {
      const text = lines.join('\n') + '\n';
      try {
        const gz = path.join(this.evDir, k + '.jsonl.gz');
        // a late event for a day that is already compressed: gzip allows appending another member
        if (k < dayKey(Date.now() - DAY) && fs.existsSync(gz)) fs.appendFileSync(gz, zlib.gzipSync(text));
        else fs.appendFileSync(path.join(this.evDir, k + '.jsonl'), text);
      } catch { /* disk full / read-only: drop */ }
      this.cache.delete(k);
    }
  }
  saveRollups(force) {
    if (!this.persist || (!this.rollDirty && !force)) return;
    const cut = dayKey(Date.now() - this.retention * DAY);
    const out = {};
    for (const [k, d] of Object.entries(this.rollups)) {
      if (k < cut) { delete this.rollups[k]; continue; }
      // keep the file small: only the top entries per day
      d.ips = topN(d.ips, 200); d.users = topN(d.users, 50); d.rules = topN(d.rules, 120);
      out[k] = d;
    }
    writeAtomic(this.rollFile, JSON.stringify(out));
    this.rollDirty = false;
  }

  /** compress closed days, drop days past retention, enforce the size cap */
  async maintain() {
    if (!this.persist) return;
    let names = [];
    try { names = fs.readdirSync(this.evDir); } catch { return; }
    const yesterday = dayKey(Date.now() - DAY), cut = dayKey(Date.now() - this.retention * DAY);
    for (const n of names) {
      const m = n.match(/^(\d{4}-\d\d-\d\d)\.jsonl$/);
      if (!m || m[1] >= yesterday) continue;
      const plain = path.join(this.evDir, n), tmp = plain + '.gzing', gz = plain + '.gz';
      try {
        fs.renameSync(plain, tmp); // new events for that day start a fresh plain file
        const data = await gzip(fs.readFileSync(tmp));
        fs.appendFileSync(gz, data);
        fs.rmSync(tmp, { force: true });
        this.cache.delete(m[1]);
      } catch { try { if (fs.existsSync(tmp) && !fs.existsSync(plain)) fs.renameSync(tmp, plain); } catch { /* leave it */ } }
    }
    // leftovers from an interrupted run
    for (const n of names) if (n.endsWith('.gzing')) { try { const p = path.join(this.evDir, n); fs.appendFileSync(p.replace(/\.gzing$/, '.gz'), await gzip(fs.readFileSync(p))); fs.rmSync(p, { force: true }); } catch { /* skip */ } }
    let files = [];
    for (const n of fs.readdirSync(this.evDir)) {
      const m = n.match(FILE_RX); if (!m) continue;
      const p = path.join(this.evDir, n);
      if (m[1] < cut) { try { fs.rmSync(p, { force: true }); } catch { /* skip */ } continue; }
      try { files.push({ day: m[1], file: p, size: fs.statSync(p).size }); } catch { /* raced */ }
    }
    files.sort((a, b) => (a.day < b.day ? -1 : 1));
    let total = files.reduce((a, f) => a + f.size, 0);
    const today = dayKey(Date.now());
    while (total > this.maxBytes && files.length > 1 && files[0].day < today) {
      const f = files.shift(); total -= f.size;
      try { fs.rmSync(f.file, { force: true }); } catch { /* skip */ }
    }
    const days = [...new Set(files.map(f => f.day))];
    this.info = { days: days.length, bytes: total, oldest: days[0] || null, newest: days[days.length - 1] || null };
    this.saveRollups(true);
  }

  async readDay(k) {
    const today = dayKey(Date.now());
    if (k !== today && this.cache.has(k)) { const c = this.cache.get(k); this.cache.delete(k); this.cache.set(k, c); return c; }
    let text = '';
    if (this.persist) {
      try { text += (await gunzip(await fs.promises.readFile(path.join(this.evDir, k + '.jsonl.gz')))).toString('utf8'); } catch { /* none */ }
      try { text += await fs.promises.readFile(path.join(this.evDir, k + '.jsonl'), 'utf8'); } catch { /* none */ }
    }
    let lines = text ? text.split('\n').filter(Boolean) : [];
    const extra = this.pending.filter(e => dayKey(e.ts) === k).map(e => JSON.stringify(e));
    if (!this.persist) lines = this.recent.filter(e => dayKey(e.ts) === k).map(e => JSON.stringify(e));
    else if (extra.length) lines = lines.concat(extra);
    if (k !== today) { this.cache.set(k, lines); while (this.cache.size > 8) this.cache.delete(this.cache.keys().next().value); }
    return lines;
  }

  /**
   * Newest-first search. f = parsed query (rules.parseQuery), match(f, ev), pre(f, lineLower).
   * Returns { events, more, cursor } where cursor is the ts to pass as `before` for the next page.
   */
  async query({ from, to, before, limit = 200, f, match, pre }) {
    const upper = Math.min(to || Date.now(), before != null ? before - 1 : Infinity);
    const out = [];
    let k = dayKey(upper);
    const lowKey = dayKey(from);
    let scannedDays = 0;
    while (k >= lowKey && out.length < limit && scannedDays < 400) {
      const lines = await this.readDay(k);
      const rows = [];
      for (const line of lines) {
        if (pre && !pre(f, line.toLowerCase())) continue;
        let ev; try { ev = JSON.parse(line); } catch { continue; }
        if (ev.ts > upper || ev.ts < from) continue;
        if (match && !match(f, ev)) continue;
        rows.push(ev);
      }
      rows.sort((a, b) => b.ts - a.ts);
      for (const ev of rows) { out.push(ev); if (out.length >= limit) break; }
      scannedDays++;
      k = dayKey(dayStart(k) - DAY / 2);
    }
    const more = out.length >= limit;
    return { events: out, more, cursor: out.length ? out[out.length - 1].ts : null };
  }

  /** visit every matching event in [from, to], newest day first; stops after `max` matches */
  async scan({ from, to = Date.now(), f, match, pre, max = 100000 }, cb) {
    let k = dayKey(to), n = 0, days = 0;
    const lowKey = dayKey(from);
    while (k >= lowKey && n < max && days < 400) {
      const lines = await this.readDay(k);
      for (let i = lines.length - 1; i >= 0 && n < max; i--) {
        const line = lines[i];
        if (pre && !pre(f, line.toLowerCase())) continue;
        let ev; try { ev = JSON.parse(line); } catch { continue; }
        if (ev.ts > to || ev.ts < from) continue;
        if (match && !match(f, ev)) continue;
        n++; cb(ev);
      }
      days++;
      k = dayKey(dayStart(k) - DAY / 2);
      if (days % 7 === 0) await new Promise(r => setImmediate(r)); // stay responsive on big ranges
    }
    return { scanned: n, capped: n >= max };
  }

  /** charts: buckets (hourly up to 2 days, daily beyond) + top lists, from the rollups */
  summary(fromMs, toMs = Date.now()) {
    const span = toMs - fromMs, hourly = span <= 2 * DAY + 1;
    const buckets = [];
    const tot = { n: 0, bands: [0, 0, 0, 0, 0], ok: 0, fail: 0, uniq: 0 };
    const top = { rules: {}, ips: {}, users: {}, mitre: {} };
    const lv = new Array(16).fill(0);
    if (hourly) {
      const step = 3600e3, start = Math.floor(fromMs / step) * step;
      for (let t = start; t <= toMs; t += step) {
        const d = this.rollups[dayKey(t)], h = new Date(t).getHours();
        const b = d ? d.h[h].slice() : [0, 0, 0, 0, 0];
        buckets.push({ t, bands: b, ok: d ? d.ok[h] : 0, fail: d ? d.fail[h] : 0, n: b.reduce((a, x) => a + x, 0) });
      }
    } else {
      for (let t = dayStart(dayKey(fromMs)); t <= toMs; t += DAY) {
        const k = dayKey(t + 3600e3), d = this.rollups[k];
        const b = [0, 0, 0, 0, 0]; let ok = 0, fail = 0;
        if (d) { for (const row of d.h) row.forEach((x, i) => { b[i] += x; }); ok = d.ok.reduce((a, x) => a + x, 0); fail = d.fail.reduce((a, x) => a + x, 0); }
        buckets.push({ t: dayStart(k), bands: b, ok, fail, n: b.reduce((a, x) => a + x, 0), uniq: d ? d.uniq : 0 });
      }
    }
    // totals and top lists come from whole days in range (good enough for charts)
    for (let t = dayStart(dayKey(fromMs)); t <= toMs; t += DAY) {
      const d = this.rollups[dayKey(t + 3600e3)]; if (!d) continue;
      for (const [k, v] of Object.entries(d.rules)) inc(top.rules, k, v);
      for (const [k, v] of Object.entries(d.ips)) inc(top.ips, k, v);
      for (const [k, v] of Object.entries(d.users)) inc(top.users, k, v);
      for (const [k, v] of Object.entries(d.mitre)) inc(top.mitre, k, v);
      d.lv.forEach((x, i) => { lv[i] += x; });
      tot.uniq = Math.max(tot.uniq, d.uniq);
    }
    for (const b of buckets) { tot.n += b.n; b.bands.forEach((x, i) => { tot.bands[i] += x; }); tot.ok += b.ok; tot.fail += b.fail; }
    const list = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);
    return { step: hourly ? 3600e3 : DAY, buckets, totals: tot, levels: lv, top: { rules: list(top.rules, 12), ips: list(top.ips, 12), users: list(top.users, 10), mitre: list(top.mitre, 12) } };
  }
  /** per-module severity counts { module: [info, low, medium, high, critical] } and daily series */
  modules(fromMs, toMs = Date.now()) {
    const out = {}, days = [];
    for (let t = dayStart(dayKey(fromMs)); t <= toMs; t += DAY) {
      const k = dayKey(t + 3600e3), d = this.rollups[k], row = {};
      if (d && d.mod) for (const [m, a] of Object.entries(d.mod)) { const o = out[m] || (out[m] = [0, 0, 0, 0, 0]); a.forEach((x, i) => { o[i] += x; }); row[m] = a.reduce((s, x) => s + x, 0); }
      days.push({ t: dayStart(k), m: row });
    }
    return { totals: out, days };
  }
  ruleHits(fromMs) {
    const out = {};
    for (const [k, d] of Object.entries(this.rollups)) if (dayStart(k) + DAY > fromMs) for (const [id, n] of Object.entries(d.rules)) inc(out, id, n);
    return out;
  }
  stats() { return Object.assign({ retentionDays: this.retention, maxMB: Math.round(this.maxBytes / 1048576), dir: this.evDir, persist: this.persist, today: (this.rollups[dayKey(Date.now())] || { n: 0 }).n }, this.info); }
  stop() { this.flush(); this.saveRollups(true); }
}

module.exports = { EventStore, dayKey, dayStart, DAY };

};
__M["lib/sockets.js"] = function (module, exports, require) {
'use strict';
// Turns raw socket rows from any platform into { listen, conns, byPid, connsByPid }.
const { isAnyAddr, isLoopback } = require('./util');

const STATE = {
  LISTENING: 'LISTEN', LISTEN: 'LISTEN', ESTABLISHED: 'ESTABLISHED', ESTAB: 'ESTABLISHED',
  SYN_SENT: 'SYN_SENT', SYN_RECEIVED: 'SYN_RECV', SYN_RECV: 'SYN_RECV',
  FIN_WAIT_1: 'FIN_WAIT1', FIN_WAIT1: 'FIN_WAIT1', FIN_WAIT_2: 'FIN_WAIT2', FIN_WAIT2: 'FIN_WAIT2',
  TIME_WAIT: 'TIME_WAIT', CLOSE_WAIT: 'CLOSE_WAIT', LAST_ACK: 'LAST_ACK', CLOSING: 'CLOSING',
  CLOSED: 'CLOSED', CLOSE: 'CLOSED', DELETE_TCB: 'CLOSED', UNCONN: 'UNCONN', BOUND: 'BOUND', IDLE: 'BOUND',
  // Get-NetTCPConnection enum names
  TIMEWAIT: 'TIME_WAIT', CLOSEWAIT: 'CLOSE_WAIT', SYNSENT: 'SYN_SENT', SYNRECEIVED: 'SYN_RECV', LASTACK: 'LAST_ACK', DELETETCB: 'CLOSED',
};
function normState(s) {
  const k = String(s || '').toUpperCase().replace(/-/g, '_');
  return STATE[k] || k;
}

/**
 * rows: [{ proto: 'TCP'|'UDP', lh, lp, rh, rp, state, pid, name? }]
 */
function build(rows) {
  const listen = new Map();
  const conns = [];
  const names = new Map();
  for (const r of rows) {
    const state = normState(r.state);
    if (r.name && r.pid) names.set(r.pid, r.name);
    if (r.proto === 'TCP' && state === 'BOUND') continue; // bound but neither listening nor connected
    const remoteAny = !r.rh || isAnyAddr(r.rh) || r.rp === 0;
    const isListen = r.proto === 'TCP' ? state === 'LISTEN' || (remoteAny && !state)
      : (state === 'UNCONN' || state === '' || state === 'BOUND' || remoteAny);
    if (isListen) {
      if (!r.lp) continue;
      const key = r.proto + ':' + r.lp + ':' + r.pid;
      let e = listen.get(key);
      if (!e) { e = { proto: r.proto, port: r.lp, pid: r.pid, addrs: [] }; listen.set(key, e); }
      if (!e.addrs.includes(r.lh)) e.addrs.push(r.lh);
    } else {
      conns.push({ proto: r.proto, lh: r.lh, lp: r.lp, rh: r.rh, rp: r.rp, state: state || 'ESTABLISHED', pid: r.pid });
    }
  }
  const L = [...listen.values()].map(e => {
    e.scope = e.addrs.some(isAnyAddr) ? 'all' : e.addrs.every(isLoopback) ? 'local' : 'iface';
    return e;
  }).sort((a, b) => a.port - b.port || (a.proto < b.proto ? -1 : 1));
  const byPid = new Map(), connsByPid = new Map();
  for (const e of L) {
    if (e.proto !== 'TCP') continue;
    if (!byPid.has(e.pid)) byPid.set(e.pid, []);
    const list = byPid.get(e.pid);
    if (!list.includes(e.port)) list.push(e.port);
  }
  for (const c of conns) connsByPid.set(c.pid, (connsByPid.get(c.pid) || 0) + 1);
  return { listen: L, conns, byPid, connsByPid, names, at: Date.now(), ok: true, err: '' };
}

const empty = () => ({ listen: [], conns: [], byPid: new Map(), connsByPid: new Map(), names: new Map(), at: 0, ok: false, err: '' });

/** Split "1.2.3.4:80", "[::1]:80", "*:*", "fe80::1%13:80" into [host, port]. */
function splitHostPort(s) {
  if (!s || s === '*:*' || s === '*') return ['*', 0];
  const i = s.lastIndexOf(':');
  if (i < 0) return [s, 0];
  let h = s.slice(0, i); const p = s.slice(i + 1);
  if (h.startsWith('[')) h = h.slice(1, -1);
  return [h.replace(/%.*$/, ''), p === '*' ? 0 : +p || 0];
}

module.exports = { build, empty, normState, splitHostPort };

};
__M["lib/timeline.js"] = function (module, exports, require) {
'use strict';
// Event timeline: processes starting/exiting, ports opening/closing, first contact with a remote
// host, alerts, security findings, user actions (audit log). Persisted to ~/.rigwatch/timeline.ndjson.
const fs = require('fs');
const path = require('path');
const U = require('./util');

class Timeline {
  constructor(dir, persist) {
    this.dir = dir; this.persist = persist;
    this.file = path.join(dir, 'timeline.ndjson');
    this.events = []; this.max = 5000; this.seq = 0; this.pending = []; this.toWrite = [];
    this.procs = null; this.ports = null; this.hosts = new Set();
    this.load();
    this.timer = setInterval(() => this.flush(), 5000); this.timer.unref();
  }
  load() {
    if (!this.persist) return;
    const text = U.readText(this.file);
    if (!text) return;
    const lines = text.split('\n').filter(Boolean).slice(-this.max);
    for (const l of lines) { try { const e = JSON.parse(l); this.events.push(e); this.seq = Math.max(this.seq, e.id || 0); } catch { /* skip */ } }
  }
  add(type, sev, title, data = {}) {
    const e = Object.assign({ id: ++this.seq, t: Date.now(), type, sev, title }, data);
    this.events.push(e);
    if (this.events.length > this.max) this.events.splice(0, this.events.length - this.max);
    this.pending.push(e); this.toWrite.push(e);
    if (this.onAdd) this.onAdd(e);
    return e;
  }
  drain() { const p = this.pending; this.pending = []; return p; }
  flush() {
    if (!this.persist || !this.toWrite.length) { this.toWrite = []; return; }
    try {
      fs.mkdirSync(this.dir, { recursive: true });
      try { if (fs.statSync(this.file).size > 10 << 20) fs.renameSync(this.file, this.file + '.1'); } catch { /* new file */ }
      fs.appendFileSync(this.file, this.toWrite.map(e => JSON.stringify(e)).join('\n') + '\n');
    } catch { /* ignore */ }
    this.toWrite = [];
  }
  query({ since = 0, types = null, q = '', limit = 500, sev = null } = {}) {
    const needle = String(q || '').toLowerCase();
    const out = [];
    for (let i = this.events.length - 1; i >= 0 && out.length < limit; i--) {
      const e = this.events[i];
      if (e.id <= since) break;
      if (types && !types.includes(e.type.split('.')[0]) && !types.includes(e.type)) continue;
      if (sev && e.sev !== sev) continue;
      if (needle && !(e.title + ' ' + (e.detail || '') + ' ' + (e.name || '')).toLowerCase().includes(needle)) continue;
      out.push(e);
    }
    return out;
  }

  /** Diff processes / listening ports / remote hosts against the previous observation. */
  observe(procs, sock, settings) {
    const byPid = new Map(procs.map(p => [p.pid, p]));
    if (this.procs && settings.procEvents) {
      for (const p of procs) {
        if (this.procs.has(p.pid) || p.kind === 'rigwatch') continue;
        const parent = byPid.get(p.ppid) || this.procs.get(p.ppid);
        this.add('proc.start', p.flags && p.flags.length ? 'warn' : 'info', (p.label || p.name) + ' started', { pid: p.pid, name: p.name, detail: U.trunc(p.cmd || p.exe || '', 220), parent: parent ? parent.name : '', kind: p.kind, flags: p.flags || undefined });
      }
      for (const [pid, p] of this.procs) if (!byPid.has(pid) && p.kind !== 'rigwatch') this.add('proc.exit', 'info', (p.label || p.name) + ' exited', { pid, name: p.name, detail: 'ran ' + Math.round(p.age || 0) + ' s', kind: p.kind });
    }
    this.procs = new Map(procs.map(p => [p.pid, { name: p.name, label: p.label, age: p.age, kind: p.kind }]));
    if (!sock || !sock.at) return;
    const keys = new Map(sock.listen.map(l => [l.proto + ':' + l.port + ':' + l.pid, l]));
    if (this.ports) {
      for (const [k, l] of keys) if (!this.ports.has(k)) { const p = byPid.get(l.pid); this.add('port.open', l.scope === 'all' ? 'warn' : 'info', l.proto + ' ' + l.port + ' opened by ' + (p ? (p.label || p.name) : 'pid ' + l.pid), { pid: l.pid, name: p ? p.name : '', port: l.port, proto: l.proto, detail: 'bound to ' + l.addrs.join(', ') + (l.scope === 'all' ? ' (all interfaces: reachable from the network)' : '') }); }
      for (const [k, l] of this.ports) if (!keys.has(k)) this.add('port.close', 'info', l.proto + ' ' + l.port + ' closed', { pid: l.pid, port: l.port, proto: l.proto, name: l.name || '' });
    }
    this.ports = new Map([...keys].map(([k, l]) => { const p = byPid.get(l.pid); return [k, Object.assign({ name: p ? p.name : '' }, l)]; }));
    // first contact with a remote host, per app
    const fresh = new Map();
    for (const c of sock.conns) {
      const kind = U.ipKind(c.rh);
      if (kind === 'loopback' || kind === 'any' || kind === 'multicast') continue;
      const p = byPid.get(c.pid); const name = p ? p.name : (sock.names.get(c.pid) || 'pid ' + c.pid);
      const key = name.toLowerCase() + '|' + c.rh;
      if (this.hosts.has(key)) continue;
      this.hosts.add(key);
      if (!this.hostsSeeded || !settings.hostEvents) continue;
      if (!fresh.has(name)) fresh.set(name, []);
      fresh.get(name).push({ ip: c.rh, port: c.rp, pid: c.pid, kind });
    }
    for (const [name, list] of fresh) {
      if (list.length > 5) this.add('net.newhost', 'info', name + ' contacted ' + list.length + ' new hosts', { name, pid: list[0].pid, detail: list.slice(0, 12).map(h => h.ip + ':' + h.port).join(', ') + (list.length > 12 ? ' …' : '') });
      else for (const h of list) this.add('net.newhost', 'info', name + ' → ' + h.ip + ':' + h.port, { name, pid: h.pid, ip: h.ip, port: h.port, detail: h.kind + ' address' });
    }
    this.hostsSeeded = true;
    if (this.hosts.size > 50000) this.hosts.clear();
  }
}

module.exports = { Timeline };

};
__M["lib/toolbox.js"] = function (module, exports, require) {
'use strict';
// System toolbox: quick actions, event logs, installed apps, tasks, devices, drivers, updates,
// hosts file, environment/PATH, power plans, temp cleanup, firewall blocks, loaded modules.
// Windows gets the full set (via the PowerShell control worker); Linux/macOS get what maps.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const U = require('./util');

const WIN = U.IS_WIN;
const HOSTS = WIN ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'drivers', 'etc', 'hosts') : '/etc/hosts';
const SECRET_KEY = /key|token|secret|passw|pwd|credential|auth/i;
const OPEN_TOOLS = WIN ? {
  taskmgr: 'taskmgr', devmgmt: 'devmgmt.msc', eventvwr: 'eventvwr.msc', services: 'services.msc', resmon: 'resmon', perfmon: 'perfmon', firewall: 'wf.msc',
  network: 'ncpa.cpl', programs: 'appwiz.cpl', sysprops: 'sysdm.cpl', diskmgmt: 'diskmgmt.msc', compmgmt: 'compmgmt.msc', regedit: 'regedit', msinfo: 'msinfo32', power: 'powercfg.cpl', sound: 'mmsys.cpl', tasksched: 'taskschd.msc', gpedit: 'gpedit.msc', cmd: 'cmd', powershell: 'powershell',
} : {};

async function dirSize(dir, budget) {
  let bytes = 0, files = 0;
  const walk = async d => {
    if (Date.now() > budget.until || files > 300000) return;
    let ents; try { ents = await fs.promises.readdir(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else { try { const s = await fs.promises.lstat(p); bytes += s.size; files++; } catch { /* locked */ } }
    }
  };
  await walk(dir);
  return { bytes, files };
}
const tempDirs = () => [os.tmpdir()].concat(WIN && process.env.SystemRoot ? [path.join(process.env.SystemRoot, 'Temp')] : []).filter((d, i, a) => a.indexOf(d) === i);

function parseHosts(text) {
  return String(text || '').split(/\r?\n/).map((raw, i) => {
    const line = raw.trim();
    const off = /^#\s*\d/.test(line);
    const body = line.replace(/^#\s*/, '').replace(/\s+#.*$/, '');
    const f = body.split(/\s+/);
    if (!line || (line.startsWith('#') && !off) || f.length < 2 || !/^[\d.:a-f]+$/i.test(f[0])) return null;
    return { line: i, ip: f[0], hosts: f.slice(1), enabled: !off };
  }).filter(Boolean);
}

function create(engine) {
  const plat = engine.plat;
  const ctl = (op, args, t) => plat.ctl.request(op, args || {}, t || 60000);
  const tb = {};

  tb.get = async (what, q) => {
    switch (what) {
      case 'events': {
        const hours = U.clamp(U.int(q.hours, 24), 1, 24 * 30), max = U.clamp(U.int(q.max, 300), 10, 2000);
        if (WIN) return ctl('events', { log: q.log || 'System', levels: q.level === 'all' ? null : q.level === 'error' ? [1, 2] : [1, 2, 3], hours, max });
        if (U.which(['journalctl'])) {
          const r = await U.run('journalctl', ['-p', q.level === 'all' ? '6' : q.level === 'error' ? '3' : '4', '-n', String(max), '--since', '-' + hours + 'h', '-o', 'json', '--no-pager'], { timeout: 30000 });
          return r.stdout.split('\n').filter(Boolean).map(l => { try { const j = JSON.parse(l); return { t: Math.round(+j.__REALTIME_TIMESTAMP / 1000), id: +j.PRIORITY, level: +j.PRIORITY <= 3 ? 2 : 3, provider: j.SYSLOG_IDENTIFIER || j._COMM || '', log: 'journal', msg: String(j.MESSAGE || '').slice(0, 600) }; } catch { return null; } }).filter(Boolean).reverse();
        }
        throw new Error('event logs are not available on this OS');
      }
      case 'secevents': if (!WIN) throw new Error('Windows only'); return ctl('secevents', { hours: U.clamp(U.int(q.hours, 72), 1, 24 * 30) }, 90000);
      case 'apps': {
        if (WIN) return ctl('apps');
        if (U.which(['dpkg-query'])) { const r = await U.run('dpkg-query', ['-W', '-f=${Package}\t${Version}\t${Installed-Size}\t${Maintainer}\n'], { timeout: 30000 }); return r.stdout.split('\n').filter(Boolean).map(l => { const f = l.split('\t'); return { name: f[0], version: f[1], sizeKb: +f[2] || 0, publisher: f[3] || '', scope: 'machine' }; }); }
        if (U.which(['rpm'])) { const r = await U.run('rpm', ['-qa', '--qf', '%{NAME}\t%{VERSION}-%{RELEASE}\t%{SIZE}\t%{VENDOR}\n'], { timeout: 30000 }); return r.stdout.split('\n').filter(Boolean).map(l => { const f = l.split('\t'); return { name: f[0], version: f[1], sizeKb: Math.round(+f[2] / 1024) || 0, publisher: f[3] || '', scope: 'machine' }; }); }
        if (process.platform === 'darwin') { let a = []; try { a = fs.readdirSync('/Applications').filter(x => x.endsWith('.app')); } catch { /* none */ } return a.map(x => ({ name: x.replace(/\.app$/, ''), version: '', publisher: '', scope: 'machine', location: '/Applications/' + x })); }
        return [];
      }
      case 'tasks': {
        if (WIN) return ctl('tasks', { all: q.all === '1' }, 90000);
        const out = [];
        if (U.which(['systemctl'])) { const r = await U.run('systemctl', ['list-timers', '--all', '--no-legend', '--no-pager'], { timeout: 15000 }); for (const l of r.stdout.split('\n')) { const m = l.trim().match(/(\S+\.timer)\s+(\S+\.service)\s*$/); if (m) out.push({ name: m[1], path: 'systemd', state: 'Ready', actions: m[2], triggers: 'timer', last: 0, next: 0, result: null, user: '' }); } }
        const c = await U.run('crontab', ['-l'], { timeout: 5000 });
        for (const l of c.stdout.split('\n')) if (l.trim() && !l.trim().startsWith('#')) out.push({ name: l.trim().split(/\s+/).slice(0, 5).join(' '), path: 'crontab', state: 'Ready', actions: l.trim().split(/\s+/).slice(5).join(' '), triggers: 'cron', last: 0, next: 0, result: null, user: os.userInfo().username });
        return out;
      }
      case 'devices': if (!WIN) return []; return ctl('devices');
      case 'drivers': if (!WIN) return []; return ctl('drivers', {}, 90000);
      case 'updates': if (!WIN) return { hotfixes: [], reboot: [] }; return ctl('updates', {}, 60000);
      case 'modules': {
        const pid = U.int(q.pid, -1);
        if (WIN) return ctl('modules', { pid });
        if (process.platform === 'linux') { const t = await U.readTextAsync('/proc/' + pid + '/maps'); if (!t) throw new Error('no access (needs the same user or root)'); const seen = new Set(); return t.split('\n').map(l => l.trim().split(/\s+/)[5]).filter(p => p && p.startsWith('/') && !seen.has(p) && seen.add(p)).map(p => ({ name: path.basename(p), path: p, size: 0, company: '', version: '' })); }
        throw new Error('not supported on this OS');
      }
      case 'fwlist': if (!WIN) return []; return ctl('fwlist');
      case 'env': {
        let vars;
        if (WIN) vars = await ctl('env');
        else vars = { user: Object.entries(process.env).map(([k, v]) => ({ k, v })), machine: [] };
        const mask = list => U.arr(list).map(x => ({ k: x.k, v: SECRET_KEY.test(x.k) ? '\u2022\u2022\u2022\u2022 (hidden)' : x.v })).sort((a, b) => a.k.localeCompare(b.k));
        const pathVar = list => (U.arr(list).find(x => /^path$/i.test(x.k)) || {}).v || '';
        const entries = [];
        const seen = new Map();
        for (const [scope, val] of [['machine', pathVar(vars.machine)], ['user', pathVar(vars.user)]]) {
          for (const raw of String(val).split(path.delimiter)) {
            if (!raw.trim()) continue;
            const expanded = raw.replace(/%([^%]+)%/g, (m, k) => process.env[k] || m);
            const key = expanded.toLowerCase().replace(/[\\/]+$/, '');
            let exists = false; try { exists = fs.statSync(expanded).isDirectory(); } catch { /* missing */ }
            entries.push({ scope, dir: raw, exists, dup: seen.has(key) });
            seen.set(key, true);
          }
        }
        return { user: mask(vars.user), machine: mask(vars.machine), path: entries };
      }
      case 'hosts': {
        const text = (await U.readTextAsync(HOSTS)) || '';
        let writable = false; try { fs.accessSync(HOSTS, fs.constants.W_OK); writable = true; } catch { /* needs admin */ }
        return { file: HOSTS, entries: parseHosts(text), writable, raw: text.slice(0, 20000) };
      }
      case 'powerplans': {
        if (WIN) {
          const r = await U.run(U.sys32('powercfg.exe'), ['/list'], { timeout: 10000 });
          return { plans: r.stdout.split(/\r?\n/).map(l => l.match(/([0-9a-f]{8}-[0-9a-f-]{27})\s+\((.+?)\)(\s*\*)?/i)).filter(Boolean).map(m => ({ guid: m[1], name: m[2], active: !!m[3] })) };
        }
        if (U.which(['powerprofilesctl'])) { const r = await U.run('powerprofilesctl', ['list'], { timeout: 5000 }); return { plans: (r.stdout.match(/^[ *] *([\w-]+):/gm) || []).map(s => ({ guid: s.replace(/[ *:]/g, ''), name: s.replace(/[ *:]/g, ''), active: s.trim().startsWith('*') })) }; }
        return { plans: [] };
      }
      case 'temp': {
        const budget = { until: Date.now() + 8000 };
        const dirs = [];
        for (const d of tempDirs()) dirs.push(Object.assign({ dir: d }, await dirSize(d, budget)));
        let recycle = null; if (WIN) { try { recycle = await ctl('recycle', { empty: false }, 30000); } catch { recycle = null; } }
        return { dirs, recycle, partial: Date.now() > budget.until };
      }
      case 'overview': {
        const [plans, updates] = await Promise.all([tb.get('powerplans', {}).catch(() => ({ plans: [] })), WIN ? ctl('updates', {}, 60000).catch(() => null) : null]);
        return { plans: plans.plans, reboot: updates ? updates.reboot : [], tools: Object.keys(OPEN_TOOLS), admin: plat.isAdmin() };
      }
    }
    throw new Error('unknown toolbox view ' + what);
  };

  tb.act = async (a) => {
    const op = String(a.op || '');
    const run = async (cmd, args, label) => { const r = await U.run(cmd, args, { timeout: 60000 }); if (!r.ok) throw new Error((r.stderr || r.stdout).trim().split('\n').slice(-2).join(' ') || label + ' failed'); return (r.stdout.trim().split('\n').slice(-1)[0] || label + ' done').slice(0, 300); };
    switch (op) {
      case 'flushdns': return WIN ? run(U.sys32('ipconfig.exe'), ['/flushdns'], 'flush DNS') : process.platform === 'darwin' ? run('dscacheutil', ['-flushcache'], 'flush DNS') : run('resolvectl', ['flush-caches'], 'flush DNS');
      case 'renewip': if (!WIN) throw new Error('Windows only'); await run(U.sys32('ipconfig.exe'), ['/release'], 'release'); return run(U.sys32('ipconfig.exe'), ['/renew'], 'renew');
      case 'lock': return WIN ? run(U.sys32('rundll32.exe'), ['user32.dll,LockWorkStation'], 'lock') : process.platform === 'darwin' ? run('pmset', ['displaysleepnow'], 'lock') : run('loginctl', ['lock-session'], 'lock');
      case 'restartexplorer': {
        if (!WIN) throw new Error('Windows only');
        await U.run(U.sys32('taskkill.exe'), ['/F', '/IM', 'explorer.exe'], { timeout: 15000 });
        await U.sleep(800);
        spawn('explorer.exe', [], { detached: true, stdio: 'ignore' }).unref();
        return 'Explorer restarted';
      }
      case 'shutdown': case 'restart': {
        const mins = U.clamp(U.int(a.minutes, 1), 0, 1440);
        if (WIN) return run(U.sys32('shutdown.exe'), [op === 'restart' ? '/r' : '/s', '/t', String(mins * 60), '/c', 'Scheduled from RigWatch'], op);
        return run('shutdown', [op === 'restart' ? '-r' : '-h', '+' + mins], op);
      }
      case 'abortshutdown': return WIN ? run(U.sys32('shutdown.exe'), ['/a'], 'abort') : run('shutdown', ['-c'], 'abort');
      case 'opentool': {
        const t = OPEN_TOOLS[a.name]; if (!t) throw new Error('unknown tool');
        spawn('cmd.exe', ['/c', 'start', '', t], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
        return 'opened ' + t;
      }
      case 'setplan': {
        const g = String(a.guid || '');
        if (WIN) { if (!/^[0-9a-f-]{36}$/i.test(g)) throw new Error('bad plan'); return run(U.sys32('powercfg.exe'), ['/setactive', g], 'set power plan'); }
        if (!/^[\w-]+$/.test(g)) throw new Error('bad profile'); return run('powerprofilesctl', ['set', g], 'set power profile');
      }
      case 'ultimateplan': if (!WIN) throw new Error('Windows only'); return run(U.sys32('powercfg.exe'), ['-duplicatescheme', 'e9a42b02-d5df-448d-aa00-03f14749eb61'], 'add Ultimate Performance');
      case 'cleantemp': {
        const cutoff = Date.now() - U.clamp(U.int(a.hours, 24), 0, 24 * 365) * 3600e3;
        let freed = 0, removed = 0, skipped = 0;
        const sweep = async d => {
          let ents; try { ents = await fs.promises.readdir(d, { withFileTypes: true }); } catch { return; }
          for (const e of ents) {
            const p = path.join(d, e.name);
            try {
              if (e.isDirectory()) { await sweep(p); const left = await fs.promises.readdir(p); if (!left.length) await fs.promises.rmdir(p); continue; }
              const s = await fs.promises.lstat(p);
              if (s.mtimeMs > cutoff) { skipped++; continue; }
              await fs.promises.unlink(p); freed += s.size; removed++;
            } catch { skipped++; }
          }
        };
        for (const d of tempDirs()) await sweep(d);
        return 'removed ' + removed + ' files, freed ' + (freed / 1048576).toFixed(1) + ' MB (' + skipped + ' recent or in use, kept)';
      }
      case 'emptyrecycle': if (!WIN) throw new Error('Windows only'); await ctl('recycle', { empty: true }, 120000); return 'Recycle Bin emptied';
      case 'task': if (!WIN) throw new Error('Windows only'); return ctl('task', { path: String(a.path || '\\'), name: String(a.name || ''), action: String(a.action || '') });
      case 'uninstall': if (!WIN) throw new Error('Windows only'); return ctl('uninstall', { key: String(a.key || '') });
      case 'startup': if (!WIN) throw new Error('Windows only'); return ctl('startuptoggle', { name: String(a.name || ''), location: String(a.location || ''), enable: !!a.enable });
      case 'fwblock': {
        if (!WIN) throw new Error('Windows only');
        const p = engine.lastProcs().find(x => x.pid === U.int(a.pid, -1));
        const exe = a.path || (p && p.exe);
        if (!exe) throw new Error('executable path unknown');
        return ctl('fwblock', { path: exe, label: (p && p.name) || path.basename(exe), on: a.on !== false });
      }
      case 'hosts': {
        const text = (await U.readTextAsync(HOSTS)) || '';
        const lines = text.split(/\r?\n/);
        if (a.action === 'add') {
          const ip = String(a.ip || '').trim(), host = String(a.host || '').trim();
          if (!/^[\d.:a-f]+$/i.test(ip) || !/^[A-Za-z0-9.-]{1,253}$/.test(host)) throw new Error('invalid IP or host name');
          lines.push(ip + '\t' + host + '\t# added by RigWatch');
        } else {
          const i = U.int(a.line, -1);
          if (!parseHosts(text).some(e => e.line === i)) throw new Error('no such entry');
          if (a.action === 'remove') lines.splice(i, 1);
          else if (a.action === 'toggle') lines[i] = /^\s*#/.test(lines[i]) ? lines[i].replace(/^\s*#\s*/, '') : '# ' + lines[i];
          else throw new Error('bad action');
        }
        try { fs.copyFileSync(HOSTS, HOSTS + '.rigwatch.bak'); fs.writeFileSync(HOSTS, lines.join(WIN ? '\r\n' : '\n')); }
        catch (e) { throw new Error(e.code === 'EPERM' || e.code === 'EACCES' ? 'Editing the hosts file needs admin rights.' : e.message); }
        if (WIN) U.run(U.sys32('ipconfig.exe'), ['/flushdns']);
        return 'hosts file updated (backup: hosts.rigwatch.bak)';
      }
    }
    throw new Error('unknown toolbox action ' + op);
  };

  // disk usage analyzer as a streaming job
  tb.du = (dir, api) => (async () => {
    dir = path.resolve(String(dir || (WIN ? (process.env.SystemDrive || 'C:') + '\\' : os.homedir())));
    let st; try { st = fs.statSync(dir); } catch { throw new Error('folder not found'); }
    if (!st.isDirectory()) throw new Error('not a folder');
    api.line('scanning ' + dir + ' (30 s budget)', 'cmd');
    const until = Date.now() + 30000;
    const top = new Map(), big = [];
    let files = 0, total = 0, denied = 0, last = 0;
    const walk = async (d, bucket, depth) => {
      if (Date.now() > until || api.cancelled) return;
      let ents; try { ents = await fs.promises.readdir(d, { withFileTypes: true }); } catch { denied++; return; }
      for (const e of ents) {
        if (e.isSymbolicLink()) continue;
        const p = path.join(d, e.name);
        const b = bucket || p;
        if (e.isDirectory()) { if (!bucket) top.set(p, top.get(p) || { path: p, bytes: 0, files: 0, dir: true }); await walk(p, b, depth + 1); continue; }
        let s; try { s = await fs.promises.lstat(p); } catch { denied++; continue; }
        files++; total += s.size;
        const t = top.get(b) || { path: b, bytes: 0, files: 0, dir: !!bucket }; t.bytes += s.size; t.files++; top.set(b, t);
        if (s.size > 50 * 1048576) { big.push({ path: p, bytes: s.size }); if (big.length > 200) { big.sort((x, y) => y.bytes - x.bytes); big.length = 100; } }
        if (Date.now() - last > 1000) { last = Date.now(); api.line(files.toLocaleString() + ' files, ' + (total / 1073741824).toFixed(2) + ' GB so far\u2026', 'dim'); }
      }
    };
    await walk(dir, null, 0);
    const list = [...top.values()].sort((a, b) => b.bytes - a.bytes).slice(0, 40);
    big.sort((x, y) => y.bytes - x.bytes);
    api.line('done: ' + files.toLocaleString() + ' files, ' + (total / 1073741824).toFixed(2) + ' GB' + (Date.now() > until ? ' (time budget hit, partial)' : '') + (denied ? ', ' + denied + ' unreadable' : ''), 'cmd');
    return { dir, total, files, denied, partial: Date.now() > until, top: list, biggest: big.slice(0, 30) };
  })();

  return tb;
}

module.exports = { create, parseHosts, OPEN_TOOLS };

};
__M["lib/tools.js"] = function (module, exports, require) {
'use strict';
// Optional Windows helpers, fetched automatically on first run from their official GitHub
// releases. Versions are pinned and every download is SHA-256 verified before use.
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const U = require('./util');
const { ROOT } = require('./assets');
const { CFG } = require('./config');

const TOOLS = {
  lhm: {
    label: 'LibreHardwareMonitor 0.9.6 (sensor library)', zip: true, dir: 'LibreHardwareMonitor', check: 'LibreHardwareMonitor/LibreHardwareMonitorLib.dll',
    url: 'https://github.com/LibreHardwareMonitor/LibreHardwareMonitor/releases/download/v0.9.6/LibreHardwareMonitor.zip',
    sha256: '086d9f1b5a99e643edc2cfaaac16051685b551e4c5ac0b32a57c58c0e529c001',
  },
  presentmon: {
    label: 'Intel PresentMon 2.6.0 (frame capture)', file: 'PresentMon-2.6.0-x64.exe', check: 'PresentMon-2.6.0-x64.exe',
    url: 'https://github.com/GameTechDev/PresentMon/releases/download/v2.6.0/PresentMon-2.6.0-x64.exe',
    sha256: 'b2a706bc6ad475749e3b7e3409263aa1e6906d45bdcf993f6dbc0f660188f1af',
  },
  pawnio: {
    label: 'PawnIO 2.2.0 driver installer (CPU/board sensors)', file: 'PawnIO_setup.exe', check: 'PawnIO_setup.exe', onDemand: true,
    url: 'https://github.com/namazso/PawnIO.Setup/releases/download/2.2.0/PawnIO_setup.exe',
    sha256: '1f519a22e47187f70a1379a48ca604981c4fcf694f4e65b734aaa74a9fba3032',
  },
};
const state = {};
for (const k of Object.keys(TOOLS)) state[k] = { state: 'missing', path: null, err: '' };

function dirs() {
  return [process.env.RIGWATCH_TOOLS, path.join(ROOT, 'tools'), path.join(ROOT, 'bin'), path.join(CFG.home, 'tools')].filter(Boolean);
}
function writableDir() {
  for (const d of [process.env.RIGWATCH_TOOLS, path.join(ROOT, 'tools'), path.join(CFG.home, 'tools')].filter(Boolean)) {
    try { fs.mkdirSync(d, { recursive: true }); fs.accessSync(d, fs.constants.W_OK); return d; } catch { /* next */ }
  }
  return null;
}
/** Path of an installed tool, or null. LHM also counts if any LibreHardwareMonitorLib.dll is present. */
function find(name) {
  const t = TOOLS[name];
  for (const d of dirs()) {
    const p = path.join(d, t.check);
    if (fs.existsSync(p)) return t.zip ? path.dirname(p) : p;
  }
  if (name === 'presentmon') { const p = U.findFile(/^presentmon.*\.exe$/i, dirs()); if (p) return p; }
  if (name === 'lhm') for (const d of dirs()) { try { for (const sub of fs.readdirSync(d)) { const p = path.join(d, sub, 'LibreHardwareMonitorLib.dll'); if (fs.existsSync(p)) return path.dirname(p); } } catch { /* skip */ } }
  return null;
}

function get(url, dest, sha, hops = 0) {
  return new Promise((resolve, reject) => {
    if (hops > 6) return reject(new Error('too many redirects'));
    const req = https.get(url, { headers: { 'user-agent': 'RigWatch' }, timeout: 30000 }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) { res.resume(); return resolve(get(new URL(res.headers.location, url).href, dest, sha, hops + 1)); }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      const tmp = dest + '.part', out = fs.createWriteStream(tmp), h = crypto.createHash('sha256');
      res.on('data', d => h.update(d));
      res.pipe(out);
      out.on('finish', () => {
        const got = h.digest('hex');
        if (got !== sha) { fs.rmSync(tmp, { force: true }); return reject(new Error('checksum mismatch (got ' + got.slice(0, 12) + '…)')); }
        fs.renameSync(tmp, dest); resolve(dest);
      });
      out.on('error', reject); res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

async function extract(zip, dest) {
  fs.mkdirSync(dest, { recursive: true });
  let r = await U.run(U.sys32('tar.exe'), ['-xf', zip, '-C', dest], { timeout: 120000 });
  if (!r.ok) r = await U.run(U.psExe(), ['-NoProfile', '-NonInteractive', '-Command', 'Expand-Archive -LiteralPath $env:RW_ZIP -DestinationPath $env:RW_DEST -Force'], { timeout: 120000, env: Object.assign({}, process.env, { RW_ZIP: zip, RW_DEST: dest }) });
  if (!r.ok) throw new Error('could not unzip: ' + r.stderr.trim().slice(0, 200));
}

const inflight = {};
/** Make sure a tool is present; downloads it if allowed. Resolves to its path or null. */
function ensure(name, force) {
  const found = find(name);
  if (found) { state[name] = { state: 'ready', path: found, err: '' }; return Promise.resolve(found); }
  if (!U.IS_WIN || (process.env.NO_DOWNLOAD === '1' && !force)) return Promise.resolve(null);
  if (TOOLS[name].onDemand && !force) return Promise.resolve(null);
  if (inflight[name]) return inflight[name];
  const t = TOOLS[name];
  const dir = writableDir();
  if (!dir) { state[name] = { state: 'error', path: null, err: 'no writable tools folder' }; return Promise.resolve(null); }
  state[name] = { state: 'downloading', path: null, err: '' };
  U.log('downloading ' + t.label + ' …');
  inflight[name] = (async () => {
    try {
      if (t.zip) {
        const zip = path.join(dir, path.basename(new URL(t.url).pathname));
        await get(t.url, zip, t.sha256);
        await extract(zip, path.join(dir, t.dir));
        fs.rmSync(zip, { force: true });
      } else await get(t.url, path.join(dir, t.file), t.sha256);
      const p = find(name);
      state[name] = { state: p ? 'ready' : 'error', path: p, err: p ? '' : 'installed but not found' };
      U.log(t.label + ' ready');
      return p;
    } catch (e) {
      state[name] = { state: 'error', path: null, err: e.message };
      U.log(t.label + ' download failed: ' + e.message);
      return null;
    } finally { delete inflight[name]; }
  })();
  return inflight[name];
}

module.exports = { TOOLS, ensure, find, state };

};
__M["lib/util.js"] = function (module, exports, require) {
'use strict';
// Small shared helpers. No dependencies.
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const IS_WIN = process.platform === 'win32';
const int = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const num = v => { const n = +v; return Number.isFinite(n) ? n : 0; };
const opt = v => { if (v === null || v === undefined || v === '') return null; const n = parseFloat(v); return Number.isFinite(n) ? n : null; };
const r1 = v => Math.round(v * 10) / 10;
const r2 = v => Math.round(v * 100) / 100;
const arr = x => Array.isArray(x) ? x : x && Array.isArray(x.value) ? x.value : x ? [x] : [];
const trunc = (s, n) => { s = s == null ? '' : String(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log('[rigwatch]', ...a);

/** execFile wrapper that never rejects. */
function run(cmd, args = [], o = {}) {
  return new Promise(resolve => {
    const t0 = Date.now();
    try {
      execFile(cmd, args, {
        windowsHide: true, timeout: o.timeout || 15000, maxBuffer: o.maxBuffer || 64 << 20,
        encoding: o.encoding || 'utf8', env: o.env || process.env, cwd: o.cwd,
      }, (err, stdout, stderr) => {
        resolve({ ok: !err, code: err ? (typeof err.code === 'number' ? err.code : -1) : 0, stdout: stdout || '', stderr: String(stderr || (err ? err.message : '')), ms: Date.now() - t0 });
      });
    } catch (e) { resolve({ ok: false, code: -1, stdout: '', stderr: e.message, ms: 0 }); }
  });
}

const whichCache = new Map();
/** Find an executable on PATH (+ extra dirs). Cached. */
function which(names, extra = []) {
  names = [].concat(names);
  const key = names.join('|') + '#' + extra.join('|');
  if (whichCache.has(key)) return whichCache.get(key);
  const exts = IS_WIN ? ['.exe', '.cmd', '.bat', ''] : [''];
  const dirs = [...extra, ...(process.env.PATH || '').split(path.delimiter)].filter(Boolean);
  let found = null;
  outer: for (const n of names) {
    for (const d of dirs) {
      for (const e of exts) {
        const p = path.join(d, n + e);
        try { if (fs.statSync(p).isFile()) { found = p; break outer; } } catch { /* next */ }
      }
    }
  }
  whichCache.set(key, found);
  return found;
}

/** First file in dirs whose name matches rx. */
function findFile(rx, dirs) {
  for (const d of dirs) {
    if (!d) continue;
    try { for (const f of fs.readdirSync(d)) if (rx.test(f)) return path.join(d, f); } catch { /* skip */ }
  }
  return null;
}

/** Calls onLine for every complete line on a readable stream. */
function onLines(stream, onLine) {
  let buf = '';
  stream.setEncoding('utf8');
  stream.on('data', d => {
    buf += d;
    const parts = buf.split('\n');
    buf = parts.pop();
    for (let l of parts) { if (l.endsWith('\r')) l = l.slice(0, -1); if (l) onLine(l); }
  });
  stream.on('end', () => { if (buf) onLine(buf); buf = ''; });
}

function readText(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }
async function readTextAsync(p) { try { return await fs.promises.readFile(p, 'utf8'); } catch { return null; } }

/** Classify an IP address. */
function ipKind(ip) {
  if (!ip || ip === '*') return 'any';
  ip = String(ip).replace(/^::ffff:/i, '').replace(/%.*$/, '');
  if (ip === '0.0.0.0' || ip === '::') return 'any';
  if (ip === '::1' || ip.startsWith('127.')) return 'loopback';
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip) || /^f[cd][0-9a-f]{2}:/i.test(ip)) return 'private';
  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(ip)) return 'cgnat';
  if (ip.startsWith('169.254.') || /^fe[89ab][0-9a-f]:/i.test(ip)) return 'linklocal';
  if (/^(22[4-9]|23\d)\./.test(ip) || /^ff[0-9a-f]{2}:/i.test(ip) || ip === '255.255.255.255') return 'multicast';
  return 'public';
}
const isLoopback = h => ipKind(h) === 'loopback' || h === 'localhost';
const isAnyAddr = h => h === '0.0.0.0' || h === '::' || h === '*' || h === '[::]';

const SECRET_RX = /((?:^|[\s"'])-{0,2}(?:password|passwd|pwd|token|secret|api[-_]?key|access[-_]?key|client[-_]?secret|private[-_]?key|auth[-_]?token|bearer)["']?\s*[=:\s]\s*["']?)([^\s"'&]+)/gi;
/** Masks obvious secrets in command lines before they leave the server. */
function redact(cmd) {
  if (!cmd) return '';
  return String(cmd)
    .replace(SECRET_RX, '$1••••')
    .replace(/(\w+:\/\/[^:\s/@]+:)([^@\s]+)@/g, '$1••••@');
}

/** Split a command line respecting double quotes (Windows-ish, good enough for unix too). */
function splitArgs(cmd) {
  const out = []; let cur = '', q = false, has = false;
  for (const ch of String(cmd || '')) {
    if (ch === '"') { q = !q; has = true; continue; }
    if (!q && (ch === ' ' || ch === '\t')) { if (cur || has) out.push(cur); cur = ''; has = false; continue; }
    cur += ch;
  }
  if (cur || has) out.push(cur);
  return out;
}

/** Parse "1:02:03", "02:03", "1-02:03:04" (ps etime) or "12:34.56" (ps time) to seconds. */
function parseDuration(s) {
  if (!s) return 0;
  s = String(s).trim();
  let days = 0;
  const dash = s.indexOf('-');
  if (dash > 0) { days = num(s.slice(0, dash)); s = s.slice(dash + 1); }
  const p = s.split(':').map(Number);
  let sec = 0;
  for (const v of p) sec = sec * 60 + (Number.isFinite(v) ? v : 0);
  return days * 86400 + sec;
}

/** Simple per-key rate calculator: rate(key, value, now) -> units per second (null first time). */
class Rates {
  constructor() { this.m = new Map(); }
  rate(key, value, now = Date.now()) {
    const p = this.m.get(key);
    this.m.set(key, { v: value, t: now, seen: now });
    if (!p || now <= p.t || value < p.v) return null;
    return (value - p.v) / ((now - p.t) / 1000);
  }
  prune(maxAgeMs = 60000, now = Date.now()) { for (const [k, v] of this.m) if (now - v.seen > maxAgeMs) this.m.delete(k); }
}

/** Atomic-ish JSON write. */
function writeJson(file, obj) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
    fs.renameSync(tmp, file);
    return true;
  } catch { return false; }
}

/** Windows PowerShell 5.1 by absolute path (works even with a broken PATH). */
function psExe() {
  if (!IS_WIN) return 'pwsh';
  const p = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  try { fs.accessSync(p); return p; } catch { return 'powershell.exe'; }
}
function sys32(exe) {
  if (!IS_WIN) return exe;
  const p = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', exe);
  try { fs.accessSync(p); return p; } catch { return exe; }
}

const SAFE_HOST =/^[A-Za-z0-9._:%\-[\]]{1,253}$/;
/** Validates a host/IP passed to external tools (prevents option injection). */
function safeHost(h) { h = String(h || '').trim(); return SAFE_HOST.test(h) && !h.startsWith('-') ? h : null; }

module.exports = {
  IS_WIN, int, clamp, num, opt, r1, r2, arr, trunc, sleep, log, run, which, findFile, onLines, readText, readTextAsync,
  ipKind, isLoopback, isAnyAddr, redact, splitArgs, parseDuration, Rates, writeJson, safeHost, psExe, sys32,
};

};
function __req(from) {
  return function (name) {
    if (!name.startsWith('.')) return require(name);
    let p = __P.normalize(__P.join(__P.dirname(from), name));
    if (!__M[p]) p = __M[p + '.js'] ? p + '.js' : p + '/index.js';
    if (!__M[p]) throw new Error('module not bundled: ' + name + ' (from ' + from + ')');
    if (__C[p]) return __C[p].exports;
    const module = { exports: {} };
    __C[p] = module;
    __M[p](module, module.exports, __req(p));
    return module.exports;
  };
}
__req('index.js')('./server.js');
