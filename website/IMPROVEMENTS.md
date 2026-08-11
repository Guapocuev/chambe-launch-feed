# Chambé Website — Conversion Improvement Log

Persistent record of ROI-driven changes. **Never remove entries** — mark superseded
items as `[superseded]` and link to the replacement instead of deleting history.

**Audit date:** 2026-08-11  
**Source:** Conversion ROI analysis (trust, funnel, mobile, SEO, perf, analytics, proof, form UX, landing pages, a11y)

---

## Status key

| Status | Meaning |
|--------|---------|
| `pending` | Not started |
| `in-progress` | Currently being built |
| `done` | Shipped — see Completed log below |
| `partial` | Part shipped — see Completed log for scope |
| `blocked` | Waiting on content, API, or business decision |
| `deferred` | Intentionally postponed — reason noted |

---

## The 10 items (priority order)

| # | Item | Status | Can batch with | Blocked by |
|---|------|--------|----------------|------------|
| 1 | Trust & social proof | `pending` | 8, 10 | Real reviews/credentials content |
| 2 | Intake funnel optimization | `partial` | 3, 8, 10 | Photo upload + Google Places (see deferred log) |
| 3 | Mobile sticky CTA | `done` | 2, 8, 10 | — |
| 4 | Local SEO infrastructure | `done` | 5, 6, 9 | — |
| 5 | Core Web Vitals / performance | `partial` | 4, 6 | `next/image` when gallery photos exist |
| 6 | Analytics & event instrumentation | `done` | 4, 5 | Set env vars to activate |
| 7 | Proof-of-work content | `pending` | 1 | Real project photos + lat/lng data |
| 8 | Form trust microcopy & post-submit UX | `done` | 1, 2, 3, 10 | — |
| 9 | Trade & location landing pages | `pending` | 4 | Copy/SEO keyword decisions |
| 10 | Accessibility, input UX & emergency path | `partial` | 2, 8 | Google Places API key (autocomplete) |

---

## Batching guide — what can run at the same time

### Batch A — Pure frontend, no external deps (3–4 items)
Safe to ship together in one PR/session:
- **#3** Mobile sticky CTA
- **#8** Form trust microcopy & post-submit UX
- **#10** Partial: phone formatting, inline validation, click-to-call (no API key)
- **#5** Partial: `next/image`, font tuning, lazy-load map

### Batch B — SEO & instrumentation (3 items)
Mostly config + metadata, no design conflict:
- **#4** Local SEO (OG tags, sitemap, robots, JSON-LD)
- **#6** Analytics events (needs `NEXT_PUBLIC_*` env var from you)
- **#5** Remaining perf passes

### Batch C — Funnel rebuild (2–3 items, one cohesive PR)
Same files (`QuoteForm`, `/get-a-quote`) — best done together:
- **#2** Multi-step form, progress bar, photo upload UI
- **#8** Trust copy (if not done in Batch A)
- **#10** Address autocomplete (needs API key)

### Batch D — Content-dependent (blocked until you provide assets)
Cannot fully complete without business input:
- **#1** Trust layer (reviews, badges, job counts)
- **#7** Gallery/map real projects
- **#9** Landing page copy per trade + neighbourhood

### Recommended parallel capacity
| Scenario | Items at once | Notes |
|----------|---------------|-------|
| **Conservative** | 2–3 | One batch, clean review |
| **Aggressive (no blockers)** | 4–5 | Batch A + B in parallel workstreams |
| **Maximum practical** | 6–7 | A + B + partial C; quality risk rises |
| **All 10** | ❌ Not at once | #1, #7, #9 need content; #6/#10 need keys |

---

## Completed improvements

### 2026-08-11 — #2 Intake funnel optimization (partial — Batch C)
**Status:** partial  
**Batch:** C  
**Files changed:** `components/FormStepProgress.tsx`, `app/get-a-quote/QuoteForm.tsx`, `app/page.tsx`, `app/how-it-works/page.tsx`  
**What changed:** Quote form rebuilt as 4-step wizard (Job → Location → Contact → Review) with progress bar, per-step validation, back/continue navigation, and review summary before submit. Same Demand Engine payload — no backend changes. Removed "add photos" copy from homepage/how-it-works until photo upload is wired.  
**Why (ROI):** Shorter perceived form length reduces abandonment; step validation catches errors earlier.  
**Metrics to watch:** `form_start` → `form_submit` rate, drop-off by step (once step events added).  
**Follow-ups:** Photo upload (needs Demand Engine endpoint). Address autocomplete (needs Google Places API key). Optional: `form_step` analytics events.

### 2026-08-11 — #6 Analytics & event instrumentation (Batch B)
**Status:** done  
**Batch:** B  
**Files changed:** `lib/analytics.ts`, `lib/site.ts`, `components/Analytics.tsx`, `hooks/useFormAnalytics.ts`, `components/Nav.tsx`, `components/MobileStickyCta.tsx`, `app/get-a-quote/QuoteForm.tsx`, `app/apply/ApplyForm.tsx`, `.env.example`  
**What changed:** GA4 and Plausible support via env vars (`NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`). Tracks `cta_click`, `phone_click`, `form_start`, and `form_submit` (success/error/pending). Dev console debug logging when `NODE_ENV=development`. SPA page-view updates on route change for GA4.  
**Why (ROI):** Enables measuring every Batch A/B improvement and prioritizing Batch C/D by real funnel data.  
**Metrics to watch:** `form_start` → `form_submit` conversion rate, CTA click rate by location, phone clicks on mobile.  
**Follow-ups:** Add env vars in production. Consider Meta Pixel if running paid ads.

### 2026-08-11 — #4 Local SEO infrastructure (Batch B)
**Status:** done  
**Batch:** B  
**Files changed:** `lib/metadata.ts`, `lib/site.ts`, `app/layout.tsx`, `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx`, `components/JsonLd.tsx`, all page `metadata` exports  
**What changed:** `metadataBase`, Open Graph, Twitter cards, keywords, per-page canonical URLs via `pageMetadata()`. Auto-generated `/sitemap.xml` and `/robots.txt`. Dynamic OG image (1200×630, black/yellow brand). JSON-LD `HomeAndConstructionBusiness` schema with Toronto/GTA service area. `lang="en-CA"`.  
**Why (ROI):** Organic local search is zero-CAC acquisition; proper metadata/schema improves click-through from search and social shares.  
**Metrics to watch:** Google Search Console impressions/clicks (once verified), social link preview quality.  
**Follow-ups:** Trade/location landing pages (#9) will extend sitemap. Verify site in Google Search Console.

### 2026-08-11 — #5 Core Web Vitals (partial — Batch B)
**Status:** partial  
**Batch:** B  
**Files changed:** `app/layout.tsx`  
**What changed:** `dns-prefetch` for Carto map tiles and Google Tag Manager (when analytics enabled). Completes Batch A perf work alongside SEO head tags.  
**Why (ROI):** Reduces DNS lookup latency for third-party resources loaded on interaction or after paint.  
**Metrics to watch:** LCP, TBT in Lighthouse/PageSpeed.  
**Follow-ups:** `next/image` for gallery photos when #7 content lands.

### 2026-08-11 — #5 Core Web Vitals (partial — Batch A)
**Status:** partial  
**Batch:** A  
**Files changed:** `app/layout.tsx`, `components/MapTeaser.tsx`, `components/FormFields.tsx`  
**What changed:** Geist fonts now use `display: swap` to prevent invisible text during load. Homepage map (`MapTeaser`) defers Leaflet until the section scrolls into view via `LazyWhenVisible` + `IntersectionObserver`, avoiding map tile fetches on initial page load.  
**Why (ROI):** Faster LCP and less main-thread work on mobile — speed correlates directly with bounce rate and conversion on local-service sites.  
**Metrics to watch:** LCP, TBT, homepage bounce rate (once analytics live).  
**Follow-ups:** Adopt `next/image` for gallery photos when #7 content lands.

### 2026-08-11 — #10 Accessibility & input UX (partial — Batch A)
**Status:** partial  
**Batch:** A  
**Files changed:** `lib/phone.ts`, `lib/site.ts`, `components/FormFields.tsx`, `app/get-a-quote/QuoteForm.tsx`, `app/apply/ApplyForm.tsx`, `components/Nav.tsx`, `components/MobileStickyCta.tsx`, `app/contact/page.tsx`, `.env.example`  
**What changed:** Canadian phone auto-formatting `(XXX) XXX-XXXX` on quote and apply forms. Inline blur validation for name, phone, and email with accessible error messages (`aria-invalid`, `role="alert"`). Click-to-call wired in nav, mobile sticky bar, and contact page — enabled by `NEXT_PUBLIC_CONTACT_PHONE` env var. Emergency fallback CTA on contact page when no phone is configured.  
**Why (ROI):** Form errors and bad phone input are a top abandonment cause; click-to-call captures urgent high-value jobs on mobile.  
**Metrics to watch:** Form error rate, mobile call clicks, emergency form submissions.  
**Follow-ups:** Address autocomplete (needs Google Places API key) — defer to Batch C.

### 2026-08-11 — #8 Form trust microcopy & post-submit UX (Batch A)
**Status:** done  
**Batch:** A  
**Files changed:** `components/FormTrustNote.tsx`, `components/PostSubmitTimeline.tsx`, `app/get-a-quote/QuoteForm.tsx`, `app/apply/ApplyForm.tsx`  
**What changed:** Trust guarantee block above submit on both forms (privacy, vetting, response time). Privacy-policy consent line below submit. Post-submit timeline on quote form (success + pending states) and apply form (success) showing exactly what happens next in 3 steps.  
**Why (ROI):** Trust microcopy near the submit button and clear post-submit expectations reduce last-step abandonment and no-shows.  
**Metrics to watch:** Form completion rate, contractor callback rate after submit.  
**Follow-ups:** None for Batch A scope.

### 2026-08-11 — #3 Mobile sticky CTA (Batch A)
**Status:** done  
**Batch:** A  
**Files changed:** `components/MobileStickyCta.tsx`, `app/layout.tsx`  
**What changed:** Fixed bottom bar on mobile with primary "Get a Free Estimate" button always visible while scrolling. Optional "Call" button when phone is configured. Hidden on `/get-a-quote` and `/apply` to avoid redundancy. Main content gets `pb-24` on mobile so the bar doesn't cover content.  
**Why (ROI):** Mobile is 60–70%+ of local service traffic; persistent CTA removes friction for mid-scroll converters.  
**Metrics to watch:** Mobile CTA click-through rate, mobile form starts vs desktop.  
**Follow-ups:** None for Batch A scope.

<!--

### YYYY-MM-DD — #N Title
**Status:** done
**Batch:** A | B | C | D
**Files changed:** `path/a`, `path/b`
**What changed:** One paragraph.
**Why (ROI):** Which conversion lever this targets.
**Metrics to watch:** Events or KPIs once analytics is live.
**Follow-ups:** Anything left for a later pass.

-->

---

## Deferred / blocked log

### 2026-08-11 — #2 Photo upload
**Reason blocked/deferred:** Demand Engine `POST /webhooks/tally-intake` accepts JSON text fields only — no photo storage endpoint exists yet.  
**Unblock when:** Demand Engine adds job photo upload/storage, or you specify where photos should go (S3, Supabase, etc.).

### 2026-08-11 — #10 Address autocomplete
**Reason blocked/deferred:** Requires Google Places API key.  
**Unblock when:** Set `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` in `.env.local`.

### 2026-08-11 — #1 Trust & social proof
**Reason blocked/deferred:** Needs real reviews, credentials, job counts from you.  
**Unblock when:** You provide review text, contractor badges, or stats.

### 2026-08-11 — #7 Proof-of-work content
**Reason blocked/deferred:** Needs real project photos + lat/lng.  
**Unblock when:** You add entries to `lib/gallery-data.ts`.

### 2026-08-11 — #9 Trade & location landing pages
**Reason blocked/deferred:** Needs copy/SEO keyword decisions per trade and neighbourhood.  
**Unblock when:** You confirm target trades and neighbourhoods to prioritize.

### 2026-08-11 — #6 Analytics activation
**Reason blocked/deferred:** Env vars not set in production.  
**Unblock when:** Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` and/or `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`.

<!--

### YYYY-MM-DD — #N Title
**Reason blocked/deferred:**
**Unblock when:**

-->

_None yet._
