# RigWatch

**Your whole PC on one page.** CPU, GPU, temperatures, fans, FPS, every process, every port and connection, a Wazuh-style SIEM with a year of security history, a network lab, Docker, your dev servers and a toolbox of Windows power tools, live in your browser.

One `node server.js`. No dependencies, no install step, no account, nothing leaves your machine.

![license MIT](https://img.shields.io/badge/license-MIT-blue) ![node 18+](https://img.shields.io/badge/node-%E2%89%A518.15-brightgreen) ![platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey) ![dependencies 0](https://img.shields.io/badge/dependencies-0-success)

---

## Install and run (Windows)

You need **Windows 10 (1809 or newer) or Windows 11** and **Node.js 18.15 or newer** ([LTS download](https://nodejs.org)).

**Option 1: double-click (easiest)**

1. Click the green **Code** button on GitHub → **Download ZIP**, then extract it anywhere.
2. Double-click **`RigWatch.cmd`**.
   No Node.js yet? The launcher offers to install the LTS version with `winget` for you.
3. Click **Yes** on the Windows admin prompt. Your browser opens the dashboard.

> If Windows shows *"Windows protected your PC"* for `RigWatch.cmd`, click **More info → Run anyway** (it happens to every downloaded script). Or right-click the ZIP → Properties → **Unblock** before extracting.

**Option 2: terminal**

```powershell
git clone https://github.com/firas44/rigwatch.git
cd rigwatch
node server.js
```

Open **http://localhost:3000**. If port 3000 is taken, RigWatch picks the next free one and prints it.

**Option 3: one single file**

Download [`dist/rigwatch.js`](dist/rigwatch.js) and run `node rigwatch.js`. It is the whole app in one file.

### What happens on first run

1. **Downloads two helpers** from their official GitHub releases into `tools/`, pinned to exact versions and verified by SHA-256 before use:
   - LibreHardwareMonitor 0.9.6, used as a library for temperatures, fans, power and clocks (no tray app, no window)
   - Intel PresentMon 2.6.0, for FPS, 1% lows and frame times
2. **Asks for admin once** (normal UAC prompt). RigWatch then runs elevated in the background and your terminal stays its console: logs appear there and **Ctrl+C stops it**. Click **No** and it still runs, with GPU sensors and everything else that doesn't need admin; you can switch later with **Restart as admin** in the UI.
3. **CPU temperatures on AMD Ryzen / Intel** need the signed [PawnIO](https://github.com/namazso/PawnIO.Setup) driver (the one LibreHardwareMonitor uses). The first time, RigWatch shows an **Enable CPU & board sensors** button that downloads the verified installer and opens it. One click, once.

Nothing else to configure.

## What you get

| Page | |
|---|---|
| **Dashboard** | 21 widgets you can drag, resize, add and remove: KPIs, CPU per thread, GPU engines, memory breakdown, network, disk, top apps, security score, FPS, temperatures, latency, dev servers, open ports, live timeline, per-thread heatmap, containers, storage, battery |
| **Performance** | Every metric over 15 min / 1 h / 6 h / 24 h / 7 / 30 / 90 days / 1 year (history survives restarts), CSV export |
| **Processes** | Table, tree and by-app views; search with `port:3000`, `pid:123`, `kind:dev`, `user:root`. Click a process for live charts, full command line, parent/children, company/version, loaded DLLs, and **end / end tree / suspend / resume / priority / CPU affinity / open location / SHA-256 + VirusTotal / free its ports / block its network** |
| **Sensors** | Live graphs for every temperature, fan, power rail, clock, voltage, DIMM and NVMe sensor; click any sensor to zoom |
| **Network** | Adapters (IP, MAC, MTU, link, packets/s, errors), connections with reverse DNS, listening ports flagged *local only* or *all interfaces*, ARP neighbors, routes, DNS servers and cache, Wi-Fi, firewall profiles |
| **Security** | Exposure score and findings with fixes: risky services reachable from your network (RDP, SMB, databases, Docker API, Node inspector, ADB...), dev servers exposed on the LAN, programs running from temp/download folders, fake system process names, unsigned network-facing binaries, firewall and antivirus state |
| **Net Lab** | Ping, traceroute, DNS lookup, DNS resolver benchmark, TCP port scanner with banners, TLS certificate inspector, HTTP probe with timings and security-header audit, LAN device discovery, Wake-on-LAN, public IP. Output streams live |
| **Dev & Containers** | node / python / java / dotnet / bun / deno / databases labelled by what they run (`next dev`, `vite`, `uvicorn main:app`), their project and git branch, HTTP health checks. Docker & Podman: live stats, start / stop / restart / pause, streaming logs, inspect. WSL distros. Toolchain versions |
| **Services & Startup** | Start / stop / restart services, see everything that launches at boot |
| **Toolbox** | Flush DNS, renew IP, restart Explorer, lock, scheduled restart/shutdown, temp & Recycle Bin cleanup, power plans (incl. Ultimate Performance), 20 admin consoles · event logs incl. failed sign-ins, new services, cleared logs, Defender detections · installed apps with uninstall · startup apps on/off · scheduled tasks · problem devices and drivers · updates and pending reboot · hosts-file editor · PATH doctor · disk usage analyzer · per-app firewall blocks |
| **Alerts** | Rules on 24 metrics (temps, usage, disk space, ping, loss, FPS, an app's CPU/memory, "port X open", security findings) with browser notifications and Discord / Slack / JSON webhooks |
| **Timeline** | Processes started and exited, ports opened and closed, first contact with new hosts, new LAN devices, alerts, findings, and an audit log of every action you took |
| **System** | Hardware inventory, collector health, settings, theme / accent / density / units, LAN access link, API reference, **Copy diagnostics** |
| **/overlay** | Compact transparent readout for OBS or a second screen: `/overlay?items=fps,cpu,gpu,ram,ping&bg=clear&scale=1.5` |

**Every table has a Table / Chart / Both switch.** Numbers become ranked bars, categories become "count by" bars, dates become a timeline histogram. Your choice is remembered per table.

## SIEM: a security center for one machine

A Wazuh-style security center, built in, with no agents or servers to set up. Every security-relevant event gets a rule ID, a **level from 0 to 15**, groups, **MITRE ATT&CK** techniques and **PCI DSS / GDPR / NIST 800-53 / HIPAA** tags, and is kept for a year.

| Module | |
|---|---|
| **Security center** | Severity KPIs, alert level evolution, alerts by severity, every module as a card with its own counts and trend, top rules / addresses / techniques, latest high alerts, data-source health |
| **Threat hunting** | Search with `ip:` `user:` `rule:` `group:` `mitre:` `proc:` `level>=7` and free text; field facets to drill in with one click; histogram; expandable events with every field, the raw JSON and actions (block the IP, same rule, copy). CSV / JSON export |
| **MITRE ATT&CK** | Tactics × techniques matrix as a heat map, tactic counts, click a technique for its events |
| **Authentication** | Sign-ins vs failures over time, logon types, failure reasons, top users and sources, day × hour heat map. Signed-in sessions with **Disconnect / Sign out**, local accounts (admin, disabled, last sign-in), SMB clients, and a "who was signed in when" timeline |
| **Network & IPs** | Every remote address of the last year as a card: scope, reverse DNS, apps, connections in/out, failed logons, dropped packets, threat-feed hits. Inbound connections from the internet, port scans (from the firewall drop log), one-click **block**, AbuseIPDB / VirusTotal links |
| **Malware detection** | Defender detections and actions, Defender switched off or exclusions added, suspicious processes (fake system names, temp folders, tampered binaries), programs that ran for the first time, threat-feed hits |
| **Integrity monitoring** | Hosts file, startup folders, scheduled tasks, SSH keys, autostart registry keys (Run/RunOnce, Winlogon, debugger hijacks); `/etc` essentials on Linux, LaunchAgents on macOS. Add your own folders |
| **Configuration assessment** | A CIS-inspired hardening benchmark (26 checks on Windows: firewall, antivirus, UAC, RDP/NLA, SMBv1, SMB signing, accounts, password policy, BitLocker, Secure Boot, updates, LLMNR, WDigest, LSA protection, PowerShell 2.0 and logging, exposed ports…) with a score, the reason and the fix for each, and a daily score history |
| **System auditing** | Accounts created/deleted/added to Administrators, new services and drivers, scheduled tasks, cleared logs, audit-policy and firewall-rule changes, boots and crashes, every action taken in RigWatch |
| **Active response** | Block / unblock IPs and ranges (Windows Firewall rules, iptables on Linux) for an hour, a day, a week or forever. Optional **automatic blocking** of brute force, port scans and threat-feed hits. Trusted addresses, notification level, threat feeds, firewall drop logging |
| **Regulatory compliance** | PCI DSS, GDPR, NIST 800-53 and HIPAA requirement tiles with event counts |

**What feeds it.** Windows: the Security log (sign-ins, failures, lockouts, account and group changes, cleared logs, audit policy, services, tasks, RDP reconnects), System (services, boots, crashes), Defender, Windows Firewall, Remote Desktop and OpenSSH logs, read incrementally with bookmarks; the first start loads the last 30 days. Linux: journald or `/var/log/auth.log` (sshd, sudo, logins). Everywhere: connections and listening ports, new programs, file integrity, configuration checks and RigWatch's own alerts. Correlation rules add brute-force (5 failures in 2 minutes), success after failures, first logon from a new address and logons from the internet.

**Light on disk.** One JSON-lines file per day in `~/.rigwatch/siem/events/`, older days gzipped, everything past **365 days** deleted, capped at 256 MB. A typical desktop uses a few MB per month. Plain JSON: `grep`, `jq` or import it anywhere.

> Windows only lets administrators read the Security log, see other users' sessions and add firewall rules. Without admin the SIEM still records network, programs, files, configuration, Defender and firewall-rule events, and shows a **Restart as admin** button.

Ctrl+K opens a command palette (pages, processes, ports, PIDs, actions). `1`–`9` switch pages, `/` searches processes, `P` pauses, `T` toggles the theme, `E` customizes the dashboard.

## Linux and macOS

```bash
node server.js
```

| | Windows 10/11 | Linux | macOS |
|---|---|---|---|
| CPU, memory, disks, network, packets, processes, ports | ✅ | ✅ | ✅ |
| GPU | ✅ any vendor, per process | NVIDIA, AMD | Apple / AMD / Intel |
| Temperatures, fans, power | ✅ | ✅ hwmon (lm-sensors) | battery only |
| FPS | ✅ | – | – |
| Services, suspend, priority | ✅ | ✅ (systemd, root for others' processes) | ✅ (launchd) |
| Toolbox | full | events, apps, timers, hosts, PATH, disk usage | apps, hosts, PATH, disk usage |

Windows is developed and tested end to end. Linux and macOS are covered by unit tests against real command output but have had little live use so far: issues and PRs are very welcome. Run with `sudo` to see every user's sockets.

## Configuration

All optional, as environment variables:

| Variable | Default | |
|---|---|---|
| `PORT` | `3000` | fixed port (otherwise the next free one is used) |
| `HOST` | `127.0.0.1` | `0.0.0.0` to open it to your LAN (phone, second PC) |
| `INTERVAL_MS` | `1000` | sampling interval, 250–10000 |
| `ELEVATE` / `--no-elevate` | auto | Windows: skip the admin prompt |
| `NO_DOWNLOAD` | `0` | `1` never downloads helpers (put them in `tools/` yourself) |
| `PING_TARGET` | `1.1.1.1:443` | latency probe (TCP connect); `off` disables |
| `ALLOW_CONTROL` / `ALLOW_TOOLS` | `1` | `0` makes RigWatch read-only / disables the Net Lab |
| `LOCAL_TOKEN` / `LAN_READ` | | `1` / `token`: require the access token locally / for LAN reads |
| `ALLOWED_HOSTS` | | extra host names allowed in the `Host` header |
| `DOCKER_HOST` | auto | `unix:///…`, `npipe:////./pipe/…` or `tcp://host:port` |
| `RIGWATCH_HOME` | `~/.rigwatch` | settings, token, history, timeline |
| `RIGWATCH_TOOLS` | `./tools` | where helpers live |
| `NO_PERSIST` | `0` | `1` keeps nothing on disk |
| `RETENTION_DAYS` | `365` | days of SIEM history to keep |
| `SIEM_MAX_MB` | `256` | disk cap for SIEM history (oldest days go first) |
| `--open` | | open the browser on start |

```powershell
$env:HOST="0.0.0.0"; node server.js          # PowerShell
```

## Security and privacy

- Listens on `127.0.0.1` only by default. With `HOST=0.0.0.0` other devices get a **read-only** view; control needs the token link printed at startup.
- `Host` header checks block DNS rebinding; every action needs a custom header and same-origin request (CSRF protection); strict Content-Security-Policy.
- Kill / suspend / priority refuse core OS processes, RigWatch itself and the terminal running it. Every action lands in the timeline.
- Secrets in command lines (`--token=…`, `password=…`, `user:pass@`) are masked; Docker environment values and secret-looking environment variables are never shown.
- Network traffic happens only for: the helper downloads (GitHub), the latency probe (`PING_TARGET`), tools you run yourself (public IP via ipify, DNS benchmark, your webhooks), and, only if you turn it on, a daily download of the FireHOL and abuse.ch threat lists (nothing about you is sent; matching happens locally).
- Automatic blocking is off by default. When on, it only blocks public addresses (LAN optional) and never this machine, the gateway, DNS servers or your trusted list.
- The port scanner and LAN discovery are for networks you own or are allowed to test.
- RigWatch runs elevated on Windows so it can read CPU sensors, capture frames and manage services. Prefer least privilege? Use `--no-elevate`.

## Troubleshooting

| Problem | Fix |
|---|---|
| `node` is not recognized | Install Node.js LTS from [nodejs.org](https://nodejs.org) (or `winget install OpenJS.NodeJS.LTS`), then open a **new** terminal |
| Port 3000 is taken | Nothing to do: RigWatch uses the next free port and prints it. To pin one: `$env:PORT=4000; node server.js` |
| No CPU temperature | Click **Restart as admin**, then **Enable CPU & board sensors** (PawnIO). GPU temps work without it |
| FPS says "needs admin" | Click **Restart as admin** (frame capture uses Windows ETW tracing) |
| An anti-cheat complains | Uninstall *PawnIO* from Settings → Apps; everything except CPU/board sensors keeps working |
| Helper download failed (offline, proxy, GitHub blocked) | RigWatch runs without it. Put `LibreHardwareMonitor/` and `PresentMon-*.exe` into `tools/` yourself, or set `NO_DOWNLOAD=1` |
| Company-managed PC | Locked-down PowerShell can block some collectors; RigWatch falls back to basic CPU and memory and shows which collector failed under System → Collectors |
| Antivirus flags something | RigWatch only uses built-in Windows tools and the two official helpers; check the hashes in `lib/tools.js` |
| SIEM shows no sign-ins | The Windows Security log needs admin: click **Restart as admin** |
| Port scans never show up | Turn on **Firewall drop log** in SIEM → Active response (admin) |
| Anything else | System → Collectors → **Copy diagnostics**, then open an issue and paste it |

## Uninstall

1. Stop RigWatch (Ctrl+C) and delete its folder.
2. Delete `%USERPROFILE%\.rigwatch` (settings, history, timeline, SIEM events).
3. If you enabled CPU sensors: Settings → Apps → uninstall **PawnIO**.
4. If you blocked addresses or programs: unblock them in RigWatch first, or remove the firewall rule groups **RigWatch IP** and **RigWatch** (`Get-NetFirewallRule -Group "RigWatch IP" | Remove-NetFirewallRule`). If you turned on firewall drop logging, turn it off in SIEM → Active response.

RigWatch installs no services and changes nothing else on your system on its own.

## API

Everything on screen is JSON: build your own overlay, Stream Deck button or bot.

| | |
|---|---|
| `GET /api/stream` | Server-Sent Events: `hello`, `history`, `snap` (every interval), `events`, `job`, `alert` |
| `GET /api/snapshot` | latest full snapshot |
| `GET /api/history?range=24h[&format=csv]` | metric history (`15m`, `1h`, `6h`, `24h`, `7d`) |
| `GET /api/timeline?types=port,finding&format=csv` | events |
| `GET /api/process?pid=` · `/api/procinfo?pid=` | one process in depth |
| `GET /api/netinfo` · `/api/dnscache` · `/api/security` · `/api/services` · `/api/startup` · `/api/docker` · `/api/dev` | details |
| `GET /api/tb?what=events\|apps\|tasks\|devices\|drivers\|updates\|hosts\|env\|powerplans\|temp` | Toolbox data |
| `POST /api/action` | `{"type":"proc.kill","pid":123,"tree":true}` and `proc.suspend`, `proc.resume`, `proc.priority`, `proc.affinity`, `proc.hash`, `port.kill`, `service`, `docker`, `wsl` |
| `POST /api/jobs` | `{"tool":"scan","params":{"target":"192.168.1.0/24","ports":"top"}}` |
| `GET /api/diagnostics` | versions and collector health for bug reports |
| `GET /api/siem/overview?range=7d` · `/facets?module=auth` · `/events?q=level>=10&before=` · `/ips` · `/ip?ip=` · `/sessions` · `/sca` · `/fim` · `/rules` · `/export?format=csv` | SIEM data (`range`: `24h`, `7d`, `30d`, `90d`, `365d`) |
| `POST /api/siem/block` · `/unblock` · `/session` · `/sca/run` · `/fim/scan`, `PUT /api/siem/settings` | SIEM actions |

Mutating calls need the header `x-rigwatch: 1` (plus the token cookie or `x-rigwatch-token` from other machines).

## How it works

```
server.js            bootstrap: Node version check, UAC elevation on Windows, then lib/server.js
lib/server.js        HTTP, auth, SSE, API routes
lib/engine.js        builds one snapshot per interval from every collector
lib/platform/        win.js (+ ps/*.ps1), linux.js, darwin.js: same contract (see platform/index.js)
lib/tools.js         pinned, hash-verified helper downloads   lib/elevate.js   UAC relaunch + console mirroring
lib/security.js      exposure audit        lib/timeline.js   change detection + audit log
lib/alerts.js        rules + webhooks      lib/history.js    1 s / 10 s / 1 min / 1 h tiers on disk
lib/siem/            rules.js (levels, MITRE, compliance, correlation), store.js (daily JSON, gzip, retention),
                     collect.js (event logs, firewall log, journald), ips.js, blocks.js, sessions.js, sca.js, fim.js
lib/nettools.js      Net Lab               lib/toolbox.js    Toolbox
lib/docker.js        Docker Engine API     lib/dev.js        health checks, projects, toolchain
public/              the UI: vanilla JS, canvas charts, no CDN, works offline
scripts/build.js     bundles everything into dist/rigwatch.js
```

On Windows, long-lived PowerShell processes stream perf counters, WMI data and LibreHardwareMonitor sensors as tab-separated lines; another is started on demand for actions and Toolbox queries. Linux reads `/proc` and `/sys`; macOS uses built-in command-line tools. Typical cost on a 16-thread desktop: about 1% CPU and 400–500 MB of RAM (mostly the PowerShell hosts and the sensor library).

## Contributing

```bash
npm test          # parser + SIEM unit tests (Linux/macOS fixtures run on any OS)
npm run build     # rebuild dist/rigwatch.js
node server.js --no-elevate   # quick local run without the UAC prompt
```

No dependencies, no transpiler. Bug reports with **Copy diagnostics** output are gold.

## Credits

RigWatch downloads, but does not redistribute, [LibreHardwareMonitor](https://github.com/LibreHardwareMonitor/LibreHardwareMonitor), [Intel PresentMon](https://github.com/GameTechDev/PresentMon) and [PawnIO](https://github.com/namazso/PawnIO.Setup). Each is under its own license; see their repositories.

## License

MIT
