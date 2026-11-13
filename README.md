# RigWatch

**Your whole PC on one page.** CPU, GPU, temperatures, fans, FPS, every process, every port and connection, a security audit, a network lab, Docker, your dev servers and a toolbox of Windows power tools, live in your browser.

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
git clone https://github.com/<you>/rigwatch.git
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
| **Performance** | Every metric over 15 min / 1 h / 6 h / 24 h / 7 days (history survives restarts), CSV export |
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
| `--open` | | open the browser on start |

```powershell
$env:HOST="0.0.0.0"; node server.js          # PowerShell
```

## Security and privacy

- Listens on `127.0.0.1` only by default. With `HOST=0.0.0.0` other devices get a **read-only** view; control needs the token link printed at startup.
- `Host` header checks block DNS rebinding; every action needs a custom header and same-origin request (CSRF protection); strict Content-Security-Policy.
- Kill / suspend / priority refuse core OS processes, RigWatch itself and the terminal running it. Every action lands in the timeline.
- Secrets in command lines (`--token=…`, `password=…`, `user:pass@`) are masked; Docker environment values and secret-looking environment variables are never shown.
- Network traffic happens only for: the helper downloads (GitHub), the latency probe (`PING_TARGET`), and tools you run yourself (public IP via ipify, DNS benchmark, your webhooks).
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
| Anything else | System → Collectors → **Copy diagnostics**, then open an issue and paste it |

## Uninstall

1. Stop RigWatch (Ctrl+C) and delete its folder.
2. Delete `%USERPROFILE%\.rigwatch` (settings, history, timeline).
3. If you enabled CPU sensors: Settings → Apps → uninstall **PawnIO**.

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

Mutating calls need the header `x-rigwatch: 1` (plus the token cookie or `x-rigwatch-token` from other machines).

## How it works

```
server.js            bootstrap: Node version check, UAC elevation on Windows, then lib/server.js
lib/server.js        HTTP, auth, SSE, API routes
lib/engine.js        builds one snapshot per interval from every collector
lib/platform/        win.js (+ ps/*.ps1), linux.js, darwin.js: same contract (see platform/index.js)
lib/tools.js         pinned, hash-verified helper downloads   lib/elevate.js   UAC relaunch + console mirroring
lib/security.js      exposure audit        lib/timeline.js   change detection + audit log
lib/alerts.js        rules + webhooks      lib/history.js    1 s / 10 s / 1 min tiers on disk
lib/nettools.js      Net Lab               lib/toolbox.js    Toolbox
lib/docker.js        Docker Engine API     lib/dev.js        health checks, projects, toolchain
public/              the UI: vanilla JS, canvas charts, no CDN, works offline
scripts/build.js     bundles everything into dist/rigwatch.js
```

On Windows, long-lived PowerShell processes stream perf counters, WMI data and LibreHardwareMonitor sensors as tab-separated lines; another is started on demand for actions and Toolbox queries. Linux reads `/proc` and `/sys`; macOS uses built-in command-line tools. Typical cost on a 16-thread desktop: about 1% CPU and 400–500 MB of RAM (mostly the PowerShell hosts and the sensor library).

## Contributing

```bash
npm test          # parser unit tests (Linux/macOS fixtures run on any OS)
npm run build     # rebuild dist/rigwatch.js
node server.js --no-elevate   # quick local run without the UAC prompt
```

No dependencies, no transpiler. Bug reports with **Copy diagnostics** output are gold.

## Credits

RigWatch downloads, but does not redistribute, [LibreHardwareMonitor](https://github.com/LibreHardwareMonitor/LibreHardwareMonitor), [Intel PresentMon](https://github.com/GameTechDev/PresentMon) and [PawnIO](https://github.com/namazso/PawnIO.Setup). Each is under its own license; see their repositories.

## License

MIT
