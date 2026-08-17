# Audit: `returning-client-lookup` branch

**Audited:** 2026-08-17
**Branch:** `origin/returning-client-lookup` (6 commits, merge-base `6e60262` — the `website-rebuild` merge point, before `endpoint-hardening` landed)
**Scope:** All 58 changed files + `website/IMPROVEMENTS.md`, read in full or in substantive part; SEO boilerplate (`sitemap.ts`, `robots.ts`, `JsonLd.tsx`) and brand assets (`Logo.tsx`, `opengraph-image.tsx`, `brand-board.png`) were spot-checked rather than read line-by-line — nothing in them changes any finding below.
**Action taken:** None. Investigation only, per instruction. The branch is untouched.

## Provenance — read this first

Every commit on this branch is authored by `Tlaloc Cuevas Windhager <guaposmac@Tlalocs-MacBook-Air.local>`, several with `Co-authored-by: Cursor <cursoragent@cursor.com>`. This is not a mystery branch or an abandoned effort — it's your own parallel work, done with Cursor, independent of this Claude Code session. That fully explains everything below: it has no knowledge of `endpoint-hardening`'s auth requirement, `quote-signup-choice`'s consent design, or anything else built in this session, because it was never in a position to know about them.

The branch name undersells its own scope badly. Its first commit (`b7c15d7`, 2026-08-11) adds a 10-item "conversion improvement" program with its own persistent log (`IMPROVEMENTS.md`) — trust/social proof, funnel rebuild, SEO, analytics, performance, form UX, accessibility. The actual "returning-client lookup" work (the thing the branch is named for) is a *later*, smaller commit (`f364227`, 2026-08-15) added on top, and — this is the first major finding — **`IMPROVEMENTS.md`'s own log never mentions it.** The log covers everything through the 2026-08-11 batches in detail and then goes quiet; the returning-client lookup, the geolocation feature, the trust-strip copy, and the applicant-followup copy (all dated 2026-08-15/16) exist in the code but were never logged, despite the file's own header instruction: "**Never remove entries**."

---

## 1. What this branch actually contains

### Funnel rebuild (`QuoteForm.tsx`, full rewrite, 502 lines)
The single-page quote form becomes a 4-step wizard — **Job → Location → Contact → Review** — with a progress bar (`FormStepProgress.tsx`), per-step validation before advancing, a back button, and a review/summary step before final submit. Same `POST /webhooks/tally-intake` payload shape as before; no backend changes needed for this part. Genuinely well-built: accessible (`aria-invalid`, `aria-describedby`, `role="alert"` on errors), sensible validation (`lib/phone.ts`'s `isValidName`/`isValidPhone`/`isValidEmail`), and it reuses a new shared `FormFields.tsx` (`PhoneField`, `ValidatedTextField`, `FormErrorBanner`) between the quote and apply forms rather than duplicating markup.

**Location step also adds browser geolocation** (`lib/reverse-geocode.ts`): on load, asks for the browser's location, reverse-geocodes it via the same free Nominatim service Chambe-mvp's demand-engine already uses (no new vendor), and pre-fills a *suggested, freely editable* address. Declining is a first-class, non-broken path ("No problem — we don't need location access. Type the job address below."). This is a well-handled, low-risk implementation of a feature that does need a real permission prompt — worth knowing it's there, not worth being alarmed about.

### Trust & social proof
- Homepage trust strip (`app/page.tsx`): three claims — "Vetted Toronto contractors... Background-checked and insured. No unlicensed stand-ins," "AI-priced in minutes," "Local, not a national marketplace." See Section 2 — the first of these is not backed by anything in the codebase.
- `FormTrustNote.tsx`: a short guarantee block shown above the submit button on **both** forms, repeating "Every contractor is background-checked, licensed, and insured" (homeowner variant) and "We only onboard licensed, insured trades" (contractor variant), plus soft SLA language ("Typical contractor response: within one hour during business hours").
- `PostSubmitTimeline.tsx`: a 3-step "what happens next" list shown after either form succeeds, with the same "within the hour" / "within one business day" language.

### SEO infrastructure
`lib/metadata.ts`, `lib/site.ts`, `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx` (dynamic 1200×630 OG image), `components/JsonLd.tsx` (`HomeAndConstructionBusiness` schema.org markup with Toronto/GTA `areaServed`), per-page `metadata` exports, `lang="en-CA"`. Standard, correctly-implemented Next.js App Router SEO boilerplate — nothing notable, nothing wrong.

### Analytics & event instrumentation
`lib/analytics.ts` (`trackEvent`), `components/Analytics.tsx` (loads GA4's `gtag.js` and/or Plausible's script, gated on `NEXT_PUBLIC_GA_MEASUREMENT_ID` / `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` — both unset by default, so this ships inert), `hooks/useFormAnalytics.ts`. Tracks four events: `cta_click` (location, label, href), `phone_click` (location), `form_start` (which form), `form_submit` (which form, success/error/pending). See Section 4 for what this means for the Privacy Policy.

### Accessibility & input UX
`lib/phone.ts` (Canadian phone auto-formatting + validators), inline blur validation with accessible error states across both forms, click-to-call wired into `Nav.tsx`/`MobileStickyCta.tsx`/the contact page (enabled by `NEXT_PUBLIC_CONTACT_PHONE`, unset by default).

### Returning-client lookup (the branch's namesake)
`lib/returning-client.ts` (`lookupReturningClient`) and `app/get-a-quote/lookupClient.ts` (a thin `'use server'` wrapper) — added in one isolated commit, `website/README.md` note only. **This is the second major finding: nothing in the application calls either function.** `QuoteForm.tsx` — rewritten in an earlier commit, never touched by this one — has no phone-first step, no lookup call, no pre-fill, no consent question. The lookup exists, compiles, and is completely unreachable from the UI. As it sits on this branch, it's dead code.

### New dependency
`leaflet` + `@types/leaflet` (`^1.9.4` / `^1.9.22`), used by `ProjectMap.tsx` (interactive gallery/homepage map) and `MapTeaser.tsx` (homepage map preview, lazy-loaded on scroll-into-view via `IntersectionObserver` to avoid loading map tiles on initial page load). `lib/gallery-data.ts`'s `GalleryProject` type gains `lat`/`lng`/`neighborhood`/`completedAt` fields for map pins — additive, still ships with an empty `galleryProjects` array, no fake data.

### Repo hygiene
Root `README.md` rewritten from raw JSON-with-a-.md-extension (a pre-existing oddity — the file's actual content was a JSON task list, not prose) into real Markdown explaining the repo's dual purpose (task feed + website host), with the JSON example properly fenced. This is a genuine, worthwhile fix, unrelated to everything else on the branch. `.gitignore` gains two local-tooling entries (`.node/`, `website/.node-portable/`) — trivial.

---

## 2. Concrete bugs

### Bug 1 — the returning-client lookup sends no auth header, and would 401 against the current backend
`lib/returning-client.ts`'s `fetch` call to `POST /clients/lookup`:
```ts
headers: { 'Content-Type': 'application/json' },
```
No `X-Api-Key`. `/clients/lookup` (merged to Chambe-mvp `main` as part of `returning-client-lookup-v2`) fails closed — 503 if the server has no key configured, 401 if the caller sends none or the wrong one. Called as-is, this always fails. Moot in practice only because nothing calls it (see Bug 3).

### Bug 2 — merging this branch naively would *remove* working auth from the two already-protected routes, not just fail to add it to the new one
This is more serious than Bug 1. Diffed against current `main`:
- `website/lib/config.ts` — the branch's version has no `DEMAND_ENGINE_API_KEY` export at all.
- `website/app/apply/actions.ts` and `website/app/get-a-quote/actions.ts` — both send `headers: { 'Content-Type': 'application/json' }` only; no `X-Api-Key`.
- `website/.env.example` — no `DEMAND_ENGINE_API_KEY` documentation; that whole block is replaced by unrelated new vars (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONTACT_PHONE`, GA/Plausible keys).

None of this is active removal — the branch was cut before `endpoint-hardening` existed, so it simply never had any of it. But a merge that takes "this branch's version" for these three files (exactly the three the actual GitHub PR reports conflicts on) would delete real, working, already-merged auth code. Both the quote form and the apply form would start failing every submission with 401/503 the moment `main`'s protected routes see a request with no key.

### Bug 3 — the returning-client lookup is unreachable (already covered under §1, restated as a bug for completeness)
Not wired into `QuoteForm.tsx` or anywhere else. Zero user-facing effect today, in either direction — but also zero user-facing benefit. The feature this branch is named for does not function.

### Not a bug, but worth flagging: `IMPROVEMENTS.md` is stale
Its own stated rule ("Never remove entries... mark superseded items instead") has been violated by omission — four commits' worth of shipped work (returning-client lookup, geolocation, trust strip, applicant-followup copy) were never logged. If this file is meant to be the source of truth for what's shipped, it currently understates reality.

---

## 3. Where this conflicts or competes with `quote-signup-choice` / current `main`

**Textual conflicts** (what the GitHub PR reports): `website/.env.example`, `website/app/apply/actions.ts`, `website/app/get-a-quote/actions.ts` — all three are exactly the auth-header removal described in Bug 2.

**A conflict the PR *won't* report, because it's not textual — it's two different products:** `quote-signup-choice` (already merged to `main`) and this branch both modify `get-a-quote/actions.ts` and `QuoteForm.tsx` to handle a phone number early, but they implement genuinely different, mutually exclusive UX:

| | `quote-signup-choice` (on `main`) | `returning-client-lookup` |
|---|---|---|
| Form structure | 2 steps: phone (+ optional consent question) → details | 4 steps: Job → Location → Contact → Review |
| Phone collected | Step 1, first field, before anything else | Step 3 ("Contact"), after job description and address |
| Returning-client lookup | Wired in — calls `/clients/lookup` on phone entry, pre-fills, skips/pre-sets consent | Built (`lib/returning-client.ts`) but never called from the UI |
| Consent to be remembered | Explicit "Save my info so next time you only need photos and an address?" Yes/No, skipped only for a confirmed returning match | No consent mechanism exists at all — `rememberClient` field doesn't exist on this branch |
| `rememberClient` in payload | Sent as a real boolean, gates whether Chambe-mvp writes to `returning_clients` | Not present — if this branch's `QuoteForm.tsx`/`actions.ts` were merged over `main`'s, the field would disappear from the payload, and (per Chambe-mvp's `quote-signup-choice` change) **every submission would silently stop being remembered, including from people who'd consented before**, since the field defaults to `false` when absent |

These can't both survive by "keeping both sides" — a merge tool resolves text, not product decisions. If `returning-client-lookup`'s `QuoteForm.tsx`/`actions.ts` win, `quote-signup-choice`'s entire consent flow and its Chambe-mvp counterpart (`rememberClient` gating in `webhook.routes.ts`) become dead code on the frontend even though they're live and tested on the backend. If `quote-signup-choice`'s files win, the 4-step funnel rebuild, the geolocation suggestion, and the review step are all lost.

**Everything else on this branch is additive and doesn't compete with anything on `main`** — the trust strip, SEO files, analytics, `FormFields.tsx`/`FormStepProgress.tsx`/`FormTrustNote.tsx`/`PostSubmitTimeline.tsx` (all new files, no name collisions), the leaflet map, `gallery-data.ts`'s extended type (still additive), the root `README.md` fix.

---

## 4. Analytics/tracking vs. the Privacy Policy

**What's actually collected**, per every `trackEvent` call site (`hooks/useFormAnalytics.ts`, `components/Nav.tsx`, `components/MobileStickyCta.tsx`): `cta_click` (location, label, href), `phone_click` (location), `form_start` (which form), `form_submit` (which form, success/error/pending). No name, phone, email, or address is ever passed as an event parameter — this is behavioral/funnel tracking, not PII collection through the analytics pipe. It's also **inert by default**: `Analytics.tsx` renders nothing unless `NEXT_PUBLIC_GA_MEASUREMENT_ID` or `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is actually set, and neither is set anywhere in this branch's `.env.example` (both ship commented out).

**What the current Privacy Policy (`main`, real text) discloses:** "Usage information such as pages visited and general device/browser information, collected automatically" (Information We Collect) — a generic catch-all. The "How We Share Information" section names specific third-party categories: "SMS delivery, cloud hosting and database storage, and AI-based estimate generation." **It does not name analytics, measurement, or advertising partners as a category, and doesn't mention Google Analytics or Plausible by name.**

**The gap:** if `NEXT_PUBLIC_GA_MEASUREMENT_ID` is ever set in production, GA4's `gtag.js` loads and typically sets its own cookies/identifiers on visitors' browsers, and event data is sent to Google — a real third party the current policy doesn't enumerate as a recipient of any data. Plausible is lower-risk (commonly run cookie-less), but same gap in disclosure either way. This isn't a problem *today* — the code ships with analytics off — but the moment either env var is set in production, the Privacy Policy needs an update first, not after. Flagging this now so it doesn't get missed later when someone flips the switch without remembering this branch's history.

---

## 5. Recommendation — salvage vs. discard

**Take, with minor rework:**
- Root `README.md` fix (the JSON-content-in-a-.md-file cleanup) — clean, independent, zero risk. Cherry-pick directly.
- SEO infrastructure (`lib/metadata.ts`, `sitemap.ts`, `robots.ts`, `JsonLd.tsx`, `opengraph-image.tsx`) — standard, correct, doesn't touch anything contested. Safe to bring over as-is.
- Analytics (`lib/analytics.ts`, `Analytics.tsx`, `useFormAnalytics.ts`) — well-built, privacy-light, opt-in. Bring over, but treat "update the Privacy Policy before setting the env vars" as a hard prerequisite, not a someday-follow-up.
- `FormFields.tsx`'s accessible input components, phone formatting/validation (`lib/phone.ts`), click-to-call — genuinely good, reusable UX improvements with no product-decision conflicts. Worth adopting into `quote-signup-choice`'s existing 2-step structure rather than discarding for the sake of avoiding the 4-step wizard.
- The leaflet-based map components, once there's real gallery data to show on them — no rush, but no reason to discard the groundwork.

**Needs a real decision from you, not a merge tool:** the funnel structure itself (4-step wizard vs. `quote-signup-choice`'s phone-first 2-step) and, tied to it, whether `returning-client-lookup`'s never-wired lookup code gets finished (adding the missing auth header, and building the phone-first pre-fill into whichever form structure wins) or discarded in favor of what's already live on `main`. My read: `quote-signup-choice` is already shipped, tested end-to-end against a real backend, and its consent design is a considered answer to a real question ("should we skip asking for people who already opted in") that this branch never actually answers, since its lookup was never wired up to ask. Rebuilding the 4-step wizard's genuinely good pieces (progress bar, review step, geolocation) *on top of* `quote-signup-choice`'s phone-first structure seems more promising than the reverse.

**Discard outright:** nothing, really — even the trust-strip and trust-note copy is worth keeping once the licensing/insurance claim (below) is either substantiated or softened. There's no throwaway work here; the risk is entirely in the auth regression and the competing funnel design, both fixable.

**One thing to fix in the copy regardless of which funnel design wins:** "Background-checked, licensed, and insured" and "We only onboard licensed, insured trades" appear on the homepage trust strip *and* on both forms' trust notes — a repeated, specific, factual-sounding claim. Nothing in `contractors` or `contractor_applications` (Chambe-mvp schema) tracks background checks, license numbers, or insurance status — there's no field, no verification workflow, no document upload. This may well be operationally true today for the locked 4-person V1 team, but the code has no way to keep it true as the roster grows, and nothing enforces it. Worth softening to something the system can actually back up, or building the verification tracking to match the claim, before this ships to real visitors.
