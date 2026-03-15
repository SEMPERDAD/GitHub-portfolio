# Lessons Learned

This file captures corrections, surprises, and non-obvious decisions made
during the project. Each entry should reference the task or file it applies to.

## Format

**Date**: YYYY-MM-DD
**Context**: What were you doing?
**Problem**: What went wrong or was unexpected?
**Fix**: What did you change?
**Takeaway**: What rule or pattern does this establish?

---

## 2026-03-15

**Context**: Initial project setup
**Problem**: GitHub Pages serves from a subdirectory path (`/GitHub-portfolio/`) for non-root repos
**Fix**: Use relative paths (`./style.css`, `./assets/favicon.svg`) everywhere — never absolute paths starting with `/`
**Takeaway**: Always use relative asset paths for GitHub Pages project sites (non-username repos)

---

<!-- Add entries below as they occur -->
