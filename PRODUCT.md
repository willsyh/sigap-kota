# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Citizen (primary):** reports public infrastructure and environmental problems (damaged roads, garbage accumulation, flooding, broken public facilities) from their location, validates existing reports by voting, and follows the handling status transparently.
- **Guest:** browses the map and report list without an account; is encouraged to log in when attempting protected actions (create report, vote).
- **Admin/Petugas:** manages all reports, updates the handling status through the three-step workflow, and sees overview/analytics of real report data.

## Product Purpose

SigapKota centralizes citizen reports of urban public problems onto one interactive map so complaints that normally scatter across social media and chat groups become a structured, transparent, monitorable record. The community validates reports through votes, and the responsible party (admin/petugas) updates the handling status until resolution. Success means a citizen can report a problem, see it acknowledged, and watch it handled to completion.

## Positioning

A transparent, map-based public reporting platform where citizens report, the community validates, and the city responds — with duplicate detection (same category within ~100 m) and a heatmap as the primary differentiators. Positioned as a practical public-service tool for Indonesian cities generally, not a generic CRUD dashboard and not a single-city pilot.

## Operating Context

- Competition entry: Website Design and Development Competition, Technova Dies Natalis HIMTIF Universitas Pamulang 2026, theme "Innovative Web Solutions".
- Judged on: theme fit, UI/UX design, functionality, creativity/innovation, code quality, and a ~10-minute presentation/demo.
- Built on a 5-day execution plan; the UI/design foundation already exists and must be integrated, not rebuilt from scratch.
- Demo flow: open map → toggle heatmap → open report → login → create report → duplicate detection appears → vote existing or continue → admin changes status → citizen sees updated status.

## Capabilities and Constraints

Confirmed capabilities:

- P0: registration/login (Supabase Auth), guest browsing, create report, one photo upload, browser geolocation with manual pin fallback, interactive map, category/status filters, report detail, one-user-one-vote, three-status workflow (`dilaporkan → diproses → selesai`), protected admin area with overview and all-reports management.
- P1: heatmap toggle (marker/heatmap modes) and duplicate detection (same category, ~100 m radius, non-blocking on failure).
- P2 (stretch): before/after photo slider, AI insight summary from existing report data (Gemini, optional, must fail gracefully).
- P3 (explicitly not a target): offline-first PWA.

Confirmed constraints:

- Next.js App Router, TypeScript, Supabase (Postgres/Auth/Storage/RLS), Leaflet + OpenStreetMap, Nominatim geocoding, Tailwind CSS + shadcn/ui, React Query, Gemini only for optional AI.
- Exactly two roles: user/citizen and admin. Exactly three statuses and five categories (`jalan_rusak`, `sampah`, `banjir`, `fasilitas_umum`, `lainnya`).
- Free services only; no Google Maps, no paid map providers, no separate backend, no service-role key on the client, no secrets in source.
- No emoji in source code, comments, UI strings, logs, or commit messages.
- Location comes from browser geolocation or manual pin, never from photo EXIF alone.

## Brand Commitments

- Name: **SigapKota** (Public Problem Mapper).
- Headline: "Lapor masalah kota, pantau penanganannya" (Report city problems, monitor their handling).
- UI language is Indonesian; status and category names are Indonesian.
- Design philosophy: **Modern Civic Utility** — "calm urgency": authoritative and official yet fast, responsive, and human-centric; avoids bureaucratic and decorative excess.
- Palette: primary teal (#006D77), secondary amber (#F4A261) reserved for urgent/report actions, tertiary deep green for resolution; status semantics gray (dilaporkan), amber (diproses), green (selesai).
- Typography: Hanken Grotesk for headlines, Inter for body/functional text.
- Voice: a practical public-service tool that builds trust through transparency (completed reports with before/after evidence are proof of handling).

## Evidence on Hand

- `SIGAPKOTA_SPEC.md` — complete product and engineering specification (source of truth).
- `UI_TARGET/` — per-surface design targets with `DESIGN.md`, `code.html`, and `screen.png` (home map view, report list, report detail, new report form, login/register, admin panel, civic horizon).
- `supabase/schema.sql`, `supabase/seed.sql`, and migrations — database model, RLS intent, and demo seed data.
- Existing Next.js implementation (`app/`, `components/`, `lib/`) with the incumbent visual system already applied.
- No real testimonials, case studies, or press exist; future work must not fabricate them.

## Product Principles

1. **Functional core first.** P0 must be stable before any P1/P2/P3 feature; never sacrifice a working core flow for a differentiator.
2. **Meaningful differentiation over feature quantity.** Heatmap and duplicate detection are the differentiators; everything else stays lean.
3. **Free and simple architecture.** One Next.js app, managed free infrastructure, no unnecessary layers or dependencies.
4. **Transparency builds trust.** Visible status, community votes, and completed-report evidence are the product's proof of value.
5. **Demo-ready reliability.** The ~10-minute demo must work end-to-end without manual database edits.

## Accessibility & Inclusion

- WCAG AA is the baseline quality bar for the public-facing application.
- Mobile-first: primary users act on phones, often outdoors and one-handed; touch targets, legibility, and responsive behavior are core requirements.