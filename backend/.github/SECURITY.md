# Security Policy for Aurix Web API

## Supported Versions

Only the active main release versions receive security patches and updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

---

## Reporting a Vulnerability

The security and privacy of our software solutions are paramount. If you discover a vulnerability or security risk:

1. **Do NOT disclose vulnerabilities publicly** via GitHub Issues or discussions.
2. Email full vulnerability details privately to **`security@aurix.com`** or **`support@blogtec.in`**.
3. Include reproduction steps, affected endpoints, and impact assessment.

### Response Timeline
- **Initial Response:** Within 48 hours of report receipt.
- **Triage & Assessment:** Within 5 business days.
- **Fix & Patch Deployment:** Patched promptly based on severity.

---

## Security Practices in this Repository

- **Input Validation:** Strict validation across all REST controller endpoints.
- **Dependency Audits:** Automated Dependabot vulnerability tracking for Maven packages.
- **Least Privilege Access:** Role-based access controls and token validation on sensitive operations.
