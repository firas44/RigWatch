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
