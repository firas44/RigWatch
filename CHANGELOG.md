# Changelog

## 2.1.0

**SIEM: a Wazuh-style security center for one machine.** New sidebar section with 11 modules in 4 categories.

- **Security center**: severity KPIs, alert level evolution, alerts by severity, module cards with trends, top rules / addresses / ATT&CK techniques, data-source health.
- **Threat hunting**: search language (`ip:` `user:` `rule:` `group:` `mitre:` `proc:` `level>=7`), field facets, histogram, expandable events with raw JSON, CSV / JSON export.
- **MITRE ATT&CK** matrix (22 techniques, 12 tactics), **regulatory compliance** views (PCI DSS, GDPR, NIST 800-53, HIPAA).
- **Authentication**: sign-ins vs failures, logon types, failure reasons, heat map, live sessions with disconnect / sign out, local accounts, SMB clients, "who was signed in when" timeline.
- **Network & IPs**: every remote address of the last year, inbound connections from the internet, port scans from the Windows Firewall drop log, optional threat feeds (FireHOL level 1, abuse.ch Feodo).
- **Active response**: block / unblock IPs and ranges with expiry (Windows Firewall, iptables), optional automatic blocking, trusted addresses.
- **Malware detection**, **integrity monitoring** (files + autostart registry keys), **configuration assessment** (26 CIS-inspired Windows checks with score and fixes), **system auditing**.
- 70 detection rules with levels 0–15, MITRE ATT&CK and compliance tags; correlation for brute force, success after failures, first logon from a new address and logons from the internet.
- Windows Security / System / Defender / Firewall / Remote Desktop / OpenSSH logs read incrementally; the first start loads the last 30 days. Linux: journald or auth.log.
- History: one JSON-lines file per day under `~/.rigwatch/siem/`, older days gzipped, 365-day retention (`RETENTION_DAYS`), 256 MB cap (`SIEM_MAX_MB`).
- Performance history now goes back 30 days, 90 days and 1 year.

## 2.0.0

First public release: dashboard, performance history, processes, sensors, FPS, network, security audit, Net Lab, dev servers and containers, services, Windows toolbox, alerts and webhooks, timeline, overlay, single-file build, double-click launcher.
