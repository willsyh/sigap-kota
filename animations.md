# SigapKota — Animation Execution Plan

**Philosophy:** Compose > composited properties only (`transform`, `opacity`). GPU-safe.
No layout thrashing (no `width`/`height`/`top` animation). Respects `prefers-reduced-motion`.
All new keyframes go in `globals.css` inside the existing `@media (prefers-reduced-motion: no-preference)` block.

---

## Existing Animation System (Do Not Break)

| Asset | Where | Status |
|---|---|---|
| `anim-fade-up` (300ms, cubic-bezier 0 0 0.2 1) | `globals.css` | Keep |
| `anim-fade-in` (200ms, ease-out) | `globals.css` | Keep |
| `anim-scale-in` (150ms, ease-out) | `globals.css` | Keep |
| `anim-delay-1..6` (60ms–360ms) | `globals.css` | Keep |
| `bottom-nav-active-rise` (240ms, cubic-bezier 0.2 0.8 0.2 1) | `globals.css` | Keep |
| Dialog/Select/Dropdown `data-open/data-closed` (100ms, tw-animate-css) | component CSS | Keep |
| Leaflet `flyTo({ animate: true })` | `MapComponent.tsx` | Keep |
| `animate-spin` (Tailwind, Loader2) | everywhere | Keep |
| `animate-pulse` (Tailwind, Skeleton) | everywhere | Keep |

---

## New Keyframes to Add (`globals.css`)

All inside the existing `@media (prefers-reduced-motion: no-preference)` block.

### 1. `anim-slide-down`
For: connectivity banner, dropdown panels entering from top.
```css
@keyframes anim-slide-down {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.anim-slide-down {
  animation: anim-slide-down 200ms cubic-bezier(0, 0, 0.2, 1) both;
}
```

### 2. `anim-slide-up-out`
For: panels/banners that exit upward (paired with slide-down).
```css
@keyframes anim-slide-up-out {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-6px); }
}
.anim-slide-up-out {
  animation: anim-slide-up-out 150ms ease-in both;
}
```

### 3. `anim-pop`
For: selected map marker size jump, vote button confirm tap.
Short snappy scale pop — not a bounce, just a clean pop.
```css
@keyframes anim-pop {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.12); }
  100% { transform: scale(1); }
}
.anim-pop {
  animation: anim-pop 200ms cubic-bezier(0.34, 1.4, 0.64, 1) both;
}
```

### 4. `anim-check-in`
For: success checkmark icon appearing after form submit / vote confirm.
```css
@keyframes anim-check-in {
  from { opacity: 0; transform: scale(0.6) rotate(-8deg); }
  to   { opacity: 1; transform: scale(1) rotate(0deg); }
}
.anim-check-in {
  animation: anim-check-in 220ms cubic-bezier(0.34, 1.3, 0.64, 1) both;
}
```

### 5. `anim-shimmer` (loading bar variant)
For: before/after slider handle pulse when draggable (hint on mount).
```css
@keyframes anim-shimmer {
  0%, 100% { opacity: 0.6; }
  50%       { opacity: 1; }
}
.anim-shimmer {
  animation: anim-shimmer 1.2s ease-in-out 2;
}
```

### 6. `anim-bar-grow`
For: stat bars and perception percentage bars growing on mount.
```css
@keyframes anim-bar-grow {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
/* Applied on the bar fill element with transform-origin: left */
.anim-bar-grow {
  animation: anim-bar-grow 400ms cubic-bezier(0, 0, 0.2, 1) both;
  transform-origin: left;
}
```

---

## Element-by-Element Execution

### `globals.css`

| Change | Detail |
|---|---|
| Add 6 new keyframes above | Inside existing `no-preference` block |
| Leaflet marker selected state | Add `.custom-leaflet-marker--selected { filter: drop-shadow(0 4px 8px rgb(0 83 91 / 0.35)); transition: filter 150ms ease; }` |

---

### `app/page.tsx` — Home / Map

| Element | Current | Change |
|---|---|---|
| Error overlay (`:273`) | `anim-fade-in` | Already good |
| Empty-state card (`:304`) | `anim-fade-up` | Already good |
| Intro aside card (`:326`) | `anim-fade-up` | Already good |
| Stats `dl` (`:349`) | `anim-fade-up anim-delay-1` | Already good |
| Before/After link card (`:373`) | `hover:-translate-y-0.5 hover:shadow-md` | Already good |
| CTA "Lapor Masalah" (`:406`) | `anim-fade-up anim-delay-3` | Already good |
| "Tentang SigapKota" reopen (`:416`) | `active:scale-[0.97]` | Already good |
| FAB "Buat Laporan" (`:484`) | `active:scale-[0.94]` | Already good |
| Selected report preview card (`:490`) | `anim-fade-up` | Already good |
| **Dismiss intro "X" (`:334`)** | `transition-colors` only | Add `active:scale-[0.95]` |
| **Close preview "X" (`:538`)** | `transition-colors` only | Add `active:scale-[0.95]` |

---

### `components/Navbar.tsx`

| Element | Current | Change |
|---|---|---|
| Desktop nav items (`:122`) | `active:scale-[0.97]` | Already good |
| "Lapor Masalah" button (`:142`) | `active:scale-[0.97]` | Already good |
| Logout Loader2 (`:150`) | `animate-spin` | Already good |
| Heatmap toggle mobile (`:182`) | `active:scale-[0.95]` | Already good |
| **Panduan icon link (`:91`)** | `active:scale-[0.95]` | Already good |

---

### `components/BottomNav.tsx`

| Element | Current | Change |
|---|---|---|
| Active icon rise (`:179`) | `bottom-nav-active-rise` 240ms | Already good |
| Account Dialog (`:197`) | `data-open:animate-in zoom-in-95` | Already good |
| **Notification dot (`:187`)** | Static badge | Add `anim-pop` class when dot first mounts (key on count change) |

---

### `components/MapView/HomeMapControls.tsx`

| Element | Current | Change |
|---|---|---|
| Search results dropdown (`:96`) | `anim-scale-in` | Change to `anim-slide-down` — directionally correct (drops below input) |
| Filter active dot badge (`:157`) | Static mount | Add `anim-pop` on conditional mount |
| Admin filter panel (`:249`) | `anim-scale-in` | Change to `anim-slide-down` |
| **Clear search "X" (`:86`)** | `transition-colors` | Add `active:scale-[0.95]` |
| Toggle buttons (`:162`, `:177`, `:194`, `:226`) | `active:scale-[0.97]` | Already good |

---

### `components/MapView/MapLegend.tsx`

| Element | Current | Change |
|---|---|---|
| Legend chip ↔ card crossfade (`:33`, `:49`) | `scale-95 opacity-0` CSS toggle, `transition-all 200ms` | Already good — smooth |
| Close legend button (`:60`) | `active:scale-[0.95]` | Already good |

---

### `components/MapView/MapComponent.tsx`

| Element | Current | Change |
|---|---|---|
| Leaflet `flyTo` (`:140`, `:272`) | `animate: true` | Already good |
| Custom pin selected size change (`:343`) | JS size swap (34→42px) | Replace size swap with CSS class `.custom-leaflet-marker--selected` adding `filter: drop-shadow` (GPU only; no translate interference). Keep size change as-is since it's a DivIcon recreation. |

---

### `components/ReportCard.tsx`

| Element | Current | Change |
|---|---|---|
| Card hover lift (`:26`) | `hover:-translate-y-0.5 hover:shadow-md 200ms` | Already good |
| Photo scale (`:30`) | `group-hover:scale-[1.03] 200ms` | Already good |
| Status pill (`:42`) | Static | Already good — no animation needed |

---

### `components/reports/ReportForm.tsx`

| Element | Current | Change |
|---|---|---|
| Auth gate card (`:397`) | `anim-fade-up` | Already good |
| Success state card (`:433`) | `anim-fade-up` | Already good |
| Duplicate banner (`:472`) | `anim-fade-in` | Change to `anim-slide-down` (enters from top) |
| Duplicate candidates card (`:479`) | `anim-fade-up` | Already good |
| Vote "Dukung" button loading (`:512`) | `animate-spin` Loader2 | Already good |
| Photo dropzone hover (`:563`) | `transition-colors` | Already good |
| Category buttons (`:594`) | `active:scale-[0.98]` | Already good |
| **Category active checkmark (`:601`)** | Conditional mount, no anim | Add `anim-check-in` on mount |
| Location detecting overlay (`:676`) | `animate-spin` | Already good |
| Submit button (`:706`) | `animate-spin` when loading | Already good |
| **Section step indicator circle (`:374`)** | `transition-colors` | Already good |
| **Success checkmark icon (`:433` area)** | `anim-scale-in` | Replace with `anim-check-in` (more character) |

---

### `components/reports/ConnectivityBanner.tsx`

| Element | Current | Change |
|---|---|---|
| **Offline banner (`:23`)** | No animation | Add `anim-slide-down` on mount |

---

### `components/perceptions/PerceptionDialog.tsx`

| Element | Current | Change |
|---|---|---|
| Dialog open/close | `data-open:animate-in zoom-in-95` | Already good |
| Sentiment buttons (`:150`) | `transition-colors` | Add `active:scale-[0.97]` |
| Reason chip buttons (`:211`) | `transition-colors` | Add `active:scale-[0.97]` |
| "Kirim" button loading (`:251`) | `animate-spin` | Already good |
| **"Tambah alasan" toggle (`:186`)** | Instant show/hide | Wrap revealed section in `anim-fade-in` on show |

---

### `components/perceptions/PerceptionPulseCard.tsx`

| Element | Current | Change |
|---|---|---|
| Percentage bar width (`:116`) | `transition-all duration-300` | Change to `transition-[width] duration-500 ease-out` — explicit property is cheaper |
| **Bar on initial mount** | No entrance | Add `anim-bar-grow` on first render (via `key` or ref flag) |

---

### `components/auth/AuthForm.tsx`

| Element | Current | Change |
|---|---|---|
| Card mount (`:94`) | `anim-fade-up` | Already good |
| Error/info message (`:152`, `:153`) | `anim-fade-in` | Change to `anim-slide-down` |
| Submit success CheckCircle2 (`:155`) | `anim-scale-in` | Replace with `anim-check-in` |
| Password toggle (`:139`) | `transition-colors` | Add `active:scale-[0.95]` |

---

### `app/laporan/page.tsx` — Report List

| Element | Current | Change |
|---|---|---|
| Stats strip (`:108`) | `anim-fade-in` | Already good |
| Filter chip buttons (`:140`) | `active:scale-[0.97]` | Already good |
| Advanced filter panel (`:163`) | `anim-scale-in` | Change to `anim-slide-down` |
| Report card stagger (`:207`) | `anim-fade-up anim-delay-1..6` | Already good |
| **"Filter lanjutan" toggle dot** | No animation | If adding a dot indicator, use `anim-pop` |

---

### `app/laporan/[id]/page.tsx` — Report Detail

| Element | Current | Change |
|---|---|---|
| Back/share button (`:73`, `:78`) | `active:scale-[0.95]` | Already good |
| "Dilaporkan" banner (`:278`) | `anim-fade-in` | Change to `anim-slide-down` |
| "Menunggu Konfirmasi" banner (`:288`) | `anim-fade-up` | Already good |
| Before/After slider (`:319`) | JS `clipPath` — instant | Add `anim-shimmer` pulse on slider handle on first mount (2 pulses, then stops) — hints it's draggable |
| Status step circles (`:365`) | `transition-colors`, `ring-4` | Already good |
| **Vote button on success** | `animate-spin` → resolves | After vote resolves, trigger `anim-pop` on the vote count number span (key change) |
| Perception bars (`:436`) | `transition-all` no duration | Set explicit `transition: width 500ms cubic-bezier(0,0,0.2,1)` |
| Delete Dialog (`:511`) | `data-open:animate-in` | Already good |
| Activity log latest dot (`:479`) | `ring-2 ring-primary/10` | Add `anim-pop` on mount of latest dot |

---

### `app/admin/page.tsx` — Admin Panel

| Element | Current | Change |
|---|---|---|
| Stat cards stagger (`:441`) | `anim-fade-up anim-delay-1..4` | Already good |
| Sentiment bars (`:592`) | `transition-all duration-300` | Change to `transition-[width] duration-500 ease-out` + `anim-bar-grow` on mount |
| Admin filter panel (`:642`) | `anim-scale-in` | Change to `anim-slide-down` |
| Table row hover (`:675`) | `transition-colors 150ms` | Already good |
| Delete/replace icon buttons (`:744`, `:754`) | `active:scale-[0.95]` | Already good |
| Photo upload Dialog (`:834`) | `data-open:animate-in` | Already good |
| Dropzone hover (`:862`) | `transition-colors` | Already good |

---

### `app/panduan/page.tsx` — Guide

| Element | Current | Change |
|---|---|---|
| FAQ ChevronDown rotate (`:187`) | `transition-transform group-open:rotate-180` | Already good |
| **`<details>` content reveal** | Native browser (instant) | Wrap inner content in `anim-fade-in` triggered by JS `toggle` event, or use CSS `@starting-style` if browser support is sufficient (Chrome 117+, not Safari 17.4+). Use JS approach for safety. |

---

## Summary of Actual Code Changes Required

Grouped by file, ordered by effort:

### `globals.css` (1 file, additive only)
- Add `anim-slide-down` keyframe + class
- Add `anim-slide-up-out` keyframe + class
- Add `anim-pop` keyframe + class
- Add `anim-check-in` keyframe + class
- Add `anim-shimmer` keyframe + class
- Add `anim-bar-grow` keyframe + class
- Add `.custom-leaflet-marker--selected` with `filter: drop-shadow`

### Class swaps (replace `anim-scale-in` → `anim-slide-down` where panel drops down)
- `HomeMapControls.tsx`: search results dropdown, admin filter panel
- `app/laporan/page.tsx`: advanced filter panel
- `app/admin/page.tsx`: admin filter panel

### Class swaps (replace `anim-fade-in` → `anim-slide-down` for banners from top)
- `ReportForm.tsx`: duplicate checking banner
- `AuthForm.tsx`: error/info messages
- `laporan/[id]/page.tsx`: "Dilaporkan" queue banner
- `ConnectivityBanner.tsx`: offline banner

### Class swaps (`anim-scale-in` → `anim-check-in` for success icons)
- `AuthForm.tsx`: CheckCircle2 on submit success
- `ReportForm.tsx`: success checkmark

### New class additions (additive, no replacement)
- `ReportForm.tsx` category checkmark: add `anim-check-in`
- `BottomNav.tsx` notification dot: add `anim-pop` on mount
- `HomeMapControls.tsx` filter dot: add `anim-pop`
- `laporan/[id]/page.tsx` vote count span: add `anim-pop` via key change on vote
- `laporan/[id]/page.tsx` latest activity dot: add `anim-pop`
- `PerceptionDialog.tsx`: add `active:scale-[0.97]` on sentiment + reason buttons
- `PerceptionDialog.tsx`: add `anim-fade-in` on "Tambah alasan" revealed section
- `app/page.tsx` dismiss/close X buttons: add `active:scale-[0.95]`
- `AuthForm.tsx` password toggle: add `active:scale-[0.95]`

### Before/After slider hint
- `laporan/[id]/page.tsx`: add `anim-shimmer` to slider handle div on first mount

### Bar animations
- `PerceptionPulseCard.tsx`: add `anim-bar-grow` on mount + fix `transition-[width]`
- `laporan/[id]/page.tsx` perception bars: fix `transition: width 500ms ease-out`
- `app/admin/page.tsx` sentiment bars: `anim-bar-grow` on mount + fix `transition-[width]`

### FAQ accordion
- `app/panduan/page.tsx`: add JS `toggle` listener → add/remove `anim-fade-in` on inner content

---

## Timing Reference

| Duration | Use case |
|---|---|
| 100ms | Dialog open/close (tw-animate-css default) |
| 150ms | Scale-in panels, icon active states |
| 200ms | Fade-in, slide-down banners, pop/check-in |
| 240ms | Bottom nav active rise |
| 300ms | Fade-up card mounts |
| 400–500ms | Bar grows, perception width transitions |

Easing reference:
- `cubic-bezier(0,0,0.2,1)` — decelerate (things entering, bars growing)
- `cubic-bezier(0.34,1.3,0.64,1)` — slight overshoot (pop, check-in)
- `ease-in` — accelerate (things exiting)
- `ease-out` — generic enters

---

## What to Skip

- Leaflet tile loading: browser-managed, not touchable
- Map cursor crosshair change: already a CSS cursor, no animation needed
- Status pill badge: static semantic color — animation would be distracting
- Table rows beyond hover: row enter animation on admin table would be noisy
- Before/After `clipPath` slider itself: already smooth via rAF, no change needed
