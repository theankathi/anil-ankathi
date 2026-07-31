---
description: Serve the calculator locally on http://localhost:8000
---

Start a local static web server in the project root so the calculator can be
opened at http://localhost:8000, then tell the user the URL.

Prefer, in order of availability:
- `python -m http.server 8000`
- `npx --yes serve -l 8000`

Run it in the background and report the URL. Do not block the session.
