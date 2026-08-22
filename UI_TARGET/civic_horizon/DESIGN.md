---
name: Civic Horizon
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf1'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fa'
  on-surface: '#111c2c'
  on-surface-variant: '#3e494a'
  inverse-surface: '#263142'
  inverse-on-surface: '#ebf1ff'
  outline: '#6f797a'
  outline-variant: '#bec8ca'
  surface-tint: '#006972'
  primary: '#00535b'
  on-primary: '#ffffff'
  primary-container: '#006d77'
  on-primary-container: '#9becf7'
  inverse-primary: '#82d3de'
  secondary: '#8e4e14'
  on-secondary: '#ffffff'
  secondary-container: '#ffab69'
  on-secondary-container: '#783d01'
  tertiary: '#01544f'
  on-tertiary: '#ffffff'
  tertiary-container: '#286d67'
  on-tertiary-container: '#a9ece4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9ff0fb'
  primary-fixed-dim: '#82d3de'
  on-primary-fixed: '#001f23'
  on-primary-fixed-variant: '#004f56'
  secondary-fixed: '#ffdcc4'
  secondary-fixed-dim: '#ffb780'
  on-secondary-fixed: '#2f1400'
  on-secondary-fixed-variant: '#6f3800'
  tertiary-fixed: '#acefe7'
  tertiary-fixed-dim: '#90d3cb'
  on-tertiary-fixed: '#00201e'
  on-tertiary-fixed-variant: '#00504b'
  background: '#f9f9ff'
  on-background: '#111c2c'
  surface-variant: '#d8e3fa'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  container-padding-mobile: 16px
  container-padding-desktop: 32px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
  section-gap: 40px
---

## Brand & Style

The design system is built on the philosophy of **Modern Civic Utility**. It moves away from traditional, bureaucratic aesthetics toward a "Calm Urgency"—a style that feels authoritative and official yet fast, responsive, and human-centric.

The visual direction follows a **Modern Corporate** approach with **Minimalist** influences. It prioritizes clarity and rapid information processing through heavy whitespace, high-contrast typography, and a structured layout that feels reliable under pressure. The UI avoids unnecessary decorative elements to focus entirely on the task of reporting and tracking, ensuring the interface never feels overwhelming for citizens.

## Colors

This color palette is designed to balance authority with approachability. 

- **Primary Teal (#006D77):** Used for headers, primary actions, and branding elements to evoke trust and stability.
- **Secondary Amber (#F4A261):** Reserved for "urgent" interaction points, such as the "Report Issue" button and status indicators that require citizen attention.
- **Surface & Backgrounds:** Use a very light cool-gray background (#F7FAFC) to differentiate card elements from the page substrate.
- **Status Semantic Palette:** 
    - **Reported:** Neutral Gray, indicating a pending state.
    - **In Progress:** Warm Amber, indicating active movement.
    - **Resolved:** Deep Green, providing a sense of completion and success.

## Typography

The system utilizes **Hanken Grotesk** for headlines to provide a sharp, contemporary "tech-forward" feel that distinguishes it from standard government portals. **Inter** is used for all functional text, chosen for its exceptional legibility on mobile screens and neutral, professional tone.

- **Hierarchy:** Use `headline-lg` for page titles and `headline-md` for card titles.
- **Readability:** Maintain a minimum 1.5x line-height for body text to ensure ease of reading during outdoor use.
- **Labels:** Use `label-bold` with slight letter spacing for status badges and categories to ensure they are glanceable.

## Layout & Spacing

This design system uses a **Fluid Grid** model optimized for mobile-first interaction. 

- **Mobile (0-599px):** 4-column grid with 16px side margins and 16px gutters. Elements like cards typically span the full 4 columns.
- **Tablet (600-1023px):** 8-column grid with 24px margins. Cards may sit in a 2-up layout.
- **Desktop (1024px+):** 12-column grid. Maximum content width is capped at 1200px to prevent excessive line lengths.

The spacing rhythm is based on a **4px baseline**, with `16px (stack-md)` being the standard unit for component internals and `24px (stack-lg)` for vertical separation between distinct information blocks.

## Elevation & Depth

To maintain a modern, clean look, the design system employs **Tonal Layers** combined with **Ambient Shadows**.

1.  **Level 0 (Background):** Solid `#F7FAFC`. No shadow.
2.  **Level 1 (Cards/Inputs):** Solid `#FFFFFF`. Very soft, diffused shadow: `0px 2px 12px rgba(0, 109, 119, 0.05)`.
3.  **Level 2 (Floating Action Buttons/Bottom Nav):** Solid `#FFFFFF`. High-contrast shadow to indicate touch priority: `0px 4px 20px rgba(0, 0, 0, 0.08)`.

Avoid heavy borders; use subtle 1px strokes in a light neutral gray only when elements need extra definition against a white background.

## Shapes

The shape language is consistently **Rounded (0.5rem / 8px)**. This radius is applied to cards, input fields, and standard buttons to create a friendly, modern approachable feel.

- **Special Case (Buttons):** Primary CTA buttons may use `rounded-xl` (1.5rem) to feel more like "touchable" capsules.
- **Status Badges:** Use a fully pill-shaped (rounded-full) radius to distinguish them from interactive buttons.
- **Map Markers:** Use a teardrop shape with the roundedness of the top circle matching the system's 8px logic.

## Components

### Buttons
- **Primary:** High-contrast Teal background with White text. Minimum height of 48px for mobile tap targets.
- **Secondary (Action):** Amber background for high-priority reporting actions.
- **Ghost:** Transparent background with Primary Teal border and text.

### Bottom Navigation
- Fixed at the bottom of the viewport.
- 5 slots: Home, Map, Report (Central Amber Icon), Activity, Profile.
- Use active state tinting (Primary Teal) for the selected icon.

### Cards
- White background with Level 1 elevation.
- Top section: 16:9 aspect ratio image thumbnail.
- Middle section: Category tag (Label-bold) and Headline-md title.
- Footer: Status badge (pill-shaped) on the left, "time ago" stamp on the right.

### Input Fields
- 1px border (#E2E8F0) with 8px corner radius.
- Labels are positioned above the field using `label-md`.
- Active state: 2px border using Primary Teal.

### Map Markers
- Color-coded by status (Gray, Amber, Green).
- Include a white inner icon representing the category (e.g., a hole for "pothole", a light for "streetlamp").

### Chips / Category Tags
- Small, low-contrast background using Tertiary Teal (#83C5BE) at 15% opacity with dark teal text.