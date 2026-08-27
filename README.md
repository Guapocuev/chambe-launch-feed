# chambe-launch-feed

Public task feed for the Chambé June 1 launch, synced into Things 3. This repo also
hosts the Chambé marketing website in code.

## Launch task feed

[`feed.json`](feed.json) is the canonical task list — a JSON array of launch tasks with
owners, areas, due dates, and status. Automation (or a manual pull) reads this file to
keep Things 3 in sync with what the team is working on.

Each task looks like:

```json
{
  "id": "ceo-001",
  "title": "Finalize dual-lane PMF copy for launch materials",
  "owner": "CEO",
  "area": "CEO Critical Path",
  "lane": "Shared",
  "due_date": "2026-04-02",
  "status": "open",
  "blocked": false,
  "priority": "high",
  "source_url": "https://github.com/Guapocuev/Chambe-mvp"
}
```

Update `feed.json` when tasks change; the sync tooling picks up the new state on the
next run.

## Website

The Chambé marketing site lives in [`website/`](website/) — a Next.js 16 rebuild of
the original Webflow site. See [`website/README.md`](website/README.md) for routes,
form wiring, and local development instructions.

Quick start:

```bash
cd website
npm install
cp .env.example .env.local   # set DEMAND_ENGINE_URL if testing forms
npm run dev
```

Site runs at http://localhost:3000. Marketing pages render without a backend; the
`/get-a-quote` and `/apply` forms need a running Demand Engine
(`Chambe-mvp/demand-engine`) to submit.

**Conversion roadmap:** shipped improvements and pending work are tracked in
[`website/IMPROVEMENTS.md`](website/IMPROVEMENTS.md) — update that file as items
ship; never delete history.
