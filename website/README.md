# Chambé Website

Marketing site for Chambé (Toronto/GTA contractor marketplace), rebuilt in code from the
original Webflow site. Next.js 16 (App Router) + TypeScript + Tailwind CSS 4.

## What's here

- Marketing pages: `/`, `/how-it-works`, `/about`, `/contact`, `/gallery`
- `/get-a-quote` — client job intake form. Replaces the old Tally form; submits to the
  Demand Engine's `POST /webhooks/tally-intake` (see `app/get-a-quote/actions.ts`) with the
  exact field names `demand-engine/src/services/tally-normalize.service.ts` expects.
- `/apply` — contractor application form (new — didn't exist before this). Submits to the
  Demand Engine's `POST /contractors/apply` (see `app/apply/actions.ts`), added on the
  Chambe-mvp `contractor-application-endpoint` branch.
- `/privacy`, `/terms` — real routes and structure, **placeholder copy**. No source legal
  text was available when these were built; see the draft banner on each page.

Both forms are wired via Next.js Server Actions, not client-side `fetch` — the Demand
Engine URL is only ever read server-side, so it can point at a Docker-internal hostname
(`http://demand-engine:3000`) that a browser could never reach directly.

## Local development

```bash
npm install
cp .env.example .env.local   # set DEMAND_ENGINE_URL to wherever your demand-engine is running
npm run dev
```

Requires a running Demand Engine (see `Chambe-mvp/demand-engine`) for the two forms to
actually submit anywhere — everything else renders fine without it.

## Running the full stack

See `../../docker-compose.yml` (one level above `chambe-launch-feed/`, alongside
`Chambe-mvp/`) — it runs this site plus the Demand Engine, Quote Engine, and a local
Postgres+PostGIS together. From that directory:

```bash
cp .env.example .env
docker compose up -d --build
docker compose run --rm migrate   # first run only
```

Site: http://localhost:3001

## Content notes

- **Gallery** (`lib/gallery-data.ts`): ships with an empty project array — no real project
  photos exist yet, so `GalleryGrid` renders a designed empty state instead of fake
  placeholder projects. Add real entries to that array once photos exist; nothing else
  needs to change.
- **Privacy/Terms**: structural placeholders only. Do not treat as real policy — see the
  draft banner on each page.
