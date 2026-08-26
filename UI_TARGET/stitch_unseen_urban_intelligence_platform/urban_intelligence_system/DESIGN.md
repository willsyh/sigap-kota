---
name: Urban Intelligence System
colors:
  surface: '#131314'
  surface-dim: '#131314'
  surface-bright: '#3a393a'
  surface-container-lowest: '#0e0e0f'
  surface-container-low: '#1c1b1c'
  surface-container: '#201f20'
  surface-container-high: '#2a2a2b'
  surface-container-highest: '#353436'
  on-surface: '#e5e2e3'
  on-surface-variant: '#bac9cc'
  inverse-surface: '#e5e2e3'
  inverse-on-surface: '#313031'
  outline: '#849396'
  outline-variant: '#3b494c'
  surface-tint: '#00daf3'
  primary: '#c3f5ff'
  on-primary: '#00363d'
  primary-container: '#00e5ff'
  on-primary-container: '#00626e'
  inverse-primary: '#006875'
  secondary: '#b0c6ff'
  on-secondary: '#002d6e'
  secondary-container: '#0068ed'
  on-secondary-container: '#f2f3ff'
  tertiary: '#ffe9cd'
  on-tertiary: '#432c00'
  tertiary-container: '#ffc769'
  on-tertiary-container: '#775200'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#9cf0ff'
  primary-fixed-dim: '#00daf3'
  on-primary-fixed: '#001f24'
  on-primary-fixed-variant: '#004f58'
  secondary-fixed: '#d9e2ff'
  secondary-fixed-dim: '#b0c6ff'
  on-secondary-fixed: '#001945'
  on-secondary-fixed-variant: '#00429b'
  tertiary-fixed: '#ffdeac'
  tertiary-fixed-dim: '#ffba38'
  on-tertiary-fixed: '#281900'
  on-tertiary-fixed-variant: '#604100'
  background: '#131314'
  on-background: '#e5e2e3'
  surface-variant: '#353436'
typography:
  display-xl:
    fontFamily: inter
    fontSize: 72px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: jetbrainsMono
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: jetbrainsMono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  data-label:
    fontFamily: jetbrainsMono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.1em
  code-sm:
    fontFamily: jetbrainsMono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 0.25rem
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 2.5rem
  2xl: 4rem
  gutter: 1.5rem
  margin-mobile: 1rem
  margin-desktop: 3rem
---

## Brand & Style

The design system is engineered for high-stakes urban navigation and spatial analysis. It targets elite analysts and city planners who require immediate clarity within complex datasets. The personality is **Cinematic Minimalism**—an aesthetic that balances the gravitas of a premium editorial publication with the precision of a high-end technical interface.

The visual direction leans into **Technical Brutalism refined by Glassmorphism**. It avoids traditional "dashboard" tropes like heavy containers and boxed layouts. Instead, it utilizes atmospheric depth, microscopic detail, and purposeful luminescence to guide the eye. Every interaction should feel like a high-fidelity data projection rather than a flat web application.

- **Atmospheric Depth:** Layers are defined by varying degrees of transparency and backdrop blurs rather than solid fills.
- **Precision Utility:** Every element serves a functional purpose; decorative fluff is eliminated in favor of data-driven elegance.
- **Technical Credibility:** The use of monospaced typefaces for secondary data ensures the interface feels like a sophisticated instrument.

## Colors

The palette is rooted in a "Void" base—deep charcoal and near-black surfaces that allow data to appear as light-emitting sources. 

- **Primary (Neutral Data):** Soft Cyan (#00E5FF) is the core signal color. It represents the standard state of information and active UI elements.
- **Secondary (Environment):** Cool Deep Blue (#2979FF) is reserved for environmental context, map underlays, and historical data trails.
- **Tertiary (Attention):** Warm Amber (#FFB300) signifies warnings or system-critical notifications that require monitoring but not immediate action.
- **Danger (Risk):** Subtle Red (#FF3D00) is used sparingly for critical failures or high-risk urban events.
- **Surface Strategy:** Backgrounds are absolute (#050505), while floating elements use a semi-transparent layer (#0A0A0B at 70% opacity) with a background blur (20px-40px).

## Typography

This design system employs a dual-font strategy to differentiate between **Editorial Narrative** and **Technical Reality**.

- **Inter (Headlines):** Used for large-scale displays, page titles, and primary headers. It provides a clean, geometric structure that feels modern and authoritative. Tighten letter spacing on larger sizes to maintain the "editorial" density.
- **JetBrains Mono (Body/Data):** Used for all data points, body copy, labels, and interaction points. The monospaced nature emphasizes the technical precision of the platform and ensures numerical data is perfectly aligned for rapid scanning.

All labels should be rendered in uppercase with slight tracking to enhance legibility at small sizes. Use `body-lg` sparingly for high-level summaries.

## Layout & Spacing

The layout philosophy follows a **Fluid Spatial Grid**. Content is treated as a series of floating modules that exist within an infinite urban canvas.

- **Grid Model:** A 12-column system is used for top-level navigation and data panels. However, the internal content of modules should use the 4px base unit to create "micro-layouts."
- **Rhythm:** Use large `xl` and `2xl` spacing for primary sections to maintain an "airy," premium feel. Use `xs` and `sm` for dense data clusters within technical panels.
- **Safe Areas:** On desktop, maintain a 3rem margin to simulate a "letterboxed" cinematic view. On mobile, reflow content into a single-column stack with 1rem margins, prioritizing critical data widgets.

## Elevation & Depth

Depth is conveyed through **Light and Transparency** rather than traditional drop shadows.

- **Tonal Layering:** The primary background is #050505. Secondary floating panels use a semi-transparent #0A0A0B with a heavy (32px) backdrop blur.
- **Atmospheric Glow:** Interactive elements like active markers or buttons use a "luminous" shadow—a low-spread, low-opacity glow using the primary accent color (#00E5FF).
- **Glass Outlines:** Panels are defined by a 1px "ghost border." Use a white stroke at 8% opacity for top/left edges and 4% for bottom/right to simulate a subtle light source from above.
- **Z-Index Strategy:** Map data stays at z-0. Contextual panels at z-10. Overlays and dialogs at z-20. Tooltips and cursor-follows at z-30.

## Shapes

The shape language is **Soft-Technical**. We avoid perfectly circular edges to maintain a serious, architectural tone. 

- **Base Radius:** 0.25rem (4px) for all input fields, buttons, and small widgets.
- **Panel Radius:** 0.5rem (8px) for large floating containers.
- **Iconography:** Use sharp or minimally rounded 24px icons with a 1.5px stroke weight to match the precision of the monospaced font.
- **Selection States:** Use sharp corners or a single-pixel notch for selection indicators to provide a distinct "high-tech" feel compared to the softer UI containers.

## Components

### Buttons
Primary buttons use a solid #00E5FF fill with black text, leveraging a subtle glow on hover. Secondary buttons are "Ghost" style: 1px Cyan border with transparent background and Cyan text.

### Input Fields
Inputs are transparent with a 1px border. On focus, the border glows #00E5FF and the background becomes slightly more opaque. Labels are always `data-label` (monospace, uppercase, tracking).

### Chips & Tags
Used for status and filtering. They should be small, with a 1px border and low-opacity background fill corresponding to their state (Cyan for active, Amber for caution). No icons inside chips unless indicating a removable state.

### Technical Lists
Data lists should have no visible dividers. Use alternating background opacities (2% vs 4%) for row differentiation. Text should be aligned using the `jetbrainsMono` font to ensure numerical columns are perfectly vertical.

### Data Cards
Cards are not boxes. They are "Spatial Clusters." Avoid solid backgrounds. Use a fine 1px border on the left side to anchor the content visually, then let the content float against the blurred backdrop.

### Sophisticated Transitions
All state changes must use a `200ms ease-out` transition. Data-loading states should use a "scanning" animation (a vertical light bar moving across the container) rather than a circular spinner.