# CLAUDE.md --- SigapKota Agent Starter

## 0. READ THIS FIRST

You are the coding agent for **SigapKota --- Public Problem Mapper**, a
web-development competition project.

Before changing code:

1.  Read this file completely.
2.  Read `SIGAPKOTA_SPEC.md` completely.
3.  Inspect the existing repository before creating or replacing files.
4.  Reuse the existing UI/design implementation where possible. Do not
    rebuild the UI from scratch merely because you can.
5.  Treat `SIGAPKOTA_SPEC.md` as the product/technical source of truth.
6.  Treat the existing codebase as the source of truth for what is
    already implemented correctly.
7.  If a request conflicts with the scope/constraints in the spec, stop
    and ask before introducing a large architectural or scope change.
8.  Prefer the smallest robust implementation that satisfies the
    requirement.

------------------------------------------------------------------------

## 1. PROJECT PRIORITIES

The project has a very short competition deadline.

Priority order is:

**P0 \> P1 \> P2 \> P3**

-   **P0:** MVP core. Must be stable.
-   **P1:** Heatmap + Duplicate Detection. Main differentiators.
-   **P2:** Before/After + AI Insight. Only if time allows.
-   **P3:** Offline-first PWA. Not a target for the current 5-day plan.

Never sacrifice a working P0 flow to add a P1/P2/P3 feature.

Day 5 is primarily freeze, QA, integration, deployment verification, and
demo readiness --- not a reason to introduce large new features.

------------------------------------------------------------------------

## 2. NON-NEGOTIABLE ARCHITECTURE RULES

-   Use **Next.js 14+ with App Router**.
-   Use **Supabase** for Postgres, Auth, Storage, and RLS.
-   Use **Leaflet or MapLibre + OpenStreetMap** for maps.
-   Use **Nominatim** for geocoding where needed.
-   Use **Tailwind CSS + shadcn/ui** for styling/UI primitives.
-   Use **React Query or SWR + local React state**, not Redux.
-   Use **Google Gemini API / Google AI Studio** only for optional AI
    functionality.
-   Deploy the application to **Vercel Hobby/free tier**.
-   Everything must remain free to deploy and use for the competition.
    Do not introduce paid APIs, paid infrastructure, or dependencies
    requiring a credit card without explicit approval.
-   Do **not** create a separate Express/NestJS backend. Next.js
    server/API routes plus Supabase are sufficient.
-   Keep the architecture as one coherent Next.js application.
-   Keep secrets server-side and in environment variables.

------------------------------------------------------------------------

## 3. SECURITY RULES

Never:

-   hardcode API keys;
-   commit `.env.local`;
-   expose `SUPABASE_SERVICE_ROLE_KEY` to browser/client code;
-   expose `GEMINI_API_KEY` to browser/client code;
-   bypass RLS casually;
-   implement authorization only through hidden UI;
-   trust a client-supplied admin role without server-side
    authorization.

Expected environment variables:

``` env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

`NEXT_PUBLIC_*` variables may be available to the client. Service-role
and Gemini secrets must remain server-side.

------------------------------------------------------------------------

## 4. PRODUCT CONTEXT

SigapKota is a map-based public reporting platform for urban
public-facility/environmental problems such as:

-   damaged roads;
-   accumulated garbage;
-   flooding;
-   damaged public facilities;
-   other public problems.

The product addresses the problem that citizens often complain through
social media or WhatsApp groups without the report reaching a
structured, transparent place that can be monitored.

SigapKota centralizes citizen reports on an interactive map, allows
community validation through voting, and provides transparent status
tracking.

Target roles:

-   **Guest:** browse the map and reports.
-   **Citizen/user:** browse, report, and vote.
-   **Admin/petugas:** manage reports and update handling status.

There are only two application roles for authorization purposes:

**user/citizen + admin**

Do not invent granular RBAC.

------------------------------------------------------------------------

## 5. MVP REQUIREMENTS

P0 must include:

1.  Registration/login with Supabase Auth.
2.  Guest browsing.
3.  Create report.
4.  One photo upload.
5.  Browser geolocation.
6.  Manual map pin fallback/correction.
7.  Interactive report map.
8.  Category/status filters.
9.  Report detail.
10. One-user-one-vote behavior.
11. Three-status workflow: `dilaporkan -> diproses -> selesai`
12. Protected admin area.
13. Admin overview.
14. Admin all-reports management.
15. Production deployment.

Do not consider the app demo-ready until the core end-to-end flow works.

------------------------------------------------------------------------

## 6. DIFFERENTIATORS

Primary P1 differentiators:

### Heatmap

Display concentration of reports on the map and allow switching between
marker mode and heatmap mode.

### Duplicate Detection

Before creating a report, check for an active report with:

-   same category;
-   location within approximately 100 meters.

If a candidate exists:

-   explain that a similar report already exists;
-   preview the existing report;
-   allow the user to vote/support it;
-   still allow the user to continue creating a separate report.

Duplicate detection must not become a hard blocker if its query/API
fails.

P2:

-   Before/After slider.
-   AI Insight Summary.

P3:

-   Offline-first PWA.

------------------------------------------------------------------------

## 7. GEOLOCATION RULE

Do NOT use photo EXIF as the primary location mechanism.

Preferred flow:

1.  Request browser Geolocation API permission.
2.  If successful, initialize the map around the detected position.
3.  Let the user move/correct the pin.
4.  If permission is denied/unavailable, provide manual pin selection.
5.  Save the final latitude/longitude selected by the user.

Location is not required to come from the uploaded photo.

------------------------------------------------------------------------

## 8. AI RULES

Gemini is optional.

AI may provide classification/insight functionality, but:

-   AI must not be required for core report submission;
-   AI must fail gracefully;
-   slow/failing AI must not trap the user;
-   do not invent predictive claims from simple aggregate data;
-   AI Insight is a summary of existing report data, not a complex
    predictive system.

Example intended insight style:

> "Area ini memiliki 6 laporan jalan rusak dalam 2 minggu terakhir,
> meningkat dibanding rata-rata sebelumnya."

Do not turn AI into a gimmick that compromises reliability.

------------------------------------------------------------------------

## 9. DATABASE MODEL

Core tables:

### reports

-   `id`
-   `user_id`
-   `title`
-   `description`
-   `category`
-   `photo_url`
-   `photo_after_url` nullable
-   `latitude`
-   `longitude`
-   `status`
-   `vote_count`
-   `created_at`

Categories:

-   `jalan_rusak`
-   `sampah`
-   `banjir`
-   `fasilitas_umum`
-   `lainnya`

Statuses:

-   `dilaporkan`
-   `diproses`
-   `selesai`

### votes

-   `id`
-   `report_id`
-   `user_id`
-   `created_at`

Unique constraint:

`(report_id, user_id)`

This enforces one vote per user per report.

------------------------------------------------------------------------

## 10. RLS / AUTHORIZATION INTENT

Citizen/user:

-   can browse reports;
-   can create their own report;
-   can create a vote;
-   cannot update report status.

Admin:

-   can update report status;
-   can use protected admin functions.

Do not solve this by hiding buttons alone. Database permissions/RLS must
support the intended authorization model.

------------------------------------------------------------------------

## 11. EXPECTED PROJECT STRUCTURE

Keep the project simple and close to:

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
│   ├── supabase/client.ts
│   ├── supabase/server.ts
│   └── types.ts
└── .env.local
```

The structure can evolve if the existing repository already has a good
organization. Do not reorganize files just for aesthetic reasons.

------------------------------------------------------------------------

## 12. CODE QUALITY RULES

-   TypeScript-first.
-   Keep components focused.
-   Reuse shared UI primitives.
-   Avoid duplicated Supabase query logic.
-   Prefer explicit types over `any`.
-   Handle loading, empty, and error states.
-   Keep server/client boundaries clear.
-   Do not add a library for something trivial that can be handled with
    existing tools.
-   Do not introduce abstraction layers until there is a real need.
-   Do not make a generic "enterprise architecture" for a 5-day
    competition project.
-   Remove debug code and unnecessary `console.log` before release.
-   Do not add emoji to source code, comments, UI strings, logs, or
    commit messages. UI icons may use an icon library such as Lucide.

------------------------------------------------------------------------

## 13. WORKING WITH THE EXISTING UI

The project already has a design/UI basis.

When implementing:

-   preserve established visual language;
-   connect existing screens to real data;
-   add states rather than replacing the whole design;
-   only redesign when the existing implementation cannot satisfy the
    requirement;
-   ensure desktop and mobile behavior;
-   prioritize functional integration over speculative redesign.

------------------------------------------------------------------------

## 14. INTEGRATION BEHAVIOR

After implementing a feature:

1.  Run type/build checks where available.
2.  Inspect related routes/components.
3.  Verify the feature does not break auth.
4.  Verify RLS/data permissions.
5.  Verify loading/error/empty states.
6.  Verify mobile behavior for user-facing flows.
7.  Verify the complete flow, not just the component in isolation.

For example, duplicate detection is not complete merely because the SQL
function works. The full flow must be:

``` text
Create Report
 -> select category/location
 -> check nearby active reports
 -> show duplicate candidate if applicable
 -> vote existing OR continue
 -> submit
 -> report appears on map/detail
```

------------------------------------------------------------------------

## 15. DEMO-FIRST MINDSET

The final application must support a smooth approximately 10-minute
demo.

The intended demo flow is:

``` text
Open SigapKota
 -> inspect map
 -> toggle Heatmap
 -> open report
 -> login
 -> create report
 -> Duplicate Detection appears
 -> vote existing OR continue
 -> admin changes status
 -> user sees updated status
 -> Before/After / AI Insight if implemented
```

Do not build features that are impossible to demonstrate clearly within
the competition presentation.

------------------------------------------------------------------------

## 16. WHEN UNCERTAIN

If a request is ambiguous:

-   first check `SIGAPKOTA_SPEC.md`;
-   inspect existing implementation;
-   prefer the simplest interpretation consistent with the spec;
-   do not silently expand scope;
-   ask before introducing a major new dependency, paid service,
    backend, role system, or product feature.

The goal is not maximum technical complexity.

The goal is:

**a polished, reliable, innovative public-problem reporting product that
can actually be demonstrated and shipped within the deadline.**
