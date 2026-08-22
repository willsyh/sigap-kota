# UNSEEN.md --- Optional Perception Layer for SigapKota

> **Purpose:** define Unseen as an optional, non-destructive perception
> layer that can be added to SigapKota without changing the core
> reporting workflow.
>
> **Core principle:** SigapKota answers **"Apa masalah yang
> dilaporkan?"**\
> Unseen answers **"Bagaimana kondisi/rasanya menurut warga di tempat
> itu?"**
>
> Unseen is NOT a second competing reporting system. It is a lightweight
> perception layer over the same geographic context.

------------------------------------------------------------------------

# 1. EXECUTIVE DECISION

## Recommended implementation

Do **not** make users choose between:

``` text
Upload Report
OR
Upload Perception
```

as two completely separate product flows.

Do **not** initially create a permanent "score for every road" system
either.

Instead, introduce Unseen as an optional **Perception Mode** on top of
the existing SigapKota map.

The main experience becomes:

``` text
SIGAPKOTA
│
├── REPORT MODE
│   └── "Apa masalahnya?"
│
└── PERCEPTION MODE / UNSEEN
    └── "Bagaimana kondisi di sini menurutmu?"
```

Both modes use the same geographic map.

This makes Unseen feel like a natural second lens of SigapKota rather
than a second application.

------------------------------------------------------------------------

# 2. THE PRODUCT DISTINCTION

## SigapKota

Official/community issue reporting:

> "Di sini ada jalan rusak."

Structured data:

-   category;
-   description;
-   photo;
-   coordinates;
-   status;
-   votes.

This is an **issue/event/claim**.

------------------------------------------------------------------------

## Unseen

Citizen perception:

> "Lewat jalan ini terasa tidak nyaman."
>
> "Area ini terasa kotor."
>
> "Saya merasa kawasan ini kurang aman."
>
> "Tempat ini sebenarnya baik-baik saja."

This is an **experience/signal**.

Unseen should not pretend that perception is an objective fact.

The UI should use language such as:

-   "Persepsi warga"
-   "Pengalaman warga"
-   "Sinyal kawasan"
-   "Yang dirasakan warga"

and not:

-   "tingkat keamanan sebenarnya";
-   "kawasan ini berbahaya";
-   "jalan ini terbukti buruk."

------------------------------------------------------------------------

# 3. WHY UNSEEN SHOULD BE OPTIONAL

SigapKota must remain useful without Unseen.

Core flow:

``` text
Citizen
  ↓
Report public problem
  ↓
SigapKota handles it
```

Optional flow:

``` text
Citizen
  ↓
Already at a location
  ↓
Share perception
  ↓
Unseen enriches the map
```

If Unseen fails, is disabled, or is never implemented:

**SigapKota remains completely functional.**

No report should require a perception.

No admin workflow should depend on perception.

------------------------------------------------------------------------

# 4. THE BEST MENTAL MODEL

Think of the map as having two lenses:

``` text
              SIGAPKOTA MAP
                    │
          ┌─────────┴─────────┐
          │                   │
      OFFICIAL             UNSEEN
       LENS                 LENS
          │                   │
   "What happened?"    "How does it feel?"
          │                   │
    Reports/issues      Perception signals
```

This is the cleanest conceptual separation.

The user does not need to understand the architecture.

They simply switch the map mode.

------------------------------------------------------------------------

# 5. RECOMMENDED MAP EXPERIENCE

The primary UI should have a mode switch near the map:

``` text
┌─────────────────────────────────────┐
│  [ LAPORAN ]      [ UNSEEN ]        │
└─────────────────────────────────────┘
```

### Laporan

Shows:

-   report markers;
-   categories;
-   statuses;
-   votes;
-   heatmap of reported problems.

### Unseen

Shows:

-   perception signals;
-   perception clusters;
-   area-level perception;
-   optional perception score.

The same map, same city, same geographic context.

This is much more seamless than a separate `/unseen` application.

------------------------------------------------------------------------

# 6. WHAT SHOULD A PERCEPTION LOOK LIKE?

Do not start with a complicated 0--100 score.

A better first version is a very lightweight **experience check-in**.

Example:

``` text
Bagaimana rasanya berada di sini?

🙂 Nyaman
😐 Biasa saja
🙁 Tidak nyaman
```

Then optionally:

``` text
Kenapa?

☐ Kotor
☐ Bising
☐ Jalan buruk
☐ Terlalu ramai
☐ Kurang penerangan
☐ Kurang aman
☐ Lainnya
```

Optional:

``` text
Tambahkan catatan
[________________________]
```

Optional photo should remain optional.

The core action should take only a few seconds.

------------------------------------------------------------------------

# 7. WHY NOT A COMPLEX SCORE?

A single score like:

``` text
Jalan Sudirman
UNSEEN SCORE: 73/100
```

looks impressive but creates several problems:

-   What exactly does 73 mean?
-   Is it safety?
-   cleanliness?
-   comfort?
-   traffic?
-   lighting?
-   overall satisfaction?
-   How many people produced the score?
-   How recent are the responses?

A number without context can look more authoritative than it actually
is.

Therefore:

**collect simple perception signals first; derive aggregate scores
later.**

------------------------------------------------------------------------

# 8. RECOMMENDED DATA GRANULARITY

## Do NOT make the primary object "a road"

Road-level scoring sounds attractive:

``` text
Jl. Sudirman
Comfort: 61
Safety: 48
Cleanliness: 72
```

but it introduces difficult questions:

-   What counts as the same road?
-   Where does a road segment begin/end?
-   What about intersections?
-   What about alleys?
-   What if a perception belongs to a plaza rather than a road?
-   What if GPS accuracy is poor?

For the first implementation:

**Perception belongs to a geographic point.**

Then aggregate nearby points into an **area signal**.

------------------------------------------------------------------------

# 9. AREA-BASED AGGREGATION

The best first aggregation model is a small geographic cell/area.

Conceptually:

``` text
       ┌───────┬───────┬───────┐
       │       │       │       │
       │  12   │  21   │   8   │
       │       │       │       │
       ├───────┼───────┼───────┤
       │       │       │       │
       │  34   │  67   │  19   │
       │       │       │       │
       ├───────┼───────┼───────┤
       │       │       │       │
       │   9   │  43   │  15   │
       │       │       │       │
       └───────┴───────┴───────┘
```

The exact grid implementation is optional.

The user does not need to see grid boundaries.

Instead, the map can visually show:

-   soft density;
-   colored/graded regions;
-   clusters;
-   area cards.

------------------------------------------------------------------------

# 10. THE "UNSEEN PULSE"

Instead of calling it a hard "score", use a concept like:

**Unseen Pulse**

Example:

``` text
UNSEEN PULSE

Area sekitar kamu

78 responses
● 62% nyaman
● 25% biasa saja
● 13% tidak nyaman
```

Then:

``` text
Yang paling sering dirasakan

1. Ramai
2. Jalan kurang nyaman
3. Kurang penerangan
```

This is more defensible and more visually interesting than an arbitrary
0--100 score.

------------------------------------------------------------------------

# 11. OPTIONAL SCORE

If the team really wants a score for visual/demo purposes, derive it
transparently.

Example:

``` text
Comfort Index
= percentage of "Nyaman"
  + weighted contribution from "Biasa"
  - weighted contribution from "Tidak nyaman"
```

But the UI should prioritize:

``` text
62% nyaman
25% biasa
13% tidak nyaman
```

over:

``` text
Score 74
```

The score can be a secondary visual.

Never present a score as an objective measurement.

------------------------------------------------------------------------

# 12. PERCEPTION DIMENSIONS

There are two viable models.

## Model A --- One overall perception

Fastest:

``` text
Bagaimana rasanya di sini?

🙂 Nyaman
😐 Biasa saja
🙁 Tidak nyaman
```

This is recommended for the first Unseen implementation.

------------------------------------------------------------------------

## Model B --- Perception categories

Optional follow-up:

``` text
Apa yang kamu rasakan?

☐ Kebersihan
☐ Kenyamanan
☐ Keamanan yang dirasakan
☐ Aksesibilitas
☐ Keramaian
☐ Penerangan
☐ Kondisi jalan
```

This allows the map to say:

``` text
Kawasan ini
Mostly uncomfortable because:
- lighting
- road condition
```

Model B is useful once the basic flow is proven.

------------------------------------------------------------------------

# 13. DO NOT FORCE TWO INPUTS

A tempting UI is:

``` text
[ Upload Laporan ]
[ Upload Persepsi ]
```

or:

``` text
□ Saya ingin membuat laporan
□ Saya ingin memberikan persepsi
```

This is acceptable as a discovery UI, but should NOT be the main
conceptual model.

Why?

Because it makes Unseen look like another form.

The stronger experience is:

``` text
MAP
 ↓
See something
 ↓
Choose what you want to contribute
```

For example:

``` text
         Contribute here

   [ LAPORKAN MASALAH ]

   [ BAGIKAN PERSEPSI ]
```

This can appear when a user long-presses/clicks a location.

------------------------------------------------------------------------

# 14. BEST REPORT + PERCEPTION SYNERGY

The most seamless integration is:

When creating a report, after submission:

``` text
Report berhasil dibuat.

Bagaimana pengalamanmu di area ini?

🙂 Nyaman
😐 Biasa saja
🙁 Tidak nyaman

[ Lewati ]
```

This makes perception an **optional follow-up**, not a required field.

This is powerful because the citizen is already geographically anchored
to the location.

But:

**do not automatically create a perception from the report itself.**

A report saying "jalan rusak" does not automatically mean the user feels
unsafe/uncomfortable.

Let the user explicitly provide the perception.

------------------------------------------------------------------------

# 15. SECOND SEAMLESS INTEGRATION

On a report detail page:

``` text
Jalan Rusak di Jl. X

Status: Diproses
Votes: 18

────────────────────

UNSEEN

Bagaimana warga merasakan area ini?

62% nyaman
25% biasa
13% tidak nyaman

[ Bagikan pengalamanmu ]
```

This connects:

**objective-ish report → subjective community experience**

without mixing the two datasets.

------------------------------------------------------------------------

# 16. THIRD SEAMLESS INTEGRATION: MAP MODE

This should be the primary visual differentiator.

### Report mode

``` text
● Jalan rusak
● Sampah
● Banjir
● Fasilitas umum
```

### Unseen mode

``` text
████████████
██████░░░░░░
██░░░░░░░░░░
```

The user switches between:

``` text
[ Laporan ] [ Unseen ]
```

This can become one of the strongest presentation moments.

Demo:

> "Kalau mode laporan menunjukkan apa yang warga laporkan, kita bisa
> switch ke Unseen untuk melihat apa yang warga rasakan."

------------------------------------------------------------------------

# 17. USE CASE 1 --- STREET EXPERIENCE

## Scenario

A citizen walks down a street.

There is no specific report they want to create.

They simply feel:

> "Jalan ini sebenarnya nyaman, tapi terlalu ramai."

They open SigapKota.

``` text
Unseen mode
 ↓
Tap location
 ↓
Bagaimana rasanya?
 ↓
😐 Biasa saja
 ↓
Reason: Ramai
 ↓
Submit
```

Result:

The area accumulates a perception signal.

This captures information that a normal issue-reporting platform would
miss.

------------------------------------------------------------------------

# 18. USE CASE 2 --- REPORT + PERCEPTION

Citizen encounters a damaged road.

They create:

``` text
REPORT
"Jalan berlubang di depan sekolah"
```

After submission:

``` text
Optional:
"Bagaimana pengalamanmu di sini?"
🙁 Tidak nyaman

Reason:
☑ Kondisi jalan
```

Result:

One event now has two distinct dimensions:

``` text
SIGAPKOTA:
There is a road problem.

UNSEEN:
The citizen experienced the place as uncomfortable.
```

This is probably the strongest integrated use case.

------------------------------------------------------------------------

# 19. USE CASE 3 --- AREA WITH NO OFFICIAL REPORT

An area has no reports.

But many citizens provide:

``` text
😐 Biasa
😐 Biasa
🙁 Tidak nyaman
🙁 Tidak nyaman
```

The map shows an Unseen signal.

This creates the concept:

> **"Ada sesuatu yang dirasakan warga, bahkan sebelum menjadi
> laporan."**

This is where Unseen can genuinely add a different dimension.

Important:

The UI must not interpret this automatically as proof of an actual
public problem.

It is a perception signal.

------------------------------------------------------------------------

# 20. USE CASE 4 --- BEFORE/AFTER PERCEPTION

A report starts:

``` text
Jalan rusak
```

Admin eventually marks it:

``` text
Selesai
```

After repair, citizens can submit new perceptions.

Before:

``` text
72% tidak nyaman
```

After:

``` text
81% nyaman
```

This creates a powerful narrative:

``` text
Problem reported
       ↓
Government/action
       ↓
Problem marked solved
       ↓
Citizen perception changes
```

This is a potential future differentiator.

Do not implement causal claims such as "the repair caused the
improvement" unless the methodology supports it.

Phrase it as:

> "Persepsi warga setelah penyelesaian"

not:

> "Proyek ini meningkatkan kenyamanan sebesar 81%."

------------------------------------------------------------------------

# 21. USE CASE 5 --- DISCOVERING "UNSEEN" AREAS

On Unseen mode, the user can see:

``` text
Most comfortable areas
Most uncomfortable areas
Areas with changing perception
```

Only show rankings when there is enough data.

Example:

``` text
UNSEEN THIS WEEK

↑ Most improved
Area A

↓ Most uncomfortable
Area B

● Most responses
Area C
```

This should be optional P2-style analytics.

------------------------------------------------------------------------

# 22. USE CASE 6 --- CATEGORY-SPECIFIC PERCEPTION

If Model B is implemented:

``` text
UNSEEN

What are you experiencing?

[ Comfort ]
[ Cleanliness ]
[ Lighting ]
[ Accessibility ]
[ Traffic ]
```

Then the map can switch:

``` text
Overall
Cleanliness
Lighting
Accessibility
```

This is much more useful than a generic score.

But it should be considered a second phase because it increases data and
UI complexity.

------------------------------------------------------------------------

# 23. USE CASE 7 --- "WHAT SHOULD I REPORT?"

A citizen opens Unseen and sees:

``` text
Area ini memiliki banyak sinyal:

• 41% tidak nyaman
• 67% menyebut kondisi jalan
• 52% menyebut penerangan
```

Then:

``` text
Ada masalah yang perlu dilaporkan?

[ Buat Laporan ]
```

This is a beautiful bridge:

``` text
PERCEPTION
    ↓
signal
    ↓
potential problem
    ↓
REPORT
    ↓
official/community tracking
```

But the system must never automatically convert perception into a
report.

The citizen decides.

------------------------------------------------------------------------

# 24. USE CASE 8 --- REPORT DISCOVERY FROM UNSEEN

A user taps a high-perception-signal area:

``` text
UNSEEN PULSE
"Area ini banyak mendapat respons tidak nyaman"

[ Lihat laporan di sekitar ]
```

Then:

``` text
3 laporan aktif dalam radius 200m

• Jalan rusak
• Lampu jalan
• Sampah
```

This connects the two layers.

It also creates a compelling demo:

``` text
Perception → investigate → reports
```

------------------------------------------------------------------------

# 25. DATA MODEL RECOMMENDATION

Keep Unseen data separate from `reports`.

Recommended minimal table:

``` text
perceptions
- id
- user_id
- latitude
- longitude
- sentiment
- reason nullable
- note nullable
- created_at
```

Where:

``` text
sentiment:
comfortable
neutral
uncomfortable
```

Optional:

``` text
reason:
cleanliness
road_condition
lighting
crowding
accessibility
safety_feeling
other
```

Do not add:

-   complicated scoring tables;
-   road entities;
-   city-district entities;
-   AI-generated perception records;

until there is a concrete need.

------------------------------------------------------------------------

# 26. PERCEPTION ↔ REPORT RELATIONSHIP

A perception may optionally reference a report:

``` text
report_id nullable
```

This creates two valid modes:

### Standalone perception

``` text
perception.report_id = null
```

Meaning:

> "I experienced this place."

### Report-linked perception

``` text
perception.report_id = report.id
```

Meaning:

> "I am sharing my experience in relation to this reported problem."

This is a very clean data model.

It prevents the need for two different submission systems.

------------------------------------------------------------------------

# 27. OPTIONAL USER FLOW

## Flow A --- Standalone

``` text
Map
 ↓
Unseen mode
 ↓
Tap location
 ↓
Share perception
 ↓
Choose feeling
 ↓
Optional reason
 ↓
Submit
```

## Flow B --- From report

``` text
Report detail
 ↓
Share your experience
 ↓
Choose feeling
 ↓
Optional reason
 ↓
Submit
```

## Flow C --- After report creation

``` text
Report submitted
 ↓
Optional perception prompt
 ↓
Choose feeling
 ↓
Submit / Skip
```

All three can use the same backend model.

------------------------------------------------------------------------

# 28. MAP VISUALIZATION

## Initial implementation

Do not show a permanent grid.

Use a soft heat/density layer.

For each perception:

``` text
comfortable → positive signal
neutral → neutral signal
uncomfortable → negative signal
```

The exact visual colors should follow the existing SigapKota design
system.

The important semantic distinction is:

**this layer represents perception density/distribution, not official
problem severity.**

------------------------------------------------------------------------

# 29. MINIMUM SAMPLE SIZE

Never display an authoritative area-level perception based on one
person.

Example:

``` text
1 response
```

should show:

> "1 respons"

rather than:

> "Area ini tidak nyaman."

For an aggregate insight, require a minimum number of responses.

The exact threshold can be configurable.

A simple competition implementation can use a small threshold such as:

``` text
>= 5 responses
```

before displaying a derived area summary.

Below that:

``` text
"Belum cukup respons untuk melihat pola."
```

------------------------------------------------------------------------

# 30. RECENCY

Perception should be time-aware.

A perception from six months ago should not have the same visual weight
as one from yesterday.

The first implementation can simply:

-   filter by recent period;
-   show "last 7 days" / "last 30 days";
-   store `created_at`.

Advanced decay weighting is optional.

------------------------------------------------------------------------

# 31. PRIVACY

Do not expose:

-   individual user identity;
-   exact history of where a particular user went;
-   unnecessary personal information.

The map should aggregate perception signals.

If an individual perception is shown, show only the contribution, not
personal tracking information.

Avoid creating a system that looks like citizen surveillance.

------------------------------------------------------------------------

# 32. ABUSE / QUALITY CONTROL

Perception is easy to spam.

Minimum protections:

-   authenticated users only for submitting perceptions;
-   rate-limit submissions;
-   one perception per user per location/time window if needed;
-   allow users to update/re-submit after a reasonable interval;
-   do not allow unlimited rapid submissions.

Do not build a complex moderation system for the first version.

------------------------------------------------------------------------

# 33. ADMIN RELATIONSHIP

Admin does NOT need to manage every perception individually.

Instead, admin can see aggregate information:

``` text
UNSEEN INSIGHT

Area A
72 responses
64% comfortable
22% neutral
14% uncomfortable

Top reasons:
1. Road condition
2. Lighting
3. Crowding
```

This keeps admin focused on actionable public issues.

------------------------------------------------------------------------

# 34. WHAT NOT TO DO

Do not turn Unseen into:

### A social media feed

No:

-   followers;
-   likes on individual perceptions;
-   comments;
-   profiles;
-   feeds.

### A review platform

No:

``` text
4.7/5 stars
```

for every street.

### A safety prediction engine

No:

``` text
AI predicts this road is dangerous.
```

### A replacement for reports

Unseen should not replace structured reports.

### A complicated GIS system

No need for:

-   road-segment topology;
-   municipal boundary engines;
-   advanced geospatial infrastructure.

------------------------------------------------------------------------

# 35. RECOMMENDED INFORMATION ARCHITECTURE

The public-facing navigation can remain:

``` text
Home
Map
Reports
Create Report
```

Unseen should primarily appear as a **map mode**, not necessarily as a
fifth major navigation item.

For example:

``` text
MAP

[ Laporan ] [ Unseen ]
```

A secondary entry point can be:

``` text
Bagikan Persepsi
```

inside the map.

This keeps Unseen optional and prevents the core product from becoming
confusing.

------------------------------------------------------------------------

# 36. RECOMMENDED UI

## Map header

``` text
Temukan kondisi kotamu

[ Laporan ]  [ Unseen ]
```

When `Laporan`:

``` text
Filter:
[Semua] [Jalan] [Sampah] [Banjir] ...

Markers
```

When `Unseen`:

``` text
Yang dirasakan warga

[7 hari] [30 hari]

Persepsi:
● Nyaman
● Biasa
● Tidak nyaman
```

Then map.

------------------------------------------------------------------------

# 37. LOCATION ACTION

When tapping an empty map area:

``` text
Bagikan pengalaman di sini

Bagaimana rasanya?

🙂 Nyaman
😐 Biasa saja
🙁 Tidak nyaman

[ Lanjutkan ]
```

When tapping a report marker:

``` text
Jalan Rusak
Diproses
18 votes

Bagaimana pengalamanmu di area ini?

[ Bagikan persepsi ]
```

Same interaction language.

------------------------------------------------------------------------

# 38. SCORE DESIGN --- FINAL RECOMMENDATION

If the team asks:

> "Per area atau per jalan?"

Answer:

**Start per point → aggregate to area.**

Not:

**road → fixed score**

Why:

-   works for roads;
-   works for parks;
-   works for intersections;
-   works for public facilities;
-   works for alleys;
-   works anywhere on the map.

Then optionally identify a road/area name through reverse geocoding for
display.

Example:

``` text
Unseen Pulse
Jl. X dan sekitarnya

47 responses

68% nyaman
21% biasa
11% tidak nyaman
```

The geographic unit is the data aggregation, not an assumed road object.

------------------------------------------------------------------------

# 39. OPTIONAL "AREA SCORE"

If a presentation wants one big number:

``` text
UNSEEN PULSE
78
```

Show the underlying data directly underneath:

``` text
78 / 100

68% nyaman
21% biasa
11% tidak nyaman

47 responses · 30 hari terakhir
```

Never hide the methodology.

The number is a visualization, not a scientific measurement.

------------------------------------------------------------------------

# 40. MVP FOR UNSEEN

If only a few hours are available, implement exactly this:

``` text
1. Add "Unseen" map mode.
2. Add perception button.
3. User taps location.
4. Choose:
      🙂 Nyaman
      😐 Biasa
      🙁 Tidak nyaman
5. Save coordinates + sentiment.
6. Show perception density on map.
7. Show aggregate breakdown when an area is selected.
```

That's enough to establish the concept.

No AI required.

No complex scoring required.

No road segmentation required.

No separate application required.

------------------------------------------------------------------------

# 41. P2 EXTENSION

If P0/P1 are stable:

``` text
+ perception reasons
+ time filters
+ report-linked perceptions
+ area pulse card
+ before/after perception comparison
```

------------------------------------------------------------------------

# 42. P3 / FUTURE

Possible future extensions:

-   perception trends;
-   neighborhood comparisons;
-   adaptive sampling;
-   AI-generated summaries;
-   anomaly detection;
-   perception change after issue resolution;
-   richer category-specific perception;
-   privacy-preserving aggregate spatial statistics.

These are not required for the competition MVP.

------------------------------------------------------------------------

# 43. INTEGRATION WITH SIGAPKOTA

Unseen should add only a thin layer.

Current:

``` text
reports
votes
map
admin
```

Add:

``` text
perceptions
```

and optionally:

``` text
report_id nullable
```

The rest remains unchanged.

------------------------------------------------------------------------

# 44. ARCHITECTURE

``` text
                    SIGAPKOTA
                         │
                    ┌────┴────┐
                    │   MAP   │
                    └────┬────┘
                         │
             ┌───────────┴───────────┐
             │                       │
             ▼                       ▼
        REPORT MODE             UNSEEN MODE
             │                       │
             ▼                       ▼
         reports               perceptions
             │                       │
             └───────────┬───────────┘
                         ▼
                  SAME GEOGRAPHY
```

No separate backend.

No separate authentication.

No separate application.

------------------------------------------------------------------------

# 45. DEMO STORY

The ideal demo transition is:

> "SigapKota tidak hanya menunjukkan apa yang dilaporkan warga. Kita
> juga ingin melihat apa yang dirasakan warga."

Then:

``` text
[ LAPORAN ] → [ UNSEEN ]
```

The map changes.

The presenter taps an area:

``` text
47 responses

68% nyaman
21% biasa
11% tidak nyaman

Top signals:
• road condition
• lighting
```

Then:

> "Dan ketika persepsi ini menunjukkan sesuatu yang perlu diperhatikan,
> warga tetap bisa kembali ke laporan formal."

``` text
[ Lihat laporan di sekitar ]
```

This establishes a clean relationship:

**Perception → Discovery → Report → Action → Perception**

------------------------------------------------------------------------

# 46. FINAL PRODUCT LOOP

The long-term product loop is:

``` text
          ┌─────────────────────┐
          │      UNSEEN         │
          │  Citizen perception │
          └──────────┬──────────┘
                     │
                     ▼
              Identify signal
                     │
                     ▼
          ┌─────────────────────┐
          │     SIGAPKOTA       │
          │ Structured report   │
          └──────────┬──────────┘
                     │
                     ▼
              Community vote
                     │
                     ▼
             Admin handling
                     │
                     ▼
              Status selesai
                     │
                     ▼
          ┌─────────────────────┐
          │      UNSEEN         │
          │ Post-resolution     │
          │ perception          │
          └─────────────────────┘
```

This loop is the conceptual reason Unseen belongs inside SigapKota.

------------------------------------------------------------------------

# 47. FINAL RECOMMENDATION

For the current 5-day competition:

## Core SigapKota

**P0** - report - map - auth - vote - status - admin

**P1** - heatmap - duplicate detection

## Unseen

Treat it as an **optional P2 layer**, unless the team has enough time to
implement the very small MVP without jeopardizing P0/P1.

The smallest useful version is:

``` text
Map
 ↓
[ Unseen ]
 ↓
Tap location
 ↓
🙂 😐 🙁
 ↓
Save perception
 ↓
Perception map
```

Do not build the full score/road-segment/category system first.

The strongest conceptual positioning is:

> **SigapKota maps what citizens report.\
> Unseen maps what citizens experience.**

Both live on the same map, use the same geographic context, and can be
connected without making Unseen a mandatory part of reporting.
