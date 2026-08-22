# SIGAPKOTA_SPEC.md --- Complete Product & Engineering Knowledge Base

> This document transfers the current SigapKota product, architecture,
> constraints, functional requirements, execution priorities, and
> implementation decisions to an AI coding agent.
>
> **Source of truth hierarchy:** this specification + actual existing
> codebase. Historical brainstorming in `claudechat.txt` is context, not
> authority.

------------------------------------------------------------------------

# 1. PROJECT IDENTITY

## 1.1 Product

**Name:** SigapKota\
**Working description:** Public Problem Mapper

SigapKota is a map-based citizen reporting platform for public
infrastructure and environmental problems.

Examples:

-   damaged roads;
-   garbage accumulation;
-   flooding;
-   broken public facilities;
-   other urban public problems.

The central product idea is:

> Citizens report real-world public problems into one transparent map,
> the community can validate/support existing reports, and an
> admin/petugas can update the handling status.

------------------------------------------------------------------------

# 2. COMPETITION CONTEXT

**Competition:** Website Design and Development Competition --- Technova
Dies Natalis HIMTIF Universitas Pamulang 2026

**Required theme:** `Innovative Web Solutions`

Competition evaluation priorities stated in the project guide:

1.  Fit with the theme "Innovative Web Solutions"
2.  UI/UX design
3.  Website functionality
4.  Creativity & innovation
5.  Code quality
6.  Presentation & demo

The final presentation/demo is expected to be approximately 10 minutes
plus Q&A if the project reaches the finalist stage.

The product therefore needs both:

-   a stable functional core;
-   visible differentiation that can be demonstrated quickly.

------------------------------------------------------------------------

# 3. CURRENT DELIVERY CONSTRAINT

The current execution plan is **5 days** with:

-   **Dev A:** Afif
-   **Dev B:** Qalam
-   **Willy:** repository/DevOps
-   **Yudi:** QA/integration/support
-   Unseen remains optional support and is not a dependency for the
    timeline.

The UI/design foundation already exists. Dev B/Qalam should integrate
and polish the available design rather than create the entire UI from
scratch.

This is important because the bottleneck is implementation/integration,
not visual ideation from zero.

------------------------------------------------------------------------

# 4. PRODUCT PROBLEM

The product addresses a common public-service communication problem:

Citizens frequently complain about public infrastructure or
environmental problems through social media, chat groups, or informal
channels. Those complaints can become fragmented, duplicated, difficult
to track, and difficult for a responsible party to monitor
systematically.

SigapKota creates one structured place where:

-   reports are geographically visible;
-   similar reports can be recognized;
-   community support/votes provide an additional signal;
-   handling status is visible;
-   completed problems can eventually have visual before/after evidence;
-   aggregate reports can reveal areas with concentrated problems.

The product should feel like a practical public-service tool, not a
generic CRUD dashboard.

------------------------------------------------------------------------

# 5. TARGET USERS

## 5.1 Guest

Can:

-   browse the map;
-   view report markers;
-   inspect reports;
-   browse report lists.

Cannot:

-   create a report;
-   vote.

Guest users should be encouraged to log in when they attempt protected
actions.

------------------------------------------------------------------------

## 5.2 Citizen/User

Can:

-   register/login;
-   create reports;
-   upload one report photo;
-   select/correct location;
-   vote/support an existing report;
-   browse all reports;
-   see report status and history.

------------------------------------------------------------------------

## 5.3 Admin/Petugas

Can:

-   access the protected admin area;
-   see overview statistics;
-   browse/search/filter all reports;
-   update report status;
-   optionally provide after-photo evidence for completed reports if
    Before/After is implemented.

There are only two authorization roles:

-   user/citizen;
-   admin.

Do not create granular role hierarchies.

------------------------------------------------------------------------

# 6. PRODUCT GOALS

The product should:

1.  Be a real functional web solution rather than a static mockup.
2.  Demonstrate a clear public/social impact.
3.  Stand out through 1--2 meaningful differentiators rather than
    feature quantity.
4.  Be easy to demonstrate in approximately 10 minutes.
5.  Be deployable entirely with free services for the competition.
6.  Maintain clean code and a sensible architecture.

------------------------------------------------------------------------

# 7. PRODUCT NON-GOALS / OUT OF SCOPE

Do NOT introduce:

-   complex multi-level RBAC;
-   export to PDF/Excel;
-   formal SLA/deadline management;
-   additional status types;
-   Google Maps API;
-   paid map services;
-   separate Express/Nest backend;
-   predictive AI systems without an explicit approved scope;
-   arbitrary new features outside the defined MVP/differentiator list.

No feature should be added merely because it sounds impressive.

------------------------------------------------------------------------

# 8. FUNCTIONAL PRIORITY

## P0 --- MVP CORE --- MUST BE STABLE

P0 consists of:

-   Authentication
-   Guest browsing
-   Create Report
-   Photo Upload
-   Geolocation + Manual Pin
-   Interactive Map
-   Report List
-   Report Detail
-   Voting
-   Status Tracking
-   Admin Overview
-   Admin All Reports
-   Production Deployment

------------------------------------------------------------------------

## P1 --- PRIMARY DIFFERENTIATORS

Target after P0:

1.  Heatmap
2.  Duplicate Detection

These are the main competition differentiators in the current 5-day
plan.

------------------------------------------------------------------------

## P2 --- STRETCH

Only after P0/P1 are stable:

1.  Before/After Slider
2.  AI Insight Summary

------------------------------------------------------------------------

## P3 --- EXTREME STRETCH

Offline-first PWA.

For the current 5-day plan this is explicitly **not a target**.

Do not sacrifice core stability to implement P3.

------------------------------------------------------------------------

# 9. AUTHENTICATION REQUIREMENTS

Use Supabase Auth.

Minimum:

-   email/password registration;
-   email/password login;
-   logout;
-   persistent session;
-   auth state;
-   protected report creation;
-   protected voting;
-   protected admin area.

Guest browsing is allowed.

A guest should be able to see public data without creating an account.

------------------------------------------------------------------------

# 10. CREATE REPORT

A report contains:

-   title;
-   description;
-   category;
-   one photo;
-   latitude;
-   longitude;
-   authenticated user;
-   default status;
-   timestamp.

Categories are:

``` text
jalan_rusak
sampah
banjir
fasilitas_umum
lainnya
```

The report form must provide:

-   validation;
-   loading/submitting state;
-   success state;
-   error state;
-   photo preview;
-   location selection.

A submission error should not unnecessarily destroy all user-entered
form data.

------------------------------------------------------------------------

# 11. PHOTO UPLOAD

Use Supabase Storage.

Current scope:

-   one photo per initial report;
-   validate the uploaded file;
-   upload it;
-   save its URL/reference in `photo_url`;
-   show it again in report detail.

Before/After introduces a nullable `photo_after_url`.

------------------------------------------------------------------------

# 12. GEOLOCATION

## 12.1 Primary mechanism

Use the native browser:

``` text
navigator.geolocation.getCurrentPosition()
```

This asks the user for location permission.

The location does **not** primarily come from the uploaded photo.

------------------------------------------------------------------------

## 12.2 Why EXIF is not primary

Photo EXIF GPS metadata is unreliable because:

-   metadata can be stripped;
-   not every image has GPS metadata;
-   screenshots may not contain it;
-   desktop/webcam images do not necessarily contain it;
-   the user may upload an old/gallery photo rather than a photo from
    the report location.

Therefore:

**Never make EXIF GPS the only or required source of location.**

------------------------------------------------------------------------

## 12.3 Required fallback

Manual map pin selection is mandatory.

Flow:

``` text
Request browser location
       |
       +--> success
       |      |
       |      v
       |   center map
       |      |
       |      v
       |   user may correct pin
       |
       +--> denied/unavailable
              |
              v
         manual pin selection
```

The final location is the latitude/longitude selected by the user.

------------------------------------------------------------------------

# 13. INTERACTIVE MAP

Use:

-   Leaflet or MapLibre;
-   OpenStreetMap-based tiles.

Google Maps is explicitly excluded.

The map should:

-   display report markers;
-   use status-aware visual treatment;
-   support category filtering;
-   support status filtering;
-   allow combined filters;
-   open a report preview from a marker;
-   work on mobile.

PRD status colors:

-   Dilaporkan --- gray
-   Diproses --- orange
-   Selesai --- green

Marker preview should expose useful information such as:

-   photo;
-   title;
-   category;
-   status;
-   vote count.

------------------------------------------------------------------------

# 14. REPORT LIST / DISCOVERY

The report list should be backed by actual database data.

Expected capabilities:

-   report cards;
-   search;
-   category filtering;
-   status filtering;
-   loading state;
-   empty state;
-   open detail.

Do not leave hardcoded sample reports as the primary data source.

Seed/demo data is acceptable and encouraged for competition
presentation, but it must exist in the database.

------------------------------------------------------------------------

# 15. REPORT DETAIL

The report detail page should expose:

-   photo;
-   title;
-   category;
-   status;
-   location;
-   description;
-   vote count;
-   created date;
-   vote/support action;
-   status timeline/activity history;
-   map/location context.

It should be accessible from:

-   report list;
-   map marker/preview.

------------------------------------------------------------------------

# 16. VOTING

Voting means community support/validation.

Rules:

-   login required;
-   one user can vote once for a given report;
-   duplicate vote must be prevented;
-   vote state should be visible;
-   count must remain consistent with the database.

Database uniqueness:

``` text
unique(report_id, user_id)
```

Guest users attempting to vote should be directed to authentication.

------------------------------------------------------------------------

# 17. STATUS WORKFLOW

Exactly three statuses:

``` text
dilaporkan
    ↓
diproses
    ↓
selesai
```

Do not add:

-   diverifikasi;
-   ditolak;
-   menunggu;
-   ditutup;
-   or other status values.

The product intentionally uses a simple workflow for the competition
scope.

There is no formal SLA/deadline feature.

------------------------------------------------------------------------

# 18. STATUS HISTORY

The detail page should provide a simple status/activity timeline.

The implementation must not invent complex workflow machinery.

If the existing schema does not yet have a dedicated status history
table, implement only what is necessary and consistent with the agreed
scope rather than creating an enterprise workflow engine.

------------------------------------------------------------------------

# 19. ADMIN AREA

The PRD defines three admin sub-pages.

## 19.1 Overview

Show:

-   total reports;
-   report counts by status;
-   category chart;
-   latest reports.

The statistics must come from actual data.

------------------------------------------------------------------------

## 19.2 All Reports

Provide:

-   complete report table;
-   search;
-   filters;
-   report actions;
-   status update.

Available status values remain exactly:

-   Dilaporkan
-   Diproses
-   Selesai

------------------------------------------------------------------------

## 19.3 Analytics

Provide deeper but data-supported analytics:

-   reports over time;
-   category distribution;
-   status distribution;
-   average resolution time if the available data genuinely supports it.

Do not display fake metrics.

------------------------------------------------------------------------

# 20. HEATMAP

Priority: P1.

Purpose:

Show areas with high concentrations of reported problems.

Implementation direction:

-   `leaflet.heat` if using Leaflet;
-   convert report coordinates into heat points;
-   allow marker/heatmap toggle;
-   respect active filters;
-   handle loading/empty states;
-   verify mobile behavior.

The feature should be visually strong because the map is one of the
product's primary demo surfaces.

------------------------------------------------------------------------

# 21. DUPLICATE DETECTION

Priority: P1.

This is one of the main "smart" product features.

## 21.1 User problem

Without duplicate detection, several citizens may independently report
the same road damage or garbage pile.

That creates:

-   duplicated data;
-   fragmented votes;
-   less clear issue severity;
-   a cluttered map.

------------------------------------------------------------------------

## 21.2 Detection rule

When creating a report:

1.  Get category.
2.  Get final latitude/longitude.
3.  Query existing active reports.
4.  Require same category.
5.  Check approximately 100-meter radius.
6.  Exclude completed reports according to the agreed active-report
    logic.

A candidate is not automatically declared "the same problem."

It is presented as a **similar nearby report**.

------------------------------------------------------------------------

## 21.3 User experience

``` text
User fills report
       ↓
Selects category + location
       ↓
Check duplicate
       ↓
No candidate
       → normal submit

Candidate found
       ↓
Show warning
       ↓
"Similar report already exists nearby"
       ↓
Preview existing report
       ↓
  +----+------------------+
  |                       |
Vote existing         Continue anyway
report
```

The user must always be able to continue if the situation is genuinely
different.

------------------------------------------------------------------------

## 21.4 Distance implementation

The Project Guide/PRD specifies a Haversine-style distance query in
Postgres.

Conceptually:

``` text
distance = geographic distance between
new latitude/longitude
and existing report latitude/longitude
```

The implementation can use a PostgreSQL function/RPC.

The earlier technical direction was a function similar to:

``` text
nearby_reports(
  lat,
  lng,
  category_filter,
  radius_meters = 100
)
```

Return candidates such as:

-   report ID;
-   title;
-   distance;
-   useful preview information.

Do not overengineer the spatial system for this competition.

If PostGIS is already present and useful, it may be considered, but the
existing project direction is a lightweight Haversine/Postgres approach.
Do not introduce PostGIS solely to make the architecture sound more
advanced.

------------------------------------------------------------------------

## 21.5 Failure behavior

Duplicate detection is a helpful enhancement, not a blocking dependency.

If the duplicate query fails:

-   report creation should still be possible;
-   show an appropriate non-blocking error/log/state;
-   never leave the user stuck on a duplicate-check spinner.

------------------------------------------------------------------------

# 22. BEFORE / AFTER

Priority: P2.

For completed reports:

-   admin can upload an after-photo;
-   store it in Supabase Storage;
-   save `photo_after_url`;
-   show a comparison slider.

Only show the comparison when after-photo exists.

Mobile behavior must be tested.

If this feature is incomplete, it can be skipped without harming the
core application.

------------------------------------------------------------------------

# 23. AI INSIGHT SUMMARY

Priority: P2.

Use Google Gemini API / Google AI Studio.

The purpose is not generic chatbot functionality.

The intended behavior:

-   collect existing structured report data for an area;
-   summarize it;
-   produce one or two natural-language insight sentences.

Example:

> "Area ini memiliki 6 laporan jalan rusak dalam 2 minggu terakhir,
> meningkat dibanding rata-rata sebelumnya."

The AI should summarize data already known to the system.

Do not claim:

-   prediction;
-   guaranteed future events;
-   authoritative government conclusions;
-   safety certification.

AI is an optional insight layer.

### Failure rule

Gemini failure must never break:

-   report submission;
-   map;
-   report detail;
-   voting;
-   admin status changes.

------------------------------------------------------------------------

# 24. OFFLINE-FIRST PWA

Priority: P3.

This is technically advanced but not part of the 5-day target.

Concept:

``` text
User creates report offline
        ↓
Browser detects no network
        ↓
Store pending report in IndexedDB
        ↓
Show "saved offline" state
        ↓
Connection returns
        ↓
Sync pending report
        ↓
Server receives report
        ↓
Report appears normally
```

Suggested components from the earlier project direction:

-   service worker;
-   `next-pwa`;
-   IndexedDB;
-   `idb` or Dexie;
-   Background Sync API;
-   `window.addEventListener('online', ...)` fallback.

Do not implement this at the expense of P0/P1.

------------------------------------------------------------------------

# 25. DATABASE SCHEMA

Core model:

``` sql
-- reports
id uuid pk default gen_random_uuid(),
user_id uuid references auth.users,
title text not null,
description text,
category text not null,
photo_url text,
photo_after_url text,
latitude float8 not null,
longitude float8 not null,
status text not null default 'dilaporkan',
vote_count int default 0,
created_at timestamptz default now()

-- votes
id uuid pk default gen_random_uuid(),
report_id uuid references reports(id),
user_id uuid references auth.users,
created_at timestamptz default now(),
unique(report_id, user_id)
```

Category values:

``` text
jalan_rusak
sampah
banjir
fasilitas_umum
lainnya
```

Status values:

``` text
dilaporkan
diproses
selesai
```

Do not create unnecessary entities just to make the schema larger.

------------------------------------------------------------------------

# 26. RLS / SUPABASE SECURITY

RLS is a core security mechanism.

Intent:

### Normal user

-   can read public report data;
-   can insert their own reports;
-   can insert votes;
-   cannot update report status.

### Admin

-   can update status;
-   can access admin functionality.

Do not make admin protection only a frontend route guard.

Do not expose service-role keys to the browser.

------------------------------------------------------------------------

# 27. TECH STACK

  Layer             Decision
  ----------------- ----------------------------------------------
  Framework         Next.js 14+ App Router
  Language          TypeScript
  Database          Supabase Postgres
  Authentication    Supabase Auth
  File storage      Supabase Storage
  Authorization     Supabase RLS
  Map               Leaflet or MapLibre GL JS
  Map data/tiles    OpenStreetMap
  Geocoding         Nominatim
  Styling           Tailwind CSS
  UI primitives     shadcn/ui
  Data fetching     React Query or SWR
  AI                Google Gemini API / Google AI Studio
  Offline storage   IndexedDB via `idb`/Dexie if P3 is attempted
  PWA               `next-pwa` if P3 is attempted
  Hosting           Vercel Hobby/free
  Source control    GitHub

------------------------------------------------------------------------

# 28. FREE-SERVICE CONSTRAINT

The project must remain deployable without paying for infrastructure.

Do not introduce:

-   Google Maps API;
-   paid map providers;
-   paid SMS;
-   paid databases;
-   paid server infrastructure;
-   services requiring paid subscriptions;
-   services requiring a credit card for a core feature,

without explicit team approval.

The project guide specifically requires all services to remain within
free tiers.

Free-tier quotas/policies can change. If a provider becomes incompatible
with the no-cost constraint, choose another free-compatible
implementation rather than silently adding cost.

------------------------------------------------------------------------

# 29. OPENSTREETMAP / NOMINATIM BEHAVIOR

Use OpenStreetMap-based mapping.

Nominatim is intended for geocoding.

Do not abuse geocoding:

-   avoid loops of unnecessary requests;
-   avoid repeated calls on every keystroke;
-   respect its rate limitations;
-   proxy where appropriate through a server route.

Expected route:

``` text
/app/api/geocode/route.ts
```

------------------------------------------------------------------------

# 30. API / SERVER BOUNDARY

Expected server/API routes include:

``` text
/app/api/laporan/route.ts
/app/api/laporan/check-duplicate/route.ts
/app/api/geocode/route.ts
```

Additional routes can be added only when they solve a real need.

The architecture intentionally avoids:

``` text
Browser
   ↓
Next.js
   ↓
Express
   ↓
Supabase
```

Instead:

``` text
Browser
   ↓
Next.js
   ├── Supabase
   ├── Nominatim
   └── Gemini (server-side when needed)
```

This keeps the system small enough for the deadline.

------------------------------------------------------------------------

# 31. SUPABASE CLIENTS

Expected separation:

``` text
lib/supabase/client.ts
lib/supabase/server.ts
```

Browser-facing code should use the appropriate public Supabase client.

Server-only code may use privileged credentials only when genuinely
necessary and must never leak them to the client.

Do not use the service role key as a shortcut for normal client
operations that should respect RLS.

------------------------------------------------------------------------

# 32. ENVIRONMENT VARIABLES

Expected:

``` env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

Rules:

-   `.env.local` is local only;
-   `.env.local` must be ignored by Git;
-   `.env.example` should document required variables without real
    secrets;
-   Vercel environment variables must be configured separately;
-   no secrets in source files.

------------------------------------------------------------------------

# 33. EXPECTED FOLDER STRUCTURE

Baseline:

``` text
sigapkota/
├── app/
│   ├── page.tsx
│   ├── laporan/
│   │   ├── page.tsx
│   │   ├── baru/page.tsx
│   │   └── [id]/page.tsx
│   ├── admin/page.tsx
│   ├── api/
│   │   ├── laporan/route.ts
│   │   ├── laporan/check-duplicate/route.ts
│   │   └── geocode/route.ts
│   └── layout.tsx
├── components/
│   ├── MapView.tsx
│   ├── ReportForm.tsx
│   ├── ReportCard.tsx
│   └── ui/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── types.ts
├── public/
└── .env.local
```

This is a baseline, not a rigid mandate.

------------------------------------------------------------------------

# 34. UI/UX PRINCIPLES

The project is also judged on UI/UX.

The existing design should be integrated rather than discarded.

Every important state needs consideration:

-   loading;
-   empty;
-   success;
-   error;
-   permission denied;
-   location unavailable;
-   upload failure;
-   duplicate candidate found;
-   duplicate query failure;
-   unauthenticated protected action;
-   mobile layout.

The map is a primary product surface.

The dashboard should not become an unrelated analytics product.

The duplicate modal should be understandable to a non-technical citizen.

------------------------------------------------------------------------

# 35. DEMO DATA

For the competition, seeded data is useful.

Seed data should include:

-   multiple categories;
-   multiple statuses;
-   several votes;
-   geographically clustered reports;
-   duplicate-detection candidates;
-   completed reports;
-   realistic coordinates.

This allows demonstration of:

-   map;
-   filters;
-   heatmap;
-   duplicate detection;
-   analytics;
-   before/after if implemented.

The seed dataset should look plausible and support the product story.

------------------------------------------------------------------------

# 36. DEMO FLOW

Recommended demo sequence:

``` text
1. Open SigapKota
       ↓
2. Show map + existing reports
       ↓
3. Toggle Heatmap
       ↓
4. Open a report
       ↓
5. Login
       ↓
6. Create report
       ↓
7. Select location/category
       ↓
8. Duplicate Detection finds nearby similar report
       ↓
9. Vote existing OR continue
       ↓
10. Admin opens report
       ↓
11. Admin changes status
       ↓
12. Citizen sees updated status
       ↓
13. Before/After or AI Insight if implemented
```

The demo should not require manual database edits.

------------------------------------------------------------------------

# 37. DEFINITION OF DONE

The application is demo-ready when:

-   guest can browse;
-   user can register/login;
-   user can create a report;
-   user can upload one photo;
-   user can use automatic geolocation or manual pin;
-   report appears on the map;
-   report detail works;
-   user can vote once;
-   admin can update status;
-   only the three defined statuses are used;
-   target differentiator(s) work;
-   production Vercel URL is accessible;
-   repository has no secrets;
-   README is reasonable;
-   the end-to-end demo has been tested.

For the current 5-day execution, target:

**P0 + Heatmap + Duplicate Detection**

Before/After and AI Insight are stretch features.

Offline-first PWA is not a target.

------------------------------------------------------------------------

# 38. 5-DAY EXECUTION PLAN

## Day 1

### Afif

-   Supabase data integration
-   auth integration

### Qalam

-   interactive map
-   map foundation

### Willy

-   repository
-   Next.js setup
-   Supabase setup

### Yudi

-   QA plan
-   integration support

------------------------------------------------------------------------

## Day 2

### Afif

-   report submission
-   photo upload
-   geolocation/manual pin

### Qalam

-   report list
-   report discovery/detail integration

### Willy

-   environment configuration
-   integration support

### Yudi

-   user-flow QA

------------------------------------------------------------------------

## Day 3

### Afif

-   report detail data
-   voting

### Qalam

-   admin overview
-   admin all reports

### Willy

-   deployment preparation
-   demo data

### Yudi

-   end-to-end user/admin QA

------------------------------------------------------------------------

## Day 4

### Afif

-   duplicate detection
-   report-flow integration

### Qalam

-   heatmap
-   duplicate detection UI

### Willy

-   deployment verification

### Yudi

-   gimmick QA

------------------------------------------------------------------------

## Day 5

### Afif

-   optional Before/After support

### Qalam

-   UI/responsive polish
-   optional Before/After / AI Insight UI

### Willy

-   release freeze
-   production verification
-   repository cleanup

### Yudi

-   bug bash
-   demo readiness

------------------------------------------------------------------------

# 39. ROLE OWNERSHIP

## Dev A --- Afif

Primary:

-   core report flow;
-   backend/data flow;
-   geolocation;
-   voting;
-   duplicate detection;
-   cross-feature integration.

Secondary:

-   optional support from Unseen if available.

------------------------------------------------------------------------

## Dev B --- Qalam

Primary:

-   map experience;
-   report discovery/detail;
-   admin panel;
-   heatmap;
-   UI integration/polish.

Important:

UI already exists, so focus on connecting functionality rather than
designing from scratch.

------------------------------------------------------------------------

## Willy --- Repo/DevOps

Primary:

-   repository;
-   project setup;
-   Supabase setup;
-   environment;
-   Git;
-   deployment;
-   production readiness;
-   demo seed data.

------------------------------------------------------------------------

## Yudi --- QA/Integration

Primary:

-   QA;
-   manual testing;
-   bug reproduction;
-   integration support;
-   demo data verification;
-   production verification.

------------------------------------------------------------------------

# 40. ACCEPTANCE CRITERIA BY FEATURE

## Auth

-   guest browsing works;
-   registration works;
-   login works;
-   logout works;
-   session survives refresh;
-   protected actions require authentication.

## Report

-   complete report can be submitted;
-   data persists;
-   photo persists;
-   location persists;
-   errors are handled.

## Geolocation

-   permission request appears;
-   successful location initializes map;
-   user can correct pin;
-   permission denial does not kill the form;
-   manual pin works.

## Map

-   reports load from database;
-   markers display;
-   filters work;
-   marker preview works;
-   mobile map works.

## Detail

-   real report data appears;
-   vote works;
-   status works;
-   timeline appears;
-   map/location appears.

## Voting

-   one user = one vote per report;
-   duplicate vote prevented;
-   count consistent;
-   guest redirected to auth.

## Admin

-   unauthorized user cannot update status;
-   admin can update;
-   only three statuses;
-   user sees updated status.

## Heatmap

-   toggle works;
-   heatmap uses real coordinates;
-   filters affect displayed data;
-   mobile works.

## Duplicate Detection

-   same category + nearby active report produces candidate;
-   category mismatch does not produce false candidate;
-   far-away report does not produce candidate;
-   completed reports are handled according to active-report logic;
-   user can vote existing;
-   user can continue;
-   failure does not block submission.

## Before/After

-   only completed reports expose after-photo;
-   slider works;
-   missing after-photo is handled gracefully.

## AI Insight

-   generated from actual report data;
-   optional;
-   failure is non-blocking;
-   no unsupported predictive claims.

------------------------------------------------------------------------

# 41. SCOPE GUARDRAILS --- DO NOT VIOLATE

1.  No separate Express/Nest backend.
2.  No Google Maps.
3.  No paid mapping service.
4.  No complex RBAC.
5.  No PDF/Excel export.
6.  No SLA/deadline system.
7.  No extra report statuses.
8.  No AI dependency for core flows.
9.  No EXIF-only location.
10. No unnecessary dependency accumulation.
11. No arbitrary new features outside the agreed PRD/spec.
12. No hardcoded API secrets.
13. No service-role key on the client.
14. No fake analytics metrics.
15. No unnecessary architecture layers.
16. No emoji in source code, comments, UI strings, logs, or commit
    messages.

------------------------------------------------------------------------

# 42. ENGINEERING PHILOSOPHY

This project explicitly rejects two extremes.

## Too simple

A generic:

``` text
CRUD + map + login
```

would not sufficiently demonstrate innovation.

That is why Heatmap + Duplicate Detection are prioritized.

## Too complex

A system containing:

``` text
Next.js
+
Express
+
separate auth service
+
complex RBAC
+
microservices
+
multiple paid APIs
+
ML pipeline
```

would consume the competition deadline without proportionate value.

The intended architecture is:

``` text
                 ┌───────────────┐
                 │    Browser    │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │    Next.js    │
                 │  App Router   │
                 └───┬─────┬─────┘
                     │     │
            ┌────────┘     └───────────┐
            ▼                          ▼
     ┌─────────────┐            ┌─────────────┐
     │  Supabase   │            │ Third-party  │
     │ Postgres    │            │ services     │
     │ Auth        │            │              │
     │ Storage     │            │ OSM/Nominatim│
     │ RLS         │            │ Gemini       │
     └─────────────┘            └─────────────┘
```

One application. One main backend boundary. Managed infrastructure where
appropriate.

------------------------------------------------------------------------

# 43. AGENT DECISION RULES

When deciding whether to implement something:

### If it is P0

Implement it.

### If it is P1

Implement after P0 is stable.

### If it is P2

Only implement if P0/P1 and integration are stable.

### If it is P3

Do not prioritize it in the current 5-day plan.

### If it is outside the spec

Ask before expanding scope.

### If there are two technically valid approaches

Choose the simpler one unless the more advanced approach materially
improves reliability or satisfies a requirement that the simple approach
cannot.

### If an external service is proposed

Verify that it satisfies the no-cost constraint before integrating it.

------------------------------------------------------------------------

# 44. HISTORICAL CONTEXT FROM EARLIER BRAINSTORMING

Earlier discussion explored several public-service and community ideas,
eventually converging on the LaporAja/SigapKota concept because it is:

-   visually strong through maps;
-   based on user-generated reports;
-   technically achievable in a short competition timeline;
-   less dependent on manually curated disaster information;
-   suitable for free infrastructure;
-   easy to demonstrate.

Earlier brainstorming also considered:

-   AI classification;
-   duplicate detection;
-   heatmap;
-   Before/After;
-   offline-first PWA.

The current specification intentionally narrows those ideas into a
prioritized plan.

Historical discussion must not override the current priority order.

------------------------------------------------------------------------

# 45. FINAL AGENT PRINCIPLE

When working on SigapKota, optimize for:

**functional core + meaningful innovation + polished UX + reliable
demo + simple architecture.**

Do not optimize for:

**maximum number of technologies, maximum number of features, or maximum
architectural complexity.**
